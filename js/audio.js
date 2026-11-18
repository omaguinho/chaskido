// Música tradicional + sistema de instrumentos independientes.

const Music = (function () {
  const players = {};
  
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

  function applyRate(a) {
    const r = rate * (a.extraRate || 1);
    a.preservesPitch = false;
    a.mozPreservesPitch = false;
    a.webkitPreservesPitch = false;
    a.defaultPlaybackRate = r;
    a.playbackRate = r;
  }

  function setRate(r) {
    rate = r || 1;
    Object.keys(players).forEach(function (key) { applyRate(players[key]); });
    Object.keys(activeSources).forEach(function (name) {
      if (activeSources[name]) activeSources[name].playbackRate.value = rate;
    });
  }

  // --- REPRODUCTOR TRADICIONAL (HTML5) ---
  function player(name) {
    if (!players[name]) {
      const file = CONFIG.MUSIC.TRACKS[name];
      const src = CONFIG.MUSIC.PATH + file;
      const a = new Audio(src);
      a.loop = true;
      a.preload = 'auto';
      const extra = (CONFIG.MUSIC.TRACK_PITCH || {})[name] || 0;
      a.extraRate = Math.pow(2, extra / 12);
      applyRate(a);
      a.volume = volume * near;
      a.muted = muted;
      players[name] = a;
    }
    return players[name];
  }

  function play(name) {
    paused = false;
    if (stemMode !== 'off') stopStems();   // la música normal reemplaza a los instrumentos
    if (current === name) return;
    stop();
    current = name;
    const a = player(name);
    a.muted = muted;
    a.currentTime = 0;
    applyRate(a);
    a.play().catch(function () {});
  }

  function stop() {
    if (!current) return;
    players[current].pause();
    current = null;
  }

  function pause() {
    paused = true;
    if (current) players[current].pause();
    if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
  }

  function resume() {
    paused = false;
    if (current) players[current].play().catch(function () {});
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

  // Los buffers se guardan por archivo (no por nombre): cada sala puede tener los suyos
  function loadStem(file) {
    if (stemBuffers[file]) return Promise.resolve(stemBuffers[file]);
    if (stemBuffers[file + '#p']) return stemBuffers[file + '#p'];
    const p = fetch(CONFIG.MUSIC.PATH + file)
      .then(function (res) { return res.arrayBuffer(); })
      .then(function (data) {
        return new Promise(function (ok, fail) { audioCtx.decodeAudioData(data, ok, fail); });
      })
      .then(function (buffer) { stemBuffers[file] = toMono(buffer); return stemBuffers[file]; })
      .catch(function () { console.error('Error cargando pista:', file); return null; });
    stemBuffers[file + '#p'] = p;
    return p;
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

  // Arranca la pista en el punto exacto en que van las demás
  function startStem(name) {
    const buffer = stemBuffers[stemFiles[name]];
    if (activeSources[name] || !buffer || stemMode === 'off') return;
    const now = audioCtx.currentTime;
    if (!stemStart) stemStart = now + 0.05;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = rate;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    const when = Math.max(now, stemStart);
    const offset = ((when - stemStart) * rate) % buffer.duration;
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
    stemNames = Object.keys(files);
    stemFiles = {};
    collected = {};
    stemDistances = {};
    initCtx();
    stemNames.forEach(function (name) {
      stemFiles[name] = stemFile(name, levelId);
      collected[name] = false;
      stemDistances[name] = Infinity;
    });
  }

  // Empieza a sonar (en silencio) todo junto; cuando las pistas terminan de cargar,
  // parten todas en el mismo instante
  function beginStems(mode) {
    initCtx();
    stemMode = mode;
    const level = stemLevel;
    Promise.all(stemNames.map(function (n) { return loadStem(stemFiles[n]); })).then(function () {
      if (stemLevel !== level || stemMode === 'off') return;
      if (!stemStart) stemStart = audioCtx.currentTime + 0.05;
      stemNames.forEach(startStem);
      applyAllStems();
    });
  }

  function setStemDistance(name, distance) {
    if (stemNames.indexOf(name) === -1) return;
    if (stemMode === 'off') beginStems('search');
    stemDistances[name] = Math.max(0, distance);
    if (!collected[name]) applyStem(name);
  }

  function collectStem(name) {
    if (stemNames.indexOf(name) === -1 || collected[name]) return false;
    collected[name] = true;
    if (stemMode === 'off') beginStems('search');
    applyStem(name);                 // queda sonando (ya no se apaga)
    return true;
  }

  function isStemCollected(name) { return !!collected[name]; }

  function allStemsCollected() {
    return stemNames.length > 0 && stemNames.every(function (name) { return collected[name]; });
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

  function unlock() {
    initCtx(); 
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (!unlocked) {
      unlocked = true;
      Object.keys(CONFIG.MUSIC.TRACKS || {}).forEach(function (name) {
        player(name); 
      });
    }
  }

  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchend', unlock);

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    Object.keys(players).forEach(function (key) { players[key].volume = volume * near; });
    
    applyAllStems();
  }

  function setNear(v) {
    near = Math.max(0, Math.min(1, v));
    if (current) players[current].volume = volume * near;
  }

  function toggleMute() {
    muted = !muted;
    Object.keys(players).forEach(function (key) { players[key].muted = muted; });
    if (audioCtx) {
      if (muted) audioCtx.suspend();
      else audioCtx.resume();
    }
    return muted;
  }

  function locked() {
    return !!current && !paused && !muted && !error && players[current].paused;
  }

  function wake() {
    if (document.hidden || !audioCtx) return;
    if (paused || muted) { if (audioCtx.state === 'running') audioCtx.suspend(); }
    else if (audioCtx.state === 'suspended') audioCtx.resume().catch(function () {});
  }

  document.addEventListener('visibilitychange', wake);
  window.addEventListener('focus', wake);

  return {
    wake: wake, play: play, stop: stop, pause: pause, resume: resume,
    setVolume: setVolume, setNear: setNear, setRate: setRate, toggleMute: toggleMute, locked: locked,
    setStemLevel: setStemLevel, setStemDistance: setStemDistance, collectStem: collectStem,
    isStemCollected: isStemCollected, allStemsCollected: allStemsCollected, playStems: playStems,
    stopStems: stopStems, resetStems: resetStems, setStemBaseVolume: setStemBaseVolume,
    error: function () { return performance.now() < errorUntil ? error : ''; },
    lastError: function () { return error; }
  };
})();