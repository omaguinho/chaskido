// Los cinco jefes: Cóndor de Bronce, El Rasgueador, Tótem de Piedra, Cuy Gigante
// y Guardián del Tambor (los nombres internos siguen siendo condor, charanguero,
// huaca, cuy y bombo). Sus ataques se copian de jefes de Mega Man X (SNES).
// Todos siguen la misma regla:
//   - Tienen dos ataques (A y B) que se van turnando, y entre ataque y ataque
//     un momento de calma ("idle").
//   - Caerles en la cabeza les quita una vida en cualquier momento, MENOS mientras
//     atacan o se recuperan de un golpe (ahí solo rebotas).
//   - Tocarlos de lado hace daño, salvo cuando están mareados o cansados.
//   - Si la papa se queda sobre su cabeza cuando no se les puede pisar, se
//     sacuden y la tiran (nunca se quedan quietos con ella encima).
// La base ArenaBoss tiene lo común (vidas, pisotón, proyectiles, barra, sprites);
// cada jefe decide sus ataques (attack/think) y su dibujo. Si están los sprites
// (ver SPRITES en sprites.js) se usan; si no, se dibujan con código.
// Ajustes de cada jefe en CONFIG.BOSSES.

class ArenaBoss {
  // Ajuste por dificultad para el jefe que se crea (ver Game.bossTuning)
  static get tuning() { return ArenaBoss._tuning || {}; }
  static set tuning(t) { ArenaBoss._tuning = t; }

  // def: datos de CONFIG.BOSSES.<tipo>
  constructor(tx, ty, def) {
    const T = CONFIG.TILE;
    this.def = def;
    // Cuerpo de choque un poco más grande para los dibujos HD (CONFIG.HD.BOSS_HIT)
    this.w = Math.round(def.W * CONFIG.HD.BOSS_HIT);
    this.h = Math.round(def.H * CONFIG.HD.BOSS_HIT);
    this.spawnX = tx * T + (T - this.w) / 2;
    this.spawnY = (ty + 1) * T - this.h;
    this.reset();
  }

  reset() {
    // Dificultad (ArenaBoss.tuning, la pone el juego): en Fácil, como mucho HP_MAX golpes
    const cap = ArenaBoss.tuning.HP_MAX;
    if (cap && this.def.HP > cap) this.def = Object.assign({}, this.def, { HP: cap });
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.prevY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.dir = -1;
    this.hp = this.def.HP;
    this.state = 'wait';
    this.timer = 0;
    this.animTime = 0;
    this.started = false;
    this.hidden = false;
    this.attackIndex = -1;     // 0 = ataque A, 1 = ataque B (se turnan)
    this.shots = [];           // proyectiles: { x, y, w, h, vx, vy, g, life, kind }
    this.floor = null;         // altura del suelo de la arena (se mide al empezar)
    this.shakeTime = 0;        // sacudida de pantalla (aterrizajes fuertes)
    this.shaking = 0;          // se sacude a la papa de encima (solo dibujo)
    this.defeatedNow = false;  // se avisa una vez al juego cuando muere
    this.trailGhosts = [];     // estela cuando se mueve rápido (espectáculo)
    this.trailTimer = 0;
    this.lastShake = 0;
    this.embers = [];          // chispas del aura en las fases altas
    this.rage = 0;             // destello al cambiar de fase
    this.prepare();
  }

  // Cada jefe guarda aquí sus datos propios al empezar
  prepare() {}

  // Estados de ataque (no se le puede pisar) y de descanso (no daña de lado)
  attackStates() { return []; }
  restStates() { return []; }

  // ---------- Consultas que usa el juego ----------

  isActive() {
    return this.started && this.state !== 'dead';
  }

  holdsPlayer() {
    return false;
  }

  shake() {
    return this.shakeTime > 0 ? 2 : 0;
  }

  isAttacking() {
    return this.attackStates().indexOf(this.state) >= 0;
  }

  isResting() {
    return this.restStates().indexOf(this.state) >= 0;
  }

  // Con la mitad de la vida o menos se apura
  angry() {
    return this.hp <= Math.ceil(this.def.HP / 2);
  }

  // 3 etapas: normal, apurado (bajo 2/3 de la vida) y furioso (bajo 1/3): cada etapa más
  // rápida; la furiosa suma CONFIG.BOSS_FURY.EXTRA
  phaseSpeed(step) {
    const i = this.phaseIndex();
    return 1 + i * step + (i === 2 ? CONFIG.BOSS_FURY.EXTRA : 0);
  }

  speed() {
    return this.phaseSpeed((this.def.ANGRY_SPEED || 1.25) - 1);
  }

  canBeHit() {
    return this.started && !this.hidden && !this.isAttacking() &&
           !/^(wait|intro|hurt|dying|dead)$/.test(this.state);
  }

  isHarmful() {
    return this.started && !this.hidden && !this.isResting() &&
           !/^(wait|hurt|dying|dead)$/.test(this.state);
  }

  // Caerle encima: venía desde arriba de la cabeza y se acercan en vertical
  isStompedBy(p) {
    if (!this.started || this.hidden || /^(dying|dead)$/.test(this.state)) return false;
    if (!overlaps(this, p)) return false;
    return p.prevBottom <= this.prevY + CONFIG.BOSSES.HEAD_ZONE && p.vy >= this.vy;
  }

  // Zona que daña de lado: el cuerpo sin la cabeza, un poco más angosto
  harmBox() {
    const head = CONFIG.BOSSES.HEAD_ZONE;
    return { x: this.x + 3, y: this.y + head, w: this.w - 6, h: Math.max(4, this.h - head) };
  }

  hit() {
    this.hp--;
    if (this.hp <= 0) Sfx.play('jefeCae');   // el último golpe: la música que se le escapa
    this.vx = 0;
    this.setState('hurt', CONFIG.BOSSES.HURT_TIME);
  }

  // La papa cayó encima cuando no se le puede pisar: se sacude y la tira de lado
  shakeOff(p, level) {
    const dir = p.x + p.w / 2 < this.centerX() ? -1 : 1;
    p.vx = dir * 190;
    p.vy = -240;
    p.jumpCuttable = false;
    p.wallJumpLock = 0.2;
    const ny = Math.min(p.y, this.y - p.h - 1);
    if (!level || !level.rectHitsSolid(p.x, ny, p.w, p.h)) p.y = ny;
    this.shaking = 0.35;
  }

  // Viento que empuja a la papa (px/s de lado); solo el Guardián del Tambor colgado
  wind() {
    return 0;
  }

  // Altura (px) del techo sobre el jefe: el borde de abajo del primer bloque arriba
  ceilingY(level) {
    const cx = this.centerX();
    for (let y = this.y - 1; y > 0; y -= 2) {
      // El borde de abajo exacto de ese bloque (si no, podía quedar 1 px dentro del
      // techo y el choque lo empujaba hacia arriba, fuera del escenario)
      if (level.rectHitsSolid(cx - 4, y, 8, 1)) return (Math.floor(y / CONFIG.TILE) + 1) * CONFIG.TILE;
    }
    return null;
  }

  // Proyectil que toca a la papa: desaparece y devuelve true
  waveHits(p) {
    const s = this.shots.find(function (shot) { return shot.harms !== false && overlaps(shot, p); });
    if (!s) return false;
    s.life = 0;
    return true;
  }

  // ---------- Ciclo ----------

  startFight() {
    if (this.hidden) Effects.play('poof', this.x + this.w / 2, this.y + this.h / 2);
    this.hidden = false;
    this.started = true;
    this.setState('intro', 1);
  }

  setState(state, time) {
    if (state !== this.state && this.attackStates && this.attackStates().indexOf(state) >= 0) {
      this.attackSound(state);
    }
    // Descanso (cuando se le puede pisar): más largo en Fácil, justo en Difícil
    if (time && this.restStates && this.restStates().indexOf(state) >= 0) {
      const K = ArenaBoss.tuning;
      time = time * (K.REST_SCALE || 1);
      if (K.REST_MAX) time = Math.min(time, K.REST_MAX);
    }
    this.state = state;
    this.timer = time || 0;
    this.animTime = 0;
  }

  // Altura del aviso de este jefe: sale de su nombre (siempre la misma para cada jefe)
  voice() {
    const name = this.constructor.name;
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return CONFIG.SFX.BOSS_ECHO.PITCHES[h % CONFIG.SFX.BOSS_ECHO.PITCHES.length];
  }

  // Cada ataque suena (antes los jefes atacaban en silencio). Se elige por el nombre
  // del estado: embestidas, saltos, avisos, giros; el resto, un golpe grave.
  attackSound(state) {
    const now = Date.now();
    if (now - (this.lastAttackSound || 0) < CONFIG.SFX.BOSS_ECHO.EVERY * 1000) return;
    this.lastAttackSound = now;
    const S = [
      [/charge|roll|rush|run|dash|slide|swoop|dive/i, 'dash'],
      [/jump|leap|hop|climb|rise|up|fly/i, 'doubleJump'],
      [/aim|warn|crouch|wind|prep|tele|rear|growl/i, 'alert'],
      [/spin|blow|gust|storm|breath/i, 'wind'],
      [/slam|drop|stomp|fall|pound/i, 'stompStart']
    ];
    const hit = S.find(function (r) { return r[0].test(state); });
    if (hit) Sfx.play(hit[1]);
    else Sfx.bossAttack(this.voice());
  }

  startIdle(time) {
    this.setState('idle', (time || this.def.IDLE_TIME) / this.speed());
  }

  // Turna los dos ataques
  nextAttack(level, player) {
    this.attackIndex = (this.attackIndex + 1) % 2;
    this.attack(this.attackIndex === 0 ? 'a' : 'b', level, player);
  }

  attack() {}

  update(dt, level, player) {
    this.animTime += dt;
    this.prevY = this.y;
    this.updateShow(dt);
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.shaking = Math.max(0, this.shaking - dt);
    if (this.floor === null) this.floor = this.findFloor(level);
    this.updateShots(dt, level);
    if (this.state === 'dead' || !this.started) return;
    this.timer -= dt;

    if (this.state === 'hurt') {
      this.settle(dt, level);
      if (this.timer <= 0) {
        if (this.hp <= 0) this.setState('dying', CONFIG.BOSSES.DYING_TIME);
        else this.nextAttack(level, player);   // al recuperarse, contraataca
      }
      return;
    }
    if (this.state === 'dying') {
      this.settle(dt, level);
      if (this.timer <= 0) {
        this.state = 'dead';
        this.shots = [];
        this.defeatedNow = true;
        Effects.play('poof', this.x + this.w / 2, this.y + this.h / 2);
      }
      return;
    }
    if (this.state === 'idle') {
      this.idleMove(dt, level, player);
      if (this.timer <= 0) this.nextAttack(level, player);
      return;
    }
    this.think(dt, level, player);
  }

  // En calma: los que caminan quedan en el suelo mirando a la papa
  idleMove(dt, level, player) {
    this.vx = 0;
    this.facePlayer(player);
    this.moveBody(dt, level, !this.def.flies);
  }

  // Mientras parpadea o muere: los que caminan caen al suelo; los que vuelan flotan
  settle(dt, level) {
    if (this.def.flies) return;
    this.vx = 0;
    this.moveBody(dt, level, true);
  }

  // Mueve con gravedad (si gravity) y choca con el suelo y las paredes.
  // Devuelve { wall, ground } para saber si chocó
  moveBody(dt, level, gravity) {
    const hit = { wall: false, ground: false };
    if (gravity) this.vy = Math.min(this.vy + CONFIG.ENEMIES.GRAVITY * dt, CONFIG.PLAYER.MAX_FALL * 2);

    this.x += this.vx * dt;
    const B = this.bounds(level);
    if (level.rectHitsSolid(this.x, this.y, this.w, this.h) ||
        this.x < B.left || this.x + this.w > B.right) {
      this.x -= this.vx * dt;
      this.vx = 0;
      hit.wall = true;
    }
    this.y += this.vy * dt;
    const boxes = level.solidBoxesIn(this.x, this.y, this.w, this.h);
    if (boxes.length > 0) {
      if (this.vy > 0) {
        this.y = Math.min.apply(null, boxes.map(function (b) { return b.y; })) - this.h;
        hit.ground = true;
      } else {
        this.y = Math.max.apply(null, boxes.map(function (b) { return b.y + b.h; }));
      }
      this.vy = 0;
    }
    return hit;
  }

  onGround(level) {
    return level.rectHitsSolid(this.x, this.y + 1, this.w, this.h);
  }

  // Salto en arco que cae en goalX en t segundos
  jumpTo(level, goalX, t) {
    const B = this.bounds(level);
    const goal = Math.max(B.left, Math.min(B.right - this.w, goalX));
    this.vx = (goal - this.x) / t;
    this.vy = -CONFIG.ENEMIES.GRAVITY * t / 2;
  }

  // Suelo de la arena bajo el punto de aparición (para los que vuelan y las ondas)
  findFloor(level) {
    const cx = this.spawnX + this.w / 2;
    for (let y = this.spawnY + this.h; y < level.pxH; y += 2) {
      if (level.rectHitsSolid(cx - 2, y, 4, 1)) return y;
    }
    return level.pxH;
  }

  // Altura donde empieza lo que se ve en pantalla durante la pelea
  // (la cámara deja el suelo de la arena abajo)
  viewTop() {
    return Math.max(0, this.floor + CONFIG.TILE - CONFIG.HEIGHT);
  }

  // Límites de la arena para no salirse (sin contar las paredes del borde del mapa;
  // si no hay arena, 10 bloques a cada lado)
  bounds(level) {
    const T = CONFIG.TILE;
    if (!level.arena) return { left: this.spawnX - 10 * T, right: this.spawnX + 10 * T };
    return { left: Math.max(level.arena.left, T), right: Math.min(level.arena.right, level.pxW - T) };
  }

  facePlayer(player) {
    this.dir = player.x + player.w / 2 < this.x + this.w / 2 ? -1 : 1;
  }

  centerX() {
    return this.x + this.w / 2;
  }

  // ---------- Proyectiles ----------
  // kind: 'seed', 'coco' (cae y rueda), 'note', 'rock', 'wave' (corre por el suelo)

  addShot(s) {
    this.shots.push(Object.assign({ vx: 0, vy: 0, g: 0, life: 4 }, s));
    // Disparos: un sonido corto (como mucho uno cada 0,2 s, para no saturar)
    const now = Date.now();
    if (s.harms !== false && now - (this.lastShotSound || 0) > 200) {
      this.lastShotSound = now;
      Sfx.play(s.kind === 'wave' ? 'bossLand' : s.kind === 'note' ? 'tuneLa' : 'appear');
    }
  }

  // Dos ondas por el suelo, una a cada lado (aterrizajes fuertes)
  groundWaves(speed) {
    const y = this.y + this.h - 8;
    const cx = this.centerX();
    [-1, 1].forEach(function (d) {
      this.addShot({ x: cx - 6 + d * 8, y: y, w: 12, h: 8, vx: d * speed, life: 3, kind: 'wave' });
    }, this);
  }

  updateShots(dt, level) {
    this.shots.forEach(function (s) {
      if (s.kind === 'spark') return this.updateSpark(s, dt, level);
      if (s.kind === 'corona') return this.updateCrown(s, dt);
      if (s.kind === 'nota_guia') return this.updateGuided(s, dt, level);
      s.life -= dt;
      s.vy += s.g * dt;
      s.x += s.vx * dt;
      if (s.kind === 'coco' && s.rolling) {
        // Rueda por el suelo; se rompe contra la pared y cae si se acaba el suelo
        if (level.rectHitsSolid(s.x, s.y, s.w, s.h)) s.life = 0;
        if (!level.rectHitsSolid(s.x, s.y + s.h + 1, s.w, 1)) s.rolling = false;
        return;
      }
      s.y += s.vy * dt;
      if (!level.rectHitsSolid(s.x, s.y, s.w, s.h)) return;
      if (s.kind === 'coco' && s.vy > 0) {
        s.y = Math.floor((s.y + s.h) / CONFIG.TILE) * CONFIG.TILE - s.h;
        s.vy = 0;
        s.rolling = true;
      } else {
        s.life = 0;
      }
    }, this);
    this.shots = this.shots.filter(function (s) { return s.life > 0; });
  }

  // Nota que persigue: dobla hacia la papa (s.target) mientras le quede s.follow;
  // después sigue derecho. Se rompe contra las paredes.
  updateGuided(s, dt, level) {
    s.life -= dt;
    s.follow -= dt;
    const t = s.target;
    if (s.follow > 0 && t) {
      const dx = t.x + t.w / 2 - (s.x + s.w / 2), dy = t.y + t.h / 2 - (s.y + s.h / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, s.turn * dt);
      s.vx += (dx / d * s.speed - s.vx) * k;
      s.vy += (dy / d * s.speed - s.vy) * k;
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (level.rectHitsSolid(s.x, s.y, s.w, s.h)) s.life = 0;
  }

  // Chispa del Cuy: corre por el suelo y, al llegar a una pared, sube por ella
  updateSpark(s, dt, level) {
    s.life -= dt;
    if (s.climbing) {
      s.y -= this.def.SPARK_CLIMB * dt;
      s.climbed += this.def.SPARK_CLIMB * dt;
      if (s.climbed > CONFIG.TILE * 5) s.life = 0;
      return;
    }
    s.x += s.vx * dt;
    if (level.rectHitsSolid(s.x, s.y, s.w, s.h)) {
      s.x -= s.vx * dt;
      s.climbing = true;
      s.climbed = 0;
    }
  }

  // Corona del Tótem: va hacia donde estaba la papa y vuelve a la cabeza
  updateCrown(s, dt) {
    s.t += dt;
    if (s.t < this.def.CROWN_OUT) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      return;
    }
    const tx = this.centerX() - s.w / 2;
    const ty = this.y - s.h;
    const dx = tx - s.x;
    const dy = ty - s.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const step = this.def.CROWN_SPEED * 1.2 * dt;
    if (len <= step) {
      s.life = 0;
      return;
    }
    s.x += dx / len * step;
    s.y += dy / len * step;
  }

  // ---------- Espectáculo (todos los jefes) ----------
  // Fase del jefe según su vida (0, 1 o 2): la usa la barra y el aura
  phaseIndex() {
    const k = this.hp / this.def.HP;
    const P = CONFIG.BOSS_SHOW.PHASES;
    return k <= P[1] ? 2 : k <= P[0] ? 1 : 0;
  }

