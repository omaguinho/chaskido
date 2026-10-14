// Hojas de sprites: archivo, tamaño de cuadro EN EL JUEGO (fw×fh), velocidad y repetición.
// fps = cuadros por segundo. loop: false deja fijo el último cuadro.
//
// Los PNG pueden venir en pixel art (1x: un bloque = 16 px) o dibujados a 4x
// (un bloque = 64 px, estilo Moebius): el juego mide cada imagen y saca solo
// el tamaño y la cantidad de cuadros. Si falta un archivo, el juego sigue:
// lo que tiene dibujo de respaldo por código usa ese dibujo.
// La lista completa (nombres, cuadros y medidas a 4x) está en el documento
// "Prompt para la conversación de los sprites".
const SPRITES = {
  // ---------- Papa chasqui (16×24) ----------
  papa_quieta:      { file: 'papa_quieta.png',      fw: 16, fh: 24, fps: 3 },
  papa_correr:      { file: 'papa_correr.png',      fw: 16, fh: 24, fps: 12 },
  papa_salto:       { file: 'papa_salto.png',       fw: 16, fh: 24, fps: 8 },
  papa_caida:       { file: 'papa_caida.png',       fw: 16, fh: 24, fps: 8 },
  papa_doble_salto: { file: 'papa_doble_salto.png', fw: 16, fh: 24, fps: 14, loop: false },
  papa_dash:        { file: 'papa_dash.png',        fw: 16, fh: 24, fps: 12 },
  papa_pared:       { file: 'papa_pared.png',       fw: 16, fh: 24 },
  papa_colgada:     { file: 'papa_colgada.png',     fw: 16, fh: 24, fps: 4 },
  papa_planeo:      { file: 'papa_planeo.png',      fw: 16, fh: 24, fps: 6 },
  papa_dano:        { file: 'papa_dano.png',        fw: 16, fh: 24 },
  papa_poder:       { file: 'papa_poder.png',       fw: 16, fh: 24, fps: 8, loop: false },
  papa_derrota:     { file: 'papa_derrota.png',     fw: 16, fh: 24, fps: 6, loop: false },

  papa_nadar:       { file: 'papa_nadar.png',       fw: 16, fh: 24, fps: 6 },
  papa_descanso:    { file: 'papa_descanso.png',    fw: 16, fh: 24, fps: 2 },
  papa_portal:      { file: 'papa_portal.png',      fw: 16, fh: 24, fps: 8, loop: false },
  papa_hablar:      { file: 'papa_hablar.png',      fw: 16, fh: 24, fps: 6 },

  // ---------- Enemigos (24×24: dibujados a 96×96) ----------
  escarabajo_caminar:   { file: 'escarabajo_caminar.png',   fw: 24, fh: 24, fps: 8 },
  escarabajo_aplastado: { file: 'escarabajo_aplastado.png', fw: 24, fh: 24 },
  cuy_caminar:          { file: 'cuy_caminar.png',          fw: 24, fh: 24, fps: 8 },
  cuy_alerta:           { file: 'cuy_alerta.png',           fw: 24, fh: 24 },
  cuy_correr:           { file: 'cuy_correr.png',           fw: 24, fh: 24, fps: 14 },
  cuy_aplastado:        { file: 'cuy_aplastado.png',        fw: 24, fh: 24 },
  disparador_quieto:    { file: 'disparador_quieto.png',    fw: 24, fh: 24, fps: 3 },
  disparador_carga:     { file: 'disparador_carga.png',     fw: 24, fh: 24, fps: 8 },
  disparador_aplastado: { file: 'disparador_aplastado.png', fw: 24, fh: 24 },
  paloma_volar:         { file: 'paloma_volar.png',         fw: 24, fh: 24, fps: 10 },
  paloma_picada:        { file: 'paloma_picada.png',        fw: 24, fh: 24, fps: 8 },
  paloma_aplastada:     { file: 'paloma_aplastada.png',     fw: 24, fh: 24 },
  oruga_caminar:        { file: 'oruga_caminar.png',        fw: 24, fh: 24, fps: 6 },
  oruga_aplastada:      { file: 'oruga_aplastada.png',      fw: 24, fh: 24 },
  colibri_volar:        { file: 'colibri_volar.png',        fw: 24, fh: 24, fps: 16 },
  colibri_picada:       { file: 'colibri_picada.png',       fw: 24, fh: 24, fps: 10 },
  colibri_aplastado:    { file: 'colibri_aplastado.png',    fw: 24, fh: 24 },
  mono_colgar:          { file: 'mono_colgar.png',          fw: 24, fh: 24, fps: 3 },
  mono_lanzar:          { file: 'mono_lanzar.png',          fw: 24, fh: 24, fps: 8, loop: false },
  mono_aplastado:       { file: 'mono_aplastado.png',       fw: 24, fh: 24 },
  barrendero_caminar:   { file: 'barrendero_caminar.png',   fw: 24, fh: 24, fps: 8 },
  barrendero_barrer:    { file: 'barrendero_barrer.png',    fw: 24, fh: 24, fps: 10, loop: false },
  barrendero_aplastado: { file: 'barrendero_aplastado.png', fw: 24, fh: 24 },
  semilla:              { file: 'semilla.png',              fw: 16, fh: 16, fps: 12 },
  fruto:                { file: 'fruto.png',                fw: 16, fh: 16, fps: 10 },

  // ---------- Jefes (32×32) y sus proyectiles (16×16) ----------
  condor_volar:          { file: 'condor_volar.png',          fw: 32, fh: 32, fps: 10 },
  condor_lanzar:         { file: 'condor_lanzar.png',         fw: 32, fh: 32, fps: 8 },
  condor_picada:         { file: 'condor_picada.png',         fw: 32, fh: 32, fps: 10 },
  condor_dano:           { file: 'condor_dano.png',           fw: 32, fh: 32, fps: 10 },
  condor_derrota:        { file: 'condor_derrota.png',        fw: 32, fh: 32, fps: 4, loop: false },
  coco:                  { file: 'coco.png',                  fw: 16, fh: 16, fps: 10 },
  aviso:                 { file: 'aviso.png',                 fw: 16, fh: 16, fps: 8 },
  charanguero_tocar:     { file: 'charanguero_tocar.png',     fw: 32, fh: 32, fps: 6 },
  charanguero_rasgueo:   { file: 'charanguero_rasgueo.png',   fw: 32, fh: 32, fps: 12 },
  charanguero_salto:     { file: 'charanguero_salto.png',     fw: 32, fh: 32, fps: 6, loop: false },
  charanguero_dano:      { file: 'charanguero_dano.png',      fw: 32, fh: 32, fps: 10 },
  charanguero_derrota:   { file: 'charanguero_derrota.png',   fw: 32, fh: 32, fps: 4, loop: false },
  nota:                  { file: 'nota.png',                  fw: 16, fh: 16 },
  huaca_quieta:          { file: 'huaca_quieta.png',          fw: 32, fh: 32, fps: 3 },
  huaca_lanzar:          { file: 'huaca_lanzar.png',          fw: 32, fh: 32, fps: 8 },
  huaca_hundirse:        { file: 'huaca_hundirse.png',        fw: 32, fh: 32, fps: 8, loop: false },
  huaca_dano:            { file: 'huaca_dano.png',            fw: 32, fh: 32, fps: 10 },
  huaca_derrota:         { file: 'huaca_derrota.png',         fw: 32, fh: 32, fps: 4, loop: false },
  piedra:                { file: 'piedra.png',                fw: 16, fh: 16, fps: 10 },
  cuygig_mirar:          { file: 'cuygig_mirar.png',          fw: 32, fh: 32, fps: 3 },
  cuygig_embestir:       { file: 'cuygig_embestir.png',       fw: 32, fh: 32, fps: 14 },
  cuygig_salto:          { file: 'cuygig_salto.png',          fw: 32, fh: 32, fps: 6, loop: false },
  cuygig_mareado:        { file: 'cuygig_mareado.png',        fw: 32, fh: 32, fps: 4 },
  cuygig_dano:           { file: 'cuygig_dano.png',           fw: 32, fh: 32, fps: 10 },
  cuygig_derrota:        { file: 'cuygig_derrota.png',        fw: 32, fh: 32, fps: 4, loop: false },
  bombo_quieto:          { file: 'bombo_quieto.png',          fw: 32, fh: 32, fps: 4 },
  bombo_salto:           { file: 'bombo_salto.png',           fw: 32, fh: 32 },
  bombo_golpe:           { file: 'bombo_golpe.png',           fw: 32, fh: 32, fps: 8, loop: false },
  bombo_redoble:         { file: 'bombo_redoble.png',         fw: 32, fh: 32, fps: 16 },
  bombo_cansado:         { file: 'bombo_cansado.png',         fw: 32, fh: 32, fps: 4 },
  bombo_dano:            { file: 'bombo_dano.png',            fw: 32, fh: 32, fps: 10 },
  bombo_derrota:         { file: 'bombo_derrota.png',         fw: 32, fh: 32, fps: 3, loop: false },
  onda_bombo:            { file: 'onda_bombo.png',            fw: 16, fh: 16, fps: 12 },
  bombo_rodar:           { file: 'bombo_rodar.png',           fw: 32, fh: 32, fps: 14 },
  bombo_colgado:         { file: 'bombo_colgado.png',         fw: 32, fh: 32, fps: 6 },
  bombo_sacudir:         { file: 'bombo_sacudir.png',         fw: 32, fh: 32, fps: 12 },
  rafaga:                { file: 'rafaga.png',                fw: 16, fh: 16, fps: 12 },
  cuygig_techo:          { file: 'cuygig_techo.png',          fw: 32, fh: 32, fps: 6 },
  cuygig_sacudir:        { file: 'cuygig_sacudir.png',        fw: 32, fh: 32, fps: 12 },
  chispa_suelo:          { file: 'chispa_suelo.png',          fw: 16, fh: 16, fps: 14 },
  charanguero_bola:      { file: 'charanguero_bola.png',      fw: 32, fh: 32, fps: 16 },
  charanguero_sacudir:   { file: 'charanguero_sacudir.png',   fw: 32, fh: 32, fps: 12 },
  huaca_desaparecer:     { file: 'huaca_desaparecer.png',     fw: 32, fh: 32, fps: 8, loop: false },
  huaca_bumeran:         { file: 'huaca_bumeran.png',         fw: 32, fh: 32, fps: 8, loop: false },
  huaca_sacudir:         { file: 'huaca_sacudir.png',         fw: 32, fh: 32, fps: 12 },
  corona_piedra:         { file: 'corona_piedra.png',         fw: 16, fh: 16, fps: 14 },
  condor_sacudir:        { file: 'condor_sacudir.png',        fw: 32, fh: 32, fps: 12 },
  // Retratos del coliseo y placa del piso (en assets/bg/)
  retrato_bombo:       { file: '../bg/retrato_bombo.png',       fw: 64, fh: 64 },
  retrato_cuygig:      { file: '../bg/retrato_cuygig.png',      fw: 64, fh: 64 },
  retrato_charanguero: { file: '../bg/retrato_charanguero.png', fw: 64, fh: 64 },
  retrato_huaca:       { file: '../bg/retrato_huaca.png',       fw: 64, fh: 64 },
  retrato_condor:      { file: '../bg/retrato_condor.png',      fw: 64, fh: 64 },
  placa_piso:          { file: '../bg/placa_piso.png',          fw: 128, fh: 32 },

  // ---------- Bloques: un archivo por tema (8 cuadros, ver TILESET en level.js) ----------
  tiles_ciudad:  { file: 'tiles_ciudad.png',  fw: 16, fh: 16 },   // el de antes (respaldo)
  tiles_city:    { file: 'tiles_city.png',    fw: 16, fh: 16 },
  tiles_cityday: { file: 'tiles_cityday.png', fw: 16, fh: 16 },
  tiles_sea:     { file: 'tiles_sea.png',     fw: 16, fh: 16 },
  tiles_bamboo:  { file: 'tiles_bamboo.png',  fw: 16, fh: 16 },
  tiles_cave:    { file: 'tiles_cave.png',    fw: 16, fh: 16 },
  tiles_tech:    { file: 'tiles_tech.png',    fw: 16, fh: 16 },
  tiles_tower:   { file: 'tiles_tower.png',   fw: 16, fh: 16 },
  tiles_mine:    { file: 'tiles_mine.png',    fw: 16, fh: 16 },
  // Hojas nuevas de 16 piezas: tiles_<tema>.png (bordes según los vecinos),
  // tiles_<tema>_extra.png (relleno, ladrillo, delgada, de paso, espinas, se cae)
  // y pared_<tema>.png (pared de fondo, 4 versiones). Se agregan abajo para cada tema

  // ---------- Obstáculos ----------
  tambor:       { file: 'tambor.png',       fw: 16, fh: 16 },
  ritmica:      { file: 'ritmica.png',      fw: 16, fh: 16 },
  movil:        { file: 'movil.png',        fw: 16, fh: 8 },
  ascensor:     { file: 'ascensor.png',     fw: 16, fh: 8 },
  cinta:        { file: 'cinta.png',        fw: 16, fh: 16, fps: 10 },
  muro_grieta:  { file: 'muro_grieta.png',  fw: 16, fh: 16 },
  escombros:    { file: 'escombros.png',    fw: 16, fh: 16, fps: 10, loop: false },
  porton:       { file: 'porton.png',       fw: 16, fh: 16 },
  muro_arena:   { file: 'muro_arena.png',   fw: 16, fh: 16 },
  viento:       { file: 'viento.png',       fw: 16, fh: 16, fps: 8 },
  molino_rotor: { file: 'molino_rotor.png', fw: 32, fh: 32 },

  // ---------- Objetos ----------
  corchea:      { file: 'corchea.png',      fw: 16, fh: 16, fps: 8 },
  corchea_alerta: { file: 'corchea_alerta.png', fw: 16, fh: 16 },
  corchea_huir:   { file: 'corchea_huir.png',   fw: 16, fh: 16, fps: 10 },
  moneda:         { file: 'moneda.png',         fw: 16, fh: 16, fps: 10 },
  moneda_chica:   { file: 'moneda_chica.png',   fw: 8,  fh: 8,  fps: 10 },
  poliedro_piramide: { file: 'poliedro_piramide.png', fw: 16, fh: 16, fps: 6 },
  poliedro_octaedro: { file: 'poliedro_octaedro.png', fw: 16, fh: 16, fps: 6 },
  corazon_extra:  { file: 'corazon_extra.png',  fw: 16, fh: 16, fps: 6 },
  nota_escala:    { file: 'nota_escala.png',    fw: 16, fh: 16 },
  instrumento_cuerdas: { file: 'instrumento_cuerdas.png', fw: 16, fh: 16, fps: 3 },
  instrumento_tambor:  { file: 'instrumento_tambor.png',  fw: 16, fh: 16, fps: 3 },
  rollo_mapa:     { file: 'rollo_mapa.png',     fw: 16, fh: 16, fps: 3 },
  fruta:          { file: 'fruta.png',          fw: 16, fh: 16 },
  cartel:         { file: 'cartel.png',         fw: 16, fh: 16 },
  piedra_poder:   { file: 'piedra_poder.png',   fw: 16, fh: 16 },
  llave_color:    { file: 'llave_color.png',    fw: 16, fh: 16 },
  llave_brillo:   { file: 'llave_brillo.png',   fw: 16, fh: 16, fps: 10 },
  sello_poder:    { file: 'sello_poder.png',    fw: 16, fh: 16 },
  puerta_color:   { file: 'puerta_color.png',   fw: 16, fh: 32 },
  puerta_q:       { file: 'puerta_q.png',       fw: 16, fh: 32 },
  cartel_mision:  { file: 'cartel_mision.png',  fw: 48, fh: 16, fps: 2 },
  cartel_zona:    { file: 'cartel_zona.png',    fw: 32, fh: 16 },
  posta:          { file: 'posta.png',          fw: 32, fh: 32 },
  posta_llama:    { file: 'posta_llama.png',    fw: 16, fh: 16, fps: 10 },
  totem_apagado:  { file: 'totem_apagado.png',  fw: 32, fh: 48 },
  totem_despierto: { file: 'totem_despierto.png', fw: 32, fh: 48, fps: 6 },
  totem_activo:   { file: 'totem_activo.png',   fw: 32, fh: 48, fps: 8 },
  totem_viaje:    { file: 'totem_viaje.png',    fw: 32, fh: 48, fps: 10, loop: false },
  aura_poder:     { file: 'aura_poder.png',     fw: 48, fh: 48, fps: 10 },
  aviso_accion:   { file: 'aviso_accion.png',   fw: 32, fh: 12, fps: 2 },
  aviso_boton:    { file: 'aviso_boton.png',    fw: 8,  fh: 8 },

  // ---------- Vendedores (24×32) ----------
  mercader_quieto:  { file: 'mercader_quieto.png',  fw: 24, fh: 32, fps: 4 },
  mercader_hablar:  { file: 'mercader_hablar.png',  fw: 24, fh: 32, fps: 6 },
  cocinera_quieta:  { file: 'cocinera_quieta.png',  fw: 24, fh: 32, fps: 4 },
  cocinera_hablar:  { file: 'cocinera_hablar.png',  fw: 24, fh: 32, fps: 6 },
  llave:        { file: 'llave.png',        fw: 16, fh: 16, fps: 3 },
  cubo:         { file: 'cubo.png',         fw: 16, fh: 16, fps: 6 },
  maiz:         { file: 'maiz.png',         fw: 8,  fh: 8,  fps: 4 },
  aji:          { file: 'aji.png',          fw: 16, fh: 16, fps: 4 },
  banderita:    { file: 'banderita.png',    fw: 16, fh: 16 },
  anilla:       { file: 'anilla.png',       fw: 16, fh: 16 },
  gancho:       { file: 'gancho.png',       fw: 16, fh: 16, fps: 4 },
  quipu_dorado: { file: 'quipu_dorado.png', fw: 16, fh: 16, fps: 6 },
  puerta:       { file: 'puerta.png',       fw: 16, fh: 32 },
  puerta_n:     { file: 'puerta_n.png',     fw: 16, fh: 32 },
  puerta_e:     { file: 'puerta_e.png',     fw: 16, fh: 32 },
  puerta_r:     { file: 'puerta_r.png',     fw: 16, fh: 32 },

  // ---------- Efectos de una sola vez (fps = velocidad de la animación) ----------
  poof:       { file: 'poof.png',       fw: 16, fh: 16, fps: 12 },
  chispa:     { file: 'chispa.png',     fw: 16, fh: 16, fps: 16 },
  polvo:      { file: 'polvo.png',      fw: 16, fh: 16, fps: 12 },
  humo:       { file: 'humo.png',       fw: 16, fh: 16, fps: 6 },
  brillo_aji: { file: 'brillo_aji.png', fw: 32, fh: 32, fps: 12 },

  // ---------- Interfaz ----------
  // iconos.png: la hoja nueva tiene 10 (ver ICON); la vieja, 6 (ver ICON_OLD)
  iconos:      { file: 'iconos.png',      fw: 8,  fh: 8 },
  poderes:     { file: 'poderes.png',     fw: 16, fh: 16 },
  menu_iconos: { file: 'menu_iconos.png', fw: 16, fh: 16 },
  menu_marco:  { file: 'menu_marco.png',  fw: 24, fh: 24 },
  guardando:   { file: 'guardando.png',   fw: 16, fh: 16, fps: 8 },
  mapa_marcas: { file: 'mapa_marcas.png', fw: 8,  fh: 8 },

  // ---------- Portada (en assets/bg/) ----------
  logo:    { file: '../bg/logo.png',    fw: 160, fh: 48 },
  portada: { file: '../bg/portada.png', fw: 320, fh: 180 }
};

