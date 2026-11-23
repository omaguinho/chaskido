// Menú de pausa de Chaskido. Pestañas (izquierda/derecha o tocando el ícono):
//   Mapa      mapa del mundo: salas visitadas o compradas con el rollo de mapa
//   Zona      la sala actual en chico: puertas, tótem, posta, vendedor y la papa
//   Poderes   los 13 poderes (con el diapasón), las 7 llaves de color, corazones, notas,
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
      { id: 'codex', label: 'Códex', icon: -1 },
      { id: 'canciones', label: 'Canciones', icon: 3 },
      { id: 'guardar', label: 'Guardar', icon: 4 },
      { id: 'opciones', label: 'Opciones', icon: 5 }
    ];
  }

  static get OPTIONS() {
    return ['resume', 'music', 'sfx', 'master', 'light', 'rumble', 'touch', 'textSize', 'hud', 'datos', 'lang', 'quit'];
  }

  // Alto de cada fila de Opciones
  // Barra de volumen: dónde empieza y cuánto mide cada paso (px)
  static get BAR() { return { LEFT: 150, STEP: 9 }; }

  static get OPTION_STEP() {
    return 11;
  }

  // Marcas del mapa (cuadros de mapa_marcas.png)
  static get MARK() {
    return { PAPA: 0, POSTA: 1, TOTEM: 2, VENDOR: 3, BOSS: 4, HEART: 5, DOOR: 6, CORCHEA: 7 };
  }

  // Speedrun y coliseo: primero "Carrera" (reiniciar o salir), después Poderes y Opciones
  racing() { return this.game.mode === 'speedrun' || this.game.mode === 'tower'; }

  tabs() {
    const all = PauseMenu.TABS;
    if (this.racing()) {
      return [{ id: 'guardar', label: 'Carrera', icon: 4 }].concat(all.filter(function (t) { return t.id === 'poderes' || t.id === 'opciones'; }));
    }
    const quena = !!this.game.progress.abilities.quena;      // el Códex se abre con la quena
    return all.filter(function (t) { return t.id !== 'codex' || quena; });
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
      // Si escuchaste una canción en el menú, vuelve la música de la sala
      if (this.game.previewSong) {
        this.game.previewSong = null;
        this.game.startRoomMusic();
      }
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
    else if (tab === 'codex') this.updateCodex();
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
    if (item === 'datos') {                 // enviar el informe de juego anónimo
      if (step !== 0 || confirm) {
        G.settings.datos = !G.settings.datos;
        Save.writeSettings(G.settings);
        Sfx.play('select');
      }
      return;
    }
    if (item === 'touch') {                 // botones táctiles en pantalla
      if (step !== 0 || confirm) { Touch.toggle(); Sfx.play('select'); }
      return;
    }
    if (item === 'light') {
      if (step !== 0 || confirm) G.changeLight(step || 1);
      return;
    }
    if (item === 'textSize' || item === 'hud') {   // tamaño de letra y estilo de HUD
      if (step !== 0 || confirm) G.cycleSetting(item, step || 1);
      return;
    }
    if (item === 'lang') {
      if (step !== 0 || confirm) G.changeLang(step || 1);
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
    if (this.racing()) {
      const G = this.game, tower = G.mode === 'tower';
      this.close();
      if (row === 0) {                       // reiniciar
        if (tower) SpeedRun.startTower(G);
        else SpeedRun.start(G, G.speed ? G.speed.zone : 0);
      } else {                               // salir: al menú de zonas y coliseo
        if (tower) G.speedPick = CONFIG.SPEEDRUN.ZONES.length;
        SpeedRun.openMenu(G);
      }
      return;
    }
    if (row === 1) {
      this.close();
      return;
    }
    const ok = this.game.saveGame(null, true);
    this.notice = ok ? 'Partida guardada.' : 'No se pudo guardar (¿el navegador no deja guardar?).';
    this.noticeTime = 2.5;
    Sfx.play(ok ? 'save' : 'hurt');
  }

  // Carrera (speedrun / coliseo): reiniciar desde el principio o salir
  drawRace(ctx) {
    const tower = this.game.mode === 'tower';
    UI.panel(ctx, 40, 38, CONFIG.WIDTH - 80, 112);
    const ink = '#2e2a47';
    UI.text(ctx, tower ? 'Coliseo de los jefes' : 'Speedrun', CONFIG.WIDTH / 2, 50, ink, 8, 'center');
    [tower ? 'Reiniciar coliseo' : 'Reiniciar speedrun', 'Salir'].forEach(function (label, i) {
      const y = 108 + i * 16;
      const on = i === this.row;
      if (on) {
        ctx.fillStyle = 'rgba(233, 196, 106, 0.55)';
        ctx.fillRect(56, y - 2, CONFIG.WIDTH - 112, 12);
      }
      UI.text(ctx, label, CONFIG.WIDTH / 2, y, on ? ink : '#6b6385', 7, 'center');
    }, this);
  }

  // Poderes: arriba/abajo recorre poderes y llaves; izquierda/derecha cambia de pestaña
  updatePowers() {
    const n = CATALOGO.PODERES.length;          // ya no hay llaves
    if (Input.pressed('down')) {
      this.pick = (this.pick + 1) % n;
      Sfx.play('move');
    } else if (Input.pressed('up')) {
      this.pick = (this.pick + n - 1) % n;
      Sfx.play('move');
    }
  }

  // Canciones: arriba/abajo elige, Aceptar la escucha (los instrumentos de esa sala)
  updateSongs() {
    const songs = this.game.progress.songs;
    const n = songs.length;
    const view = 6;
    if (!n) return;
    this.songPick = Math.max(0, Math.min(n - 1, this.songPick || 0));
    if (Input.pressed('down')) { this.songPick = Math.min(n - 1, this.songPick + 1); Sfx.play('move'); }
    else if (Input.pressed('up')) { this.songPick = Math.max(0, this.songPick - 1); Sfx.play('move'); }
    if (this.songPick < this.scroll) this.scroll = this.songPick;
    if (this.songPick >= this.scroll + view) this.scroll = this.songPick - view + 1;
    if (Input.pressed('confirm')) this.playSong(songs[this.songPick]);
  }

  // Códex: arriba/abajo recorre la lista
  updateCodex() {
    const n = Codex.entries(this.game).length;
    this.codexPick = Math.max(0, Math.min(n - 1, this.codexPick || 0));
    if (Input.pressed('down')) { this.codexPick = Math.min(n - 1, this.codexPick + 1); Sfx.play('move'); }
    else if (Input.pressed('up')) { this.codexPick = Math.max(0, this.codexPick - 1); Sfx.play('move'); }
  }

  drawCodex(ctx) {
    const W = CONFIG.WIDTH, list = Codex.entries(this.game), cx = Codex.progress(this.game);
    const view = 8, step = 11, top = 46;
    this.codexScroll = Math.max(0, Math.min(this.codexScroll || 0, list.length - view));
    if (this.codexPick < this.codexScroll) this.codexScroll = this.codexPick;
    if (this.codexPick >= this.codexScroll + view) this.codexScroll = this.codexPick - view + 1;
    const fr = Codex.freed(this.game);
    UI.text(ctx, tr('Anotados') + ': ' + cx.got + ' / ' + cx.total + '    ' + tr('Liberados') + ': ' + fr.got + ' / ' + fr.total +
      '    ' + tr('Completado') + ': ' + Codex.completion(this.game) + '%',
      W / 2, 32, '#9fe3c8', 6, 'center');
    list.slice(this.codexScroll, this.codexScroll + view).forEach(function (e, i) {
      const k = this.codexScroll + i, on = k === this.codexPick, y = top + i * step;
      if (on) {
        ctx.fillStyle = 'rgba(159, 227, 200, 0.16)';
        ctx.fillRect(16, y - 2, W - 32, step - 1);
      }
      UI.text(ctx, tr(e.group), 22, y, '#9a93b0', 5);
      UI.text(ctx, tr(e.name), 78, y, e.name === '???' ? '#6b6580' : (on ? '#ffd34d' : '#fbf6ec'), 6);
      if (e.count) UI.text(ctx, e.count, W - 22, y, '#9a93b0', 5, 'right');
    }, this);
    const sel = list[this.codexPick];
    if (sel && sel.text) {
      UI.wrap(ctx, tr(sel.text), W - 40, 5).forEach(function (line, i) {
        UI.text(ctx, line, W / 2, top + view * step + 4 + i * 8, '#c9c2dd', 5, 'center');
      });
    }
  }

  // Suena la canción elegida (todas sus pistas juntas) con el menú abierto
  playSong(id) {
    if (!Music.hasStems(id)) return;
    Sfx.play('select');
    this.game.previewSong = id;
    Music.resume();
    Music.playStems(id, true);
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
      const r = Math.floor((p.y - top + 2) / (tab === 'opciones' ? PauseMenu.OPTION_STEP : 16));
      if (r >= 0 && r < this.rowCount(tab)) {
        this.row = r;
        if (tab === 'guardar') this.useSaveRow(r);
        else this.tapOption(PauseMenu.OPTIONS[r], p.x);
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

  // Toque en una fila de Opciones. Volúmenes: tocar la barra pone ese valor; los
  // botones − y + (a los lados) bajan o suben de a uno. Lo demás: tocar cambia/usa.
  tapOption(id, x) {
    const G = this.game;
    const B = PauseMenu.BAR;
    const v = G.settings[id];
    if (typeof v === 'number' && id !== 'light' && id !== 'textSize' && id !== 'hud') {
      if (x < B.LEFT - 2) { if (x > B.LEFT - 14) this.useOption(id, -1, false); return; }
      if (x >= B.LEFT + CONFIG.VOLUME.STEPS * B.STEP) { this.useOption(id, 1, false); return; }
      const want = Math.max(0, Math.min(CONFIG.VOLUME.STEPS, Math.floor((x - B.LEFT) / B.STEP) + 1));
      // El que ya está en ese valor y se vuelve a tocar el primero: queda en 0
      const target = want === 1 && v === 1 ? 0 : want;
      if (target !== v) this.useOption(id, target - v, false);
      return;
    }
    this.useOption(id, 0, true);
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
    else if (tab === 'codex') this.drawCodex(ctx);
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
      if (t.icon < 0 || !Sprites.drawFrame(ctx, 'menu_iconos', t.icon, x + 5, 4, false)) this.drawTabIcon(ctx, t.id, x + 13, 12, on);
    }, this);
    const label = list[this.tab].label;
    UI.shadowText(ctx, label, CONFIG.WIDTH / 2, 22, '#ffd34d', 7, 'center');
  }

  // Íconos de pestaña hechos con rectángulos (si falta menu_iconos.png)
  drawTabIcon(ctx, id, cx, cy, on) {
    const c = on ? '#2e2a47' : '#fbf6ec';
    ctx.fillStyle = c;
    if (id === 'codex') {                  // un libro abierto
      ctx.fillRect(cx - 6, cy - 4, 5, 9);
      ctx.fillRect(cx + 1, cy - 4, 5, 9);
      ctx.fillStyle = on ? '#e9c46a' : '#5b5478';
      ctx.fillRect(cx - 5, cy - 2, 3, 1);
      ctx.fillRect(cx + 2, cy - 2, 3, 1);
      ctx.fillRect(cx - 5, cy, 3, 1);
      ctx.fillRect(cx + 2, cy, 3, 1);
      return;
    }
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
    if (tab === 'canciones' || tab === 'codex') hint = '< > pestañas   arriba/abajo: ver más';
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
      if (rs.boss) this.mark(ctx, PauseMenu.MARK.BOSS, x + w - 3, y + 3, '#ff6b8a');
      if (rs.afinada) this.mark(ctx, PauseMenu.MARK.TOTEM, x + 3, y + 3, '#9fd3e0');
    }, this);


    if (herePlace && blink) {
      this.mark(ctx, PauseMenu.MARK.PAPA, ox + (herePlace.x + herePlace.w / 2) * UW, oy + (herePlace.y + herePlace.h / 2) * UH, '#ffd34d');
    }

    const region = WORLD.regionInfo(WORLD.region(here) || 1);
    const afinadas = Object.keys(P.rooms).filter(function (id) { return P.rooms[id].afinada; }).length;
    UI.shadowText(ctx, WORLD.fullName(here), ox, 154, region.color, 7);
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
    // Instrumentos que faltan: solo durante la misión de esta sala
    if (G.instrumentos && G.mission === 'collect') {
      G.instrumentos.remaining().forEach(function (c) {
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
        else if (ch === 'w' || ch === '{' || ch === '}') color = '#4d8cff';
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

  // Grilla: los poderes en 2 filas de 8 (caben 16)
  powerCell(i) {
    const nP = CATALOGO.PODERES.length;
    if (i < nP) return { x: 22 + (i % 8) * 39, y: 40 + Math.floor(i / 8) * 22 };
    return { x: 38 + (i - nP) * 40, y: 90 };
  }

  powerAt(px, py) {
    const n = CATALOGO.PODERES.length;
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

    // Instrumentos rescatados en todo el mundo (en vez de las llaves, que ya no existen)
    let got = 0, all = 0;
    Object.keys(CONFIG.MUSIC.LEVEL_STEMS).forEach(function (id) {
      const n = Object.keys(CONFIG.MUSIC.LEVEL_STEMS[id]).filter(function (t) { return t !== 'tema'; }).length;
      const rs = P.rooms[id];
      all += n;
      got += rs && rs.afinada ? n : ((rs && rs.caught) || []).filter(Boolean).length;
    });
    UI.text(ctx, 'Instrumentos rescatados: ' + got + ' / ' + all, 14, 86, '#ffd34d', 6);

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
      if (pw.id === 'tuner' && has) {
        this.lines(ctx, ['Mantén el botón: el anillo sube por las notas que sabes; suelta y suena. Con abajo, el bemol (nota blue).'], 16, 132, '#5b5478');
        this.drawTunerNotes(ctx, 16, 151);
        return;
      }
      const lines = has ? [pw.como, 'Abre: ' + pw.abre] : ['Se gana: ' + (pw.gana || 'al empezar')];
      this.lines(ctx, lines, 16, 132, '#5b5478');
    } else if (CATALOGO.LLAVES[this.pick - nP]) {
      const k = CATALOGO.LLAVES[this.pick - nP];
      const has = !!P.keys[k.id];
      UI.text(ctx, has ? k.nombre : k.nombre + '  (te falta)', 16, 121, has ? ink : '#6b6385', 7);
      const boss = WORLD.boss(k.jefe);
      const lines = has ? [k.abre] : ['La da ' + (boss ? boss.nombre : 'el jefe de ' + WORLD.regionInfo(k.region).nombre) + '.'];
      this.lines(ctx, lines, 16, 132, '#5b5478');
    }
  }

  // Las notas del diapasón en fila: las aprendidas con su color, las que faltan con "?"
  drawTunerNotes(ctx, x, y) {
    const T = CONFIG.TUNER;
    const known = this.game.knownNotes();
    const list = T.ORDER.concat(Object.keys(T.FLATS).map(function (n) { return T.FLATS[n]; }));
    list.forEach(function (n, i) {
      const N = T.NOTES[n];
      const cx = x + i * 28 + (i >= T.ORDER.length ? 8 : 0);
      if (known[n]) {
        UI.text(ctx, N.name, cx + 1, y + 1, '#2e2a47', 6);
        UI.text(ctx, N.name, cx, y, N.color, 6);
      }
      else UI.text(ctx, '?', cx + 4, y, '#9a93b0', 6);
    });
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
      UI.text(ctx, 'Afina una sala (atrapa sus 3 instrumentos)', CONFIG.WIDTH / 2, 94, '#9a93b0', 6, 'center');
      UI.text(ctx, 'y su canción queda aquí.', CONFIG.WIDTH / 2, 103, '#9a93b0', 6, 'center');
      return;
    }
    const pick = this.songPick || 0;
    const playing = this.game.previewSong;
    songs.slice(this.scroll, this.scroll + 6).forEach(function (id, i) {
      const k = this.scroll + i;
      const y = 40 + i * 18;
      const region = WORLD.regionInfo(WORLD.region(id));
      if (k === pick) {
        ctx.fillStyle = 'rgba(255, 211, 77, 0.16)';
        ctx.fillRect(12, y - 1, CONFIG.WIDTH - 24, 17);
      }
      ctx.fillStyle = region.color;
      ctx.fillRect(14, y + 1, 3, 13);
      const title = (playing === id ? '♪ ' : '') + CATALOGO.nombreMusica(id);
      UI.text(ctx, title, 22, y, k === pick ? '#ffd34d' : '#fbf6ec', 6);
      UI.text(ctx, WORLD.fullName(id), CONFIG.WIDTH - 16, y, '#9a93b0', 5, 'right');
      UI.text(ctx, CATALOGO.instrumentosDe(id).join(' · '), 22, y + 8, '#9fd3e0', 5);
    }, this);
    UI.text(ctx, 'Aceptar: escuchar', 22, 150, '#9a93b0', 5);
    UI.text(ctx, songs.length + ' / 21 canciones', CONFIG.WIDTH - 14, 150, '#9a93b0', 5, 'right');
  }

  // ---------- Guardar ----------

  drawSave(ctx) {
    if (this.racing()) return this.drawRace(ctx);
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
      UI.text(ctx, line, 50, 58 + i * 11, i === 3 ? '#c0504d' : '#5b5478', 6);
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
    const LABELS = { resume: 'Seguir', music: 'Música', sfx: 'Efectos', master: 'General', light: 'Luces', rumble: 'Vibración', touch: 'Táctil',
                     textSize: 'Letra', hud: 'Estilo de HUD', datos: 'Datos anónimos', lang: 'Idioma', quit: 'Salir al inicio' };
    const LIGHT = ['Apagadas', 'Simples', 'Completas'];
    const max = CONFIG.VOLUME.STEPS;
    const blink = Math.floor(this.time * 3) % 2 === 0;
    UI.text(ctx, G.rules().NAME + (G.plus ? ' +' : ''), CONFIG.WIDTH - 12, 28, '#9a93b0', 6, 'right');
    PauseMenu.OPTIONS.forEach(function (id, i) {
      const y = 40 + i * PauseMenu.OPTION_STEP;
      const on = i === this.row;
      const color = on ? '#ffd34d' : '#9a93b0';
      if (on && blink) UI.text(ctx, '>', 44, y, '#ffd34d');
      UI.text(ctx, LABELS[id], 56, y, color);
      if (id === 'lang') {
        UI.text(ctx, '< ' + I18N.name() + ' >', 150, y, color);
        return;
      }
      const v = id === 'touch' ? Touch.isOn() : G.settings[id];
      if (v === undefined) return;
      if (id === 'light') {
        UI.text(ctx, LIGHT[v], 150, y, color);
        return;
      }
      if (id === 'textSize') {
        const T = CONFIG.TEXT_SIZE.LIST[v];
        UI.text(ctx, '< ' + tr(T.name) + ' (' + T.pct + ') >', 150, y, color);
        return;
      }
      if (id === 'hud') {
        UI.text(ctx, '< ' + tr(CONFIG.HUD_STYLES[v]) + ' >', 150, y, color);
        return;
      }
      if (typeof v === 'boolean') {
        UI.text(ctx, v ? 'Sí' : 'No', 150, y, color);
        return;
      }
      const B = PauseMenu.BAR;
      UI.text(ctx, '−', B.LEFT - 8, y, color, 7, 'center');        // botones para el táctil
      for (let s = 0; s < max; s++) {
        ctx.fillStyle = s < v ? color : 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(B.LEFT + s * B.STEP, y + 1, B.STEP - 2, 6);
      }
      UI.text(ctx, '+', B.LEFT + max * B.STEP + 6, y, color, 7, 'center');
      UI.text(ctx, String(v), B.LEFT + max * B.STEP + 16, y, color);
    }, this);
    // "M: silencio" a la derecha, al lado de la última fila (no encima)
    UI.text(ctx, 'M: silencio', CONFIG.WIDTH - 12, 40 + (PauseMenu.OPTIONS.length - 1) * PauseMenu.OPTION_STEP + 1, '#6b6385', 5, 'right');
    const problem = Music.lastError();
    if (problem) UI.text(ctx, problem, CONFIG.WIDTH / 2, 158, '#ff6b8a', 4.5, 'center');
  }
}