  // Estela al moverse rápido, ondas en cada golpe fuerte y chispas del aura
  updateShow(dt) {
    const SH = CONFIG.BOSS_SHOW;
    this.rage = Math.max(0, this.rage - dt);
    this.trailGhosts.forEach(function (g) { g.life -= dt; });
    this.trailGhosts = this.trailGhosts.filter(function (g) { return g.life > 0; });
    this.trailTimer -= dt;
    const fast = Math.abs(this.vx) > SH.TRAIL_SPEED || Math.abs(this.vy) > SH.TRAIL_SPEED * 1.6;
    if (this.started && fast && this.trailTimer <= 0 && !this.hidden) {
      this.trailTimer = 0.045;
      this.trailGhosts.push({ x: this.x, y: this.y, life: 0.22, frame: this.animTime });
    }
    // Un golpe fuerte contra el suelo o la pared (el jefe sacude la pantalla)
    if (this.shakeTime > this.lastShake + 0.1 && !this.def.ownShow) this.impact();
    this.lastShake = this.shakeTime;
    // Aura: chispas que suben (fase 2 en adelante)
    const p = this.started && this.state !== 'dead' ? this.phaseIndex() : 0;
    if (p >= 1 && Math.random() < dt * (p === 2 ? 26 : 12)) {
      this.embers.push({ x: this.x + Math.random() * this.w, y: this.y + this.h * (0.3 + Math.random() * 0.7),
                         vy: -20 - Math.random() * 30, life: 0.7, color: p === 2 ? '#ff4dc4' : '#ff9a3c' });
    }
    this.embers.forEach(function (e) { e.life -= dt; e.y += e.vy * dt; });
    this.embers = this.embers.filter(function (e) { return e.life > 0; });
  }

  // Golpe fuerte: onda y polvo; en la fase 3 además suelta un abanico de notas
  // encendidas que caen en arco (hay que esquivarlas)
  impact() {
    const cx = this.centerX();
    const by = this.y + this.h;
    BossShow.ring(cx, by - 4, 70, CONFIG.BOSS_SHOW.PHASE_COLORS[this.phaseIndex()], 0.45);
    if (this.phaseIndex() < 2 || !this.started) return;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * (0.15 + 0.7 * i / 5);
      this.addShot({ x: cx - 4, y: by - 16, w: 8, h: 8, vx: Math.cos(a) * 120, vy: Math.sin(a) * 160, g: 380,
                     life: 2.2, kind: 'nota_fuego', light: '#ff4dc4' });
    }
  }

  // Al cambiar de fase: ruge, destella y suelta un anillo de notas encendidas
  onPhase(p) {
    this.rage = 0.6;
    this.shakeTime = Math.max(this.shakeTime, 0.5);
    this.lastShake = this.shakeTime;
    Sfx.play('roar');
    if (this.def.ownShow) return;
    const cx = this.centerX();
    const cy = this.y + this.h / 2;
    const n = p === 2 ? 10 : 6;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * i / (n - 1);
      this.addShot({ x: cx - 4, y: cy - 4, w: 8, h: 8, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, g: 200,
                     life: 2.4, kind: 'nota_fuego', light: '#ff9a3c' });
    }
  }

  // Aura de color detrás del jefe, estela y chispas
  drawShow(ctx) {
    const p = this.phaseIndex();
    const C = CONFIG.BOSS_SHOW.PHASE_COLORS[p];
    const cx = this.centerX();
    const cy = this.y + this.h / 2;
    if (p >= 1 || this.rage > 0) {
      const pulse = 1 + Math.sin(this.animTime * 8) * 0.08 + this.rage;
      Light.drawGlow(ctx, cx, cy, (this.w + 26) * pulse, C, 0.28 + p * 0.1 + this.rage * 0.6);
    }
    this.trailGhosts.forEach(function (g) {
      Light.drawGlow(ctx, g.x + this.w / 2, g.y + this.h / 2, this.w * 0.7, C, g.life / 0.22 * 0.45);
    }, this);
    this.embers.forEach(function (e) {
      ctx.globalAlpha = e.life / 0.7;
      ctx.fillStyle = e.color;
      ctx.fillRect(Math.round(e.x), Math.round(e.y), 2, 2);
    });
    ctx.globalAlpha = 1;
  }

  // ---------- Dibujo ----------

  draw(ctx) {
    this.shots.forEach(function (s) { this.drawShot(ctx, s); }, this);
    if (this.started && this.state !== 'dead' && !this.hidden) this.drawShow(ctx);
    if (this.state === 'dead' || this.hidden || !this.started) {
      if (!this.started && !this.hidden && this.state !== 'dead') this.drawLook(ctx);
      return;
    }
    this.drawExtras(ctx);
    // Parpadeo al recibir golpe; al morir se va apagando (si no hay sprite de derrota)
    if (this.state === 'hurt' && Math.floor(this.animTime * 12) % 2 === 0) return;
    if (this.state === 'dying' && !Sprites.has(this.spriteName())) {
      ctx.globalAlpha = Math.max(0, this.timer / CONFIG.BOSSES.DYING_TIME);
    }
    this.drawLook(ctx);
    ctx.globalAlpha = 1;
    if (this.isResting()) this.drawDizzy(ctx);
    if (this.canBeHit()) this.drawStompMark(ctx);
  }

  // Flecha amarilla que late sobre la cabeza: "ahora se le puede pisar"
  // (no sale mientras ataca ni mientras se recupera de un golpe)
  drawStompMark(ctx) {
    const top = Math.min(this.y, this.y + this.h - 32);
    const cx = Math.round(this.centerX());
    const y = Math.round(top - 9 + Math.sin(this.animTime * 8) * 2);
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(cx - 5, y - 1, 11, 3);
    ctx.fillRect(cx - 3, y + 2, 7, 2);
    ctx.fillRect(cx - 1, y + 4, 3, 2);
    ctx.fillStyle = CONFIG.DRAW.STOMP_MARK;
    ctx.fillRect(cx - 4, y, 9, 1);
    ctx.fillRect(cx - 2, y + 2, 5, 1);
    ctx.fillRect(cx, y + 4, 1, 1);
  }

  // Sprite del estado si está; si falta ese, el de calma (baseSprite);
  // si no hay ninguno, el dibujo por código
  drawLook(ctx) {
    let name = this.spriteName();
    if (this.shaking > 0 && this.shakeSprite() && Sprites.has(this.shakeSprite())) name = this.shakeSprite();
    if (name && !Sprites.has(name)) name = this.baseSprite();
    const tint = this.angry() && this.state !== 'dying' ? CONFIG.BOSSES.ANGRY_TINT : null;
    // Etapa furiosa: un halo rojo que late
    if (this.started && this.phaseIndex() === 2 && this.state !== 'dying') {
      Light.drawGlow(ctx, this.centerX(), this.y + this.h / 2, Math.max(this.w, this.h) * 1.3,
        CONFIG.BOSS_FURY.COLOR, 0.35 + 0.15 * Math.sin(performance.now() / 120));
    }
    const ok = name && Sprites.drawAnchored(ctx, name, this.spriteFrame(name),
      this.centerX(), this.y + this.h, this.dir < 0, tint, 0.25);
    if (!ok) this.drawBody(ctx);
  }

  spriteName() { return null; }
  baseSprite() { return null; }
  shakeSprite() { return null; }

  spriteFrame(name) {
    return Sprites.frameAt(name, this.animTime);
  }

  // Avisos y adornos que van detrás del jefe (cada uno los usa si quiere)
  drawExtras() {}

  drawBody() {}

  drawShot(ctx, s) {
    const x = Math.round(s.x);
    const y = Math.round(s.y);
    // Todo proyectil brilla un poco (se suma a lo que hay)
    Light.drawGlow(ctx, s.x + s.w / 2, s.y + s.h / 2, Math.max(8, s.w), s.light || '#ff9ad5', 0.45);
    if (s.kind === 'nota_guia') {
      BossShow.drawNote(ctx, s.x + s.w / 2, s.y + s.h / 2, s.color || '#9fe3c8', 1);
      return;
    }
    if (s.kind === 'nota_fuego') {
      BossShow.drawNote(ctx, s.x + s.w / 2, s.y + s.h / 2, Math.floor(s.life * 10) % 2 ? '#ff4dc4' : '#ffd34d', 1);
      return;
    }
    const sprite = { seed: 'semilla', coco: 'coco', note: 'nota', rock: 'piedra', wave: 'onda_bombo',
                     rafaga: 'rafaga', spark: 'chispa_suelo', corona: 'corona_piedra' }[s.kind];
    const frame = s.kind === 'note' ? (s.high ? 1 : 0) : Sprites.frameAt(sprite, s.life);
    if (Sprites.drawAnchored(ctx, sprite, frame, s.x + s.w / 2, s.y + s.h + (16 - s.h) / 2, s.vx < 0)) return;

    if (s.kind === 'note') {
      ctx.fillStyle = s.high ? '#a08cc4' : '#e07a8f';
      ctx.fillRect(x, y + 4, 5, 4);
      ctx.fillRect(x + 4, y, 1, 6);
      ctx.fillRect(x + 4, y, 3, 2);
    } else if (s.kind === 'rock') {
      ctx.fillStyle = '#8a8296';
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = '#b8b0c4';
      ctx.fillRect(x + 1, y + 1, 3, 2);
    } else if (s.kind === 'coco') {
      ctx.fillStyle = '#6b4a2a';
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = '#a0784a';
      ctx.fillRect(x + 2, y + 2, 2, 2);
    } else if (s.kind === 'wave') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(x, y + 4, s.w, 4);
      ctx.fillRect(x + 3, y + 1, s.w - 6, 3);
    } else if (s.kind === 'rafaga') {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#cfe8ef';
      ctx.fillRect(x, y + 2, s.w, 2);
      ctx.fillRect(x + 4, y + 6, s.w - 6, 2);
      ctx.globalAlpha = 1;
    } else if (s.kind === 'spark') {
      ctx.fillStyle = Math.floor(s.life * 20) % 2 ? '#f7e3a1' : '#9fd3e0';
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, y + 2, s.w - 4, s.h - 4);
    } else if (s.kind === 'corona') {
      ctx.fillStyle = '#b8b2a7';
      ctx.fillRect(x, y + 3, s.w, s.h - 3);
      ctx.fillRect(x, y, 2, 3);
      ctx.fillRect(x + s.w / 2 - 1, y, 2, 3);
      ctx.fillRect(x + s.w - 2, y, 2, 3);
    } else {
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = '#e0b060';
      ctx.fillRect(x + 1, y, 2, 1);
    }
  }

  // "!" que parpadea (aviso antes de un ataque)
  drawWarning(ctx, cx, cy) {
    if (Math.floor(this.animTime * 8) % 2 === 1) return;
    if (Sprites.drawAnchored(ctx, 'aviso', 0, cx, cy + 8, false)) return;
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(Math.round(cx) - 1, Math.round(cy) - 6, 3, 8);
    ctx.fillRect(Math.round(cx) - 1, Math.round(cy) + 4, 3, 3);
  }

  // Estrellitas de mareo sobre la cabeza (cansado o mareado)
  drawDizzy(ctx) {
    const cx = this.centerX();
    for (let i = 0; i < 3; i++) {
      const a = this.animTime * 5 + i * 2.1;
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(Math.round(cx + Math.cos(a) * 9) - 1, Math.round(this.y - 5 + Math.sin(a) * 2) - 1, 2, 2);
    }
  }

  // Barra de vida arriba al centro, con el nombre del jefe
  drawBar(ctx) {
    if (!this.isActive()) return;
    const W = CONFIG.WIDTH;
    const pips = this.def.HP;
    const size = 8;
    const gap = 3;
    const total = pips * size + (pips - 1) * gap;
    const x0 = Math.round(W / 2 - total / 2);
    const y = 18;
    ctx.font = gameFont(8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    ctx.fillText(tr(this.def.NAME), W / 2 + 1, y + 1);
    ctx.fillStyle = '#ffd34d';
    ctx.fillText(tr(this.def.NAME), W / 2, y);
    for (let i = 0; i < pips; i++) {
      const x = x0 + i * (size + gap);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - 1, y + 11, size + 2, size + 2);
      ctx.fillStyle = i < this.hp ? '#ff4d3a' : '#3a2a4a';
      ctx.fillRect(x, y + 12, size, size);
    }
    ctx.textAlign = 'left';
  }
}

// ---------- Cóndor de bronce ----------
// Calma: posado en el suelo (o bajando a posarse).
// Ataque A (cocos): sube, cruza la arena soltando cocos que caen y ruedan, y baja a posarse.
// Ataque B (picada, como el águila de Mega Man X): sale volando de la pantalla,
// avisa por una esquina de arriba y cruza muy rápido en diagonal hasta donde estaba
// la papa y sale por la otra esquina; lo hace dos veces y baja a posarse.
class Condor extends ArenaBoss {
  shakeSprite() { return 'condor_sacudir'; }

  constructor(tx, ty) {
    super(tx, ty, Object.assign({ flies: true }, CONFIG.BOSSES.condor));
  }

  prepare() {
    this.swoopsLeft = 0;
    this.dropsLeft = 0;
    this.path = null;          // picada: { points: [entrada, blanco, salida], leg }
  }

  attackStates() { return ['takeoff', 'cocos', 'leave', 'warn', 'swoop']; }

  flyY() {
    return this.floor - this.def.FLY_HEIGHT * CONFIG.TILE - this.h;
  }

  attack(kind, level) {
    if (kind === 'a') {
      this.setState('takeoff');
    } else {
      this.swoopsLeft = this.def.SWOOPS;
      this.setState('leave');
    }
    this.vx = 0;
    this.vy = 0;
    Sfx.play('dash');
  }

  // Posado: cae al suelo (o a una plataforma) y mira a la papa
  idleMove(dt, level, player) {
    this.vx = 0;
    this.facePlayer(player);
    this.moveBody(dt, level, true);
  }

  think(dt, level, player) {
    const D = this.def;
    const B = this.bounds(level);
    const s = this.speed();
    if (this.state === 'intro' || this.state === 'land') {
      // Baja a posarse donde está
      const hit = this.moveBody(dt, level, true);
      if (hit.ground && this.timer <= 0) this.startIdle();
    } else if (this.state === 'takeoff') {
      this.y -= D.TAKEOFF_SPEED * s * dt;
      if (this.y <= this.flyY()) {
        this.y = this.flyY();
        // Cruza hacia el lado más lejano
        this.dir = this.centerX() < (B.left + B.right) / 2 ? 1 : -1;
        this.dropsLeft = D.COCOS;
        this.dropEvery = (B.right - B.left) / (D.COCOS + 1);
        this.nextDropX = this.centerX() + this.dir * this.dropEvery * 0.6;
        this.setState('cocos');
      }
    } else if (this.state === 'cocos') {
      this.x += this.dir * D.FLY_SPEED * s * dt;
      this.y = this.flyY() + Math.sin(this.animTime * 4) * 4;
      if (this.dropsLeft > 0 && (this.centerX() - this.nextDropX) * this.dir >= 0) {
        this.dropsLeft--;
        this.nextDropX += this.dir * this.dropEvery;
        this.addShot({ x: this.centerX() - 4, y: this.y + this.h, w: 8, h: 8,
                       vx: this.dir * D.COCO_ROLL, vy: 20, g: 500, life: 5, kind: 'coco' });
        Sfx.play('stomp');
      }
      if (this.x <= B.left || this.x + this.w >= B.right) {
        this.x = Math.max(B.left, Math.min(B.right - this.w, this.x));
        this.setState('land', 0.2);
      }
    } else if (this.state === 'leave') {
      // Se va hacia arriba, fuera de la pantalla
      this.y -= D.TAKEOFF_SPEED * 1.6 * s * dt;
      if (this.y + this.h < this.viewTop() - 8) this.startSwoop(level, player);
    } else if (this.state === 'warn') {
      if (this.timer <= 0) {
        this.setState('swoop');
        Sfx.play('dash');
      }
    } else if (this.state === 'swoop') {
      this.followPath(dt * s);
    }
  }

  // Elige una esquina de arriba, fija el blanco donde está la papa y avisa
  startSwoop(level, player) {
    const B = this.bounds(level);
    const top = this.viewTop() - this.h;
    const fromLeft = Math.random() < 0.5;
    const entry = { x: fromLeft ? B.left - this.w : B.right, y: top };
    const target = { x: player.x + player.w / 2 - this.w / 2, y: player.y + player.h - this.h };
    const exit = { x: fromLeft ? B.right : B.left - this.w, y: top };
    this.path = { points: [entry, target, exit], leg: 0 };
    this.x = entry.x;
    this.y = entry.y;
    this.dir = fromLeft ? 1 : -1;
    this.warnAt = { x: fromLeft ? B.left + 10 : B.right - 10, y: this.viewTop() + 14 };
    this.setState('warn', this.def.WARN_TIME);
  }

  // Avanza en línea recta de punto en punto; al llegar a la salida, otra picada o bajar
  followPath(dt) {
    const p = this.path;
    const goal = p.points[p.leg + 1];
    const dx = goal.x - this.x;
    const dy = goal.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = this.def.SWOOP_SPEED * dt;
    if (dist > step) {
      this.x += dx / dist * step;
      this.y += dy / dist * step;
      return;
    }
    this.x = goal.x;
    this.y = goal.y;
    p.leg++;
    if (p.leg < p.points.length - 1) return;
    this.swoopsLeft--;
    if (this.swoopsLeft > 0) {
      this.setState('leave');
      return;
    }
    // Baja a posarse en un lugar al azar de la arena
    const B = this.bounds(this.levelRef);
    this.x = B.left + Math.random() * (B.right - B.left - this.w);
    this.y = this.viewTop() - this.h;
    this.vy = 0;
    this.setState('land', 0.3);
  }

  update(dt, level, player) {
    this.levelRef = level;
    super.update(dt, level, player);
  }

  baseSprite() { return 'condor_volar'; }

  spriteName() {
    if (this.state === 'hurt') return 'condor_dano';
    if (this.state === 'dying') return 'condor_derrota';
    if (this.state === 'cocos' || this.state === 'takeoff') return 'condor_lanzar';
    if (this.state === 'swoop') return 'condor_picada';
    return 'condor_volar';
  }

