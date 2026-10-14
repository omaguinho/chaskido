// Une teclado, mouse y joystick en acciones: left, right, up, down, jump, dash,
// action, run (correr), item (ají para llevar), confirm (aceptar en menús) y pause.
// "run" usa el mismo botón que "action" (E / Cuadrado): un toque abre puertas,
// mantenerlo mientras te mueves es correr.
// También hace vibrar el mando (si el navegador y el mando lo permiten).
const Input = (function () {
  const KEYS = {
    left:   ['ArrowLeft', 'KeyA'],
    right:  ['ArrowRight', 'KeyD'],
    jump:   ['Space', 'ArrowUp', 'KeyW', 'KeyZ'],
    dash:   ['ShiftLeft', 'ShiftRight', 'KeyX'],
    action: ['KeyE', 'Enter'],
    run:    ['KeyE', 'KeyC'],
    pause:  ['Escape', 'KeyP'],
    up:     ['ArrowUp', 'KeyW'],
    down:   ['ArrowDown', 'KeyS'],
    item:   ['KeyQ'],
    confirm: ['Space', 'Enter', 'KeyE']
  };
  // Mando estándar: 0 X/A, 1 círculo/B, 2 cuadrado/X, 5 R1/RB, 7 R2/RT,
  // 9 Options/Start, 12 a 15 cruceta arriba, abajo, izquierda y derecha
  const PAD_BUTTONS = {
    left:   [14],
    right:  [15],
    jump:   [0],
    dash:   [1, 5, 7],
    action: [2],
    run:    [2],
    pause:  [9],
    up:     [12],
    down:   [13],
    item:   [4],
    confirm: [0, 2]
  };
  // Mouse: 0 clic izquierdo, 2 clic derecho
  const MOUSE = {
    jump: [0],
    dash: [2]
  };
  const DEADZONE = 0.25;
  const STICK_PRESS = 0.6;   // stick inclinado como si fuera la cruceta (menús)
  const ACTIONS = Object.keys(KEYS);

  const keys = {};
  const mouse = {};
  const prevDown = {};
  const state = {};
  let axisX = 0;
  let pads = [];

  // Toques y teclas nuevas entre un paso y el siguiente
  let pendingKeys = [];
  let pendingTap = false;
  let pendingPoint = null;      // dónde fue el último toque, en píxeles del juego
  let stepPoint = null;
  let stepKeys = [];
  let stepTap = false;
  let stepPointer = false;      // toque de pantalla o clic en este paso
  let prevPadAny = false;

  ACTIONS.forEach(function (a) {
    prevDown[a] = false;
    state[a] = { down: false, pressed: false, released: false };
  });

  window.addEventListener('keydown', function (e) {
    keys[e.code] = true;
    if (!e.repeat) pendingKeys.push(e.code);
    if (e.code === 'Space' || e.code.indexOf('Arrow') === 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) {
    keys[e.code] = false;
  });
  window.addEventListener('mousedown', function (e) {
    mouse[e.button] = true;
  });
  window.addEventListener('mouseup', function (e) {
    mouse[e.button] = false;
  });
  window.addEventListener('pointerdown', function (e) {
    pendingTap = true;
    const canvas = document.getElementById('game');
    const r = canvas ? canvas.getBoundingClientRect() : null;
    pendingPoint = r && r.width > 0
      ? { x: (e.clientX - r.left) / r.width * CONFIG.WIDTH, y: (e.clientY - r.top) / r.height * CONFIG.HEIGHT }
      : null;
  });
  window.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });
  // Al perder el foco se sueltan todas las teclas
  window.addEventListener('blur', function () {
    Object.keys(keys).forEach(function (k) { keys[k] = false; });
    Object.keys(mouse).forEach(function (b) { mouse[b] = false; });
  });

  // Android puede mostrar un mismo mando como varios: se leen todos
  function readGamepads() {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    const found = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i] && list[i].connected) found.push(list[i]);
    }
    return found;
  }

  function padButton(pad, index) {
    const b = pad.buttons[index];
    return !!b && (b.pressed || b.value > 0.5);
  }

  function anyPadButton(indexes) {
    return pads.some(function (pad) {
      return indexes.some(function (i) { return padButton(pad, i); });
    });
  }

  function anyPadDown() {
    return pads.some(function (pad) {
      return pad.buttons.some(function (b) { return b.pressed; });
    });
  }

  // Usa el stick que más se esté moviendo (axis 0 horizontal, 1 vertical)
  function rawStick(axis) {
    let best = 0;
    pads.forEach(function (pad) {
      if (pad.axes.length > axis && Math.abs(pad.axes[axis]) > Math.abs(best)) {
        best = pad.axes[axis];
      }
    });
    return best;
  }

  // El stick inclinado a fondo cuenta como cruceta
  function stickAsButton(a) {
    if (a === 'left') return rawStick(0) < -STICK_PRESS;
    if (a === 'right') return rawStick(0) > STICK_PRESS;
    if (a === 'up') return rawStick(1) < -STICK_PRESS;
    if (a === 'down') return rawStick(1) > STICK_PRESS;
    return false;
  }

  function applyDeadzone(raw) {
    if (Math.abs(raw) < DEADZONE) return 0;
    return Math.sign(raw) * (Math.abs(raw) - DEADZONE) / (1 - DEADZONE);
  }

  // Se llama una vez por paso de física
  function update() {
    pads = readGamepads();

    ACTIONS.forEach(function (a) {
      let down = KEYS[a].some(function (c) { return keys[c]; });
      if (!down && MOUSE[a]) {
        down = MOUSE[a].some(function (b) { return mouse[b]; });
      }
      if (!down) down = anyPadButton(PAD_BUTTONS[a]);
      if (!down) down = stickAsButton(a);

      state[a].down = down;
      state[a].pressed = down && !prevDown[a];
      state[a].released = !down && prevDown[a];
      prevDown[a] = down;
    });

    // Stick analógico si se mueve; si no, teclado o cruceta
    const stick = applyDeadzone(rawStick(0));
    const digital = (state.right.down ? 1 : 0) - (state.left.down ? 1 : 0);
    axisX = stick !== 0 ? stick : digital;

    stepKeys = pendingKeys;
    pendingKeys = [];
    const padAny = anyPadDown();
    stepTap = pendingTap || stepKeys.length > 0 || (padAny && !prevPadAny);
    stepPointer = pendingTap;
    stepPoint = pendingTap ? pendingPoint : null;
    pendingTap = false;
    prevPadAny = padAny;
  }

  // Vibración: ms de duración y fuerza (0 a 1) de cada motor.
  // Solo si está encendida en la pausa (en algunas tablets hace caer el visor)
  let rumbleOn = false;
  function rumble(ms, strong, weak) {
    if (!rumbleOn) return;
    pads.forEach(function (pad) {
      const motor = pad.vibrationActuator;
      if (!motor || !motor.playEffect) return;
      try {
        const p = motor.playEffect('dual-rumble', {
          duration: ms, strongMagnitude: strong, weakMagnitude: weak
        });
        if (p && p.catch) p.catch(function () {});
      } catch (e) {
        // el mando no vibra: se ignora
      }
    });
  }

  return {
    update: update,
    rumble: rumble,
    setRumble: function (on) { rumbleOn = !!on; },
    held: function (a) { return state[a].down; },
    pressed: function (a) { return state[a].pressed; },
    released: function (a) { return state[a].released; },
    axisX: function () { return axisX; },
    // Cualquier toque, tecla o botón nuevo (pantallas de inicio y fin)
    anyPressed: function () { return stepTap; },
    // Solo un toque de pantalla o clic (para aceptar en la pantalla de inicio)
    tapped: function () { return stepPointer; },
    // Punto del toque de este paso ({ x, y } en píxeles del juego) o null
    tapPoint: function () { return stepPoint; },
    // Tecla concreta pulsada en este paso (modo prueba)
    keyPressed: function (code) { return stepKeys.indexOf(code) >= 0; }
  };
})();
