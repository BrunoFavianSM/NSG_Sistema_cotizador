/**
 * Servicio de Exportación a Excel
 *
 * Genera archivos .xlsx a partir de los datos de una cotización.
 * Usa la librería `xlsx` (SheetJS) para construir el workbook.
 *
 * Estructura del archivo generado:
 *   Hoja 1 "Metadatos"  — código ticket, fechas, precio total
 *   Hoja 2 "Componentes" — nombre, categoría, precio unitario, cantidad
 *
 * Requisitos: 2.2
 */

const XLSX = require('xlsx');

/**
 * Formatea un valor de fecha a string legible (DD/MM/YYYY HH:MM).
 * @param {string|Date|null} fecha
 * @returns {string}
 */
function formatearFecha(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return String(fecha);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Genera un archivo Excel (.xlsx) con los datos de una cotización.
 *
 * @param {Object} cotizacion - Objeto de cotización con la siguiente forma:
 *   {
 *     codigo_ticket: string,
 *     fecha_emision: string|Date,
 *     fecha_validez: string|Date,
 *     precio_total: number,          // total con IGV en USD
 *     componentes: Array<{
 *       nombre: string,
 *       categoria: string,
 *       precio_unitario: number,     // precio unitario total USD
 *       cantidad: number
 *     }>
 *   }
 * @returns {Buffer} Buffer con el contenido del archivo .xlsx
 */
function generarExcelCotizacion(cotizacion) {
  if (!cotizacion || typeof cotizacion !== 'object') {
    throw new Error('Se requiere un objeto de cotización válido');
  }

  const {
    codigo_ticket = '',
    fecha_emision = null,
    fecha_validez = null,
    precio_total = 0,
    componentes = []
  } = cotizacion;

  // ── Hoja 1: Metadatos ──────────────────────────────────────────────────────
  const datosMetadatos = [
    ['Campo', 'Valor'],
    ['Código Ticket', codigo_ticket],
    ['Fecha de Emisión', formatearFecha(fecha_emision)],
    ['Fecha de Validez', formatearFecha(fecha_validez)],
    ['Precio Total (USD)', Number(precio_total)]
  ];

  const hojaMetadatos = XLSX.utils.aoa_to_sheet(datosMetadatos);

  // Ancho de columnas para metadatos
  hojaMetadatos['!cols'] = [{ wch: 22 }, { wch: 30 }];

  // Estilo de encabezado (negrita) — SheetJS CE no soporta estilos completos,
  // pero sí permite definir el tipo de celda para que los números sean numéricos.
  // La celda B5 (precio_total) ya es número por el valor Number(precio_total).

  // ── Hoja 2: Componentes ────────────────────────────────────────────────────
  const encabezadoComponentes = ['Nombre', 'Categoría', 'Precio Unitario (USD)', 'Cantidad'];

  const filasComponentes = Array.isArray(componentes)
    ? componentes.map((comp) => [
        String(comp.nombre || ''),
        String(comp.categoria || ''),
        Number(comp.precio_unitario || comp.precio_unitario_total_usd || 0),
        Number(comp.cantidad || 1)
      ])
    : [];

  const datosComponentes = [encabezadoComponentes, ...filasComponentes];

  const hojaComponentes = XLSX.utils.aoa_to_sheet(datosComponentes);

  // Ancho de columnas para componentes
  hojaComponentes['!cols'] = [
    { wch: 40 }, // Nombre
    { wch: 20 }, // Categoría
    { wch: 22 }, // Precio Unitario
    { wch: 12 }  // Cantidad
  ];

  // ── Workbook ───────────────────────────────────────────────────────────────
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, hojaMetadatos, 'Metadatos');
  XLSX.utils.book_append_sheet(workbook, hojaComponentes, 'Componentes');

  // Generar buffer en formato .xlsx
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return buffer;
}

module.exports = { generarExcelCotizacion };