  drawExtras(ctx) {
    if (this.state === 'warn') this.drawWarning(ctx, this.warnAt.x, this.warnAt.y);
  }

  drawBody(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.w;
    const perched = this.state === 'idle';
    const flap = perched ? 0 : Math.round(Math.sin(this.animTime * 14) * 3);
    // Alas (recogidas en la picada y posado)
    ctx.fillStyle = '#7a4a2a';
    if (perched || this.state === 'swoop') {
      ctx.fillRect(x + 2, y + 6, w - 4, 6);
    } else {
      ctx.fillRect(x - 6, y + 4 + flap, 12, 4);
      ctx.fillRect(x + w - 6, y + 4 + flap, 12, 4);
    }
    // Cuerpo de bronce y collar blanco
    ctx.fillStyle = '#b8783a';
    ctx.fillRect(x + 6, y + 4, w - 12, this.h - 6);
    ctx.fillStyle = '#f2e6c9';
    const hx = this.dir > 0 ? x + w - 10 : x + 4;
    ctx.fillRect(hx, y + 2, 6, 3);
    // Cabeza y pico
    ctx.fillStyle = '#3a2a2a';
    ctx.fillRect(hx, y - 2, 6, 5);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(this.dir > 0 ? hx + 6 : hx - 3, y, 3, 2);
    // Patas cuando está posado
    if (perched) {
      ctx.fillRect(x + 9, y + this.h - 2, 2, 2);
      ctx.fillRect(x + w - 11, y + this.h - 2, 2, 2);
    }
  }
}

// ---------- El Rasgueador (archivos charanguero_*) ----------
// Ataques copiados de Armored Armadillo (Mega Man X):
// Calma: toca tranquilo mirando a la papa.
// Ataque A (notas): oleadas de notas bajas (saltarlas) y altas (quedarse abajo):
// 2 oleadas, y 3 más rápidas cuando le quedan 2 vidas o menos.
// Ataque B (bola): se enrolla en su caparazón y rebota en diagonal por la arena;
// al final cae y suelta un acorde que corre por el suelo.
class Charanguero extends ArenaBoss {
  constructor(tx, ty, def) {
    super(tx, ty, def || CONFIG.BOSSES.charanguero);
  }

  prepare() {
    this.wavesLeft = 0;
    this.notesLeft = 0;
    this.noteTimer = 0;
  }

  attackStates() { return ['rasgueo', 'curl', 'ball', 'crouch', 'jump', 'landing']; }

  attack(kind, level, player) {
    if (kind === 'a') {
      this.wavesLeft = this.angry() ? this.def.ANGRY_NOTE_WAVES : this.def.NOTE_WAVES;
      this.notesLeft = 0;
      this.noteTimer = 0.3;
      this.setState('rasgueo');
    } else {
      // B (de Armored Armadillo): se enrolla y rebota en diagonal por la arena
      this.facePlayer(player);
      this.setState('curl', 0.35 / this.speed());
    }
  }

  // Bola: rebota en paredes, suelo y techo
  bounceBall(dt, level) {
    const B = this.bounds(level);
    this.x += this.vx * dt;
    if (level.rectHitsSolid(this.x, this.y, this.w, this.h) || this.x < B.left || this.x + this.w > B.right) {
      this.x -= this.vx * dt;
      this.vx = -this.vx;
      Sfx.play('stomp');
    }
    this.y += this.vy * dt;
    if (level.rectHitsSolid(this.x, this.y, this.w, this.h) || this.y < 0) {
      this.y -= this.vy * dt;
      this.vy = -this.vy;
      Sfx.play('stomp');
    }
  }

  think(dt, level, player) {
    const D = this.def;
    if (this.state === 'intro') {
      this.idleMove(dt, level, player);
      if (this.timer <= 0) this.startIdle();
    } else if (this.state === 'rasgueo') {
      this.idleMove(dt, level, player);
      this.noteTimer -= dt;
      if (this.noteTimer <= 0) {
        if (this.notesLeft === 0) {
          // Fin de una oleada: empieza la siguiente o vuelve a la calma
          if (this.wavesLeft === 0) {
            this.startIdle();
            return;
          }
          this.wavesLeft--;
          this.notesLeft = D.NOTES_PER_WAVE;
          this.facePlayer(player);
        }
        this.notesLeft--;
        this.shootNote();
        this.noteTimer = (this.notesLeft > 0 ? D.NOTE_EVERY : D.WAVE_PAUSE) / this.speed();
      }
    } else if (this.state === 'curl') {
      this.idleMove(dt, level, player);
      if (this.timer <= 0) {
        const v = D.BALL_SPEED * this.speed();
        this.vx = this.dir * v;
        this.vy = -v;
        this.setState('ball', D.BALL_TIME);
      }
    } else if (this.state === 'ball') {
      this.bounceBall(dt, level);
      if (this.timer <= 0) {
        this.vx = 0;
        this.vy = 0;
        this.setState('jump');
      }
    } else if (this.state === 'crouch') {
      this.idleMove(dt, level, player);
      if (this.timer <= 0) {
        this.jumpTo(level, player.x + player.w / 2 - this.w / 2, D.HOP_TIME);
        this.setState('jump');
      }
    } else if (this.state === 'jump') {
      const hit = this.moveBody(dt, level, true);
      if (hit.ground) {
        this.vx = 0;
        this.groundWaves(D.WAVE_SPEED * this.speed());
        this.shakeTime = 0.2;
        Sfx.play('bossLand');
        this.setState('landing', 0.3);
      }
    } else if (this.state === 'landing') {
      this.idleMove(dt, level, player);
      if (this.timer <= 0) this.startIdle();
    }
  }

  // Corchea baja (a los pies: hay que saltarla) o alta (a la cabeza: quedarse abajo)
  shootNote() {
    const T = CONFIG.TILE;
    const high = Math.random() < 0.4;
    const feet = this.y + this.h;
    const ny = high ? feet - T * 2 - 4 : feet - 9;
    this.addShot({ x: this.dir > 0 ? this.x + this.w : this.x - 8, y: ny, w: 8, h: 8,
                   vx: this.dir * this.def.NOTE_SPEED * this.speed(), life: 5, kind: 'note', high: high });
    Sfx.play('note');
  }

  baseSprite() { return 'charanguero_tocar'; }
  shakeSprite() { return 'charanguero_sacudir'; }

  spriteName() {
    if (this.state === 'hurt') return 'charanguero_dano';
    if (this.state === 'dying') return 'charanguero_derrota';
    if (this.state === 'rasgueo') return 'charanguero_rasgueo';
    if (this.state === 'ball') return Sprites.has('charanguero_bola') ? 'charanguero_bola' : 'charanguero_salto';
    if (this.state === 'curl') return 'charanguero_salto';
    if (this.state === 'crouch' || this.state === 'jump' || this.state === 'landing') return 'charanguero_salto';
    return 'charanguero_tocar';
  }

  spriteFrame(name) {
    if (name !== 'charanguero_salto') return super.spriteFrame(name);
    return { crouch: 0, jump: 1, landing: 2 }[this.state] || 0;
  }

  drawBody(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y) + (this.state === 'crouch' ? 3 : 0);
    if (this.state === 'ball') {
      ctx.fillStyle = '#a0806a';
      ctx.beginPath();
      ctx.arc(x + this.w / 2, y + this.h / 2, this.w / 2 + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2e2a47';
      ctx.stroke();
      ctx.fillStyle = '#e8c58e';
      const a = this.animTime * 12;
      ctx.fillRect(Math.round(x + this.w / 2 + Math.cos(a) * 6) - 1, Math.round(y + this.h / 2 + Math.sin(a) * 6) - 1, 3, 3);
      return;
    }
    // Armadillo músico: gorro, cara, caparazón y su instrumento de cuerdas
    ctx.fillStyle = '#d2423a';
    ctx.fillRect(x + 4, y, this.w - 8, 5);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(x + 4, y + 4, this.w - 8, 1);
    ctx.fillStyle = '#c8955a';
    ctx.fillRect(x + 5, y + 5, this.w - 10, 6);
    ctx.fillStyle = '#1b1035';
    ctx.fillRect(this.dir > 0 ? x + 11 : x + 7, y + 7, 2, 2);
    ctx.fillStyle = '#3fa0a0';
    ctx.fillRect(x + 2, y + 11, this.w - 4, this.h - 15);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(x + 2, y + 15, this.w - 4, 1);
    ctx.fillStyle = '#3a2a2a';
    ctx.fillRect(x + 5, y + this.h - 4, 3, 4);
    ctx.fillRect(x + this.w - 8, y + this.h - 4, 3, 4);
    // Instrumento de cuerdas (caja y mástil); al rasguear vibra
    const shake = this.state === 'rasgueo' ? Math.round(Math.sin(this.animTime * 40)) : 0;
    const cx = (this.dir > 0 ? x + this.w - 6 : x - 2) + shake;
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(cx, y + 14, 8, 6);
    ctx.fillRect(this.dir > 0 ? cx + 7 : cx - 5, y + 12, 6, 2);
  }
}

// ---------- El Rasgueador Maestro (sala secreta de la zona 7) ----------
// El mismo Rasgueador, más rápido y con un tercer ataque:
// C (acorde): rasguea fuerte y suelta notas que persiguen a la papa un rato.
// Turna A (notas), C (acorde), B (bola).
class CharangueroMaestro extends Charanguero {
  constructor(tx, ty) {
    super(tx, ty, CONFIG.BOSSES.charanguero2);
  }

  attackStates() { return super.attackStates().concat(['acorde']); }

  nextAttack(level, player) {
    this.attackIndex = (this.attackIndex + 1) % 3;
    this.attack(['a', 'c', 'b'][this.attackIndex], level, player);
  }

  attack(kind, level, player) {
    if (kind !== 'c') return super.attack(kind, level, player);
    const D = this.def;
    this.facePlayer(player);
    this.setState('acorde', 1.2 / this.speed());
    for (let i = 0; i < D.CHORD_NOTES; i++) {
      const a = -Math.PI / 2 + (i - (D.CHORD_NOTES - 1) / 2) * 0.6;   // abanico hacia arriba
      const v = D.CHORD_SPEED * this.speed();
      this.addShot({ x: this.centerX() - 4, y: this.y, w: 8, h: 8, vx: Math.cos(a) * v + this.dir * 20, vy: Math.sin(a) * v,
                     life: 5, kind: 'nota_guia', target: player, follow: D.CHORD_FOLLOW, speed: v,
                     turn: D.CHORD_TURN, color: D.CHORD_COLOR, light: D.CHORD_COLOR });
    }
    this.shakeTime = 0.2;
  }

  think(dt, level, player) {
    if (this.state !== 'acorde') return super.think(dt, level, player);
    this.idleMove(dt, level, player);
    if (this.timer <= 0) this.startIdle();
  }

  spriteName() {
    return this.state === 'acorde' ? 'charanguero_rasgueo' : super.spriteName();
  }
}

// ---------- Tótem de Piedra (archivos huaca_*) ----------
// Calma: quieta en su lugar.
// Ataques copiados de Boomer Kuwanger (Mega Man X):
// Ataque A (bumerán): lanza su corona de piedra, que va y vuelve a su cabeza.
// Ataque B (aparecer): se deshace en polvo y reaparece de golpe junto a la papa.
class Huaca extends ArenaBoss {
  constructor(tx, ty) {
    super(tx, ty, CONFIG.BOSSES.huaca);
  }

  prepare() {
    this.throwsLeft = 0;
    this.throwTimer = 0;
    this.groundY = this.spawnY;
  }

  attackStates() { return ['lanzar', 'sink', 'under', 'emerge']; }

  attack(kind, level, player) {
    if (kind === 'a') {
      // A (de Boomer Kuwanger): lanza su corona como bumerán (dos si está enojado)
      this.throwsLeft = this.angry() ? 2 : 1;
      this.throwTimer = 0.35;
      this.setState('lanzar');
    } else {
      this.setState('sink', this.def.SINK_TIME);
    }
  }

  // Cuánto asoma del suelo (0 escondida, 1 entera)
  shown() {
    if (this.state === 'emerge') return 1 - Math.max(0, this.timer) / this.def.EMERGE_TIME;
    if (this.state === 'sink') return Math.max(0, this.timer) / this.def.SINK_TIME;
    if (this.state === 'under') return 0;
    return 1;
  }

  // Bajo tierra no daña ni se le puede pisar
  isHarmful() {
    return this.state !== 'under' && super.isHarmful();
  }

  idleMove(dt, level, player) {
    this.facePlayer(player);
  }

  think(dt, level, player) {
    const D = this.def;
    if (this.state === 'intro') {
      if (this.timer <= 0) this.startIdle();
    } else if (this.state === 'lanzar') {
      this.facePlayer(player);
      this.throwTimer -= dt;
      if (this.throwTimer <= 0 && this.throwsLeft > 0) {
        this.throwTimer = (D.CROWN_OUT * 2 + 0.3) / this.speed();
        this.throwsLeft--;
        this.throwCrown(player);
      }
      const flying = this.shots.some(function (sh) { return sh.kind === 'corona'; });
      if (this.throwsLeft === 0 && !flying) this.startIdle();
    } else if (this.state === 'sink') {
      if (this.timer <= 0) {
        // Bajo tierra: fija el lugar donde va a salir (bajo la papa)
        const B = this.bounds(level);
        const goal = player.x + player.w / 2 - this.w / 2;
        this.x = Math.max(B.left, Math.min(B.right - this.w, goal));
        this.setState('under', D.WARN_TIME / this.speed());
      }
    } else if (this.state === 'under') {
      if (this.timer <= 0) {
        this.setState('emerge', D.EMERGE_TIME);
        this.shakeTime = 0.25;
        Sfx.play('appear');
      }
    } else if (this.state === 'emerge') {
      if (this.timer <= 0) this.startIdle();
    }
    this.y = this.groundY + this.h * (1 - this.shown());
  }

  // Corona de piedra: va recta hacia donde está la papa y vuelve a la cabeza
  throwCrown(player) {
    const sx = this.centerX() - 6;
    const sy = this.y - 6;
    const dx = player.x + player.w / 2 - sx;
    const dy = player.y + player.h / 2 - sy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const v = this.def.CROWN_SPEED * this.speed();
    this.addShot({ x: sx, y: sy, w: 12, h: 8, vx: dx / len * v, vy: dy / len * v, life: 9, t: 0, kind: 'corona' });
    Sfx.play('dash');
  }

  // Piedra en arco que cae donde estaba la papa
  throwRock(player) {
    const t = this.def.ROCK_TIME / this.speed();
    const g = 600;
    const sx = this.centerX() - 3;
    const sy = this.y - 4;
    const dx = player.x + player.w / 2 - sx;
    const dy = player.y + player.h / 2 - sy;
    this.addShot({ x: sx, y: sy, w: 6, h: 6, vx: dx / t, vy: dy / t - g * t / 2, g: g,
                   life: 3, kind: 'rock' });
    Sfx.play('stomp');
  }

  baseSprite() { return 'huaca_quieta'; }
  shakeSprite() { return 'huaca_sacudir'; }

  spriteName() {
    if (this.state === 'hurt') return 'huaca_dano';
    if (this.state === 'dying') return 'huaca_derrota';
    if (this.state === 'lanzar') return Sprites.has('huaca_bumeran') ? 'huaca_bumeran' : 'huaca_lanzar';
    if (this.state === 'sink' || this.state === 'emerge') {
      return Sprites.has('huaca_desaparecer') ? 'huaca_desaparecer' : 'huaca_hundirse';
    }
    if (this.state === 'under') return null;
    return 'huaca_quieta';
  }

  // Hundirse: cuadros hacia adelante; emerger: los mismos al revés
  spriteFrame(name) {
    if (name !== 'huaca_hundirse' && name !== 'huaca_desaparecer') return super.spriteFrame(name);
    const n = Sprites.frames(name);
    return Math.min(n - 1, Math.floor((1 - this.shown()) * n));
  }

  // Polvo y piedritas donde va a salir
  drawExtras(ctx) {
    if (this.state !== 'under') return;
    const cx = this.centerX();
    const ground = this.groundY + this.h;
    ctx.fillStyle = '#b8b2a7';
    for (let i = 0; i < 5; i++) {
      const a = this.animTime * 9 + i * 1.3;
      ctx.fillRect(Math.round(cx - 10 + i * 5), Math.round(ground - 2 - Math.abs(Math.sin(a)) * 5), 2, 2);
    }
    this.drawWarning(ctx, cx, ground - 22);
  }

  // Con sprite se ve solo la parte que asoma (sin sprite, el dibujo hace lo mismo)
  drawLook(ctx) {
    if (this.state === 'under') return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x - 12, this.groundY - 24, this.w + 24, this.h + 24);
    ctx.clip();
    super.drawLook(ctx);
    ctx.restore();
  }

  // Bloque de piedra con ojos que brillan
  drawBody(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    ctx.fillStyle = '#6d6a8a';
    ctx.fillRect(x, y, this.w, this.h);
    ctx.fillStyle = '#8a87a8';
    ctx.fillRect(x, y, this.w, 3);
    ctx.fillRect(x + 2, y + 16, this.w - 4, 2);
    ctx.fillStyle = this.state === 'lanzar' ? '#ff6b3a' : '#ffd34d';
    ctx.fillRect(x + 5, y + 7, 4, 3);
    ctx.fillRect(x + this.w - 9, y + 7, 4, 3);
    ctx.fillStyle = '#3a3850';
    ctx.fillRect(x + 7, y + 22, this.w - 14, 2);
  }
}

// ---------- Cuy Gigante (archivos cuygig_*) ----------
// Ataques copiados de Spark Mandrill (Mega Man X):
// Calma: mira y olfatea.
// Ataque A (embestida): corre hasta la pared, choca y queda mareado (se le pisa,
// y mientras está mareado no daña).
// Ataque B (techo): salta al techo, se cuelga y se corre sobre la papa; cae y
// suelta chispas que corren por el suelo y suben por las paredes.
class GiantCuy extends ArenaBoss {
  constructor(tx, ty) {
    super(tx, ty, CONFIG.BOSSES.cuy);
  }

  attackStates() { return ['charge', 'crouch', 'leap', 'slam', 'climb', 'ceiling', 'fall']; }
  restStates() { return ['dizzy']; }

