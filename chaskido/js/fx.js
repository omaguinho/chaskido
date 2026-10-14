// Efectos visuales: animaciones de una sola vez (poof, chispa, polvo),
// chispas, textos flotantes (+1 / -1), estallido del ají
// y bordes que siguen el pulso de la música.
const Effects = (function () {
  let anims = [];
  let sparks = [];
  let popups = [];
  let bursts = [];

  function clear() {
    anims = [];
    sparks = [];
    popups = [];
    bursts = [];
  }

  // Reproduce una animación una vez, centrada en (cx, cy), y desaparece
  function play(name, cx, cy, flip) {
    const s = SPRITES[name];
    anims.push({ name: name, x: cx - s.fw / 2, y: cy - s.fh / 2, t: 0, flip: !!flip });
  }

  // ---------- Crear ----------

  function addSpark(s) {
    sparks.push(s);
  }

  // Texto pequeño que sube y se desvanece
  function popup(text, x, y, color) {
    popups.push({ text: text, x: x, y: y, color: color, life: CONFIG.FX.POPUP_LIFE });
  }

  // Al comer el ají: líneas verticales que suben y chispas hacia los lados
  function chiliBurst(x, y) {
    bursts.push({ x: x, y: y, t: 0 });
    const colors = [CONFIG.FX.GLOW_OUTER, CONFIG.FX.GLOW_INNER, '#ffd34d'];
    for (let i = 0; i < 18; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      sparks.push({
        x: x, y: y - 6 + Math.random() * 10,
        vx: side * (60 + Math.random() * 90),
        vy: (Math.random() - 0.5) * 40,
        life: 0.5, maxLife: 0.5,
        color: colors[i % colors.length]
      });
    }
  }

  // ---------- Actualizar ----------

  function update(dt) {
    anims.forEach(function (a) { a.t += dt; });
    anims = anims.filter(function (a) {
      const s = SPRITES[a.name];
      return Math.floor(a.t * (s.fps || 12)) < Sprites.frames(a.name);
    });

    sparks.forEach(function (s) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
    });
    sparks = sparks.filter(function (s) { return s.life > 0; });

    popups.forEach(function (p) { p.life -= dt; });
    popups = popups.filter(function (p) { return p.life > 0; });

    bursts.forEach(function (b) { b.t += dt; });
    bursts = bursts.filter(function (b) { return b.t < CONFIG.FX.BURST_TIME; });
  }

  // ---------- Dibujar (en coordenadas del mundo) ----------

  function draw(ctx) {
    anims.forEach(function (a) {
      const s = SPRITES[a.name];
      const frame = Math.min(Sprites.frames(a.name) - 1, Math.floor(a.t * (s.fps || 12)));
      Sprites.drawFrame(ctx, a.name, frame, a.x, a.y, a.flip);
    });
    bursts.forEach(function (b) { drawBurst(ctx, b); });

    sparks.forEach(function (s) {
      ctx.globalAlpha = Math.max(0, s.life / (s.maxLife || 1));
      ctx.fillStyle = s.color;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
    });
    ctx.globalAlpha = 1;

    popups.forEach(function (p) { drawPopup(ctx, p); });
  }

  function drawBurst(ctx, b) {
    const k = b.t / CONFIG.FX.BURST_TIME;          // 0 a 1
    const height = Math.round(48 * Math.min(1, k * 2));
    ctx.globalAlpha = 1 - k;
    for (let i = -2; i <= 2; i++) {
      ctx.fillStyle = i % 2 === 0 ? CONFIG.FX.GLOW_INNER : CONFIG.FX.GLOW_OUTER;
      const x = Math.round(b.x + i * 6 * (0.6 + k));
      ctx.fillRect(x, Math.round(b.y - height), 2, height);
    }
    ctx.globalAlpha = 1;
  }

  function drawPopup(ctx, p) {
    const F = CONFIG.FX;
    const k = 1 - p.life / F.POPUP_LIFE;           // 0 a 1
    const x = Math.round(p.x);
    const y = Math.round(p.y - k * F.POPUP_RISE);
    ctx.globalAlpha = Math.min(1, p.life * 3);
    ctx.font = '8px ' + CONFIG.FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#000000';
    ctx.fillText(p.text, x + 1, y + 1);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, x, y);
    ctx.globalAlpha = 1;
  }

  // ---------- Bordes al pulso ----------

  // Punto que da una vuelta completa al rectángulo en cada pulso
  function pointOnRect(r, t) {
    const per = 2 * (r.w + r.h);
    let d = ((t % 1) + 1) % 1 * per;
    if (d < r.w) return { x: r.x + d, y: r.y };
    d -= r.w;
    if (d < r.h) return { x: r.x + r.w, y: r.y + d };
    d -= r.h;
    if (d < r.w) return { x: r.x + r.w - d, y: r.y + r.h };
    d -= r.w;
    return { x: r.x, y: r.y + r.h - d };
  }

  // Borde blanco de las plataformas rítmicas: brilla en cada pulso
  function drawBeatBorder(ctx, r, phase) {
    const color = CONFIG.FX.RHYTHM_BORDER;
    ctx.globalAlpha = 0.45 + 0.55 * (1 - phase);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.globalAlpha = 1;
    drawDot(ctx, function (t) { return pointOnRect(r, t); }, phase, color, color);
  }

  // Punto con estela que recorre un camino (t de 0 a 1)
  function drawDot(ctx, pathAt, phase, head, tail) {
    for (let i = 3; i >= 1; i--) {
      const p = pathAt(phase - i * 0.035);
      ctx.globalAlpha = 0.25 * (4 - i);
      ctx.fillStyle = tail;
      ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
    const p = pathAt(phase);
    ctx.fillStyle = head;
    ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3);
  }

  // ---------- Brillo del ají alrededor de la papa ----------

  function spriteBox(player) {
    const s = SPRITES[player.anim];
    return {
      x: player.x + player.w / 2 - s.fw / 2,
      y: player.y + player.h - s.fh,
      frame: Sprites.frameAt(player.anim, player.animTime),
      flip: player.isFlipped()
    };
  }

  // Detrás del sprite: silueta roja afuera y blanca adentro, late con el pulso
  function drawChiliGlow(ctx, player, phase) {
    const b = spriteBox(player);
    const F = CONFIG.FX;
    const rings = [
      { d: 2, color: F.GLOW_OUTER, alpha: 0.35 + 0.5 * (1 - phase) },
      { d: 1, color: F.GLOW_INNER, alpha: 0.9 }
    ];
    rings.forEach(function (ring) {
      ctx.globalAlpha = ring.alpha;
      [[-ring.d, 0], [ring.d, 0], [0, -ring.d], [0, ring.d]].forEach(function (o) {
        Sprites.drawFrame(ctx, player.anim, b.frame, b.x + o[0], b.y + o[1], b.flip, ring.color, 1);
      });
    });
    ctx.globalAlpha = 1;
  }

  // Delante del sprite: punto blanco con estela roja que gira una vez por pulso
  function drawChiliDot(ctx, player, phase) {
    const s = SPRITES[player.anim];
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h - s.fh / 2;
    const path = function (t) {
      const a = t * Math.PI * 2 - Math.PI / 2;
      return { x: cx + Math.cos(a) * (s.fw / 2 + 2), y: cy + Math.sin(a) * (s.fh / 2 + 2) };
    };
    drawDot(ctx, path, phase, CONFIG.FX.GLOW_INNER, CONFIG.FX.GLOW_OUTER);
  }

  return {
    clear: clear,
    play: play,
    addSpark: addSpark,
    popup: popup,
    chiliBurst: chiliBurst,
    update: update,
    draw: draw,
    drawBeatBorder: drawBeatBorder,
    drawChiliGlow: drawChiliGlow,
    drawChiliDot: drawChiliDot
  };
})();
