// Las corcheas de la misión: duermen hasta que la papa toca el tótem. Despiertas,
// si la papa se acerca a CONFIG.CORCHEA.SEE bloques sale un "!" y huyen dando
// saltitos; no se tiran por bordes muy altos (ahí quedan acorraladas).
// Se atrapan tocándolas.
class Corchea {
  constructor(tx, ty) {
    const T = CONFIG.TILE;
    this.w = 10;
    this.h = 10;
    this.spawnX = tx * T + (T - this.w) / 2;
    this.spawnY = (ty + 1) * T - this.h;
    this.seed = (tx * 7 + ty * 3) % 10;
    this.reset();
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.state = 'asleep';   // asleep, idle, alert, flee, caught
    this.timer = 0;
    this.hopTimer = 0;
    this.onGround = false;
    this.animTime = Math.random();
  }

  wake() {
    if (this.state === 'asleep') this.state = 'idle';
  }

  distanceTo(p) {
    const dx = p.x + p.w / 2 - (this.x + this.w / 2);
    const dy = p.y + p.h / 2 - (this.y + this.h / 2);
    return Math.sqrt(dx * dx + dy * dy) / CONFIG.TILE;
  }

  update(dt, level, player) {
    const C = CONFIG.CORCHEA;
    this.animTime += dt;
    if (this.state === 'asleep' || this.state === 'caught') return;
    const dist = this.distanceTo(player);

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

  // Un saltito hacia el lado contrario de la papa, si hay por dónde
  hop(level) {
    const C = CONFIG.CORCHEA;
    this.hopTimer = C.HOP_EVERY;
    if (!this.safeAhead(level)) {
      this.vx = 0;
      this.vy = -C.HOP * 0.6;   // acorralada: salta en su lugar
      return;
    }
    const wall = level.rectHitsSolid(this.x + this.dir * 8, this.y - 2, this.w, this.h);
    this.vy = -C.HOP * (wall ? 1.35 : 1);
    this.vx = this.dir * C.SPEED;
    this.onGround = false;
  }

  // ¿Hay suelo delante a no más de MAX_DROP bloques de caída?
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
    if (this.y > level.pxH + 32) this.reset();   // se cayó del mapa: vuelve a su lugar
  }

  draw(ctx) {
    if (this.state === 'caught') return;
    const cx = this.x + this.w / 2;
    const bottom = this.y + this.h + 3;
    const flip = this.dir < 0;
    if (this.state === 'asleep') {
      ctx.globalAlpha = 0.45;
      if (!Sprites.drawAnchored(ctx, 'corchea', 0, cx, bottom, false)) this.drawFallback(ctx, '#c9b8e3');
      ctx.globalAlpha = 1;
      // "z" que suben
      const z = (this.animTime * 0.8 + this.seed * 0.1) % 1;
      ctx.globalAlpha = 1 - z;
      ctx.fillStyle = '#fbf6ec';
      ctx.font = '6px ' + CONFIG.FONT;
      ctx.fillText('z', Math.round(cx + 4 + z * 3), Math.round(this.y - 4 - z * 8));
      ctx.globalAlpha = 1;
      return;
    }
    let ok;
    if (this.state === 'alert') ok = Sprites.drawAnchored(ctx, 'corchea_alerta', 0, cx, bottom, flip);
    else if (this.state === 'flee') ok = Sprites.drawAnchored(ctx, 'corchea_huir', Sprites.frameAt('corchea_huir', this.animTime), cx, bottom, flip);
    else ok = Sprites.drawAnchored(ctx, 'corchea', Sprites.frameAt('corchea', this.animTime), cx, bottom + Math.round(Math.sin(this.animTime * 4) * 1.5), flip);
    if (!ok) ok = Sprites.drawAnchored(ctx, 'corchea', 0, cx, bottom, flip);
    if (!ok) this.drawFallback(ctx, '#ffe066');
    if (this.state === 'alert') {
      const x = Math.round(cx) - 1;
      const y = Math.round(this.y) - 12;
      ctx.fillStyle = '#2e2a47';
      ctx.fillRect(x - 1, y - 1, 4, 10);
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(x, y, 2, 5);
      ctx.fillRect(x, y + 6, 2, 2);
    }
  }

  drawFallback(ctx, color) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    ctx.fillStyle = color;
    ctx.fillRect(x, y + 6, 6, 5);
    ctx.fillRect(x + 5, y - 2, 2, 10);
    ctx.fillRect(x + 5, y - 2, 5, 2);
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(x + 1, y + 7, 1, 1);
    ctx.fillRect(x + 3, y + 7, 1, 1);
  }
}

class Corcheas {
  constructor(level) {
    this.list = level.corcheaSpawns.map(function (s) { return new Corchea(s.tx, s.ty); });
  }

  wakeAll() {
    this.list.forEach(function (c) { c.wake(); });
  }

  // Vuelven a dormir en su lugar (la misión se reinicia)
  resetAll() {
    this.list.forEach(function (c) { c.reset(); });
  }

  update(dt, level, player) {
    this.list.forEach(function (c) { c.update(dt, level, player); });
  }

  // Devuelve cuántas atrapó la papa en este paso
  catchWith(player) {
    let n = 0;
    this.list.forEach(function (c) {
      if (c.state === 'asleep' || c.state === 'caught') return;
      if (overlaps(c, player)) {
        c.state = 'caught';
        Effects.play('chispa', c.x + c.w / 2, c.y + c.h / 2);
        n++;
      }
    });
    return n;
  }

  remaining() {
    return this.list.filter(function (c) { return c.state !== 'caught'; });
  }

  total() {
    return this.list.length;
  }

  draw(ctx) {
    this.list.forEach(function (c) { c.draw(ctx); });
  }
}
