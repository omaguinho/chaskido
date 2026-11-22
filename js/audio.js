// Música tradicional + sistema de instrumentos independientes.

const Music = (function () {
  let audioCtx = null;
  const stemBuffers = {};
  let activeSources = {};
  let stemGains = {};

  let current = null;
  let muted = false;
  let unlocked = false;
  let volume = 0.6;
  let near = 1;
  let rate = 1;
  let error = '';
  let errorUntil = 0;
  let paused = false;

  let stemNames = []; 
  let collected = {};
  let stemDistances = {};
  const stemBaseVolumes = {}; 

  let stemMode = 'off';
  let stemLevel = null;

  function setError(text) {
    error = text;
    errorUntil = text ? performance.now() + CONFIG.MUSIC.ERROR_SHOW * 1000 : 0;
  }

  // --- PISTAS (WEB AUDIO) ---
  // Cada pista se decodifica y suena con un loop exacto: vuelve al comienzo justo al
  // terminar su último compás (sin el silencio que traen los archivos al final).
  let musicGain = null;      // volumen general de la pista
  let src = null;            // la pista que suena
  let loading = false;
  let retries = 0;
  const trackCache = {};     // archivo -> { buf, pts } (solo las 3 últimas, por memoria)
  let trackOrder = [];

  function musicOut() {
    initCtx();
    if (!musicGain) {
      musicGain = audioCtx.createGain();
      musicGain.gain.value = muted ? 0 : volume * near;
      musicGain.connect(audioCtx.destination);
    }
    return musicGain;
  }

  function applyGain() {
    if (musicGain) musicGain.gain.setTargetAtTime(muted ? 0 : volume * near, audioCtx.currentTime, 0.05);
  }

  function trackRate(name) {
    return rate * Math.pow(2, ((CONFIG.MUSIC.TRACK_PITCH || {})[name] || 0) / 12);
  }

  function setRate(r) {
    rate = r || 1;
    if (src && current) src.playbackRate.setValueAtTime(trackRate(current), audioCtx.currentTime);
  }

  // Pulso de la pista (CONFIG.MUSIC.LOOPS): el primero cuyo nombre esté en el archivo
  function loopInfo(file) {
    const L = CONFIG.MUSIC.LOOPS || {};
    const key = Object.keys(L).find(function (k) { return file.indexOf(k) >= 0; });
    return key ? L[key] : null;
  }

  // Dónde parte y dónde da la vuelta un archivo:
  //   · parte en el primer sonido (si está en los primeros 0,15 s: el relleno del archivo)
  //   · con BPM y compases: vuelve tras el número entero de bloques que más se acerca
  //     a lo que dura la música (así no cuenta la cola de silencio o de eco)
  //   · sin datos: vuelve donde termina el último sonido
  function loopPoints(buf, file) {
    const d = buf.getChannelData(0), sr = buf.sampleRate, TH = 0.003;
    let i0 = 0;
    while (i0 < d.length && Math.abs(d[i0]) < TH) i0++;
    let i1 = d.length - 1;
    while (i1 > i0 && Math.abs(d[i1]) < TH) i1--;
    const start = i0 / sr <= 0.15 ? i0 / sr : 0;
    const content = i1 / sr - start;
    let end = Math.min(buf.duration, i1 / sr + 0.02);
    const L = loopInfo(file);
    if (L && content > 0) {
      const block = L.bars * (L.beats || 4) * 60 / L.bpm;
      let n = Math.max(1, Math.round(content / block));
      while (n > 1 && start + n * block > buf.duration) n--;
      end = Math.min(buf.duration, start + n * block);
    }
    return { start: start, end: Math.max(start + 0.5, end) };
  }

  function loadTrack(file) {
    if (trackCache[file]) return Promise.resolve(trackCache[file]);
    return fetchDecode(file).then(function (buf) {
      if (!buf) return null;
      trackCache[file] = { buf: buf, pts: loopPoints(buf, file) };
      trackOrder = trackOrder.filter(function (f) { return f !== file; }).concat([file]);
      while (trackOrder.length > 3) delete trackCache[trackOrder.shift()];
      return trackCache[file];
    });
  }

  function startTrack(name, entry) {
    const s = audioCtx.createBufferSource();
    s.buffer = entry.buf;
    s.loop = true;
    s.loopStart = entry.pts.start;
    s.loopEnd = entry.pts.end;
    s.playbackRate.value = trackRate(name);
    s.connect(musicOut());
    s.start(0, entry.pts.start);
    src = s;
  }

  function play(name) {
    paused = false;
    if (stemMode !== 'off') stopStems();   // la música normal reemplaza a los instrumentos
    if (current === name) return;
    stop();
    current = name;
    loading = true;
    musicOut();
    const files = [CONFIG.MUSIC.TRACKS[name], (CONFIG.MUSIC.FALLBACK || {})[name]].filter(Boolean);
    (function attempt(k) {
      loadTrack(files[k]).then(function (entry) {
        if (current !== name) return;
        if (!entry && k + 1 < files.length) return attempt(k + 1);
        loading = false;
        if (entry) { retries = 0; startTrack(name, entry); }
      });
    })(0);
  }

  function stop() {
    if (src) { try { src.stop(); } catch (e) {} src.disconnect(); }
    src = null;
    current = null;
    loading = false;
  }

  function pause() {
    paused = true;
    if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
  }

  function resume() {
    paused = false;
    if (audioCtx && !muted) audioCtx.resume().catch(function () {});
  }

  // --- SISTEMA DE INSTRUMENTOS (WEB AUDIO API) ---
  // Todas las pistas de la sala parten JUNTAS (mismo instante, en silencio) y nunca se
  // reinician: solo cambia el volumen de cada una. Así siempre van sincronizadas.
  //   · sin atrapar: suena según la cercanía (INSTRUMENT_SEARCH)
  //   · atrapado: queda sonando fijo
  //   · sala afinada (playStems con force): todas fijas
  // Las pistas se decodifican en mono y a STEM_RATE Hz para gastar poca memoria
  // (con 3 pistas de 3 minutos en estéreo el celular se quedaba sin audio).
  const STEM_MIX = 0.55;            // volumen de un instrumento atrapado (x volumen general)
  const FADE = 0.08;                // segundos de transición del volumen
  let stemStart = 0;                // instante (audioCtx) en que partieron las pistas
  let stemFiles = {};               // nombre -> archivo de la sala actual

  function initCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      try { audioCtx = new AC({ sampleRate: CONFIG.MUSIC.STEM_RATE || 24000 }); }
      catch (e) { audioCtx = new AC(); }
    }
    if (audioCtx.state === 'suspended' && !paused && !muted) audioCtx.resume().catch(function () {});
  }

  function stemFile(name, levelId) {
    const levelFiles = CONFIG.MUSIC.LEVEL_STEMS || {};
    const generalFiles = CONFIG.MUSIC.STEMS || {};
    const specific = levelId && levelFiles[levelId] ? levelFiles[levelId][name] : null;
    return specific || generalFiles[name];
  }

  // Estéreo -> mono (la mitad de memoria)
  function toMono(buffer) {
    if (buffer.numberOfChannels < 2) return buffer;
    const mono = audioCtx.createBuffer(1, buffer.length, buffer.sampleRate);
    const out = mono.getChannelData(0);
    const l = buffer.getChannelData(0), r = buffer.getChannelData(1);
    for (let i = 0; i < out.length; i++) out[i] = (l[i] + r[i]) * 0.5;
    return mono;
  }

  // Los buffers se guardan por archivo (no por nombre): cada sala puede tener los suyos.
  // El servidor de Acode a veces corta un archivo grande: si una pista no llega o no se
  // puede leer, se vuelve a pedir (hasta STEM_TRIES veces). Antes quedaba muda para
  // siempre (por eso a veces no sonaba la percusión).
  // Pide y decodifica un archivo (en mono); hasta 5 intentos
  const STEM_TRIES = 5;
  function fetchDecode(file, n) {
    n = n || 0;
    initCtx();
    const url = CONFIG.MUSIC.PATH + file + (n ? '?r=' + n : '');
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.arrayBuffer();
      })
      .then(function (data) {
        return new Promise(function (ok, fail) { audioCtx.decodeAudioData(data, ok, fail); });
      })
      .then(toMono)
      .catch(function () {
        if (n + 1 >= STEM_TRIES) { setError('No llegó la música: ' + file); return null; }
        return new Promise(function (ok) { setTimeout(ok, 600 * (n + 1)); })
          .then(function () { return fetchDecode(file, n + 1); });
      });
  }

  // Instrumentos: se guardan (las mismas pistas vuelven a sonar en la sala)
  function loadStem(file) {
    if (stemBuffers[file]) return Promise.resolve(stemBuffers[file]);
    if (stemBuffers[file + '#p']) return stemBuffers[file + '#p'];
    const p = fetchDecode(file).then(function (b) {
      delete stemBuffers[file + '#p'];
      if (b) stemBuffers[file] = b;
      return b;
    });
    stemBuffers[file + '#p'] = p;
    return p;
  }

  // Los fondos de la sala se piden antes que los instrumentos (son livianos y, si el
  // servidor está ocupado con una pista grande, fallaban): se espera hasta 5 s
  function backdropFirst() {
    const until = performance.now() + 5000;
    return new Promise(function (ok) {
      (function check() {
        if (typeof Backdrop === 'undefined' || !Backdrop.loading() || performance.now() > until) ok();
        else setTimeout(check, 200);
      })();
    });
  }

  // Las pistas se piden una tras otra (no las tres juntas): menos carga para el
  // servidor y menos memoria a la vez al decodificarlas
  function loadAllStems(files) {
    return files.reduce(function (chain, f) {
      return chain.then(function (list) {
        return backdropFirst().then(function () { return loadStem(f); }).then(function (b) { return list.concat([b]); });
      });
    }, Promise.resolve([]));
  }

  // Volumen que debe tener cada instrumento ahora
  function stemTarget(name) {
    const baseVol = stemBaseVolumes[name] !== undefined ? stemBaseVolumes[name] : 1;
    if (stemMode === 'mix' || collected[name]) return volume * STEM_MIX * baseVol;
    const S = CONFIG.MUSIC.INSTRUMENT_SEARCH || {};
    const maxD = S.MAX_DISTANCE || 12, minV = S.MIN_VOLUME || 0, maxV = S.MAX_VOLUME || 0.75;
    const d = stemDistances[name];
    if (!Number.isFinite(d) || d > maxD) return 0;
    const near = Math.pow(Math.max(0, Math.min(1, 1 - d / maxD)), S.CURVE || 1.5);
    return Math.min(1, volume * (minV + (maxV - minV) * near) * baseVol);
  }

  function applyStem(name) {
    const g = stemGains[name];
    if (!g || !audioCtx) return;
    g.gain.setTargetAtTime(stemTarget(name), audioCtx.currentTime, FADE);
  }

  function applyAllStems() { stemNames.forEach(applyStem); }

  // Vuelta común de los instrumentos de la sala: todos parten y vuelven en el mismo
  // punto (calculado con el pulso de la zona, ver loopPoints)
  let stemLoop = null;
  function stemLoopPts() {
    if (stemLoop) return stemLoop;
    let start = Infinity, end = 0, shortest = Infinity;
    stemNames.forEach(function (n) {
      const b = stemBuffers[stemFiles[n]];
      if (!b) return;
      const p = loopPoints(b, stemFiles[n]);
      start = Math.min(start, p.start);
      end = Math.max(end, p.end);
      shortest = Math.min(shortest, b.duration);
    });
    if (!Number.isFinite(start)) return { start: 0, end: 1 };
    stemLoop = { start: start, end: Math.min(end, shortest) };
    return stemLoop;
  }

  // Arranca la pista en el punto exacto en que van las demás
  function startStem(name) {
    const buffer = stemBuffers[stemFiles[name]];
    if (activeSources[name] || !buffer || stemMode === 'off') return;
    const now = audioCtx.currentTime;
    if (!stemStart) stemStart = now + 0.05;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    // Todas las pistas de la sala dan la vuelta en el mismo punto
    const pts = stemLoopPts();
    const loopLen = pts.end - pts.start;
    source.loopStart = pts.start;
    source.loopEnd = pts.end;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const when = Math.max(now, stemStart);
    const offset = pts.start + (when - stemStart) % loopLen;
    source.start(when, offset);
    activeSources[name] = source;
    stemGains[name] = gainNode;
    applyStem(name);
  }

  // Entra a una sala: prepara (y descarga) sus pistas, sin sonar todavía
  function setStemLevel(levelId) {
    if (stemLevel === levelId && stemNames.length) return;
    stopStems();
    stemLevel = levelId || null;
    const levelFiles = CONFIG.MUSIC.LEVEL_STEMS || {};
    const files = (levelId && levelFiles[levelId]) ? levelFiles[levelId] : (CONFIG.MUSIC.STEMS || {});
    // El tema solo se suma si CONFIG.MUSIC.TEMA_LAYER (si el tema ya trae los mismos
    // instrumentos mezclados, sumarlo los duplica y suenan encimados)
    stemNames = Object.keys(files).filter(function (n) { return n !== 'tema' || CONFIG.MUSIC.TEMA_LAYER; });
    stemFiles = {};
    collected = {};
    stemDistances = {};
    initCtx();
    stemNames.forEach(function (name) {
      stemFiles[name] = stemFile(name, levelId);
      collected[name] = false;   // en silencio: solo efectos (el Eco se robó la música)
      stemDistances[name] = Infinity;
    });
    // Se empiezan a descargar al entrar a la sala (así suenan apenas empieza la misión)
    loadAllStems(stemNames.map(function (n) { return stemFiles[n]; }).filter(Boolean));
  }

  // Empieza a sonar (en silencio) todo junto; cuando las pistas terminan de cargar,
  // parten todas en el mismo instante
  function beginStems(mode) {
    initCtx();
    stemMode = mode;
    const level = stemLevel;
    // Se espera a que lleguen todas y parten en el mismo instante (mismo compás)
    loadAllStems(stemNames.map(function (n) { return stemFiles[n]; }).filter(Boolean)).then(function () {
      if (stemLevel !== level || stemMode === 'off') return;
      if (!Object.keys(activeSources).length) stemStart = audioCtx.currentTime + 0.1;
      stemNames.forEach(startStem);
      applyAllStems();
    });
  }

  function setStemDistance(name, distance) {
    if (stemNames.indexOf(name) === -1) return;
    stemDistances[name] = Math.max(0, distance);   // (no las arranca: eso lo hace startSearch)
    if (!collected[name]) applyStem(name);
  }

  function collectStem(name) {
    if (stemNames.indexOf(name) === -1 || collected[name]) return false;
    collected[name] = true;
    if (stemMode === 'off' && !current) beginStems('search');   // (si suena otra pista, no)
    // Si su pista no había llegado, se pide otra vez y entra en su lugar del compás
    if (!activeSources[name] && stemMode !== 'off' && stemStart) {
      loadStem(stemFiles[name]).then(function () { startStem(name); });
    }
    applyStem(name);                 // queda sonando (ya no se apaga)
    // Con todos los instrumentos vuelve también el tema: la canción completa
    if (stemNames.indexOf('tema') >= 0 && allStemsCollected() && !collected.tema) {
      collected.tema = true;
      if (!activeSources.tema && stemMode !== 'off' && stemStart) {
        loadStem(stemFiles.tema).then(function () { startStem('tema'); });
      }
      applyStem('tema');
    }
    return true;
  }

  function isStemCollected(name) { return !!collected[name]; }

  function allStemsCollected() {
    const inst = stemNames.filter(function (n) { return n !== 'tema'; });
    return inst.length > 0 && inst.every(function (name) { return collected[name]; });
  }

  // ¿Esta sala tiene pistas por instrumento?
  function hasStems(levelId) {
    const files = (CONFIG.MUSIC.LEVEL_STEMS || {})[levelId];
    return !!files && Object.keys(files).length > 0;
  }

  // Entra a la sala: el tema suena y los instrumentos esperan (por cercanía)
  function startSearch(levelId) {
    setStemLevel(levelId);
    stop();
    if (stemMode === 'off') beginStems('search');
  }

  // Todas las pistas a volumen fijo (sala afinada o con todos los instrumentos)
  function playStems(levelId, force) {
    if (levelId) setStemLevel(levelId);
    if (!force && !allStemsCollected()) return;
    stop();                          // apaga la música normal si sonaba
    if (stemMode === 'off') beginStems('mix');
    else { stemMode = 'mix'; applyAllStems(); }
  }

  function stopStems() {
    Object.keys(activeSources).forEach(function (name) {
      try { activeSources[name].stop(); activeSources[name].disconnect(); } catch (e) {}
    });
    activeSources = {};
    stemGains = {};
    stemMode = 'off';
    stemStart = 0;
    stemLoop = null;
  }

  function resetStems() {
    stopStems();
    stemNames.forEach(function (name) {
      collected[name] = false;
      stemDistances[name] = Infinity;
    });
  }

  function setStemBaseVolume(name, val) {
    stemBaseVolumes[name] = Math.max(0, Math.min(1, val));
    applyStem(name);
  }

  // Primer toque o tecla: el navegador ya deja sonar. Si la música de ese momento
  // quedó bloqueada (portada sin tocar nada), suena ahora. Antes aquí se pedían TODAS
  // las pistas a la vez: el servidor de Acode se saturaba y fallaban los fondos y la
  // música de la caída.
  function unlock() {
    initCtx();
    if (audioCtx && audioCtx.state === 'suspended' && !muted && !paused) audioCtx.resume().catch(function () {});
    unlocked = true;
    keepAlive(true);
  }

  // Si la pista no llegó (corte del servidor), se vuelve a pedir: cada 2 s, hasta 5
  // veces. El juego lo llama en cada paso.
  let lastTry = 0;
  function keepAlive(now) {
    if (!current || src || loading || paused || muted || !unlocked) return;
    const t = performance.now();
    if (!now && t - lastTry < 2000) return;
    lastTry = t;
    if (++retries > 5) return;
    const name = current;
    current = null;
    play(name);
  }

  // --- AMBIENTE (una pista suelta que suena encima de la música, ej. el charango) ---
  // ambient(archivo, nivel 0..1): el nivel se sigue cuadro a cuadro (cercanía); con
  // nivel 0 se apaga del todo. Si el archivo no existe, simplemente no suena.
  const amb = { file: null, src: null, gain: null, bufs: {}, missing: {} };
  function ambient(file, level) {
    if (!file || level <= 0) {
      if (amb.gain) amb.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.15);
      if (amb.src && !file) { try { amb.src.stop(audioCtx.currentTime + 0.6); } catch (e) {} amb.src = null; amb.file = null; }
      return;
    }
    if (amb.missing[file] || !unlocked) return;
    initCtx();
    if (!amb.gain) { amb.gain = audioCtx.createGain(); amb.gain.gain.value = 0; amb.gain.connect(audioCtx.destination); }
    amb.gain.gain.setTargetAtTime(muted ? 0 : volume * level, audioCtx.currentTime, 0.1);
    if (amb.file === file) return;
    if (amb.src) { try { amb.src.stop(); } catch (e) {} }
    amb.src = null;
    amb.file = file;
    const ready = amb.bufs[file] ? Promise.resolve(amb.bufs[file]) : fetchDecode(file, STEM_TRIES - 1);
    ready.then(function (b) {
      if (!b) { amb.missing[file] = true; setError(''); return; }
      amb.bufs[file] = b;
      if (amb.file !== file || amb.src) return;
      const s = audioCtx.createBufferSource();
      s.buffer = b;
      s.loop = true;
      s.connect(amb.gain);
      s.start();
      amb.src = s;
    });
  }

  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchend', unlock);

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    applyGain();
    applyAllStems();
  }

  function setNear(v) {
    near = Math.max(0, Math.min(1, v));
    applyGain();
  }

  function toggleMute() {
    muted = !muted;
    applyGain();
    if (audioCtx) {
      if (muted) audioCtx.suspend();
      else audioCtx.resume();
    }
    return muted;
  }

  // El navegador todavía no deja sonar (falta tocar la pantalla)
  function locked() {
    return !!current && !paused && !muted && !!audioCtx && audioCtx.state !== 'running';
  }

  function wake() {
    if (document.hidden || !audioCtx) return;
    if (paused || muted) { if (audioCtx.state === 'running') audioCtx.suspend(); }
    else if (audioCtx.state === 'suspended') audioCtx.resume().catch(function () {});
  }

  document.addEventListener('visibilitychange', wake);
  window.addEventListener('focus', wake);

  return {
    wake: wake, keepAlive: keepAlive, play: play, stop: stop, pause: pause, resume: resume,
    ambient: ambient, setVolume: setVolume, setNear: setNear, setRate: setRate, toggleMute: toggleMute, locked: locked,
    setStemLevel: setStemLevel, setStemDistance: setStemDistance, collectStem: collectStem,
    hasStems: hasStems, startSearch: startSearch,
    isStemCollected: isStemCollected, allStemsCollected: allStemsCollected, playStems: playStems,
    stopStems: stopStems, resetStems: resetStems, setStemBaseVolume: setStemBaseVolume,
    error: function () { return performance.now() < errorUntil ? error : ''; },
    lastError: function () { return error; }
  };
})();