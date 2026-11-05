// Una sala del juego: lee el mapa del editor (bloques, objetos, enemigos,
// pasos a otras salas, opciones de cada celda y decoración) y lo dibuja.
// Las letras de cada pieza están en js/catalogo.js.

// Letras del mapa que se convierten en objetos (los dibuja js/items.js)
const ITEM_TYPES = {
  c: 'cube', k: 'key', S: 'save', a: 'chili', o: 'hook', H: 'hookItem', F: 'final',
  R: 'backDoor', W: 'totem', '@': 'posta', '?': 'sign', q: 'scaleNote', j: 'instrument',
  y: 'poliedro', $: 'coin', '*': 'heart', f: 'fruit', K: 'colorKey', U: 'powerStone',
  Q: 'salitaDoor', m: 'vendor', Z: 'mapRoll'
};
// Enemigos con letra propia; los nuevos usan '%' y su tipo va en las opciones
const ENEMY_LETTERS = { e: 'beetle', u: 'cuy', d: 'shooter' };
// Bloques que ocupan la celda completa: suelo, ladrillo, tambor, cintas, muro rompible,
// barro (z) y muros del diapasón (una letra por nota: ver TUNE_WALLS)
const FULL_SOLID = '#BT<>Xz[]xisg567890()';
// Plataformas de paso: se atraviesan desde abajo y se bajan con abajo (_ y el puente colgante -)
const ONE_WAY = '_-=';   // todas las plataformas delgadas: se cruzan desde abajo y se bajan con abajo
// Letras que quedan en el mapa (terreno); las demás se vuelven vacío
const TERRAIN = '#B=_^~X12T<>GLAYwl:z[]x-isgV{}567890()hO';
// Agua: quieta (w) y corrientes que empujan a la izquierda ({) o a la derecha (})
const WATER = 'w{}';
// Lo que se pisa y lleva borde claro (ver drawRims): suelo, plataformas, muros que se abren
const RIM_TILES = '#B=_-ixzsTX[]567890()';
// Muros del diapasón: qué nota deshace cada uno
const TUNE_WALLS = {
  '[': 'la', ']': 'si', '5': 'do', '6': 're', '7': 'mi', '8': 'fa', '9': 'sol',
  '0': 'sib', '(': 'mib', ')': 'solb'       // notas blue (bemoles), para las salas secretas
};
// Hoja vieja de 8 cuadros (tiles_ciudad.png y las de la primera entrega)
const TILESET = { GROUND_TOP: 0, DIRT: 1, BRICK: 2, THIN: 3, EDGE_LEFT: 4, EDGE_RIGHT: 5, SPIKES: 6, CRUMBLE: 7 };
// Hoja nueva: tiles_<tema>_extra.png
const TILE_EXTRA = { FILL_A: 0, FILL_B: 1, FILL_C: 2, BRICK: 3, THIN: 4, PASS: 5, SPIKES: 6, CRUMBLE: 7 };

// Color del agua de cada tema (superficie, fondo y la raya de la superficie)
const WATER_TINT = {
  default: { top: 'rgba(111, 168, 199, 0.5)', deep: 'rgba(80, 130, 170, 0.62)', line: 'rgba(207, 232, 239, 0.85)' },
  orilla:  { top: 'rgba(140, 180, 170, 0.5)', deep: 'rgba(80, 120, 120, 0.62)', line: 'rgba(255, 236, 190, 0.85)' },
  lago:    { top: 'rgba(170, 214, 240, 0.45)', deep: 'rgba(90, 150, 200, 0.6)', line: 'rgba(255, 255, 255, 0.95)' },
  espejo:  { top: 'rgba(90, 160, 170, 0.5)', deep: 'rgba(40, 90, 110, 0.66)', line: 'rgba(170, 255, 230, 0.8)' }
};

// Colores de respaldo de cada tema (si faltan las hojas de bloques)
const THEME_COLORS = {
  cityday: { ground: '#c97b6a', top: '#f4a261', dark: '#8a4a4a', brick: '#a8679a', thin: '#e8c58e', wall: '#4a3350' },
  city:    { ground: '#b8b2a7', top: '#8fbf9a', dark: '#6b6385', brick: '#d98b6a', thin: '#e8c58e', wall: '#5b6378' },
  cave:    { ground: '#6d6a8a', top: '#9a93b0', dark: '#3a3850', brick: '#5b5478', thin: '#b8b2a7', wall: '#2f2c45' },
  sea:     { ground: '#e8c58e', top: '#bfe3c8', dark: '#a0784a', brick: '#6fa8c7', thin: '#fbf6ec', wall: '#3d5a78' },
  bamboo:  { ground: '#5e8c6a', top: '#bfe3c8', dark: '#2e4a3a', brick: '#8fbf9a', thin: '#f7e3a1', wall: '#253a30' },
  tech:    { ground: '#8a87a8', top: '#bfe3c8', dark: '#4a4766', brick: '#a08cc4', thin: '#cfe8ef', wall: '#33304a' },
  mine:    { ground: '#a8603f', top: '#e8c58e', dark: '#5c3a28', brick: '#d98b6a', thin: '#e8c58e', wall: '#3a2a26' },
  linde:   { ground: '#8a6a48', top: '#8fcf6a', dark: '#4e3a2a', brick: '#6a8a4a', thin: '#d9b77a', wall: '#2f3a2a' },
  bosque:  { ground: '#6a5038', top: '#5fa85a', dark: '#3a2a1e', brick: '#4a6a3a', thin: '#c9a35b', wall: '#1f2a1f' },
  nieve:   { ground: '#c4d4e4', top: '#ffffff', dark: '#7a8aa8', brick: '#a8b8d0', thin: '#e6eef6', wall: '#5a6a8a' },
  orilla:  { ground: '#9a7a52', top: '#b8c46b', dark: '#5a4630', brick: '#c9b46b', thin: '#e8d29a', wall: '#3e3626' },
  lago:    { ground: '#7a8a6a', top: '#9ad17a', dark: '#4a5a46', brick: '#c4e6ff', thin: '#e6f6ff', wall: '#3a4a5a' },
  espejo:  { ground: '#3e6a6a', top: '#7ad1b8', dark: '#1e3a40', brick: '#5a9a9a', thin: '#bff0e0', wall: '#14282e' },
  hielo:   { ground: '#6fa8c7', top: '#cfe8ef', dark: '#3a5a7a', brick: '#8ab8d8', thin: '#e6f6ff', wall: '#2a3a5a' },
  dorada:  { ground: '#c98a3a', top: '#ffd34d', dark: '#7a4a2a', brick: '#e8b45a', thin: '#ffe9a8', wall: '#6a3a2a' },
  niebla:  { ground: '#8a82a8', top: '#d8d0f0', dark: '#4a4468', brick: '#a89cc8', thin: '#ece6ff', wall: '#2e2a47' },
  templo:  { ground: '#8a5a32', top: '#e9c46a', dark: '#3a2418', brick: '#a8743a', thin: '#f7e3a1', wall: '#2a1816' },
  pantano: { ground: '#5e5a3a', top: '#8a9a4a', dark: '#2e2c1e', brick: '#6a6a4a', thin: '#a8a070', wall: '#1e2420' },
  tower:   { ground: '#d98b6a', top: '#e9c46a', dark: '#8a4a32', brick: '#e8c58e', thin: '#f3e3c3', wall: '#5b3a30' },
  salita_tienda: { ground: '#a0784a', top: '#e8c58e', dark: '#5c3a20', brick: '#c98a5c', thin: '#f3e3c3', wall: '#4a3020' },
  salita_bonus:  { ground: '#a08cc4', top: '#f4b6c2', dark: '#5b5478', brick: '#e07a8f', thin: '#f7e3a1', wall: '#3a3050' }
};

class Level {
  constructor(data) {
    const T = CONFIG.TILE;
    this.id = data.id;
    this.name = data.name;
    this.kind = data.kind || (data.tower ? 'jefe' : (data.secret ? 'secreto' : 'principal'));
    this.region = data.region || 0;
    this.theme = data.theme || 'none';
    // Oscuridad (0 a 1) y partículas del aire: las de la sala o las de su tema (CONFIG.LIGHT)
    this.dark = typeof data.dark === 'number' ? data.dark : (CONFIG.LIGHT.THEMES[this.theme] || 0);
    this.ambient = data.ambient || this.theme;
    this.time = data.time || 120;
    this.music = data.music || 'main';
    // Tono de la música en semitonos: cambia también la velocidad y el ritmo
    this.pitch = data.pitch || 0;
    this.rate = Math.pow(2, this.pitch / 12);
    this.bpm = (data.bpm || CONFIG.MUSIC.BPM) * this.rate;
    this.boss = data.boss || null;             // jefe de la sala: { type, gives }
    this.secret = this.kind !== 'principal';   // fuera de la red de tótems
    this.tower = !!data.tower;
    this.gateHint = data.gateHint || '';
    this.arenaFloor = data.arenaFloor || null;   // fila del piso de la arena (salas altas con muros L)
    this.arenaTop = data.arenaTop || null;       // primera fila de la arena (si hay salas encima, como en la 18)
    this.props = data.props || {};
    this.clock = 0;
    this.activeGroup = 1;
    this.switchPhase = 0;
    this.items = [];
    this.movers = [];
    this.crumbles = {};
    this.brokenCells = [];
    this.tuneShake = {};       // muros del diapasón que tiemblan (nota equivocada): 'x,y' -> segundos
    this.passOneWay = false;   // la papa está bajando por una plataforma de paso (las ignora)
    this.geysers = [];         // géiseres: { tx, ty, top, seed }
    this.spawn = { x: T, y: T };
    this.enemySpawns = [];
    this.corcheaSpawns = [];   // corcheas de la misión: { tx, ty }
    this.bossSpawn = null;
    this.arenaActive = false;
    this.gateOpen = false;
    this.seals = [];           // sellos de poder: { tx, ty, power }
    this.colorDoors = [];      // puertas de color: { tx, ty, color, top }
    this.rays = [];            // rayos: { tx, ty, len }
    this.powers = {};          // poderes de la papa (los pone el juego: abren los sellos)
    this.openDoors = {};       // puertas de color abiertas: { 'x,y': true }

    const raw = data.map;
    this.cols = Math.max.apply(null, raw.map(function (r) { return r.length; }));
    this.rowCount = raw.length;
    this.pxW = this.cols * T;
    this.pxH = this.rowCount * T;
    this.rows = raw.map(function (row, ty) {
      return this.parseRow(row.padEnd(this.cols, '.'), ty);
    }, this);

    this.exits = this.buildExits(data.exits || []);
    this.deco = this.buildDeco(data.deco || []);
    this.buildRays();
    this.groupColorDoors();
    (data.enemies || []).forEach(function (e) { this.enemySpawns.push(e); }, this);
    this.rhythmRuns = this.buildRhythmRuns();
    this.hookRails = this.buildHookRails();
    this.hasGate = raw.some(function (r) { return r.indexOf('G') >= 0; });
    this.buildGeysers();
    this.arena = this.findArena();
    this.setupLifts(data.lifts);
  }

