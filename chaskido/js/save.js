// Guarda en el teléfono (localStorage): lo elegido en la pausa (volumen y
// vibración), los récords de tiempo y la partida (al descansar en una posta
// o con "Guardar partida" en la pausa).
// Si el navegador no deja guardar, el juego sigue igual (sin guardar).
const Save = (function () {
  // { music, sfx, master } de 0 a 10 y rumble (vibración) sí o no
  function loadSettings() {
    const V = CONFIG.VOLUME;
    const base = { music: V.MUSIC, sfx: V.SFX, master: V.MASTER,
                   rumble: CONFIG.SFX.RUMBLE_DEFAULT };
    try {
      const raw = window.localStorage.getItem(CONFIG.GAME.SETTINGS_KEY);
      return raw ? Object.assign(base, JSON.parse(raw)) : base;
    } catch (e) {
      return base;
    }
  }

  function writeSettings(data) {
    try {
      window.localStorage.setItem(CONFIG.GAME.SETTINGS_KEY, JSON.stringify(data));
    } catch (e) {
      // sin espacio o sin permiso: se ignora
    }
  }

  // Récords: { best: { 'hard:0': segundos, ... }, plusUnlocked: true/false }
  function loadRecords() {
    const base = { best: {}, plusUnlocked: false };
    try {
      const raw = window.localStorage.getItem(CONFIG.GAME.RECORDS_KEY);
      return raw ? Object.assign(base, JSON.parse(raw)) : base;
    } catch (e) {
      return base;
    }
  }

  function writeRecords(data) {
    try {
      window.localStorage.setItem(CONFIG.GAME.RECORDS_KEY, JSON.stringify(data));
    } catch (e) {
      // sin espacio o sin permiso: se ignora
    }
  }

  // Partida guardada (el objeto "progress" del juego) o null
  function loadGame() {
    try {
      const raw = window.localStorage.getItem(CONFIG.GAME.SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // Devuelve true si se pudo guardar
  function writeGame(data) {
    try {
      window.localStorage.setItem(CONFIG.GAME.SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function hasGame() {
    return !!loadGame();
  }

  return {
    loadSettings: loadSettings, writeSettings: writeSettings,
    loadRecords: loadRecords, writeRecords: writeRecords,
    loadGame: loadGame, writeGame: writeGame, hasGame: hasGame
  };
})();
