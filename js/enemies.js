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
//   bat     cuelga del techo; si pasas debajo, avisa, cae y sigue caminando (murciélago de cobre)
//   roll    rueda rápido de un lado a otro de su piso; el dash la rompe (rueda de piedra)
//   aim     camina lento y tira cristales en arco hacia la papa (escorpión de cristal)
//   mole    va bajo tierra y asoma bajo la papa; se pisa cuando asoma (topo taladro)
//   shell   camina con caparazón de oro: pisarlo solo lo enrolla; lo vence el zapateo (armadillo)
//   bounce  bola de fuego que salta en su lugar; no se pisa, se esquiva (brasa saltarina)
//   fox     patrulla; si te ve, avisa, corre y salta hacia ti (zorro de escarcha)
//   snowball rueda y crece; pisarla solo rebota; la rompen el dash y el zapateo (bola de nieve)
//   hop     da saltos largos en arco de un lado a otro (vizcacha de hielo)
//   hail    nube que flota y suelta granizo que rebota (nube de granizo)
//   frog    flota o espera; si te ve, avisa, salta hacia ti y estira la lengua (rana saltarina)
//   fish    nada de lado a lado en su agua; si nadas cerca, avisa y embiste; no se pisa (pez bigotón)
//   zigzag  vuela en zigzag; brilla antes de cambiar de dirección (libélula espejo)
//   heron   quieta; si pasas cerca, echa el cuello atrás y picotea adelante (garza de alambre)

const ENEMY_TYPES = {
  beetle:     { w: 14, h: 11, move: 'walk', speed: 25, walk: 'escarabajo_caminar', squash: 'escarabajo_aplastado', color: '#3a6fd1' },
  cuy:        { w: 14, h: 11, move: 'cuy', speed: 35, walk: 'cuy_caminar', alert: 'cuy_alerta', run: 'cuy_correr', squash: 'cuy_aplastado', color: '#c8955a' },
  shooter:    { w: 13, h: 13, move: 'still', still: true, walk: 'disparador_quieto', charge: 'disparador_carga', squash: 'disparador_aplastado', color: '#9be36b' },
  oruga:      { w: 14, h: 9,  move: 'walk', speed: 15, walk: 'oruga_caminar', squash: 'oruga_aplastada', color: '#8fd16b' },
  // El barrendero es un vecino (no un enemigo): barre su vereda, no daña y no se pisa
  barrendero: { w: 14, h: 14, move: 'walk', speed: 22, npc: true, walk: 'barrendero_caminar', act: 'barrendero_barrer', squash: 'barrendero_aplastado', color: '#b0b8c4' },
  paloma:     { w: 14, h: 10, move: 'swoop', flies: true, speed: 40, walk: 'paloma_volar', act: 'paloma_picada', squash: 'paloma_aplastada', color: '#9aa3b5' },
  colibri:    { w: 12, h: 10, move: 'dart', flies: true, walk: 'colibri_volar', act: 'colibri_picada', squash: 'colibri_aplastado', color: '#5ce0c8' },
  mono:       { w: 14, h: 14, move: 'throw', flies: true, walk: 'mono_colgar', act: 'mono_lanzar', squash: 'mono_aplastado', color: '#a8794a' },
  // Zona 3 · Minas de Cristal
  murcielago: { w: 14, h: 10, move: 'bat', hangs: true, speed: 18, walk: 'murcielago_colgado', act: 'murcielago_caer', run: 'murcielago_caminar', squash: 'murcielago_aplastado', color: '#b87333' },
  rueda:      { w: 14, h: 14, move: 'roll', speed: 70, dashBreaks: true, walk: 'rueda_rodar', squash: 'rueda_rota', color: '#8a8296' },
  escorpion:  { w: 16, h: 10, move: 'aim', speed: 12, walk: 'escorpion_caminar', act: 'escorpion_disparar', squash: 'escorpion_aplastado', color: '#9fe8ff' },
  topo:       { w: 14, h: 12, move: 'mole', speed: 45, walk: 'topo_asomar', act: 'topo_asomar', squash: 'topo_aplastado', color: '#7a5a48' },
  // Zona 4 · Ciudad Dorada
  armadillo:  { w: 16, h: 11, move: 'walk', speed: 20, armored: true, walk: 'armadillo_caminar', act: 'armadillo_bola', squash: 'armadillo_aplastado', color: '#c9a35b' },
  brasa:      { w: 10, h: 10, move: 'bounce', hot: true, walk: 'brasa_saltar', squash: 'brasa_saltar', color: '#ff7a3a', glow: '#ff9a3c' },
  // Zona 5 · Cumbres de Escarcha
  zorro:      { w: 16, h: 11, move: 'fox', speed: 30, walk: 'zorro_caminar', alert: 'zorro_alerta', run: 'zorro_saltar', squash: 'zorro_aplastado', color: '#ffb38a' },
  bolaNieve:  { w: 14, h: 14, move: 'snowball', speed: 55, dashBreaks: true, bouncy: true, walk: 'bola_nieve', squash: 'bola_nieve_rota', color: '#f2f6ff' },
  vizcacha:   { w: 12, h: 12, move: 'hop', walk: 'vizcacha_quieta', run: 'vizcacha_saltar', squash: 'vizcacha_aplastada', color: '#d8d0c0' },
  nubeGranizo:{ w: 22, h: 12, move: 'hail', flies: true, walk: 'nube_granizo', act: 'nube_granizo', squash: 'nube_granizo_rota', color: '#a8b8d8' },
  // Zona 6 · Lago Espejo
  rana:       { w: 14, h: 10, move: 'frog', walk: 'rana_quieta', alert: 'rana_quieta', run: 'rana_saltar', act: 'rana_lengua', squash: 'rana_aplastada', color: '#6bd17a' },
  pez:        { w: 16, h: 8,  move: 'fish', hot: true, swims: true, walk: 'pez_nadar', run: 'pez_embestir', squash: 'pez_nadar', color: '#e0a85a' },
  libelula:   { w: 14, h: 8,  move: 'zigzag', flies: true, walk: 'libelula_volar', act: 'libelula_brillo', squash: 'libelula_aplastada', color: '#c4e6ff', glow: '#c4e6ff' },
  garza:      { w: 14, h: 22, move: 'heron', walk: 'garza_quieta', alert: 'garza_quieta', act: 'garza_picar', squash: 'garza_aplastada', color: '#e6e2f0' }
};