// Bloques, paredes y decoración de cada tema (se agregan aquí para no repetir)
['cityday', 'cave', 'sea', 'city', 'bamboo', 'tech', 'mine', 'tower'].forEach(function (t) {
  SPRITES['tiles_' + t + '_extra'] = { file: 'tiles_' + t + '_extra.png', fw: 16, fh: 16 };
  SPRITES['pared_' + t] = { file: 'pared_' + t + '.png', fw: 16, fh: 16 };
});
// Decoración: nombre de la pieza en el catálogo -> archivo y tamaño en el juego
const DECO_SPRITES = {
  pasto:       { file: 'deco_pasto',        fw: 16, fh: 16, fps: 2 },
  flores:      { file: 'deco_flores',       fw: 16, fh: 16 },
  piedritas:   { file: 'deco_piedritas',    fw: 16, fh: 16 },
  enredadera:  { file: 'deco_enredadera',   fw: 16, fh: 48 },
  farol:       { file: 'deco_farol',        fw: 16, fh: 48 },
  cadena:      { file: 'deco_cadena',       fw: 16, fh: 32 },
  ventana:     { file: 'deco_ventana',      fw: 16, fh: 16 },
  casa:        { file: 'deco_casa',         fw: 64, fh: 64 },
  edificio:    { file: 'deco_edificio',     fw: 64, fh: 128 },
  edificioB:   { file: 'deco_edificio_bajo', fw: 80, fh: 80 },
  antena:      { file: 'deco_antena',       fw: 16, fh: 64 },
  tanque:      { file: 'deco_tanque',       fw: 32, fh: 48 },
  letrero:     { file: 'deco_letrero',      fw: 48, fh: 32 },
  molino:      { file: 'deco_molino',       fw: 48, fh: 96 },
  bote:        { file: 'deco_bote',         fw: 64, fh: 32 },
  canaAlta:    { file: 'deco_cana_alta',    fw: 16, fh: 128 },
  canaBaja:    { file: 'deco_cana_baja',    fw: 16, fh: 64 },
  helecho:     { file: 'deco_helecho',      fw: 32, fh: 32 },
  liana:       { file: 'deco_liana',        fw: 16, fh: 64 },
  engranaje:   { file: 'deco_engranaje',    fw: 48, fh: 48 },
  tuberia:     { file: 'deco_tuberia',      fw: 16, fh: 16 },
  pantalla:    { file: 'deco_pantalla',     fw: 32, fh: 32 },
  rocaGrande:  { file: 'deco_roca_grande',  fw: 48, fh: 32 },
  rocaChica:   { file: 'deco_roca_chica',   fw: 16, fh: 16 },
  estalactita: { file: 'deco_estalactita',  fw: 16, fh: 32 },
  estalagmita: { file: 'deco_estalagmita',  fw: 16, fh: 32 },
  cristal:     { file: 'deco_cristal',      fw: 16, fh: 32 },
  viga:        { file: 'deco_viga',         fw: 16, fh: 64 },
  mostrador:   { file: 'deco_mostrador',    fw: 48, fh: 32 }
};
Object.keys(DECO_SPRITES).forEach(function (id) {
  const d = DECO_SPRITES[id];
  SPRITES[d.file] = { file: d.file + '.png', fw: d.fw, fh: d.fh, fps: d.fps };
});

