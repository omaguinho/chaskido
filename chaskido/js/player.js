function approach(value, target, delta) {
  if (value < target) return Math.min(value + delta, target);
  return Math.max(value - delta, target);
}

// Las plataformas que suben y bajan ("I") solo sostienen desde arriba
function notLift(box) {
  return !box.lift;
}

class Player {
  constructor(x, y) {
    this.spawnX = x;
    this.spawnY = y;
    this.w = CONFIG.PLAYER.W;
    this.h = CONFIG.PLAYER.H;
    this.abilities = {};       // { dash: true, ... } según lo ganado
    this.tint = null;          // color de la skin provisional
    this.frozen = false;       // quieta sin control (cuando el jefe ruge)
    this.hookBlocked = false;  // el juego lo enciende frente a una puerta (E abre la puerta)
    this.push = 0;             // px/s de empuje de lado (viento de un jefe)
    this.reset();
  }

  has(ability) {
    return !!this.abilities[ability];
  }

  // Nuevo punto de reaparición (guardado)
  setSpawn(x, y) {
    this.spawnX = x;
    this.spawnY = y;
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.wallDir = 0;          // -1 pared a la izquierda, 1 a la derecha
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.jumpCuttable = false; // solo los saltos se cortan, el tambor no
    this.airJumps = 0;
    this.canAirDash = true;
    this.doubleJumping = false;
    this.dashTime = 0;         // tiempo máximo que le queda al dash
    this.dashElapsed = 0;      // tiempo que lleva el dash
    this.dashCooldown = 0;
    this.ghostTimer = 0;
    this.wallJumpLock = 0;
    this.ghosts = [];
    this.streaks = [];         // líneas de velocidad al correr: { x, y, len, life, color }
    this.hurtPose = 0;         // segundos con la pose de golpe
    this.powerPose = 0;        // segundos con la pose de ganar un poder
    this.streakTimer = 0;
    this.anim = 'papa_quieta';
    this.animTime = 0;
    this.chiliTime = 0;        // segundos que quedan de ají
    this.hook = null;          // gancho: { mode: 'pull' o 'hang', rail, x, stuck }
    this.hookTarget = null;    // anilla a la que se lanzaría el gancho ahora
    this.prevBottom = this.y + this.h;
    this.events = [];          // avisos: land, dash, jump, wallJump, doubleJump, drum, hook, hookCatch, break, splash
    this.brokeNow = [];        // celdas de muro X rotas en este paso
    this.inWater = false;      // nadando
    this.waterTop = 0;         // altura de la superficie del agua (px)
  }

  // ---------- Ají ----------

  eatChili() {
    this.chiliTime = CONFIG.CHILI.DURATION;
  }

  // Con el ají no recibe daño de enemigos, disparos ni espinas
  invincible() {
    return this.chiliTime > 0;
  }

  // Velocidad: el ají y correr (mantener E o Cuadrado) se suman
  speedMult() {
    const chili = this.chiliTime > 0 ? CONFIG.CHILI.SPEED_MULT : 1;
    return chili * (this.running() ? CONFIG.PLAYER.SPRINT_MULT : 1);
  }

  running() {
    return Input.held('run') && !this.frozen;
  }

  jumpMult() {
    return this.chiliTime > 0 ? CONFIG.CHILI.JUMP_MULT : 1;
  }

  update(dt, level) {
    if (this.frozen) {
      this.updateFrozen(dt, level);
      return;
    }
    const axis = Input.axisX();     // de -1 a 1 (analógico)
    const dir = Math.sign(axis);    // -1, 0 o 1
    const wasOnGround = this.onGround;
    this.events = [];
    this.brokeNow = [];
    this.prevBottom = this.y + this.h;
    this.ride(dt, level);
    this.unstuck(level);
    this.updateTimers(dt);
    this.checkWater(level);
    this.hookTarget = this.findHookTarget(level);

    // Con el gancho puesto, el movimiento lo maneja la cuerda
    if (!this.hook && this.hookTarget && Input.pressed('action') && !this.hookBlocked) {
      this.startHook(this.hookTarget);
    }
    if (this.hook) {
      this.updateHook(dt, level, axis);
      this.updateGhosts(dt);
      this.updateAnimation(dt);
      return;
    }

    // Saltar durante el dash lo termina en seco: el salto es un salto normal
    if (this.dashTime > 0 && Input.pressed('jump')) {
      this.dashTime = 0;
      this.endDash();
    }

    if (this.dashTime > 0) {
      this.updateDash(dt);
    } else {
      this.handleRun(axis, dt);
      this.handleJump();
      this.handleDash(dir);
      if (this.dashTime <= 0) this.applyGravity(dir, dt);
    }

    this.moveX(dt, level);
    this.moveY(dt, level);
    this.checkSurroundings(level);
    if (this.onGround && !wasOnGround) this.events.push('land');
    this.updateGhosts(dt);
    this.updateAnimation(dt);
  }

