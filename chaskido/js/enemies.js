// Enemigos comunes. Todos se derrotan pisándoles la cabeza (o con el ají) y
// sueltan monedas. Reaparecen al rato fuera de la cámara (hasta 5 veces).
// Los que están dentro de la arena de un jefe esperan escondidos la pelea.
//
// Formas de moverse (move):
//   walk    camina y se da vuelta en bordes y paredes (escarabajo, oruga, barrendero)
//   cuy     patrulla; si te ve, sale un "!" y corre hacia ti
//   still   quieto, dispara semillas hacia la papa (disparador)
//   swoop   vuela de lado a lado y baja en picada si pasas debajo (paloma de lata)
//   dart    revolotea y se lanza hacia la papa (colibrí relámpago)
//   throw   cuelga de lo alto y tira frutos en arco (mono de las cañas)

const ENEMY_TYPES = {
  beetle:     { w: 14, h: 11, move: 'walk', speed: 25, walk: 'escarabajo_caminar', squash: 'escarabajo_aplastado', color: '#3a6fd1' },
  cuy:        { w: 14, h: 11, move: 'cuy', speed: 35, walk: 'cuy_caminar', alert: 'cuy_alerta', run: 'cuy_correr', squash: 'cuy_aplastado', color: '#c8955a' },
  shooter:    { w: 13, h: 13, move: 'still', still: true, walk: 'disparador_quieto', charge: 'disparador_carga', squash: 'disparador_aplastado', color: '#9be36b' },
  oruga:      { w: 14, h: 9,  move: 'walk', speed: 15, walk: 'oruga_caminar', squash: 'oruga_aplastada', color: '#8fd16b' },
  barrendero: { w: 14, h: 14, move: 'walk', speed: 22, pushes: true, walk: 'barrendero_caminar', act: 'barrendero_barrer', squash: 'barrendero_aplastado', color: '#b0b8c4' },
  paloma:     { w: 14, h: 10, move: 'swoop', flies: true, speed: 40, walk: 'paloma_volar', act: 'paloma_picada', squash: 'paloma_aplastada', color: '#9aa3b5' },
  colibri:    { w: 12, h: 10, move: 'dart', flies: true, walk: 'colibri_volar', act: 'colibri_picada', squash: 'colibri_aplastado', color: '#5ce0c8' },
  mono:       { w: 14, h: 14, move: 'throw', flies: true, walk: 'mono_colgar', act: 'mono_lanzar', squash: 'mono_aplastado', color: '#a8794a' }
};

class Enemy {
  constructor(type, tx, ty) {
    const T = CONFIG.TILE;
    this.type = ENEMY_TYPES[type] ? type : 'beetle';
    this.def = ENEMY_TYPES[this.type];
    this.w = this.def.w;
    this.h = this.def.h;
    this.spawnX = tx * T + (T - this.w) / 2;
    // Los que vuelan aparecen en medio de su celda; el mono, colgado arriba
    this.spawnY = this.def.move === 'throw' ? ty * T + 1
      : this.def.flies ? ty * T + (T - this.h) / 2 : (ty + 1) * T - this.h;
    this.inArena = false;
    this.respawns = 0;
    this.reset();
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.dir = -1;
    this.state = this.inArena ? 'hidden' : 'walk';  // hidden, walk, alert, chase, act, back, squashed, dead
    this.timer = 0;
    this.lostTime = 0;
    this.deadTime = 0;
    this.dropReady = false;
    this.animTime = Math.random();
    this.shootTimer = CONFIG.ENEMIES.SHOOT_EVERY * (0.5 + Math.random() * 0.5);
    this.actTimer = 1.5 + Math.random() * 1.5;
    this.wantsShot = null;   // aviso a Enemies: { kind, ... } para crear un proyectil
    this.wantsShove = false; // aviso al juego: el barrendero empujó a la papa
  }

  isAlive() {
    return this.state !== 'hidden' && this.state !== 'squashed' && this.state !== 'dead';
  }

  appear() {
    this.reset();
    this.state = 'walk';
    Effects.play('poof', this.x + this.w / 2, this.y + this.h / 2);
  }

  // ---------- Actualización ----------

