// Portada jugable (pantalla "Pulsa un botón"):
//   · con las flechas / el stick, el chasqui camina y salta (arriba) frente al logo
//   · "Pulsa un botón" está dentro de una caja: si la golpeas desde abajo (o aprietas
//     ✕ ○ □ △ / Espacio / Enter, o tocas la pantalla), la caja se abre y las letras
//     salen volando, cada una con su nota. Después sigue el juego (idioma o menú).
const Portada = (function () {
  const C = {
    FLOOR: 162, SPEED: 70, GRAVITY: 900, JUMP: 330,
    BOX: { y: 110, h: 16, pad: 8 },
    LETTER_EVERY: 0.06, LETTER_SPEED: 90, DONE_AFTER: 1.1
  };
  const NOTES = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
  let p, box, open, letters, t;

  function reset() {
    p = { x: 48, y: C.FLOOR, vy: 0, dir: 1, ground: true, anim: 'papa_quieta', at: 0 };
    box = null;
    open = -1;             // segundos desde que se abrió (-1: cerrada)
    letters = [];
    t = 0;
  }
  reset();

  // Botones que abren la caja (no las direcciones: esas mueven al chasqui)
  function buttonPressed() {
    return Input.pressed('confirm') || Input.pressed('dash') || Input.pressed('tuner') || Input.tapped();
  }

  // Devuelve true cuando ya terminó (las letras salieron)
  function update(dt, canStart, label) {
    t += dt;
    if (open >= 0) {
      open += dt;
      letters.forEach(function (l) {
        if (open < l.at) return;
        l.vy += C.GRAVITY * 0.35 * dt;
        l.x += l.vx * dt;
        l.y += l.vy * dt;
        if (!l.played) { l.played = true; Sfx.tunerStep ? Sfx.tunerStep(l.freq) : Sfx.play('select'); }
      });
      return open > C.DONE_AFTER + letters.length * C.LETTER_EVERY;
    }
    movePapa(dt);
    if (!canStart || !box) return false;
    // Golpe desde abajo: la cabeza entra en la caja subiendo
    const head = p.y - 22;
    const hit = p.vy < 0 && head < box.y + box.h && head > box.y && p.x > box.x - 4 && p.x < box.x + box.w + 4;
    if (hit) { p.vy = 60; }
    if (hit || buttonPressed()) openBox(label);
    return false;
  }

  function movePapa(dt) {
    const ax = Input.axisX();
    if (Math.abs(ax) > 0.2) { p.x += ax * C.SPEED * dt; p.dir = ax > 0 ? 1 : -1; }
    p.x = Math.max(10, Math.min(CONFIG.WIDTH - 10, p.x));
    if (p.ground && Input.pressed('up')) { p.vy = -C.JUMP; p.ground = false; Sfx.play('jump'); }
    p.vy += C.GRAVITY * dt;
    p.y += p.vy * dt;
    if (p.y >= C.FLOOR) { p.y = C.FLOOR; p.vy = 0; p.ground = true; }
    p.anim = !p.ground ? 'papa_salto' : Math.abs(ax) > 0.2 ? 'papa_correr' : 'papa_quieta';
    p.at += dt;
  }

  function openBox(label) {
    open = 0;
    Sfx.play('cube');
    const chars = label.split('');
    const cx = box.x + box.w / 2;
    letters = chars.map(function (ch, i) {
      const k = i / Math.max(1, chars.length - 1) - 0.5;
      return { ch: ch, x: box.x + C.BOX.pad + i * (box.w - C.BOX.pad * 2) / chars.length, y: box.y + 4,
               vx: k * C.LETTER_SPEED * 1.6 + (cx - box.x) * 0, vy: -C.LETTER_SPEED - Math.random() * 40,
               at: i * C.LETTER_EVERY, freq: NOTES[i % NOTES.length], played: ch === ' ' };
    });
  }

  function draw(ctx, time, canStart, label) {
    const W = CONFIG.WIDTH;
    // Suelo
    ctx.fillStyle = 'rgba(11, 6, 32, 0.45)';
    ctx.fillRect(0, C.FLOOR, W, CONFIG.HEIGHT - C.FLOOR);
    // La caja con el aviso
    ctx.font = gameFont(8);
    const w = Math.ceil(ctx.measureText(label).width) + C.BOX.pad * 2;
    box = { x: Math.round(W / 2 - w / 2), y: C.BOX.y, w: w, h: C.BOX.h };
    if (canStart) {
      const bump = open >= 0 ? Math.max(0, 4 - open * 30) : 0;
      ctx.fillStyle = open >= 0 ? '#7a5a3a' : '#c99a62';
      ctx.fillRect(box.x, box.y - bump, box.w, box.h);
      ctx.strokeStyle = '#2e2a47';
      ctx.lineWidth = 1;
      ctx.strokeRect(box.x + 0.5, box.y - bump + 0.5, box.w - 1, box.h - 1);
      if (open < 0 && Math.floor(time * 1.5) % 2 === 0) UI.text(ctx, label, W / 2, box.y + 4, '#fff6e0', 8, 'center');
      if (open < 0) UI.text(ctx, '?', box.x + 3, box.y + 1, '#ffd34d', 6, 'left');
    }
    // Letras que salen volando
    letters.forEach(function (l) {
      if (open < l.at) return;
      UI.text(ctx, l.ch, l.x, l.y, '#ffd34d', 8, 'left');
    });
    // El chasqui
    Sprites.drawAnchored(ctx, p.anim, Sprites.frameAt(p.anim, p.at), p.x, p.y, p.dir < 0);
  }

  return { reset: reset, update: update, draw: draw };
})();
