// Sonido que guía (generado por código, sin archivos) y cercanía de la música:
//   - Corcheas: al empezar el nivel no suena música. Con la misión activada (puerta D),
//     la música del nivel se oye según la distancia a la corchea más cercana: lejos
//     no suena, y cuanto más cerca, más fuerte (nearLevel; el juego se lo pasa a Music).
//     Con la llave la música suena entera, como siempre.
//   - Jefes: cerca de una puerta E con un jefe secreto sin vencer, o de la arena de un
//     jefe, suena un acorde grave y largo de Do menor con sexta (Do, Mi bemol, Sol, La),
//     con la misma regla de distancia.
// El volumen sigue los tramos de CONFIG.ECHO.TIERS (distancia en bloques) y el acorde
// se corre a la izquierda o a la derecha según dónde está el jefe.
// Con la tecla 7 se ven las áreas de sonido (drawAreas): rojo lejos, amarillo medio,
// verde cerca.
const Echoes = (function () {
  let drone = null;      // { gain, pan, lfo } del acorde de los jefes, mientras existe

  // Volumen (0 a 1) según la distancia en bloques. tiers: [[distancia, volumen], ...]
  // de lo más cerca a lo más lejos; base: volumen si está más lejos que todos
  function level(dist, tiers, base) {
    const list = tiers || CONFIG.ECHO.TIERS;
    for (let i = 0; i < list.length; i++) {
      if (dist <= list[i][0]) return list[i][1];
    }
    return base || 0;
  }

  function distance(p, target) {
    const T = CONFIG.TILE;
    const dx = (target.x + target.w / 2) - (p.x + p.w / 2);
    const dy = (target.y + target.h / 2) - (p.y + p.h / 2);
    return { tiles: Math.sqrt(dx * dx + dy * dy) / T, pan: Math.max(-1, Math.min(1, dx / (8 * T))) };
  }

  // Lo más cercano de una lista de objetivos { x, y, w, h }
  function nearest(p, list) {
    let best = null;
    list.forEach(function (t) {
      const d = distance(p, t);
      if (!best || d.tiles < best.tiles) best = d;
    });
    return best;
  }

  // ---------- Acorde de los jefes ----------

  // Cuatro notas graves que respiran despacio, con un filtro que las suaviza
  function startDrone(o) {
    const E = CONFIG.ECHO;
    const gain = o.ac.createGain();
    gain.gain.value = 0;
    const pan = o.ac.createStereoPanner ? o.ac.createStereoPanner() : null;
    const filter = o.ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = E.DRONE_FILTER;
    // Respiración: el volumen sube y baja lento
    const breath = o.ac.createGain();
    breath.gain.value = 0.75;
    const lfo = o.ac.createOscillator();
    const lfoDepth = o.ac.createGain();
    lfo.frequency.value = E.DRONE_BREATH;
    lfoDepth.gain.value = 0.25;
    lfo.connect(lfoDepth);
    lfoDepth.connect(breath.gain);
    lfo.start();

    const oscs = E.DRONE_FREQS.map(function (freq, i) {
      const osc = o.ac.createOscillator();
      osc.type = i % 2 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (i - 1.5) * 4;   // un poco desafinadas: suena más grande
      osc.connect(filter);
      osc.start();
      return osc;
    });
    filter.connect(breath);
    breath.connect(gain);
    if (pan) {
      gain.connect(pan);
      pan.connect(o.out);
    } else {
      gain.connect(o.out);
    }
    drone = { gain: gain, pan: pan, lfo: lfo, oscs: oscs, ac: o.ac };
  }

  function setDrone(vol, pan) {
    const o = Sfx.output();
    if (!drone && (!o || vol <= 0)) return;
    if (!drone) startDrone(o);
    const t = drone.ac.currentTime;
    const goal = o ? vol * CONFIG.ECHO.DRONE_VOLUME : 0;
    drone.gain.gain.setTargetAtTime(goal, t, 0.4);
    if (drone.pan) drone.pan.pan.setTargetAtTime(pan || 0, t, 0.3);
  }

  // ---------- Cada paso del juego ----------

  // Volumen de la música según lo más cercano de la lista (corcheas o la llave)
  function nearLevel(player, targets, tiers, base) {
    const n = nearest(player, targets);
    return n ? level(n.tiles, tiers, base) : (base || 0);
  }

  // Acorde de los jefes: suena mientras haya alguno cerca (bosses: rectángulos { x, y, w, h })
  function update(player, bosses) {
    const b = nearest(player, bosses);
    setDrone(b ? level(b.tiles) : 0, b ? b.pan : 0);
  }

  // Áreas de sonido alrededor de cada fuente (modo prueba, tecla 7), en el mundo
  function drawAreas(ctx, sources) {
    const T = CONFIG.TILE;
    const A = CONFIG.ECHO.AREAS;
    sources.forEach(function (s) {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      A.forEach(function (ring) {
        ctx.globalAlpha = ring.alpha;
        ctx.fillStyle = ring.color;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.radius * T, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.globalAlpha = 1;
  }

  // Apaga todo (pausa, pantallas de inicio y fin, pelea con el jefe)
  function silence() {
    if (drone) setDrone(0, 0);
  }

  return { update: update, nearLevel: nearLevel, drawAreas: drawAreas, silence: silence, level: level };
})();
