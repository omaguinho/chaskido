// Modo speedrun: se abre al terminar la historia en Normal o Difícil (como el coliseo).
// Menú con las zonas y el récord de cada una: eliges una y la juegas con todos los
// poderes, contra el reloj, hasta rescatar todos los instrumentos de sus 3 salas.
// No se guarda la partida; solo los récords (records.speedrun y records.tower), que
// además se mandan a los récords mundiales (js/ranking.js).
const SpeedRun = (function () {
  // Instrumentos de una sala: los de su música, hasta la cantidad de lugares (n) del mapa
  function roomInstruments(id) {
    const files = (CONFIG.MUSIC.LEVEL_STEMS || {})[id] || {};
    const kinds = Object.keys(files).filter(function (t) { return t !== 'tema'; }).length;
    const L = LEVELS.find(function (l) { return l.id === id; });
    const spots = L ? L.map.join('').split('n').length - 1 : 0;
    return Math.min(kinds, spots);
  }

  function zoneTotal(zone) {
    return zone.rooms.reduce(function (n, id) { return n + roomInstruments(id); }, 0);
  }

  // Instrumentos rescatados en la zona (en esta carrera)
  function zoneGot(game, zone) {
    return zone.rooms.reduce(function (n, id) {
      const rs = game.progress.rooms[id];
      if (!rs) return n;
      if (rs.afinada) return n + roomInstruments(id);
      return n + (rs.caught || []).filter(Boolean).length;
    }, 0);
  }

  function clock(t) {
    if (t === undefined || t === null) return '—';
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
  }

  function records(game) {
    return game.records.speedrun || (game.records.speedrun = {});
  }

  // ---------- Menú de zonas ----------
  // Filas: las 7 zonas y, al final, el Coliseo de los jefes. A la derecha, los mejores
  // tiempos del mundo de la fila elegida (js/ranking.js). ♪ (F): cambiar nombre.

  function rows() { return CONFIG.SPEEDRUN.ZONES.length + 1; }
  function isTowerRow(i) { return i === CONFIG.SPEEDRUN.ZONES.length; }
  function boardOf(i) { return isTowerRow(i) ? CONFIG.RANKING.TOWER : CONFIG.RANKING.BOARDS[i]; }
  function rowName(i) { return isTowerRow(i) ? 'Coliseo de los jefes' : CONFIG.SPEEDRUN.ZONES[i].name; }
  function rowRecord(game, i) { return isTowerRow(i) ? game.records.tower : records(game)[i]; }

  function openMenu(game) {
    game.state = 'speedmenu';
    game.mode = 'speedrun';
    game.speedPick = game.speedPick || 0;
    game.screenTime = 0;
    game.speed = null;
    Music.stopStems();
    Music.play('zona1');
    Music.setRate(1);
    if (!Ranking.name()) openName(game);   // la primera vez se elige el nombre
  }

  function updateMenu(game) {
    if (game.screenTime < 0.3) return;
    if (game.nameEdit) { updateName(game); return; }
    const n = rows();
    if (Input.pressed('down')) { game.speedPick = (game.speedPick + 1) % n; Sfx.play('move'); }
    if (Input.pressed('up')) { game.speedPick = (game.speedPick + n - 1) % n; Sfx.play('move'); }
    const row = game.tappedRow ? game.tappedRow(CONFIG.SPEEDRUN.MENU, n) : -1;
    if (row >= 0) game.speedPick = row;
    if (Input.pressed('pause')) { Sfx.play('move'); game.openTitle(); return; }
    if (Input.pressed('tuner')) { openName(game); return; }   // ♪ / F: cambiar nombre
    if (Input.pressed('confirm') || row >= 0) {
      if (isTowerRow(game.speedPick)) startTower(game);
      else start(game, game.speedPick);
    }
  }

  function drawMenu(ctx, game) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, M = CONFIG.SPEEDRUN.MENU;
    const SPLIT = 196;
    ctx.fillStyle = '#140b2b';
    ctx.fillRect(0, 0, W, H);
    UI.text(ctx, 'Speedrun', W / 2, 6, '#ffd34d', 10, 'center');
    UI.text(ctx, 'Rescata los instrumentos de la zona lo más rápido posible', W / 2, 20, '#9a93b0', 5, 'center');
    for (let i = 0; i < rows(); i++) {
      const y = M.TOP + i * M.STEP;
      const on = i === game.speedPick;
      const rec = rowRecord(game, i);
      if (on) {
        ctx.fillStyle = 'rgba(255, 211, 77, 0.16)';
        ctx.fillRect(8, y - 2, SPLIT - 12, M.STEP - 1);
      }
      const label = isTowerRow(i) ? rowName(i) : (i + 1) + '. ' + rowName(i);
      UI.text(ctx, label, 12, y, on ? '#ffd34d' : (isTowerRow(i) ? '#ff9e6b' : '#fbf6ec'), 6);
      UI.text(ctx, clock(rec), SPLIT - 8, y + 1, rec ? '#7be0a0' : '#6b6580', 5, 'right');
    }
    drawWorld(ctx, game, SPLIT);
    UI.text(ctx, 'Aceptar: jugar   ♪: nombre (' + (Ranking.name() || '—') + ')   Pausa: volver',
      W / 2, H - 9, '#6b6580', 5, 'center');
    if (game.nameEdit) drawName(ctx, game);
  }

  // Mejores tiempos del mundo de la fila elegida
  function drawWorld(ctx, game, x0) {
    const W = CONFIG.WIDTH, board = boardOf(game.speedPick);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(x0, 32, W - x0 - 6, 124);
    UI.text(ctx, '🌎 Mundial', x0 + 6, 36, '#ffd34d', 6);
    const list = Ranking.top(board);
    if (list === null) { UI.text(ctx, 'Cargando…', x0 + 6, 52, '#9a93b0', 5); return; }
    if (!list.length) {
      UI.text(ctx, Ranking.failed(board) ? 'Sin conexión' : '¡Sé el primero!', x0 + 6, 52, '#9a93b0', 5);
      return;
    }
    const me = Ranking.name();
    list.forEach(function (it, k) {
      const y = 50 + k * 10;
      const color = it.name === me ? '#7be0a0' : '#fbf6ec';
      UI.text(ctx, it.rank + '. ' + it.name, x0 + 6, y, color, 5);
      UI.text(ctx, clock(it.time), W - 10, y, color, 5, 'right');
    });
  }

  // ---------- Nombre (arriba/abajo: letra; izquierda/derecha: lugar; Aceptar: listo) ----------

  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';

  function openName(game) {
    const max = CONFIG.RANKING.NAME_MAX;
    const cur = (Ranking.name() || 'PAPA').toUpperCase();
    const chars = [];
    for (let i = 0; i < max; i++) {
      const c = cur[i] || ' ';
      chars.push(Math.max(0, LETTERS.indexOf(c)));
    }
    game.nameEdit = { chars: chars, pos: 0 };
    Sfx.play('select');
  }

  function updateName(game) {
    const E = game.nameEdit, L = LETTERS.length, max = E.chars.length;
    if (Input.pressed('up')) { E.chars[E.pos] = (E.chars[E.pos] + 1) % L; Sfx.play('move'); }
    if (Input.pressed('down')) { E.chars[E.pos] = (E.chars[E.pos] + L - 1) % L; Sfx.play('move'); }
    if (Input.pressed('right')) { E.pos = Math.min(max - 1, E.pos + 1); Sfx.play('move'); }
    if (Input.pressed('left')) { E.pos = Math.max(0, E.pos - 1); Sfx.play('move'); }
    if (Input.pressed('confirm') || Input.pressed('pause')) {
      const n = E.chars.map(function (c) { return LETTERS[c]; }).join('').trim();
      Ranking.setName(n || 'PAPA');
      game.nameEdit = null;
      game.screenTime = 0;           // que el mismo botón no empiece una carrera
      Sfx.play('select');
    }
  }

  function drawName(ctx, game) {
    const W = CONFIG.WIDTH, H = CONFIG.HEIGHT, E = game.nameEdit;
    ctx.fillStyle = 'rgba(20, 11, 43, 0.92)';
    ctx.fillRect(0, 0, W, H);
    UI.text(ctx, 'Tu nombre para los récords', W / 2, 46, '#ffd34d', 8, 'center');
    const cw = 16, x0 = Math.round(W / 2 - E.chars.length * cw / 2);
    E.chars.forEach(function (c, i) {
      const x = x0 + i * cw, on = i === E.pos;
      ctx.fillStyle = on ? 'rgba(255, 211, 77, 0.3)' : 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x + 1, 72, cw - 2, 20);
      UI.text(ctx, LETTERS[c] === ' ' ? '·' : LETTERS[c], x + cw / 2, 76, on ? '#ffd34d' : '#fbf6ec', 10, 'center');
      if (on) {
        UI.text(ctx, '▲', x + cw / 2, 62, '#9a93b0', 5, 'center');
        UI.text(ctx, '▼', x + cw / 2, 96, '#9a93b0', 5, 'center');
      }
    });
    UI.text(ctx, 'Arriba/abajo: letra   Izquierda/derecha: lugar   Aceptar: listo', W / 2, 120, '#9a93b0', 5, 'center');
  }

  // ---------- La carrera ----------

  function start(game, i) {
    const zone = CONFIG.SPEEDRUN.ZONES[i];
    Sfx.play('select');
    game.mode = 'speedrun';
    game.difficulty = 'normal';
    game.newRun();
    const P = game.progress;
    // Todos los poderes y todas las notas del diapasón
    CATALOGO.PODERES.forEach(function (p) { P.abilities[p.id] = true; });
    Object.keys(CONFIG.TUNER.NOTES).forEach(function (n) { P.tunerNotes[n] = true; });
    game.speed = { zone: i, t: 0, total: zoneTotal(zone), done: 0 };
    game.loadRoom(zone.rooms[0], null);
    game.state = 'play';
    game.startRoomMusic();
  }

  // Cada paso: corre el reloj y revisa si ya están todos
  function tick(game, dt) {
    const S = game.speed;
    if (!S || S.done) {
      if (S && S.done) {
        S.done += dt;
        if (S.done > 3.5) openMenu(game);
      }
      return;
    }
    S.t += dt;
    const zone = CONFIG.SPEEDRUN.ZONES[S.zone];
    if (zoneGot(game, zone) >= S.total) {
      S.done = 0.001;
      const R = records(game);
      S.record = !R[S.zone] || S.t < R[S.zone];
      if (S.record) {
        R[S.zone] = S.t;
        Save.writeRecords(game.records);
      }
      Ranking.submit(CONFIG.RANKING.BOARDS[S.zone], S.t);
      Sfx.play('bossWon');
      game.say(tr(S.record ? '¡Récord!' : '¡Zona completa!') + ' ' + clock(S.t), 3.4);
    }
  }

  // ---------- Coliseo de los jefes con reloj ----------
  // El reloj corre mientras se pelea (no en la pausa entre jefes ni en los mensajes);
  // si se pierde, se repite el jefe y el reloj sigue.

  function startTower(game) {
    Sfx.play('select');
    game.speed = null;
    game.mode = 'tower';
    game.difficulty = TOWER.DIFFICULTY;
    game.newRun();
    game.towerFloor = 0;
    game.towerTime = 0;
    game.towerDone = false;
    game.state = 'ready';
    game.screenTime = 0;
  }

  function towerTick(game, dt) {
    if (game.towerNext <= 0 && !game.towerDone) game.towerTime = (game.towerTime || 0) + dt;
  }

  // Coliseo completo: récord del aparato y del mundo
  function towerWon(game) {
    const t = game.towerTime || 0;
    game.towerDone = true;
    game.towerRecord = !game.records.tower || t < game.records.tower;
    if (game.towerRecord) {
      game.records.tower = t;
      Save.writeRecords(game.records);
    }
    Ranking.submit(CONFIG.RANKING.TOWER, t);
  }

  // Sin corazones: vuelve al menú de zonas
  function fail(game) {
    game.say('Se acabaron los corazones. ¡Otra vez!', 2);
    openMenu(game);
  }

  // Reloj y contador arriba al medio
  function drawHud(ctx, game) {
    if (game.mode === 'tower') {
      const txt = '⏱ ' + clock(game.towerTime || 0) + '   ' + (game.towerFloor + 1) + '/' + TOWER.FLOORS.length;
      UI.text(ctx, txt, CONFIG.WIDTH / 2, 20, game.towerDone ? '#7be0a0' : '#fbf6ec', 7, 'center');
      return;
    }
    const S = game.speed;
    if (!S) return;
    const zone = CONFIG.SPEEDRUN.ZONES[S.zone];
    const txt = '⏱ ' + clock(S.t) + '   ♪ ' + zoneGot(game, zone) + '/' + S.total;
    UI.text(ctx, txt, CONFIG.WIDTH / 2, 20, S.done ? '#7be0a0' : '#fbf6ec', 7, 'center');
  }

  return {
    openMenu: openMenu, updateMenu: updateMenu, drawMenu: drawMenu, tick: tick, fail: fail, drawHud: drawHud,
    clock: clock, startTower: startTower, towerTick: towerTick, towerWon: towerWon
  };
})();
