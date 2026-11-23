// Funciones pequeñas que usan varios archivos

// Letra del juego en un tamaño pensado en px del juego (ver CONFIG.FONT)
function gameFont(size) {
  return CONFIG.FONT_WEIGHT + ' ' + Math.round(size * CONFIG.FONT_SCALE * 10) / 10 + 'px ' + CONFIG.FONT;
}

// ¿Se juega en un celular o tablet? (pantalla táctil sin mouse fino)
function isMobile() {
  const ua = navigator.userAgent || '';
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  return /Mobi|Android|iPad|Tablet|SM-T/i.test(ua) || (coarse && navigator.maxTouchPoints > 0);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(v, max));
}

// ¿Se tocan dos rectángulos (x, y, w, h)?
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Segundos como m:ss
function formatTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

// ---------- Carga de archivos con reintentos ----------
// El servidor de la vista previa de Acode a veces no entrega archivos grandes
// (fondos, música) cuando se piden muchos a la vez. Loader los pide de a pocos y,
// si uno falla, lo vuelve a pedir (tries veces en total). No se puede saber si un
// archivo falta o si el servidor falló, así que se reintenta igual, con una pausa.
// Una imagen que no contesta en IMAGE_TIME segundos cuenta como fallida.
const Loader = (function () {
  const AT_ONCE = 8;
  const IMAGE_TIME = 15;
  const local = typeof location !== 'undefined' && location.protocol === 'file:';   // con doble clic no hace falta
  const queue = [];
  let active = 0;

  function withRetry(src, n) {
    return n ? src + (src.indexOf('?') < 0 ? '?' : '&') + 'r=' + n : src;
  }

  // Después de un error: again() si quedan intentos, si no giveUp()
  function afterError(n, tries, again, giveUp) {
    if (local || n + 1 >= tries) giveUp();
    else setTimeout(again, 300 * (n + 1));
  }

  function next() {
    while (active < AT_ONCE && queue.length) {
      active++;
      tryImage(queue.shift(), 0);
    }
  }

  function tryImage(job, n) {
    const img = new Image();
    let settled = false;
    const timer = setTimeout(function () { failed(); }, IMAGE_TIME * 1000);
    function failed() {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      img.onload = img.onerror = null;
      afterError(n, job.tries, function () { tryImage(job, n + 1); }, function () {
        active--;
        job.fail();
        next();
      });
    }
    img.onload = function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      active--;
      job.ok(img);
      next();
    };
    img.onerror = failed;
    img.src = withRetry(job.src, n);
  }

  return {
    withRetry: withRetry,
    afterError: afterError,
    // Imagen: ok(img) o fail(). tries: intentos en total. first: pasa adelante en la fila
    image: function (src, ok, fail, tries, first) {
      const job = { src: src, ok: ok, fail: fail || function () {}, tries: tries || 2 };
      if (first) queue.unshift(job);
      else queue.push(job);
      next();
    }
  };
})();
