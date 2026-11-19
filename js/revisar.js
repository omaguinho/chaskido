// Revisión de archivos: abre index.html?revisar y el juego, en vez de partir, muestra
// qué músicas y fondos faltan en la carpeta (o no los entrega el servidor).
// Sirve después de copiar una versión nueva: el zip no trae tus músicas.
const Revisar = (function () {
  // Todo lo que el juego pide: músicas (obligatorias) y fondos de los temas que se usan
  function lista() {
    const M = CONFIG.MUSIC;
    const music = {};
    Object.keys(M.TRACKS).forEach(function (k) { music[M.TRACKS[k]] = true; });
    Object.keys(M.LEVEL_STEMS || {}).forEach(function (id) {
      const o = M.LEVEL_STEMS[id];
      Object.keys(o).forEach(function (k) { music[o[k]] = true; });
    });
    const bg = {};
    LEVELS.forEach(function (l) {
      if (!l.theme || l.theme.indexOf('salita') === 0) return;   // las salitas usan un solo fondo
      const name = l.theme === 'tower' ? 'coliseo' : l.theme;
      ['far', 'mid', 'near'].forEach(function (layer) { bg['bg_' + name + '_' + layer + '.png'] = true; });
    });
    return {
      music: Object.keys(music).map(function (f) { return M.PATH + f; }),
      bg: Object.keys(bg).map(function (f) { return 'assets/bg/' + f; })
    };
  }

  // Pregunta por cada archivo, de a uno (para no cargar al servidor)
  function check(paths, done) {
    const missing = [];
    let i = 0;
    (function next() {
      if (i >= paths.length) return done(missing);
      const p = paths[i++];
      fetch(p + '?r=' + Date.now(), { method: 'HEAD', cache: 'no-store' })
        .then(function (r) { if (!r.ok) missing.push(p); })
        .catch(function () { missing.push(p); })
        .then(next);
    })();
  }

  function show(html) {
    let box = document.getElementById('revisar');
    if (!box) {
      box = document.createElement('div');
      box.id = 'revisar';
      box.style.cssText = 'position:fixed;inset:0;z-index:50;overflow:auto;background:#140b2b;color:#fbf6ec;' +
        'font:15px/1.5 sans-serif;padding:20px';
      document.body.appendChild(box);
    }
    box.innerHTML = html;
  }

  function run() {
    const L = lista();
    show('<h2>Revisando archivos…</h2>');
    check(L.music, function (mus) {
      check(L.bg, function (bg) {
        const part = function (title, all, miss, note) {
          return '<h3 style="color:' + (miss.length ? '#ff4d6d' : '#7be0a0') + '">' + title + ': ' +
            (all.length - miss.length) + ' de ' + all.length + ' están</h3>' +
            (miss.length ? '<p style="color:#9a93b0">' + note + '</p><ul><li>' + miss.join('</li><li>') + '</li></ul>' : '');
        };
        show('<h2>Revisión de archivos</h2>' +
          part('Músicas', L.music, mus, 'Faltan (sin estas, esas salas o jefes quedan en silencio). Cópialas de tu carpeta anterior a assets/music/:') +
          part('Fondos', L.bg, bg, 'Faltan (si una capa no está, la sala usa el fondo simple). Algunas pueden faltar a propósito:') +
          '<p><a style="color:#ffd34d" href="index.html">Volver al juego</a></p>');
      });
    });
  }

  return { run: run, on: function () { return /revisar/.test(location.search); } };
})();