  // Opciones de una celda (las pone el editor con la herramienta Opciones)
  propsAt(tx, ty) {
    return this.props[tx + ',' + ty] || {};
  }

  // ---------- Lectura del mapa ----------

  // Saca jugador, objetos, enemigos y plataformas móviles; en el mapa queda el terreno
  parseRow(row, ty) {
    const T = CONFIG.TILE;
    let clean = '';
    for (let tx = 0; tx < row.length; tx++) {
      const ch = row[tx];
      const props = this.propsAt(tx, ty);
      if (ch === 'P') {
        this.spawn = { x: tx * T + (T - CONFIG.PLAYER.W) / 2, y: (ty + 1) * T - CONFIG.PLAYER.H };
        clean += '.';
      } else if (ITEM_TYPES[ch]) {
        this.items.push({
          type: ITEM_TYPES[ch], x: tx * T, y: ty * T, w: T, h: T, tx: tx, ty: ty,
          key: tx + ',' + ty, props: props, seed: tx + ty, taken: false, active: false
        });
        clean += '.';
      } else if (ch === 'n') {
        this.corcheaSpawns.push({ tx: tx, ty: ty });
        clean += '.';
      } else if (ch === 'b') {
        this.addMoverCell(tx, ty, 'sink');
        clean += '.';
      } else if (ch === 'M' || ch === 'I') {
        this.addMoverCell(tx, ty, ch === 'I' ? 'y' : 'x');
        clean += '.';
      } else if (ENEMY_LETTERS[ch]) {
        this.enemySpawns.push({ type: ENEMY_LETTERS[ch], tx: tx, ty: ty });
        clean += '.';
      } else if (ch === '%') {
        this.enemySpawns.push({ type: props.tipo || 'beetle', tx: tx, ty: ty, props: props });
        clean += '.';
      } else if (ch === 'J') {
        this.bossSpawn = { tx: tx, ty: ty };
        clean += '.';
      } else if (ch === 'A') {
        this.seals.push({ tx: tx, ty: ty, power: props.poder || 'doubleJump' });
        clean += ch;
      } else if (ch === 'Y' && CONFIG.DOOR_TO_WALL[props.color || 'celeste'] !== undefined) {
        clean += CONFIG.DOOR_TO_WALL[props.color || 'celeste'];   // muro de nota (o paso abierto)
      } else if (ch === 'Y') {
        this.colorDoors.push({ tx: tx, ty: ty, color: props.color || 'celeste', top: true });
        clean += ch;
      } else if (TERRAIN.indexOf(ch) >= 0) {
        clean += ch;
      } else {
        clean += '.';
      }
    }
    return clean;
  }

  // Pasos a otras salas (celdas ':'): rectángulo, a qué sala lleva y de qué borde sale
  buildExits(list) {
    const T = CONFIG.TILE;
    return list.map(function (e) {
      const side = e.x === 0 ? 'left' : e.x + e.w === this.cols ? 'right'
        : e.y === 0 ? 'top' : e.y + e.h === this.rowCount ? 'bottom' : 'inside';
      return { x: e.x, y: e.y, w: e.w, h: e.h, goes: e.goes || '', tag: e.tag || '', side: side,
               rect: { x: e.x * T, y: e.y * T, w: e.w * T, h: e.h * T }, blocked: false };
    }, this);
  }

  // Paso que toca el rectángulo (o null)
  exitAt(r) {
    return this.exits.find(function (e) { return !e.blocked && overlaps(e.rect, r); }) || null;
  }

  // Un paso a una sala que todavía no existe queda cerrado (no se cae al vacío)
  blockExit(e) {
    e.blocked = true;
  }

  isBlockedExitCell(tx, ty) {
    return this.exits.some(function (e) {
      return e.blocked && tx >= e.x && tx < e.x + e.w && ty >= e.y && ty < e.y + e.h;
    });
  }

  // Decoración: una lista por capa (fondo y frente). Cada pieza se apoya abajo
  // a la izquierda de su celda
  buildDeco(rows) {
    const back = [];
    const front = [];
    const walls = [];
    const D = CATALOGO.DECO_POR_CH;
    rows.forEach(function (row, ty) {
      for (let tx = 0; tx < row.length; tx++) {
        const ch = row[tx];
        if (ch === '.' || ch === ' ' || !D[ch]) continue;
        const def = D[ch];
        const piece = { def: def, tx: tx, ty: ty, seed: (tx * 7 + ty * 13) % 97 };
        if (def.id === 'pared') walls.push(piece);
        else if (def.capa === 'frente') front.push(piece);
        else back.push(piece);
      }
    });
    const tubes = {};
    back.forEach(function (p) { if (p.def.id === 'tuberia') tubes[p.tx + ',' + p.ty] = true; });
    back.forEach(function (p) {
      if (p.def.id !== 'tuberia') return;
      const h = tubes[(p.tx - 1) + ',' + p.ty] || tubes[(p.tx + 1) + ',' + p.ty];
      const v = tubes[p.tx + ',' + (p.ty - 1)] || tubes[p.tx + ',' + (p.ty + 1)];
      p.frame = h && v ? 3 : v ? 1 : 0;
    });
    return { back: back, front: front, walls: walls };
  }

  // Géiseres: el chorro sube desde la celda hasta chocar con algo (como mucho REACH)
  buildGeysers() {
    for (let ty = 0; ty < this.rowCount; ty++) {
      for (let tx = 0; tx < this.cols; tx++) {
        if (this.rows[ty][tx] !== 'g') continue;
        let top = ty;
        while (ty - top < CONFIG.GEYSER.REACH && top > 0 && '.V'.indexOf(this.rows[top - 1][tx]) >= 0) top--;
        this.geysers.push({ tx: tx, ty: ty, top: top, seed: tx * 3 + ty });
      }
    }
  }

  // Estado del géiser: 'off', 'warn' (burbujea antes de saltar) o 'on'. Saltan al
  // pulso de la música: cada EVERY pulsos, desfasados según su lugar
  geyserState(g) {
    const G = CONFIG.GEYSER;
    const beat = 60 / this.bpm;
    const period = beat * G.EVERY;
    const t = (this.clock + (g.seed % G.EVERY) * beat) % period;
    if (t < G.ON) return 'on';
    if (t > period - G.WARN) return 'warn';
    return 'off';
  }

  // Rectángulo del chorro de un géiser (px)
  geyserJet(g) {
    const T = CONFIG.TILE;
    return { x: g.tx * T + 2, y: g.top * T, w: T - 4, h: (g.ty - g.top) * T };
  }

  // Rayos: bajan desde su celda hasta chocar con algo (como mucho CONFIG.RAYO.REACH)
  buildRays() {
    for (let ty = 0; ty < this.rowCount; ty++) {
      for (let tx = 0; tx < this.cols; tx++) {
        if (this.rows[ty][tx] !== 'l') continue;
        let len = 1;
        while (len < CONFIG.RAYO.REACH && ty + len < this.rowCount &&
               '.lw'.indexOf(this.rows[ty + len][tx]) >= 0) len++;
        this.rays.push({ tx: tx, ty: ty, len: len });
      }
    }
  }

  // Una puerta de color ocupa dos celdas, una sobre otra: se dibuja una sola vez
  groupColorDoors() {
    this.colorDoors.forEach(function (d) {
      d.top = !this.colorDoors.some(function (o) { return o.tx === d.tx && o.ty === d.ty - 1; });
    }, this);
  }

  // Anillas seguidas en la misma fila forman una sola barra para colgarse
  buildHookRails() {
    const T = CONFIG.TILE;
    const rails = [];
    this.items.filter(function (i) { return i.type === 'hook'; })
      .sort(function (a, b) { return a.y - b.y || a.x - b.x; })
      .forEach(function (h) {
        const last = rails[rails.length - 1];
        if (last && last.y === h.y && last.x1 === h.x) last.x1 += T;
        else rails.push({ x0: h.x, x1: h.x + T, y: h.y });
      });
    return rails;
  }

