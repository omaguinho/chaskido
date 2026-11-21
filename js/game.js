// El juego: el mundo de salas unidas por pasos, la misión de cada sala (tótem,
// corcheas, llave), los corazones, monedas y llaves, las salitas, los retos,
// las etapas bonus, los jefes, el viaje entre tótems y la partida guardada.

// Primera fila de la lista de viaje en un tótem dormido: empezar su misión
const TRAVEL_MISSION = '__mision';

// Número de la sala en el mapa (para ordenar la lista de viaje)
function roomNumber(id) {
  const r = WORLD.room(id);
  return r && /^\d+$/.test(r.num) ? Number(r.num) : 999;
}

// Textos de la partida
const TEXT = {
  intro: 'Muévete con A/D o el joystick. Salta con Espacio o X. Corre manteniendo E o Cuadrado. Toca el tótem para empezar la misión.',
  missionStart: function (n) { return '¡Misión iniciada! Los ' + n + ' instrumentos despertaron. Si te ven, huyen: atrápalos.'; },
  missionTimed: function (n, t) { return '¡Misión iniciada! Tienes ' + t + ' para atrapar los ' + n + ' instrumentos, tomar la llave y volver.'; },
  caught: function (name) { return '¡Atrapaste: ' + name + '!'; },
  escapeBoss: '¡Apareció la llave del jefe! Tómala: abre su portón.',
  escape: '¡Apareció la llave! Tómala y llévala al tótem antes de que termine la canción.',
  timeout: 'Se acabó la canción. Los instrumentos volvieron a su lugar: toca el tótem para intentarlo otra vez.',
  afinada: function (song) { return '¡La sala se afinó! «' + song + '» entró al Catálogo de músicas.'; },
  totemBusy: function (n) { return n === 1 ? 'Falta 1 instrumento.' : 'Faltan ' + n + ' instrumentos.'; },
  totemKey: 'Busca la llave y tráela antes de que termine la canción.',
  noTravel: 'Todavía no hay otras salas a las que viajar.',
  rested: 'Descansaste junto al fogón: corazones llenos. Partida guardada.',
  saved: 'Banderita: si pierdes un corazón por caer, vuelves aquí.',
  wallBroken: '¡Rompiste el muro con el dash!',
  gateClosed: 'Un portón cerrado. Se abre al afinar esta sala.',
  doorOpened: function (k) { return '¡La ' + k.nombre.toLowerCase() + ' abrió la puerta!'; },
  doorNeeds: function (k, jefe) { return jefe ? 'Esta puerta la abre la ' + k.nombre.toLowerCase() + ', que da ' + jefe + '.' : 'Esta puerta la abre la ' + k.nombre.toLowerCase() + '.'; },
  sealNeeds: function (p) { return 'Sello de poder: se abre con ' + p + '.'; },
  stone: function (p, has) { return 'Piedra del poder: ' + p + (has ? '. Ya lo tienes.' : '. Todavía no lo tienes.'); },
  notBuilt: 'Este paso lleva a una sala que todavía está en obras.',
  missionLeft: function (room) { return 'Dejaste la misión de ' + room + '. Vuelve a su tótem para empezarla otra vez.'; },
  missionKept: 'La misión sigue: tus instrumentos te esperan.',
  // wall: la nota del muro; known: si ya se aprendió
  tuneWrong: function (wall, known) {
    const N = CONFIG.TUNER.NOTES[wall];
    if (!known) return 'Ese muro suena en ' + N.name + '. Todavía no aprendiste esa nota: vuelve cuando la tengas.';
    if (N.flatOf) return 'Ese muro suena en ' + N.name + ': mantén el diapasón hasta ' + CONFIG.TUNER.NOTES[N.flatOf].name + ' y suelta con abajo apretado.';
    if (wall === 'la') return 'Ese muro suena en La: un toque corto del diapasón.';
    return 'Ese muro suena en ' + N.name + ': mantén el diapasón hasta que el anillo llegue a ' + N.name + ' y suelta.';
  },
  arenaClosed: '¡La arena se cerró! Derrota a los guardias.',
  bossArena: function (name) { return '¡La arena se cerró! ' + name; },
  towerFloorDone: function (n) { return '¡Piso ' + n + ' superado!'; },
  bossWonNoGift: '¡Jefe vencido!',
  scaleNote: function (n, zone, count) { return '¡Nota ' + n + ' de ' + WORLD.regionInfo(zone).nombre + '! (' + count + ' de 7)'; },
  instrument: function (name) { return '¡Encontraste ' + name + '! Su ficha está en el Catálogo de músicas.'; },
  poliedro: function (p) { return '¡' + p.nombre + '! ' + p.que; },
  heart: function (n) { return '¡Corazón extra! Ahora tienes ' + n + ' corazones.'; },
  colorKey: function (k) { return '¡Encontraste la ' + k.nombre.toLowerCase() + '! ' + k.abre; },
  mapRoll: function (z) { return '¡Rollo de mapa! Ya ves toda ' + WORLD.regionInfo(z).nombre + ' en el mapa.'; },
  bonusStart: function (n, t) { return n > 0 ? '¡Come las ' + n + ' frutas en ' + t + ' segundos!' : '¡Llega a la meta en ' + t + ' segundos!'; },
  bonusWon: function (coins) { return '¡Bonus completo! +' + coins + ' monedas.'; },
  bonusAgain: '¡Bonus completo otra vez!',
  bonusHeart: function (n) { return '¡Te comiste todas las frutas! Corazón extra: ahora tienes ' + n + '.'; },
  bonusLost: 'Se acabó el tiempo.',
  chiliUsed: 'Comiste el ají para llevar.',
  gameSaved: 'Partida guardada.',
  cantSave: 'No se pudo guardar (el navegador no deja).',
  goldNeeds: function (n, all) { return 'La puerta dorada pide las ' + all + ' salas afinadas: llevas ' + n + '.'; }
};

