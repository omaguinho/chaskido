(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Resolución interna del lienzo: el juego piensa en 320×180, pero dibuja hasta
  // 4 veces más fino (CONFIG.MAX_RENDER_SCALE) para que los sprites dibujados a 4x
  // (estilo Moebius) se vean nítidos. "render" es esa escala
  let render = 1;

  // El escenario (fondo CSS + lienzo) crece en números enteros para que los píxeles no se deformen
  function resize() {
    const scale = Math.max(1, Math.floor(
      Math.min(window.innerWidth / CONFIG.WIDTH,
               window.innerHeight / CONFIG.HEIGHT)
    ));
    render = Math.max(1, Math.min(CONFIG.MAX_RENDER_SCALE, scale));
    canvas.width = CONFIG.WIDTH * render;
    canvas.height = CONFIG.HEIGHT * render;
    Backdrop.resize(CONFIG.WIDTH * scale, CONFIG.HEIGHT * scale, scale);
    ctx.imageSmoothingEnabled = false;
  }

  // Todo se dibuja en medidas del juego (320×180)
  function prepare() {
    ctx.setTransform(render, 0, 0, render, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  // En el celular, al girar o cambiar de tamaño, el navegador a veces avisa antes de
  // tener la medida final: se vuelve a medir un poco después
  function resizeSoon() {
    resize();
    setTimeout(resize, 150);
    setTimeout(resize, 600);
  }
  window.addEventListener('resize', resizeSoon);
  window.addEventListener('orientationchange', resizeSoon);
  document.addEventListener('fullscreenchange', resizeSoon);
  document.addEventListener('webkitfullscreenchange', resizeSoon);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeSoon);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) resizeSoon(); });
  // Si el celular se queda sin memoria, el lienzo se borra (pantalla negra): al
  // recuperarlo se vuelve a preparar
  canvas.addEventListener('contextrestored', resizeSoon);
  resize();
  if (typeof Touch !== 'undefined') Touch.init();

  // Botón de pantalla completa (⛶): solo si el navegador lo permite
  (function fullscreenButton() {
    const root = document.documentElement;
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!req) return;
    const btn = document.createElement('button');
    btn.id = 'fullscreen';
    btn.textContent = '⛶';
    btn.setAttribute('aria-label', 'Pantalla completa');
    document.body.appendChild(btn);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const on = document.fullscreenElement || document.webkitFullscreenElement;
      if (on) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        return;
      }
      const p = req.call(root, { navigationUI: 'hide' });
      const lock = function () {
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {});
      };
      if (p && p.then) p.then(lock).catch(function () {}); else lock();
      btn.blur();
    });
  })();

  // Pantalla simple de texto (carga o error)
  function drawText(text) {
    prepare();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, 8, 8);
  }

  // Espera la letra (Josefin Sans), pero sin internet sigue con la de respaldo
  function loadFont() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const timeout = new Promise(function (resolve) { setTimeout(resolve, 3000); });
    const font = Promise.all([gameFont(8), '700 10px "Josefin Sans"'].map(function (f) {
      return document.fonts.load(f);
    })).catch(function () {});
    return Promise.race([font, timeout]);
  }

  // Muestra un error una sola vez (archivo y línea) sin detener el juego
  const shown = {};
  function showError(err) {
    const where = (err.stack || '').split('\n')[1] || '';
    const text = err.message + '\n' + where.trim();
    if (shown[text]) return;
    shown[text] = true;
    if (window.onerror) window.onerror(err.message, where.trim(), '');
  }

  function start() {
    const game = new Game();
    let last = performance.now();
    let acc = 0;

    function frame(now) {
      acc += Math.min((now - last) / 1000, 0.25);
      last = now;
      try {
        while (acc >= CONFIG.STEP) {
          Input.update();
          game.update(CONFIG.STEP);
          acc -= CONFIG.STEP;
        }
        // En menús la palanca se achica a la esquina (para poder tocar las opciones)
        if (typeof Touch !== 'undefined') Touch.setFree(game.state === 'play' && !game.overlay && !game.menu.open);
        prepare();
        game.draw(ctx);
      } catch (err) {
        acc = 0;
        showError(err);
      }
      requestAnimationFrame(frame);   // el juego sigue aunque haya un error
    }
    requestAnimationFrame(frame);
  }

  // "Cargando..." con la cuenta de dibujos (si se queda quieta, el servidor no entrega)
  let loading = true;
  function showLoading() {
    if (!loading) return;
    const c = Sprites.progress ? Sprites.progress() : null;
    drawText('Cargando...' + (c && c.total ? ' ' + c.done + ' / ' + c.total : ''));
    setTimeout(showLoading, 250);
  }
  showLoading();
  Promise.all([Sprites.load(), loadFont()])
    .then(function () {
      loading = false;
      start();
    })
    .catch(function (err) {
      loading = false;
      drawText('Error al cargar: ' + err.message);
    });
})();
