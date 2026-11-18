// instrumentos.js

class Instrumento {
  constructor(tx, ty, tipo) {
    const T = CONFIG.TILE;
    this.w = 16; 
    this.h = 16;
    this.spawnX = tx * T + (T - this.w) / 2;
    this.spawnY = (ty + 1) * T - this.h;
    this.tipo = tipo; 
    this.seed = (tx * 7 + ty * 3) % 10;
    this.reset();
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.state = 'idle';   
    this.timer = 0;
    this.hopTimer = 0;
    this.onGround = false;
    this.animTime = Math.random();
  }

  wake() {
    // Ya no hace falta, el estado inicial es 'idle'
  }

  distanceTo(p) {
    const dx = p.x + p.w / 2 - (this.x + this.w / 2);
    const dy = p.y + p.h / 2 - (this.y + this.h / 2);
    return Math.sqrt(dx * dx + dy * dy) / CONFIG.TILE;
  }

  update(dt, level, player, levelId, active) {
    const C = CONFIG.CORCHEA; 
    this.animTime += dt;
    
    if (this.state === 'caught') return;
    
    // SI LA MISIÓN NO ESTÁ ACTIVA, NO HACEN NADA (se quedan quietos)
    if (!active) {
      this.vx = 0;
      this.move(dt, level); 
      return;
    }
    
    const dist = this.distanceTo(player);
    Music.setStemDistance(this.tipo, dist);

    if (this.state === 'idle') {
      this.vx = 0;
      if (dist < C.SEE) {
        this.state = 'alert';
        this.timer = C.ALERT_TIME;
        Sfx.play('alert');
      }
    } else if (this.state === 'alert') {
      this.vx = 0;
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'flee';
    } else if (this.state === 'flee') {
      if (dist > C.CALM) {
        this.state = 'idle';
      } else {
        this.dir = player.x + player.w / 2 < this.x + this.w / 2 ? 1 : -1;
        this.hopTimer -= dt;
        if (this.onGround && this.hopTimer <= 0) this.hop(level);
      }
    }
    this.move(dt, level);
  }

  hop(level) {
    const C = CONFIG.CORCHEA;
    this.hopTimer = C.HOP_EVERY;
    if (!this.safeAhead(level)) {
      this.vx = 0;
      this.vy = -C.HOP * 0.6;   
      return;
    }
    const wall = level.rectHitsSolid(this.x + this.dir * 8, this.y - 2, this.w, this.h);
    this.vy = -C.HOP * (wall ? 1.35 : 1);
    this.vx = this.dir * C.SPEED;
    this.onGround = false;
  }

  safeAhead(level) {
    const T = CONFIG.TILE;
    const ax = this.dir > 0 ? this.x + this.w + T : this.x - T;
    for (let d = 0; d <= CONFIG.CORCHEA.MAX_DROP * T; d += 4) {
      if (level.rectHitsSolid(ax, this.y + this.h + d, 2, 2)) return true;
    }
    return false;
  }

  move(dt, level) {
    this.vy = Math.min(this.vy + CONFIG.PLAYER.GRAVITY * dt, CONFIG.PLAYER.MAX_FALL);
    this.x += this.vx * dt;
    if (level.rectHitsSolid(this.x, this.y, this.w, this.h)) {
      this.x -= this.vx * dt;
      this.vx = 0;
    }
    this.y += this.vy * dt;
    const boxes = level.solidBoxesIn(this.x, this.y, this.w, this.h);
    this.onGround = false;
    if (boxes.length > 0) {
      if (this.vy > 0) {
        this.y = Math.min.apply(null, boxes.map(function (b) { return b.y; })) - this.h;
        this.onGround = true;
        this.vx *= 0.3;
      } else {
        this.y = Math.max.apply(null, boxes.map(function (b) { return b.y + b.h; }));
      }
      this.vy = 0;
    }
    if (this.y > level.pxH + 32) this.reset();   
  }

  // NUEVO: Recibe isVisible para ocultarse si no hay misión
  draw(ctx, isVisible) {
  if (this.state === 'caught' || !isVisible) return;
  
  const cx = this.x + this.w / 2;
  
  // FLOTACIÓN: Sube y baja 4 píxeles suavemente
  const floatY = Math.sin(this.animTime * 3) * 4; 
  
  // POSICIÓN: El "- 6" hace que flote por encima del piso, no debajo
  const bottom = this.y + this.h - 6 + floatY; 
  
  const flip = this.dir < 0;
  
  // --- DIBUJAR EL AURA (Luz circular) ---
  const auraRadius = this.w * 2.5; // Radio de 40px (5 veces su tamaño de 16px)
  const cy = bottom - this.h / 2; // Centro del aura
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, auraRadius);
  grad.addColorStop(0, 'rgba(255, 240, 180, 0.5)'); // Centro brillante
  grad.addColorStop(1, 'rgba(255, 240, 180, 0)');    // Borde transparente
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
  ctx.fill();
  // ------------------------------------

  const spriteName = 'sprite_' + this.tipo; 
  const frame = Sprites.frameAt(spriteName, this.animTime);
  
  let ok = Sprites.drawAnchored(ctx, spriteName, frame, cx, bottom, flip);
  if (!ok) this.drawFallback(ctx, floatY);
  
  if (this.state === 'alert') {
    const x = Math.round(cx) - 1;
    const y = Math.round(this.y) - 12 + floatY;
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(x - 1, y - 1, 4, 10);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(x, y, 2, 5);
    ctx.fillRect(x, y + 6, 2, 2);
  }
}

  // NUEVO: Recibe floatY para que el cuadro de emergencia también flote
  drawFallback(ctx, floatY) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    ctx.fillStyle = '#ff0000'; 
    ctx.fillRect(x - 2, y - 2 + (floatY || 0), this.w + 4, this.h + 4);
  }
}

class Instrumentos {
  constructor(level) {
    this.list = [];
    this.active = false; // Controla si la misión empezó
    const spawns = level.corcheaSpawns || []; 

    const levelFiles = CONFIG.MUSIC.LEVEL_STEMS || {};
    const generalFiles = CONFIG.MUSIC.STEMS || {};
    const files = (level.id && levelFiles[level.id]) ? levelFiles[level.id] : generalFiles;
    const tipos = Object.keys(files); 

    const max = Math.min(tipos.length, spawns.length);
    for (let i = 0; i < max; i++) {
      this.list.push(new Instrumento(spawns[i].tx, spawns[i].ty, tipos[i]));
    }
  }

  wakeAll() {
    this.active = true; // Activa la lógica de audio y huida
  }

  resetAll() {
    this.active = false;
    this.list.forEach(function (c) { c.reset(); });
    Music.resetStems(); 
  }

  update(dt, level, player, levelId) {
    this.list.forEach(function (c) { c.update(dt, level, player, levelId, this.active); }, this);
  }

  catchWith(player) {
    if (!this.active) return []; // No se pueden atrapar si no hay misión
    let caught = [];
    this.list.forEach(function (c) {
      if (c.state === 'caught') return;
      if (overlaps(c, player)) {
        c.state = 'caught';
        Effects.play('chispa', c.x + c.w / 2, c.y + c.h / 2);
        Music.collectStem(c.tipo); 
        caught.push(c.tipo); 
      }
    });
    return caught;
  }

  remaining() {
    return this.list.filter(function (c) { return c.state !== 'caught'; });
  }

  total() {
    return this.list.length;
  }

  // NUEVO: Le pasa el estado "active" al dibujo
  draw(ctx) {
    this.list.forEach(function (c) { c.draw(ctx, this.active); }, this);
  }
}