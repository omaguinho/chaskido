// Indicador de pulso (CONFIG.PULSO): un rombo con marco tejido arriba al centro.
//   · una línea celeste que hace "clic" (se enciende) en cada tiempo de la música
//   · si tocas el diapasón o la zampoña justo en un tiempo, se enciende un cuadrado
//     verde y suena un golpecito (vale cualquier tiempo del compás)
// El pulso sale de la música que suena (Music.beat); si no hay música con BPM conocido,
// se usa el BPM de la sala con un reloj propio.
const Pulso = (function () {
  let clock = 0;          // reloj propio (sin música)
  let lastBeat = -1;
  let click = 0;          // brillo de la línea (cae después de cada tiempo)
  let ok = 0;             // cuadrado verde encendido
  let now = { bpm: 120, beats: 0 };

  function update(dt, game) {
    const P = CONFIG.PULSO;
    clock += dt;
    const m = Music.beat();
    const bpm = (game.level && game.level.bpm) || 120;
    now = m || { bpm: bpm, beats: clock * bpm / 60 };
    const b = Math.floor(now.beats);
    if (b !== lastBeat) { lastBeat = b; click = P.CLICK_TIME; }
    click = Math.max(0, click - dt);
    ok = Math.max(0, ok - dt);
  }

  // Segundos de un tiempo y de un compás, al pulso de lo que suena
  function beatLen() { return 60 / now.bpm; }
  function barLen() { return beatLen() * CONFIG.ZAMPONA.BEATS_PER_BAR; }

  // ¿Cayó en un tiempo? (con la tolerancia); si sí, lo celebra
  function check() {
    const frac = now.beats - Math.floor(now.beats);
    const off = Math.min(frac, 1 - frac) * beatLen();
    if (off > CONFIG.PULSO.TOLERANCE) return false;
    ok = CONFIG.PULSO.OK_TIME;
    Sfx.play('beatOk');
    return true;
  }

  // Se ve desde que la papa tiene el diapasón
  function draw(ctx, game) {
    if (!game.player || !game.player.has('tuner')) return;
    const P = CONFIG.PULSO, cx = Math.round(CONFIG.WIDTH / 2), cy = P.Y, r = P.SIZE;
    // Fondo oscuro
    ctx.fillStyle = 'rgba(46, 42, 71, 0.85)';
    rhombus(ctx, cx, cy, r);
    ctx.fill();
    // Marco tejido: puntos de colores que se alternan por el borde
    for (let i = 0; i < 16; i++) {
      const k = i / 16, side = Math.floor(k * 4), t = k * 4 - side;
      const pts = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy], [cx, cy - r]];
      const a = pts[side], b = pts[side + 1];
      ctx.fillStyle = P.FRAME[i % P.FRAME.length];
      ctx.fillRect(Math.round(a[0] + (b[0] - a[0]) * t) - 1, Math.round(a[1] + (b[1] - a[1]) * t) - 1, 2, 2);
    }
    // Cuadrado verde: acertaste el pulso
    if (ok > 0) {
      ctx.globalAlpha = Math.min(1, ok / P.OK_TIME * 1.5);
      ctx.fillStyle = P.OK;
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
      ctx.globalAlpha = 1;
    }
    // Línea celeste: brilla en cada tiempo y se apaga hasta el siguiente
    const k = click / P.CLICK_TIME;
    ctx.globalAlpha = 0.35 + 0.65 * k;
    ctx.fillStyle = P.LINE;
    ctx.fillRect(cx - (k > 0.5 ? 1 : 0), cy - r + 3, k > 0.5 ? 3 : 1, r * 2 - 6);
    ctx.globalAlpha = 1;
  }

  function rhombus(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
    ctx.closePath();
  }

  return { update: update, check: check, draw: draw, beatLen: beatLen, barLen: barLen };
})();
