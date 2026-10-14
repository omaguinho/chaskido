const CONFIG = {
  WIDTH: 320,             // la cámara muestra 20 x 11 bloques
  HEIGHT: 180,
  TILE: 16,
  STEP: 1 / 60,
  CAMERA_LERP: 0.15,
  FONT: '"Press Start 2P", monospace',
  MAX_RENDER_SCALE: 4,    // el lienzo dibuja hasta 4x más fino (sprites a 4x)
  TITLE_MENU: { TOP: 102, STEP: 13 },      // filas del menú de dificultad (para tocarlas)
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
    READY_DELAY: 0.4,     // portada, menú y GAME START: espera antes de aceptar
    HURT_TIME: 1,         // invulnerable tras perder una vida
    END_DELAY: 1,         // espera antes de aceptar toques en pantallas finales
    START_ABILITIES: [],  // nivel 1: solo correr y saltar
    SETTINGS_KEY: 'chasqui_opciones', // volumen y vibración elegidos en la pausa
    RECORDS_KEY: 'chasqui_records',   // mejores tiempos y Nueva partida + desbloqueada
    SAVE_KEY: 'chaskido_partida',     // la partida guardada (posta o menú de pausa)
    FIRST_ROOM: 'n2',                 // donde empieza una partida nueva
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
  NEW_GAME_PLUS_ABILITIES: ['dash', 'hook'],

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
    { id: 'dive',       name: 'Buceo',  key: 'KeyI',   say: 'el buceo',
      text: 'Ganaste el buceo: abajo dentro del agua para sumergirte.' }
  ],

  // Skin provisional: color según la última habilidad obtenida
  SKINS: {
    dash: '#6fd3ff',
    wallJump: '#7be07b',
    airDash: '#ffb347',
    doubleJump: '#ff7ad9',
    hook: '#f0b860',
    glide: '#b8e0ff',
    dive: '#6fa8c7'
  },

  // Música: archivos en assets/music/
  MUSIC: {
    PATH: 'assets/music/',
    TRACKS: {
      main: 'blues_do_mayor.mp3',   // mientras juegas
      key: 'blues_mi_menor.mp3'     // cuando tienes la llave
    },
    BPM: 120,
    // Cada nivel puede subir o bajar la música en semitonos ("pitch" en levels.js).
    // Al cambiar el tono también cambia la velocidad, y el ritmo del nivel la sigue.
    BOSS_TRACK: 'key',              // durante la pelea suena la versión en menor
    ERROR_SHOW: 6                   // segundos que se ve el aviso si una música no carga
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
    SHOT_LIFE: 3            // segundos antes de desaparecer
  },

  // Monedas que sueltan los enemigos (se gastan con los vendedores)
  COINS: {
    DROP: { beetle: 1, cuy: 1, shooter: 2, paloma: 1, oruga: 1, colibri: 2, mono: 2, barrendero: 2 },
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
  ARENA_LIGHT: { INNER: 26, OUTER: 115, DARK: 0.62 },

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
      NAME: 'CÓNDOR DE BRONCE', HP: 4, W: 28, H: 24, ANGRY_SPEED: 1.2,
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
    SPEED: 62,              // px/s huyendo
    HOP: 190,               // salto de cada saltito
    HOP_EVERY: 0.42,
    MAX_DROP: 5             // no se tiran por bordes más altos que esto (bloques)
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
    DIVE_SPEED: 70
  },

  // Rayos de las máquinas: se prenden y se apagan al pulso (en sus dos pulsos)
  RAYO: {
    REACH: 4,               // bloques hacia abajo como máximo
    COLOR: '#ff4d6d'
  },

  // Viento del Guardián del Tambor colgado del techo
  WIND: {
    PUSH: 150               // px/s que empuja a la papa
  },

  PLAYER: {
    W: 10,                // hitbox (el sprite mide 16×24)
    H: 18,
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

    DRUM_BOUNCE: 480
  }
};
