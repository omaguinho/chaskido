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
  // Diapasón, barro y piedras del pantano (mientras no estén, se dibujan con código)
  diapason:             { file: 'diapason.png',             fw: 16, fh: 16 },   // 0 La, 1 Si (sobre la papa)
  muro_nota:            { file: 'muro_nota.png',            fw: 16, fh: 16 },   // 0 muro de La, 1 muro de Si
  tiles_barro:          { file: 'tiles_barro.png',          fw: 16, fh: 16 },   // 2 variantes
  piedra_hunde:         { file: 'piedra_hunde.png',         fw: 16, fh: 16 },
  // Zona 3 (enemigos nuevos; mientras no estén, se dibujan con código)
  murcielago_colgado:   { file: 'murcielago_colgado.png',   fw: 24, fh: 24, fps: 4 },
  murcielago_caer:      { file: 'murcielago_caer.png',      fw: 24, fh: 24, fps: 10 },
  murcielago_caminar:   { file: 'murcielago_caminar.png',   fw: 24, fh: 24, fps: 8 },
  murcielago_aplastado: { file: 'murcielago_aplastado.png', fw: 24, fh: 24 },
  rueda_rodar:          { file: 'rueda_rodar.png',          fw: 24, fh: 24, fps: 12 },
  rueda_rota:           { file: 'rueda_rota.png',           fw: 24, fh: 24 },
  escorpion_caminar:    { file: 'escorpion_caminar.png',    fw: 24, fh: 24, fps: 6 },
  escorpion_disparar:   { file: 'escorpion_disparar.png',   fw: 24, fh: 24, fps: 8 },
  escorpion_aplastado:  { file: 'escorpion_aplastado.png',  fw: 24, fh: 24 },
  armadillo_caminar:    { file: 'armadillo_caminar.png',    fw: 24, fh: 24, fps: 6 },
  armadillo_bola:       { file: 'armadillo_bola.png',       fw: 24, fh: 24, fps: 4 },
  armadillo_aplastado:  { file: 'armadillo_aplastado.png',  fw: 24, fh: 24 },
  brasa_saltar:         { file: 'brasa_saltar.png',         fw: 24, fh: 24, fps: 12 },
  papa_zapateo:         { file: 'papa_zapateo.png',         fw: 16, fh: 24, fps: 10 },
  puente:               { file: 'puente.png',               fw: 16, fh: 16 },
  suelo_grieta:         { file: 'suelo_grieta.png',         fw: 16, fh: 16 },
  topo_asomar:          { file: 'topo_asomar.png',          fw: 24, fh: 24, fps: 8 },
  topo_aplastado:       { file: 'topo_aplastado.png',       fw: 24, fh: 24 },
  cristal_disparo:      { file: 'cristal_disparo.png',      fw: 16, fh: 16, fps: 12 },
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
  // Gusano Taladro (sala 9): mientras no estén, se dibuja con código
  // Eco del Silencio (jefe del prólogo): flota; si no están, se dibuja con código
  eco_flotar:            { file: 'eco_flotar.png',            fw: 48, fh: 48, fps: 6 },
  eco_cantar:            { file: 'eco_cantar.png',            fw: 48, fh: 48, fps: 12 },
  eco_caer:              { file: 'eco_caer.png',              fw: 48, fh: 48, fps: 10 },
  eco_recalentado:       { file: 'eco_recalentado.png',       fw: 48, fh: 48, fps: 6 },
  eco_dano:              { file: 'eco_dano.png',              fw: 48, fh: 48, fps: 10 },
  eco_derrota:           { file: 'eco_derrota.png',           fw: 48, fh: 48, fps: 6, loop: false },
  // Oso de Escarcha (jefe de la zona 5)
  oso_quieto:            { file: 'oso_quieto.png',            fw: 48, fh: 48, fps: 4 },
  oso_alzarse:           { file: 'oso_alzarse.png',           fw: 48, fh: 48, fps: 6, loop: false },
  oso_golpe:             { file: 'oso_golpe.png',             fw: 48, fh: 48, fps: 10, loop: false },
  oso_rodar:             { file: 'oso_rodar.png',             fw: 48, fh: 48, fps: 14 },
  oso_mareado:           { file: 'oso_mareado.png',           fw: 48, fh: 48, fps: 6 },
  oso_cansado:           { file: 'oso_cansado.png',           fw: 48, fh: 48, fps: 4 },
  oso_dano:              { file: 'oso_dano.png',              fw: 48, fh: 48, fps: 10 },
  oso_derrota:           { file: 'oso_derrota.png',           fw: 48, fh: 48, fps: 6, loop: false },
  // Zona 5: enemigos y piezas
  zorro_caminar:         { file: 'zorro_caminar.png',         fw: 24, fh: 24, fps: 8 },
  zorro_alerta:          { file: 'zorro_alerta.png',          fw: 24, fh: 24, fps: 6 },
  zorro_saltar:          { file: 'zorro_saltar.png',          fw: 24, fh: 24, fps: 10 },
  zorro_aplastado:       { file: 'zorro_aplastado.png',       fw: 24, fh: 24 },
  bola_nieve:            { file: 'bola_nieve.png',            fw: 24, fh: 24, fps: 10 },
  bola_nieve_rota:       { file: 'bola_nieve_rota.png',       fw: 24, fh: 24 },
  vizcacha_quieta:       { file: 'vizcacha_quieta.png',       fw: 24, fh: 24, fps: 3 },
  vizcacha_saltar:       { file: 'vizcacha_saltar.png',       fw: 24, fh: 24, fps: 8 },
  vizcacha_aplastada:    { file: 'vizcacha_aplastada.png',    fw: 24, fh: 24 },
  nube_granizo:          { file: 'nube_granizo.png',          fw: 32, fh: 24, fps: 4 },
  nube_granizo_rota:     { file: 'nube_granizo_rota.png',     fw: 32, fh: 24 },
  granizo:               { file: 'granizo.png',               fw: 16, fh: 16 },
  bloque_hielo:          { file: 'bloque_hielo.png',          fw: 16, fh: 16 },
  bloque_nieve:          { file: 'bloque_nieve.png',          fw: 16, fh: 16 },
  geiser:                { file: 'geiser.png',                fw: 16, fh: 16 },
  // Prólogo: la fiesta (gente y banda), faroles de papel, la máquina del Silencio
  // y los proyectiles del Eco. Si faltan, se dibujan con código
  gente1_bailar:         { file: 'gente1_bailar.png',         fw: 24, fh: 24, fps: 8 },
  gente2_bailar:         { file: 'gente2_bailar.png',         fw: 24, fh: 24, fps: 8 },
  gente3_bailar:         { file: 'gente3_bailar.png',         fw: 24, fh: 24, fps: 8 },
  gente4_bailar:         { file: 'gente4_bailar.png',         fw: 24, fh: 24, fps: 8 },
  gente1_quieto:         { file: 'gente1_quieto.png',         fw: 24, fh: 24 },
  gente2_quieto:         { file: 'gente2_quieto.png',         fw: 24, fh: 24 },
  gente3_quieto:         { file: 'gente3_quieto.png',         fw: 24, fh: 24 },
  gente4_quieto:         { file: 'gente4_quieto.png',         fw: 24, fh: 24 },
  musico_tambor:         { file: 'musico_tambor.png',         fw: 24, fh: 24, fps: 8 },
  musico_flauta:         { file: 'musico_flauta.png',         fw: 24, fh: 24, fps: 8 },
  musico_cuerdas:        { file: 'musico_cuerdas.png',        fw: 24, fh: 24, fps: 8 },
  farol_papel:           { file: 'farol_papel.png',           fw: 16, fh: 16 },
  banderita_fiesta:      { file: 'banderita_fiesta.png',      fw: 8,  fh: 8 },
  silencio_maquina:      { file: '../bg/silencio_maquina.png', fw: 160, fh: 80 },
  silencio_disparo:      { file: 'silencio_disparo.png',      fw: 16, fh: 16, fps: 6 },
  columna_silencio:      { file: 'columna_silencio.png',      fw: 16, fh: 48 },
  // Rana Gigante del Lago (jefe de la zona 6)
  ranagig_quieta:        { file: 'ranagig_quieta.png',        fw: 48, fh: 48, fps: 4 },
  ranagig_agachada:      { file: 'ranagig_agachada.png',      fw: 48, fh: 48, fps: 8 },
  ranagig_salto:         { file: 'ranagig_salto.png',         fw: 48, fh: 48, fps: 6 },
  ranagig_lengua:        { file: 'ranagig_lengua.png',        fw: 48, fh: 48, fps: 8, loop: false },
  ranagig_pegada:        { file: 'ranagig_pegada.png',        fw: 48, fh: 48, fps: 6 },
  ranagig_cansada:       { file: 'ranagig_cansada.png',       fw: 48, fh: 48, fps: 4 },
  ranagig_dano:          { file: 'ranagig_dano.png',          fw: 48, fh: 48, fps: 10 },
  ranagig_derrota:       { file: 'ranagig_derrota.png',       fw: 48, fh: 48, fps: 6, loop: false },
  // Zona 6: enemigos del lago
  rana_quieta:           { file: 'rana_quieta.png',           fw: 24, fh: 24, fps: 3 },
  rana_saltar:           { file: 'rana_saltar.png',           fw: 24, fh: 24, fps: 8 },
  rana_lengua:           { file: 'rana_lengua.png',           fw: 24, fh: 24, fps: 8 },
  rana_aplastada:        { file: 'rana_aplastada.png',        fw: 24, fh: 24 },
  pez_nadar:             { file: 'pez_nadar.png',             fw: 24, fh: 24, fps: 8 },
  pez_embestir:          { file: 'pez_embestir.png',          fw: 24, fh: 24, fps: 12 },
  libelula_volar:        { file: 'libelula_volar.png',        fw: 24, fh: 24, fps: 16 },
  libelula_brillo:       { file: 'libelula_brillo.png',       fw: 24, fh: 24, fps: 8 },
  libelula_aplastada:    { file: 'libelula_aplastada.png',    fw: 24, fh: 24 },
  garza_quieta:          { file: 'garza_quieta.png',          fw: 24, fh: 32, fps: 2 },
  garza_picar:           { file: 'garza_picar.png',           fw: 48, fh: 32, fps: 8, loop: false },
  garza_aplastada:       { file: 'garza_aplastada.png',       fw: 24, fh: 32 },
  // Toro Dorado (jefe de la zona 4)
  toro_quieto:           { file: 'toro_quieto.png',           fw: 48, fh: 48, fps: 4 },
  toro_escarbar:         { file: 'toro_escarbar.png',         fw: 48, fh: 48, fps: 10 },
  toro_embestir:         { file: 'toro_embestir.png',         fw: 48, fh: 48, fps: 14 },
  toro_clavado:          { file: 'toro_clavado.png',          fw: 48, fh: 48, fps: 6 },
  toro_mareado:          { file: 'toro_mareado.png',          fw: 48, fh: 48, fps: 6 },
  toro_salto:            { file: 'toro_salto.png',            fw: 48, fh: 48, fps: 8 },
  toro_dano:             { file: 'toro_dano.png',             fw: 48, fh: 48, fps: 10 },
  toro_derrota:          { file: 'toro_derrota.png',          fw: 48, fh: 48, fps: 6, loop: false },
  gusano_quieto:         { file: 'gusano_quieto.png',         fw: 32, fh: 32, fps: 4 },
  gusano_hundirse:       { file: 'gusano_hundirse.png',       fw: 32, fh: 32, fps: 8, loop: false },
  gusano_salir:          { file: 'gusano_salir.png',          fw: 32, fh: 32, fps: 10 },
  gusano_taladrar:       { file: 'gusano_taladrar.png',       fw: 32, fh: 32, fps: 14 },
  gusano_cansado:        { file: 'gusano_cansado.png',        fw: 32, fh: 32, fps: 4 },
  gusano_dano:           { file: 'gusano_dano.png',           fw: 32, fh: 32, fps: 8 },
  gusano_derrota:        { file: 'gusano_derrota.png',        fw: 32, fh: 32, fps: 6, loop: false },
  gusano_sacudir:        { file: 'gusano_sacudir.png',        fw: 32, fh: 32, fps: 12 },
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
  retrato_eco:         { file: '../bg/retrato_eco.png',         fw: 64, fh: 64 },
  retrato_oso:         { file: '../bg/retrato_oso.png',         fw: 64, fh: 64 },
  retrato_rana:        { file: '../bg/retrato_rana.png',        fw: 64, fh: 64 },
  retrato_toro:        { file: '../bg/retrato_toro.png',        fw: 64, fh: 64 },
  retrato_gusano:      { file: '../bg/retrato_gusano.png',      fw: 64, fh: 64 },
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
  tiles_linde:   { file: 'tiles_linde.png',   fw: 16, fh: 16 },
  tiles_bosque:  { file: 'tiles_bosque.png',  fw: 16, fh: 16 },
  tiles_pantano: { file: 'tiles_pantano.png', fw: 16, fh: 16 },
  tiles_dorada:  { file: 'tiles_dorada.png',  fw: 16, fh: 16 },
  tiles_nieve:   { file: 'tiles_nieve.png',   fw: 16, fh: 16 },
  tiles_hielo:   { file: 'tiles_hielo.png',   fw: 16, fh: 16 },
  tiles_tormenta:{ file: 'tiles_tormenta.png',fw: 16, fh: 16 },
  tiles_templo:  { file: 'tiles_templo.png',  fw: 16, fh: 16 },
  tiles_niebla:  { file: 'tiles_niebla.png',  fw: 16, fh: 16 },
  // Zona 7 · Ciudadela de Niebla: plataforma oculta y onda del caracol del eco
  bloque_niebla: { file: 'bloque_niebla.png', fw: 16, fh: 16, fps: 4 },
  caracol_eco:   { file: 'caracol_eco.png',   fw: 16, fh: 16, fps: 12 },
  tiles_orilla:  { file: 'tiles_orilla.png',  fw: 16, fh: 16 },
  tiles_lago:    { file: 'tiles_lago.png',    fw: 16, fh: 16 },
  tiles_espejo:  { file: 'tiles_espejo.png',  fw: 16, fh: 16 },
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
  instrumento_flauta:  { file: 'instrumento_flauta.png',  fw: 16, fh: 16, fps: 3 },
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