  attack(kind, level, player) {
    this.facePlayer(player);
    if (kind === 'a') {
      this.setState('charge');
      Sfx.play('alert');
      return;
    }
    // B: salta al techo, se cuelga y cae sobre la papa (sin techo: salto aplastante)
    const top = this.ceilingY(level);
    if (top === null) {
      this.setState('crouch', 0.35 / this.speed());
      return;
    }
    this.hangY = top;
    this.vy = -Math.sqrt(2 * CONFIG.ENEMIES.GRAVITY * Math.max(16, this.y - top + 4));
    this.setState('climb');
    Sfx.play('jump');
  }

  // Chispas a los dos lados: corren por el suelo y suben por las paredes
  sparks() {
    const y = this.y + this.h - 8;
    const cx = this.centerX();
    [-1, 1].forEach(function (d) {
      this.addShot({ x: cx - 4 + d * 10, y: y, w: 8, h: 8, vx: d * this.def.SPARK_SPEED * this.speed(),
                     life: 5, kind: 'spark' });
    }, this);
  }

  think(dt, level, player) {
    const D = this.def;
    if (this.state === 'intro') {
      this.idleMove(dt, level, player);
      if (this.timer <= 0) this.startIdle();
    } else if (this.state === 'charge') {
      this.vx = this.dir * D.CHARGE_SPEED * this.speed();
      const hit = this.moveBody(dt, level, true);
      if (hit.wall) {
        this.vx = 0;
        this.setState('dizzy', D.DIZZY_TIME);
        this.shakeTime = 0.3;
        Sfx.play('bossLand');
        const R = CONFIG.SFX.RUMBLE.BOSS_LAND;
        Input.rumble(R.TIME, R.STRONG, R.WEAK);
        Effects.play('polvo', this.dir > 0 ? this.x + this.w : this.x, this.y + this.h - 8);
      }
    } else if (this.state === 'dizzy') {
      this.vx = 0;
      this.moveBody(dt, level, true);
      if (this.timer <= 0) this.startIdle(0.5);
    } else if (this.state === 'crouch') {
      this.idleMove(dt, level, player);
      if (this.timer <= 0) {
        this.jumpTo(level, player.x + player.w / 2 - this.w / 2, D.LEAP_TIME);
        this.setState('leap');
      }
    } else if (this.state === 'leap') {
      const hit = this.moveBody(dt, level, true);
      if (hit.ground) {
        this.vx = 0;
        this.groundWaves(D.WAVE_SPEED * this.speed());
        this.shakeTime = 0.3;
        Sfx.play('bossLand');
        Effects.play('polvo', this.centerX(), this.y + this.h - 8);
        this.setState('slam', 0.35);
      }
    } else if (this.state === 'slam') {
      this.idleMove(dt, level, player);
      if (this.timer <= 0) this.startIdle();
    } else if (this.state === 'climb') {
      this.vy = Math.min(this.vy + CONFIG.ENEMIES.GRAVITY * dt, 0);
      this.y += this.vy * dt;
      if (this.y <= this.hangY || this.vy >= 0) {
        this.y = Math.max(this.hangY, this.y);
        this.vy = 0;
        this.setState('ceiling', D.CEILING_TIME / this.speed());
      }
    } else if (this.state === 'ceiling') {
      // Colgado, se corre hasta quedar sobre la papa
      const goal = player.x + player.w / 2 - this.w / 2;
      const B = this.bounds(level);
      const step = 120 * dt;
      this.x = Math.max(B.left, Math.min(B.right - this.w, this.x + Math.max(-step, Math.min(step, goal - this.x))));
      this.facePlayer(player);
      if (this.timer <= 0) this.setState('fall');
    } else if (this.state === 'fall') {
      const hit = this.moveBody(dt, level, true);
      if (hit.ground) {
        this.sparks();
        this.shakeTime = 0.35;
        Sfx.play('bossLand');
        const R = CONFIG.SFX.RUMBLE.BOSS_LAND;
        Input.rumble(R.TIME, R.STRONG, R.WEAK);
        Effects.play('polvo', this.centerX(), this.y + this.h - 8);
        this.setState('slam', 0.45);
      }
    }
  }

  baseSprite() { return 'cuygig_mirar'; }
  shakeSprite() { return 'cuygig_sacudir'; }

  spriteName() {
    if (this.state === 'hurt') return 'cuygig_dano';
    if (this.state === 'dying') return 'cuygig_derrota';
    if (this.state === 'charge') return 'cuygig_embestir';
    if (this.state === 'dizzy') return 'cuygig_mareado';
    if (this.state === 'ceiling') return Sprites.has('cuygig_techo') ? 'cuygig_techo' : 'cuygig_salto';
    if (this.state === 'crouch' || this.state === 'leap' || this.state === 'slam' ||
        this.state === 'climb' || this.state === 'fall') return 'cuygig_salto';
    return 'cuygig_mirar';
  }

  spriteFrame(name) {
    if (name !== 'cuygig_salto') return super.spriteFrame(name);
    return { crouch: 0, leap: 1, climb: 1, fall: 1, slam: 2 }[this.state] || 0;
  }

  drawBody(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y) + (this.state === 'crouch' ? 3 : 0);
    const run = this.state === 'charge' ? Math.round(Math.sin(this.animTime * 25)) : 0;
    // Pelaje café con manchas blancas
    ctx.fillStyle = '#a0683a';
    ctx.fillRect(x, y + 4 + run, this.w, this.h - 8);
    ctx.fillStyle = '#f2e6c9';
    ctx.fillRect(x + 8, y + 6 + run, 8, 6);
    // Cabeza, ojo, hocico y oreja hacia donde mira
    const hx = this.dir > 0 ? x + this.w - 10 : x;
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(hx, y + run, 10, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.dir > 0 ? hx + 9 : hx - 1, y + 7 + run, 2, 3);
    ctx.fillStyle = '#1b1035';
    ctx.fillRect(this.dir > 0 ? hx + 5 : hx + 3, y + 4 + run, 2, 2);
    ctx.fillStyle = '#5c3a20';
    ctx.fillRect(this.dir > 0 ? hx + 1 : hx + 6, y - 2 + run, 3, 3);
    // Patas
    ctx.fillStyle = '#5c3a20';
    ctx.fillRect(x + 3, y + this.h - 4, 4, 4);
    ctx.fillRect(x + this.w - 7, y + this.h - 4, 4, 4);
    // "!" antes de embestir
    if (this.state === 'idle' && this.timer < 0.4) this.drawWarning(ctx, x + this.w / 2, y - 8);
  }
}

// ---------- Guardián del Tambor (archivos bombo_*) ----------
// Ataques copiados de Chill Penguin (Mega Man X):
// Ataque A (rodar): se agacha, se tumba y rueda de pared a pared (2 cruces, 3 si
// está enojado). Después queda cansado (se le pisa y no daña).
// Ataque B (ventarrón): salta al techo y se cuelga de él tocando el redoble: el
// viento empuja a la papa hacia la pared y salen ráfagas. Luego cae con ondas.
class Bombo extends ArenaBoss {
  constructor(tx, ty) {
    super(tx, ty, CONFIG.BOSSES.bombo);
  }

  prepare() {
    this.passesLeft = 0;
    this.gustTimer = 0;
    this.windDir = 0;
    this.hangY = null;
  }

  attackStates() { return ['crouch', 'roll', 'jumpUp', 'hang', 'drop']; }
  restStates() { return ['tired']; }

  attack(kind, level, player) {
    this.facePlayer(player);
    if (kind === 'a') {
      this.passesLeft = this.def.ROLL_PASSES + (this.angry() ? 1 : 0);
      this.setState('crouch', this.def.CROUCH_TIME / this.speed());
      return;
    }
    // Salta hasta el techo (si la arena no tiene techo, rueda otra vez)
    const top = this.ceilingY(level);
    if (top === null) {
      this.attack('a', level, player);
      return;
    }
    this.hangY = top;
    this.vy = -Math.sqrt(2 * CONFIG.ENEMIES.GRAVITY * Math.max(16, this.y - top + 4));
    this.vx = 0;
    this.setState('jumpUp');
    Sfx.play('jump');
  }

  // Colgado empuja a la papa lejos de él
  wind() {
    return this.state === 'hang' ? this.windDir * CONFIG.WIND.PUSH : 0;
  }

  think(dt, level, player) {
    const D = this.def;
    if (this.state === 'intro') {
      this.idleMove(dt, level, player);
      if (this.timer <= 0) this.startIdle();
    } else if (this.state === 'crouch') {
      this.idleMove(dt, level, player);
      if (this.timer <= 0) {
        this.setState('roll');
        Sfx.play('dash');
      }
    } else if (this.state === 'roll') {
      this.vx = this.dir * D.ROLL_SPEED * this.speed();
      const hit = this.moveBody(dt, level, true);
      if (hit.wall) {
        this.passesLeft--;
        this.shakeTime = 0.2;
        Sfx.play('bossLand');
        Effects.play('polvo', this.dir > 0 ? this.x + this.w : this.x, this.y + this.h - 8);
        if (this.passesLeft <= 0) {
          this.vx = 0;
          this.setState('tired', D.TIRED_TIME);
        } else {
          this.dir = -this.dir;
        }
      }
    } else if (this.state === 'jumpUp') {
      this.vy = Math.min(this.vy + CONFIG.ENEMIES.GRAVITY * dt, 0);
      this.y += this.vy * dt;
      if (this.y <= this.hangY || this.vy >= 0) {
        this.y = Math.max(this.hangY, this.y);
        this.vy = 0;
        this.windDir = player.x + player.w / 2 < this.centerX() ? -1 : 1;
        this.gustTimer = 0;
        this.setState('hang', D.HANG_TIME / this.speed());
      }
    } else if (this.state === 'hang') {
      this.vx = 0;
      this.vy = 0;
      this.gustTimer -= dt;
      if (this.gustTimer <= 0) {
        this.gustTimer = D.GUST_EVERY;
        const gy = this.floor - 10 - Math.random() * 40;
        this.addShot({ x: this.centerX(), y: gy, w: 14, h: 8, vx: this.windDir * 160, life: 2.2,
                       kind: 'rafaga', harms: false });
        Sfx.play('drum');
      }
      if (this.timer <= 0) this.setState('drop');
    } else if (this.state === 'drop') {
      const hit = this.moveBody(dt, level, true);
      if (hit.ground) {
        this.groundWaves(D.WAVE_SPEED * this.speed());
        this.shakeTime = 0.3;
        Sfx.play('bossLand');
        const R = CONFIG.SFX.RUMBLE.BOSS_LAND;
        Input.rumble(R.TIME, R.STRONG, R.WEAK);
        Effects.play('polvo', this.centerX(), this.y + this.h - 8);
        this.setState('tired', D.TIRED_TIME);
      }
    } else if (this.state === 'tired') {
      this.idleMove(dt, level, player);
      if (this.timer <= 0) this.startIdle(0.4);
    }
  }

  baseSprite() { return 'bombo_quieto'; }
  shakeSprite() { return 'bombo_sacudir'; }

  spriteName() {
    if (this.state === 'hurt') return 'bombo_dano';
    if (this.state === 'dying') return 'bombo_derrota';
    if (this.state === 'crouch' || this.state === 'jumpUp' || this.state === 'drop') return 'bombo_salto';
    if (this.state === 'roll') return Sprites.has('bombo_rodar') ? 'bombo_rodar' : 'bombo_salto';
    if (this.state === 'hang') return Sprites.has('bombo_colgado') ? 'bombo_colgado' : 'bombo_redoble';
    if (this.state === 'tired') return 'bombo_cansado';
    return 'bombo_quieto';
  }

  spriteFrame(name) {
    if (name === 'bombo_salto') return this.state === 'crouch' ? 0 : 1;
    return super.spriteFrame(name);
  }

  // Tambor rosado con aros dorados y parche claro; rodando gira
  drawBody(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y) + (this.state === 'crouch' ? 3 : 0);
    ctx.save();
    if (this.state === 'roll') {
      ctx.translate(x + this.w / 2, y + this.h / 2);
      ctx.rotate(this.animTime * 14 * this.dir);
      ctx.translate(-x - this.w / 2, -y - this.h / 2);
    }
    ctx.fillStyle = '#e07a8f';
    ctx.fillRect(x, y + 4, this.w, this.h - 8);
    ctx.fillStyle = '#fbf6ec';
    ctx.fillRect(x + 1, y, this.w - 2, 5);
    ctx.fillStyle = '#e9c46a';
    for (let i = 0; i < this.w - 4; i += 4) ctx.fillRect(x + 2 + i, y + 8 + (i % 8 ? 4 : 0), 3, 2);
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(x + 4, y + this.h - 4, 4, 4);
    ctx.fillRect(x + this.w - 8, y + this.h - 4, 4, 4);
    ctx.restore();
    if (this.state === 'hang') {
      ctx.fillStyle = '#8a87a8';
      ctx.fillRect(x + this.w / 2 - 1, y - 6, 2, 6);
    }
  }
}

// Tipo de jefe que pide cada nivel (boss.type en levels.js)
// ---------- Gusano Taladro (zona 3, sala 9) ----------
// Calma: asoma en el suelo mirando a la papa (se le puede pisar).
// Ataque A (túnel): se hunde, viaja bajo tierra hacia la papa (un montículo la
// sigue), el suelo tiembla y sale de golpe hacia arriba soltando piedras a los
// lados; al caer queda cansado.
// Ataque B (pared): se hunde y aparece dentro de la pared más lejana; avisa, cruza
// la arena taladrando (hay que saltarlo) y se clava en la pared de enfrente: caen
// cristales del techo y queda clavado un rato (se le pisa).
class Gusano extends ArenaBoss {
  constructor(tx, ty) {
    super(tx, ty, CONFIG.BOSSES.gusano);
  }

  prepare() {
    this.under = false;     // bajo tierra o dentro de la pared: no se lo toca
    this.mode = 'a';
    this.side = 1;
  }

  attackStates() { return ['dig', 'under', 'warn', 'burst', 'charge']; }
  restStates() { return ['tired', 'stuck']; }

  isHarmful() {
    return !this.under && super.isHarmful();
  }

  isStompedBy(p) {
    return !this.under && super.isStompedBy(p);
  }

  attack(kind, level, player) {
    this.mode = kind;
    this.vx = 0;
    if (kind === 'b') {
      // Sale de la pared más lejana a la papa y cruza hacia ella
      const B = this.bounds(level);
      this.side = player.x + player.w / 2 < (B.left + B.right) / 2 ? -1 : 1;
    }
    this.setState('dig', this.def.DIG_TIME / this.speed());
    Sfx.play('walls');
  }

  think(dt, level, player) {
    const D = this.def;
    const B = this.bounds(level);
    if (this.state === 'intro') {
      this.settle(dt, level);
      this.facePlayer(player);
      if (this.timer <= 0) this.startIdle();
      return;
    }
    if (this.state === 'dig') {
      if (this.timer > 0) return;
      this.under = true;
      if (this.mode === 'b') {
        // Aparece dentro de la pared más lejana a la papa
        this.x = this.side > 0 ? B.left : B.right - this.w;
        this.dir = this.side;
        this.setState('under', 0.6 / this.speed());
      } else {
        this.setState('under', D.UNDER_TIME / this.speed());
      }
      return;
    }
    if (this.state === 'under') {
      if (this.mode === 'a') {
        const goal = player.x + player.w / 2 - this.w / 2;
        const step = D.UNDER_SPEED * this.speed() * dt;
        this.x += Math.max(-step, Math.min(step, goal - this.x));
        this.x = Math.max(B.left, Math.min(B.right - this.w, this.x));
        if (Math.floor(this.animTime * 6) !== Math.floor((this.animTime - dt) * 6)) {
          Effects.play('polvo', this.centerX(), this.floor);
        }
      }
      if (this.timer <= 0) this.setState('warn', D.WARN_TIME / this.speed());
      return;
    }
    if (this.state === 'warn') {
      this.shakeTime = 0.1;
      if (this.timer > 0) return;
      this.under = false;
      Sfx.play('roar');
      if (this.mode === 'a') {
        this.y = this.floor - this.h;
        this.vy = -D.BURST_SPEED;
        this.setState('burst', 3);
        const cx = this.centerX();
        [-1, 1].forEach(function (d) {
          this.addShot({ x: cx - 4, y: this.y, w: 8, h: 8, vx: d * D.ROCK_SPEED, vy: -260, g: 600, life: 3, kind: 'rock' });
          this.addShot({ x: cx - 4, y: this.y, w: 8, h: 8, vx: d * D.ROCK_SPEED * 0.55, vy: -330, g: 600, life: 3, kind: 'rock' });
        }, this);
      } else {
        this.y = this.floor - this.h;
        this.vx = this.side * D.CHARGE_SPEED * this.speed();
        this.setState('charge', 6);
      }
      return;
    }
    if (this.state === 'burst') {
      const hit = this.moveBody(dt, level, true);
      if (hit.ground && this.vy === 0 && this.timer < 2.9) {
        this.shakeTime = 0.3;
        Sfx.play('bossLand');
        this.setState('tired', D.TIRED_TIME);
      }
      return;
    }
    if (this.state === 'charge') {
      this.vx = this.side * D.CHARGE_SPEED * this.speed();
      const hit = this.moveBody(dt, level, true);
      if (hit.wall || this.timer <= 0) {
        this.vx = 0;
        this.shakeTime = 0.35;
        Sfx.play('bossLand');
        this.dropCrystals(level, player);
        this.setState('stuck', D.STUCK_TIME);
      }
      return;
    }
    if (this.state === 'tired' || this.state === 'stuck') {
      this.settle(dt, level);
      if (this.timer <= 0) this.startIdle();
    }
  }

  // Cristales que caen del techo: uno sobre la papa y otros repartidos
  dropCrystals(level, player) {
    const B = this.bounds(level);
    const T = CONFIG.TILE;
    const top = Math.max(this.viewTop(), level.arena ? 0 : this.y - 6 * T);
    const xs = [player.x + player.w / 2];
    for (let i = 1; i < this.def.CEILING_ROCKS; i++) xs.push(B.left + (B.right - B.left) * (i / this.def.CEILING_ROCKS));
    xs.forEach(function (x, i) {
      this.addShot({ x: x - 4, y: top + 4 - i * 20, w: 8, h: 8, vy: 0, g: 420, life: 4, kind: 'rock' });
    }, this);
  }

