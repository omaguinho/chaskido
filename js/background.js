// Fondo con parallax hecho con CSS (css/style.css).
// Hay 3 capas (lejos, medio, cerca) detrás del lienzo; el juego solo avisa
// el tema del nivel y la cámara, y el CSS mueve cada capa a su velocidad.
// Si existe assets/bg/fg_<tema>.png, va además una capa de primer plano
// DELANTE del lienzo (siluetas oscuras que pasan más rápido que la cámara).
// Los molinos de viento del tema "sea" son elementos que se crean aquí
// (giran con una animación CSS) y se corren de lado con la cámara.
const Backdrop = (function () {
  const stage = document.getElementById('stage');
  const TURBINE_GAP = 90;      // px del juego entre molinos
  const TURBINE_SPEED = 0.15;  // se mueven al 15 % de la cámara
  let theme = '';
  let scale = 1;
  let lastX = null;
  let lastY = null;

  // Fila de molinos (suficientes para cubrir la pantalla y uno de sobra)
  const turbines = document.createElement('div');
  turbines.className = 'turbines';
  const count = Math.ceil(CONFIG.WIDTH / TURBINE_GAP) + 2;
  for (let i = 0; i < count; i++) {
    const t = document.createElement('div');
    t.className = 'turbine';
    t.appendChild(document.createElement('div')).className = 'rotor';
    turbines.appendChild(t);
  }
  stage.insertBefore(turbines, document.getElementById('game'));

  // Primer plano (delante del lienzo): solo se ve si el tema tiene fg_<tema>.png
  const FRONT_SPEED = 1.15;
  const front = document.createElement('div');
  front.className = 'bg fg';
  stage.appendChild(front);

  // Fondos dibujados (PNG en assets/bg/: bg_<tema>_far.png, _mid.png y _near.png,
  // de 1280×720 y que se repiten de lado). Si están, reemplazan al fondo de CSS.
  // El coliseo (tema tower) usa bg_coliseo_*; las salitas, un solo fondo opaco
  // (bg_salita_tienda.png, bg_salita_bonus.png) en la capa de lejos
  const THEMES = ['city', 'cityday', 'sea', 'bamboo', 'cave', 'tech', 'mine', 'linde', 'bosque', 'pantano', 'dorada', 'templo', 'nieve', 'hielo', 'tormenta', 'orilla', 'lago', 'espejo', 'niebla', 'tower'];
  const FILES = { tower: 'coliseo' };
  const SINGLE = ['salita_tienda', 'salita_descanso', 'salita_bonus'];
  const LAYERS = { far: 0.1, mid: 0.3, near: 0.6 };   // velocidad de cada capa
  const found = {};     // 'city_far' -> ruta del archivo que sí cargó
  const asked = {};     // temas ya pedidos
  const gaveUp = {};    // capa -> veces que falló del todo (si no existe, se deja de pedir)
  // Cada tema se pide al entrar a una sala que lo usa (con reintentos: ver Loader
  // en js/util.js). Si llega cuando el tema ya está puesto, se aplica en ese momento.
  function preload(key, srcs) {
    let i = 0;
    function attempt() {
      if (typeof Loader === 'undefined') {   // util.js viejo: sin reintentos
        const img = new Image();
        img.onload = function () {
          found[key] = srcs[i];
          if (key.indexOf(theme + '_') === 0) applyImages();
        };
        img.onerror = function () { i++; if (i < srcs.length) attempt(); };
        img.src = srcs[i];
        return;
      }
      Loader.image(srcs[i], function () {
        found[key] = srcs[i];
        if (key.indexOf(theme + '_') === 0) applyImages();
      }, function () {
        i++;
        if (i < srcs.length) attempt();
        else gaveUp[key] = (gaveUp[key] || 0) + 1;
      }, 6, true);
    }
    attempt();
  }
  // Si un fondo no llegó (el servidor de Acode a veces falla), al volver a la sala se pide
  // otra vez (como mucho cada 5 segundos)
  function requestTheme(t) {
    const now = performance.now();
    const missing = ['far', 'mid', 'near'].some(function (l) {
      return !found[t + '_' + l] && (gaveUp[t + '_' + l] || 0) < 3;
    });
    if (asked[t] && (!missing || now - asked[t] < 5000)) return;
    asked[t] = now;
    if (SINGLE.indexOf(t) >= 0) {
      preload(t + '_far', ['assets/bg/bg_' + t + '.png']);
      return;
    }
    if (THEMES.indexOf(t) < 0) return;
    Object.keys(LAYERS).forEach(function (layer) {
      if (found[t + '_' + layer]) return;
      const names = [FILES[t], t].filter(Boolean);
      preload(t + '_' + layer, names.map(function (n) { return 'assets/bg/bg_' + n + '_' + layer + '.png'; }));
    });
    if (!found[t + '_fg'] && (gaveUp[t + '_fg'] || 0) < 3) preload(t + '_fg', ['assets/bg/fg_' + (FILES[t] || t) + '.png']);
  }
  // Hélice dibujada para los molinos (si está)
  const rotorImg = new Image();
  rotorImg.onload = function () {
    Array.prototype.forEach.call(turbines.querySelectorAll('.rotor'), function (r) {
      r.style.background = 'url(assets/sprites/molino_rotor.png) center / contain no-repeat';
    });
  };
  rotorImg.src = 'assets/sprites/molino_rotor.png';

  // Pone (o quita) las imágenes del tema actual en las 3 capas
  function applyImages() {
    Object.keys(LAYERS).forEach(function (layer) {
      const el = stage.querySelector('.bg.' + layer);
      const src = found[theme + '_' + layer];
      if (!src) {
        el.removeAttribute('style');
        return;
      }
      const speed = LAYERS[layer];
      el.style.backgroundImage = 'url(' + src + ')';
      el.style.backgroundColor = 'transparent';
      el.style.backgroundSize = 'calc(320px * var(--s)) calc(180px * var(--s))';
      el.style.backgroundRepeat = 'repeat-x';
      el.style.backgroundPosition = 'calc(var(--x) * var(--s) * -' + speed + 'px) 0';
      el.style.webkitMaskImage = 'none';
      el.style.maskImage = 'none';
      el.style.opacity = '1';
    });
    const src = found[theme + '_fg'];
    if (!src) {
      front.removeAttribute('style');
      return;
    }
    front.style.display = 'block';
    front.style.backgroundImage = 'url(' + src + ')';
    front.style.backgroundSize = 'calc(320px * var(--s)) calc(180px * var(--s))';
    front.style.backgroundRepeat = 'repeat-x';
    front.style.backgroundPosition = 'calc(var(--x) * var(--s) * -' + FRONT_SPEED + 'px) 0';
  }

  function placeTurbines() {
    Array.prototype.forEach.call(turbines.children, function (t, i) {
      t.style.left = (i * TURBINE_GAP + 30) * scale + 'px';
    });
  }

  // Tamaño en pantalla y escala entera (la usa el CSS para los patrones)
  function resize(w, h, s) {
    scale = s;
    stage.style.width = w + 'px';
    stage.style.height = h + 'px';
    stage.style.setProperty('--s', s);
    placeTurbines();
    lastX = null;
  }

  // Tema: 'city', 'cityday', 'sea', 'bamboo', 'cave', 'tech', 'mine', 'tower',
  // 'salita_tienda', 'salita_bonus' o 'none' (pantallas de inicio y fin)
  function set(name) {
    if (name === theme) {
      requestTheme(name);
      return;
    }
    theme = name;
    Array.prototype.slice.call(stage.classList).forEach(function (c) {
      if (c.indexOf('theme-') === 0) stage.classList.remove(c);
    });
    stage.classList.add('theme-' + name);
    requestTheme(name);
    applyImages();
  }

  // Sala sin afinar: los colores se ven apagados hasta llevar la llave al tótem
  function setMuted(on) {
    stage.classList.toggle('muted', !!on);
  }

  // Posición de la cámara en píxeles del juego (solo se actualiza si cambia)
  function scroll(x, y) {
    // Si alguna capa del tema no llegó (servidor de Acode lento), se vuelve a pedir
    // sola cada 5 segundos mientras se juega en esa sala
    if (theme && theme !== 'none') requestTheme(theme);
    const rx = Math.round(x);
    const ry = Math.round(y);
    if (rx === lastX && ry === lastY) return;
    lastX = rx;
    lastY = ry;
    stage.style.setProperty('--x', rx);
    stage.style.setProperty('--y', ry);
    const shift = (rx * TURBINE_SPEED) % TURBINE_GAP;
    turbines.style.transform = 'translateX(' + (-shift * scale) + 'px)';
  }

  return { resize: resize, set: set, scroll: scroll, setMuted: setMuted };
})();
