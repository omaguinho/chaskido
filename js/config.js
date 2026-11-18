const CONFIG = {
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
  TITLE_MENU: { TOP: 90, STEP: 11, LEFT: 176 },   // filas del menú de inicio (para tocarlas)
  TITLE_PORTADA: false,   // true: la pantalla de inicio usa portada.png y logo.png en vez de la escena animada
  LANG_MENU: { TOP: 104, STEP: 16 },      // filas del menú de idioma (la primera vez)
  GAME_OVER_MENU: { TOP: 96, STEP: 16 },   // filas del menú de game over
  COLORS: {
    SMOKE: '#e8e4ff',        // humo que lleva a la llave y a la puerta
    NOTE_SMOKE: '#e9c46a'    // humo dorado a la corchea más cercana (solo en Fácil)
  },   // filas del menú de dificultad (para tocarlas)

  GAME: {
    MAX_HEARTS: 10,       // corazones máximos (3 al empezar + 7 retos)
    CUBES_PER_LIFE: 5,    // 5 cubos sonoros = 1 corazón recuperado
    BEATS_PER_SWITCH: 4,  // cada cuántos pulsos cambian las plataformas rítmicas
    MESSAGE_TIME: 3,      // segundos que dura un mensaje
    MESSAGE_SPEED: 0.55,  // los mensajes de paso duran esto del tiempo pedido (más rápidos)
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
    { id: 'shell',      name: 'Caracol', key: 'KeyO',  say: 'el caracol del eco',
      text: 'Ganaste el caracol del eco: quieta, mantén E o Cuadrado y soplas.' }
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
    shell: '#f7e3a1'
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
      { prefix: 'papa_', scale: 1.35, anchor: 'bottom' },
      { prefix: 'sprite_', scale: 1.5, anchor: 'center' },
      { names: ['corchea', 'corchea_alerta', 'corchea_huir'], scale: 1.35, anchor: 'bottom' },
      { names: ['moneda', 'moneda_chica', 'fruta', 'fruto', 'maiz', 'aji', 'cubo', 'corazon_extra',
                'llave', 'llave_color', 'nota_escala'], scale: 1.15, anchor: 'center' },
      // Enemigos que vuelan o cuelgan: crecen desde el medio
      { prefix: ['paloma_', 'colibri_', 'libelula_', 'nube_granizo', 'murcielago_', 'mono_'], scale: 1.15, anchor: 'center' },
      // Enemigos que caminan: apoyados en el piso
      { prefix: ['escarabajo_', 'cuy_', 'disparador_', 'oruga_', 'barrendero_', 'rueda_', 'escorpion_', 'topo_',
                 'armadillo_', 'brasa_', 'zorro_', 'bola_nieve', 'vizcacha_', 'rana_', 'pez_', 'garza_'], scale: 1.15, anchor: 'bottom' },
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
  CAMERA_PAN: { GO: 0.9, HOLD: 0.8, BACK: 0.9, LERP: 0.08, GATE_TIME: 1.2 },

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

  // ---------- Caracol del eco (poder del Cóndor de Bronce, sala 21) ----------
  // Quieta (sin moverte) y con E o Cuadrado apretado HOLD segundos: soplas. La onda
  // hace aparecer las plataformas ocultas (h) para siempre y despeja la niebla (O) un rato
  SHELL: {
    HOLD: 0.45,           // segundos apretando antes de soplar
    RADIUS: 7,            // bloques que alcanza la onda
    CLEAR_TIME: 6,        // segundos que la niebla queda despejada
    COOLDOWN: 0.8,
    WAVE_TIME: 0.9,       // lo que dura el dibujo de la onda
    FOG_ALPHA: 0.78,      // qué tan tapada está la niebla (0 a 1)
    FOG_COLOR: '#c9bfe6'
  },

  // Música: archivos en assets/music/
  LOAD_WAIT: 10,   // segundos máximos de "Cargando..." (después empieza igual)
  RETRY_AFTER: 3,  // segundos después de empezar: se piden otra vez los dibujos que no llegaron

  MUSIC: {
  PATH: 'assets/music/',
  TRACKS: {
    main: 'blues_do_mayor.mp3',   
    key: 'blues_do_mayor.mp3',    
    final: 'blues_mi_menor.mp3'   
  },
  FALLBACK: { final: 'blues_do_mayor.mp3' },

  // ESTO YA LO TENÍAS (Rutas de los archivos):
  STEMS: {
    bajo: 'instrument/bajo.m4a',
    percusion: 'instrument/percusion.m4a',
    teclado: 'instrument/teclado.m4a'
  },

  // ESTO ES LO NUEVO QUE DEBES AGREGAR (Nombres para el menú):
  STEM_NAMES: {
    bajo: 'Bajo',
    percusion: 'Percusión',
    teclado: 'Teclado'
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
