/**
 * ==========================================
 * SISTEMA CULINARIAS - BACKEND APPS SCRIPT
 * ==========================================
 */

/**
 * 1. Crea el menú en Google Sheets al abrir el documento
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧀 Culinarias PRO')
    .addItem('Abrir Sistema Web', 'abrirSistema')
    .addItem('Configurar Base de Datos', 'configurarHojas')
    .addToUi();
}

/**
 * 2. Muestra la interfaz HTML como una ventana modal en Sheets
 */
function abrirSistema() {
  const html = HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sistema Culinarias PRO')
    .setWidth(900)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Sistema Culinarias PRO');
}

/**
 * 3. Permite desplegar el sistema como una Aplicación Web independiente (URL pública)
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Sistema Culinarias PRO')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 4. Configura las hojas de cálculo necesarias para la base de datos
 */
function configurarHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Hoja: PRODUCTOS (Calculadora de Costos)
  if (!ss.getSheetByName('PRODUCTOS')) {
    let hProd = ss.insertSheet('PRODUCTOS');
    hProd.appendRow(['ID', 'NOMBRE', 'COSTO_TOTAL', 'PRECIO_SUGERIDO', 'MARGEN', 'GANANCIA', 'FECHA']);
    hProd.getRange("A1:G1").setFontWeight("bold").setBackground("#e0e7ff");
  }

  // Hoja: PRESUPUESTOS (Ventas)
  if (!ss.getSheetByName('PRESUPUESTOS')) {
    let hPres = ss.insertSheet('PRESUPUESTOS');
    hPres.appendRow(['N° Cotización', 'Fecha Emisión', 'Cliente', 'Fecha de Entrega', 'Detalle de Productos', 'Total a Cobrar', 'Estado']);
    hPres.getRange("A1:G1").setFontWeight("bold").setBackground("#1e1b4b").setFontColor("#ffffff");
    hPres.setColumnWidth(3, 200); 
    hPres.setColumnWidth(5, 350); 
  }
  
  SpreadsheetApp.getUi().alert('✅ Base de datos (Hojas) configuradas correctamente.');
}

/**
 * 5. Guarda un Producto desde la Calculadora de Costos
 */
function guardarProducto(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let hoja = ss.getSheetByName('PRODUCTOS');
    if (!hoja) { configurarHojas(); hoja = ss.getSheetByName('PRODUCTOS'); }

    const idProducto = 'PROD-' + new Date().getTime();
    const fecha = new Date().toLocaleDateString('es-PY');

    hoja.appendRow([
      idProducto, 
      data.nombre, 
      data.costoTotal, 
      data.precioSugerido, 
      data.margen, 
      data.ganancia,
      fecha
    ]);

    return { success: true, message: "Producto guardado en la base de datos." };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * 6. Guarda una Cotización desde el Presupuestador
 */
function guardarPresupuestoVenta(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let hoja = ss.getSheetByName('PRESUPUESTOS');
    if (!hoja) { configurarHojas(); hoja = ss.getSheetByName('PRESUPUESTOS'); }

    // Generar ID
    const fila = hoja.getLastRow();
    const cotNum = 'CUL-' + String(fila).padStart(3, '0');

    hoja.appendRow([
      cotNum,
      payload.fechaEmision,
      payload.cliente,
      payload.fechaEntrega,
      payload.productos,
      payload.total,
      payload.estado
    ]);
    
    hoja.getRange(`F${fila + 1}`).setNumberFormat('"₲ "#,##0');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * 7. Webhook (API) para recibir datos desde aplicaciones externas
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    // Distinguir si llega un Producto o un Presupuesto
    if (payload.tipo === 'producto') {
      guardarProducto(payload);
    } else {
      guardarPresupuestoVenta(payload);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}