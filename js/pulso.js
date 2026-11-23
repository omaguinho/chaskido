// Indicador de pulso (CONFIG.PULSO): una línea en la barra de arriba, al centro.
//   · celeste: hace "clic" (se enciende) en cada tiempo de la música
//   · verde: tocaste el diapasón o la zampoña justo en un tiempo (vale cualquiera
//     del compás); también suena un golpecito
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

  // Una sola línea en la barra de arriba (centro): celeste que brilla en cada tiempo y
  // se pone verde cuando aciertas. Se ve desde que la papa tiene el diapasón.
  function draw(ctx, game) {
    if (!game.player || !game.player.has('tuner')) return;
    const P = CONFIG.PULSO, cx = Math.round(CONFIG.WIDTH / 2);
    const k = click / P.CLICK_TIME;
    ctx.globalAlpha = ok > 0 ? 1 : 0.3 + 0.7 * k;
    ctx.fillStyle = ok > 0 ? P.OK : P.LINE;
    const w = ok > 0 || k > 0.5 ? 2 : 1;
    ctx.fillRect(cx - (w > 1 ? 1 : 0), P.Y, w, P.H);
    ctx.globalAlpha = 1;
  }

  // Tiempos desde que partió la música (con decimales)
  function beats() { return now.beats; }

  return { update: update, check: check, draw: draw, beatLen: beatLen, barLen: barLen, beats: beats };
})();
