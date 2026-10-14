// =====================================================================
// CATÁLOGO DE CHASQUI: cada pieza del juego, descrita una sola vez.
// Lo lee el editor de niveles (editor-chasqui.html) y, desde la próxima
// versión, también el juego. Para agregar algo nuevo: suma una entrada aquí.
//
// Historia: en un futuro que nadie recuerda, una cultura muy antigua vive
// entre antenas, cables y máquinas. La música real ya no existe: las canciones
// se escaparon y andan sueltas por el mundo como criaturas asustadizas.
// La papa mensajera recorre el Camino de Piedra para atraparlas y devolverlas
// al Catálogo de músicas. El Silencio, una máquina gris y tranquila, quiere
// que nunca vuelvan.
//
// Campos de cada pieza:
//   id      nombre interno (no cambiarlo: lo usan los mapas)
//   nombre  cómo se llama en el juego
//   region  0 = aparece en todo el juego; 1 a 8 = región donde aparece primero
//   ch      letra en el mapa (capa "mapa") o en la decoración (capa "deco")
//   que     qué hace, en una línea
//   estado  'hecho' (ya funciona en el juego) o 'nuevo' (el editor ya lo pone;
//           el juego lo dibuja y lo hace funcionar en las próximas versiones)
//   props   opciones que se editan con la herramienta Propiedades del editor
//   preset  opciones que ya trae la pieza al ponerla (varias piezas comparten letra)
//   ic, color, forma: cómo se ve en el editor
//   w, h    tamaño en bloques (decoración)
// =====================================================================

