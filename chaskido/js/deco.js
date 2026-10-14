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
      default:
        // Rocas, vigas, piedritas y las piezas de otras zonas: un bloque suave
        box(ctx, x + 1, y + 1, W - 2, H - 1, c);
    }
    ctx.globalAlpha = back;
  }

  return { drawLayer: drawLayer };
})();
