// Efectos de sonido generados por código (sin archivos), con Web Audio.
// Cada sonido es una receta corta de tonos y ruido. M silencia todo.
const Sfx = (function () {
  let ac = null;              // contexto de audio (se crea en el primer toque)
  let master = null;
  let muted = false;
  let volume = 0.5;           // de 0 a 1 (lo fija el menú de pausa)

  // Android exige un toque o tecla real para activar el audio
  function unlock() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = volume;
      master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
  }
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchend', unlock);

  // ---------- Piezas básicas ----------

  // Envolvente: sube rápido a vol y se apaga hasta el final
  function envelope(gain, start, dur, vol, attack) {
    const a = attack || 0.005;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(vol, start + a);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  }

  // Un tono: o = { freq, to, type, delay, dur, vol, attack, pan, filter }
  function tone(o) {
    const t = ac.currentTime + (o.delay || 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
    envelope(gain, t, o.dur, o.vol || 0.2, o.attack);

    let node = osc;
    if (o.filter) {
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(o.filter, t);
      node.connect(f);
      node = f;
    }
    node.connect(gain);
    connectOut(gain, o.pan);
    osc.start(t);
    osc.stop(t + o.dur + 0.02);
  }

  // Ruido filtrado (golpes, polvo, viento): o = { delay, dur, vol, freq, to, type }
  function noise(o) {
    const t = ac.currentTime + (o.delay || 0);
    const len = Math.ceil(ac.sampleRate * o.dur);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buffer;
    const f = ac.createBiquadFilter();
    f.type = o.type || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 1200, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
    const gain = ac.createGain();
    envelope(gain, t, o.dur, o.vol || 0.3, o.attack);
    src.connect(f);
    f.connect(gain);
    connectOut(gain, o.pan);
    src.start(t);
  }

  // Salida, con paneo izquierda/derecha si el navegador lo permite
  function connectOut(node, pan) {
    if (pan && ac.createStereoPanner) {
      const p = ac.createStereoPanner();
      p.pan.value = pan;
      node.connect(p);
      p.connect(master);
    } else {
      node.connect(master);
    }
  }

  // Varias notas seguidas: notas en Hz, cada una "step" segundos
  function notes(list, step, o) {
    list.forEach(function (freq, i) {
      tone({ freq: freq, type: o.type, delay: (o.delay || 0) + i * step,
             dur: o.dur || step * 1.6, vol: o.vol || 0.15 });
    });
  }

  // ---------- Arpegio del cubo ----------

  // 1-5-7-3 de un acorde mayor 7 repetido rápido: se acerca (sube el volumen,
  // se abre el filtro y el tono queda un poco más agudo), suena fuerte en el
  // medio y se aleja (baja, se cierra y queda un poco más grave), de izquierda a derecha
  function cubeArpeggio() {
    const A = CONFIG.SFX.CUBE_ARP;
    const total = A.NOTES.length * A.REPEAT;
    const step = A.TIME / total;
    for (let i = 0; i < total; i++) {
      const k = (i + 0.5) / total;              // 0 al empezar, 1 al terminar
      const near = Math.sin(Math.PI * k);       // 0 lejos, 1 cerca
      const doppler = 1 + A.DOPPLER * Math.cos(Math.PI * k);
      tone({
        freq: A.NOTES[i % A.NOTES.length] * doppler,
        type: 'square',
        delay: i * step,
        dur: step * 1.8,
        vol: 0.04 + A.PEAK * near,
        filter: 900 + 5000 * near,
        pan: (k * 2 - 1) * 0.6
      });
    }
  }

  // ---------- Arpegio del maíz ----------

  // 1-3-5-7 de Re mayor 7, subiendo rápido; la última nota queda sonando un poco
  function maizeArpeggio() {
    const A = CONFIG.SFX.MAIZE_ARP;
    const step = A.TIME / A.NOTES.length;
    A.NOTES.forEach(function (freq, i) {
      const last = i === A.NOTES.length - 1;
      tone({ freq: freq, type: 'triangle', delay: i * step,
             dur: last ? step * 4 : step * 1.6, vol: A.VOL });
    });
  }

  // Golpe de diapasón: nota pura f con cola larga (dur segundos)
  function fork(f, dur) {
    noise({ dur: 0.035, vol: 0.12, freq: 3200, type: 'bandpass' });
    tone({ freq: f, dur: dur, vol: 0.22, type: 'sine', attack: 0.003 });
    tone({ freq: f * 1.0015, dur: dur * 0.9, vol: 0.1, type: 'sine', attack: 0.003 });
    tone({ freq: f * 6.27, dur: 0.18, vol: 0.035, type: 'sine', attack: 0.002 });
    tone({ freq: f * 2, dur: dur * 0.35, vol: 0.03, type: 'sine', attack: 0.004 });
  }

  // ---------- Recetas ----------

  const C5 = 523.25, E5 = 659.25, G5 = 783.99, B5 = 987.77, C6 = 1046.5;

  const SOUNDS = {
    cube: cubeArpeggio,
    jump: function () { tone({ freq: 260, to: 520, dur: 0.12, vol: 0.12 }); },
    doubleJump: function () { tone({ freq: 400, to: 900, dur: 0.14, vol: 0.12, type: 'triangle' }); },
    wallJump: function () {
      noise({ dur: 0.06, vol: 0.2, freq: 2500 });
      tone({ freq: 330, to: 660, dur: 0.1, vol: 0.1 });
    },
    land: function () { noise({ dur: 0.06, vol: 0.12, freq: 600, to: 200 }); },
    dash: function () { noise({ dur: 0.18, vol: 0.25, freq: 3000, to: 400, type: 'bandpass' }); },
    drum: function () {
      tone({ freq: 140, to: 50, dur: 0.3, vol: 0.5, type: 'sine' });
      noise({ dur: 0.08, vol: 0.2, freq: 900 });
    },
    stomp: function () {
      tone({ freq: 500, to: 120, dur: 0.12, vol: 0.2 });
      noise({ dur: 0.1, vol: 0.2, freq: 1500, to: 300 });
    },
    alert: function () { notes([E5 * 2, B5 * 2], 0.06, { vol: 0.1 }); },
    hurt: function () { tone({ freq: 400, to: 90, dur: 0.35, vol: 0.2, type: 'sawtooth' }); },
    lifeUp: function () { notes([C5, E5, G5, C6, E5 * 2, G5 * 2], 0.06, { vol: 0.12, type: 'triangle' }); },
    maize: maizeArpeggio,
    note: function () { notes([G5, C6], 0.07, { vol: 0.14, type: 'triangle' }); },
    key: function () { notes([C6, E5 * 2, G5 * 2, C6 * 2], 0.05, { vol: 0.12 }); },
    door: function () { notes([C5, G5], 0.1, { vol: 0.14, type: 'triangle' }); },
    clear: function () { notes([C5, E5, G5, B5, C6, B5, C6], 0.09, { vol: 0.14, dur: 0.2 }); },
    chili: function () {
      noise({ dur: 0.3, vol: 0.25, freq: 400, to: 4000, type: 'bandpass' });
      tone({ freq: 200, to: 800, dur: 0.3, vol: 0.12, type: 'sawtooth' });
    },
    save: function () { notes([G5, C6, G5 * 2], 0.08, { vol: 0.1, type: 'triangle' }); },
    tick: function () { tone({ freq: 1800, dur: 0.05, vol: 0.1, type: 'square' }); },
    // Diapasón: La 440 (corto) y Si 493,9 (largo), como una horquilla de metal
    // Diapasón de verdad: un golpecito metálico y una nota pura que dura y se apaga
    // lenta, con un batido suave (dos senos casi iguales) y el armónico alto del metal
    tuneLa: function () { fork(440, 2.2); },
    tuneSi: function () { fork(493.88, 2.6); tone({ freq: 246.94, dur: 1.6, vol: 0.05, type: 'sine', attack: 0.05 }); },
    // Mientras se mantiene el botón: un zumbido que sube hacia el Si
    tuneCharge: function () { tone({ freq: 440, to: 493.88, dur: 0.45, vol: 0.04, type: 'sine', attack: 0.1 }); },
    // El muro resuena con su nota y se deshace
    tuneOpen: function () {
      notes([660, 880, 1320], 0.07, { vol: 0.08, type: 'triangle', delay: 0.12, dur: 0.4 });
      noise({ delay: 0.15, dur: 0.5, vol: 0.2, freq: 900, to: 200 });
    },
    // Nota equivocada: un "tink" seco
    tuneWrong: function () {
      tone({ freq: 220, to: 200, dur: 0.12, vol: 0.12, type: 'square', delay: 0.08, filter: 900 });
    },
    walls: function () {
      noise({ dur: 0.5, vol: 0.4, freq: 300, to: 80 });
      tone({ freq: 90, to: 45, dur: 0.5, vol: 0.3, type: 'sawtooth' });
    },
    appear: function () { noise({ dur: 0.35, vol: 0.3, freq: 200, to: 2000, type: 'bandpass' }); },
    // Chapuzón: agua que salpica (zona 6)
    splash: function () {
      noise({ dur: 0.3, vol: 0.3, freq: 1800, to: 400, type: 'bandpass' });
      tone({ freq: 300, to: 120, dur: 0.15, vol: 0.12, type: 'sine' });
    },
    bossLand: function () {
      tone({ freq: 110, to: 40, dur: 0.4, vol: 0.6, type: 'sine' });
      noise({ dur: 0.15, vol: 0.3, freq: 700, to: 150 });
    },
    bossHit: function () {
      tone({ freq: 220, to: 70, dur: 0.25, vol: 0.4, type: 'square' });
      noise({ dur: 0.2, vol: 0.3, freq: 3000, to: 500 });
    },
    roar: function () {
      tone({ freq: 160, to: 60, dur: 1.4, vol: 0.4, type: 'sawtooth', attack: 0.08, filter: 900 });
      tone({ freq: 240, to: 90, dur: 1.2, vol: 0.25, type: 'square', attack: 0.1, filter: 1200 });
      noise({ dur: 1.4, vol: 0.35, freq: 500, to: 150, attack: 0.1 });
    },
    bossWon: function () { notes([C5, E5, G5, C6, G5, C6, E5 * 2, G5 * 2], 0.1, { vol: 0.14, dur: 0.25 }); },
    hook: function () {
      noise({ dur: 0.12, vol: 0.2, freq: 1500, to: 5000, type: 'bandpass' });
      tone({ freq: 600, to: 1400, dur: 0.1, vol: 0.06, type: 'triangle' });
    },
    hookCatch: function () { tone({ freq: 1600, dur: 0.05, vol: 0.1, type: 'square' }); },
    ability: function () {
      notes([C5, G5, C6, E5 * 2, G5 * 2, C6 * 2], 0.08, { vol: 0.13, type: 'triangle', dur: 0.3 });
      notes([C5 / 2, G5 / 2], 0.24, { vol: 0.1, type: 'square', dur: 0.4 });
    },
    gate: function () {
      noise({ dur: 0.8, vol: 0.3, freq: 250, to: 900 });
      tone({ freq: 70, to: 140, dur: 0.8, vol: 0.25, type: 'sawtooth', filter: 600 });
    },
    final: function () {
      notes([C5, E5, G5, C6, E5 * 2, G5 * 2, C6 * 2], 0.12, { vol: 0.13, type: 'triangle', dur: 0.4 });
      notes([G5, B5, C6 * 2], 0.36, { vol: 0.1, delay: 0.9, dur: 0.6 });
    },
    geyser: function () {
      noise({ dur: 0.9, vol: 0.25, freq: 600, to: 3000, type: 'bandpass', attack: 0.05 });
      tone({ freq: 90, to: 160, dur: 0.4, vol: 0.2, type: 'sine' });
    },
    // ---------- Zapateo ----------
    stompStart: function () { tone({ freq: 700, to: 200, dur: 0.12, vol: 0.1, type: 'triangle' }); },
    stompLand: function () {
      tone({ freq: 120, to: 40, dur: 0.35, vol: 0.5, type: 'sine' });
      noise({ dur: 0.25, vol: 0.35, freq: 900, to: 120 });
    },
    // ---------- Presentación de jefes y prólogo ----------
    bossIntro: function () {
      // Golpe grave + subida de ruido + platillo
      tone({ freq: 70, to: 35, dur: 0.9, vol: 0.6, type: 'sine' });
      tone({ freq: 140, to: 55, dur: 0.5, vol: 0.3, type: 'sawtooth', filter: 700 });
      noise({ dur: 0.9, vol: 0.25, freq: 300, to: 6000, type: 'bandpass', attack: 0.6 });
      noise({ dur: 1.2, vol: 0.18, freq: 8000, to: 3000, type: 'highpass', delay: 0.9 });
      notes([C5 / 2, G5 / 2, C5], 0.12, { vol: 0.12, type: 'square', delay: 0.95, dur: 0.5 });
    },
    bossPhase: function () {
      tone({ freq: 90, to: 30, dur: 0.8, vol: 0.5, type: 'sawtooth', filter: 600 });
      noise({ dur: 0.7, vol: 0.35, freq: 4000, to: 200 });
      notes([B5, G5, E5, C5], 0.05, { vol: 0.1, type: 'square' });
    },
    bossBurst: function () {
      noise({ dur: 1.2, vol: 0.45, freq: 2500, to: 60 });
      tone({ freq: 60, to: 25, dur: 1.4, vol: 0.6, type: 'sine' });
      notes([C5, E5, G5, B5, C6, E5 * 2, G5 * 2, B5 * 2, C6 * 2], 0.06, { vol: 0.1, type: 'triangle', delay: 0.25, dur: 0.5 });
    },
    // El Silencio llega: un zumbido grave que se traga todo
    silencio: function () {
      tone({ freq: 55, to: 30, dur: 4.5, vol: 0.5, type: 'sine', attack: 1.2 });
      tone({ freq: 110, to: 52, dur: 4, vol: 0.18, type: 'sawtooth', attack: 1.5, filter: 300 });
      noise({ dur: 4, vol: 0.2, freq: 120, to: 60, attack: 1.5 });
    },
    collapse: function () {
      noise({ dur: 1.6, vol: 0.55, freq: 500, to: 60 });
      tone({ freq: 80, to: 30, dur: 1.5, vol: 0.5, type: 'sawtooth', filter: 400 });
    },
    // Viento de la gran caída
    wind: function () {
      noise({ dur: 3, vol: 0.12, freq: 400, to: 900, type: 'bandpass', attack: 1 });
    },
    // Acorde del título (Do mayor 9)
    titleChord: function () {
      [C5 / 2, G5 / 2, E5, B5, 587.33 * 2].forEach(function (f, i) {
        tone({ freq: f, dur: 3.2, vol: 0.07, type: i % 2 ? 'triangle' : 'sine', attack: 0.25 + i * 0.12, delay: i * 0.12 });
      });
    },
    move: function () { tone({ freq: 900, dur: 0.04, vol: 0.08 }); },
    select: function () { notes([G5, C6], 0.05, { vol: 0.12 }); },
    pause: function () { notes([C6, G5], 0.06, { vol: 0.1, type: 'triangle' }); }
  };

  // Despertar el audio si el navegador lo frenó (pantalla apagada, pestaña escondida o
  // mucho rato sin tocar): se llama al volver a la página y cada tanto desde el juego
  function wake() {
    if (ac && ac.state !== 'running' && ac.state !== 'closed') ac.resume().catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });
  window.addEventListener('focus', wake);
  window.addEventListener('pageshow', wake);

  return {
    wake: wake,
    play: function (name) {
      if (!ac || muted || ac.state !== 'running' || !SOUNDS[name]) return;
      SOUNDS[name]();
    },
    setMuted: function (value) { muted = value; },
    // Diapasón: golpe de una nota (frecuencia en Hz) y el escalón suave del anillo al mantener
    tune: function (f) {
      if (!ac || muted || ac.state !== 'running') return;
      fork(f, f < 480 ? 2.2 : 1.8);
    },
    tunerStep: function (f) {
      if (!ac || muted || ac.state !== 'running') return;
      tone({ freq: f, dur: 0.18, vol: 0.05, type: 'sine', attack: 0.02 });
    },
    // Nota i de una escala pentatónica de Do (sube con cada nota atrapada)
    scaleNote: function (i) {
      if (!ac || muted || ac.state !== 'running') return;
      const PENTA = [0, 2, 4, 7, 9];
      const semis = PENTA[i % 5] + 12 * Math.floor(i / 5);
      const f = C5 * Math.pow(2, semis / 12);
      tone({ freq: f, dur: 0.35, vol: 0.12, type: 'triangle' });
      tone({ freq: f * 2, dur: 0.2, vol: 0.04, type: 'sine', delay: 0.02 });
    },
    // Para los sonidos que guían (js/echoes.js): el contexto y la salida de efectos,
    // o null si el audio todavía no está activo o está en silencio
    output: function () {
      if (!ac || muted || ac.state !== 'running') return null;
      return { ac: ac, out: master };
    },
    setVolume: function (v) {
      volume = Math.max(0, Math.min(1, v));
      if (master) master.gain.value = volume;
    }
  };
})();