  // ¿Hay camino libre en línea recta entre dos puntos? (para lanzar el gancho)
  clearLine(x0, y0, x1, y1) {
    const T = CONFIG.TILE;
    const dist = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
    const steps = Math.ceil(dist / 4);
    for (let i = 1; i < steps; i++) {
      const x = x0 + (x1 - x0) * i / steps;
      const y = y0 + (y1 - y0) * i / steps;
      const b = this.solidBox(Math.floor(x / T), Math.floor(y / T));
      if (b && x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return false;
    }
    return true;
  }

  // Zona de la pelea: entre muros "L" (si hay uno solo, desde él hacia el jefe).
  // Sin muros L, el portón "G" hace de muro: se abre con la misión y se cierra
  // detrás de la papa al entrar
  findArena() {
    if (!this.bossSpawn) return null;
    const T = CONFIG.TILE;
    const cols = [];
    let lowRow = 0;
    const wall = this.rows.some(function (r) { return r.indexOf('L') >= 0; }) ? 'L' : 'G';
    this.rows.forEach(function (row, ty) {
      for (let tx = 0; tx < row.length; tx++) {
        if (row[tx] !== wall) continue;
        if (cols.indexOf(tx) < 0) cols.push(tx);
        lowRow = Math.max(lowRow, ty);
      }
    });
    if (cols.length === 0) return null;
    // Con portón G la arena termina en el piso bajo el portón; con L ocupa todo el alto
    let bottom = wall === 'G' ? (lowRow + 2) * T : this.pxH;
    if (this.arenaFloor) bottom = (this.arenaFloor + 1) * T;
    const top = this.arenaTop ? this.arenaTop * T : 0;
    const minX = Math.min.apply(null, cols) * T;
    const maxX = (Math.max.apply(null, cols) + 1) * T;
    if (minX + T < maxX) return { left: minX + T, right: maxX - T, top: top, bottom: bottom };
    return this.bossSpawn.tx * T > minX
      ? { left: minX + T, right: this.pxW, top: top, bottom: bottom }
      : { left: 0, right: minX, top: top, bottom: bottom };
  }

  insideArena(p) {
    return !!this.arena && p.x >= this.arena.left && p.x + p.w <= this.arena.right &&
      p.y + p.h <= this.arena.bottom && p.y >= this.arena.top;
  }

  buildRhythmRuns() {
    const T = CONFIG.TILE;
    const runs = [];
    for (let ty = 0; ty < this.rowCount; ty++) {
      let tx = 0;
      while (tx < this.cols) {
        const ch = this.rows[ty][tx];
        if (ch !== '1' && ch !== '2') { tx++; continue; }
        let end = tx;
        while (end + 1 < this.cols && this.rows[ty][end + 1] === ch) end++;
        runs.push({ group: Number(ch), x: tx * T, y: ty * T, w: (end - tx + 1) * T, h: T });
        tx = end + 1;
      }
    }
    return runs;
  }

  beatPhase() {
    const beat = 60 / this.bpm;
    return (this.clock % beat) / beat;
  }

  // Varias "M" (de lado a lado) o "I" (sube y baja) seguidas forman una sola plataforma
  addMoverCell(tx, ty, axis) {
    const T = CONFIG.TILE;
    const last = this.movers[this.movers.length - 1];
    if (last && last.axis === axis && last.ty === ty && last.baseX + last.w === tx * T) {
      last.w += T;
      return;
    }
    const phase = axis === 'y' && Math.floor(ty / 4) % 2 === 1 ? 0.5 : 0;
    this.movers.push({ axis: axis, ty: ty, baseX: tx * T, baseY: ty * T, phase: phase,
                       x: tx * T, y: ty * T, w: T, h: T / 2, dx: 0, dy: 0,
                       lift: axis === 'y', oneWay: true, up: 0, down: 0, period: 0 });
  }

  // Recorrido de cada "I" (ver "lifts" en levels.js): up / down en bloques,
  // phase de 0 a 1 y period en segundos. Sin datos: hasta LIFT_RANGE/2 a cada lado
  setupLifts(list) {
    const T = CONFIG.TILE;
    const H = CONFIG.HAZARDS;
    const half = H.LIFT_RANGE / 2;
    this.movers.forEach(function (m) {
      if (!m.lift) return;
      const tx0 = m.baseX / T;
      const cols = m.w / T;
      const own = (list || []).find(function (l) {
        return l.y === m.ty && l.x >= tx0 && l.x < tx0 + cols;
      }) || {};
      m.up = own.up !== undefined ? own.up : Math.min(half, this.freeAbove(tx0, cols, m.ty));
      m.down = own.down !== undefined ? own.down : Math.min(half, this.freeBelow(tx0, cols, m.ty));
      if (own.phase !== undefined) m.phase = own.phase;
      m.period = own.period || H.LIFT_PERIOD;
    }, this);
  }

  rowFree(tx0, cols, ty) {
    if (ty < 0 || ty >= this.rowCount) return false;
    for (let tx = tx0; tx < tx0 + cols; tx++) {
      if ('.o'.indexOf(this.rows[ty][tx]) < 0) return false;
    }
    return true;
  }

  freeAbove(tx0, cols, ty) {
    let n = 0;
    while (this.rowFree(tx0, cols, ty - n - 1) && this.rowFree(tx0, cols, ty - n - 2) &&
           this.rowFree(tx0, cols, ty - n - 3)) n++;
    return n;
  }

  freeBelow(tx0, cols, ty) {
    let n = 0;
    while (this.rowFree(tx0, cols, ty + n + 1)) n++;
    return n;
  }

  // ---------- Muros rompibles, sellos y puertas de color ----------

  // Rompe el muro de esa celda y todas las celdas iguales que se tocan con ella
  // (X: muro agrietado del dash; [ y ]: muros del diapasón)
  breakWall(tx, ty, ch) {
    const kind = ch || 'X';
    const cells = [];
    const stack = [[tx, ty]];
    while (stack.length) {
      const c = stack.pop();
      if (this.tileAt(c[0], c[1]) !== kind) continue;
      this.setTile(c[0], c[1], '.');
      cells.push(c);
      stack.push([c[0] + 1, c[1]], [c[0] - 1, c[1]], [c[0], c[1] + 1], [c[0], c[1] - 1]);
    }
    this.brokenCells = this.brokenCells.concat(cells);
    return cells;
  }

  // ---------- Niebla (O) y plataformas ocultas (h): caracol del eco ----------

  // El caracol sopla desde (cx, cy) con radio en bloques: las plataformas ocultas que
  // alcanza aparecen para siempre (pasan a ser de paso) y la niebla se despeja un rato.
  // Devuelve las celdas que aparecieron
  blowShell(cx, cy, radius) {
    const T = CONFIG.TILE;
    const r = radius * T;
    const t0 = this.tileRange(cx - r, cy - r, r * 2, r * 2);
    const shown = [];
    for (let ty = t0.top; ty <= t0.bottom; ty++) {
      for (let tx = t0.left; tx <= t0.right; tx++) {
        if (this.tileAt(tx, ty) !== 'h') continue;
        const dx = tx * T + T / 2 - cx;
        const dy = ty * T + T / 2 - cy;
        if (dx * dx + dy * dy > r * r) continue;
        this.setTile(tx, ty, '_');
        shown.push([tx, ty]);
      }
    }
    this.fogClears = (this.fogClears || []).concat([{ x: cx, y: cy, r: r * 1.3, start: this.clock }]);
    return shown;
  }

  // Al volver a la sala: las plataformas que ya habían aparecido
  showCells(cells) {
    cells.forEach(function (c) { if (this.tileAt(c[0], c[1]) === 'h') this.setTile(c[0], c[1], '_'); }, this);
  }

  // Cuánto se ve la niebla en (x, y): 1 tapada, 0 despejada por el caracol
  fogAmount(x, y) {
    const S = CONFIG.SHELL;
    let k = 1;
    (this.fogClears || []).forEach(function (c) {
      const age = this.clock - c.start;
      if (age > S.CLEAR_TIME) return;
      const d = Math.sqrt((x - c.x) * (x - c.x) + (y - c.y) * (y - c.y));
      const grow = Math.min(1, age / 0.4);                 // se abre rápido
      const close = Math.max(0, (age - S.CLEAR_TIME + 1.5) / 1.5);   // y se cierra despacio
      const inside = d < c.r * grow ? 0 : 1;
      k = Math.min(k, Math.max(inside, close));
    }, this);
    return k;
  }

  // Niebla: nubes lilas que respiran, delante de todo (tapan lo que hay detrás)
  drawFog(ctx, view) {
    const T = CONFIG.TILE;
    const S = CONFIG.SHELL;
    if (this.fogClears) this.fogClears = this.fogClears.filter(function (c) { return this.clock - c.start < S.CLEAR_TIME; }, this);
    for (let ty = view.y0; ty <= view.y1; ty++) {
      for (let tx = view.x0; tx <= view.x1; tx++) {
        if (this.rows[ty][tx] !== 'O') continue;
        const px = tx * T;
        const py = ty * T;
        const k = this.fogAmount(px + T / 2, py + T / 2);
        if (k <= 0) continue;
        // En el borde de la niebla (vecino sin niebla) se ve más suave
        const edge = this.tileAt(tx - 1, ty) !== 'O' || this.tileAt(tx + 1, ty) !== 'O' ||
                     this.tileAt(tx, ty - 1) !== 'O' || this.tileAt(tx, ty + 1) !== 'O';
        const wave = Math.sin(this.clock * 0.9 + tx * 0.45 + ty * 0.3) * 0.06;
        ctx.globalAlpha = (S.FOG_ALPHA + wave) * k * (edge ? 0.55 : 1);
        ctx.fillStyle = S.FOG_COLOR;
        ctx.fillRect(px, py, T, T);
        // Copos de nube más claros que pasan despacio
        if ((tx * 5 + ty * 3) % 4 === 0) {
          ctx.globalAlpha = 0.25 * k;
          ctx.fillStyle = '#ffffff';
          const ox = (this.clock * 4 + tx * 9) % T;
          ctx.fillRect(px + ox - 3, py + 5 + (ty % 3) * 3, 6, 2);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Plataforma oculta: no se ve; con el caracol en la mano asoma un contorno de puntos
  drawHidden(ctx, tx, ty, px, py) {
    if (!this.powers.shell) return;
    if (Sprites.drawFrame(ctx, 'bloque_niebla', 0, px, py, false)) return;
    ctx.globalAlpha = 0.2 + 0.1 * Math.sin(this.clock * 2 + tx);
    ctx.fillStyle = '#ece6ff';
    for (let x = 1; x < CONFIG.TILE; x += 3) ctx.fillRect(px + x, py + 1, 1, 1);
    ctx.globalAlpha = 1;
  }

  // Onda del diapasón con centro (cx, cy) en px y radio en bloques. Los muros de esa
  // nota que toca se deshacen (devuelve sus celdas); los de la otra nota tiemblan
  resonate(note, cx, cy, radius) {
    const T = CONFIG.TILE;
    const r = radius * T;
    const t0 = this.tileRange(cx - r, cy - r, r * 2, r * 2);
    const opened = [];
    let wrong = 0;
    let wrongNote = null;
    for (let ty = t0.top; ty <= t0.bottom; ty++) {
      for (let tx = t0.left; tx <= t0.right; tx++) {
        const ch = this.tileAt(tx, ty);
        if (!TUNE_WALLS[ch]) continue;
        const dx = tx * T + T / 2 - cx;
        const dy = ty * T + T / 2 - cy;
        if (dx * dx + dy * dy > r * r) continue;
        if (TUNE_WALLS[ch] === note) {
          this.breakWall(tx, ty, ch).forEach(function (c) { opened.push(c); });
        } else {
          this.tuneShake[tx + ',' + ty] = CONFIG.TUNER.WRONG_SHAKE;
          wrong++;
          wrongNote = wrongNote || TUNE_WALLS[ch];
        }
      }
    }
    return { opened: opened, wrong: wrong, wrongNote: wrongNote };
  }

  removeCells(cells) {
    cells.forEach(function (c) { this.setTile(c[0], c[1], '.'); }, this);
    this.brokenCells = cells.slice();
  }

  setTile(tx, ty, ch) {
    const row = this.rows[ty];
    this.rows[ty] = row.slice(0, tx) + ch + row.slice(tx + 1);
  }

  sealAt(tx, ty) {
    return this.seals.find(function (s) { return s.tx === tx && s.ty === ty; }) || null;
  }

  // El sello se abre solo cuando la papa tiene su poder
  sealOpen(tx, ty) {
    const s = this.sealAt(tx, ty);
    return !!s && !!this.powers[s.power];
  }

  doorAt(tx, ty) {
    return this.colorDoors.find(function (d) { return d.tx === tx && d.ty === ty; }) || null;
  }

  doorOpen(tx, ty) {
    return !!this.openDoors[tx + ',' + ty];
  }

  // Abre la puerta entera (las dos celdas)
  openDoor(door) {
    this.colorDoors.forEach(function (d) {
      if (d.tx === door.tx && Math.abs(d.ty - door.ty) <= 1) this.openDoors[d.tx + ',' + d.ty] = true;
    }, this);
  }

  // Puerta de color cerrada que toca el rectángulo (con un margen) o null
  closedDoorNear(r) {
    const T = CONFIG.TILE;
    return this.colorDoors.find(function (d) {
      return !this.doorOpen(d.tx, d.ty) &&
        overlaps({ x: d.tx * T - 3, y: d.ty * T, w: T + 6, h: T }, r);
    }, this) || null;
  }

  // ---------- Agua y rayos ----------

  isWater(px, py) {
    const T = CONFIG.TILE;
    return WATER.indexOf(this.tileAt(Math.floor(px / T), Math.floor(py / T))) >= 0;
  }

  // Corriente en ese punto: -1 (a la izquierda), 1 (a la derecha) o 0
  currentAt(px, py) {
    const T = CONFIG.TILE;
    const ch = this.tileAt(Math.floor(px / T), Math.floor(py / T));
    return ch === '{' ? -1 : ch === '}' ? 1 : 0;
  }

  // Superficie del agua (px) debajo de un punto, a lo sumo maxRows bloques más abajo
  // (para el reflejo de la papa); null si antes hay suelo o no hay agua
  waterBelow(px, py, maxRows) {
    const T = CONFIG.TILE;
    const tx = Math.floor(px / T);
    const ty0 = Math.floor(py / T);
    for (let ty = ty0; ty <= ty0 + maxRows; ty++) {
      const ch = this.tileAt(tx, ty);
      if (WATER.indexOf(ch) >= 0) return WATER.indexOf(this.tileAt(tx, ty - 1)) >= 0 ? null : ty * T;
      if (this.solidBox(tx, ty)) return null;
    }
    return null;
  }

  // Altura (px) de la superficie del agua en esa columna, desde la celda dada
  waterSurface(px, py) {
    const T = CONFIG.TILE;
    const tx = Math.floor(px / T);
    let ty = Math.floor(py / T);
    while (ty > 0 && WATER.indexOf(this.tileAt(tx, ty - 1)) >= 0) ty--;
    return ty * T;
  }

  // Los rayos se prenden en un pulso y se apagan en el siguiente
  rayOn() {
    const beat = 60 / this.bpm;
    return Math.floor(this.clock / beat) % 2 === 0;
  }

  rayHits(r) {
    if (!this.rays.length || !this.rayOn()) return false;
    const T = CONFIG.TILE;
    return this.rays.some(function (b) {
      return overlaps({ x: b.tx * T + 5, y: b.ty * T + 3, w: T - 10, h: b.len * T - 3 }, r);
    });
  }

  // ---------- Actualización ----------

  update(dt) {
    this.clock += dt;
    if (this.gateAnim > 0) this.gateAnim = Math.max(0, this.gateAnim - dt);
    this.updateRhythm();
    this.updateMovers();
    this.updateSinkers(dt);
    this.updateCrumbles(dt);
    Object.keys(this.tuneShake).forEach(function (k) {
      this.tuneShake[k] -= dt;
      if (this.tuneShake[k] <= 0) delete this.tuneShake[k];
    }, this);
  }

  // Piedras que se hunden: pressSinkers (lo llama el juego) marca la que pisa la papa
  pressSinkers(p) {
    const feet = p.y + p.h;
    this.movers.forEach(function (m) {
      if (m.axis !== 'sink') return;
      m.loaded = Math.abs(feet - m.y) < 2 && p.x < m.x + m.w && p.x + p.w > m.x;
    });
  }

  updateSinkers(dt) {
    const H = CONFIG.HAZARDS;
    this.movers.forEach(function (m) {
      if (m.axis !== 'sink') return;
      const depth = m.y - m.baseY;
      const next = m.loaded ? Math.min(H.SINK_MAX, depth + H.SINK_SPEED * dt)
                            : Math.max(0, depth - H.SINK_RISE * dt);
      m.dx = 0;
      m.dy = next - depth;
      m.y = m.baseY + next;
    });
  }

  updateRhythm() {
    const switchLen = (60 / this.bpm) * CONFIG.GAME.BEATS_PER_SWITCH;
    const step = Math.floor(this.clock / switchLen);
    this.activeGroup = step % 2 === 0 ? 1 : 2;
    this.switchPhase = (this.clock % switchLen) / switchLen;
  }

  updateMovers() {
    const H = CONFIG.HAZARDS;
    const T = CONFIG.TILE;
    const side = Math.sin(this.clock * Math.PI * 2 / H.MOVER_PERIOD) * H.MOVER_RANGE * T;
    const clock = this.clock;
    this.movers.forEach(function (m) {
      if (m.axis === 'sink') return;   // las piedras que se hunden van en updateSinkers
      const turn = (clock / (m.period || H.LIFT_PERIOD) + m.phase) * Math.PI * 2;
      const mid = (m.up - m.down) / 2;
      const amp = (m.up + m.down) / 2;
      const lift = (mid + Math.sin(turn) * amp) * T;
      const nextX = m.axis === 'x' ? m.baseX + side : m.baseX;
      const nextY = m.axis === 'y' ? m.baseY - lift : m.baseY;
      m.dx = nextX - m.x;
      m.dy = nextY - m.y;
      m.x = nextX;
      m.y = nextY;
    });
  }

  updateCrumbles(dt) {
    const H = CONFIG.HAZARDS;
    Object.keys(this.crumbles).forEach(function (key) {
      const c = this.crumbles[key];
      c.t -= dt;
      if (c.t > 0) return;
      if (c.state === 'shaking') {
        c.state = 'gone';
        c.t = H.CRUMBLE_RESPAWN;
      } else {
        delete this.crumbles[key];
      }
    }, this);
  }

  touchCrumbles(p) {
    const r = this.tileRange(p.x, p.y + p.h, p.w, 1);
    for (let tx = r.left; tx <= r.right; tx++) {
      if (this.tileAt(tx, r.top) !== '~') continue;
      const key = tx + ',' + r.top;
      if (!this.crumbles[key]) this.crumbles[key] = { state: 'shaking', t: CONFIG.HAZARDS.CRUMBLE_DELAY };
    }
  }

  // ---------- Consultas ----------

  tileAt(tx, ty) {
    // (también si llega NaN: ninguna comparación da verdadero)
    if (!(tx >= 0 && tx < this.cols && ty >= 0 && ty < this.rowCount)) return '.';
    return this.rows[ty][tx];
  }

  // Caja sólida de una celda, o null si no bloquea.
  // Bordes laterales y techo son sólidos; abajo es vacío (caída).
  solidBox(tx, ty) {
    const T = CONFIG.TILE;
    const full = { x: tx * T, y: ty * T, w: T, h: T };
    if (tx < 0 || tx >= this.cols || ty < 0) return full;
    if (ty >= this.rowCount) return null;

    const ch = this.rows[ty][tx];
    if (FULL_SOLID.indexOf(ch) >= 0) return full;
    if (ONE_WAY.indexOf(ch) >= 0) return { x: tx * T, y: ty * T, w: T, h: T / 2, oneWay: true, lift: true };
    if (ch === '~') {
      const c = this.crumbles[tx + ',' + ty];
      return c && c.state === 'gone' ? null : full;
    }
    if (ch === '1' || ch === '2') return Number(ch) === this.activeGroup ? full : null;
    if (ch === 'L') return this.arenaActive ? full : null;
    if (ch === 'G') return this.gateOpen && !this.arenaActive ? null : full;
    if (ch === 'A') return this.sealOpen(tx, ty) ? null : full;
    if (ch === 'Y') return this.doorOpen(tx, ty) ? null : full;
    if (ch === ':') return this.isBlockedExitCell(tx, ty) ? full : null;
    return null;
  }

  tileRange(x, y, w, h) {
    const T = CONFIG.TILE;
    return {
      left: Math.floor(x / T),
      right: Math.floor((x + w - 0.001) / T),
      top: Math.floor(y / T),
      bottom: Math.floor((y + h - 0.001) / T)
    };
  }

  solidBoxesIn(x, y, w, h) {
    const r = this.tileRange(x, y, w, h);
    const boxes = [];
    const hits = function (b) {
      return x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y;
    };
    for (let ty = r.top; ty <= r.bottom; ty++) {
      for (let tx = r.left; tx <= r.right; tx++) {
        const b = this.solidBox(tx, ty);
        if (!b || !hits(b)) continue;
        // Las plataformas de paso solo sostienen a quien tiene los pies casi encima
        if (b.oneWay && (this.passOneWay || y + h - b.y > CONFIG.HAZARDS.LIFT_SNAP)) continue;
        boxes.push(b);
      }
    }
    // Las plataformas que se mueven (y las balsas) son delgadas: solo cuentan para quien
    // está encima; por debajo y de lado se atraviesan, y con abajo se baja
    this.movers.forEach(function (m) {
      if (!hits(m)) return;
      if (y + h - m.y > CONFIG.HAZARDS.LIFT_SNAP) return;
      if (this.passOneWay && m.oneWay) return;
      boxes.push(m);
    }, this);
    return boxes;
  }

  rectHitsSolid(x, y, w, h) {
    return this.solidBoxesIn(x, y, w, h).length > 0;
  }

  rectHasTile(x, y, w, h, ch) {
    const r = this.tileRange(x, y, w, h);
    for (let ty = r.top; ty <= r.bottom; ty++) {
      for (let tx = r.left; tx <= r.right; tx++) {
        if (this.tileAt(tx, ty) === ch) return true;
      }
    }
    return false;
  }

  // Las espinas solo dañan en su parte baja (las puntas)
  rectHitsSpikes(x, y, w, h) {
    const T = CONFIG.TILE;
    const r = this.tileRange(x, y, w, h);
    for (let ty = r.top; ty <= r.bottom; ty++) {
      for (let tx = r.left; tx <= r.right; tx++) {
        if (this.tileAt(tx, ty) !== '^') continue;
        const sx = tx * T + 2;
        const sy = ty * T + 9;
        if (x < sx + T - 4 && x + w > sx && y < sy + T - 9 && y + h > sy) return true;
      }
    }
    return false;
  }

  carryFor(p, dt) {
    const feet = p.y + p.h;
    for (let i = 0; i < this.movers.length; i++) {
      const m = this.movers[i];
      const before = m.y - m.dy;
      if (Math.abs(feet - before) < 1.5 && p.x < m.x + m.w && p.x + p.w > m.x) {
        return { dx: m.dx, dy: m.dy };
      }
    }
    if (this.rectHasTile(p.x, feet, p.w, 1, '>')) return { dx: CONFIG.HAZARDS.CONVEYOR_SPEED * dt, dy: 0 };
    if (this.rectHasTile(p.x, feet, p.w, 1, '<')) return { dx: -CONFIG.HAZARDS.CONVEYOR_SPEED * dt, dy: 0 };
    return { dx: 0, dy: 0 };
  }

  // ---------- Dibujo: bloques ----------

  palette() {
    return THEME_COLORS[this.theme] || THEME_COLORS.cityday;
  }

  // ¿Hay suelo "#" en esa celda? (fuera del mapa cuenta como suelo: las salas siguen)
  groundAt(tx, ty) {
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rowCount) return true;
    return this.rows[ty][tx] === '#';
  }

  // Número de pieza de la hoja de 16: arriba 1, derecha 2, abajo 4, izquierda 8
  groundMask(tx, ty) {
    return (this.groundAt(tx, ty - 1) ? 1 : 0) | (this.groundAt(tx + 1, ty) ? 2 : 0) |
           (this.groundAt(tx, ty + 1) ? 4 : 0) | (this.groundAt(tx - 1, ty) ? 8 : 0);
  }

  // Hojas que hay para el tema (se calcula una vez por dibujo)
  sheets() {
    const t = this.theme;
    const main = Sprites.has('tiles_' + t) ? 'tiles_' + t : (Sprites.has('tiles_ciudad') ? 'tiles_ciudad' : null);
    const extra = Sprites.has('tiles_' + t + '_extra') ? 'tiles_' + t + '_extra' : null;
    return {
      main: main,
      sixteen: !!main && Sprites.frames(main) >= 16,
      eight: !!main && Sprites.frames(main) >= 8 && Sprites.frames(main) < 16,
      extra: extra,
      wall: Sprites.has('pared_' + t) ? 'pared_' + t : null,
      // Tejido HD (si están): bloques según vecinos, adornos y plataformas
      auto: Sprites.has('tiles_' + t + '_auto') ? 'tiles_' + t + '_auto' : null,
      bordes: Sprites.has('bordes_' + t) ? 'bordes_' + t : null,
      colgantes: Sprites.has('colgantes_' + t) ? 'colgantes_' + t : null,
      plat: Sprites.has('plataforma_' + t) ? 'plataforma_' + t : null
    };
  }

  // Dibuja una pieza de la hoja nueva o de la vieja; false si no hay hoja
  // ¿Esta celda es bloque macizo (suelo o ladrillo)? Para armar los bloques HD
  massAt(tx, ty) {
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rowCount) return true;
    const ch = this.rows[ty][tx];
    return ch === '#' || ch === 'B';
  }

  // Pieza de la hoja _auto: arriba 1, derecha 2, abajo 4, izquierda 8 (donde no hay
  // vecino, el borde es irregular)
  massMask(tx, ty) {
    return (this.massAt(tx, ty - 1) ? 1 : 0) | (this.massAt(tx + 1, ty) ? 2 : 0) |
           (this.massAt(tx, ty + 1) ? 4 : 0) | (this.massAt(tx - 1, ty) ? 8 : 0);
  }

  // Bloques y plataformas Tejido HD. Devuelve false si el tema no tiene esas hojas
  drawHDTile(ctx, S, ch, tx, ty, px, py) {
    if ((ch === '#' || ch === 'B') && S.auto) return Sprites.drawFrame(ctx, S.auto, this.massMask(tx, ty), px, py, false);
    if ((ch === '=' || ch === '_') && S.plat) {
      const left = this.tileAt(tx - 1, ty) !== ch;
      const right = this.tileAt(tx + 1, ty) !== ch;
      const f = left && !right ? 0 : right && !left ? 2 : 1;
      return Sprites.drawFrame(ctx, S.plat, f, px, py, false);
    }
    return false;
  }

  // Adornos HD: sobre algunos bordes de arriba (matas, piedras...) y bajo algunos de
  // abajo (raíces, gotas...). Se eligen por la posición, así no cambian al moverse
  drawHDTrims(ctx, S, view) {
    if (!S.bordes && !S.colgantes) return;
    const T = CONFIG.TILE;
    for (let ty = view.y0; ty <= view.y1; ty++) {
      for (let tx = view.x0; tx <= view.x1; tx++) {
        if (!this.massAt(tx, ty) || tx < 0 || ty < 0) continue;
        const ch = this.rows[ty][tx];
        if (ch !== '#' && ch !== 'B') continue;
        const h = (tx * 73 + ty * 151) % 97;
        if (S.bordes && this.tileAt(tx, ty - 1) === '.' && h % 3 === 0) {
          Sprites.drawFrame(ctx, S.bordes, h % 6, tx * T, ty * T - T / 2, h % 2 === 1);
        }
        if (S.colgantes && this.tileAt(tx, ty + 1) === '.' && h % 4 === 1) {
          Sprites.drawFrame(ctx, S.colgantes, (h >> 1) % 6, tx * T, (ty + 1) * T, h % 2 === 0);
        }
      }
    }
  }

  drawSheetTile(ctx, S, ch, tx, ty, px, py) {
    if (this.drawHDTile(ctx, S, ch, tx, ty, px, py)) return true;
    if (ch === '#') {
      if (S.sixteen) {
        const mask = this.groundMask(tx, ty);
        const variant = (tx * 31 + ty * 17) % 4;
        if (mask === 15 && S.extra && variant > 0) {
          return Sprites.drawFrame(ctx, S.extra, TILE_EXTRA.FILL_A + variant - 1, px, py, false);
        }
        return Sprites.drawFrame(ctx, S.main, mask, px, py, false);
      }
      if (S.main) {
        const above = ty > 0 ? this.rows[ty - 1][tx] : '.';
        let f = TILESET.GROUND_TOP;
        if (above === '#') f = TILESET.DIRT;
        else if (S.eight && tx > 0 && this.rows[ty][tx - 1] !== '#') f = TILESET.EDGE_LEFT;
        else if (S.eight && tx < this.cols - 1 && this.rows[ty][tx + 1] !== '#') f = TILESET.EDGE_RIGHT;
        return Sprites.drawFrame(ctx, S.main, f, px, py, false);
      }
      return false;
    }
    const extraFrame = { B: TILE_EXTRA.BRICK, '=': TILE_EXTRA.THIN, _: TILE_EXTRA.PASS }[ch];
    if (extraFrame !== undefined && S.extra) return Sprites.drawFrame(ctx, S.extra, extraFrame, px, py, false);
    const oldFrame = { B: TILESET.BRICK, '=': TILESET.THIN, _: TILESET.THIN }[ch];
    if (oldFrame !== undefined && S.main && !S.sixteen) return Sprites.drawFrame(ctx, S.main, oldFrame, px, py, false);
    return false;
  }

  // Bloques dibujados por código con los colores del tema (si faltan las hojas)
  drawFallbackTile(ctx, ch, tx, ty, px, py) {
    const T = CONFIG.TILE;
    const P = this.palette();
    if (ch === '#') {
      const mask = this.groundMask(tx, ty);
      ctx.fillStyle = P.ground;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = P.dark;
      const s = (tx * 13 + ty * 7) % 5;
      ctx.fillRect(px + 3 + s, py + 6 + (s % 3), 2, 1);
      ctx.fillRect(px + 10 - s, py + 11, 1, 1);
      if (!(mask & 1)) {
        ctx.fillStyle = P.top;
        ctx.fillRect(px, py, T, 4);
        ctx.fillStyle = '#2e2a47';
        ctx.fillRect(px, py, T, 1);
      }
      ctx.fillStyle = '#2e2a47';
      if (!(mask & 8)) ctx.fillRect(px, py, 1, T);
      if (!(mask & 2)) ctx.fillRect(px + T - 1, py, 1, T);
      if (!(mask & 4)) ctx.fillRect(px, py + T - 1, T, 1);
    } else if (ch === 'B') {
      ctx.fillStyle = P.brick;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = 'rgba(46, 42, 71, 0.55)';
      ctx.fillRect(px, py + 7, T, 1);
      ctx.fillRect(px, py + 15, T, 1);
      ctx.fillRect(px + (ty % 2 ? 4 : 11), py, 1, 7);
      ctx.fillRect(px + (ty % 2 ? 11 : 4), py + 8, 1, 7);
    } else if (ch === '=') {
      ctx.fillStyle = P.thin;
      ctx.fillRect(px, py, T, 7);
      ctx.fillStyle = '#2e2a47';
      ctx.fillRect(px, py + 7, T, 1);
      ctx.fillRect(px, py, T, 1);
    } else if (ch === '_') {
      // Plataforma de paso: una tabla delgada con borde claro y patitas punteadas
      ctx.fillStyle = '#2e2a47';
      ctx.fillRect(px, py, T, 5);
      ctx.fillStyle = P.thin;
      ctx.fillRect(px, py + 1, T, 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(px, py + 1, T, 1);
      ctx.fillStyle = 'rgba(46, 42, 71, 0.5)';
      for (let i = 2; i < T; i += 4) ctx.fillRect(px + i, py + 6, 2, 1);
    }
  }

  // Pared de fondo (capa de decoración "#")
  drawWalls(ctx, S, view) {
    const T = CONFIG.TILE;
    const P = this.palette();
    this.deco.walls.forEach(function (p) {
      if (p.tx < view.x0 || p.tx > view.x1 || p.ty < view.y0 || p.ty > view.y1) return;
      const px = p.tx * T;
      const py = p.ty * T;
      if (S.wall && Sprites.drawFrame(ctx, S.wall, (p.tx * 3 + p.ty * 5) % 4, px, py, false)) return;
      ctx.fillStyle = P.wall;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      if ((p.tx + p.ty) % 3 === 0) ctx.fillRect(px + 2, py + 2, T - 4, 1);
    });
  }

  // Celdas visibles (con margen para la decoración grande)
  viewRange(cam, margin) {
    const T = CONFIG.TILE;
    const m = margin || 0;
    return {
      x0: Math.max(0, Math.floor(cam.x / T) - m),
      x1: Math.min(this.cols - 1, Math.floor((cam.x + CONFIG.WIDTH) / T) + 1),
      y0: Math.max(0, Math.floor(cam.y / T)),
      y1: Math.min(this.rowCount - 1, Math.floor((cam.y + CONFIG.HEIGHT) / T) + m)
    };
  }

  // Todo lo que va detrás de la papa: pared, decoración de fondo, bloques
  draw(ctx, cam) {
    const T = CONFIG.TILE;
    const S = this.sheets();
    this.sheet = S.main || 'tiles_ciudad';
    this.fullSheet = S.eight || S.sixteen;
    this.extraSheet = S.extra;
    const view = this.viewRange(cam, 0);
    this.drawWalls(ctx, S, view);
    Deco.drawLayer(ctx, this, this.deco.back, this.viewRange(cam, 6), false);

    for (let ty = view.y0; ty <= view.y1; ty++) {
      for (let tx = view.x0; tx <= view.x1; tx++) {
        const ch = this.rows[ty][tx];
        if (ch === '.') continue;
        const px = tx * T;
        const py = ty * T;
        if (ch === '#' || ch === 'B' || ch === '=' || ch === '_') {
          if (!this.drawSheetTile(ctx, S, ch, tx, ty, px, py)) this.drawFallbackTile(ctx, ch, tx, ty, px, py);
          else if (ch === '_' && !S.plat) this.drawPassMark(ctx, px, py);
        }
        else if (ch === '-') this.drawBridge(ctx, tx, ty, px, py);
        else if (ch === 'i') this.drawIce(ctx, tx, ty, px, py);
        else if (ch === 's') this.drawSnow(ctx, tx, ty, px, py);
        else if (ch === 'g') this.drawGeyserVent(ctx, px, py);
        else if (ch === 'x') this.drawCrackedFloor(ctx, tx, ty, px, py);
        else if (ch === 'T') this.drawDrum(ctx, px, py);
        else if (ch === '1' || ch === '2') this.drawRhythm(ctx, px, py, Number(ch));
        else if (ch === '^') this.drawSpikes(ctx, px, py);
        else if (ch === '~') this.drawCrumble(ctx, px, py, this.crumbles[tx + ',' + ty]);
        else if (ch === '<' || ch === '>') this.drawConveyor(ctx, px, py, ch === '>' ? 1 : -1);
        else if (ch === 'L') this.drawArenaWall(ctx, px, py);
        else if (ch === 'G') this.drawGate(ctx, px, py);
        else if (ch === 'X') this.drawCracked(ctx, px, py);
        else if (ch === 'z') this.drawMud(ctx, tx, ty, px, py);
        else if (TUNE_WALLS[ch]) this.drawTuneWall(ctx, tx, ty, px, py, TUNE_WALLS[ch]);
        else if (ch === 'A') this.drawSeal(ctx, tx, ty, px, py);
        else if (ch === 'Y') this.drawColorDoor(ctx, tx, ty, px, py);
        else if (ch === 'l') this.drawRayEmitter(ctx, px, py);
        else if (ch === ':' && this.isBlockedExitCell(tx, ty)) this.drawBlockedExit(ctx, px, py);
        else if (ch === 'h') this.drawHidden(ctx, tx, ty, px, py);
      }
    }
    this.drawRims(ctx, view, S);
    this.drawHDTrims(ctx, S, view);

    this.movers.forEach(function (m) {
      if (m.axis === 'sink') {
        this.drawSinker(ctx, m);
        return;
      }
      const own = m.lift ? 'ascensor' : 'movil';
      for (let x = 0; x < m.w; x += T) {
        if (Sprites.drawFrame(ctx, own, 0, m.x + x, m.y, false)) continue;
        if (this.extraSheet && Sprites.drawFrame(ctx, this.extraSheet, TILE_EXTRA.THIN, m.x + x, m.y, false,
            m.lift ? '#4d8cff' : '#e9c46a', 0.45)) continue;
        this.drawMoverFallback(ctx, m.x + x, m.y, m.lift);
      }
    }, this);

    const phase = this.beatPhase();
    this.rhythmRuns.forEach(function (r) {
      if (r.group === this.activeGroup) Effects.drawBeatBorder(ctx, r, phase);
    }, this);
  }

  // Lo que va delante de la papa: agua, rayos y decoración de frente
  drawFront(ctx, cam) {
    const T = CONFIG.TILE;
    const view = this.viewRange(cam, 0);
    // Agua: translúcida (del color del tema) con la superficie que se mueve;
    // las corrientes llevan rayitas que corren hacia donde empujan
    const tint = WATER_TINT[this.theme] || WATER_TINT.default;
    for (let ty = view.y0; ty <= view.y1; ty++) {
      for (let tx = view.x0; tx <= view.x1; tx++) {
        const ch = this.rows[ty][tx];
        if (WATER.indexOf(ch) < 0) continue;
        const px = tx * T;
        const py = ty * T;
        const surface = WATER.indexOf(this.tileAt(tx, ty - 1)) < 0;
        ctx.fillStyle = surface ? tint.top : tint.deep;
        ctx.fillRect(px, py + (surface ? 3 : 0), T, surface ? T - 3 : T);
        if (surface) {
          const w = Math.sin(this.clock * 3 + tx * 0.9) * 1.5;
          ctx.fillStyle = tint.line;
          ctx.fillRect(px, Math.round(py + 3 + w), T, 1);
          // Destellos del espejo
          if ((tx * 7 + Math.floor(this.clock * 2)) % 11 === 0) ctx.fillRect(px + 6, py + 6, 3, 1);
        }
        if (ch !== 'w') this.drawCurrent(ctx, tx, ty, px, py, ch === '}' ? 1 : -1);
      }
    }
    this.drawFog(ctx, view);
    this.drawRays(ctx);
    this.drawWind(ctx, view);
    this.drawGeyserJets(ctx, cam);
    Deco.drawLayer(ctx, this, this.deco.front, this.viewRange(cam, 6), true);
  }

  // Bordes del plano de juego: una línea clara arriba de cada bloque que se pisa (y en los
  // lados que dan al aire) y una oscura debajo de lo que flota. Así las plataformas no se
  // confunden con el fondo. Colores y grosor en CONFIG.OUTLINE
  // (los bloques y plataformas HD ya traen su borde: ahí no se dibuja)
  drawRims(ctx, view, S) {
    const T = CONFIG.TILE;
    const O = CONFIG.OUTLINE;
    const w = O.RIM_WIDTH;
    const ground = function (ch) { return RIM_TILES.indexOf(ch) >= 0; };
    const own = function (ch) {
      return S && ((S.auto && (ch === '#' || ch === 'B')) || (S.plat && (ch === '=' || ch === '_')));
    };
    for (let ty = view.y0; ty <= view.y1; ty++) {
      for (let tx = view.x0; tx <= view.x1; tx++) {
        const ch = this.rows[ty][tx];
        if (!ground(ch) || own(ch)) continue;
        const px = tx * T;
        const py = ty * T;
        const thin = ONE_WAY.indexOf(ch) >= 0 || ch === '=';
        if (!ground(this.tileAt(tx, ty - 1))) {
          ctx.fillStyle = O.RIM_TOP;
          ctx.fillRect(px, py, T, w);
        }
        if (thin) continue;
        ctx.fillStyle = O.RIM_SIDE;
        if (!ground(this.tileAt(tx - 1, ty))) ctx.fillRect(px, py, w, T);
        if (!ground(this.tileAt(tx + 1, ty))) ctx.fillRect(px + T - w, py, w, T);
        if (!ground(this.tileAt(tx, ty + 1)) && WATER.indexOf(this.tileAt(tx, ty + 1)) < 0) {
          ctx.fillStyle = O.RIM_UNDER;
          ctx.fillRect(px, py + T - w, T, w);
        }
      }
    }
  }

  // Corriente: dos rayitas por celda que corren en su dirección
  drawCurrent(ctx, tx, ty, px, py, dir) {
    const T = CONFIG.TILE;
    ctx.fillStyle = 'rgba(232, 246, 255, 0.55)';
    for (let i = 0; i < 2; i++) {
      const off = ((this.clock * 40 * dir + i * 8 + tx * 5 + ty * 3) % T + T) % T;
      const yy = py + 5 + i * 6 + ((tx + i) % 2);
      ctx.fillRect(px + off - 2, yy, 5, 1);
      ctx.fillRect(px + off + (dir > 0 ? 3 : -3), yy - 1, 1, 1);
    }
  }

  // ---------- Dibujo: zona 5 (hielo, nieve, géiser y viento) ----------

  drawIce(ctx, tx, ty, px, py) {
    if (Sprites.drawFrame(ctx, 'bloque_hielo', (tx + ty) % 2, px, py, false)) return;
    const top = this.tileAt(tx, ty - 1) !== 'i';
    ctx.fillStyle = '#9fd3e0';
    ctx.fillRect(px, py, 16, 16);
    ctx.fillStyle = '#cfe8ef';
    ctx.fillRect(px, py, 16, top ? 4 : 1);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const s = (tx * 5 + ty * 3) % 6;
    ctx.fillRect(px + 2 + s, py + 6, 5, 1);
    ctx.fillRect(px + 4 + s, py + 8, 2, 1);
    ctx.fillStyle = '#6fa8c7';
    ctx.fillRect(px, py + 15, 16, 1);
    if (top) {
      ctx.fillStyle = '#2e2a47';
      ctx.fillRect(px, py, 16, 1);
    }
  }

  drawSnow(ctx, tx, ty, px, py) {
    if (Sprites.drawFrame(ctx, 'bloque_nieve', (tx + ty) % 2, px, py, false)) return;
    const top = this.tileAt(tx, ty - 1) !== 's';
    ctx.fillStyle = '#e6eef6';
    ctx.fillRect(px, py, 16, 16);
    ctx.fillStyle = '#c4d4e4';
    ctx.fillRect(px, py + 11, 16, 5);
    if (top) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px + 4, py + 2, 4, Math.PI, 0);
      ctx.arc(px + 12, py + 2, 4, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(px, py + 1, 16, 4);
    }
  }

  drawGeyserVent(ctx, px, py) {
    if (Sprites.drawFrame(ctx, 'geiser', 0, px, py, false)) return;
    ctx.fillStyle = '#8a8296';
    ctx.fillRect(px, py + 3, 16, 13);
    ctx.fillStyle = '#5b5478';
    ctx.fillRect(px + 4, py + 2, 8, 4);
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(px + 5, py + 3, 6, 2);
    ctx.fillStyle = '#b8b2a7';
    ctx.fillRect(px + 1, py + 6, 3, 2);
  }

  // Columnas de viento: rayitas que suben
  drawWind(ctx, view) {
    const T = CONFIG.TILE;
    ctx.fillStyle = 'rgba(230, 246, 255, 0.55)';
    for (let ty = view.y0; ty <= view.y1; ty++) {
      for (let tx = view.x0; tx <= view.x1; tx++) {
        if (this.rows[ty][tx] !== 'V') continue;
        const px = tx * T;
        const py = ty * T;
        for (let i = 0; i < 2; i++) {
          const k = (this.clock * 2.2 + i * 0.5 + tx * 0.37) % 1;
          const x = px + 3 + ((tx * 7 + i * 5) % 10);
          ctx.fillRect(x, Math.round(py + T - k * T), 1, 5);
        }
      }
    }
  }

  // Chorros de los géiseres: avisan burbujeando y saltan con vapor
  drawGeyserJets(ctx, cam) {
    const T = CONFIG.TILE;
    this.geysers.forEach(function (g) {
      const st = this.geyserState(g);
      const cx = g.tx * T + 8;
      const by = g.ty * T;
      if (st === 'warn') {
        ctx.fillStyle = 'rgba(230, 246, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
          const k = (this.clock * 3 + i * 0.33) % 1;
          ctx.fillRect(Math.round(cx - 3 + i * 3), Math.round(by - k * 10), 2, 2);
        }
        return;
      }
      if (st !== 'on') return;
      const J = this.geyserJet(g);
      Light.drawGlow(ctx, cx, J.y + J.h / 2, J.h * 0.6, '#cfefff', 0.5);
      const g2 = ctx.createLinearGradient(0, J.y, 0, J.y + J.h);
      g2.addColorStop(0, 'rgba(230,246,255,0)');
      g2.addColorStop(1, 'rgba(230,246,255,0.85)');
      ctx.fillStyle = g2;
      const wob = Math.sin(this.clock * 30 + g.seed) * 1.5;
      ctx.fillRect(Math.round(J.x + wob), J.y, J.w, J.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(cx - 2 - wob), J.y + 6, 4, J.h - 6);
    }, this);
  }

  // ---------- Dibujo: piezas ----------

  drawDrum(ctx, px, py) {
    const k = CONFIG.DRAW.DRUM_SCALE;
    ctx.save();
    ctx.translate(px + CONFIG.TILE / 2, py + CONFIG.TILE);
    ctx.scale(k, k);
    const ok = Sprites.drawFrame(ctx, 'tambor', 0, -CONFIG.TILE / 2, -CONFIG.TILE, false);
    ctx.restore();
    if (ok) return;
    const T = CONFIG.TILE;
    ctx.fillStyle = '#f2e6c9';
    ctx.fillRect(px + 1, py, T - 2, 3);
    ctx.fillStyle = '#e9c46a';
    ctx.fillRect(px, py + 3, T, 2);
    ctx.fillStyle = '#e07a8f';
    ctx.fillRect(px + 1, py + 5, T - 2, 9);
    ctx.fillStyle = '#fbf6ec';
    ctx.fillRect(px + 4, py + 7, 1, 5);
    ctx.fillRect(px + 11, py + 7, 1, 5);
    ctx.fillStyle = '#e9c46a';
    ctx.fillRect(px, py + 14, T, 2);
  }

  drawRhythm(ctx, px, py, group) {
    const T = CONFIG.TILE;
    const color = group === 1 ? '#3fd1c4' : '#c46bff';
    const active = group === this.activeGroup;
    const blinking = active && this.switchPhase > 0.75 && Math.floor(this.switchPhase * 16) % 2 === 0;
    if (Sprites.has('ritmica')) {
      ctx.globalAlpha = blinking ? 0.45 : 1;
      Sprites.drawFrame(ctx, 'ritmica', (group - 1) * 2 + (active ? 0 : 1), px, py, false);
      ctx.globalAlpha = 1;
      return;
    }
    if (active) {
      ctx.globalAlpha = blinking ? 0.45 : 1;
      ctx.fillStyle = color;
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, T, 2);
    } else {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = color;
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
    }
    ctx.globalAlpha = 1;
  }

  drawSpikes(ctx, px, py) {
    if (this.extraSheet && Sprites.drawFrame(ctx, this.extraSheet, TILE_EXTRA.SPIKES, px, py, false)) return;
    if (this.fullSheet && !this.extraSheet && Sprites.drawFrame(ctx, this.sheet, TILESET.SPIKES, px, py, false)) return;
    for (let i = 0; i < 4; i++) {
      const sx = px + i * 4;
      ctx.fillStyle = '#9a96a8';
      ctx.fillRect(sx, py + 13, 4, 3);
      ctx.fillStyle = '#e6e2f0';
      ctx.fillRect(sx + 1, py + 9, 2, 4);
      ctx.fillRect(sx + 1, py + 13, 2, 1);
    }
  }

  drawCrumble(ctx, px, py, state) {
    const T = CONFIG.TILE;
    if (state && state.state === 'gone') {
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = '#b08c5c';
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
      ctx.globalAlpha = 1;
      return;
    }
    const x = px + (state ? Math.round(Math.sin(this.clock * 70)) : 0);
    if (this.extraSheet && Sprites.drawFrame(ctx, this.extraSheet, TILE_EXTRA.CRUMBLE, x, py, false)) return;
    if (this.fullSheet && !this.extraSheet && Sprites.drawFrame(ctx, this.sheet, TILESET.CRUMBLE, x, py, false)) return;
    ctx.fillStyle = '#9c7a4f';
    ctx.fillRect(x, py, T, T);
    ctx.fillStyle = '#c9a46e';
    ctx.fillRect(x, py, T, 2);
    ctx.fillStyle = '#5c4630';
    ctx.fillRect(x + 4, py + 2, 1, 6);
    ctx.fillRect(x + 5, py + 8, 1, 4);
    ctx.fillRect(x + 11, py + 4, 1, 7);
  }

  drawArenaWall(ctx, px, py) {
    const T = CONFIG.TILE;
    if (this.arenaActive) {
      if (!Sprites.drawFrame(ctx, 'muro_arena', 0, px, py, false)) {
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(px, py, T, T);
        ctx.fillStyle = 'rgba(46, 42, 71, 0.5)';
        ctx.fillRect(px, py + 7, T, 1);
        ctx.fillRect(px + 7, py, 1, 7);
      }
    } else {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#ff4d3a';
      ctx.fillRect(px + 7, py, 2, T);
      ctx.globalAlpha = 1;
    }
  }

  drawCracked(ctx, px, py) {
    if (Sprites.drawFrame(ctx, 'muro_grieta', 0, px, py, false)) return;
    const T = CONFIG.TILE;
    ctx.fillStyle = '#6d6a8a';
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = '#8a87a8';
    ctx.fillRect(px, py, T, 2);
    ctx.fillStyle = '#3a3850';
    ctx.fillRect(px + 3, py + 3, 1, 4);
    ctx.fillRect(px + 4, py + 7, 3, 1);
    ctx.fillRect(px + 7, py + 8, 1, 4);
    ctx.fillRect(px + 11, py + 2, 1, 5);
    ctx.fillRect(px + 10, py + 7, 3, 1);
  }

  // Marca de la plataforma de paso sobre el dibujo de la hoja: puntitos debajo
  drawPassMark(ctx, px, py) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(px, py, 16, 1);
    ctx.fillStyle = 'rgba(255, 211, 77, 0.6)';
    for (let i = 2; i < 16; i += 4) ctx.fillRect(px + i, py + 9, 2, 1);
  }