  // Sin control: frena, cae al suelo si estaba en el aire y espera
  updateFrozen(dt, level) {
    const wasOnGround = this.onGround;
    this.events = [];
    this.prevBottom = this.y + this.h;
    this.dashTime = 0;
    this.hook = null;
    this.vx = approach(this.vx, 0, CONFIG.PLAYER.FRICTION * dt);
    this.applyGravity(0, dt);
    this.moveX(dt, level);
    this.moveY(dt, level);
    this.checkSurroundings(level);
    if (this.onGround && !wasOnGround) this.events.push('land');
    this.updateGhosts(dt);
    this.updateAnimation(dt);
  }

  // Lo arrastran la plataforma móvil (de lado o de arriba abajo) o la cinta sobre la que está
  ride(dt, level) {
    if (!this.onGround) return;
    const c = level.carryFor(this, dt);
    if (c.dx !== 0) {
      this.x += c.dx;
      if (level.rectHitsSolid(this.x, this.y, this.w, this.h)) this.x -= c.dx;
    }
    if (c.dy > 0) {
      // Si la plataforma baja, la papa baja con ella (sin chocar con nada)
      this.y += c.dy;
      if (level.rectHitsSolid(this.x, this.y - 0.01, this.w, this.h - 1)) this.y -= c.dy;
    } else if (c.dy < 0) {
      this.y += c.dy;
      if (level.rectHitsSolid(this.x, this.y, this.w, this.h - 1)) this.y -= c.dy;
    }
  }

  // Si algo sólido aparece encima, empuja al jugador hacia arriba
  unstuck(level) {
    if (!level.rectHitsSolid(this.x, this.y, this.w, this.h)) return;
    for (let i = 1; i <= CONFIG.TILE; i++) {
      if (!level.rectHitsSolid(this.x, this.y - i, this.w, this.h)) {
        this.y -= i;
        this.vy = Math.min(this.vy, 0);
        return;
      }
    }
  }

  updateTimers(dt) {
    const P = CONFIG.PLAYER;
    this.coyote = this.onGround ? P.COYOTE : Math.max(0, this.coyote - dt);
    this.jumpBuffer = Input.pressed('jump')
      ? P.JUMP_BUFFER
      : Math.max(0, this.jumpBuffer - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.wallJumpLock = Math.max(0, this.wallJumpLock - dt);
    this.chiliTime = Math.max(0, this.chiliTime - dt);
  }

  // ¿Está en el agua? (el centro del cuerpo dentro de una celda "w")
  checkWater(level) {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const was = this.inWater;
    this.inWater = level.isWater(cx, cy);
    if (this.inWater) {
      this.waterTop = level.waterSurface(cx, cy);
      if (!was) this.events.push('splash');
    }
  }

  // axis analógico: poco = caminar, a fondo = correr
  handleRun(axis, dt) {
    const P = CONFIG.PLAYER;
    if (this.wallJumpLock > 0) return;   // manda el impulso de la pared
    if (axis !== 0) this.facing = Math.sign(axis);
    const accel = axis !== 0 ? P.ACCEL : P.FRICTION;
    const water = this.inWater ? CONFIG.WATER.SPEED_MULT : 1;
    this.vx = approach(this.vx, axis * P.RUN_SPEED * this.speedMult() * water, accel * dt);
  }

  // En el agua: salto = brazada; cerca de la superficie, salto para salir
  handleSwim() {
    const W = CONFIG.WATER;
    if (!Input.pressed('jump')) return;
    const depth = this.y + this.h / 2 - this.waterTop;
    this.vy = depth < 12 ? -W.JUMP_OUT : -W.STROKE;
    this.jumpCuttable = false;
    this.events.push('jump');
  }

  handleJump() {
    const P = CONFIG.PLAYER;
    const pressed = Input.pressed('jump');
    if (this.inWater) {
      this.handleSwim();
      return;
    }

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.jump(P.JUMP_SPEED);
      this.events.push('jump');
    } else if (pressed && this.wallDir !== 0 && !this.onGround) {
      this.vy = -P.WALL_JUMP_Y;
      this.vx = -this.wallDir * P.WALL_JUMP_X;
      this.facing = -this.wallDir;
      this.wallJumpLock = P.WALL_JUMP_LOCK;
      this.jumpBuffer = 0;
      this.jumpCuttable = true;
      this.doubleJumping = false;
      this.events.push('wallJump');
    } else if (pressed && this.airJumps > 0) {
      this.airJumps--;
      this.jump(P.DOUBLE_JUMP_SPEED);
      this.doubleJumping = true;
      this.events.push('doubleJump');
    }

    if (Input.released('jump') && this.vy < 0 && this.jumpCuttable) {
      this.vy *= P.JUMP_CUT;
      this.jumpCuttable = false;
    }
  }

