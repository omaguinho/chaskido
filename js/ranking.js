// Récords mundiales (LootLocker): los tiempos del Speedrun y del Coliseo de los jefes.
// Cada jugador entra como invitado (sin cuenta); su identificador queda guardado en el
// aparato. Sin internet todo sigue igual: solo no aparecen los récords mundiales.
// Tablas en LootLocker: speedrun_z1 … speedrun_z7 y coliseo (Player, Ascending).
// El puntaje es el tiempo en milésimas; el nombre va en "metadata".
const Ranking = (function () {
  const R = CONFIG.RANKING;
  let token = null;
  let starting = null;               // promesa de la sesión (se pide una sola vez)
  const lists = {};                  // tabla -> { at, items, failed }

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {}
    return null;
  }

  function request(method, path, body) {
    return fetch(R.API + path, {
      method: method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'x-session-token': token } : {}),
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  // Sesión de invitado (reutiliza el mismo jugador en este aparato)
  function session() {
    if (token) return Promise.resolve(token);
    if (starting) return starting;
    const body = { game_key: R.KEY, game_version: R.VERSION };
    const id = store('chaskido_ll_id');
    if (id) body.player_identifier = id;
    starting = request('POST', '/game/v2/session/guest', body).then(function (r) {
      token = r.session_token;
      if (r.player_identifier) store('chaskido_ll_id', r.player_identifier);
      return token;
    }).catch(function () { starting = null; return null; });
    return starting;
  }

  // ---------- Nombre del jugador (se elige una vez; se cambia en el menú del speedrun) ----------

  function name() { return store('chaskido_name') || ''; }
  function setName(n) { store('chaskido_name', n); }

  // ---------- Enviar y leer ----------

  function submit(board, seconds) {
    const ms = Math.round(seconds * 1000);
    return session().then(function (t) {
      if (!t) return null;
      return request('POST', '/game/leaderboards/' + board + '/submit',
        { score: ms, metadata: name() || 'Papa' });
    }).then(function (r) {
      delete lists[board];           // que se vuelva a pedir la lista con el tiempo nuevo
      return r;
    }).catch(function () { return null; });
  }

  // Lista de los mejores (se pide como mucho cada REFRESH s). Devuelve lo que haya ya:
  //   null = cargando; [] = vacía o sin internet; [{ rank, name, time }]
  function top(board) {
    const L = lists[board];
    const now = performance.now();
    if (L && (L.loading || now - L.at < R.REFRESH * 1000)) return L.items;
    const entry = lists[board] = { at: now, items: L ? L.items : null, loading: true };
    session().then(function (t) {
      if (!t) throw new Error('sin sesión');
      return request('GET', '/game/leaderboards/' + board + '/list?count=' + R.COUNT);
    }).then(function (r) {
      entry.items = (r.items || []).map(function (it) {
        return {
          rank: it.rank,
          name: String(it.metadata || (it.player && it.player.name) || 'Papa').slice(0, R.NAME_MAX),
          time: it.score / 1000
        };
      });
    }).catch(function () {
      if (!entry.items) entry.items = [];
      entry.failed = true;
    }).then(function () { entry.loading = false; entry.at = performance.now(); });
    return entry.items;
  }

  function failed(board) { return !!(lists[board] && lists[board].failed); }

  return { name: name, setName: setName, submit: submit, top: top, failed: failed };
})();