  // Puente colgante: tablas con cuerdas que se mecen un poco (se atraviesa desde abajo)
  drawBridge(ctx, tx, ty, px, py) {
    // Cuadro 1: el tramo balanceándose (baja un poco)
    if (Sprites.drawFrame(ctx, 'puente', Math.sin(this.clock * 2 + tx * 0.6) > 0.5 ? 1 : 0, px, py, false)) return;
    const sag = Math.round(Math.sin(this.clock * 2 + tx * 0.6) * 0.6);
    const y = py + sag;
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(px, y, 16, 1);
    ctx.fillStyle = '#c98a3a';
    ctx.fillRect(px + 1, y + 2, 6, 3);
    ctx.fillRect(px + 9, y + 2, 6, 3);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(px + 1, y + 4, 6, 1);
    ctx.fillRect(px + 9, y + 4, 6, 1);
    ctx.fillStyle = '#e8c58e';
    ctx.fillRect(px, y + 1, 16, 1);
  }

  // Suelo agrietado: se rompe con el zapateo (abajo + salto en el aire)
  drawCrackedFloor(ctx, tx, ty, px, py) {
    if (Sprites.drawFrame(ctx, 'suelo_grieta', 0, px, py, false)) return;
    const P = this.palette();
    ctx.fillStyle = P.brick;
    ctx.fillRect(px, py, 16, 16);
    ctx.fillStyle = 'rgba(46, 42, 71, 0.35)';
    ctx.fillRect(px, py + 12, 16, 4);
    ctx.strokeStyle = '#2e2a47';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const s = (tx * 5 + ty * 3) % 4;
    ctx.moveTo(px + 2 + s, py);
    ctx.lineTo(px + 6, py + 5);
    ctx.lineTo(px + 4 + s, py + 9);
    ctx.lineTo(px + 8, py + 16);
    ctx.moveTo(px + 6, py + 5);
    ctx.lineTo(px + 12, py + 7);
    ctx.lineTo(px + 15, py + 3);
    ctx.stroke();
    // Flechita hacia abajo (pista del zapateo)
    ctx.fillStyle = 'rgba(255, 211, 77, 0.55)';
    ctx.fillRect(px + 7, py + 9, 2, 3);
    ctx.fillRect(px + 6, py + 12, 4, 1);
    ctx.fillRect(px + 7, py + 13, 2, 1);
  }

