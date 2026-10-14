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
  window.addEventListener('resize', resize);
  resize();

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

  // Espera la letra pixel, pero sin internet sigue con la de respaldo
  function loadFont() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const timeout = new Promise(function (resolve) { setTimeout(resolve, 3000); });
    const font = document.fonts.load('8px "Press Start 2P"').catch(function () {});
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

  drawText('Cargando...');
  Promise.all([Sprites.load(), loadFont()])
    .then(start)
    .catch(function (err) { drawText(err.message); });
})();
