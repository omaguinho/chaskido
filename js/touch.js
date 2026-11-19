// Controles táctiles: aparecen solos la primera vez que se toca la pantalla (no con
// teclado ni mando) y se pueden apagar o prender en la pausa (Opciones: "Táctil").
//   · Izquierda: palanca virtual. Donde apoyas el dedo aparece la base; al arrastrar,
//     la papa camina (más inclinada, más rápido). Arriba y abajo: hablar, puertas, bajar.
//   · Derecha: botones redondos A (saltar), B (dash), E (acción / correr) y ♪ (diapasón).
//   · Arriba a la derecha: II (pausa).
const Touch = (function () {
  const STICK = { R: 46, DEAD: 0.18, WALK: 0.45, UP: 0.6 };   // radio (px) y umbrales
  // Botones de la derecha: acción, texto, posición (px desde la esquina abajo derecha)
  const BUTTONS = [
    { a: 'jump',   label: 'A', r: 22,  b: 30,  big: true, also: ['confirm'] },
    { a: 'dash',   label: 'B', r: 96,  b: 16 },
    { a: 'action', label: 'E', r: 92,  b: 86, also: ['run'] },
    { a: 'tuner',  label: '♪', r: 30,  b: 112 },
    { a: 'pause',  label: 'II', top: true }
  ];
  let root = null;
  let enabled = null;          // null: todavía no se sabe (se prende con el primer toque)
  let stick = null;            // { id, x, y } dedo que mueve la palanca
  let base = null, knob = null;

  function press(b, on) {
    Input.setVirtual(b.a, on);
    (b.also || []).forEach(function (a) { Input.setVirtual(a, on); });
  }

  // ---------- Palanca ----------

  function setStick(dx, dy) {
    const len = Math.hypot(dx, dy);
    const k = len > STICK.R ? STICK.R / len : 1;
    knob.style.transform = 'translate(' + Math.round(dx * k) + 'px,' + Math.round(dy * k) + 'px)';
    const x = dx * k / STICK.R;
    const y = dy * k / STICK.R;
    const ax = Math.abs(x) < STICK.DEAD ? 0 : Math.sign(x) * Math.min(1, (Math.abs(x) - STICK.DEAD) / (1 - STICK.DEAD) * 1.25);
    Input.setVirtualAxis(ax);
    Input.setVirtual('left', x < -STICK.WALK);
    Input.setVirtual('right', x > STICK.WALK);
    Input.setVirtual('up', y < -STICK.UP);
    Input.setVirtual('down', y > STICK.UP);
  }

  function releaseStick() {
    stick = null;
    base.classList.remove('on');
    knob.style.transform = '';
    Input.setVirtualAxis(0);
    ['left', 'right', 'up', 'down'].forEach(function (a) { Input.setVirtual(a, false); });
  }

  function buildStick() {
    const zone = document.createElement('div');
    zone.id = 'tzone';
    base = document.createElement('div');
    base.id = 'tbase';
    knob = document.createElement('div');
    knob.id = 'tknob';
    base.appendChild(knob);
    zone.appendChild(base);
    zone.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (stick) return;
      stick = { id: e.pointerId, x: e.clientX, y: e.clientY };
      try { zone.setPointerCapture(e.pointerId); } catch (err) {}
      const r = zone.getBoundingClientRect();
      base.style.left = (e.clientX - r.left - 48) + 'px';     // la base mide 96 px
      base.style.top = (e.clientY - r.top - 48) + 'px';
      base.style.bottom = 'auto';
      base.classList.add('on');
      setStick(0, 0);
    });
    zone.addEventListener('pointermove', function (e) {
      if (!stick || e.pointerId !== stick.id) return;
      e.preventDefault();
      setStick(e.clientX - stick.x, e.clientY - stick.y);
    });
    const end = function (e) {
      if (!stick || e.pointerId !== stick.id) return;
      releaseStick();
      base.style.left = ''; base.style.top = ''; base.style.bottom = '';   // vuelve a su lugar
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    root.appendChild(zone);
  }

  // ---------- Botones ----------

  function buildButtons() {
    BUTTONS.forEach(function (b) {
      const el = document.createElement('div');
      el.className = 'tbtn' + (b.top ? ' tbtn-top' : '') + (b.big ? ' tbtn-big' : '');
      el.textContent = b.label;
      if (!b.top) {
        el.style.right = b.r + 'px';
        el.style.bottom = b.b + 'px';
      }
      const down = function (e) { e.preventDefault(); e.stopPropagation(); el.classList.add('on'); press(b, true); };
      const up = function (e) { e.preventDefault(); e.stopPropagation(); el.classList.remove('on'); press(b, false); };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
      root.appendChild(el);
    });
  }

  function build() {
    root = document.createElement('div');
    root.id = 'touch';
    buildStick();
    buildButtons();
    document.body.appendChild(root);
  }

  function show(on) {
    enabled = on;
    if (on && !root) build();
    if (root) root.style.display = on ? 'block' : 'none';
    if (!on && stick) releaseStick();
    document.body.classList.toggle('touch-on', !!on);   // el botón ⛶ se corre arriba
    try { localStorage.setItem('chaskido_touch', on ? '1' : '0'); } catch (e) {}
  }

  function init() {
    let saved = null;
    try { saved = localStorage.getItem('chaskido_touch'); } catch (e) {}
    if (saved === '1') show(true);
    else if (saved === '0') enabled = false;
    // Se prende solo con el primer toque real en la pantalla
    window.addEventListener('touchstart', function () {
      if (enabled === null) show(true);
    }, { passive: true, once: true });
  }

  // En juego la palanca toma toda la mitad izquierda; en menús, solo la esquina
  let free = null;
  function setFree(on) {
    if (!root || on === free) return;
    free = on;
    root.classList.toggle('menus', !on);
  }

  return {
    init: init,
    setFree: setFree,
    toggle: function () { show(!enabled); return enabled; },
    isOn: function () { return !!enabled; }
  };
})();