  spriteName() {
    if (this.state === 'hurt') return 'gusano_dano';
    if (this.state === 'dying') return 'gusano_derrota';
    if (this.state === 'dig') return 'gusano_hundirse';
    if (this.state === 'burst') return 'gusano_salir';
    if (this.state === 'charge') return 'gusano_taladrar';
    if (this.state === 'tired' || this.state === 'stuck') return 'gusano_cansado';
    return 'gusano_quieto';
  }

  baseSprite() { return 'gusano_quieto'; }
  shakeSprite() { return 'gusano_sacudir'; }

  draw(ctx) {
    // Bajo tierra: montículo (y "!" cuando va a salir); dentro de la pared: grietas
    if (this.under && this.started && this.state !== 'dead') {
      this.shots.forEach(function (s) { this.drawShot(ctx, s); }, this);
      this.drawUnder(ctx);
      return;
    }
    if (this.state === 'dig') {
      // Se hunde: se dibuja solo lo que queda sobre el suelo
      const k = Math.max(0, this.timer / (this.def.DIG_TIME / this.speed()));
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.x - 8, this.floor - this.h * k - 2, this.w + 16, this.h * k + 2);
      ctx.clip();
      super.draw(ctx);
      ctx.restore();
      return;
    }
    super.draw(ctx);
  }

  drawUnder(ctx) {
    const cx = Math.round(this.centerX());
    const y = Math.round(this.floor);
    const warn = this.state === 'warn';
    const shake = warn ? Math.round(Math.sin(this.animTime * 60)) : 0;
    ctx.fillStyle = '#5a4436';
    ctx.fillRect(cx - 10 + shake, y - 3, 20, 3);
    ctx.fillRect(cx - 6 + shake, y - 5, 12, 2);
    if (this.mode === 'b') {
      // grietas en la pared por donde va a salir
      ctx.fillStyle = 'rgba(46, 42, 71, 0.8)';
      const wx = this.side > 0 ? Math.round(this.x) : Math.round(this.x + this.w) - 2;
      ctx.fillRect(wx, y - 18, 2, 16);
      ctx.fillRect(wx + (this.side > 0 ? 2 : -4), y - 12, 4, 2);
    }
    if (warn) this.drawWarning(ctx, this.mode === 'b' ? cx : cx, y - 26);
  }

  drawBody(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.w;
    const h = this.h;
    const front = this.dir > 0;
    const wiggle = Math.sin(this.animTime * (this.state === 'charge' ? 20 : 4)) * 1.5;
    // Tres anillos del cuerpo
    ctx.fillStyle = '#7a5a48';
    for (let i = 0; i < 3; i++) {
      const sx = front ? x + i * 7 : x + w - 12 - i * 7;
      ctx.fillRect(sx, Math.round(y + 6 + (i % 2 ? wiggle : -wiggle)), 12, h - 6);
    }
    ctx.fillStyle = '#a07a62';
    ctx.fillRect(x + 4, y + 9, w - 8, 2);
    // Taladro en la cabeza
    const tx = front ? x + w - 8 : x;
    const spin = Math.floor(this.animTime * 20) % 2;
    ctx.fillStyle = spin ? '#c9a35b' : '#e9c46a';
    ctx.beginPath();
    if (front) {
      ctx.moveTo(tx, y + 4); ctx.lineTo(tx + 12, y + h / 2 + 2); ctx.lineTo(tx, y + h);
    } else {
      ctx.moveTo(tx + 8, y + 4); ctx.lineTo(tx - 4, y + h / 2 + 2); ctx.lineTo(tx + 8, y + h);
    }
    ctx.closePath();
    ctx.fill();
    // Ojo
    ctx.fillStyle = '#fbf6ec';
    ctx.fillRect(front ? x + w - 13 : x + 10, y + 8, 3, 3);
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(front ? x + w - 12 : x + 11, y + 9, 1, 1);
    ctx.strokeStyle = 'rgba(46, 42, 71, 0.8)';
    ctx.strokeRect(x + 0.5, y + 6.5, w - 1, h - 7);
  }
}

// ---------- Eco del Silencio (prólogo) ----------
// Una máquina gris que flota: un gran ojo-lente, engranajes que giran y dos
// bocinas a los lados. No ataca de cerca: llena la arena de "silencios" (los
// símbolos de pausa de la música). Ciclo:
//   flota (calma) → ataque A (espiral de silencios) o B (columnas que caen, con
//   aviso) → apunta sobre la papa → se estrella contra el suelo soltando ondas →
//   queda recalentado en el suelo (aquí se le pisa) → vuelve a subir.
// Fase 2 (66 %): espiral de 4 brazos y 4 columnas. Fase 3 (33 %): todo más rápido
// y anillos de silencios al estrellarse. Da el diapasón.
class EcoSilencio extends ArenaBoss {
  constructor(tx, ty) {
    super(tx, ty, CONFIG.BOSSES.eco);
  }

  prepare() {
    this.pending = null;      // ataque que hace al terminar de subir
    this.columns = [];        // x de las columnas avisadas
    this.fireTimer = 0;
    this.angle = 0;
    this.gear = 0;
    this.eyeX = 0;
    this.eyeY = 0;
    this.steam = [];
  }

  attackStates() { return ['rise', 'spiral', 'columns', 'drop', 'aim', 'slam']; }
  restStates() { return ['tired']; }

  // Solo se le pisa cuando está recalentado en el suelo
  canBeHit() {
    return this.started && !this.hidden && this.state === 'tired';
  }

  speed() {
    return this.phaseSpeed(0.18);
  }

  hoverY() {
    return this.floor - this.def.HOVER * CONFIG.TILE - this.h;
  }

  // Todo ataque empieza subiendo a su altura
  attack(kind) {
    this.pending = kind;
    this.vx = 0;
    this.setState('rise');
  }

  startPending(level, player) {
    const D = this.def;
    if (this.pending === 'a') {
      this.setState('spiral', D.SPIRAL_TIME);
      this.fireTimer = 0;
      this.angle = Math.random() * Math.PI * 2;
      Sfx.play('alert');
    } else {
      const B = this.bounds(level);
      const T = CONFIG.TILE;
      const n = D.COLUMNS + (this.phaseIndex() > 0 ? 1 : 0);
      const px = player.x + player.w / 2;
      const list = [px];
      let tries = 0;
      while (list.length < n && tries++ < 40) {
        const x = B.left + T + Math.random() * (B.right - B.left - 2 * T);
        if (list.every(function (o) { return Math.abs(o - x) > 3 * T; })) list.push(x);
      }
      this.columns = list;
      this.setState('columns', D.COLUMN_WARN / this.speed());
      Sfx.play('alert');
    }
  }

