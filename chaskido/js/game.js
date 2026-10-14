// El juego: el mundo de salas unidas por pasos, la misión de cada sala (tótem,
// corcheas, llave), los corazones, monedas y llaves, las salitas, los retos,
// las etapas bonus, los jefes, el viaje entre tótems y la partida guardada.

// Textos de la partida
const TEXT = {
  intro: 'Muévete con A/D o el joystick. Salta con Espacio o X. Corre manteniendo E o Cuadrado. Toca el tótem para empezar la misión.',
  missionStart: function (n) { return '¡Misión iniciada! Las ' + n + ' corcheas despertaron. Si te ven, huyen: atrápalas.'; },
  missionTimed: function (n, t) { return '¡Misión iniciada! Tienes ' + t + ' para atrapar las ' + n + ' corcheas, tomar la llave y volver.'; },
  escape: '¡Apareció la llave! Tómala y llévala al tótem antes de que termine la canción.',
  timeout: 'Se acabó la canción. Las corcheas volvieron a dormir: toca el tótem para intentarlo otra vez.',
  afinada: function (song) { return '¡La sala se afinó! «' + song + '» entró al Catálogo de músicas.'; },
  totemBusy: function (n) { return 'Faltan ' + n + (n === 1 ? ' corchea.' : ' corcheas.'); },
  totemKey: 'Busca la llave y tráela antes de que termine la canción.',
  noTravel: 'Todavía no hay otros tótems encendidos. Afina otra sala para viajar.',
  rested: 'Descansaste junto al fogón: corazones llenos. Partida guardada.',
  saved: 'Banderita: si pierdes un corazón por caer, vuelves aquí.',
  wallBroken: '¡Rompiste el muro con el dash!',
  gateClosed: 'Un portón cerrado. Se abre al afinar esta sala.',
  doorOpened: function (k) { return '¡La ' + k.nombre.toLowerCase() + ' abrió la puerta!'; },
  doorNeeds: function (k, jefe) { return 'Puerta ' + k.id + ': la abre la ' + k.nombre.toLowerCase() + (jefe ? ', que da ' + jefe + '.' : '.'); },
  sealNeeds: function (p) { return 'Sello de poder: se abre con ' + p + '.'; },
  stone: function (p, has) { return 'Piedra del poder: ' + p + (has ? '. Ya lo tienes.' : '. Todavía no lo tienes.'); },
  notBuilt: 'Este paso lleva a una sala que todavía está en obras.',
  missionLeft: function (room) { return 'Dejaste la misión de ' + room + '. Vuelve a su tótem para empezarla otra vez.'; },
  missionKept: 'La misión sigue: tus corcheas te esperan.',
  arenaClosed: '¡La arena se cerró! Derrota a los guardias.',
  bossArena: function (name) { return '¡La arena se cerró! ' + name; },
  towerFloorDone: function (n) { return '¡Piso ' + n + ' superado!'; },
  bossWonNoGift: '¡Jefe vencido!',
  scaleNote: function (n, zone, count) { return '¡Nota ' + n + ' de la Zona ' + zone + '! (' + count + ' de 7)'; },
  instrument: function (name) { return '¡Encontraste ' + name + '! Su ficha está en el Catálogo de músicas.'; },
  poliedro: function (p) { return '¡' + p.nombre + '! ' + p.que; },
  heart: function (n) { return '¡Corazón extra! Ahora tienes ' + n + ' corazones.'; },
  colorKey: function (k) { return '¡Encontraste la ' + k.nombre.toLowerCase() + '! ' + k.abre; },
  mapRoll: function (z) { return '¡Rollo de mapa! Ya ves toda la Zona ' + z + ' en el mapa.'; },
  bonusStart: function (n, t) { return n > 0 ? '¡Come las ' + n + ' frutas en ' + t + ' segundos!' : '¡Llega a la meta en ' + t + ' segundos!'; },
  bonusWon: function (coins) { return '¡Bonus completo! +' + coins + ' monedas.'; },
  bonusAgain: '¡Bonus completo otra vez!',
  bonusHeart: function (n) { return '¡Te comiste todas las frutas! Corazón extra: ahora tienes ' + n + '.'; },
  bonusLost: 'Se acabó el tiempo.',
  chiliUsed: 'Comiste el ají para llevar.',
  gameSaved: 'Partida guardada.',
  cantSave: 'No se pudo guardar (el navegador no deja).'
};

const TIPS = {
  cube: 'Cubo sonoro: junta 5 y recuperas un corazón.',
  coin: 'Moneda: se gasta con los vendedores.',
  chili: 'Ají: por 5 segundos eres invencible, corres y saltas más.',
  save: 'Banderita: si caes, vuelves aquí.'
};

const ENDINGS = {
  bad: { title: 'Final malo', color: '#ff9a3c', lines: ['El mensaje llegó tarde...', 'Juega en Normal para otro final.'] },
  normal: { title: '¡Mensaje entregado!', color: '#ffd34d', lines: ['La canción llegó a tiempo.', 'En Difícil hay un final más.'] },
  true: { title: 'Final verdadero', color: '#7be0a0', lines: ['¡La papa mensajera más veloz!', 'Desbloqueaste Nueva partida +.'] }
};

const OPPOSITE = { left: 'right', right: 'left', top: 'bottom', bottom: 'top', inside: 'inside' };

class Game {
  constructor() {
    this.time = 0;
    this.state = 'splash';
    this.debug = false;
    this.settings = Save.loadSettings();
    this.records = Save.loadRecords();
    this.applyVolume();
    this.difficulty = CONFIG.DIFFICULTY.DEFAULT;
    this.plus = false;
    this.mode = 'story';            // 'story' o 'tower' (coliseo de los jefes)
    this.towerFloor = 0;
    this.towerNext = 0;
    this.musicNear = 0;
    this.showAreas = false;
    this.titleIndex = 0;
    this.menu = new PauseMenu(this);
    this.newRun();
    this.loadRoom(CONFIG.GAME.FIRST_ROOM, null);
    this.openTitle();
  }

  rules() {
    return CONFIG.DIFFICULTY[this.difficulty];
  }

  // ---------- Partida y progreso ----------

  // Todo lo que se guarda de una partida
  newProgress() {
    const abilities = {};
    CONFIG.GAME.START_ABILITIES.forEach(function (id) { abilities[id] = true; });
    if (this.plus) CONFIG.NEW_GAME_PLUS_ABILITIES.forEach(function (id) { abilities[id] = true; });
    return {
      difficulty: this.difficulty, plus: this.plus,
      room: CONFIG.GAME.FIRST_ROOM, spot: null, posta: null,
      abilities: abilities, keys: {}, maxHearts: this.rules().LIVES, hearts: this.rules().LIVES,
      coins: 0, cubes: 0, chili: 0,
      rooms: {}, visited: {}, mapRegions: {}, songs: [],
      notes: {}, instruments: {}, poliedros: {}, hints: []
    };
  }

  newRun() {
    this.progress = this.newProgress();
    this.hearts = this.progress.maxHearts;
    this.tipsShown = {};
    this.tip = null;
    this.salitaReturn = null;
  }

  // Estado guardado de una sala: objetos tomados, muros rotos, puertas, misión
  roomState(id) {
    const rooms = this.progress.rooms;
    if (!rooms[id]) rooms[id] = { taken: {}, broken: [], doors: {}, seals: {}, afinada: false, boss: false, bonus: false };
    return rooms[id];
  }

  get abilities() {
    return this.progress.abilities;
  }

  // Guarda la partida: sala y lugar donde se vuelve (la posta, o el último punto seguro)
  saveGame(spot) {
    if (this.mode !== 'story') return false;
    const P = this.progress;
    const back = this.salitaReturn;
    if (back) {
      // Dentro de una salita se guarda la sala de afuera, delante de su puerta
      const T = CONFIG.TILE;
      P.room = back.room;
      P.spot = { x: back.item.x + (T - this.player.w) / 2, y: back.item.y + T - this.player.h };
    } else {
      P.room = this.level.id;
      P.spot = spot || { x: this.player.spawnX, y: this.player.spawnY };
    }
    P.hearts = this.hearts;
    P.difficulty = this.difficulty;
    P.plus = this.plus;
    const ok = Save.writeGame(P);
    this.savedIcon = ok ? 1.6 : 0;
    return ok;
  }

  continueGame() {
    const data = Save.loadGame();
    if (!data) return false;
    this.difficulty = data.difficulty || 'normal';
    this.plus = !!data.plus;
    this.mode = 'story';
    this.newRun();
    this.progress = Object.assign(this.newProgress(), data);
    this.hearts = Math.max(1, data.hearts || this.progress.maxHearts);
    this.loadRoom(LEVELS.some(function (l) { return l.id === data.room; }) ? data.room : CONFIG.GAME.FIRST_ROOM,
      data.spot ? { spot: data.spot } : null);
    this.state = 'play';
    this.startRoomMusic();
    return true;
  }

  // ---------- Salas ----------

  levelData(id) {
    return LEVELS.find(function (l) { return l.id === id; }) || null;
  }