const CATALOGO = (function () {

  // ---------- Regiones del Camino de Piedra (7 + la final) ----------
  // Orden del mapa versión 4 (12 oct): las regiones siguen el orden en que se ganan los poderes
  const REGIONES = [
    { id: 0, nombre: 'Base', color: '#9a93b0',
      que: 'Lo que aparece en todas las regiones.' },
    { id: 1, nombre: 'Ciudad Ocaso', color: '#ff9a6b', temas: ['cityday', 'cave', 'sea'],
      que: 'Ciudad al atardecer, acequias bajo las calles y un puerto con molinos. Aquí empieza todo.' },
    { id: 2, nombre: 'Barrio de Cañas', color: '#7bd389', temas: ['city', 'bamboo', 'tech'],
      que: 'Barrio alto de día, un bosque de cañas gigantes y el taller donde el Silencio arma sus máquinas.' },
    { id: 3, nombre: 'Minas de Cristal', color: '#6fd6ff', temas: ['mine'],
      que: 'Galerías con rieles, cristales que zumban y ríos bajo tierra.' },
    { id: 4, nombre: 'Terrazas Colgantes', color: '#c9a35b', temas: ['terraces'],
      que: 'Escalones de cultivo sobre el abismo, unidos por puentes que se balancean.' },
    { id: 5, nombre: 'Cumbres de Escarcha', color: '#d8f0ff', temas: ['snow'],
      que: 'Glaciares, cuevas de hielo y tormentas de viento.' },
    { id: 6, nombre: 'Lago Espejo', color: '#4d8cff', temas: ['lake'],
      que: 'Un lago quieto que refleja el cielo, islas de juncos y salas bajo el agua.' },
    { id: 7, nombre: 'Ciudadela de Niebla', color: '#c4b5ff', temas: ['mist'],
      que: 'Templos sin nombre dentro de las nubes; casi todo está escondido.' },
    { id: 8, nombre: 'El Gran Silencio', color: '#e6e2f0', temas: ['void'],
      que: 'La sala final: donde fueron a parar todas las canciones que faltan.' }
  ];

  // ---------- Fondos (temas) ----------
  const TEMAS = [
    { id: 'cityday',  nombre: 'Ciudad al atardecer', estado: 'hecho' },
    { id: 'city',     nombre: 'Ciudad de día',       estado: 'hecho' },
    { id: 'sea',      nombre: 'Puerto con molinos',  estado: 'hecho' },
    { id: 'cave',     nombre: 'Acequias (cueva con agua)', estado: 'hecho' },
    { id: 'bamboo',   nombre: 'Bosque de cañas',     estado: 'hecho' },
    { id: 'tech',     nombre: 'Taller de máquinas',  estado: 'hecho' },
    { id: 'mine',     nombre: 'Minas de cristal',    estado: 'nuevo' },
    { id: 'terraces', nombre: 'Terrazas colgantes',  estado: 'nuevo' },
    { id: 'snow',     nombre: 'Cumbres de escarcha', estado: 'nuevo' },
    { id: 'lake',     nombre: 'Lago espejo',         estado: 'nuevo' },
    { id: 'mist',     nombre: 'Ciudadela de niebla', estado: 'nuevo' },
    { id: 'void',     nombre: 'El Gran Silencio',    estado: 'nuevo' },
    { id: 'coliseo',  nombre: 'Coliseo de los jefes', estado: 'nuevo' },
    { id: 'tower',    nombre: 'Torre (fondo viejo del coliseo)', estado: 'hecho' }
  ];

  // ---------- Tipos de nivel y tamaño de partida ----------
  const TIPOS = [
    { id: 'principal', nombre: 'Sala principal', w: 80, h: 44,
      que: 'Abierta para explorar: se une a las vecinas por pasos. Tiene su misión en el Tótem de la canción: 3 corcheas, la llave y volver al tótem. Afinada, el tótem queda como portal.' },
    { id: 'secreto', nombre: 'Sala secreta', w: 40, h: 22,
      que: 'Se entra por una puerta E con un poder. Suele tener un jefe secreto o un tesoro.' },
    { id: 'reto', nombre: 'Reto de destreza', w: 80, h: 22,
      que: 'Solo plataformas: sin misión ni jefe. Al final espera un corazón extra (+1 corazón máximo).' },
    { id: 'jefe', nombre: 'Arena de jefe', w: 27, h: 13,
      que: 'Una pantalla y media, cerrada, para pelear con un jefe (el coliseo usa este tamaño).' },
    { id: 'salita', nombre: 'Salita', w: 20, h: 12,
      que: 'Una pantalla. Se entra por una puerta Q: tienda, descanso, cofre o cartel.' },
    { id: 'bonus', nombre: 'Etapa bonus', w: 40, h: 12,
      que: 'Un reto corto con tiempo, como los bonus de Donkey Kong Country.' }
  ];

  // ---------- Los 33 niveles (22 principales + 11 secretos) y los 7 retos ----------
  // Según el mapa versión 4. "actual" = id que ya tiene en tu levels.js.
  // pantallas: [ancho, alto] en pantallas del juego (1 pantalla = 20 × 11 bloques), como en el mapa.
  const NIVELES = [
    { id: 'n2',  numero: 1, pantallas: [4, 4],  region: 1, tipo: 'principal', nombre: 'Calles del Ocaso', actual: true,
      que: 'Inicio. Posta y Mercader de las rutas. Puerta E a S1 (doble salto). Aquí llega el pasaje de los tejados.' },
    { id: 'n5',  numero: 2, pantallas: [4, 4],  region: 1, tipo: 'principal', nombre: 'Acequias Hondas', actual: true,
      que: 'Canales con agua. Galería sumergida (buceo). Pozo de salto en la pared hacia la sala 7. Muro agrietado a S2 (dash).' },
    { id: 'n3',  numero: 3, pantallas: [6, 4],  region: 1, tipo: 'principal', nombre: 'Puerto de los Molinos', actual: true, jefe: 'bombo',
      que: 'Arena del Guardián del Tambor. Reto C1 arriba. Muelle al oeste: con planeo se cruza al Lago.' },
    { id: 'n1',  numero: 4, pantallas: [4, 4],  region: 2, tipo: 'principal', nombre: 'Barrio Alto', actual: true,
      que: 'Se llega por una repisa alta desde la sala 1 (doble salto). Posta.' },
    { id: 'n4',  numero: 5, pantallas: [3, 6],  region: 2, tipo: 'principal', nombre: 'Cañaveral Gigante', actual: true,
      que: 'Cocinera del camino. Reto C2 a la izquierda (salto en la pared). Abajo, S3 (planeo).' },
    { id: 'n6',  numero: 6, pantallas: [4, 4],  region: 2, tipo: 'principal', nombre: 'Taller del Silencio', actual: true, jefe: 'cuy',
      que: 'Arena del Cuy Gigante. S4 tras las anillas (gancho). Arriba sale el pasaje de los tejados hacia la sala 1 (salto en la pared).' },
    { id: 'n7',  numero: 7, pantallas: [3, 5],  region: 3, tipo: 'principal', nombre: 'Boca de la Mina',
      que: 'Pozo vertical. Posta. Abajo, la puerta sellada de El Gran Silencio.' },
    { id: 'n8',  numero: 8, pantallas: [7, 2],  region: 3, tipo: 'principal', nombre: 'Rieles Cantores', que: 'Coleccionista de rarezas. Reto C3.' },
    { id: 'n9',  numero: 9, pantallas: [4, 4],  region: 3, tipo: 'principal', nombre: 'Corazón de Cristal', jefe: 'gusano' },
    { id: 'n10', numero: 10, pantallas: [4, 4], region: 4, tipo: 'principal', nombre: 'Primera Terraza' },
    { id: 'n11', numero: 11, pantallas: [6, 3], region: 4, tipo: 'principal', nombre: 'Puentes de Paja', que: 'Mercader de las rutas. Túnel a S6 (encogerse).' },
    { id: 'n12', numero: 12, pantallas: [4, 8], region: 4, tipo: 'principal', nombre: 'Terraza del Abismo', jefe: 'toro', que: 'Reto C4.' },
    { id: 'n13', numero: 13, pantallas: [4, 4], region: 5, tipo: 'principal', nombre: 'Glaciar Dormido' },
    { id: 'n14', numero: 14, pantallas: [5, 3], region: 5, tipo: 'principal', nombre: 'Cueva de Hielo', que: 'Cocinera del camino. Reto C5.' },
    { id: 'n15', numero: 15, pantallas: [4, 5], region: 5, tipo: 'principal', nombre: 'Cima de la Tormenta', jefe: 'oso' },
    { id: 'n16', numero: 16, pantallas: [7, 3], region: 6, tipo: 'principal', nombre: 'Orilla de Juncos', que: 'Cascada que se sube buceando hacia la Ciudadela.' },
    { id: 'n17', numero: 17, pantallas: [5, 4], region: 6, tipo: 'principal', nombre: 'Islas Flotantes', que: 'Acuática. Coleccionista de rarezas. Reto C6.' },
    { id: 'n18', numero: 18, pantallas: [5, 4], region: 6, tipo: 'principal', nombre: 'Bajo el Espejo', jefe: 'rana', que: 'Acuática.' },
    { id: 'n19', numero: 19, pantallas: [4, 4], region: 7, tipo: 'principal', nombre: 'Puerta de Nubes', que: 'Reto C7.' },
    { id: 'n20', numero: 20, pantallas: [5, 4], region: 7, tipo: 'principal', nombre: 'Templo sin Nombre', que: 'Mercader de las rutas.' },
    { id: 'n21', numero: 21, pantallas: [4, 5], region: 7, tipo: 'principal', nombre: 'Mirador del Eco', jefe: 'condor' },
    { id: 'n22', numero: 22, pantallas: [6, 3], region: 8, tipo: 'principal', nombre: 'El Gran Silencio', jefe: 'silencio' },
    { id: 'j1',  numero: 'S1', pantallas: [2, 2],  region: 1, tipo: 'secreto', nombre: 'Sala del Rasgueador', actual: true, jefe: 'charanguero', pide: 'doubleJump' },
    { id: 'j2',  numero: 'S2', pantallas: [2, 2],  region: 1, tipo: 'secreto', nombre: 'Sala del Tótem', actual: true, jefe: 'huaca', pide: 'dash' },
    { id: 's3',  numero: 'S3', pantallas: [2, 2],  region: 2, tipo: 'secreto', nombre: 'Taller Escondido', pide: 'glide',
      que: 'Sin jefe: el gancho de nudos espera al fondo de una caída que se cruza planeando.' },
    { id: 's4',  numero: 'S4', pantallas: [2, 2],  region: 2, tipo: 'secreto', nombre: 'Prensa del Taller', jefe: 'prensa', pide: 'hook' },
    { id: 's5',  numero: 'S5', pantallas: [2, 2],  region: 3, tipo: 'secreto', nombre: 'Geoda Escondida', jefe: 'geoda', pide: 'glide' },
    { id: 's6',  numero: 'S6', pantallas: [2, 2],  region: 4, tipo: 'secreto', nombre: 'Campo del Espantapájaros', jefe: 'espantapajaros', pide: 'shrink' },
    { id: 's7',  numero: 'S7', pantallas: [2, 2],  region: 5, tipo: 'secreto', nombre: 'Trono de Granizo', jefe: 'reina', pide: 'airDash' },
    { id: 's8',  numero: 'S8', pantallas: [3, 3],  region: 6, tipo: 'secreto', nombre: 'Fondo Abisal', jefe: 'linterna', pide: 'dive' },
    { id: 's9',  numero: 'S9', pantallas: [2, 2],  region: 7, tipo: 'secreto', nombre: 'Torre de la Doble Sombra', jefe: 'sombra', pide: 'shell' },
    { id: 's10', numero: 'S10', pantallas: [2, 2], region: 7, tipo: 'secreto', nombre: 'Sala de los Ecos Perdidos',
      que: 'Se abre con las 49 notas de la escala. Guarda la canción secreta.' },
    { id: 's11', numero: 'S11', pantallas: [2, 2], region: 8, tipo: 'secreto', nombre: 'Camerino del Silencio', jefe: 'silencio_verdadero',
      que: 'Final verdadero: se abre con las 22 canciones y los 7 poliedros sonoros.' },
    { id: 'c1', numero: 'C1', pantallas: [4, 2], region: 1, tipo: 'reto', nombre: 'Reto de los Tejados', pide: 'doubleJump', que: 'Junto a la sala 3. Tejados que se caen y rítmicas.' },
    { id: 'c2', numero: 'C2', pantallas: [2, 3], region: 2, tipo: 'reto', nombre: 'Reto de las Cañas', pide: 'wallJump', que: 'A la izquierda de la sala 5. Subida rebotando entre cañas.' },
    { id: 'c3', numero: 'C3', pantallas: [5, 2], region: 3, tipo: 'reto', nombre: 'Reto de los Rieles', pide: 'dash', que: 'Junto a la sala 8. Vagoneta sin frenos.' },
    { id: 'c4', numero: 'C4', pantallas: [3, 3], region: 4, tipo: 'reto', nombre: 'Reto del Abismo', pide: 'dash', que: 'Junto a la sala 12.' },
    { id: 'c5', numero: 'C5', pantallas: [4, 2], region: 5, tipo: 'reto', nombre: 'Reto de la Ventisca', pide: 'glide', que: 'Junto a la sala 14.' },
    { id: 'c6', numero: 'C6', pantallas: [3, 3], region: 6, tipo: 'reto', nombre: 'Reto de las Burbujas', pide: 'dive', que: 'Junto a la sala 17. Acuático.' },
    { id: 'c7', numero: 'C7', pantallas: [4, 3], region: 7, tipo: 'reto', nombre: 'Reto de las Nubes', pide: 'charge', que: 'Junto a la sala 19.' },
    { id: 'j3',  numero: 'vieja', pantallas: [2, 2], region: 1, tipo: 'secreto', nombre: 'Madriguera del Cuy (sala vieja)', actual: true, jefe: 'cuy',
      que: 'Sala secreta de antes. El Cuy Gigante pasa a la sala 6: esta sala se puede reutilizar o borrar.' }
  ];

  // ---------- Músicas: se nombran por su tono y su velocidad ----------
  // Cada nivel elige una base y cuántos semitonos subirla o bajarla (pitch).
  // El nombre y los bpm salen solos: Do mayor 120 bpm con +2 = Re mayor 135 bpm.
  const MUSICAS = [
    { id: 'main', archivo: 'blues_do_mayor.mp3', estilo: 'Blues', tono: 0, modo: 'mayor', bpm: 120,
      que: 'La canción de la sala mientras la buscas.' },
    { id: 'key', archivo: 'blues_mi_menor.mp3', estilo: 'Blues', tono: 4, modo: 'menor', bpm: 120,
      que: 'La versión en menor: suena al juntar las 3 corcheas y en los jefes.' }
  ];
  const NOTAS_NOMBRE = ['Do', 'Do sostenido', 'Re', 'Mi bemol', 'Mi', 'Fa', 'Fa sostenido', 'Sol', 'La bemol', 'La', 'Si bemol', 'Si'];
  // "Blues en Re mayor · 135 bpm" para una base y un pitch
  function nombreMusica(id, pitch) {
    const m = MUSICAS.find(function (x) { return x.id === id; }) || MUSICAS[0];
    const p = Number(pitch) || 0;
    const tono = ((m.tono + p) % 12 + 12) % 12;
    const bpm = Math.round(m.bpm * Math.pow(2, p / 12));
    return m.estilo + ' en ' + NOTAS_NOMBRE[tono] + ' ' + m.modo + ' · ' + bpm + ' bpm';
  }

  // ---------- Poderes (cada uno con su símbolo), en el orden en que se ganan ----------
  // simbolo: la forma que se dibuja en el menú y en la piedra junto a las puertas
  const PODERES = [
    { id: 'run',        nombre: 'Correr',          region: 0, color: '#FBF6EC', simbolo: 'Dos líneas inclinadas',
      como: 'Mantén Acción (E / Cuadrado) mientras te mueves.', abre: '—', estado: 'hecho' },
    { id: 'doubleJump', nombre: 'Doble salto',     region: 1, color: '#9FD3E0', simbolo: 'Dos alas en V, una sobre otra',
      como: 'Salta otra vez en el aire.', abre: 'Repisas altas.', gana: 'Guardián del Tambor (sala 3)', estado: 'hecho' },
    { id: 'wallJump',   nombre: 'Salto en la pared', region: 2, color: '#8FBF9A', simbolo: 'Escalón en zigzag con una pared',
      como: 'Salta pegado a una pared.', abre: 'Pozos y paredes altas.', gana: 'Cuy Gigante (sala 6)', estado: 'hecho' },
    { id: 'dash',       nombre: 'Dash',            region: 3, color: '#F4A261', simbolo: 'Flecha con tres líneas de velocidad',
      como: 'Shift / Círculo / R1. Mantenlo para ir más lejos.', abre: 'Huecos largos y muros agrietados.', gana: 'Gusano Taladro (sala 9)', estado: 'hecho' },
    { id: 'stomp',      nombre: 'Zapateo',         region: 4, color: '#F2A28C', simbolo: 'Flecha hacia abajo sobre una línea quebrada',
      como: 'Abajo + Salto en el aire: golpe contra el suelo.', abre: 'Suelos agrietados.', gana: 'Toro de las Terrazas (sala 12)', estado: 'nuevo' },
    { id: 'glide',      nombre: 'Planeo',          region: 5, color: '#C9B8E3', simbolo: 'Pluma',
      como: 'Mantén Salto mientras caes.', abre: 'Caídas largas, viento y el cruce del mar.', gana: 'Oso de Escarcha (sala 15)', estado: 'hecho' },
    { id: 'hook',       nombre: 'Gancho de nudos', region: 2, color: '#E9C46A', simbolo: 'Círculo con una cuerda colgando',
      como: 'Acción cerca de una anilla con la marca amarilla.', abre: 'Filas de anillas y techos altos.', gana: 'Sala secreta S3', estado: 'hecho' },
    { id: 'airDash',    nombre: 'Dash en el aire', region: 3, color: '#F4B6C2', simbolo: 'Flecha sobre una nube escalonada',
      como: 'Dash mientras saltas.', abre: 'Abismos anchos.', gana: 'Geoda Viva (S5)', estado: 'hecho' },
    { id: 'charge',     nombre: 'Salto cargado',   region: 5, color: '#BFE3C8', simbolo: 'Flecha hacia arriba sobre una base',
      como: 'Agáchate y mantén Salto: al soltar, salto muy alto.', abre: 'Techos muy altos.', gana: 'Reina del Granizo (S7)', estado: 'nuevo' },
    { id: 'dive',       nombre: 'Buceo',           region: 6, color: '#6FA8C7', simbolo: 'Dos ondas escalonadas',
      como: 'Abajo dentro del agua para sumergirte.', abre: 'Galerías bajo el agua y la cascada a la Ciudadela.', gana: 'Rana Gigante (sala 18)', estado: 'nuevo' },
    { id: 'shrink',     nombre: 'Encogerse',       region: 6, color: '#F7C9A8', simbolo: 'Círculo pequeño dentro de un círculo punteado',
      como: 'Abajo dos veces: la papa se achica; otra vez para crecer.', abre: 'Túneles de un bloque.', gana: 'Pez Linterna Abisal (S8)', estado: 'nuevo' },
    { id: 'shell',      nombre: 'Caracol del eco', region: 7, color: '#F7E3A1', simbolo: 'Espiral',
      como: 'Mantén Acción: soplas el caracol.', abre: 'Plataformas y puertas escondidas en la niebla.', gana: 'Cóndor de Bronce (sala 21)', estado: 'nuevo' }
  ];

  // ---------- Poliedros sonoros: piezas raras, una por región, se equipan 2 a la vez ----------
  // Sólidos de cristal con una nota adentro (no se usan cubos de colores de ninguna marca).
  const POLIEDROS = [
    { id: 'piramide',   nombre: 'Pirámide sonora', region: 1, color: '#ff6b6b', ic: '▲',
      que: 'Muestra en el mapa dónde están las 3 corcheas de la sala.' },
    { id: 'octaedro',   nombre: 'Octaedro sonoro', region: 2, color: '#ffb84d', ic: '◆',
      que: 'Escudo: aguanta un golpe sin perder vida, una vez por sala.' },
    { id: 'espejo',     nombre: 'Prisma espejo', region: 3, color: '#d0d6e0', ic: '◩',
      que: 'Los enemigos sueltan el doble de monedas.' },
    { id: 'cilindro',   nombre: 'Cilindro torcido', region: 4, color: '#6bc6ff', ic: '◍',
      que: 'El escape con la llave dura 20 segundos más.' },
    { id: 'dodecaedro', nombre: 'Dodecaedro estrella', region: 5, color: '#b48cff', ic: '✸',
      que: 'Las corcheas huyen más despacio.' },
    { id: 'engranaje',  nombre: 'Esfera de engranajes', region: 6, color: '#c9a35b', ic: '⚙',
      que: 'Imán: atrae monedas, maíz y cubos cercanos.' },
    { id: 'teseracto',  nombre: 'Cristal de mil caras', region: 7, color: '#ffffff', ic: '⧈',
      que: 'Al perder la última vida, revives una vez con un corazón (una vez por sala).' }
  ];

  // ---------- Instrumentos perdidos: uno por región, con su ficha ----------
  const INSTRUMENTOS = [
    { id: 'cuerdas',  nombre: 'Cuerdas de caparazón', region: 1, que: 'Instrumento de cuerdas pequeño y brillante.' },
    { id: 'tambor',   nombre: 'Tambor grande',        region: 2, que: 'Marca el pulso de todas las canciones.' },
    { id: 'hueso',    nombre: 'Flauta de hueso',      region: 3, que: 'Una flauta recta de sonido triste.' },
    { id: 'cuerno',   nombre: 'Cuerno torcido',       region: 4, que: 'Se escucha de una terraza a otra.' },
    { id: 'madera',   nombre: 'Flauta de madera',     region: 5, que: 'Sonido grueso que corta el viento.' },
    { id: 'canas',    nombre: 'Flauta de cañas',      region: 6, que: 'Muchos tubos atados: cada uno, una nota.' },
    { id: 'caracola', nombre: 'Caracola marina',      region: 7, que: 'La que despierta lo que duerme en la niebla.' }
  ];

  // ---------- Etapas bonus (se entra por una puerta Q de bonus) ----------
  const BONUS = [
    { id: 'banquete', nombre: 'Banquete', que: 'Come todas las frutas antes de 20 segundos.', premio: 'Un corazón extra la primera vez (30 monedas si ya tienes 10)' },
    { id: 'veloz',    nombre: 'La corchea veloz', que: 'Atrapa una corchea dorada que huye muy rápido (30 s).', premio: 'Una vida' },
    { id: 'lluvia',   nombre: 'Lluvia de monedas', que: 'Caen monedas del techo durante 15 segundos.', premio: 'Todo lo que juntes' },
    { id: 'cadena',   nombre: 'Tambores en cadena', que: 'Rebota de tambor en tambor sin tocar el suelo hasta la meta.', premio: 'Una nota de la escala o un fragmento' }
  ];

  // ---------- Vendedores (en las salitas de tienda) ----------
  const TIENDA = [
    { id: 'mapa',   nombre: 'Rollo de mapa de la región', precio: 30,  que: 'El mapa completo de la región.' },
    { id: 'vida',   nombre: 'Vida',                       precio: 20,  que: '+1 vida.' },
    { id: 'aji',    nombre: 'Ají para llevar',            precio: 15,  que: 'Lo usas cuando quieras.' },
    { id: 'pista',  nombre: 'Pista',                      precio: 25,  que: 'Marca en el mapa una nota de la escala.' },
    { id: 'pieza',  nombre: 'Poliedro sonoro de la región', precio: 150, que: 'Solo el Coleccionista.' },
    { id: 'comida', nombre: 'Recuperar los corazones',    precio: 0,   que: 'Solo la Cocinera, gratis.' }
  ];
  // ---------- Llaves de colores: el jefe de cada zona da una ----------
  // Cada llave abre las puertas de su color, que llevan a la zona siguiente.
  const LLAVES = [
    { id: 'celeste',  nombre: 'Llave celeste',  color: '#9FD3E0', region: 1, jefe: 'bombo',  abre: 'La puerta celeste hacia la zona 2 (Barrio de Cañas).' },
    { id: 'verde',    nombre: 'Llave verde',    color: '#8FBF9A', region: 2, jefe: 'cuy',    abre: 'La puerta verde hacia la zona 3 (Minas de Cristal).' },
    { id: 'naranja',  nombre: 'Llave naranja',  color: '#F4A261', region: 3, jefe: 'gusano', abre: 'La puerta naranja hacia la zona 4 (Terrazas Colgantes).' },
    { id: 'rosa',     nombre: 'Llave rosa',     color: '#F4B6C2', region: 4, jefe: 'toro',   abre: 'La puerta rosa hacia la zona 5 (Cumbres de Escarcha).' },
    { id: 'lavanda',  nombre: 'Llave lavanda',  color: '#C9B8E3', region: 5, jefe: 'oso',    abre: 'La puerta lavanda hacia la zona 6 (Lago Espejo).' },
    { id: 'azul',     nombre: 'Llave azul',     color: '#6FA8C7', region: 6, jefe: 'rana',   abre: 'La puerta azul hacia la zona 7 (Ciudadela de Niebla).' },
    { id: 'dorada',   nombre: 'Llave dorada',   color: '#E9C46A', region: 7, jefe: 'condor', abre: 'La puerta dorada de El Gran Silencio (también pide las 21 salas afinadas).' }
  ];

  const MERCADERES = [
    { id: 'viajero',   nombre: 'Mercader de las rutas', salas: [1, 11, 20], vende: ['mapa', 'vida', 'aji', 'pista'],
      que: 'Viajero alto con mochila de rollos y gafas de latón.' },
    { id: 'cocinera',  nombre: 'Cocinera del camino', salas: [5, 14], vende: ['comida', 'mapa', 'aji', 'vida'],
      que: 'Recupera todos tus corazones gratis.' },
    { id: 'coleccion', nombre: 'Coleccionista de rarezas', salas: [8, 17], vende: ['pista', 'mapa', 'pieza'],
      que: 'Vende pistas y el poliedro sonoro de la región.' }
  ];

  // ---------- Piezas del mapa (capa "mapa") ----------
  // grupo: terreno, objeto, puerta, enemigo, jefe
  // forma (para el editor): full, half, pass, spikes, crumble, cracked, water, icon
  const PIEZAS = [
    // --- Terreno base ---
    { id: 'suelo',      ch: '#', grupo: 'terreno', region: 0, nombre: 'Suelo', color: '#7a4a3a', forma: 'full', estado: 'hecho',
      que: 'Bloque sólido; se dibuja con borde de pasto donde tiene aire arriba.' },
    { id: 'ladrillo',   ch: 'B', grupo: 'terreno', region: 0, nombre: 'Ladrillo', color: '#a84a5a', forma: 'full', estado: 'hecho',
      que: 'Bloque sólido de construcción.' },
    { id: 'delgada',    ch: '=', grupo: 'terreno', region: 0, nombre: 'Plataforma delgada', color: '#d39a5e', forma: 'half', estado: 'hecho',
      que: 'Media altura, sólida también desde abajo.' },
    { id: 'paso',       ch: '_', grupo: 'terreno', region: 0, nombre: 'Plataforma de paso', color: '#e8c58a', forma: 'pass', estado: 'nuevo',
      que: 'Se atraviesa desde abajo y se pisa desde arriba.' },
    { id: 'espinas',    ch: '^', grupo: 'terreno', region: 0, nombre: 'Espinas', color: '#e6e2f0', forma: 'spikes', estado: 'hecho',
      que: 'Quitan una vida y vuelves a la banderita.' },
    { id: 'quebradiza', ch: '~', grupo: 'terreno', region: 0, nombre: 'Se cae al pisar', color: '#b08c5c', forma: 'crumble', estado: 'hecho',
      que: 'Tiembla, cae y vuelve a aparecer.' },
    { id: 'agrietado',  ch: 'X', grupo: 'terreno', region: 0, nombre: 'Muro agrietado', color: '#6d6a8a', forma: 'cracked', estado: 'hecho',
      que: 'Se rompe con el dash.', pide: 'dash' },
    // --- Región 1 ---
    { id: 'ritmicaA',   ch: '1', grupo: 'terreno', region: 1, nombre: 'Rítmica A', color: '#3fd1c4', forma: 'full', ic: 'A', estado: 'hecho',
      que: 'Aparece y desaparece al pulso de la música.' },
    { id: 'ritmicaB',   ch: '2', grupo: 'terreno', region: 1, nombre: 'Rítmica B', color: '#c46bff', forma: 'full', ic: 'B', estado: 'hecho',
      que: 'Lo contrario de la A: está cuando la A no está.' },
    { id: 'tambor',     ch: 'T', grupo: 'terreno', region: 1, nombre: 'Tambor', color: '#d2423a', forma: 'full', ic: 'T', estado: 'hecho',
      que: 'Rebote alto.' },
    // --- Región 2 ---
    { id: 'movil',      ch: 'M', grupo: 'terreno', region: 2, nombre: 'Plataforma móvil', color: '#4d8cff', forma: 'half', ic: '↔', estado: 'hecho',
      que: 'Va y viene de lado a lado.' },
    { id: 'ascensor',   ch: 'I', grupo: 'terreno', region: 2, nombre: 'Ascensor', color: '#2f6bd9', forma: 'half', ic: '↕', estado: 'hecho',
      que: 'Sube y baja; se atraviesa desde abajo.' },
    { id: 'cintaD',     ch: '>', grupo: 'terreno', region: 2, nombre: 'Cinta a la derecha', color: '#8a8a96', forma: 'full', ic: '»', estado: 'hecho',
      que: 'Arrastra hacia la derecha.' },
    { id: 'cintaI',     ch: '<', grupo: 'terreno', region: 2, nombre: 'Cinta a la izquierda', color: '#8a8a96', forma: 'full', ic: '«', estado: 'hecho',
      que: 'Arrastra hacia la izquierda.' },
    { id: 'rayo',       ch: 'l', grupo: 'terreno', region: 2, nombre: 'Rayo intermitente', color: '#ff4d6d', forma: 'icon', ic: 'ϟ', estado: 'nuevo',
      que: 'Rayo de las máquinas del Silencio: se prende y se apaga al pulso.' },
    { id: 'porton',     ch: 'G', grupo: 'terreno', region: 2, nombre: 'Portón', color: '#ffd34d', forma: 'full', ic: 'G', estado: 'hecho',
      que: 'Se abre al cumplir la misión de la sala.' },
    { id: 'muroArena',  ch: 'L', grupo: 'terreno', region: 2, nombre: 'Muro de arena', color: '#ff7a6b', forma: 'full', ic: 'L', estado: 'hecho',
      que: 'Se levanta al empezar la pelea con un jefe y cierra la arena.' },
    // --- Región 3 ---
    { id: 'canon',      ch: 'C', grupo: 'terreno', region: 3, nombre: 'Tambor cañón', color: '#e05a3a', forma: 'icon', ic: '◎', estado: 'nuevo',
      que: 'Te mete adentro y te dispara en su dirección, como los barriles de Donkey Kong.',
      props: { dir: ['arriba', 'derecha', 'izquierda', 'arriba-derecha', 'arriba-izquierda'] }, preset: { dir: 'arriba' } },
    { id: 'riel',       ch: 'r', grupo: 'terreno', region: 3, nombre: 'Riel', color: '#9a7b5a', forma: 'half', ic: '═', estado: 'nuevo',
      que: 'Camino de la vagoneta.' },
    { id: 'vagoneta',   ch: 'v', grupo: 'terreno', region: 3, nombre: 'Vagoneta', color: '#b87333', forma: 'icon', ic: '▣', estado: 'nuevo',
      que: 'Súbete y corre por el riel; salta antes de que se acabe.' },
    { id: 'palanca',    ch: 'p', grupo: 'terreno', region: 3, nombre: 'Interruptor', color: '#ffe066', forma: 'icon', ic: '⊙', estado: 'nuevo',
      que: 'Al tocarlo cambia los bloques rojos por los azules.' },
    { id: 'bloqueRojo', ch: '3', grupo: 'terreno', region: 3, nombre: 'Bloque rojo', color: '#e0465a', forma: 'full', ic: 'R', estado: 'nuevo',
      que: 'Sólido al empezar; desaparece al tocar un interruptor.' },
    { id: 'bloqueAzul', ch: '4', grupo: 'terreno', region: 3, nombre: 'Bloque azul', color: '#3a7be0', forma: 'full', ic: 'Z', estado: 'nuevo',
      que: 'Aparece al tocar un interruptor.' },
    // --- Agua (desde la región 1: acequias) y lago (región 6) ---
    { id: 'agua',       ch: 'w', grupo: 'terreno', region: 1, nombre: 'Agua', color: '#3a8bd8', forma: 'water', estado: 'nuevo',
      que: 'Se nada lento; con el buceo se puede bajar.' },
    { id: 'corrienteI', ch: '{', grupo: 'terreno', region: 6, nombre: 'Corriente a la izquierda', color: '#5aa6ee', forma: 'water', ic: '«', estado: 'nuevo',
      que: 'Agua que empuja a la izquierda.' },
    { id: 'corrienteD', ch: '}', grupo: 'terreno', region: 6, nombre: 'Corriente a la derecha', color: '#5aa6ee', forma: 'water', ic: '»', estado: 'nuevo',
      que: 'Agua que empuja a la derecha.' },
    { id: 'balsa',      ch: 'b', grupo: 'terreno', region: 6, nombre: 'Balsa de juncos', color: '#c9b46b', forma: 'half', ic: '≈', estado: 'nuevo',
      que: 'Flota; si te quedas parado se hunde despacio.' },
    // --- Región 5 ---
    { id: 'hielo',      ch: 'i', grupo: 'terreno', region: 5, nombre: 'Hielo', color: '#bfe6ff', forma: 'full', ic: '*', estado: 'nuevo',
      que: 'Sólido y resbaloso: cuesta frenar.' },
    { id: 'nieve',      ch: 's', grupo: 'terreno', region: 5, nombre: 'Nieve blanda', color: '#f2f6ff', forma: 'full', ic: '·', estado: 'nuevo',
      que: 'Sólida; caminas más lento y saltas un poco menos.' },
    { id: 'geiser',     ch: 'g', grupo: 'terreno', region: 5, nombre: 'Géiser', color: '#9fe0ff', forma: 'icon', ic: '⇑', estado: 'nuevo',
      que: 'Lanza un chorro hacia arriba cada pocos segundos.' },
    { id: 'viento',     ch: 'V', grupo: 'terreno', region: 5, nombre: 'Viento hacia arriba', color: '#bfe9ff', forma: 'icon', ic: '↑', estado: 'nuevo',
      que: 'Te empuja hacia arriba; con el planeo subes alto.' },
    // --- Región 4 (terrazas) ---
    { id: 'puente',     ch: '-', grupo: 'terreno', region: 4, nombre: 'Puente colgante', color: '#d6b36a', forma: 'pass', ic: '~', estado: 'nuevo',
      que: 'Se balancea mientras lo cruzas.' },
    { id: 'sueloRoto',  ch: 'x', grupo: 'terreno', region: 4, nombre: 'Suelo agrietado', color: '#8a6d55', forma: 'cracked', estado: 'nuevo',
      que: 'Se rompe con el zapateo.', pide: 'stomp' },
    { id: 'cuerda',     ch: '|', grupo: 'terreno', region: 4, nombre: 'Cuerda para trepar', color: '#c9a35b', forma: 'icon', ic: '│', estado: 'nuevo',
      que: 'Arriba y abajo para trepar; salto para soltarte.' },
    // --- Región 7 ---
    { id: 'oculta',     ch: 'h', grupo: 'terreno', region: 7, nombre: 'Plataforma oculta', color: '#ffcf4d', forma: 'half', ic: '?', estado: 'nuevo',
      que: 'Invisible hasta que soplas el caracol del eco.', pide: 'shell' },
    { id: 'niebla',     ch: 'O', grupo: 'terreno', region: 7, nombre: 'Niebla', color: '#c4b5ff', forma: 'water', estado: 'nuevo',
      que: 'Tapa lo que hay detrás; el caracol la despeja un rato.' },

    // --- Objetos ---
    { id: 'inicio',     ch: 'P', grupo: 'objeto', region: 0, nombre: 'Inicio', color: '#ffb347', forma: 'icon', ic: 'P', estado: 'hecho',
      que: 'Donde aparece la papa (uno por sala).' },
    { id: 'corchea',    ch: 'n', grupo: 'objeto', region: 0, nombre: 'Corchea', color: '#ffe066', forma: 'icon', ic: '♪', estado: 'hecho',
      que: '3 por sala. A 5 bloques te ve (sale un "!") y huye dando saltitos: hay que atraparla.' },
    { id: 'llave',      ch: 'k', grupo: 'objeto', region: 0, nombre: 'Llave', color: '#ffd34d', forma: 'icon', ic: '⚷', estado: 'hecho',
      que: 'Aparece con las 3 corcheas. Llévala al Tótem de la canción antes de que termine la canción: la sala se afina y la canción entra al Catálogo de músicas. No abre pasos.' },
    { id: 'cubo',       ch: 'c', grupo: 'objeto', region: 0, nombre: 'Cubo sonoro', color: '#3fd16b', forma: 'icon', ic: '■', estado: 'hecho',
      que: '5 cubos = 1 vida.' },
    { id: 'moneda',     ch: '$', grupo: 'objeto', region: 0, nombre: 'Moneda dorada', color: '#ffc83a', forma: 'icon', ic: '●', estado: 'nuevo',
      que: 'Las sueltan los enemigos y hay escondidas. Se gastan con los mercaderes.' },
    { id: 'corazonExtra', ch: '*', grupo: 'objeto', region: 0, nombre: 'Corazón extra', color: '#ff6b8a', forma: 'icon', ic: '♥', estado: 'nuevo',
      que: 'Va al final de cada reto de destreza: +1 corazón máximo (de 3 a 10).' },
    { id: 'aji',        ch: 'a', grupo: 'objeto', region: 0, nombre: 'Ají', color: '#ff4d3a', forma: 'icon', ic: 'a', estado: 'hecho',
      que: '5 segundos invencible, más rápido y más alto.' },
    { id: 'banderita',  ch: 'S', grupo: 'objeto', region: 0, nombre: 'Banderita', color: '#7be0a0', forma: 'icon', ic: '⚑', estado: 'hecho',
      que: 'Si pierdes una vida, vuelves aquí.' },
    { id: 'posta',      ch: '@', grupo: 'objeto', region: 0, nombre: 'Posta de descanso', color: '#9be36b', forma: 'icon', ic: '⌂', estado: 'nuevo',
      que: 'Guarda la partida, recupera los corazones y te lleva corriendo a otra posta.' },
    { id: 'cartel',     ch: '?', grupo: 'objeto', region: 0, nombre: 'Cartel', color: '#d8c3a5', forma: 'icon', ic: '¶', estado: 'nuevo',
      que: 'Muestra un texto al acercarte.', props: { texto: 'texto' }, preset: { texto: '' } },
    { id: 'nota',       ch: 'q', grupo: 'objeto', region: 0, nombre: 'Nota de la escala', color: '#ffffff', forma: 'icon', ic: '♫', estado: 'nuevo',
      que: 'Do, Re, Mi, Fa, Sol, La, Si: 7 escondidas por región. Con las 7 se abre la etapa bonus.',
      props: { nota: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'] }, preset: { nota: 'Do' } },
    { id: 'anilla',     ch: 'o', grupo: 'objeto', region: 2, nombre: 'Anilla del gancho', color: '#f0d9a8', forma: 'icon', ic: '○', estado: 'hecho',
      que: 'Con el gancho te cuelgas de ella.', pide: 'hook' },
    { id: 'poderOculto', ch: 'H', grupo: 'objeto', region: 2, nombre: 'Poder escondido', color: '#f0b860', forma: 'icon', ic: '✦', estado: 'hecho',
      que: 'Un poder que se toma sin jefe (hoy: el gancho).' },
    { id: 'mapa',       ch: 'Z', grupo: 'objeto', region: 0, nombre: 'Rollo de mapa', color: '#e6d3a3', forma: 'icon', ic: '▤', estado: 'nuevo',
      que: 'Muestra el mapa completo de la región.' },
    { id: 'mercader',   ch: 'm', grupo: 'objeto', region: 0, nombre: 'Vendedor', color: '#ffb36b', forma: 'icon', ic: '☺', estado: 'nuevo',
      que: 'Vende cosas por monedas.', props: { tipo: ['viajero', 'coleccion', 'cocinera'] }, preset: { tipo: 'viajero' } },
    { id: 'llama',      ch: '&', grupo: 'objeto', region: 3, nombre: 'Llama de cuerda', color: '#f2e2c4', forma: 'icon', ic: '♞', estado: 'nuevo',
      que: 'Montura mecánica: rompe muros agrietados y salta más. Te bajas si te golpean.' },
    { id: 'fruta',      ch: 'f', grupo: 'objeto', region: 0, nombre: 'Fruta de bonus', color: '#ff7ab8', forma: 'icon', ic: '◆', estado: 'nuevo',
      que: 'Solo en las etapas bonus: cómelas todas antes del tiempo.' },
    { id: 'final',      ch: 'F', grupo: 'objeto', region: 8, nombre: 'Final', color: '#ffffff', forma: 'icon', ic: '★', estado: 'hecho',
      que: 'Tocarlo termina el juego.' },
    // Poliedros sonoros: se generan abajo desde POLIEDROS (letra y + opción forma)
    // Instrumentos perdidos (todos con la letra j)
    { id: 'instrumento', ch: 'j', grupo: 'objeto', region: 1, nombre: 'Instrumento perdido', color: '#e9c46a', forma: 'icon', ic: '♬', estado: 'nuevo',
      que: 'Uno por región: abre su ficha en el Catálogo de músicas.',
      props: { cual: ['cuerdas', 'tambor', 'hueso', 'cuerno', 'madera', 'canas', 'caracola'] }, preset: { cual: 'cuerdas' } },

    // --- Salidas por los bordes ---
    { id: 'salida', ch: ':', grupo: 'puerta', region: 0, nombre: 'Paso a otra sala', color: '#7be0a0', forma: 'water', ic: '⇥', estado: 'nuevo',
      que: 'Paso libre: se pinta donde se cruza a la sala vecina (un hueco en el borde o una entrada en una pared). Queda abierto y al tocarlo pasas a la otra sala. En la pestaña Nivel dices a qué sala lleva.' },
    { id: 'sello', ch: 'A', grupo: 'puerta', region: 0, nombre: 'Sello de poder', color: '#c9b8e3', forma: 'full', ic: '✧', estado: 'nuevo',
      que: 'Bloque con el símbolo de un poder: es sólido y no deja pasar hasta que tienes ese poder. Úsalo para cerrar un paso que pide un poder.',
      props: { poder: 'poder' }, preset: { poder: 'doubleJump' } },
    { id: 'piedraPoder', ch: 'U', grupo: 'puerta', region: 0, nombre: 'Piedra del poder', color: '#b8b2a7', forma: 'icon', ic: '◈', estado: 'nuevo',
      que: 'Piedra tallada con el símbolo del poder que pide un paso, para ponerla al lado: gris si no lo tienes, brilla si lo tienes. No bloquea.',
      props: { poder: 'poder' }, preset: { poder: 'doubleJump' } },
    { id: 'puertaColor', ch: 'Y', grupo: 'puerta', region: 0, nombre: 'Puerta de color', color: '#9FD3E0', forma: 'icon', ic: '▥', estado: 'nuevo',
      que: 'Puerta que solo abre la llave de su color. Va en el paso hacia la zona siguiente.',
      props: { color: 'llave' }, preset: { color: 'celeste' } },
    { id: 'llaveColor', ch: 'K', grupo: 'objeto', region: 0, nombre: 'Llave de color', color: '#9FD3E0', forma: 'icon', ic: '⚿', estado: 'nuevo',
      que: 'Normalmente la da el jefe de la zona. Ponla a mano solo si quieres que esté escondida en el mapa.',
      props: { color: 'llave' }, preset: { color: 'celeste' } },
    // --- Puertas ---
    { id: 'puertaD', ch: 'D', grupo: 'puerta', region: 0, nombre: 'Puerta de misión (vieja)', color: '#e0a83a', forma: 'icon', ic: 'D', estado: 'hecho', viejo: true,
      que: 'Ya no se usa en salas nuevas: la reemplaza el Tótem de la canción. Queda para leer los niveles viejos.' },
    { id: 'puertaR', ch: 'R', grupo: 'puerta', region: 0, nombre: 'Puerta de salida (R)', color: '#6fb7ff', forma: 'icon', ic: 'R', estado: 'hecho',
      que: 'Solo en salitas y salas secretas: vuelve a la puerta por la que entraste. Entre salas principales se usan los pasos.' },
    { id: 'puertaN', ch: 'N', grupo: 'puerta', region: 0, nombre: 'Puerta de atajo (vieja)', color: '#c98a3a', forma: 'icon', ic: 'N', estado: 'hecho', viejo: true,
      que: 'Ya no se usa: los atajos son pasos o tótems. Queda para leer los niveles viejos.', pide: 'dash' },
    { id: 'puertaE', ch: 'E', grupo: 'puerta', region: 0, nombre: 'Puerta de poder (E)', color: '#9b6bd6', forma: 'icon', ic: 'E', estado: 'hecho',
      que: 'Lleva a una sala secreta. Pide un poder: al lado va su piedra con el símbolo.',
      props: { destino: 'nivel', pide: 'poder' }, preset: {} },
    { id: 'portal', ch: 'W', grupo: 'puerta', region: 0, nombre: 'Tótem de la canción', color: '#5ff2e6', forma: 'icon', ic: '◎', estado: 'nuevo',
      que: 'Uno por sala principal (reemplaza a la puerta de misión). Al tocarlo empieza la misión: las corcheas despiertan. Con la llave vuelves a él y la sala se afina. Después queda encendido y es un portal a los otros tótems encendidos.' },
    { id: 'puertaQ', ch: 'Q', grupo: 'puerta', region: 0, nombre: 'Puerta de salita (Q)', color: '#7ad1b8', forma: 'icon', ic: 'Q', estado: 'nuevo',
      que: 'Entra a una salita: tienda, descanso, cofre, cartel o etapa bonus.',
      props: { destino: 'nivel', tipo: ['tienda', 'descanso', 'cofre', 'cartel', 'bonus'] }, preset: { tipo: 'tienda' } },

    // --- Enemigos (los nuevos comparten la letra %: el tipo va en sus opciones) ---
    { id: 'escarabajo', ch: 'e', grupo: 'enemigo', region: 1, nombre: 'Escarabajo', color: '#3a6fd1', forma: 'icon', ic: 'e', estado: 'hecho',
      que: 'Camina y se da vuelta en bordes y paredes. Pisarlo.', suelta: '1 maíz, 1 moneda' },
    { id: 'cuy',        ch: 'u', grupo: 'enemigo', region: 1, nombre: 'Cuy patrullero', color: '#c8955a', forma: 'icon', ic: 'u', estado: 'hecho',
      que: 'Patrulla; si te ve, corre hacia ti. Pisarlo.', suelta: '1 moneda' },
    { id: 'disparador', ch: 'd', grupo: 'enemigo', region: 1, nombre: 'Disparador de semillas', color: '#9be36b', forma: 'icon', ic: 'd', estado: 'hecho',
      que: 'Vaina quieta que dispara en línea recta. Pisarla.', suelta: '1 maíz, 1 moneda' }
  ];

  // Enemigos nuevos: letra % y el tipo en sus opciones
  const ENEMIGOS_NUEVOS = [
    [1, 'paloma',      'Paloma de lata',       '#9aa3b5', 'Vuela en línea; si pasas debajo, baja en picada. Pisarla.'],
    [2, 'oruga',       'Oruga de muro',        '#8fd16b', 'Rodea las plataformas por arriba, los lados y abajo. Pisarla arriba.'],
    [2, 'colibri',     'Colibrí relámpago',    '#5ce0c8', 'Vuela en onda y se lanza en picada. Pisarlo tras la picada.'],
    [2, 'mono',        'Mono de las cañas',    '#a8794a', 'Cuelga de las cañas y tira frutos. Pisarlo o dash.'],
    [2, 'barrendero',  'Autómata barrendero',  '#b0b8c4', 'Camina y te empuja hacia atrás con su escoba. Pisarlo.'],
    [3, 'murcielago',  'Murciélago de cobre',  '#b87333', 'Cuelga del techo y cae al pasar debajo. Pisarlo en el suelo.'],
    [3, 'rueda',       'Rueda de piedra',      '#8a8296', 'Rueda por pendientes y plataformas. Saltarla; el dash la rompe.'],
    [3, 'escorpion',   'Escorpión de cristal', '#9fe8ff', 'Dispara cristales en arco. Pisarlo de espaldas.'],
    [3, 'topo',        'Topo taladro',         '#7a5a48', 'Sale del suelo bajo tus pies. Pisarlo cuando asoma.'],
    [6, 'rana',        'Rana saltarina',       '#6bd17a', 'Salta del agua y estira la lengua. Pisarla fuera del agua.'],
    [6, 'pez',         'Pez bigotón',          '#e0a85a', 'Embiste bajo el agua. Esquivarlo o golpe de buceo.'],
    [6, 'libelula',    'Libélula espejo',      '#c4e6ff', 'Vuela en zigzag y brilla antes de cambiar de dirección. Pisarla.'],
    [6, 'garza',       'Garza de alambre',     '#e6e2f0', 'Picotea desde arriba de los juncos. Pisarla.'],
    [5, 'bolaNieve',   'Bola de nieve',        '#f2f6ff', 'Rueda y crece. Romperla con dash.'],
    [5, 'zorro',       'Zorro de escarcha',    '#ffb38a', 'Corre y salta hacia ti. Pisarlo.'],
    [5, 'nubeGranizo', 'Nube de granizo',      '#a8b8d8', 'Flota y suelta granizo que rebota. Esquivarla o pisarla.'],
    [5, 'vizcacha',    'Vizcacha de hielo',    '#d8d0c0', 'Salta en parábolas largas. Pisarla al caer.'],
    [4, 'armadillo',   'Armadillo acorazado',  '#a0806a', 'Bloquea de frente. Por detrás o con zapateo.'],
    [4, 'gusanoTierra','Gusano de terraza',    '#c97a5a', 'Sale de la tierra de las terrazas. Zapateo.'],
    [4, 'brasa',       'Brasa saltarina',      '#ff7a3a', 'Bola de fuego que rebota. Esquivarla.'],
    [4, 'espantajo',   'Espantapájaros de latón', '#d6b36a', 'Gira y lanza paja en tres direcciones. Pisarlo.'],
    [7, 'eco',         'Eco',                  '#8a7ad8', 'Sombra que copia tus movimientos con retraso. Pisarla.'],
    [7, 'centinela',   'Centinela de piedra',  '#8a87a8', 'Dispara cuando estás en su vista. Pisarlo por arriba.'],
    [7, 'lampara',     'Lámpara flotante',     '#ffe9a8', 'Ve a través de la niebla y te sigue. Pisarla.'],
    [7, 'ojoNiebla',   'Ojo de niebla',        '#c4b5ff', 'Abre la niebla a su alrededor y lanza destellos. Caracol para verlo.'],
    [8, 'sombraSilencio', 'Sombra del Silencio', '#5a5670', 'Versiones rápidas de enemigos anteriores.']
  ];
  POLIEDROS.forEach(function (c) {
    PIEZAS.push({ id: 'poliedro_' + c.id, ch: 'y', grupo: 'objeto', region: c.region, nombre: c.nombre, color: c.color,
                  forma: 'icon', ic: c.ic, estado: 'nuevo', que: 'Poliedro sonoro: ' + c.que,
                  props: { forma: 'poliedro' }, preset: { forma: c.id } });
  });
  ENEMIGOS_NUEVOS.forEach(function (e) {
    PIEZAS.push({ id: e[1], ch: '%', grupo: 'enemigo', region: e[0], nombre: e[2], color: e[3], forma: 'icon',
                  ic: e[2][0].toLowerCase(), estado: 'nuevo', que: e[4], suelta: '1 a 3 monedas',
                  props: { tipo: 'enemigo' }, preset: { tipo: e[1] } });
  });

  // ---------- Jefes (letra J; cuál es se elige en los datos del nivel) ----------
  // mmx: de qué jefe de Mega Man X (SNES) se copian los ataques
  const JEFES = [
    { id: 'bombo',       region: 1, nombre: 'Guardián del Tambor',   da: 'doubleJump', llave: 'celeste', estado: 'hecho', sala: 'n3', mmx: 'Chill Penguin',
      que: 'A: rueda de pared a pared. B: se cuelga del techo y su redoble levanta un ventarrón.' },
    { id: 'charanguero', region: 1, nombre: 'El Rasgueador',         da: 'monedas',    estado: 'hecho', sala: 'j1', mmx: 'Armored Armadillo',
      que: 'A: se enrolla como bola y rebota. B: dispara notas.' },
    { id: 'huaca',       region: 1, nombre: 'Tótem de Piedra',       da: 'poliedro',   estado: 'hecho', sala: 'j2', mmx: 'Boomer Kuwanger',
      que: 'A: desaparece y reaparece junto a la papa. B: lanza su corona como bumerán.' },
    { id: 'cuy',         region: 2, nombre: 'Cuy Gigante',           da: 'wallJump', llave: 'verde',   estado: 'hecho', sala: 'n6', mmx: 'Spark Mandrill',
      que: 'A: embestida hasta la pared. B: se cuelga del techo, cae y suelta chispas por el suelo y las paredes.' },
    { id: 'prensa',      region: 2, nombre: 'La Prensa del Taller',  da: 'poliedro',   estado: 'nuevo', sala: 's4', mmx: 'Flame Mammoth',
      que: 'A: salto que sacude la arena y cambia el sentido de las cintas. B: aceite y una chispa que lo enciende.' },
    { id: 'gusano',      region: 3, nombre: 'Gusano Taladro',        da: 'dash', llave: 'naranja',       estado: 'nuevo', sala: 'n9',
      que: 'Sale de las paredes y deja túneles.' },
    { id: 'geoda',       region: 3, nombre: 'Geoda Viva',            da: 'airDash',    estado: 'nuevo', sala: 's5',
      que: 'Roca de cristal que rueda y estalla en esquirlas.' },
    { id: 'toro',        region: 4, nombre: 'Toro de las Terrazas',  da: 'stomp', llave: 'rosa',      estado: 'nuevo', sala: 'n12',
      que: 'Embiste de terraza en terraza y rompe el suelo.' },
    { id: 'espantapajaros', region: 4, nombre: 'Espantapájaros Mayor', da: 'monedas',  estado: 'nuevo', sala: 's6',
      que: 'Gira, se divide en paja y se arma de nuevo.' },
    { id: 'oso',         region: 5, nombre: 'Oso de Escarcha',       da: 'glide', llave: 'lavanda',      estado: 'nuevo', sala: 'n15',
      que: 'Golpea el suelo y hace caer carámbanos.' },
    { id: 'reina',       region: 5, nombre: 'Reina del Granizo',     da: 'charge',     estado: 'nuevo', sala: 's7',
      que: 'Flota y llena la arena de granizo que rebota.' },
    { id: 'rana',        region: 6, nombre: 'Rana Gigante del Lago', da: 'dive', llave: 'azul',       estado: 'nuevo', sala: 'n18',
      que: 'Salta entre islas y atrapa con la lengua.' },
    { id: 'linterna',    region: 6, nombre: 'Pez Linterna Abisal',   da: 'shrink',     estado: 'nuevo', sala: 's8',
      que: 'Pelea a oscuras: solo se ve su luz.' },
    { id: 'condor',      region: 7, nombre: 'Cóndor de Bronce',      da: 'shell', llave: 'dorada',      estado: 'hecho', sala: 'n21', mmx: 'Storm Eagle',
      que: 'A: cruza la arena soltando cocos. B: picadas desde las esquinas. Uno de los últimos jefes.' },
    { id: 'sombra',      region: 7, nombre: 'La Doble Sombra',       da: 'poliedro',   estado: 'nuevo', sala: 's9',
      que: 'Copia tus poderes.' },
    { id: 'silencio',    region: 8, nombre: 'El Silencio',           da: 'final',      estado: 'nuevo', sala: 'n22',
      que: 'La máquina gris. Apaga el sonido de la arena: hay que guiarse por la vista.' },
    { id: 'silencio_verdadero', region: 8, nombre: 'El Silencio verdadero', da: 'final', estado: 'nuevo', sala: 's11',
      que: 'Final verdadero. Pelea con todas las canciones del catálogo sonando.' }
  ];
  PIEZAS.push({ id: 'jefe', ch: 'J', grupo: 'jefe', region: 0, nombre: 'Jefe (lugar donde aparece)', color: '#c0392b',
                forma: 'icon', ic: 'J', estado: 'hecho', que: 'Cuál jefe es se elige en los datos del nivel. Todos se sacuden si la papa se queda sobre su cabeza.' });

  // ---------- Decoración (capa "deco"): sin colisión, solo se ve ----------
  // fondo: detrás de los bloques (más oscura) · frente: delante de la papa (algo transparente)
  // w y h en bloques; la letra marca la esquina de abajo a la izquierda
  const DECO = [
    // Base
    ['pared',      '#', 0, 'Pared de fondo',        1, 1, 'fondo', '#3a3348', 'Píntala detrás de pasillos y cuartos: se lee "estoy adentro".'],
    ['pasto',      ',', 0, 'Pasto alto',            1, 1, 'frente', '#6bbf59', 'Sobre los bordes del suelo.'],
    ['flores',     'f', 0, 'Flores',                1, 1, 'fondo', '#ff8fb1', 'Manchas de color sobre el suelo.'],
    ['piedritas',  ':', 0, 'Piedritas',             1, 1, 'fondo', '#9a93a8', 'Detalle sobre el suelo.'],
    ['enredadera', 'v', 0, 'Enredadera',            1, 3, 'frente', '#4f9a4a', 'Cuelga de una repisa.'],
    ['farol',      'l', 0, 'Farol',                 1, 3, 'fondo', '#ffd34d', 'Da una luz cálida.'],
    ['cadena',     'c', 0, 'Cadena colgante',       1, 2, 'fondo', '#8a8296', 'Cuelga del techo.'],
    ['ventana',    'w', 0, 'Ventana iluminada',     1, 1, 'fondo', '#ffe9a8', 'Para la pared de fondo.'],
    // Región 1 · Ciudad Ocaso
    ['casa',       'h', 1, 'Casa',                  4, 4, 'fondo', '#c97b6a', 'Casa de techo inclinado.'],
    ['edificio',   'H', 1, 'Edificio alto',         4, 8, 'fondo', '#9a7bb0', 'Edificio con ventanas.'],
    ['edificioB',  'e', 1, 'Edificio bajo',         5, 5, 'fondo', '#b08a9a', 'Edificio de dos pisos.'],
    ['antena',     'a', 1, 'Antena',                1, 4, 'fondo', '#8a8296', 'Antena de techo con luz roja.'],
    ['tanque',     't', 1, 'Tanque de agua',        2, 3, 'fondo', '#7a8aa0', 'Sobre los techos.'],
    ['letrero',    'n', 1, 'Letrero luminoso',      3, 2, 'fondo', '#ff6bd6', 'Letrero que parpadea.'],
    ['molino',     'm', 1, 'Molino',                3, 6, 'fondo', '#e6e2f0', 'Molino de viento que gira.'],
    ['bote',       'b', 1, 'Bote',                  4, 2, 'fondo', '#c98a3a', 'Bote amarrado.'],
    // Región 2 · Barrio de Cañas
    ['canaAlta',   'B', 2, 'Caña alta',             1, 8, 'fondo', '#7bd389', 'Caña gigante.'],
    ['canaBaja',   'j', 2, 'Caña baja',             1, 4, 'frente', '#5ab86a', 'Caña delante de la papa.'],
    ['helecho',    'F', 2, 'Helecho',               2, 2, 'frente', '#4fa060', 'Hojas grandes.'],
    ['liana',      'L', 2, 'Liana',                 1, 4, 'frente', '#6a9a3a', 'Cuelga de lo alto.'],
    ['engranaje',  'G', 2, 'Engranaje',             3, 3, 'fondo', '#a0a8b8', 'Gira despacio en la pared del taller.'],
    ['tuberia',    'T', 2, 'Tubería',               1, 1, 'fondo', '#7a8494', 'Píntala en línea.'],
    ['pantalla',   'S', 2, 'Pantalla',              2, 2, 'fondo', '#6bf0ff', 'Pantalla que muestra ondas de sonido apagadas.'],
    // Región 3 · Minas de Cristal
    ['rocaGrande', 'R', 3, 'Roca grande',           3, 2, 'fondo', '#6d6a8a', 'Roca al pie de la pared.'],
    ['rocaChica',  'r', 3, 'Roca chica',            1, 1, 'fondo', '#8a87a8', 'Piedra suelta.'],
    ['estalactita','E', 3, 'Estalactita',           1, 2, 'fondo', '#9a93b0', 'Cuelga del techo.'],
    ['estalagmita','A', 3, 'Estalagmita',           1, 2, 'fondo', '#9a93b0', 'Sale del suelo.'],
    ['cristal',    'C', 3, 'Cristal',               1, 2, 'fondo', '#6fd6ff', 'Brilla suave.'],
    ['viga',       'V', 3, 'Viga de madera',        1, 4, 'fondo', '#8a6a4a', 'Sostiene la galería.'],
    // Región 6 · Lago Espejo
    ['juncos',     'J', 6, 'Juncos',                1, 3, 'frente', '#b8c46b', 'Se mueven con el viento.'],
    ['islaJuncos', 'I', 6, 'Isla de juncos',        4, 2, 'fondo', '#c9b46b', 'Isla flotante a lo lejos.'],
    ['nenufar',    'N', 6, 'Nenúfar',               2, 1, 'fondo', '#6bd17a', 'Sobre el agua.'],
    ['musgo',      'O', 6, 'Piedra con musgo',      2, 1, 'fondo', '#6a8a5a', 'En la orilla.'],
    // Región 5 · Cumbres de Escarcha
    ['pino',       'P', 5, 'Pino nevado',           3, 5, 'fondo', '#5a8a7a', 'Árbol con nieve.'],
    ['carambano',  'K', 5, 'Carámbano',             1, 2, 'fondo', '#d8f0ff', 'Hielo colgante (decorativo).'],
    ['rocaNevada', 'Y', 5, 'Roca nevada',           2, 2, 'fondo', '#c8d8e8', 'Roca con nieve encima.'],
    ['copos',      '*', 5, 'Copos',                 1, 1, 'frente', '#ffffff', 'Nieve cayendo.'],
    // Región 4 · Terrazas Colgantes
    ['muroTallado','X', 4, 'Muro de piedra tallada',1, 1, 'fondo', '#8a7a6a', 'Píntalo como pared de fondo.'],
    ['arbusto',    'Q', 4, 'Arbusto',               2, 1, 'frente', '#6a9a4a', 'En el borde de la terraza.'],
    ['cerca',      'U', 4, 'Cerca de piedra',       3, 1, 'fondo', '#9a8a7a', 'Separa las terrazas.'],
    ['maizal',     'M', 4, 'Maizal',                1, 3, 'frente', '#e8c84a', 'Plantas de maíz.'],
    // Región 7 · Ciudadela de Niebla
    ['columna',    'D', 7, 'Columna',               1, 6, 'fondo', '#b8b0c8', 'Columna de templo.'],
    ['arco',       'q', 7, 'Arco de piedra',        5, 5, 'fondo', '#a8a0b8', 'Arco de entrada.'],
    ['estatua',    'u', 7, 'Estatua sin rostro',    2, 4, 'fondo', '#9a93b0', 'Figura antigua y lisa.'],
    ['nube',       'o', 7, 'Nube',                  4, 2, 'frente', '#e6e2f0', 'Pasa delante, algo transparente.'],
    ['lampara',    'i', 7, 'Lámpara colgante',      1, 2, 'fondo', '#ffe9a8', 'Luz entre la niebla.'],
    // Región 8 · El Gran Silencio
    ['grieta',     'z', 8, 'Grieta de silencio',    2, 2, 'fondo', '#2a2638', 'Hueco gris donde no hay sonido.'],
    ['notasApagadas','s', 8, 'Notas apagadas',      1, 1, 'fondo', '#5a5670', 'Notas grises flotando.']
  ].map(function (d) {
    return { id: d[0], ch: d[1], grupo: 'deco', region: d[2], nombre: d[3], w: d[4], h: d[5],
             capa: d[6], color: d[7], que: d[8], estado: 'nuevo' };
  });

  // Búsquedas rápidas
  const PIEZA_POR_CH = {};
  PIEZAS.forEach(function (p) { if (!PIEZA_POR_CH[p.ch]) PIEZA_POR_CH[p.ch] = p; });
  const DECO_POR_CH = {};
  DECO.forEach(function (d) { DECO_POR_CH[d.ch] = d; });

  return {
    VERSION: 5,
    PANTALLA: [20, 11],
    REGIONES: REGIONES, TEMAS: TEMAS, TIPOS: TIPOS, NIVELES: NIVELES,
    MUSICAS: MUSICAS, nombreMusica: nombreMusica,
    PODERES: PODERES, POLIEDROS: POLIEDROS, INSTRUMENTOS: INSTRUMENTOS, LLAVES: LLAVES,
    BONUS: BONUS, TIENDA: TIENDA, MERCADERES: MERCADERES,
    PIEZAS: PIEZAS, JEFES: JEFES, DECO: DECO,
    PIEZA_POR_CH: PIEZA_POR_CH, DECO_POR_CH: DECO_POR_CH,
    VACIO: '.'
  };
})();