  drawGate(ctx, px, py) {
    const T = CONFIG.TILE;
    // Al abrirse con la llave del jefe: los barrotes suben temblando y sueltan polvo
    if (this.gateAnim > 0) {
      const k = 1 - this.gateAnim / CONFIG.CAMERA_PAN.GATE_TIME;
      const shake = Math.round(Math.sin(this.clock * 60) * (1 - k) * 1.5);
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, T, T);
      ctx.clip();
      ctx.translate(shake, -Math.round(k * T));
      if (!Sprites.drawFrame(ctx, 'porton', 0, px, py, false)) {
        ctx.fillStyle = '#3a2a4a';
        ctx.fillRect(px, py, T, T);
        ctx.fillStyle = '#e9c46a';
        for (let x = 1; x < T; x += 5) ctx.fillRect(px + x, py, 2, T);
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(233, 196, 106, ' + (0.5 * (1 - k)) + ')';
      ctx.fillRect(px - 1, py + T - 3, T + 2, 3);
      return;
    }
    const open = this.gateOpen && !this.arenaActive;
    if (Sprites.drawFrame(ctx, 'porton', open ? 2 : 0, px, py, false)) return;
    if (open) {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(px, py, T, 2);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.fillStyle = '#3a2a4a';
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = '#e9c46a';
    for (let x = 1; x < T; x += 5) ctx.fillRect(px + x, py, 2, T);
    ctx.fillStyle = '#c98a3a';
    ctx.fillRect(px, py + 6, T, 2);
  }

  drawConveyor(ctx, px, py, dir) {
    if (Sprites.drawFrame(ctx, 'cinta', Sprites.frameAt('cinta', this.clock), px, py, dir < 0)) return;
    const T = CONFIG.TILE;
    ctx.fillStyle = '#4a4a58';
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = '#8a8a96';
    ctx.fillRect(px, py, T, 4);
    ctx.fillStyle = '#ffd34d';
    const shift = Math.floor(this.clock * CONFIG.HAZARDS.CONVEYOR_SPEED) % 4;
    for (let i = 0; i < T; i += 4) {
      const mx = dir > 0 ? (i + shift) % T : (i - shift + T) % T;
      ctx.fillRect(px + mx, py + 1, 2, 2);
    }
  }

  // Barro: tierra oscura y húmeda, con burbujas que suben en la superficie
  drawMud(ctx, tx, ty, px, py) {
    const T = CONFIG.TILE;
    if (Sprites.drawFrame(ctx, 'tiles_barro', (tx + ty) % 2, px, py, false)) return;
    const top = this.tileAt(tx, ty - 1) !== 'z' && !FULL_SOLID.includes(this.tileAt(tx, ty - 1));
    ctx.fillStyle = '#5a4128';
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = '#4a3420';
    ctx.fillRect(px + (tx * 5) % 9, py + 7, 4, 2);
    ctx.fillRect(px + (tx * 3 + 6) % 11, py + 12, 3, 1);
    if (top) {
      ctx.fillStyle = '#7a5a36';
      ctx.fillRect(px, py, T, 3);
      ctx.fillStyle = '#2e2a47';
      ctx.fillRect(px, py, T, 1);
      const b = (this.clock * 0.7 + tx * 0.37) % 1;
      if (b < 0.25) {
        ctx.fillStyle = 'rgba(200, 180, 140, 0.7)';
        ctx.fillRect(px + 5 + (tx % 3) * 2, py - Math.round(b * 8), 2, 2);
      }
    }
  }

  // Muros del diapasón: piedra con la horquilla, teñida del color de su nota.
  // Los de las notas blue (bemoles) llevan además una fila de rombos
  drawTuneWall(ctx, tx, ty, px, py, note) {
    const T = CONFIG.TILE;
    const shake = this.tuneShake[tx + ',' + ty] ? Math.round(Math.sin(this.clock * 70) * 1.5) : 0;
    const x = px + shake;
    const def = CONFIG.TUNER.NOTES[note];
    // Si la hoja trae un dibujo por nota (7 cuadros: La, Si, Do... Sol), cada nota usa
    // el suyo (los bemoles, el de su nota natural); si no, todas usan el cuadro 0
    const order = CONFIG.TUNER.ORDER;
    const frame = Sprites.frames('muro_nota') >= order.length ? order.indexOf(def.flatOf || note) : 0;
    if (Sprites.drawFrame(ctx, 'muro_nota', frame, x, py, false, def.color, 0.6)) {
      if (def.flatOf) this.drawFlatMark(ctx, x, py);
      return;
    }
    const color = def.color;
    ctx.fillStyle = color;
    ctx.fillRect(x, py, T, T);
    ctx.fillStyle = 'rgba(46, 42, 71, 0.35)';
    ctx.fillRect(x, py + 7, T, 1);
    ctx.fillRect(x + (ty % 2 ? 5 : 10), py, 1, 7);
    ctx.fillRect(x + (ty % 2 ? 10 : 5), py + 8, 1, 8);
    // Horquilla (letra de la nota) que late con el pulso
    const glow = 0.55 + Math.sin(this.clock * 4 + tx) * 0.25;
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#fbf6ec';
    ctx.fillRect(x + 5, py + 4, 1, 5);
    ctx.fillRect(x + 10, py + 4, 1, 5);
    ctx.fillRect(x + 5, py + 9, 6, 1);
    ctx.fillRect(x + 7, py + 10, 2, 3);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(x, py, T, 1);
    ctx.fillRect(x, py + T - 1, T, 1);
    if (def.flatOf) this.drawFlatMark(ctx, x, py);
  }

  // Marca de las notas blue: rombos oscuros en la mitad de abajo del muro
  drawFlatMark(ctx, x, py) {
    ctx.fillStyle = 'rgba(27, 20, 38, 0.7)';
    [3, 8, 13].forEach(function (cx) {
      ctx.fillRect(x + cx - 1, py + 11, 3, 1);
      ctx.fillRect(x + cx, py + 10, 1, 3);
    });
  }

  // Piedra que se hunde: piedra plana con musgo (o la balsa de juncos del lago)
  drawSinker(ctx, m) {
    const T = CONFIG.TILE;
    for (let x = 0; x < m.w; x += T) {
      const px = Math.round(m.x + x);
      const py = Math.round(m.y);
      if (Sprites.drawFrame(ctx, 'piedra_hunde', 0, px, py, false)) continue;
      ctx.fillStyle = '#8a8a6a';
      ctx.fillRect(px, py, T, 7);
      ctx.fillStyle = '#6a8a4a';
      ctx.fillRect(px + 2, py, T - 4, 2);
      ctx.fillStyle = '#2e2a47';
      ctx.fillRect(px, py + 7, T, 1);
      if (m.loaded) {
        ctx.fillStyle = 'rgba(200, 220, 255, 0.6)';
        ctx.fillRect(px + 1, py + 8, 2, 1);
        ctx.fillRect(px + T - 4, py + 8, 2, 1);
      }
    }
  }

  drawMoverFallback(ctx, x, y, lift) {
    const T = CONFIG.TILE;
    ctx.fillStyle = lift ? '#6fa8c7' : '#e9c46a';
    ctx.fillRect(Math.round(x), Math.round(y), T, 6);
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(Math.round(x), Math.round(y) + 6, T, 1);
    ctx.fillRect(Math.round(x) + 7, Math.round(y) + 2, 2, 2);
  }

  // Sello de poder: bloque de piedra con el símbolo del poder en el centro.
  // Con el poder brilla y no bloquea (lo abre el juego con polvo)
  drawSeal(ctx, tx, ty, px, py) {
    const T = CONFIG.TILE;
    const seal = this.sealAt(tx, ty);
    const open = this.sealOpen(tx, ty);
    if (open && seal && seal.dust) return;
    if (!Sprites.drawFrame(ctx, 'sello_poder', open ? 1 : 0, px, py, false)) {
      ctx.fillStyle = open ? '#c9b8e3' : '#8a87a8';
      ctx.fillRect(px, py, T, T);
      ctx.fillStyle = '#2e2a47';
      ctx.fillRect(px, py, T, 1);
      ctx.fillRect(px, py + T - 1, T, 1);
      ctx.fillStyle = '#5b5478';
      ctx.fillRect(px + 4, py + 4, 8, 8);
    }
    if (seal) PowerIcons.draw(ctx, seal.power, px + 8, py + 8, 9, !open);
  }

  drawColorDoor(ctx, tx, ty, px, py) {
    const T = CONFIG.TILE;
    const d = this.doorAt(tx, ty);
    if (!d || !d.top) return;
    const open = this.doorOpen(tx, ty);
    const k = WORLD.keyIndex(d.color);
    const info = WORLD.keyInfo(d.color);
    const color = info ? info.color : '#9fd3e0';
    // El dibujo viene en crudo: cerrada, cuadro 0 teñido del color de su llave;
    // abierta, el último cuadro si la hoja tiene más de uno (si no, el marco de abajo)
    const frames = Sprites.frames('puerta_color');
    if (!open && Sprites.drawFrame(ctx, 'puerta_color', 0, px, py, false, color, 0.6)) return;
    if (open && frames > 1 && Sprites.drawFrame(ctx, 'puerta_color', frames - 1, px, py, false)) return;
    if (open) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = color;
      ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T * 2 - 1);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.fillStyle = '#5b5478';
    ctx.fillRect(px, py, T, T * 2);
    ctx.fillStyle = color;
    ctx.fillRect(px + 3, py + 3, T - 6, T * 2 - 6);
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(px + 6, py + 13, 4, 6);
    ctx.fillRect(px + 7, py + 11, 2, 2);
    ctx.fillStyle = '#fbf6ec';
    ctx.fillRect(px + 4, py + 4, 2, 4);
  }

