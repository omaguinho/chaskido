// Informe de juego: anota cómo juega cada persona, para pulir el juego con datos.
// Anónimo: un número al azar por aparato, sin nombre, email ni ubicación.
//
// Una sesión empieza al salir de la portada hacia el juego y termina al volver a la
// portada, al cerrar o esconder la página, a los 5 minutos sin tocar nada (abandono)
// o con "Nuevo jugador". Cada sesión:
//   · se guarda en el aparato (las últimas, para descargarlas en TXT y JSON)
//   · se manda a la planilla (CONFIG.REGISTRO.URL) si "Enviar datos" está en Sí;
//     sin internet queda en cola y se manda después
//
// Casi todo se mide mirando el juego en cada paso (tick): cambios de sala, de
// corazones, de monedas, de mensajes, del jefe… Solo unas pocas cosas se avisan
// desde el juego con Registro.ev(tipo, datos): diapasón, compras, vecinos y la causa
// de cada golpe.
const Registro = (function () {
  const R = CONFIG.REGISTRO;
  const STORE = 'chaskido_registro';
  let s = null;            // sesión en curso
  let game = null;
  let prev = null;         // lo que se vio en el paso anterior (para comparar)

  // ---------- Guardado en el aparato ----------

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }

  function store(data) {
    try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) {}
  }

  function playerId(renew) {
    const d = load();
    if (!d.jugador || renew) {
      d.jugador = 'p' + Math.random().toString(36).slice(2, 10);
      store(d);
    }
    return d.jugador;
  }

  // ---------- Sesión ----------

  function begin(g) {
    game = g;
    s = {
      id: 's' + Date.now().toString(36),
      jugador: playerId(false),
      inicio: Date.now(),
      version: CONFIG.GAME_VERSION,
      modo: g.mode,
      dificultad: g.difficulty,
      idioma: I18N.get(),
      dispositivo: device(),
      controles: {},
      t: 0, quieto: 0, aire: 0, distancia: 0, sinTocar: 0, pausas: 0,
      fps: { frames: 0, t: 0 },
      salas: {},            // id -> { t, entradas, muertes, celdas, esquinas }
      jefes: {},            // tipo -> { intentos, ganado, tiempos, golpes, corazones, danio }
      c: {},                // contadores
      poderes: {},          // poder -> { usos, ganado (s), primerUso (s) }
      diapason: { usos: 0, efectivos: 0, notas: {} },
      golpes: {},           // causa -> cuántos
      muertes: [],          // { sala, x, y, causa, jefe }
      reaparece: [],        // salas donde volvió tras morir
      mensajes: { total: 0, rapidos: 0 },
      monedas: { ganadas: 0, gastadas: 0 },
      compras: {},
      vecinos: {},
      prologo: { tramos: {}, primerPisoton: null, botonesAntes: {} },
      instrumentos: [],     // segundos para atrapar cada uno
      eventos: []
    };
    prev = null;
  }

  function device() {
    const ua = navigator.userAgent || '';
    if (/Tablet|iPad|SM-T|Tab/i.test(ua)) return 'tablet';
    if (/Mobi|Android/i.test(ua)) return 'celular';
    return 'pc';
  }

  function count(key, n) { s.c[key] = (s.c[key] || 0) + (n || 1); }

  function log(tipo, datos) {
    if (s.eventos.length >= R.EVENTS_MAX) return;
    s.eventos.push(Object.assign({ t: Math.round(s.t), tipo: tipo, sala: game && game.level ? game.level.id : '' }, datos || {}));
  }

  function room(id) {
    return s.salas[id] || (s.salas[id] = { t: 0, entradas: 0, muertes: 0, celdas: {}, esquinas: {} });
  }

  function boss(type) {
    return s.jefes[type] || (s.jefes[type] = { intentos: 0, ganado: false, tiempos: [], golpes: [], corazones: [], danio: {} });
  }

  // ---------- Avisos del juego ----------

  function ev(tipo, d) {
    if (!s) return;
    d = d || {};
    if (tipo === 'golpe') {
      s.golpes[d.causa] = (s.golpes[d.causa] || 0) + 1;
      if (prev && prev.bossOn && game.boss) {
        const B = boss(prev.bossType);
        B.danio[d.causa] = (B.danio[d.causa] || 0) + 1;
      }
      game.lastHurt = d.causa;
    } else if (tipo === 'diapason') {
      s.diapason.usos++;
      s.diapason.notas[d.nota] = (s.diapason.notas[d.nota] || 0) + 1;
      if (d.efectivo) s.diapason.efectivos++;
      log('diapason', d);
    } else if (tipo === 'compra') {
      s.compras[d.id] = (s.compras[d.id] || 0) + 1;
      log('compra', d);
    } else if (tipo === 'vecino') {
      s.vecinos[d.id] = (s.vecinos[d.id] || 0) + 1;
      if (d.duro) log('vecinoDificil', d);
    } else {
      count(tipo);
      log(tipo, d);
    }
  }

  // ---------- Lo que se mide en cada paso ----------

  function tick(g, dt) {
    game = g;
    const inGame = g.state !== 'title' && g.state !== 'splash' && g.state !== 'lang' && g.state !== 'speedmenu' && g.state !== 'registro';
    if (!s) {
      if (inGame) begin(g);
      else return;
    }
    if (!inGame) { end('portada'); return; }
    s.t += dt;
    s.dt = dt;
    s.fps.frames++;
    s.fps.t += dt;
    watchInput(dt);
    if (s.sinTocar >= R.ABANDON) { end('abandono'); return; }
    if (!g.level || !g.player) return;
    if (g.state !== 'play') { compare(g, snapshot(g)); return; }   // muerte, premio, fin…
    const p = g.player, L = g.level, rs = room(L.id);
    rs.t += dt;
    // Movimiento y exploración (grilla de GRID x GRID bloques; esquinas de la sala)
    if (prev && prev.room === L.id) {
      const d = Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y);
      s.distancia += d;
      if (d < 0.5) s.quieto += dt;
    }
    if (!p.onGround) s.aire += dt;
    const G = R.GRID * CONFIG.TILE;
    const cx = Math.floor((p.x + p.w / 2) / G), cy = Math.floor((p.y + p.h / 2) / G);
    rs.celdas[cx + ',' + cy] = 1;
    const maxX = Math.floor(L.pxW / G), maxY = Math.floor(L.pxH / G);
    const side = (cx <= 0 ? 'izq' : cx >= maxX - 1 ? 'der' : '') + (cy <= 0 ? 'arriba' : cy >= maxY - 1 ? 'abajo' : '');
    if (side.length > 5) rs.esquinas[side] = 1;
    // Poderes: los eventos de la papa en este paso
    (p.events || []).forEach(function (e) {
      if (R.POWER_EVENTS.indexOf(e) < 0) return;
      const P = s.poderes[e] || (s.poderes[e] = { usos: 0 });
      P.usos++;
      if (P.ganado !== undefined && P.primerUso === undefined) P.primerUso = Math.round(s.t - P.ganado);
    });
    if (p.dancing && p.danceMove && (!prev || !prev.dance)) count('pasosBaile');
    compare(g, snapshot(g));
  }

  function watchInput(dt) {
    const any = Input.actions().some(function (a) { return Input.held(a); }) || Input.anyPressed();
    s.controles[Input.device()] = 1;
    if (any) {
      if (s.sinTocar >= R.IDLE) { s.pausas++; log('volvio', { tras: Math.round(s.sinTocar) }); }
      s.sinTocar = 0;
    } else {
      s.sinTocar += dt;
    }
    // Prólogo: qué botones distintos prueba antes del primer pisotón
    if (game.level && game.level.kind === 'prologo' && s.prologo.primerPisoton === null) {
      Input.actions().forEach(function (a) { if (Input.pressed(a)) s.prologo.botonesAntes[a] = 1; });
    }
  }

  function snapshot(g) {
    const p = g.player || {};
    return {
      state: g.state, room: g.level ? g.level.id : '', x: p.x || 0, y: p.y || 0,
      hearts: g.hearts, coins: g.progress ? g.progress.coins : 0,
      modal: g.modal || null, modalT: g.modal ? (prev && prev.modal === g.modal ? prev.modalT : s.t) : 0,
      menu: !!(g.menu && g.menu.open), mapTab: !!(g.menu && g.menu.open && g.menu.current() === 'mapa'),
      bossOn: g.arenaPhase === 'boss' || g.arenaPhase === 'guards',
      bossType: g.level && g.level.boss ? g.level.boss.type : '',
      bossHp: g.boss ? g.boss.hp : 0,
      mission: g.mission, notes: g.notes,
      checkpoint: g.progress && g.progress.checkpoint ? g.progress.checkpoint.room + ':' + g.progress.checkpoint.x : '',
      tips: g.tipsShown ? Object.keys(g.tipsShown).length : 0,
      blink: g.slotBlink || 0,
      enemies: g.enemies ? g.enemies.alive().length : 0,
      chili: g.progress ? g.progress.chili : 0,
      overlay: g.overlay ? g.overlay.kind : '',
      abilities: g.progress ? Object.keys(g.progress.abilities).filter(function (k) { return g.progress.abilities[k]; }) : [],
      settings: JSON.stringify(g.settings || {}),
      dance: !!(p.dancing && p.danceMove)
    };
  }

  // Compara con el paso anterior y anota lo que cambió
  function compare(g, now) {
    const was = prev;
    prev = now;
    if (!was) { enterRoom(now.room); return; }
    if (now.room !== was.room) enterRoom(now.room);
    if (was.state === 'gameover' && now.state === 'play') { s.reaparece.push(now.room); log('reaparece', {}); }
    if (now.coins > was.coins) s.monedas.ganadas += now.coins - was.coins;
    if (now.coins < was.coins) s.monedas.gastadas += was.coins - now.coins;
    if (now.chili < was.chili) count('aji');
    if (now.tips > was.tips) count('consejos', now.tips - was.tips);
    if (now.blink > was.blink + 0.5) count('choquesPorton');
    if (now.checkpoint && now.checkpoint !== was.checkpoint) count('banderitas');
    if (now.overlay === 'shop' && was.overlay !== 'shop') count('visitasTienda');
    if (now.menu && !was.menu) count('menu');
    if (now.mapTab) s.c.tiempoMapa = (s.c.tiempoMapa || 0) + s.dt;
    if (!now.menu && was.menu && now.settings !== was.settings) count('cambiosOpciones');
    if (now.enemies < was.enemies && now.room === was.room) {
      count('enemigosVencidos', was.enemies - now.enemies);
      if (g.level.kind === 'prologo' && s.prologo.primerPisoton === null) s.prologo.primerPisoton = Math.round(room(now.room).t);
    }
    // Mensajes que detienen el juego: cuánto tiempo los deja abiertos
    if (was.modal && !now.modal) {
      s.mensajes.total++;
      if (s.t - was.modalT < 1) s.mensajes.rapidos++;
    }
    // Poderes nuevos (para medir cuánto tarda en usarlos)
    now.abilities.forEach(function (a) {
      if (was.abilities.indexOf(a) >= 0) return;
      const key = R.POWER_OF[a] || a;
      const P = s.poderes[key] || (s.poderes[key] = { usos: 0 });
      P.ganado = Math.round(s.t);
      log('poderGanado', { poder: a });
    });
    // Instrumentos
    if (now.mission === 'collect' && was.mission !== 'collect') s.colecta = s.t;
    if (now.notes > was.notes && now.room === was.room) {
      s.instrumentos.push(Math.round(s.t - (s.colecta || s.t)));
      count('instrumentos', now.notes - was.notes);
    }
    if (now.mission === 'escape' && was.mission !== 'escape') { s.llave = s.t; log('llave', {}); }
    // Jefe
    if (now.bossOn && !was.bossOn) {
      const B = boss(now.bossType);
      B.intentos++;
      B.corazones.push(now.hearts);
      s.bossStart = s.t;
      s.bossHits = 0;
      if (s.llave) { log('llaveAlJefe', { s: Math.round(s.t - s.llave) }); s.llave = 0; }
    }
    if (now.bossOn && now.bossHp < was.bossHp) s.bossHits += was.bossHp - now.bossHp;
    if (was.bossOn && !now.bossOn) {
      const B = boss(was.bossType);
      B.tiempos.push(Math.round(s.t - s.bossStart));
      B.golpes.push(s.bossHits);
      if (g.arenaPhase === 'done') B.ganado = true;
      log(B.ganado ? 'jefeVencido' : 'jefePerdido', { jefe: was.bossType });
    }
    // Muerte
    if (now.state === 'gameover' && was.state !== 'gameover') {
      const r = room(was.room);
      r.muertes++;
      s.muertes.push({ sala: was.room, x: Math.round(was.x / CONFIG.TILE), y: Math.round(was.y / CONFIG.TILE), causa: g.lastHurt || '?', jefe: was.bossOn });
      log('muerte', { causa: g.lastHurt || '?' });
    }
  }

  function enterRoom(id) {
    if (!id) return;
    const r = room(id);
    r.entradas++;
    if (r.entradas > 1) count('vueltasAtras');
    const L = game.level;
    if (L && L.kind === 'prologo') s.prologo.tramos[id] = s.prologo.tramos[id] || Math.round(s.t);
    log('sala', {});
  }

  // ---------- Resumen y perfiles ----------

  // L: los datos de la sala en LEVELS (su mapa de letras)
  function cover(r, L) {
    const T = CONFIG.TILE, G = R.GRID * T;
    const total = Math.max(1, Math.ceil(L.map[0].length * T / G) * Math.ceil(L.map.length * T / G));
    return Object.keys(r.celdas).length / total;
  }

  function sum(o) { return Object.keys(o).reduce(function (n, k) { return n + o[k]; }, 0); }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  // Cinco perfiles con puntaje de 0 a 100 (reglas simples: se afinan con los datos)
  function profiles(m) {
    const P = R.PROFILE;
    const hrs = Math.max(m.minutos / 60, 0.05);
    const deathsH = m.muertes / hrs;
    const speed = clamp01(P.FAST_ROOM / Math.max(m.segPorSala, 1));       // salas rápidas
    const explore = clamp01(m.cobertura / P.GOOD_COVER);
    const reads = 1 - clamp01(m.mensajesRapidos);
    const bossHearts = clamp01(m.corazonesAlJefe / 3);
    const score = {
      experto: speed * 0.4 + clamp01(1 - deathsH / P.MANY_DEATHS) * 0.4 + clamp01(1 - m.pausas / 3) * 0.2,
      explorador: explore * 0.45 + clamp01(m.vecinos / 4) * 0.2 + clamp01(m.botonesPrologo / 6) * 0.15 + clamp01(m.vueltasAtras / 6) * 0.2,
      apurado: speed * 0.4 + clamp01(1 - bossHearts) * 0.3 + clamp01(m.intentosJefe / 4) * 0.3,
      principiante: clamp01(deathsH / P.MANY_DEATHS) * 0.4 + clamp01(m.pausas / 3) * 0.3 + clamp01(m.caidas / 6) * 0.3,
      enfocado: clamp01(m.mensajesRapidos) * 0.35 + clamp01(m.choquesPorton / 4) * 0.35 + (1 - explore) * 0.15 + (1 - clamp01(m.vecinos / 2)) * 0.15
    };
    Object.keys(score).forEach(function (k) { score[k] = Math.round(score[k] * 100); });
    const top = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; })[0];
    return { score: score, perfil: top, lee: Math.round(reads * 100) };
  }

  function summary(motivo) {
    const salas = Object.keys(s.salas);
    const covers = salas.map(function (id) {
      const L = LEVELS.find(function (l) { return l.id === id; });
      return L ? cover(s.salas[id], L) : 0;
    });
    const jefes = Object.keys(s.jefes);
    const allHearts = [].concat.apply([], jefes.map(function (k) { return s.jefes[k].corazones; }));
    const m = {
      minutos: +(s.t / 60).toFixed(1),
      muertes: s.muertes.length,
      caidas: (s.golpes.caida || 0) + (s.golpes.espinas || 0),
      segPorSala: salas.length ? s.t / salas.length : s.t,
      cobertura: covers.length ? covers.reduce(function (a, b) { return a + b; }, 0) / covers.length : 0,
      vecinos: Object.keys(s.vecinos).length,
      botonesPrologo: Object.keys(s.prologo.botonesAntes).length,
      vueltasAtras: s.c.vueltasAtras || 0,
      corazonesAlJefe: allHearts.length ? allHearts.reduce(function (a, b) { return a + b; }, 0) / allHearts.length : 3,
      intentosJefe: jefes.reduce(function (n, k) { return n + s.jefes[k].intentos; }, 0),
      pausas: s.pausas,
      mensajesRapidos: s.mensajes.total ? s.mensajes.rapidos / s.mensajes.total : 0,
      choquesPorton: s.c.choquesPorton || 0
    };
    const pf = profiles(m);
    const last = game && game.level ? game.level.id : '';
    return {
      sesion: s.id, jugador: s.jugador, version: s.version, fecha: new Date(s.inicio).toISOString(),
      idioma: s.idioma, dificultad: s.dificultad, modo: s.modo, dispositivo: s.dispositivo,
      control: Object.keys(s.controles).join('+'),
      fps: Math.round(s.fps.frames / Math.max(s.fps.t, 1)),
      minutos: m.minutos, fin: motivo, sala_final: last,
      jefe_al_final: !!(prev && prev.bossOn),
      salas_visitadas: salas.length,
      cobertura_pct: Math.round(m.cobertura * 100),
      esquinas: salas.reduce(function (n, id) { return n + Object.keys(s.salas[id].esquinas).length; }, 0),
      vueltas_atras: m.vueltasAtras,
      muertes: m.muertes, caidas: m.caidas,
      golpes: sum(s.golpes),
      enemigos_vencidos: s.c.enemigosVencidos || 0,
      jefes_vencidos: jefes.filter(function (k) { return s.jefes[k].ganado; }).length,
      intentos_jefe: m.intentosJefe,
      corazones_al_jefe: +m.corazonesAlJefe.toFixed(1),
      diapason_usos: s.diapason.usos, diapason_efectivos: s.diapason.efectivos,
      instrumentos: s.c.instrumentos || 0,
      seg_por_instrumento: s.instrumentos.length ? Math.round(s.instrumentos.reduce(function (a, b) { return a + b; }, 0) / s.instrumentos.length) : '',
      pasos_baile: s.c.pasosBaile || 0,
      choques_porton: m.choquesPorton,
      mensajes: s.mensajes.total, mensajes_rapidos: s.mensajes.rapidos,
      consejos: s.c.consejos || 0,
      menu: s.c.menu || 0, seg_mapa: Math.round(s.c.tiempoMapa || 0),
      cambios_opciones: s.c.cambiosOpciones || 0,
      pausas_60s: s.pausas,
      seg_quieto: Math.round(s.quieto), seg_aire: Math.round(s.aire),
      distancia_bloques: Math.round(s.distancia / CONFIG.TILE),
      monedas_ganadas: s.monedas.ganadas, monedas_gastadas: s.monedas.gastadas,
      compras: sum(s.compras), visitas_tienda: s.c.visitasTienda || 0, aji: s.c.aji || 0,
      vecinos: m.vecinos, banderitas: s.c.banderitas || 0,
      reaparece_en: s.reaparece.join(' '),
      prologo_primer_pisoton_s: s.prologo.primerPisoton === null ? '' : s.prologo.primerPisoton,
      prologo_botones_antes: m.botonesPrologo,
      perfil: pf.perfil,
      p_experto: pf.score.experto, p_explorador: pf.score.explorador, p_apurado: pf.score.apurado,
      p_principiante: pf.score.principiante, p_enfocado: pf.score.enfocado
    };
  }

  function report(motivo) {
    return {
      resumen: summary(motivo),
      salas: Object.keys(s.salas).map(function (id) {
        const r = s.salas[id];
        const L = LEVELS.find(function (l) { return l.id === id; });
        return { sala: id, seg: Math.round(r.t), entradas: r.entradas, muertes: r.muertes,
          cobertura_pct: L ? Math.round(cover(r, L) * 100) : 0, esquinas: Object.keys(r.esquinas) };
      }),
      jefes: s.jefes, poderes: s.poderes, diapason: s.diapason, golpes: s.golpes,
      muertes: s.muertes, compras: s.compras, vecinos: s.vecinos, prologo: s.prologo,
      instrumentos_seg: s.instrumentos, eventos: s.eventos
    };
  }

  // ---------- Cierre, cola y envío ----------

  function end(motivo) {
    if (!s) return;
    if (s.t < R.MIN_SESSION) { s = null; prev = null; return; }   // un toque y salió: no cuenta
    const data = report(motivo);
    const d = load();
    d.historial = (d.historial || []).concat([data]).slice(-R.KEEP);
    d.pendientes = (d.pendientes || []).concat(game && game.settings && game.settings.datos === false ? [] : [data]);
    store(d);
    s = null;
    prev = null;
    send();
  }

  // Manda lo que está en cola (sin respuesta legible: la planilla no la entrega)
  function send(closing) {
    const d = load();
    if (!R.URL || !(d.pendientes || []).length) return;
    const batch = d.pendientes.slice();
    d.pendientes = [];
    store(d);
    batch.forEach(function (data) {
      fetch(R.URL, {
        method: 'POST', mode: 'no-cors', keepalive: !!closing,
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(data)
      }).catch(function () {
        const back = load();
        back.pendientes = (back.pendientes || []).concat([data]);   // sin internet: queda en cola
        store(back);
      });
    });
  }

  // ---------- Informe legible y descarga ----------

  function text(data) {
    const r = data.resumen;
    const lines = [
      'CHASKIDO · INFORME DE JUEGO', '',
      'Sesión ' + r.sesion + ' · jugador ' + r.jugador + ' · ' + r.fecha,
      'Versión ' + r.version + ' · ' + r.dispositivo + ' · control: ' + r.control + ' · ' + r.idioma + ' · ' + r.dificultad,
      'Duración: ' + r.minutos + ' min · terminó por: ' + r.fin + ' en ' + r.sala_final + (r.jefe_al_final ? ' (peleando con un jefe)' : ''),
      '', 'PERFIL: ' + r.perfil.toUpperCase(),
      '  Experto ' + r.p_experto + ' · Explorador ' + r.p_explorador + ' · Apurado ' + r.p_apurado +
        ' · Principiante ' + r.p_principiante + ' · Enfocado ' + r.p_enfocado,
      '', 'Salas visitadas: ' + r.salas_visitadas + ' · recorrió ' + r.cobertura_pct + '% · esquinas ' + r.esquinas + ' · vueltas atrás ' + r.vueltas_atras,
      'Muertes: ' + r.muertes + ' · caídas/espinas: ' + r.caidas + ' · golpes: ' + r.golpes + ' · reapareció en: ' + (r.reaparece_en || '-'),
      'Jefes: ' + r.jefes_vencidos + ' vencidos en ' + r.intentos_jefe + ' intentos · llega con ' + r.corazones_al_jefe + ' corazones',
      'Diapasón: ' + r.diapason_usos + ' usos, ' + r.diapason_efectivos + ' útiles',
      'Instrumentos: ' + r.instrumentos + ' (' + r.seg_por_instrumento + ' s cada uno) · pasos de baile: ' + r.pasos_baile,
      'Portón cerrado: ' + r.choques_porton + ' choques · mensajes: ' + r.mensajes + ' (' + r.mensajes_rapidos + ' cerrados en <1 s)',
      'Menú: ' + r.menu + ' veces · mapa ' + r.seg_mapa + ' s · pausas largas: ' + r.pausas_60s,
      'Monedas: +' + r.monedas_ganadas + ' / -' + r.monedas_gastadas + ' · compras ' + r.compras + ' · vecinos ' + r.vecinos,
      'Prólogo: primer pisotón a los ' + (r.prologo_primer_pisoton_s === '' ? '-' : r.prologo_primer_pisoton_s + ' s') +
        ', probó ' + r.prologo_botones_antes + ' botones antes',
      '', 'POR SALA'
    ];
    data.salas.forEach(function (x) {
      lines.push('  ' + x.sala + ': ' + x.seg + ' s, ' + x.entradas + ' entradas, ' + x.muertes + ' muertes, ' + x.cobertura_pct + '% recorrido');
    });
    lines.push('', 'POR JEFE');
    Object.keys(data.jefes).forEach(function (k) {
      const B = data.jefes[k];
      lines.push('  ' + k + ': ' + B.intentos + ' intentos' + (B.ganado ? ' (vencido)' : '') + ', golpes dados ' + B.golpes.join('/') +
        ', le duele: ' + JSON.stringify(B.danio));
    });
    return lines.join('\n');
  }

  function download() {
    if (s) end('descarga');
    const d = load();
    const list = d.historial || [];
    if (!list.length) return false;
    const txt = list.map(text).join('\n\n----------------------------------------\n\n');
    const json = JSON.stringify(list, null, 1);
    const blob = new Blob([txt + '\n\n==== DATOS (JSON) ====\n' + json], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chaskido_informe_' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }

  // Prueba de conexión: manda una fila corta a la planilla, sin esperar una partida
  function test() {
    if (!R.URL) return Promise.resolve('Falta la dirección de la planilla (CONFIG.REGISTRO.URL).');
    const data = { resumen: { sesion: 'prueba', jugador: playerId(false), version: CONFIG.GAME_VERSION,
      fecha: new Date().toISOString(), fin: 'prueba de conexión', dispositivo: device() } };
    return fetch(R.URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(data) })
      .then(function () { return 'Prueba enviada: en unos segundos debe aparecer una fila "prueba".'; })
      .catch(function () { return 'No se pudo enviar: sin internet o la dirección está mal.'; });
  }

  // "Nuevo jugador" (expo): cierra la sesión y la siguiente cuenta como otra persona
  function newPlayer() {
    end('nuevo jugador');
    playerId(true);
  }

  function last() {
    const d = load();
    const list = d.historial || [];
    return { total: list.length, pendientes: (d.pendientes || []).length, ultima: list.length ? list[list.length - 1].resumen : null };
  }

  // Al cerrar o esconder la página: se cierra la sesión y se intenta mandar
  window.addEventListener('pagehide', function () { end('cerró'); send(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { end('cerró'); send(true); }
  });
  window.addEventListener('online', function () { send(); });

  return { tick: tick, ev: ev, end: end, send: send, test: test, download: download, newPlayer: newPlayer, last: last, text: text };
})();