class Enemy {
  constructor(type, tx, ty) {
    const T = CONFIG.TILE;
    this.type = ENEMY_TYPES[type] ? type : 'beetle';
    this.def = ENEMY_TYPES[this.type];
    this.w = this.hitW();
    this.h = this.hitH();
    this.spawnX = tx * T + (T - this.w) / 2;
    // Los que vuelan aparecen en medio de su celda; el mono, colgado arriba
    this.spawnY = this.def.move === 'throw' ? ty * T + 1
      : this.def.flies ? ty * T + (T - this.h) / 2 : (ty + 1) * T - this.h;
    this.inArena = false;
    this.respawns = 0;
    this.reset();
  }

  // Cuerpo de choque: el del tipo, un poco más grande para los dibujos HD (CONFIG.HD)
  hitW() {
    return Math.round(this.def.w * CONFIG.HD.ENEMY_HIT);
  }

  hitH() {
    return Math.round(this.def.h * CONFIG.HD.ENEMY_HIT);
  }

  reset() {
    this.w = this.hitW();    // la bola de nieve vuelve a su tamaño
    this.h = this.hitH();
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
    this.hanging = !!this.def.hangs;   // murciélago: colgado del techo hasta que cae
    this.buried = this.def.move === 'mole';   // topo: bajo tierra (no se lo toca)
    if (this.def.hangs) this.spawnHang();
  }

  // Murciélago: se pega al techo que tiene encima
  spawnHang() {
    const T = CONFIG.TILE;
    this.y = this.spawnY - (T - this.h);
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
    if (m === 'bat') return this.bat(dt, level, player);
    if (m === 'roll') return this.roll(dt, level);
    if (m === 'mole') return this.mole(dt, level, player);
    if (m === 'bounce') return this.bounceFire(dt, level, player);
    if (m === 'fox') return this.fox(dt, level, player);
    if (m === 'snowball') return this.snowball(dt, level);
    if (m === 'hop') return this.hop(dt, level, player);
    if (m === 'hail') return this.hail(dt, player);
    if (m === 'frog') return this.frog(dt, level, player);
    if (m === 'fish') return this.fish(dt, level, player);
    if (m === 'zigzag') return this.zigzag(dt, level, player);
    if (m === 'heron') return this.heron(dt, level, player);
    if (this.def.armored && this.state === 'act') {
      // Enrollado: se queda quieto un momento y vuelve a caminar
      this.timer -= dt;
      this.fall(dt, level);
      if (this.timer <= 0) this.state = 'walk';
      return;
    }
    if (m === 'aim') this.aimArc(dt, player);
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

  // Murciélago: colgado; si la papa pasa debajo, "!" y cae. En el suelo camina lento
  bat(dt, level, player) {
    const B = CONFIG.ENEMIES.BAT;
    if (this.hanging) {
      const d = this.dist(player);
      if (this.state === 'walk' && Math.abs(d.dx) < B.RANGE && d.dy > 0.5 && d.dy < B.DEPTH) {
        this.state = 'alert';
        this.timer = B.WARN;
        Sfx.play('alert');
      } else if (this.state === 'alert') {
        this.timer -= dt;
        if (this.timer <= 0) {
          this.state = 'act';
          this.vy = 0;
        }
      } else if (this.state === 'act') {
        this.fall(dt, level);
        if (this.vy === 0) {
          this.hanging = false;
          this.state = 'chase';
          this.dir = player.x < this.x ? -1 : 1;
        }
      }
      return;
    }
    this.walk(dt, level);
  }

  // Rueda: rueda sin parar de un lado a otro; da la vuelta en paredes y bordes
  roll(dt, level) {
    if (this.vy === 0 && this.blockedAhead(level)) this.dir = -this.dir;
    this.vx = this.dir * this.def.speed;
    this.x += this.vx * dt;
    this.fall(dt, level);
  }

  // Escorpión: camina lento y, si la papa está a tiro, tira un cristal en arco
  aimArc(dt, player) {
    const A = CONFIG.ENEMIES.SCORPION;
    const d = this.dist(player);
    if (this.state === 'act') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'walk';
      return;
    }
    this.actTimer -= dt;
    if (this.actTimer > 0 || Math.abs(d.dx) > A.RANGE_X || Math.abs(d.dy) > A.RANGE_Y) return;
    this.actTimer = A.EVERY;
    this.dir = d.dx < 0 ? -1 : 1;
    this.state = 'act';
    this.timer = 0.5;
    this.wantsShot = { kind: 'cristal', tx: player.x + player.w / 2, ty: player.y + player.h / 2 };
  }

