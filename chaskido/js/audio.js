// Música de fondo: una pista a la vez, en bucle.
// Los archivos van en assets/music/ (nombres en CONFIG.MUSIC.TRACKS).
// setRate cambia el tono y la velocidad juntos (cada nivel suena en otro tono).
const Music = (function () {
  const players = {};
  let current = null;
  let muted = false;
  let unlocked = false;
  let volume = 0.6;             // de 0 a 1 (lo fija el menú de pausa)
  let near = 1;                 // de 0 a 1: cercanía a la corchea (la música se oye por distancia)
  let rate = 1;                 // 1 = normal; más de 1, más aguda y rápida
  let error = '';               // texto del problema, si lo hay
  let errorUntil = 0;           // hasta cuándo se muestra en pantalla
  let paused = false;           // en el menú de pausa (no reintentar)

  // Cada pista se crea una vez. Si el archivo no llega (el servidor de Acode a veces
  // falla con archivos grandes), se vuelve a pedir hasta 4 veces (Loader, js/util.js);
  // solo si no existe o nunca llega se avisa, y el aviso dura unos segundos.
  function player(name) {
    if (!players[name]) {
      const file = CONFIG.MUSIC.TRACKS[name];
      const src = CONFIG.MUSIC.PATH + file;
      const a = new Audio(src);
      a.loop = true;
      a.preload = 'auto';
      a.volume = volume * near;
      applyRate(a);
      a.muted = muted;
      let tries = 0;
      a.addEventListener('error', function () {
        Loader.afterError(src, tries, function () {
          tries++;
          a.src = Loader.withRetry(src, tries);
          a.load();
          if (current === name && !paused) {
            const p = a.play();
            if (p && p.catch) p.catch(function () {});
          }
        }, function (found) {
          setError(found === false
            ? 'Música: falta ' + src + ' (revísalo con revisar.html)'
            : 'Música: no se pudo cargar ' + file);
        });
      });
      a.addEventListener('playing', function () { if (current === name) setError(''); });
      players[name] = a;
    }
    return players[name];
  }

  function setError(text) {
    error = text;
    errorUntil = text ? performance.now() + CONFIG.MUSIC.ERROR_SHOW * 1000 : 0;
  }

  // Sin "preservesPitch" el tono sube o baja junto con la velocidad
  function applyRate(a) {
    a.preservesPitch = false;
    a.mozPreservesPitch = false;
    a.webkitPreservesPitch = false;
    a.defaultPlaybackRate = rate;
    a.playbackRate = rate;
  }

  function setRate(r) {
    rate = r || 1;
    Object.keys(players).forEach(function (k) { applyRate(players[k]); });
  }

  // Android pide que el audio se active dentro de un toque o tecla real.
  // En el primer toque se "despiertan" todas las pistas en silencio.
  // Si la pista que debía sonar quedó bloqueada (el navegador no dejó), en cada
  // toque o tecla se vuelve a intentar: así el nivel 1 no se queda sin música
  function unlock() {
    retryCurrent();
    if (unlocked) return;
    unlocked = true;
    Object.keys(CONFIG.MUSIC.TRACKS).forEach(function (name) {
      const a = player(name);
      if (name === current) return;
      a.muted = true;
      const p = a.play();
      if (p && p.then) {
        p.then(function () {
          if (current !== name) a.pause();
          a.muted = muted;
        }).catch(function () { a.muted = muted; });
      }
    });
  }
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchend', unlock);

  function retryCurrent() {
    if (!current || !players[current].paused || paused) return;
    const p = players[current].play();
    if (p && p.then) p.then(function () { setError(''); }).catch(function () {});
  }

  // Empieza una pista desde el principio (si ya suena, no hace nada;
  // si se había quedado bloqueada, la intenta otra vez)
  function play(name) {
    paused = false;
    if (current === name) {
      retryCurrent();
      return;
    }
    stop();
    current = name;
    const a = player(name);
    a.muted = muted;
    a.currentTime = 0;
    applyRate(a);
    const started = a.play();
    if (started && started.catch) {
      started.catch(function (e) {
        // NotAllowedError: el navegador espera un toque; se reintenta solo (unlock)
        if (e && e.name !== 'NotAllowedError' && e.name !== 'AbortError' && !error) setError('Música bloqueada: ' + e.name);
      });
    }
  }

  function stop() {
    if (!current) return;
    players[current].pause();
    current = null;
  }

  // Pausa la pista actual sin olvidarla (para el menú de pausa)
  function pause() {
    paused = true;
    if (current) players[current].pause();
  }

  function resume() {
    paused = false;
    if (!current) return;
    const p = players[current].play();
    if (p && p.catch) p.catch(function () {});
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    Object.keys(players).forEach(function (k) { players[k].volume = volume * near; });
  }

  // Cercanía (0 a 1) que multiplica el volumen: la usa el juego para que la música
  // de la misión se oiga solo cerca de las corcheas
  function setNear(v) {
    near = Math.max(0, Math.min(1, v));
    if (current) players[current].volume = volume * near;
  }

  function toggleMute() {
    muted = !muted;
    Object.keys(players).forEach(function (k) { players[k].muted = muted; });
    return muted;
  }

  return {
    play: play,
    stop: stop,
    pause: pause,
    resume: resume,
    setVolume: setVolume,
    setNear: setNear,
    setRate: setRate,
    toggleMute: toggleMute,
    // El aviso se ve solo unos segundos (después queda en el menú de pausa)
    error: function () { return performance.now() < errorUntil ? error : ''; },
    lastError: function () { return error; }
  };
})();