  jump(speed) {
    this.vy = -speed * this.jumpMult();
    this.jumpBuffer = 0;
    this.coyote = 0;
    this.onGround = false;
    this.jumpCuttable = true;
    this.doubleJumping = false;
  }

  // ¿Saltó en este mismo paso?
  justJumped() {
    return this.events.some(function (e) {
      return e === 'jump' || e === 'wallJump' || e === 'doubleJump';
    });
  }

  // Recarga lo que se gasta en el aire, según las habilidades
  refillAir() {
    this.airJumps = this.has('doubleJump') ? CONFIG.PLAYER.AIR_JUMPS : 0;
    this.canAirDash = this.has('airDash');
    this.doubleJumping = false;
  }

  // Rebote al pisar un enemigo (más alto si se mantiene el salto)
  stomp() {
    const E = CONFIG.ENEMIES;
    this.vy = -(Input.held('jump') ? E.STOMP_BOUNCE_HIGH : E.STOMP_BOUNCE);
    this.jumpCuttable = false;
    this.dashTime = 0;
    this.refillAir();
  }

  // Empujón al tocar un enemigo de lado (dir: hacia dónde sale despedido)
  knockback(dir) {
    const E = CONFIG.ENEMIES;
    this.vx = dir * E.KNOCK_X;
    this.vy = -E.KNOCK_Y;
    this.dashTime = 0;
    this.hook = null;
    this.wallJumpLock = 0.2;   // un instante sin control para que se note
    this.hurtPose = CONFIG.PLAYER.HURT_POSE;
  }

  // Gana un poder: un momento con la pose de festejo (si está el sprite)
  celebrate() {
    this.powerPose = CONFIG.PLAYER.POWER_POSE;
  }

  // Rebote del tambor
  bounce() {
    this.vy = -CONFIG.PLAYER.DRUM_BOUNCE;
    this.jumpCuttable = false;
    this.refillAir();
    this.events.push('drum');
  }

  // En el suelo pide el dash; en el aire pide el dash aéreo (sirve aunque no se tenga
  // el dash del suelo) y solo una vez por salto
  handleDash(dir) {
    const P = CONFIG.PLAYER;
    if (!Input.pressed('dash') || this.dashCooldown > 0) return;
    if (this.justJumped()) return;   // salto y dash a la vez: gana el salto
    if (this.onGround && !this.has('dash')) return;
    if (!this.onGround && !this.canAirDash) return;

    if (!this.onGround) this.canAirDash = false;
    if (dir !== 0) this.facing = dir;
    this.dashTime = P.DASH_TIME;
    this.dashElapsed = 0;
    this.dashCooldown = P.DASH_COOLDOWN;
    this.vx = this.facing * P.DASH_SPEED;
    this.vy = 0;
    this.ghostTimer = 0;
    this.doubleJumping = false;
    this.events.push('dash');
  }

  // El dash dura mientras se mantiene el botón, hasta su máximo
  updateDash(dt) {
    const P = CONFIG.PLAYER;
    this.dashTime -= dt;
    this.dashElapsed += dt;
    if (!Input.held('dash') && this.dashElapsed >= P.DASH_MIN_TIME) this.dashTime = 0;
    if (this.dashTime <= 0) {
      this.endDash();
      return;
    }
    this.vy = 0;
    this.ghostTimer -= dt;
    if (this.ghostTimer <= 0) {
      this.ghosts.push({
        x: this.x, y: this.y,
        anim: 'papa_dash', frame: 0, flip: this.facing < 0,
        life: P.GHOST_LIFE
      });
      this.ghostTimer = P.GHOST_INTERVAL;
    }
  }

