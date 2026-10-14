// El mundo de Chaskido: dónde va cada sala en el mapa del menú de pausa,
// cómo se nombra ("Zona 1 · Sala 2") y qué abre cada llave y cada poder.
// Los nombres, las regiones, los poderes, las llaves y los jefes salen del
// catálogo (js/catalogo.js); aquí solo va lo que el catálogo no tiene.
const WORLD = (function () {
  const C = CATALOGO;

  // Cada sala en el mapa, medida en pantallas (20 x 11 bloques), como en el
  // mapa del proyecto (versión 5). num: el número que se ve.
  const ROOMS = [
    { id: 'n2', num: '1', r: 1, x: 18, y: 12, w: 4, h: 4 },
    { id: 'n5', num: '2', r: 1, x: 18, y: 16, w: 4, h: 4 },
    { id: 'n3', num: '3', r: 1, x: 12, y: 12, w: 6, h: 4 },
    { id: 'j1', num: 'S1', r: 1, x: 19, y: 10, w: 2, h: 2 },
    { id: 'j2', num: 'S2', r: 1, x: 22, y: 17, w: 2, h: 2 },
    { id: 'n1', num: '4', r: 2, x: 22, y: 11, w: 4, h: 4 },
    { id: 'n4', num: '5', r: 2, x: 26, y: 8, w: 3, h: 6 },
    { id: 'n6', num: '6', r: 2, x: 29, y: 11, w: 4, h: 4 },
    { id: 's3', num: 'S3', r: 2, x: 26, y: 14, w: 2, h: 2 },
    { id: 's4', num: 'S4', r: 2, x: 33, y: 12, w: 2, h: 2 },
    { id: 'n7', num: '7', r: 3, x: 19, y: 20, w: 3, h: 5 },
    { id: 'n8', num: '8', r: 3, x: 22, y: 21, w: 7, h: 2 },
    { id: 'n9', num: '9', r: 3, x: 29, y: 20, w: 4, h: 4 },
    { id: 's5', num: 'S5', r: 3, x: 17, y: 22, w: 2, h: 2 },
    { id: 'n10', num: '10', r: 4, x: 33, y: 18, w: 4, h: 4 },
    { id: 'n11', num: '11', r: 4, x: 37, y: 16, w: 6, h: 3 },
    { id: 'n12', num: '12', r: 4, x: 38, y: 8, w: 4, h: 8 },
    { id: 's6', num: 'S6', r: 4, x: 43, y: 16, w: 2, h: 2 },
    { id: 'n13', num: '13', r: 5, x: 36, y: 4, w: 4, h: 4 },
    { id: 'n14', num: '14', r: 5, x: 31, y: 4, w: 5, h: 3 },
    { id: 'n15', num: '15', r: 5, x: 27, y: 1, w: 4, h: 5 },
    { id: 's7', num: 'S7', r: 5, x: 38, y: 2, w: 2, h: 2 },
    { id: 'n16', num: '16', r: 6, x: 5, y: 12, w: 7, h: 3 },
    { id: 'n17', num: '17', r: 6, x: 3, y: 15, w: 5, h: 4 },
    { id: 'n18', num: '18', r: 6, x: 6, y: 19, w: 5, h: 4 },
    { id: 's8', num: 'S8', r: 6, x: 3, y: 21, w: 3, h: 3 },
    { id: 'n19', num: '19', r: 7, x: 7, y: 8, w: 4, h: 4 },
    { id: 'n20', num: '20', r: 7, x: 11, y: 5, w: 5, h: 4 },
    { id: 'n21', num: '21', r: 7, x: 16, y: 2, w: 4, h: 5 },
    { id: 's9', num: 'S9', r: 7, x: 12, y: 3, w: 2, h: 2 },
    { id: 's10', num: 'S10', r: 7, x: 17, y: 0, w: 2, h: 2 },
    { id: 'c1', num: 'C1', r: 1, x: 13, y: 10, w: 4, h: 2 },
    { id: 'c2', num: 'C2', r: 2, x: 24, y: 8, w: 2, h: 3 },
    { id: 'c3', num: 'C3', r: 3, x: 23, y: 23, w: 5, h: 2 },
    { id: 'c4', num: 'C4', r: 4, x: 42, y: 9, w: 3, h: 3 },
    { id: 'c5', num: 'C5', r: 5, x: 31, y: 2, w: 4, h: 2 },
    { id: 'c6', num: 'C6', r: 6, x: 0, y: 15, w: 3, h: 3 },
    { id: 'c7', num: 'C7', r: 7, x: 7, y: 5, w: 4, h: 3 },
    { id: 'n22', num: '22', r: 8, x: 18, y: 25, w: 6, h: 3 },
    { id: 's11', num: 'S11', r: 8, x: 24, y: 26, w: 2, h: 2 }
  ];

  // Puertas de color: la llave abre el paso de una sala a otra (zona siguiente)
  const KEY_DOORS = {
    celeste: ['n2', 'n1'], verde: ['n5', 'n7'], naranja: ['n9', 'n10'], rosa: ['n12', 'n13'],
    lavanda: ['n3', 'n16'], azul: ['n16', 'n19'], dorada: ['n7', 'n22']
  };

  // Qué se puede alcanzar con cada poder nuevo (se dice al ganarlo)
  const POWER_OPENS = {
    doubleJump: ['la Sala del Rasgueador, arriba en la Sala 1', 'el Reto de los Tejados, arriba en la Sala 3'],
    wallJump: ['el pasaje de los tejados, que vuelve a la Sala 1', 'el Reto de las Cañas, en la Sala 5',
               'los cubos de la chimenea de la Sala 4'],
    dash: ['la Sala del Tótem, tras el muro agrietado de la Sala 2'],
    glide: ['el Taller Escondido, abajo en la Sala 5', 'el muelle al Lago Espejo, en la Sala 3'],
    hook: ['la fila de anillas de la Sala 6']
  };

  const byId = {};
  ROOMS.forEach(function (r) { byId[r.id] = r; });
  const nivel = {};
  C.NIVELES.forEach(function (n) { nivel[n.id] = n; });

  function room(id) { return byId[id] || null; }

  // Nombre de la sala: el del nivel si existe; si no, el del catálogo
  function name(id) {
    const L = LEVELS.find(function (l) { return l.id === id; });
    if (L) return L.name;
    return nivel[id] ? nivel[id].nombre : id;
  }

  // "Zona 1 · Sala 2", "Zona 1 · S1", "Reto C1"; las salitas no tienen número
  function label(id) {
    const r = room(id);
    if (!r) return name(id);
    if (/^C/.test(r.num)) return 'Reto ' + r.num;
    if (/^S/.test(r.num)) return 'Zona ' + r.r + ' · ' + r.num;
    return 'Zona ' + r.r + ' · Sala ' + r.num;
  }

  function region(id) {
    const L = LEVELS.find(function (l) { return l.id === id; });
    if (L && L.region) return L.region;
    const r = room(id);
    return r ? r.r : 0;
  }

  function regionInfo(n) {
    return C.REGIONES.find(function (r) { return r.id === n; }) || C.REGIONES[0];
  }

  // ¿Esta sala ya está construida (está en levels.js)?
  function built(id) {
    return LEVELS.some(function (l) { return l.id === id; });
  }

  function power(id) {
    return C.PODERES.find(function (p) { return p.id === id; }) || null;
  }

  function powerIndex(id) {
    return C.PODERES.findIndex(function (p) { return p.id === id; });
  }

  function keyInfo(id) {
    return C.LLAVES.find(function (k) { return k.id === id; }) || null;
  }

  function keyIndex(id) {
    return C.LLAVES.findIndex(function (k) { return k.id === id; });
  }

  function boss(type) {
    return C.JEFES.find(function (j) { return j.id === type; }) || null;
  }

  // "Ahora puedes entrar a la Sala 4 · Barrio Alto desde la Sala 1 (Zona 1)"
  function keyOpensText(keyId) {
    const d = KEY_DOORS[keyId];
    if (!d) return '';
    const from = room(d[0]);
    const to = room(d[1]);
    return 'Ahora puedes entrar a la ' + (to ? 'Sala ' + to.num : '') + ' · ' + name(d[1]) +
      ' desde la ' + (from ? 'Sala ' + from.num : name(d[0])) + ' (Zona ' + (from ? from.r : '') + ').';
  }

  return {
    ROOMS: ROOMS, KEY_DOORS: KEY_DOORS, POWER_OPENS: POWER_OPENS,
    room: room, name: name, label: label, region: region, regionInfo: regionInfo, built: built,
    power: power, powerIndex: powerIndex, keyInfo: keyInfo, keyIndex: keyIndex, boss: boss,
    keyOpensText: keyOpensText
  };
})();
