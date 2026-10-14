// Funciones pequeñas que usan varios archivos

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
// si uno falla, pregunta al servidor si el archivo existe: si existe (o no se sabe),
// lo vuelve a pedir hasta TRIES veces; si no existe (404), se rinde enseguida.
const Loader = (function () {
  const AT_ONCE = 6;
  const TRIES = 4;
  const local = typeof location !== 'undefined' && location.protocol === 'file:';   // abierto con doble clic: no hace falta reintentar
  const queue = [];
  let active = 0;

  function withRetry(src, n) {
    return n ? src + (src.indexOf('?') < 0 ? '?' : '&') + 'r=' + n : src;
  }

  // ¿Existe el archivo? (true, false, o null si no se puede saber)
  function exists(src) {
    if (local || !window.fetch) return Promise.resolve(null);
    const ctrl = window.AbortController ? new AbortController() : null;
    return fetch(src, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined }).then(function (r) {
      if (ctrl) ctrl.abort();   // solo importaba la respuesta, no el contenido
      return r.status === 404 ? false : r.ok ? true : null;
    }).catch(function () { return null; });
  }

  // Decide si vale la pena otro intento (llama a again() o a giveUp(existe))
  function afterError(src, n, again, giveUp) {
    if (local || n + 1 >= TRIES) {
      giveUp(null);
      return;
    }
    exists(src).then(function (found) {
      if (found === false) giveUp(false);
      else setTimeout(again, 300 * (n + 1));
    });
  }

  function next() {
    while (active < AT_ONCE && queue.length) {
      active++;
      tryImage(queue.shift(), 0);
    }
  }

  function tryImage(job, n) {
    const img = new Image();
    img.onload = function () {
      active--;
      job.ok(img);
      next();
    };
    img.onerror = function () {
      afterError(job.src, n, function () { tryImage(job, n + 1); }, function (found) {
        active--;
        job.fail(found);
        next();
      });
    };
    img.src = withRetry(job.src, n);
  }

  return {
    withRetry: withRetry,
    afterError: afterError,
    // Imagen: ok(img) o fail(existe). first: pasa adelante en la fila (lo que se ve ya)
    image: function (src, ok, fail, first) {
      const job = { src: src, ok: ok, fail: fail || function () {} };
      if (first) queue.unshift(job);
      else queue.push(job);
      next();
    }
  };
})();
