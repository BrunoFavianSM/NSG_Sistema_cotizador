/**
 * Controlador de Notificaciones de Usuario
 *
 * Gestiona las notificaciones del sistema para usuarios autenticados.
 * Las notificaciones se almacenan en `notificaciones_usuario` y se consultan
 * mediante polling desde el frontend cada 30 segundos.
 *
 * Requisitos: 5.2, 5.5
 */

const { ejecutarQuery } = require('../configuracion/baseDatos');
const { validarId } = require('../utilidades/validacion');

/**
 * GET /api/notificaciones/pendientes
 *
 * Retorna las notificaciones no leídas del usuario autenticado,
 * ordenadas de más reciente a más antigua.
 *
 * Requisitos: 5.2
 */
async function obtenerPendientes(req, res) {
  try {
    const idUsuario = req.usuario.id;

    const resultado = await ejecutarQuery(
      `SELECT
         id,
         tipo,
         titulo,
         mensaje,
         leida,
         fecha_creacion,
         datos_extra
       FROM notificaciones_usuario
       WHERE id_usuario = $1
         AND leida = false
       ORDER BY fecha_creacion DESC`,
      [idUsuario]
    );

    return res.json({
      exito: true,
      cantidad: resultado.rows.length,
      notificaciones: resultado.rows,
    });
  } catch (error) {
    console.error('[controladorNotificaciones] Error al obtener notificaciones pendientes:', error);
    return res.status(500).json({
      error: 'Error al obtener notificaciones',
      mensaje: 'No se pudieron recuperar las notificaciones pendientes.',
      codigo: 'ERROR_OBTENER_NOTIFICACIONES',
    });
  }
}

/**
 * PATCH /api/notificaciones/:id/leer
 *
 * Marca una notificación como leída. Verifica que la notificación
 * pertenezca al usuario autenticado antes de actualizar.
 * Retorna HTTP 404 con código NOTIFICACION_NO_ENCONTRADA si no existe
 * o pertenece a otro usuario.
 *
 * Requisitos: 5.5
 */
async function marcarLeida(req, res) {
  try {
    const idUsuario = req.usuario.id;
    const { id } = req.params;

    const validacionId = validarId(id);
    if (!validacionId.valido) {
      return res.status(400).json({
        error: 'ID inválido',
        mensaje: validacionId.error,
        codigo: 'DATOS_INVALIDOS',
      });
    }

    const resultado = await ejecutarQuery(
      `UPDATE notificaciones_usuario
       SET leida = true
       WHERE id = $1
         AND id_usuario = $2
       RETURNING id`,
      [validacionId.id, idUsuario]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        error: 'Notificación no encontrada',
        mensaje: 'La notificación no existe o no pertenece a tu cuenta.',
        codigo: 'NOTIFICACION_NO_ENCONTRADA',
      });
    }

    return res.json({
      exito: true,
      mensaje: 'Notificación marcada como leída.',
    });
  } catch (error) {
    console.error('[controladorNotificaciones] Error al marcar notificación como leída:', error);
    return res.status(500).json({
      error: 'Error al actualizar notificación',
      mensaje: 'No se pudo marcar la notificación como leída.',
      codigo: 'ERROR_MARCAR_LEIDA',
    });
  }
}

module.exports = { obtenerPendientes, marcarLeida };