  // Al terminar (por tiempo, al soltar el botón o al saltar) baja a velocidad
  // de carrera y corta la estela: así el largo del dash es exacto
  endDash() {
    const max = CONFIG.PLAYER.RUN_SPEED * this.speedMult();
    this.vx = Math.sign(this.vx) * Math.min(Math.abs(this.vx), max);
    this.ghosts.forEach(function (g) { g.life = Math.min(g.life, CONFIG.PLAYER.GHOST_FADE); });
  }

  // ---------- Gancho ----------

  // Anilla más cercana a la altura o más arriba, a menos de RANGE y sin
  // paredes entre medio. En una fila de anillas apunta al punto más cercano.
  findHookTarget(level) {
    if (!this.has('hook')) return null;
    const H = CONFIG.HOOK;
    const T = CONFIG.TILE;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    let best = null;
    let bestDist = H.RANGE;
    level.hookRails.forEach(function (rail) {
      if (this.hook && this.hook.rail === rail) return;   // ya cuelga de esta fila
      const hx = Math.max(rail.x0 + T / 2, Math.min(rail.x1 - T / 2, cx));
      const hy = rail.y + T / 2;
      if (hy > cy + 4) return;
      const dist = Math.sqrt((hx - cx) * (hx - cx) + (hy - cy) * (hy - cy));
      if (dist > bestDist || !level.clearLine(cx, cy, hx, hy)) return;
      best = { rail: rail, x: hx, y: hy };
      bestDist = dist;
    }, this);
    return best;
  }

  // Lanza la cuerda: la papa vuela hacia la anilla
  startHook(target) {
    this.hook = { mode: 'pull', rail: target.rail, x: target.x, stuck: 0 };
    this.dashTime = 0;
    this.endDash();
    this.events.push('hook');
  }

  releaseHook() {
    this.hook = null;
    this.jumpCuttable = false;
  }

  // Lugar donde queda la papa colgando (manos en la anilla)
  hangSpot() {
    return { x: this.hook.x - this.w / 2, y: this.hook.rail.y + CONFIG.HOOK.HANG_OFFSET };
  }

  updateHook(dt, level, axis) {
    const H = CONFIG.HOOK;
    const k = this.hook;
    this.onGround = false;
    this.wallDir = 0;

    // Desde la cuerda se puede lanzar a otra anilla
    if (Input.pressed('action') && this.hookTarget && !this.hookBlocked) {
      this.startHook(this.hookTarget);
      return;
    }

    if (k.mode === 'pull') {
      this.pullToHook(dt, level);
      return;
    }

    // Colgada: salto suelta hacia arriba, abajo suelta, dash sale disparada
    if (Input.pressed('jump')) {
      this.releaseHook();
      this.jump(H.JUMP);
      this.vx = axis * CONFIG.PLAYER.RUN_SPEED * this.speedMult();
      this.events.push('jump');
      return;
    }
    if (Input.pressed('down')) {
      this.releaseHook();
      return;
    }
    if (Input.pressed('dash') && (this.has('dash') || this.has('airDash'))) {
      this.releaseHook();
      this.canAirDash = true;
      this.handleDash(Math.sign(axis));
      return;
    }

    // Avanza por la fila de anillas (si choca con algo, se queda)
    if (axis !== 0) this.facing = Math.sign(axis);
    const T = CONFIG.TILE;
    const r = k.rail;
    const nextX = Math.max(r.x0 + T / 2, Math.min(r.x1 - T / 2, k.x + axis * H.HANG_SPEED * dt));
    if (!level.rectHitsSolid(nextX - this.w / 2, this.y, this.w, this.h)) k.x = nextX;
    const spot = this.hangSpot();
    this.x = spot.x;
    this.y = spot.y;
    this.vx = 0;
    this.vy = 0;
  }