const TIPS = {
  cube: 'Cubo sonoro: junta 5 y recuperas un corazón.',
  coin: 'Moneda: se gasta con los vendedores.',
  chili: 'Ají: por 5 segundos eres invencible, corres y saltas más.',
  save: 'Banderita: si caes, vuelves aquí.',
  tuneOpen: 'El muro resonó con su nota y se deshizo. Los muros abiertos quedan abiertos.',
  mud: 'Barro: corres más lento. Salta para no quedarte pegado.',
  crack: 'El zapateo rompió el suelo agrietado. Queda roto para siempre.',
  shellOpen: 'El caracol despertó las plataformas de la niebla. Ya no se van.'
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
    I18N.set(this.settings.lang || 'es');
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
    this.tuner = new Tuner();
    this.scene = null;            // escena del prólogo (js/prologo.js)
    this.screenShake = 0;         // temblor de las escenas (segundos)
    this.newRun();
    this.loadRoom(CONFIG.GAME.FIRST_ROOM, null);
    this.openTitle();
  }

  // Jefes según la dificultad (en el Coliseo, siempre como en Normal)
  bossTuning() {
    return this.mode === 'tower' ? {} : (CONFIG.BOSS_DIFFICULTY[this.difficulty] || {});
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
      notes: {}, instruments: {}, poliedros: {}, hints: [],
      tunerNotes: this.plus ? { si: true } : {}   // notas del diapasón que enseñaron los jefes (La viene con él)
    };
  }

  newRun() {
    this.progress = this.newProgress();
    this.hearts = this.progress.maxHearts;
    this.tipsShown = {};
    this.tip = null;
    this.salitaReturn = null;
  }

  // Historia o speedrun: se juegan igual (el speedrun no guarda la partida)
  isStory() {
    return this.mode === 'story' || this.mode === 'speedrun';
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

  // Notas del diapasón que se pueden tocar: La viene con él; las demás, de los jefes
  knownNotes() {
    const known = Object.assign({}, this.progress.tunerNotes);
    if (this.abilities.tuner) known.la = true;
    return known;
  }

  // Partidas guardadas con algo perdido: si ya se salió del prólogo (o se venció al
  // Eco), el diapasón está; y las notas de los jefes vencidos se suman siempre
  repairProgress() {
    const P = this.progress;
    const pastPrologue = (P.rooms.p2 && P.rooms.p2.boss) || Object.keys(P.rooms).some(function (id) {
      const l = LEVELS.find(function (x) { return x.id === id; });
      return l && l.region >= 1;
    });
    if (pastPrologue) P.abilities.tuner = true;
    P.tunerNotes = Object.assign(this.notesFromBosses(), P.tunerNotes || {});
  }

  // Partidas guardadas antes de la v16: las notas salen de los jefes ya vencidos
  notesFromBosses() {
    const notes = {};
    const P = this.progress;
    LEVELS.forEach(function (l) {
      const rs = P.rooms[l.id];
      const n = l.boss && rs && rs.boss ? CONFIG.TUNER.BOSS_NOTES[l.boss.type] : null;
      if (n) notes[n] = true;
    });
    if (P.plus || P.abilities.tuner) notes.si = true;
    return notes;
  }

  // Guarda la partida: sala y lugar donde se vuelve (la posta, o el último punto seguro)
  // Sin spot (guardados automáticos: sala afinada, premio de jefe, bonus...) se vuelve
  // a la última posta: antes se guardaba el punto donde estabas y "Continuar" no
  // llevaba a la posta. here = true (guardar desde el menú): el lugar actual.
  saveGame(spot, here) {
    if (this.mode !== 'story') return false;
    const P = this.progress;
    const back = this.salitaReturn;
    const last = P.checkpoint || P.posta;     // la última banderita o posta
    if (!spot && !here && last && LEVELS.some(function (l) { return l.id === last.room; })) {
      P.room = last.room;
      P.spot = { x: last.x, y: last.y };
    } else if (back) {
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
    this.repairProgress();
    this.progress.sessions = (data.sessions || 0) + 1;   // una partida más (para el ají)
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
    if (this.player && this.player.dancing) this.player.stopDance();
    Music.stopStems();
    const data = this.levelData(id) || LEVELS[0];
    this.levelIndex = LEVELS.indexOf(data);
    const L = this.level = new Level(data);
    const rs = this.roomState(L.id);
    L.powers = this.abilities;
    L.openDoors = Object.assign({}, rs.doors);
    L.exits.forEach(function (e) { if (!WORLD.built(e.goes)) L.blockExit(e); });
    L.gateOpen = rs.afinada || !this.isMissionRoom(L);
    if (rs.broken.length) L.removeCells(rs.broken);
    if (rs.shown && rs.shown.length) L.showCells(rs.shown);
    L.seals.forEach(function (s) { if (rs.seals[s.tx + ',' + s.ty]) s.dust = true; });
    L.items.forEach(function (it) {
      if (rs.taken[it.key]) it.taken = true;
      if (it.type === 'totem') it.state = rs.afinada ? 'activo' : 'dormido';
      if (it.type === 'posta') it.active = !!this.progress.posta && this.progress.posta.room === L.id;
      if (it.type === 'key') it.hidden = true;
      if (it.type === 'chili' && rs.chili && rs.chili[it.key] !== undefined &&
          (this.progress.sessions || 0) - rs.chili[it.key] < CONFIG.CHILI.REGROW_SESSIONS) it.taken = true;
    }, this);

    this.player = new Player(L.spawn.x, L.spawn.y);
    this.player.abilities = this.abilities;
    this.instrumentos = new Instrumentos(L);
    this.enemies = new Enemies(L);
    this.vecinos = new Vecinos(L, rs);
    this.drops = new Drops();
    const b = L.bossSpawn;
    const type = L.boss ? L.boss.type : 'bombo';
    ArenaBoss.tuning = this.bossTuning();
    this.boss = b && !rs.boss && BOSS_TYPES[type] ? new BOSS_TYPES[type](b.tx, b.ty) : null;
    this.silencioForm = 1;
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
    this.tuner = new Tuner();
    Effects.clear();
    BossShow.reset();

    this.placePlayer(arrive);
    this.camera = { x: 0, y: 0 };
    this.updateCamera(1);
    this.markVisited(L.id);
    this.setupBonus();
    Backdrop.set(L.theme);
    // Sin afinar, la sala se ve apagada; las de CONFIG.GAME.FULL_COLOR_ROOMS empiezan con color
    const fullColor = CONFIG.GAME.FULL_COLOR_ROOMS.indexOf(L.id) >= 0;
    Backdrop.setMuted(false);   // cada sala con su color original (antes se apagaba sin afinar)
    this.banner = (L.kind === 'principal' || L.kind === 'secreto' || L.kind === 'reto') && this.isStory()
      ? { title: WORLD.label(L.id), name: L.name, time: CONFIG.GAME.BANNER_TIME } : null;
    // Luz de la sala y escena del prólogo (la escena va al final: puede cambiar fondo y luz)
    Light.setRoom(L);
    this.scene = Scenes.create(data, this, arrive);
    // La misión ya no se activa en el tótem: al entrar, los instrumentos están despiertos.
    // Los que ya atrapaste siguen atrapados (roomState.caught) y su pista suena.
    if (this.mission === 'idle' && this.isStory() && (L.kind === 'principal' || L.id === 'n22') && this.totem()) {
      this.startMission(this.totem(), true);
      const caught = rs.caught || [];
      this.instrumentos.list.forEach(function (c, i) {
        if (!caught[i]) return;
        c.state = 'caught';
        Music.collectStem(c.tipo);
      });
      this.notes = caught.filter(Boolean).length;
    }
  }

  // Salas con misión de tótem: las principales y las del prólogo
  isMissionRoom(L) {
    return L.kind === 'principal' || L.kind === 'prologo';
  }

  // Fin de la gran caída: la papa cae en las Calles del Ocaso desde arriba
  landFromPrologue(x) {
    const from = this.level.id;
    this.fade = { t: 0, phase: 'out', to: CONFIG.GAME.WORLD_ROOM, white: true,
                  arrive: { exit: { side: 'bottom', tag: '' }, from: from, offset: x, vx: 0, vy: CONFIG.PLAYER.MAX_FALL } };
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
    if (this.scene && this.scene.music) {
      this.scene.music(this);
      return;
    }
    const R = (CONFIG.MUSIC.ROOM_MUSIC || {})[L.id];
    Music.setRate(Music.hasStems(L.id) ? 1 : (R && R.rate ? R.rate : L.rate));
    if (this.mission === 'escape') Music.play('key');
    else if (Music.hasStems(L.id) && this.mission === 'done') Music.playStems(L.id, true);
    else if (Music.hasStems(L.id)) {   // sin afinar: en silencio, suena lo que atrapas o tienes cerca
      // el tema suena y cada instrumento atrapado se suma
      Music.startSearch(L.id);
      this.instrumentos.list.forEach(function (c) { if (c.state === 'caught') Music.collectStem(c.tipo); });
    }
    else if (R) Music.play(R.track);
    else Music.play(this.mission === 'done' || !this.isMissionRoom(L) ? L.music : 'main');
    this.musicNear = 0;
    Music.setNear(this.baseMusic());
  }

  // Volumen de la música sin misión: salas afinadas, salitas, retos y jefes suenan bajito
  baseMusic() {
    const L = this.level;
    if (this.isMissionRoom(L)) return this.mission === 'done' ? 0.55 : CONFIG.ECHO.IDLE_MUSIC;
    return 0.6;
  }

  // ---------- Pantalla de inicio ----------

  openTitle() {
  this.state = 'splash';
  this.screenTime = 0;
  Backdrop.set('none');
  Backdrop.setMuted(false);

 // Música de la portada: Niño interno
  Music.play('portada');
  Music.setRate(1);
  Music.setNear(1);

  // Reinicia el sonido de las letras si vuelves al inicio
  if (typeof Scenes !== 'undefined' && Scenes.resetTitleSound) Scenes.resetTitleSound();
}
  screenReady() {
    return this.screenTime >= CONFIG.GAME.READY_DELAY;
  }

  updateSplash() {
    if (!this.screenReady() || !Input.anyPressed()) return;
    Sfx.play('select');
    this.screenTime = 0;
    this.titleIndex = 0;
    // La primera vez se elige el idioma (después se cambia en el inicio o en la pausa)
    if (!this.settings.lang) {
      this.state = 'lang';
      this.langIndex = 0;
      return;
    }
    this.state = 'title';
  }

  // ---------- Elegir idioma (la primera vez) ----------

  updateLang() {
    if (!this.screenReady()) return;
    const n = I18N.LANGS.length;
    const row = this.tappedRow(CONFIG.LANG_MENU, n);
    if (row >= 0 && row !== this.langIndex) {
      this.langIndex = row;
      I18N.set(I18N.LANGS[row].id);
      Sfx.play('move');
      return;
    }
    if (Input.pressed('up') || Input.pressed('down')) {
      this.langIndex = (this.langIndex + (Input.pressed('up') ? n - 1 : 1)) % n;
      I18N.set(I18N.LANGS[this.langIndex].id);
      Sfx.play('move');
    }
    if (!Input.pressed('confirm') && row < 0) return;
    Sfx.play('select');
    this.setLang(I18N.LANGS[this.langIndex].id);
    this.state = 'title';
    this.screenTime = 0;
  }

  setLang(id) {
    I18N.set(id);
    this.settings.lang = I18N.get();
    Save.writeSettings(this.settings);
  }

  // Idioma siguiente (o anterior) en la pausa y en el inicio
  changeLang(step) {
    this.setLang(I18N.next(step));
    Sfx.play('move');
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
    items.push('speedrun');
    items.push('lang');
    items.push('credits');
    return items;
  }

  // El coliseo se abre al terminar la historia en Normal o Difícil
  // Truco para probar: en la portada, izquierda, derecha, arriba, abajo (dos veces)
  // abre el Coliseo y el Speedrun sin terminar la historia
  checkCheat() {
    const dirs = ['left', 'right', 'up', 'down'];
    const hit = dirs.find(function (d) { return Input.pressed(d); });
    if (!hit) return;
    const seq = (this.cheatSeq || []).concat([hit]).slice(-8);
    this.cheatSeq = seq;
    if (seq.join() !== dirs.concat(dirs).join() || this.records.towerUnlocked) return;
    this.records.towerUnlocked = true;
    Save.writeRecords(this.records);
    Sfx.play('lifeUp');               // las opciones dejan de verse en gris
  }

  towerUnlocked() {
    return !!this.records.towerUnlocked;
  }

  updateTitle() {
    if (!this.screenReady()) return;
    // Créditos abiertos: cualquier botón los cierra
    if (this.showCredits) {
      if (Input.pressed('confirm') || Input.pressed('pause') || Input.tapPoint()) {
        this.showCredits = false;
        Music.play('portada');
        Sfx.play('move');
      }
      return;
    }
    this.checkCheat();
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
    if (item === 'lang') {
      if (Input.pressed('left')) this.changeLang(-1);
      else if (Input.pressed('right') || accept) this.changeLang(1);
      return;
    }
    if (!accept) return;
    if ((item === 'tower' || item === 'speedrun') && !this.towerUnlocked()) {
      Sfx.play('tuneWrong');           // todavía cerrado (se ve en gris)
      return;
    }
    if (item === 'speedrun') {
      SpeedRun.openMenu(this);
      return;
    }
    if (item === 'credits') {
      this.showCredits = true;
      Music.play('creditos');           // Momento único
      Sfx.play('select');
      return;
    }
    Sfx.play('select');
    if (item === 'continue') {
      this.continueGame();
      return;
    }
    this.mode = item === 'tower' ? 'tower' : 'story';
    this.difficulty = item === 'tower' ? TOWER.DIFFICULTY : item;
    this.newRun();
    this.towerFloor = 0;
    this.towerTime = 0;
    this.towerDone = false;
    // En la historia el prólogo enseña los controles: se empieza al tiro
    if (this.mode === 'story') {
      this.startRun();
      return;
    }
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
    // La partida nueva empieza en el prólogo (Nueva partida +, en la Sala 1)
    this.loadRoom(this.plus ? CONFIG.GAME.WORLD_ROOM : CONFIG.GAME.FIRST_ROOM, null);
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
      SpeedRun.towerWon(this);
      this.state = 'won';
      this.endTimer = 0;
      Music.stop();
      Sfx.play('final');
    }
  }

  // ---------- Fin de partida ----------

  // Golpe a la papa: sonido, pantalla que tiembla, destello rojo y vibración del mando
  feelHurt() {
    Sfx.play('hurt');
    this.screenShake = Math.max(this.screenShake || 0, 0.3);
    this.hurtFlash = 0.25;
    if (this.settings.rumble) Input.rumble(180, 0.7, 0.5);
  }

  gameOver() {
    if (this.mode === 'speedrun') {           // en el speedrun se vuelve al menú de zonas
      Sfx.play('collapse');
      SpeedRun.fail(this);
      return;
    }
    // La papa cae: sonido de derrumbe y un temblor fuerte
    Sfx.play('collapse');
    this.screenShake = 0.6;
    if (this.settings.rumble) Input.rumble(400, 1, 0.8);
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

  // Salas principales afinadas (para la puerta dorada)
  tunedCount() {
    const rooms = this.progress.rooms;
    return LEVELS.filter(function (l) {
      return (l.kind || 'principal') === 'principal' && /^n/.test(l.id) && l.id !== 'n22' && rooms[l.id] && rooms[l.id].afinada;
    }).length;
  }

  // Fiesta final: todos (vecinos, animales ya libres y jefes) bailan porque volvió la música
  startFiesta() {
    this.state = 'fiesta';
    this.endTimer = 0;
    Music.setRate(1);
    Music.setNear(1);
    Music.play('main');
    Sfx.play('final');
  }

  updateFiesta(dt) {
    this.endTimer += dt;
    const F = CONFIG.ENDGAME;
    if (this.endTimer > F.FIESTA_TIME || (this.endTimer > 4 && Input.anyPressed())) this.winGame();
  }

  winGame() {
    this.state = 'won';
    this.endTimer = 0;
    Music.stop();
    Sfx.play('final');
    let changed = false;
    if (this.rules().ENDING === 'true' && !this.records.plusUnlocked) {
      this.records.plusUnlocked = true;
      changed = true;
    }
    if ((this.difficulty === 'normal' || this.difficulty === 'hard') && !this.records.towerUnlocked) {
      this.records.towerUnlocked = true;
      changed = true;
    }
    if (changed) Save.writeRecords(this.records);
  }

  // ---------- Mensajes ----------

  // Mensaje: dura menos que antes (CONFIG.GAME.MESSAGE_SPEED). Los importantes (important)
  // pausan el juego hasta apretar Acción (E / Cuadrado)
  say(str, seconds, important) {
    if (important && this.isStory()) {
      this.modal = { text: str, t: 0 };
      return;
    }
    this.message = { text: str, time: (seconds || CONFIG.GAME.MESSAGE_TIME) * CONFIG.GAME.MESSAGE_SPEED };
  }

  // Mensaje de misión (empezó, se acabó el tiempo...): no detiene el juego, pero dura
  // al menos CONFIG.GAME.MISSION_MESSAGE segundos para alcanzar a leerlo
  sayMission(str) {
    this.message = { text: str, time: CONFIG.GAME.MISSION_MESSAGE };
  }

  // Aviso corto (por ejemplo, frente a una puerta): no tapa un mensaje importante
  hint(text) {
    if (this.message && !this.message.hint) return;
    this.message = { text: text, time: 1, hint: true };
  }

  // Cada consejo (monedas, dados, ají...) sale como mucho CONFIG.GAME.TIP_MAX veces en
  // toda la partida: con las primeras ya se entiende y después cansa
  showTip(id) {
    if (this.mode === 'speedrun' || this.tipsShown[id]) return;   // en el speedrun, sin consejos
    this.tipsShown[id] = true;
    const seen = this.progress.tipsSeen || (this.progress.tipsSeen = {});
    if ((seen[id] || 0) >= (CONFIG.GAME.TIP_MAX || 3)) return;
    seen[id] = (seen[id] || 0) + 1;
    this.tip = { text: TIPS[id], time: CONFIG.GAME.TIP_TIME };
  }

  // ---------- Actualización ----------

  update(dt) {
    // Cada 2 segundos se despierta el sonido por si el navegador lo frenó
    this.audioCheck = (this.audioCheck || 0) + dt;
    if (this.audioCheck > 2 || (Input.anyPressed() && this.audioCheck > 0.3)) {
      this.audioCheck = 0;
      // (si sfx.js o audio.js son de una versión vieja, no hace nada)
      if (Sfx.wake) Sfx.wake();
      if (Music.wake) Music.wake();
      if (Music.keepAlive) Music.keepAlive();
      this.slotBlink = Math.max(0, (this.slotBlink || 0) - dt);   // la pista que se cortó o no llegó vuelve a sonar
    }
    this.time += dt;
    if (Input.keyPressed('KeyM')) Sfx.setMuted(Music.toggleMute());

    if (this.state === 'splash' || this.state === 'title' || this.state === 'lang' || this.state === 'ready' || this.state === 'speedmenu') {
      Echoes.silence();
      this.screenTime += dt;
      if (this.state === 'speedmenu') SpeedRun.updateMenu(this);
      else if (this.state === 'splash') this.updateSplash();
      else if (this.state === 'title') this.updateTitle();
      else if (this.state === 'lang') this.updateLang();
      else this.updateReady();
      return;
    }
    if (this.state === 'gameover') {
      Echoes.silence();
      this.endTimer += dt;
      this.updateGameOver();
      return;
    }
    if (this.state === 'fiesta') {
      Echoes.silence();
      this.updateFiesta(dt);
      return;
    }
    if (this.modal) {
      this.modal.t += dt;
      if (this.modal.t > 0.4 && (Input.pressed('action') || Input.pressed('confirm'))) this.modal = null;
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
    this.screenShake = Math.max(0, this.screenShake - dt);
    this.hurtFlash = Math.max(0, (this.hurtFlash || 0) - dt);
    // Presentación del jefe: la portada detiene el mundo; los golpes lo frenan un instante
    BossShow.update(dt, this.boss);
    if (BossShow.updateIntro(dt)) return;
    // La gran caída del prólogo maneja todo ella misma
    if (this.scene && this.scene.ownsWorld) {
      this.scene.update(dt, this);
      this.level.update(dt);
      Light.update(dt, this);
      Echoes.silence();
      this.camera.x = 0;
      this.camera.y = 0;
      return;
    }
    const scale = BossShow.timeScale();
    if (scale > 0) this.updateWorld(dt * scale);
    if (this.scene) this.scene.update(dt, this);
  }

  // Con el ají suena el tema de la zona 1 rápido (200 BPM); al terminar vuelve la de la sala
  updateChiliMusic() {
    const on = this.player.chiliTime > 0 && !(this.boss && this.level.arenaActive);
    if (on && !this.chiliMusic) {
      this.chiliMusic = true;
      const C = CONFIG.MUSIC.CHILI_MUSIC;
      Music.play(C.track);
      Music.setRate(C.rate);
    } else if (!on && this.chiliMusic) {
      this.chiliMusic = false;
      this.startRoomMusic();
    }
  }

  // Precio actual de un producto: el ají sube CONFIG.CHILI.PRICE_STEP con cada compra
  priceOf(good) {
    if (good.id !== 'aji') return good.precio;
    return good.precio + (this.progress.chiliBought || 0) * (CONFIG.CHILI.PRICE_STEP || 40);
  }

  updateWorld(dt) {
    const p = this.player;
    if (this.mode === 'speedrun') SpeedRun.tick(this, dt);   // el reloj corre igual
    if (this.mode === 'tower') SpeedRun.towerTick(this, dt);
    // Mientras la cámara muestra la llave o el portón, el juego queda congelado
    if (this.camPan) {
      this.updateCamera(CONFIG.CAMERA_LERP);
      return;
    }
    this.level.update(dt);
    p.frozen = !!(this.boss && this.boss.holdsPlayer()) || !!(this.scene && this.scene.holdsPlayer && this.scene.holdsPlayer());
    p.push = this.bossWind + p.current * CONFIG.WATER.CURRENT;
    this.prompt = this.findPrompt();
    p.hookBlocked = !!this.prompt;
    p.update(dt, this.level);
    this.updateChiliMusic();
    this.level.passOneWay = false;     // solo la papa atraviesa las plataformas de paso al bajar
    this.updateGeysers();
    this.keepInArena();
    this.level.pressSinkers(p);
    const tone = this.tuner.update(dt, p, this.level, this.knownNotes());
    if (tone) this.onTone(tone);
    this.updateShell(dt);
    if (p.onGround && p.material(this.level) === CONFIG.MATERIALS.barro) this.showTip('mud');
    this.level.touchCrumbles(p);
    this.playerEvents();
    this.instrumentos.update(dt, this.level, p, this.level.id);
    this.enemies.update(dt, this.level, p, this.camera);
    this.vecinos.update(dt, this);
    this.enemies.takeShoves().forEach(function (e) { p.shove(e.dir); Sfx.play('stomp'); });
    this.dropCoins();
    this.drops.update(dt, this.level);
    this.updateArena();
    this.bossWind = 0;
    if (this.boss) {
      this.boss.update(dt, this.level, p);
      this.boss.warn = Math.max(0, (this.boss.warn || 0) - dt);
      this.bossWind = this.boss.wind ? this.boss.wind() : 0;
    }
    this.hurtTimer = Math.max(0, (this.hurtTimer || 0) - dt);

    if (this.checkExits()) return;
    if (this.isHurtByWorld()) {
      this.loseLife();
    } else {
      this.useAction();
      this.collectItems();
      this.collectCoins();
      this.catchInstrumentos();
      this.checkTotem();
      this.checkColorDoors();
      this.checkSeals();
      this.checkGate();
      this.checkEnemies();
      this.checkBoss();
    }

    this.updateTower(dt);
    this.updateMissionTimer(dt);
    if (this.mission === 'merging') {
  this.mergeTimer += dt;
  if (this.mergeTimer > this.mergeTime()) {
    this.player.stopDance();
    this.mission = 'escape';
    
    if (!this.level.boss) {
      // Si NO hay jefe (Nivel 1, 2, 4, 5...), afinamos directo sin llave
      const t = this.totem();
      if (t) this.afinarSala(t);
    } else {
      // Si HAY jefe (Nivel 3, 6...), llamamos a startEscape para que suelte la llave
      this.startEscape();
    }
    
    this.say('¡Pistas fusionadas!', 4, this.mode !== 'speedrun');
  }
  return; 
}
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
    Light.update(dt, this);
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
    } else if (F.phase === 'in' && F.t >= CONFIG.GAME.FADE_TIME * (F.white ? 3 : 1)) {
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
      if (!this.isStory()) return null;
      const prologue = this.level.kind === 'prologo';
      if (this.mission === 'idle') return prologue ? 'Comenzar misión' : 'Misión o viaje';
      if (this.mission === 'done') return prologue ? null : 'Viajar';
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

  // Tótem dormido: primero ofrece la misión y debajo el viaje; encendido: solo el viaje.
  // En el prólogo no se viaja: su tótem solo tiene la misión
  useTotem(t) {
    const prologue = this.level.kind === 'prologo';
    if (this.mission === 'idle') {
      if (prologue) this.startMission(t);
      else this.openTravel(t);
    } else if (this.mission === 'collect' && !prologue) {
      this.say(TEXT.totemBusy(this.instrumentos.remaining().length), 3);   // informa lo que falta
    } else if (this.mission === 'done' && !prologue) {
      this.openTravel(null);
    }
  }

  // silent: al entrar a la sala (sin mensaje ni reloj; la música la pone startRoomMusic)
  startMission(t, silent) {
    const n = this.instrumentos.total();
    this.mission = 'collect';
    this.notes = 0;
    this.missionClock = 0;
    this.instrumentos.wakeAll();
    t.state = 'despierto';
    if (silent) {
      if (n === 0) this.startEscape();
      return;
    }
    // Activamos el sistema de audio de instrumentos
    Music.startSearch(this.level.id);
    Sfx.play('door');
    const limit = this.rules().MISSION_TIME;
    if (limit > 0) {
      this.timeLeft = limit;
      this.lastTick = 0;
      this.sayMission(TEXT.missionTimed(n, formatTime(limit)));
    } else {
      this.sayMission(TEXT.missionStart(n));
    }
    if (n === 0) this.startEscape();
  }

  catchInstrumentos() {
  if (this.mission !== 'collect') return;
  const caughtList = this.instrumentos.catchWith(this.player);
  if (!caughtList.length) return;
  
  this.notes += caughtList.length;
  Sfx.play('note');
  this.roomState(this.level.id).caught = this.instrumentos.list.map(function (c) { return c.state === 'caught'; });
  this.musicBoost = CONFIG.ECHO.CATCH_BOOST;

  // Mostramos el mensaje y la "miniatura" por cada uno que comimos
  caughtList.forEach(tipo => {
    const nombreBonito = (CONFIG.MUSIC.STEM_NAMES || {})[tipo] || (tipo.charAt(0).toUpperCase() + tipo.slice(1)); // Ej: 'Bajo'
    
    // 1. El mensaje rápido
    this.say(TEXT.caught(nombreBonito), 2.5, false); 
    
    // 2. El texto flotante, en el idioma elegido
    Effects.popup('+ ' + tr(nombreBonito), this.player.x + this.player.w / 2, this.player.y - 10, '#ffd34d');
  });

  // Si ya juntamos todos, empezamos la animación de fusión en lugar del escape directo
  if (this.notes >= this.instrumentos.total()) {
    this.mission = 'merging';
    this.mergeTimer = 0;
    Sfx.play('ability'); // Sonido de fusión
    // Durante el mix la papa baila (en el speedrun no hay mix: se sigue al tiro)
    if (this.mergeTime() > 0) this.player.startDance();
  }
}

  // Lo que dura el mix (en el speedrun, nada)
  mergeTime() {
    return this.mode === 'speedrun' ? CONFIG.SPEEDRUN.MERGE_TIME : CONFIG.GAME.MERGE_TIME;
  }

  // Con los 3 instrumentos aparece la llave y empieza la cuenta de la canción
  // Solo las salas con jefe tienen llave: la cámara va a mostrarla y vuelve. Tomarla
  // afina la sala y abre el portón del jefe. En las demás, las 3 corcheas ya la afinan
  startEscape() {
  // 1. SI NO HAY JEFE: Afinamos la sala directo y salimos (sin llave)
  if (!this.level.boss) {
    const t = this.totem();
    if (t) this.afinarSala(t);
    return;
  }

  // 2. SI HAY JEFE: Hacemos la lógica de la llave
  this.mission = 'escape';
  if (this.rules().MISSION_TIME <= 0) this.timeLeft = this.level.time;
  this.keyTime = 0;
  this.lastTick = 0;
  
  const key = this.level.items.find(function (i) { return i.type === 'key'; });
  if (key) {
    key.hidden = false;
    key.taken = false;
    Effects.play('poof', key.x + 8, key.y + 8);
    if (this.mode !== 'speedrun') this.panCamera(key.x + 8, key.y + 8);   // en el speedrun no se detiene
  } else {
    this.hasKey = true;
  }
  this.say(TEXT.escapeBoss, 4, this.mode !== 'speedrun');
}

  // Con la llave en la mano, al tocar el tótem la sala se afina
  checkTotem() {
    const t = this.totem();
    if (!t) return;
    const near = overlaps(Items.nearBox(t), this.player);
    if (!near) return;
    if (this.mission === 'escape' && this.hasKey) this.afinarSala(t);
    else if (this.mission === 'collect') this.hint(TEXT.totemBusy(this.instrumentos.remaining().length));
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
    const song = CATALOGO.nombreMusica(L.id);
    let msg = TEXT.afinada(song);
    if (L.hasGate) {
      msg += ' ' + (L.gateHint || '');
      Sfx.play('gate');
    }
    const record = this.saveRecord();
    if (record) msg += ' ' + record;
    this.say(msg, 7, this.mode !== 'speedrun');
    Music.playStems(L.id, true);     // la sala afinada suena con todos sus instrumentos
    this.saveGame();
  }

  // Misión en curso (corcheas atrapadas, llave, tiempo) para devolverla al salir
  // de una tienda o un bonus. null si no hay misión en curso.
  missionSnapshot() {
    if (!this.isStory() || (this.mission !== 'collect' && this.mission !== 'escape')) return null;
    const key = this.level.items.find(function (i) { return i.type === 'key'; });
    return {
      room: this.level.id, mission: this.mission, notes: this.notes, hasKey: this.hasKey,
      timeLeft: this.timeLeft, missionClock: this.missionClock, keyTime: this.keyTime,
      caught: this.instrumentos.list.map(function (c) { return c.state === 'caught'; }),
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
    this.instrumentos.wakeAll();
    this.instrumentos.list.forEach(function (c, i) { if (m.caught[i]) c.state = 'caught'; });
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
    this.player.stopDance();
    this.mission = 'idle';
    this.notes = 0;
    this.hasKey = false;
    this.missionClock = 0;
    this.timeLeft = this.level.time;
    this.instrumentos.resetAll();
    const t = this.totem();
    if (t) t.state = 'dormido';
    this.level.items.forEach(function (i) {
      if (i.type === 'key') {
        i.taken = false;
        i.hidden = true;
      }
    });
    this.roomState(this.level.id).caught = [];
    this.mergeTimer = 0;
    if (t && this.isStory() && this.level.kind === 'principal') {
      this.startMission(t, true);
      Music.resetStems();
      Music.startSearch(this.level.id);
    } else {
      Music.stopStems();
      Music.play('main');
    }
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
    this.sayMission(TEXT.timeout);
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

  // Desde cualquier tótem se viaja a cualquier sala principal ya descubierta (visitada),
  // aunque por el camino todavía no se pueda volver (falta un poder, una nota o una llave).
  // Van en el orden del mapa (de la primera a la última).
  travelList() {
    const here = this.level.id;
    const seen = this.progress.visited;
    return LEVELS.filter(function (l) { return l.kind === 'principal' && l.id !== here && seen[l.id]; })
      .map(function (l) { return l.id; })
      .sort(function (a, b) { return roomNumber(a) - roomNumber(b); });
  }

  // startTotem: el tótem dormido de esta sala (la primera fila es su misión)
  openTravel(startTotem) {
    const list = this.travelList();
    if (startTotem) list.unshift(TRAVEL_MISSION);
    if (!list.length) {
      this.say(TEXT.noTravel, 3);
      return;
    }
    this.overlay = { kind: 'travel', list: list, index: 0, totem: startTotem };
    Sfx.play('select');
  }

  // Lo que hay que saber de una sala en la lista de viaje
  travelInfo(id) {
    const P = this.progress;
    const rs = P.rooms[id] || {};
    const door = Object.keys(WORLD.KEY_DOORS).find(function (k) { return WORLD.KEY_DOORS[k][1] === id; });
    return {
      tuned: !!rs.afinada,
      visited: !!P.visited[id],
      key: door && !P.keys[door] ? WORLD.keyInfo(door) : null   // por el camino, falta esta llave
    };
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
    this.progress.checkpoint = this.progress.posta;
    this.player.setSpawn(spot.x, spot.y);
    this.player.restPose = 1.2;
    Sfx.play('save');
    this.say(this.saveGame(spot) ? TEXT.rested : TEXT.cantSave, 3);
  }

  openShop(vendor) {
    const tipo = vendor.props.tipo || 'viajero';
    const M = CATALOGO.MERCADERES.find(function (m) { return m.id === tipo; }) || CATALOGO.MERCADERES[0];
    const goods = M.vende.map(function (id) { return CATALOGO.TIENDA.find(function (t) { return t.id === id; }); })
      .filter(function (g) { return !!g; });
    goods.forEach(function (g) { g.precioActual = this.priceOf(g); }, this);
    this.overlay = { kind: 'shop', vendor: vendor, merchant: M, goods: goods, index: 0, note: '' };
    Sfx.play('select');
  }

  buy(good) {
    const P = this.progress;
    const O = this.overlay;
    const price = this.priceOf(good);
    if (P.coins < price) {
      O.note = 'Te faltan ' + (price - P.coins) + ' monedas.';
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
      O.note = 'Ahora ves toda ' + WORLD.regionInfo(region).nombre + ' en el mapa (pausa).';
    } else if (good.id === 'vida') {
      if (this.hearts >= P.maxHearts) {
        O.note = 'Tus corazones ya están llenos.';
        return;
      }
      this.hearts++;
      O.note = '+1 corazón.';
    } else if (good.id === 'corazon') {
      if (P.maxHearts >= CONFIG.GAME.MAX_HEARTS) {
        O.note = 'Ya tienes todos los corazones.';
        return;
      }
      P.maxHearts += 1;
      this.hearts = P.maxHearts;
      O.note = '¡Corazón extra! Ahora tienes ' + P.maxHearts + ' corazones.';
    } else if (good.id === 'comida') {
      this.hearts = P.maxHearts;
      O.note = '¡Qué rico! Corazones llenos.';
    } else if (good.id === 'aji') {
      P.chili++;
      O.note = 'Ají para llevar: úsalo con Q o L1 (tienes ' + P.chili + ').';
    } else if (good.id === 'pieza') {
      // Poliedro sonoro de la zona (solo el Coleccionista)
      const pol = CATALOGO.POLIEDROS.find(function (x) { return x.region === region; });
      if (!pol || P.poliedros[pol.id]) {
        O.note = pol ? 'Ya tienes el ' + pol.nombre + '.' : 'No hay poliedro en esta zona.';
        return;
      }
      P.poliedros[pol.id] = true;
      O.note = '¡' + pol.nombre + '! ' + pol.que;
    } else if (good.id === 'pista') {
      const hint = this.findNoteHint(region);
      if (!hint) {
        O.note = 'Ya encontraste todas las notas de esta zona.';
        return;
      }
      P.hints.push(hint);
      O.note = 'La nota ' + hint.nota + ' está en ' + WORLD.fullName(hint.room) + '.';
    }
    P.coins -= price;
    if (good.id === 'aji') P.chiliBought = (P.chiliBought || 0) + 1;
    good.precioActual = this.priceOf(good);
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
      if (id === TRAVEL_MISSION) this.startMission(O.totem);
      else this.travelTo(id);
    }
  }

  // Vencer a un jefe: aura, el poder (y cómo se usa), la llave de color y qué se abrió
  winBossFight() {
    const L = this.level;
    // El Silencio pelea tres veces: al caer una forma, aparece la siguiente
    if (L.boss && L.boss.type === 'silencio' && this.mode === 'story' && (this.silencioForm || 1) < 3) {
      this.silencioForm = (this.silencioForm || 1) + 1;
      ArenaBoss.tuning = this.bossTuning();
      this.boss = new Silencio(L.bossSpawn.tx, L.bossSpawn.ty, this.silencioForm);
      Sfx.play('bossWon');
      this.startBoss();
      return;
    }
    this.arenaPhase = 'done';
    this.roomState(L.id).boss = true;
    L.arenaActive = false;
    Music.setRate(L.rate);
    Music.play(L.music);
    Sfx.play('bossWon');
    if (this.mode === 'tower') {
      this.towerNext = TOWER.NEXT_DELAY;
      this.say(TEXT.towerFloorDone(this.towerFloor + 1), TOWER.NEXT_DELAY);
      return;
    }
    // El Silencio vencido: vuelve la música y empieza la fiesta final
    if (L.boss && L.boss.type === 'silencio') {
      this.startFiesta();
      return;
    }
    const jefe = WORLD.boss(L.boss ? L.boss.type : '');
    const gives = (L.boss && L.boss.gives) || (jefe && WORLD.power(jefe.da) ? jefe.da : null);
    const steps = [];
    if (gives && WORLD.power(gives)) steps.push({ kind: 'aura' }, { kind: 'power', power: gives });
    // Poderes de más que da el jefe (el Cuy da también el diapasón)
    ((jefe && jefe.tambien) || []).forEach(function (id) {
      if (WORLD.power(id)) steps.push({ kind: 'power', power: id });
    });
    // La nota del diapasón que enseña este jefe (si todavía no se sabía)
    const note = CONFIG.TUNER.BOSS_NOTES[L.boss ? L.boss.type : ''];
    if (note && !this.progress.tunerNotes[note]) steps.push({ kind: 'note', note: note });
    // (las llaves de color ya no existen: la zona siguiente se abre con la nota del jefe)
    if (jefe && jefe.da === 'monedas') steps.push({ kind: 'coins', coins: 100 });
    if (jefe && jefe.da === 'corazon' && this.progress.maxHearts < CONFIG.GAME.MAX_HEARTS) steps.push({ kind: 'heart' });
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
    } else if (s.kind === 'note') {
      P.tunerNotes[s.note] = true;
      Sfx.tune(CONFIG.TUNER.NOTES[s.note].freq);
    } else if (s.kind === 'key') {
      P.keys[s.key] = true;
      Sfx.play('key');
    } else if (s.kind === 'coins') {
      P.coins += s.coins;
      Sfx.play('cube');
    } else if (s.kind === 'poliedro') {
      P.poliedros[s.poliedro.id] = true;
      Sfx.play('ability');
    } else if (s.kind === 'heart') {
      P.maxHearts = Math.min(CONFIG.GAME.MAX_HEARTS, P.maxHearts + 1);
      this.hearts = P.maxHearts;
      s.max = P.maxHearts;
      Sfx.play('lifeUp');
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

  // Volumen de un instrumento (de 0 a CONFIG.VOLUME.STEPS; al principio, el máximo)
  changeStemVolume(stemName, step) {
    const max = CONFIG.VOLUME.STEPS;
    const vols = this.settings.stemVolumes || (this.settings.stemVolumes = {});
    const current = vols[stemName] === undefined ? max : vols[stemName];
    vols[stemName] = Math.max(0, Math.min(max, current + step));
    this.applyVolume();
    Save.writeSettings(this.settings);
    Sfx.play('move');
  }

  toggleRumble() {
    this.settings.rumble = !this.settings.rumble;
    this.applyVolume();
    Save.writeSettings(this.settings);
    Sfx.play('move');
    if (this.settings.rumble) Input.rumble(150, 0.5, 0.4);
  }

  // Luces: completas (brillos y partículas), simples (solo la oscuridad) o apagadas
  changeLight(step) {
    this.settings.light = ((this.settings.light === undefined ? 2 : this.settings.light) + step + 3) % 3;
    this.applyVolume();
    Save.writeSettings(this.settings);
    Sfx.play('move');
  }

  applyVolume() {
    if (typeof Light !== 'undefined') Light.setQuality(this.settings.light === undefined ? CONFIG.LIGHT.QUALITY : this.settings.light);
    const max = CONFIG.VOLUME.STEPS;
    const master = this.settings.master / max;
    Music.setVolume(this.settings.music / max * master);
    Sfx.setVolume(this.settings.sfx / max * master);
    Input.setRumble(this.settings.rumble);
    // Aplicar volúmenes del ecualizador
const stemVolumes = this.settings.stemVolumes || {};
const stems = Object.keys(CONFIG.MUSIC.STEMS || {});
stems.forEach(stem => {
  const val = stemVolumes[stem] !== undefined ? stemVolumes[stem] : CONFIG.VOLUME.STEPS;
  Music.setStemBaseVolume(stem, val / CONFIG.VOLUME.STEPS);
});
  }

  // ---------- Daño y corazones ----------

  isHurtByWorld() {
    const p = this.player;
    if (p.y > this.level.pxH + 32) return true;
    if (p.invincible() || p.dancing) return false;
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
    this.feelHurt();
  }

  heal(n) {
    this.hearts = Math.min(this.progress.maxHearts, this.hearts + n);
    this.lifePopup('+' + n, CONFIG.FX.LIFE_UP);
    Sfx.play('lifeUp');
  }

  hurtByEnemy(source) {
    if (this.hurtTimer > 0 || this.player.invincible() || this.player.dancing) return;
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
    this.feelHurt();
  }

  lifePopup(text, color) {
    const p = this.player;
    Effects.popup(text, p.x + p.w / 2, p.headY() - 8, color);
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
      } else if (ev === 'crack') {
        this.floorBroken();
      } else if (ev === 'stompLand') {
        this.stompLand();
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

  // Caracol del eco: quieta y con Acción apretada un momento, la papa sopla. Las
  // plataformas ocultas que alcanza la onda aparecen para siempre y la niebla se despeja
  updateShell(dt) {
    const S = CONFIG.SHELL;
    const p = this.player;
    this.shellWaves = (this.shellWaves || []).filter(function (w) { w.t += dt; return w.t < S.WAVE_TIME; });
    this.shellCool = Math.max(0, (this.shellCool || 0) - dt);
    const still = p.onGround && !Input.held('left') && !Input.held('right');
    if (!p.has('shell') || this.prompt || !still || !Input.held('action') || this.shellCool > 0) {
      this.shellHold = 0;
      return;
    }
    this.shellHold = (this.shellHold || 0) + dt;
    if (this.shellHold < S.HOLD) return;
    this.shellHold = 0;
    this.shellCool = S.COOLDOWN;
    const T = CONFIG.TILE;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const shown = this.level.blowShell(cx, cy, S.RADIUS);
    this.shellWaves.push({ x: cx, y: cy, t: 0 });
    Sfx.tune(196);
    // La onda hipnotiza: los enemigos cercanos quedan quietos S.FREEZE segundos
    const reach = S.RADIUS * T;
    this.enemies.list.forEach(function (e) {
      if (e.state === 'dead' || e.npc) return;
      if (Math.hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy) > reach) return;
      e.frozen = S.FREEZE;
      Effects.play('poof', e.x + e.w / 2, e.y);
    });
    if (!shown.length) return;
    shown.forEach(function (c, i) {
      if (i % 2 === 0) Effects.play('poof', c[0] * T + T / 2, c[1] * T + T / 2);
    });
    const rs = this.roomState(this.level.id);
    rs.shown = (rs.shown || []).concat(shown);
    Sfx.play('tuneOpen');
    Input.rumble(160, 0.3, 0.5);
    this.showTip('shellOpen');
  }

  // Ondas del caracol (anillos color arena que se abren) y la carga mientras se mantiene
  drawShell(ctx) {
    const S = CONFIG.SHELL;
    const T = CONFIG.TILE;
    this.shellWaves.forEach(function (w) {
      const k = w.t / S.WAVE_TIME;
      for (let r = 0; r < 3; r++) {
        const kk = k - r * 0.12;
        if (kk <= 0) continue;
        ctx.globalAlpha = (1 - kk) * 0.8;
        ctx.strokeStyle = r === 0 ? '#fff6e0' : CONFIG.SKINS.shell;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w.x, w.y, S.RADIUS * T * kk, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
    if (this.shellHold > 0.08) {
      const p = this.player;
      ctx.strokeStyle = CONFIG.SKINS.shell;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.headY() - 6, 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, this.shellHold / S.HOLD));
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }

  // Sonó el diapasón: los muros de esa nota que alcanzó la onda se deshacen
  onTone(t) {
    const T = CONFIG.TILE;
    Sfx.tune(CONFIG.TUNER.NOTES[t.note].freq);
    if (t.opened.length) {
      t.opened.forEach(function (c, i) {
        if (i % 2 === 0) Effects.play('poof', c[0] * T + T / 2, c[1] * T + T / 2);
      });
      this.roomState(this.level.id).broken = this.level.brokenCells.slice();
      Sfx.play('tuneOpen');
      Input.rumble(160, 0.4, 0.6);
      this.showTip('tuneOpen');
    } else if (t.wrong) {
      Sfx.play('tuneWrong');
      this.hint(TEXT.tuneWrong(t.wrongNote, !!this.knownNotes()[t.wrongNote]));
    }
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

  // Géiseres: el chorro lanza a la papa hacia arriba; suenan al saltar si se ven
  updateGeysers() {
    const L = this.level;
    if (!L.geysers.length) return;
    const p = this.player;
    const cam = this.camera;
    L.geysers.forEach(function (g) {
      const st = L.geyserState(g);
      if (st === 'on' && g.last !== 'on') {
        const J = L.geyserJet(g);
        if (J.x > cam.x - 40 && J.x < cam.x + CONFIG.WIDTH + 40 && J.y < cam.y + CONFIG.HEIGHT + 40 && J.y + J.h > cam.y - 40) Sfx.play('geyser');
      }
      g.last = st;
      if (st !== 'on' || !overlaps(L.geyserJet(g), p)) return;
      p.vy = -CONFIG.GEYSER.LIFT;
      p.onGround = false;
      p.coyote = 0;
      p.refillAir();
    });
  }

  // El zapateo rompió un suelo agrietado (queda roto, como los muros del dash)
  floorBroken() {
    const T = CONFIG.TILE;
    this.player.brokeNow.forEach(function (c, i) {
      if (i % 2 === 0) Effects.play('polvo', c[0] * T + T / 2, c[1] * T + T / 2);
    });
    this.roomState(this.level.id).broken = this.level.brokenCells.slice();
    Sfx.play('walls');
    this.showTip('crack');
  }

  // El zapateo cae: onda en el suelo y aturde a los enemigos de suelo cerca
  stompLand() {
    const p = this.player;
    const S = CONFIG.PLAYER.STOMP;
    const T = CONFIG.TILE;
    const cx = p.x + p.w / 2;
    const fy = p.y + p.h;
    BossShow.ring(cx, fy, S.RADIUS * T, '#ffd34d', 0.4);
    Effects.play('polvo', cx - 10, fy - 6);
    Effects.play('polvo', cx + 10, fy - 6, true);
    Input.rumble(180, 0.9, 0.6);
    this.enemies.alive().forEach(function (e) {
      if (e.def && e.def.flies) return;
      const dx = Math.abs(e.x + e.w / 2 - cx);
      const dy = Math.abs(e.y + e.h - fy);
      if (dx < S.RADIUS * T && dy < T) {
        e.stomp();
        Effects.play('chispa', e.x + e.w / 2, e.y);
      }
    });
  }

  isStomping(target) {
    const p = this.player;
    return p.vy > 0 && p.prevBottom <= target.y + 6;
  }

  checkEnemies() {
    const p = this.player;
    this.enemies.alive().forEach(function (e) {
      if (e.def.npc) return;   // los vecinos (barrendero) no dañan ni se pisan
      // La lengua de la rana y el pico de la garza dañan aunque no se toque el cuerpo
      const reach = e.reach();
      if (reach && overlaps(reach, p) && !p.invincible() && !overlaps(e, p)) return this.hurtByEnemy(e);
      if (!overlaps(e, p)) return;
      if (p.invincible()) {
        e.stomp();
        Effects.play('chispa', e.x + e.w / 2, e.y);
        Sfx.play('stomp');
      } else if (e.def.bouncy && this.isStomping(e) && !p.stomping) {
        // Bola de nieve: pisarla solo hace rebotar (la rompen el dash y el zapateo)
        p.stomp();
        Sfx.play('stomp');
      } else if (e.def.hot) {
        // La brasa quema: no se pisa
        this.hurtByEnemy(e);
      } else if (e.def.armored && (this.isStomping(e) || e.state === 'act') && !p.stomping) {
        // Armadillo: pisarlo lo enrolla y la papa rebota; enrollado no daña
        if (this.isStomping(e)) {
          e.curl();
          p.stomp();
          Sfx.play('stomp');
        }
      } else if (this.isStomping(e)) {
        e.stomp();
        p.stomp();
        Effects.play('chispa', p.x + p.w / 2, e.y);
        Sfx.play('stomp');
      } else if (e.def.dashBreaks && p.dashTime > 0) {
        // La rueda de piedra se rompe con el dash
        e.stomp();
        Effects.play('polvo', e.x + e.w / 2, e.y + e.h / 2);
        Sfx.play('walls');
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
    // El jefe sube (salto, se cuelga del techo): si la papa está encima, se resbala de
    // lado en vez de subir con él (antes se la llevaba fuera del escenario)
    if (b.vy < -60 && overlaps(b, p) && p.y + p.h <= b.y + CONFIG.BOSSES.HEAD_ZONE + 4) {
      this.slideOffBoss(b, p);
      return;
    }
    if (b.isStompedBy(p)) {
      if (b.canBeHit() && this.hurtTimer <= 0) {
        p.stomp();
        b.hit();
        BossShow.onHit(b);
        if (b.hp <= 0) BossShow.onDefeat(b);
        Effects.play('chispa', p.x + p.w / 2, b.y);
        Sfx.play('bossHit');
      } else {
        // No se le puede pisar ahora: se sacude y tira a la papa (no se queda quieto)
        b.shakeOff(p, this.level);
        Sfx.play('stomp');
      }
    } else if (b.isHarmful() && overlaps(b.harmBox(), p)) {
      this.hurtByEnemy(b);
    }
    if (b.waveHits(p)) this.hurtByEnemy(null);
  }

  // Deja a la papa al costado del jefe (el lado libre más cercano), cayendo
  slideOffBoss(b, p) {
    const L = this.level;
    const left = b.x - p.w - 1, right = b.x + b.w + 1;
    const first = p.x + p.w / 2 < b.centerX() ? [left, right] : [right, left];
    const x = first.find(function (nx) { return !L.rectHitsSolid(nx, p.y, p.w, p.h); });
    if (x !== undefined) p.x = x;
    p.vy = Math.max(p.vy, 0);
    p.vx = (p.x < b.x ? -1 : 1) * 120;
    p.wallJumpLock = 0.2;
  }

  updateArena() {
    if (!this.boss) return;
    const L = this.level;
    if (this.arenaPhase === 'idle' && L.insideArena(this.player)) {
      L.arenaActive = true;
      Sfx.play('walls');
      const BM = (CONFIG.MUSIC.BOSS_MUSIC || {})[L.id];
      Music.play(BM ? BM.track : CONFIG.MUSIC.BOSS_TRACK);
      Music.setRate(BM && BM.rate ? BM.rate : 1);
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

  // Pelea con el jefe: en los bordes de la arena brillan dos barreras
  // (la oscuridad y la luz sobre la papa las pone js/light.js)
  drawArenaLight(ctx) {
    const L = this.level;
    const target = L.arenaActive ? 1 : 0;
    this.arenaLight = (this.arenaLight || 0) + (target - (this.arenaLight || 0)) * 0.05;
    if (this.arenaLight < 0.02 || !L.arena) return;
    const k = this.arenaLight;
    const cam = this.camera;
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
    // En la historia, cada jefe se presenta con su portada (el coliseo ya tiene la suya)
    if (this.isStory()) BossShow.startIntro(this.boss, this.level.boss ? this.level.boss.type : 'bombo');
    else {
      BossShow.startBar(this.boss);
      this.say(TEXT.bossArena(this.boss.def.NAME), 2);
    }
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
        // La llave del jefe abre su portón al tiro (no hay que volver al tótem)
        if (this.level.boss && this.totem()) {
          this.afinarSala(this.totem());
          this.level.gateAnim = CONFIG.CAMERA_PAN.GATE_TIME;
          const g = this.gateCell();
          if (g) this.panCamera(g.x, g.y);
        }
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
      } else if (t === 'posta' && !item.active) {
        this.rest(item);   // al pasar por una posta se guarda sola (no hace falta apretar)
      } else if (t === 'chili' && p.chiliTime <= 0) {
        item.taken = true;
        // El ají vuelve a crecer recién después de CONFIG.CHILI.REGROW_SESSIONS partidas
        const rc = this.roomState(this.level.id);
        rc.chili = rc.chili || {};
        rc.chili[item.key] = this.progress.sessions || 0;
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
    const spot = { x: item.x + (T - this.player.w) / 2, y: item.y + T - this.player.h };
    this.player.setSpawn(spot.x, spot.y);
    // Cada banderita es un punto de guardado: "Continuar" vuelve a la última que tocaste
    this.progress.checkpoint = { room: this.level.id, x: spot.x, y: spot.y };
    this.saveGame(spot);
    Sfx.play('save');
    Effects.popup(tr('¡Guardado!'), spot.x + this.player.w / 2, spot.y - 8, '#7be0a0');
    this.showTip('save');
  }

  // ---------- Puertas de color, sellos y portón ----------

  checkColorDoors() {
    const p = this.player;
    const d = this.level.closedDoorNear({ x: p.x, y: p.y, w: p.w, h: p.h });
    if (!d) return;
    const k = WORLD.keyInfo(d.color);
    if (!k) return;
    // La puerta dorada pide también todas las salas afinadas
    if (d.color === 'dorada' && this.tunedCount() < CONFIG.ENDGAME.ROOMS) {
      this.hint(TEXT.goldNeeds(this.tunedCount(), CONFIG.ENDGAME.ROOMS));
      return;
    }
    if (d.color === 'dorada' || this.progress.keys[d.color]) {
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

  // Portón cerrado: al chocarlo parpadean los instrumentos que faltan y, la primera
  // vez, aparece a su lado el guardián del portón (un vecino que explica qué hacer)
  checkGate() {
    if (!this.level.hasGate || this.level.gateOpen) return;
    const p = this.player;
    if (!this.level.rectHasTile(p.x - 2, p.y, p.w + 4, p.h, 'G')) return;
    this.hint(TEXT.gateClosed);
    this.slotBlink = 1.5;
    if (this.mode === 'story' && this.vecinos.addGuard(this.level, p)) {
      this.sayMission(CONFIG.GATE_GUARD.HELLO);
    }
  }

  // ---------- Música por cercanía ----------

  soundSources() {
    const notes = this.mission === 'collect' ? this.instrumentos.remaining() : [];
    const bosses = [];
    const J = this.level.bossSpawn;
    if (this.boss && J && (this.arenaPhase === 'idle' || this.arenaPhase === 'guards')) {
      const T = CONFIG.TILE;
      bosses.push({ x: J.tx * T, y: J.ty * T, w: T, h: T });
    }
    return { notes: notes, bosses: bosses };
  }

  // Sin misión no suena (en las principales); buscando corcheas suena según la más
  // cercana; con las corcheas juntas, según la llave; con la llave, se apaga
updateEchoes(dt) {
  // CAMBIA ESTO:
  // if (this.scene && this.scene.music) return;
  // POR ESTO:
  if (this.scene && this.scene.music && this.mission !== 'collect') return;

  // ... el resto sigue igual
    const src = this.soundSources();
    const E = CONFIG.ECHO;
    let goal = this.baseMusic();
    if (this.level.arenaActive) {
      goal = 1;
    } else if (this.mission === 'escape' && this.hasKey) {
      goal = 0;   // con la llave en la mano la música se apaga: solo queda el pulso y el reloj
    } else if (this.mission === 'escape') {
      const key = this.level.items.filter(function (i) { return i.type === 'key' && !i.taken && !i.hidden; });
      goal = Echoes.nearLevel(this.player, key, E.KEY_TIERS, E.KEY_BASE);
    } else if (this.mission === 'collect') {
      goal = Math.max(CONFIG.ECHO.IDLE_MUSIC, Echoes.nearLevel(this.player, src.notes));
      if (this.musicBoost > 0) {
        this.musicBoost -= dt;
        goal = 1;
      }
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
    if (this.screenShake > 0) {
      const s = Math.min(4, this.screenShake * 6);
      return { x: Math.round((Math.random() * 2 - 1) * s), y: Math.round((Math.random() * 2 - 1) * s) };
    }
    const roar = this.boss ? this.boss.shake() : 0;
    if (roar > 0) {
      return { x: Math.round((Math.random() * 2 - 1) * roar), y: Math.round((Math.random() * 2 - 1) * roar) };
    }
    // Aterrizaje desde lo alto: tiembla según la altura de la caída
    const land = this.player ? this.player.shakeAmount() : 0;
    if (land > 0.5) {
      return { x: Math.round((Math.random() * 2 - 1) * land), y: Math.round(Math.random() * land) };
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
    if (Input.keyPressed('KeyN')) {
      Object.keys(CONFIG.TUNER.NOTES).forEach(function (n) { this.progress.tunerNotes[n] = true; }, this);
      this.abilities.tuner = true;
      this.say('Prueba: todas las notas del diapasón.', 2);
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

  // La cámara viaja rápido a un punto (la llave, el portón), se queda un momento y vuelve
  panCamera(x, y) {
    this.camPan = { x: x, y: y, t: 0 };
  }

  // Centro del portón (G) de la sala, si tiene
  gateCell() {
    const T = CONFIG.TILE;
    const L = this.level;
    for (let ty = L.rowCount - 1; ty >= 0; ty--) {
      const tx = L.rows[ty].indexOf('G');
      if (tx >= 0) return { x: tx * T + T / 2, y: ty * T };
    }
    return null;
  }

  updateCamera(lerp) {
    const p = this.player;
    const A = this.level.arena;
    let targetX = p.x + p.w / 2 - CONFIG.WIDTH / 2;
    let targetY = p.y + p.h / 2 - CONFIG.HEIGHT / 2;
    const P = this.camPan;
    if (P) {
      const C = CONFIG.CAMERA_PAN;
      P.t += CONFIG.STEP;
      p.frozen = P.t < C.GO + C.HOLD;
      if (P.t < C.GO + C.HOLD) {
        targetX = P.x - CONFIG.WIDTH / 2;
        targetY = P.y - CONFIG.HEIGHT / 2;
      }
      if (P.t > C.GO + C.HOLD + C.BACK) {
        this.camPan = null;
        p.frozen = false;
      }
      lerp = Math.max(lerp, C.LERP);
    }
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
      this.instrumentos.remaining().forEach(function (c) {
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
      UI.drawSplash(ctx, this.time, this.screenReady(), !this.settings.lang);
      return;
    }
    if (this.state === 'fiesta') {
      UI.drawFiesta(ctx, this.time, this.endTimer);
      return;
    }
    if (this.state === 'lang') {
      UI.drawLang(ctx, this.time, this.langIndex);
      return;
    }
    if (this.state === 'title') {
      UI.drawTitle(ctx, this.time, this.titleItems(), this.titleIndex, this.plus, this.towerUnlocked());
      if (this.showCredits) UI.drawCredits(ctx, this.time);
      return;
    }
    if (this.state === 'speedmenu') {
      SpeedRun.drawMenu(ctx, this);
      return;
    }
    if (this.state === 'ready') {
      UI.drawReady(ctx, this.time, this.hearts, this.rules().NAME, this.screenReady(), this.mode === 'tower');
      return;
    }

    ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    Backdrop.scroll(this.camera.x, this.camera.y);
    const scene = this.scene;
    if (scene && scene.drawSky) scene.drawSky(ctx, this);
    const shake = this.shakeOffset();
    ctx.save();
    ctx.translate(-Math.round(this.camera.x) + shake.x, -Math.round(this.camera.y) + shake.y);
    this.level.draw(ctx, this.camera);
    if (scene && scene.drawMid) scene.drawMid(ctx, this);
    if (this.showAreas) {
      const src = this.soundSources();
      Echoes.drawAreas(ctx, src.notes.concat(src.bosses));
    }
    UI.drawExitSigns(ctx, this);
    this.drawItems(ctx);
    this.instrumentos.draw(ctx);
    this.drops.draw(ctx, this.time);
    this.enemies.draw(ctx);
    this.vecinos.draw(ctx, this);
    if (this.boss) {
      this.boss.draw(ctx);
      this.boss.drawWarn(ctx);
    }
    BossShow.drawWorld(ctx);

    const target = this.smokeTarget();
    if (target) {
      UI.drawSmoke(ctx,
        { x: this.player.x + this.player.w / 2, y: this.player.y + this.player.h / 2 },
        { x: target.x + target.w / 2, y: target.y + target.h / 2 },
        this.time, target.note ? CONFIG.COLORS.NOTE_SMOKE : CONFIG.COLORS.SMOKE);
    }
    this.drawPlayer(ctx);
    this.tuner.draw(ctx, this.player);
    if (this.shellWaves) this.drawShell(ctx);
    this.level.drawFront(ctx, this.camera);
    Effects.draw(ctx);
    if (scene && scene.drawFront) scene.drawFront(ctx, this);
    this.drawArenaLight(ctx);
    ctx.restore();
    if (this.mission === 'merging') UI.drawMergeAnimation(ctx, this);
    if (this.mission === 'escape') UI.drawFilter(ctx, this.time);
    // Luz: oscuridad, brillos y partículas del aire (en pantalla)
    Light.drawAmbientBack(ctx);
    Light.draw(ctx, this);
    if (this.prompt && !this.overlay && !this.menu.open) {
      ctx.save();
      ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));
      UI.drawPrompt(ctx, this.prompt, this.time);
      ctx.restore();
    }
    if (this.hurtFlash > 0) {           // destello rojo al recibir un golpe
      ctx.fillStyle = 'rgba(255, 60, 90, ' + (this.hurtFlash * 1.2).toFixed(2) + ')';
      ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }
    if (!(scene && scene.hudHidden)) UI.drawHud(ctx, this);
    BossShow.drawBar(ctx, this.boss);
    if (this.mode === 'speedrun' || this.mode === 'tower') SpeedRun.drawHud(ctx, this);
    if (this.banner && !this.menu.open) UI.drawBanner(ctx, this.banner);
    if (!this.menu.open && !(scene && scene.hudHidden)) this.drawTopTexts(ctx);
    if (this.overlay) UI.drawOverlay(ctx, this);
    BossShow.drawIntro(ctx, this);
    if (scene && scene.drawScreen) scene.drawScreen(ctx, this);
    if (this.menu.open) this.menu.draw(ctx);
    this.drawEndScreen(ctx);
    if (this.modal) UI.drawModal(ctx, this.modal.text, this.modal.t);
    BossShow.drawPost(ctx);
    if (this.fade) {
      const F = this.fade;
      const k = Math.min(1, F.t / (CONFIG.GAME.FADE_TIME * (F.white && F.phase === 'in' ? 3 : 1)));
      const a = F.phase === 'out' ? k : 1 - k;
      if (F.white) {
        ctx.fillStyle = 'rgba(255, 250, 240, ' + (F.phase === 'out' ? 1 : a) + ')';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      } else {
        UI.drawFade(ctx, a);
      }
    }
  }

  // Reflejo de la papa en el agua de abajo (se borra al alejarse; tiembla un poco)
  drawReflection(ctx) {
    const p = this.player;
    const T = CONFIG.TILE;
    const R = CONFIG.WATER.REFLECT;
    if (p.inWater) return;
    const feet = p.y + p.h;
    const surface = this.level.waterBelow(p.x + p.w / 2, feet, R.ROWS);
    if (surface === null) return;
    const fade = 1 - (surface - feet) / (R.ROWS * T);
    if (fade <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x - 24, surface + 3, p.w + 48, p.h + 24);
    ctx.clip();
    ctx.globalAlpha = R.ALPHA * fade;
    ctx.translate(Math.sin(this.time * 6) * 0.8, 2 * surface + 6);
    ctx.scale(1, -1);
    p.draw(ctx);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawPlayer(ctx) {
    const p = this.player;
    const phase = this.level.beatPhase();
    if (this.hurtTimer > 0 && Math.floor(this.time * 12) % 2 === 1) return;
    if (this.overlay && this.overlay.kind === 'reward' && this.overlay.steps[this.overlay.i].kind === 'aura') {
      UI.drawAura(ctx, p, this.overlay.t);
    }
    if (p.chiliTime > 0) Effects.drawChiliGlow(ctx, p, phase);
    this.drawReflection(ctx);
    p.draw(ctx);
    if (p.chiliTime > 0) Effects.drawChiliDot(ctx, p, phase);
    if (p.invincible()) {
      Sprites.drawAnchored(ctx, 'brillo_aji', Sprites.frameAt('brillo_aji', this.time), p.x + p.w / 2, p.y + p.h + 4, false);
    }
  }

  drawTopTexts(ctx) {
    let y = this.boss && this.boss.isActive() ? 46 : 17;
    if (this.debug) y = UI.drawDebug(ctx, this.player, y, this.level.id);
    const ending = this.menu.open || this.overlay || this.state === 'won' || this.state === 'gameover';
    if (this.message && !ending) y = UI.drawMessageBox(ctx, this.message.text, y, this.message.hint);
    if (this.tip && !ending) y = UI.drawTip(ctx, this.tip.text, this.tip.time, y);
    if (Music.error()) UI.drawSmallNote(ctx, Music.error(), y);
    else if (Music.locked() && this.musicNear > 0.05 && Math.floor(this.time * 1.5) % 2 === 0) {
      UI.drawSmallNote(ctx, 'Toca para activar el sonido', y, '#ffd34d');
    }
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
    if (t && this.mission === 'idle' && this.isStory()) UI.drawMissionSign(ctx, t, this.time);
  }

  drawEndScreen(ctx) {
    const ready = this.endTimer > CONFIG.GAME.END_DELAY;
    if (this.state === 'won' && this.mode === 'tower') {
      UI.drawEnd(ctx, '¡Coliseo completado!',
        ['Venciste a los ' + TOWER.FLOORS.length + ' jefes.',
          (this.towerRecord ? '¡Récord! ' : 'Tiempo: ') + SpeedRun.clock(this.towerTime || 0)],
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