  // Topo: bajo tierra se acerca a la papa; tiembla el suelo (aviso) y asoma un rato
  mole(dt, level, player) {
    const M = CONFIG.ENEMIES.MOLE;
    const T = CONFIG.TILE;
    const d = this.dist(player);
    if (this.buried) {
      this.timer -= dt;
      if (this.state === 'walk') {
        // Bajo tierra: se mueve hacia la papa si está cerca y en el mismo piso
        if (Math.abs(d.dx) < M.SENSE && Math.abs(d.dy) < 1.5) {
          this.dir = d.dx < 0 ? -1 : 1;
          const step = this.dir * this.def.speed * dt;
          const ahead = this.x + step + (this.dir > 0 ? this.w : 0);
          const floor = level.rectHitsSolid(ahead, this.y + this.h + 1, 1, 1);
          if (floor) this.x += step;
          if (Math.abs(d.dx) < 0.6 && this.timer <= 0) {
            this.state = 'alert';
            this.timer = M.WARN;
          }
        }
      } else if (this.state === 'alert') {
        if (this.timer <= 0) {
          this.buried = false;
          this.state = 'act';
          this.timer = M.UP_TIME;
          Effects.play('polvo', this.x + this.w / 2, this.y + this.h);
        }
      }
      return;
    }
    // Afuera: se lo puede pisar; después vuelve a esconderse
    this.timer -= dt;
    if (this.timer <= 0) {
      this.buried = true;
      this.state = 'walk';
      this.timer = M.REST;
      Effects.play('polvo', this.x + this.w / 2, this.y + this.h);
    }
  }

  stomp() {
    this.state = 'squashed';
    this.timer = CONFIG.ENEMIES.SQUASH_TIME;
    this.vy = 0;
  }

  // Brasa: salta en su lugar y se acerca un poco a la papa en cada salto
  bounceFire(dt, level, player) {
    const B = CONFIG.ENEMIES.BRASA;
    const wasUp = this.vy !== 0;
    this.fall(dt, level);
    if (this.vy === 0 && wasUp) {
      const d = this.dist(player);
      this.dir = d.dx < 0 ? -1 : 1;
      this.vy = -(this.props && this.props.salto === 'alto' ? B.HIGH_JUMP : B.JUMP) * (0.85 + Math.random() * 0.3);
      this.vx = Math.abs(d.dx) < B.SENSE ? this.dir * B.DRIFT : 0;
    } else if (this.vy === 0) {
      this.vy = -(this.props && this.props.salto === 'alto' ? B.HIGH_JUMP : B.JUMP);
    }
    const nx = this.x + this.vx * dt;
    if (!level.rectHitsSolid(nx, this.y, this.w, this.h - 1) && Math.abs(nx - this.spawnX) < B.RANGE * CONFIG.TILE) this.x = nx;
  }

  // Zorro: patrulla; si la papa está cerca y a su altura, avisa, corre y salta
  fox(dt, level, player) {
    const F = CONFIG.ENEMIES.FOX;
    const d = this.dist(player);
    if (this.state === 'walk') {
      this.walk(dt, level);
      this.actTimer -= dt;
      if (this.actTimer <= 0 && Math.abs(d.dx) < F.SENSE && Math.abs(d.dy) < 2) {
        this.dir = d.dx < 0 ? -1 : 1;
        this.state = 'alert';
        this.timer = F.WARN;
      }
      return;
    }
    if (this.state === 'alert') {
      this.timer -= dt;
      this.fall(dt, level);
      if (this.timer <= 0) {
        this.state = 'chase';
        this.vy = -F.JUMP;
        this.timer = 0.9;
      }
      return;
    }
    // chase: salto en arco hacia donde estaba la papa
    this.timer -= dt;
    const nx = this.x + this.dir * F.RUN * dt;
    if (!level.rectHitsSolid(nx, this.y, this.w, this.h - 1)) this.x = nx;
    this.fall(dt, level);
    if (this.timer <= 0 && this.vy === 0) {
      this.state = 'walk';
      this.actTimer = F.REST;
    }
  }

  // Bola de nieve: rueda de lado a lado de su piso y va creciendo hasta un máximo
  snowball(dt, level) {
    const S = CONFIG.ENEMIES.SNOWBALL;
    if (this.w < S.MAX) {
      const g = S.GROW * dt;
      this.w += g;
      this.h += g;
      this.x -= g / 2;
      this.y -= g;
    }
    this.roll(dt, level);
  }

  // Vizcacha: espera un momento y da un salto largo; se da vuelta en paredes y bordes
  hop(dt, level, player) {
    const H = CONFIG.ENEMIES.HOP;
    const wasAir = this.vy !== 0;
    if (this.vy === 0 && !wasAir) {
      this.actTimer -= dt;
      this.vx = 0;
      this.state = 'walk';
      if (this.actTimer <= 0) {
        this.actTimer = H.REST;
        if (this.blockedAhead(level)) this.dir = -this.dir;
        this.vy = -H.JUMP;
        this.vx = this.dir * H.SPEED;
        this.state = 'chase';
      }
    }
    const nx = this.x + this.vx * dt;
    if (level.rectHitsSolid(nx, this.y, this.w, this.h - 1)) {
      this.vx = 0;
      this.dir = -this.dir;
    } else {
      this.x = nx;
    }
    this.fall(dt, level);
  }

