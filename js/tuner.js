// Diapasón: el poder que da el Eco del Silencio (prólogo). No es un arma: hace resonar
// las cosas con su nota natural.
//   - Toque corto del botón (F o Triángulo): suena La, la nota con que se afina todo.
//   - Mantener: el anillo sube de nota en nota (La, Si, Do, Re, Mi, Fa, Sol), solo por
//     las que ya se aprendieron (cada jefe enseña una). Al soltar suena la que quedó.
//   - Con abajo apretado al soltar suena el bemol de esa nota (Si♭, Mi♭, Sol♭), si
//     ya se aprendió: son las notas blue de las salas secretas.
// Cada muro de nota se deshace solo con su nota; con otra tiembla y no pasa nada.
// Los muros abiertos quedan abiertos (como los del dash). Ajustes en CONFIG.TUNER.
class Tuner {
  constructor() {
    this.hold = 0;          // segundos que lleva apretado el botón
    this.holding = false;
    this.step = 0;          // escalón del anillo (índice en la lista de notas aprendidas)
    this.cooldown = 0;
    this.waves = [];        // ondas que se abren: { note, x, y, t, radius }
    this.labels = [];       // el nombre de la nota que sube: { note, x, y, t }
    this.known = ['la'];    // notas naturales aprendidas, en el orden del anillo
    this.learned = {};      // todas las aprendidas (naturales y bemoles)
  }

  // known: notas aprendidas (naturales y bemoles), como { la: true, si: true, ... }
  // Devuelve { note, opened, wrong, wrongNote } cuando suena una nota (si no, null)
  update(dt, player, level, known) {
    const C = CONFIG.TUNER;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.waves.forEach(function (w) { w.t += dt; });
    this.waves = this.waves.filter(function (w) { return w.t < C.WAVE_TIME; });
    this.labels.forEach(function (l) { l.t += dt; });
    this.labels = this.labels.filter(function (l) { return l.t < 1; });
    if (!player.has('tuner')) {
      this.holding = false;
      return null;
    }
    this.learned = known;
    this.known = C.ORDER.filter(function (n) { return known[n]; });
    if (Input.pressed('tuner') && this.cooldown <= 0) {
      this.holding = true;
      this.hold = 0;
      this.step = 0;
    }
    if (!this.holding) return null;
    if (Input.held('tuner')) {
      this.hold += dt;
      const step = Math.min(this.known.length - 1, Math.floor(this.hold / C.STEP));
      if (step !== this.step) {
        this.step = step;
        Sfx.tunerStep(C.NOTES[this.known[step]].freq);
      }
      return null;
    }
    // Soltó: suena la nota (o su bemol, con abajo)
    this.holding = false;
    this.cooldown = C.COOLDOWN;
    let note = this.known[this.step] || 'la';
    const flat = C.FLATS[note];
    if (flat && known[flat] && Input.held('down')) note = flat;
    const def = C.NOTES[note];
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    this.waves.push({ note: note, x: cx, y: cy, t: 0, radius: def.radius });
    this.labels.push({ note: note, x: cx, y: player.headY() - 14, t: 0 });
    const result = level.resonate(note, cx, cy, def.radius);
    result.note = note;
    return result;
  }

  // Nota en la que está el anillo mientras se mantiene
  current() {
    return this.known[this.step] || 'la';
  }

