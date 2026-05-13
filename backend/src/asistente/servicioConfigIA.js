/**
 * Servicio de Configuración de IA
 * Lee dinámicamente el modo y modelos del asistente desde la tabla `configuracion`.
 * Permite cambiar la configuración sin reiniciar el servidor.
 * Usa valores del .env como fallback si no hay registros en BD.
 */

const { ejecutarQuery } = require('../configuracion/baseDatos');
const { desencriptar } = require('../utilidades/encriptacion');

// ── Claves en tabla configuracion ──

const CLAVES = {
  MODO_ACTIVO:              'ia_modo_activo',
  GEMINI_MODEL:             'ia_gemini_model',
  NVIDIA_MODEL:             'ia_nvidia_model',
  NVIDIA_CLASSIFIER_MODEL:  'ia_nvidia_classifier_model',
  NVIDIA_EMBEDDING_MODEL:   'ia_nvidia_embedding_model',
  NVIDIA_RERANKER_MODEL:    'ia_nvidia_reranker_model',
  GEMINI_API_KEY_ENC:       'ia_gemini_api_key_enc',
  NVIDIA_API_KEY_ENC:       'ia_nvidia_api_key_enc',
};

// ── Fallbacks desde .env ──

const DEFAULTS = {
  modo_activo:             process.env.AGENT_PIPELINE_ENABLED !== 'false' ? 'pipeline' : 'gemini',
  gemini_model:            process.env.GEMINI_MODEL             || 'gemini-2.5-flash',
  nvidia_model:            process.env.NVIDIA_MODEL             || 'mistralai/mistral-small-4-119b-2603',
  nvidia_classifier_model: process.env.NVIDIA_CLASSIFIER_MODEL  || 'meta/llama-3.2-3b-instruct',
  nvidia_embedding_model:  process.env.NVIDIA_EMBEDDING_MODEL   || 'nvidia/nv-embed-v1',
  nvidia_reranker_model:   process.env.NVIDIA_RERANKER_MODEL    || 'nvidia/rerank-qa-mistral-4b',
};

/**
 * Lee la configuración de IA desde la tabla `configuracion`.
 * Usa valores del .env como fallback si no hay registros en BD o si ocurre un error.
 * Las claves API se desencriptan en memoria y nunca se almacenan en variables globales.
 *
 * @returns {Promise<{
 *   modo_activo: string,
 *   gemini_model: string,
 *   nvidia_model: string,
 *   nvidia_classifier_model: string,
 *   nvidia_embedding_model: string,
 *   nvidia_reranker_model: string,
 *   pipeline_enabled: boolean,
 *   gemini_api_key: string,
 *   nvidia_api_key: string
 * }>}
 */
async function obtenerConfigIA() {
  try {
    const { rows } = await ejecutarQuery(
      `SELECT clave, valor FROM configuracion WHERE clave = ANY($1)`,
      [Object.values(CLAVES)]
    );

    const mapa = Object.fromEntries(rows.map((r) => [r.clave, r.valor]));

    const modoActivo = mapa[CLAVES.MODO_ACTIVO] || DEFAULTS.modo_activo;

    // Desencriptar API keys — fallback a .env si no hay registro o falla la desencriptación
    let geminiApiKey = process.env.GEMINI_API_KEY || '';
    if (mapa[CLAVES.GEMINI_API_KEY_ENC]) {
      try {
        geminiApiKey = desencriptar(mapa[CLAVES.GEMINI_API_KEY_ENC]);
      } catch (errDec) {
        console.warn('[ConfigIA] No se pudo desencriptar gemini_api_key, usando .env:', errDec.message);
      }
    }

    let nvidiaApiKey = process.env.NVIDIA_API_KEY || '';
    if (mapa[CLAVES.NVIDIA_API_KEY_ENC]) {
      try {
        nvidiaApiKey = desencriptar(mapa[CLAVES.NVIDIA_API_KEY_ENC]);
      } catch (errDec) {
        console.warn('[ConfigIA] No se pudo desencriptar nvidia_api_key, usando .env:', errDec.message);
      }
    }

    return {
      modo_activo:             modoActivo,
      gemini_model:            mapa[CLAVES.GEMINI_MODEL]            || DEFAULTS.gemini_model,
      nvidia_model:            mapa[CLAVES.NVIDIA_MODEL]            || DEFAULTS.nvidia_model,
      nvidia_classifier_model: mapa[CLAVES.NVIDIA_CLASSIFIER_MODEL] || DEFAULTS.nvidia_classifier_model,
      nvidia_embedding_model:  mapa[CLAVES.NVIDIA_EMBEDDING_MODEL]  || DEFAULTS.nvidia_embedding_model,
      nvidia_reranker_model:   mapa[CLAVES.NVIDIA_RERANKER_MODEL]   || DEFAULTS.nvidia_reranker_model,
      pipeline_enabled:        modoActivo === 'pipeline',
      gemini_api_key:          geminiApiKey,
      nvidia_api_key:          nvidiaApiKey,
    };
  } catch (error) {
    console.warn('[ConfigIA] Error leyendo BD, usando defaults del .env:', error.message);
    return {
      ...DEFAULTS,
      pipeline_enabled: DEFAULTS.modo_activo === 'pipeline',
      gemini_api_key:   process.env.GEMINI_API_KEY || '',
      nvidia_api_key:   process.env.NVIDIA_API_KEY || '',
    };
  }
}

module.exports = { obtenerConfigIA, CLAVES };
