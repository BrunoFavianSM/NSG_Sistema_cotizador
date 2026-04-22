/**
 * servicioValidacionAsistente.js
 * Adaptador de validación de compatibilidad para el Asistente IA NSG Concierge v2.
 *
 * Responsabilidades:
 *  - Recibir una configuracion_propuesta del LLM (objetos con campo `id`).
 *  - Delegar la validación real a servicioCompatibilidad.validarConfiguracionConBD,
 *    que consulta la BD para obtener specs actualizadas de cada componente.
 *  - Retornar { valida, errores, advertencias } (interfaz uniforme para el loop Double-Check).
 *
 * Validaciones cubiertas (Requisitos 3.2 – 3.5):
 *  - Socket del procesador vs placa madre                    (Req 3.2)
 *  - Tipo de RAM (DDR4/DDR5) vs placa madre                  (Req 3.3)
 *  - Form factor de la placa madre vs case                   (Req 3.4)
 *  - Wattage de la fuente >= consumo estimado de la config   (Req 3.5)
 *
 * Nota: la lógica de validación vive en servicioCompatibilidad.js (fuente de verdad).
 * Este servicio solo adapta la interfaz para el controlador del asistente.
 */

'use strict';

const servicioCompatibilidad = require('./servicioCompatibilidad');
const { ejecutarQuery }       = require('../configuracion/baseDatos');

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Valida la compatibilidad de una configuración propuesta por el LLM.
 *
 * La configuración puede llegar en dos formatos:
 *   a) Con objetos completos: { procesador: { id, nombre, precio_usd, ... }, ... }
 *   b) Con solo IDs:          { procesador: { id: 12 }, placa_madre: { id: 34 }, ... }
 *
 * En ambos casos se consulta la BD para obtener las specs técnicas actualizadas.
 *
 * @param {object} configuracion - Configuración propuesta por el LLM.
 * @param {object} [configuracion.procesador]
 * @param {object} [configuracion.placa_madre]
 * @param {Array}  [configuracion.ram]
 * @param {object} [configuracion.almacenamiento]
 * @param {object} [configuracion.gpu]
 * @param {object} [configuracion.fuente]
 * @param {object} [configuracion.case]
 *
 * @returns {Promise<{ valida: boolean, errores: string[], advertencias: string[] }>}
 */
async function validar(configuracion) {
  if (!configuracion || typeof configuracion !== 'object') {
    return {
      valida:       false,
      errores:      ['Configuración inválida: se esperaba un objeto con los componentes.'],
      advertencias: []
    };
  }

  // Normalizar ram a array si viene como objeto único
  const configNormalizada = {
    ...configuracion,
    ram: Array.isArray(configuracion.ram)
      ? configuracion.ram
      : (configuracion.ram ? [configuracion.ram] : [])
  };

  // Delegar a servicioCompatibilidad con acceso a BD para specs actualizadas
  const resultado = await servicioCompatibilidad.validarConfiguracionConBD(
    configNormalizada,
    ejecutarQuery
  );

  // Adaptar la interfaz: servicioCompatibilidad retorna `compatible`, nosotros retornamos `valida`
  return {
    valida:       resultado.compatible,
    errores:      resultado.errores      || [],
    advertencias: resultado.advertencias || []
  };
}

// ─── Exportaciones ────────────────────────────────────────────────────────────

module.exports = { validar };
