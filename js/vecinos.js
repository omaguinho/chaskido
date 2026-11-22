// Vecinos: la gente de la fiesta repartida por las zonas (CONFIG.VECINOS).
// Cada uno está cerca del inicio de su sala, con un globo de saludo (uno al azar):
//   · arriba (a su lado): dice su frase y, la primera vez, da su regalo (si tiene)
//   · también se le puede pisar (el triángulo de arriba lo avisa): igual da su regalo
// El vecino difícil (hard) es rápido y esquivo: hay que pisarlo HP veces, o pagarle.
class Vecinos {
  // story: en la historia (el guardián del portón y los vecinos que llegan con la
  // música solo están ahí; no en el speedrun ni en el coliseo)
  // progress: para saber qué jefes ya se vencieron en otras salas (goneAfter)
  constructor(level, roomState, story, progress) {
    const rooms = (progress && progress.rooms) || {};
    const T = CONFIG.TILE;
    this.rs = roomState;
    this.t = 0;
    this.list = (CONFIG.VECINOS || []).filter(function (v) {
      if (v.room !== level.id) return false;
      if (v.tuned) return story && !!roomState.afinada;     // llegan cuando la sala vuelve a sonar
      if (v.bossBeaten && !(story && roomState.boss)) return false;   // se quedan después de perder
      if (v.goneAfter && rooms[v.goneAfter] && rooms[v.goneAfter].boss) return false;
      return true;
    }).map(function (v, i) {
      const spot = Vecinos.findFloor(level, level.spawn.x + v.dx * T, level.spawn.y + CONFIG.PLAYER.H);
      return {
        def: v, i: i, x: spot.x, feet: spot.feet, vx: 0, vy: 0,
        hp: v.hard ? v.hard.HP : 1, inv: 0, down: false, line: 0, angry: false,
        hello: Vecinos.saludo()
      };
    });
    if (story && level.hasGate && level.boss && !level.gateOpen) this.addGuard(level);
  }

  // Guardián del portón (CONFIG.GATE_GUARD): espera junto al portón del jefe, del lado
  // por donde llega la papa. Si la papa choca el portón 3 veces, le habla solo.
  addGuard(level) {
    const T = CONFIG.TILE, G = CONFIG.GATE_GUARD;
    let gate = null;
    for (let ty = level.rowCount - 1; ty >= 0 && !gate; ty--) {
      const tx = level.rows[ty].indexOf('G');
      if (tx >= 0) gate = { x: tx * T + T / 2, y: (ty + 1) * T };
    }
    if (!gate) return;
    // Del lado de afuera de la arena del jefe (si no hay arena, del lado de la llegada)
    const A = level.arena;
    const side = A ? (A.left + A.right) / 2 < gate.x ? 1 : -1 : level.spawn.x < gate.x ? -1 : 1;
    const spot = Vecinos.findFloor(level, gate.x + side * G.DX * T, gate.y);
    if (A && spot.x > A.left && spot.x < A.right && spot.feet > A.top && spot.feet <= A.bottom + T) return;   // no dentro de la arena
    this.list.push({
      def: Object.assign({ id: 'guardia', guard: true, name: CONFIG.CODEX.GUARD_NAMES[level.id] }, G), i: this.list.length, x: spot.x, feet: spot.feet,
      vx: 0, vy: 0, hp: 1, inv: 0, down: false, line: 0, angry: false, hello: G.BUBBLE
    });
  }

  guard() {
    return this.list.find(function (v) { return v.def.guard; }) || null;
  }

  static saludo() {
    const S = CONFIG.SALUDOS;
    return S[Math.floor(Math.random() * S.length)];
  }

  // Busca el suelo bajo un punto (si es pared, prueba un poco al lado)
  static findFloor(level, x, y) {
    const T = CONFIG.TILE;
    const tries = [0, -T, T, -2 * T, 2 * T, -3 * T, 3 * T];
    for (let k = 0; k < tries.length; k++) {
      const px = x + tries[k];
      if (level.rectHitsSolid(px - 4, y - 24, 8, 20)) continue;
      for (let fy = y - 8; fy < y + 6 * T; fy += 2) {
        if (level.rectHitsSolid(px - 4, fy, 8, 1)) return { x: px, feet: fy };
      }
    }
    return { x: x, feet: y };
  }

