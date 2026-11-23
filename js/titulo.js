// Portada: el chasqui corre en un punto fijo mientras pasan los paisajes de los niveles,
// como diapositivas (el chasqui viaja por muchos lugares). Usa los mismos fondos con
// parallax del juego (Backdrop, capas de CSS) y el suelo de cada tema dibujado con sus
// propios bloques, así todo tiene una sola estética: la del juego.
// THEMES: los paisajes en orden; SLIDE segundos cada uno, con un fundido de FADE.
// Los créditos del final usan la misma escena: el chasqui camina con los vecinos que
// rescató y, si liberó animales, también con ellos, mientras suben los nombres.
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

  // El paisaje del momento: fondo con parallax y su suelo (devuelve la altura del suelo)
  function scene(ctx, time) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, T = CONFIG.TILE;
    const theme = THEMES[Math.floor(time / SLIDE) % THEMES.length];
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
    return GROUND_ROW * T;
  }

  function drawPapa(ctx, time, x, feet) {
    if (!Sprites.drawAnchored(ctx, 'papa_correr', Sprites.frameAt('papa_correr', time), x, feet, false)) {
      ctx.fillStyle = '#e8b04a';
      ctx.fillRect(x - 6, feet - 14, 12, 14);
    }
  }

  // Fundido entre paisajes
  function drawFade(ctx, time) {
    const t = time % SLIDE;
    const fade = t < FADE ? 1 - t / FADE : t > SLIDE - FADE ? (t - (SLIDE - FADE)) / FADE : 0;
    if (fade <= 0) return;
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#140b2b';
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.globalAlpha = 1;
  }

  function draw(ctx, time) {
    const W = CONFIG.WIDTH;
    const feet = scene(ctx, time);
    drawPapa(ctx, time, PAPA.x, feet);
    if (!Sprites.drawFrame(ctx, 'logo', 0, W / 2 - 80, 8, false)) drawTitleWord(ctx, Math.min(time, 3), 0, 30);
    drawFade(ctx, time);
    return true;
  }

  // ---------- Créditos del final ----------
  // CREDITS.SCROLL px por segundo que suben los nombres; el desfile: vecinos detrás del
  // chasqui (siempre) y los animales liberados delante (uno por especie)
  const CREDITS = { SCROLL: 14, TEXT_BOTTOM: 104, PAPA_X: 190, GAP: 17, MAX_NPC: 9, MAX_ANIMALS: 6 };
  let parade = null;

  function startCredits(game) {
    const npcs = CONFIG.VECINOS.filter(function (v) { return !v.sprite; });
    const animals = [];
    const rooms = game.progress.rooms;
    // Especies con al menos un animal liberado
    const seen = {};
    LEVELS.forEach(function (raw) {
      const libres = rooms[raw.id] && rooms[raw.id].libres;
      if (!libres) return;
      let L;
      try { L = new Level(raw); } catch (e) { return; }
      Object.keys(libres).forEach(function (i) {
        const sp = L.enemySpawns[i];
        if (sp && !seen[sp.type] && animals.length < CREDITS.MAX_ANIMALS) {
          seen[sp.type] = true;
          const e = new Enemy(sp.type, 0, 0);
          e.reset();
          animals.push(e);
        }
      });
    });
    const freed = Codex.freed(game);
    const lines = [
      ['', 'CHASKIDO'],
      ['Juego hecho por', 'Vicente Flau'], ['Música original', 'Vicente Flau'],
      ['Con la asistencia de', 'Claude y DeepSeek'],
    ];
    // Los vecinos, de a 3 nombres por línea
    const names = npcs.map(function (v) { return v.name; });
    for (let i = 0; i < names.length; i += 3) lines.push([i ? ' ' : 'Vecinos que volvieron a bailar', names.slice(i, i + 3).join(' · ')]);
    if (freed.got) lines.push(['Animales liberados', freed.got + ' / ' + freed.total]);
    lines.push(['', 'Gracias por jugar']);
    parade = { npcs: npcs, animals: animals, lines: lines, t: 0 };
  }

  // Devuelve true cuando ya subieron todos los nombres
  function updateCredits(dt) {
    if (!parade) return true;
    parade.t += dt;
    return parade.t * CREDITS.SCROLL > CREDITS.TEXT_BOTTOM + parade.lines.length * 34 + 20;
  }

  function drawCredits(ctx, time) {
    if (!parade) return;
    const W = CONFIG.WIDTH, C = CREDITS, t = parade.t;
    const feet = scene(ctx, t);
    // Vecinos detrás del chasqui (van cambiando por tandas en cada paisaje)
    const slide = Math.floor(t / SLIDE), n = parade.npcs.length;
    for (let k = 0; k < Math.min(C.MAX_NPC, n); k++) {
      const v = parade.npcs[(slide * C.MAX_NPC + k) % n];
      const x = C.PAPA_X - C.GAP * (k + 1);
      const hop = Math.abs(Math.sin(t * 8 + k)) * 2;
      Scenes.drawNpc(ctx, x, feet - hop, v.kind, v.color, t + k, (t * 2 + k * 0.3) % 1, false, k + 3);
    }
    drawPapa(ctx, t, C.PAPA_X, feet);
    // Animales liberados delante, contentos
    parade.animals.forEach(function (e, i) {
      e.animTime = t + i;
      e.dir = 1;
      e.x = C.PAPA_X + 16 + i * 20;
      e.y = (e.def.flies ? feet - 26 + Math.sin(t * 3 + i) * 4 : feet - e.h - Math.abs(Math.sin(t * 7 + i)) * 2);
      e.draw(ctx);
    });
    // Nombres que suben (solo en el cielo, arriba del desfile)
    const y0 = C.TEXT_BOTTOM - t * C.SCROLL;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, C.TEXT_BOTTOM);
    ctx.clip();
    parade.lines.forEach(function (l, i) {
      const y = y0 + i * 34;
      if (y < -24 || y > C.TEXT_BOTTOM) return;
      if (l[0]) UI.text(ctx, l[0], W / 2, y, '#e9c46a', 6, 'center');
      UI.text(ctx, l[1], W / 2, y + 10, '#fbf6ec', l[0] ? 8 : 12, 'center');
    });
    ctx.restore();
    drawFade(ctx, t);
  }

  return { draw: draw, startCredits: startCredits, updateCredits: updateCredits, drawCredits: drawCredits };
})();