  // Vuela hacia la anilla; al llegar queda colgando
  pullToHook(dt, level) {
    const H = CONFIG.HOOK;
    const k = this.hook;
    const spot = this.hangSpot();
    const dx = spot.x - this.x;
    const dy = spot.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = H.PULL_SPEED * dt;

    if (dist <= step && !level.rectHitsSolid(spot.x, spot.y, this.w, this.h)) {
      this.x = spot.x;
      this.y = spot.y;
      this.vx = 0;
      this.vy = 0;
      k.mode = 'hang';
      this.refillAir();
      this.events.push('hookCatch');
      return;
    }

    const beforeX = this.x;
    const beforeY = this.y;
    this.vx = dx / dist * H.PULL_SPEED;
    this.vy = dy / dist * H.PULL_SPEED;
    this.moveX(dt, level);
    this.moveY(dt, level);
    const moved = Math.abs(this.x - beforeX) + Math.abs(this.y - beforeY);
    k.stuck = moved < step * 0.3 ? k.stuck + dt : 0;
    if (k.stuck > H.STUCK_TIME) this.releaseHook();   // algo lo frena: se suelta
  }

  // ¿Está planeando? (habilidad, cayendo y con el salto mantenido)
  gliding() {
    return this.has('glide') && !this.onGround && this.vy > 0 && Input.held('jump');
  }

  applyGravity(dir, dt) {
    const P = CONFIG.PLAYER;
    if (this.inWater) {
      this.swimGravity(dt);
      return;
    }
    this.vy = Math.min(this.vy + P.GRAVITY * dt, P.MAX_FALL);
    if (this.gliding()) this.vy = Math.min(this.vy, CONFIG.GLIDE.FALL_SPEED);
    const pushingWall = this.wallDir !== 0 && dir === this.wallDir;
    if (pushingWall && this.vy > P.WALL_SLIDE) this.vy = P.WALL_SLIDE;
  }

  // Sin buceo la papa flota en la superficie; con buceo, abajo/arriba la mueven
  swimGravity(dt) {
    const W = CONFIG.WATER;
    const P = CONFIG.PLAYER;
    this.vy = Math.min(this.vy + P.GRAVITY * W.GRAVITY_MULT * dt, W.MAX_FALL);
    const depth = this.y + this.h / 2 - this.waterTop;
    if (this.has('dive')) {
      if (Input.held('down')) this.vy = W.DIVE_SPEED;
      else if (Input.held('up')) this.vy = Math.min(this.vy, -W.DIVE_SPEED);
      else this.vy *= 0.92;
      return;
    }
    if (depth > W.FLOAT_DEPTH) this.vy = Math.max(-90, this.vy - W.FLOAT * dt);
    else if (this.vy > 0) this.vy *= 0.8;
  }

  // Empujón sin daño (la escoba del barrendero)
  shove(dir) {
    this.vx = dir * 170;
    this.vy = Math.min(this.vy, -110);
    this.dashTime = 0;
    this.hook = null;
    this.wallJumpLock = 0.22;
  }

  // Al chocar se apoya en el borde de la caja más cercana.
  // Con el dash, un muro "X" se rompe entero y la papa sigue de largo
  moveX(dt, level) {
    const oldX = this.x;
    this.x += (this.vx + this.push) * dt;
    let boxes = level.solidBoxesIn(this.x, this.y, this.w, this.h).filter(notLift);
    if (boxes.length > 0 && this.dashTime > 0) {
      this.breakWalls(level, boxes);
      boxes = level.solidBoxesIn(this.x, this.y, this.w, this.h).filter(notLift);
    }
    if (boxes.length === 0) return;

    if (this.vx > 0) {
      this.x = Math.min.apply(null, boxes.map(function (b) { return b.x; })) - this.w;
    } else if (this.vx < 0) {
      this.x = Math.max.apply(null, boxes.map(function (b) { return b.x + b.w; }));
    }
    // Si un bloque apareció encima (rítmicas), el empujón de lado podía meter a la
    // papa dentro de una pared: en ese caso se queda donde estaba
    if (level.solidBoxesIn(this.x, this.y, this.w, this.h).filter(notLift).length > 0) this.x = oldX;
    this.vx = 0;
    this.dashTime = 0;
  }

  breakWalls(level, boxes) {
    const T = CONFIG.TILE;
    boxes.forEach(function (b) {
      const tx = Math.floor(b.x / T);
      const ty = Math.floor(b.y / T);
      if (level.tileAt(tx, ty) !== 'X') return;
      const cells = level.breakWall(tx, ty);
      if (cells.length === 0) return;
      this.brokeNow = this.brokeNow.concat(cells);
      this.events.push('break');
    }, this);
  }