  update(dt, level, player) {
    this.animTime += dt;
    if (this.state === 'hidden') return;
    if (this.state === 'dead') {
      this.deadTime += dt;
      return;
    }
    if (this.state === 'squashed') {
      this.timer -= dt;
      if (this.def.flies) this.fall(dt, level);
      if (this.timer <= 0) {
        this.state = 'dead';
        this.dropReady = true;
        Effects.play('poof', this.x + this.w / 2, this.y + this.h / 2);
      }
      return;
    }
    const m = this.def.move;
    if (m === 'cuy') this.think(dt, level, player);
    if (m === 'still') this.aim(dt, player);
    if (m === 'swoop') return this.swoop(dt, level, player);
    if (m === 'dart') return this.dart(dt, level, player);
    if (m === 'throw') return this.throwFruit(dt, player);
    if (this.def.pushes) this.sweep(dt, player);
    this.walk(dt, level);
  }

  // Distancia en bloques al centro de la papa
  dist(player) {
    const T = CONFIG.TILE;
    return {
      dx: (player.x + player.w / 2 - (this.x + this.w / 2)) / T,
      dy: (player.y + player.h / 2 - (this.y + this.h / 2)) / T
    };
  }

  // Disparador: mira hacia la papa y, si está cerca, dispara cada SHOOT_EVERY segundos
  aim(dt, player) {
    const E = CONFIG.ENEMIES;
    const d = this.dist(player);
    this.dir = d.dx < 0 ? -1 : 1;
    if (Math.abs(d.dx) > E.SHOOT_RANGE_X || Math.abs(d.dy) > E.SHOOT_RANGE_Y) return;
    this.shootTimer -= dt;
    if (this.shootTimer > 0) return;
    this.shootTimer = E.SHOOT_EVERY;
    this.wantsShot = { kind: 'seed' };
  }

  charging() {
    return this.def.still && this.isAlive() && this.shootTimer < CONFIG.ENEMIES.SHOOT_WINDUP;
  }

  // Barrendero: si la papa está delante y cerca, se para y barre (la empuja)
  sweep(dt, player) {
    const d = this.dist(player);
    if (this.state === 'act') {
      this.timer -= dt;
      if (this.timer < 0.3 && !this.swept && Math.abs(d.dx) < 1.8 && Math.abs(d.dy) < 1.2) {
        this.swept = true;
        this.wantsShove = true;
      }
      if (this.timer <= 0) this.state = 'walk';
      return;
    }
    this.actTimer -= dt;
    if (this.actTimer <= 0 && Math.abs(d.dx) < 1.6 && Math.abs(d.dy) < 1 && Math.sign(d.dx) === this.dir) {
      this.state = 'act';
      this.timer = 0.5;
      this.swept = false;
      this.actTimer = 1.2;
    }
  }

