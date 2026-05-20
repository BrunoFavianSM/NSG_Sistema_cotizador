'use strict';

/**
 * Controlador de Importación CSV
 *
 * Endpoints para importar catálogo de productos desde CSV de Deltron,
 * consultar el estado del enriquecimiento IA y reintentar productos fallidos.
 *
 * Requisitos: 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5
 */

const { ejecutarQuery } = require('../configuracion/baseDatos');
const { parsearCSV, importar, calcularSpecsFaltantes } = require('../servicios/servicioImportacion');
const servicioEnriquecimientoIA = require('../servicios/servicioEnriquecimientoIA');

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
      pendientes_enriquecimiento: resultado.pendientes_enriquecimiento,
    });
  } catch (error) {
    console.error('Error al importar CSV:', error);
    return res.status(500).json({
      error: 'Error al importar CSV',
      mensaje: error.message || 'No se pudo completar la importación',
    });
  }
}

/**
 * GET /api/importacion/estado-enriquecimiento
 *
 * Combina el estado en memoria del servicio IA con conteos reales de BD.
 * Retorna: { en_proceso, pendientes, completados, fallidos, ultima_actualizacion }
 *
 * Auth: verificarTokenAdmin (aplicado en rutas/importacion.js)
 * Requisitos: 5.1, 5.2
 *
 * @param {Object} req
 * @param {Object} res
 */
async function obtenerEstadoEnriquecimiento(req, res) {
  try {
    // Estado en memoria: en_proceso y ultima_actualizacion
    const estadoMemoria = servicioEnriquecimientoIA.obtenerEstadoMemoria();

    // Conteos reales desde BD (diseño §6.1)
    const sql = `
      SELECT estado_enriquecimiento, COUNT(*) AS total
      FROM productos
      WHERE estado_enriquecimiento IN ('pendiente', 'ia_completado', 'ia_fallido')
      GROUP BY estado_enriquecimiento
    `;
    const resultado = await ejecutarQuery(sql);
    const filas = resultado.rows || [];

    // Construir mapa de conteos con valores por defecto en 0
    const conteos = { pendiente: 0, ia_completado: 0, ia_fallido: 0 };
    for (const fila of filas) {
      conteos[fila.estado_enriquecimiento] = parseInt(fila.total, 10);
    }

    return res.json({
      en_proceso:          estadoMemoria.en_proceso,
      pendientes:          conteos.pendiente,
      completados:         conteos.ia_completado,
      fallidos:            conteos.ia_fallido,
      ultima_actualizacion: estadoMemoria.ultima_actualizacion,
    });
  } catch (error) {
    console.error('Error al obtener estado de enriquecimiento:', error);
    return res.status(500).json({
      error: 'Error al obtener estado de enriquecimiento',
      mensaje: error.message || 'No se pudo consultar el estado',
    });
  }
}

/**
 * POST /api/importacion/reintentar-fallidos
 *
 * Mueve todos los productos con estado_enriquecimiento = 'ia_fallido' a 'pendiente'
 * y reactiva la cola de enriquecimiento IA.
 *
 * Auth: verificarTokenAdmin (aplicado en rutas/importacion.js)
 * Rate limit: limitadorReintento (10 req / 15 min por IP, en servidor.js)
 * Requisitos: 5.3, 5.4, 5.5
 *
 * @param {Object} req
 * @param {Object} res
 */
async function reintentarFallidos(req, res) {
  try {
    // Mover ia_fallido → pendiente y recuperar los productos afectados (diseño §6.2)
    const sql = `
      UPDATE productos
      SET estado_enriquecimiento = 'pendiente',
          updated_at = NOW()
      WHERE estado_enriquecimiento = 'ia_fallido'
      RETURNING id, categoria, nombre, descripcion_general
    `;
    const resultado = await ejecutarQuery(sql);
    const filas = resultado.rows || [];

    // Sin productos fallidos → respuesta informativa (Req 5.4)
    if (resultado.rowCount === 0) {
      return res.json({
        exito: true,
        mensaje: 'No hay productos fallidos para reintentar',
        reintentados: 0,
      });
    }

    // Reconstruir items de cola con specs faltantes (diseño §6.2)
    const items = filas.map((fila) => ({
      id_producto:        fila.id,
      categoria:          fila.categoria,
      nombre:             fila.nombre,
      descripcion_general: fila.descripcion_general,
      // Sin registro de specs en memoria → calcularSpecsFaltantes devuelve todos los campos requeridos
      specs_faltantes:    calcularSpecsFaltantes(fila.categoria, {}),
    }));

    // Encolar y reactivar el procesamiento (Req 5.5)
    servicioEnriquecimientoIA.encolarProductos(items);
    servicioEnriquecimientoIA.reactivarCola();

    return res.json({
      exito:       true,
      reintentados: resultado.rowCount,
    });
  } catch (error) {
    console.error('Error al reintentar productos fallidos:', error);
    return res.status(500).json({
      error: 'Error al reintentar productos fallidos',
      mensaje: error.message || 'No se pudo completar el reintento',
    });
  }
}

module.exports = { importarCSV, obtenerEstadoEnriquecimiento, reintentarFallidos };
