/**
 * servicioMemoriaPerfil.js
 * Recupera el perfil previo de un usuario autenticado para personalizar
 * la experiencia del Asistente IA NSG Concierge v2.
 *
 * Responsabilidades:
 *  - Consultar `asistente_sesiones` para obtener el perfil y presupuesto más recientes.
 *  - Consultar `asistente_configuraciones` para obtener la última configuración validada.
 *  - Retornar null si el usuario no está autenticado o no tiene historial.
 *
 * Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5
 */

'use strict';

const { ejecutarQuery } = require('../configuracion/baseDatos');

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Obtiene el perfil previo de un usuario para personalizar la cotización.
 *
 * @param {number|null|undefined} usuario_id - ID del usuario autenticado.
 * @returns {Promise<{
 *   perfil_usuario: string,
 *   presupuesto_pen: number,
 *   configuracion_reciente: object|null,
 *   sesion_id_previa: string
 * }|null>} Perfil previo o null si no hay historial o el usuario no está autenticado.
 */
async function obtenerPerfilPrevio(usuario_id) {
  // Req 5.1: retornar null si el usuario no está autenticado
  if (!usuario_id || typeof usuario_id !== 'number') {
    return null;
  }

  // Buscar la sesión más reciente del usuario que tenga perfil identificado
  const resultadoSesion = await ejecutarQuery(
    `SELECT
       sesion_id,
       perfil_usuario,
       presupuesto_pen,
       created_at
     FROM asistente_sesiones
     WHERE usuario_id = $1
       AND perfil_usuario IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [usuario_id]
  );

  // Req 5.1: retornar null si no hay historial previo
  if (resultadoSesion.rows.length === 0) {
    return null;
  }

  const sesion = resultadoSesion.rows[0];

  // Buscar la configuración validada más reciente de esa sesión
  const resultadoConfig = await ejecutarQuery(
    `SELECT
       ac.configuracion,
       ac.precio_total_usd,
       ac.created_at
     FROM asistente_configuraciones ac
     WHERE ac.sesion_id = $1
       AND ac.validada = true
     ORDER BY ac.created_at DESC
     LIMIT 1`,
    [sesion.sesion_id]
  );

  const configuracion_reciente = resultadoConfig.rows.length > 0
    ? {
        configuracion:   resultadoConfig.rows[0].configuracion,
        precio_total_usd: resultadoConfig.rows[0].precio_total_usd,
        fecha:           resultadoConfig.rows[0].created_at
      }
    : null;

  // Req 5.2, 5.3, 5.4, 5.5: retornar perfil, presupuesto y configuración más reciente
  return {
    perfil_usuario:      sesion.perfil_usuario,
    presupuesto_pen:     sesion.presupuesto_pen ? parseFloat(sesion.presupuesto_pen) : null,
    configuracion_reciente,
    sesion_id_previa:    sesion.sesion_id
  };
}

// ─── Exportaciones ────────────────────────────────────────────────────────────

module.exports = { obtenerPerfilPrevio };
