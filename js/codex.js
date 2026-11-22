// Códex: quiénes viven en la ciudad de las papas (CONFIG.CODEX).
//   · papas: se anotan al hablarles (vecinos, guardianes, vendedores, la vecina de la fiesta)
//   · jefes: al vencerlos
//   · animales: cuando venciste o calmaste a TODOS los de esa especie del juego
// Se guarda en la partida (progress.codex) y se ve en la pausa desde que tienes la quena.
// Cada entrada nueva avisa con una notificación corta que no detiene el juego.
const Codex = (function () {
  const C = CONFIG.CODEX;
  let totals = null;          // especie -> cuántos hay en todo el juego
  let toast = null;           // { text, t }

  function data(game) {
    const P = game.progress;
    const d = P.codex || (P.codex = {});
    d.papas = d.papas || {};
    d.jefes = d.jefes || {};
    d.animales = d.animales || {};    // especie -> { 'sala:índice': 1 }
    d.especies = d.especies || {};    // especie completa -> 1
    return d;
  }

  // Cuántos animales de cada especie hay en todos los mapas (se cuenta una vez)
  function speciesTotals() {
    if (totals) return totals;
    totals = {};
    LEVELS.forEach(function (raw) {
      let L;
      try { L = new Level(raw); } catch (e) { return; }
      L.enemySpawns.forEach(function (s) {
        if (C.SPECIES[s.type]) totals[s.type] = (totals[s.type] || 0) + 1;
      });
    });
    return totals;
  }

  function notify(text) {
    toast = { text: text, t: C.TOAST };
    Sfx.play('key');
  }

  // ---------- Lo que se anota ----------

  function papa(game, id, name) {
    if (!name) return;
    const d = data(game);
    if (d.papas[id]) return;
    d.papas[id] = name;
    notify(name);
  }

  function boss(game, type) {
    if (!C.BOSS_TEXT[type]) return;
    const d = data(game);
    if (d.jefes[type]) return;
    d.jefes[type] = 1;
    notify(bossName(type));
  }

  // Un animal vencido o calmado (cada uno cuenta una vez: sala + lugar en el mapa)
  function animal(game, e) {
    const S = C.SPECIES[e.type];
    if (!S || e.spawnIndex === undefined) return;
    const d = data(game);
    const got = d.animales[e.type] || (d.animales[e.type] = {});
    const key = game.level.id + ':' + e.spawnIndex;
    if (got[key]) return;
    got[key] = 1;
    const total = speciesTotals()[e.type] || 0;
    if (!d.especies[e.type] && Object.keys(got).length >= total) {
      d.especies[e.type] = 1;
      notify(S.name);
    }
  }

  function bossName(type) {
    const B = CONFIG.BOSSES[type];
    const n = tr((B && B.NAME) || type);
    return n.charAt(0) + n.slice(1).toLowerCase();
  }

  // ---------- Avance ----------

  // Cuántas entradas hay y cuántas tiene la partida
  function progress(game) {
    const d = data(game);
    const species = Object.keys(speciesTotals());
    const papas = papaList().length;
    const jefes = Object.keys(C.BOSS_TEXT).length;
    return {
      got: Object.keys(d.papas).length + Object.keys(d.jefes).length + Object.keys(d.especies).length,
      total: papas + jefes + species.length
    };
  }

  // Todas las papas con nombre del juego (id -> nombre)
  function papaList() {
    const list = [];
    (CONFIG.VECINOS || []).forEach(function (v) { if (v.name) list.push({ id: v.id, name: v.name }); });
    Object.keys(C.GUARD_NAMES).forEach(function (r) { list.push({ id: 'guardia_' + r, name: C.GUARD_NAMES[r] }); });
    Object.keys(C.VENDOR_NAMES).forEach(function (k) { list.push({ id: 'vendedor_' + k, name: C.VENDOR_NAMES[k] }); });
    list.push({ id: 'fiesta', name: C.FIESTA_NAME });
    return list;
  }

  // Porcentaje de completado: salas afinadas, poderes, jefes y Códex (CONFIG.CODEX.COMPLETION)
  function completion(game) {
    const W = C.COMPLETION, P = game.progress;
    const rooms = LEVELS.filter(function (l) { return game.isMissionRoom(l); });
    const tuned = rooms.filter(function (l) { return P.rooms[l.id] && P.rooms[l.id].afinada; }).length;
    const powers = CATALOGO.PODERES.filter(function (p) { return p.id !== 'run'; });
    const have = powers.filter(function (p) { return P.abilities[p.id]; }).length;
    const bosses = LEVELS.filter(function (l) { return l.boss; });
    const beaten = bosses.filter(function (l) { return P.rooms[l.id] && P.rooms[l.id].boss; }).length;
    const cx = progress(game);
    const pct = W.ROOMS * tuned / Math.max(1, rooms.length) + W.POWERS * have / Math.max(1, powers.length) +
      W.BOSSES * beaten / Math.max(1, bosses.length) + W.CODEX * cx.got / Math.max(1, cx.total);
    return Math.floor(pct);
  }

  // ---------- Aviso ----------

  function update(dt) {
    if (toast && (toast.t -= dt) <= 0) toast = null;
  }

  // "📖 Códex: Cuy Gigante" que entra por la derecha y se va solo
  function drawToast(ctx) {
    if (!toast) return;
    const k = Math.min(1, (C.TOAST - toast.t) / 0.25, toast.t / 0.25);
    const label = '📖 ' + tr('Códex') + ': ' + tr(toast.text);
    ctx.font = gameFont(6);
    const w = Math.ceil(ctx.measureText(label).width) + 12;
    const x = Math.round(CONFIG.WIDTH - (w + 6) * k);
    const y = 30;
    ctx.fillStyle = 'rgba(20, 11, 43, 0.85)';
    ctx.fillRect(x, y, w, 12);
    ctx.fillStyle = '#9fe3c8';
    ctx.fillRect(x, y, 2, 12);
    UI.text(ctx, label, x + 7, y + 3, '#fbf6ec', 6);
  }

  // ---------- Pestaña de la pausa ----------
  // Lista de lo anotado; lo que falta sale como "???"

  function entries(game) {
    const d = data(game), T = speciesTotals(), out = [];
    papaList().forEach(function (p) {
      out.push({ group: 'Papas', name: d.papas[p.id] ? p.name : '???', text: '' });
    });
    Object.keys(C.BOSS_TEXT).forEach(function (b) {
      const ok = !!d.jefes[b];
      out.push({ group: 'Jefes', name: ok ? bossName(b) : '???', text: ok ? C.BOSS_TEXT[b] : '' });
    });
    Object.keys(T).forEach(function (s) {
      const ok = !!d.especies[s], got = Object.keys(d.animales[s] || {}).length;
      out.push({ group: 'Animales', name: ok ? C.SPECIES[s].name : '???', text: ok ? C.SPECIES[s].text : '', count: got + '/' + T[s] });
    });
    return out;
  }

  return {
    papa: papa, boss: boss, animal: animal, progress: progress, completion: completion,
    entries: entries, update: update, drawToast: drawToast, bossName: bossName
  };
})();