  moveY(dt, level) {
    this.y += this.vy * dt;
    let boxes = level.solidBoxesIn(this.x, this.y, this.w, this.h);
    if (this.vy < 0) boxes = boxes.filter(notLift);   // desde abajo se atraviesa
    if (boxes.length === 0) return;

    const falling = this.vy > 0;
    if (falling) {
      this.y = Math.min.apply(null, boxes.map(function (b) { return b.y; })) - this.h;
    } else if (this.vy < 0) {
      this.y = Math.max.apply(null, boxes.map(function (b) { return b.y + b.h; }));
    }
    this.vy = 0;

    if (falling && level.rectHasTile(this.x, this.y + 1, this.w, this.h, 'T')) {
      this.bounce();
    }
  }

  checkSurroundings(level) {
    const P = CONFIG.PLAYER;
    this.onGround = this.vy >= 0 &&
                    level.rectHitsSolid(this.x, this.y + 1, this.w, this.h);

    // Sin la habilidad de pared, las paredes no se agarran
    this.wallDir = 0;
    if (!this.onGround && this.has('wallJump')) {
      if (level.rectHitsSolid(this.x + P.WALL_CHECK, this.y, this.w, this.h)) this.wallDir = 1;
      else if (level.rectHitsSolid(this.x - P.WALL_CHECK, this.y, this.w, this.h)) this.wallDir = -1;
    }

    if (this.onGround || this.wallDir !== 0 || this.inWater) this.refillAir();
  }

  updateGhosts(dt) {
    this.ghosts.forEach(function (g) { g.life -= dt; });
    this.ghosts = this.ghosts.filter(function (g) { return g.life > 0; });
    this.updateStreaks(dt);
  }

  // Corriendo por el suelo deja líneas blancas y grises detrás (se alternan)
  updateStreaks(dt) {
    const S = CONFIG.PLAYER.STREAK;
    this.streaks.forEach(function (s) { s.life -= dt; });
    this.streaks = this.streaks.filter(function (s) { return s.life > 0; });
    const fast = Math.abs(this.vx) > CONFIG.PLAYER.RUN_SPEED * 1.1;
    if (!this.running() || !this.onGround || !fast || this.dashTime > 0) return;
    this.streakTimer -= dt;
    if (this.streakTimer > 0) return;
    this.streakTimer = S.EVERY;
    const back = this.vx > 0 ? this.x - 2 : this.x + this.w + 2;
    this.streakCount = (this.streakCount || 0) + 1;
    this.streaks.push({
      x: back,
      y: this.y + 4 + Math.floor(Math.random() * (this.h - 6)),
      len: S.LENGTH - Math.floor(Math.random() * 3),
      dir: this.vx > 0 ? -1 : 1,
      life: S.LIFE,
      color: this.streakCount % 2 ? '#ffffff' : '#9a9aa8'
    });
  }

  drawStreaks(ctx) {
    const S = CONFIG.PLAYER.STREAK;
    this.streaks.forEach(function (s) {
      const t = s.life / S.LIFE;           // 1 al nacer, 0 al desaparecer
      const drift = (1 - t) * 6;           // se van quedando atrás
      const x = s.dir < 0 ? s.x - drift - s.len : s.x + drift;
      ctx.globalAlpha = t;
      ctx.fillStyle = s.color;
      ctx.fillRect(Math.round(x), Math.round(s.y), s.len, 1);
    });
    ctx.globalAlpha = 1;
  }

  // ---------- Animación ----------