  // arrive: null (inicio P), { spot }, { exit, from, offset, vx, vy } (por un paso),
  // { totem: true } (viaje) o { item: { x, y } } (volver a una puerta Q)
  loadRoom(id, arrive) {
    const data = this.levelData(id) || LEVELS[0];
    this.levelIndex = LEVELS.indexOf(data);
    const L = this.level = new Level(data);
    const rs = this.roomState(L.id);
    L.powers = this.abilities;
    L.openDoors = Object.assign({}, rs.doors);
    L.exits.forEach(function (e) { if (!WORLD.built(e.goes)) L.blockExit(e); });
    L.gateOpen = rs.afinada || L.kind !== 'principal';
    if (rs.broken.length) L.removeCells(rs.broken);
    L.seals.forEach(function (s) { if (rs.seals[s.tx + ',' + s.ty]) s.dust = true; });
    L.items.forEach(function (it) {
      if (rs.taken[it.key]) it.taken = true;
      if (it.type === 'totem') it.state = rs.afinada ? 'activo' : 'dormido';
      if (it.type === 'posta') it.active = !!this.progress.posta && this.progress.posta.room === L.id;
      if (it.type === 'key') it.hidden = true;
    }, this);

    this.player = new Player(L.spawn.x, L.spawn.y);
    this.player.abilities = this.abilities;
    this.corcheas = new Corcheas(L);
    this.enemies = new Enemies(L);
    this.drops = new Drops();
    const b = L.bossSpawn;
    const type = L.boss ? L.boss.type : 'bombo';
    this.boss = b && !rs.boss && BOSS_TYPES[type] ? new BOSS_TYPES[type](b.tx, b.ty) : null;
    this.arenaPhase = this.boss ? 'idle' : 'done';
    if (this.boss) this.boss.hidden = this.enemies.hasArenaEnemies();

    this.mission = rs.afinada ? 'done' : 'idle';
    this.notes = 0;
    this.hasKey = false;
    this.timeLeft = L.time;
    this.missionClock = 0;
    this.lastTick = 0;
    this.keyTime = 0;
    this.sparkTimer = 0;
    this.message = null;
    this.prompt = null;
    this.exitGrace = false;
    this.paused = false;
    this.overlay = null;          // reward, shop, travel, towerIntro
    this.bonus = null;
    this.bossWind = 0;
    Effects.clear();

    this.placePlayer(arrive);
    this.camera = { x: 0, y: 0 };
    this.updateCamera(1);
    this.markVisited(L.id);
    this.setupBonus();
    Backdrop.set(L.theme);
    // Sin afinar, la sala se ve apagada; las de CONFIG.GAME.FULL_COLOR_ROOMS empiezan con color
    const fullColor = CONFIG.GAME.FULL_COLOR_ROOMS.indexOf(L.id) >= 0;
    Backdrop.setMuted(L.kind === 'principal' && !rs.afinada && !fullColor && this.mode === 'story');
    this.banner = (L.kind === 'principal' || L.kind === 'secreto' || L.kind === 'reto') && this.mode === 'story'
      ? { title: WORLD.label(L.id), name: L.name, time: CONFIG.GAME.BANNER_TIME } : null;
    if (L.kind === 'principal' && this.mode === 'story' && L.id === CONFIG.GAME.FIRST_ROOM &&
        !this.progress.visitedIntro) {
      this.progress.visitedIntro = true;
      this.say(TEXT.intro, 7);
    }
  }

  markVisited(id) {
    this.progress.visited[id] = true;
  }

  // Dónde aparece la papa al entrar
  placePlayer(arrive) {
    const p = this.player;
    const L = this.level;
    const T = CONFIG.TILE;
    let x = L.spawn.x;
    let y = L.spawn.y;
    if (arrive && arrive.spot) {
      x = arrive.spot.x;
      y = arrive.spot.y;
    } else if (arrive && arrive.item) {
      x = arrive.item.x + (T - p.w) / 2;
      y = arrive.item.y + T - p.h;
    } else if (arrive && arrive.totem) {
      const t = L.items.find(function (i) { return i.type === 'totem'; });
      if (t) {
        x = t.x + T + (T - p.w) / 2;
        y = t.y + T - p.h;
        p.portalPose = 0.6;
        Effects.play('poof', x + p.w / 2, y + p.h / 2);
      }
    } else if (arrive && arrive.exit) {
      const spot = this.arrivalFromExit(arrive);
      if (spot) {
        x = spot.x;
        y = spot.y;
        p.vx = arrive.vx;
        p.vy = spot.vy;
        p.facing = arrive.vx < 0 ? -1 : 1;
        this.exitGrace = true;
      }
    }
    p.x = x;
    p.y = y;
    const safe = this.safeSpotNear(x, y);
    p.setSpawn(safe.x, safe.y);
  }

  // El paso de llegada es el que lleva de vuelta a la sala de donde se viene
  // (si hay varios, el del mismo nombre o el del borde opuesto)
  arrivalFromExit(a) {
    const T = CONFIG.TILE;
    const p = this.player;
    const list = this.level.exits.filter(function (e) { return e.goes === a.from; });
    if (!list.length) return null;
    const byTag = a.exit.tag ? list.filter(function (e) { return e.tag === a.exit.tag; }) : [];
    const pool = byTag.length ? byTag : list;
    const e = pool.find(function (x) { return x.side === OPPOSITE[a.exit.side]; }) || pool[0];
    const R = e.rect;
    let x;
    let y;
    let vy = a.vy;
    if (e.side === 'left' || e.side === 'right') {
      const feet = clamp(R.y + a.offset, R.y + p.h, R.y + R.h);
      y = feet - p.h;
      x = e.side === 'left' ? R.x + R.w + 1 : R.x - p.w - 1;
    } else {
      x = clamp(R.x + a.offset, R.x, R.x + R.w - p.w);
      if (e.side === 'top') {
        y = R.y + R.h + 1;
        vy = Math.max(vy, 0);
      } else {
        y = R.y - p.h - 2;
        vy = -CONFIG.GAME.ENTRY_BOOST;
      }
    }
    return { x: x, y: y, vy: vy };
  }

  // Un lugar firme cerca (para reaparecer si se cae): suelo debajo y aire arriba
  safeSpotNear(x, y) {
    const T = CONFIG.TILE;
    const p = this.player;
    const L = this.level;
    const tx0 = Math.floor((x + p.w / 2) / T);
    const ty0 = Math.floor((y + p.h - 1) / T);
    for (let r = 0; r <= 14; r++) {
      for (let s = -1; s <= 1; s += 2) {
        const tx = tx0 + r * s;
        if (tx < 0 || tx >= L.cols) continue;
        for (let dy = -2; dy <= 6; dy++) {
          const ty = ty0 + dy;
          const px = tx * T + (T - p.w) / 2;
          const py = (ty + 1) * T - p.h;
          if (ty < 1 || ty >= L.rowCount - 1) continue;
          if (L.rectHitsSolid(px, py, p.w, p.h)) continue;
          if (!L.rectHitsSolid(px, py + p.h + 1, p.w, 1)) continue;
          if (L.rectHitsSpikes(px, py + 2, p.w, p.h) || L.exitAt({ x: px, y: py, w: p.w, h: p.h })) continue;
          return { x: px, y: py };
        }
        if (r === 0) break;
      }
    }
    return { x: L.spawn.x, y: L.spawn.y };
  }

  // Música de la sala: en las principales suena por cercanía durante la misión
  startRoomMusic() {
    const L = this.level;
    Music.setRate(L.rate);
    if (this.mission === 'escape') Music.play('key');
    else Music.play(this.mission === 'done' || L.kind !== 'principal' ? L.music : 'main');
    this.musicNear = 0;
    Music.setNear(this.baseMusic());
  }

  // Volumen de la música sin misión: salas afinadas, salitas, retos y jefes suenan bajito
  baseMusic() {
    const L = this.level;
    if (L.kind === 'principal') return this.mission === 'done' ? 0.55 : 0;
    return 0.6;
  }

  // ---------- Pantalla de inicio ----------

  openTitle() {
    this.state = 'splash';
    this.screenTime = 0;
    Music.stop();
    Backdrop.set('none');
    Backdrop.setMuted(false);
  }

  screenReady() {
    return this.screenTime >= CONFIG.GAME.READY_DELAY;
  }

  updateSplash() {
    if (!this.screenReady() || !Input.anyPressed()) return;
    Sfx.play('select');
    this.state = 'title';
    this.screenTime = 0;
    this.titleIndex = 0;
  }

  tappedRow(menu, n) {
    const p = Input.tapPoint();
    if (!p) return -1;
    const row = Math.floor((p.y - menu.TOP + 2) / menu.STEP);
    return row >= 0 && row < n ? row : -1;
  }

  // Continuar (si hay partida guardada), las 3 dificultades (partida nueva),
  // Nueva partida + (si está desbloqueada) y el coliseo
  titleItems() {
    const items = [];
    if (Save.hasGame()) items.push('continue');
    CONFIG.DIFFICULTY.LIST.forEach(function (d) { items.push(d); });
    if (this.records.plusUnlocked) items.push('plus');
    items.push('tower');
    return items;
  }

  updateTitle() {
    if (!this.screenReady()) return;
    const items = this.titleItems();
    const n = items.length;
    const row = this.tappedRow(CONFIG.TITLE_MENU, n);
    let tapAccept = false;
    if (row >= 0 && row !== this.titleIndex) {
      this.titleIndex = row;
      Sfx.play('move');
      return;
    }
    if (row >= 0) tapAccept = true;
    if (Input.pressed('up')) {
      this.titleIndex = (this.titleIndex + n - 1) % n;
      Sfx.play('move');
    } else if (Input.pressed('down')) {
      this.titleIndex = (this.titleIndex + 1) % n;
      Sfx.play('move');
    }
    this.titleIndex = Math.min(this.titleIndex, n - 1);
    const item = items[this.titleIndex];
    const accept = Input.pressed('confirm') || tapAccept;
    if (item === 'plus') {
      if (Input.pressed('left') || Input.pressed('right') || accept) {
        this.plus = !this.plus;
        Sfx.play('move');
      }
      return;
    }
    if (!accept) return;
    Sfx.play('select');
    if (item === 'continue') {
      this.continueGame();
      return;
    }
    this.mode = item === 'tower' ? 'tower' : 'story';
    this.difficulty = item === 'tower' ? TOWER.DIFFICULTY : item;
    this.newRun();
    this.towerFloor = 0;
    this.state = 'ready';
    this.screenTime = 0;
  }