  drawRayEmitter(ctx, px, py) {
    ctx.fillStyle = '#5b5478';
    ctx.fillRect(px + 3, py, 10, 4);
    ctx.fillStyle = this.rayOn() ? CONFIG.RAYO.COLOR : '#8a87a8';
    ctx.fillRect(px + 6, py + 3, 4, 2);
  }

  drawRays(ctx) {
    if (!this.rays.length) return;
    const T = CONFIG.TILE;
    const on = this.rayOn();
    const phase = this.beatPhase();
    this.rays.forEach(function (r) {
      const x = r.tx * T;
      const y = r.ty * T + 4;
      const h = r.len * T - 4;
      if (!on) {
        // Aviso: la línea parpadea antes de prenderse
        if (phase > 0.6) {
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = CONFIG.RAYO.COLOR;
          ctx.fillRect(x + 7, y, 2, h);
          ctx.globalAlpha = 1;
        }
        return;
      }
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = CONFIG.RAYO.COLOR;
      ctx.fillRect(x + 3, y, 10, h);
      ctx.globalAlpha = 0.9;
      ctx.fillRect(x + 6, y, 4, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 7, y, 2, h);
      ctx.globalAlpha = 1;
    });
  }

  // Paso a una sala que todavía no se construye: rejas con un cartel
  drawBlockedExit(ctx, px, py) {
    const T = CONFIG.TILE;
    ctx.fillStyle = 'rgba(46, 42, 71, 0.75)';
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = '#e9c46a';
    ctx.fillRect(px + 2, py, 2, T);
    ctx.fillRect(px + 9, py, 2, T);
    ctx.fillRect(px, py + 6, T, 2);
  }
}

// Símbolos de los poderes (poderes.png, en el orden del catálogo). Sin el
// sprite, un círculo del color del poder con una marca simple
const PowerIcons = {
  draw(ctx, powerId, cx, cy, size, gray) {
    const i = WORLD.powerIndex(powerId);
    const p = WORLD.power(powerId);
    if (i < 0) return;
    if (Sprites.has('poderes') && i < Sprites.frames('poderes')) {
      ctx.save();
      ctx.translate(cx, cy);
      const k = size / 16;
      ctx.scale(k, k);
      ctx.globalAlpha = gray ? 0.55 : 1;
      Sprites.drawFrame(ctx, 'poderes', i, -8, -8, false, gray ? '#8a87a8' : null, gray ? 0.8 : 0);
      ctx.globalAlpha = 1;
      ctx.restore();
      return;
    }
    const r = size / 2;
    ctx.fillStyle = gray ? '#9a93b0' : p.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2e2a47';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#2e2a47';
    ctx.font = gameFont(Math.max(5, Math.round(size * 0.6)));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tr(p.nombre)[0], cx + 0.5, cy + 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }
};
