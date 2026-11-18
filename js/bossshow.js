// Presentación de los jefes, para que cada pelea se sienta como un evento:
//   - portada antes de pelear: franjas que entran, retrato grande, nombre y apodo;
//   - barra de vida continua que baja suave, con una estela blanca que se queda atrás;
//   - fases (al 66 % y al 33 %): onda, destello y la música sube un poco;
//   - cada golpe: una pausa de un instante, destello y colores separados;
//   - al vencerlo: cámara lenta y una explosión de notas que vuelven al mundo.
// El juego llama a startIntro, onHit, onDefeat y reset; dibuja con drawWorld,
// drawBar, drawIntro y drawPost. Ajustes en CONFIG.BOSS_SHOW.
const BossShow = (function () {
  const W = CONFIG.WIDTH;
  const H = CONFIG.HEIGHT;
  const PORTRAITS = { cuy: 'retrato_cuygig' };
  const PHASE_COLORS = [['#ff4d6d', '#ff9a6b'], ['#ff6b2e', '#ffd34d'], ['#c03cff', '#ff4dc4']];
  const NOTE_COLORS = ['#ffd34d', '#ff6b8a', '#7be0a0', '#9fd3e0', '#c9b8ff', '#ff9a6b'];
  let intro = null;         // { t, boss, type, name, apodo }
  let bar = null;           // { shown, trail, wait, shake, flash }
  let hitstop = 0;
  let flash = 0;
  let split = 0;
  let slowmo = 0;
  let phase = 0;
  let notes = [];           // notas de la explosión final (en el mundo)
  let rings = [];           // ondas (en el mundo)
  let copy = null;          // copia del lienzo para separar colores
  let tint = null;

  function reset() {
    intro = null;
    bar = null;
    hitstop = 0;
    flash = 0;
    split = 0;
    slowmo = 0;
    phase = 0;
    notes = [];
    rings = [];
  }

  // ---------- Portada ----------

  function startIntro(boss, type) {
    const info = WORLD.boss(type) || {};
    intro = { t: 0, boss: boss, type: type, name: tr(boss.def.NAME), apodo: tr(info.apodo || '') };
    startBar(boss);
    Sfx.play('bossIntro');
  }

  // Solo la barra (el coliseo ya tiene su propia presentación)
  function startBar(boss) {
    bar = { shown: boss.def.HP, trail: boss.def.HP, wait: 0, shake: 0, flash: 0 };
    phase = 0;
  }

  // Devuelve true mientras la portada sigue en pantalla
  function updateIntro(dt) {
    if (!intro) return false;
    intro.t += dt;
    const C = CONFIG.BOSS_SHOW;
    if (intro.t >= C.INTRO_TIME || (intro.t > 1 && Input.anyPressed())) {
      intro = null;
      flash = 0.18;
      return false;
    }
    return true;
  }

  function introOn() {
    return !!intro;
  }

  // ---------- Golpes, fases y derrota ----------

  function onHit(boss) {
    const C = CONFIG.BOSS_SHOW;
    hitstop = C.HITSTOP;
    flash = C.FLASH;
    split = C.SPLIT;
    if (bar) {
      bar.shake = 0.3;
      bar.flash = 0.15;
      bar.wait = C.TRAIL_WAIT;
    }
    rings.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h / 2, t: 0, life: 0.35, r: 40, color: '#ffffff' });
    const p = phaseOf(boss);
    if (p > phase && boss.hp > 0) {
      phase = p;
      split = C.SPLIT * 2;
      flash = 0.25;
      rings.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h / 2, t: 0, life: 0.8, r: 220, color: PHASE_COLORS[p][0] });
      Sfx.play('bossPhase');
      if (boss.onPhase) boss.onPhase(p);
      const R = CONFIG.SFX.RUMBLE.BOSS_LAND;
      Input.rumble(R.TIME * 2, R.STRONG, R.WEAK);
    }
  }

  function phaseOf(boss) {
    const k = boss.hp / boss.def.HP;
    const P = CONFIG.BOSS_SHOW.PHASES;
    return k <= P[1] ? 2 : k <= P[0] ? 1 : 0;
  }

  function onDefeat(boss) {
    const C = CONFIG.BOSS_SHOW;
    slowmo = C.SLOWMO;
    flash = 0.4;
    split = C.SPLIT * 2.5;
    const cx = boss.x + boss.w / 2;
    const cy = boss.y + boss.h / 2;
    for (let i = 0; i < C.BURST_NOTES; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 180;
      notes.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0,
                   life: 1.6 + Math.random() * 1.4, color: NOTE_COLORS[i % NOTE_COLORS.length],
                   kind: i % 3, spin: Math.random() * 6 });
    }
    rings.push({ x: cx, y: cy, t: 0, life: 1.1, r: 260, color: '#ffffff' });
    rings.push({ x: cx, y: cy, t: -0.15, life: 1.2, r: 200, color: '#ffd34d' });
    Sfx.play('bossBurst');
    const R = CONFIG.SFX.RUMBLE.BOSS_LAND;
    Input.rumble(700, R.STRONG, R.WEAK);
  }

  // Escala del tiempo del mundo: 0 en la pausa del golpe, lenta al vencerlo
  function timeScale() {
    if (hitstop > 0) return 0;
    if (slowmo > 0) {
      // Los últimos 0,4 s vuelve de a poco a la velocidad normal
      const S = CONFIG.BOSS_SHOW.SLOWMO_SCALE;
      return slowmo > 0.4 ? S : 1 - (1 - S) * slowmo / 0.4;
    }
    return 1;
  }

  // Tiempo real (no lo frena la cámara lenta)
  function update(dt, boss) {
    const C = CONFIG.BOSS_SHOW;
    hitstop = Math.max(0, hitstop - dt);
    flash = Math.max(0, flash - dt);
    split = Math.max(0, split - dt);
    slowmo = Math.max(0, slowmo - dt);
    if (bar && boss) {
      bar.shown += (boss.hp - bar.shown) * Math.min(1, dt * C.BAR_EASE);
      bar.wait -= dt;
      if (bar.wait <= 0) bar.trail += (bar.shown - bar.trail) * Math.min(1, dt * C.TRAIL_EASE);
      bar.shake = Math.max(0, bar.shake - dt);
      bar.flash = Math.max(0, bar.flash - dt);
    }
    notes.forEach(function (n) {
      n.t += dt;
      n.vx *= Math.exp(-1.6 * dt);
      n.vy = n.vy * Math.exp(-1.6 * dt) - 30 * dt;   // suben, como si volvieran al aire
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.spin += dt * 4;
    });
    notes = notes.filter(function (n) { return n.t < n.life; });
    rings.forEach(function (r) { r.t += dt; });
    rings = rings.filter(function (r) { return r.t < r.life; });
  }

  // ---------- Dibujo ----------

  // Notas de la explosión y ondas (dentro de la cámara)
  function drawWorld(ctx) {
    rings.forEach(function (r) {
      if (r.t < 0) return;
      const k = r.t / r.life;
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r * (0.1 + 0.9 * Math.sqrt(k)), 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
    notes.forEach(function (n) {
      const a = 1 - n.t / n.life;
      Light.drawGlow(ctx, n.x, n.y, 9, n.color, a * 0.8);
      ctx.globalAlpha = a;
      drawNote(ctx, n.x, n.y, n.color, n.kind);
    });
    ctx.globalAlpha = 1;
  }

  // Corchea o negra pequeña de píxeles
  function drawNote(ctx, x, y, color, kind) {
    const px = Math.round(x);
    const py = Math.round(y);
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(px - 2, py + 1, 5, 4);
    ctx.fillStyle = color;
    ctx.fillRect(px - 1, py + 2, 3, 2);
    ctx.fillRect(px + 1, py - 4, 1, 6);
    if (kind > 0) ctx.fillRect(px + 2, py - 4, 2, 1);
    if (kind > 1) ctx.fillRect(px + 2, py - 2, 2, 1);
  }

  // Barra de vida arriba: nombre, barra continua con estela y marcas de las fases
  function drawBar(ctx, boss) {
    if (!bar || !boss || !boss.isActive() || intro) return;
    const C = CONFIG.BOSS_SHOW;
    const HP = boss.def.HP;
    const bw = C.BAR_W;
    const sx = bar.shake > 0 ? Math.round((Math.random() * 2 - 1) * 3 * bar.shake / 0.3) : 0;
    const sy = bar.shake > 0 ? Math.round((Math.random() * 2 - 1) * 2 * bar.shake / 0.3) : 0;
    const x = Math.round(W / 2 - bw / 2) + sx;
    const y = 28 + sy;
    ctx.font = gameFont(8);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';
    ctx.fillText(tr(boss.def.NAME), x + 1, y - 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tr(boss.def.NAME), x, y - 11);
    // Marco
    ctx.fillStyle = '#0b0620';
    ctx.fillRect(x - 2, y - 2, bw + 4, 10);
    ctx.fillStyle = '#3a2a5a';
    ctx.fillRect(x - 1, y - 1, bw + 2, 8);
    ctx.fillStyle = '#1b1035';
    ctx.fillRect(x, y, bw, 6);
    // Estela blanca y vida
    const trailW = Math.round(bw * Math.max(0, bar.trail) / HP);
    const fillW = Math.round(bw * Math.max(0, bar.shown) / HP);
    ctx.fillStyle = '#fff6e0';
    ctx.fillRect(x, y, trailW, 6);
    const cols = PHASE_COLORS[phase];
    const grad = ctx.createLinearGradient(x, 0, x + bw, 0);
    grad.addColorStop(0, cols[0]);
    grad.addColorStop(1, cols[1]);
    ctx.fillStyle = bar.flash > 0 ? '#ffffff' : grad;
    ctx.fillRect(x, y, fillW, 6);
    // Brillo de arriba y pulso
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x, y, fillW, 1);
    const pulse = Light.pulse();
    if (pulse > 0.05 && fillW > 2) {
      ctx.fillStyle = 'rgba(255,255,255,' + (pulse * 0.4) + ')';
      ctx.fillRect(x + fillW - 2, y, 2, 6);
    }
    // Marcas de las fases
    ctx.fillStyle = '#0b0620';
    C.PHASES.forEach(function (k) { ctx.fillRect(x + Math.round(bw * k), y, 1, 6); });
  }

  // Portada antes de pelear
  function drawIntro(ctx, game) {
    if (!intro) return;
    const C = CONFIG.BOSS_SHOW;
    const t = intro.t;
    const inK = Math.min(1, t / 0.35);
    const outK = Math.max(0, (t - (C.INTRO_TIME - 0.35)) / 0.35);
    const ease = function (k) { return 1 - Math.pow(1 - k, 3); };
    const slide = ease(inK) - ease(outK);
    // Fondo oscuro con líneas de velocidad
    ctx.fillStyle = 'rgba(8, 4, 20, ' + (0.82 * slide) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.5 * slide;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 14; i++) {
      const ly = (i * 37 + 11) % H;
      const lx = ((i * 97 + t * (300 + i * 40)) % (W + 80)) - 80;
      ctx.fillRect(Math.round(W - lx), ly, 18 + (i % 4) * 10, 1);
    }
    ctx.globalAlpha = 1;
    // Franja diagonal de color (entra desde la izquierda)
    const cols = PHASE_COLORS[0];
    const bandY = 98;
    ctx.save();
    ctx.translate(-W * (1 - slide), 0);
    ctx.fillStyle = cols[0];
    ctx.beginPath();
    ctx.moveTo(0, bandY - 8);
    ctx.lineTo(W, bandY - 26);
    ctx.lineTo(W, bandY + 22);
    ctx.lineTo(0, bandY + 40);
    ctx.fill();
    ctx.fillStyle = '#0b0620';
    ctx.beginPath();
    ctx.moveTo(0, bandY - 2);
    ctx.lineTo(W, bandY - 20);
    ctx.lineTo(W, bandY + 16);
    ctx.lineTo(0, bandY + 34);
    ctx.fill();
    ctx.restore();
    // Retrato (o el jefe mismo, grande) entrando desde la derecha
    const px = Math.round(W - 112 + (1 - slide) * 140);
    const glowR = 70 + Math.sin(t * 6) * 4;
    Light.drawGlow(ctx, px + 48, 64, glowR, cols[1], 0.55 * slide);
    const portrait = PORTRAITS[intro.type] || ('retrato_' + intro.type);
    if (!Sprites.drawFrame(ctx, portrait, 0, px + 16, 24, false)) drawBossBig(ctx, intro.boss, px + 48, 64, 2.6);
    // Nombre: letras que caen una por una, con colores separados
    const name = intro.name;
    const shown = Math.max(0, Math.min(name.length, Math.floor((t - 0.3) * 26)));
    ctx.font = gameFont(16);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    const nx = Math.round(14 - (1 - slide) * 200);
    const ny = bandY;
    const part = name.slice(0, shown);
    const jitter = t < 0.9 ? Math.round(Math.sin(t * 60) * 1.5) : 0;
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#ff2e63';
    ctx.fillText(part, nx - 2 + jitter, ny);
    ctx.fillStyle = '#2ee6ff';
    ctx.fillText(part, nx + 2 - jitter, ny);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff6e0';
    ctx.fillText(part, nx, ny);
    // Apodo
    if (t > 0.3 + name.length / 26 + 0.15 && intro.apodo) {
      ctx.font = gameFont(8);
      const label = '« ' + intro.apodo + ' »';
      const lw = Math.ceil(ctx.measureText(label).width);
      // Placa oscura con borde de color: el apodo se lee sobre cualquier fondo
      ctx.fillStyle = 'rgba(11, 6, 32, 0.9)';
      ctx.fillRect(nx - 3, ny + 20, lw + 10, 13);
      ctx.fillStyle = cols[1];
      ctx.fillRect(nx - 3, ny + 20, lw + 10, 1);
      ctx.fillRect(nx - 3, ny + 32, lw + 10, 1);
      ctx.fillRect(nx - 3, ny + 20, 2, 13);
      ctx.fillText(label, nx + 3, ny + 22);
    }
    // Destello al aparecer
    if (t < 0.12) {
      ctx.fillStyle = 'rgba(255,255,255,' + (1 - t / 0.12) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  // El jefe dibujado en grande (si todavía no hay retrato)
  function drawBossBig(ctx, boss, cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-(boss.x + boss.w / 2), -(boss.y + boss.h / 2));
    const hidden = boss.hidden;
    boss.hidden = false;
    boss.drawLook(ctx);
    boss.hidden = hidden;
    ctx.restore();
  }

  // Destello y colores separados encima de todo (en el lienzo real)
  function drawPost(ctx) {
    if (split > 0 && Light.quality() >= 2) {
      const c = ctx.canvas;
      if (!copy || copy.width !== c.width || copy.height !== c.height) {
        copy = document.createElement('canvas');
        copy.width = c.width;
        copy.height = c.height;
        tint = document.createElement('canvas');
        tint.width = c.width;
        tint.height = c.height;
      }
      const k = split / CONFIG.BOSS_SHOW.SPLIT;
      const d = Math.round(Math.min(2.5, k) * 2 * (c.width / W));
      const cctx = copy.getContext('2d');
      cctx.clearRect(0, 0, c.width, c.height);
      cctx.drawImage(c, 0, 0);
      const tctx = tint.getContext('2d');
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(0.55, 0.3 * k);
      [['#ff0040', d], ['#00c8ff', -d]].forEach(function (pair) {
        tctx.globalCompositeOperation = 'source-over';
        tctx.clearRect(0, 0, c.width, c.height);
        tctx.drawImage(copy, 0, 0);
        tctx.globalCompositeOperation = 'multiply';
        tctx.fillStyle = pair[0];
        tctx.fillRect(0, 0, c.width, c.height);
        tctx.globalCompositeOperation = 'destination-in';
        tctx.drawImage(copy, 0, 0);
        ctx.drawImage(tint, pair[1], 0);
      });
      ctx.restore();
    }
    if (flash > 0) {
      ctx.fillStyle = 'rgba(255, 250, 235, ' + Math.min(0.7, flash * 3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  return {
    reset: reset,
    startIntro: startIntro,
    startBar: startBar,
    updateIntro: updateIntro,
    introOn: introOn,
    onHit: onHit,
    onDefeat: onDefeat,
    timeScale: timeScale,
    update: update,
    drawWorld: drawWorld,
    drawBar: drawBar,
    drawIntro: drawIntro,
    drawPost: drawPost,
    drawNote: drawNote,
    phase: function () { return phase; },
    burstAt: function (x, y, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 40 + Math.random() * 120;
        notes.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, t: 0,
                     life: 1 + Math.random(), color: NOTE_COLORS[i % NOTE_COLORS.length], kind: i % 3, spin: 0 });
      }
    },
    ring: function (x, y, r, color, life) { rings.push({ x: x, y: y, t: 0, life: life || 0.6, r: r, color: color || '#ffffff' }); }
  };
})();