  think(dt, level, player) {
    const D = this.def;
    this.gear += dt * (this.state === 'spiral' ? 9 : this.state === 'tired' ? 0.5 : 2.5);
    const goalHover = this.hoverY();
    if (this.state === 'intro') {
      this.y += (goalHover - this.y) * Math.min(1, dt * 2.5);
      this.facePlayer(player);
      if (this.timer <= 0) this.startIdle();
    } else if (this.state === 'rise') {
      this.y = Math.max(goalHover, this.y - D.RISE_SPEED * 1.6 * dt);
      this.x += (this.centerGoal(level, player) - this.x) * Math.min(1, dt * 1.5);
      if (this.y <= goalHover + 0.5) this.startPending(level, player);
    } else if (this.state === 'spiral') {
      this.bob(dt);
      this.fireTimer -= dt;
      const arms = this.phaseIndex() > 0 ? 4 : 2;
      this.angle += D.SPIRAL_TURN * this.speed() * dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = D.SPIRAL_EVERY / this.speed();
        for (let i = 0; i < arms; i++) this.shootRest(this.angle + i * Math.PI * 2 / arms, D.SPIRAL_SPEED * this.speed());
      }
      if (this.timer <= 0) this.startAim();
    } else if (this.state === 'columns') {
      this.bob(dt);
      if (this.timer <= 0) {
        this.columns.forEach(function (x) {
          this.addShot({ x: x - 6, y: this.viewTop() - 48, w: 12, h: 44, vy: D.COLUMN_SPEED * this.speed(),
                         life: 3, kind: 'columna', light: '#c9b8ff' });
        }, this);
        Sfx.play('appear');
        this.setState('drop', 0.9);
      }
    } else if (this.state === 'drop') {
      this.bob(dt);
      if (this.timer <= 0) this.startAim();
    } else if (this.state === 'aim') {
      // Se pone sobre la papa y tiembla (aviso)
      const goal = player.x + player.w / 2 - this.w / 2;
      const B = this.bounds(level);
      this.x += Math.max(-140 * dt, Math.min(140 * dt, goal - this.x));
      this.x = Math.max(B.left, Math.min(B.right - this.w, this.x));
      if (this.timer <= 0) {
        this.vy = 60;
        this.setState('slam');
      }
    } else if (this.state === 'slam') {
      this.vy = Math.min(D.SLAM_SPEED * 1.4, this.vy + 1600 * dt);
      const hit = this.moveBody(dt, level, false);
      if (hit.ground) this.landSlam();
    } else if (this.state === 'tired') {
      this.vx = 0;
      if (Math.random() < dt * 14) this.steam.push({ x: this.x + 6 + Math.random() * (this.w - 12), y: this.y + this.h - 4, t: 0 });
      if (this.timer <= 0) this.nextAttack(level, player);
    }
    this.steam.forEach(function (s) { s.t += dt; s.y -= 18 * dt; });
    this.steam = this.steam.filter(function (s) { return s.t < 0.8; });
  }

  // Centro de la arena (un poco hacia el lado contrario de la papa)
  centerGoal(level, player) {
    const B = this.bounds(level);
    const mid = (B.left + B.right) / 2 - this.w / 2;
    const side = player.x < mid ? 1 : -1;
    return mid + side * CONFIG.TILE * 2;
  }

  // En calma flota sobre la arena, meciéndose, y se acomoda lejos de la papa
  idleMove(dt, level, player) {
    this.facePlayer(player);
    this.gear += dt * 2.5;
    this.x += (this.centerGoal(level, player) - this.x) * Math.min(1, dt * 1.2);
    this.bob(dt);
  }

  bob(dt) {
    const goal = this.hoverY() + Math.sin(this.animTime * 2.4) * 4;
    this.y += (goal - this.y) * Math.min(1, dt * 4);
  }

  startAim() {
    this.setState('aim', 0.75 / this.speed());
    Sfx.play('alert');
  }

  landSlam() {
    const D = this.def;
    this.vy = 0;
    this.shakeTime = 0.45;
    Sfx.play('bossLand');
    const R = CONFIG.SFX.RUMBLE.BOSS_LAND;
    Input.rumble(R.TIME, R.STRONG, R.WEAK);
    Effects.play('polvo', this.centerX(), this.y + this.h - 8);
    BossShow.ring(this.centerX(), this.y + this.h, 70, '#c9b8ff', 0.5);
    const y = this.y + this.h - 10;
    const cx = this.centerX();
    [-1, 1].forEach(function (d) {
      this.addShot({ x: cx - 6 + d * 12, y: y, w: 12, h: 10, vx: d * D.WAVE_SPEED * this.speed(), life: 3,
                     kind: 'eco_wave', light: '#9f8bff' });
    }, this);
    // Fase 3: además, un anillo de silencios
    if (this.phaseIndex() >= 2) {
      for (let i = 0; i < 8; i++) this.shootRest(-Math.PI * (i + 0.5) / 8, 70);
    }
    this.setState('tired', D.TIRED_TIME);
  }

  shootRest(angle, speed) {
    const cx = this.centerX();
    const cy = this.y + this.h / 2;
    this.addShot({ x: cx - 4 + Math.cos(angle) * 12, y: cy - 5 + Math.sin(angle) * 10, w: 8, h: 10,
                   vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 5, kind: 'silencio',
                   light: '#e6e2f0', spin: Math.random() * 6 });
  }

  // Los proyectiles del Eco: silencios rectos, columnas que caen y ondas por el suelo
  updateShots(dt, level) {
    this.shots.forEach(function (s) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.kind === 'columna') {
        if (level.rectHitsSolid(s.x + 2, s.y + s.h - 4, s.w - 4, 4)) {
          s.life = 0;
          Effects.play('polvo', s.x + s.w / 2, s.y + s.h - 6);
          BossShow.ring(s.x + s.w / 2, s.y + s.h - 2, 26, '#c9b8ff', 0.35);
          Sfx.play('stomp');
        }
      } else if (s.kind === 'eco_wave') {
        if (level.rectHitsSolid(s.x, s.y, s.w, s.h - 2)) s.life = 0;
      } else if (level.rectHitsSolid(s.x + 2, s.y + 2, s.w - 4, s.h - 4)) {
        s.life = 0;
      }
    });
    this.shots = this.shots.filter(function (s) { return s.life > 0; });
  }

  // Luz del Eco según lo que hace (la usa js/light.js)
  lightColor() {
    if (this.state === 'aim' || this.state === 'slam') return '#ff4d6d';
    if (this.state === 'tired') return '#ff9a3c';
    return ['#c9b8ff', '#ff9ad5', '#ff4dc4'][this.phaseIndex()];
  }

  spriteName() {
    if (this.state === 'hurt') return 'eco_dano';
    if (this.state === 'dying') return 'eco_derrota';
    if (this.state === 'tired') return 'eco_recalentado';
    if (this.state === 'spiral' || this.state === 'columns' || this.state === 'drop') return 'eco_cantar';
    if (this.state === 'aim' || this.state === 'slam') return 'eco_caer';
    return 'eco_flotar';
  }

  baseSprite() { return 'eco_flotar'; }

  drawExtras(ctx) {
    // Aviso de las columnas: líneas que parpadean desde arriba hasta el suelo
    if (this.state === 'columns') {
      const k = 1 - this.timer / (this.def.COLUMN_WARN / this.speed());
      const on = Math.floor(this.animTime * 14) % 2 === 0;
      this.columns.forEach(function (x) {
        const top = this.viewTop();
        ctx.globalAlpha = 0.25 + k * 0.5;
        ctx.fillStyle = on ? '#ff4dc4' : '#c9b8ff';
        for (let y = top; y < this.floor; y += 6) ctx.fillRect(Math.round(x) - 1, y, 2, 3);
        ctx.globalAlpha = 0.18 * k;
        ctx.fillRect(Math.round(x) - 6, top, 12, this.floor - top);
        ctx.globalAlpha = 1;
      }, this);
    }
    // Sombra donde va a caer
    if (this.state === 'aim' || this.state === 'slam') {
      const w = this.w * (this.state === 'aim' ? 0.8 : 1.1);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath();
      ctx.ellipse(this.centerX(), this.floor - 1, w / 2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Vapor al estar recalentado
    this.steam.forEach(function (s) {
      ctx.globalAlpha = 0.5 * (1 - s.t / 0.8);
      ctx.fillStyle = '#e6e2f0';
      const r = 2 + s.t * 5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Dibujo por código (mientras no haya sprites eco_*)
  drawBody(ctx, player) {
    const cx = this.centerX();
    const cy = this.y + this.h / 2 + (this.state === 'aim' ? Math.sin(this.animTime * 50) : 0);
    const P = this.phaseIndex();
    const INK = '#2e2a47';
    const asleep = !this.started;
    const tired = this.state === 'tired';
    ctx.lineWidth = 1;
    // Engranaje de atrás (gira)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.gear * 0.4);
    ctx.fillStyle = '#5b5478';
    for (let i = 0; i < 10; i++) {
      ctx.rotate(Math.PI / 5);
      ctx.fillRect(-2, -this.h / 2 - 3, 4, 5);
    }
    ctx.restore();
    // Bocinas a los lados
    [-1, 1].forEach(function (d) {
      ctx.fillStyle = '#8a8296';
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.moveTo(cx + d * 10, cy - 4);
      ctx.lineTo(cx + d * 20, cy - 9);
      ctx.lineTo(cx + d * 20, cy + 9);
      ctx.lineTo(cx + d * 10, cy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3a3050';
      ctx.fillRect(cx + d * 19 - (d > 0 ? 0 : 1), cy - 7, 2, 14);
    });
    // Cuerpo
    ctx.fillStyle = P >= 2 ? '#7a6a88' : '#b8b2a7';
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 13, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(46,42,71,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, 12, 7, 0, 0, Math.PI);
    ctx.fill();
    // Grietas en las fases altas
    if (P >= 1) {
      ctx.strokeStyle = '#ff4dc4';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 6); ctx.lineTo(cx - 5, cy - 2); ctx.lineTo(cx - 7, cy + 2);
      if (P >= 2) { ctx.moveTo(cx + 8, cy - 7); ctx.lineTo(cx + 4, cy - 3); ctx.lineTo(cx + 7, cy + 1); }
      ctx.stroke();
    }
    // Ojo-lente
    const eye = asleep ? '#5b5478' : tired ? '#ff9a3c' : this.lightColor();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbf6ec';
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 6.5, 0, Math.PI * 2);
    ctx.fill();
    if (asleep || tired) {
      // Párpado cerrado
      ctx.fillStyle = '#8a8296';
      ctx.beginPath();
      ctx.arc(cx, cy - 1, 6.5, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.fillRect(cx - 6, cy - 1, 12, 1);
    } else {
      ctx.fillStyle = eye;
      ctx.beginPath();
      ctx.arc(cx + this.eyeX, cy - 1 + this.eyeY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(cx + this.eyeX, cy - 1 + this.eyeY, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(cx + this.eyeX) - 2, Math.round(cy - 1 + this.eyeY) - 3, 1, 1);
    }
    // Rejillas de abajo (brillan al estar recalentado)
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = tired ? (Math.floor(this.animTime * 8) % 2 ? '#ffd34d' : '#ff6b2e') : '#3a3050';
      ctx.fillRect(Math.round(cx + i * 5) - 1, Math.round(cy + 8), 3, 3);
    }
  }

  // El ojo mira a la papa
  update(dt, level, player) {
    super.update(dt, level, player);
    const dx = player.x + player.w / 2 - this.centerX();
    const dy = player.y + player.h / 2 - (this.y + this.h / 2);
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    this.eyeX += (dx / len * 2.5 - this.eyeX) * Math.min(1, dt * 8);
    this.eyeY += (dy / len * 2.5 - this.eyeY) * Math.min(1, dt * 8);
  }

  drawShot(ctx, s) {
    if (s.kind === 'silencio') {
      // Silencio de negra: un zigzag blanco con borde de tinta y un halo
      const x = Math.round(s.x + s.w / 2);
      const y = Math.round(s.y + s.h / 2);
      Light.drawGlow(ctx, x, y, 9, '#c9b8ff', 0.6);
      if (Sprites.drawAnchored(ctx, 'silencio_disparo', Sprites.frameAt('silencio_disparo', s.life), x, y + 8, false)) return;
      ctx.fillStyle = '#2e2a47';
      ctx.fillRect(x - 3, y - 6, 6, 12);
      ctx.fillStyle = '#fbf6ec';
      ctx.fillRect(x - 2, y - 5, 2, 2);
      ctx.fillRect(x - 1, y - 3, 2, 2);
      ctx.fillRect(x - 2, y - 1, 3, 2);
      ctx.fillRect(x - 1, y + 1, 2, 2);
      ctx.fillRect(x - 2, y + 3, 2, 2);
      return;
    }
    if (s.kind === 'columna') {
      const x = Math.round(s.x);
      const y = Math.round(s.y);
      Light.drawGlow(ctx, x + s.w / 2, y + s.h - 6, 18, '#c9b8ff', 0.8);
      if (Sprites.drawAnchored(ctx, 'columna_silencio', 0, x + s.w / 2, y + s.h, false)) return;
      const g = ctx.createLinearGradient(0, y, 0, y + s.h);
      g.addColorStop(0, 'rgba(201,184,255,0)');
      g.addColorStop(1, 'rgba(251,246,236,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 4, y + 6, s.w - 8, s.h - 6);
      return;
    }
    if (s.kind === 'eco_wave') {
      const x = Math.round(s.x);
      const y = Math.round(s.y);
      Light.drawGlow(ctx, x + s.w / 2, y + s.h, 14, '#9f8bff', 0.7);
      ctx.fillStyle = '#c9b8ff';
      ctx.fillRect(x, y + 4, s.w, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, y + 1, s.w - 4, 4);
      ctx.fillRect(x + 4, y - 2, s.w - 8, 3);
      return;
    }
    super.drawShot(ctx, s);
  }
}

// ---------- Toro Dorado (zona 4, sala 12) ----------
// Un toro de oro del tamaño de una casa, con un disco de sol en la frente.
// Ciclo: en calma escarba el suelo →
//   A · Embestida solar: avisa (escarba, los cuernos brillan y una flecha roja marca
//       el piso), cruza la arena dejando llamas en el suelo y se clava en la pared:
//       caen piedras del techo y queda con los cuernos clavados (aquí se le pisa).
//       En la fase 2 rebota una vez y embiste de nuevo antes de clavarse.
//   B · Salto del sol: se agacha, salta sobre la papa y cae con ondas por el suelo;
//       en la fase 2 salen columnas de luz del piso (con aviso). Queda mareado.
//   Fase 3: además llueve oro del techo mientras está en calma.
// Da el zapateo y la llave rosa.
class ToroDorado extends ArenaBoss {
  constructor(tx, ty) {
    super(tx, ty, CONFIG.BOSSES.toro);
  }

  prepare() {
    this.charges = 0;        // embestidas que le quedan en este ataque
    this.trail = 0;          // cada cuánto deja una llama
    this.ghosts = [];        // estela de la embestida
    this.rainTimer = 0;
    this.glint = 0;
  }

  attackStates() { return ['paw', 'charge', 'bounce', 'crouch', 'leap', 'slam']; }
  restStates() { return ['stuck', 'dazed']; }

  // Solo se le pisa con los cuernos clavados o mareado
  canBeHit() {
    return this.started && !this.hidden && (this.state === 'stuck' || this.state === 'dazed');
  }

  speed() {
    return this.phaseSpeed(0.15);
  }

  lightColor() {
    if (this.state === 'paw' || this.state === 'charge' || this.state === 'bounce') return '#ff6b2e';
    return ['#ffd34d', '#ff9a3c', '#ff4d3a'][this.phaseIndex()];
  }

  attack(kind, level, player) {
    this.facePlayer(player);
    this.vx = 0;
    if (kind === 'a') {
      this.charges = this.phaseIndex() >= 1 ? 2 : 1;
      this.setState('paw', this.def.PAW_TIME / this.speed());
      Sfx.play('alert');
    } else {
      this.setState('crouch', 0.45 / this.speed());
    }
  }

  think(dt, level, player) {
    const D = this.def;
    this.glint += dt;
    this.ghosts.forEach(function (g) { g.life -= dt; });
    this.ghosts = this.ghosts.filter(function (g) { return g.life > 0; });
    if (this.state === 'intro') {
      this.settle(dt, level);
      this.facePlayer(player);
      if (this.timer <= 0) this.startIdle();
    } else if (this.state === 'paw') {
      this.settle(dt, level);
      if (Math.random() < dt * 12) Effects.play('polvo', this.dir > 0 ? this.x + 4 : this.x + this.w - 4, this.y + this.h - 6, this.dir > 0);
      if (this.timer <= 0) {
        this.setState('charge');
        Sfx.play('roar');
        this.shakeTime = 0.2;
      }
    } else if (this.state === 'charge') {
      this.vx = this.dir * D.CHARGE_SPEED * this.speed();
      const hit = this.moveBody(dt, level, true);
      this.trail -= dt;
      if (this.trail <= 0) {
        this.trail = D.FLAME_EVERY;
        this.addShot({ x: this.centerX() - 5 - this.dir * 10, y: this.floor - 12, w: 10, h: 12, life: D.FLAME_LIFE,
                       kind: 'llama', light: '#ff7a2e' });
      }
      if (Math.random() < dt * 30) this.ghosts.push({ x: this.x, y: this.y, life: 0.2, dir: this.dir });
      if (hit.wall) this.hitWall(level);
    } else if (this.state === 'bounce') {
      // Rebotó contra la pared: retrocede un poco, se da vuelta y vuelve a embestir
      this.vx = -this.dir * 60;
      this.moveBody(dt, level, true);
      if (this.timer <= 0) {
        this.dir = -this.dir;
        this.setState('paw', 0.35);
      }
    } else if (this.state === 'stuck' || this.state === 'dazed') {
      this.vx = 0;
      this.settle(dt, level);
      if (this.timer <= 0) this.startIdle(0.6);
    } else if (this.state === 'crouch') {
      this.settle(dt, level);
      if (this.timer <= 0) {
        this.jumpTo(level, player.x + player.w / 2 - this.w / 2, D.LEAP_TIME);
        this.setState('leap');
        Sfx.play('jump');
      }
    } else if (this.state === 'leap') {
      const hit = this.moveBody(dt, level, true);
      if (hit.ground && this.vy >= 0) this.landSlam(level, player);
    } else if (this.state === 'slam') {
      this.settle(dt, level);
      if (this.timer <= 0) this.setState('dazed', D.DAZED_TIME);
    }
  }

  // En calma escarba; en la fase 3 llueve oro del techo
  idleMove(dt, level, player) {
    super.idleMove(dt, level, player);
    if (this.phaseIndex() < 2) return;
    this.rainTimer -= dt;
    if (this.rainTimer > 0) return;
    this.rainTimer = this.def.RAIN_EVERY;
    const B = this.bounds(level);
    const x = B.left + 8 + Math.random() * (B.right - B.left - 16);
    this.addShot({ x: x - 3, y: this.viewTop() - 8, w: 6, h: 8, vy: 40, g: 500, life: 3, kind: 'oro', light: '#ffd34d' });
  }

  hitWall(level) {
    const D = this.def;
    this.vx = 0;
    this.shakeTime = 0.45;
    Sfx.play('bossLand');
    const R = CONFIG.SFX.RUMBLE.BOSS_LAND;
    Input.rumble(R.TIME, R.STRONG, R.WEAK);
    Effects.play('polvo', this.dir > 0 ? this.x + this.w : this.x, this.y + this.h / 2);
    BossShow.ring(this.dir > 0 ? this.x + this.w : this.x, this.y + this.h / 2, 60, '#ffd34d', 0.4);
    // Caen piedras del techo
    const B = this.bounds(level);
    for (let i = 0; i < D.ROCKS + this.phaseIndex(); i++) {
      const x = B.left + 10 + Math.random() * (B.right - B.left - 20);
      this.addShot({ x: x - 4, y: this.viewTop() - 10 - Math.random() * 40, w: 8, h: 8, vy: 20, g: 600, life: 3,
                     kind: 'roca', light: '#ffb35c' });
    }
    this.charges--;
    if (this.charges > 0) this.setState('bounce', 0.3);
    else this.setState('stuck', D.STUCK_TIME);
  }

  landSlam(level, player) {
    const D = this.def;
    this.vx = 0;
    this.shakeTime = 0.45;
    Sfx.play('bossLand');
    const R = CONFIG.SFX.RUMBLE.BOSS_LAND;
    Input.rumble(R.TIME, R.STRONG, R.WEAK);
    Effects.play('polvo', this.centerX(), this.y + this.h - 8);
    BossShow.ring(this.centerX(), this.y + this.h, 90, '#ffd34d', 0.5);
    const y = this.y + this.h - 10;
    const cx = this.centerX();
    [-1, 1].forEach(function (d) {
      this.addShot({ x: cx - 6 + d * 16, y: y, w: 12, h: 10, vx: d * D.WAVE_SPEED * this.speed(), life: 3,
                     kind: 'onda_oro', light: '#ffd34d' });
    }, this);
    // Fase 2 en adelante: columnas de luz que salen del piso (avisan antes)
    if (this.phaseIndex() >= 1) {
      const B = this.bounds(level);
      const n = 2 + this.phaseIndex();
      for (let i = 0; i < n; i++) {
        const x = i === 0 ? player.x + player.w / 2 : B.left + 12 + Math.random() * (B.right - B.left - 24);
        this.addShot({ x: x - 7, y: this.floor - 64, w: 14, h: 64, life: D.PILLAR_WARN + 0.5, warn: D.PILLAR_WARN,
                       harms: false, kind: 'pilar', light: '#fff6e0' });
      }
    }
    this.setState('slam', 0.35);
  }

  updateShots(dt, level) {
    this.shots.forEach(function (s) {
      s.life -= dt;
      if (s.kind === 'pilar') {
        s.warn -= dt;
        if (s.warn <= 0 && s.harms === false) {
          s.harms = true;
          Sfx.play('appear');
          BossShow.ring(s.x + s.w / 2, s.y + s.h, 22, '#fff6e0', 0.3);
        }
        return;
      }
      if (s.kind === 'llama') return;
      s.vy += (s.g || 0) * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.kind === 'onda_oro') {
        if (level.rectHitsSolid(s.x, s.y, s.w, s.h - 2)) s.life = 0;
        return;
      }
      if (level.rectHitsSolid(s.x + 1, s.y + 1, s.w - 2, s.h - 2)) {
        s.life = 0;
        Effects.play('polvo', s.x + s.w / 2, s.y + s.h - 4);
      }
    });
    this.shots = this.shots.filter(function (s) { return s.life > 0; });
  }

  spriteName() {
    if (this.state === 'hurt') return 'toro_dano';
    if (this.state === 'dying') return 'toro_derrota';
    if (this.state === 'charge' || this.state === 'bounce') return 'toro_embestir';
    if (this.state === 'paw') return 'toro_escarbar';
    if (this.state === 'stuck') return 'toro_clavado';
    if (this.state === 'dazed') return 'toro_mareado';
    if (this.state === 'crouch' || this.state === 'leap' || this.state === 'slam') return 'toro_salto';
    return 'toro_quieto';
  }

  baseSprite() { return 'toro_quieto'; }

  // El salto tiene 3 cuadros: agachado, en el aire y cayendo
  spriteFrame(name) {
    if (name !== 'toro_salto') return super.spriteFrame(name);
    return { crouch: 0, leap: this.vy < 0 ? 1 : 2, slam: 2 }[this.state] || 0;
  }

  drawExtras(ctx) {
    // Flecha roja en el piso antes de embestir
    if (this.state === 'paw') {
      const on = Math.floor(this.animTime * 12) % 2 === 0;
      const y = Math.round(this.floor - 3);
      ctx.globalAlpha = on ? 0.8 : 0.4;
      ctx.fillStyle = '#ff4d3a';
      const x0 = this.centerX();
      for (let i = 1; i < 9; i++) ctx.fillRect(Math.round(x0 + this.dir * i * 14) - 4, y, 8, 2);
      ctx.globalAlpha = 1;
    }
    // Sombra donde va a caer
    if (this.state === 'leap') {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ff4d3a';
      ctx.beginPath();
      ctx.ellipse(this.centerX() + this.vx * 0.25, this.floor - 1, this.w / 2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Estela dorada de la embestida
    this.ghosts.forEach(function (g) {
      ctx.globalAlpha = g.life / 0.2 * 0.35;
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(Math.round(g.x) + 4, Math.round(g.y) + 6, this.w - 8, this.h - 8);
    }, this);
    ctx.globalAlpha = 1;
  }

  drawBody(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y) + (this.state === 'crouch' ? 3 : 0);
    const w = this.w;
    const h = this.h;
    const P = this.phaseIndex();
    const INK = '#2e2a47';
    const run = this.state === 'charge' ? Math.round(Math.sin(this.animTime * 30) * 1.5) : 0;
    const front = this.dir > 0;
    const gold = ['#e9c46a', '#f4a261', '#ff8a5c'][P];
    // Aura de fuego en las fases altas
    if (P >= 1) Light.drawGlow(ctx, x + w / 2, y + h / 2, 34 + Math.sin(this.animTime * 9) * 3, P >= 2 ? '#ff4d3a' : '#ff9a3c', 0.35);
    // Patas
    ctx.fillStyle = '#8a5a2b';
    [4, 10, w - 14, w - 8].forEach(function (lx, i) {
      const lift = run && i % 2 === (Math.floor(this.animTime * 15) % 2) ? 2 : 0;
      ctx.fillRect(x + lx, y + h - 7 - lift, 4, 7);
    }, this);
    // Cuerpo
    ctx.fillStyle = gold;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + 1 + run, w / 2 - 2, h / 2 - 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(46, 42, 71, 0.18)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + 5 + run, w / 2 - 5, h / 4, 0, 0, Math.PI);
    ctx.fill();
    // Cabeza, hacia donde mira
    const hx = front ? x + w - 12 : x;
    const hy = y + 4 + run + (this.state === 'paw' || this.state === 'charge' ? 4 : 0);
    ctx.fillStyle = gold;
    ctx.fillRect(hx, hy, 12, 12);
    ctx.strokeRect(hx + 0.5, hy + 0.5, 11, 11);
    // Cuernos: salen hacia adelante y se curvan hacia arriba (uno detrás del otro)
    const d = front ? 1 : -1;
    const base = front ? hx + 8 : hx + 4;
    [[0, '#d8c8a0'], [-4 * d, '#fff6e0']].forEach(function (horn) {
      const bx = base + horn[0];
      ctx.fillStyle = horn[1];
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.moveTo(bx - 2 * d, hy + 3);
      ctx.quadraticCurveTo(bx + 10 * d, hy + 2, bx + 12 * d, hy - 8);
      ctx.quadraticCurveTo(bx + 6 * d, hy - 1, bx + 2 * d, hy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    if (this.state === 'paw' && Math.floor(this.animTime * 10) % 2 === 0) {
      Light.drawGlow(ctx, hx + 6 + 8 * (front ? 1 : -1), hy - 4, 14, '#fff6e0', 0.9);
    }
    // Disco de sol en la frente, ojo y aro
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(hx + 6, hy + 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = P >= 2 || this.state === 'charge' ? '#ff2e2e' : INK;
    ctx.fillRect(front ? hx + 8 : hx + 2, hy + 6, 2, 2);
    ctx.strokeStyle = '#c9c2dc';
    ctx.beginPath();
    ctx.arc(front ? hx + 11 : hx + 1, hy + 10, 2, 0, Math.PI * 2);
    ctx.stroke();
    // Cola
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(front ? x : x + w - 3, y + 8 + Math.round(Math.sin(this.animTime * 6) * 2), 3, 6);
  }

  drawShot(ctx, s) {
    const x = Math.round(s.x);
    const y = Math.round(s.y);
    if (s.kind === 'llama') {
      const k = s.life / this.def.FLAME_LIFE;
      Light.drawGlow(ctx, x + s.w / 2, y + s.h / 2, 12, '#ff7a2e', 0.7 * k);
      const f = Math.sin(this.animTime * 20 + s.x) * 1.5;
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.fillStyle = '#ff4d3a';
      ctx.beginPath();
      ctx.ellipse(x + s.w / 2, y + s.h - 4, 5, 6 + f, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.ellipse(x + s.w / 2, y + s.h - 3, 2.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }
    if (s.kind === 'pilar') {
      if (s.harms === false) {
        // Aviso: una línea brillante en el piso que parpadea
        ctx.globalAlpha = Math.floor(s.warn * 16) % 2 ? 0.9 : 0.4;
        ctx.fillStyle = '#fff6e0';
        ctx.fillRect(x, y + s.h - 2, s.w, 2);
        ctx.globalAlpha = 0.15;
        ctx.fillRect(x + 4, y, s.w - 8, s.h);
        ctx.globalAlpha = 1;
        return;
      }
      Light.drawGlow(ctx, x + s.w / 2, y + s.h / 2, 30, '#ffd34d', 0.8);
      const g = ctx.createLinearGradient(0, y, 0, y + s.h);
      g.addColorStop(0, 'rgba(255,246,224,0)');
      g.addColorStop(1, 'rgba(255,246,224,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 4, y + 8, s.w - 8, s.h - 8);
      return;
    }
    if (s.kind === 'onda_oro') {
      Light.drawGlow(ctx, x + s.w / 2, y + s.h, 14, '#ffd34d', 0.7);
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(x, y + 4, s.w, 6);
      ctx.fillStyle = '#fff6e0';
      ctx.fillRect(x + 2, y + 1, s.w - 4, 4);
      return;
    }
    if (s.kind === 'oro') {
      Light.drawGlow(ctx, x + 3, y + 4, 8, '#ffd34d', 0.7);
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(x, y + 2, 6, 6);
      ctx.fillStyle = '#fff6e0';
      ctx.fillRect(x + 1, y + 2, 2, 2);
      return;
    }
    if (s.kind === 'roca') {
      ctx.fillStyle = '#8a6a4a';
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = '#c9a35b';
      ctx.fillRect(x + 1, y + 1, 3, 2);
      ctx.strokeStyle = '#2e2a47';
      ctx.strokeRect(x + 0.5, y + 0.5, s.w - 1, s.h - 1);
      return;
    }
    super.drawShot(ctx, s);
  }
}

// ---------- Oso de Escarcha (zona 5, sala 15) ----------
// Un oso enorme de nieve con cristales de hielo en el lomo.
//   A · Pisotón glaciar: se alza en dos patas (en el piso se marcan sombras donde caerán
//       carámbanos), golpea el suelo con ondas y caen los carámbanos. Desde la fase 2,
//       además brotan púas de hielo del suelo, una tras otra, hacia la papa. Queda
//       resoplando (aquí se le pisa).
//   B · Rodada: se hace bola de nieve y rueda de pared a pared (2 veces; 3 desde la
//       fase 2). Queda mareado (aquí se le pisa).
//   Fase 3: ventisca. Ráfagas de viento empujan a la papa de lado (con aviso).
// Da el planeo y la llave lavanda.
class OsoEscarcha extends ArenaBoss {
  constructor(tx, ty) {
    super(tx, ty, CONFIG.BOSSES.oso);
  }

  prepare() {
    this.marks = [];         // x de los carámbanos que van a caer
    this.rolls = 0;
    this.gust = null;        // ráfaga de la ventisca: { dir, t, warn }
    this.gustTimer = 3;
    this.flakes = [];
  }

  attackStates() { return ['rear', 'pound', 'curl', 'roll']; }
  restStates() { return ['recover', 'dizzy']; }

  canBeHit() {
    return this.started && !this.hidden && (this.state === 'recover' || this.state === 'dizzy');
  }

  speed() {
    return this.phaseSpeed(0.15);
  }

  lightColor() {
    if (this.state === 'rear' || this.state === 'roll') return '#9fe8ff';
    return ['#cfefff', '#a98bff', '#ff4dc4'][this.phaseIndex()];
  }

  // La ventisca empuja de lado (solo durante la ráfaga, después del aviso)
  wind() {
    return this.gust && this.gust.warn <= 0 ? this.gust.dir * this.def.GUST : 0;
  }

  attack(kind, level, player) {
    this.facePlayer(player);
    this.vx = 0;
    if (kind === 'a') {
      const B = this.bounds(level);
      const n = this.def.ICICLES + this.phaseIndex();
      this.marks = [player.x + player.w / 2];
      let tries = 0;
      while (this.marks.length < n && tries++ < 40) {
        const x = B.left + 10 + Math.random() * (B.right - B.left - 20);
        if (this.marks.every(function (o) { return Math.abs(o - x) > 28; })) this.marks.push(x);
      }
      this.setState('rear', this.def.REAR_TIME / this.speed());
      Sfx.play('roar');
    } else {
      this.rolls = this.phaseIndex() >= 1 ? 3 : 2;
      this.setState('curl', 0.5 / this.speed());
    }
  }

  think(dt, level, player) {
    const D = this.def;
    this.updateBlizzard(dt, level);
    if (this.state === 'intro') {
      this.settle(dt, level);
      this.facePlayer(player);
      if (this.timer <= 0) this.startIdle();
    } else if (this.state === 'rear') {
      this.settle(dt, level);
      if (this.timer <= 0) this.pound(level, player);
    } else if (this.state === 'pound') {
      this.settle(dt, level);
      if (this.timer <= 0) this.setState('recover', D.RECOVER_TIME);
    } else if (this.state === 'curl') {
      this.settle(dt, level);
      if (this.timer <= 0) {
        this.setState('roll');
        Sfx.play('dash');
      }
    } else if (this.state === 'roll') {
      this.vx = this.dir * D.ROLL_SPEED * this.speed();
      const hit = this.moveBody(dt, level, true);
      if (Math.random() < dt * 20) this.addShot({ x: this.centerX() - 3, y: this.y + this.h - 6, w: 6, h: 6, vx: -this.dir * 30,
                                                  vy: -80, g: 500, life: 0.6, kind: 'nieve', harms: false });
      if (hit.wall) {
        this.shakeTime = 0.35;
        Sfx.play('bossLand');
        const R = CONFIG.SFX.RUMBLE.BOSS_LAND;
        Input.rumble(R.TIME, R.STRONG, R.WEAK);
        BossShow.ring(this.dir > 0 ? this.x + this.w : this.x, this.y + this.h / 2, 50, '#cfefff', 0.4);
        this.dropChunks(level, 2 + this.phaseIndex());
        this.dir = -this.dir;
        this.rolls--;
        if (this.rolls <= 0) {
          this.vx = 0;
          this.setState('dizzy', D.DIZZY_TIME);
        }
      }
    } else if (this.state === 'recover' || this.state === 'dizzy') {
      this.vx = 0;
      this.settle(dt, level);
      if (this.timer <= 0) this.startIdle(0.6);
    }
  }

  // Golpe con las dos patas: ondas por el suelo, carámbanos y (fase 2) púas de hielo
  pound(level, player) {
    const D = this.def;
    this.shakeTime = 0.5;
    Sfx.play('bossLand');
    const R = CONFIG.SFX.RUMBLE.BOSS_LAND;
    Input.rumble(R.TIME, R.STRONG, R.WEAK);
    Effects.play('polvo', this.centerX(), this.y + this.h - 8);
    BossShow.ring(this.centerX(), this.y + this.h, 100, '#cfefff', 0.5);
    const y = this.y + this.h - 10;
    const cx = this.centerX();
    [-1, 1].forEach(function (d) {
      this.addShot({ x: cx - 6 + d * 18, y: y, w: 12, h: 10, vx: d * D.WAVE_SPEED * this.speed(), life: 3,
                     kind: 'onda_hielo', light: '#cfefff' });
    }, this);
    this.marks.forEach(function (x, i) {
      this.addShot({ x: x - 4, y: this.viewTop() - 16 - i * 10, w: 8, h: 16, vy: 30, g: 700, life: 3,
                     kind: 'carambano', light: '#9fe8ff' });
    }, this);
    this.marks = [];
    if (this.phaseIndex() >= 1) {
      // Púas que brotan del suelo, una tras otra, hacia la papa
      const dir = player.x + player.w / 2 < cx ? -1 : 1;
      for (let i = 1; i <= D.SPIKES; i++) {
        this.addShot({ x: cx + dir * (i * 20 + 10) - 6, y: this.floor - 18, w: 12, h: 18, life: 0.35 + i * 0.12 + 0.5,
                       warn: 0.35 + i * 0.12, harms: false, kind: 'pua', light: '#9fe8ff' });
      }
    }
    this.setState('pound', 0.35);
  }

  dropChunks(level, n) {
    const B = this.bounds(level);
    for (let i = 0; i < n; i++) {
      const x = B.left + 12 + Math.random() * (B.right - B.left - 24);
      this.addShot({ x: x - 5, y: this.viewTop() - 10 - Math.random() * 30, w: 10, h: 10, vy: 20, g: 600, life: 3,
                     kind: 'bloque_nieve', light: '#e6f6ff' });
    }
  }

  // Fase 3: ventisca con ráfagas (aviso de 0,7 s con flechas de viento)
  updateBlizzard(dt, level) {
    const D = this.def;
    if (this.phaseIndex() >= 2) {
      if (Math.random() < dt * 30) this.flakes.push({ x: Math.random(), y: Math.random(), life: 1 });
      if (this.gust) {
        this.gust.warn -= dt;
        this.gust.t -= dt;
        if (this.gust.warn <= 0 && !this.gust.sounded) {
          this.gust.sounded = true;
          Sfx.play('appear');
        }
        if (this.gust.t <= 0) this.gust = null;
      } else {
        this.gustTimer -= dt;
        if (this.gustTimer <= 0) {
          this.gustTimer = D.GUST_EVERY;
          this.gust = { dir: Math.random() < 0.5 ? -1 : 1, warn: 0.7, t: 0.7 + D.GUST_TIME };
        }
      }
    }
    this.flakes.forEach(function (f) { f.life -= dt; });
    this.flakes = this.flakes.filter(function (f) { return f.life > 0; });
  }

  updateShots(dt, level) {
    this.shots.forEach(function (s) {
      s.life -= dt;
      if (s.kind === 'pua') {
        s.warn -= dt;
        if (s.warn <= 0 && s.harms === false) {
          s.harms = true;
          Sfx.play('stomp');
        }
        return;
      }
      s.vy += (s.g || 0) * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.kind === 'onda_hielo') {
        if (level.rectHitsSolid(s.x, s.y, s.w, s.h - 2)) s.life = 0;
        return;
      }
      if (level.rectHitsSolid(s.x + 1, s.y + 1, s.w - 2, s.h - 2)) {
        s.life = 0;
        if (s.kind !== 'nieve') Effects.play('polvo', s.x + s.w / 2, s.y + s.h - 4);
      }
    });
    this.shots = this.shots.filter(function (s) { return s.life > 0; });
  }

  spriteName() {
    if (this.state === 'hurt') return 'oso_dano';
    if (this.state === 'dying') return 'oso_derrota';
    if (this.state === 'rear') return 'oso_alzarse';
    if (this.state === 'pound') return 'oso_golpe';
    if (this.state === 'curl' || this.state === 'roll') return 'oso_rodar';
    if (this.state === 'dizzy') return 'oso_mareado';
    if (this.state === 'recover') return 'oso_cansado';
    return 'oso_quieto';
  }

  baseSprite() { return 'oso_quieto'; }

  drawExtras(ctx) {
    // Sombras donde van a caer los carámbanos
    if (this.state === 'rear') {
      const on = Math.floor(this.animTime * 12) % 2 === 0;
      this.marks.forEach(function (x) {
        ctx.globalAlpha = on ? 0.55 : 0.3;
        ctx.fillStyle = '#5a7aa8';
        ctx.beginPath();
        ctx.ellipse(x, this.floor - 1, 7, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#9fe8ff';
        ctx.fillRect(Math.round(x) - 1, this.viewTop(), 2, this.floor - this.viewTop());
      }, this);
      ctx.globalAlpha = 1;
    }
    // Aviso de la ráfaga: flechas de viento que cruzan la arena
    if (this.gust) {
      const cam = { y: this.viewTop() };
      const warn = this.gust.warn > 0;
      ctx.globalAlpha = warn ? (Math.floor(this.animTime * 10) % 2 ? 0.7 : 0.3) : 0.6;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 9; i++) {
        const y = cam.y + 20 + i * 16;
        const len = warn ? 10 : 26;
        const x0 = this.centerX() - 140 + ((this.animTime * (warn ? 60 : 320) * this.gust.dir + i * 47) % 280 + 280) % 280;
        ctx.fillRect(Math.round(x0), Math.round(y), len, 1);
        if (warn) {
          const tip = this.gust.dir > 0 ? x0 + len : x0;
          ctx.fillRect(Math.round(tip - this.gust.dir * 2), Math.round(y - 2), 1, 5);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  drawBody(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.w;
    const h = this.h;
    const INK = '#2e2a47';
    const P = this.phaseIndex();
    const front = this.dir > 0;
    if (this.state === 'curl' || this.state === 'roll') {
      // Bola de nieve gigante con el oso adentro
      const cx = x + w / 2;
      const cy = y + h / 2 + 2;
      const a = this.animTime * this.dir * 10;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.arc(cx, cy, h / 2 + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c9d8ef';
      for (let i = 0; i < 4; i++) {
        const k = a + i * Math.PI / 2;
        ctx.fillRect(Math.round(cx + Math.cos(k) * 9) - 2, Math.round(cy + Math.sin(k) * 9) - 2, 4, 3);
      }
      ctx.fillStyle = '#9fe8ff';
      ctx.fillRect(Math.round(cx + Math.cos(a + 0.8) * 12) - 1, Math.round(cy + Math.sin(a + 0.8) * 12) - 3, 3, 5);
      return;
    }
    const rear = this.state === 'rear';
    const top = rear ? y - 12 : y;
    const bodyH = rear ? h + 12 : h;
    // Patas
    ctx.fillStyle = '#c9d8ef';
    if (!rear) {
      [3, 11, w - 16, w - 8].forEach(function (lx) { ctx.fillRect(x + lx, y + h - 7, 6, 7); });
    } else {
      ctx.fillRect(x + 8, y + h - 9, 8, 9);
      ctx.fillRect(x + w - 16, y + h - 9, 8, 9);
    }
    // Cuerpo
    ctx.fillStyle = '#eef4fa';
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, top + bodyH / 2, rear ? w / 2 - 8 : w / 2 - 1, bodyH / 2 - 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(122, 138, 168, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, top + bodyH / 2 + 6, w / 2 - 6, bodyH / 4, 0, 0, Math.PI);
    ctx.fill();
    // Cristales en el lomo (más grandes en las fases altas)
    ctx.fillStyle = P >= 2 ? '#ff9ad5' : '#9fe8ff';
    for (let i = 0; i < 4; i++) {
      const cxx = x + 8 + i * 7;
      const ch = 5 + P * 2 + (i % 2) * 2;
      ctx.beginPath();
      ctx.moveTo(cxx - 3, top + 5);
      ctx.lineTo(cxx, top + 5 - ch);
      ctx.lineTo(cxx + 3, top + 5);
      ctx.fill();
    }
    // Cabeza
    const hx = rear ? x + w / 2 - 7 : front ? x + w - 14 : x;
    const hy = rear ? top - 4 : top + 6;
    ctx.fillStyle = '#eef4fa';
    ctx.beginPath();
    ctx.ellipse(hx + 7, hy + 6, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c9d8ef';
    ctx.fillRect(hx + 1, hy - 2, 4, 4);
    ctx.fillRect(hx + 10, hy - 2, 4, 4);
    ctx.fillStyle = INK;
    const eyeColor = this.state === 'recover' || this.state === 'dizzy' ? INK : P >= 2 ? '#ff2e6e' : INK;
    ctx.fillStyle = eyeColor;
    ctx.fillRect(hx + 4, hy + 4, 2, 2);
    ctx.fillRect(hx + 9, hy + 4, 2, 2);
    ctx.fillStyle = INK;
    ctx.fillRect(front || rear ? hx + 12 : hx + 1, hy + 7, 3, 2);   // hocico
    // Vaho al resoplar
    if (this.state === 'recover' && Math.floor(this.animTime * 3) % 2 === 0) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(front ? hx + 18 : hx - 4, hy + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (this.state === 'idle' && this.timer < 0.4) this.drawWarning(ctx, x + w / 2, top - 10);
  }

  drawShot(ctx, s) {
    const x = Math.round(s.x);
    const y = Math.round(s.y);
    if (s.kind === 'carambano') {
      Light.drawGlow(ctx, x + 4, y + 8, 10, '#9fe8ff', 0.6);
      ctx.fillStyle = '#cfefff';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8, y);
      ctx.lineTo(x + 4, y + 16);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, y + 1, 1, 8);
      return;
    }
    if (s.kind === 'pua') {
      if (s.harms === false) {
        ctx.globalAlpha = Math.floor(s.warn * 18) % 2 ? 0.9 : 0.4;
        ctx.fillStyle = '#9fe8ff';
        ctx.fillRect(x, y + s.h - 2, s.w, 2);
        ctx.globalAlpha = 1;
        return;
      }
      Light.drawGlow(ctx, x + s.w / 2, y + s.h / 2, 14, '#9fe8ff', 0.7);
      ctx.fillStyle = '#cfefff';
      ctx.strokeStyle = '#5a7aa8';
      ctx.beginPath();
      ctx.moveTo(x, y + s.h);
      ctx.lineTo(x + s.w / 2, y);
      ctx.lineTo(x + s.w, y + s.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    }
    if (s.kind === 'onda_hielo') {
      Light.drawGlow(ctx, x + s.w / 2, y + s.h, 14, '#cfefff', 0.7);
      ctx.fillStyle = '#9fe8ff';
      ctx.fillRect(x, y + 4, s.w, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, y + 1, s.w - 4, 4);
      return;
    }
    if (s.kind === 'bloque_nieve' || s.kind === 'nieve') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = '#c9d8ef';
      ctx.fillRect(x, y + s.h - 2, s.w, 2);
      return;
    }
    super.drawShot(ctx, s);
  }
}

// Rana Gigante del Lago (sala 18): vive en un estanque con islas. Da el buceo y la llave azul.
//   A: se agacha (sombra donde cae), salta a la isla de la papa (olas al caer) y estira
//      una lengua larga; la lengua queda pegada un rato: ahí se le pisa.
//   B: se zambulle, nada escondida bajo el espejo, salen burbujas donde va a aparecer
//      y salta con un chorro de agua; cae en una isla cansada: ahí se le pisa.
//   Fase 3: escupe burbujas que suben despacio.
class RanaGigante extends ArenaBoss {
  constructor(tx, ty) {
    super(tx, ty, CONFIG.BOSSES.rana);
  }

  prepare() {
    this.islands = null;     // [{ left, right }] en px: las islas de la arena
    this.pools = null;       // [{ left, right }]: el agua entre islas
    this.target = null;      // x donde va a caer o a salir
    this.after = '';         // qué hace al caer: 'tongue' o 'tired'
    this.tongue = 0;         // largo de la lengua (px)
    this.bubbleTimer = 2;
  }

  attackStates() { return ['crouch', 'leap', 'tongueWarn', 'tongue', 'dive', 'under', 'burst']; }
  restStates() { return ['stuck', 'tired']; }

  canBeHit() {
    return this.started && !this.hidden && (this.state === 'stuck' || this.state === 'tired');
  }

  // Bajo el agua (nadando o a punto de salir) no se ve, no daña y no se le pisa
  submerged() {
    return this.state === 'under' || this.state === 'burst';
  }

  isHarmful() {
    return !this.submerged() && super.isHarmful();
  }

  isStompedBy(p) {
    return !this.submerged() && super.isStompedBy(p);
  }

  speed() {
    return this.phaseSpeed(0.15);
  }

  // Islas (suelo) y agua en la fila del piso de la arena
  measure(level) {
    const T = CONFIG.TILE;
    const B = this.bounds(level);
    const ty = Math.floor(this.floor / T);
    this.islands = [];
    this.pools = [];
    let run = null;
    for (let tx = Math.floor(B.left / T); tx < Math.ceil(B.right / T); tx++) {
      // El agua empieza una fila más abajo que el piso de las islas
      const kind = level.solidBox(tx, ty) ? 'island' : level.isWater(tx * T + 8, (ty + 1) * T + 8) ? 'pool' : 'air';
      if (!run || run.kind !== kind) {
        run = { kind: kind, left: tx * T, right: (tx + 1) * T };
        if (kind === 'island') this.islands.push(run);
        if (kind === 'pool') this.pools.push(run);
      } else {
        run.right = (tx + 1) * T;
      }
    }
  }

  nearest(list, x) {
    let best = list[0];
    list.forEach(function (r) {
      if (Math.abs((r.left + r.right) / 2 - x) < Math.abs((best.left + best.right) / 2 - x)) best = r;
    });
    return best;
  }

  attack(kind, level, player) {
    if (!this.islands) this.measure(level);
    this.facePlayer(player);
    this.vx = 0;
    const px = player.x + player.w / 2;
    if (kind === 'a' || !this.pools.length) {
      const isl = this.nearest(this.islands, px);
      this.target = clamp(px, isl.left + this.w / 2, isl.right - this.w / 2);
      this.after = 'tongue';
    } else {
      const pool = this.nearest(this.pools, this.centerX());
      this.target = (pool.left + pool.right) / 2;
      this.after = 'dive';
    }
    this.setState('crouch', this.def.CROUCH_TIME / this.speed());
  }

  think(dt, level, player) {
    const D = this.def;
    if (!this.islands) this.measure(level);
    this.spitBubbles(dt);
    if (this.state === 'intro') {
      this.settle(dt, level);
      this.facePlayer(player);
      if (this.timer <= 0) this.startIdle();
    } else if (this.state === 'crouch') {
      this.settle(dt, level);
      if (this.timer <= 0) {
        this.jumpTo(level, this.target - this.w / 2, D.JUMP_TIME / this.speed());
        this.setState('leap');
        Sfx.play('jump');
      }
    } else if (this.state === 'leap') {
      const hit = this.moveBody(dt, level, true);
      if (level.isWater(this.centerX(), this.y + this.h - 4) && this.vy > 0) {
        this.splash();
        this.setState('under', D.UNDER_TIME / this.speed());
      } else if (hit.ground) {
        this.land();
        if (this.after === 'tongue') {
          this.facePlayer(player);
          this.setState('tongueWarn', D.TONGUE_WARN / this.speed());
        } else {
          this.setState('tired', D.TIRED_TIME);
        }
      }
    } else if (this.state === 'tongueWarn') {
      this.settle(dt, level);
      if (this.timer <= 0) {
        this.setState('tongue', D.TONGUE_OUT);
        Sfx.play('dash');
      }
    } else if (this.state === 'tongue') {
      this.settle(dt, level);
      this.tongue = this.reachLen(level, D.TONGUE_LEN * (1 - Math.max(0, this.timer) / D.TONGUE_OUT));
      if (this.timer <= 0) {
        this.setState('stuck', D.STUCK_TIME);
        Effects.play('polvo', this.tongueTip(), this.y + 8);
      }
    } else if (this.state === 'stuck') {
      this.settle(dt, level);
      if (this.timer < 0.25) this.tongue = Math.max(0, this.tongue - 600 * dt);   // la despega y la recoge
      if (this.timer <= 0) {
        this.tongue = 0;
        this.startIdle(0.5);
      }
    } else if (this.state === 'under') {
      // Escondida bajo el agua: va hacia el agua más cercana a la papa
      const pool = this.nearest(this.pools, player.x + player.w / 2);
      const goal = clamp(player.x + player.w / 2 - this.w / 2, pool.left, Math.max(pool.left, pool.right - this.w));
      this.x += clamp(goal - this.x, -D.UNDER_SPEED * dt, D.UNDER_SPEED * dt);
      this.y = this.floor + CONFIG.TILE;
      if (this.timer <= 0) {
        const pool = this.nearest(this.pools, player.x + player.w / 2);
        this.target = (pool.left + pool.right) / 2;
        this.setState('burst', D.BURST_WARN);
      }
    } else if (this.state === 'burst') {
      if (this.timer <= 0) this.spout(level, player);
    } else if (this.state === 'tired') {
      this.settle(dt, level);
      if (this.timer <= 0) this.startIdle(0.6);
    }
  }

  // Largo de la lengua hasta la primera pared
  reachLen(level, len) {
    const mouth = this.dir > 0 ? this.x + this.w : this.x;
    const y = this.y + 8;
    for (let l = 0; l < len; l += 4) {
      if (level.rectHitsSolid(mouth + this.dir * l, y, 2, 3)) return l;
    }
    return len;
  }

  tongueTip() {
    return (this.dir > 0 ? this.x + this.w : this.x) + this.dir * this.tongue;
  }

  // Lengua: daña mientras sale; pegada, no (se le puede pisar)
  waveHits(p) {
    if (this.state === 'tongue' && this.tongue > 0) {
      const mouth = this.dir > 0 ? this.x + this.w : this.x;
      const box = { x: this.dir > 0 ? mouth : mouth - this.tongue, y: this.y + 6, w: this.tongue, h: 6 };
      if (overlaps(box, p)) return true;
    }
    return super.waveHits(p);
  }

  land() {
    this.shakeTime = 0.4;
    Sfx.play('bossLand');
    const R = CONFIG.SFX.RUMBLE.BOSS_LAND;
    Input.rumble(R.TIME, R.STRONG, R.WEAK);
    const y = this.y + this.h - 8;
    const cx = this.centerX();
    [-1, 1].forEach(function (d) {
      this.addShot({ x: cx - 6 + d * 16, y: y, w: 12, h: 8, vx: d * this.def.WAVE_SPEED * this.speed(), life: 2,
                     kind: 'ola', light: '#bff0ff' });
    }, this);
  }

  splash() {
    Sfx.play('splash');
    const cx = this.centerX();
    for (let i = 0; i < 8; i++) {
      this.addShot({ x: cx - 2, y: this.floor - 4, w: 4, h: 4, vx: (Math.random() - 0.5) * 160, vy: -120 - Math.random() * 120,
                     g: 600, life: 0.8, kind: 'gota', harms: false });
    }
  }

  // Sale del agua con un chorro y salta a la isla más cercana
  spout(level, player) {
    const D = this.def;
    this.x = this.target - this.w / 2;
    this.y = this.floor - this.h;
    this.splash();
    this.addShot({ x: this.target - 12, y: this.floor - 72, w: 24, h: 72, life: D.SPOUT_TIME, kind: 'chorro', light: '#bff0ff' });
    const isl = this.nearest(this.islands, player.x + player.w / 2);
    this.jumpTo(level, clamp(player.x + player.w / 2, isl.left + this.w / 2, isl.right - this.w / 2) - this.w / 2,
                D.JUMP_TIME / this.speed());
    this.vy -= 120;
    this.after = 'tired';
    this.setState('leap');
    BossShow.ring(this.target, this.floor, 60, '#bff0ff', 0.4);
  }

  // Fase 3: burbujas que suben despacio, meciéndose
  spitBubbles(dt) {
    if (this.phaseIndex() < 2 || this.state === 'under') return;
    this.bubbleTimer -= dt;
    if (this.bubbleTimer > 0) return;
    this.bubbleTimer = this.def.BUBBLE_EVERY;
    for (let i = 0; i < 3; i++) {
      this.addShot({ x: this.centerX() - 5 + this.dir * 14, y: this.y, w: 10, h: 10, vx: this.dir * (30 + i * 25),
                     vy: -20 - i * 8, life: 4, kind: 'burbuja', light: '#bff0ff', seed: Math.random() * 6 });
    }
  }

  // El chorro se queda quieto (no choca con el suelo); las olas se acaban al borde de la isla
  updateShots(dt, level) {
    const spouts = this.shots.filter(function (s) { return s.kind === 'chorro'; });
    spouts.forEach(function (s) { s.life -= dt; });
    this.shots = this.shots.filter(function (s) { return s.kind !== 'chorro'; });
    this.shots.forEach(function (s) {
      if (s.kind === 'burbuja') s.vx *= 1 - dt * 0.8;
      if (s.kind === 'ola' && !level.rectHitsSolid(s.x + s.w / 2, s.y + s.h + 2, 1, 1)) s.life = 0;
    });
    super.updateShots(dt, level);
    this.shots = this.shots.concat(spouts.filter(function (s) { return s.life > 0; }));
  }

  spriteName() {
    if (this.state === 'hurt') return 'ranagig_dano';
    if (this.state === 'dying') return 'ranagig_derrota';
    if (this.state === 'crouch' || this.state === 'tongueWarn') return 'ranagig_agachada';
    if (this.state === 'leap') return 'ranagig_salto';
    if (this.state === 'tongue') return 'ranagig_lengua';
    if (this.state === 'stuck') return 'ranagig_pegada';
    if (this.state === 'tired') return 'ranagig_cansada';
    return 'ranagig_quieta';
  }

  baseSprite() { return 'ranagig_quieta'; }

  drawLook(ctx) {
    if (this.submerged()) return;
    super.drawLook(ctx);
    this.drawTongue(ctx);
  }

  drawTongue(ctx) {
    if (this.tongue <= 0) return;
    const mouth = this.dir > 0 ? this.x + this.w - 4 : this.x + 4;
    const y = Math.round(this.y + 8);
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(Math.round(Math.min(mouth, mouth + this.dir * this.tongue)), y - 1, Math.round(this.tongue), 5);
    ctx.fillStyle = '#ff6b8a';
    ctx.fillRect(Math.round(Math.min(mouth, mouth + this.dir * this.tongue)), y, Math.round(this.tongue), 3);
    const tip = mouth + this.dir * this.tongue;
    ctx.beginPath();
    ctx.arc(tip, y + 1.5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawExtras(ctx) {
    // Sombra donde va a caer (al agacharse) y burbujas donde va a salir
    if (this.state === 'crouch' && this.target !== null) {
      ctx.globalAlpha = Math.floor(this.animTime * 12) % 2 ? 0.55 : 0.3;
      ctx.fillStyle = '#2e4a5a';
      ctx.beginPath();
      ctx.ellipse(this.target, this.floor - 1, this.w / 2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (this.state === 'under' || this.state === 'burst') {
      const x = this.state === 'burst' ? this.target : this.centerX();
      for (let i = 0; i < (this.state === 'burst' ? 6 : 2); i++) {
        const k = (this.animTime * 2 + i * 0.37) % 1;
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = '#e6fff6';
        ctx.beginPath();
        ctx.arc(x - 10 + ((i * 7) % 20), this.floor + 6 - k * 14, 1.5 + (i % 2), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (this.state === 'tongueWarn') this.drawWarning(ctx, this.centerX(), this.y - 10);
  }

  drawBody(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.w;
    const h = this.h;
    const INK = '#2e2a47';
    const P = this.phaseIndex();
    const squat = this.state === 'crouch' || this.state === 'tongueWarn' ? 4 : 0;
    const air = this.state === 'leap';
    const skin = ['#6bd17a', '#5ab86a', '#4aa070'][P];
    // Patas de atrás
    ctx.fillStyle = '#3f8a5a';
    if (air) {
      ctx.fillRect(x - 4, y + h - 6, 10, 5);
      ctx.fillRect(x + w - 6, y + h - 6, 10, 5);
    } else {
      ctx.fillRect(x, y + h - 9, 12, 9);
      ctx.fillRect(x + w - 12, y + h - 9, 12, 9);
    }
    // Cuerpo
    ctx.fillStyle = skin;
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + 3 + squat / 2, w / 2 - 1, h / 2 - 2 - squat / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Panza y manchas de musgo
    ctx.fillStyle = '#e8f6c8';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 6, w / 2 - 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f8a5a';
    [[8, 9], [18, 6], [28, 10]].forEach(function (m) { ctx.fillRect(x + m[0], y + m[1] + squat, 4, 3); });
    // Ojos saltones (con nenúfar en la cabeza)
    const ey = y - 3 + squat;
    [x + 9, x + w - 15].forEach(function (ex) {
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(ex + 3, ey + 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff6e0';
      ctx.fillRect(ex + 1, ey + 2, 5, 4);
      ctx.fillStyle = P >= 2 ? '#ff2e6e' : INK;
      const tired = this.state === 'tired' || this.state === 'stuck';
      ctx.fillRect(ex + (this.dir > 0 ? 3 : 1), ey + (tired ? 4 : 3), 2, tired ? 1 : 2);
    }, this);
    ctx.fillStyle = '#9ad17a';
    ctx.fillRect(x + w / 2 - 5, ey - 1, 10, 3);
    ctx.fillStyle = '#ffb3d1';
    ctx.fillRect(x + w / 2 - 1, ey - 3, 3, 2);
    // Boca (y el buche que se infla al avisar)
    ctx.fillStyle = INK;
    ctx.fillRect(x + 8, y + 13 + squat, w - 16, 1);
    if (this.state === 'tongueWarn') {
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h - 4, 6 + Math.sin(this.animTime * 30) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawShot(ctx, s) {
    const x = Math.round(s.x);
    const y = Math.round(s.y);
    if (s.kind === 'ola') {
      Light.drawGlow(ctx, x + s.w / 2, y + s.h, 12, '#bff0ff', 0.5);
      ctx.fillStyle = '#9fd3e0';
      ctx.fillRect(x, y + 3, s.w, s.h - 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + (s.vx > 0 ? s.w - 5 : 0), y, 5, 3);
      return;
    }
    if (s.kind === 'gota') {
      ctx.fillStyle = '#cfe8ef';
      ctx.fillRect(x, y, 2, 3);
      return;
    }
    if (s.kind === 'chorro') {
      const k = Math.max(0, s.life / this.def.SPOUT_TIME);
      Light.drawGlow(ctx, x + s.w / 2, y + s.h / 2, 30, '#bff0ff', 0.5 * k);
      ctx.globalAlpha = 0.5 + k * 0.4;
      ctx.fillStyle = '#9fd3e0';
      ctx.fillRect(x + 4, y, s.w - 8, s.h);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 4; i++) ctx.fillRect(x + 6 + (i * 5) % (s.w - 10), y + ((i * 17 + Math.floor(s.life * 80)) % s.h), 2, 6);
      ctx.globalAlpha = 1;
      return;
    }
    if (s.kind === 'burbuja') {
      Light.drawGlow(ctx, x + s.w / 2, y + s.h / 2, 12, '#bff0ff', 0.5);
      ctx.strokeStyle = '#e6fff6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + s.w / 2 + Math.sin(s.life * 4 + s.seed) * 2, y + s.h / 2, s.w / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 2, y + 2, 2, 2);
      return;
    }
    super.drawShot(ctx, s);
  }
}

// El Silencio (sala 22): tres peleas seguidas, como Sigma en Mega Man X. Cada forma
// (CONFIG.BOSSES.silencio.FORMS) tiene más vida y va más rápido; la última es la más difícil.
// Dibujos: silencio1_*, silencio2_*, silencio3_* (si no están, usa los del Eco)
class Silencio extends EcoSilencio {
  constructor(tx, ty, form) {
    super(tx, ty);
    this.form = form || 1;
    const S = CONFIG.BOSSES.silencio;
    this.def = Object.assign({}, S, S.FORMS[this.form - 1]);
    this.w = Math.round(this.def.W * CONFIG.HD.BOSS_HIT);
    this.h = Math.round(this.def.H * CONFIG.HD.BOSS_HIT);
    this.spawnX = tx * CONFIG.TILE + (CONFIG.TILE - this.w) / 2;
    this.spawnY = (ty + 1) * CONFIG.TILE - this.h;
    this.reset();
  }

  // eco_flotar -> silencio2_flotar (si está ese dibujo)
  formSprite(name) {
    if (!name) return name;
    const own = name.replace('eco_', 'silencio' + this.form + '_');
    return Sprites.has(own) ? own : name;
  }

  spriteName() { return this.formSprite(super.spriteName()); }
  baseSprite() { return this.formSprite(super.baseSprite()); }

  // Efectos del jefe final (más fuertes en cada forma): un aura que se traga notas de
  // colores, anillos oscuros que laten y un destello blanco cuando recibe un golpe
  drawExtras(ctx) {
    const FX = CONFIG.BOSSES.silencio.FX, k = this.form / 3, t = this.animTime;
    const cx = this.centerX(), cy = this.y + this.h / 2;
    if (this.state !== 'dying') {
      // Anillos que laten hacia adentro
      for (let i = 0; i < FX.RINGS; i++) {
        const p = 1 - ((t * FX.RING_SPEED + i / FX.RINGS) % 1);
        ctx.globalAlpha = (1 - p) * 0.35 * (0.5 + k);
        ctx.strokeStyle = FX.RING;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, this.w * 0.6 + p * FX.REACH, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Notas de colores que caen en espiral hacia su centro (la música que se traga)
      const colors = FX.NOTES, n = Math.round(FX.NOTE_COUNT * (0.5 + k));
      for (let i = 0; i < n; i++) {
        const p = 1 - ((t * FX.NOTE_SPEED + i / n) % 1);
        const a = i * 2.4 + t * 1.5 + p * 3;
        const r = this.w * 0.4 + p * FX.REACH;
        ctx.globalAlpha = Math.min(1, p * 2) * 0.85;
        BossShow.drawNote(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.7, colors[i % colors.length], i % 3);
      }
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    }
    // Destello al recibir un golpe
    if (this.state === 'hurt') {
      ctx.globalAlpha = 0.6 * Math.max(0, this.timer / CONFIG.BOSSES.HURT_TIME);
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath();
      ctx.arc(cx, cy, this.w * (1.6 - this.timer), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    super.drawExtras(ctx);
  }
}

const BOSS_TYPES = {
  silencio: Silencio,
  eco: EcoSilencio,
  toro: ToroDorado,
  oso: OsoEscarcha,
  rana: RanaGigante,
  gusano: Gusano,
  condor: Condor,
  charanguero: Charanguero,
  charanguero2: CharangueroMaestro,
  huaca: Huaca,
  cuy: GiantCuy,
  bombo: Bombo
};