  updateReady() {
    if (this.screenReady() && Input.anyPressed()) this.startRun();
  }

  startRun() {
    Sfx.play('select');
    if (this.mode === 'tower') {
      this.loadTowerFloor(this.towerFloor);
      return;
    }
    this.loadRoom(CONFIG.GAME.FIRST_ROOM, null);
    this.state = 'play';
    this.startRoomMusic();
    // La partida nueva reemplaza a la guardada: así "Continuar" (y seguir después
    // de perder) vuelve a esta partida y no a una vieja
    this.saveGame();
  }

  // ---------- Coliseo de los jefes (js/tower.js) ----------

  loadTowerFloor(i) {
    const F = TOWER.FLOORS[i];
    this.towerFloor = i;
    this.towerNext = 0;
    this.progress.abilities = {};
    CONFIG.GAME.START_ABILITIES.concat(F.abilities).forEach(function (id) { this.progress.abilities[id] = true; }, this);
    this.progress.rooms = {};
    this.loadRoom(F.id, null);
    this.state = 'play';
    this.overlay = { kind: 'towerIntro', t: 0, floor: i, boss: F.boss };
    this.startRoomMusic();
  }

  updateTower(dt) {
    if (this.mode !== 'tower' || this.towerNext <= 0) return;
    this.towerNext -= dt;
    if (this.towerNext > 0) return;
    if (this.towerFloor + 1 < TOWER.FLOORS.length) {
      this.loadTowerFloor(this.towerFloor + 1);
    } else {
      this.state = 'won';
      this.endTimer = 0;
      Music.stop();
      Sfx.play('final');
    }
  }

  // ---------- Fin de partida ----------

  gameOver() {
    this.state = 'gameover';
    this.endTimer = 0;
    this.overIndex = 0;
    Music.stop();
  }

  // Sin corazones: "Continuar" vuelve a la última partida guardada (o al comienzo
  // de esta sala, con los corazones llenos); "Volver al inicio" deja la partida
  updateGameOver() {
    if (this.endTimer <= CONFIG.GAME.END_DELAY) return;
    const row = this.tappedRow(CONFIG.GAME_OVER_MENU, 2);
    if (row >= 0 && row !== this.overIndex) {
      this.overIndex = row;
      Sfx.play('move');
      return;
    }
    if (Input.pressed('up') || Input.pressed('down')) {
      this.overIndex = 1 - this.overIndex;
      Sfx.play('move');
    }
    if (!(Input.pressed('confirm') || row >= 0)) return;
    Sfx.play('select');
    if (this.overIndex === 1) {
      this.openTitle();
      return;
    }
    if (this.mode === 'tower') {
      this.hearts = this.progress.maxHearts;
      this.loadTowerFloor(this.towerFloor);
      return;
    }
    if (Save.hasGame() && this.continueGame()) {
      this.hearts = this.progress.maxHearts;
      return;
    }
    this.hearts = this.progress.maxHearts;
    this.loadRoom(this.level.id, null);
    this.state = 'play';
    this.startRoomMusic();
  }

  winGame() {
    this.state = 'won';
    this.endTimer = 0;
    Music.stop();
    Sfx.play('final');
    if (this.rules().ENDING === 'true' && !this.records.plusUnlocked) {
      this.records.plusUnlocked = true;
      Save.writeRecords(this.records);
    }
  }

  // ---------- Mensajes ----------

  say(str, seconds) {
    this.message = { text: str, time: seconds || CONFIG.GAME.MESSAGE_TIME };
  }

  // Aviso corto (por ejemplo, frente a una puerta): no tapa un mensaje importante
  hint(text) {
    if (this.message && !this.message.hint) return;
    this.message = { text: text, time: 1, hint: true };
  }

  showTip(id) {
    if (this.tipsShown[id]) return;
    this.tipsShown[id] = true;
    this.tip = { text: TIPS[id], time: CONFIG.GAME.TIP_TIME };
  }

  // ---------- Actualización ----------

  update(dt) {
    this.time += dt;
    if (Input.keyPressed('KeyM')) Sfx.setMuted(Music.toggleMute());

    if (this.state === 'splash' || this.state === 'title' || this.state === 'ready') {
      Echoes.silence();
      this.screenTime += dt;
      if (this.state === 'splash') this.updateSplash();
      else if (this.state === 'title') this.updateTitle();
      else this.updateReady();
      return;
    }
    if (this.state === 'gameover') {
      Echoes.silence();
      this.endTimer += dt;
      this.updateGameOver();
      return;
    }
    if (this.state === 'won') {
      Echoes.silence();
      this.endTimer += dt;
      Effects.update(dt);
      if (this.endTimer > CONFIG.GAME.END_DELAY && Input.anyPressed()) this.openTitle();
      return;
    }

    this.savedIcon = Math.max(0, (this.savedIcon || 0) - dt);
    if (this.fade) {
      this.updateFade(dt);
      return;
    }
    if (this.overlay) {
      Echoes.silence();
      this.updateOverlay(dt);
      return;
    }
    if (Input.pressed('pause')) {
      this.menu.toggle();
      return;
    }
    if (this.menu.open) {
      Echoes.silence();
      this.menu.update();
      return;
    }

    this.handleDebugKeys();
    if (this.message && !this.message.hint && Input.pressed('action') && !this.prompt) this.message = null;
    this.updateWorld(dt);
  }

  updateWorld(dt) {
    const p = this.player;
    this.level.update(dt);
    p.frozen = !!(this.boss && this.boss.holdsPlayer());
    p.push = this.bossWind;
    this.prompt = this.findPrompt();
    p.hookBlocked = !!this.prompt;
    p.update(dt, this.level);
    this.keepInArena();
    this.level.touchCrumbles(p);
    this.playerEvents();
    this.corcheas.update(dt, this.level, p);
    this.enemies.update(dt, this.level, p, this.camera);
    this.enemies.takeShoves().forEach(function (e) { p.shove(e.dir); Sfx.play('stomp'); });
    this.dropCoins();
    this.drops.update(dt, this.level);
    this.updateArena();
    this.bossWind = 0;
    if (this.boss) {
      this.boss.update(dt, this.level, p);
      this.bossWind = this.boss.wind ? this.boss.wind() : 0;
    }
    if (p.chiliTime <= 0) this.regrowChili();
    this.hurtTimer = Math.max(0, (this.hurtTimer || 0) - dt);

    if (this.checkExits()) return;
    if (this.isHurtByWorld()) {
      this.loseLife();
    } else {
      this.useAction();
      this.collectItems();
      this.collectCoins();
      this.catchCorcheas();
      this.checkTotem();
      this.checkColorDoors();
      this.checkSeals();
      this.checkGate();
      this.checkEnemies();
      this.checkBoss();
    }

    this.updateTower(dt);
    this.updateMissionTimer(dt);
    this.updateBonus(dt);
    this.updateKeyFx(dt);
    if (this.tip) {
      this.tip.time -= dt;
      if (this.tip.time <= 0) this.tip = null;
    }
    if (this.message) {
      this.message.time -= dt;
      if (this.message.time <= 0) this.message = null;
    }
    if (this.banner) {
      this.banner.time -= dt;
      if (this.banner.time <= 0) this.banner = null;
    }
    this.updateCamera(CONFIG.CAMERA_LERP);
    this.updateEchoes(dt);
  }

  // ---------- Pasos entre salas ----------

  // Al tocar un paso se pasa a la otra sala (con un fundido corto)
  checkExits() {
    const p = this.player;
    const box = { x: p.x, y: p.y, w: p.w, h: p.h };
    const e = this.level.exitAt(box);
    if (this.exitGrace) {
      if (!e) this.exitGrace = false;
      return false;
    }
    if (!e) {
      this.warnBlockedExit(box);
      return false;
    }
    const horizontal = e.side === 'left' || e.side === 'right';
    const offset = horizontal ? p.y + p.h - e.rect.y : p.x - e.rect.x;
    const left = this.missionSnapshot() && e.goes !== this.level.id ? WORLD.label(this.level.id) : null;
    this.fade = { t: 0, phase: 'out', to: e.goes, left: left,
                  arrive: { exit: e, from: this.level.id, offset: offset, vx: p.vx, vy: p.vy } };
    return true;
  }

  // Junto a un paso que lleva a una sala en obras, se avisa
  warnBlockedExit(box) {
    const T = CONFIG.TILE;
    const near = this.level.exits.some(function (e) {
      return e.blocked && overlaps({ x: e.rect.x - T, y: e.rect.y - T, w: e.rect.w + T * 2, h: e.rect.h + T * 2 }, box);
    });
    if (near) this.hint(TEXT.notBuilt);
  }

  updateFade(dt) {
    const F = this.fade;
    F.t += dt;
    if (F.phase === 'out' && F.t >= CONFIG.GAME.FADE_TIME) {
      if (F.to) this.loadRoom(F.to, F.arrive);
      else if (F.load) F.load();
      if (F.left) this.say(TEXT.missionLeft(F.left), 5);
      this.startRoomMusic();
      F.phase = 'in';
      F.t = 0;
    } else if (F.phase === 'in' && F.t >= CONFIG.GAME.FADE_TIME) {
      this.fade = null;
    }
  }

  // Cambio de sala con fundido por cualquier otra vía (puertas Q y R, viaje)
  fadeTo(load) {
    this.fade = { t: 0, phase: 'out', to: null, load: load };
  }

  // ---------- Avisos de acción ----------

