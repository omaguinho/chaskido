// Portada con parallax (estilo del póster): capas pintadas en assets/bg/titulo/ que se
// mecen despacio, cada una a su profundidad (las de adelante se mueven más). Al entrar,
// las capas suben a su lugar. Encima, con código: brillo del diapasón y notas doradas.
// Si falta tit_cielo, se usa la portada de antes (la ciudad de noche, js/prologo.js).
// Cada capa: d profundidad (0 quieta ... 1 la de más adelante), cx centro, top arriba,
// bob cuánto flota (px). Todo en px del juego (320 x 180); se ajusta aquí.
const Titulo = (function () {
  const LAYERS = [
    { name: 'tit_cielo',      d: 0.05, cx: 160, top: -9 },
    { name: 'tit_humo_lejos', d: 0.15, cx: 160, top: 6, drift: 6 },
    { name: 'tit_maquina',    d: 0.25, cx: 160, top: 26, bob: 3, blink: true },
    { name: 'tit_ciudad',     d: 0.35, cx: 160, top: 66 },
    { name: 'tit_humo_cerca', d: 0.5,  cx: 160, top: 70, drift: 10 },
    { name: 'tit_jefes_izq',  d: 0.65, cx: 62,  top: 80, bob: 1.5 },
    { name: 'tit_jefes_der',  d: 0.65, cx: 258, top: 80, bob: 1.5 },
    { name: 'tit_chasqui',    d: 0.8,  cx: 160, top: 52, bob: 2 },
    { name: 'tit_suelo',      d: 1,    cx: 160, top: 146 }
  ];
  const SWAY = { X: 14, Y: 5, SPEED_X: 0.2, SPEED_Y: 0.13 };   // vaivén de la cámara
  const ENTER = { TIME: 1.6, RISE: 40 };                         // entrada: suben a su lugar
  // Punta del diapasón del chasqui (relativa al centro y arriba de tit_chasqui)
  const FORK = { dx: 34, dy: 14, color: '#ffd34d' };
  const LOGO = { name: 'tit_logo', cx: 160, top: 3 };

  function active() { return Sprites.has('tit_cielo'); }

  function draw(ctx, time) {
    if (!active()) return false;
    const camX = Math.sin(time * SWAY.SPEED_X) * SWAY.X;
    const camY = Math.sin(time * SWAY.SPEED_Y) * SWAY.Y;
    const e = Math.min(1, time / ENTER.TIME), ease = 1 - Math.pow(1 - e, 3);
    let chasqui = null;
    LAYERS.forEach(function (L) {
      const sp = SPRITES[L.name];
      if (!sp || !Sprites.has(L.name)) return;
      let x = L.cx - sp.fw / 2 - camX * L.d + (L.drift ? Math.sin(time * 0.1 + L.d * 5) * L.drift : 0);
      let y = L.top - camY * L.d + (L.bob ? Math.sin(time * 1.3 + L.d * 4) * L.bob : 0) + (1 - ease) * ENTER.RISE * L.d;
      // La máquina parpadea de vez en cuando (cuadro 1 = ojo cerrado)
      const f = L.blink && (time % 4.3) > 4.15 ? 1 : 0;
      Sprites.drawFrame(ctx, L.name, f, Math.round(x), Math.round(y), false);
      if (L.name === 'tit_chasqui') chasqui = { x: x + sp.fw / 2, y: y };
    });
    if (chasqui) drawFork(ctx, time, chasqui.x + FORK.dx, chasqui.y + FORK.dy);
    const lg = SPRITES[LOGO.name];
    if (lg && Sprites.has(LOGO.name)) Sprites.drawFrame(ctx, LOGO.name, 0, Math.round(LOGO.cx - lg.fw / 2), LOGO.top + Math.round((1 - ease) * -20), false);
    else drawTitleWord(ctx, Math.min(time, 3), 0, 30);
    return true;
  }

  // El diapasón brilla y suelta notas doradas que suben ondeando
  function drawFork(ctx, time, x, y) {
    Light.drawGlow(ctx, x, y, 14 + Math.sin(time * 4) * 2, FORK.color, 0.55);
    for (let i = 0; i < 5; i++) {
      const k = (time * 0.45 + i / 5) % 1;
      const nx = x + k * 26 + Math.sin(time * 2 + i * 1.7) * 5;
      const ny = y - k * 34;
      ctx.globalAlpha = Math.min(1, (1 - k) * 2) * Math.min(1, k * 6);
      BossShow.drawNote(ctx, nx, ny, FORK.color, i % 3);
    }
    ctx.globalAlpha = 1;
  }

  return { active: active, draw: draw };
})();