  // Cuy: patrulla, se alerta o persigue
  think(dt, level, player) {
    const E = CONFIG.ENEMIES;
    const sees = this.canSee(level, player);
    if (this.state === 'walk' && sees) {
      this.state = 'alert';
      this.timer = E.CUY_ALERT_TIME;
      Sfx.play('alert');
    } else if (this.state === 'alert') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.state = 'chase';
        this.lostTime = 0;
      }
    } else if (this.state === 'chase') {
      const px = player.x + player.w / 2;
      this.dir = px < this.x + this.w / 2 ? -1 : 1;
      this.lostTime = sees ? 0 : this.lostTime + dt;
      if (this.lostTime > E.CUY_GIVE_UP) this.state = 'walk';
    }
  }

  canSee(level, player) {
    const T = CONFIG.TILE;
    const E = CONFIG.ENEMIES;
    const myX = this.x + this.w / 2;
    const myY = this.y + this.h / 2;
    const dx = player.x + player.w / 2 - myX;
    const dy = player.y + player.h / 2 - myY;
    if (Math.abs(dy) > T) return false;
    if (Math.abs(dx) > E.CUY_VISION * T) return false;
    if (this.state !== 'chase' && Math.sign(dx) !== this.dir) return false;
    const ty = Math.floor(myY / T);
    const from = Math.floor(Math.min(myX, myX + dx) / T);
    const to = Math.floor(Math.max(myX, myX + dx) / T);
    for (let tx = from; tx <= to; tx++) {
      if (level.solidBox(tx, ty)) return false;
    }
    return true;
  }

  speed() {
    const E = CONFIG.ENEMIES;
    if (this.def.still || this.state === 'act') return 0;
    if (this.def.move !== 'cuy') return this.def.speed;
    if (this.state === 'alert') return 0;
    if (this.state === 'chase') return E.CUY_SPEED * E.CUY_CHASE_MULT;
    return E.CUY_SPEED;
  }

  walk(dt, level) {
    const E = CONFIG.ENEMIES;
    this.vx = this.dir * this.speed();
    if (this.vx !== 0 && this.blockedAhead(level)) {
      if (this.state === 'chase') this.vx = 0;
      else this.dir = -this.dir;
    }
    this.x += this.vx * dt;
    this.fall(dt, level);
  }

  fall(dt, level) {
    const E = CONFIG.ENEMIES;
    this.vy = Math.min(this.vy + E.GRAVITY * dt, CONFIG.PLAYER.MAX_FALL);
    this.y += this.vy * dt;
    const boxes = level.solidBoxesIn(this.x, this.y, this.w, this.h);
    if (boxes.length > 0 && this.vy > 0) {
      this.y = Math.min.apply(null, boxes.map(function (b) { return b.y; })) - this.h;
      this.vy = 0;
    }
    if (this.y > level.pxH + 32) this.state = 'dead';
  }

  blockedAhead(level) {
    const front = this.dir > 0 ? this.x + this.w : this.x - 1;
    const wall = level.rectHitsSolid(front, this.y, 1, this.h - 1);
    const floor = level.rectHitsSolid(front, this.y + this.h + 1, 1, 1);
    return wall || (this.vy === 0 && !floor);
  }

  // Paloma: vuela de lado a lado (4 bloques). Si la papa pasa debajo, avisa ("!"),
  // baja en picada y después descansa. En las primeras zonas es tranquila
  // (CONFIG.PALOMA.CALM); más adelante, más rápida (CONFIG.PALOMA.ANGRY).
  swoop(dt, level, player) {
    const T = CONFIG.TILE;
    const P = this.calm ? CONFIG.PALOMA.CALM : CONFIG.PALOMA.ANGRY;
    const d = this.dist(player);
    this.rest = Math.max(0, (this.rest || 0) - dt);
    if (this.state === 'walk') {
      this.x += this.dir * this.def.speed * dt;
      if (Math.abs(this.x - this.spawnX) > 4 * T || level.rectHitsSolid(this.x + this.dir * 2, this.y, this.w, this.h)) {
        this.dir = this.x > this.spawnX ? -1 : 1;
      }
      this.y = this.spawnY + Math.sin(this.animTime * 3) * 2;
      if (this.rest <= 0 && Math.abs(d.dx) < P.RANGE && d.dy > 1 && d.dy < P.DEPTH) {
        this.state = 'alert';
        this.timer = P.WARN;
        Sfx.play('alert');
      }
    } else if (this.state === 'alert') {
      // Aleteo en el lugar: da tiempo para apartarse
      this.timer -= dt;
      this.y = this.spawnY + Math.sin(this.animTime * 20) * 1.5;
      if (this.timer <= 0) {
        const len = Math.sqrt(d.dx * d.dx + d.dy * d.dy) || 1;
        this.vx = d.dx / len * P.SPEED;
        this.vy = d.dy / len * P.SPEED;
        this.state = 'act';
        this.timer = P.DIVE_TIME;
      }
    } else if (this.state === 'act') {
      this.timer -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.timer <= 0 || level.rectHitsSolid(this.x, this.y, this.w, this.h)) {
        this.x -= this.vx * dt;
        this.y -= this.vy * dt;
        this.state = 'back';
      }
    } else if (this.state === 'back') {
      this.returnHome(dt, 60);
      if (this.state === 'walk') this.rest = P.REST;
    }
  }

  // Vuelve volando a su lugar
  returnHome(dt, speed) {
    const dx = this.spawnX - this.x;
    const dy = this.spawnY - this.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) {
      this.x = this.spawnX;
      this.y = this.spawnY;
      this.state = 'walk';
      return;
    }
    this.dir = dx < 0 ? -1 : 1;
    this.x += dx / len * speed * dt;
    this.y += dy / len * speed * dt;
  }

  // Colibrí: revolotea y cada tanto avisa y se lanza hacia la papa
  dart(dt, level, player) {
    const T = CONFIG.TILE;
    const d = this.dist(player);
    if (this.state === 'walk') {
      this.x = this.spawnX + Math.sin(this.animTime * 1.7) * 1.5 * T;
      this.y = this.spawnY + Math.sin(this.animTime * 4.3) * 0.6 * T;
      this.dir = d.dx < 0 ? -1 : 1;
      this.actTimer -= dt;
      if (this.actTimer <= 0 && Math.abs(d.dx) < 7 && Math.abs(d.dy) < 5) {
        this.state = 'alert';
        this.timer = 0.4;
      }
    } else if (this.state === 'alert') {
      this.timer -= dt;
      if (this.timer <= 0) {
        const len = Math.sqrt(d.dx * d.dx + d.dy * d.dy) || 1;
        this.vx = d.dx / len * 200;
        this.vy = d.dy / len * 200;
        this.state = 'act';
        this.timer = 0.45;
      }
    } else if (this.state === 'act') {
      this.timer -= dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.timer <= 0 || level.rectHitsSolid(this.x, this.y, this.w, this.h)) {
        this.state = 'back';
        this.actTimer = 2.5 + Math.random();
      }
    } else if (this.state === 'back') {
      this.returnHome(dt, 70);
    }
  }

  // Mono: cuelga, mira a la papa y le tira frutos en arco
  throwFruit(dt, player) {
    const d = this.dist(player);
    this.dir = d.dx < 0 ? -1 : 1;
    if (this.state === 'act') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'walk';
      return;
    }
    this.actTimer -= dt;
    if (this.actTimer > 0 || Math.abs(d.dx) > 9 || Math.abs(d.dy) > 7) return;
    this.actTimer = 2.6;
    this.state = 'act';
    this.timer = 0.4;
    this.wantsShot = { kind: 'fruto', tx: player.x + player.w / 2, ty: player.y + player.h / 2 };
  }

  stomp() {
    this.state = 'squashed';
    this.timer = CONFIG.ENEMIES.SQUASH_TIME;
    this.vy = 0;
  }

  // ---------- Dibujo ----------

  anim() {
    const d = this.def;
    if (this.state === 'squashed') return d.squash;
    if (this.state === 'alert') return d.alert || d.walk;
    if (this.state === 'chase') return d.run || d.walk;
    if (this.state === 'act') return d.act || d.walk;
    if (this.def.still && this.charging()) return d.charge;
    return d.walk;
  }

  draw(ctx) {
    if (this.state === 'dead' || this.state === 'hidden') return;
    const name = this.anim();
    const s = SPRITES[name];
    const flip = this.dir < 0;
    const ok = s && Sprites.drawFrame(ctx, name, Sprites.frameAt(name, this.animTime),
      this.x + this.w / 2 - s.fw / 2, this.y + this.h - s.fh + (this.def.flies ? (s.fh - this.h) / 2 : 0), flip);
    if (!ok) this.drawFallback(ctx);
    // "!" cuando te ve (cuy) o antes de lanzarse (colibrí)
    if (this.state === 'alert') {
      const x = Math.round(this.x + this.w / 2) - 1;
      const y = Math.round(this.y) - 12;
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(x, y, 2, 5);
      ctx.fillRect(x, y + 6, 2, 2);
    }
  }

  // Dibujo simple por código (si falta el sprite)
  drawFallback(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.w;
    const h = this.h;
    const c = this.def.color;
    if (this.state === 'squashed') {
      ctx.fillStyle = c;
      ctx.fillRect(x, y + h - 4, w, 4);
      return;
    }
    const front = this.dir > 0 ? x + w - 4 : x + 1;
    switch (this.type) {
      case 'paloma':
      case 'colibri': {
        const flap = Math.floor(this.animTime * 14) % 2;
        ctx.fillStyle = c;
        ctx.fillRect(x + 2, y + 3, w - 4, h - 4);
        ctx.fillStyle = '#fbf6ec';
        ctx.fillRect(x + 3, y + (flap ? 0 : 5), w - 6, 2);
        ctx.fillStyle = '#e9c46a';
        ctx.fillRect(this.dir > 0 ? x + w - 1 : x - 1, y + 5, 2, 1);
        break;
      }
      case 'mono':
        ctx.fillStyle = '#5e8c6a';
        ctx.fillRect(x + 6, y - 1, 2, 4);
        ctx.fillStyle = c;
        ctx.fillRect(x + 1, y + 3, w - 2, h - 3);
        ctx.fillStyle = '#f3e3c3';
        ctx.fillRect(front - 1, y + 5, 4, 4);
        break;
      case 'barrendero':
        ctx.fillStyle = c;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 2);
        ctx.fillStyle = '#e9c46a';
        ctx.fillRect(this.dir > 0 ? x + w : x - 4, y + h - 3 - (this.state === 'act' ? 2 : 0), 4, 3);
        ctx.fillStyle = '#9fd3e0';
        ctx.fillRect(front, y + 4, 3, 2);
        break;
      case 'shooter': {
        const grow = this.charging() ? 1 : 0;
        ctx.fillStyle = '#4f8f3a';
        ctx.fillRect(x - grow, y + 2 - grow, w + grow * 2, h - 2 + grow);
        ctx.fillStyle = c;
        ctx.fillRect(x + 2, y + 3 - grow, w - 4, 3);
        ctx.fillStyle = '#1b1035';
        ctx.fillRect(this.dir > 0 ? x + w - 4 : x, y + 6, 4, 3);
        break;
      }
      default:
        ctx.fillStyle = c;
        ctx.fillRect(x, y + 2, w, h - 2);
        ctx.fillStyle = '#fbf6ec';
        ctx.fillRect(front, y + 3, 2, 2);
    }
    ctx.strokeStyle = 'rgba(46, 42, 71, 0.8)';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}

