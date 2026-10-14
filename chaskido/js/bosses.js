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
  // def: datos de CONFIG.BOSSES.<tipo>
  constructor(tx, ty, def) {
    const T = CONFIG.TILE;
    this.def = def;
    this.w = def.W;
    this.h = def.H;
    this.spawnX = tx * T + (T - this.w) / 2;
    this.spawnY = (ty + 1) * T - this.h;
    this.reset();
  }

  reset() {
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

  speed() {
    return this.angry() ? this.def.ANGRY_SPEED || 1.25 : 1;
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
    this.vx = 0;
    this.setState('hurt', CONFIG.BOSSES.HURT_TIME);
  }

  // La papa cayó encima cuando no se le puede pisar: se sacude y la tira de lado
  shakeOff(p) {
    const dir = p.x + p.w / 2 < this.centerX() ? -1 : 1;
    p.vx = dir * 190;
    p.vy = -240;
    p.jumpCuttable = false;
    p.wallJumpLock = 0.2;
    p.y = Math.min(p.y, this.y - p.h - 1);
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
      if (level.rectHitsSolid(cx - 4, y, 8, 1)) return y + 1;
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
    this.state = state;
    this.timer = time || 0;
    this.animTime = 0;
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

  // ---------- Dibujo ----------

  draw(ctx) {
    this.shots.forEach(function (s) { this.drawShot(ctx, s); }, this);
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
    ctx.font = '8px ' + CONFIG.FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    ctx.fillText(this.def.NAME, W / 2 + 1, y + 1);
    ctx.fillStyle = '#ffd34d';
    ctx.fillText(this.def.NAME, W / 2, y);
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
  constructor(tx, ty) {
    super(tx, ty, CONFIG.BOSSES.charanguero);
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
const BOSS_TYPES = {
  condor: Condor,
  charanguero: Charanguero,
  huaca: Huaca,
  cuy: GiantCuy,
  bombo: Bombo
};
