// =====================================================================
// PERSONAJES: la base de datos de toda la gente del juego.
// Los nombres son inventados (mezclas de sonidos), no nombres reales de papas
// ni de pueblos. Cada vecino tiene:
//   personalidad  cómo es (para quien escribe sus frases; el juego no la usa)
//   saludos       lo que grita en su globo al verte (uno al azar)
//   inicio        lo primero que te dice al hablarle (según su personalidad)
//   lines         lo que te cuenta después, una por vez (lore y pistas)
//   after         lo que dice cuando ya te dio su regalo (si tiene)
// Campos de juego: room (sala), dx (bloques desde la llegada), kind y color
// (dibujo), gift (regalo), tuned (llega cuando la sala vuelve a sonar),
// bossBeaten / goneAfter / sprite / noStomp (el Rasgueador), hard (el difícil).
// Los textos van en español; las traducciones están en js/idiomas.js.
// =====================================================================
const PERSONAJES = {
  // Guardián del portón de cada jefe. Antes de abrirse da pistas (CONFIG.GATE_GUARD);
  // con el portón abierto comenta cosas suyas, una al azar (despues)
  GUARDIAS: {
    n3: { name: 'Alcato', personalidad: 'Nervioso, todo lo cuenta con ritmo.',
          saludos: ['¡Oye, tú!', '¡Pst, chasqui!', 'Tum... tum...'],
          despues: ['Desde que volvió el tambor, mi corazón late a tiempo. Antes iba a destiempo.',
                    'Mi abuela decía que el primer tambor se hizo con un tronco hueco y mucha paciencia.',
                    'Hoy voy a cenar algo con ají. Mucho ají.'] },
    n6: { name: 'Guañito', personalidad: 'Curioso y preguntón.',
          saludos: ['¿Y tú quién eres?', '¡Ey, ey!', '¿Viste eso?'],
          despues: ['¿Los cuyes sueñan? Yo creo que sueñan con alfalfa.',
                    'Estoy contando las hojas de ese árbol. Voy en mil doscientas... o mil trescientas.',
                    'Dicen que en la otra orilla hay una feria. Algún día voy.'] },
    n9: { name: 'Capirolo', personalidad: 'Dormilón.',
          saludos: ['Zzz... ¿eh?', 'Mmm...', '¡Ah! No estaba durmiendo.'],
          despues: ['El barro calentito es lo mejor para una siesta.',
                    'Soñé que era un charango. Sonaba un poco desafinado.',
                    'Cuando llueve, el pantano canta. Escucha.'] },
    n12: { name: 'Tomasina', personalidad: 'Orgullosa y elegante.',
           saludos: ['¡Alto ahí!', 'Buenas, buenas.', '¿Me hablas a mí?'],
           despues: ['Este sombrero es de mi bisabuela. Tiene más años que la ciudad.',
                     'En las fiestas del templo, yo bailaba en primera fila. Siempre.',
                     'El dorado no se pule solo, ¿sabes?'] },
    n15: { name: 'Perrichón', personalidad: 'Poeta friolento.',
           saludos: ['Brrr, ¡hola!', '¿Frío? ¿Qué frío?', 'Ejem...'],
           despues: ['Si el hielo suena, es que está contento. Eso creo.',
                     'Me pregunto si los osos tienen frío. Seguro que no.',
                     'Estoy escribiendo un poema sobre la nieve. Solo tengo la primera palabra: nieve.'] },
    n18: { name: 'Uniquí', personalidad: 'Soñadora del agua.',
           saludos: ['¡Hola, hola!', 'Glub...', '¿Oíste a las ranas?'],
           despues: ['Las ranas cantan en terceras. Lo aprendí escuchando toda la noche.',
                     'El lago guarda todo lo que se le cae. Hasta canciones.',
                     'A veces tiro una piedrita y cuento los círculos. Hoy fueron siete.'] },
    n21: { name: 'Ojo de Pardo', personalidad: 'Vigía solemne.',
           saludos: ['Atención.', 'Te vi venir.', 'Hum.'],
           despues: ['Desde aquí se ve toda la ciudad. Cada día suena un poco más.',
                     'El viento trae noticias. Hoy trae olor a pan.',
                     'Los cóndores vuelan sin mover las alas. Yo lo intento y me caigo.'] }
  },
  FIESTA: 'Tarmelina',                       // la vecina que habla en la fiesta del prólogo
  FIESTA_SALUDOS: ['¡Ven a bailar!', '¡Qué fiesta!', '¡Hola, chasqui!'],
  VENDEDORES: { viajero: 'Don Revuelo', cocinera: 'Doña Huevina', coleccion: 'Tío Torito' },

  VECINOS: [
    // ---------- Uno por zona: cuentan el lore y dan pistas ----------
    { id: 'z1', name: 'Wairolo', room: 'n2', dx: 5, kind: 'flauta', color: '#9fd3e0',
      personalidad: 'Ansioso: habla rápido y quiere contarlo todo antes de que se le olvide.',
      saludos: ['¡Espera, espera!', '¡Ven rápido!', '¡Tengo que decirte algo!'],
      inicio: '¡Por fin alguien! Tengo mil cosas que contarte y se me van a olvidar. ¡Escucha, escucha!',
      lines: ['Aprieta Pausa y mira el mapa: las salas que ya pisaste se van dibujando, y abajo ves los instrumentos que rescataste.',
              '¿Viste la fiesta? Estábamos todos bailando cuando la plaza se quedó muda. El Silencio llegó sin hacer ruido.',
              'Los instrumentos se asustaron y escaparon por la ciudad. ¡Tú eres chasqui: tráelos de vuelta!'] },
    { id: 'z2', name: 'Yongai', room: 'n1', dx: 5, kind: 'aplaude', color: '#f4b6c2',
      personalidad: 'Optimista: todo le parece una buena señal.',
      saludos: ['¡Hola, hola!', '¡Qué buena suerte!', '¡Sabía que vendrías!'],
      inicio: '¡Sabía que hoy iba a pasar algo bueno! Me picaba la nariz desde la mañana.',
      lines: ['¡Venciste al Guardián del Tambor! Ahora vuelve a las Acequias Hondas: hay un muro amarillo que se abre con la nota Re.',
              'Antes teníamos música y los animales no nos atacaban: bailaban con nosotros en la plaza.',
              'Sin música, a los animales les salió un aura oscura. No son malos: están tristes y asustados.'] },
    { id: 'z3', name: 'Peronita', room: 'n7', dx: 5, kind: 'baila', color: '#8fbf9a',
      personalidad: 'Distraída: habla sola y se olvida de que la escuchan.',
      saludos: ['...y entonces la música...', 'Mmm, mmm...', '¿Dónde dejé el compás?'],
      inicio: 'Hoy debería haber música aquí... y no hay. Y yo no sé qué hacer con los pies. Ah, hola. ¿Estabas ahí?',
      lines: ['¿Te cansaste de una canción? En Pausa → Opciones puedes bajar la música o cada instrumento.',
              'Este bosque cantaba solo: los pájaros, el viento, las hojas. Ahora solo se oyen mis pasos.',
              'Las raíces todavía recuerdan las canciones. Si escuchas bien, se nota un vals muy bajito.'] },
    { id: 'z4', name: 'Canchulo', room: 'n10', dx: 5, kind: 'tambor', color: '#e8c58e', gift: { coins: 59 },
      personalidad: 'Generoso y ruidoso: trata a todos de compadre.',
      saludos: ['¡Eh, compadre!', '¡Tengo algo para ti!', '¡Acércate, acércate!'],
      inicio: '¡Compadre! Hoy ando generoso, aprovecha antes de que se me pase.',
      lines: ['Toma, para el camino: 59 monedas. ¡Gástalas bien!',
              'En el templo dorado, el toro guardaba el ritmo de la ciudad. El Silencio lo volvió furioso.'],
      after: ['¿Ya gastaste mis monedas? ¡Que suene la música!'] },
    { id: 'z5', name: 'Tumbiri', room: 'n13', dx: 5, kind: 'cuerdas', color: '#c9b8e3',
      personalidad: 'Friolento y quejón, pero de buen corazón.',
      saludos: ['¡Brrr!', 'Qué frío...', '¿Traes una frazada?'],
      inicio: 'Brrr... perdona, se me congelan hasta las palabras. ¿Qué querías?',
      lines: ['Con el planeo, vuelve al Puerto de los Molinos: en el muelle del oeste, el muro de Sol te deja cruzar el mar.',
              'Cuando el Silencio pasó por aquí, la música se congeló. Dicen que los ecos quedaron atrapados en el hielo.'] },
    { id: 'z6', name: 'Wenqui', room: 'n16', dx: 5, kind: 'baila', color: '#9fd3e0',
      personalidad: 'Nostálgica: siempre está mirando el pasado.',
      saludos: ['Ay...', '¿Lo ves tú también?', 'Antes era distinto...'],
      inicio: 'Ay, perdona. Me quedé mirando el lago otra vez. A veces creo que todavía se oye la fiesta.',
      lines: ['La cascada de la Orilla de Juncos no se escala: se sube buceando. Arriba está la Ciudadela de Niebla.',
              'Mira el lago: refleja la ciudad como era antes, con faroles y fiesta. Por eso duele mirarlo.'] },
    { id: 'z7', name: 'Abuela Compita', room: 'n19', dx: 5, kind: 'aplaude', color: '#f7e3a1',
      personalidad: 'Sabia y tranquila: cuenta las cosas como cuentos.',
      saludos: ['Siéntate un rato.', 'Escucha, chasqui...', 'Ven, ven, despacito.'],
      inicio: 'Siéntate un momento. Los viejos sabemos cosas que los mapas no dicen.',
      lines: ['La puerta dorada del Bosque lleva al último jefe. Solo se abre si rescataste los instrumentos de todos los niveles.',
              'El Silencio no odia la música: le tiene miedo. Dicen que nació antes que todas las canciones.',
              'En la música, primero está el silencio. De ahí nace el ritmo, y del ritmo, la melodía.'] },

    // ---------- Habla de los jefes secretos y de lo que dan ----------
    { id: 'sabio', name: 'Don Mantango', room: 'n5', dx: 8, kind: 'flauta', color: '#e8c58e',
      personalidad: 'Misterioso: habla en susurros, como si contara secretos.',
      saludos: ['¡Psst!', 'Tengo un secreto...', 'No se lo digas a nadie...'],
      inicio: 'Psst... acércate. No todos los guardianes están en el camino. ¿Quieres saber dónde?',
      lines: ['Hay jefes que no están en el camino. Se esconden, pero lo que dan vale la pena.',
              'Arriba de Calles del Ocaso, donde solo se llega con doble salto, toca el Rasgueador. Dicen que guarda una quena... pero no se la da a cualquiera.',
              'Al este de estas acequias duerme un tótem de piedra. Dicen que guarda un corazón más.',
              'En las geodas, en el granizo y en el fondo del lago hay otros guardianes. Cada uno enseña algo que no se aprende en otro lado.'] },

    // ---------- El Rasgueador, ya vencido, se queda en su sala ----------
    // Zona 1: da pistas (se va cuando lo vences en la zona 7). Zona 7: te da la quena
    // (premio de la pelea), pide liberar a todos los animales y, al cumplir, da la zampoña.
    { id: 'rasgueador', name: 'El Rasgueador', room: 'j1', dx: 17, sprite: 'charanguero_tocar', bossBeaten: true,
      goneAfter: 'j7', noStomp: true,
      personalidad: 'Orgulloso y reservado: no dice lo que busca.',
      saludos: ['♪ Tran, tran...', 'Hmpf.', '¿Otra vez tú?'],
      inicio: 'Buen golpe, chasqui. Hace tiempo que nadie me ganaba.',
      lines: ['Ando buscando algo. No te voy a decir qué, pero tengo mis razones.',
              'Dicen que en la Ciudadela de Niebla todavía se escucha un charango. Cuando toda la ciudad vuelva a sonar, búscame por allá.'] },
    { id: 'rasgueador7', name: 'El Rasgueador', room: 'j7', dx: 17, sprite: 'charanguero_tocar', bossBeaten: true,
      noStomp: true, gift: { power: 'zampona', when: function (game) { return Codex.freedLeft(game) === 0; } },
      personalidad: 'Ya sin orgullo: por fin cuenta lo que buscaba.',
      saludos: ['♪ Tran, tran...', 'Ven, chasqui.', '¿Cuántos llevas?'],
      lines: [
        function (game) {
          if (Codex.freedLeft(game) === 0) return '¡Todos libres! ¿Escuchas? Así sonaba la ciudad. Toma mi zampoña: te la ganaste.';
          return 'Me ganaste otra vez. Ahora te digo lo que buscaba: a los animales. Antes bailaban con mis cuerdas.';
        },
        'Por eso te di mi quena: libéralos a todos con ella. Cuando estén todos libres, vuelve: te doy mi zampoña.',
        function (game) {
          const C = Codex.freed(game);
          return 'Llevas ' + C.got + ' de ' + C.total + ' animales liberados.';
        },
        'Si pisas a uno, no se pierde: vuelve a aparecer y todavía lo puedes liberar.'],
      after: ['Las siete cañas de la zampoña son las siete notas del diapasón. Tócalas y el aire te sostiene.',
              'Ya no busco nada, chasqui. Ahora solo toco.'] },

    // ---------- Llegan cuando la sala vuelve a sonar: vienen por la música ----------
    { id: 't1', name: 'Chauchi', room: 'n2', dx: 9, kind: 'aplaude', color: '#ffd34d', tuned: true,
      personalidad: 'Bailarín eufórico.',
      saludos: ['¡Música!', '¡A bailar!', '¡Uy, uy, uy!'],
      lines: ['¡Escuché el bajo desde mi casa y vine corriendo! ¿Bailamos?'] },
    { id: 't2', name: 'Pukito', room: 'n1', dx: 9, kind: 'baila', color: '#9fd3e0', tuned: true,
      personalidad: 'Agradecido y tierno.',
      saludos: ['¡Gracias, gracias!', '¡Volvió!', '¡Hola, chasqui!'],
      lines: ['Volvió la música y mi perro dejó de gruñir. ¡Gracias, chasqui!'] },
    { id: 't3', name: 'Murito', room: 'n7', dx: 9, kind: 'flauta', color: '#c9b8e3', tuned: true,
      personalidad: 'Músico tímido: le cuesta hablar, prefiere tocar.',
      saludos: ['Eh... hola.', '♪...', 'Perdón...'],
      lines: ['Traje mi quena: ahora que el bosque suena otra vez, quiero tocar con él.'] },
    { id: 't4', name: 'Lionca', room: 'n10', dx: 9, kind: 'cuerdas', color: '#f4b6c2', tuned: true,
      personalidad: 'Deportista: todo lo cuenta como una carrera.',
      saludos: ['¡Uf, llegué!', '¡Una, dos!', '¡Qué subida!'],
      lines: ['Subí toda la escalinata siguiendo la música. ¡Valió la pena!'] },
    { id: 't5', name: 'Sumito', room: 'n13', dx: 9, kind: 'tambor', color: '#8fbf9a', tuned: true,
      personalidad: 'Sensible: siente la música en el cuerpo.',
      saludos: ['¿Lo sientes?', 'Tum, tum...', 'Ahh, qué rico.'],
      lines: ['El hielo se derrite cuando suena el tambor. Lo sentí en los pies.'] },
    { id: 't6', name: 'Amarola', room: 'n16', dx: 9, kind: 'aplaude', color: '#f7e3a1', tuned: true,
      personalidad: 'Poética: habla con imágenes.',
      saludos: ['Mira el agua...', '¡Qué luz!', 'Escucha el lago.'],
      lines: ['Ahora el lago refleja lo que hay de verdad: una ciudad que vuelve a bailar.'] },
    { id: 't7', name: 'Marivi', room: 'n19', dx: 9, kind: 'baila', color: '#ff9a6b', tuned: true,
      personalidad: 'Decidida: ya está pensando en la última pelea.',
      saludos: ['¡Vamos!', '¡Ya casi!', '¡No pares!'],
      lines: ['Ya casi. Cuando la ciudad entera suene, el Silencio no va a tener dónde esconderse.'] },

    // ---------- El difícil: se deja pisar tres veces o te vende su tesoro ----------
    { id: 'dificil', name: 'Compichi', room: 's3', dx: 6, kind: 'baila', color: '#ff6b8a', gift: { heart: true, coins: 300 },
      personalidad: 'Pícaro y burlón: le encanta que lo persigan.',
      saludos: ['¡Atrápame!', '¡Je, je!', '¡A que no puedes!'],
      lines: ['¿Quieres mi tesoro? Págame 800 monedas... o intenta pisarme tres veces.'],
      after: ['Ya tienes mi tesoro. ¡Nadie me había alcanzado!'],
      hard: { HP: 3, PRICE: 800, SPEED: 150, JUMP: 300, SEE: 70,
              WIN: '¡Me alcanzaste! Toma mi tesoro: un corazón más y 300 monedas.',
              PAID: 'Trato hecho. Toma mi tesoro: un corazón más y 300 monedas.' } }
  ]
};

// Lo que usa el resto del juego
CONFIG.VECINOS = PERSONAJES.VECINOS;
CONFIG.CODEX.GUARD_NAMES = {};
Object.keys(PERSONAJES.GUARDIAS).forEach(function (r) { CONFIG.CODEX.GUARD_NAMES[r] = PERSONAJES.GUARDIAS[r].name; });
CONFIG.CODEX.FIESTA_NAME = PERSONAJES.FIESTA;
CONFIG.CODEX.VENDOR_NAMES = PERSONAJES.VENDEDORES;
