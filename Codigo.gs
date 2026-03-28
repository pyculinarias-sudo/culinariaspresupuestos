/**
 * ==========================================
 * SISTEMA CULINARIAS - BACKEND APPS SCRIPT
 * ==========================================
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧀 Culinarias PRO')
    .addItem('Abrir Sistema Web', 'abrirSistema')
    .addItem('Configurar Base de Datos', 'configurarHojas')
    .addToUi();
}

function abrirSistema() {
  const html = HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sistema Culinarias PRO')
    .setWidth(900)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Sistema Culinarias PRO');
}

function doGet(e) {
  if (e.parameter && e.parameter.accion === 'obtener_productos') {
    const productos = getProductos();
    return ContentService.createTextOutput(JSON.stringify(productos))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Sistema Culinarias PRO')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function configurarHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('PRODUCTOS')) {
    let hProd = ss.insertSheet('PRODUCTOS');
    hProd.appendRow(['ID', 'NOMBRE', 'COSTO_TOTAL', 'PRECIO_SUGERIDO', 'MARGEN', 'GANANCIA', 'FECHA', 'UNIDAD']);
    hProd.getRange("A1:H1").setFontWeight("bold").setBackground("#e0e7ff");
  }
  if (!ss.getSheetByName('PRESUPUESTOS')) {
    let hPres = ss.insertSheet('PRESUPUESTOS');
    hPres.appendRow(['N° Cotización', 'Fecha Emisión', 'Cliente', 'Fecha de Entrega', 'Detalle de Productos', 'Total a Cobrar', 'Estado']);
    hPres.getRange("A1:G1").setFontWeight("bold").setBackground("#1e1b4b").setFontColor("#ffffff");
    hPres.setColumnWidth(3, 200);
    hPres.setColumnWidth(5, 350);
  }
  SpreadsheetApp.getUi().alert('✅ Base de datos configurada correctamente.');
}

function guardarProducto(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let hoja = ss.getSheetByName('PRODUCTOS');
    if (!hoja) { configurarHojas(); hoja = ss.getSheetByName('PRODUCTOS'); }
    const idProducto = 'PROD-' + new Date().getTime();
    const fecha = new Date().toLocaleDateString('es-PY');
    // Si envían unidad en el futuro, se guarda en la octava columna
    hoja.appendRow([idProducto, data.nombre, data.costoTotal, data.precioSugerido, data.margen, data.ganancia, fecha, data.unidad || 'Unid.']);
    return { success: true, message: "Producto guardado exitosamente." };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function guardarPresupuestoVenta(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let hoja = ss.getSheetByName('PRESUPUESTOS');
    if (!hoja) { configurarHojas(); hoja = ss.getSheetByName('PRESUPUESTOS'); }
    const fila = hoja.getLastRow();
    const cotNum = payload.cotNum || ('CUL-' + String(fila).padStart(3, '0'));
    hoja.appendRow([cotNum, payload.fechaEmision, payload.cliente, payload.fechaEntrega, payload.productos, payload.total, payload.estado]);
    hoja.getRange("F" + (fila + 1)).setNumberFormat('"₲ "#,##0');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    let result;
    if (payload.tipo === 'producto') {
      result = guardarProducto(payload);
    } else {
      result = guardarPresupuestoVenta(payload);
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getProductos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('PRODUCTOS');
  if (!hoja) return [];
  const data = hoja.getDataRange().getValues();
  const productos = [];
  // Empezamos desde 1 para saltar los encabezados
  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    if (fila[1]) {
      productos.push({
        nombre: fila[1],
        precio: parseFloat(fila[3]) || 0,
        unidad: fila[7] || 'Unid.'
      });
    }
  }
  return productos;
}