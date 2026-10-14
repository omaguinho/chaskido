// Menú de pausa de Chaskido. Pestañas (izquierda/derecha o tocando el ícono):
//   Mapa      mapa del mundo: salas visitadas o compradas con el rollo de mapa
//   Zona      la sala actual en chico: puertas, tótem, posta, vendedor y la papa
//   Poderes   los 12 poderes, las 7 llaves de color, corazones, notas,
//             instrumentos y poliedros conseguidos
//   Canciones las canciones de las salas afinadas
//   Guardar   guarda la partida
//   Opciones  seguir, volumen, vibración y salir al inicio
// En el coliseo solo están Poderes y Opciones.
// Íconos opcionales: menu_iconos.png (6 pestañas), mapa_marcas.png (8 marcas),
// poderes.png (12 símbolos), menu_marco.png (marco). Sin ellos se dibuja con código.
class PauseMenu {
  constructor(game) {
    this.game = game;
    this.open = false;
    this.tab = 0;
    this.row = -1;          // -1: la barra de pestañas; 0 o más: una fila de la pestaña
    this.pick = 0;          // poder o llave elegida en la pestaña Poderes
    this.scroll = 0;        // primera canción a la vista
    this.notice = '';       // "Partida guardada", etc.
    this.noticeTime = 0;
    this.time = 0;
    this.zoneCache = null;  // dibujo de la sala actual (se arma una vez por sala)
  }

  // ---------- Datos fijos ----------

  static get TABS() {
    return [
      { id: 'mapa', label: 'Mapa', icon: 0 },
      { id: 'zona', label: 'Zona', icon: 1 },
      { id: 'poderes', label: 'Poderes', icon: 2 },
      { id: 'canciones', label: 'Canciones', icon: 3 },
      { id: 'guardar', label: 'Guardar', icon: 4 },
      { id: 'opciones', label: 'Opciones', icon: 5 }
    ];
  }

  static get OPTIONS() {
    return ['resume', 'music', 'sfx', 'master', 'rumble', 'quit'];
  }

  // Marcas del mapa (cuadros de mapa_marcas.png)
  static get MARK() {
    return { PAPA: 0, POSTA: 1, TOTEM: 2, VENDOR: 3, BOSS: 4, HEART: 5, DOOR: 6, CORCHEA: 7 };
  }

  tabs() {
    const all = PauseMenu.TABS;
    if (this.game.mode === 'tower') return all.filter(function (t) { return t.id === 'poderes' || t.id === 'opciones'; });
    return all;
  }

  current() {
    const list = this.tabs();
    this.tab = clamp(this.tab, 0, list.length - 1);
    return list[this.tab].id;
  }

  // ---------- Abrir y cerrar ----------

  toggle() {
    this.open = !this.open;
    Sfx.play('pause');
    if (this.open) {
      Music.pause();
      this.row = -1;
      this.notice = '';
      this.zoneCache = null;
      // Se abre en la segunda pestaña: Zona en la historia, Opciones en el coliseo
      this.tab = 1;
    } else {
      Music.resume();
    }
  }

  close() {
    if (this.open) this.toggle();
  }

  // ---------- Controles ----------

  update() {
    const dt = 1 / 60;
    this.time += dt;
    this.noticeTime = Math.max(0, this.noticeTime - dt);
    if (this.handleTap()) return;

    const tab = this.current();
    const rows = this.rowCount(tab);
    const step = (Input.pressed('right') ? 1 : 0) - (Input.pressed('left') ? 1 : 0);

    // En la barra de pestañas (o en una pestaña sin filas) izquierda/derecha cambia de pestaña
    if (this.row < 0 || rows === 0 || tab === 'poderes') {
      if (step !== 0 && !(tab === 'poderes' && this.row >= 0)) {
        this.switchTab(step);
        return;
      }
    }

    if (tab === 'poderes') this.updatePowers(step);
    else if (tab === 'canciones') this.updateSongs();
    else if (rows > 0) this.updateRows(tab, rows, step);
  }