  // Lo que se puede usar con Acción (E / Cuadrado) cerca de la papa
  findPrompt() {
    const p = this.player;
    const box = { x: p.x, y: p.y, w: p.w, h: p.h };
    const L = this.level;
    let best = null;
    L.items.forEach(function (it) {
      if (it.taken) return;
      if (!/^(totem|posta|vendor|salitaDoor|backDoor|sign)$/.test(it.type)) return;
      if (!overlaps(Items.nearBox(it), box)) return;
      const text = this.promptText(it);
      if (text) best = { item: it, text: text };
    }, this);
    return best;
  }

  promptText(it) {
    if (it.type === 'totem') {
      if (this.mode !== 'story') return null;
      if (this.mission === 'idle') return 'Comenzar misión';
      if (this.mission === 'done') return 'Viajar';
      return null;
    }
    if (it.type === 'posta') return 'Descansar';
    if (it.type === 'vendor') return 'Hablar';
    if (it.type === 'salitaDoor') return it.props.tipo === 'bonus' ? 'Entrar al bonus' : 'Entrar';
    if (it.type === 'backDoor') return 'Salir';
    if (it.type === 'sign') return 'Leer';
    return null;
  }

  useAction() {
    if (!this.prompt || !Input.pressed('action')) return;
    const it = this.prompt.item;
    if (it.type === 'totem') this.useTotem(it);
    else if (it.type === 'posta') this.rest(it);
    else if (it.type === 'vendor') this.openShop(it);
    else if (it.type === 'salitaDoor') this.enterSalita(it);
    else if (it.type === 'backDoor') this.leaveSalita();
    else if (it.type === 'sign') this.say(it.props.texto || '...', 6);
  }

  // ---------- Misión del tótem ----------

  totem() {
    return this.level.items.find(function (i) { return i.type === 'totem'; }) || null;
  }

  useTotem(t) {
    if (this.mission === 'idle') this.startMission(t);
    else if (this.mission === 'done') this.openTravel();
  }

  startMission(t) {
    const n = this.corcheas.total();
    this.mission = 'collect';
    this.notes = 0;
    this.missionClock = 0;
    this.corcheas.wakeAll();
    t.state = 'despierto';
    Sfx.play('door');
    const limit = this.rules().MISSION_TIME;
    if (limit > 0) {
      this.timeLeft = limit;
      this.lastTick = 0;
      this.say(TEXT.missionTimed(n, formatTime(limit)), 4);
    } else {
      this.say(TEXT.missionStart(n), 4);
    }
    if (n === 0) this.startEscape();
  }

  catchCorcheas() {
    if (this.mission !== 'collect') return;
    const got = this.corcheas.catchWith(this.player);
    if (!got) return;
    this.notes += got;
    Sfx.play('note');
    if (this.notes >= this.corcheas.total()) this.startEscape();
  }

  // Con las 3 corcheas aparece la llave y empieza la cuenta de la canción
  startEscape() {
    this.mission = 'escape';
    if (this.rules().MISSION_TIME <= 0) this.timeLeft = this.level.time;
    this.keyTime = 0;
    this.lastTick = 0;
    const key = this.level.items.find(function (i) { return i.type === 'key'; });
    if (key) {
      key.hidden = false;
      key.taken = false;
      Effects.play('poof', key.x + 8, key.y + 8);
    } else {
      this.hasKey = true;
    }
    this.say(TEXT.escape, 4);
    Music.play('key');
  }

  // Con la llave en la mano, al tocar el tótem la sala se afina
  checkTotem() {
    const t = this.totem();
    if (!t) return;
    const near = overlaps(Items.nearBox(t), this.player);
    if (!near) return;
    if (this.mission === 'escape' && this.hasKey) this.afinarSala(t);
    else if (this.mission === 'collect') this.hint(TEXT.totemBusy(this.corcheas.remaining().length));
    else if (this.mission === 'escape') this.hint(TEXT.totemKey);
  }

  afinarSala(t) {
    const L = this.level;
    const rs = this.roomState(L.id);
    rs.afinada = true;
    if (this.progress.songs.indexOf(L.id) < 0) this.progress.songs.push(L.id);
    t.state = 'activo';
    this.mission = 'done';
    this.hasKey = false;
    L.gateOpen = true;
    Backdrop.setMuted(false);
    Sfx.play('clear');
    Effects.chiliBurst(t.x + 8, t.y + 8);
    const song = CATALOGO.nombreMusica(L.music, L.pitch);
    let msg = TEXT.afinada(song);
    if (L.hasGate) {
      msg += ' ' + (L.gateHint || '');
      Sfx.play('gate');
    }
    const record = this.saveRecord();
    if (record) msg += ' ' + record;
    this.say(msg, 7);
    Music.play(L.music);
    this.saveGame();
  }

  // Misión en curso (corcheas atrapadas, llave, tiempo) para devolverla al salir
  // de una tienda o un bonus. null si no hay misión en curso.
  missionSnapshot() {
    if (this.mode !== 'story' || (this.mission !== 'collect' && this.mission !== 'escape')) return null;
    const key = this.level.items.find(function (i) { return i.type === 'key'; });
    return {
      room: this.level.id, mission: this.mission, notes: this.notes, hasKey: this.hasKey,
      timeLeft: this.timeLeft, missionClock: this.missionClock, keyTime: this.keyTime,
      caught: this.corcheas.list.map(function (c) { return c.state === 'caught'; }),
      keyTaken: !!(key && key.taken)
    };
  }

  restoreMission(m) {
    if (!m || m.room !== this.level.id || this.mission === 'done') return;
    this.mission = m.mission;
    this.notes = m.notes;
    this.hasKey = m.hasKey;
    this.timeLeft = m.timeLeft;
    this.missionClock = m.missionClock;
    this.keyTime = m.keyTime;
    this.corcheas.wakeAll();
    this.corcheas.list.forEach(function (c, i) { if (m.caught[i]) c.state = 'caught'; });
    const t = this.totem();
    if (t) t.state = 'despierto';
    this.level.items.forEach(function (i) {
      if (i.type !== 'key') return;
      i.hidden = m.mission !== 'escape';
      i.taken = m.keyTaken;
    });
    this.say(TEXT.missionKept, 3);
  }

  // Se acabó la canción: la misión vuelve a empezar (y se pierde un corazón)
  resetMission() {
    this.mission = 'idle';
    this.notes = 0;
    this.hasKey = false;
    this.missionClock = 0;
    this.timeLeft = this.level.time;
    this.corcheas.resetAll();
    const t = this.totem();
    if (t) t.state = 'dormido';
    this.level.items.forEach(function (i) {
      if (i.type === 'key') {
        i.taken = false;
        i.hidden = true;
      }
    });
    Music.play('main');
  }

  timerRunning() {
    if (this.bonus && !this.bonus.done) return true;
    return this.mission === 'escape' || (this.mission === 'collect' && this.rules().MISSION_TIME > 0);
  }

  updateMissionTimer(dt) {
    if (this.bonus) return;
    if (this.mission === 'collect' || this.mission === 'escape') this.missionClock += dt;
    if (!this.timerRunning()) return;
    this.timeLeft -= dt;
    this.tickClock();
    if (this.timeLeft > 0) return;
    this.resetMission();
    this.say(TEXT.timeout, 5);
    this.loseLife();
  }

  tickClock() {
    const sec = Math.ceil(this.timeLeft);
    if (sec > CONFIG.SFX.TICK_FROM || sec <= 0 || sec === this.lastTick) return;
    this.lastTick = sec;
    Sfx.play('tick');
  }

  timerScale() {
    const G = CONFIG.GAME;
    if (!this.hasKey || this.mission !== 'escape') return 1;
    const since = (G.TIMER_PULSE_EVERY - this.timeLeft % G.TIMER_PULSE_EVERY) % G.TIMER_PULSE_EVERY;
    if (since > G.TIMER_PULSE_TIME) return 1;
    return 1 + (G.TIMER_PULSE_SCALE - 1) * Math.sin(Math.PI * since / G.TIMER_PULSE_TIME);
  }

  saveRecord() {
    if (this.rules().MISSION_TIME <= 0) return null;
    const key = this.difficulty + ':' + this.level.id;
    const t = this.missionClock;
    const best = this.records.best[key];
    const isNew = best === undefined || t < best;
    if (isNew) {
      this.records.best[key] = t;
      Save.writeRecords(this.records);
    }
    return 'Misión cumplida en ' + formatTime(t) + (isNew ? '. ¡Nuevo récord!' : ' (récord: ' + formatTime(best) + ').');
  }

  // ---------- Viaje entre tótems ----------

  // Tótems encendidos (salas afinadas) a los que se puede viajar
  travelList() {
    const P = this.progress;
    return LEVELS.filter(function (l) {
      return l.kind === 'principal' && P.rooms[l.id] && P.rooms[l.id].afinada && l.id !== this.level.id;
    }, this).map(function (l) { return l.id; });
  }

  openTravel() {
    const list = this.travelList();
    if (!list.length) {
      this.say(TEXT.noTravel, 3);
      return;
    }
    this.overlay = { kind: 'travel', list: list, index: 0 };
    Sfx.play('select');
  }

  travelTo(id) {
    this.player.portalPose = 0.5;
    Sfx.play('ability');
    this.fadeTo(function () { this.loadRoom(id, { totem: true }); }.bind(this));
  }

  // ---------- Salitas (tiendas y bonus) ----------

  enterSalita(door) {
    const dest = door.props.destino;
    if (!dest || !WORLD.built(dest)) {
      this.say(TEXT.notBuilt, 2);
      return;
    }
    this.salitaReturn = { room: this.level.id, item: { x: door.x, y: door.y }, mission: this.missionSnapshot() };
    Sfx.play('door');
    this.fadeTo(function () { this.loadRoom(dest, null); }.bind(this));
  }