  gave(v) { return !!(this.rs.vecinos || {})[v.def.id]; }

  // Regalo del vecino (una sola vez en toda la partida)
  give(v, game) {
    if (this.gave(v) || !v.def.gift) return;
    if (v.def.gift.when && !v.def.gift.when(game)) return;   // todavía no se lo ganó
    (this.rs.vecinos || (this.rs.vecinos = {}))[v.def.id] = true;
    const g = v.def.gift;
    const P = game.progress;
    if (g.coins) {
      P.coins += g.coins;
      Effects.popup('+' + g.coins, v.x, v.feet - 30, '#ffd34d');
      Sfx.play('key');
    }
    if (g.power && !P.abilities[g.power]) {
      // Un poder: se entrega como el premio de un jefe (aura y cartel del poder)
      game.overlay = { kind: 'reward', steps: [{ kind: 'aura' }, { kind: 'power', power: g.power }], i: 0, t: 0, boss: v.def.name };
      game.startRewardStep();
    }
    if (g.heart && P.maxHearts < CONFIG.GAME.MAX_HEARTS) {
      P.maxHearts++;
      game.hearts = P.maxHearts;
      Sfx.play('lifeUp');
    }
    game.saveGame();
  }

  near(v, p) {
    return !v.down && Math.abs(p.x + p.w / 2 - v.x) < 22 && Math.abs(p.y + p.h - v.feet) < 24;
  }

  update(dt, game) {
    this.t += dt;
    const p = game.player;
    this.list.forEach(function (v) {
      if (v.down) return;
      v.inv = Math.max(0, v.inv - dt);
      if (v.def.hard) this.moveHard(v, dt, game);
      // Pisotón: la papa cae sobre su cabeza
      const head = { x: v.x - 6, y: v.feet - 22, w: 12, h: 8 };
      if (!v.def.guard && !v.def.noStomp && p.vy > 0 && v.inv <= 0 && overlaps(head, p) && p.y + p.h < v.feet - 10) {
        p.stomp();
        Sfx.play('stomp');
        v.hp--;
        v.inv = 0.8;
        v.angry = true;
        if (v.hp <= 0) {
          v.down = true;
          Effects.play('poof', v.x, v.feet - 10);
          if (v.def.hard) {
            game.say(v.def.name + ': ' + tr(v.def.hard.WIN), 4, true);
            Registro.ev('vecino', { id: v.def.id, duro: 'pisado' });
          }
          this.give(v, game);
        } else {
          v.vx = (v.x < p.x ? -1 : 1) * v.def.hard.SPEED * 1.5;   // sale disparado
          v.vy = -v.def.hard.JUMP;
        }
        return;
      }
      // Hablar
      if (this.near(v, p) && Input.pressed('up') && !game.modal) {
        const H = v.def.hard;
        if (H && !this.gave(v) && game.progress.coins >= H.PRICE) {
          game.progress.coins -= H.PRICE;
          v.down = true;
          Effects.play('poof', v.x, v.feet - 10);
          game.say(v.def.name + ': ' + tr(H.PAID), 4, true);
          Registro.ev('vecino', { id: v.def.id, duro: 'pagado' });
          this.give(v, game);
          return;
        }
        const lines = (this.gave(v) || (v.def.guard && game.level.gateOpen)) && v.def.after ? v.def.after : v.def.lines;
        // Si ya cumpliste lo que pide, dice primero la frase del regalo
        const ready = !this.gave(v) && v.def.gift && v.def.gift.when && v.def.gift.when(game);
        const line = ready ? lines[0] : lines[v.line % lines.length];
        // "Nombre: frase" (la frase se traduce aquí; el nombre es propio y no cambia)
        const name = v.def.name;
        const said = tr(typeof line === 'function' ? line(game) : line);
        game.say(name ? name + ': ' + said : said, 6, true);
        if (name && !v.def.sprite) Codex.papa(game, v.def.guard ? 'guardia_' + game.level.id : v.def.id, name);
        Registro.ev('vecino', { id: v.def.id });
        v.line++;
        Sfx.play('select');
        if (!H) this.give(v, game);
      }
    }, this);
  }

