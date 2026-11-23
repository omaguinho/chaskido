# Diccionario del informe de juego (Chaskido)

Cada fila de la hoja **Sesiones** es una partida de una persona. Una sesión empieza al salir de la portada hacia el juego y termina al volver a la portada, al cerrar la página, con "Nuevo jugador" o tras 5 minutos sin tocar nada.

## Quién, cuándo y cómo

| Columna | Qué significa |
|---|---|
| `recibido` | Fecha y hora en que llegó a la planilla |
| `sesion` | Código de la partida (único) |
| `jugador` | Código anónimo del aparato. Cambia con "Nuevo jugador" |
| `version` | Versión del juego (v90, v91…) |
| `fecha` | Cuándo empezó la partida (hora UTC: 3 horas más que Brasil) |
| `idioma` | es, en o pt |
| `dificultad` | easy (Fácil), normal o hard (Difícil) |
| `modo` | story (historia), speedrun o tower (Coliseo) |
| `dispositivo` | tablet, celular o pc |
| `control` | keys (teclado), pad (mando), touch (táctil); con `+` si usó varios |
| `fps` | Cuadros por segundo promedio. 60 es fluido; menos de 40, el aparato sufre |

## Duración y final

| Columna | Qué significa |
|---|---|
| `minutos` | Duración de la partida |
| `fin` | Por qué terminó: portada, abandono (5 min sin tocar nada), cerró, nuevo jugador, descarga |
| `sala_final` | Sala donde terminó (n2, n3, p1…) |
| `jefe_al_final` | TRUE si terminó peleando con un jefe |
| `pausas_60s` | Veces que estuvo más de 60 s sin tocar nada y después volvió |

## Exploración

| Columna | Qué significa |
|---|---|
| `salas_visitadas` | Cuántas salas distintas pisó |
| `cobertura_pct` | Qué porcentaje de cada sala recorrió, en promedio (la sala se divide en cuadros de 4×4 bloques) |
| `esquinas` | Cuántas esquinas de salas alcanzó, en total |
| `vueltas_atras` | Veces que volvió a una sala donde ya había estado |
| `distancia_bloques` | Distancia recorrida, en bloques |
| `seg_quieto` | Segundos sin moverse |
| `seg_aire` | Segundos en el aire |

## Combate y muertes

| Columna | Qué significa |
|---|---|
| `muertes` | Veces que se quedó sin corazones |
| `caidas` | Golpes por caer a un pozo o pisar espinas |
| `golpes` | Corazones perdidos en total |
| `enemigos_vencidos` | Enemigos pisados o derrotados |
| `reaparece_en` | Salas donde volvió a aparecer después de cada muerte (sirve para revisar las banderitas) |

## Jefes

| Columna | Qué significa |
|---|---|
| `jefes_vencidos` | Jefes que venció |
| `intentos_jefe` | Peleas empezadas (contando las que perdió) |
| `corazones_al_jefe` | Corazones con los que llega a los jefes, en promedio. Bajo = jugador Apurado |

En el JSON, la parte `jefes` dice por cada jefe: intentos, segundos de cada pelea, golpes que le dio en cada intento y **qué ataque le hizo más daño** (`danio`).

## Mecánicas

| Columna | Qué significa |
|---|---|
| `diapason_usos` | Veces que usó el diapasón |
| `diapason_efectivos` | Veces que el diapasón rompió o abrió algo. Muchos usos y pocos efectivos: no entiende para qué sirve |
| `instrumentos` | Instrumentos atrapados |
| `seg_por_instrumento` | Segundos promedio para atrapar cada uno, desde que empieza la misión |
| `pasos_baile` | Pasos de baile (en el mix o en la pista de la fiesta) |
| `choques_porton` | Veces que chocó un portón cerrado |
| `aji` | Ajíes usados |

## Lectura e interfaz

| Columna | Qué significa |
|---|---|
| `mensajes` | Mensajes que detienen el juego y que cerró |
| `mensajes_rapidos` | De esos, los que cerró en menos de 1 segundo (no los leyó). Muchos = jugador Enfocado |
| `consejos` | Consejos que vio |
| `menu` | Veces que abrió la pausa |
| `seg_mapa` | Segundos mirando el mapa |
| `cambios_opciones` | Veces que cambió algo en Opciones |

## Economía y vecinos

| Columna | Qué significa |
|---|---|
| `monedas_ganadas`, `monedas_gastadas` | Monedas que juntó y que gastó |
| `compras` | Cosas compradas |
| `visitas_tienda` | Veces que abrió una tienda |
| `vecinos` | Vecinos distintos con los que habló |
| `banderitas` | Banderitas de guardado activadas |

## Prólogo

| Columna | Qué significa |
|---|---|
| `prologo_primer_pisoton_s` | Segundos en la sala hasta vencer al primer enemigo (la hormiga) |
| `prologo_botones_antes` | Botones distintos que probó antes de ese primer pisotón. Muchos = busca un misterio; pocos y mucho tiempo = está perdido |
| `seg_sala_final` | Segundos en la sala donde terminó. Mucho tiempo = probablemente se quedó atascado ahí |
| `seg_sin_sala_nueva` | Segundos desde la última vez que pisó una sala nueva hasta que se fue. Mucho = no encontraba por dónde seguir |
| `ruta_final` | Las últimas 5 salas con los segundos en cada una (ej. `n2:40 n5:300`) |
| `muertes_por_sala` | Muertes agrupadas por sala y causa (ej. `p2:eco×10`). Muestra el punto más difícil |
| `jefe_vida_al_perder` | Vida que le quedaba al jefe cada vez que perdió (ej. `eco:3,1`). Baja = estuvo cerca; alta = no tenía chance |
| `diapason_otra_nota` | Veces que tocó el diapasón junto a un muro de otra nota (sabe qué hacer, pero no tiene esa nota) |
| `carteles_leidos` | Carteles distintos que leyó |
| `claves_usos` / `claves_repelidos` | Veces que usó las claves y proyectiles que desvió con ellas |
| `dev` | TRUE si es una partida del desarrollador (se marca en la pantalla del informe con Arriba) |

## Perfil

| Columna | Qué significa |
|---|---|
| `perfil` | El perfil con más puntaje |
| `p_experto` | Rápido, pocas muertes, casi sin pausas |
| `p_explorador` | Recorre mucho, vuelve atrás, habla con vecinos, prueba botones |
| `p_apurado` | Rápido, pero llega al jefe con pocos corazones y lo intenta muchas veces |
| `p_principiante` | Muchas muertes y caídas, muchas pausas |
| `p_enfocado` | Cierra mensajes sin leer, choca el portón, no habla con vecinos ni explora |

Cada puntaje va de 0 a 100. Son reglas simples: con más partidas, las ajustamos.

## Columna `json`

El detalle completo de la partida: por sala (segundos, entradas, muertes, recorrido), por jefe, cada muerte con el lugar y la causa, poderes usados (y cuánto tardó en usar cada uno después de ganarlo), notas del diapasón, compras, vecinos y una lista de eventos con el segundo en que pasaron.
