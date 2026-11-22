// HUD, mensajes, avisos de acción, carteles, ventanas (premio, tienda, viaje,
// coliseo) y las pantallas de inicio y fin. El menú de pausa está en js/menu.js.
const UI = (function () {
  const W = CONFIG.WIDTH;
  const H = CONFIG.HEIGHT;
  const T = CONFIG.TILE;
  const INK = '#2e2a47';
  const PAPER = '#fbf6ec';
  const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];

  function font(size) {
    return gameFont(size);
  }

  function text(ctx, str, x, y, color, size, align) {
    ctx.font = font(size || 8);
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = color || '#ffffff';
    ctx.fillText(tr(str), x, y);
  }

  // Texto centrado en alto en y (para que quede dentro de un cartel con cualquier letra)
  function midText(ctx, str, x, y, color, size, align) {
    ctx.font = font(size || 8);
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color || '#ffffff';
    ctx.fillText(tr(str), x, y);
    ctx.textBaseline = 'top';
  }

  // Texto con sombra de tinta (para leer sobre cualquier fondo)
  function shadowText(ctx, str, x, y, color, size, align) {
    text(ctx, str, x + 1, y + 1, INK, size, align);
    text(ctx, str, x, y, color, size, align);
  }

  function textWidth(ctx, str, size) {
    ctx.font = font(size || 8);
    return ctx.measureText(tr(str)).width;
  }

  function drawPixels(ctx, rows, x, y, color) {
    ctx.fillStyle = color;
    rows.forEach(function (row, r) {
      for (let c = 0; c < row.length; c++) if (row[c] === '#') ctx.fillRect(x + c, y + r, 1, 1);
    });
  }

  function wrap(ctx, str, maxWidth, size) {
    ctx.font = font(size || 8);
    const words = String(tr(String(str))).split(' ');
    const lines = [];
    let line = '';
    words.forEach(function (w) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  // Alto de una línea de texto (con un poco de aire) para un tamaño de letra
  function lineStep(size) {
    return Math.ceil(size * CONFIG.FONT_SCALE * 1.18);
  }

  // Arma las filas de una ventana: cada fila { str, color, align, indent, gap } se corta
  // al ancho; devuelve las líneas, su alto total y el tamaño usado
  function layoutRows(ctx, rows, width, size) {
    const step = lineStep(size);
    const lines = [];
    let height = 0;
    rows.forEach(function (r) {
      wrap(ctx, r.str, width - (r.indent || 0), size).forEach(function (str, i) {
        const gap = i === 0 ? (r.gap || 0) : 0;
        lines.push({ str: str, color: r.color, align: r.align || 'left', indent: r.indent, gap: gap });
        height += step + gap;
      });
    });
    return { lines: lines, height: height, size: size, step: step };
  }

  // Lo que dice cada paso del premio: un dibujo arriba (head), un título y las filas
  function rewardContent(s, O) {
    const GREY = '#5b5478';
    const GREEN = '#5e8c6a';
    const R = { head: function () {}, headH: 0, title: '', titleSize: 8, titleH: 0, rows: [] };
    if (s.kind === 'power') {
      const pw = WORLD.power(s.power);
      R.head = function (ctx, ty) { PowerIcons.draw(ctx, s.power, W / 2, ty + 11, 22, false); };
      R.headH = 26;
      R.title = '¡Nuevo poder: ' + pw.nombre + '!';
      R.rows.push({ str: 'Cómo se usa: ' + pw.como, color: GREY });
      if (s.opens && s.opens.length) {
        R.rows.push({ str: 'Ahora puedes llegar a:', color: INK, gap: 3 });
        s.opens.forEach(function (o) { R.rows.push({ str: '· ' + o, color: GREY, indent: 4 }); });
      }
    } else if (s.kind === 'key') {
      const k = WORLD.keyInfo(s.key);
      R.head = function (ctx, ty) {
        if (!Sprites.drawFrame(ctx, 'llave_color', 0, W / 2 - 8, ty, false, k.color, 0.6)) {
          ctx.fillStyle = k.color;
          ctx.fillRect(W / 2 - 8, ty + 4, 7, 7);
          ctx.fillRect(W / 2 - 1, ty + 7, 9, 2);
        }
        Sprites.drawFrame(ctx, 'llave_brillo', Sprites.frameAt('llave_brillo', O.t), W / 2 - 8, ty, false);
      };
      R.headH = 20;
      R.title = (O.boss ? O.boss + ' te dio la ' : '¡') + k.nombre.toLowerCase() + '!';
      R.titleSize = 7;
      R.rows.push({ str: k.abre, color: GREY, align: 'center' });
      R.rows.push({ str: WORLD.keyOpensText(s.key), color: GREEN, align: 'center', gap: 4 });
    } else if (s.kind === 'note') {
      // Nota nueva del diapasón: el nombre grande en su color y cómo se toca
      const N = CONFIG.TUNER.NOTES[s.note];
      R.head = function (ctx, ty) {
        Light.drawGlow(ctx, W / 2, ty + 12, 24, N.color, 0.6);
        ctx.font = gameFont(14);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = INK;
        ctx.fillText(tr(N.name), W / 2 + 1, ty + 13);
        ctx.fillStyle = N.color;
        ctx.fillText(tr(N.name), W / 2, ty + 12);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
      };
      R.headH = 28;
      R.title = (O.boss ? O.boss + ' te enseñó ' : '¡Nueva nota: ') + N.name + (O.boss ? '.' : '!');
      R.rows.push({ str: N.flatOf
        ? 'Mantén el diapasón hasta ' + CONFIG.TUNER.NOTES[N.flatOf].name + ' y suelta con abajo apretado: suena ' + N.name + ', una nota blue.'
        : 'Mantén el diapasón: el anillo sube de nota en nota hasta ' + N.name + '. Suelta y suena.', color: GREY, align: 'center' });
      R.rows.push({ str: 'Los muros de este color se deshacen con ' + N.name + '. Algunos abren caminos nuevos; otros, secretos en las zonas de antes.',
                    color: GREEN, align: 'center', gap: 4 });
    } else if (s.kind === 'coins') {
      R.head = function (ctx, ty) { Drops.drawCoin(ctx, W / 2 - 3, ty + 4, O.t); };
      R.headH = 18;
      R.title = '¡+' + s.coins + ' monedas!';
      R.rows.push({ str: 'Se gastan con los vendedores.', color: GREY, align: 'center' });
    } else if (s.kind === 'heart') {
      R.title = '¡Corazón extra!';
      R.rows.push({ str: 'Ahora tienes ' + s.max + ' corazones.', color: GREY, align: 'center' });
    } else if (s.kind === 'poliedro') {
      R.title = '¡' + s.poliedro.nombre + '!';
      R.rows.push({ str: s.poliedro.que, color: GREY, align: 'center' });
    }
    if (R.title) R.titleH = lineStep(R.titleSize) + 3;
    return R;
  }

  // Íconos del HUD: hoja nueva (10 cuadros) o vieja (6)
  function icon(ctx, name, x, y) {
    if (!Sprites.has('iconos')) return false;
    const map = Sprites.frames('iconos') >= 10 ? ICON : ICON_OLD;
    if (map[name] === undefined) return false;
    return Sprites.drawFrame(ctx, 'iconos', map[name], x, y, false);
  }

  // Ventana con el marco de 9 partes (menu_marco.png) o un borde de tinta
  function panel(ctx, x, y, w, h, fill) {
    x = Math.round(x);
    y = Math.round(y);
    if (Sprites.has('menu_marco')) {
      ctx.fillStyle = fill || 'rgba(251, 246, 236, 0.96)';
      ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      const c = 8;
      const parts = [[0, 0], [w - c, 0], [0, h - c], [w - c, h - c]];
      parts.forEach(function (p, i) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + p[0], y + p[1], c, c);
        ctx.clip();
        Sprites.drawFrame(ctx, 'menu_marco', 0, x + p[0] - (i % 2 ? 16 : 0), y + p[1] - (i > 1 ? 16 : 0), false);
        ctx.restore();
      });
      ctx.fillStyle = INK;
      ctx.fillRect(x + c, y, w - c * 2, 2);
      ctx.fillRect(x + c, y + h - 2, w - c * 2, 2);
      ctx.fillRect(x, y + c, 2, h - c * 2);
      ctx.fillRect(x + w - 2, y + c, 2, h - c * 2);
      return;
    }
    ctx.fillStyle = INK;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fill || PAPER;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = 'rgba(46, 42, 71, 0.15)';
    ctx.fillRect(x + 2, y + h - 4, w - 4, 2);
  }

  function heart(ctx, x, y, full) {
    if (icon(ctx, full ? 'HEART' : (Sprites.frames('iconos') >= 10 ? 'HEART_EMPTY' : 'HEART'), x, y - 1)) {
      if (!full && Sprites.frames('iconos') < 10) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = INK;
        ctx.fillRect(x, y - 1, 8, 8);
        ctx.globalAlpha = 1;
      }
      return;
    }
    drawPixels(ctx, HEART, x, y, full ? '#ff6b8a' : '#5b5478');
  }

  function miniCube(ctx, x, y) {
    if (icon(ctx, 'CUBE', x, y)) return;
    ctx.fillStyle = '#b8b2a7';
    ctx.fillRect(x, y, 7, 7);
    ctx.fillStyle = '#9fd3e0';
    ctx.fillRect(x + 1, y + 2, 5, 1);
    ctx.fillRect(x + 2, y + 4, 3, 1);
  }

  function keyColor(id) {
    const k = WORLD.keyInfo(id);
    return k ? k.color : '#ffffff';
  }

  return {
    // ---------- HUD ----------

    // Arriba a la izquierda: corazones; luego monedas, cubos y (en misión) corcheas;
    // a la derecha: tiempo, llave y las llaves de color conseguidas
    drawHud(ctx, game) {
      const P = game.progress;
      this.drawHudFrame(ctx);
      const max = P.maxHearts;
      for (let i = 0; i < max; i++) heart(ctx, 3 + i * 8, 4, i < game.hearts);
      let x = 6 + max * 8;
      if (!icon(ctx, 'COIN', x, 3)) Drops.drawCoin(ctx, x + 1, 4, game.time);
      text(ctx, String(P.coins), x + 10, 3, '#ffd34d');
      x += 14 + textWidth(ctx, String(P.coins));
      miniCube(ctx, x, 4);
      text(ctx, P.cubes + '/' + CONFIG.GAME.CUBES_PER_LIFE, x + 10, 3);
      x += 46;
      if (game.mission === 'collect' || game.mission === 'escape' || game.mission === 'merging') {
        // Un casillero por instrumento: apagado hasta atraparlo
        game.instrumentos.list.forEach(function (c, i) {
          const sx = x + i * 13;
          const got = c.state === 'caught';
          // Frente al portón cerrado, los que faltan parpadean (son lo que lo abre)
          const blink = !got && game.slotBlink > 0 && Math.floor(game.time * 6) % 2 === 0;
          ctx.fillStyle = blink ? 'rgba(255, 77, 109, 0.6)' : got ? 'rgba(255, 211, 77, 0.28)' : 'rgba(11, 6, 32, 0.5)';
          ctx.fillRect(sx, 1, 12, 12);
          ctx.fillStyle = got ? '#ffd34d' : '#5f5a70';
          ctx.fillRect(sx, 1, 12, 1);
          ctx.fillRect(sx, 12, 12, 1);
          ctx.save();
          ctx.globalAlpha = got ? 1 : 0.3;
          ctx.translate(sx + 6, 12);
          ctx.scale(0.55, 0.55);
          Sprites.drawAnchored(ctx, ((CONFIG.MUSIC.INSTRUMENT_SPRITE || {})[c.tipo] || 'sprite_' + c.tipo), 0, 0, 0, false);
          ctx.restore();
        });
        x += game.instrumentos.list.length * 13 + 6;
      }
      if (game.bonus) {
        const B = game.bonus;
        const label = B.fruits > 0 ? 'Frutas ' + B.eaten + '/' + B.fruits : 'Monedas ' + B.got + '/' + B.coins;
        text(ctx, label, x, 3, '#f4b6c2');
      }
      if (P.chili > 0) {
        if (!icon(ctx, 'CHILI', W - 96, 3)) {
          ctx.fillStyle = CONFIG.CHILI.COLOR;
          ctx.fillRect(W - 94, 5, 4, 6);
        }
        text(ctx, 'x' + P.chili, W - 86, 3, '#ff9a8a');
      }
      if (game.player.chiliTime > 0) this.drawChiliBar(ctx, game.player.chiliTime, game.time);

      // Llaves de color conseguidas (abajo a la derecha del HUD)
      const keys = CATALOGO.LLAVES.filter(function (k) { return P.keys[k.id]; });
      keys.forEach(function (k, i) {
        const kx = W - 8 - i * 7;
        ctx.fillStyle = INK;
        ctx.fillRect(kx - 1, 15, 6, 7);
        ctx.fillStyle = k.color;
        ctx.fillRect(kx, 16, 4, 3);
        ctx.fillRect(kx + 1, 19, 2, 2);
      });

      if (game.timerRunning()) this.drawTimer(ctx, Math.ceil(game.timeLeft), game.timerScale());
      if (game.mission === 'escape') {
        ctx.globalAlpha = game.hasKey ? 1 : 0.35;
        if (!icon(ctx, 'KEY', W - 44, 3)) Sprites.drawFrame(ctx, 'llave', 0, W - 48, -1, false);
        ctx.globalAlpha = 1;
      }
      if (game.savedIcon > 0) this.drawSaving(ctx, game.time);
      // --- HUD DE INSTRUMENTOS COLECCIONADOS ---
// --- HUD DE INSTRUMENTOS COLECCIONADOS ---
if (game.mission === 'collect' || game.mission === 'escape' || game.mission === 'merging') {
  const insts = game.instrumentos.list;
  const caught = insts.filter(c => c.state === 'caught');
  if (caught.length > 0) {
    const startX = W / 2 - (caught.length * 24) / 2;
    const yPos = H - 26; 
    
    caught.forEach((c, i) => {
      const x = startX + i * 24;
      ctx.fillStyle = 'rgba(46, 42, 71, 0.8)';
      ctx.fillRect(x, yPos, 20, 20);
      
      // ACÁ ESTÁ EL CAMBIO: Ya no usamos ctx.scale, solo lo dibujamos.
      Sprites.drawAnchored(ctx, ((CONFIG.MUSIC.INSTRUMENT_SPRITE || {})[c.tipo] || 'sprite_' + c.tipo), 0, x + 10, yPos + 18, false); 
    });
  }
}
    },

    // Marco del HUD: franja oscura con un borde tejido (puntadas de colores y flecos)
    drawHudFrame(ctx) {
      const COLORS = ['#ff6b8a', '#ffd34d', '#2ee6ff', '#ffd34d'];
      ctx.fillStyle = 'rgba(20, 11, 43, 0.78)';
      ctx.fillRect(0, 0, W, 14);
      ctx.fillStyle = 'rgba(255, 246, 224, 0.12)';
      ctx.fillRect(0, 0, W, 1);
      for (let x = 0, i = 0; x < W; x += 4, i++) {
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fillRect(x, 14, 3, 1);               // puntadas
        if (i % 2 === 0) {                       // flecos en zigzag
          ctx.fillStyle = 'rgba(20, 11, 43, 0.78)';
          ctx.fillRect(x, 15, 3, 1);
          ctx.fillRect(x + 1, 16, 1, 1);
        }
      }
    },

    drawTimer(ctx, seconds, scale) {
      const color = seconds <= 10 ? '#ff4d4d' : (scale > 1 ? '#ffd34d' : '#ffffff');
      ctx.save();
      ctx.translate(W - 4, 3);
      ctx.scale(scale, scale);
      if (scale > 1) text(ctx, String(seconds), 1, 1, '#000000', 8, 'right');
      text(ctx, String(seconds), 0, 0, color, 8, 'right');
      ctx.restore();
    },

    // Barra del ají debajo del HUD
    drawChiliBar(ctx, left, time) {
      if (left < 1.5 && Math.floor(time * 10) % 2 === 0) return;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(4, 15, 40, 2);
      ctx.fillStyle = CONFIG.CHILI.COLOR;
      ctx.fillRect(4, 15, Math.ceil(40 * left / CONFIG.CHILI.DURATION), 2);
    },

    // "Guardando" abajo a la derecha (rollo que se enrolla)
    drawSaving(ctx, time) {
      if (Sprites.drawFrame(ctx, 'guardando', Sprites.frameAt('guardando', time), W - 20, H - 20, false)) return;
      shadowText(ctx, 'Guardado', W - 4, H - 12, '#7be0a0', 6, 'right');
    },

    // Consejo corto en una franja oscura (si es largo, en dos o más líneas)
    drawTip(ctx, str, left, y) {
      const lines = wrap(ctx, str, W - 24, 7);
      const step = lineStep(7);
      const w = Math.min(W - 8, Math.max.apply(null, lines.map(function (l) { return textWidth(ctx, l, 7); })) + 12);
      const h = lines.length * step + 4;
      const x = Math.round(W / 2 - w / 2);
      ctx.globalAlpha = Math.min(1, left / 0.4);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(x, y, w, h);
      lines.forEach(function (l, i) { text(ctx, l, W / 2, y + 2 + i * step, '#ffe066', 7, 'center'); });
      ctx.globalAlpha = 1;
      return y + h + 3;
    },

    // Aviso chico (música, sonido) centrado, en una franja oscura para que no se mezcle
    drawSmallNote(ctx, str, y, color) {
      const lines = wrap(ctx, str, W - 24, 6);
      const step = lineStep(6);
      const w = Math.min(W - 8, Math.max.apply(null, lines.map(function (l) { return textWidth(ctx, l, 6); })) + 12);
      const x = Math.round(W / 2 - w / 2);
      ctx.fillStyle = 'rgba(27, 16, 53, 0.8)';
      ctx.fillRect(x, y, w, lines.length * step + 3);
      lines.forEach(function (l, i) { text(ctx, l, W / 2, y + 2 + i * step, color || '#ff6b6b', 6, 'center'); });
    },
    drawMergeAnimation(ctx, game) {
  const t = game.mergeTimer;
  const insts = game.instrumentos.list;
  const cx = game.player.x + game.player.w / 2;
  const cy = game.player.y + game.player.h / 2;
  
  // 1. Los iconos vuelan desde el HUD al centro de la pantalla
  if (t < 1.2) {
    const progress = t / 1.2; // De 0 a 1
    insts.forEach((c, i) => {
      const startX = CONFIG.WIDTH / 2 + (i - 1) * 24;
      const startY = CONFIG.HEIGHT - 16;
      // Interpolación hacia el centro de la pantalla
      const currentX = startX + (CONFIG.WIDTH / 2 - startX) * progress;
      const currentY = startY + (CONFIG.HEIGHT / 2 - startY) * progress;
      
      ctx.globalAlpha = 1 - progress;
      Sprites.drawAnchored(ctx, ((CONFIG.MUSIC.INSTRUMENT_SPRITE || {})[c.tipo] || 'sprite_' + c.tipo), 0, currentX, currentY, false, null, 0.8);
      ctx.globalAlpha = 1;
    });
  }
  
  // 2. Explosión de partículas (cuando chocan en el centro)
  if (t > 1.2 && t < 2.5) {
    const explodeProgress = (t - 1.2) / 1.3;
    // Generamos muchas chispas
    for(let i=0; i<15; i++) {
      const angle = (Math.PI * 2 / 15) * i;
      const radius = explodeProgress * 60;
      const px = CONFIG.WIDTH / 2 + Math.cos(angle) * radius;
      const py = CONFIG.HEIGHT / 2 + Math.sin(angle) * radius;
      
      ctx.fillStyle = ['#ffd34d', '#ff6b8a', '#6fd3ff'][i % 3];
      ctx.fillRect(px, py, 3, 3);
    }
    
    // Texto grande de "¡MIX!"
    ctx.globalAlpha = Math.sin(explodeProgress * Math.PI);
    UI.shadowText(ctx, '¡MIX!', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 10, '#ffd34d', 16, 'center');
    ctx.globalAlpha = 1;
  }
  // Mientras dura el mix: cómo bailar
  if (game.player.dancing) {
    UI.shadowText(ctx, '¡Baila!  ◀ ▶ ▲ ▼  y salta', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 40, '#fbf6ec', 7, 'center');
  }
},

    // Ventana de mensaje arriba (bajo el HUD). Los avisos cortos no muestran "cerrar"
    drawMessageBox(ctx, str, top, isHint) {
      const pad = 6;
      const boxW = W - 16;
      const lines = wrap(ctx, str, boxW - pad * 2);
      const boxH = lines.length * 12 + pad * 2 - 3;
      const x = 8;
      ctx.fillStyle = 'rgba(46, 42, 71, 0.72)';
      ctx.fillRect(x, top, boxW, boxH);
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, top + 0.5, boxW - 1, boxH - 1);
      lines.forEach(function (line, i) { text(ctx, line, x + pad, top + pad + i * 12, PAPER); });
      if (isHint) return top + boxH + 4;
      const hint = 'E/Cuadrado: cerrar';
      const hintW = textWidth(ctx, hint, 6) + 6;
      ctx.fillStyle = 'rgba(46, 42, 71, 0.92)';
      ctx.fillRect(x + boxW - hintW, top + boxH, hintW, 9);
      text(ctx, hint, x + boxW - 3, top + boxH + 2, '#c9b8e3', 6, 'right');
      return top + boxH + 12;
    },

    drawDebug(ctx, player, y, roomId) {
      let x = 4;
      ctx.font = font(8);
      CONFIG.ABILITIES.forEach(function (a) {
        const w = ctx.measureText(a.name).width + 6;
        const on = player.has(a.id);
        ctx.fillStyle = on ? (CONFIG.SKINS[a.id] || '#ffffff') : 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, y, w, 11);
        text(ctx, a.name, x + 3, y + 2, on ? '#000000' : '#9a93b0');
        x += w + 3;
      });
      text(ctx, roomId || '', W - 4, y + 2, '#ffd34d', 8, 'right');
      return y + 14;
    },

    // ---------- En el mundo (coordenadas del mapa) ----------

    // Aviso de acción sobre lo que se puede usar: bocadillo con la palabra y el botón
    drawPrompt(ctx, prompt, time) {
      const box = Items.nearBox(prompt.item);
      const cx = Math.round(box.x + box.w / 2);
      const bob = Math.round(Math.sin(time * 4) * 1);
      const y = Math.round(box.y - 16 + bob);
      const label = prompt.text;
      const w = textWidth(ctx, label, 6) + 18;
      const x = cx - Math.round(w / 2);
      ctx.fillStyle = INK;
      ctx.fillRect(x - 1, y - 1, w + 2, 12);
      ctx.fillStyle = PAPER;
      ctx.fillRect(x, y, w, 10);
      ctx.fillStyle = INK;
      ctx.fillRect(cx - 2, y + 10, 5, 2);
      ctx.fillRect(cx - 1, y + 12, 3, 1);
      // Botón: E en el teclado (o el que corresponda)
      if (!Sprites.drawFrame(ctx, 'aviso_boton', 0, x + 2, y + 1, false)) {
        ctx.fillStyle = '#e9c46a';
        ctx.fillRect(x + 2, y + 1, 8, 8);
        text(ctx, 'E', x + 6, y + 2, INK, 6, 'center');
      }
      midText(ctx, label, x + 12, y + 5, INK, 6);
    },

    // "Comienza la misión aquí" sobre el tótem (hasta empezar la misión)
    drawMissionSign(ctx, totem, time) {
      const cx = totem.x + T / 2;
      const y = Math.round(totem.y - 64 + Math.sin(time * 2) * 2);   // sobre el aviso de acción
      // Una sola línea, centrada en la franja del cartel (el cartel se estira al texto)
      const label = tr('Comienza la misión aquí');
      const w = Math.max(48, textWidth(ctx, label, 4.6) + 16);
      if (Sprites.drawStretched(ctx, 'cartel_mision', Sprites.frameAt('cartel_mision', time), cx - w / 2, y, w)) {
        midText(ctx, label, cx, y + 5, INK, 4.6, 'center');
        return;
      }
      ctx.fillStyle = INK;
      ctx.fillRect(cx - w / 2 - 1, y - 1, w + 2, 12);
      ctx.fillStyle = '#f7e3a1';
      ctx.fillRect(cx - w / 2, y, w, 10);
      midText(ctx, label, cx, y + 5, INK, 4.6, 'center');
      ctx.fillStyle = INK;
      ctx.fillRect(cx - 1, y + 16, 2, 6);
    },

    // Placa en cada paso con la sala a la que lleva (su nombre), si la papa está cerca
    drawExitSigns(ctx, game) {
      if (game.level.kind === 'prologo') return;   // el prólogo no avisa a dónde lleva cada paso
      const p = game.player;
      const px = p.x + p.w / 2;
      const py = p.y + p.h / 2;
      game.level.exits.forEach(function (e) {
        const R = e.rect;
        const cx = R.x + R.w / 2;
        const cy = R.y + R.h / 2;
        if (Math.abs(cx - px) > T * 8 || Math.abs(cy - py) > T * 7) return;
        let sx;
        let sy;
        if (e.side === 'left') { sx = R.x + R.w + 22; sy = R.y - 14; }
        else if (e.side === 'right') { sx = R.x - 22; sy = R.y - 14; }
        else if (e.side === 'top') { sx = cx; sy = R.y + R.h + 4; }
        else { sx = cx; sy = R.y - 18; }
        sy = Math.max(2, sy);
        const label = e.blocked ? 'En obras' : WORLD.name(e.goes);
        const w = Math.max(32, textWidth(ctx, label, 5) + 12);
        const x = Math.round(Math.min(Math.max(sx - w / 2, 2), game.level.pxW - w - 2));
        const y = Math.round(sy);
        if (!Sprites.drawStretched(ctx, 'cartel_zona', 0, x, y - 4, w)) {
          ctx.fillStyle = INK;
          ctx.fillRect(x - 1, y - 1, w + 2, 10);
          ctx.fillStyle = e.blocked ? '#8a87a8' : '#b8b2a7';
          ctx.fillRect(x, y, w, 8);
        }
        midText(ctx, label, x + w / 2, y + 4, INK, 5, 'center');
      });
    },

    // Aura de luz con notitas alrededor de la papa al ganar un poder
    drawAura(ctx, p, t) {
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      if (Sprites.drawAnchored(ctx, 'aura_poder', Sprites.frameAt('aura_poder', t), cx, cy + 24, false)) return;
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.35 - i * 0.1;
        ctx.fillStyle = '#f7e3a1';
        ctx.beginPath();
        ctx.arc(cx, cy, 12 + i * 7 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < 6; i++) {
        const a = t * 2 + i * Math.PI / 3;
        ctx.fillStyle = Items.NOTE_COLORS[i];
        ctx.fillRect(Math.round(cx + Math.cos(a) * 20), Math.round(cy + Math.sin(a) * 14 - t * 6), 3, 3);
      }
    },

    drawSmoke(ctx, from, to, time, color) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 12) return;
      const nx = -dy / dist;
      const ny = dx / dist;
      const count = Math.max(4, Math.min(40, Math.floor(dist / 10)));
      const flow = (time * 1.5) % 1;
      ctx.fillStyle = color || '#e8e4ff';
      const puffs = Sprites.has('humo');
      for (let i = 0; i < count; i++) {
        const t = (i + flow) / count;
        const wave = Math.sin(t * 10 - time * 4) * 4;
        const x = from.x + dx * t + nx * wave;
        const y = from.y + dy * t + ny * wave;
        ctx.globalAlpha = 0.55 * (1 - t * 0.6);
        if (puffs) {
          if (i % 3 === 0) {
            Sprites.drawFrame(ctx, 'humo', Math.floor(t * 3) % Sprites.frames('humo'), x - 8, y - 8, false, color || '#e8e4ff', 0.6);
          }
          continue;
        }
        ctx.beginPath();
        ctx.arc(x, y, 2 + Math.sin(t * 6 + time * 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    // ---------- Sobre la pantalla ----------

    drawFilter(ctx, time) {
      const alpha = 0.08 + 0.04 * Math.sin(time * 2);
      ctx.fillStyle = 'rgba(255, 120, 200, ' + alpha + ')';
      ctx.fillRect(0, 0, W, H);
    },

    drawFade(ctx, k) {
      ctx.fillStyle = 'rgba(27, 16, 53, ' + Math.max(0, Math.min(1, k)) + ')';
      ctx.fillRect(0, 0, W, H);
    },

    // Nombre de la sala al entrar (la zona, "Ciudad Ocaso", y la sala, "Acequias Hondas")
    drawBanner(ctx, b) {
      const total = CONFIG.GAME.BANNER_TIME;
      const k = Math.min(1, (total - b.time) / 0.4, b.time / 0.6);
      ctx.globalAlpha = Math.max(0, k);
      const w = Math.max(textWidth(ctx, b.name, 8), textWidth(ctx, b.title, 6)) + 20;
      const x = Math.round(W / 2 - w / 2);
      const y = H - 40;
      panel(ctx, x, y, w, 28, 'rgba(251, 246, 236, 0.92)');
      text(ctx, b.title, W / 2, y + 5, '#5b5478', 6, 'center');
      text(ctx, b.name, W / 2, y + 14, INK, 8, 'center');
      ctx.globalAlpha = 1;
    },

    drawOverlay(ctx, game) {
      const O = game.overlay;
      if (O.kind === 'reward') this.drawReward(ctx, game, O);
      else if (O.kind === 'shop') this.drawShop(ctx, game, O);
      else if (O.kind === 'travel') this.drawTravel(ctx, game, O);
      else if (O.kind === 'towerIntro') this.drawTowerIntro(ctx, O);
    },

    // Premio de un jefe, paso a paso: aura, poder (y cómo se usa), llave, nota, monedas.
    // La ventana se mide según lo que dice: si el texto no entra, la letra se achica,
    // y el aviso de seguir va siempre abajo, sin tapar nada.
    drawReward(ctx, game, O) {
      const s = O.steps[O.i];
      if (s.kind === 'aura') {
        ctx.fillStyle = 'rgba(27, 16, 53, ' + Math.min(0.5, O.t) + ')';
        ctx.fillRect(0, 0, W, H);
        return;
      }
      ctx.fillStyle = 'rgba(27, 16, 53, 0.7)';
      ctx.fillRect(0, 0, W, H);
      const x = 20;
      const w = W - 40;
      const R = rewardContent(s, O);
      // Probar con letra 6; si no entra, 5 y después 4.5
      let lay = null;
      [6, 5, 4.5].some(function (size) {
        lay = layoutRows(ctx, R.rows, w - 20, size);
        return R.headH + R.titleH + lay.height + 30 <= H - 8;
      });
      const h = R.headH + R.titleH + lay.height + 30;
      const y = Math.max(4, Math.round((H - h) / 2));
      panel(ctx, x, y, w, h);
      let ty = y + 8;
      R.head(ctx, ty);
      ty += R.headH;
      if (R.title) text(ctx, R.title, W / 2, ty, INK, R.titleSize, 'center');
      ty += R.titleH;
      lay.lines.forEach(function (l) {
        ty += l.gap;
        const lx = l.align === 'center' ? W / 2 : x + 10 + (l.indent || 0);
        text(ctx, l.str, lx, ty, l.color, lay.size, l.align);
        ty += lay.step;
      });
      if (O.t > 0.6 && Math.floor(game.time * 2) % 2 === 0) {
        text(ctx, 'Salto o E: seguir', W / 2, y + h - 11, '#9a93b0', 5, 'center');
      }
    },

    // Tienda del vendedor: lista de cosas con su precio
    drawShop(ctx, game, O) {
      const M = O.merchant;
      ctx.fillStyle = 'rgba(27, 16, 53, 0.55)';
      ctx.fillRect(0, 0, W, H);
      const x = 30;
      const y = 22;
      const w = W - 60;
      const h = H - 40;
      panel(ctx, x, y, w, h);
      text(ctx, M.nombre, W / 2, y + 8, INK, 8, 'center');
      Drops.drawCoin(ctx, x + w - 46, y + 8, game.time);
      text(ctx, String(game.progress.coins), x + w - 36, y + 8, '#a0784a', 8);
      const rows = O.goods.map(function (g) { return { label: g.nombre, price: g.precio === 0 ? 'gratis' : String(g.precioActual || g.precio) }; });
      rows.push({ label: 'Salir', price: '' });
      rows.forEach(function (r, i) {
        const ry = y + 26 + i * 14;
        const on = i === O.index;
        if (on) {
          ctx.fillStyle = 'rgba(233, 196, 106, 0.45)';
          ctx.fillRect(x + 6, ry - 2, w - 12, 12);
        }
        text(ctx, r.label, x + 12, ry, on ? INK : '#5b5478', 7);
        text(ctx, r.price, x + w - 12, ry, on ? INK : '#5b5478', 7, 'right');
      });
      const sel = O.goods[O.index];
      const note = O.note || (sel ? sel.que : 'Vuelve cuando quieras.');
      wrap(ctx, note, w - 20, 5).forEach(function (line, i) {
        text(ctx, line, x + 10, y + h - 22 + i * lineStep(5), '#5e8c6a', 5);
      });
      // Lo que cuenta el vendedor al venderte algo (lore)
      if (O.lore) {
        wrap(ctx, '«' + tr(O.lore) + '»', w, 5).forEach(function (line, i) {
          shadowText(ctx, line, W / 2, Math.max(2, y - 16) + i * lineStep(5), '#fbf6ec', 5, 'center');
        });
      }
    },

    // Viajar desde un tótem a cualquier sala (la lista se corre si no entra entera).
    // Cada fila: la zona y la sala, su nombre y cómo está: afinada (nota), sin
    // visitar ("nueva") o, si por el camino falta una llave, el color de esa llave.
    drawTravel(ctx, game, O) {
      ctx.fillStyle = 'rgba(27, 16, 53, 0.55)';
      ctx.fillRect(0, 0, W, H);
      const ROWS = 9;
      const rows = O.list.concat(['__salir']);
      const first = clamp(O.index - Math.floor(ROWS / 2), 0, Math.max(0, rows.length - ROWS));
      const shown = rows.slice(first, first + ROWS);
      const x = 30;
      const y = 10;
      const w = W - 60;
      const h = 48 + ROWS * 13;
      panel(ctx, x, y, w, h);
      text(ctx, O.totem ? 'Tótem dormido' : 'Viajar a otra sala', W / 2, y + 8, INK, 8, 'center');
      shown.forEach(function (id, k) {
        const i = first + k;
        const ry = y + 24 + k * 13;
        const on = i === O.index;
        if (on) {
          ctx.fillStyle = 'rgba(159, 211, 224, 0.6)';
          ctx.fillRect(x + 6, ry - 2, w - 12, 12);
        }
        const color = on ? INK : '#5b5478';
        if (id === '__salir') return text(ctx, 'Quedarme aquí', x + 12, ry, color, 6);
        if (id === TRAVEL_MISSION) return text(ctx, 'Empezar la misión de esta sala', x + 12, ry, on ? '#c0504d' : '#8a5a5a', 6);
        const region = WORLD.regionInfo(WORLD.region(id));
        ctx.fillStyle = region.color;
        ctx.fillRect(x + 10, ry, 4, 7);
        text(ctx, WORLD.fullName(id), x + 18, ry, color, 6);
        const info = game.travelInfo(id);
        if (info.key) {
          ctx.fillStyle = info.key.color;
          ctx.fillRect(x + w - 40, ry, 6, 6);
        }
        if (info.tuned) text(ctx, '♪', x + w - 14, ry, '#5e8c6a', 6, 'right');
        else if (!info.visited) text(ctx, 'nueva', x + w - 12, ry, '#c98a3a', 5, 'right');
      });
      // Flechitas si hay más arriba o más abajo
      if (first > 0) text(ctx, '▲', W / 2, y + 16, '#9a93b0', 5, 'center');
      if (first + ROWS < rows.length) text(ctx, '▼', W / 2, y + h - 20, '#9a93b0', 5, 'center');
      const pick = rows[O.index];
      let note = 'Arriba/abajo: elegir   Acción: aceptar';
      if (pick !== '__salir' && pick !== TRAVEL_MISSION) {
        const info = game.travelInfo(pick);
        if (info.key) note = 'Por el camino se llega con la ' + info.key.nombre.toLowerCase() + '; viajando, ya.';
        else if (!info.visited) note = 'Todavía no estuviste ahí. Si falta un poder, vuelve cuando lo tengas.';
      }
      text(ctx, note, W / 2, y + h - 11, '#6b6385', 5, 'center');
    },

    // Coliseo: retrato del jefe y la placa del piso
    drawTowerIntro(ctx, O) {
      const k = Math.min(1, O.t / 0.3);
      ctx.fillStyle = 'rgba(27, 16, 53, ' + (0.75 * k) + ')';
      ctx.fillRect(0, 0, W, H);
      const F = TOWER.FLOORS[O.floor];
      const name = CONFIG.BOSSES[F.boss].NAME;
      const px = W / 2 - 32 + (1 - k) * 60;
      if (!Sprites.drawFrame(ctx, F.portrait, 0, px, 24, false)) {
        panel(ctx, px, 24, 64, 64, '#e8c58e');
        text(ctx, '?', px + 32, 46, INK, 16, 'center');
      }
      if (!Sprites.drawFrame(ctx, 'placa_piso', 0, W / 2 - 64, 96, false)) panel(ctx, W / 2 - 64, 96, 128, 32, '#b8b2a7');
      text(ctx, 'Piso ' + (O.floor + 1), W / 2, 104, INK, 8, 'center');
      text(ctx, name, W / 2, 115, '#5b5478', 6, 'center');
    },

    // ---------- Pantallas de inicio y fin ----------

    // Pantalla de inicio: la ciudad de noche con las notas que se escapan (js/prologo.js)
    // y el título armado con notas. Con CONFIG.TITLE_PORTADA en true usa portada.png
    drawLogo(ctx, time) {
      if (CONFIG.TITLE_PORTADA && Sprites.drawFrame(ctx, 'portada', 0, 0, 0, false)) {
        if (!Sprites.drawFrame(ctx, 'logo', 0, W / 2 - 80, 8, false)) shadowText(ctx, 'CHASKIDO', W / 2, 24, '#ffd34d', 24, 'center');
        return;
      }
      Scenes.drawTitleBackground(ctx, time, true);
    },

    // La primera vez (sin idioma elegido) el aviso va cambiando entre los tres idiomas
    drawSplash(ctx, time, canStart, firstTime) {
      this.drawLogo(ctx, time);
      if (!canStart || Math.floor(time * 1.5) % 2 !== 0) return;
      const PRESS = ['Pulsa un botón', 'Press a button', 'Aperte um botão'];
      const str = firstTime ? PRESS[Math.floor(time / 1.333) % 3] : tr('Pulsa un botón');
      shadowText(ctx, str, W / 2, 118, '#fff6e0', 8, 'center');
    },

    // Mensaje importante: pausa el juego hasta apretar Acción
    drawModal(ctx, str, t) {
      ctx.fillStyle = 'rgba(27, 16, 53, ' + Math.min(0.45, t * 2) + ')';
      ctx.fillRect(0, 0, W, H);
      const lines = wrap(ctx, str, W - 60, 7);
      const step = lineStep(7);
      const h = lines.length * step + 26;
      const y = Math.round(H / 2 - h / 2);
      panel(ctx, 24, y, W - 48, h);
      lines.forEach(function (l, i) { text(ctx, l, W / 2, y + 8 + i * step, INK, 7, 'center'); });
      if (t > 0.4 && Math.floor(t * 2) % 2 === 0) text(ctx, 'E/Cuadrado: seguir', W / 2, y + h - 11, '#9a93b0', 5, 'center');
    },

    // Fiesta final: la ciudad de noche con las notas, y todos bailando (sin aura: libres)
    drawFiesta(ctx, time, t) {
      Scenes.drawTitleBackground(ctx, time, false);
      const cast = CONFIG.ENDGAME.CAST.filter(function (n) { return Sprites.has(n); });
      const perRow = Math.ceil(cast.length / 3);
      cast.forEach(function (name, i) {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const appear = i * 0.12;
        if (t < appear) return;
        const x = 20 + (col + 0.5) * (W - 40) / perRow + (row % 2) * 8;
        const y = 108 + row * 26 - Math.abs(Math.sin(time * 4 + i)) * 5;
        Sprites.drawAnchored(ctx, name, Sprites.frameAt(name, time + i * 0.1), x, y, (i + Math.floor(time)) % 2 === 0);
      });
      // Papel picado que cae
      for (let i = 0; i < 40; i++) {
        const cx = (i * 53 + time * 20 * (1 + i % 3)) % W;
        const cy = (i * 37 + time * 30) % H;
        ctx.fillStyle = ['#ff6b8a', '#ffd34d', '#7be07b', '#6fd3ff', '#c9b8e3'][i % 5];
        ctx.fillRect(Math.round(cx), Math.round(cy), 2, 3);
      }
      ctx.globalAlpha = Math.min(1, t / 1.5);
      shadowText(ctx, '¡La música volvió!', W / 2, 18, '#ffd34d', 14, 'center');
      shadowText(ctx, 'Todos salieron a celebrar: ya nadie lleva el aura del Silencio.', W / 2, 42, '#fff6e0', 6, 'center');
      ctx.globalAlpha = 1;
    },

    // Elegir idioma (la primera vez): los tres nombres, cada uno en su idioma
    drawLang(ctx, time, index) {
      this.drawLogo(ctx, time);
      const M = CONFIG.LANG_MENU;
      const n = I18N.LANGS.length;
      ctx.fillStyle = 'rgba(11, 6, 32, 0.7)';
      ctx.fillRect(W / 2 - 70, M.TOP - 22, 140, n * M.STEP + 28);
      shadowText(ctx, 'Elige tu idioma', W / 2, M.TOP - 17, '#c9b8e3', 7, 'center');
      I18N.LANGS.forEach(function (l, i) {
        const y = M.TOP + i * M.STEP;
        const on = i === index;
        if (on) {
          ctx.fillStyle = 'rgba(255, 211, 77, 0.16)';
          ctx.fillRect(W / 2 - 66, y - 3, 132, M.STEP - 2);
          BossShow.drawNote(ctx, W / 2 - 54, y + 3 + Math.round(Math.sin(time * 6)), '#ffd34d', 1);
        }
        text(ctx, l.name, W / 2, y, on ? '#ffd34d' : '#c9c2dc', 9, 'center');
      });
    },

    // Menú: un panel oscuro y elegante a la derecha, con la explicación abajo
    // Informe de juego (portada: arriba, arriba, abajo, abajo)
    drawRegistro(ctx, info, note) {
      const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, r = info.ultima;
      ctx.fillStyle = '#140b2b';
      ctx.fillRect(0, 0, W, H);
      text(ctx, 'Informe de juego', W / 2, 10, '#ffd34d', 10, 'center');
      text(ctx, info.total + ' sesiones guardadas · ' + info.pendientes + ' por enviar' +
        (CONFIG.REGISTRO.URL ? '' : ' (sin planilla)'), W / 2, 26, '#9a93b0', 5, 'center');
      const lines = r ? [
        'Última: ' + r.minutos + ' min · ' + r.fin + ' en ' + r.sala_final,
        'Perfil: ' + r.perfil + '  (Exp ' + r.p_experto + ' · Explo ' + r.p_explorador + ' · Apu ' + r.p_apurado +
          ' · Prin ' + r.p_principiante + ' · Enf ' + r.p_enfocado + ')',
        'Muertes ' + r.muertes + ' · jefes ' + r.jefes_vencidos + '/' + r.intentos_jefe + ' · diapasón ' + r.diapason_usos,
        'Recorrió ' + r.cobertura_pct + '% · portón ' + r.choques_porton + ' · mensajes rápidos ' + r.mensajes_rapidos + '/' + r.mensajes
      ] : ['Todavía no hay sesiones.'];
      lines.forEach(function (l, i) { text(ctx, l, 20, 48 + i * 14, '#fbf6ec', 6); });
      if (note) text(ctx, note, W / 2, 118, '#7be0a0', 6, 'center');
      text(ctx, 'Aceptar: descargar   ♪: nuevo jugador   Dash: probar envío   Pausa: volver', W / 2, H - 14, '#6b6580', 5, 'center');
    },

    drawTitle(ctx, time, items, index, plus, towerOpen) {
      this.drawLogo(ctx, time);
      // Versión en la esquina: así se sabe qué copia está sirviendo el servidor
      text(ctx, CONFIG.GAME_VERSION || '', 4, CONFIG.HEIGHT - 9, '#6b6580', 5);
      const M = CONFIG.TITLE_MENU;
      function label(id) {
        if (id === 'continue') return 'Continuar';
        if (id === 'tower') return 'Coliseo de los jefes';
        if (id === 'plus') return 'Nueva partida +: ' + (plus ? 'Sí' : 'No');
        if (id === 'lang') return 'Idioma: ' + I18N.name();
        if (id === 'credits') return 'Créditos';
        if (id === 'speedrun') return 'Speedrun';
        return 'Nueva · ' + CONFIG.DIFFICULTY[id].NAME;
      }
      function info(id) {
        if (id === 'continue') return 'Sigue desde donde guardaste';
        if (id === 'tower') return towerOpen ? 'Coliseo: ' + TOWER.FLOORS.length + ' jefes seguidos'
                                             : 'Se abre al terminar la historia en Normal o Difícil';
        if (id === 'credits') return 'Quién hizo Chaskido';
        if (id === 'speedrun') return towerOpen ? 'Elige una zona y rescata sus instrumentos contra el reloj'
                                                : 'Se abre al terminar la historia en Normal o Difícil';
        if (id === 'lang') return 'Español · English · Português';
        const D = CONFIG.DIFFICULTY[id];
        if (!D) return 'Empiezas con el dash y el gancho (sin prólogo)';
        let str = D.LIVES + ' corazones';
        if (D.DAMAGE > 1) str += ', daño x' + D.DAMAGE;
        if (D.MISSION_TIME > 0) str += ', misión en ' + Math.round(D.MISSION_TIME / 60) + ' min';
        return str;
      }
      const x = M.LEFT;
      const top = M.TOP - 6;
      ctx.fillStyle = 'rgba(11, 6, 32, 0.62)';
      ctx.fillRect(x - 10, top, W - x + 4, items.length * M.STEP + 8);
      ctx.fillStyle = 'rgba(255, 211, 77, 0.6)';
      ctx.fillRect(x - 10, top, 1, items.length * M.STEP + 8);
      items.forEach(function (id, i) {
        const y = M.TOP + i * M.STEP;
        const on = i === index;
        if (on) {
          ctx.fillStyle = 'rgba(255, 211, 77, 0.16)';
          ctx.fillRect(x - 9, y - 3, W - x + 2, M.STEP - 1);
          BossShow.drawNote(ctx, x - 4, y + 2 + Math.round(Math.sin(time * 6)), '#ffd34d', 1);
        }
        const locked = (id === 'tower' || id === 'speedrun') && !towerOpen;
        text(ctx, label(id), x + 4, y, locked ? (on ? '#8a8399' : '#5f5a70') : (on ? '#ffd34d' : '#c9c2dc'), 7);
        if (on) shadowText(ctx, info(id), W / 2, H - 12, '#c9b8e3', 6, 'center');
      });
    },

    // Créditos (desde el menú de inicio)
    drawCredits(ctx, time) {
      ctx.fillStyle = '#140b2b';
      ctx.fillRect(0, 0, W, H);
      shadowText(ctx, 'Créditos', W / 2, 26, '#ffd34d', 12, 'center');
      const lines = [
        ['Juego hecho por', 'Vicente Flau'],
        ['Música original', 'Vicente Flau'],
        ['Con la asistencia de', 'Claude y DeepSeek']
      ];
      lines.forEach(function (l, i) {
        const y = 56 + i * 30;
        text(ctx, l[0], W / 2, y, '#9a93b0', 6, 'center');
        text(ctx, l[1], W / 2, y + 10, '#fbf6ec', 8, 'center');
      });
      BossShow.drawNote(ctx, W / 2 - 3, 150 + Math.round(Math.sin(time * 4) * 2), '#ffd34d', 1);
      text(ctx, 'Aprieta un botón para volver', W / 2, H - 12, '#6b6580', 6, 'center');
    },

    drawReady(ctx, time, hearts, difficulty, canStart, tower) {
      ctx.fillStyle = '#1b1035';
      ctx.fillRect(0, 0, W, H);
      text(ctx, tower ? 'COLISEO' : 'GAME START', W / 2 + 2, 16, '#5e2433', 16, 'center');
      text(ctx, tower ? 'COLISEO' : 'GAME START', W / 2, 14, '#ffd34d', 16, 'center');
      text(ctx, difficulty, W / 2, 36, '#9a93b0', 8, 'center');
      for (let i = 0; i < hearts; i++) drawPixels(ctx, HEART, W / 2 - hearts * 5 + i * 10, 50, '#ff6b8a');
      const lines = [
        ['Moverse', 'A/D o el joystick'],
        ['Saltar', 'Espacio o X'],
        ['Correr', 'mantén E o Cuadrado'],
        ['Usar', 'E o Cuadrado (tótem, posta...)'],
        ['Pausa', 'Esc u Options: mapa y más']
      ];
      lines.forEach(function (l, i) {
        text(ctx, l[0], 40, 66 + i * 12, '#ffd34d');
        text(ctx, l[1], 112, 66 + i * 12, '#ffffff', 7);
      });
      if (!tower) text(ctx, 'Toca el tótem para comenzar la misión.', W / 2, 132, '#7be07b', 7, 'center');
      if (canStart && Math.floor(time * 2) % 2 === 0) text(ctx, 'Pulsa un botón para empezar', W / 2, H - 16, '#9a93b0', 8, 'center');
    },

    drawGameOver(ctx, time, labels, index, ready) {
      const M = CONFIG.GAME_OVER_MENU;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, W, H);
      text(ctx, 'GAME OVER', W / 2 + 2, 42, '#5e2433', 16, 'center');
      text(ctx, 'GAME OVER', W / 2, 40, '#ff6b8a', 16, 'center');
      text(ctx, 'La papa necesita descansar.', W / 2, 66, '#ffffff', 8, 'center');
      if (!ready) return;
      labels.forEach(function (label, i) {
        const y = M.TOP + i * M.STEP;
        const on = i === index;
        if (on && Math.floor(time * 3) % 2 === 0) text(ctx, '>', 72, y, '#ffd34d');
        text(ctx, label, 84, y, on ? '#ffd34d' : '#9a93b0');
      });
    },

    drawEnd(ctx, title, lines, color, canContinue, time, hint) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, W, H);
      text(ctx, title, W / 2, 50, color, 16, 'center');
      lines.forEach(function (line, i) { text(ctx, line, W / 2, 84 + i * 14, '#ffffff', 8, 'center'); });
      if (canContinue && Math.floor(time * 2) % 2 === 0) text(ctx, hint || 'Toca para seguir', W / 2, 150, '#9a93b0', 8, 'center');
    },

    // Para el menú de pausa (js/menu.js)
    text: text,
    shadowText: shadowText,
    textWidth: textWidth,
    wrap: wrap,
    panel: panel,
    heart: heart,
    keyColor: keyColor
  };
})();