// Orden de los cuadros de iconos.png (la hoja nueva de 10) y de la vieja (6)
const ICON = { HEART: 0, HEART_EMPTY: 1, NOTE: 2, CUBE: 3, MAIZE: 4, KEY: 5, CHILI: 6, COIN: 7, SCALE: 8, MAP: 9 };
const ICON_OLD = { HEART: 0, NOTE: 1, CUBE: 2, MAIZE: 3, KEY: 4, CHILI: 5 };

const Sprites = (function () {
  const PATH = 'assets/sprites/';
  const BG_PATH = 'assets/bg/';
  const images = {};   // name -> { img, frames, sw, sh, hd }
  // Lienzo auxiliar para teñir cuadros (skins provisionales)
  const tintCanvas = document.createElement('canvas');
  const tintCtx = tintCanvas.getContext('2d');

  // Mide la imagen: los cuadros van uno al lado del otro con la forma fw×fh
  function measure(name, img) {
    const s = SPRITES[name];
    const frameW = img.height * s.fw / s.fh;
    const frames = Math.max(1, Math.round(img.width / frameW));
    const sw = img.width / frames;
    images[name] = { img: img, frames: frames, sw: sw, sh: img.height, hd: sw > s.fw * 1.5 };
  }

  // Busca primero en assets/sprites/ y, si no está, en assets/bg/ (con reintentos:
  // ver Loader en js/util.js). Un archivo que no está en ninguna no detiene el juego
  // (se usa el dibujo de respaldo)
  function loadOne(name) {
    const file = SPRITES[name].file;
    const places = [PATH + file, BG_PATH + file.replace('../bg/', '')];
    return new Promise(function (resolve) {
      function attempt(i) {
        if (i >= places.length) {
          resolve();
          return;
        }
        Loader.image(places[i], function (img) {
          measure(name, img);
          resolve();
        }, function () { attempt(i + 1); });
      }
      attempt(0);
    });
  }

  function load() {
    return Promise.all(Object.keys(SPRITES).map(loadOne));
  }

  // ¿Está cargado este sprite?
  function has(name) {
    return !!images[name];
  }

  function frames(name) {
    return images[name] ? images[name].frames : 1;
  }

  // Cuadro que corresponde a un tiempo de animación
  function frameAt(name, time) {
    const s = SPRITES[name];
    const n = frames(name);
    if (n <= 1) return 0;
    const index = Math.floor(time * (s.fps || 8));
    return s.loop === false ? Math.min(index, n - 1) : index % n;
  }

  // Devuelve la imagen y el recorte del cuadro, teñido si hace falta
  function source(name, f, tint, alpha) {
    const im = images[name];
    if (!tint) return { img: im.img, sx: f * im.sw, sw: im.sw, sh: im.sh };

    tintCanvas.width = Math.ceil(im.sw);
    tintCanvas.height = im.sh;
    tintCtx.clearRect(0, 0, tintCanvas.width, im.sh);
    tintCtx.drawImage(im.img, f * im.sw, 0, im.sw, im.sh, 0, 0, im.sw, im.sh);
    tintCtx.globalCompositeOperation = 'source-atop';
    tintCtx.globalAlpha = alpha == null ? 0.5 : alpha;
    tintCtx.fillStyle = tint;
    tintCtx.fillRect(0, 0, tintCanvas.width, im.sh);
    tintCtx.globalAlpha = 1;
    tintCtx.globalCompositeOperation = 'source-over';
    return { img: tintCanvas, sx: 0, sw: im.sw, sh: im.sh };
  }

  // Dibuja un cuadro en (x, y) con su tamaño del juego (fw×fh). flip = true lo voltea
  // hacia la izquierda; tint = color opcional; tintAlpha = fuerza del color (1 = silueta).
  // Devuelve false si el sprite no está (así quien llama usa su dibujo de respaldo)
  function drawFrame(ctx, name, frame, x, y, flip, tint, tintAlpha) {
    const im = images[name];
    if (!im) return false;
    const s = SPRITES[name];
    const f = Math.max(0, Math.min(frame, im.frames - 1));
    const src = source(name, f, tint, tintAlpha);
    const px = Math.round(x);
    const py = Math.round(y);
    // Pixel art: bordes duros; dibujo a 4x: suave
    const smooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = im.hd;

    if (flip) {
      ctx.save();
      ctx.translate(px + s.fw, py);
      ctx.scale(-1, 1);
      ctx.drawImage(src.img, src.sx, 0, src.sw, src.sh, 0, 0, s.fw, s.fh);
      ctx.restore();
    } else {
      ctx.drawImage(src.img, src.sx, 0, src.sw, src.sh, px, py, s.fw, s.fh);
    }
    ctx.imageSmoothingEnabled = smooth;
    return true;
  }

  // Igual que drawFrame, pero centrado de lado y con la base en (cx, bottom):
  // así un sprite de 32×32 calza con un jefe más chico
  function drawAnchored(ctx, name, frame, cx, bottom, flip, tint, tintAlpha) {
    const s = SPRITES[name];
    if (!s) return false;
    return drawFrame(ctx, name, frame, cx - s.fw / 2, bottom - s.fh, flip, tint, tintAlpha);
  }

  return { load: load, has: has, frames: frames, frameAt: frameAt,
           drawFrame: drawFrame, drawAnchored: drawAnchored };
})();
