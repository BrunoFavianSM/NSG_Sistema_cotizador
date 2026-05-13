const { ejecutarQuery } = require('../configuracion/baseDatos');
const { CLAVES } = require('../asistente/servicioConfigIA');
const { encriptar, desencriptar } = require('../utilidades/encriptacion');

function parseMargen(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;
  if (numero < 0 || numero > 100) return null;
  return numero;
}

function parsePorcentaje(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;
  if (numero < 0 || numero > 100) return null;
  return numero;
}

function parseTipoCambio(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;
  if (numero <= 0) return null;
  return numero;
}

async function obtenerMapaConfiguracion() {
  const resultado = await ejecutarQuery(
    "SELECT clave, valor, updated_at FROM configuracion WHERE clave IN ('margen_ganancia', 'margen_ganancia_default', 'tasa_igv', 'tipo_cambio_usd_pen', 'modo_tipo_cambio')",
    []
  );

  return resultado.rows.reduce((acc, row) => {
    acc[row.clave] = row;
    return acc;
  }, {});
}

async function guardarConfiguracion(clave, valor, descripcion) {
  const actualizado = await ejecutarQuery(
    `UPDATE configuracion
     SET valor = $1
     WHERE clave = $2
     RETURNING clave, valor, updated_at`,
    [String(valor), clave]
  );

  if (actualizado.rows.length > 0) {
    return actualizado.rows[0];
  }

  const insertado = await ejecutarQuery(
    `INSERT INTO configuracion (clave, valor, descripcion)
     VALUES ($1, $2, $3)
     RETURNING clave, valor, updated_at`,
    [clave, String(valor), descripcion]
  );

  return insertado.rows[0];
}

function construirPayloadConfiguracion(mapa) {
  const margenPorDefecto = parseMargen(mapa.margen_ganancia_default?.valor ?? mapa.margen_ganancia?.valor);
  const tasaIgv = parsePorcentaje(mapa.tasa_igv?.valor);
  const tipoCambio = parseTipoCambio(mapa.tipo_cambio_usd_pen?.valor);

  // Validar que el modo almacenado sea uno de los valores permitidos
  const modoRaw = mapa.modo_tipo_cambio?.valor;
  const modoCambio = (modoRaw === 'manual' || modoRaw === 'automatico') ? modoRaw : 'manual';

  const updatedAt = [
    mapa.margen_ganancia_default?.updated_at,
    mapa.margen_ganancia?.updated_at,
    mapa.tasa_igv?.updated_at,
    mapa.tipo_cambio_usd_pen?.updated_at
  ].find(Boolean);

  return {
    exito: true,
    margen_ganancia: margenPorDefecto ?? 20,
    margen_ganancia_default: margenPorDefecto ?? 20,
    tasa_igv: tasaIgv ?? 18,
    tipo_cambio_usd_pen: tipoCambio ?? 3.75,
    modo_tipo_cambio: modoCambio,
    updated_at: updatedAt ?? null
  };
}

async function obtenerMargen(req, res) {
  try {
    const mapaConfiguracion = await obtenerMapaConfiguracion();
    return res.json(construirPayloadConfiguracion(mapaConfiguracion));
  } catch (error) {
    console.error('Error al obtener margen:', error);
    return res.status(500).json({
      error: 'Error interno',
      mensaje: 'No se pudo obtener la configuracion de margen'
    });
  }
}

async function actualizarMargen(req, res) {
  try {
    const nuevoMargen = parseMargen(
      req.body?.margen_ganancia_default ?? req.body?.margen_ganancia
    );
    const nuevaTasaIgv = req.body?.tasa_igv === undefined
      ? undefined
      : parsePorcentaje(req.body?.tasa_igv);
    const nuevoTipoCambio = req.body?.tipo_cambio_usd_pen === undefined
      ? undefined
      : parseTipoCambio(req.body?.tipo_cambio_usd_pen);

    if (nuevoMargen === null || (req.body?.tasa_igv !== undefined && nuevaTasaIgv === null) || (req.body?.tipo_cambio_usd_pen !== undefined && nuevoTipoCambio === null)) {
      return res.status(400).json({
        error: 'Dato invalido',
        mensaje: 'margen_ganancia_default/tasa_igv deben estar entre 0 y 100 y tipo_cambio_usd_pen debe ser mayor a 0'
      });
    }

    await guardarConfiguracion('margen_ganancia_default', nuevoMargen, 'Porcentaje de margen por defecto para cotizaciones');
    await guardarConfiguracion('margen_ganancia', nuevoMargen, 'Compatibilidad con clientes legacy');

    if (nuevaTasaIgv !== undefined) {
      await guardarConfiguracion('tasa_igv', nuevaTasaIgv, 'Porcentaje de IGV aplicado al precio neto');
    }

    if (nuevoTipoCambio !== undefined) {
      await guardarConfiguracion('tipo_cambio_usd_pen', nuevoTipoCambio, 'Tipo de cambio referencial USD a PEN');
    }

    const mapaConfiguracion = await obtenerMapaConfiguracion();
    const payload = construirPayloadConfiguracion(mapaConfiguracion);
    return res.json({
      mensaje: 'Margen actualizado correctamente',
      ...payload
    });
  } catch (error) {
    console.error('Error al actualizar margen:', error);
    return res.status(500).json({
      error: 'Error interno',
      mensaje: 'No se pudo actualizar la configuracion de margen'
    });
  }
}

