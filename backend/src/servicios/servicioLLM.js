/**
 * servicioLLM.js
 * Wrapper de Google Gemini para el Asistente IA NSG Concierge v2.
 *
 * Responsabilidades:
 *  - Inicializar el cliente de Gemini con credenciales de entorno.
 *  - Exponer una función `generar` agnóstica al resto del sistema.
 *  - Mapear el historial interno (rol: user/assistant) al formato Gemini (role: user/model).
 *  - Retornar siempre un objeto JSON parseado (nunca texto crudo).
 *
 * El proveedor de IA puede sustituirse sin cambios en controladorAsistente.js.
 */

'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Inicialización del cliente ───────────────────────────────────────────────

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

if (!geminiApiKey) {
  // Advertencia en arranque; el error real se lanzará al primer uso.
  console.warn('[servicioLLM] ADVERTENCIA: GEMINI_API_KEY no está definida en las variables de entorno.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey || '');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convierte el historial interno al formato que espera la API de Gemini.
 * Gemini usa role "model" para las respuestas del asistente.
 *
 * @param {Array<{rol: string, contenido: string}>} historial
 * @returns {Array<{role: string, parts: Array<{text: string}>}>}
 */
function mapearHistorial(historial = []) {
  return historial
    .filter(m => m.rol === 'user' || m.rol === 'assistant')
    .map(m => ({
      role: m.rol === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.contenido }]
    }));
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Genera una respuesta del LLM y la retorna como objeto JSON parseado.
 *
 * @param {object}   opciones
 * @param {string}  [opciones.systemPrompt]     - Instrucción de sistema (identidad, catálogo, reglas).
 * @param {Array}   [opciones.historial]         - Historial de la sesión [{rol, contenido}].
 * @param {string}  [opciones.mensajeActual]     - Mensaje nuevo del usuario.
 * @param {string}  [opciones.promptCorreccion]  - Prompt alternativo para el loop Double-Check.
 *
 * @returns {Promise<object>} Objeto JSON con la respuesta estructurada del LLM.
 * @throws  {Error}           Si la API falla o la respuesta no es JSON válido.
 */
async function generar({ systemPrompt, historial = [], mensajeActual, promptCorreccion } = {}) {
  // La instrucción de sistema puede ser el prompt principal o el de corrección.
  const instruccionSistema = systemPrompt || promptCorreccion;

  const modelo = genAI.getGenerativeModel({
    model: geminiModel,
    ...(instruccionSistema && { systemInstruction: instruccionSistema }),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500,
      topP: 0.9,
      responseMimeType: 'application/json'   // Fuerza respuesta JSON estructurada
    }
  });

  // Iniciar chat con el historial previo de la sesión
  const chat = modelo.startChat({
    history: mapearHistorial(historial)
  });

  // Enviar el mensaje actual (o cadena vacía si solo se usa promptCorreccion)
  const textoMensaje = mensajeActual || '';
  const resultado = await chat.sendMessage(textoMensaje);
  const textoRespuesta = resultado.response.text();

  // Parsear y retornar el JSON; lanzar error descriptivo si falla
  try {
    return JSON.parse(textoRespuesta);
  } catch (errorParseo) {
    throw new Error(
      `[servicioLLM] La respuesta del LLM no es JSON válido. ` +
      `Primeros 200 caracteres: ${textoRespuesta.slice(0, 200)}`
    );
  }
}

// ─── Exportaciones ────────────────────────────────────────────────────────────

module.exports = { generar };
