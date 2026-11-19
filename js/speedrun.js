// Modo speedrun: se abre al terminar la historia en Normal o Difícil (como el coliseo).
// Menú con las zonas y el récord de cada una: eliges una y la juegas con todos los
// poderes, contra el reloj, hasta rescatar todos los instrumentos de sus 3 salas.
// No se guarda la partida; solo los récords (records.speedrun).
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

  function openMenu(game) {
    game.state = 'speedmenu';
    game.mode = 'speedrun';
    game.speedPick = game.speedPick || 0;
    game.screenTime = 0;
    game.speed = null;
    Music.stopStems();
    Music.play('zona1');
    Music.setRate(1);
  }

  function updateMenu(game) {
    if (game.screenTime < 0.3) return;
    const Z = CONFIG.SPEEDRUN.ZONES;
    if (Input.pressed('down')) { game.speedPick = (game.speedPick + 1) % Z.length; Sfx.play('move'); }
    if (Input.pressed('up')) { game.speedPick = (game.speedPick + Z.length - 1) % Z.length; Sfx.play('move'); }
    const row = game.tappedRow ? game.tappedRow(CONFIG.SPEEDRUN.MENU, Z.length) : -1;
    if (row >= 0) game.speedPick = row;
    if (Input.pressed('pause')) { Sfx.play('move'); game.openTitle(); return; }
    if (Input.pressed('confirm') || row >= 0) start(game, game.speedPick);
  }

  function drawMenu(ctx, game) {
    const W = CONFIG.WIDTH, M = CONFIG.SPEEDRUN.MENU;
    ctx.fillStyle = '#140b2b';
    ctx.fillRect(0, 0, W, CONFIG.HEIGHT);
    UI.text(ctx, 'Speedrun', W / 2, 10, '#ffd34d', 10, 'center');
    UI.text(ctx, 'Elige una zona y rescata sus instrumentos lo más rápido posible', W / 2, 24, '#9a93b0', 5, 'center');
    const R = records(game);
    CONFIG.SPEEDRUN.ZONES.forEach(function (z, i) {
      const y = M.TOP + i * M.STEP;
      const on = i === game.speedPick;
      if (on) {
        ctx.fillStyle = 'rgba(255, 211, 77, 0.16)';
        ctx.fillRect(24, y - 2, W - 48, M.STEP - 1);
      }
      UI.text(ctx, (i + 1) + '. ' + z.name, 30, y, on ? '#ffd34d' : '#fbf6ec', 7);
      UI.text(ctx, 'Récord ' + clock(R[i]), W - 30, y, R[i] ? '#7be0a0' : '#6b6580', 6, 'right');
    });
    UI.text(ctx, 'Aceptar: jugar   Pausa: volver', W / 2, CONFIG.HEIGHT - 10, '#6b6580', 5, 'center');
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
      Sfx.play('bossWon');
      game.say((S.record ? '¡Récord! ' : '¡Zona completa! ') + clock(S.t), 3.4);
    }
  }

  // Sin corazones: vuelve al menú de zonas
  function fail(game) {
    game.say('Se acabaron los corazones. ¡Otra vez!', 2);
    openMenu(game);
  }

  // Reloj y contador arriba al medio
  function drawHud(ctx, game) {
    const S = game.speed;
    if (!S) return;
    const zone = CONFIG.SPEEDRUN.ZONES[S.zone];
    const txt = '⏱ ' + clock(S.t) + '   ♪ ' + zoneGot(game, zone) + '/' + S.total;
    UI.text(ctx, txt, CONFIG.WIDTH / 2, 20, S.done ? '#7be0a0' : '#fbf6ec', 7, 'center');
  }

  return { openMenu: openMenu, updateMenu: updateMenu, drawMenu: drawMenu, tick: tick, fail: fail, drawHud: drawHud, clock: clock };
})();
