// Controles táctiles: aparecen solos la primera vez que se toca la pantalla (no con
// teclado ni mando) y se pueden apagar o prender en la pausa (Opciones: "Táctil").
// Cada botón es un elemento HTML encima del juego que aprieta una acción de Input.
const Touch = (function () {
  // Botones: acción, texto y lado (izquierda: cruceta; derecha: acciones)
  const BUTTONS = [
    { a: 'left',  label: '◀', side: 'l', x: 0,  y: 1 },
    { a: 'right', label: '▶', side: 'l', x: 2,  y: 1 },
    { a: 'up',    label: '▲', side: 'l', x: 1,  y: 0 },
    { a: 'down',  label: '▼', side: 'l', x: 1,  y: 2 },
    { a: 'jump',  label: 'A', side: 'r', x: 2,  y: 1 },
    { a: 'dash',  label: 'B', side: 'r', x: 1,  y: 2 },
    { a: 'action', label: 'E', side: 'r', x: 1, y: 0, also: ['run', 'confirm'] },
    { a: 'tuner', label: '♪', side: 'r', x: 0,  y: 1 },
    { a: 'pause', label: 'II', side: 'top' }
  ];
  let root = null;
  let enabled = null;          // null: todavía no se sabe (se prende con el primer toque)

  function press(b, on) {
    Input.setVirtual(b.a, on);
    (b.also || []).forEach(function (a) { Input.setVirtual(a, on); });
  }

  function build() {
    root = document.createElement('div');
    root.id = 'touch';
    BUTTONS.forEach(function (b) {
      const el = document.createElement('div');
      el.className = 'tbtn tbtn-' + b.side;
      el.textContent = b.label;
      if (b.side !== 'top') {
        el.style.left = b.side === 'l' ? (12 + b.x * 54) + 'px' : '';
        el.style.right = b.side === 'r' ? (12 + (2 - b.x) * 54) + 'px' : '';
        el.style.bottom = (12 + (2 - b.y) * 54) + 'px';
      }
      const down = function (e) { e.preventDefault(); e.stopPropagation(); el.classList.add('on'); press(b, true); };
      const up = function (e) { e.preventDefault(); e.stopPropagation(); el.classList.remove('on'); press(b, false); };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
      root.appendChild(el);
    });
    document.body.appendChild(root);
  }

  function show(on) {
    enabled = on;
    if (on && !root) build();
    if (root) root.style.display = on ? 'block' : 'none';
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

  return {
    init: init,
    toggle: function () { show(!enabled); return enabled; },
    isOn: function () { return !!enabled; }
  };
})();
