// Coliseo de los jefes (torre): se elige en el menú de inicio.
// Cinco pisos, un jefe por piso y en el orden del juego. En cada piso tienes
// los poderes que darían los jefes anteriores. Se juega con las reglas de Normal.
// Antes de cada pelea se presenta el jefe con su retrato (retrato_<jefe>.png).
// Los pisos son salas más de LEVELS (con tower: true), fuera del mundo.
const TOWER = {
  DIFFICULTY: 'normal',
  NEXT_DELAY: 2.5,        // segundos entre vencer a un jefe y subir al piso siguiente
  FLOORS: [
    { id: 't1', boss: 'bombo',       portrait: 'retrato_bombo',       abilities: [] },
    { id: 't2', boss: 'cuy',         portrait: 'retrato_cuygig',      abilities: ['doubleJump'] },
    { id: 't3', boss: 'charanguero', portrait: 'retrato_charanguero', abilities: ['doubleJump', 'wallJump'] },
    { id: 't4', boss: 'huaca',       portrait: 'retrato_huaca',       abilities: ['doubleJump', 'wallJump', 'dash'] },
    { id: 't5', boss: 'condor',      portrait: 'retrato_condor',      abilities: ['doubleJump', 'wallJump', 'dash', 'glide'] }
  ]
};

// Mapa de cada piso: inicio P a la izquierda, muro L que cierra la arena al
// cruzarlo y el jefe J a la derecha. Plataformas distintas según el jefe
(function addTowerFloors() {
  const W = 27;
  function floor(plats) {
    const rows = ['#'.repeat(W)];
    for (let y = 1; y < 12; y++) {
      const r = ('#' + '.'.repeat(W - 2) + '#').split('');
      r[6] = 'L';
      plats.forEach(function (p) {
        if (p[0] !== y) return;
        for (let x = p[1]; x < p[1] + p[2]; x++) r[x] = '=';
      });
      if (y === 11) { r[3] = 'P'; r[21] = 'J'; }
      rows.push(r.join(''));
    }
    rows.push('#'.repeat(W));
    return rows;
  }
  const PLATFORMS = {
    condor:      [[8, 10, 3], [8, 18, 3]],
    charanguero: [[7, 10, 4], [7, 18, 4]],
    huaca:       [[8, 14, 3]],
    cuy:         [],
    bombo:       [[7, 9, 3], [7, 19, 3]]
  };
  TOWER.FLOORS.forEach(function (f, i) {
    LEVELS.push({
      id: f.id,
      name: 'Coliseo: piso ' + (i + 1),
      tower: true,
      kind: 'jefe',
      theme: 'tower',
      music: 'key',
      time: 120,
      bpm: 120,
      boss: { type: f.boss, gives: null },
      map: floor(PLATFORMS[f.boss])
    });
  });
})();
