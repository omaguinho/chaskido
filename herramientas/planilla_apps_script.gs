// Chaskido · Informe de juego → Google Sheets
// Pegar en Extensiones → Apps Script de la planilla y publicar como "Aplicación web".
// Cada sesión que manda el juego entra como una fila en la hoja "Sesiones":
// una columna por cada dato del resumen y, al final, el JSON completo.
// Si el juego empieza a mandar datos nuevos, se agregan columnas solas.

const HOJA = 'Sesiones';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);                       // dos envíos a la vez no se pisan
  try {
    const datos = JSON.parse(e.postData.contents);
    const resumen = datos.resumen || {};
    const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA) ||
                 SpreadsheetApp.getActive().insertSheet(HOJA);

    // Encabezados: los del resumen + "json" al final; suma los que falten
    let encabezados = hoja.getLastRow() ? hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0] : [];
    if (!encabezados.length) encabezados = ['recibido'];
    Object.keys(resumen).forEach(function (k) {
      if (encabezados.indexOf(k) < 0) encabezados.splice(Math.max(encabezados.indexOf('json'), 0) || encabezados.length, 0, k);
    });
    if (encabezados.indexOf('json') < 0) encabezados.push('json');
    hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]).setFontWeight('bold');
    hoja.setFrozenRows(1);

    // La fila de esta sesión
    const fila = encabezados.map(function (k) {
      if (k === 'recibido') return new Date();
      if (k === 'json') return JSON.stringify(datos).slice(0, 49000);   // límite de una celda
      const v = resumen[k];
      return v === undefined ? '' : v;
    });
    hoja.appendRow(fila);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  } finally {
    lock.releaseLock();
  }
}

// Para probar desde el navegador: abrir la dirección y debe decir "Chaskido: listo"
function doGet() {
  return ContentService.createTextOutput('Chaskido: listo');
}
