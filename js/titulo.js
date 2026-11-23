// Portada: el chasqui corre en un punto fijo mientras pasan los paisajes de los niveles,
// como diapositivas (el chasqui viaja por muchos lugares). Usa los mismos fondos con
// parallax del juego (Backdrop, capas de CSS) y el suelo de cada tema dibujado con sus
// propios bloques, así todo tiene una sola estética: la del juego.
// THEMES: los paisajes en orden; SLIDE segundos cada uno, con un fundido de FADE.
const Titulo = (function () {
  const THEMES = ['city', 'sea', 'bosque', 'pantano', 'dorada', 'nieve', 'lago', 'niebla'];
  const SLIDE = 6, FADE = 0.6;
  const SPEED = 60;                  // px por segundo que avanza el paisaje
  const PAPA = { x: 96 };            // dónde corre el chasqui (px del juego)
  const GROUND_ROW = 9;              // fila del suelo en el mapita (11 filas de alto)
  const levels = {};                 // tema -> mapita con su suelo

  // Un mapita de 60 x 11 con dos filas de suelo, para dibujar los bloques de ese tema
  function ground(theme) {
    if (levels[theme] !== undefined) return levels[theme];
    const rows = [];
    for (let y = 0; y < 11; y++) rows.push(new Array(61).join(y >= GROUND_ROW ? 'B' : '.'));
    try { levels[theme] = new Level({ id: 'titulo_' + theme, theme: theme, map: rows, exits: [], props: {} }); }
    catch (e) { levels[theme] = null; }
    return levels[theme];
  }

  function draw(ctx, time) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, T = CONFIG.TILE;
    const i = Math.floor(time / SLIDE) % THEMES.length;
    const theme = THEMES[i];
    const x = time * SPEED;
    ctx.clearRect(0, 0, W, H);
    Backdrop.set(theme);
    Backdrop.scroll(x, 0);
    // Suelo del tema (los bloques se repiten: la cámara da la vuelta cada 20 bloques)
    const L = ground(theme);
    if (L) {
      const cam = { x: T * 10 + (x % (T * 20)), y: 0 };
      ctx.save();
      ctx.translate(-Math.round(cam.x), 0);
      L.draw(ctx, cam);
      ctx.restore();
    }
    // El chasqui corre sin moverse de su lugar
    const feet = GROUND_ROW * T;
    if (!Sprites.drawAnchored(ctx, 'papa_correr', Sprites.frameAt('papa_correr', time), PAPA.x, feet, false)) {
      ctx.fillStyle = '#e8b04a';
      ctx.fillRect(PAPA.x - 6, feet - 14, 12, 14);
    }
    // Logo
    if (!Sprites.drawFrame(ctx, 'logo', 0, W / 2 - 80, 8, false)) drawTitleWord(ctx, Math.min(time, 3), 0, 30);
    // Fundido entre paisajes
    const t = time % SLIDE;
    const fade = t < FADE ? 1 - t / FADE : t > SLIDE - FADE ? (t - (SLIDE - FADE)) / FADE : 0;
    if (fade > 0) {
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#140b2b';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    return true;
  }

  return { draw: draw };
})();
