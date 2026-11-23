const CONFIG = {
  GAME_VERSION: 'v98',   // se ve abajo a la izquierda en la pantalla de inicio
  WIDTH: 320,             // la cámara muestra 20 x 11 bloques
  HEIGHT: 180,
  TILE: 16,
  STEP: 1 / 60,
  CAMERA_LERP: 0.15,
  // Letra: geométrica (Josefin Sans), de líneas rectas como el tejido. FONT_SCALE agranda
  // los tamaños pensados para la letra pixel de antes (era más ancha y alta) y
  // FONT_WEIGHT la engrosa
  FONT: '"Josefin Sans", "Trebuchet MS", sans-serif',
  FONT_SCALE: 1.45,
  FONT_WEIGHT: 600,

  // Contraste del plano de juego (para que no se confunda con el fondo)
  OUTLINE: {
    ITEM: '#F3E6CC',                        // contorno de monedas, cubos, llaves y demás objetos
    RIM_TOP: 'rgba(243, 230, 204, 0.85)',   // borde claro arriba de cada plataforma
    RIM_SIDE: 'rgba(243, 230, 204, 0.4)',   // borde de los lados que dan al aire
    RIM_UNDER: 'rgba(27, 20, 38, 0.55)',    // línea oscura debajo de las plataformas que flotan
    RIM_WIDTH: 1                            // grosor en px del juego
  },
  MAX_RENDER_SCALE: 4,    // el lienzo dibuja hasta 4x más fino (sprites a 4x)
  TITLE_MENU: { TOP: 76, STEP: 10, LEFT: 176 },   // filas del menú de inicio (para tocarlas)
  TITLE_PORTADA: false,   // true: la pantalla de inicio usa portada.png y logo.png en vez de la escena animada
  LANG_MENU: { TOP: 104, STEP: 16 },      // filas del menú de idioma (la primera vez)
  GAME_OVER_MENU: { TOP: 96, STEP: 16 },   // filas del menú de game over
  COLORS: {
    SMOKE: '#e8e4ff',        // humo que lleva a la llave y a la puerta
    NOTE_SMOKE: '#e9c46a'    // humo dorado a la corchea más cercana (solo en Fácil)
  },   // filas del menú de dificultad (para tocarlas)

  GAME: {
    MERGE_TIME: 2.5,      // segundos del mix (los instrumentos se juntan y la papa baila)
    MAX_HEARTS: 10,       // corazones máximos (3 al empezar + 7 retos)
    CUBES_PER_LIFE: 5,    // 5 cubos sonoros = 1 corazón recuperado
    BEATS_PER_SWITCH: 4,  // cada cuántos pulsos cambian las plataformas rítmicas
    MESSAGE_TIME: 3,      // segundos que dura un mensaje
    MESSAGE_SPEED: 0.55,  // los mensajes de paso duran esto del tiempo pedido (más rápidos)
    MISSION_MESSAGE: 5,   // segundos de los mensajes de misión (empezó, tiempo acabado)
    READY_DELAY: 0.4,     // portada, menú y GAME START: espera antes de aceptar
    HURT_TIME: 1,         // invulnerable tras perder una vida
    END_DELAY: 1,         // espera antes de aceptar toques en pantallas finales
    START_ABILITIES: [],  // nivel 1: solo correr y saltar
    SETTINGS_KEY: 'chasqui_opciones', // volumen y vibración elegidos en la pausa
    RECORDS_KEY: 'chasqui_records',   // mejores tiempos y Nueva partida + desbloqueada
    SAVE_KEY: 'chaskido_partida',     // la partida guardada (posta o menú de pausa)
    FIRST_ROOM: 'p1',                 // donde empieza una partida nueva (el prólogo)
    WORLD_ROOM: 'n2',                 // la primera sala del mundo (Nueva partida + empieza aquí)
    FULL_COLOR_ROOMS: ['n2'],         // salas que empiezan con todo su color (sin afinar)
    FADE_TIME: 0.22,      // fundido al pasar de una sala a otra
    ENTRY_BOOST: 420,     // empujón hacia arriba al entrar a una sala desde abajo
    BANNER_TIME: 3.2,     // cartel con el nombre de la sala al entrar
    REWARD_AURA: 2.2,     // segundos del aura al ganar un poder
    TIP_MAX: 3,             // veces que sale cada consejo en toda la partida
    TIP_TIME: 3.5,        // segundos que dura una explicación corta (abajo)
    // Con la llave, el contador se infla cada 10 segundos para llamar la atención
    TIMER_PULSE_EVERY: 10,
    TIMER_PULSE_TIME: 0.45,
    TIMER_PULSE_SCALE: 1.8
  },

  // Dificultad: se elige al empezar. MISSION_TIME > 0: la misión entera
  // (desde abrir la puerta) tiene ese tiempo y se guarda el récord.
  // ENDING: final que se ve al tocar el objeto final (F).
  DIFFICULTY: {
    LIST: ['easy', 'normal', 'hard'],
    DEFAULT: 'normal',
    // LIVES: corazones al empezar (cada reto suma uno, hasta CONFIG.GAME.MAX_HEARTS)
    easy:   { NAME: 'Fácil',   LIVES: 5, DAMAGE: 1, MISSION_TIME: 0,   ENDING: 'bad', NOTE_SMOKE: true },
    normal: { NAME: 'Normal',  LIVES: 3, DAMAGE: 1, MISSION_TIME: 0,   ENDING: 'normal' },
    hard:   { NAME: 'Difícil', LIVES: 3, DAMAGE: 2, MISSION_TIME: 120, ENDING: 'true' }
  },
  // Jefes según la dificultad. HP_MAX: golpes como máximo; REST_SCALE: cuánto más dura
  // el descanso (cuando se le puede pisar); REST_MAX: descanso máximo en segundos
  BOSS_DIFFICULTY: {
    easy:   { HP_MAX: 4, REST_SCALE: 1.6 },
    normal: { REST_SCALE: 1 },
    hard:   { REST_SCALE: 1, REST_MAX: 1.0 }
  },

  // Nueva partida +: se desbloquea con el final de Difícil; empieza con estas habilidades
  NEW_GAME_PLUS_ABILITIES: ['dash', 'hook', 'tuner'],

  // Volumen inicial (de 0 a 10), se cambia en el menú de pausa
  VOLUME: {
    MUSIC: 6,
    SFX: 5,
    MASTER: 10,
    STEPS: 10
  },

  // Habilidades (modo prueba: teclas 1 a 6 en este orden). La skin provisional
  // usa el color de la última de la lista que esté activa.
  // say: cómo se nombra en los avisos; text: lo que se explica al ganarla
  ABILITIES: [
    // (el diapasón va primero: no cambia el color de la papa)
    { id: 'tuner',      name: 'Diapasón', key: 'KeyY', say: 'el diapasón',
      text: 'Ganaste el diapasón: F o Triángulo. Toque corto = La, mantener y soltar = Si.' },
    { id: 'dash',       name: 'Dash',   key: 'Digit1', say: 'el dash',
      text: 'Ganaste el dash: R2 o Shift. Rompe los muros agrietados.' },
    { id: 'wallJump',   name: 'Pared',  key: 'Digit2', say: 'el salto en la pared',
      text: 'Ganaste el salto en la pared: pégate a una pared y salta.' },
    { id: 'airDash',    name: 'Aire',   key: 'Digit3', say: 'el dash en el aire',
      text: 'Ganaste el dash en el aire: R2 o Shift mientras saltas.' },
    { id: 'doubleJump', name: 'Doble',  key: 'Digit4', say: 'el doble salto',
      text: 'Ganaste el doble salto: salta otra vez en el aire.' },
    { id: 'hook',       name: 'Gancho', key: 'Digit5', say: 'el gancho',
      text: 'Ganaste el gancho: cerca de una anilla pulsa E o Cuadrado.' },
    { id: 'glide',      name: 'Planeo', key: 'Digit6', say: 'el planeo',
      text: 'Ganaste el planeo: mantén el salto mientras caes y bajas despacio.' },
    { id: 'stomp',      name: 'Zapateo', key: 'KeyU',  say: 'el zapateo',
      text: 'Ganaste el zapateo: abajo + salto en el aire. Rompe los suelos agrietados.' },
    { id: 'dive',       name: 'Buceo',  key: 'KeyI',   say: 'el buceo',
      text: 'Ganaste el buceo: abajo dentro del agua para sumergirte.' },
    // Fermata (id 'shell' por las partidas guardadas): la da el Cóndor de Bronce
    { id: 'shell',      name: 'Fermata', key: 'KeyO',  say: 'la fermata',
      text: 'Ganaste la fermata: quieta, mantén E o Cuadrado y el tiempo se detiene un momento. Los enemigos y sus disparos se congelan, y aparece lo escondido en la niebla.' },
    { id: 'quena',      name: 'Quena', key: 'KeyH',  say: 'el llamado de la quena',
      text: 'Ganaste el llamado de la quena: cerca de un animal, toca E o Cuadrado y queda libre. Ahora entiendes a los animales: mira el Códex en la pausa.' },
    { id: 'zampona',    name: 'Zampoña', key: 'KeyJ',  say: 'la zampoña',
      text: 'Ganaste la zampoña: con R1 y los botones tocas las 7 notas del diapasón; cada nota deja un escalón de su color que dura un compás.' }
  ],

  // Skin provisional: color según la última habilidad obtenida
  SKINS: {
    dash: '#6fd3ff',
    wallJump: '#7be07b',
    airDash: '#ffb347',
    doubleJump: '#ff7ad9',
    hook: '#f0b860',
    glide: '#b8e0ff',
    dive: '#6fa8c7',
    shell: '#f7e3a1',
    quena: '#9fe3c8'
  },

  // ---------- Dibujos "Tejido HD" ----------
  // Las hojas HD (cada cuadro al doble de pixeles) se dibujan más grandes: scale veces su
  // tamaño del juego. anchor 'bottom' las apoya en el piso (papa, corcheas); 'center' las
  // agranda desde el medio (lo que se junta). Una hoja vieja se sigue dibujando igual
  // Las hojas HD sin grupo (retratos, bloques, bordes...) se dibujan a su tamaño (scale 1).
  // ENEMY_HIT y BOSS_HIT agrandan el cuerpo de choque de enemigos y jefes
  HD: {
    DENSITY: 8,           // pixeles de la hoja HD por pixel del juego
    ENEMY_HIT: 1.15,
    BOSS_HIT: 1.05,
    GROW: [
      { prefix: 'papa_', scale: 1.0, anchor: 'bottom' },       // (v78: 25 % más chicos; los choques no cambian)
      { prefix: ['sprite_', 'instrumento_'], scale: 1.15, anchor: 'center' },
      { names: ['corchea', 'corchea_alerta', 'corchea_huir'], scale: 1.0, anchor: 'bottom' },
      { names: ['moneda', 'moneda_chica', 'fruta', 'fruto', 'maiz', 'aji', 'cubo', 'corazon_extra',
                'llave', 'llave_color', 'nota_escala'], scale: 0.86, anchor: 'center' },
      // Enemigos que vuelan o cuelgan: crecen desde el medio
      { prefix: ['paloma_', 'colibri_', 'libelula_', 'nube_granizo', 'murcielago_', 'mono_'], scale: 0.86, anchor: 'center' },
      // Enemigos que caminan: apoyados en el piso
      { prefix: ['escarabajo_', 'cuy_', 'disparador_', 'oruga_', 'barrendero_', 'rueda_', 'escorpion_', 'topo_',
                 'armadillo_', 'brasa_', 'zorro_', 'bola_nieve', 'vizcacha_', 'rana_', 'pez_', 'garza_'], scale: 0.86, anchor: 'bottom' },
      // Jefes
      { prefix: ['bombo_', 'charanguero_', 'huaca_', 'cuygig_', 'gusano_', 'toro_', 'oso_', 'ranagig_', 'condor_', 'eco_'],
        scale: 1.15, anchor: 'bottom' }
    ]
  },

  // ---------- Puertas de color -> muros de nota ----------
  // Cada puerta de color se vuelve el muro de la nota que enseña el jefe de esa zona
  // ('.' = abierta; la dorada sigue y pide las 21 salas afinadas)
  DOOR_TO_WALL: { celeste: '5', verde: '6', naranja: '7', rosa: '8', lavanda: '9', azul: '.' },

  // ---------- Cámara que muestra la llave y el portón (salas con jefe) ----------
  CAMERA_PAN: { GO: 0.9, HOLD: 1.3, BACK: 0.9, LERP: 0.08, GATE_TIME: 1.1 },
  // La llave del jefe cae del cielo (HEIGHT px en FALL s) y después flota y gira
  KEY_DROP: { HEIGHT: 140, FALL: 0.7, BOB: 3, BOB_SPEED: 3, SPIN: 3 },

  // ---------- Jefes: etapa furiosa (bajo 1/3 de la vida) ----------
  BOSS_FURY: { EXTRA: 0.25, COLOR: '#ff3a5c' },

  // ---------- Fin: los poseídos y la fiesta ----------
  // Los animales están poseídos por el Silencio (aura oscura); al final se los ve libres
  POSSESSED: { COLOR: '#8a3fd1', N: 5, SPEED: 0.7 },   // partículas: color, cuántas y qué tan rápido suben
  ENDGAME: {
    ROOMS: 21,            // salas afinadas que pide la puerta dorada
    FIESTA_TIME: 14,      // segundos de la fiesta final (se puede pasar después de 4)
    // Quiénes bailan en la fiesta (si están sus dibujos)
    CAST: ['papa_quieta', 'corchea', 'gente1_bailar', 'gente2_bailar', 'gente3_bailar', 'gente4_bailar',
           'musico_cuerdas', 'musico_flauta', 'musico_tambor', 'mercader_quieto', 'cocinera_quieta', 'barrendero_caminar',
           'escarabajo_caminar', 'cuy_caminar', 'oruga_caminar', 'paloma_volar', 'colibri_volar', 'mono_colgar',
           'murcielago_colgado', 'escorpion_caminar', 'topo_asomar', 'armadillo_caminar', 'zorro_caminar', 'vizcacha_quieta',
           'rana_quieta', 'libelula_volar', 'garza_quieta', 'bombo_quieto', 'charanguero_tocar', 'huaca_quieta',
           'cuygig_mirar', 'gusano_quieto', 'toro_quieto', 'oso_quieto', 'ranagig_quieta', 'condor_volar', 'eco_flotar']
  },

  // ---------- Fermata (poder del Cóndor de Bronce, sala 21; id 'shell') ----------
  // Quieta (sin moverte) y con E o Cuadrado apretado HOLD segundos: el tiempo se sostiene,
  // como una nota con fermata. La onda congela a los enemigos y sus disparos FREEZE
  // segundos, hace aparecer las plataformas ocultas (h) para siempre y despeja la niebla (O)
  SHELL: {
    HOLD: 0.45,           // segundos apretando antes de soplar
    RADIUS: 7,            // bloques que alcanza la onda
    CLEAR_TIME: 6,        // segundos que la niebla queda despejada
    COOLDOWN: 0.8,
    WAVE_TIME: 0.9,       // lo que dura el dibujo de la onda
    FREEZE: 3,            // segundos que quedan congelados los enemigos cercanos y sus disparos
    FOG_ALPHA: 0.78,      // qué tan tapada está la niebla (0 a 1)
    FOG_COLOR: '#c9bfe6'
  },

  // Música: archivos en assets/music/
  LOAD_WAIT: 10,   // segundos máximos de "Cargando..." (después empieza igual)
  RETRY_AFTER: 3,  // segundos después de empezar: se piden otra vez los dibujos que no llegaron

  // Modo speedrun (js/speedrun.js): zonas que se eligen y sus salas
  // Guardián del portón: aparece junto al portón cerrado del jefe la primera vez que la
  // papa lo choca (js/vecinos.js). DX: a cuántos bloques del portón. Las frases pueden
  // ser funciones (reciben el juego) para decir cuántos instrumentos faltan.
  GATE_GUARD: {
    DX: 6, kind: 'tambor', color: '#e89a6b',
    BUBBLE: '¡Oye, tú!',
    AUTO_AFTER: 3,          // al tercer choque contra el portón, habla solo
    AUTO: '¿Intentaste juntar todos los instrumentos? Puedes revisar el mapa (Pausa) para ver dónde están.',
    // Lo primero que dice: una pista (no tan literal) de quién espera al otro lado
    TEASE: {
      n3: 'Ese de ahí dentro no es una papa... retumba como si tuviera el pecho hueco.',
      n6: 'Algo grande y peludo corre en círculos ahí dentro. No para nunca.',
      n9: 'El barro tiembla al otro lado. Algo cava sin descanso.',
      n12: 'Ahí dentro algo dorado bufa y raspa el piso. Yo no entraría de frente.',
      n15: 'Del otro lado hace un frío que muerde. Y algo grande ronca.',
      n18: 'Algo croa en el fondo. Tan fuerte que el agua se arruga.',
      n21: 'Allá arriba brillan alas de bronce. Cuidado con el viento.'
    },
    lines: [
      function (game) {
        return CONFIG.GATE_GUARD.TEASE[game.level.id] || 'Ese de ahí dentro no es una papa...';
      },
      function (game) {
        const left = game.instrumentos.list.filter(function (c) { return c.state !== 'caught'; }).length;
        return 'Este portón se abre cuando la sala vuelve a sonar. Te faltan ' + left + ' instrumentos: mira sus casillas arriba.';
      },
      '¿Intentaste juntar todos los instrumentos? Puedes revisar el mapa (Pausa) para ver dónde están.',
      'Los instrumentos huyen si te ven. Acércate por detrás o córtales el paso.',
      'Cuando los juntes todos, aparece la llave del jefe. Con ella se abre este portón.'
    ],
    after: ['¡Ya suena! El portón está abierto. Suerte con el jefe.']
  },

  // ---------- Lore: lo que cuenta el juego mientras se juega ----------
  // La ciudad de las papas vive de la música; el Silencio se la llevó y los animales,
  // sin música, se volvieron hostiles (aura oscura). La papa es un chasqui: el mensajero
  // que lleva la música de vuelta, sala por sala.
  LORE: {
    // El narrador habla una sola vez: al despertar en la cueva (p2), cuando la música
    // ya se fue. El resto del lore lo cuentan los vecinos.
    CUEVA: 'La música se fue...',
    // Escombros que siguen cayendo al llegar a la cueva
    ROCKS: { TIME: 2.4, EVERY: 0.09 },
    // Vendedores: una de estas frases al vender
    VENDEDORES: [
      'Antes cobraba en canciones. Ahora, sin música, solo me quedan monedas.',
      'Desde que llegó el Silencio, mis clientes ni silban. ¡Gracias por comprar!',
      'Llévalo, chasqui. Si traes la música de vuelta, la próxima te sale más barata.',
      'Mi abuelo vendía cuerdas de charango. Dicen que el Silencio las cortó todas.',
      'Cuando la sala vuelva a sonar, vuelvo a abrir la tienda con fiesta.'
    ]
  },

  // Llamado de la quena: libera a los animales a RADIUS bloques. Liberados quedan para
  // siempre en otra capa (detrás de la papa): pasean y bailan, ya no atacan ni se tocan.
  // FREED: ALPHA transparencia; WALK velocidad al pasear; FLOAT movimientos que flotan
  // en su lugar (SWAY bloques de lado, BOB de arriba a abajo)
  QUENA: {
    RADIUS: 3, COOLDOWN: 1.5,
    FREED: { ALPHA: 0.6, WALK: 18, FLOAT: ['fish', 'hail', 'bat', 'swoop', 'dart', 'zigzag'],
             SWAY: 14, SWAY_SPEED: 0.7, BOB: 3, BOB_SPEED: 2 }
  },

  // Zampoña (js/zampona.js): con R1 (o R) apretado, cada botón toca una nota y deja un
  // escalón de su color. La nota k (0 = Do ... 6 = Si) aparece k+1 bloques adelante y
  // k+1 bloques más arriba que los pies: Do, Re, Mi... arman una escalera. Cada escalón
  // dura BARS compases (al pulso de la música) y parpadea los últimos BLINK segundos.
  ZAMPONA: {
    NOTES: ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'],
    FREQ: { do: 523.25, re: 587.33, mi: 659.25, fa: 698.46, sol: 783.99, la: 880, si: 987.77 },
    BARS: 1, BEATS_PER_BAR: 4, STEP_H: 6, BLINK: 0.5,
    PAD_LABELS: ['✕', '○', '□', '△', 'L1', 'L2', 'R2'],
    KEY_LABELS: ['1', '2', '3', '4', '5', '6', '7']
  },

  // Indicador de pulso (js/pulso.js): una línea en la barra de arriba (Y, alto H) que
  // brilla en cada tiempo. Si tocas el diapasón o la zampoña justo en un tiempo
  // (TOLERANCE segundos antes o después), se pone verde y suena.
  PULSO: {
    TOLERANCE: 0.1, Y: 2, H: 10,
    LINE: '#8fe3ff', OK: '#6bd17a', OK_TIME: 0.35, CLICK_TIME: 0.12
  },

  // El Rasgueador y su charango (assets/music/charango.mp3, lo pones tú):
  // ROOMS: sus salas (ahí reemplaza la música, menos en la pelea); NEAR: en la sala de al
  // lado se oye al acercarse a la salida que lleva a él (RADIUS bloques). VOLUME 0.6 = 6.
  CHARANGO: {
    FILE: 'charango.mp3', VOLUME: 0.6, RADIUS: 12,
    ROOMS: ['j1', 'j7'],
    NEAR: { n2: 'j1', n20: 'j7' }
  },

  // ---------- Códex (js/codex.js) ----------
  // Se abre con la quena. Se anotan: las papas al hablarles, los jefes al vencerlos y
  // cada especie de animal cuando venciste o calmaste a todos los de esa especie del
  // juego (se cuentan solos desde los mapas). Suma al porcentaje de completado.
  CODEX: {
    TOAST: 2.4,              // segundos del aviso "Se agregó al Códex"
    // Nombres de guardianes, fiesta y vendedores: en js/personajes.js
    // Animales: nombre y una frase. Los que no están aquí no cuentan (vecinos, etc.)
    SPECIES: {
      beetle:     { name: 'Escarabajo de vereda', text: 'Caminaba al ritmo de los tambores. Sin música, solo empuja.' },
      cuy:        { name: 'Cuy', text: 'Antes silbaba con las flautas. Ahora corre asustado.' },
      shooter:    { name: 'Escupidor de semillas', text: 'Sembraba al compás. Hoy escupe semillas a quien pasa.' },
      oruga:      { name: 'Oruga', text: 'Soñaba con bailar con alas. Todavía no despierta.' },
      paloma:     { name: 'Paloma', text: 'Se posaba en los faroles de la fiesta. Ahora se lanza en picada.' },
      colibri:    { name: 'Colibrí', text: 'Zumbaba en La. Sin música, no sabe qué nota zumbar.' },
      mono:       { name: 'Mono', text: 'Tocaba maracas de semillas. Ahora las tira.' },
      murcielago: { name: 'Murciélago', text: 'Escuchaba los ecos de la mina. El Silencio lo dejó a ciegas.' },
      rueda:      { name: 'Rueda de piedra', text: 'Giraba en el molino al ritmo del agua.' },
      escorpion:  { name: 'Escorpión de cristal', text: 'Su cola sonaba como campanita. Ya no suena.' },
      topo:       { name: 'Topo', text: 'Cavaba siguiendo el bajo de la tierra.' },
      armadillo:  { name: 'Armadillo', text: 'Su caparazón era un charango. Ahora se enrolla y no se deja tocar.' },
      brasa:      { name: 'Brasa', text: 'Bailaba en los fogones de la fiesta. Sin música, quema.' },
      zorro:      { name: 'Zorro andino', text: 'Aullaba a dúo con las quenas. Ahora acecha.' },
      bolaNieve:  { name: 'Bola de nieve', text: 'Rodaba cantando cuesta abajo. Ahora solo rueda.' },
      vizcacha:   { name: 'Vizcacha', text: 'Saltaba al compás del charango.' },
      nubeGranizo:{ name: 'Nube de granizo', text: 'Llovía notas. Ahora llueve piedras.' },
      rana:       { name: 'Rana saltarina', text: 'Cantaba de noche en el lago. Se le olvidó la canción.' },
      pez:        { name: 'Pez bigotón', text: 'Nadaba en círculos con la música del agua.' },
      libelula:   { name: 'Libélula espejo', text: 'Sus alas brillaban con cada nota.' },
      garza:      { name: 'Garza de alambre', text: 'Marcaba el tiempo con el pico. Ahora picotea.' }
    },
    // Jefes: una frase (el nombre sale de CONFIG.BOSSES)
    BOSS_TEXT: {
      eco: 'El primer silencio. De él nace todo: hasta la música.',
      bombo: 'El ritmo. Su corazón hueco marca el pulso de la ciudad.',
      charanguero: 'La melodía. Sus cuerdas no tenían dueño hasta que llegaste.',
      cuy: 'El tempo. Corre cada vez más rápido, como un accelerando.',
      gusano: 'El grave. Su vibración se siente antes de oírla.',
      toro: 'La intensidad. Fortísimo, dorado y sin pausa.',
      oso: 'La pausa. Congela el pulso para que nada suene.',
      rana: 'El timbre. Su eco vive en el agua.',
      condor: 'El aire. Corta el viento como una quena.',
      huaca: 'La piedra que recuerda. Guarda lo que no se pierde.',
      silencio: 'Llegó antes que todas las canciones. Les tiene miedo.',
      charanguero2: 'La melodía que vuelve. Buscaba a los que bailaban con sus cuerdas.'
    },
    // Peso de cada parte en el porcentaje de completado (suman 100)
    COMPLETION: { ROOMS: 40, POWERS: 25, BOSSES: 20, CODEX: 15 }
  },


  // Récords mundiales (js/ranking.js). KEY: la clave del juego en LootLocker (no es
  // secreta: está hecha para ir dentro del juego)
  RANKING: {
    API: 'https://api.lootlocker.io',
    KEY: 'dev_4ceac918bf6b4616bd5bb29a6c60f6c0',
    VERSION: '0.98.0.0',
    COUNT: 10,             // cuántos se muestran
    REFRESH: 30,           // segundos antes de volver a pedir la lista
    NAME_MAX: 8,
    BOARDS: ['speedrun_z1', 'speedrun_z2', 'speedrun_z3', 'speedrun_z4', 'speedrun_z5', 'speedrun_z6', 'speedrun_z7'],
    TOWER: 'coliseo'
  },

  // Trucos de la portada: abrir Coliseo y Speedrun; abrir el informe de juego
  CHEATS: {
    UNLOCK: ['left', 'right', 'up', 'down', 'left', 'right', 'up', 'down'],
    REPORT: ['up', 'down', 'left', 'right', 'up', 'down', 'left', 'right', 'up', 'down', 'left', 'right', 'up', 'down', 'left', 'right']
  },

  // Informe de juego (js/registro.js). URL: la de la aplicación web de la planilla
  // (Apps Script, termina en /exec); vacía = solo se guarda en el aparato.
  REGISTRO: {
    URL: 'https://script.google.com/macros/s/AKfycbym1_Tx3TC1cgSdZudGKlCJu2IteD9ZqMOarWxL-9beVvTtTL2aqBfyd7eGcvGXX04D/exec',
    SEND_DEFAULT: true,     // "Datos anónimos: Sí" en Opciones
    IDLE: 60,               // segundos sin tocar nada = una pausa larga
    ABANDON: 300,           // segundos sin tocar nada = abandono (se cierra la sesión)
    MIN_SESSION: 20,        // sesiones más cortas no se guardan
    GRID: 4,                // bloques por celda para medir cuánto de la sala recorrió
    KEEP: 40,               // sesiones guardadas en el aparato
    EVENTS_MAX: 400,        // eventos detallados por sesión
    POWER_EVENTS: ['jump', 'doubleJump', 'dash', 'wallJump', 'hook', 'stompStart'],
    POWER_OF: { doubleJump: 'doubleJump', wallJump: 'wallJump', dash: 'dash', hook: 'hook', stomp: 'stompStart' },
    // Perfiles: sala "rápida" (s), cobertura "buena" (0-1) y muertes por hora "muchas"
    PROFILE: { FAST_ROOM: 90, GOOD_COVER: 0.6, MANY_DEATHS: 12 }
  },

  SPEEDRUN: {
    MENU: { TOP: 34, STEP: 15 },
    // En el speedrun no hay pausas: el mix es instantáneo, la cámara no va a mostrar la
    // llave y los mensajes importantes no detienen el juego
    MERGE_TIME: 0,
    ZONES: [
      { name: 'Ciudad Ocaso', rooms: ['n2', 'n5', 'n3'] },
      { name: 'Barrio de Cañas', rooms: ['n1', 'n4', 'n6'] },
      { name: 'Bosque Profundo', rooms: ['n7', 'n8', 'n9'] },
      { name: 'Ciudad Dorada', rooms: ['n10', 'n11', 'n12'] },
      { name: 'Cumbres de Escarcha', rooms: ['n13', 'n14', 'n15'] },
      { name: 'Lago Espejo', rooms: ['n16', 'n17', 'n18'] },
      { name: 'Ciudadela de Niebla', rooms: ['n19', 'n20', 'n21'] }
    ]
  },

  // Vecinos que hablan (js/vecinos.js): uno por zona y uno difícil.
  // room: sala · dx: bloques desde el inicio P · kind: baila, aplaude, tambor, flauta, cuerdas
  // gift: regalo (una vez): { coins } o { heart } · after: lo que dice después del regalo
  // hard: el vecino difícil (HP pisotones, PRICE monedas para pagarle)
  MUSIC: {
  PATH: 'assets/music/',
  // Pistas enteras (suenan solas): portada, créditos, temas de zona, jefes y el ají
  TRACKS: {
    main: 'tema_zona_1_3voces.m4a',
    key: 'tema_zona_1_4voces.m4a',
    final: 'tema_final.mp3',
    portada: 'momentounico.mp3',    // portada e introducción: Momento único
    creditos: 'momentounico.mp3',
    zona1: 'tema_zona_1_3voces.m4a',
    zona1b: 'tema_zona_1_4voces.m4a',
    zona2: 'tema_zona_2.mp3',
    zona3: 'tema_zona_3.mp3',
    pantano: 'pantano_tema.m4a',
    zona4: 'tema_zona_4.mp3',
    zona5: 'tema_zona_5.mp3',
    zona6: 'tema_zona_6.mp3',
    zona7: 'tema_zona_7.mp3',
    n6: 'tema_n6.mp3'
  },
  FALLBACK: { final: 'tema_zona_1_3voces.m4a' },

  // Pulso de cada música para el loop exacto (4/4): BPM y cada cuántos compases se
  // repite. Vale para el tema y para los instrumentos cuyo archivo lleva ese nombre.
  // La pista vuelve al comienzo tras el número entero de bloques que más se acerca a
  // lo que dura. Las que no están aquí vuelven donde termina su último sonido.
  LOOPS: {
    tema_final: { bpm: 120, bars: 16 },
    _n5: { bpm: 100, bars: 8 },          // Acequias Hondas (n5): tema e instrumentos
    zona_1: { bpm: 120, bars: 12 },      // 36 o 48 compases: múltiplo de 12
    zona_2: { bpm: 128, bars: 16 },
    zona_3: { bpm: 122, bars: 8 },
    zona_5: { bpm: 120, bars: 12 },
    zona_4: { bpm: 120, bars: 4 },       // zonas 4, 6 y 7: 120 BPM (compases: múltiplo de 4)
    zona_6: { bpm: 120, bars: 4 },
    zona_7: { bpm: 120, bars: 4 }
  },

  // Instrumentos de cada sala: nombre -> archivo. "tema" es la base: suena siempre
  // (desde que entras); cada instrumento se suma al atraparlo. Las salas que no están
  // aquí usan la pista de ROOM_MUSIC.
  LEVEL_STEMS: (function () {
    const z1 = { percusion: 'percusion_zona_1.m4a', teclado: 'teclado_zona_1.m4a', bajo: 'bajo_zona_1.m4a', tema: 'tema_zona_1_3voces.m4a' };
    const z2 = { percusion: 'percusion_zona_2.mp3', sintetizador: 'sintetizador_zona_2.mp3', sintetizador2: 'sintetizador2_zona_2.mp3', tema: 'tema_zona_2.mp3' };
    const z3 = { arpa: 'arpa_zona_3.mp3', mandolina: 'mandolin_zona_3.mp3', violin: 'violin_zona_3.mp3', tema: 'tema_zona_3.mp3' };
    const pantano = { sintetizador: 'sintetizador_pantano.m4a', bajo: 'bajo_pantano.m4a', percusion: 'percusion_pantano.m4a', tema: 'pantano_tema.m4a' };
    const z4 = { percusion: 'percusion_zona_4.mp3', citara: 'citarra_zona_4.mp3', bajo: 'bajo_zona_4.mp3', tema: 'tema_zona_4.mp3' };
    const z5 = { bajo: 'bajo_zona_5.mp3', percusion: 'percusion_zona_5.mp3', arpa: 'arpa_zona_5.mp3', tema: 'tema_zona_5.mp3' };
    const z6 = { percusion: 'percusion_zona_6.mp3', sintetizador: 'sintetizador_zona_6.mp3', vientosnubes: 'vientosnubes_zona_6.mp3', tema: 'tema_zona_6.mp3' };
    const z7 = { percusion: 'percusion_zona_7.mp3', sintetizador: 'sintetizador_zona_7.mp3', teclado: 'teclado_zona_7.mp3', tema: 'tema_zona_7.mp3' };
    return {
      p2: { teclado: 'teclado_zona_1.m4a', bajo: 'bajo_zona_1.m4a', percusion: 'percusion_zona_1.m4a', tema: 'tema_zona_1_3voces.m4a' },
      n2: z1,
      n5: { percusion: 'percusion_n5.mp3', kalimba: 'kalimba_n5.mp3', violin: 'violin_n5.mp3', tema: 'tema_n5.mp3' },
      n3: z1,                                // Guardián del Tambor: los mismos instrumentos del nivel 1
      n1: z2, n4: z2,
      n6: { bajo: 'bajo_n6.mp3', percusion: 'percusion_n6.mp3', teclado: 'teclado_n6.mp3', tema: 'tema_n6.mp3' },
      // Zona 3: el bosque suena con la música del pantano y el pantano con el vals del bosque
      n7: pantano, n8: pantano,
      n9: z3,
      n10: z4, n11: z4, n12: z4,
      n13: z5, n14: z5, n15: z5,
      n16: z6, n17: z6, n18: z6,
      n19: z7, n20: z7, n21: z7,
      n22: { coro: 'coro_final.mp3', teclado: 'teclado_final.mp3', percusion: 'percusion_final.mp3', tema: 'tema_final.mp3' }
    };
  })(),

  // Nombre de la canción de cada sala (lo que se ve al afinarla y en Canciones).
  // Puedes cambiarlos: son solo el nombre, sin tono ni bpm.
  SONG_TITLES: {
    p1: 'La fiesta del barrio', p2: 'La noche robada',
    n2: 'Calles del Ocaso', n5: 'Agua de acequia', n3: 'Molinos del puerto',
    n1: 'Cañas al viento', n4: 'Cañas al viento', n6: 'Taller del Silencio',
    n7: 'Barro del pantano', n8: 'Barro del pantano', n9: 'Raíces del bosque',
    n10: 'Escalinata del Sol', n11: 'Escalinata del Sol', n12: 'Escalinata del Sol',
    n13: 'Escarcha del metro sumergido', n14: 'Escarcha del metro sumergido', n15: 'Escarcha del metro sumergido',
    n16: 'Reflejos del lago', n17: 'Reflejos del lago', n18: 'Reflejos del lago',
    n19: 'Ecos de la ciudadela', n20: 'Ecos de la ciudadela', n21: 'Ecos de la ciudadela',
    n22: 'El Gran Silencio'
  },
  // Otras músicas (para el catálogo): portada, créditos, salas sin instrumentos, jefe y ají
  OTHER_TITLES: {
    portada: 'Momento único', creditos: 'Momento único', otras: 'Ocaso escondido',
    tambor: 'Tambor del puerto', aji: 'Ocaso picante'
  },

  // true: con los 3 instrumentos se suma también el "tema" de la sala. false (ahora): solo
  // suenan los instrumentos (el tema ya los trae mezclados y se escuchaban duplicados)
  TEMA_LAYER: false,

  // Salas sin instrumentos: qué pista suena y a qué velocidad (1 = normal)
  ROOM_MUSIC: {
    p1: { track: 'zona2' },
    j1: { track: 'zona1', rate: 0.9 }, j2: { track: 'zona1', rate: 0.9 }, s3: { track: 'zona1', rate: 0.9 },
    c1: { track: 'zona1', rate: 1.1 }, c2: { track: 'zona1', rate: 1.1 }, c3: { track: 'zona1', rate: 1.1 },
    q1: { track: 'zona1' }, q2: { track: 'zona1' }, q5: { track: 'zona1' }, q6: { track: 'zona1' },
    q8: { track: 'zona1' }, q20: { track: 'zona1' }
  },

  // Música de cada jefe al cerrarse la arena (por sala)
  BOSS_MUSIC: {
    p2: { track: 'main' },                  // Eco del Silencio (prólogo): zona 1 a 3 voces
    n3: { track: 'main' },                  // Guardián del Tambor: zona 1 a 3 voces
    n6: { track: 'n6' },
    n9: { track: 'zona3' },                 // jefe del pantano: el vals del bosque
    n12: { track: 'zona4' },
    n15: { track: 'zona5' },
    n18: { track: 'zona6' },
    n21: { track: 'zona7' },
    n22: { track: 'final' }
  },

  // Ají (pimienta): mientras dura suena el tema de la zona 1 a 200 BPM (120 x 1,67)
  CHILI_MUSIC: { track: 'zona1', rate: 1.67 },

  // Pistas por defecto (si una sala no tiene las suyas)
  STEMS: {},

  // Nombre de cada instrumento (mensajes y menú)
  STEM_NAMES: {
    bajo: 'Bajo', percusion: 'Percusión', teclado: 'Teclado', teclado2: 'Teclado',
    arpa: 'Arpa', citara: 'Cítara', kalimba: 'Kalimba', mandolina: 'Mandolina',
    sintetizador: 'Sintetizador', sintetizador2: 'Sintetizador', violin: 'Violín',
    vientosnubes: 'Vientos de nube', coro: 'Coro'
  },

  // Dibujo de cada instrumento (los que no tienen uno propio usan el de otro)
  INSTRUMENT_SPRITE: {
    bajo: 'sprite_bajo', percusion: 'sprite_percusion', teclado: 'sprite_teclado', teclado2: 'sprite_teclado',
    arpa: 'instrumento_arpa', citara: 'instrumento_citara', mandolina: 'instrumento_citara',
    kalimba: 'instrumento_kalimba', sintetizador: 'instrumento_sintetizador', sintetizador2: 'instrumento_sintetizador',
    violin: 'instrumento_violin', vientosnubes: 'instrumento_vientosnubes', coro: 'instrumento_coro'
  },

  STEM_RATE: 24000,     // Hz de las pistas de instrumentos (menos = menos memoria en el celular)
  INSTRUMENT_SEARCH: {
    MAX_DISTANCE: 15,   
    MIN_VOLUME: 0.0,    
    MAX_VOLUME: 1.0,    
    CURVE: 1.5          
  },

  TRACK_PITCH: { key: 3 },
  BPM: 120,
  BOSS_TRACK: 'key',              
  ERROR_SHOW: 6                   
},
  // Efectos de sonido (generados por código) y vibración del mando
  SFX: {
    // Aviso de ataque de los jefes: tritono grave con eco (REPEATS veces, cada GAP s,
    // bajando DECAY); como mucho uno cada EVERY s. PITCHES: alturas (cada jefe una)
    BOSS_ECHO: { REPEATS: 3, GAP: 0.16, VOL: 0.16, DECAY: 0.5, EVERY: 0.6, PITCHES: [1, 0.89, 1.12, 0.84, 1.19, 0.94, 1.06] },
    // Cubo: arpegio 1-5-7-3 de Do mayor 7 (Do, Sol, Si, Mi), 3 veces en medio segundo
    CUBE_ARP: {
      NOTES: [523.25, 783.99, 987.77, 1318.51],
      REPEAT: 3,
      TIME: 0.5,          // segundos que dura todo el arpegio
      PEAK: 0.22,         // volumen en el punto más cercano
      DOPPLER: 0.03       // cuánto sube el tono al acercarse y baja al alejarse
    },
    // Maíz: arpegio 1-3-5-7 de Re mayor 7 (Re, Fa#, La, Do#), agudito y rápido
    MAIZE_ARP: {
      NOTES: [1174.66, 1479.98, 1760.0, 2217.46],
      TIME: 0.18,         // segundos que dura todo el arpegio
      VOL: 0.09
    },
    // Vibración: ms de duración y fuerza (0 a 1) de los dos motores
    RUMBLE: {
      DRUM: { TIME: 150, STRONG: 0.5, WEAK: 0.4 },
      BOSS_LAND: { TIME: 250, STRONG: 1, WEAK: 0.6 },
      BOSS_ROAR: { TIME: 900, STRONG: 1, WEAK: 1 }
    },
    TICK_FROM: 10,        // últimos segundos del escape con "tic"
    // Vibración apagada de entrada: en algunas tablets el visor de Acode se cae
    // al hacer vibrar el mando. Se puede encender en el menú de pausa.
    RUMBLE_DEFAULT: false
  },

  // Efecto con la llave: golpe de pantalla a cada pulso y chispas
  KEY_FX: {
    SHAKE: 2,           // píxeles de sacudida en cada pulso
    SHAKE_TIME: 0.12,   // segundos que dura cada sacudida
    SPARK_EVERY: 0.04,  // segundos entre chispas
    SPARK_LIFE: 0.7,
    COLORS: ['#ffd34d', '#ff7ad9', '#ffffff']
  },

  // Efectos: textos +1/-1, brillo del ají y borde de las rítmicas
  FX: {
    POPUP_LIFE: 1,          // segundos que dura el +1 / -1
    POPUP_RISE: 18,         // píxeles que sube
    LIFE_UP: '#3fd16b',
    LIFE_DOWN: '#ff4d4d',
    GLOW_INNER: '#ffffff',
    GLOW_OUTER: '#ff4d3a',
    RHYTHM_BORDER: '#ffffff',
    BURST_TIME: 0.35        // estallido al comer el ají
  },

  // Ají: más velocidad y salto por un rato (sirve para pasar espinas)
  CHILI: {
    PRICE_STEP: 40,        // el ají de la tienda sube 40 monedas con cada compra
    REGROW_SESSIONS: 10,  // partidas (veces que se abre la partida) hasta que un ají comido vuelve a crecer
    DURATION: 5,        // segundos que dura el efecto
    SPEED_MULT: 1.5,    // carrera x1,5
    JUMP_MULT: 1.25,    // salto x1,25 (unos 5,4 bloques)
    COLOR: '#ff4d3a'
  },

  // Enemigos comunes (velocidades en px/s)
  ENEMIES: {
    GRAVITY: 900,
    BEETLE_SPEED: 25,
    CUY_SPEED: 35,
    CUY_CHASE_MULT: 2,      // persiguiendo corre al doble
    CUY_VISION: 6,          // bloques que alcanza a ver
    CUY_ALERT_TIME: 0.4,    // segundos con "!" antes de correr
    CUY_GIVE_UP: 1,         // segundos sin verte antes de volver a patrullar
    SQUASH_TIME: 0.35,      // segundos que se ve aplastado
    STOMP_BOUNCE: 260,      // rebote al pisar
    STOMP_BOUNCE_HIGH: 360, // rebote si mantienes el salto
    KNOCK_X: 120,           // empujón al tocar un enemigo de lado
    KNOCK_Y: 160,
    RESPAWN_TIME: 12,       // segundos hasta que reaparece (fuera de la cámara)
    MAX_RESPAWNS: 5,        // veces que puede reaparecer cada enemigo por visita
    // Disparador: quieto, mira hacia la papa y le tira semillas sin parar
    SHOOT_EVERY: 2,         // segundos entre disparos
    SHOOT_WINDUP: 0.4,      // segundos que se infla antes de disparar (aviso)
    SHOOT_RANGE_X: 12,      // bloques: solo dispara si la papa está así de cerca
    SHOOT_RANGE_Y: 5,
    SHOT_SPEED: 80,         // px/s de la semilla
    SHOT_LIFE: 3,           // segundos antes de desaparecer
    // Zona 3 · Minas de Cristal
    // Murciélago: cae si pasas debajo (RANGE bloques de lado, hasta DEPTH abajo), tras WARN s de aviso
    BAT: { RANGE: 1.2, DEPTH: 12, WARN: 0.5 },
    // Escorpión: tira un cristal en arco cada EVERY s si estás a RANGE_X / RANGE_Y bloques
    SCORPION: { EVERY: 3, RANGE_X: 8, RANGE_Y: 4 },
    // Topo: te siente a SENSE bloques, avisa WARN s (tiembla el suelo), asoma UP_TIME s y descansa REST s
    MOLE: { SENSE: 6, WARN: 0.7, UP_TIME: 1.6, REST: 1.5 },
    // Brasa saltarina (zona 4): altura del salto (px/s), cuánto se acerca y hasta dónde
    BRASA: { JUMP: 260, HIGH_JUMP: 470, DRIFT: 30, SENSE: 7, RANGE: 3 },   // salto 'alto': sale del abismo
    ARMADILLO_CURL: 1.4,    // segundos enrollado tras pisarlo sin zapateo
    // Zona 5: zorro (te ve, avisa y salta), bola de nieve (crece), vizcacha (saltos largos), nube de granizo
    FOX: { SENSE: 6, WARN: 0.35, JUMP: 240, RUN: 130, REST: 1.4 },
    SNOWBALL: { GROW: 3, MAX: 22 },
    HOP: { JUMP: 300, SPEED: 85, REST: 0.9 },
    HAIL: { SWAY: 0.8, RANGE: 3, EVERY: 1.6 },
    // Zona 6: rana (salta hacia ti y estira la lengua), pez (embiste en el agua),
    // libélula (zigzag; brilla antes de doblar), garza (picotea si pasas cerca)
    FROG: { SENSE: 6, WARN: 0.4, JUMP: 300, SPEED: 85, TONGUE: 44, TONGUE_WARN: 0.3, TONGUE_TIME: 0.35, REST: 1.3 },
    FISH: { SPEED: 30, SENSE: 7, WARN: 0.45, CHARGE: 140, CHARGE_TIME: 1.1, REST: 1.2 },
    DRAGONFLY: { SPEED: 50, ZIG: 1.2, FLASH: 0.35, RANGE: 5 },
    HERON: { SENSE: 3, WARN: 0.45, STRIKE: 0.35, REACH: 26, REST: 1.4 }
  },

  // Monedas que sueltan los enemigos (se gastan con los vendedores)
  COINS: {
    DROP: { beetle: 1, cuy: 1, shooter: 2, paloma: 1, oruga: 1, colibri: 2, mono: 2, barrendero: 2,
            murcielago: 2, rueda: 2, escorpion: 3, topo: 2 },
    LIFE: 10,               // segundos antes de desaparecer
    BLINK: 3,               // parpadea los últimos segundos
    PICKUP_DELAY: 0.4,      // segundos antes de poder tomarlo
    POP_X: 40,              // salto al aparecer (px/s)
    POP_Y: 150,
    GRAVITY: 600,
    COLOR: '#ffd34d',
    SHADE: '#e0a020'
  },

  // Luz de la pelea con el jefe: círculo claro sobre la papa (radios en px) y
  // qué tan oscuro queda el resto (0 a 1)
  // ---------- Luz y ambiente (js/light.js) ----------
  // Cada sala tiene una oscuridad (0 = de día, 1 = negro) según su tema, o la suya
  // propia ("dark" en levels.js). Las luces (la papa, hongos, faroles, corcheas,
  // tótem, proyectiles) abren la oscuridad y brillan; todas laten con el blues.
  LIGHT: {
    QUALITY: 2,             // 0 apagado, 1 simple (sin brillos ni partículas), 2 completo (se cambia en Opciones)
    COLOR: '#120a26',       // color de la oscuridad
    THEMES: { cityday: 0, city: 0.25, sea: 0.1, bamboo: 0.05, cave: 0.55, tech: 0.45, mine: 0.5,
              linde: 0.12, bosque: 0.42, pantano: 0.5, dorada: 0.08, templo: 0.6, nieve: 0.04, hielo: 0.5, tormenta: 0.3, orilla: 0.1, lago: 0, espejo: 0.45, niebla: 0.22, tower: 0.2, fiesta: 0.35, caida: 0 },
    ARENA_DARK: 0.62,       // oscuridad extra durante la pelea con un jefe
    PLAYER: { R: 64, COLOR: '#ffe9b8', GLOW: 0.35 },   // luz de la papa (más grande cuanto más oscuro)
    PULSE: 0.22,            // cuánto crecen las luces en cada pulso del blues
    PULSE_DECAY: 7,         // qué tan rápido se apaga el pulso
    VIGNETTE: 0.35,         // bordes oscuros
    // Luces de las piezas: radio en px, color y brillo
    SOURCES: {
      totem:   { R: 46, COLOR: '#9fe8ff', GLOW: 0.5 },
      corchea: { R: 30, COLOR: '#ffd34d', GLOW: 0.6 },
      key:     { R: 34, COLOR: '#ffe066', GLOW: 0.7 },
      posta:   { R: 52, COLOR: '#ffb35c', GLOW: 0.6 },
      save:    { R: 22, COLOR: '#ffd34d', GLOW: 0.3 },
      hongo:   { R: 36, COLOR: '#5ff2d6', GLOW: 0.55 },
      farol:   { R: 44, COLOR: '#ffb35c', GLOW: 0.6 },
      antorcha:{ R: 50, COLOR: '#ff9a3c', GLOW: 0.75 },
      cristal: { R: 30, COLOR: '#6fd6ff', GLOW: 0.45 },
      neon:    { R: 40, COLOR: '#6bf0ff', GLOW: 0.6 },
      shot:    { R: 18, COLOR: '#ff6b8a', GLOW: 0.7 },
      boss:    { R: 60, COLOR: '#c9b8ff', GLOW: 0.4 },
      tune:    { R: 40, COLOR: '#ff8a5c', GLOW: 0.6 }
    },
    // Partículas del ambiente por tema: tipo, cantidad y colores
    AMBIENT: {
      fiesta:  { kind: 'confetti', n: 26, colors: ['#ff6b8a', '#ffd34d', '#7be0a0', '#9fd3e0', '#c9b8e3'] },
      cave:    { kind: 'dust', n: 18, colors: ['#9fd3e0', '#c9b8e3'] },
      linde:   { kind: 'pollen', n: 16, colors: ['#f7e3a1', '#bfe3c8'] },
      bosque:  { kind: 'firefly', n: 18, colors: ['#d8ff8a', '#5ff2d6'] },
      pantano: { kind: 'firefly', n: 14, colors: ['#d8ff8a', '#9fd3e0'] },
      city:    { kind: 'dust', n: 10, colors: ['#ffd34d', '#f4b6c2'] },
      cityday: { kind: 'pollen', n: 8, colors: ['#ffffff', '#f7e3a1'] },
      tech:    { kind: 'dust', n: 14, colors: ['#9fd3e0'] },
      mine:    { kind: 'dust', n: 14, colors: ['#9fd3e0'] },
      bamboo:  { kind: 'pollen', n: 12, colors: ['#bfe3c8', '#f7e3a1'] },
      sea:     { kind: 'pollen', n: 8, colors: ['#ffffff'] },
      nieve:   { kind: 'snow', n: 40, colors: ['#ffffff', '#e6f6ff'] },
      tormenta:{ kind: 'blizzard', n: 70, colors: ['#ffffff', '#e6f6ff', '#c9d8ef'] },
      hielo:   { kind: 'firefly', n: 14, colors: ['#9fe8ff', '#e6f6ff'] },
      dorada:  { kind: 'pollen', n: 22, colors: ['#ffd34d', '#fff6e0', '#f7e3a1'] },
      templo:  { kind: 'firefly', n: 12, colors: ['#ffd34d', '#ffb35c'] },
      orilla:  { kind: 'pollen', n: 20, colors: ['#fff6e0', '#f7e3a1', '#c9b46b'] },
      lago:    { kind: 'pollen', n: 10, colors: ['#ffffff', '#c4e6ff'] },
      espejo:  { kind: 'bubbles', n: 26, colors: ['#bff0ff', '#e6fff6'] },
      niebla:  { kind: 'pollen', n: 24, colors: ['#ffffff', '#ece6ff', '#ffe9a8'] }
    }
  },

  // ---------- Presentación de los jefes (js/bossshow.js) ----------
  BOSS_SHOW: {
    INTRO_TIME: 3.2,        // portada antes de pelear (se salta con un botón después de 1 s)
    BAR_W: 196,             // barra de vida continua
    BAR_EASE: 9,            // qué tan rápido baja la barra
    TRAIL_WAIT: 0.45,       // la estela blanca espera y después baja
    TRAIL_EASE: 3,
    HITSTOP: 0.09,          // pausa de un instante en cada golpe
    FLASH: 0.12,            // destello blanco al golpear
    SPLIT: 0.18,            // separación de colores al golpear y al cambiar de fase
    PHASES: [0.67, 0.34],   // al bajar de 2/3 y de 1/3 de la vida el jefe cambia de fase
    PHASE_COLORS: ['#ff6b8a', '#ff9a3c', '#ff4dc4'],   // aura y ondas de cada fase
    TRAIL_SPEED: 140,       // px/s desde los que el jefe deja estela
    SLOWMO: 1.6,            // segundos de cámara lenta al vencerlo
    SLOWMO_SCALE: 0.25,
    BURST_NOTES: 46         // notas que salen volando al vencerlo
  },

  // ---------- Prólogo (js/prologo.js) ----------
  PROLOGUE: {
    COLLAPSE_AT: 5.4,       // segundos del Silencio hasta que se hunde la plaza
    FALL_TIME: 26,          // segundos de la gran caída (del anochecer al día)
    TITLE_AT: 11,           // a los cuántos segundos de la caída aparece el título
    TITLE_TIME: 5.5,
    FALL_SPEED: 70,         // px/s de lado mientras cae
    SKY: [                  // el cielo de la caída: [momento 0..1, arriba, abajo]
      [0.00, '#0b0620', '#1b1035'],
      [0.30, '#1b1035', '#4a2a6a'],
      [0.50, '#3a2a6a', '#e07a8f'],
      [0.68, '#6fa8c7', '#f4a261'],
      [0.85, '#9fd3e0', '#f7e3a1'],
      [1.00, '#cfe8ef', '#fbf6ec']
    ]
  },

  // Diapasón (lo da el Eco del Silencio, en el prólogo): toque corto = La (onda corta),
  // mantener y soltar = Si (onda amplia). Cada muro se deshace solo con su nota
  // Diapasón: empieza en La y cada jefe enseña una nota. Mientras se mantiene el
  // botón, la nota sube un escalón cada STEP segundos (solo por las aprendidas);
  // al soltar suena. Con abajo apretado al soltar suena el bemol (notas blue, si se tiene)
  TUNER: {
    STEP: 0.34,           // segundos por escalón al mantener
    WAVE_TIME: 0.7,       // segundos que tarda la onda en abrirse
    COOLDOWN: 0.25,
    WRONG_SHAKE: 0.35,    // segundos que tiembla un muro con la nota equivocada
    // Las 7 notas, en el orden en que sube el anillo: nombre, frecuencia (Hz), color y radio (bloques)
    ORDER: ['la', 'si', 'do', 're', 'mi', 'fa', 'sol'],
    NOTES: {
      la:   { name: 'La',   freq: 440,    color: '#ff8a5c', radius: 3.2 },
      si:   { name: 'Si',   freq: 493.88, color: '#a98bff', radius: 5.5 },
      do:   { name: 'Do',   freq: 523.25, color: '#e0465a', radius: 4.5 },
      re:   { name: 'Re',   freq: 587.33, color: '#ffd34d', radius: 4.5 },
      mi:   { name: 'Mi',   freq: 659.25, color: '#6bd17a', radius: 4.5 },
      fa:   { name: 'Fa',   freq: 698.46, color: '#3ec8c8', radius: 4.5 },
      sol:  { name: 'Sol',  freq: 783.99, color: '#ff6bd6', radius: 4.5 },
      // Notas blue (bemoles): el color de su nota natural; el muro lleva rombos
      sib:  { name: 'Si♭',  freq: 466.16, color: '#a98bff', radius: 5.5, flatOf: 'si' },
      mib:  { name: 'Mi♭',  freq: 622.25, color: '#6bd17a', radius: 4.5, flatOf: 'mi' },
      solb: { name: 'Sol♭', freq: 739.99, color: '#ff6bd6', radius: 4.5, flatOf: 'sol' }
    },
    FLATS: { si: 'sib', mi: 'mib', sol: 'solb' },
    // Qué nota enseña cada jefe (el diapasón ya trae La)
    BOSS_NOTES: { eco: 'si', bombo: 'do', cuy: 're', gusano: 'mi', toro: 'fa', oso: 'sol',
                  geoda: 'mib', reina: 'solb', linterna: 'sib' }
  },

  // Paloma de lata: en las zonas 1 y 2 es tranquila; desde la zona 3, más agresiva
  PALOMA: {
    CALM_UNTIL_REGION: 2,
    // RANGE: qué tan debajo tiene que pasar la papa (bloques de lado); DEPTH: hasta
    // cuántos bloques más abajo la ve; WARN: segundos de aviso antes de la picada;
    // SPEED: velocidad de la picada; DIVE_TIME: cuánto dura; REST: descanso después
    CALM:  { RANGE: 0.9, DEPTH: 5, WARN: 0.6, SPEED: 85,  DIVE_TIME: 1.2, REST: 3 },
    ANGRY: { RANGE: 1.5, DEPTH: 7, WARN: 0.25, SPEED: 170, DIVE_TIME: 0.9, REST: 1 }
  },

  // Jefes (dibujados por código hasta tener sprites). Tiempos en segundos, velocidades en px/s.
  // Regla de todos: se les pisa la cabeza en cualquier momento, menos mientras atacan
  // o se recuperan de un golpe. Con la mitad de la vida o menos se apuran (ANGRY_SPEED).
  // IDLE_TIME: calma entre ataque y ataque
  BOSSES: {
    HEAD_ZONE: 12,          // px de arriba que cuentan como cabeza al caerles
    HURT_TIME: 0.8,         // recuperándose del golpe (parpadea; no se le puede pisar)
    DYING_TIME: 1.2,
    ANGRY_TINT: '#ff4d3a',
    // Cóndor de bronce: A tira cocos que ruedan; B picadas desde las esquinas
    condor: {
      NAME: 'CÓNDOR DE BRONCE', HP: 6, W: 28, H: 24, ANGRY_SPEED: 1.25,
      IDLE_TIME: 1.8,       // posado: se le pisa
      FLY_HEIGHT: 5,        // bloques sobre el suelo al tirar cocos
      TAKEOFF_SPEED: 140,
      FLY_SPEED: 90,
      COCOS: 3,
      COCO_ROLL: 70,        // velocidad del coco rodando
      SWOOPS: 2,            // picadas seguidas
      WARN_TIME: 0.75,      // aviso antes de cada picada
      SWOOP_SPEED: 300
    },
    // Charanguero: A rasgueo (notas bajas y altas); B salto con acorde por el suelo
    // El Rasgueador (de Armored Armadillo): A dispara notas; B se enrolla y
    // rebota por la arena en diagonal
    charanguero: {
      NAME: 'EL RASGUEADOR', HP: 4, W: 20, H: 26,
      BALL_SPEED: 150,
      BALL_TIME: 3,
      IDLE_TIME: 1.6,
      ANGRY_SPEED: 1.3,     // con 2 vidas o menos: todo más rápido
      NOTE_WAVES: 2,        // oleadas de corcheas del rasgueo
      ANGRY_NOTE_WAVES: 3,  // oleadas con 2 vidas o menos
      NOTES_PER_WAVE: 3,    // corcheas por oleada
      NOTE_EVERY: 0.35,     // segundos entre corcheas de una oleada
      WAVE_PAUSE: 0.8,      // descanso entre oleadas
      NOTE_SPEED: 110,
      HOP_TIME: 0.9,
      WAVE_SPEED: 110
    },
    // El Rasgueador Maestro (sala secreta de la zona 7): lo mismo que el Rasgueador, más
    // rápido y con un tercer ataque C: acorde de notas que persiguen a la papa un rato
    charanguero2: {
      NAME: 'EL RASGUEADOR MAESTRO', HP: 6, W: 20, H: 26,
      BALL_SPEED: 175, BALL_TIME: 3, IDLE_TIME: 1.2, ANGRY_SPEED: 1.35,
      NOTE_WAVES: 2, ANGRY_NOTE_WAVES: 3, NOTES_PER_WAVE: 4, NOTE_EVERY: 0.3, WAVE_PAUSE: 0.7,
      NOTE_SPEED: 125, HOP_TIME: 0.8, WAVE_SPEED: 125,
      CHORD_NOTES: 3,       // notas del acorde que persigue
      CHORD_SPEED: 70,      // velocidad de esas notas
      CHORD_TURN: 2.2,      // qué tan rápido doblan hacia la papa
      CHORD_FOLLOW: 1.8,    // segundos que persiguen (después siguen derecho)
      CHORD_COLOR: '#9fe3c8'
    },
    // Tótem de Piedra (de Boomer Kuwanger): A lanza su corona como bumerán;
    // B desaparece y reaparece junto a la papa
    huaca: {
      NAME: 'TÓTEM DE PIEDRA', HP: 4, W: 22, H: 30,
      CROWN_SPEED: 170,
      CROWN_OUT: 0.75,      // segundos de ida (después vuelve a su cabeza)
      IDLE_TIME: 1.8,
      ANGRY_SPEED: 1.35,    // con 2 vidas o menos: lanza y todo va más rápido
      THROWS: 5,            // piedras por ataque
      ANGRY_THROWS: 8,      // piedras con 2 vidas o menos
      THROW_EVERY: 0.6,
      ROCK_TIME: 0.9,       // segundos que tarda la piedra en caer donde estaba la papa
      SINK_TIME: 0.5,
      WARN_TIME: 0.9,       // polvo bajo la papa antes de salir
      EMERGE_TIME: 0.3
    },
    // Cuy gigante: A embestida (choca y queda mareado); B salto aplastante con ondas
    // Cuy gigante (de Spark Mandrill): A embestida hasta la pared (queda mareado);
    // B se cuelga del techo, cae sobre la papa y suelta chispas que corren por el
    // suelo y suben por las paredes
    // Gusano Taladro (zona 3, sala 9): A se hunde, viaja bajo tierra hacia la papa y
    // sale de golpe soltando piedras; B se mete en una pared y la cruza taladrando,
    // y caen cristales del techo. Después de cada ataque queda cansado (se le pisa)
    // Eco del Silencio (prólogo): flota y llena la arena de silencios (notas apagadas).
    // A: espiral de silencios. B: columnas que caen (avisa con líneas). Después se
    // estrella contra el suelo (ondas a los lados) y queda recalentado: ahí se le pisa.
    // Da el diapasón
    // El Silencio (sala 22): como el Eco, más vida y más rápido
    silencio: {
      NAME: 'EL SILENCIO', HP: 9, W: 40, H: 32, ANGRY_SPEED: 1.2, flies: true, ownShow: true,
      IDLE_TIME: 1, HOVER: 4.6, SPIRAL_TIME: 3, SPIRAL_EVERY: 0.13, SPIRAL_SPEED: 70, SPIRAL_TURN: 2.8,
      COLUMNS: 4, COLUMN_WARN: 0.8, COLUMN_SPEED: 290, SLAM_SPEED: 420, WAVE_SPEED: 140,
      TIRED_TIME: 2.2, RISE_SPEED: 100,
      // Las tres peleas: lo que cambia en cada forma
      FORMS: [
        { NAME: 'EL SILENCIO', HP: 6 },
        { NAME: 'EL SILENCIO · SEGUNDA FORMA', HP: 7, ANGRY_SPEED: 1.3, COLUMNS: 5, SPIRAL_EVERY: 0.11 },
        { NAME: 'EL SILENCIO · FORMA FINAL', HP: 9, ANGRY_SPEED: 1.4, COLUMNS: 6, SPIRAL_EVERY: 0.09,
          SPIRAL_SPEED: 85, IDLE_TIME: 0.8, TIRED_TIME: 1.8 }
      ]
    },
    eco: {
      NAME: 'ECO DEL SILENCIO', HP: 6, W: 34, H: 28, ANGRY_SPEED: 1.15, flies: true, ownShow: true,
      IDLE_TIME: 1.2,
      HOVER: 4.2,           // bloques sobre el suelo mientras flota
      SPIRAL_TIME: 2.6,     // segundos de espiral
      SPIRAL_EVERY: 0.16,   // cada cuánto suelta un par de silencios
      SPIRAL_SPEED: 62,
      SPIRAL_TURN: 2.4,     // radianes por segundo que gira la espiral
      COLUMNS: 3,           // columnas que caen a la vez
      COLUMN_WARN: 0.9,
      COLUMN_SPEED: 260,
      SLAM_SPEED: 380,
      WAVE_SPEED: 120,
      TIRED_TIME: 2.4,      // recalentado en el suelo: se le pisa
      RISE_SPEED: 90
    },
    // Toro Dorado (zona 4, sala 12): A embestida con llamas hasta clavarse en la pared;
    // B salto que cae con ondas (y columnas de luz desde la fase 2). Fase 3: lluvia de oro
    toro: {
      NAME: 'TORO DORADO', HP: 8, W: 36, H: 26, ownShow: true,
      IDLE_TIME: 1.1,
      PAW_TIME: 0.8,        // escarba antes de embestir (aviso)
      CHARGE_SPEED: 230,
      FLAME_EVERY: 0.07,    // llamas que deja en el suelo
      FLAME_LIFE: 1.1,
      ROCKS: 3,             // piedras que caen al chocar con la pared
      STUCK_TIME: 2.2,      // con los cuernos clavados: se le pisa
      LEAP_TIME: 0.85,
      WAVE_SPEED: 130,
      PILLAR_WARN: 0.75,
      DAZED_TIME: 1.7,
      RAIN_EVERY: 0.35
    },
    // Oso de Escarcha (zona 5, sala 15): A pisotón con carámbanos (y púas desde la
    // fase 2); B rodada de pared a pared. Fase 3: ventisca con ráfagas
    oso: {
      NAME: 'OSO DE ESCARCHA', HP: 8, W: 40, H: 32, ownShow: true,
      IDLE_TIME: 1.2,
      REAR_TIME: 0.9,       // se alza (aviso: sombras de los carámbanos)
      ICICLES: 3,
      WAVE_SPEED: 125,
      SPIKES: 5,            // púas de hielo desde la fase 2
      RECOVER_TIME: 1.8,    // resoplando: se le pisa
      ROLL_SPEED: 210,
      DIZZY_TIME: 2,
      GUST: 95,             // px/s de empuje de la ráfaga
      GUST_EVERY: 4.5,
      GUST_TIME: 1.6
    },
    rana: {
      NAME: 'RANA GIGANTE DEL LAGO', HP: 8, W: 40, H: 26,
      IDLE_TIME: 1.1,
      CROUCH_TIME: 0.6,     // se agacha antes de saltar (aviso: sombra donde cae)
      JUMP_TIME: 0.95,      // vuelo de isla a isla
      WAVE_SPEED: 110,      // olas al caer (corren por la isla)
      TONGUE_WARN: 0.5,     // infla el buche antes de la lengua
      TONGUE_LEN: 120,
      TONGUE_OUT: 0.22,
      STUCK_TIME: 1.8,      // la lengua quedó pegada: se le pisa
      UNDER_TIME: 1.3,      // bajo el agua, buscando a la papa
      UNDER_SPEED: 110,
      BURST_WARN: 0.7,      // burbujas donde va a salir
      SPOUT_TIME: 0.6,      // chorro de agua al salir
      TIRED_TIME: 1.7,      // cansada después del chapuzón: se le pisa
      BUBBLE_EVERY: 1.6     // fase 3: escupe burbujas que suben
    },
    gusano: {
      NAME: 'GUSANO TALADRO', HP: 5, W: 30, H: 20,
      IDLE_TIME: 1.3,
      ANGRY_SPEED: 1.3,
      DIG_TIME: 0.45,       // se hunde
      UNDER_TIME: 1.5,      // bajo tierra siguiendo a la papa
      UNDER_SPEED: 85,
      WARN_TIME: 0.6,       // el suelo tiembla antes de salir
      BURST_SPEED: 430,     // salto al salir del suelo
      ROCK_SPEED: 95,       // piedras que salen a los lados
      TIRED_TIME: 1.5,
      CHARGE_SPEED: 165,    // cruzando la arena desde la pared
      STUCK_TIME: 1.4,      // clavado en la pared de enfrente
      CEILING_ROCKS: 3      // cristales que caen del techo al chocar
    },
    cuy: {
      NAME: 'CUY GIGANTE', HP: 5, W: 30, H: 22,
      IDLE_TIME: 1.2,
      CHARGE_SPEED: 210,
      DIZZY_TIME: 1.7,      // mareado: se le pisa y no daña
      LEAP_TIME: 0.8,
      WAVE_SPEED: 120,
      CEILING_TIME: 0.9,    // colgado del techo antes de caer
      SPARK_SPEED: 130,
      SPARK_CLIMB: 70       // px/s subiendo por la pared
    },
    // Guardián del Bombo: A saltos con ondas (y queda cansado); B redoble con ondas seguidas
    // Guardián del Tambor (de Chill Penguin): A se tumba y rueda de pared a pared;
    // B se cuelga del techo y su redoble levanta un ventarrón que empuja a la papa
    bombo: {
      NAME: 'GUARDIÁN DEL TAMBOR', HP: 5, W: 22, H: 26,
      IDLE_TIME: 1.4,
      ROLL_SPEED: 190,
      ROLL_PASSES: 2,       // cruces de pared a pared (uno más si está enojado)
      HANG_TIME: 2.6,       // colgado tocando el redoble (viento)
      GUST_EVERY: 0.32,
      HOPS: 3,
      CROUCH_TIME: 0.3,
      HOP_TIME: 0.75,
      HOP_DISTANCE: 3,      // bloques máximos por salto
      LAND_TIME: 0.3,
      TIRED_TIME: 1.6,      // cansado: se le pisa y no daña
      ROLLS: 6,
      ROLL_EVERY: 0.35,
      WAVE_SPEED: 95
    }
  },

  // Planeo: con la habilidad, mantener el salto al caer limita la velocidad de caída
  GLIDE: {
    FALL_SPEED: 45
  },

  // Gancho: se lanza a las anillas "o" (E o Cuadrado) y la papa queda colgando.
  // Colgada: izquierda/derecha avanza por una fila de anillas, salto suelta
  // hacia arriba, abajo suelta y dash sale disparada
  HOOK: {
    RANGE: 104,           // px hasta la anilla (6,5 bloques)
    PULL_SPEED: 320,      // px/s al tirar de la cuerda
    HANG_SPEED: 70,       // px/s colgada por una fila de anillas
    HANG_OFFSET: 10,      // px bajo el borde de arriba de la anilla (las manos)
    JUMP: 300,            // salto al soltarse
    STUCK_TIME: 0.15,     // si algo frena el tirón este tiempo, se suelta
    ROPE: '#f0d9a8',
    MARK: '#ffd34d'       // marca de la anilla elegida
  },

  // Sonidos que guían (js/echoes.js): corcheas y jefes suenan más fuerte cuanto más cerca.
  // TIERS: [distancia máxima en bloques, volumen de 0 a 1], de lo más cerca a lo más lejos
  ECHO: {
    TIERS: [[3, 1], [9, 0.8], [12, 0.5], [18, 0.15], [20, 0.03]],
    MUSIC_FADE: 3,                           // qué tan rápido sube o baja la música (más = más rápido)
    // Volumen mínimo de la música en una sala sin afinar (antes de la misión y mientras
    // buscas las corcheas): así la sala nunca queda muda. 0 = silencio, como antes
    IDLE_MUSIC: 0,          // sin corcheas cerca, silencio
    CATCH_BOOST: 2.5,       // segundos de música fuerte al atrapar una corchea
    // Con las corcheas juntadas suena el blues en Mi menor: al 20 % lejos de la llave
    // y más fuerte al acercarse; con la llave en la mano, al 100 %
    KEY_TIERS: [[10, 0.9], [15, 0.7], [30, 0.45]],
    KEY_BASE: 0.2,
    DRONE_FREQS: [65.41, 77.78, 98.0, 110.0], // Do menor con sexta, grave: Do, Mi bemol, Sol, La
    DRONE_VOLUME: 0.5,
    DRONE_FILTER: 420,                       // Hz: más bajo = más apagado
    DRONE_BREATH: 0.12,                      // respiraciones por segundo del acorde
    // Áreas que se ven con la tecla 7 (radio en bloques), de afuera hacia adentro
    AREAS: [
      { radius: 20, color: '#ff4d4d', alpha: 0.10 },   // lejos
      { radius: 12, color: '#ffd34d', alpha: 0.14 },   // medio
      { radius: 3,  color: '#3fd16b', alpha: 0.22 }    // cerca
    ]
  },

  // Solo dibujo (no cambia choques)
  DRAW: {
    DRUM_SCALE: 1.4,          // tambor más grande que su celda
    STOMP_MARK: '#ffd34d'     // flecha sobre el jefe cuando se le puede pisar
  },

  HAZARDS: {
    CRUMBLE_DELAY: 0.5,   // segundos sobre "~" antes de caer
    CRUMBLE_RESPAWN: 3,   // segundos hasta que vuelve
    // Piedra que se hunde ("b"): con la papa encima baja despacio; sola, vuelve a subir
    SINK_SPEED: 14,       // px/s hacia abajo con la papa encima
    SINK_RISE: 22,        // px/s de vuelta hacia arriba
    SINK_MAX: 22,         // px que puede hundirse como máximo
    MOVER_RANGE: 1.5,     // bloques de ida y vuelta desde su centro
    MOVER_PERIOD: 3,      // segundos por vuelta completa
    // Plataforma "I": por defecto sube LIFT_RANGE/2 y baja LIFT_RANGE/2 desde donde está
    // dibujada, pero nunca entra en bloques (se acorta sola si choca).
    // Cada una se puede ajustar en su nivel con "lifts" (ver setupLifts en js/level.js)
    LIFT_RANGE: 7,        // bloques que recorre en total
    LIFT_PERIOD: 5,       // segundos por viaje de ida y vuelta
    LIFT_SNAP: 8,         // px: solo sostiene si los pies están casi encima (desde abajo se atraviesa)
    CONVEYOR_SPEED: 45    // px/s que empujan las cintas
  },

  // Corcheas: duermen hasta tocar el tótem; despiertas, a SEE bloques te ven
  // (sale un "!") y huyen dando saltitos. Se atrapan tocándolas
  CORCHEA: {
    SEE: 5,                 // bloques a los que te ven
    CALM: 10,               // bloques: más lejos dejan de huir
    ALERT_TIME: 0.45,       // segundos con el "!" antes de huir
    SPEED: 90,              // px/s huyendo
    HOP: 300,               // salto de cada saltito (alto: cambian de plataforma)
    HOP_EVERY: 0.42,
    MAX_DROP: 9             // no se tiran por bordes más altos que esto (bloques)
  },

  // Agua: se nada en la superficie; con el buceo se puede bajar
  WATER: {
    GRAVITY_MULT: 0.3,
    MAX_FALL: 60,
    SPEED_MULT: 0.65,
    STROKE: 150,            // brazada hacia arriba (salto en el agua)
    JUMP_OUT: 330,          // salto para salir por la superficie
    FLOAT: 520,             // empuje hacia la superficie sin buceo
    FLOAT_DEPTH: 6,         // px bajo la superficie donde flota
    DIVE_SPEED: 70,
    CURRENT: 75,            // px/s que empuja una corriente ({ o })
    REFLECT: { ROWS: 5, ALPHA: 0.4 }   // reflejo de la papa en el agua (lago espejo)
  },

  // Rayos de las máquinas: se prenden y se apagan al pulso (en sus dos pulsos)
  // Géiser (zona 5): salta al pulso de la música y lanza a la papa hacia arriba
  GEYSER: {
    REACH: 7,             // bloques de alto del chorro
    EVERY: 4,             // cada cuántos pulsos salta
    ON: 0.9,              // segundos que dura el chorro
    WARN: 0.6,            // segundos que burbujea antes
    LIFT: 430             // velocidad hacia arriba (px/s)
  },

  // Columnas de viento (V): sin planeo frenan la caída (se baja despacito);
  // planeando, suben a la papa
  WIND_UP: {
    ACCEL: 1400,          // empuje hacia arriba (px/s²)
    SINK: 30,             // sin planeo: velocidad de bajada dentro del viento
    MAX_UP_GLIDE: 190     // planeando: velocidad de subida
  },

  RAYO: {
    REACH: 4,               // bloques hacia abajo como máximo
    COLOR: '#ff4d6d'
  },

  // Viento del Guardián del Tambor colgado del techo
  WIND: {
    PUSH: 150               // px/s que empuja a la papa
  },

  PLAYER: {
    W: 12,                // hitbox (algo más que la papa vieja de 10 × 18, para la papa HD)
    H: 20,
    RUN_SPEED: 100,       // caminar
    SPRINT_MULT: 1.5,     // mantener E o Cuadrado: corre x1,5
    STREAK: { EVERY: 0.05, LIFE: 0.22, LENGTH: 8 },   // líneas detrás al correr
    HURT_POSE: 0.4,       // segundos con la pose de golpe (papa_dano)
    POWER_POSE: 1.2,      // segundos con la pose de ganar un poder (papa_poder)
    // Baile del mix (js/player.js): paso hacia atrás lento y corto, saltito y giro en el aire
    DANCE: { MOVE_TIME: 0.45, MOON_SPEED: 26, MOON_MAX: 18, HOP: 230, SPIN: 14 },
    ACCEL: 700,
    FRICTION: 800,
    GRAVITY: 900,
    MAX_FALL: 260,
    RUN_ANIM_MIN: 5,

    JUMP_SPEED: 317,
    JUMP_CUT: 0.45,
    COYOTE: 0.08,
    JUMP_BUFFER: 0.1,
    AIR_JUMPS: 1,
    DOUBLE_JUMP_SPEED: 280,

    DASH_SPEED: 260,
    DASH_TIME: 0.28,      // máximo si mantienes el botón (unos 5 bloques)
    DASH_MIN_TIME: 0.03,  // mínimo con un toque corto (menos de 1 bloque)
    DASH_COOLDOWN: 0.3,
    GHOST_INTERVAL: 0.03,
    GHOST_LIFE: 0.25,
    GHOST_FADE: 0.08,     // al terminar el dash, la estela se borra rápido

    WALL_CHECK: 2,
    WALL_SLIDE: 50,
    WALL_JUMP_X: 140,
    WALL_JUMP_Y: 290,
    WALL_JUMP_LOCK: 0.14,

    DRUM_BOUNCE: 480,

    // ---------- Plataformas de paso (_ y puente -) ----------
    DROP_TIME: 0.22,      // segundos que las ignora al bajar con abajo

    // ---------- Zapateo (poder del Toro Dorado, sala 12): abajo + salto en el aire ----------
    STOMP: {
      WAIT: 0.09,         // se queda quieta un instante en el aire
      SPEED: 560,         // y baja de golpe
      SHAKE: 4,           // temblor al caer
      RADIUS: 3.5,        // bloques: aturde a los enemigos del suelo cerca
      GHOST_EVERY: 0.025
    },

    // ---------- Peso ----------
    // MASS 1 = la papa de siempre. Más masa: acelera y frena más lento,
    // conserva más el impulso del dash y rebota menos (tambor y enemigos)
    MASS: 1,
    FALL_GRAVITY_MULT: 1.1,   // gravedad al caer (1 = igual que al subir; más = cae con más peso)
    AIR_CONTROL: 1,           // control en el aire (1 = como en el suelo, 0.5 = la mitad)

    // ---------- Dash + salto: DASH → DASH_JUMP → DASH_AIR → DASH_LAND ----------
    // Saltar durante el dash ya no lo corta: el salto sale con la velocidad del dash
    DASH_JUMP: {
      KEEP_X: 1,              // parte de la velocidad del dash que hereda el salto (1 = toda)
      AIR_DRAG: 160,          // px/s² que pierde en el aire mientras va más rápido que corriendo
      PERFECT_WINDOW: 0.05,   // segundos desde que empieza el dash para el salto perfecto (~3 cuadros)
      PERFECT_X: 1.12,        // empuje extra de lado del salto perfecto
      PERFECT_Y: 1,           // empuje extra hacia arriba (1 = nada, para no saltarse puertas de poderes)
      PERFECT_FLASH: 0.15,    // segundos que brilla la papa al lograrlo
      TRAIL_EVERY: 0.045,     // estela en el aire: una copia cada tantos segundos
      TRAIL_LIFE: 0.18
    },
    DASH_LAND: {
      TIME: 0.18,             // segundos que patina al aterrizar de un dash-salto
      SLIDE: 0.35             // fricción mientras patina (1 = normal, menos = patina más)
    },

    // ---------- Aterrizaje ----------
    LANDING: {
      SQUASH: 0.28,           // cuánto se aplasta al caer (0.28 = 28 % más ancha)
      STRETCH: 0.16,          // cuánto se estira al saltar
      SQUASH_TIME: 0.14,      // segundos que tarda en volver a su forma
      SHAKE_FROM: 3,          // bloques de caída a partir de los que tiembla la cámara
      SHAKE_PER_TILE: 0.6,    // píxeles de temblor por cada bloque de más
      SHAKE_MAX: 4,
      SHAKE_TIME: 0.18,
      DUST_MIN: 2,            // granos de polvo en una caída corta
      DUST_MAX: 9             // y en una caída larga
    }
  },

  // Materiales del suelo. Cada letra del mapa puede tener su material en TILES;
  // las que no están son tierra. ACCEL y FRICTION multiplican los del jugador,
  // SPEED la velocidad máxima, DUST es el color del polvo al aterrizar
  MATERIALS: {
    TILES: {
      z: 'barro',         // barro del pantano (zona 3)
      i: 'hielo',         // hielo que resbala (zona 5)
      s: 'nieve'          // nieve blanda: se corre y se salta menos (zona 5)
      // ejemplo: 'i': 'hielo', 'm': 'metal', 'a': 'arena'
    },
    tierra: { ACCEL: 1,    FRICTION: 1,    SPEED: 1,    DUST: '#b89a72' },
    hielo:  { ACCEL: 0.35, FRICTION: 0.15, SPEED: 1.1,  DUST: '#e4f6ff' },
    barro:  { ACCEL: 0.6,  FRICTION: 2.2,  SPEED: 0.7,  DUST: '#6b4e2e' },
    metal:  { ACCEL: 1,    FRICTION: 0.8,  SPEED: 1,    DUST: '#c9c9d4' },
    arena:  { ACCEL: 0.75, FRICTION: 1.6,  SPEED: 0.85, DUST: '#e6cf8f' },
    nieve:  { ACCEL: 0.7,  FRICTION: 1.8,  SPEED: 0.72, JUMP: 0.84, DUST: '#ffffff' }
  }
};