  leaveSalita() {
    const back = this.salitaReturn;
    this.salitaReturn = null;
    Sfx.play('door');
    if (!back) {
      this.fadeTo(function () { this.loadRoom(CONFIG.GAME.FIRST_ROOM, null); }.bind(this));
      return;
    }
    this.fadeTo(function () {
      this.loadRoom(back.room, { item: back.item });
      if (back.mission) this.restoreMission(back.mission);
    }.bind(this));
  }

  // Etapa bonus: tiempo para comer todas las frutas (o juntar todas las monedas)
  setupBonus() {
    const L = this.level;
    if (L.kind !== 'bonus') return;
    const fruits = L.items.filter(function (i) { return i.type === 'fruit'; }).length;
    const coins = L.items.filter(function (i) { return i.type === 'coin'; }).length;
    this.bonus = { fruits: fruits, coins: coins, eaten: 0, got: 0, done: false, lost: false, wait: 0 };
    this.timeLeft = L.time;
    L.items.forEach(function (i) { if (i.type === 'coin' || i.type === 'fruit') i.taken = false; });
    this.say(TEXT.bonusStart(fruits, L.time), 3);
  }

  updateBonus(dt) {
    const B = this.bonus;
    if (!B) return;
    if (B.done || B.lost) {
      B.wait -= dt;
      if (B.lost && B.wait <= 0) {
        this.bonus = null;
        this.leaveSalita();
      }
      return;
    }
    this.timeLeft -= dt;
    this.tickClock();
    const won = B.fruits > 0 ? B.eaten >= B.fruits : B.got >= B.coins;
    if (won) {
      B.done = true;
      const rs = this.roomState(this.level.id);
      const first = !rs.bonus;
      rs.bonus = true;
      const P = this.progress;
      // La primera vez, las frutas dan un corazón extra (+1 corazón máximo, hasta 10);
      // el bonus de monedas da 15 monedas. Repetirlo da 5 monedas.
      if (first && B.fruits > 0 && P.maxHearts < CONFIG.GAME.MAX_HEARTS) {
        P.maxHearts += 1;
        this.hearts = P.maxHearts;
        Sfx.play('lifeUp');
        this.say(TEXT.bonusHeart(P.maxHearts), 4);
      } else {
        const prize = first ? (B.fruits > 0 ? 30 : 15) : 5;
        P.coins += prize;
        this.hearts = P.maxHearts;
        Sfx.play('clear');
        this.say(first ? TEXT.bonusWon(prize) : TEXT.bonusAgain + ' +' + prize + ' monedas.', 4);
      }
      Effects.chiliBurst(this.player.x + 5, this.player.y + 9);
      this.saveGame();
    } else if (this.timeLeft <= 0) {
      B.lost = true;
      B.wait = 1.6;
      this.say(TEXT.bonusLost, 2);
      Sfx.play('hurt');
    }
  }

  // ---------- Posta, tienda y ají ----------

  rest(posta) {
    this.hearts = this.progress.maxHearts;
    this.level.items.forEach(function (i) { if (i.type === 'posta') i.active = false; });
    posta.active = true;
    const T = CONFIG.TILE;
    const spot = { x: posta.x + (T - this.player.w) / 2, y: posta.y + T - this.player.h };
    this.progress.posta = { room: this.level.id, x: spot.x, y: spot.y };
    this.player.setSpawn(spot.x, spot.y);
    this.player.restPose = 1.2;
    Sfx.play('save');
    this.say(this.saveGame(spot) ? TEXT.rested : TEXT.cantSave, 3);
  }

  openShop(vendor) {
    const tipo = vendor.props.tipo || 'viajero';
    const M = CATALOGO.MERCADERES.find(function (m) { return m.id === tipo; }) || CATALOGO.MERCADERES[0];
    const goods = M.vende.map(function (id) { return CATALOGO.TIENDA.find(function (t) { return t.id === id; }); })
      .filter(function (g) { return g && g.id !== 'pieza'; });
    this.overlay = { kind: 'shop', vendor: vendor, merchant: M, goods: goods, index: 0, note: '' };
    Sfx.play('select');
  }

  buy(good) {
    const P = this.progress;
    const O = this.overlay;
    if (P.coins < good.precio) {
      O.note = 'Te faltan ' + (good.precio - P.coins) + ' monedas.';
      Sfx.play('hurt');
      return;
    }
    const region = WORLD.region(this.salitaReturn ? this.salitaReturn.room : this.level.id) || 1;
    if (good.id === 'mapa') {
      if (P.mapRegions[region]) {
        O.note = 'Ya tienes el mapa de esta zona.';
        return;
      }
      P.mapRegions[region] = true;
      O.note = 'Ahora ves toda la Zona ' + region + ' en el mapa (pausa).';
    } else if (good.id === 'vida') {
      if (this.hearts >= P.maxHearts) {
        O.note = 'Tus corazones ya están llenos.';
        return;
      }
      this.hearts++;
      O.note = '+1 corazón.';
    } else if (good.id === 'comida') {
      this.hearts = P.maxHearts;
      O.note = '¡Qué rico! Corazones llenos.';
    } else if (good.id === 'aji') {
      P.chili++;
      O.note = 'Ají para llevar: úsalo con Q o L1 (tienes ' + P.chili + ').';
    } else if (good.id === 'pista') {
      const hint = this.findNoteHint(region);
      if (!hint) {
        O.note = 'Ya encontraste todas las notas de esta zona.';
        return;
      }
      P.hints.push(hint);
      O.note = 'La nota ' + hint.nota + ' está en ' + WORLD.label(hint.room) + ' · ' + WORLD.name(hint.room) + '.';
    }
    P.coins -= good.precio;
    Sfx.play('cube');
  }

  // Una nota de la escala que falta en la zona (para la pista del vendedor)
  findNoteHint(region) {
    const P = this.progress;
    for (let i = 0; i < LEVELS.length; i++) {
      const L = LEVELS[i];
      if (L.region !== region || !L.props) continue;
      for (let y = 0; y < L.map.length; y++) {
        const x = L.map[y].indexOf('q');
        if (x < 0) continue;
        const key = x + ',' + y;
        const nota = (L.props[key] || {}).nota;
        const rs = P.rooms[L.id];
        const known = P.hints.some(function (h) { return h.room === L.id && h.nota === nota; });
        if (nota && !(rs && rs.taken[key]) && !known) return { room: L.id, nota: nota };
      }
    }
    return null;
  }

  // Ají para llevar (comprado): Q o L1
  useChili() {
    if (!Input.pressed('item') || this.progress.chili <= 0 || this.player.chiliTime > 0) return;
    this.progress.chili--;
    this.player.eatChili();
    Effects.chiliBurst(this.player.x + this.player.w / 2, this.player.y + this.player.h);
    Sfx.play('chili');
    this.say(TEXT.chiliUsed, 2);
  }

  // ---------- Capas sobre el juego: premio, tienda, viaje, coliseo ----------

  updateOverlay(dt) {
    const O = this.overlay;
    O.t = (O.t || 0) + dt;
    this.level.update(dt);
    Effects.update(dt);
    if (O.kind === 'towerIntro') {
      if (O.t > 2.6 || (O.t > 0.6 && Input.anyPressed())) this.overlay = null;
      return;
    }
    if (O.kind === 'reward') {
      this.updateReward(dt);
      return;
    }
    const list = O.kind === 'shop' ? O.goods : O.list;
    const n = list.length + 1;   // la última fila es "Salir"
    if (Input.pressed('up')) { O.index = (O.index + n - 1) % n; Sfx.play('move'); }
    if (Input.pressed('down')) { O.index = (O.index + 1) % n; Sfx.play('move'); }
    const close = Input.pressed('pause') || (Input.pressed('confirm') && O.index === n - 1);
    if (close) {
      this.overlay = null;
      Sfx.play('select');
      return;
    }
    if (!Input.pressed('confirm')) return;
    if (O.kind === 'shop') this.buy(list[O.index]);
    else {
      const id = list[O.index];
      this.overlay = null;
      this.travelTo(id);
    }
  }

  // Vencer a un jefe: aura, el poder (y cómo se usa), la llave de color y qué se abrió
  winBossFight() {
    const L = this.level;
    this.arenaPhase = 'done';
    this.roomState(L.id).boss = true;
    L.arenaActive = false;
    Music.play(L.music);
    Sfx.play('bossWon');
    if (this.mode === 'tower') {
      this.towerNext = TOWER.NEXT_DELAY;
      this.say(TEXT.towerFloorDone(this.towerFloor + 1), TOWER.NEXT_DELAY);
      return;
    }
    const jefe = WORLD.boss(L.boss ? L.boss.type : '');
    const gives = (L.boss && L.boss.gives) || (jefe && WORLD.power(jefe.da) ? jefe.da : null);
    const steps = [];
    if (gives && WORLD.power(gives)) steps.push({ kind: 'aura' }, { kind: 'power', power: gives });
    if (jefe && jefe.llave) steps.push({ kind: 'key', key: jefe.llave });
    if (jefe && jefe.da === 'monedas') steps.push({ kind: 'coins', coins: 100 });
    if (jefe && jefe.da === 'poliedro') {
      const p = CATALOGO.POLIEDROS.find(function (x) { return x.region === (L.region || 1); });
      if (p) steps.push({ kind: 'poliedro', poliedro: p });
    }
    if (!steps.length) {
      this.say(TEXT.bossWonNoGift, 3);
      return;
    }
    this.overlay = { kind: 'reward', steps: steps, i: 0, t: 0, boss: jefe ? jefe.nombre : '' };
    this.startRewardStep();
  }