  // Elige la animación según el estado del personaje.
  // Las poses nuevas (colgada, planeo, golpe, poder) solo si está su sprite
  chooseAnimation() {
    const P = CONFIG.PLAYER;
    const has = function (name) { return Sprites.has(name); };
    if (this.powerPose > 0 && has('papa_poder')) return 'papa_poder';
    if (this.hurtPose > 0 && has('papa_dano')) return 'papa_dano';
    if (this.hook) return this.hook.mode === 'hang' && has('papa_colgada') ? 'papa_colgada' : 'papa_salto';
    if (this.gliding() && has('papa_planeo')) return 'papa_planeo';
    if (this.inWater && has('papa_nadar')) return 'papa_nadar';
    if (this.portalPose > 0 && has('papa_portal')) return 'papa_portal';
    if (this.restPose > 0 && has('papa_descanso')) return 'papa_descanso';
    if (this.dashTime > 0) return 'papa_dash';
    if (!this.onGround && this.wallDir !== 0 && this.vy > 0) return 'papa_pared';
    if (!this.onGround) {
      if (this.doubleJumping && this.vy < 0) return 'papa_doble_salto';
      return this.vy < 0 ? 'papa_salto' : 'papa_caida';
    }
    return Math.abs(this.vx) > P.RUN_ANIM_MIN ? 'papa_correr' : 'papa_quieta';
  }

  updateAnimation(dt) {
    this.hurtPose = Math.max(0, this.hurtPose - dt);
    this.powerPose = Math.max(0, this.powerPose - dt);
    this.portalPose = Math.max(0, (this.portalPose || 0) - dt);
    this.restPose = Math.max(0, (this.restPose || 0) - dt);
    const next = this.chooseAnimation();
    if (next !== this.anim) {
      this.anim = next;
      this.animTime = 0;
    } else {
      this.animTime += dt;
    }
  }

  // El sprite de pared ya tiene la pared a la derecha
  isFlipped() {
    if (this.anim === 'papa_pared') return this.wallDir < 0;
    return this.facing < 0;
  }

  draw(ctx) {
    const P = CONFIG.PLAYER;
    this.drawStreaks(ctx);
    this.ghosts.forEach(function (g) {
      ctx.globalAlpha = (g.life / P.GHOST_LIFE) * 0.5;
      this.drawSprite(ctx, g.anim, g.frame, g.x, g.y, g.flip);
    }, this);
    ctx.globalAlpha = 1;

    this.drawHook(ctx);
    const frame = Sprites.frameAt(this.anim, this.animTime);
    this.drawSprite(ctx, this.anim, frame, this.x, this.y, this.isFlipped());
  }

  // Cuerda hasta la anilla, o marca parpadeante en la anilla a la que se puede lanzar
  drawHook(ctx) {
    const H = CONFIG.HOOK;
    const T = CONFIG.TILE;
    if (this.hook) {
      const hx = Math.round(this.hook.x);
      const hy = this.hook.rail.y + T / 2;
      ctx.strokeStyle = H.ROPE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(this.x + this.w / 2) + 0.5, Math.round(this.y) + 2.5);
      ctx.lineTo(hx + 0.5, hy + 0.5);
      ctx.stroke();
      return;
    }
    const t = this.hookTarget;
    if (!t || Math.floor(this.animTime * 6) % 2 === 1) return;
    const x = Math.round(t.x);
    const y = Math.round(t.y);
    ctx.fillStyle = H.MARK;
    ctx.fillRect(x - 7, y - 7, 3, 1);
    ctx.fillRect(x - 7, y - 7, 1, 3);
    ctx.fillRect(x + 5, y - 7, 3, 1);
    ctx.fillRect(x + 7, y - 7, 1, 3);
    ctx.fillRect(x - 7, y + 7, 3, 1);
    ctx.fillRect(x - 7, y + 5, 1, 3);
    ctx.fillRect(x + 5, y + 7, 3, 1);
    ctx.fillRect(x + 7, y + 5, 1, 3);
  }

  // Centra el sprite sobre la hitbox y lo apoya abajo (sin sprite: una papa por código)
  drawSprite(ctx, anim, frame, x, y, flip) {
    const s = SPRITES[anim];
    const ok = Sprites.drawFrame(ctx, anim, frame,
      x + this.w / 2 - s.fw / 2,
      y + this.h - s.fh,
      flip, this.currentTint());
    if (ok) return;
    ctx.fillStyle = this.currentTint() || '#e8c58e';
    ctx.fillRect(Math.round(x), Math.round(y + 4), this.w, this.h - 4);
    ctx.fillStyle = '#a08cc4';
    ctx.fillRect(Math.round(x), Math.round(y), this.w, 5);
  }

  // Con ají la papa parpadea en rojo; si no, usa su skin
  currentTint() {
    if (this.chiliTime > 0 && Math.floor(this.chiliTime * 8) % 2 === 0) return CONFIG.CHILI.COLOR;
    return this.tint;
  }
}