  // Nube de granizo: va y viene sobre su lugar y suelta granizo cuando la papa pasa debajo
  hail(dt, player) {
    const H = CONFIG.ENEMIES.HAIL;
    const T = CONFIG.TILE;
    this.x = this.spawnX + Math.sin(this.animTime * H.SWAY) * H.RANGE * T;
    this.y = this.spawnY + Math.sin(this.animTime * 2) * 2;
    this.actTimer -= dt;
    const d = this.dist(player);
    if (this.actTimer <= 0 && Math.abs(d.dx) < 5 && d.dy > 0) {
      this.actTimer = H.EVERY;
      this.wantsShot = { kind: 'granizo' };
      this.state = 'act';
      this.timer = 0.3;
    } else if (this.state === 'act') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'walk';
    }
  }

  // ---------- Zona 6 · Lago Espejo ----------

  // Cae como los demás, pero si cae al agua flota en la superficie (medio hundida)
  floatFall(dt, level) {
    const E = CONFIG.ENEMIES;
    const cx = this.x + this.w / 2;
    if (level.isWater(cx, this.y + this.h - 3) && this.vy >= 0) {
      this.y = level.waterSurface(cx, this.y + this.h - 3) - this.h + 4;
      this.vy = 0;
      return;
    }
    this.vy = Math.min(this.vy + E.GRAVITY * dt, CONFIG.PLAYER.MAX_FALL);
    this.y += this.vy * dt;
    if (level.isWater(cx, this.y + this.h - 3) && this.vy > 0) {
      this.y = level.waterSurface(cx, this.y + this.h - 3) - this.h + 4;
      this.vy = 0;
      return;
    }
    const boxes = level.solidBoxesIn(this.x, this.y, this.w, this.h);
    if (boxes.length > 0 && this.vy > 0) {
      this.y = Math.min.apply(null, boxes.map(function (b) { return b.y; })) - this.h;
      this.vy = 0;
    }
    if (this.y > level.pxH + 32) this.state = 'dead';
  }

  // Rana: espera (en tierra o flotando); si la papa está cerca, avisa, salta hacia
  // ella y al caer estira la lengua hacia adelante
  frog(dt, level, player) {
    const F = CONFIG.ENEMIES.FROG;
    const d = this.dist(player);
    if (this.state === 'walk') {
      this.vx = 0;
      this.floatFall(dt, level);
      this.actTimer -= dt;
      if (this.actTimer <= 0 && Math.abs(d.dx) < F.SENSE && Math.abs(d.dy) < 5) {
        this.dir = d.dx < 0 ? -1 : 1;
        this.state = 'alert';
        this.timer = F.WARN;
      }
      return;
    }
    if (this.state === 'alert') {
      this.timer -= dt;
      this.floatFall(dt, level);
      if (this.timer <= 0) {
        this.state = 'chase';
        this.vy = -F.JUMP;
        this.vx = this.dir * F.SPEED;
        this.y -= 1;
      }
      return;
    }
    if (this.state === 'chase') {
      const nx = this.x + this.vx * dt;
      if (!level.rectHitsSolid(nx, this.y, this.w, this.h - 1)) this.x = nx;
      const rising = this.vy < 0;
      this.floatFall(dt, level);
      if (!rising && this.vy === 0) {
        this.dir = d.dx < 0 ? -1 : 1;
        this.state = 'act';
        this.timer = F.TONGUE_WARN + F.TONGUE_TIME;
        Sfx.play('alert');
      }
      return;
    }
    // act: la lengua (primero se infla el buche: aviso; después sale)
    this.timer -= dt;
    this.floatFall(dt, level);
    if (this.timer <= 0) {
      this.state = 'walk';
      this.actTimer = F.REST;
    }
  }

  // Pez: nada de lado a lado sin salir de su agua; si la papa nada cerca y a su
  // altura, avisa y embiste
  fish(dt, level, player) {
    const F = CONFIG.ENEMIES.FISH;
    const d = this.dist(player);
    const speed = this.state === 'chase' ? F.CHARGE : this.state === 'alert' ? 0 : F.SPEED;
    const cy = this.y + this.h / 2;
    const ahead = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
    if (!level.isWater(ahead, cy) || level.rectHitsSolid(ahead, this.y, 1, this.h)) {
      this.dir = -this.dir;
      if (this.state === 'chase') this.timer = 0;
    } else {
      this.x += this.dir * speed * dt;
    }
    // Se mece arriba y abajo; embistiendo va hacia la altura de la papa (sin salir del agua)
    const goalY = this.state === 'chase' ? player.y + player.h / 2 - this.h / 2 : this.spawnY + Math.sin(this.animTime * 2) * 3;
    const ny = this.y + clamp(goalY - this.y, -40 * dt, 40 * dt);
    if (level.isWater(this.x + this.w / 2, ny + 2) && level.isWater(this.x + this.w / 2, ny + this.h - 1)) this.y = ny;
    this.timer -= dt;
    if (this.state === 'walk') {
      this.actTimer -= dt;
      if (this.actTimer <= 0 && player.inWater && Math.abs(d.dx) < F.SENSE && Math.abs(d.dy) < 4) {
        this.dir = d.dx < 0 ? -1 : 1;
        this.state = 'alert';
        this.timer = F.WARN;
        Sfx.play('alert');
      }
    } else if (this.state === 'alert' && this.timer <= 0) {
      this.state = 'chase';
      this.timer = F.CHARGE_TIME;
    } else if (this.state === 'chase' && this.timer <= 0) {
      this.state = 'walk';
      this.actTimer = F.REST;
    }
  }

  // Libélula: vuela recto un rato, se queda quieta brillando y dobla (sin alejarse de su lugar)
  zigzag(dt, level, player) {
    const Z = CONFIG.ENEMIES.DRAGONFLY;
    const T = CONFIG.TILE;
    if (this.state === 'act') {
      this.timer -= dt;
      if (this.timer > 0) return;
      // Nueva dirección: hacia la papa con un desvío, o de vuelta si se alejó mucho
      const far = Math.abs(this.x - this.spawnX) > Z.RANGE * T || Math.abs(this.y - this.spawnY) > Z.RANGE * T * 0.6;
      const tx = far ? this.spawnX : player.x;
      const ty = far ? this.spawnY : player.y;
      const a = Math.atan2(ty - this.y, tx - this.x) + (Math.random() - 0.5) * 2.2;
      this.vx = Math.cos(a) * Z.SPEED;
      this.vy = Math.sin(a) * Z.SPEED * 0.7;
      this.dir = this.vx < 0 ? -1 : 1;
      this.state = 'walk';
      this.actTimer = Z.ZIG;
      return;
    }
    if (this.vx === 0 && this.vy === 0) this.vx = this.dir * Z.SPEED;
    const nx = this.x + this.vx * dt;
    const ny = this.y + this.vy * dt;
    if (level.rectHitsSolid(nx, ny, this.w, this.h)) {
      this.vx = -this.vx;
      this.vy = -this.vy;
      this.dir = -this.dir;
    } else {
      this.x = nx;
      this.y = ny;
    }
    this.actTimer -= dt;
    if (this.actTimer <= 0) {
      this.state = 'act';
      this.timer = Z.FLASH;
    }
  }

  // Garza: quieta en su lugar; si la papa pasa cerca, echa el cuello atrás (aviso) y picotea
  heron(dt, level, player) {
    const H = CONFIG.ENEMIES.HERON;
    const d = this.dist(player);
    this.fall(dt, level);
    this.timer -= dt;
    if (this.state === 'walk') {
      this.actTimer -= dt;
      if (this.actTimer <= 0 && Math.abs(d.dx) < H.SENSE && d.dy > -1.5 && d.dy < 2) {
        this.dir = d.dx < 0 ? -1 : 1;
        this.state = 'alert';
        this.timer = H.WARN;
      }
    } else if (this.state === 'alert' && this.timer <= 0) {
      this.state = 'act';
      this.timer = H.STRIKE;
      Sfx.play('stomp');
    } else if (this.state === 'act' && this.timer <= 0) {
      this.state = 'walk';
      this.actTimer = H.REST;
    }
  }

  // Lo que daña fuera del cuerpo: la lengua de la rana y el pico de la garza
  reach() {
    if (!this.isAlive()) return null;
    if (this.type === 'rana' && this.state === 'act') {
      const F = CONFIG.ENEMIES.FROG;
      if (this.timer > F.TONGUE_TIME) return null;
      const k = Math.sin((1 - this.timer / F.TONGUE_TIME) * Math.PI);   // sale y vuelve
      const len = F.TONGUE * k;
      const mx = this.dir > 0 ? this.x + this.w : this.x;
      return { x: this.dir > 0 ? mx : mx - len, y: this.y + 3, w: Math.max(1, len), h: 3 };
    }
    if (this.type === 'garza' && this.state === 'act') {
      const R = CONFIG.ENEMIES.HERON.REACH;
      return { x: this.dir > 0 ? this.x + this.w - 2 : this.x - R + 2, y: this.y + 6, w: R, h: 10 };
    }
    return null;
  }

  // Lengua, pico y brillo (se dibujan con o sin sprite)
  drawReach(ctx) {
    const r = this.reach();
    if (this.type === 'rana' && this.state === 'act' && !r) {
      // Buche inflado (aviso)
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2 + this.dir * 3, this.y + this.h - 2, 3 + Math.sin(this.animTime * 30), 0, Math.PI * 2);
      ctx.fill();
    }
    if (r && this.type === 'rana') {
      ctx.fillStyle = '#ff6b8a';
      ctx.fillRect(Math.round(r.x), Math.round(r.y), Math.round(r.w), 2);
      const tip = this.dir > 0 ? r.x + r.w : r.x;
      ctx.fillRect(Math.round(tip) - 2, Math.round(r.y) - 1, 4, 4);
    }
    if (r && this.type === 'garza' && !Sprites.has('garza_picar')) {
      const sx = this.dir > 0 ? this.x + this.w - 2 : this.x + 2;
      ctx.strokeStyle = '#e6e2f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, this.y + 4);
      ctx.lineTo(sx + this.dir * (r.w - 6), this.y + 12);
      ctx.stroke();
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(Math.round(sx + this.dir * (r.w - 6)) - (this.dir > 0 ? 0 : 6), Math.round(this.y + 11), 6, 2);
    }
    if (this.type === 'libelula' && this.state === 'act') {
      Light.drawGlow(ctx, this.x + this.w / 2, this.y + this.h / 2, 18, '#ffffff', 0.7);
    }
  }

  // Armadillo pisado sin zapateo: se enrolla (no le pasa nada)
  curl() {
    this.state = 'act';
    this.timer = CONFIG.ENEMIES.ARMADILLO_CURL;
    this.vx = 0;
  }

  // ---------- Dibujo ----------

  anim() {
    const d = this.def;
    if (this.state === 'squashed') return d.squash;
    if (d.hangs && !this.hanging) return d.run || d.walk;
    if (this.state === 'alert') return d.alert || d.walk;
    if (this.state === 'chase') return d.run || d.walk;
    if (this.state === 'act') return d.act || d.walk;
    if (this.def.still && this.charging()) return d.charge;
    return d.walk;
  }

  draw(ctx) {
    if (this.state === 'dead' || this.state === 'hidden') return;
    if (this.buried) {
      this.drawMound(ctx);
      return;
    }
    const name = this.anim();
    const s = SPRITES[name];
    const flip = this.dir < 0;
    // Los animales poseídos por el Silencio sueltan partículas moradas que suben (los vecinos, no)
    if (!this.def.npc && this.state !== 'squashed') {
      const P = CONFIG.POSSESSED;
      const cx = this.x + this.w / 2;
      ctx.fillStyle = P.COLOR;
      for (let i = 0; i < P.N; i++) {
        const k = (this.animTime * P.SPEED + i / P.N) % 1;
        const px = cx + Math.sin(i * 2.4 + this.animTime * 2) * this.w * 0.6;
        const py = this.y + this.h - k * (this.h + 10);
        ctx.globalAlpha = (1 - k) * 0.85;
        ctx.fillRect(Math.round(px), Math.round(py), k < 0.5 ? 2 : 1, k < 0.5 ? 2 : 1);
      }
      ctx.globalAlpha = 1;
    }
    const ok = s && Sprites.drawFrame(ctx, name, Sprites.frameAt(name, this.animTime),
      this.x + this.w / 2 - s.fw / 2, this.y + this.h - s.fh + (this.def.flies ? (s.fh - this.h) / 2 : 0), flip);
    if (!ok) this.drawFallback(ctx);
    this.drawReach(ctx);
    // "!" cuando te ve (cuy) o antes de lanzarse (colibrí)
    if (this.state === 'alert') {
      const x = Math.round(this.x + this.w / 2) - 1;
      const y = Math.round(this.y) - 12;
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(x, y, 2, 5);
      ctx.fillRect(x, y + 6, 2, 2);
    }
  }

  // Topo bajo tierra: un montículo; si va a asomar, tiembla y suelta piedritas
  drawMound(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y + this.h);
    const shake = this.state === 'alert' ? Math.round(Math.sin(this.animTime * 50) * 1) : 0;
    ctx.fillStyle = '#5a4436';
    ctx.fillRect(x + 2 + shake, y - 2, this.w - 4, 2);
    ctx.fillRect(x + 4 + shake, y - 3, this.w - 8, 1);
    if (this.state === 'alert') {
      ctx.fillStyle = '#c9b8a0';
      ctx.fillRect(x + 3, y - 6 - Math.round((this.animTime * 20) % 4), 1, 1);
      ctx.fillRect(x + this.w - 4, y - 5 - Math.round((this.animTime * 16) % 4), 1, 1);
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
      case 'murcielago': {
        const flap = Math.floor(this.animTime * 10) % 2;
        ctx.fillStyle = c;
        if (this.hanging && this.state !== 'act') {
          ctx.fillRect(x + 4, y, w - 8, h);           // colgado, alas cerradas
          ctx.fillStyle = '#2e2a47';
          ctx.fillRect(x + 6, y + h - 3, 1, 1);
          ctx.fillRect(x + w - 7, y + h - 3, 1, 1);
        } else {
          ctx.fillRect(x + 4, y + 2, w - 8, h - 2);
          ctx.fillRect(x, y + (flap ? 1 : 4), 4, 3);
          ctx.fillRect(x + w - 4, y + (flap ? 1 : 4), 4, 3);
          ctx.fillStyle = '#ffd34d';
          ctx.fillRect(front, y + 3, 2, 1);
        }
        break;
      }
      case 'rueda': {
        const a = this.animTime * this.dir * 8;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5b5478';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w / 2 + Math.cos(a) * 5, y + h / 2 + Math.sin(a) * 5);
        ctx.lineTo(x + w / 2 - Math.cos(a) * 5, y + h / 2 - Math.sin(a) * 5);
        ctx.stroke();
        return;
      }
      case 'escorpion':
        ctx.fillStyle = c;
        ctx.fillRect(x + 2, y + 4, w - 4, h - 4);
        ctx.fillRect(this.dir > 0 ? x : x + w - 3, y, 3, 5);              // cola
        ctx.fillRect(this.dir > 0 ? x + 2 : x + w - 5, y - 1, 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(front, y + 5, 2, 2);
        break;
      case 'armadillo': {
        const ball = this.state === 'act';
        ctx.fillStyle = '#8a6a3a';
        if (ball) {
          ctx.beginPath();
          ctx.arc(x + w / 2, y + h - 6, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#e9c46a';
          ctx.fillRect(x + w / 2 - 4, y + h - 9, 8, 2);
          ctx.fillRect(x + w / 2 - 3, y + h - 5, 6, 1);
          return;
        }
        ctx.fillRect(x + 1, y + 3, w - 2, h - 3);
        ctx.fillStyle = '#e9c46a';
        for (let i = 0; i < 3; i++) ctx.fillRect(x + 3 + i * 4, y + 1, 3, 6);    // placas de oro
        ctx.fillStyle = '#c9a35b';
        ctx.fillRect(front - (this.dir > 0 ? 0 : 1), y + 5, 4, 4);
        ctx.fillStyle = '#2e2a47';
        ctx.fillRect(this.dir > 0 ? x + w - 2 : x + 1, y + 6, 1, 1);
        break;
      }
      case 'brasa': {
        const f = Math.floor(this.animTime * 12) % 2;
        ctx.fillStyle = '#ff4d3a';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2 + 1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd34d';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2 + 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff9a3c';
        ctx.fillRect(x + 2 + f, y - 2, 2, 4);
        ctx.fillRect(x + w - 4 - f, y - 1, 2, 3);
        ctx.fillStyle = '#2e2a47';
        ctx.fillRect(x + 3, y + 4, 1, 2);
        ctx.fillRect(x + w - 4, y + 4, 1, 2);
        return;
      }
      case 'zorro': {
        ctx.fillStyle = c;
        ctx.fillRect(x + 2, y + 3, w - 5, h - 5);
        ctx.fillStyle = '#fff6e0';
        ctx.fillRect(this.dir > 0 ? x : x + w - 4, y + 3, 4, 3);       // cola blanca
        ctx.fillStyle = c;
        ctx.fillRect(front - 1, y, 5, 6);                               // cabeza
        ctx.fillRect(front, y - 2, 2, 2);                               // oreja
        ctx.fillStyle = '#2e2a47';
        ctx.fillRect(this.dir > 0 ? front + 2 : front, y + 2, 1, 1);
        ctx.fillRect(x + 3, y + h - 2, 2, 2);
        ctx.fillRect(x + w - 6, y + h - 2, 2, 2);
        break;
      }
      case 'rana': {
        const air = this.state === 'chase';
        ctx.fillStyle = c;
        ctx.fillRect(x + 1, y + (air ? 1 : 3), w - 2, h - (air ? 3 : 3));       // cuerpo
        ctx.fillRect(x + 3, y + 1, 3, 3);                                       // ojos saltones
        ctx.fillRect(x + w - 6, y + 1, 3, 3);
        ctx.fillStyle = '#2e2a47';
        ctx.fillRect(x + 4, y + 2, 1, 1);
        ctx.fillRect(x + w - 5, y + 2, 1, 1);
        ctx.fillStyle = '#4a9a5a';
        if (air) {
          ctx.fillRect(x - 2, y + h - 2, 4, 2);                                 // patas estiradas
          ctx.fillRect(x + w - 2, y + h - 2, 4, 2);
        } else {
          ctx.fillRect(x, y + h - 3, 4, 3);
          ctx.fillRect(x + w - 4, y + h - 3, 4, 3);
        }
        ctx.fillStyle = '#e8f6c8';
        ctx.fillRect(x + 4, y + h - 3, w - 8, 2);                               // panza
        break;
      }
      case 'pez': {
        const tail = Math.sin(this.animTime * (this.state === 'chase' ? 30 : 12)) * 2;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 3, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        const back = this.dir > 0 ? x + 1 : x + w - 1;
        ctx.beginPath();
        ctx.moveTo(back + this.dir * 3, y + h / 2);
        ctx.lineTo(back - this.dir * 2, y + tail);
        ctx.lineTo(back - this.dir * 2, y + h + tail);
        ctx.fill();
        ctx.fillStyle = '#2e2a47';
        ctx.fillRect(this.dir > 0 ? x + w - 5 : x + 4, y + 2, 1, 1);
        ctx.fillStyle = '#7a5a3a';                                              // bigotes
        ctx.fillRect(this.dir > 0 ? x + w - 3 : x, y + h - 2, 3, 1);
        break;
      }
      case 'libelula': {
        const flap = Math.floor(this.animTime * 20) % 2;
        ctx.fillStyle = 'rgba(232, 246, 255, 0.8)';
        ctx.fillRect(x + 3, y + (flap ? 0 : 1), 4, 3);
        ctx.fillRect(x + 8, y + (flap ? 0 : 1), 4, 3);
        ctx.fillStyle = this.state === 'act' ? '#ffffff' : '#5aa6ee';
        ctx.fillRect(x + 1, y + 4, w - 2, 2);                                   // cuerpo largo
        ctx.fillStyle = '#2e2a47';
        ctx.fillRect(this.dir > 0 ? x + w - 2 : x + 1, y + 3, 1, 1);
        break;
      }
      case 'garza': {
        const back = this.state === 'alert';
        ctx.fillStyle = '#c9a35b';
        ctx.fillRect(x + 5, y + h - 8, 1, 8);                                   // patas de alambre
        ctx.fillRect(x + 8, y + h - 8, 1, 8);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h - 11, 6, 4, 0, 0, Math.PI * 2);           // cuerpo
        ctx.fill();
        // Cuello y cabeza (atrás cuando avisa; si pica, el pico lo dibuja drawReach)
        const hx = x + w / 2 + this.dir * (back ? -2 : 2);
        ctx.fillRect(hx - 1, y + 2, 2, h - 14);
        ctx.fillRect(hx - 2, y, 5, 3);
        if (this.state !== 'act') {
          ctx.fillStyle = '#ffd34d';
          ctx.fillRect(this.dir > 0 ? hx + 3 : hx - 6, y + 1, 4, 1);
        }
        ctx.fillStyle = '#2e2a47';
        ctx.fillRect(hx, y + 1, 1, 1);
        break;
      }
      case 'bolaNieve': {
        const a = this.animTime * this.dir * 6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a8b8d8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2 - 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#c9d8ef';
        ctx.fillRect(Math.round(x + w / 2 + Math.cos(a) * w / 4) - 1, Math.round(y + h / 2 + Math.sin(a) * h / 4) - 1, 3, 2);
        return;
      }
      case 'vizcacha':
        ctx.fillStyle = c;
        ctx.fillRect(x + 1, y + 4, w - 2, h - 4);
        ctx.fillRect(front, y, 3, 6);
        ctx.fillRect(front + (this.dir > 0 ? 0 : 2), y - 4, 1, 5);      // orejas largas
        ctx.fillStyle = '#7a7060';
        ctx.fillRect(this.dir > 0 ? x - 2 : x + w, y + 4, 3, 2);        // cola
        ctx.fillStyle = '#2e2a47';
        ctx.fillRect(front + 1, y + 2, 1, 1);
        break;
      case 'nubeGranizo': {
        ctx.fillStyle = '#c9d0dc';
        ctx.beginPath();
        ctx.arc(x + 6, y + 7, 6, 0, Math.PI * 2);
        ctx.arc(x + 12, y + 5, 7, 0, Math.PI * 2);
        ctx.arc(x + 17, y + 7, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a96b0';
        ctx.fillRect(x + 2, y + 9, w - 4, 3);
        ctx.fillStyle = '#2e2a47';
        ctx.fillRect(x + 8, y + 5, 1, 2);
        ctx.fillRect(x + 14, y + 5, 1, 2);
        if (this.state === 'act') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 6, y + 12, 2, 2);
          ctx.fillRect(x + 13, y + 13, 2, 2);
        }
        return;
      }
      case 'topo':
        ctx.fillStyle = c;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 2);
        ctx.fillStyle = '#c9a35b';
        ctx.fillRect(x + w / 2 - 2, y, 4, 3);                            // taladro
        ctx.fillStyle = '#f3e3c3';
        ctx.fillRect(front, y + 5, 3, 3);
        break;
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
    if (info.kind === 'granizo') {
      // Granizo: cae de la nube y rebota una vez en el suelo
      this.list.push({ x: e.x + e.w / 2 - 3, y: e.y + e.h, w: 6, h: 6, vx: (Math.random() - 0.5) * 40, vy: 20,
                       g: 600, life: 3, kind: 'granizo', bounces: 1 });
      return;
    }
    if (info.kind === 'fruto' || info.kind === 'cristal') {
      const t = 1;
      const g = 500;
      const sx = e.x + e.w / 2 - 4;
      // El fruto cae desde el mono (colgado); el cristal sale de la cola del escorpión
      const sy = info.kind === 'cristal' ? e.y - 8 : e.y + e.h;
      this.list.push({ x: sx, y: sy, w: 8, h: 8, vx: (info.tx - sx) / t, vy: (info.ty - sy) / t - g * t / 2,
                       g: g, life: 3, kind: info.kind });
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
      if (!level.rectHitsSolid(s.x, s.y, s.w, s.h)) return;
      if (s.bounces > 0 && s.vy > 0) {
        s.bounces--;
        s.y -= s.vy * dt;
        s.vy = -s.vy * 0.55;
        s.vx = (Math.random() < 0.5 ? -1 : 1) * 50;
        return;
      }
      s.life = 0;
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
      if (s.kind === 'granizo') {
        if (Sprites.drawAnchored(ctx, 'granizo', 0, s.x + s.w / 2, s.y + s.h / 2 + 8, false)) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(s.x), Math.round(s.y), s.w, s.h);
        ctx.fillStyle = '#a8b8d8';
        ctx.fillRect(Math.round(s.x) + s.w - 2, Math.round(s.y) + s.h - 2, 2, 2);
        return;
      }
      const name = s.kind === 'fruto' ? 'fruto' : s.kind === 'cristal' ? 'cristal_disparo' : 'semilla';
      if (Sprites.drawAnchored(ctx, name, Sprites.frameAt(name, s.life), s.x + s.w / 2, s.y + s.h / 2 + 8, s.vx < 0)) return;
      const x = Math.round(s.x);
      const y = Math.round(s.y);
      ctx.fillStyle = s.kind === 'fruto' ? '#e07a8f' : s.kind === 'cristal' ? '#9fe8ff' : '#8a5a2b';
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = s.kind === 'fruto' ? '#5e8c6a' : s.kind === 'cristal' ? '#ffffff' : '#e0b060';
      ctx.fillRect(x + 1, y, 2, 1);
    });
  }
}

