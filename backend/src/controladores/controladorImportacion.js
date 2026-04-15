'use strict';

/**
 * Controlador de Importación CSV
 *
 * Endpoint para importar catálogo de productos desde CSV de Deltron.
 * Valida archivo recibido, parsea y ejecuta upsert masivo.
 *
 * Requisitos: 5.1, 5.9, 5.10, 5.12
 */

const { ejecutarQuery } = require('../configuracion/baseDatos');
const { parsearCSV, importar } = require('../servicios/servicioImportacion');

/**
 * POST /api/importacion/csv
 *
 * Recibe un archivo CSV via multer (memoryStorage).
 * Parsea el contenido y ejecuta upsert en las tablas productos_{categoria}.
 *
 * @param {Object} req - Request de Express (req.file contiene el buffer)
 * @param {Object} res - Response de Express
 */
async function importarCSV(req, res) {
  try {
    // Validar que se recibió un archivo
    if (!req.file) {
      return res.status(400).json({
        error: 'Archivo no recibido',
        mensaje: 'Debe enviar un archivo CSV en el campo "archivo"',
      });
    }

    // Parsear CSV desde el buffer en memoria
    const filas = parsearCSV(req.file.buffer);

    if (filas.length === 0) {
      return res.status(400).json({
        error: 'CSV vacío',
        mensaje: 'El archivo CSV no contiene filas para procesar',
      });
    }

    // Ejecutar importación (upsert masivo)
    const resultado = await importar(filas, ejecutarQuery);

    return res.json({
      exito: true,
      mensaje: 'Importación completada',
      total_filas: filas.length,
      insertados: resultado.insertados,
      actualizados: resultado.actualizados,
      omitidos: resultado.omitidos,
      errores: resultado.errores,
      detalle_errores: resultado.detalle_errores,
    });
  } catch (error) {
    console.error('Error al importar CSV:', error);
    return res.status(500).json({
      error: 'Error al importar CSV',
      mensaje: error.message || 'No se pudo completar la importación',
    });
  }
}

module.exports = { importarCSV };