  switchTab(step) {
    const n = this.tabs().length;
    this.tab = (this.tab + step + n) % n;
    this.row = -1;
    Sfx.play('move');
  }

  rowCount(tab) {
    if (tab === 'opciones') return PauseMenu.OPTIONS.length;
    if (tab === 'guardar') return 2;
    return 0;
  }

  // Filas (Guardar y Opciones): abajo entra a las filas, arriba en la primera vuelve a las pestañas
  updateRows(tab, rows, step) {
    if (Input.pressed('down')) {
      this.row = Math.min(rows - 1, this.row + 1);
      Sfx.play('move');
    } else if (Input.pressed('up')) {
      this.row = Math.max(-1, this.row - 1);
      Sfx.play('move');
    }
    if (this.row < 0) {
      if (Input.pressed('confirm')) {
        this.row = 0;
        Sfx.play('move');
      }
      return;
    }
    if (tab === 'opciones') this.useOption(PauseMenu.OPTIONS[this.row], step, Input.pressed('confirm'));
    else if (Input.pressed('confirm')) this.useSaveRow(this.row);
  }

  useOption(item, step, confirm) {
    const G = this.game;
    if (item === 'rumble') {
      if (step !== 0 || confirm) G.toggleRumble();
      return;
    }
    if (step !== 0 && G.settings[item] !== undefined) {
      G.changeVolume(item, step);
      return;
    }
    if (!confirm) return;
    if (item === 'resume') this.close();
    else if (item === 'quit') {
      this.open = false;
      G.openTitle();
    }
  }

  useSaveRow(row) {
    if (row === 1) {
      this.close();
      return;
    }
    const ok = this.game.saveGame();
    this.notice = ok ? 'Partida guardada.' : 'No se pudo guardar (¿el navegador no deja guardar?).';
    this.noticeTime = 2.5;
    Sfx.play(ok ? 'save' : 'hurt');
  }

  // Poderes: arriba/abajo recorre poderes y llaves; izquierda/derecha cambia de pestaña
  updatePowers() {
    const n = CATALOGO.PODERES.length + CATALOGO.LLAVES.length;
    if (Input.pressed('down')) {
      this.pick = (this.pick + 1) % n;
      Sfx.play('move');
    } else if (Input.pressed('up')) {
      this.pick = (this.pick + n - 1) % n;
      Sfx.play('move');
    }
  }

  updateSongs() {
    const n = this.game.progress.songs.length;
    const view = 7;
    if (Input.pressed('down')) this.scroll = Math.min(Math.max(0, n - view), this.scroll + 1);
    else if (Input.pressed('up')) this.scroll = Math.max(0, this.scroll - 1);
  }

  // Toques en pantalla: pestañas arriba, filas en Guardar y Opciones, poderes en su grilla
  handleTap() {
    const p = Input.tapPoint();
    if (!p) return false;
    const list = this.tabs();
    if (p.y < 24) {
      const i = Math.floor((p.x - this.tabsLeft(list.length)) / 26);
      if (i >= 0 && i < list.length) {
        this.tab = i;
        this.row = -1;
        Sfx.play('move');
      }
      return true;
    }
    const tab = this.current();
    if (tab === 'opciones' || tab === 'guardar') {
      const top = tab === 'opciones' ? 40 : 108;
      const r = Math.floor((p.y - top + 2) / 16);
      if (r >= 0 && r < this.rowCount(tab)) {
        const same = r === this.row;
        this.row = r;
        if (tab === 'guardar') this.useSaveRow(r);
        else if (same || PauseMenu.OPTIONS[r] === 'resume' || PauseMenu.OPTIONS[r] === 'quit' || PauseMenu.OPTIONS[r] === 'rumble') {
          this.useOption(PauseMenu.OPTIONS[r], 0, true);
        } else if (p.x > 150) {
          // Tocar la barra de volumen: a la izquierda baja, a la derecha sube
          this.useOption(PauseMenu.OPTIONS[r], p.x > 200 ? 1 : -1, false);
        }
        return true;
      }
    }
    if (tab === 'poderes') {
      const hit = this.powerAt(p.x, p.y);
      if (hit >= 0) {
        this.pick = hit;
        Sfx.play('move');
        return true;
      }
    }
    return false;
  }

