// Zampoña (CONFIG.ZAMPONA): con R1 (o R) apretado, los botones dejan de saltar, hacer
// dash, etc. y tocan notas. Cada nota deja un escalón de su color (level.steps) que
// sostiene a la papa desde arriba y dura un compás al pulso de la música.
// La nota k (0 Do ... 6 Si) aparece k+1 bloques adelante y k+1 bloques más arriba de los
// pies, así Do, Re, Mi... arman una escalera hacia donde mira la papa.
class Zampona {
  constructor() {
    this.active = false;     // R1 apretado (modo zampoña)
    this.t = 0;
  }

  // Antes de mover a la papa: si está en modo zampoña, los botones son notas
  update(dt, game) {
    const Z = CONFIG.ZAMPONA, p = game.player, L = game.level;
    this.t += dt;
    this.updateSteps(dt, L);
    this.active = p.has('zampona') && Input.held('zampona');
    if (!this.active) return;
    Input.mute(['jump', 'dash', 'action', 'run', 'tuner', 'item']);
    Z.NOTES.forEach(function (n, k) {
      if (Input.pressed('z_' + n)) this.play(game, n, k);
    }, this);
  }

  play(game, note, k) {
    const Z = CONFIG.ZAMPONA, T = CONFIG.TILE, p = game.player, L = game.level;
    const col = Math.floor((p.x + p.w / 2) / T) + p.facing * (k + 1);
    const step = { x: col * T, y: Math.round(p.y + p.h) - (k + 1) * T, w: T, h: Z.STEP_H,
                   lift: true, oneWay: true, dx: 0, dy: 0, note: note };
    Sfx.pipe(Z.FREQ[note]);
    Pulso.check();
    // Dentro de una pared no sirve: no aparece
    const inWall = L.solidBoxesIn(step.x + 1, step.y + 1, T - 2, Z.STEP_H - 2)
      .some(function (b) { return !b.lift; });
    if (inWall) return;
    step.life = step.max = Pulso.barLen() * Z.BARS;
    L.steps = L.steps.filter(function (s) { return s.note !== note; }).concat([step]);
    Effects.play('poof', step.x + T / 2, step.y);
    Registro.ev('zampona', { nota: note });
  }

  updateSteps(dt, L) {
    if (!L.steps.length) return;
    L.steps.forEach(function (s) { s.life -= dt; });
    L.steps = L.steps.filter(function (s) { return s.life > 0; });
  }

  // Escalones (en el mundo)
  draw(ctx, game) {
    const Z = CONFIG.ZAMPONA, N = CONFIG.TUNER.NOTES, L = game.level;
    L.steps.forEach(function (s) {
      if (s.life < Z.BLINK && Math.floor(s.life * 12) % 2 === 0) return;   // se va a ir
      const c = N[s.note].color, x = Math.round(s.x), y = Math.round(s.y);
      ctx.fillStyle = c;
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = 'rgba(46, 42, 71, 0.45)';
      ctx.fillRect(x, y + s.h - 2, s.w, 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(x + 1, y, s.w - 2, 1);
      // Cuánto le queda: una rayita que se acorta
      ctx.fillStyle = '#2e2a47';
      ctx.fillRect(x + 2, y + 2, Math.round((s.w - 4) * s.life / s.max), 1);
    });
    if (this.active) this.drawPipes(ctx, game.player);
  }

  // Con R1 apretado: las 7 cañas sobre la papa, con el botón de cada nota
  drawPipes(ctx, p) {
    const Z = CONFIG.ZAMPONA, N = CONFIG.TUNER.NOTES;
    const labels = Input.device() === 'pad' ? Z.PAD_LABELS : Z.KEY_LABELS;
    const x0 = Math.round(p.x + p.w / 2 - 7 * 6 / 2), y0 = Math.round(p.y) - 22;
    Z.NOTES.forEach(function (n, k) {
      const h = 14 - k, x = x0 + k * 6;
      ctx.fillStyle = N[n].color;
      ctx.fillRect(x, y0 + 14 - h, 5, h);
      UI.text(ctx, labels[k], x + 2.5, y0 + 15, '#fbf6ec', 5, 'center');
    });
  }
}