  draw(ctx, player) {
    const C = CONFIG.TUNER;
    const T = CONFIG.TILE;
    // Ondas: anillos que ondulan (como una cuerda que vibra) y se abren hasta su radio
    this.waves.forEach(function (w) {
      const k = w.t / C.WAVE_TIME;
      const def = C.NOTES[w.note];
      const ripples = def.radius > 5 ? 3 : 2;
      const lobes = 5 + C.ORDER.indexOf(def.flatOf || w.note);
      Light.drawGlow(ctx, w.x, w.y, w.radius * T * (0.4 + 0.6 * k), def.color, 0.35 * (1 - k));
      for (let r = 0; r < ripples; r++) {
        const kk = Math.max(0, k - r * 0.14);
        if (kk <= 0) continue;
        const rad = w.radius * T * (0.15 + 0.85 * kk);
        ctx.globalAlpha = (1 - kk) * 0.9;
        ctx.strokeStyle = r === 0 ? '#fff6e0' : def.color;
        ctx.lineWidth = r === 0 ? 1.5 : 1;
        ctx.setLineDash(def.flatOf && r > 0 ? [3, 2] : []);   // los bemoles: anillo cortado
        ctx.beginPath();
        for (let a = 0; a <= 48; a++) {
          const ang = a / 48 * Math.PI * 2;
          const wob = Math.sin(ang * lobes + w.t * 30) * 1.5 * (1 - kk);
          const px = w.x + Math.cos(ang) * (rad + wob);
          const py = w.y + Math.sin(ang) * (rad + wob);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    });
    // El nombre de la nota sube y se apaga
    this.labels.forEach(function (l) {
      ctx.globalAlpha = 1 - l.t;
      drawNoteName(ctx, l.note, l.x, l.y - l.t * 14);
      ctx.globalAlpha = 1;
    });
    if (!this.holding) return;
    // Mientras se mantiene: el diapasón sobre la papa vibra y el anillo muestra los
    // escalones (uno por nota aprendida); el actual brilla con su color y su nombre
    const cx = Math.round(player.x + player.w / 2);
    const top = Math.round(player.headY()) - 12;
    const note = this.current();
    const def = C.NOTES[note];
    const n = this.known.length;
    const into = n > 1 && this.step < n - 1 ? (this.hold % C.STEP) / C.STEP : 1;
    Light.drawGlow(ctx, cx, top, 12 + this.step * 2, def.color, 0.55);
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i / n * Math.PI * 2 + 0.08;
      const a1 = -Math.PI / 2 + (i + 1) / n * Math.PI * 2 - 0.08;
      ctx.strokeStyle = i <= this.step ? C.NOTES[this.known[i]].color : 'rgba(46, 42, 71, 0.55)';
      ctx.beginPath();
      ctx.arc(cx, top, 9, a0, i === this.step + 1 ? a0 + (a1 - a0) * into : a1);
      ctx.stroke();
      if (i === this.step + 1) {
        ctx.strokeStyle = 'rgba(46, 42, 71, 0.55)';
        ctx.beginPath();
        ctx.arc(cx, top, 9, a0 + (a1 - a0) * into, a1);
        ctx.stroke();
      }
    }
    ctx.lineWidth = 1;
    // Nombre de la nota actual sobre el anillo (y la flechita del bemol si se puede)
    drawNoteName(ctx, note, cx, top - 16);
    const flat = C.FLATS[note];
    if (flat && this.learned[flat]) {
      ctx.fillStyle = Input.held('down') ? '#ffffff' : 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(cx + 12, top - 18, 1, 4);
      ctx.fillRect(cx + 11, top - 15, 3, 1);
    }
    const v = Math.sin(this.hold * 70) * 0.8;
    if (Sprites.drawFrame(ctx, 'diapason', this.step > 0 ? 1 : 0, cx - 8, top - 8, false)) return;
    drawFork(ctx, cx, top, v, def.color);
  }
}

// Nombre de una nota con su color y sombra de tinta
function drawNoteName(ctx, note, x, y) {
  const def = CONFIG.TUNER.NOTES[note];
  ctx.font = gameFont(8);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2e2a47';
  ctx.fillText(tr(def.name), x + 1, y + 1);
  ctx.fillStyle = def.color;
  ctx.fillText(tr(def.name), x, y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}

// Diapasón dibujado: horquilla de metal con brillo; las puntas vibran
function drawFork(ctx, cx, cy, v, color) {
  const INK = '#2e2a47';
  ctx.fillStyle = INK;
  ctx.fillRect(cx - 4 - Math.ceil(Math.abs(v)), cy - 6, 9 + Math.ceil(Math.abs(v)) * 2, 9);
  ctx.fillRect(cx - 1, cy + 2, 3, 6);
  ctx.fillStyle = '#d8d4e8';
  ctx.fillRect(Math.round(cx - 3 - v), cy - 5, 2, 7);   // punta izquierda
  ctx.fillRect(Math.round(cx + 2 + v), cy - 5, 2, 7);   // punta derecha
  ctx.fillRect(cx - 3, cy + 1, 7, 1);
  ctx.fillRect(cx, cy + 2, 1, 5);                       // mango
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(Math.round(cx - 3 - v), cy - 5, 1, 3);   // brillo
  ctx.fillStyle = color;
  ctx.fillRect(cx - 1, cy + 6, 3, 2);                   // la bolita del mango
}