  // Lo que pasa al empezar cada paso del premio
  startRewardStep() {
    const O = this.overlay;
    const s = O.steps[O.i];
    O.t = 0;
    const P = this.progress;
    if (s.kind === 'aura') {
      this.player.celebrate();
      Sfx.play('ability');
    } else if (s.kind === 'power') {
      P.abilities[s.power] = true;
      this.updateSkin();
      s.opens = WORLD.POWER_OPENS[s.power] || [];
    } else if (s.kind === 'key') {
      P.keys[s.key] = true;
      Sfx.play('key');
    } else if (s.kind === 'coins') {
      P.coins += s.coins;
      Sfx.play('cube');
    } else if (s.kind === 'poliedro') {
      P.poliedros[s.poliedro.id] = true;
      Sfx.play('ability');
    }
  }

  updateReward() {
    const O = this.overlay;
    const s = O.steps[O.i];
    const wait = s.kind === 'aura' ? CONFIG.GAME.REWARD_AURA : 0.6;
    const next = s.kind === 'aura' ? O.t >= wait : (O.t >= wait && Input.pressed('confirm'));
    if (!next) return;
    O.i++;
    Sfx.play('select');
    if (O.i >= O.steps.length) {
      this.overlay = null;
      this.saveGame();
      return;
    }
    this.startRewardStep();
  }

  // ---------- Pausa (el menú está en js/menu.js) ----------

  changeVolume(item, step) {
    const max = CONFIG.VOLUME.STEPS;
    this.settings[item] = Math.max(0, Math.min(max, this.settings[item] + step));
    this.applyVolume();
    Save.writeSettings(this.settings);
    Sfx.play(item === 'sfx' ? 'maize' : 'move');
  }

  toggleRumble() {
    this.settings.rumble = !this.settings.rumble;
    this.applyVolume();
    Save.writeSettings(this.settings);
    Sfx.play('move');
    if (this.settings.rumble) Input.rumble(150, 0.5, 0.4);
  }

  applyVolume() {
    const max = CONFIG.VOLUME.STEPS;
    const master = this.settings.master / max;
    Music.setVolume(this.settings.music / max * master);
    Sfx.setVolume(this.settings.sfx / max * master);
    Input.setRumble(this.settings.rumble);
  }

  // ---------- Daño y corazones ----------

  isHurtByWorld() {
    const p = this.player;
    if (p.y > this.level.pxH + 32) return true;
    if (p.invincible()) return false;
    return this.hurtTimer <= 0 && this.level.rectHitsSpikes(p.x, p.y, p.w, p.h);
  }

  // Cae al vacío o pisa espinas: pierde un corazón y vuelve a la banderita
  loseLife() {
    this.hearts = Math.max(0, this.hearts - this.rules().DAMAGE);
    if (this.hearts === 0) {
      this.gameOver();
      return;
    }
    this.resetBossFight();
    this.player.reset();
    this.hurtTimer = CONFIG.GAME.HURT_TIME;
    this.updateCamera(1);
    this.lifePopup('-' + this.rules().DAMAGE, CONFIG.FX.LIFE_DOWN);
    Sfx.play('hurt');
  }

  heal(n) {
    this.hearts = Math.min(this.progress.maxHearts, this.hearts + n);
    this.lifePopup('+' + n, CONFIG.FX.LIFE_UP);
    Sfx.play('lifeUp');
  }

  hurtByEnemy(source) {
    if (this.hurtTimer > 0 || this.player.invincible()) return;
    const p = this.player;
    this.hearts = Math.max(0, this.hearts - this.rules().DAMAGE);
    if (this.hearts === 0) {
      this.gameOver();
      return;
    }
    const dir = source ? (p.x + p.w / 2 < source.x + source.w / 2 ? -1 : 1) : -p.facing;
    p.knockback(dir);
    this.hurtTimer = CONFIG.GAME.HURT_TIME;
    this.lifePopup('-' + this.rules().DAMAGE, CONFIG.FX.LIFE_DOWN);
    Sfx.play('hurt');
  }

  lifePopup(text, color) {
    const p = this.player;
    Effects.popup(text, p.x + p.w / 2, p.y - 8, color);
  }

  // ---------- Enemigos ----------

  playerEvents() {
    const p = this.player;
    p.events.forEach(function (ev) {
      if (ev !== 'splash') Sfx.play(ev);
      if (ev === 'land' || ev === 'dash') {
        Effects.play('polvo', p.x + p.w / 2, p.y + p.h - 8, ev === 'dash' && p.facing < 0);
      } else if (ev === 'break') {
        this.wallBroken();
      } else if (ev === 'splash') {
        Effects.play('poof', p.x + p.w / 2, p.waterTop);
        Sfx.play('land');
      } else if (ev === 'drum') {
        const R = CONFIG.SFX.RUMBLE.DRUM;
        Input.rumble(R.TIME, R.STRONG, R.WEAK);
      }
    }, this);
    this.useChili();
  }

  wallBroken() {
    const T = CONFIG.TILE;
    this.player.brokeNow.forEach(function (c, i) {
      if (i % 2 === 0) Effects.play('poof', c[0] * T + T / 2, c[1] * T + T / 2);
    });
    this.roomState(this.level.id).broken = this.level.brokenCells.slice();
    Sfx.play('walls');
    Input.rumble(200, 0.8, 0.6);
    this.say(TEXT.wallBroken, 2);
  }

  isStomping(target) {
    const p = this.player;
    return p.vy > 0 && p.prevBottom <= target.y + 6;
  }

  checkEnemies() {
    const p = this.player;
    this.enemies.alive().forEach(function (e) {
      if (!overlaps(e, p)) return;
      if (p.invincible()) {
        e.stomp();
        Effects.play('chispa', e.x + e.w / 2, e.y);
        Sfx.play('stomp');
      } else if (this.isStomping(e)) {
        e.stomp();
        p.stomp();
        Effects.play('chispa', p.x + p.w / 2, e.y);
        Sfx.play('stomp');
      } else if (e.def.pushes) {
        p.shove(p.x + p.w / 2 < e.x + e.w / 2 ? -1 : 1);
      } else {
        this.hurtByEnemy(e);
      }
    }, this);
    const shot = this.enemies.shots.hit(p);
    if (shot) this.hurtByEnemy(shot);
    if (this.level.rayHits(p)) this.hurtByEnemy(null);
  }

  dropCoins() {
    this.enemies.takeDrops().forEach(function (e) {
      const count = CONFIG.COINS.DROP[e.type] || 1;
      this.drops.spawn(e.x + e.w / 2, e.y + e.h / 2, count);
    }, this);
  }

  collectCoins() {
    const got = this.drops.collect(this.player);
    if (got === 0) return;
    this.progress.coins += got;
    Sfx.play('maize');
    this.showTip('coin');
  }

  // ---------- Jefes ----------

  checkBoss() {
    const b = this.boss;
    if (!b) return;
    if (b.defeatedNow) {
      b.defeatedNow = false;
      this.winBossFight();
      return;
    }
    const p = this.player;
    if (b.isStompedBy(p)) {
      if (b.canBeHit() && this.hurtTimer <= 0) {
        p.stomp();
        b.hit();
        Effects.play('chispa', p.x + p.w / 2, b.y);
        Sfx.play('bossHit');
      } else {
        // No se le puede pisar ahora: se sacude y tira a la papa (no se queda quieto)
        b.shakeOff(p);
        Sfx.play('stomp');
      }
    } else if (b.isHarmful() && overlaps(b.harmBox(), p)) {
      this.hurtByEnemy(b);
    }
    if (b.waveHits(p)) this.hurtByEnemy(null);
  }

  updateArena() {
    if (!this.boss) return;
    const L = this.level;
    if (this.arenaPhase === 'idle' && L.insideArena(this.player)) {
      L.arenaActive = true;
      Sfx.play('walls');
      Music.play(CONFIG.MUSIC.BOSS_TRACK);
      Music.setNear(1);
      if (this.enemies.hasArenaEnemies()) {
        this.arenaPhase = 'guards';
        this.enemies.showArena();
        this.say(TEXT.arenaClosed, 2);
      } else {
        this.startBoss();
      }
    } else if (this.arenaPhase === 'guards' && this.enemies.arenaCleared()) {
      this.startBoss();
      Sfx.play('appear');
    }
  }

  // Con la arena cerrada la papa no puede salir por los lados (ni con el viento del jefe)
  keepInArena() {
    const L = this.level;
    if (!L.arenaActive || !L.arena) return;
    const p = this.player;
    const A = L.arena;
    if (p.x < A.left) {
      p.x = A.left;
      if (p.vx < 0) p.vx = 0;
    } else if (p.x + p.w > A.right) {
      p.x = A.right - p.w;
      if (p.vx > 0) p.vx = 0;
    }
  }