  // El vecino difícil: si la papa salta cerca de él, esquiva (corre y salta);
  // después del primer golpe, corre todo el tiempo
  moveHard(v, dt, game) {
    const H = v.def.hard;
    const p = game.player;
    const L = game.level;
    const dx = v.x - (p.x + p.w / 2);
    const threat = Math.abs(dx) < H.SEE && (v.angry || (!p.onGround && p.y + p.h < v.feet - 4));
    if (threat) v.vx = (dx >= 0 ? 1 : -1) * H.SPEED;
    else v.vx *= 0.85;
    const onGround = L.rectHitsSolid(v.x - 4, v.feet, 8, 1);
    if (threat && onGround && Math.abs(dx) < H.SEE / 2) v.vy = -H.JUMP;
    v.vy = Math.min(v.vy + 900 * dt, 400);
    // Movimiento con choque simple (cuerpo 8 x 20)
    const nx = v.x + v.vx * dt;
    if (L.rectHitsSolid(nx - 4, v.feet - 20, 8, 19)) { v.vx = -v.vx; v.vy = onGround ? -H.JUMP : v.vy; }
    else v.x = nx;
    const nf = v.feet + v.vy * dt;
    if (v.vy > 0 && L.rectHitsSolid(v.x - 4, nf - 1, 8, 1)) {
      v.feet = Math.floor(nf / CONFIG.TILE) * CONFIG.TILE;
      v.vy = 0;
    } else if (v.vy < 0 && L.rectHitsSolid(v.x - 4, nf - 20, 8, 1)) {
      v.vy = 0;
    } else {
      v.feet = nf;
    }
    if (v.feet > L.pxH + 64) { v.feet = L.spawn.y + CONFIG.PLAYER.H; v.x = L.spawn.x + 4 * CONFIG.TILE; v.vy = 0; }
  }

  draw(ctx, game) {
    const p = game.player;
    // Bailan si la sala suena (afinada, o una sala con su música de siempre); si no,
    // quietos: así se nota qué salas todavía no tienen música
    const music = !!this.rs.afinada || !game.isMissionRoom(game.level);
    this.list.forEach(function (v) {
      if (v.down) return;
      if (v.inv > 0 && Math.floor(v.inv * 12) % 2 === 0) return;     // parpadea al recibir un golpe
      if (v.def.sprite && Sprites.has(v.def.sprite)) {
        const sp = SPRITES[v.def.sprite];
        const flip = p.x + p.w / 2 < v.x;
        Sprites.drawFrame(ctx, v.def.sprite, Sprites.frameAt(v.def.sprite, this.t), v.x - sp.fw / 2, v.feet - sp.fh, flip);
      } else {
        Scenes.drawNpc(ctx, v.x, v.feet, v.def.kind, v.def.color, this.t, (this.t * 2) % 1, !music && Math.abs(v.vx) < 5, v.i + 3);
      }
      // Triángulo de pisotón (rojo, apunta hacia abajo); el guardián y los jefes no se pisan
      if (!v.def.guard && !v.def.noStomp) this.drawStompMark(ctx, v);
      this.drawBubble(ctx, v, this.near(v, p));
    }, this);
  }

  drawStompMark(ctx, v) {
    const ty = Math.round(v.feet - 30 + Math.sin(this.t * 6) * 1.5);
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath();
    ctx.moveTo(v.x - 3, ty); ctx.lineTo(v.x + 3, ty); ctx.lineTo(v.x, ty + 4);
    ctx.fill();
  }

  // Globo con el saludo (amarillo cuando estás al lado: "▲ Hablar")
  drawBubble(ctx, v, near) {
    const label = tr(near ? '▲ Hablar' : (v.line ? '▲ ...' : v.hello));
    const bob = Math.round(Math.sin(this.t * 5) * 2);
    ctx.font = gameFont(7);
    const w = Math.ceil(ctx.measureText(label).width) + 8;
    const x = Math.round(v.x - w / 2);
    const y = Math.round(v.feet - 46 + bob);
    ctx.fillStyle = near ? '#ffd34d' : '#fbf6ec';
    ctx.fillRect(x, y, w, 11);
    ctx.fillRect(Math.round(v.x) - 2, y + 11, 4, 2);
    ctx.fillStyle = '#2e2a47';
    ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + 10, w, 1);
    ctx.fillRect(x, y, 1, 11); ctx.fillRect(x + w - 1, y, 1, 11);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, Math.round(v.x), y + 2);
    ctx.textAlign = 'left';
  }
}
