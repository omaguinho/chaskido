// Capa de decoración: piezas sin choque que dan vida a cada sala (casas,
// faroles, cañas, engranajes...). Cada pieza usa su sprite deco_<nombre>.png
// (ver DECO_SPRITES en sprites.js); si falta, se dibuja una versión simple con
// el color del catálogo. Algunas se mueven: faroles que titilan, antenas que
// parpadean, engranajes y molinos que giran, pasto que se mece.
const Deco = (function () {
  const T = CONFIG.TILE;

  // ¿Se ve? (la pieza se apoya abajo a la izquierda de su celda)
  function visible(p, view) {
    return p.tx + p.def.w >= view.x0 && p.tx <= view.x1 && p.ty >= view.y0 && p.ty - p.def.h <= view.y1;
  }

  function drawLayer(ctx, level, list, view, front) {
    const t = level.clock;
    ctx.globalAlpha = front ? 0.72 : 1;
    list.forEach(function (p) {
      if (!visible(p, view)) return;
      const d = p.def;
      const x = p.tx * T;
      const bottom = (p.ty + 1) * T;
      const y = bottom - d.h * T;
      if (!drawSprite(ctx, p, x, y, t)) drawFallback(ctx, p, x, y, t);
      if (d.id === 'molino') drawRotor(ctx, x, y, t);
    });
    ctx.globalAlpha = 1;
  }

  // Cuadro de la animación de cada pieza
  function frameFor(p, t) {
    const id = p.def.id;
    if (id === 'farol' || id === 'ventana' || id === 'letrero' || id === 'pantalla') {
      // Encendidos casi siempre; de vez en cuando titilan
      const flick = Math.sin(t * 7 + p.seed) > 0.97 || Math.sin(t * 1.3 + p.seed * 2) > 0.995;
      return flick ? 0 : 1;
    }
    if (id === 'antena') return Math.floor(t * 1.5 + p.seed) % 2;
    if (id === 'cristal') return Math.floor(t * 2 + p.seed) % 2;
    if (id === 'pasto') return Math.floor(t * 2 + p.seed) % 2;
    if (id === 'tuberia') return p.frame || 0;
    if (id === 'antorcha') return Math.floor(t * 8 + p.seed) % 4;   // el fuego se mueve
    if (id === 'neon' || id === 'farolFuturo') return neonOn(p, t) ? 1 : 0;
    if (id === 'juncos') return Math.floor(t * 2 + p.seed) % 2;
    if (id === 'torreFutura') return Math.floor(t * 1.2 + p.seed) % 2;
    if (id === 'robot') return robotEye(p, t) > 0 ? 1 : 0;
    return 0;
  }

  // Neón viejo: tartamudea a ratos (se apaga dos o tres veces seguidas)
  function neonOn(p, t) {
    const k = (t * 0.7 + p.seed * 0.37) % 6;
    if (k < 0.5) return Math.sin(t * 40 + p.seed) > 0;
    return true;
  }

  // Ojo del robot dormido: casi siempre cerrado; cada tanto se abre un momento (0..1)
  function robotEye(p, t) {
    const k = (t * 0.25 + p.seed * 0.13) % 1;
    return k > 0.9 ? Math.sin((k - 0.9) / 0.1 * Math.PI) : 0;
    return 0;
  }

  function drawSprite(ctx, p, x, y, t) {
    const s = DECO_SPRITES[p.def.id];
    if (!s || !Sprites.has(s.file)) return false;
    if (p.def.id === 'engranaje') {
      ctx.save();
      ctx.translate(x + s.fw / 2, y + s.fh / 2);
      ctx.rotate(t * 0.6 * (p.seed % 2 ? 1 : -1));
      Sprites.drawFrame(ctx, s.file, 0, -s.fw / 2, -s.fh / 2, false);
      ctx.restore();
      return true;
    }
    return Sprites.drawFrame(ctx, s.file, frameFor(p, t), x, y, false);
  }

  // Hélice del molino: gira sobre el eje de la torre
  function drawRotor(ctx, x, y, t) {
    const cx = x + 24;
    const cy = y + 20;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 1.4);
    if (!Sprites.drawFrame(ctx, 'molino_rotor', 0, -16, -16, false)) {
      ctx.fillStyle = '#fbf6ec';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-1.5, -15, 3, 13);
      }
      ctx.fillStyle = '#2e2a47';
      ctx.fillRect(-2, -2, 4, 4);
    }
    ctx.restore();
  }

  function box(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(46, 42, 71, 0.5)';
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
  }

  // Versión simple de cada pieza, con el color del catálogo y algo de forma
  function drawFallback(ctx, p, x, y, t) {
    const d = p.def;
    const W = d.w * T;
    const H = d.h * T;
    const c = d.color;
    const back = ctx.globalAlpha;
    if (d.capa !== 'frente') ctx.globalAlpha = back * 0.7;
    switch (d.id) {
      case 'farol': {
        ctx.fillStyle = '#5b5478';
        ctx.fillRect(x + 7, y + 8, 2, H - 8);
        const on = frameFor(p, t) === 1;
        ctx.fillStyle = on ? '#f7e3a1' : '#8a87a8';
        ctx.fillRect(x + 4, y + 2, 8, 7);
        if (on) {
          ctx.globalAlpha = back * 0.25;
          ctx.fillStyle = '#f7e3a1';
          ctx.beginPath();
          ctx.arc(x + 8, y + 6, 10 + Math.sin(t * 5 + p.seed), 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'ventana':
        box(ctx, x + 3, y + 3, 10, 10, frameFor(p, t) ? '#f7e3a1' : '#5b5478');
        ctx.fillStyle = 'rgba(46, 42, 71, 0.5)';
        ctx.fillRect(x + 7, y + 3, 1, 10);
        break;
      case 'casa':
        box(ctx, x + 4, y + 26, W - 8, H - 26, c);
        ctx.fillStyle = '#a8603f';
        ctx.beginPath();
        ctx.moveTo(x, y + 28);
        ctx.lineTo(x + W / 2, y + 8);
        ctx.lineTo(x + W, y + 28);
        ctx.fill();
        ctx.fillStyle = '#f7e3a1';
        ctx.fillRect(x + 14, y + 36, 8, 8);
        ctx.fillRect(x + 40, y + 36, 8, 8);
        ctx.fillStyle = '#5b5478';
        ctx.fillRect(x + 27, y + 46, 10, 18);
        break;
      case 'edificio':
      case 'edificioB':
        box(ctx, x + 2, y + 2, W - 4, H - 2, c);
        for (let wy = y + 8; wy < y + H - 10; wy += 12) {
          for (let wx = x + 8; wx < x + W - 10; wx += 12) {
            ctx.fillStyle = (wx * 3 + wy) % 7 < 4 ? '#f7e3a1' : '#5b5478';
            ctx.fillRect(wx, wy, 6, 6);
          }
        }
        break;
      case 'antena':
        ctx.fillStyle = '#8a87a8';
        ctx.fillRect(x + 7, y + 4, 2, H - 4);
        ctx.fillRect(x + 3, y + 14, 10, 1);
        ctx.fillStyle = frameFor(p, t) ? '#ff4d4d' : '#5b5478';
        ctx.fillRect(x + 6, y + 1, 4, 4);
        break;
      case 'tanque':
        box(ctx, x + 2, y + 4, W - 4, 26, c);
        ctx.fillStyle = '#5b5478';
        ctx.fillRect(x + 6, y + 30, 2, H - 30);
        ctx.fillRect(x + W - 8, y + 30, 2, H - 30);
        break;
      case 'letrero':
        box(ctx, x + 2, y + 4, W - 4, H - 10, frameFor(p, t) ? c : '#5b5478');
        ctx.fillStyle = '#fbf6ec';
        for (let i = 0; i < W - 12; i += 4) ctx.fillRect(x + 6 + i, y + 12 + Math.round(Math.sin(i * 0.6 + t * 3) * 3), 2, 2);
        break;
      case 'molino':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x + 14, y + H);
        ctx.lineTo(x + 20, y + 20);
        ctx.lineTo(x + 28, y + 20);
        ctx.lineTo(x + 34, y + H);
        ctx.fill();
        break;
      case 'bote':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 14);
        ctx.lineTo(x + W - 2, y + 14);
        ctx.lineTo(x + W - 10, y + H - 2);
        ctx.lineTo(x + 10, y + H - 2);
        ctx.fill();
        break;
      case 'canaAlta':
      case 'canaBaja':
        ctx.fillStyle = c;
        ctx.fillRect(x + 6, y, 4, H);
        ctx.fillStyle = 'rgba(46, 42, 71, 0.4)';
        for (let i = 12; i < H; i += 16) ctx.fillRect(x + 5, y + i, 6, 1);
        break;
      case 'liana':
      case 'enredadera':
        ctx.fillStyle = c;
        for (let i = 0; i < H; i += 4) ctx.fillRect(x + 7 + Math.round(Math.sin(i * 0.3 + t * 1.5) * 2), y + i, 2, 4);
        break;
      case 'arbol': {
        // Tronco grueso y copa de tres manchas (bosque)
        ctx.fillStyle = '#4e3a2a';
        ctx.fillRect(x + W / 2 - 5, y + H * 0.35, 10, H * 0.65);
        ctx.fillStyle = 'rgba(46, 42, 71, 0.35)';
        ctx.fillRect(x + W / 2 + 2, y + H * 0.35, 3, H * 0.65);
        ctx.fillStyle = c;
        [[0.5, 0.2, 0.42], [0.25, 0.34, 0.3], [0.75, 0.34, 0.3]].forEach(function (b) {
          ctx.beginPath();
          ctx.ellipse(x + W * b[0], y + H * b[1], W * b[2], H * 0.17, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }
      case 'hongo': {
        const glow = 0.6 + Math.sin(t * 2 + p.seed) * 0.25;
        ctx.globalAlpha = back * glow;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 9, 6, 4, 0, Math.PI, 0);
        ctx.fill();
        ctx.globalAlpha = back;
        ctx.fillStyle = '#f3e3c3';
        ctx.fillRect(x + 7, y + 9, 2, 7);
        break;
      }
      case 'raiz':
        ctx.fillStyle = c;
        for (let i = 0; i < W; i += 6) ctx.fillRect(x + i, y + H - 3 - ((i / 6) % 2) * 2, 7, 2);
        ctx.fillRect(x + 4, y + H - 6, 2, 4);
        ctx.fillRect(x + W - 8, y + H - 5, 2, 3);
        break;
      case 'helecho':
        ctx.fillStyle = c;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(x + 6 + i * 5, y + 18 - Math.abs(2 - i) * 2, 3, 10, (i - 2) * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'engranaje': {
        ctx.save();
        ctx.translate(x + W / 2, y + H / 2);
        ctx.rotate(t * 0.6 * (p.seed % 2 ? 1 : -1));
        ctx.fillStyle = c;
        for (let i = 0; i < 8; i++) {
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-3, -W / 2 + 2, 6, 6);
        }
        ctx.beginPath();
        ctx.arc(0, 0, W / 2 - 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2e2a47';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'tuberia':
        ctx.fillStyle = c;
        if (p.frame === 1) ctx.fillRect(x + 5, y, 6, T);
        else ctx.fillRect(x, y + 5, T, 6);
        if (p.frame === 3) ctx.fillRect(x + 5, y, 6, T);
        break;
      case 'pantalla':
        box(ctx, x + 2, y + 4, W - 4, H - 8, '#2e2a47');
        ctx.fillStyle = frameFor(p, t) ? c : '#5b5478';
        for (let i = 0; i < W - 10; i += 2) ctx.fillRect(x + 5 + i, y + H / 2 + Math.round(Math.sin(i * 0.5 + t * 4) * 4), 2, 1);
        break;
      case 'estalactita':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x + 3, y);
        ctx.lineTo(x + 13, y);
        ctx.lineTo(x + 8, y + H - 2);
        ctx.fill();
        break;
      case 'estalagmita':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + H);
        ctx.lineTo(x + 13, y + H);
        ctx.lineTo(x + 8, y + 2);
        ctx.fill();
        break;
      case 'cristal':
        ctx.fillStyle = c;
        ctx.globalAlpha = back * (0.6 + 0.3 * Math.sin(t * 2 + p.seed));
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 4);
        ctx.lineTo(x + 13, y + H - 6);
        ctx.lineTo(x + 8, y + H);
        ctx.lineTo(x + 3, y + H - 6);
        ctx.fill();
        break;
      case 'cadena':
        ctx.fillStyle = c;
        for (let i = 0; i < H; i += 4) ctx.fillRect(x + 7, y + i, 2, 3);
        break;
      case 'pasto':
        ctx.fillStyle = c;
        for (let i = 0; i < 5; i++) ctx.fillRect(x + 2 + i * 3 + (frameFor(p, t) ? 1 : 0), y + 8 + (i % 2) * 2, 1, 8);
        break;
      case 'flores':
        ['#ff8fb1', '#f7e3a1', '#c9b8e3'].forEach(function (fc, i) {
          ctx.fillStyle = fc;
          ctx.fillRect(x + 3 + i * 4, y + 11 - i % 2, 2, 2);
        });
        ctx.fillStyle = '#5e8c6a';
        ctx.fillRect(x + 2, y + 13, 12, 3);
        break;
      // ---------- Zona 4 · Ciudad Dorada ----------
      case 'antorcha': {
        ctx.globalAlpha = back;
        ctx.fillStyle = '#6a4a2a';
        ctx.fillRect(x + 6, y + 14, 4, 18);
        ctx.fillStyle = '#e9c46a';
        ctx.fillRect(x + 4, y + 12, 8, 3);
        const f = Math.sin(t * 13 + p.seed) * 1.5;
        ctx.fillStyle = '#ff6b2e';
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 8, 4, 6 + f * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd34d';
        ctx.beginPath();
        ctx.ellipse(x + 8 + f * 0.3, y + 9, 2, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'discoSol': {
        const cx = x + W / 2;
        const cy = y + H / 2;
        ctx.fillStyle = '#c98a3a';
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2 + t * 0.2;
          ctx.fillRect(Math.round(cx + Math.cos(a) * 13) - 1, Math.round(cy + Math.sin(a) * 13) - 1, 3, 3);
        }
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8a5a2b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#fff6e0';
        ctx.fillRect(cx - 4, cy - 6, 3, 2);
        break;
      }
      case 'columna':
        ctx.fillStyle = c;
        ctx.fillRect(x + 3, y + 4, W - 6, H - 8);
        ctx.fillStyle = 'rgba(46, 42, 71, 0.25)';
        for (let i = 5; i < W - 4; i += 3) ctx.fillRect(x + i, y + 6, 1, H - 12);
        ctx.fillStyle = c;
        ctx.fillRect(x, y, W, 4);
        ctx.fillRect(x, y + H - 4, W, 4);
        break;
      case 'estatua':
        ctx.fillStyle = c;
        ctx.fillRect(x + 2, y + H - 8, W - 4, 8);
        ctx.fillRect(x + 6, y + 14, W - 12, H - 22);
        ctx.beginPath();
        ctx.ellipse(x + W / 2, y + 10, 7, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(46, 42, 71, 0.3)';
        ctx.fillRect(x + W / 2 - 4, y + 10, 8, 1);
        break;
      case 'arco':
        ctx.fillStyle = c;
        ctx.fillRect(x, y + 10, 10, H - 10);
        ctx.fillRect(x + W - 10, y + 10, 10, H - 10);
        ctx.fillRect(x, y, W, 12);
        ctx.fillStyle = 'rgba(46, 42, 71, 0.25)';
        for (let i = 0; i < W; i += 8) ctx.fillRect(x + i, y + 4, 4, 4);
        break;
      // ---------- Zona 6 · Lago Espejo ----------
      case 'juncos': {
        // Tres tallos que se mecen, con la espiga oscura arriba
        [3, 8, 12].forEach(function (sx, i) {
          const sway = Math.sin(t * 1.6 + p.seed + i) * 1.5;
          ctx.strokeStyle = c;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + sx, y + H);
          ctx.quadraticCurveTo(x + sx, y + H / 2, x + sx + sway, y + 6 + i * 3);
          ctx.stroke();
          ctx.fillStyle = '#6a4e2e';
          ctx.fillRect(Math.round(x + sx + sway) - 1, y + 4 + i * 3, 2, 6);
        });
        break;
      }
      case 'islaJuncos':
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(x + W / 2, y + H - 6, W / 2 - 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a9a4a';
        for (let i = 6; i < W - 6; i += 5) ctx.fillRect(x + i, y + 4 + (i % 3) * 2, 1, H - 12);
        break;
      case 'nenufar': {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(x + W / 2, y + H - 3, W / 2 - 2, 3, 0, 0.3, Math.PI * 2);   // la hoja con su corte
        ctx.lineTo(x + W / 2, y + H - 3);
        ctx.fill();
        if (p.seed % 3 === 0) {
          ctx.fillStyle = '#ffb3d1';
          ctx.fillRect(x + W / 2 + 2, y + H - 7, 4, 3);
          ctx.fillStyle = '#fff6e0';
          ctx.fillRect(x + W / 2 + 3, y + H - 8, 2, 1);
        }
        break;
      }
      case 'musgo':
        box(ctx, x + 2, y + 6, W - 4, H - 6, '#7a8a8a');
        ctx.fillStyle = c;
        ctx.fillRect(x + 2, y + 5, W - 4, 3);
        ctx.fillRect(x + 4, y + 8, 3, 2);
        break;
      // ---------- Zona 5 · la ciudad del futuro bajo el hielo ----------
      case 'torreFutura': {
        ctx.fillStyle = c;
        ctx.fillRect(x + 4, y + 10, W - 8, H - 10);
        ctx.fillRect(x + W / 2 - 1, y, 2, 10);                       // la antena de arriba
        ctx.fillStyle = 'rgba(46, 42, 71, 0.35)';
        for (let yy = y + 16; yy < y + H - 6; yy += 8) {
          for (let xx = x + 8; xx < x + W - 8; xx += 6) ctx.fillRect(xx, yy, 3, 4);  // ventanas vacías
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, y + 10, W - 8, 3);                       // nieve en el techo
        ctx.fillRect(x + 2, y + H - 4, W - 4, 4);
        ctx.fillStyle = frameFor(p, t) ? '#ff4d6d' : '#5b5478';
        ctx.fillRect(x + W / 2 - 2, y, 4, 3);
        break;
      }
      case 'cupula': {
        ctx.strokeStyle = c;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + W / 2, y + H, W / 2 - 2, Math.PI, Math.PI * 1.7);  // falta un pedazo: está rota
        ctx.stroke();
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
          const a = Math.PI + i * Math.PI / 5;
          if (a > Math.PI * 1.7) break;
          ctx.beginPath();
          ctx.moveTo(x + W / 2, y + H);
          ctx.lineTo(x + W / 2 + Math.cos(a) * (W / 2 - 2), y + H + Math.sin(a) * (W / 2 - 2));
          ctx.stroke();
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + W / 2, y + H, W / 2 - 4, 8, 0, Math.PI, 0);   // nieve adentro
        ctx.fill();
        break;
      }
      case 'robot': {
        box(ctx, x + 4, y + 18, W - 8, H - 18, c);                    // cuerpo
        box(ctx, x + 8, y + 6, W - 16, 12, c);                        // cabeza
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 8, y + 5, W - 16, 2);                        // escarcha
        ctx.fillRect(x + 4, y + 17, W - 8, 2);
        const e = robotEye(p, t);
        ctx.fillStyle = e > 0 ? 'rgba(107, 240, 255, ' + (0.4 + e * 0.6) + ')' : '#2e2a47';
        ctx.fillRect(x + W / 2 - 4, y + 11, 8, e > 0 ? 2 : 1);
        break;
      }
      case 'neon': {
        box(ctx, x + 1, y + 6, W - 2, H - 10, '#2e2a47');
        ctx.strokeStyle = neonOn(p, t) ? c : '#3a4a5a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= W - 10; i += 2) {                        // una onda de sonido en neón
          const yy = y + H / 2 + Math.sin(i * 0.4) * 4;
          if (i === 0) ctx.moveTo(x + 5 + i, yy); else ctx.lineTo(x + 5 + i, yy);
        }
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 1, y + 5, W - 2, 2);
        break;
      }
      case 'cables':
        ctx.strokeStyle = c;
        ctx.lineWidth = 1;
        [3, 8, 12].forEach(function (cx, i) {
          ctx.beginPath();
          ctx.moveTo(x + cx, y);
          ctx.quadraticCurveTo(x + cx + 3 + Math.sin(t + i) * 1.5, y + H * 0.6, x + cx - 1, y + H - 4 - i * 3);
          ctx.stroke();
        });
        ctx.fillStyle = '#d8f0ff';
        ctx.fillRect(x + 2, y + H - 6, 2, 3);
        break;
      case 'farolFuturo': {
        ctx.fillStyle = '#5b6478';
        ctx.fillRect(x + 7, y + 6, 2, H - 6);
        ctx.fillRect(x + 4, y + H - 3, 8, 3);
        ctx.fillRect(x + 7, y + 4, 7, 2);                             // el brazo curvo
        ctx.fillStyle = neonOn(p, t) ? c : '#5b5478';
        ctx.fillRect(x + 10, y + 6, 5, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 7, y + 3, 7, 1);
        break;
      }
      default:
        // Rocas, vigas, piedritas y las piezas de otras zonas: un bloque suave
        box(ctx, x + 1, y + 1, W - 2, H - 1, c);
    }
    ctx.globalAlpha = back;
  }

  return {
    drawLayer: drawLayer,
    lit: neonOn,     // ¿el neón o la farola están prendidos? (para las luces)
    eye: robotEye    // ¿cuánto abrió el ojo el robot? (0..1)
  };
})();
