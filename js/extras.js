// Ajustes que se aplican sobre levels.js SIN editarlo (así tu levels.js queda
// tal cual lo tienes y lo puedes seguir cambiando con el editor):
//   - LEVEL_ROUTE: el orden del recorrido de puertas D. Cada nivel se llama
//     "Nivel N" según su lugar en esta lista.
//   - LEVEL_EXTRAS: por nivel (por su id), la puerta E y cubos extra.
//       extraDoor: { to: 'j1', needs: 'doubleJump' } cambia a dónde lleva la E;
//                  null la deja con candado ("se abrirá más adelante").
//       cubes: [[x, y], ...] columnas y filas del mapa donde poner un cubo "c"
//              (los 2 últimos de cada nivel piden poderes que llegan más adelante).
//              Si esa celda no está vacía en tu mapa, ese cubo no se pone
//              (y se avisa en la consola del navegador).
//       place: [[x, y, 'letra'], ...] pone esa letra del editor en esa celda, aunque
//              haya otra cosa (por ejemplo una puerta R o mover una puerta).
// Los niveles que no están en la lista (jefes secretos, torre, prueba) quedan después.
const LEVEL_ROUTE = ['n2', 'n5', 'n3', 'n1', 'n4', 'n6'];

const LEVEL_EXTRAS = {
  // Nivel 1 (antes 2): la E lleva al Charanguero y pide el doble salto.
  // place: la E baja una fila (en (46,1) quedaba en el aire y no se podía entrar)
  n2: {
    extraDoor: { to: 'j1', needs: 'doubleJump' },
    place: [[46, 1, '.'], [46, 2, 'E']],
    cubes: [[35, 17], [57, 37], [71, 24], [51, 19], [70, 37], [26, 13], [33, 26], [39, 13], [44, 37], [6, 13]]
  },
  // Nivel 2 (antes 5): la E lleva a la Huaca y pide el dash en el aire
  n5: {
    extraDoor: { to: 'j2', needs: 'airDash' },
    cubes: [[64, 14], [43, 5], [23, 27], [58, 5], [64, 26], [72, 18], [32, 31], [19, 41], [76, 12], [50, 9]]
  },
  // Nivel 3: la E lleva al Cuy gigante y pide el salto en la pared
  n3: {
    extraDoor: { to: 'j3', needs: 'wallJump' },
    cubes: [[60, 37], [71, 29], [4, 37], [78, 23], [50, 35], [52, 16], [24, 33], [20, 18], [28, 1], [1, 23]]
  },
  // Nivel 4 (antes 1): su E queda para un jefe futuro.
  // Sin cubos extra: ya tiene los 14 que pusiste tú en el mapa.
  // place: puerta R (vuelta al nivel 3) junto al inicio, que no tenía
  n1: {
    extraDoor: null,
    place: [[1, 9, 'R']],
    cubes: []
  },
  // Nivel 5 (antes 4)
  n4: {
    extraDoor: null,
    cubes: [[36, 35], [48, 33], [70, 27], [55, 39], [30, 41], [43, 37], [57, 32], [76, 29], [1, 9], [13, 4]]
  },
  // Nivel 6
  n6: {
    cubes: [[65, 35], [7, 14], [58, 27], [66, 27], [11, 9], [14, 30], [19, 7], [59, 13], [108, 20], [81, 35]]
  }
};

(function applyLevelExtras() {
  // Puertas E y cubos
  Object.keys(LEVEL_EXTRAS).forEach(function (id) {
    const data = LEVELS.find(function (l) { return l.id === id; });
    if (!data) return;
    const extra = LEVEL_EXTRAS[id];
    if (extra.extraDoor !== undefined) data.extraDoor = extra.extraDoor;
    (extra.place || []).forEach(function (c) {
      const row = data.map[c[1]];
      if (row) data.map[c[1]] = row.slice(0, c[0]) + c[2] + row.slice(c[0] + 1);
    });
    (extra.cubes || []).forEach(function (c) {
      const row = data.map[c[1]];
      if (!row || row[c[0]] !== '.') {
        console.warn('Cubo extra no puesto en ' + id + ' (' + c[0] + ', ' + c[1] + '): la celda no está vacía');
        return;
      }
      data.map[c[1]] = row.slice(0, c[0]) + 'c' + row.slice(c[0] + 1);
    });
  });

  // Orden del recorrido y nombres "Nivel N"
  const route = [];
  LEVEL_ROUTE.forEach(function (id, i) {
    const data = LEVELS.find(function (l) { return l.id === id; });
    if (!data) return;
    data.name = 'Nivel ' + (i + 1);
    route.push(data);
  });
  const rest = LEVELS.filter(function (l) { return route.indexOf(l) < 0; });
  LEVELS.length = 0;
  route.concat(rest).forEach(function (l) { LEVELS.push(l); });
})();