/**
 * PUT /configuracion/tipo-cambio
 * Actualiza el modo de obtención del tipo de cambio USD/PEN.
 * Body: { modo: "manual" | "automatico" }
 * Requiere: verificarToken
 */
async function actualizarModoTipoCambio(req, res) {
  try {
    const { modo } = req.body ?? {};

    if (modo !== 'manual' && modo !== 'automatico') {
      return res.status(400).json({
        error: 'Dato inválido',
        mensaje: "El modo debe ser 'manual' o 'automatico'"
      });
    }

    await guardarConfiguracion(
      'modo_tipo_cambio',
      modo,
      'Modo de obtención del tipo de cambio USD/PEN: manual o automatico'
    );

    return res.json({
      exito: true,
      modo_tipo_cambio: modo,
      mensaje: 'Modo de tipo de cambio actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar modo de tipo de cambio:', error);
    return res.status(500).json({
      error: 'Error interno',
      mensaje: 'No se pudo actualizar el modo de tipo de cambio'
    });
  }
}

// ── Configuración de modelos IA ──

const MODOS_VALIDOS = ['pipeline', 'nvidia', 'gemini'];

// Modelos requeridos según el modo activo
const MODELOS_REQUERIDOS_POR_MODO = {
  pipeline: ['nvidia_classifier_model', 'nvidia_embedding_model', 'nvidia_reranker_model'],
  nvidia:   ['nvidia_model'],
  gemini:   ['gemini_model'],
};

// Defaults desde .env para fallback en lectura
const DEFAULTS_IA = {
  modo_activo:             process.env.AGENT_PIPELINE_ENABLED !== 'false' ? 'pipeline' : 'gemini',
  gemini_model:            process.env.GEMINI_MODEL             || 'gemini-2.5-flash',
  nvidia_model:            process.env.NVIDIA_MODEL             || 'mistralai/mistral-small-4-119b-2603',
  nvidia_classifier_model: process.env.NVIDIA_CLASSIFIER_MODEL  || 'meta/llama-3.2-3b-instruct',
  nvidia_embedding_model:  process.env.NVIDIA_EMBEDDING_MODEL   || 'nvidia/nv-embed-v1',
  nvidia_reranker_model:   process.env.NVIDIA_RERANKER_MODEL    || 'nvidia/rerank-qa-mistral-4b',
};

/**
 * GET /api/configuracion/modelos-ia
 * Retorna la configuración actual de modo y modelos de IA.
 * Requiere: verificarTokenAdmin
 */
async function obtenerModelosIA(req, res) {
  try {
    const { rows } = await ejecutarQuery(
      `SELECT clave, valor FROM configuracion WHERE clave = ANY($1)`,
      [Object.values(CLAVES)]
    );

    const mapa = Object.fromEntries(rows.map((r) => [r.clave, r.valor]));

    return res.json({
      exito: true,
      modo_activo:             mapa[CLAVES.MODO_ACTIVO]             || DEFAULTS_IA.modo_activo,
      gemini_model:            mapa[CLAVES.GEMINI_MODEL]            || DEFAULTS_IA.gemini_model,
      nvidia_model:            mapa[CLAVES.NVIDIA_MODEL]            || DEFAULTS_IA.nvidia_model,
      nvidia_classifier_model: mapa[CLAVES.NVIDIA_CLASSIFIER_MODEL] || DEFAULTS_IA.nvidia_classifier_model,
      nvidia_embedding_model:  mapa[CLAVES.NVIDIA_EMBEDDING_MODEL]  || DEFAULTS_IA.nvidia_embedding_model,
      nvidia_reranker_model:   mapa[CLAVES.NVIDIA_RERANKER_MODEL]   || DEFAULTS_IA.nvidia_reranker_model,
    });
  } catch (error) {
    console.error('[ConfigIA] Error al obtener modelos IA:', error);
    return res.status(500).json({
      error: 'Error interno',
      mensaje: 'No se pudo obtener la configuración de modelos de IA',
    });
  }
}

/**
 * PUT /api/configuracion/modelos-ia
 * Actualiza el modo activo y los modelos de IA.
 * Requiere: verificarTokenAdmin
 *
 * Validaciones:
 * - modo_activo ∈ ['pipeline', 'nvidia', 'gemini'] → 400 MODO_INVALIDO
 * - modelos requeridos por modo no vacíos → 400 MODELO_INVALIDO
 */
async function actualizarModelosIA(req, res) {
  try {
    const {
      modo_activo,
      gemini_model,
      nvidia_model,
      nvidia_classifier_model,
      nvidia_embedding_model,
      nvidia_reranker_model,
    } = req.body || {};

    // Validar modo_activo
    if (!modo_activo || !MODOS_VALIDOS.includes(modo_activo)) {
      return res.status(400).json({
        error: 'Dato inválido',
        codigo: 'MODO_INVALIDO',
        mensaje: `El modo debe ser uno de: ${MODOS_VALIDOS.join(', ')}`,
      });
    }

    // Construir mapa de valores recibidos para validar modelos requeridos
    const valoresRecibidos = {
      gemini_model,
      nvidia_model,
      nvidia_classifier_model,
      nvidia_embedding_model,
      nvidia_reranker_model,
    };

    // Validar que los modelos requeridos por el modo no estén vacíos
    const camposRequeridos = MODELOS_REQUERIDOS_POR_MODO[modo_activo];
    for (const campo of camposRequeridos) {
      const valor = valoresRecibidos[campo];
      if (!valor || typeof valor !== 'string' || valor.trim() === '') {
        return res.status(400).json({
          error: 'Dato inválido',
          codigo: 'MODELO_INVALIDO',
          mensaje: `El campo '${campo}' es requerido para el modo '${modo_activo}'`,
          campo,
        });
      }
    }

    // Mapa de campo → clave BD
    const mapaClaveBD = {
      modo_activo:             CLAVES.MODO_ACTIVO,
      gemini_model:            CLAVES.GEMINI_MODEL,
      nvidia_model:            CLAVES.NVIDIA_MODEL,
      nvidia_classifier_model: CLAVES.NVIDIA_CLASSIFIER_MODEL,
      nvidia_embedding_model:  CLAVES.NVIDIA_EMBEDDING_MODEL,
      nvidia_reranker_model:   CLAVES.NVIDIA_RERANKER_MODEL,
    };

    // Guardar todas las claves con INSERT ... ON CONFLICT DO UPDATE
    const entradas = [
      ['modo_activo', modo_activo],
      ['gemini_model', gemini_model],
      ['nvidia_model', nvidia_model],
      ['nvidia_classifier_model', nvidia_classifier_model],
      ['nvidia_embedding_model', nvidia_embedding_model],
      ['nvidia_reranker_model', nvidia_reranker_model],
    ];

    for (const [campo, valor] of entradas) {
      if (valor !== undefined && valor !== null) {
        await ejecutarQuery(
          `INSERT INTO configuracion (clave, valor)
           VALUES ($1, $2)
           ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
          [mapaClaveBD[campo], String(valor).trim()]
        );
      }
    }

    // Retornar config guardada
    const { rows } = await ejecutarQuery(
      `SELECT clave, valor FROM configuracion WHERE clave = ANY($1)`,
      [Object.values(CLAVES)]
    );
    const mapa = Object.fromEntries(rows.map((r) => [r.clave, r.valor]));

    return res.json({
      exito: true,
      mensaje: 'Configuración de IA actualizada correctamente',
      modo_activo:             mapa[CLAVES.MODO_ACTIVO]             || DEFAULTS_IA.modo_activo,
      gemini_model:            mapa[CLAVES.GEMINI_MODEL]            || DEFAULTS_IA.gemini_model,
      nvidia_model:            mapa[CLAVES.NVIDIA_MODEL]            || DEFAULTS_IA.nvidia_model,
      nvidia_classifier_model: mapa[CLAVES.NVIDIA_CLASSIFIER_MODEL] || DEFAULTS_IA.nvidia_classifier_model,
      nvidia_embedding_model:  mapa[CLAVES.NVIDIA_EMBEDDING_MODEL]  || DEFAULTS_IA.nvidia_embedding_model,
      nvidia_reranker_model:   mapa[CLAVES.NVIDIA_RERANKER_MODEL]   || DEFAULTS_IA.nvidia_reranker_model,
    });
  } catch (error) {
    console.error('[ConfigIA] Error al actualizar modelos IA:', error);
    return res.status(500).json({
      error: 'Error interno',
      mensaje: 'No se pudo actualizar la configuración de modelos de IA',
    });
  }
}

/**
 * GET /api/configuracion/api-keys-ia
 * Retorna si las claves API de IA están configuradas, sin revelar sus valores.
 * Requiere: verificarTokenAdmin
 */
async function obtenerApiKeysIA(req, res) {
  try {
    const { rows } = await ejecutarQuery(
      `SELECT clave, valor FROM configuracion WHERE clave = ANY($1)`,
      [[CLAVES.GEMINI_API_KEY_ENC, CLAVES.NVIDIA_API_KEY_ENC]]
    );

    const mapa = Object.fromEntries(rows.map((r) => [r.clave, r.valor]));

    return res.json({
      exito: true,
      gemini_configurada: !!(mapa[CLAVES.GEMINI_API_KEY_ENC]),
      nvidia_configurada: !!(mapa[CLAVES.NVIDIA_API_KEY_ENC]),
    });
  } catch (error) {
    console.error('[ConfigIA] Error al obtener estado de API keys:', error);
    return res.status(500).json({
      error: 'Error interno',
      mensaje: 'No se pudo obtener el estado de las claves API de IA',
    });
  }
}

/**
 * PUT /api/configuracion/api-keys-ia
 * Encripta y almacena las claves API de IA en la tabla configuracion.
 * Solo actualiza las claves que vienen en el body (no vacías).
 * Requiere: verificarTokenAdmin
 *
 * Body: { gemini_api_key?: string, nvidia_api_key?: string }
 * Respuesta: { exito: true }
 */
async function actualizarApiKeysIA(req, res) {
  try {
    const { gemini_api_key, nvidia_api_key } = req.body || {};

    const geminiValida = gemini_api_key && typeof gemini_api_key === 'string' && gemini_api_key.trim() !== '';
    const nvidiaValida = nvidia_api_key && typeof nvidia_api_key === 'string' && nvidia_api_key.trim() !== '';

    // Validar que al menos una clave viene en el body
    const geminiEnviada = 'gemini_api_key' in (req.body || {});
    const nvidiaEnviada = 'nvidia_api_key' in (req.body || {});

    if (!geminiEnviada && !nvidiaEnviada) {
      return res.status(400).json({
        error: 'Dato inválido',
        codigo: 'API_KEY_INVALIDA',
        mensaje: 'Debe enviar al menos una clave API (gemini_api_key o nvidia_api_key)',
      });
    }

    // Validar que los campos enviados no estén vacíos
    if (geminiEnviada && !geminiValida) {
      return res.status(400).json({
        error: 'Dato inválido',
        codigo: 'API_KEY_INVALIDA',
        mensaje: 'El campo gemini_api_key no puede estar vacío',
        campo: 'gemini_api_key',
      });
    }

    if (nvidiaEnviada && !nvidiaValida) {
      return res.status(400).json({
        error: 'Dato inválido',
        codigo: 'API_KEY_INVALIDA',
        mensaje: 'El campo nvidia_api_key no puede estar vacío',
        campo: 'nvidia_api_key',
      });
    }

    // Encriptar y guardar cada clave presente
    if (geminiValida) {
      const encriptada = encriptar(gemini_api_key.trim());
      await ejecutarQuery(
        `INSERT INTO configuracion (clave, valor)
         VALUES ($1, $2)
         ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
        [CLAVES.GEMINI_API_KEY_ENC, encriptada]
      );
    }

    if (nvidiaValida) {
      const encriptada = encriptar(nvidia_api_key.trim());
      await ejecutarQuery(
        `INSERT INTO configuracion (clave, valor)
         VALUES ($1, $2)
         ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
        [CLAVES.NVIDIA_API_KEY_ENC, encriptada]
      );
    }

    return res.json({ exito: true });
  } catch (error) {
    console.error('[ConfigIA] Error al actualizar API keys:', error);
    return res.status(500).json({
      error: 'Error interno',
      mensaje: 'No se pudieron guardar las claves API de IA',
    });
  }
}

module.exports = {
  obtenerMargen,
  actualizarMargen,
  actualizarModoTipoCambio,
  obtenerModelosIA,
  actualizarModelosIA,
  obtenerApiKeysIA,
  actualizarApiKeysIA,
};
