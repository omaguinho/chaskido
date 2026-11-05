// Luz y ambiente: la oscuridad de cada sala, las luces que la abren y brillan,
// las partículas del aire (polvo, polen, luciérnagas, papel picado) y los bordes
// oscuros. Todo late con el blues: en cada pulso de la música las luces crecen.
//   Light.setRoom(level)        al cargar una sala
//   Light.update(dt, game)      cada paso
//   Light.drawAmbientBack(...)  partículas detrás de la papa (en el mundo)
//   Light.draw(ctx, game)       oscuridad, brillos, partículas de luz y viñeta (en pantalla)
// Ajustes en CONFIG.LIGHT. La calidad (0, 1 o 2) se elige en Opciones.
const Light = (function () {
  const W = CONFIG.WIDTH;
  const H = CONFIG.HEIGHT;
  let buffer = null;        // la oscuridad, dibujada a 320×180 y estirada suave
  let bctx = null;
  let holeImg = null;       // degradado blanco para "abrir" la oscuridad
  let vignetteImg = null;
  const glowCache = {};     // color -> degradado de ese color
  let dark = 0;             // oscuridad de la sala
  let arena = 0;            // 0 a 1: la pelea oscurece la escena
  let pulse = 0;            // 0 a 1: el pulso de la música (crece en cada tiempo y se apaga)
  let lastPhase = 0;
  let desat = 0;            // 0 a 1: colores que se van (el Silencio)
  let quality = CONFIG.LIGHT.QUALITY;
  let ambient = null;       // { def, list }
  let time = 0;

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // Degradado redondo de un color (para los brillos), se hace una vez por color
  function glow(color) {
    if (glowCache[color]) return glowCache[color];
    const c = makeCanvas(64, 64);
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, color);
    grad.addColorStop(0.25, hexAlpha(color, 0.55));
    grad.addColorStop(1, hexAlpha(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    glowCache[color] = c;
    return c;
  }

  function hexAlpha(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function setup() {
    if (buffer) return;
    buffer = makeCanvas(W, H);
    bctx = buffer.getContext('2d');
    holeImg = makeCanvas(64, 64);
    const h = holeImg.getContext('2d');
    const grad = h.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.62, 'rgba(255,255,255,0.42)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    h.fillStyle = grad;
    h.fillRect(0, 0, 64, 64);
    vignetteImg = makeCanvas(W, H);
    const v = vignetteImg.getContext('2d');
    const vg = v.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    vg.addColorStop(0, 'rgba(10,6,24,0)');
    vg.addColorStop(1, 'rgba(10,6,24,1)');
    v.fillStyle = vg;
    v.fillRect(0, 0, W, H);
  }

  // ---------- Sala ----------

  function setRoom(level) {
    setup();
    const L = CONFIG.LIGHT;
    dark = level.dark;
    arena = 0;
    desat = 0;
    const def = L.AMBIENT[level.ambient];
    ambient = def ? { def: def, list: [] } : null;
    if (ambient) {
      for (let i = 0; i < def.n; i++) ambient.list.push(newMote(def, Math.random() * W, Math.random() * H));
    }
  }

  // Una partícula del aire, en posición de pantalla (se mueve un poco con la cámara)
  function newMote(def, x, y) {
    return {
      x: x, y: y, depth: 0.3 + Math.random() * 0.7,
      vx: def.kind === 'blizzard' ? -90 - Math.random() * 70 : (Math.random() - 0.5) * 8,
      vy: def.kind === 'confetti' ? 10 + Math.random() * 14 : def.kind === 'snow' ? 12 + Math.random() * 16
        : def.kind === 'blizzard' ? 30 + Math.random() * 30 : def.kind === 'bubbles' ? -10 - Math.random() * 16
        : (Math.random() - 0.5) * 6 - 2,
      seed: Math.random() * 100, color: def.colors[Math.floor(Math.random() * def.colors.length)],
      spin: Math.random() * 6
    };
  }

  // ---------- Actualizar ----------

  function update(dt, game) {
    time += dt;
    const L = CONFIG.LIGHT;
    const level = game.level;
    // Pulso: cada vez que la fase del compás vuelve a empezar, según lo fuerte que suena
    const phase = level.beatPhase();
    if (phase < lastPhase) pulse = Math.max(pulse, Math.min(1, 0.25 + (game.musicNear || 0)));
    lastPhase = phase;
    pulse *= Math.exp(-L.PULSE_DECAY * dt);
    const goal = level.arenaActive ? 1 : 0;
    arena += (goal - arena) * Math.min(1, dt * 3);
    if (!ambient || quality < 2) return;
    const cam = game.camera;
    const dx = cam.x - (ambient.camX === undefined ? cam.x : ambient.camX);
    const dy = cam.y - (ambient.camY === undefined ? cam.y : ambient.camY);
    ambient.camX = cam.x;
    ambient.camY = cam.y;
    ambient.list.forEach(function (m) {
      const k = ambient.def.kind;
      let vx = m.vx;
      let vy = m.vy;
      if (k === 'firefly') {
        vx += Math.sin(time * 0.9 + m.seed) * 9;
        vy += Math.cos(time * 0.7 + m.seed * 1.3) * 7;
      } else if (k === 'pollen' || k === 'dust') {
        vx += Math.sin(time * 0.5 + m.seed) * 4;
      } else if (k === 'snow') {
        vx += Math.sin(time * 1.2 + m.seed) * 10;
      } else if (k === 'bubbles') {
        vx += Math.sin(time * 2.5 + m.seed) * 6;
      } else if (k === 'confetti') {
        vx += Math.sin(time * 2 + m.seed) * 12;
        m.spin += dt * 6;
      }
      m.x += vx * dt - dx * m.depth;
      m.y += vy * dt - dy * m.depth;
      if (m.x < -8) m.x += W + 16;
      if (m.x > W + 8) m.x -= W + 16;
      if (m.y < -8) m.y += H + 16;
      if (m.y > H + 8) m.y -= H + 16;
    });
  }

  // ---------- Fuentes de luz ----------

  function source(list, x, y, def, k) {
    list.push({ x: x, y: y, r: def.R * (k || 1), color: def.COLOR, glow: def.GLOW });
  }

  function collect(game, total) {
    const L = CONFIG.LIGHT;
    const S = L.SOURCES;
    const T = CONFIG.TILE;
    const list = [];
    const level = game.level;
    const beat = 1 + L.PULSE * pulse;
    const p = game.player;
    // La papa: su luz es más grande cuanto más oscuro está
    list.push({ x: p.x + p.w / 2, y: p.y + p.h / 2, r: L.PLAYER.R * (0.55 + total * 0.45),
                color: L.PLAYER.COLOR, glow: L.PLAYER.GLOW * total });
    level.items.forEach(function (it) {
      if (it.taken || it.hidden) return;
      const cx = it.x + T / 2;
      const cy = it.y + T / 2;
      if (it.type === 'totem') source(list, cx + T / 2, cy - T, S.totem, it.state === 'activo' ? 1.4 * beat : beat);
      else if (it.type === 'key') source(list, cx, cy, S.key, beat);
      else if (it.type === 'posta') source(list, cx, cy, S.posta, 1 + Math.sin(time * 11 + it.seed) * 0.05);
      else if (it.type === 'save' && it.active) source(list, cx, cy, S.save);
    });
    if (game.corcheas) {
      game.corcheas.remaining().forEach(function (c) { source(list, c.x + c.w / 2, c.y + c.h / 2, S.corchea, beat); });
    }
    level.deco.back.concat(level.deco.front).forEach(function (d) {
      const id = d.def.id;
      if (id === 'hongo') source(list, d.tx * T + 8, d.ty * T + 10, S.hongo, beat);
      else if (id === 'antorcha') source(list, d.tx * T + 8, d.ty * T - 8, S.antorcha, (1 + Math.sin(time * 13 + d.seed) * 0.08) * beat);
      else if (id === 'discoSol') source(list, d.tx * T + 16, d.ty * T, S.key, beat);
      else if (id === 'cristal') source(list, d.tx * T + 8, d.ty * T - 8, S.cristal, beat);
      else if (id === 'neon' || id === 'farolFuturo') {
        if (Deco.lit(d, time)) source(list, d.tx * T + (id === 'neon' ? 24 : 12), d.ty * T - (id === 'neon' ? 8 : 50), S.neon, beat);
      }
      else if (id === 'robot' && Deco.eye(d, time) > 0) source(list, d.tx * T + 16, d.ty * T - 30, S.neon, Deco.eye(d, time) * 0.6);
      else if (id === 'farol' || id === 'lampara') {
        source(list, d.tx * T + 8, d.ty * T - 10, S.farol, (1 + Math.sin(time * 9 + d.seed) * 0.04) * beat);
      }
    });
    level.geysers.forEach(function (g) {
      if (level.geyserState(g) !== 'on') return;
      const J = level.geyserJet(g);
      list.push({ x: J.x + J.w / 2, y: J.y + J.h / 2, r: 30 + J.h * 0.4, color: '#cfefff', glow: 0.5 });
    });
    if (game.enemies) {
      game.enemies.alive().forEach(function (e) {
        if (e.def.glow) list.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, r: 30 * beat, color: e.def.glow, glow: 0.7 });
      });
    }
    const b = game.boss;
    // (la Rana bajo el agua no alumbra: así no se delata)
    if (b && b.started && b.state !== 'dead' && !b.hidden && !(b.submerged && b.submerged())) {
      const lc = b.lightColor ? b.lightColor() : S.boss.COLOR;
      list.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: S.boss.R * beat, color: lc, glow: S.boss.GLOW });
    }
    if (b) {
      b.shots.forEach(function (s) {
        list.push({ x: s.x + s.w / 2, y: s.y + s.h / 2, r: S.shot.R, color: s.light || S.shot.COLOR, glow: S.shot.GLOW });
      });
    }
    if (game.tuner) {
      game.tuner.waves.forEach(function (w) {
        const k = 1 - w.t / CONFIG.TUNER.WAVE_TIME;
        list.push({ x: w.x, y: w.y, r: S.tune.R * (1 + w.radius * 0.3) * k + 4, color: CONFIG.TUNER.NOTES[w.note].color, glow: S.tune.GLOW * k });
      });
    }
    if (game.scene && game.scene.lights) game.scene.lights(list, beat);
    // Solo las que se ven
    const cam = game.camera;
    return list.filter(function (l) {
      return l.x + l.r > cam.x && l.x - l.r < cam.x + W && l.y + l.r > cam.y && l.y - l.r < cam.y + H;
    });
  }

  // ---------- Dibujo ----------

  // Partículas del aire que no brillan (polvo, polen, papel picado), sobre la escena
  function drawAmbientBack(ctx) {
    if (!ambient || quality < 2 || ambient.def.kind === 'firefly') return;
    const k = ambient.def.kind;
    ambient.list.forEach(function (m) {
      ctx.globalAlpha = k === 'confetti' ? 0.9 : 0.35 + m.depth * 0.35;
      ctx.fillStyle = m.color;
      if (k === 'confetti') {
        const w = Math.abs(Math.cos(m.spin)) * 3 + 1;
        ctx.fillRect(Math.round(m.x - w / 2), Math.round(m.y), Math.round(w), 2);
      } else if (k === 'snow') {
        ctx.globalAlpha = 0.5 + m.depth * 0.5;
        const s = m.depth > 0.7 ? 2 : 1;
        ctx.fillRect(Math.round(m.x), Math.round(m.y), s, s);
      } else if (k === 'blizzard') {
        ctx.globalAlpha = 0.35 + m.depth * 0.45;
        ctx.fillRect(Math.round(m.x), Math.round(m.y), Math.round(3 + m.depth * 6), 1);
      } else if (k === 'bubbles') {
        // Burbujas que suben: un aro chiquito con brillo
        const r = m.depth > 0.7 ? 2 : 1;
        ctx.globalAlpha = 0.3 + m.depth * 0.4;
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(Math.round(m.x) + 0.5, Math.round(m.y) + 0.5, r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
      }
    });
    ctx.globalAlpha = 1;
  }

  // Oscuridad + brillos + luciérnagas + viñeta, en coordenadas de pantalla
  function draw(ctx, game) {
    if (quality <= 0) return;
    setup();
    const L = CONFIG.LIGHT;
    const total = Math.min(0.94, dark + (1 - dark) * L.ARENA_DARK * arena);
    const cam = game.camera;
    const lights = collect(game, total);
    if (desat > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'saturation';
      ctx.globalAlpha = desat;
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (total > 0.02) {
      bctx.globalCompositeOperation = 'source-over';
      bctx.clearRect(0, 0, W, H);
      bctx.globalAlpha = total;
      bctx.fillStyle = L.COLOR;
      bctx.fillRect(0, 0, W, H);
      bctx.globalAlpha = 1;
      bctx.globalCompositeOperation = 'destination-out';
      lights.forEach(function (l) {
        const r = l.r;
        bctx.drawImage(holeImg, l.x - cam.x - r, l.y - cam.y - r, r * 2, r * 2);
      });
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(buffer, 0, 0, W, H);
      ctx.restore();
    }
    if (quality >= 2) {
      // Brillos de color encima (se suman a lo que hay)
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.globalCompositeOperation = 'lighter';
      const strength = 0.25 + total * 0.75;
      lights.forEach(function (l) {
        if (l.glow <= 0) return;
        const r = l.r * 0.7;
        ctx.globalAlpha = Math.min(1, l.glow * strength * (1 + pulse * 0.6));
        ctx.drawImage(glow(l.color), l.x - cam.x - r, l.y - cam.y - r, r * 2, r * 2);
      });
      // Luciérnagas: brillan y parpadean
      if (ambient && ambient.def.kind === 'firefly') {
        ambient.list.forEach(function (m) {
          const blink = 0.5 + 0.5 * Math.sin(time * 2.3 + m.seed * 3);
          ctx.globalAlpha = blink * (0.4 + total);
          ctx.drawImage(glow(m.color), m.x - 4, m.y - 4, 8, 8);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
        });
      }
      ctx.restore();
    }
    const vig = L.VIGNETTE * (0.5 + total) + arena * 0.25;
    if (vig > 0.02) {
      ctx.globalAlpha = Math.min(1, vig);
      ctx.drawImage(vignetteImg, 0, 0);
      ctx.globalAlpha = 1;
    }
  }

  // Brillo suelto (lo usan las escenas y la presentación de los jefes), en el mundo
  function drawGlow(ctx, x, y, r, color, alpha) {
    if (quality < 2) return;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.drawImage(glow(color), x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  return {
    setRoom: setRoom,
    update: update,
    draw: draw,
    drawAmbientBack: drawAmbientBack,
    drawGlow: drawGlow,
    glow: glow,
    pulse: function () { return pulse; },
    setDark: function (v) { dark = Math.max(0, Math.min(1, v)); },
    getDark: function () { return dark; },
    setDesat: function (v) { desat = Math.max(0, Math.min(1, v)); },
    quality: function () { return quality; },
    setQuality: function (q) { quality = Math.max(0, Math.min(2, q)); }
  };
})();
