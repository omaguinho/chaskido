// Dibujo y contacto de los objetos del mapa (ver ITEM_TYPES en js/level.js).
// Cada uno usa su sprite si está; si no, un dibujo por código.
const Items = (function () {
  const T = CONFIG.TILE;
  const NOTE_COLORS = ['#F2A28C', '#F4A261', '#F7E3A1', '#BFE3C8', '#9FD3E0', '#C9B8E3', '#E07A8F'];
  const NOTE_NAMES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];

  function bob(time, speed, amount, seed) {
    return Math.round(Math.sin(time * speed + seed) * amount);
  }

  function sprite(ctx, name, item, time, dy) {
    const frame = Sprites.frameAt(name, time + item.seed * 0.1);
    return Sprites.drawFrame(ctx, name, frame, item.x, item.y + (dy || 0), false);
  }

  // Centrado en la celda y apoyado en su piso
  function anchored(ctx, name, frame, item, flip) {
    return Sprites.drawAnchored(ctx, name, frame, item.x + T / 2, item.y + T, !!flip);
  }

  function outline(ctx, x, y, w, h) {
    ctx.strokeStyle = '#2e2a47';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, w - 1, h - 1);
  }

  // ---------- Objetos que se toman ----------

  function drawCube(ctx, item, time) {
    const dy = bob(time, 3, 1, item.seed);
    if (sprite(ctx, 'cubo', item, time, dy)) return;
    const x = item.x + 3;
    const y = item.y + 3 + dy;
    ctx.fillStyle = '#b8b2a7';
    ctx.fillRect(x, y, 10, 10);
    ctx.fillStyle = '#9fd3e0';
    ctx.fillRect(x + 2, y + 2, 6, 1);
    ctx.fillRect(x + 2, y + 5, 4, 1);
    ctx.fillRect(x + 4, y + 7, 4, 1);
    outline(ctx, x, y, 10, 10);
  }

  function drawKey(ctx, item, time) {
    const dy = bob(time, 4, 2, 0);
    if (sprite(ctx, 'llave', item, time, dy)) return;
    ctx.fillStyle = '#e9c46a';
    ctx.fillRect(item.x + 3, item.y + 5 + dy, 5, 5);
    ctx.fillRect(item.x + 8, item.y + 7 + dy, 6, 2);
    ctx.fillRect(item.x + 12, item.y + 9 + dy, 2, 2);
  }

  function drawCoin(ctx, item, time) {
    const dy = bob(time, 3, 1, item.seed);
    if (sprite(ctx, 'moneda', item, time, dy)) return;
    const squash = Math.abs(Math.cos(time * 4 + item.seed));
    const w = Math.max(2, Math.round(10 * squash));
    const x = item.x + 8 - w / 2;
    const y = item.y + 3 + dy;
    ctx.fillStyle = '#e0a020';
    ctx.fillRect(x, y, w, 10);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(x + 1, y + 1, Math.max(1, w - 2), 8);
  }

  // Nota de la escala: un color por nota (Do coral... Si rosa fuerte)
  function drawScaleNote(ctx, item, time) {
    const i = Math.max(0, NOTE_NAMES.indexOf(item.props.nota || 'Do'));
    const dy = bob(time, 3, 2, item.seed);
    if (Sprites.drawFrame(ctx, 'nota_escala', i, item.x, item.y + dy, false)) return;
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(time * 5);
    ctx.fillStyle = NOTE_COLORS[i];
    ctx.beginPath();
    ctx.arc(item.x + 8, item.y + 8 + dy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = NOTE_COLORS[i];
    ctx.fillRect(item.x + 4, item.y + 9 + dy, 5, 4);
    ctx.fillRect(item.x + 8, item.y + 2 + dy, 2, 9);
    ctx.fillRect(item.x + 8, item.y + 2 + dy, 5, 2);
  }

  function drawInstrument(ctx, item, time) {
    const name = 'instrumento_' + (item.props.cual || 'cuerdas');
    const dy = bob(time, 2, 2, item.seed);
    if (SPRITES[name] && sprite(ctx, name, item, time, dy)) return;
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(time * 4);
    ctx.fillStyle = '#f7e3a1';
    ctx.fillRect(item.x - 2, item.y - 2 + dy, 20, 20);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e9c46a';
    ctx.fillRect(item.x + 3, item.y + 6 + dy, 10, 7);
    ctx.fillStyle = '#a0784a';
    ctx.fillRect(item.x + 6, item.y + 1 + dy, 3, 6);
    outline(ctx, item.x + 3, item.y + 6 + dy, 10, 7);
  }

  function drawPoliedro(ctx, item, time) {
    const name = 'poliedro_' + (item.props.forma || 'piramide');
    const dy = bob(time, 3, 2, item.seed);
    if (SPRITES[name] && sprite(ctx, name, item, time, dy)) return;
    const p = CATALOGO.POLIEDROS.find(function (x) { return x.id === item.props.forma; });
    ctx.fillStyle = p ? p.color : '#ffffff';
    ctx.beginPath();
    ctx.moveTo(item.x + 8, item.y + 2 + dy);
    ctx.lineTo(item.x + 14, item.y + 13 + dy);
    ctx.lineTo(item.x + 2, item.y + 13 + dy);
    ctx.fill();
  }

  function drawHeart(ctx, item, time) {
    const beat = 1 + 0.12 * Math.max(0, Math.sin(time * 6));
    if (Sprites.has('corazon_extra')) {
      sprite(ctx, 'corazon_extra', item, time, bob(time, 2, 1, 0));
      return;
    }
    ctx.save();
    ctx.translate(item.x + 8, item.y + 9);
    ctx.scale(beat, beat);
    ctx.fillStyle = '#e07a8f';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-9, -1, -5, -8, 0, -3);
    ctx.bezierCurveTo(5, -8, 9, -1, 0, 6);
    ctx.fill();
    ctx.strokeStyle = '#2e2a47';
    ctx.stroke();
    ctx.restore();
  }

  function drawFruit(ctx, item, time) {
    const dy = bob(time, 4, 1, item.seed);
    if (Sprites.drawFrame(ctx, 'fruta', item.seed % 3, item.x, item.y + dy, false)) return;
    const colors = ['#e07a8f', '#f4a261', '#f7e3a1'];
    ctx.fillStyle = colors[item.seed % 3];
    ctx.beginPath();
    ctx.arc(item.x + 8, item.y + 9 + dy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5e8c6a';
    ctx.fillRect(item.x + 8, item.y + 2 + dy, 3, 3);
  }

  function drawColorKey(ctx, item, time) {
    const k = WORLD.keyIndex(item.props.color);
    const info = WORLD.keyInfo(item.props.color);
    const dy = bob(time, 3, 2, item.seed);
    if (Sprites.drawFrame(ctx, 'llave_color', Math.max(0, k), item.x, item.y + dy, false)) {
      Sprites.drawFrame(ctx, 'llave_brillo', Sprites.frameAt('llave_brillo', time), item.x, item.y + dy, false);
      return;
    }
    ctx.fillStyle = info ? info.color : '#9fd3e0';
    ctx.fillRect(item.x + 2, item.y + 4 + dy, 6, 6);
    ctx.fillRect(item.x + 8, item.y + 6 + dy, 7, 2);
    ctx.fillRect(item.x + 12, item.y + 8 + dy, 2, 3);
    outline(ctx, item.x + 2, item.y + 4 + dy, 6, 6);
  }

  function drawMapRoll(ctx, item, time) {
    if (sprite(ctx, 'rollo_mapa', item, time, bob(time, 2, 1, 0))) return;
    ctx.fillStyle = '#f3e3c3';
    ctx.fillRect(item.x + 2, item.y + 5, 12, 6);
    ctx.fillStyle = '#d98b6a';
    ctx.fillRect(item.x + 7, item.y + 5, 2, 6);
    outline(ctx, item.x + 2, item.y + 5, 12, 6);
  }

  function drawChili(ctx, item, time) {
    const dy = bob(time, 3, 1, item.seed);
    if (sprite(ctx, 'aji', item, time, dy)) return;
    const y = item.y + dy;
    ctx.fillStyle = '#ff4d3a';
    ctx.fillRect(item.x + 5, y + 5, 5, 4);
    ctx.fillRect(item.x + 6, y + 9, 4, 3);
    ctx.fillRect(item.x + 8, y + 12, 2, 2);
    ctx.fillStyle = '#3fd16b';
    ctx.fillRect(item.x + 6, y + 3, 3, 2);
  }

  function drawHookItem(ctx, item, time) {
    const dy = bob(time, 3, 2, item.seed);
    if (sprite(ctx, 'gancho', item, time, dy)) return;
    ctx.globalAlpha = 0.3 + 0.2 * Math.sin(time * 6);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(item.x - 1, item.y - 1 + dy, 18, 18);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#c98a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(item.x + 7, item.y + 9 + dy, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawFinal(ctx, item, time) {
    const dy = bob(time, 2, 2, 0);
    if (sprite(ctx, 'quipu_dorado', item, time, dy)) return;
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(time * 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(item.x - 3, item.y - 3 + dy, 22, 22);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(item.x + 2, item.y + 2 + dy, 12, 12);
  }

  // ---------- Cosas del lugar ----------

  // Banderita: si pierdes un corazón por caer, vuelves aquí
  function drawSave(ctx, item, time) {
    if (Sprites.has('banderita')) {
      const frame = item.active ? 1 + Math.floor(time * 3) % 2 : 0;
      Sprites.drawFrame(ctx, 'banderita', frame, item.x, item.y, false);
      return;
    }
    ctx.fillStyle = '#cfcad9';
    ctx.fillRect(item.x + 7, item.y + 1, 2, 15);
    ctx.fillStyle = item.active ? '#7be0a0' : '#5a5f6e';
    ctx.fillRect(item.x + 9, item.y + 1, 6, 2);
    ctx.fillRect(item.x + 9, item.y + 3, 4, 2);
    ctx.fillRect(item.x + 9, item.y + 5, 2, 1);
  }

  function drawHook(ctx, item, on) {
    if (Sprites.drawFrame(ctx, 'anilla', on ? 1 : 0, item.x, item.y, false)) return;
    ctx.globalAlpha = on ? 1 : 0.4;
    ctx.strokeStyle = on ? '#f0b860' : '#f0d9a8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(item.x + 8, item.y + 8, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
  }

  // Tótem de la canción (2 x 3 bloques): dormido, despierto (misión) o activo (portal)
  function drawTotem(ctx, item, time) {
    const st = item.state || 'dormido';
    const name = st === 'activo' ? 'totem_activo' : st === 'despierto' ? 'totem_despierto' : 'totem_apagado';
    if (anchored(ctx, name, Sprites.frameAt(name, time), item)) return;
    const x = item.x - 8;
    const y = item.y + T - 48;
    if (st === 'activo') {
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time * 3);
      ctx.fillStyle = '#9fd3e0';
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 24, 17, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = st === 'dormido' ? '#8a87a8' : '#b8b2a7';
    ctx.fillRect(x + 6, y + 4, 20, 44);
    ctx.fillStyle = '#5b5478';
    ctx.fillRect(x + 4, y + 2, 24, 4);
    ctx.fillRect(x + 4, y + 44, 24, 4);
    // Cara serena y hueco del pecho
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(x + 11, y + 12, 3, 2);
    ctx.fillRect(x + 18, y + 12, 3, 2);
    ctx.fillRect(x + 13, y + 18, 6, 1);
    const glow = st === 'dormido' ? '#5b5478' : (st === 'activo' ? '#9fd3e0' : '#f7e3a1');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x + 16, y + 30, st === 'despierto' ? 4 + Math.sin(time * 6) : 4, 0, Math.PI * 2);
    ctx.fill();
    outline(ctx, x + 6, y + 4, 20, 44);
  }

  // Posta de descanso: banco de piedra con fogón (encendida cuando ya descansaste)
  function drawPosta(ctx, item, time) {
    if (anchored(ctx, 'posta', item.active ? 3 : 0, item)) {
      if (item.active) Sprites.drawAnchored(ctx, 'posta_llama', Sprites.frameAt('posta_llama', time), item.x + T / 2 + 6, item.y + T - 10, false);
      return;
    }
    const x = item.x - 8;
    const y = item.y + T - 16;
    ctx.fillStyle = '#b8b2a7';
    ctx.fillRect(x + 2, y + 8, 20, 6);
    ctx.fillRect(x + 4, y + 14, 3, 2);
    ctx.fillRect(x + 17, y + 14, 3, 2);
    outline(ctx, x + 2, y + 8, 20, 6);
    ctx.fillStyle = '#5b5478';
    ctx.fillRect(x + 24, y + 10, 7, 6);
    if (item.active) {
      ctx.fillStyle = Math.floor(time * 8) % 2 ? '#f4a261' : '#f7e3a1';
      ctx.fillRect(x + 25, y + 5 + Math.round(Math.sin(time * 9)), 5, 5);
    }
    ctx.fillStyle = '#8a87a8';
    ctx.fillRect(x + 28, y - 10, 1, 20);
  }

  function drawSign(ctx, item) {
    if (Sprites.drawFrame(ctx, 'cartel', 0, item.x, item.y, false)) return;
    ctx.fillStyle = '#a0784a';
    ctx.fillRect(item.x + 7, item.y + 8, 2, 8);
    ctx.fillStyle = '#e8c58e';
    ctx.fillRect(item.x + 1, item.y + 2, 14, 8);
    outline(ctx, item.x + 1, item.y + 2, 14, 8);
    ctx.fillStyle = '#a0784a';
    ctx.fillRect(item.x + 3, item.y + 5, 10, 1);
  }

  // Piedra del poder: el símbolo brilla si ya lo tienes
  function drawPowerStone(ctx, item, has) {
    const power = item.props.poder || 'doubleJump';
    const i = WORLD.powerIndex(power);
    if (Sprites.drawFrame(ctx, 'piedra_poder', Math.max(0, i), item.x, item.y, false,
        has ? null : '#8a87a8', has ? 0 : 0.7)) return;
    ctx.fillStyle = '#b8b2a7';
    ctx.fillRect(item.x + 2, item.y + 3, 12, 13);
    outline(ctx, item.x + 2, item.y + 3, 12, 13);
    PowerIcons.draw(ctx, power, item.x + 8, item.y + 9, 8, !has);
  }

  // Puerta de salita (Q) y puerta de salida (R): miden 2 bloques de alto
  function drawSalitaDoor(ctx, item, time, open) {
    const y = item.y + T - 32;
    if (Sprites.drawFrame(ctx, 'puerta_q', open ? 1 : 0, item.x, y, false)) return;
    const bonus = item.props.tipo === 'bonus';
    ctx.fillStyle = '#5b5478';
    ctx.fillRect(item.x, y + 4, T, 28);
    ctx.fillStyle = bonus ? '#e07a8f' : '#c98a5c';
    ctx.fillRect(item.x + 2, y + 6, T - 4, 26);
    ctx.fillStyle = '#f7e3a1';
    ctx.fillRect(item.x + 6, y + Math.round(Math.sin(time * 4)), 4, 4);
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(item.x + 10, y + 19, 2, 2);
    outline(ctx, item.x, y + 4, T, 28);
  }

  function drawBackDoor(ctx, item) {
    const y = item.y + T - 32;
    if (Sprites.drawFrame(ctx, 'puerta_r', 1, item.x, y, false)) return;
    ctx.fillStyle = '#5b5478';
    ctx.fillRect(item.x, y + 4, T, 28);
    ctx.fillStyle = '#6fa8c7';
    ctx.fillRect(item.x + 2, y + 6, T - 4, 26);
    ctx.fillStyle = '#fbf6ec';
    ctx.fillRect(item.x + 4, y + 16, 8, 2);
    ctx.fillRect(item.x + 4, y + 14, 2, 6);
    outline(ctx, item.x, y + 4, T, 28);
  }

  // Vendedor: el Mercader (alto, con mochila) o la Cocinera (redonda, con olla)
  function drawVendor(ctx, item, time, talking) {
    const tipo = item.props.tipo || 'viajero';
    const base = tipo === 'cocinera' ? 'cocinera' : 'mercader';
    const name = base + (talking ? '_hablar' : (base === 'cocinera' ? '_quieta' : '_quieto'));
    // Mostrador delante (si está su sprite)
    const counter = DECO_SPRITES.mostrador;
    if (anchored(ctx, name, Sprites.frameAt(name, time), item, true)) {
      Sprites.drawFrame(ctx, counter.file, 0, item.x - 16, item.y + T - 20, false);
      return;
    }
    const x = item.x - 4;
    const y = item.y + T - 30;
    const sway = Math.round(Math.sin(time * 2) * 1);
    if (base === 'cocinera') {
      ctx.fillStyle = '#f4a261';
      ctx.beginPath();
      ctx.ellipse(x + 12, y + 18 + sway, 10, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbf6ec';
      ctx.fillRect(x + 6, y + 18 + sway, 12, 10);
      ctx.fillStyle = '#5b5478';
      ctx.fillRect(x + 20, y + 22, 8, 6);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fbf6ec';
      ctx.fillRect(x + 22, y + 14 - Math.round(time * 6) % 6, 2, 4);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#c9b8e3';
      ctx.fillRect(x + 6, y + 6 + sway, 12, 24);
      ctx.fillStyle = '#a0784a';
      ctx.fillRect(x + 16, y + 10 + sway, 7, 12);
      ctx.fillStyle = '#5b5478';
      ctx.fillRect(x + 2, y + 2 + sway, 20, 3);
      ctx.fillStyle = '#e9c46a';
      ctx.fillRect(x + 8, y + 9 + sway, 3, 2);
      ctx.fillRect(x + 13, y + 9 + sway, 3, 2);
    }
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(x + 9, y + 12 + sway, 1, 1);
    ctx.fillRect(x + 14, y + 12 + sway, 1, 1);
    // Mostrador
    ctx.fillStyle = '#a0784a';
    ctx.fillRect(item.x - 14, item.y + 6, 44, 10);
    ctx.fillStyle = '#e8c58e';
    ctx.fillRect(item.x - 14, item.y + 6, 44, 2);
    outline(ctx, item.x - 14, item.y + 6, 44, 10);
  }

  // Contacto con el jugador (con un pequeño margen)
  function overlaps(item, p) {
    const m = 3;
    return p.x < item.x + item.w - m && p.x + p.w > item.x + m &&
           p.y < item.y + item.h - m && p.y + p.h > item.y + m;
  }

  // Zona para hablar o usar algo grande (tótem, posta, vendedor, puertas)
  function nearBox(item) {
    if (item.type === 'totem') return { x: item.x - 8, y: item.y - 32, w: 32, h: 48 };
    if (item.type === 'vendor') return { x: item.x - 20, y: item.y - 16, w: 56, h: 32 };
    if (item.type === 'posta') return { x: item.x - 12, y: item.y - 8, w: 40, h: 24 };
    if (item.type === 'salitaDoor' || item.type === 'backDoor') return { x: item.x, y: item.y - 16, w: T, h: 32 };
    return { x: item.x - 4, y: item.y - 4, w: T + 8, h: T + 8 };
  }

  // opts: { hookOn, has(power), talking }
  function draw(ctx, item, time, opts) {
    switch (item.type) {
      case 'cube': drawCube(ctx, item, time); break;
      case 'key': drawKey(ctx, item, time); break;
      case 'coin': drawCoin(ctx, item, time); break;
      case 'scaleNote': drawScaleNote(ctx, item, time); break;
      case 'instrument': drawInstrument(ctx, item, time); break;
      case 'poliedro': drawPoliedro(ctx, item, time); break;
      case 'heart': drawHeart(ctx, item, time); break;
      case 'fruit': drawFruit(ctx, item, time); break;
      case 'colorKey': drawColorKey(ctx, item, time); break;
      case 'mapRoll': drawMapRoll(ctx, item, time); break;
      case 'chili': drawChili(ctx, item, time); break;
      case 'hookItem': drawHookItem(ctx, item, time); break;
      case 'final': drawFinal(ctx, item, time); break;
      case 'save': drawSave(ctx, item, time); break;
      case 'hook': drawHook(ctx, item, opts.hookOn); break;
      case 'totem': drawTotem(ctx, item, time); break;
      case 'posta': drawPosta(ctx, item, time); break;
      case 'sign': drawSign(ctx, item); break;
      case 'powerStone': drawPowerStone(ctx, item, opts.has(item.props.poder || 'doubleJump')); break;
      case 'salitaDoor': drawSalitaDoor(ctx, item, time, opts.near === item); break;
      case 'backDoor': drawBackDoor(ctx, item); break;
      case 'vendor': drawVendor(ctx, item, time, opts.talking === item); break;
    }
  }

  return { draw: draw, overlaps: overlaps, nearBox: nearBox, NOTE_NAMES: NOTE_NAMES, NOTE_COLORS: NOTE_COLORS };
})();