  // Pelea con el jefe: la escena se oscurece y queda un círculo de luz sobre la papa;
  // en los bordes de la arena brillan dos barreras
  drawArenaLight(ctx) {
    const L = this.level;
    const target = L.arenaActive ? 1 : 0;
    this.arenaLight = (this.arenaLight || 0) + (target - (this.arenaLight || 0)) * 0.05;
    if (this.arenaLight < 0.02 || !L.arena) return;
    const k = this.arenaLight;
    const C = CONFIG.ARENA_LIGHT;
    const p = this.player;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const cam = this.camera;
    const g = ctx.createRadialGradient(cx, cy, C.INNER, cx, cy, C.OUTER);
    g.addColorStop(0, 'rgba(14, 8, 32, 0)');
    g.addColorStop(1, 'rgba(14, 8, 32, ' + (C.DARK * k) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(cam.x - 4, cam.y - 4, CONFIG.WIDTH + 8, CONFIG.HEIGHT + 8);
    // Barreras de luz a los lados
    const A = L.arena;
    const pulse = 0.35 + Math.sin(this.time * 4) * 0.15;
    ctx.fillStyle = 'rgba(255, 211, 77, ' + (pulse * k) + ')';
    [A.left, A.right].forEach(function (x) {
      if (x <= 0 || x >= L.pxW) return;
      ctx.fillRect(x - 1, cam.y, 2, A.bottom - cam.y);
    });
  }

  startBoss() {
    this.arenaPhase = 'boss';
    this.boss.startFight();
    this.say(TEXT.bossArena(this.boss.def.NAME), 2);
  }

  resetBossFight() {
    if (this.arenaPhase !== 'guards' && this.arenaPhase !== 'boss') return;
    this.arenaPhase = 'idle';
    this.boss.reset();
    this.enemies.resetArena();
    this.boss.hidden = this.enemies.hasArenaEnemies();
    this.level.arenaActive = false;
    Music.play(this.level.music);
  }

  // ---------- Objetos ----------

  // Los objetos que no vuelven quedan anotados en la sala
  markTaken(item) {
    this.roomState(this.level.id).taken[item.key] = true;
  }

  collectItems() {
    const p = this.player;
    const P = this.progress;
    this.level.items.forEach(function (item) {
      if (item.taken || item.hidden || !Items.overlaps(item, p)) return;
      const t = item.type;
      if (t === 'cube') {
        item.taken = true;
        this.markTaken(item);
        P.cubes++;
        Sfx.play('cube');
        this.showTip('cube');
        if (P.cubes >= CONFIG.GAME.CUBES_PER_LIFE) {
          P.cubes = 0;
          this.heal(1);
        }
      } else if (t === 'coin') {
        item.taken = true;
        if (!this.bonus) this.markTaken(item);
        else this.bonus.got++;
        P.coins++;
        Sfx.play('maize');
      } else if (t === 'fruit') {
        item.taken = true;
        if (this.bonus) this.bonus.eaten++;
        Sfx.play('note');
        Effects.play('chispa', item.x + 8, item.y + 8);
      } else if (t === 'key' && this.mission === 'escape') {
        item.taken = true;
        this.hasKey = true;
        Sfx.play('key');
      } else if (t === 'scaleNote') {
        item.taken = true;
        this.markTaken(item);
        const zone = this.level.region || 1;
        const notes = P.notes[zone] || (P.notes[zone] = {});
        notes[item.props.nota || 'Do'] = true;
        P.hints = P.hints.filter(function (h) { return !(h.room === this.level.id && h.nota === item.props.nota); }, this);
        Sfx.play('ability');
        this.say(TEXT.scaleNote(item.props.nota || 'Do', zone, Object.keys(notes).length), 3);
      } else if (t === 'instrument') {
        item.taken = true;
        this.markTaken(item);
        const inst = CATALOGO.INSTRUMENTOS.find(function (x) { return x.id === item.props.cual; });
        P.instruments[item.props.cual || 'cuerdas'] = true;
        Sfx.play('ability');
        this.say(TEXT.instrument(inst ? 'el instrumento ' + inst.nombre : 'un instrumento'), 5);
      } else if (t === 'poliedro') {
        item.taken = true;
        this.markTaken(item);
        const pol = CATALOGO.POLIEDROS.find(function (x) { return x.id === item.props.forma; });
        P.poliedros[item.props.forma] = true;
        Sfx.play('ability');
        if (pol) this.say(TEXT.poliedro(pol), 5);
      } else if (t === 'heart') {
        item.taken = true;
        this.markTaken(item);
        P.maxHearts = Math.min(CONFIG.GAME.MAX_HEARTS, P.maxHearts + 1);
        this.hearts = P.maxHearts;
        Sfx.play('lifeUp');
        Effects.chiliBurst(item.x + 8, item.y + 8);
        this.say(TEXT.heart(P.maxHearts), 4);
        this.saveGame();
      } else if (t === 'colorKey') {
        item.taken = true;
        this.markTaken(item);
        P.keys[item.props.color] = true;
        Sfx.play('key');
        const k = WORLD.keyInfo(item.props.color);
        if (k) this.say(TEXT.colorKey(k), 5);
      } else if (t === 'mapRoll') {
        item.taken = true;
        this.markTaken(item);
        P.mapRegions[this.level.region || 1] = true;
        Sfx.play('ability');
        this.say(TEXT.mapRoll(this.level.region || 1), 3);
      } else if (t === 'chili' && p.chiliTime <= 0) {
        item.taken = true;
        p.eatChili();
        Effects.chiliBurst(p.x + p.w / 2, p.y + p.h);
        Sfx.play('chili');
        this.showTip('chili');
      } else if (t === 'save' && !item.active) {
        this.activateSave(item);
      } else if (t === 'hookItem') {
        item.taken = true;
        this.markTaken(item);
        this.overlay = { kind: 'reward', steps: [{ kind: 'aura' }, { kind: 'power', power: 'hook' }], i: 0, t: 0, boss: '' };
        this.startRewardStep();
      } else if (t === 'final') {
        item.taken = true;
        this.winGame();
      } else if (t === 'powerStone') {
        const pw = WORLD.power(item.props.poder || 'doubleJump');
        if (pw) this.hint(TEXT.stone(pw.nombre, p.has(pw.id)));
      }
    }, this);
  }

  regrowChili() {
    this.level.items.forEach(function (i) { if (i.type === 'chili') i.taken = false; });
  }

  activateSave(item) {
    this.level.items.forEach(function (i) { if (i.type === 'save') i.active = false; });
    item.active = true;
    const T = CONFIG.TILE;
    this.player.setSpawn(item.x + (T - this.player.w) / 2, item.y + T - this.player.h);
    Sfx.play('save');
    this.showTip('save');
  }

  // ---------- Puertas de color, sellos y portón ----------

  checkColorDoors() {
    const p = this.player;
    const d = this.level.closedDoorNear({ x: p.x, y: p.y, w: p.w, h: p.h });
    if (!d) return;
    const k = WORLD.keyInfo(d.color);
    if (!k) return;
    if (this.progress.keys[d.color]) {
      this.level.openDoor(d);
      const rs = this.roomState(this.level.id);
      Object.keys(this.level.openDoors).forEach(function (key) { rs.doors[key] = true; });
      Sfx.play('gate');
      Effects.play('poof', d.tx * CONFIG.TILE + 8, d.ty * CONFIG.TILE + 16);
      this.say(TEXT.doorOpened(k), 3);
    } else {
      const jefe = WORLD.boss(k.jefe);
      this.hint(TEXT.doorNeeds(k, jefe ? jefe.nombre : ''));
    }
  }

  // Con el poder, los sellos cercanos se deshacen en polvo (una sola vez)
  checkSeals() {
    const T = CONFIG.TILE;
    const p = this.player;
    const cx = (p.x + p.w / 2) / T;
    const cy = (p.y + p.h / 2) / T;
    this.level.seals.forEach(function (s) {
      const dist = Math.abs(s.tx + 0.5 - cx) + Math.abs(s.ty + 0.5 - cy);
      if (this.abilities[s.power]) {
        if (s.dust || dist > 6) return;
        s.dust = true;
        this.roomState(this.level.id).seals[s.tx + ',' + s.ty] = true;
        Effects.play('poof', s.tx * T + 8, s.ty * T + 8);
        Sfx.play('walls');
      } else if (dist < 1.8) {
        const pw = WORLD.power(s.power);
        if (pw) this.hint(TEXT.sealNeeds(pw.nombre.toLowerCase()));
      }
    }, this);
  }

  checkGate() {
    if (!this.level.hasGate || this.level.gateOpen) return;
    const p = this.player;
    if (this.level.rectHasTile(p.x - 2, p.y, p.w + 4, p.h, 'G')) this.hint(TEXT.gateClosed);
  }

  // ---------- Música por cercanía ----------

  soundSources() {
    const notes = this.mission === 'collect' ? this.corcheas.remaining() : [];
    const bosses = [];
    const J = this.level.bossSpawn;
    if (this.boss && J && (this.arenaPhase === 'idle' || this.arenaPhase === 'guards')) {
      const T = CONFIG.TILE;
      bosses.push({ x: J.tx * T, y: J.ty * T, w: T, h: T });
    }
    return { notes: notes, bosses: bosses };
  }

  // Sin misión no suena (en las principales); buscando corcheas suena según la más
  // cercana; con las corcheas juntas, según la llave; con la llave, entera
  updateEchoes(dt) {
    const src = this.soundSources();
    const E = CONFIG.ECHO;
    let goal = this.baseMusic();
    if (this.level.arenaActive || (this.mission === 'escape' && this.hasKey)) {
      goal = 1;
    } else if (this.mission === 'escape') {
      const key = this.level.items.filter(function (i) { return i.type === 'key' && !i.taken && !i.hidden; });
      goal = Echoes.nearLevel(this.player, key, E.KEY_TIERS, E.KEY_BASE);
    } else if (this.mission === 'collect') {
      goal = Echoes.nearLevel(this.player, src.notes);
    }
    this.musicNear += (goal - this.musicNear) * Math.min(1, dt * CONFIG.ECHO.MUSIC_FADE);
    Music.setNear(this.musicNear);
    Echoes.update(this.player, this.level.arenaActive ? [] : src.bosses);
  }

  // ---------- Efecto de la llave ----------

  keyFxOn() {
    return this.mission === 'escape' && this.hasKey;
  }

  updateKeyFx(dt) {
    const FX = CONFIG.KEY_FX;
    if (this.mission === 'escape') this.keyTime += dt;
    if (this.keyFxOn()) {
      this.sparkTimer -= dt;
      if (this.sparkTimer <= 0) {
        this.addSpark();
        this.sparkTimer = FX.SPARK_EVERY;
      }
    }
    Effects.update(dt);
  }

  addSpark() {
    const FX = CONFIG.KEY_FX;
    const p = this.player;
    Effects.addSpark({
      x: p.x + Math.random() * p.w, y: p.y + p.h - Math.random() * p.h,
      vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 30,
      life: FX.SPARK_LIFE, maxLife: FX.SPARK_LIFE,
      color: FX.COLORS[Math.floor(Math.random() * FX.COLORS.length)]
    });
  }

  shakeOffset() {
    const roar = this.boss ? this.boss.shake() : 0;
    if (roar > 0) {
      return { x: Math.round((Math.random() * 2 - 1) * roar), y: Math.round((Math.random() * 2 - 1) * roar) };
    }
    if (!this.keyFxOn()) return { x: 0, y: 0 };
    const FX = CONFIG.KEY_FX;
    const beat = 60 / this.level.bpm;
    const sinceBeat = this.keyTime % beat;
    if (sinceBeat > FX.SHAKE_TIME) return { x: 0, y: 0 };
    const power = FX.SHAKE * (1 - sinceBeat / FX.SHAKE_TIME);
    return { x: Math.round((Math.random() * 2 - 1) * power), y: Math.round((Math.random() * 2 - 1) * power) };
  }

  // ---------- Modo prueba ----------

  // 0 panel de prueba; 1 a 6 e I: poderes; 9: sala siguiente; 8: afinar la sala;
  // O: todas las llaves de color; 7: áreas de sonido
  handleDebugKeys() {
    if (Input.keyPressed('Digit0')) this.debug = !this.debug;
    if (Input.keyPressed('Digit7')) this.showAreas = !this.showAreas;
    if (!this.debug) return;
    if (Input.keyPressed('Digit9')) {
      const next = LEVELS[(this.levelIndex + 1) % LEVELS.length];
      this.fadeTo(function () { this.loadRoom(next.id, null); }.bind(this));
      return;
    }
    if (Input.keyPressed('Digit8') && this.mission !== 'done') {
      const t = this.totem();
      if (t) {
        this.mission = 'escape';
        this.hasKey = true;
        this.afinarSala(t);
      }
      return;
    }
    if (Input.keyPressed('KeyO')) {
      CATALOGO.LLAVES.forEach(function (k) { this.progress.keys[k.id] = true; }, this);
      this.say('Prueba: todas las llaves de color.', 2);
    }
    CONFIG.ABILITIES.forEach(function (a) {
      if (!Input.keyPressed(a.key)) return;
      this.abilities[a.id] = !this.abilities[a.id];
      this.updateSkin();
    }, this);
  }

  updateSkin() {
    let tint = null;
    CONFIG.ABILITIES.forEach(function (a) {
      if (this.abilities[a.id]) tint = CONFIG.SKINS[a.id];
    }, this);
    this.player.tint = Sprites.has('papa_quieta') ? null : tint;
  }

  // ---------- Cámara ----------

  updateCamera(lerp) {
    const p = this.player;
    const A = this.level.arena;
    let targetX = p.x + p.w / 2 - CONFIG.WIDTH / 2;
    let targetY = p.y + p.h / 2 - CONFIG.HEIGHT / 2;
    if (this.level.arenaActive && A) {
      if (A.right - A.left <= CONFIG.WIDTH) targetX = (A.left + A.right - CONFIG.WIDTH) / 2;
      if (A.bottom < this.level.pxH) targetY = A.bottom - CONFIG.HEIGHT;
    }
    this.camera.x += (targetX - this.camera.x) * lerp;
    this.camera.y += (targetY - this.camera.y) * lerp;
    this.camera.x = clamp(this.camera.x, 0, Math.max(0, this.level.pxW - CONFIG.WIDTH));
    this.camera.y = clamp(this.camera.y, 0, Math.max(0, this.level.pxH - CONFIG.HEIGHT));
  }

  // Humo que guía: en Fácil, a la corchea más cercana; con la llave fuera, a la llave;
  // con la llave en la mano, al tótem
  smokeTarget() {
    if (this.mission === 'collect' && this.rules().NOTE_SMOKE) {
      const p = this.player;
      let best = null;
      let bestD = Infinity;
      this.corcheas.remaining().forEach(function (c) {
        const d = Math.abs(c.x - p.x) + Math.abs(c.y - p.y);
        if (d < bestD) { bestD = d; best = c; }
      });
      return best ? { x: best.x, y: best.y, w: best.w, h: best.h, note: true } : null;
    }
    if (this.mission !== 'escape') return null;
    if (this.hasKey) return this.totem();
    return this.level.items.find(function (i) { return i.type === 'key' && !i.taken && !i.hidden; }) || null;
  }

  // ---------- Dibujo ----------

  draw(ctx) {
    if (this.state === 'splash') {
      UI.drawSplash(ctx, this.time, this.screenReady());
      return;
    }
    if (this.state === 'title') {
      UI.drawTitle(ctx, this.time, this.titleItems(), this.titleIndex, this.plus);
      return;
    }
    if (this.state === 'ready') {
      UI.drawReady(ctx, this.time, this.hearts, this.rules().NAME, this.screenReady(), this.mode === 'tower');
      return;
    }

    ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    Backdrop.scroll(this.camera.x, this.camera.y);
    const shake = this.shakeOffset();
    ctx.save();
    ctx.translate(-Math.round(this.camera.x) + shake.x, -Math.round(this.camera.y) + shake.y);
    this.level.draw(ctx, this.camera);
    if (this.showAreas) {
      const src = this.soundSources();
      Echoes.drawAreas(ctx, src.notes.concat(src.bosses));
    }
    UI.drawExitSigns(ctx, this);
    this.drawItems(ctx);
    this.corcheas.draw(ctx);
    this.drops.draw(ctx, this.time);
    this.enemies.draw(ctx);
    if (this.boss) this.boss.draw(ctx);

    const target = this.smokeTarget();
    if (target) {
      UI.drawSmoke(ctx,
        { x: this.player.x + this.player.w / 2, y: this.player.y + this.player.h / 2 },
        { x: target.x + target.w / 2, y: target.y + target.h / 2 },
        this.time, target.note ? CONFIG.COLORS.NOTE_SMOKE : CONFIG.COLORS.SMOKE);
    }
    this.drawPlayer(ctx);
    this.level.drawFront(ctx, this.camera);
    Effects.draw(ctx);
    this.drawArenaLight(ctx);
    if (this.prompt && !this.overlay && !this.menu.open) UI.drawPrompt(ctx, this.prompt, this.time);
    ctx.restore();

    if (this.mission === 'escape') UI.drawFilter(ctx, this.time);
    UI.drawHud(ctx, this);
    if (this.boss) this.boss.drawBar(ctx);
    if (this.banner && !this.menu.open) UI.drawBanner(ctx, this.banner);
    if (!this.menu.open) this.drawTopTexts(ctx);
    if (this.overlay) UI.drawOverlay(ctx, this);
    if (this.menu.open) this.menu.draw(ctx);
    this.drawEndScreen(ctx);
    if (this.fade) {
      const k = this.fade.t / CONFIG.GAME.FADE_TIME;
      UI.drawFade(ctx, this.fade.phase === 'out' ? k : 1 - k);
    }
  }

  drawPlayer(ctx) {
    const p = this.player;
    const phase = this.level.beatPhase();
    if (this.hurtTimer > 0 && Math.floor(this.time * 12) % 2 === 1) return;
    if (this.overlay && this.overlay.kind === 'reward' && this.overlay.steps[this.overlay.i].kind === 'aura') {
      UI.drawAura(ctx, p, this.overlay.t);
    }
    if (p.chiliTime > 0) Effects.drawChiliGlow(ctx, p, phase);
    p.draw(ctx);
    if (p.chiliTime > 0) Effects.drawChiliDot(ctx, p, phase);
    if (p.invincible()) {
      Sprites.drawAnchored(ctx, 'brillo_aji', Sprites.frameAt('brillo_aji', this.time), p.x + p.w / 2, p.y + p.h + 4, false);
    }
  }

  drawTopTexts(ctx) {
    let y = this.boss && this.boss.isActive() ? 42 : 17;
    if (this.debug) y = UI.drawDebug(ctx, this.player, y, this.level.id);
    const ending = this.menu.open || this.overlay || this.state === 'won' || this.state === 'gameover';
    if (this.message && !ending) y = UI.drawMessageBox(ctx, this.message.text, y, this.message.hint);
    if (this.tip && !ending) y = UI.drawTip(ctx, this.tip.text, this.tip.time, y);
    if (Music.error()) UI.drawSmallNote(ctx, Music.error(), y);
  }

  drawItems(ctx) {
    const opts = { hookOn: this.player.has('hook'), has: this.player.has.bind(this.player),
                   near: this.prompt ? this.prompt.item : null,
                   talking: this.overlay && this.overlay.kind === 'shop' ? this.overlay.vendor : null };
    this.level.items.forEach(function (item) {
      if (item.taken || item.hidden) return;
      Items.draw(ctx, item, this.time, opts);
    }, this);
    const t = this.totem();
    if (t && this.mission === 'idle' && this.mode === 'story') UI.drawMissionSign(ctx, t, this.time);
  }

  drawEndScreen(ctx) {
    const ready = this.endTimer > CONFIG.GAME.END_DELAY;
    if (this.state === 'won' && this.mode === 'tower') {
      UI.drawEnd(ctx, '¡Coliseo completado!',
        ['Venciste a los ' + TOWER.FLOORS.length + ' jefes.', 'Corazones: ' + this.hearts],
        '#ffd34d', ready, this.time, 'Toca para volver al inicio');
    } else if (this.state === 'won') {
      const E = ENDINGS[this.rules().ENDING];
      UI.drawEnd(ctx, E.title, E.lines.concat(['Dificultad: ' + this.rules().NAME]), E.color, ready, this.time,
        'Toca para volver al inicio');
    } else if (this.state === 'gameover') {
      UI.drawGameOver(ctx, this.time, [Save.hasGame() ? 'Continuar desde la posta' : 'Continuar', 'Volver al inicio'],
        this.overIndex, ready);
    }
  }
}