  tabsLeft(n) {
    return Math.round((CONFIG.WIDTH - n * 26) / 2);
  }

  // ---------- Dibujo ----------

  draw(ctx) {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    ctx.fillStyle = 'rgba(20, 14, 40, 0.82)';
    ctx.fillRect(0, 0, W, H);
    this.drawTabs(ctx);
    const tab = this.current();
    if (tab === 'mapa') this.drawWorldMap(ctx);
    else if (tab === 'zona') this.drawZone(ctx);
    else if (tab === 'poderes') this.drawPowers(ctx);
    else if (tab === 'canciones') this.drawSongs(ctx);
    else if (tab === 'guardar') this.drawSave(ctx);
    else this.drawOptions(ctx);
    this.drawFooter(ctx, tab);
  }

  drawTabs(ctx) {
    const list = this.tabs();
    const left = this.tabsLeft(list.length);
    const blink = Math.floor(this.time * 3) % 2 === 0;
    list.forEach(function (t, i) {
      const x = left + i * 26;
      const on = i === this.tab;
      ctx.fillStyle = on ? '#e9c46a' : 'rgba(251, 246, 236, 0.18)';
      ctx.fillRect(x + 1, 3, 24, 19);
      if (on && this.row < 0 && blink) {
        ctx.fillStyle = '#fbf6ec';
        ctx.fillRect(x + 1, 21, 24, 1);
      }
      if (!Sprites.drawFrame(ctx, 'menu_iconos', t.icon, x + 5, 4, false)) this.drawTabIcon(ctx, t.id, x + 13, 12, on);
    }, this);
    const label = list[this.tab].label;
    UI.shadowText(ctx, label, CONFIG.WIDTH / 2, 25, '#ffd34d', 8, 'center');
  }

  // Íconos de pestaña hechos con rectángulos (si falta menu_iconos.png)
  drawTabIcon(ctx, id, cx, cy, on) {
    const c = on ? '#2e2a47' : '#fbf6ec';
    ctx.fillStyle = c;
    if (id === 'mapa') {
      ctx.fillRect(cx - 6, cy - 5, 12, 10);
      ctx.fillStyle = on ? '#e9c46a' : '#5b5478';
      ctx.fillRect(cx - 4, cy - 3, 3, 3);
      ctx.fillRect(cx + 1, cy, 3, 3);
    } else if (id === 'zona') {
      ctx.fillRect(cx - 6, cy + 3, 12, 2);
      ctx.fillRect(cx - 6, cy - 5, 2, 8);
      ctx.fillRect(cx + 1, cy - 1, 5, 2);
    } else if (id === 'poderes') {
      ctx.fillRect(cx - 1, cy - 6, 2, 12);
      ctx.fillRect(cx - 6, cy - 1, 12, 2);
      ctx.fillRect(cx - 3, cy - 3, 6, 6);
    } else if (id === 'canciones') {
      ctx.fillRect(cx - 4, cy + 1, 4, 4);
      ctx.fillRect(cx - 1, cy - 6, 2, 9);
      ctx.fillRect(cx - 1, cy - 6, 6, 2);
    } else if (id === 'guardar') {
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
      ctx.fillStyle = on ? '#e9c46a' : '#5b5478';
      ctx.fillRect(cx - 3, cy - 5, 6, 3);
    } else {
      ctx.fillRect(cx - 5, cy - 4, 10, 2);
      ctx.fillRect(cx - 5, cy, 10, 2);
      ctx.fillRect(cx - 5, cy + 4, 10, 2);
    }
  }

  drawFooter(ctx, tab) {
    let hint = '< > pestañas   Pausa: seguir';
    if (tab === 'poderes') hint = '< > pestañas   arriba/abajo: elegir';
    if (tab === 'canciones') hint = '< > pestañas   arriba/abajo: ver más';
    if ((tab === 'opciones' || tab === 'guardar') && this.row >= 0) hint = 'arriba/abajo: elegir   < >: cambiar   E: aceptar';
    else if (tab === 'opciones' || tab === 'guardar') hint = '< > pestañas   abajo: entrar';
    UI.text(ctx, hint, CONFIG.WIDTH / 2, CONFIG.HEIGHT - 9, '#9a93b0', 6, 'center');
    if (this.noticeTime > 0) UI.shadowText(ctx, this.notice, CONFIG.WIDTH / 2, CONFIG.HEIGHT - 20, '#7bd389', 7, 'center');
  }