// Proyectiles de los enemigos: semillas (rectas) y frutos (en arco)
class Shots {
  constructor() {
    this.list = [];
  }

  fire(e, info) {
    const E = CONFIG.ENEMIES;
    if (info.kind === 'fruto') {
      const t = 1;
      const g = 500;
      const sx = e.x + e.w / 2 - 4;
      const sy = e.y + e.h;
      this.list.push({ x: sx, y: sy, w: 8, h: 8, vx: (info.tx - sx) / t, vy: (info.ty - sy) / t - g * t / 2,
                       g: g, life: 3, kind: 'fruto' });
      return;
    }
    this.list.push({ x: e.dir > 0 ? e.x + e.w : e.x - 4, y: e.y + 6, w: 4, h: 3,
                     vx: e.dir * E.SHOT_SPEED, vy: 0, g: 0, life: E.SHOT_LIFE, kind: 'seed' });
  }

  update(dt, level) {
    this.list.forEach(function (s) {
      s.life -= dt;
      s.vy += s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (level.rectHitsSolid(s.x, s.y, s.w, s.h)) s.life = 0;
    });
    this.list = this.list.filter(function (s) { return s.life > 0; });
  }

  hit(player) {
    const s = this.list.find(function (shot) { return overlaps(shot, player); });
    if (s) s.life = 0;
    return s || null;
  }

