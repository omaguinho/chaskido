# Chaskido · versión 6 · cómo armar la carpeta

Este zip trae **todo el código** del juego, ya ordenado. Los **dibujos y la música no vienen**: se hicieron en otra conversación (la de los sprites), y la música es tuya. Aquí está cómo juntar todo en una sola carpeta.

## 1. Qué trae este zip

```
chaskido/
  index.html            el juego (se abre este)
  revisar.html          revisa qué dibujos y músicas faltan
  LEEME.md              este archivo
  css/style.css
  js/                   25 archivos del juego, levels.js incluido (salas 1 a 6, S1, S2, S3, C1, C2, q1, q2, q5, q6)
  nivelmaker/editor-chasqui.html   el editor de salas
  assets/
    sprites/            (vacía) aquí van los dibujos
    bg/                 (vacía) aquí van los fondos, la portada, el logo y los retratos
    music/              (vacía) aquí van las 2 músicas
```

`js/extras.js` ya no existe: no hace falta.

## 2. Qué tienes que agregar

| Qué | De dónde | Va en |
|---|---|---|
| `chasqui_sprites.zip` | conversación de los sprites (primera entrega, estilo Moebius) | se descomprime dentro de `chaskido/` |
| `chaskido_sprites_z1z2.zip` | conversación de los sprites (zonas 1 y 2) | se descomprime dentro de `chaskido/` |
| `chaskido_sprites_llaves.zip` | conversación de los sprites (llaves, puertas, sellos y tótem). Solo si ya lo pediste | se descomprime dentro de `chaskido/` |
| `blues_do_mayor.mp3` y `blues_mi_menor.mp3` | tu carpeta actual: `assets/music/` | `chaskido/assets/music/` |

**El orden importa:** primero la entrega más vieja y al final la más nueva. Cuando te pregunte si reemplaza, di **que sí**: lo nuevo tiene que pisar lo viejo.

Los zips de sprites ya traen adentro su carpeta `assets/`. Por eso se descomprimen en `chaskido/`, no en `chaskido/assets/`.

Los zips de sprites también traen `manifest.json` y `preview.png`. El juego no los usa: puedes dejarlos o borrarlos.

## 3. La carpeta terminada

```
chaskido/
  index.html
  revisar.html
  css/style.css
  js/ (25 archivos)
  nivelmaker/editor-chasqui.html
  assets/
    sprites/   papa_quieta.png, tiles_city.png, corchea.png ... (más de 200)
    bg/        bg_city_far.png, bg_city_mid.png, bg_city_near.png ..., portada.png, logo.png, retrato_bombo.png ...
    music/     blues_do_mayor.mp3, blues_mi_menor.mp3
```

## 4. Comprobar

Abre **`revisar.html`** de la misma forma que abres el juego (en Acode, o con doble clic en un computador).
- Muestra cada archivo que el juego busca: **verde** si está, **rojo** si falta o tiene otro nombre.
- El juego funciona igual si falta alguno: dibuja un reemplazo simple en su lugar.
- Si un dibujo que sí tienes sale en rojo, revisa el nombre: tiene que ser exacto, en minúsculas y en la carpeta correcta.

Después abre `index.html` y juega un rato.

## 5. Hacerlo en la tablet con la terminal de Acode

Tu proyecto está en `/public/chaskido`. La idea:
- tu carpeta actual se guarda como **respaldo** (no se borra nada);
- la carpeta nueva queda en el mismo lugar y con el mismo nombre, así Acode la sigue encontrando.

**a) Deja los zips en Descargas.** Pon este zip (`chaskido_completo.zip`) y los zips de sprites en **Download**.

**b) Copia y pega en la terminal, una línea a la vez:**
```
cd /storage/emulated/0/Download
mv /public/chaskido /public/chaskido_respaldo
unzip chaskido_completo.zip -d /public/
cp -r /public/chaskido_respaldo/assets/. /public/chaskido/assets/
unzip -o chaskido_sprites_z1z2.zip -d /public/chaskido
```
Lo que hace cada línea:
1. Entra a Descargas.
2. Guarda tu carpeta actual como respaldo.
3. Descomprime este zip: crea la carpeta nueva `/public/chaskido`.
4. Copia los dibujos y la música que ya tenías, incluidas las 2 músicas.
5. Pone encima los dibujos de las zonas 1 y 2.

**c) Si tienes el zip de las llaves, agrega esta línea:**
```
unzip -o chaskido_sprites_llaves.zip -d /public/chaskido
```

**d) Revisa que quedó bien:**
```
ls /public/chaskido
ls /public/chaskido/assets/music
```
- El primer comando tiene que mostrar `assets`, `css`, `index.html`, `js`, `LEEME.md`, `nivelmaker` y `revisar.html`.
- El segundo tiene que mostrar las 2 músicas.

**e)** Abre en Acode `revisar.html` y después `index.html`.

**f)** Cuando todo funcione bien por unos días, puedes borrar el respaldo. Esto **no se puede deshacer**:
```
rm -r /public/chaskido_respaldo
```

**Sin terminal:** también puedes descomprimir con **Mis archivos**. Mantén apretado el zip → **Extraer** → elige la carpeta. Sigue el mismo orden del punto 2.

## 6. Mandárselo a un amigo

Comprime la carpeta `chaskido` entera, ya con los dibujos y la música:
```
cd /public
zip -r /storage/emulated/0/Download/chaskido_para_probar.zip chaskido
```
Si "Mis archivos" no lo muestra en Download, ciérralo del todo y ábrelo de nuevo, o reinicia la tablet.

**Tu amigo:** descomprime el zip en un computador y abre `index.html` con Chrome o Edge (doble clic).
- La partida se guarda en su navegador.
- Si algo falla, salen letras verdes arriba con el error. Que te mande una foto.

**Teclas:**

| Acción | Tecla |
|---|---|
| Moverse | A / D o flechas |
| Saltar | Espacio |
| Correr y usar (tótem, posta, vendedor) | E |
| Dash | Shift |
| Ají | Q |
| Pausa (mapa, poderes, llaves, canciones, guardar) | Esc |
| Silencio | M |

También funciona con un mando.