  mark(ctx, frame, cx, cy, fallbackColor) {
    if (Sprites.drawFrame(ctx, 'mapa_marcas', frame, Math.round(cx - 4), Math.round(cy - 4), false)) return;
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(Math.round(cx - 2), Math.round(cy - 2), 5, 5);
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(Math.round(cx - 1), Math.round(cy - 1), 3, 3);
  }

  // ---------- Mapa del mundo ----------

  // ¿Se ve esta sala en el mapa? (visitada, o la región comprada con el rollo)
  roomShown(r) {
    const P = this.game.progress;
    return !!P.visited[r.id] || (!!P.mapRegions[r.r] && WORLD.built(r.id));
  }

  drawWorldMap(ctx) {
    const P = this.game.progress;
    const UW = 6;
    const UH = 4;
    const ox = 22;
    const oy = 36;
    UI.panel(ctx, ox - 6, oy - 4, 46 * UW + 12, 29 * UH + 8, 'rgba(46, 42, 71, 0.92)');
    const here = this.game.level.id;
    const herePlace = WORLD.room(here) || WORLD.room(this.game.salitaReturn ? this.game.salitaReturn.room : '');
    const blink = Math.floor(this.time * 3) % 2 === 0;
    let shown = 0;

    WORLD.ROOMS.forEach(function (r) {
      if (!this.roomShown(r)) return;
      shown++;
      const info = WORLD.regionInfo(r.r);
      const rs = P.rooms[r.id] || {};
      const x = ox + r.x * UW;
      const y = oy + r.y * UH;
      const w = r.w * UW - 1;
      const h = r.h * UH - 1;
      const seen = !!P.visited[r.id];
      ctx.globalAlpha = seen ? 1 : 0.45;
      ctx.fillStyle = info.color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rs.afinada || !/^\d/.test(r.num) ? 'rgba(255,255,255,0.25)' : 'rgba(46, 42, 71, 0.45)';
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.globalAlpha = 1;
      UI.text(ctx, r.num, x + w / 2, y + h / 2 - 3, '#2e2a47', 5, 'center');
      if (rs.boss) this.mark(ctx, PauseMenu.MARK.BOSS, x + w - 3, y + 3, '#ff6b8a');
      if (rs.afinada) this.mark(ctx, PauseMenu.MARK.TOTEM, x + 3, y + 3, '#9fd3e0');
    }, this);

    // Puertas de color: la llave junto a la sala que la tiene
    Object.keys(WORLD.KEY_DOORS).forEach(function (key) {
      const from = WORLD.room(WORLD.KEY_DOORS[key][0]);
      if (!from || !this.roomShown(from)) return;
      const k = WORLD.keyInfo(key);
      const x = ox + from.x * UW + from.w * UW - 2;
      const y = oy + from.y * UH + from.h * UH - 3;
      ctx.fillStyle = P.keys[key] ? k.color : '#5b5478';
      ctx.fillRect(x - 1, y - 1, 3, 3);
    }, this);

    if (herePlace && blink) {
      this.mark(ctx, PauseMenu.MARK.PAPA, ox + (herePlace.x + herePlace.w / 2) * UW, oy + (herePlace.y + herePlace.h / 2) * UH, '#ffd34d');
    }

    const region = WORLD.regionInfo(WORLD.region(here) || 1);
    const afinadas = Object.keys(P.rooms).filter(function (id) { return P.rooms[id].afinada; }).length;
    UI.shadowText(ctx, region.nombre, ox, 154, region.color, 7);
    UI.text(ctx, 'Salas afinadas: ' + afinadas + ' / 21', ox + 46 * UW, 154, '#fbf6ec', 6, 'right');
    if (shown === 0) UI.text(ctx, 'Todavía no hay salas en el mapa.', CONFIG.WIDTH / 2, 90, '#fbf6ec', 7, 'center');
    if (!P.mapRegions[region.id]) UI.text(ctx, 'Compra el rollo de mapa para ver la región entera.', ox, 163, '#9a93b0', 5);
  }

