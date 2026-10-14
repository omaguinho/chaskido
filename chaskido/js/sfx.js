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
    walls: function () {
      noise({ dur: 0.5, vol: 0.4, freq: 300, to: 80 });
      tone({ freq: 90, to: 45, dur: 0.5, vol: 0.3, type: 'sawtooth' });
    },
    appear: function () { noise({ dur: 0.35, vol: 0.3, freq: 200, to: 2000, type: 'bandpass' }); },
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
    move: function () { tone({ freq: 900, dur: 0.04, vol: 0.08 }); },
    select: function () { notes([G5, C6], 0.05, { vol: 0.12 }); },
    pause: function () { notes([C6, G5], 0.06, { vol: 0.1, type: 'triangle' }); }
  };

  return {
    play: function (name) {
      if (!ac || muted || ac.state !== 'running' || !SOUNDS[name]) return;
      SOUNDS[name]();
    },
    setMuted: function (value) { muted = value; },
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