  draw(ctx) {
    this.list.forEach(function (s) {
      const name = s.kind === 'fruto' ? 'fruto' : 'semilla';
      if (Sprites.drawAnchored(ctx, name, Sprites.frameAt(name, s.life), s.x + s.w / 2, s.y + s.h / 2 + 8, s.vx < 0)) return;
      const x = Math.round(s.x);
      const y = Math.round(s.y);
      ctx.fillStyle = s.kind === 'fruto' ? '#e07a8f' : '#8a5a2b';
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = s.kind === 'fruto' ? '#5e8c6a' : '#e0b060';
      ctx.fillRect(x + 1, y, 2, 1);
    });
  }
}

class Enemies {
  constructor(level) {
    this.list = level.enemySpawns.map(function (s) {
      const e = new Enemy(s.type, s.tx, s.ty);
      e.inArena = level.insideArena(e);
      e.calm = (level.region || 1) <= CONFIG.PALOMA.CALM_UNTIL_REGION;
      e.reset();
      return e;
    });
    this.shots = new Shots();
  }

  update(dt, level, player, camera) {
    this.list.forEach(function (e) {
      e.update(dt, level, player);
      if (e.wantsShot) {
        this.shots.fire(e, e.wantsShot);
        e.wantsShot = null;
      }
      if (this.canRespawn(e, camera)) {
        e.respawns++;
        e.reset();
      }
    }, this);
    this.shots.update(dt, level);
  }