  // ---------- Mapa de la sala actual ----------

  drawZone(ctx) {
    const G = this.game;
    const L = G.level;
    const P = G.progress;
    const rs = P.rooms[L.id] || {};
    const areaW = 300;
    const areaH = 104;
    const s = Math.max(1, Math.min(4, Math.floor(Math.min(areaW / L.cols, areaH / L.rowCount))));
    const mw = L.cols * s;
    const mh = L.rowCount * s;
    const ox = Math.round((CONFIG.WIDTH - mw) / 2);
    const oy = 38 + Math.round((areaH - mh) / 2);
    UI.panel(ctx, ox - 6, oy - 6, mw + 12, mh + 12, 'rgba(46, 42, 71, 0.92)');
    ctx.drawImage(this.zoneImage(L, s), ox, oy);

    // Salidas (verde: abierta, gris: en obras)
    L.exits.forEach(function (e) {
      ctx.fillStyle = e.blocked ? '#6b6385' : '#7bd389';
      ctx.fillRect(ox + e.x * s, oy + e.y * s, Math.max(1, e.w * s), Math.max(1, e.h * s));
    });
    // Puertas de color
    L.colorDoors.forEach(function (d) {
      if (!d.top) return;
      ctx.fillStyle = L.openDoors[d.tx + ',' + d.ty] ? 'rgba(255,255,255,0.4)' : UI.keyColor(d.color);
      ctx.fillRect(ox + d.tx * s, oy + d.ty * s, s, s * 3);
    });
    // Objetos que ayudan a orientarse
    const M = PauseMenu.MARK;
    L.items.forEach(function (it) {
      const cx = ox + (it.x + (it.w || 16) / 2) / CONFIG.TILE * s;
      const cy = oy + (it.y + (it.h || 16) / 2) / CONFIG.TILE * s;
      if (it.type === 'totem') this.mark(ctx, M.TOTEM, cx, cy, rs.afinada ? '#ffd34d' : '#9fd3e0');
      else if (it.type === 'posta') this.mark(ctx, M.POSTA, cx, cy, '#ff9a6b');
      else if (it.type === 'vendor') this.mark(ctx, M.VENDOR, cx, cy, '#7bd389');
      else if (it.type === 'heart' && !it.taken) this.mark(ctx, M.HEART, cx, cy, '#ff6b8a');
      else if (it.type === 'salitaDoor') this.mark(ctx, M.DOOR, cx, cy, '#e9c46a');
      else if (it.type === 'scaleNote' && !it.taken && this.hinted(L.id, it)) this.mark(ctx, M.CORCHEA, cx, cy, '#ffd34d');
    }, this);
    if (L.boss && !rs.boss && L.bossSpawn) {
      this.mark(ctx, M.BOSS, ox + L.bossSpawn.tx * s + s / 2, oy + L.bossSpawn.ty * s, '#ff6b8a');
    }
    // Corcheas que faltan (con la Pirámide sonora o durante la misión)
    if (G.corcheas && (P.poliedros.piramide || G.mission === 'collect')) {
      G.corcheas.remaining().forEach(function (c) {
        if (c.state === 'asleep' && !P.poliedros.piramide) return;
        this.mark(ctx, M.CORCHEA, ox + (c.x + c.w / 2) / CONFIG.TILE * s, oy + (c.y + c.h / 2) / CONFIG.TILE * s, '#ffe066');
      }, this);
    }
    if (Math.floor(this.time * 3) % 2 === 0) {
      const p = G.player;
      this.mark(ctx, M.PAPA, ox + (p.x + p.w / 2) / CONFIG.TILE * s, oy + (p.y + p.h / 2) / CONFIG.TILE * s, '#ffd34d');
    }

    // Debajo: nombre, estado y notas de la escala de esta zona
    const zone = L.region || 1;
    const notes = P.notes[zone] || {};
    const title = WORLD.label(L.id) + ' · ' + L.name;
    UI.shadowText(ctx, title, 12, 148, '#fbf6ec', 7);
    const state = L.kind !== 'principal' ? '' : (rs.afinada ? 'Afinada' : 'Sin afinar');
    UI.text(ctx, state, CONFIG.WIDTH - 12, 148, rs.afinada ? '#7bd389' : '#ff9a6b', 6, 'right');
    UI.text(ctx, 'Notas de la zona:', 12, 159, '#9a93b0', 6);
    ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'].forEach(function (n, i) {
      UI.text(ctx, n, 84 + i * 18, 159, notes[n] ? '#ffd34d' : '#5b5478', 6);
    });
  }

  hinted(roomId, item) {
    return this.game.progress.hints.some(function (h) { return h.room === roomId && h.nota === item.props.nota; });
  }

  // La sala en chico: se dibuja una sola vez en un lienzo aparte
  zoneImage(L, s) {
    if (this.zoneCache && this.zoneCache.id === L.id && this.zoneCache.s === s && this.zoneCache.broken === L.brokenCells.length) {
      return this.zoneCache.canvas;
    }
    const canvas = document.createElement('canvas');
    canvas.width = L.cols * s;
    canvas.height = L.rowCount * s;
    const c = canvas.getContext('2d');
    const region = WORLD.regionInfo(L.region || 1);
    for (let ty = 0; ty < L.rowCount; ty++) {
      for (let tx = 0; tx < L.cols; tx++) {
        const ch = L.tileAt(tx, ty);
        let color = null;
        if ('#BTX<>12'.indexOf(ch) >= 0) color = region.color;
        else if (ch === '=' || ch === '_' || ch === 'G' || ch === 'L') color = '#c9c2d6';
        else if (ch === '^') color = '#ff6b8a';
        else if (ch === 'w') color = '#4d8cff';
        else if (ch === '~') color = '#9fd3e0';
        else if (ch === 'A') color = '#e9c46a';
        if (!color) continue;
        c.fillStyle = color;
        c.fillRect(tx * s, ty * s, s, s);
      }
    }
    this.zoneCache = { id: L.id, s: s, broken: L.brokenCells.length, canvas: canvas };
    return canvas;
  }

  // ---------- Poderes, llaves y colección ----------

  // Grilla: 12 poderes en 2 filas de 6, luego 7 llaves en una fila
  powerCell(i) {
    const nP = CATALOGO.PODERES.length;
    if (i < nP) return { x: 30 + (i % 6) * 46, y: 40 + Math.floor(i / 6) * 22 };
    return { x: 38 + (i - nP) * 40, y: 90 };
  }

  powerAt(px, py) {
    const n = CATALOGO.PODERES.length + CATALOGO.LLAVES.length;
    for (let i = 0; i < n; i++) {
      const c = this.powerCell(i);
      if (Math.abs(px - c.x) < 14 && Math.abs(py - c.y) < 10) return i;
    }
    return -1;
  }

  drawPowers(ctx) {
    const G = this.game;
    const P = G.progress;
    const nP = CATALOGO.PODERES.length;
    UI.panel(ctx, 8, 30, CONFIG.WIDTH - 16, 70, 'rgba(46, 42, 71, 0.92)');

    CATALOGO.PODERES.forEach(function (pw, i) {
      const c = this.powerCell(i);
      const has = pw.id === 'run' || !!G.abilities[pw.id];
      if (i === this.pick) this.cursor(ctx, c.x, c.y);
      PowerIcons.draw(ctx, pw.id, c.x, c.y, 14, !has);
      if (!has) {
        ctx.fillStyle = 'rgba(46, 42, 71, 0.55)';
        ctx.fillRect(c.x - 7, c.y - 7, 14, 14);
      }
    }, this);

    UI.text(ctx, 'Llaves', 14, 86, '#9a93b0', 5);
    CATALOGO.LLAVES.forEach(function (k, i) {
      const c = this.powerCell(nP + i);
      if (nP + i === this.pick) this.cursor(ctx, c.x, c.y);
      this.drawKey(ctx, c.x, c.y, k.color, !!P.keys[k.id]);
    }, this);

    // Colección
    const y = 106;
    for (let i = 0; i < P.maxHearts; i++) UI.heart(ctx, 12 + i * 9, y, i < G.hearts);
    UI.text(ctx, 'Corazones ' + P.maxHearts + ' / ' + CONFIG.GAME.MAX_HEARTS, 12 + Math.max(P.maxHearts, 3) * 9 + 4, y, '#fbf6ec', 6);
    const inst = Object.keys(P.instruments).length;
    const poli = Object.keys(P.poliedros).length;
    UI.text(ctx, 'Monedas ' + P.coins + '   Instrumentos ' + inst + ' / 7   Poliedros ' + poli + ' / 7', CONFIG.WIDTH - 12, y, '#fbf6ec', 6, 'right');

    // Ficha de lo elegido
    UI.panel(ctx, 8, 116, CONFIG.WIDTH - 16, 46);
    const ink = '#2e2a47';
    if (this.pick < nP) {
      const pw = CATALOGO.PODERES[this.pick];
      const has = pw.id === 'run' || !!G.abilities[pw.id];
      UI.text(ctx, has ? pw.nombre : '???  (todavía no lo tienes)', 16, 121, ink, 7);
      const lines = has ? [pw.como, 'Abre: ' + pw.abre] : ['Se gana: ' + (pw.gana || 'al empezar')];
      this.lines(ctx, lines, 16, 132, '#5b5478');
    } else {
      const k = CATALOGO.LLAVES[this.pick - nP];
      const has = !!P.keys[k.id];
      UI.text(ctx, has ? k.nombre : k.nombre + '  (te falta)', 16, 121, has ? ink : '#6b6385', 7);
      const boss = WORLD.boss(k.jefe);
      const lines = has ? [k.abre] : ['La da ' + (boss ? boss.nombre : 'el jefe de la zona ' + k.region) + '.'];
      this.lines(ctx, lines, 16, 132, '#5b5478');
    }
  }

  lines(ctx, list, x, y, color) {
    let row = 0;
    list.forEach(function (str) {
      UI.wrap(ctx, str, CONFIG.WIDTH - 36, 6).forEach(function (line) {
        if (row < 3) UI.text(ctx, line, x, y + row * 8, color, 6);
        row++;
      });
    });
  }

  cursor(ctx, cx, cy) {
    if (Math.floor(this.time * 3) % 2 !== 0) return;
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 10.5, cy - 9.5, 21, 19);
  }

  drawKey(ctx, cx, cy, color, has) {
    const x = Math.round(cx - 7);
    const y = Math.round(cy - 4);
    if (has && Sprites.has('llave_color')) {
      ctx.save();
      Sprites.drawFrame(ctx, 'llave_color', 0, x, y - 4, false, color, 0.6);
      ctx.restore();
      return;
    }
    ctx.fillStyle = has ? color : '#3d3760';
    ctx.fillRect(x, y, 6, 6);
    ctx.fillRect(x + 6, y + 2, 7, 2);
    ctx.fillRect(x + 10, y + 4, 2, 3);
    ctx.fillStyle = has ? '#2e2a47' : '#2a2545';
    ctx.fillRect(x + 2, y + 2, 2, 2);
  }

  // ---------- Canciones ----------

  drawSongs(ctx) {
    const P = this.game.progress;
    UI.panel(ctx, 8, 36, CONFIG.WIDTH - 16, 122, 'rgba(46, 42, 71, 0.92)');
    const songs = P.songs;
    if (!songs.length) {
      UI.text(ctx, 'Todavía no hay canciones.', CONFIG.WIDTH / 2, 80, '#fbf6ec', 7, 'center');
      UI.text(ctx, 'Afina una sala (atrapa sus corcheas y vuelve al tótem)', CONFIG.WIDTH / 2, 94, '#9a93b0', 6, 'center');
      UI.text(ctx, 'y su canción queda aquí.', CONFIG.WIDTH / 2, 103, '#9a93b0', 6, 'center');
      return;
    }
    songs.slice(this.scroll, this.scroll + 7).forEach(function (id, i) {
      const L = LEVELS.find(function (l) { return l.id === id; });
      const y = 42 + i * 16;
      const region = WORLD.regionInfo(WORLD.region(id));
      ctx.fillStyle = region.color;
      ctx.fillRect(14, y + 1, 3, 11);
      UI.text(ctx, WORLD.label(id) + ' · ' + WORLD.name(id), 22, y, '#fbf6ec', 6);
      const song = L ? CATALOGO.nombreMusica(L.music || 'main', L.pitch || 0) : '';
      UI.text(ctx, song, 22, y + 7, '#9fd3e0', 5);
    });
    UI.text(ctx, songs.length + ' / 21 canciones', CONFIG.WIDTH - 14, 150, '#9a93b0', 5, 'right');
  }

  // ---------- Guardar ----------

  drawSave(ctx) {
    const G = this.game;
    const P = G.progress;
    UI.panel(ctx, 40, 38, CONFIG.WIDTH - 80, 112);
    const ink = '#2e2a47';
    UI.text(ctx, 'Guardar partida', CONFIG.WIDTH / 2, 44, ink, 8, 'center');
    const here = WORLD.label(G.level.id) + ' · ' + G.level.name;
    const info = [
      'Estás en: ' + here,
      'Corazones: ' + G.hearts + ' / ' + P.maxHearts + '    Monedas: ' + P.coins,
      'Vuelves en el último lugar seguro (o en la posta).'
    ];
    if (G.mission === 'collect' || G.mission === 'escape') info.push('La misión de esta sala empieza de nuevo.');
    info.forEach(function (line, i) {
      UI.text(ctx, line, 50, 58 + i * 10, i === 3 ? '#c0504d' : '#5b5478', 6);
    });
    ['Guardar ahora', 'Volver al juego'].forEach(function (label, i) {
      const y = 108 + i * 16;
      const on = i === this.row;
      if (on) {
        ctx.fillStyle = 'rgba(233, 196, 106, 0.55)';
        ctx.fillRect(56, y - 2, CONFIG.WIDTH - 112, 12);
      }
      UI.text(ctx, label, CONFIG.WIDTH / 2, y, on ? ink : '#6b6385', 7, 'center');
    }, this);
  }

  // ---------- Opciones ----------

  drawOptions(ctx) {
    const G = this.game;
    const LABELS = { resume: 'Seguir', music: 'Música', sfx: 'Efectos', master: 'General', rumble: 'Vibración', quit: 'Salir al inicio' };
    const max = CONFIG.VOLUME.STEPS;
    const blink = Math.floor(this.time * 3) % 2 === 0;
    UI.text(ctx, G.rules().NAME + (G.plus ? ' +' : ''), CONFIG.WIDTH - 12, 28, '#9a93b0', 6, 'right');
    PauseMenu.OPTIONS.forEach(function (id, i) {
      const y = 40 + i * 16;
      const on = i === this.row;
      const color = on ? '#ffd34d' : '#9a93b0';
      if (on && blink) UI.text(ctx, '>', 44, y, '#ffd34d');
      UI.text(ctx, LABELS[id], 56, y, color);
      const v = G.settings[id];
      if (v === undefined) return;
      if (typeof v === 'boolean') {
        UI.text(ctx, v ? 'Sí' : 'No', 150, y, color);
        return;
      }
      for (let s = 0; s < max; s++) {
        ctx.fillStyle = s < v ? color : 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(150 + s * 9, y + 1, 7, 6);
      }
      UI.text(ctx, String(v), 246, y, color);
    }, this);
    UI.text(ctx, 'M: silencio', CONFIG.WIDTH / 2, 140, '#6b6385', 6, 'center');
    const problem = Music.lastError();
    if (problem) UI.text(ctx, problem, CONFIG.WIDTH / 2, 150, '#ff6b8a', 5, 'center');
  }
}