// El Silencio (jefe final, sala 22): tres formas con los mismos estados que el Eco
[1, 2, 3].forEach(function (f) {
  ['flotar', 'cantar', 'caer', 'recalentado', 'dano', 'derrota', 'transformar'].forEach(function (st) {
    SPRITES['silencio' + f + '_' + st] = { file: 'silencio' + f + '_' + st + '.png', fw: 48, fh: 48,
      fps: st === 'derrota' || st === 'transformar' ? 6 : 8, loop: !(st === 'derrota' || st === 'transformar') };
  });
});
SPRITES.retrato_silencio = { file: '../bg/retrato_silencio.png', fw: 64, fh: 64 };

// Bloques, paredes y decoración de cada tema (se agregan aquí para no repetir)
['cityday', 'cave', 'sea', 'city', 'bamboo', 'tech', 'mine', 'linde', 'bosque', 'pantano', 'dorada', 'templo', 'nieve', 'hielo', 'tormenta', 'orilla', 'lago', 'espejo', 'niebla', 'tower'].forEach(function (t) {
  SPRITES['tiles_' + t + '_extra'] = { file: 'tiles_' + t + '_extra.png', fw: 16, fh: 16 };
  SPRITES['pared_' + t] = { file: 'pared_' + t + '.png', fw: 16, fh: 16 };
  // Tejido HD: bloques que se arman según sus vecinos (cuadrícula de 4×4), adornos que
  // sobresalen arriba y cuelgan abajo, y las plataformas delgadas (punta, medio, punta)
  SPRITES['tiles_' + t + '_auto'] = { file: 'tiles_' + t + '_auto.png', fw: 16, fh: 16, grid: 4 };
  SPRITES['bordes_' + t] = { file: 'bordes_' + t + '.png', fw: 16, fh: 8 };
  SPRITES['colgantes_' + t] = { file: 'colgantes_' + t + '.png', fw: 16, fh: 8 };
  SPRITES['plataforma_' + t] = { file: 'plataforma_' + t + '.png', fw: 16, fh: 8 };
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
  arbol:       { file: 'deco_arbol',        fw: 48, fh: 96 },
  hongo:       { file: 'deco_hongo',        fw: 16, fh: 16 },
  raiz:        { file: 'deco_raiz',         fw: 48, fh: 16 },
  mostrador:   { file: 'deco_mostrador',    fw: 48, fh: 32 },
  antorcha:    { file: 'deco_antorcha',     fw: 16, fh: 32, fps: 8 },
  discoSol:    { file: 'deco_disco_sol',    fw: 32, fh: 32 },
  columna:     { file: 'deco_columna',      fw: 16, fh: 96 },
  estatua:     { file: 'deco_estatua',      fw: 32, fh: 64 },
  arco:        { file: 'deco_arco',         fw: 80, fh: 80 },
  // Zona 6 · Lago Espejo
  juncos:      { file: 'deco_juncos',       fw: 16, fh: 48, fps: 2 },
  islaJuncos:  { file: 'deco_isla_juncos',  fw: 64, fh: 32 },
  nenufar:     { file: 'deco_nenufar',      fw: 32, fh: 16 },
  musgo:       { file: 'deco_musgo',        fw: 32, fh: 16 },
  // Zona 5 · la ciudad del futuro bajo el hielo
  torreFutura: { file: 'deco_torre_futura', fw: 48, fh: 144 },
  cupula:      { file: 'deco_cupula',       fw: 96, fh: 64 },
  robot:       { file: 'deco_robot',        fw: 32, fh: 48 },
  neon:        { file: 'deco_neon',         fw: 48, fh: 32 },
  cables:      { file: 'deco_cables',       fw: 16, fh: 48 },
  farolFuturo: { file: 'deco_farol_futuro', fw: 16, fh: 64 }
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
  // Cuadros teñidos ya hechos (muros de nota, llaves y puertas de color...):
  // 'nombre|cuadro|color|fuerza' -> lienzo. Se arman una vez y se reusan
  const tinted = {};

  // Mide la imagen: los cuadros van uno al lado del otro con la forma fw×fh
  // (las hojas en cuadrícula, como tiles_<tema>_auto, llevan grid: 4 = 4×4 cuadros)
  function measure(name, img) {
    const s = SPRITES[name];
    if (s.grid) {
      const gw = img.width / s.grid;
      images[name] = { img: img, frames: s.grid * s.grid, cols: s.grid, sw: gw, sh: img.height / s.grid,
                       hd: gw > s.fw * 1.5, big: gw >= s.fw * 7 };
      return;
    }
    const frameW = img.height * s.fw / s.fh;
    const frames = Math.max(1, Math.round(img.width / frameW));
    const sw = img.width / frames;
    // big: hoja "Tejido HD" (cada cuadro al doble: 8 px por pixel del juego o más)
    images[name] = { img: img, frames: frames, cols: frames, sw: sw, sh: img.height, hd: sw > s.fw * 1.5, big: sw >= s.fw * 7 };
  }

  // Cuánto se agranda un dibujo HD (CONFIG.HD): solo si la hoja ya es HD; si no, igual
  // que antes. El agrandado se apoya abajo al centro (papa, corcheas) o crece desde el
  // centro (objetos), así quien lo dibuja no cambia sus cuentas
  function growOf(name) {
    const im = images[name];
    if (!im || !im.big || !CONFIG.HD) return null;
    const G = CONFIG.HD.GROW;
    for (let i = 0; i < G.length; i++) {
      const g = G[i];
      if ((g.names || []).indexOf(name) >= 0 || (g.prefix && [].concat(g.prefix).some(function (p) { return name.indexOf(p) === 0; }))) return g;
    }
    return { scale: 1, anchor: 'bottom' };
  }

  // Caja donde se dibuja el cuadro (x, y del tamaño del juego fw×fh). Una hoja HD mide
  // su cuadro a CONFIG.HD.DENSITY px por pixel del juego (algunos cuadros HD traen más
  // aire que antes, como los jefes chicos en su cuadro de 384) y después se agranda
  function box(name, x, y) {
    const s = SPRITES[name];
    const g = growOf(name);
    if (!g) return { x: x, y: y, w: s.fw, h: s.fh };
    const im = images[name];
    const w = im.sw / CONFIG.HD.DENSITY * g.scale;
    const h = im.sh / CONFIG.HD.DENSITY * g.scale;
    const bx = x + s.fw / 2 - w / 2;
    const by = g.anchor === 'center' ? y + s.fh / 2 - h / 2 : y + s.fh - h;
    return { x: bx, y: by, w: w, h: h };
  }

  // Busca primero en assets/sprites/ y, si no está, en assets/bg/ (con reintentos:
  // ver Loader en js/util.js). Un archivo que no está en ninguna no detiene el juego
  // (se usa el dibujo de respaldo)
  // Con un util.js viejo (sin Loader) se carga como antes, sin reintentos
  const loadImage = typeof Loader !== 'undefined' ? Loader.image : function (src, ok, fail) {
    const img = new Image();
    img.onload = function () { ok(img); };
    img.onerror = function () { fail(); };
    img.src = src;
  };
  const counts = { done: 0, total: 0 };

  // tries: intentos por lugar (al empezar, 1: así "Cargando..." dura poco)
  function loadOne(name, tries) {
    const file = SPRITES[name].file;
    // Los de la portada y los retratos están en assets/bg/; el resto, en assets/sprites/
    const places = file.indexOf('../bg/') === 0
      ? [BG_PATH + file.replace('../bg/', ''), PATH + file.replace('../bg/', '')]
      : [PATH + file];
    return new Promise(function (resolve) {
      function attempt(i) {
        if (i >= places.length) {
          resolve(false);
          return;
        }
        loadImage(places[i], function (img) {
          measure(name, img);
          resolve(true);
        }, function () { attempt(i + 1); }, tries);
      }
      attempt(0);
    });
  }

  // Espera los dibujos, pero no más de CONFIG.LOAD_WAIT segundos: si el servidor está
  // lento, el juego empieza igual y cada dibujo aparece cuando llega. Los que no
  // llegaron se piden otra vez unos segundos después, ya con el juego andando
  // (el servidor de Acode a veces no entrega un archivo a la primera)
  function load() {
    const names = Object.keys(SPRITES);
    counts.total = names.length;
    const all = Promise.all(names.map(function (n) {
      return loadOne(n, 1).then(function (ok) { counts.done++; return ok; });
    })).then(function (ok) {
      const missing = names.filter(function (n, i) { return !ok[i]; });
      setTimeout(function () {
        missing.forEach(function (n) { loadOne(n, 2); });
      }, CONFIG.RETRY_AFTER * 1000);
    });
    const cap = new Promise(function (resolve) { setTimeout(resolve, CONFIG.LOAD_WAIT * 1000); });
    return Promise.race([all, cap]);
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
    const fx = (f % im.cols) * im.sw;
    const fy = Math.floor(f / im.cols) * im.sh;
    if (!tint) return { img: im.img, sx: fx, sy: fy, sw: im.sw, sh: im.sh };
    const a = alpha == null ? 0.5 : alpha;
    const key = name + '|' + f + '|' + tint + '|' + a;
    let c = tinted[key];
    if (!c) {
      c = document.createElement('canvas');
      c.width = Math.ceil(im.sw);
      c.height = im.sh;
      const t = c.getContext('2d');
      t.drawImage(im.img, fx, fy, im.sw, im.sh, 0, 0, im.sw, im.sh);
      t.globalCompositeOperation = 'source-atop';
      t.globalAlpha = a;
      t.fillStyle = tint;
      t.fillRect(0, 0, c.width, im.sh);
      tinted[key] = c;
    }
    return { img: c, sx: 0, sy: 0, sw: im.sw, sh: im.sh };
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
    const b = box(name, x, y);
    const px = Math.round(b.x);
    const py = Math.round(b.y);
    // Pixel art: bordes duros; dibujo a 4x: suave
    const smooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = im.hd;

    if (flip) {
      ctx.save();
      ctx.translate(px + b.w, py);
      ctx.scale(-1, 1);
      ctx.drawImage(src.img, src.sx, src.sy, src.sw, src.sh, 0, 0, b.w, b.h);
      ctx.restore();
    } else {
      ctx.drawImage(src.img, src.sx, src.sy, src.sw, src.sh, px, py, b.w, b.h);
    }
    ctx.imageSmoothingEnabled = smooth;
    return true;
  }

  // Cartel estirado a lo ancho (w) sin deformar las puntas: las dos cuartas partes de
  // los costados quedan igual y el centro se estira. Para que el texto quepa adentro
  function drawStretched(ctx, name, frame, x, y, w) {
    const im = images[name];
    if (!im) return false;
    const s = SPRITES[name];
    const f = Math.max(0, Math.min(frame, im.frames - 1));
    const sx = f * im.sw;
    const capS = im.sw / 4;
    const capD = s.fw / 4;
    const px = Math.round(x);
    const py = Math.round(y);
    const midD = Math.max(0, w - capD * 2);
    const smooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = im.hd;
    ctx.drawImage(im.img, sx, 0, capS, im.sh, px, py, capD, s.fh);
    ctx.drawImage(im.img, sx + capS, 0, im.sw - capS * 2, im.sh, px + capD, py, midD, s.fh);
    ctx.drawImage(im.img, sx + im.sw - capS, 0, capS, im.sh, px + capD + midD, py, capD, s.fh);
    ctx.imageSmoothingEnabled = smooth;
    return true;
  }

  // Igual que drawFrame, pero con un contorno de color alrededor (por defecto, tinta clara):
  // separa del fondo lo que se junta (monedas, cubos, llaves...). w: grosor en px del juego
  function drawOutlined(ctx, name, frame, x, y, flip, color, w) {
    const im = images[name];
    if (!im) return false;
    const s = SPRITES[name];
    const f = Math.max(0, Math.min(frame, im.frames - 1));
    const sil = source(name, f, color || '#F3E6CC', 1);
    const d = w || 0.75;
    const b = box(name, x, y);
    const px = Math.round(b.x);
    const py = Math.round(b.y);
    const smooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = im.hd;
    [[-d, 0], [d, 0], [0, -d], [0, d]].forEach(function (o) {
      ctx.drawImage(sil.img, sil.sx, sil.sy, sil.sw, sil.sh, px + o[0], py + o[1], b.w, b.h);
    });
    ctx.imageSmoothingEnabled = smooth;
    return drawFrame(ctx, name, frame, x, y, flip);
  }

  // Igual que drawFrame, pero centrado de lado y con la base en (cx, bottom):
  // así un sprite de 32×32 calza con un jefe más chico
  function drawAnchored(ctx, name, frame, cx, bottom, flip, tint, tintAlpha) {
    const s = SPRITES[name];
    if (!s) return false;
    return drawFrame(ctx, name, frame, cx - s.fw / 2, bottom - s.fh, flip, tint, tintAlpha);
  }

  // Cuántos dibujos ya contestaron (para el "Cargando...")
  function progress() {
    return counts;
  }

  // ¿Este dibujo ya está en HD? (para quien quiera saberlo)
  function isHD(name) {
    return !!growOf(name);
  }

  return { load: load, isHD: isHD, drawOutlined: drawOutlined, drawStretched: drawStretched, progress: progress, has: has, frames: frames, frameAt: frameAt,
           drawFrame: drawFrame, drawAnchored: drawAnchored };
})();