  canRespawn(e, camera) {
    if (e.inArena || e.state !== 'dead') return false;
    if (e.respawns >= CONFIG.ENEMIES.MAX_RESPAWNS) return false;
    if (e.deadTime < CONFIG.ENEMIES.RESPAWN_TIME) return false;
    const T = CONFIG.TILE;
    const view = { x: camera.x - T, y: camera.y - T, w: CONFIG.WIDTH + T * 2, h: CONFIG.HEIGHT + T * 2 };
    return !overlaps({ x: e.spawnX, y: e.spawnY, w: e.w, h: e.h }, view);
  }

  takeDrops() {
    const ready = this.list.filter(function (e) { return e.dropReady; });
    ready.forEach(function (e) { e.dropReady = false; });
    return ready;
  }

  // Barrenderos que acaban de barrer a la papa (se avisa una vez)
  takeShoves() {
    const list = this.list.filter(function (e) { return e.wantsShove; });
    list.forEach(function (e) { e.wantsShove = false; });
    return list;
  }

  alive() {
    return this.list.filter(function (e) { return e.isAlive(); });
  }

  arenaList() {
    return this.list.filter(function (e) { return e.inArena; });
  }

  hasArenaEnemies() {
    return this.arenaList().length > 0;
  }

  showArena() {
    this.arenaList().forEach(function (e) { e.appear(); });
  }

  arenaCleared() {
    return this.arenaList().every(function (e) { return e.state === 'dead'; });
  }

  resetArena() {
    this.arenaList().forEach(function (e) { e.reset(); });
  }

  draw(ctx) {
    this.list.forEach(function (e) { e.draw(ctx); });
    this.shots.draw(ctx);
  }
}

// Monedas que sueltan los enemigos: saltan, caen al suelo y desaparecen al rato
class Drops {
  constructor() {
    this.list = [];
  }

  clear() {
    this.list = [];
  }

  spawn(x, y, count) {
    const M = CONFIG.COINS;
    for (let i = 0; i < count; i++) {
      const side = count > 1 ? (i / (count - 1)) * 2 - 1 : (Math.random() * 2 - 1);
      this.list.push({ x: x - 3, y: y - 4, w: 6, h: 6,
                       vx: side * M.POP_X, vy: -M.POP_Y, life: M.LIFE, age: 0, onGround: false });
    }
  }

  update(dt, level) {
    const M = CONFIG.COINS;
    this.list.forEach(function (d) {
      d.life -= dt;
      d.age += dt;
      if (d.onGround) return;
      d.vy = Math.min(d.vy + M.GRAVITY * dt, CONFIG.PLAYER.MAX_FALL);
      d.x += d.vx * dt;
      if (level.rectHitsSolid(d.x, d.y, d.w, d.h)) {
        d.x -= d.vx * dt;
        d.vx = 0;
      }
      d.y += d.vy * dt;
      const boxes = level.solidBoxesIn(d.x, d.y, d.w, d.h);
      if (boxes.length > 0 && d.vy > 0) {
        d.y = Math.min.apply(null, boxes.map(function (b) { return b.y; })) - d.h;
        d.vy = 0;
        d.vx = 0;
        d.onGround = true;
      }
      if (d.y > level.pxH + 32) d.life = 0;
    });
    this.list = this.list.filter(function (d) { return d.life > 0; });
  }

  collect(player) {
    const wait = CONFIG.COINS.PICKUP_DELAY;
    const before = this.list.length;
    this.list = this.list.filter(function (d) { return d.age < wait || !overlaps(d, player); });
    return before - this.list.length;
  }

  draw(ctx, time) {
    const M = CONFIG.COINS;
    this.list.forEach(function (d) {
      if (d.life < M.BLINK && Math.floor(time * 10) % 2 === 0) return;
      Drops.drawCoin(ctx, Math.round(d.x), Math.round(d.y), time);
    });
  }

  // Moneda chica (también la usa el HUD); con sprite "moneda_chica" si está
  static drawCoin(ctx, x, y, time) {
    if (Sprites.drawFrame(ctx, 'moneda_chica', Sprites.frameAt('moneda_chica', time || 0), x - 1, y - 1, false)) return;
    const M = CONFIG.COINS;
    ctx.fillStyle = M.SHADE;
    ctx.fillRect(x, y, 6, 6);
    ctx.fillStyle = M.COLOR;
    ctx.fillRect(x + 1, y + 1, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 2, y + 2, 1, 1);
  }
}
