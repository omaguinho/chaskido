// Prólogo: "La noche en que se fue la música".
// Tres escenas, una por sala (el dato "scene" de cada sala en levels.js):
//   p1 · fiesta: la Ciudad Ocaso de noche, a todo color y con el blues sonando:
//        guirnaldas con faroles, gente que baila, la banda y fuegos artificiales.
//        Al llegar a la plaza llega el Silencio: la música se frena, las notas
//        salen volando hacia su máquina, los colores se apagan y la plaza se hunde.
//   p2 · bajo: bajo la ciudad, a oscuras. La papa despierta con su propia luz; los
//        botones aparecen dibujados donde hacen falta (sin carteles). Mini misión,
//        el Eco del Silencio (da el diapasón) y el camino que se abre con él.
//   p3 · caída: una caída larguísima del anochecer al día. Las notas sueltas suben
//        y se pueden atrapar (cada una suena más aguda); aparece el título y la papa
//        cae en la Sala 1 (Calles del Ocaso).
// El juego crea la escena con Scenes.create(data, game) al entrar a la sala y llama
// a update, drawSky, drawMid, drawFront, drawScreen y lights. Ajustes en CONFIG.PROLOGUE.
const Scenes = (function () {
  const W = CONFIG.WIDTH;
  const H = CONFIG.HEIGHT;
  const T = CONFIG.TILE;
  const INK = '#2e2a47';
  const NPC_COLORS = ['#f2a28c', '#e8c58e', '#c9b8e3', '#8fbf9a', '#f4b6c2', '#9fd3e0', '#d98b6a', '#f7e3a1'];
  const FLAG_COLORS = ['#ff6b8a', '#ffd34d', '#7be0a0', '#9fd3e0', '#c9b8ff', '#ff9a6b'];

  // ---------- Utilidades ----------

  // Número pseudoaleatorio fijo a partir de una semilla (el cielo no cambia de una vez a otra)
  function rand(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function mix(a, b, k) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const r = Math.round((pa >> 16 & 255) + ((pb >> 16 & 255) - (pa >> 16 & 255)) * k);
    const g = Math.round((pa >> 8 & 255) + ((pb >> 8 & 255) - (pa >> 8 & 255)) * k);
    const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * k);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function smooth(k) {
    k = clamp01(k);
    return k * k * (3 - 2 * k);
  }

  // Edificios de la ciudad a lo lejos (dos capas), siempre iguales
  const SKYLINE = [0, 1].map(function (layer) {
    const list = [];
    let x = 0;
    let i = 0;
    while (x < 640) {
      const w = 18 + Math.floor(rand(i + layer * 50) * 26);
      const h = (layer ? 30 : 18) + Math.floor(rand(i * 3 + layer * 70) * (layer ? 40 : 34));
      list.push({ x: x, w: w, h: h, seed: i + layer * 100, roof: Math.floor(rand(i * 7 + layer) * 3) });
      x += w + Math.floor(rand(i * 5 + layer * 30) * 6);
      i++;
    }
    return list;
  });

  const STARS = [];
  for (let i = 0; i < 70; i++) STARS.push({ x: rand(i) * W, y: rand(i + 200) * H * 0.65, s: rand(i + 400), tw: rand(i + 600) * 6 });

  // ---------- Cielo nocturno con ciudad (fiesta y pantalla de inicio) ----------

  function drawNightSky(ctx, camX, time, opts) {
    const o = opts || {};
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, o.top || '#0b0620');
    grad.addColorStop(0.6, o.mid || '#2a1650');
    grad.addColorStop(1, o.bottom || '#5a2a6a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Estrellas que titilan
    STARS.forEach(function (s) {
      const a = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 1.7 + s.tw))) * (o.stars === undefined ? 1 : o.stars);
      if (a <= 0.02) return;
      ctx.globalAlpha = a;
      ctx.fillStyle = s.s > 0.85 ? '#ffe9b8' : '#ffffff';
      const x = Math.round((s.x - camX * 0.02 + W) % W);
      ctx.fillRect(x, Math.round(s.y), s.s > 0.92 ? 2 : 1, 1);
    });
    ctx.globalAlpha = 1;
    // Luna
    if (o.moon !== false) {
      Light.drawGlow(ctx, 262, 34, 40, '#f7e3a1', 0.35 * (o.lights === undefined ? 1 : o.lights));
      ctx.fillStyle = '#fbf6ec';
      ctx.beginPath();
      ctx.arc(262, 34, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = o.top || '#0b0620';
      ctx.beginPath();
      ctx.arc(267, 30, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    drawSkyline(ctx, camX, time, o);
  }

  // Dos capas de edificios con ventanas encendidas (lights: 0 a 1)
  function drawSkyline(ctx, camX, time, o) {
    const lights = o.lights === undefined ? 1 : o.lights;
    [{ layer: 1, speed: 0.12, base: H - 34, color: o.far || '#2b1a4e', win: '#ffb35c' },
     { layer: 0, speed: 0.3, base: H - 10, color: o.near || '#1b1035', win: '#ffd34d' }].forEach(function (L) {
      const off = (camX * L.speed) % 640;
      SKYLINE[L.layer].forEach(function (b) {
        let x = Math.round(b.x - off);
        if (x + b.w < 0) x += 640;
        if (x > W) return;
        const top = L.base - b.h;
        ctx.fillStyle = L.color;
        ctx.fillRect(x, top, b.w, H - top);
        // Techos: plano, a dos aguas o con antena
        if (b.roof === 1) {
          ctx.beginPath();
          ctx.moveTo(x - 1, top);
          ctx.lineTo(x + b.w / 2, top - 7);
          ctx.lineTo(x + b.w + 1, top);
          ctx.fill();
        } else if (b.roof === 2) {
          ctx.fillRect(x + Math.floor(b.w / 2), top - 9, 1, 9);
          ctx.fillStyle = '#ff4d6d';
          if (Math.floor(time * 1.5 + b.seed) % 2 === 0) ctx.fillRect(x + Math.floor(b.w / 2), top - 10, 1, 1);
        }
        // Ventanas
        if (lights <= 0.02) return;
        for (let wy = top + 4; wy < H - 4; wy += 7) {
          for (let wx = x + 3; wx < x + b.w - 3; wx += 6) {
            const r = rand(b.seed * 31 + wx * 7 + wy * 3);
            if (r > (L.layer ? 0.3 : 0.22)) continue;
            ctx.globalAlpha = lights * (r < 0.1 ? 0.55 + 0.45 * Math.sin(time * 3 + r * 50) : 0.85);
            ctx.fillStyle = L.win;
            ctx.fillRect(wx, wy, 2, 3);
          }
        }
        ctx.globalAlpha = 1;
      });
    });
  }

  // La máquina del Silencio en el cielo (cx, cy en pantalla; k = qué tanto se ve)
  function drawMachine(ctx, cx, cy, time, eyeOpen, k) {
    if (k <= 0) return;
    // Con dibujo (assets/bg/silencio_maquina.png) se usa él
    if (Sprites.has('silencio_maquina')) {
      ctx.globalAlpha = k;
      Sprites.drawFrame(ctx, 'silencio_maquina', 0, Math.round(cx) - 80, Math.round(cy) - 40, false);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.save();
    ctx.globalAlpha = k;
    ctx.translate(Math.round(cx), Math.round(cy));
    // Antenas
    ctx.strokeStyle = INK;
    ctx.fillStyle = '#5b5478';
    [-40, -14, 22, 46].forEach(function (x, i) {
      ctx.fillRect(x, -30 - i % 2 * 8, 2, 20);
      ctx.fillStyle = Math.floor(time * 2 + i) % 3 === 0 ? '#e6e2f0' : '#5b5478';
      ctx.fillRect(x - 1, -32 - i % 2 * 8, 4, 3);
      ctx.fillStyle = '#5b5478';
    });
    // Disco
    ctx.fillStyle = '#3a3550';
    ctx.beginPath();
    ctx.ellipse(0, 0, 78, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#8a8296';
    ctx.beginPath();
    ctx.ellipse(0, -6, 66, 14, 0, Math.PI, 0);
    ctx.fill();
    // Placas de abajo
    ctx.fillStyle = '#2a2540';
    for (let i = -3; i <= 3; i++) ctx.fillRect(i * 18 - 6, 12, 12, 5 + (3 - Math.abs(i)) * 2);
    // Luces del borde que giran
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2 + time * 0.8;
      const lx = Math.cos(a) * 72;
      const ly = Math.sin(a) * 20;
      if (ly < -2) continue;
      ctx.fillStyle = i % 2 ? '#e6e2f0' : '#9a93b0';
      ctx.fillRect(Math.round(lx), Math.round(ly), 2, 2);
    }
    // El ojo
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e6e2f0';
    ctx.beginPath();
    ctx.ellipse(0, 2, 15, 9 * eyeOpen, 0, 0, Math.PI * 2);
    ctx.fill();
    if (eyeOpen > 0.3) {
      ctx.fillStyle = '#5b5478';
      ctx.beginPath();
      ctx.arc(Math.sin(time * 0.9) * 5, 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(Math.sin(time * 0.9) * 5, 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------- Gente de la fiesta ----------

  // kind: 'baila', 'aplaude', 'tambor', 'flauta', 'cuerdas'. beat: 0 a 1 (pulso)
  // Con dibujos (gente1..4_bailar / _quieto, musico_tambor / flauta / cuerdas) se usan
  // ellos; si faltan, se dibuja con código
  function drawNpcSprite(ctx, x, feet, kind, time, still, seed) {
    const musician = kind === 'tambor' || kind === 'flauta' || kind === 'cuerdas';
    const name = musician ? 'musico_' + kind : 'gente' + (1 + seed % 4) + (still ? '_quieto' : '_bailar');
    if (!Sprites.has(name)) return false;
    return Sprites.drawAnchored(ctx, name, still ? 0 : Sprites.frameAt(name, time), x, feet, seed % 2 === 1);
  }

  function drawNpc(ctx, x, feet, kind, color, time, phase, still, seed) {
    if (drawNpcSprite(ctx, x, feet, kind, time, still, seed)) return;
    const bounce = still ? 0 : Math.round(Math.abs(Math.sin(phase * Math.PI)) * 2);
    const by = feet - 14 - bounce;
    const cx = Math.round(x);
    const up = !still && Math.floor(time * 2 + seed) % 2 === 0;
    // Piernas
    ctx.fillStyle = INK;
    ctx.fillRect(cx - 3, feet - 3, 2, 3);
    ctx.fillRect(cx + 1, feet - 3, 2, 3);
    // Brazos
    ctx.fillStyle = mix(color, INK, 0.35);
    if (kind === 'baila') {
      ctx.fillRect(cx - 7, by + (up ? 0 : 5), 2, 5);
      ctx.fillRect(cx + 5, by + (up ? 5 : 0), 2, 5);
    } else if (kind === 'aplaude') {
      const close = !still && phase < 0.3;
      ctx.fillRect(cx - (close ? 3 : 6), by + 4, 2, 4);
      ctx.fillRect(cx + (close ? 1 : 4), by + 4, 2, 4);
    } else {
      ctx.fillRect(cx - 6, by + 6, 2, 4);
      ctx.fillRect(cx + 4, by + 6, 2, 4);
    }
    // Cuerpo redondo (papas, ocas y otros tubérculos del pueblo)
    ctx.fillStyle = color;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, by + 6, 5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(46,42,71,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx + 1, by + 9, 4, 4, 0, 0, Math.PI);
    ctx.fill();
    // Ojos (cerrados si está quieto)
    ctx.fillStyle = INK;
    if (still) {
      ctx.fillRect(cx - 3, by + 4, 2, 1);
      ctx.fillRect(cx + 1, by + 4, 2, 1);
    } else {
      ctx.fillRect(cx - 2, by + 3, 1, 2);
      ctx.fillRect(cx + 2, by + 3, 1, 2);
    }
    // Sombrero de ala (algunos)
    if (seed % 3 === 0) {
      ctx.fillStyle = FLAG_COLORS[seed % FLAG_COLORS.length];
      ctx.fillRect(cx - 6, by - 2, 12, 2);
      ctx.fillRect(cx - 3, by - 5, 6, 3);
      ctx.fillStyle = INK;
      ctx.fillRect(cx - 3, by - 3, 6, 1);
    }
    // Instrumento
    if (kind === 'tambor') {
      ctx.fillStyle = '#d98b6a';
      ctx.fillRect(cx - 5, by + 9, 10, 6);
      ctx.fillStyle = '#fbf6ec';
      ctx.fillRect(cx - 5, by + 9, 10, 2);
      ctx.fillStyle = INK;
      ctx.fillRect(cx - 4, by + 11, 1, 4);
      ctx.fillRect(cx + 3, by + 11, 1, 4);
    } else if (kind === 'flauta') {
      ctx.fillStyle = '#e8c58e';
      for (let i = 0; i < 5; i++) ctx.fillRect(cx - 4 + i * 2, by + 6, 1, 4 + i);
    } else if (kind === 'cuerdas') {
      ctx.fillStyle = '#a0683a';
      ctx.beginPath();
      ctx.ellipse(cx + 1, by + 10, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx + 4, by + 2, 1, 8);
    }
  }

  // ---------- Botones dibujados (sin carteles) ----------

  // Íconos de los botones del mando (estilo PlayStation) o la tecla
  const BUTTONS = {
    move:   { pad: 'stick',    key: 'A D',     label: 'moverse' },
    jump:   { pad: 'cross',    key: 'Espacio', label: 'saltar' },
    up:     { pad: 'cross',    key: 'Espacio', label: 'salta: se cruza desde abajo' },
    down:   { pad: 'down',     key: 'S',       label: 'abajo: bajar' },
    zapateo:{ pad: 'down',     key: 'S',       label: '+ salto en el aire: zapateo' },
    run:    { pad: 'square',   key: 'E',       label: 'mantén: correr' },
    action: { pad: 'square',   key: 'E',       label: 'usar' },
    tuner:  { pad: 'triangle', key: 'F',       label: 'toque: La · mantén: Si' },
    stomp:  { pad: 'cross',    key: 'Espacio', label: 'cae encima' }
  };

  function drawPadIcon(ctx, x, y, shape) {
    ctx.fillStyle = '#1b1035';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e6e2f0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (shape === 'cross') {
      ctx.strokeStyle = '#9fd3ff';
      ctx.moveTo(x - 2.5, y - 2.5); ctx.lineTo(x + 2.5, y + 2.5);
      ctx.moveTo(x + 2.5, y - 2.5); ctx.lineTo(x - 2.5, y + 2.5);
    } else if (shape === 'square') {
      ctx.strokeStyle = '#ff9ad5';
      ctx.rect(x - 2.5, y - 2.5, 5, 5);
    } else if (shape === 'down') {
      ctx.fillStyle = '#e6e2f0';
      ctx.fillRect(x - 1.5, y - 3.5, 3, 4);
      ctx.beginPath();
      ctx.moveTo(x - 3.5, y);
      ctx.lineTo(x + 3.5, y);
      ctx.lineTo(x, y + 3.5);
      ctx.closePath();
      ctx.fill();
    } else if (shape === 'stick') {
      ctx.strokeStyle = '#e6e2f0';
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.moveTo(x - 5, y); ctx.lineTo(x - 4, y);
      ctx.moveTo(x + 4, y); ctx.lineTo(x + 5, y);
    } else if (shape === 'triangle') {
      ctx.strokeStyle = '#7be0a0';
      ctx.moveTo(x, y - 3); ctx.lineTo(x + 3, y + 2.5); ctx.lineTo(x - 3, y + 2.5); ctx.closePath();
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // Burbuja con el botón y lo que hace, sobre el mundo
  function drawButtonHint(ctx, x, y, id, alpha) {
    const B = BUTTONS[id];
    if (!B || alpha <= 0.01) return;
    const pad = Input.device && Input.device() === 'pad';
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = gameFont(6);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const keyW = pad ? 12 : ctx.measureText(tr(B.key)).width + 6;
    const w = keyW + ctx.measureText(tr(B.label)).width + 8;
    const bx = Math.round(x - w / 2);
    const by = Math.round(y - 7);
    ctx.fillStyle = 'rgba(11, 6, 32, 0.72)';
    ctx.fillRect(bx, by, w, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(bx, by, w, 1);
    if (pad) {
      drawPadIcon(ctx, bx + 8, by + 7, B.pad);
    } else {
      ctx.fillStyle = '#e6e2f0';
      ctx.fillRect(bx + 3, by + 2, keyW - 2, 10);
      ctx.fillStyle = '#1b1035';
      ctx.fillText(tr(B.key), bx + 5, by + 7);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tr(B.label), bx + keyW + 5, by + 7);
    ctx.restore();
  }

  // Botones dibujados en el mundo: aparecen cerca de la papa (y solo con el poder que piden)
  function makeHints(list) {
    return (list || []).map(function (h) { return { x: h[0] * T + 8, y: h[1] * T - 6, id: h[2], need: h[3] || null, a: 0 }; });
  }

  function updateHints(hints, dt, p) {
    hints.forEach(function (h) {
      const near = Math.abs(p.x + p.w / 2 - h.x) < 56 && Math.abs(p.y + p.h / 2 - h.y) < 48;
      const ok = !h.need || p.has(h.need);
      h.a += ((near && ok ? 1 : 0) - h.a) * Math.min(1, dt * 6);
    });
  }

  function drawHints(ctx, hints, t) {
    hints.forEach(function (h) { drawButtonHint(ctx, h.x, h.y + Math.sin(t * 3) * 1.5, h.id, h.a); });
  }

  // ---------- Escena 1: la fiesta ----------

  function Fiesta(data, game) {
    this.data = data;
    this.t = 0;
    this.event = null;           // el Silencio: { t }
    this.notes = [];             // notas que se van volando
    this.fireworks = [];
    this.debris = [];
    this.lastBeat = 0;
    this.beatCount = 0;
    this.lanterns = [];
    this.flags = [];
    this.buildGarlands();
    this.crowd = (data.crowd || []).map(function (c, i) {
      return { x: c[0] * T + 8, feet: (c[1] + 1) * T, kind: c[2] || 'baila', color: NPC_COLORS[(c[3] === undefined ? i : c[3]) % NPC_COLORS.length], seed: i };
    });
    this.hints = makeHints(data.hints);
    this.hudHidden = true;
    Backdrop.set('none');
  }

  // Guirnaldas entre postes: banderitas y faroles colgando
  Fiesta.prototype.buildGarlands = function () {
    const poles = (this.data.poles || []).map(function (p) { return { x: p[0] * T + 8, y: p[1] * T - 36 }; });
    this.poles = poles;
    for (let i = 0; i + 1 < poles.length; i++) {
      const a = poles[i];
      const b = poles[i + 1];
      if (b.x - a.x > 14 * T) continue;     // postes muy separados: no se unen
      const n = Math.max(4, Math.round((b.x - a.x) / 7));
      for (let j = 1; j < n; j++) {
        const k = j / n;
        const sag = Math.sin(k * Math.PI) * 14;
        const x = a.x + (b.x - a.x) * k;
        const y = a.y + (b.y - a.y) * k + sag;
        if (j % 4 === 2) this.lanterns.push({ x: x, y: y + 2, seed: i * 10 + j, off: -1, color: FLAG_COLORS[(i + j) % FLAG_COLORS.length] });
        else this.flags.push({ x: x, y: y, color: FLAG_COLORS[(i * 3 + j) % FLAG_COLORS.length], seed: j });
      }
    }
  };

  Fiesta.prototype.music = function (game) {
    Music.setRate(game.level.rate);
    Music.play('main');
    game.musicNear = 1;
    Music.setNear(1);
  };

  Fiesta.prototype.holdsPlayer = function () {
    return !!this.event && this.event.t < CONFIG.PROLOGUE.COLLAPSE_AT;
  };

  Fiesta.prototype.update = function (dt, game) {
    this.t += dt;
    const level = game.level;
    const phase = level.beatPhase();
    if (phase < this.lastBeat) this.onBeat(game);
    this.lastBeat = phase;
    // La música no se apaga sola en esta sala
    updateHints(this.hints, dt, game.player);
    if (!this.event) {
      game.musicNear = 1;
      Music.setNear(1);
      const plaza = this.data.plaza || [0, 0];
      if (game.player.x / T >= plaza[0]) this.startSilence(game);
    } else {
      this.updateSilence(dt, game);
    }
    this.fireworks.forEach(function (f) {
      f.t += dt;
      f.parts.forEach(function (p) {
        p.vy += 40 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      });
    });
    this.fireworks = this.fireworks.filter(function (f) { return f.t < 1.6; });
    this.notes.forEach(function (n) {
      n.t += dt;
      const k = smooth(n.t / n.time);
      const target = this.machineWorld(game);
      n.x = n.x0 + (target.x - n.x0) * k + Math.sin(n.t * 5 + n.seed) * 10 * (1 - k);
      n.y = n.y0 + (target.y - n.y0) * k - Math.sin(k * Math.PI) * 30;
    }, this);
    this.notes = this.notes.filter(function (n) { return n.t < n.time; });
    this.debris.forEach(function (d) {
      d.vy += 600 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.t += dt;
    });
    this.debris = this.debris.filter(function (d) { return d.t < 1.5; });
    this.crowd.forEach(function (c) {
      if (c.vy === undefined) return;
      c.vy += 600 * dt;
      c.feet += c.vy * dt;
    });
  };

  // En cada tiempo: la banda suelta notas y, cada 2 tiempos, un fuego artificial
  Fiesta.prototype.onBeat = function (game) {
    this.beatCount++;
    if (this.event) return;
    if (this.beatCount % 2 === 0) {
      const parts = [];
      const color = FLAG_COLORS[this.beatCount % FLAG_COLORS.length];
      const n = 22;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        const v = 30 + rand(this.beatCount * 13 + i) * 22;
        parts.push({ x: 0, y: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v });
      }
      this.fireworks.push({ x: 30 + rand(this.beatCount) * (W - 60), y: 18 + rand(this.beatCount + 9) * 50, t: 0, color: color, parts: parts });
    }
  };

  Fiesta.prototype.startSilence = function (game) {
    this.event = { t: 0, crack: 0, collapsed: false };
    Sfx.play('silencio');
    game.player.vx = 0;
  };

  Fiesta.prototype.machineScreen = function () {
    const e = this.event;
    const k = e ? smooth((e.t - 0.3) / 2.5) : 0;
    return { x: W / 2, y: -70 + k * 112, k: k };
  };

  Fiesta.prototype.machineWorld = function (game) {
    const m = this.machineScreen();
    return { x: game.camera.x + m.x, y: game.camera.y + m.y };
  };

  Fiesta.prototype.updateSilence = function (dt, game) {
    const e = this.event;
    const P = CONFIG.PROLOGUE;
    const before = e.t;
    e.t += dt;
    const level = game.level;
    // La música se frena como una cinta y se apaga
    const k = clamp01(e.t / 2.2);
    Music.setRate(level.rate * (1 - 0.7 * smooth(e.t / 1.8)));
    game.musicNear = 1 - smooth(k);
    Music.setNear(game.musicNear);
    // Los colores se van y se hace de noche cerrada
    Light.setDesat(0.9 * smooth((e.t - 1.2) / 2.6));
    Light.setDark(level.dark + (0.78 - level.dark) * smooth((e.t - 1) / 3));
    Backdrop.setMuted(e.t > 2);
    // Faroles que se apagan uno por uno (de derecha a izquierda)
    this.lanterns.forEach(function (l, i) {
      if (l.off < 0 && e.t > 1.2 + (this.lanterns.length - i) * 0.08) {
        l.off = e.t;
        this.addNote(l.x, l.y, l.color, 1.4 + rand(i) * 0.8);
      }
    }, this);
    // La gente suelta su música (notas que suben hacia la máquina)
    if (e.t > 1 && e.t < 3.6 && Math.floor(e.t * 10) !== Math.floor(before * 10)) {
      const c = this.crowd[Math.floor(rand(e.t * 100) * this.crowd.length)];
      if (c) this.addNote(c.x, c.feet - 14, NPC_COLORS[c.seed % NPC_COLORS.length], 1.6 + rand(e.t) * 0.8);
    }
    // Grietas y temblor
    if (e.t > 3.6) e.crack = clamp01((e.t - 3.6) / (P.COLLAPSE_AT - 3.6));
    if (before < 3.6 && e.t >= 3.6) Sfx.play('walls');
    if (!e.collapsed && e.t >= P.COLLAPSE_AT) this.collapse(game);
  };

  Fiesta.prototype.addNote = function (x, y, color, time) {
    this.notes.push({ x0: x, y0: y, x: x, y: y, t: 0, time: time, color: color, seed: this.notes.length, kind: this.notes.length % 3 });
  };

  // La plaza se hunde: se borran las celdas y cae todo
  Fiesta.prototype.collapse = function (game) {
    const e = this.event;
    e.collapsed = true;
    const C = this.data.collapse;
    if (!C) return;
    for (let ty = C[2]; ty <= C[3]; ty++) {
      for (let tx = C[0]; tx <= C[1]; tx++) {
        game.level.setTile(tx, ty, '.');
        for (let i = 0; i < 2; i++) {
          this.debris.push({ x: tx * T + rand(tx * 9 + ty + i) * T, y: ty * T + 4, vx: (rand(tx + ty * 5 + i) - 0.5) * 80,
                             vy: -60 - rand(tx * 3 + i) * 80, t: 0, s: 3 + Math.floor(rand(tx + i) * 4) });
        }
      }
    }
    this.crowd.forEach(function (c) {
      if (c.x >= C[0] * T && c.x <= (C[1] + 1) * T && c.feet <= (C[2] + 1) * T) c.vy = -40 - rand(c.seed) * 60;
    });
    Sfx.play('collapse');
    const R = CONFIG.SFX.RUMBLE.BOSS_ROAR;
    Input.rumble(R.TIME, R.STRONG, R.WEAK);
    game.player.vy = 40;
    game.screenShake = 0.8;
  };

  Fiesta.prototype.drawSky = function (ctx, game) {
    const e = this.event;
    const lightsK = e ? 1 - smooth((e.t - 1) / 2) : 1;
    drawNightSky(ctx, game.camera.x, this.t, { lights: lightsK, stars: e ? 1 - smooth((e.t - 0.5) / 2) : 1 });
    // Fuegos artificiales (se suman a lo que hay)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.fireworks.forEach(function (f) {
      const a = 1 - f.t / 1.6;
      f.parts.forEach(function (p) {
        ctx.globalAlpha = a;
        ctx.fillStyle = f.color;
        ctx.fillRect(Math.round(f.x + p.x), Math.round(f.y + p.y), 2, 2);
        ctx.globalAlpha = a * 0.4;
        ctx.fillRect(Math.round(f.x + p.x * 0.85), Math.round(f.y + p.y * 0.85), 1, 1);
      });
      if (f.t < 0.15) Light.drawGlow(ctx, f.x, f.y, 30, f.color, 0.8 * (1 - f.t / 0.15));
    });
    ctx.restore();
    if (e) {
      const m = this.machineScreen();
      // Rayo pálido que chupa las notas
      if (e.t > 1 && e.t < 4.4) {
        const a = Math.min(1, (e.t - 1) * 2) * (1 - clamp01((e.t - 3.8) / 0.6));
        const g = ctx.createLinearGradient(0, m.y, 0, H);
        g.addColorStop(0, 'rgba(230,226,240,' + (0.35 * a) + ')');
        g.addColorStop(1, 'rgba(230,226,240,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(m.x - 12, m.y + 6);
        ctx.lineTo(m.x + 12, m.y + 6);
        ctx.lineTo(m.x + 90, H);
        ctx.lineTo(m.x - 90, H);
        ctx.fill();
      }
      drawMachine(ctx, m.x, m.y, this.t, smooth((e.t - 1.2) / 0.8), m.k);
    }
  };

  // Guirnaldas, postes y gente (detrás de la papa)
  Fiesta.prototype.drawMid = function (ctx, game) {
    const phase = game.level.beatPhase();
    const e = this.event;
    const still = !!e && e.t > 0.8;
    const pulse = Light.pulse();
    // Postes
    this.poles.forEach(function (p) {
      ctx.fillStyle = '#5c3a20';
      ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 36);
      ctx.fillStyle = INK;
      ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 5, 3);
    });
    // Cuerda de las guirnaldas
    ctx.strokeStyle = 'rgba(46,42,71,0.9)';
    ctx.lineWidth = 1;
    for (let i = 0; i + 1 < this.poles.length; i++) {
      const a = this.poles[i];
      const b = this.poles[i + 1];
      if (b.x - a.x > 14 * T) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + 28, b.x, b.y);
      ctx.stroke();
    }
    // Banderitas que se mecen
    this.flags.forEach(function (f) {
      const sway = still ? 0 : Math.sin(this.t * 3 + f.seed) * 1.5;
      // Con dibujo (banderita_fiesta.png, un cuadro por color) se usa él
      if (Sprites.drawFrame(ctx, 'banderita_fiesta', FLAG_COLORS.indexOf(f.color), Math.round(f.x - 4 + sway * 0.5), Math.round(f.y), false)) return;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.moveTo(f.x - 3, f.y);
      ctx.lineTo(f.x + 3, f.y);
      ctx.lineTo(f.x + sway, f.y + 7);
      ctx.fill();
    }, this);
    // Faroles
    this.lanterns.forEach(function (l) {
      const on = l.off < 0;
      const sway = still ? 0 : Math.sin(this.t * 2 + l.seed) * 1.5;
      const x = Math.round(l.x + sway);
      const y = Math.round(l.y);
      if (Sprites.drawFrame(ctx, 'farol_papel', on ? 0 : 1, x - 7, y - 2, false)) return;
      ctx.fillStyle = INK;
      ctx.fillRect(x - 3, y - 1, 7, 1);
      ctx.fillStyle = on ? l.color : '#5b5478';
      ctx.beginPath();
      ctx.ellipse(x + 0.5, y + 4, 3.5, 4.5 * (1 + (on ? pulse * 0.15 : 0)), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = on ? '#fff6e0' : '#3a3050';
      ctx.fillRect(x - 1, y + 2, 3, 3);
    }, this);
    // Gente
    this.crowd.forEach(function (c) {
      drawNpc(ctx, c.x, c.feet, c.kind, c.color, this.t + c.seed * 0.37, (phase + c.seed * 0.13) % 1, still, c.seed);
      // Los músicos sueltan notitas mientras suena
      if (!e && (c.kind === 'tambor' || c.kind === 'flauta' || c.kind === 'cuerdas')) {
        const k = (this.t * 0.8 + c.seed * 0.3) % 1;
        ctx.globalAlpha = 1 - k;
        BossShow.drawNote(ctx, c.x + 4 + Math.sin(k * 6 + c.seed) * 4, c.feet - 22 - k * 22, FLAG_COLORS[c.seed % FLAG_COLORS.length], c.seed % 3);
        ctx.globalAlpha = 1;
      }
    }, this);
  };

  Fiesta.prototype.drawFront = function (ctx, game) {
    const e = this.event;
    if (!e) drawHints(ctx, this.hints, this.t);
    // Grietas en la plaza
    if (e && e.crack > 0 && this.data.collapse) {
      const C = this.data.collapse;
      const y = C[2] * T;
      ctx.strokeStyle = '#0b0620';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const x0 = C[0] * T;
      const x1 = (C[1] + 1) * T;
      const len = (x1 - x0) * e.crack;
      ctx.moveTo(x0, y + 3);
      for (let x = x0; x < x0 + len; x += 5) ctx.lineTo(x, y + 2 + rand(x) * 6);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    // Escombros
    this.debris.forEach(function (d) {
      ctx.fillStyle = '#7a6a88';
      ctx.fillRect(Math.round(d.x), Math.round(d.y), d.s, d.s);
      ctx.fillStyle = INK;
      ctx.fillRect(Math.round(d.x), Math.round(d.y) + d.s - 1, d.s, 1);
    });
    // Notas que se van (de color a gris)
    this.notes.forEach(function (n) {
      const k = n.t / n.time;
      const col = mix(n.color, '#9a93b0', smooth(k * 1.3));
      Light.drawGlow(ctx, n.x, n.y, 8, col, 0.7 * (1 - k));
      ctx.globalAlpha = 1 - k * 0.6;
      BossShow.drawNote(ctx, n.x, n.y, col, n.kind);
    });
    ctx.globalAlpha = 1;
  };

  Fiesta.prototype.drawScreen = function (ctx, game) {
    // Título del prólogo, con franjas de cine
    const t = this.t;
    const bars = this.event ? smooth(this.event.t / 0.8) * 16 : (1 - smooth((t - 6) / 1)) * 16;
    if (bars > 0.5) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, Math.round(bars));
      ctx.fillRect(0, H - Math.round(bars), W, Math.round(bars));
    }
    if (t < 6.5 && !this.event) {
      const a = smooth((t - 0.6) / 0.8) * (1 - smooth((t - 5.4) / 1));
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = gameFont(6);
      ctx.fillStyle = '#c9b8e3';
      ctx.fillText(tr('P R Ó L O G O'), W / 2, 30);
      ctx.font = gameFont(8);
      ctx.fillStyle = '#000000';
      ctx.fillText(tr('La noche en que se fue la música'), W / 2 + 1, 43);
      ctx.fillStyle = '#fff6e0';
      ctx.fillText(tr('La noche en que se fue la música'), W / 2, 42);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
  };

  Fiesta.prototype.lights = function (list, beat) {
    const S = CONFIG.LIGHT.SOURCES;
    this.lanterns.forEach(function (l) {
      if (l.off >= 0) return;
      list.push({ x: l.x, y: l.y + 4, r: S.farol.R * 0.8 * beat, color: l.color, glow: 0.7 });
    });
  };

  // ---------- Escena 2: bajo la ciudad ----------

  function Bajo(data, game, arrive) {
    this.data = data;
    this.t = 0;
    this.hudHidden = false;
    // Despertar: solo si se llega cayendo desde la fiesta
    this.wake = arrive && arrive.from === 'p1' ? 0 : -1;
    if (this.wake >= 0) Light.setDark(1);
    this.hints = makeHints(data.hints);
  }

  Bajo.prototype.holdsPlayer = function () {
    return this.wake >= 0 && this.wake < 1.6;
  };

  Bajo.prototype.update = function (dt, game) {
    this.t += dt;
    if (this.wake >= 0 && this.wake < 3) {
      this.wake += dt;
      const goal = game.level.dark;
      Light.setDark(1 - (1 - goal) * smooth((this.wake - 0.6) / 1.6));
    }
    updateHints(this.hints, dt, game.player);
  };

  Bajo.prototype.drawFront = function (ctx) {
    drawHints(ctx, this.hints, this.t);
  };

  // ---------- Escena 3: la gran caída ----------

  function Caida(data, game) {
    this.data = data;
    this.t = 0;
    this.ownsWorld = true;
    this.hudHidden = true;
    this.caught = 0;
    this.notes = [];
    this.clouds = [];
    this.lines = [];
    this.popups = [];
    this.nextNote = 1.2;
    this.done = false;
    this.titleSound = false;
    for (let i = 0; i < 9; i++) this.addCloud(rand(i * 7) * H * 1.5);
    Backdrop.set('none');
    Backdrop.setMuted(false);
    Light.setDark(0);
    Light.setDesat(0);
    const p = game.player;
    p.x = W / 2 - p.w / 2;
    p.y = 64;
    p.vx = 0;
    p.vy = 0;
    p.anim = 'papa_caida';
    game.tip = null;
    game.message = null;
    Sfx.play('wind');
  }

  Caida.prototype.addCloud = function (y) {
    const near = Math.random() < 0.3;
    this.clouds.push({ x: Math.random() * (W + 80) - 40, y: y === undefined ? H + 30 : y, w: 40 + Math.random() * 70,
                       speed: near ? 220 + Math.random() * 80 : 50 + Math.random() * 60, near: near, seed: Math.random() * 100 });
  };

  Caida.prototype.music = function (game) {
    Music.setRate(0.7);
    Music.play('main');
    game.musicNear = 0;
    Music.setNear(0);
  };

  Caida.prototype.progress = function () {
    return clamp01(this.t / CONFIG.PROLOGUE.FALL_TIME);
  };

  Caida.prototype.update = function (dt, game) {
    const P = CONFIG.PROLOGUE;
    this.t += dt;
    const k = this.progress();
    const p = game.player;
    // La música vuelve con el día: de lenta y lejana a su velocidad
    game.musicNear = 0.15 + 0.7 * smooth(k * 1.2);
    Music.setNear(game.musicNear);
    Music.setRate(0.7 + 0.3 * smooth(k * 1.3));
    // La papa se mueve de lado (con algo de inercia) y se mece
    const axis = Input.axisX();
    p.vx += (axis * P.FALL_SPEED - p.vx) * Math.min(1, dt * 5);
    p.x = Math.max(8, Math.min(W - 8 - p.w, p.x + p.vx * dt));
    p.y = 64 + Math.sin(this.t * 1.3) * 6;
    if (axis !== 0) p.facing = axis > 0 ? 1 : -1;
    p.anim = 'papa_caida';
    p.animTime += dt;
    if (Math.floor(this.t / 3) !== Math.floor((this.t - dt) / 3) && k < 0.9) Sfx.play('wind');
    // Nubes, líneas de velocidad y notas que suben
    this.clouds.forEach(function (c) { c.y -= c.speed * dt; });
    this.clouds = this.clouds.filter(function (c) { return c.y > -60; });
    if (Math.random() < dt * 1.6) this.addCloud();
    if (Math.random() < dt * 22) this.lines.push({ x: Math.random() * W, y: H + 10, len: 8 + Math.random() * 20, speed: 300 + Math.random() * 200 });
    this.lines.forEach(function (l) { l.y -= l.speed * dt; });
    this.lines = this.lines.filter(function (l) { return l.y > -30; });
    this.nextNote -= dt;
    if (this.nextNote <= 0 && k < 0.92) {
      this.nextNote = 0.55 + Math.random() * 0.5;
      this.notes.push({ x: 20 + Math.random() * (W - 40), y: H + 10, speed: 70 + Math.random() * 40, kind: Math.floor(Math.random() * 3),
                        color: FLAG_COLORS[Math.floor(Math.random() * FLAG_COLORS.length)], seed: Math.random() * 10 });
    }
    this.notes.forEach(function (n) {
      n.y -= n.speed * dt;
      n.x += Math.sin(this.t * 2 + n.seed) * 12 * dt;
      if (!n.got && Math.abs(n.x - (p.x + p.w / 2)) < 10 && Math.abs(n.y - (p.y + p.h / 2)) < 14) {
        n.got = true;
        Sfx.scaleNote(this.caught);
        this.caught++;
        game.progress.coins++;
        BossShow.burstAt(n.x, n.y, 6);
        this.popups.push({ x: n.x, y: n.y, t: 0 });
      }
    }, this);
    this.notes = this.notes.filter(function (n) { return n.y > -20 && !n.got; });
    this.popups.forEach(function (q) { q.t += dt; q.y -= 20 * dt; });
    this.popups = this.popups.filter(function (q) { return q.t < 0.8; });
    if (!this.titleSound && this.t >= P.TITLE_AT) {
      this.titleSound = true;
      Sfx.play('titleChord');
    }
    // Al final: se ve la ciudad abajo y la papa cae en la Sala 1
    if (!this.done && this.t >= P.FALL_TIME) {
      this.done = true;
      game.landFromPrologue(p.x);
    }
  };

  Caida.prototype.skyColors = function () {
    const S = CONFIG.PROLOGUE.SKY;
    const k = this.progress();
    for (let i = 0; i + 1 < S.length; i++) {
      if (k <= S[i + 1][0]) {
        const f = (k - S[i][0]) / (S[i + 1][0] - S[i][0]);
        return { top: mix(S[i][1], S[i + 1][1], f), bottom: mix(S[i][2], S[i + 1][2], f) };
      }
    }
    const last = S[S.length - 1];
    return { top: last[1], bottom: last[2] };
  };

  Caida.prototype.drawSky = function (ctx, game) {
    const k = this.progress();
    const c = this.skyColors();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c.top);
    grad.addColorStop(1, c.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Estrellas que se apagan
    const starA = 1 - smooth((k - 0.15) / 0.35);
    if (starA > 0) {
      STARS.forEach(function (s) {
        ctx.globalAlpha = starA * (0.4 + 0.6 * Math.abs(Math.sin(this.t + s.tw)));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(s.x), Math.round((s.y - this.t * 4 + H) % H), 1, 1);
      }, this);
      ctx.globalAlpha = 1;
    }
    // El sol que sale desde abajo
    const sun = smooth((k - 0.45) / 0.5);
    if (sun > 0) {
      const sy = H + 50 - sun * 120;
      Light.drawGlow(ctx, W * 0.7, sy, 120, '#ffd9a0', 0.6 * sun);
      ctx.fillStyle = mix('#ff9a6b', '#fff6e0', sun);
      ctx.beginPath();
      ctx.arc(W * 0.7, sy, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    // Nubes lejanas (detrás de la papa)
    const tint = mix('#5a3a7a', '#ffffff', smooth(k * 1.2));
    this.clouds.forEach(function (cl) { if (!cl.near) drawCloud(ctx, cl, tint, 0.85); });
    // Líneas de velocidad
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    this.lines.forEach(function (l) { ctx.fillRect(Math.round(l.x), Math.round(l.y), 1, Math.round(l.len)); });
    // La ciudad aparece abajo en los últimos segundos
    const city = smooth((this.t - (CONFIG.PROLOGUE.FALL_TIME - 4)) / 4);
    if (city > 0) {
      ctx.save();
      ctx.translate(0, (1 - city) * 90);
      drawSkyline(ctx, 0, this.t, { lights: 0, far: mix('#8fb8d0', '#a8c8d8', 0.5), near: '#d98b6a' });
      ctx.restore();
    }
  };

  // Nube plana (estilo Moebius): base, luz arriba y la panza recta
  function drawCloud(ctx, c, color, alpha) {
    const n = 5;
    const light = mix(color, '#ffffff', 0.45);
    const shade = mix(color, '#2e2a47', 0.25);
    const bottom = c.y + c.w * 0.12;
    ctx.globalAlpha = alpha;
    [[shade, 2], [color, 0], [light, -3]].forEach(function (layer, li) {
      ctx.fillStyle = layer[0];
      for (let i = 0; i < n; i++) {
        const r = c.w * (0.18 + 0.1 * Math.sin(c.seed + i * 2)) - li * 2;
        if (r <= 1) continue;
        ctx.beginPath();
        ctx.arc(c.x + (i - n / 2) * c.w * 0.18 - li, c.y + Math.sin(c.seed * 3 + i) * 5 + layer[1], r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // Panza recta
    ctx.fillStyle = shade;
    ctx.fillRect(Math.round(c.x - c.w * 0.55), Math.round(bottom), Math.round(c.w * 0.95), 3);
    ctx.globalAlpha = 1;
  }

  Caida.prototype.drawMid = function (ctx) {
    // Notas que suben (para atraparlas)
    this.notes.forEach(function (n) {
      Light.drawGlow(ctx, n.x, n.y, 10, n.color, 0.8);
      BossShow.drawNote(ctx, n.x, n.y, n.color, n.kind);
    });
  };

  Caida.prototype.drawFront = function (ctx) {
    const k = this.progress();
    const tint = mix('#5a3a7a', '#ffffff', smooth(k * 1.2));
    this.clouds.forEach(function (cl) { if (cl.near) drawCloud(ctx, cl, tint, 0.55); });
    ctx.font = gameFont(6);
    ctx.textAlign = 'center';
    this.popups.forEach(function (q) {
      ctx.globalAlpha = 1 - q.t / 0.8;
      ctx.fillStyle = '#fff6e0';
      ctx.fillText('+1', Math.round(q.x), Math.round(q.y));
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  };

  // El título: las letras llegan volando como notas y se arman
  Caida.prototype.drawScreen = function (ctx) {
    const P = CONFIG.PROLOGUE;
    const t = this.t - P.TITLE_AT;
    if (t > -0.5 && t < P.TITLE_TIME) drawTitleWord(ctx, t, P.TITLE_TIME, 54);
    // Contador de notas atrapadas (abajo, discreto)
    if (this.caught > 0) {
      ctx.font = gameFont(6);
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(11,6,32,0.4)';
      ctx.fillRect(W - 40, H - 14, 36, 10);
      BossShow.drawNote(ctx, W - 33, H - 10, '#ffd34d', 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('x' + this.caught, W - 26, H - 12);
    }
    // Destello blanco justo antes de caer en la ciudad
    const flash = smooth((this.t - (P.FALL_TIME - 0.6)) / 0.6);
    if (flash > 0) {
      ctx.fillStyle = 'rgba(255,250,240,' + flash + ')';
      ctx.fillRect(0, 0, W, H);
    }
  };

  // "CHASKIDO" armado con notas que llegan volando (t: segundos desde que empieza)
  function drawTitleWord(ctx, t, life, y, alphaMax) {
    const word = 'CHASKIDO';
    const size = 24;
    const spacing = 26;
    const x0 = W / 2 - (word.length - 1) * spacing / 2;
    const out = life ? smooth((t - (life - 1)) / 1) : 0;
    ctx.font = gameFont(size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < word.length; i++) {
      const arrive = 0.35 + i * 0.12;
      const k = smooth((t - i * 0.12) / arrive);
      const tx = x0 + i * spacing;
      const sx = W / 2 + (rand(i * 9) - 0.5) * 360;
      const sy = H + 40 + rand(i * 5) * 60;
      const x = sx + (tx - sx) * k;
      const yy = sy + (y - sy) * k + Math.sin(t * 2 + i) * (k >= 1 ? 1.5 : 0);
      const a = (alphaMax || 1) * (1 - out);
      if (k < 1) {
        ctx.globalAlpha = a;
        BossShow.drawNote(ctx, x, yy, FLAG_COLORS[i % FLAG_COLORS.length], i % 3);
        continue;
      }
      Light.drawGlow(ctx, tx, yy, 22, FLAG_COLORS[i % FLAG_COLORS.length], 0.45 * a);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#5e2433';
      ctx.fillText(word[i], tx + 2, yy + 2);
      ctx.fillStyle = '#ffd34d';
      ctx.fillText(word[i], tx, yy);
      // Destello al llegar
      const since = t - i * 0.12 - arrive;
      if (since < 0.15) {
        ctx.globalAlpha = a * (1 - since / 0.15);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(word[i], tx, yy);
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  // ---------- Pantalla de inicio ----------

  // Fondo animado: la ciudad de noche, notas que escapan hacia arriba y el título
  const titleNotes = [];
  for (let i = 0; i < 18; i++) titleNotes.push({ x: rand(i * 3) * W, speed: 8 + rand(i * 7) * 14, phase: rand(i * 11) * 200, kind: i % 3, color: FLAG_COLORS[i % FLAG_COLORS.length] });

  function drawTitleBackground(ctx, time, showWord) {
    drawNightSky(ctx, time * 6, time, { lights: 0.85 });
    // Notas que se escapan de la ciudad
    titleNotes.forEach(function (n) {
      const y = H - ((time * n.speed + n.phase) % (H + 30));
      const x = n.x + Math.sin(time * 0.8 + n.phase) * 8;
      const a = clamp01((H - y) / 40) * clamp01(y / 60);
      Light.drawGlow(ctx, x, y, 8, n.color, 0.6 * a);
      ctx.globalAlpha = a;
      BossShow.drawNote(ctx, x, y, n.color, n.kind);
    });
    ctx.globalAlpha = 1;
    // La papa mirando, sentada en un techo
    const px = 48;
    const py = H - 26;
    ctx.fillStyle = '#1b1035';
    ctx.fillRect(20, py + 8, 60, H - py - 8);
    if (!Sprites.drawFrame(ctx, 'papa_quieta', Sprites.frameAt('papa_quieta', time), px - 8, py - 16, false)) {
      ctx.fillStyle = '#e8c58e';
      ctx.beginPath();
      ctx.ellipse(px, py, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (showWord) drawTitleWord(ctx, Math.min(time, 3), 0, 46);
  }

  // ---------- Fábrica ----------

  function create(data, game, arrive) {
    const s = data && data.scene;
    if (!s) return null;
    if (s.kind === 'fiesta') return new Fiesta(s, game);
    if (s.kind === 'bajo') return new Bajo(s, game, arrive);
    if (s.kind === 'caida') return new Caida(s, game);
    return null;
  }

  return {
    create: create,
    drawTitleBackground: drawTitleBackground,
    drawButtonHint: drawButtonHint,
    drawNightSky: drawNightSky
  };
})();