class Enemies {
  constructor(level) {
    this.list = level.enemySpawns.map(function (s, i) {
      const e = new Enemy(s.type, s.tx, s.ty);
      e.spawnIndex = i;                     // para el Códex: cada animal cuenta una vez
      e.props = s.props || {};
      e.inArena = level.insideArena(e);
      e.calm = (level.region || 1) <= CONFIG.PALOMA.CALM_UNTIL_REGION;
      e.reset();
      return e;
    });
    this.shots = new Shots();
  }

  update(dt, level, player, camera) {
    this.list.forEach(function (e) {
      // Calmado por la quena: baila quieto, no daña y se puede pisar
      if (e.calmed > 0) { e.calmed -= dt; e.animTime += dt; return; }
      // Hipnotizado por el caracol: no se mueve ni dispara
      if (e.frozen > 0) { e.frozen -= dt; return; }
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

  // Los que se pueden tocar (el topo bajo tierra no)
  alive() {
    return this.list.filter(function (e) { return e.isAlive() && !e.buried; });
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
    this.list.forEach(function (e) {
      e.draw(ctx);
      if (e.frozen > 0 && e.state !== 'dead') {
        // Hipnotizado: una espiral color arena que gira sobre su cabeza
        const cx = e.x + e.w / 2, cy = e.y - 5, a = e.frozen * 8;
        ctx.strokeStyle = CONFIG.SKINS.shell;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = 0; k < 14; k++) {
          const r = 1 + k * 0.35, ang = a + k * 0.7;
          const px = cx + Math.cos(ang) * r, py = cy + Math.sin(ang) * r * 0.6;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      if (e.calmed > 0 && e.state !== 'dead') {
        // Calmado por la quena: una nota que sube y un brillo verde agua bajo los pies
        const cx = e.x + e.w / 2, k = (e.calmed * 1.5) % 1;
        ctx.globalAlpha = 1 - k;
        UI.text(ctx, '♪', cx + Math.sin(e.calmed * 4) * 3, e.y - 6 - k * 10, CONFIG.SKINS.quena, 7, 'center');
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = CONFIG.SKINS.quena;
        ctx.fillRect(e.x, e.y + e.h - 1, e.w, 1);
        ctx.globalAlpha = 1;
      }
    });
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
    if (Sprites.drawOutlined(ctx, 'moneda_chica', Sprites.frameAt('moneda_chica', time || 0), x - 1, y - 1, false, CONFIG.OUTLINE.ITEM, 0.5)) return;
    const M = CONFIG.COINS;
    ctx.fillStyle = M.SHADE;
    ctx.fillRect(x, y, 6, 6);
    ctx.fillStyle = M.COLOR;
    ctx.fillRect(x + 1, y + 1, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 2, y + 2, 1, 1);
  }
}
