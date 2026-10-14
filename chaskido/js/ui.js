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
    return size + 'px ' + CONFIG.FONT;
  }

  function text(ctx, str, x, y, color, size, align) {
    ctx.font = font(size || 8);
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = color || '#ffffff';
    ctx.fillText(str, x, y);
  }

  // Texto con sombra de tinta (para leer sobre cualquier fondo)
  function shadowText(ctx, str, x, y, color, size, align) {
    text(ctx, str, x + 1, y + 1, INK, size, align);
    text(ctx, str, x, y, color, size, align);
  }

  function textWidth(ctx, str, size) {
    ctx.font = font(size || 8);
    return ctx.measureText(str).width;
  }

  function drawPixels(ctx, rows, x, y, color) {
    ctx.fillStyle = color;
    rows.forEach(function (row, r) {
      for (let c = 0; c < row.length; c++) if (row[c] === '#') ctx.fillRect(x + c, y + r, 1, 1);
    });
  }

  function wrap(ctx, str, maxWidth, size) {
    ctx.font = font(size || 8);
    const words = String(str).split(' ');
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
      ctx.fillStyle = 'rgba(46, 42, 71, 0.55)';
      ctx.fillRect(0, 0, W, 14);
      const max = P.maxHearts;
      for (let i = 0; i < max; i++) heart(ctx, 3 + i * 8, 4, i < game.hearts);
      let x = 6 + max * 8;
      if (!icon(ctx, 'COIN', x, 3)) Drops.drawCoin(ctx, x + 1, 4, game.time);
      text(ctx, String(P.coins), x + 10, 3, '#ffd34d');
      x += 14 + textWidth(ctx, String(P.coins));
      miniCube(ctx, x, 4);
      text(ctx, P.cubes + '/' + CONFIG.GAME.CUBES_PER_LIFE, x + 10, 3);
      x += 46;
      if (game.mission === 'collect' || game.mission === 'escape') {
        if (!icon(ctx, 'NOTE', x, 3)) Sprites.drawFrame(ctx, 'corchea', 0, x - 4, -1, false);
        text(ctx, game.notes + '/' + game.corcheas.total(), x + 10, 3, '#ffe066');
        x += 42;
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

    drawTip(ctx, str, left, y) {
      const w = Math.min(W - 8, textWidth(ctx, str) + 10);
      const x = Math.round(W / 2 - w / 2);
      ctx.globalAlpha = Math.min(1, left / 0.4);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(x, y, w, 13);
      text(ctx, str, W / 2, y + 3, '#ffe066', 8, 'center');
      ctx.globalAlpha = 1;
      return y + 16;
    },

    drawSmallNote(ctx, str, y) {
      text(ctx, str, 4, y, '#ff6b6b', 8);
    },

    // Ventana de mensaje arriba (bajo el HUD). Los avisos cortos no muestran "cerrar"
    drawMessageBox(ctx, str, top, isHint) {
      const pad = 6;
      const boxW = W - 16;
      const lines = wrap(ctx, str, boxW - pad * 2);
      const boxH = lines.length * 11 + pad * 2 - 3;
      const x = 8;
      ctx.fillStyle = 'rgba(46, 42, 71, 0.92)';
      ctx.fillRect(x, top, boxW, boxH);
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, top + 0.5, boxW - 1, boxH - 1);
      lines.forEach(function (line, i) { text(ctx, line, x + pad, top + pad + i * 11, PAPER); });
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
      text(ctx, label, x + 12, y + 2, INK, 6);
    },

    // "Comienza la misión aquí" sobre el tótem (hasta empezar la misión)
    drawMissionSign(ctx, totem, time) {
      const cx = totem.x + T / 2;
      const y = Math.round(totem.y - 52 + Math.sin(time * 2) * 2);
      if (Sprites.drawFrame(ctx, 'cartel_mision', Sprites.frameAt('cartel_mision', time), cx - 24, y, false)) {
        text(ctx, 'Comienza la', cx, y + 3, INK, 5, 'center');
        text(ctx, 'misión aquí', cx, y + 9, INK, 5, 'center');
        return;
      }
      const w = 62;
      ctx.fillStyle = INK;
      ctx.fillRect(cx - w / 2 - 1, y - 1, w + 2, 18);
      ctx.fillStyle = '#f7e3a1';
      ctx.fillRect(cx - w / 2, y, w, 16);
      text(ctx, 'Comienza la', cx, y + 2, INK, 6, 'center');
      text(ctx, 'misión aquí', cx, y + 9, INK, 6, 'center');
      ctx.fillStyle = INK;
      ctx.fillRect(cx - 1, y + 16, 2, 6);
    },

    // Placa en cada paso con la sala a la que lleva ("Zona 1 · Sala 2"), si la papa está cerca
    drawExitSigns(ctx, game) {
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
        const label = e.blocked ? 'En obras' : WORLD.label(e.goes);
        const w = textWidth(ctx, label, 5) + 8;
        const x = Math.round(Math.min(Math.max(sx - w / 2, 2), game.level.pxW - w - 2));
        const y = Math.round(sy);
        if (!Sprites.drawFrame(ctx, 'cartel_zona', 0, x + w / 2 - 16, y - 3, false)) {
          ctx.fillStyle = INK;
          ctx.fillRect(x - 1, y - 1, w + 2, 10);
          ctx.fillStyle = e.blocked ? '#8a87a8' : '#b8b2a7';
          ctx.fillRect(x, y, w, 8);
        }
        text(ctx, label, x + w / 2, y + 2, INK, 5, 'center');
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

    // Nombre de la sala al entrar ("Zona 1 · Sala 2" y "Acequias Hondas")
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

    // Premio de un jefe, paso a paso: aura, poder (y cómo se usa), llave, monedas
    drawReward(ctx, game, O) {
      const s = O.steps[O.i];
      if (s.kind === 'aura') {
        ctx.fillStyle = 'rgba(27, 16, 53, ' + Math.min(0.5, O.t) + ')';
        ctx.fillRect(0, 0, W, H);
        return;
      }
      ctx.fillStyle = 'rgba(27, 16, 53, 0.7)';
      ctx.fillRect(0, 0, W, H);
      const x = 24;
      const y = 26;
      const w = W - 48;
      const h = H - 52;
      panel(ctx, x, y, w, h);
      let ty = y + 12;
      if (s.kind === 'power') {
        const pw = WORLD.power(s.power);
        PowerIcons.draw(ctx, s.power, W / 2, ty + 12, 24, false);
        ty += 30;
        text(ctx, '¡Nuevo poder: ' + pw.nombre + '!', W / 2, ty, INK, 8, 'center');
        ty += 14;
        wrap(ctx, 'Cómo se usa: ' + pw.como, w - 20, 6).forEach(function (line) {
          text(ctx, line, x + 10, ty, '#5b5478', 6);
          ty += 9;
        });
        if (s.opens && s.opens.length) {
          ty += 3;
          text(ctx, 'Ahora puedes llegar a:', x + 10, ty, INK, 6);
          ty += 9;
          s.opens.forEach(function (o) {
            wrap(ctx, '· ' + o, w - 24, 6).forEach(function (line) {
              text(ctx, line, x + 14, ty, '#5b5478', 6);
              ty += 8;
            });
          });
        }
      } else if (s.kind === 'key') {
        const k = WORLD.keyInfo(s.key);
        if (!Sprites.drawFrame(ctx, 'llave_color', WORLD.keyIndex(s.key), W / 2 - 8, ty, false)) {
          ctx.fillStyle = k.color;
          ctx.fillRect(W / 2 - 8, ty + 4, 7, 7);
          ctx.fillRect(W / 2 - 1, ty + 7, 9, 2);
        }
        Sprites.drawFrame(ctx, 'llave_brillo', Sprites.frameAt('llave_brillo', O.t), W / 2 - 8, ty, false);
        ty += 24;
        text(ctx, (O.boss ? O.boss + ' te dio la ' : '¡') + k.nombre.toLowerCase() + '!', W / 2, ty, INK, 7, 'center');
        ty += 14;
        wrap(ctx, k.abre, w - 20, 6).forEach(function (line) {
          text(ctx, line, W / 2, ty, '#5b5478', 6, 'center');
          ty += 9;
        });
        ty += 4;
        wrap(ctx, WORLD.keyOpensText(s.key), w - 20, 6).forEach(function (line) {
          text(ctx, line, W / 2, ty, '#5e8c6a', 6, 'center');
          ty += 9;
        });
      } else if (s.kind === 'coins') {
        Drops.drawCoin(ctx, W / 2 - 3, ty + 4, O.t);
        ty += 20;
        text(ctx, '¡+' + s.coins + ' monedas!', W / 2, ty, INK, 8, 'center');
        ty += 14;
        text(ctx, 'Se gastan con los vendedores.', W / 2, ty, '#5b5478', 6, 'center');
      } else if (s.kind === 'poliedro') {
        text(ctx, '¡' + s.poliedro.nombre + '!', W / 2, ty + 10, INK, 8, 'center');
        wrap(ctx, s.poliedro.que, w - 20, 6).forEach(function (line, i) {
          text(ctx, line, W / 2, ty + 26 + i * 9, '#5b5478', 6, 'center');
        });
      }
      if (O.t > 0.6 && Math.floor(game.time * 2) % 2 === 0) {
        text(ctx, 'Salto o E: seguir', W / 2, y + h - 12, '#9a93b0', 6, 'center');
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
      const rows = O.goods.map(function (g) { return { label: g.nombre, price: g.precio === 0 ? 'gratis' : String(g.precio) }; });
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
      wrap(ctx, note, w - 20, 6).forEach(function (line, i) {
        text(ctx, line, x + 10, y + h - 24 + i * 8, '#5e8c6a', 6);
      });
    },

    // Viajar entre tótems encendidos
    drawTravel(ctx, game, O) {
      ctx.fillStyle = 'rgba(27, 16, 53, 0.55)';
      ctx.fillRect(0, 0, W, H);
      const x = 50;
      const y = 26;
      const w = W - 100;
      const n = O.list.length + 1;
      const h = 30 + n * 13;
      panel(ctx, x, y, w, h);
      text(ctx, 'Viajar a otro tótem', W / 2, y + 8, INK, 8, 'center');
      O.list.concat(['__salir']).forEach(function (id, i) {
        const ry = y + 24 + i * 13;
        const on = i === O.index;
        if (on) {
          ctx.fillStyle = 'rgba(159, 211, 224, 0.6)';
          ctx.fillRect(x + 6, ry - 2, w - 12, 12);
        }
        const label = id === '__salir' ? 'Quedarme aquí' : WORLD.label(id) + ' · ' + WORLD.name(id);
        text(ctx, label, x + 12, ry, on ? INK : '#5b5478', 6);
      });
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

    drawLogo(ctx, time) {
      if (!Sprites.drawFrame(ctx, 'portada', 0, 0, 0, false)) {
        ctx.fillStyle = '#1b1035';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#2a1a4a';
        for (let i = 0; i < 12; i++) {
          ctx.fillRect((i * 37 + Math.floor(time * 10)) % (W + 20) - 20, 20 + (i * 53) % 90, 14, 6);
        }
      }
      if (Sprites.drawFrame(ctx, 'logo', 0, W / 2 - 80, 8, false)) return;
      text(ctx, 'CHASKIDO', W / 2 + 2, 30, '#5e2433', 24, 'center');
      text(ctx, 'CHASKIDO', W / 2, 28, '#ffd34d', 24, 'center');
      const frame = Sprites.frameAt('papa_correr', time);
      Sprites.drawFrame(ctx, 'papa_correr', frame, W / 2 - 8, 62, false);
    },

    drawSplash(ctx, time, canStart) {
      this.drawLogo(ctx, time);
      if (canStart && Math.floor(time * 2) % 2 === 0) shadowText(ctx, 'Pulsa un botón', W / 2, 118, '#ffffff', 8, 'center');
    },

    drawTitle(ctx, time, items, index, plus) {
      this.drawLogo(ctx, time);
      const M = CONFIG.TITLE_MENU;
      function info(id) {
        if (id === 'continue') return 'Sigue desde donde guardaste';
        if (id === 'tower') return 'Coliseo: ' + TOWER.FLOORS.length + ' jefes seguidos';
        const D = CONFIG.DIFFICULTY[id];
        if (!D) return 'Empiezas con el dash y el gancho';
        let str = 'Partida nueva: ' + D.LIVES + ' corazones';
        if (D.DAMAGE > 1) str += ', daño x' + D.DAMAGE;
        if (D.MISSION_TIME > 0) str += ', misión en ' + Math.round(D.MISSION_TIME / 60) + ' min';
        return str;
      }
      items.forEach(function (id, i) {
        const y = M.TOP + i * M.STEP;
        const on = i === index;
        const color = on ? '#ffd34d' : '#e6e2f0';
        let label = id === 'plus' ? 'Nueva partida +: ' + (plus ? 'Sí' : 'No') : '';
        if (id === 'tower') label = 'Coliseo de los jefes';
        else if (id === 'continue') label = 'Continuar';
        else if (!label) label = CONFIG.DIFFICULTY[id].NAME;
        if (on && Math.floor(time * 3) % 2 === 0) shadowText(ctx, '>', 92, y, '#ffd34d');
        shadowText(ctx, label, 104, y, color);
        if (on) shadowText(ctx, info(id), W / 2, H - 12, '#c9b8e3', 6, 'center');
      });
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
