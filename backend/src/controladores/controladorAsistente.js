/**
 * controladorAsistente.js
 * Orquestador principal del Asistente IA NSG Concierge v2.
 *
 * Funciones expuestas:
 *  - nuevaSesion(req, res)       — Crea una sesión nueva (anónima o autenticada).
 *  - procesarMensaje(req, res)   — Procesa un mensaje del usuario con loop Double-Check.
 *  - validarConfiguracion(req, res) — Endpoint público de validación de compatibilidad.
 *  - obtenerHistorial(req, res)  — Historial de sesiones de un usuario autenticado.
 *  - obtenerSesion(req, res)     — Mensajes de una sesión específica (acceso anónimo OK).
 *
 * Requisitos: 3.1, 3.6–3.9, 4.5, 5.1, 8.2, 11.1–11.2, 12.1, 13.6,
 *             14.1–14.5, 16.1–16.10, 18.2
 */

'use strict';

const { ejecutarQuery } = require('../configuracion/baseDatos');
const servicioLLM = require('../servicios/servicioLLM');
const servicioValidacionAsistente = require('../servicios/servicioValidacionAsistente');
const servicioSemaforo = require('../servicios/servicioSemaforo');
const servicioMemoriaPerfil = require('../servicios/servicioMemoriaPerfil');
const { construirSystemPrompt } = require('../prompts/systemPrompt');
const { construirPromptCorreccion } = require('../prompts/promptCorreccion');

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_INTENTOS_VALIDACION = parseInt(process.env.ASISTENTE_MAX_INTENTOS_VALIDACION || '3', 10);
const HISTORIAL_DIAS = parseInt(process.env.ASISTENTE_HISTORIAL_DIAS || '90', 10);

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Sanitiza un string eliminando caracteres de control y limitando longitud.
 * Previene prompt injection básico (Req 18.3).
 *
 * @param {string} texto
 * @param {number} [maxLen=2000]
 * @returns {string}
 */
function sanitizarTexto(texto, maxLen = 2000) {
  if (typeof texto !== 'string') return '';
  return texto
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // caracteres de control
    .replace(/\0/g, '')
    .trim()
    .slice(0, maxLen);
}

/**
 * Obtiene el tipo de cambio vigente desde la tabla `configuracion`.
 * Retorna un valor por defecto si la consulta falla.
 *
 * @returns {Promise<number>}
 */
async function obtenerTipoCambioVigente() {
  try {
    const resultado = await ejecutarQuery(
      `SELECT valor FROM configuracion WHERE clave = 'tipo_cambio_usd_pen' LIMIT 1`,
      []
    );
    if (resultado.rows.length > 0) {
      return parseFloat(resultado.rows[0].valor);
    }
  } catch (err) {
    console.error('[controladorAsistente] Error al obtener tipo de cambio:', err.message);
  }
  return 3.75; // fallback razonable
}

/**
 * Obtiene el catálogo de productos disponibles (con stock o a pedido).
 * Incluye specs de compatibilidad para el system prompt.
 *
 * @returns {Promise<Array<object>>}
 */
async function obtenerProductosDisponibles() {
  const resultado = await ejecutarQuery(
    `SELECT
       p.id,
       p.nombre,
       c.nombre AS nombre_categoria,
       p.precio_base AS precio_usd,
       p.stock,
       p.disponible_a_pedido
     FROM productos p
     JOIN categorias c ON c.id = p.id_categoria
     WHERE (p.stock > 0 OR p.disponible_a_pedido = true)
     ORDER BY c.nombre, p.nombre`,
    []
  );
  return resultado.rows;
}

/**
 * Obtiene el historial de mensajes de una sesión para pasarlo al LLM.
 *
 * @param {string} sesion_id - UUID de la sesión.
 * @returns {Promise<Array<{rol: string, contenido: string}>>}
 */
async function obtenerHistorialSesion(sesion_id) {
  const resultado = await ejecutarQuery(
    `SELECT rol, contenido
     FROM asistente_mensajes
     WHERE sesion_id = $1
     ORDER BY created_at ASC`,
    [sesion_id]
  );
  return resultado.rows;
}

/**
 * Guarda un mensaje en `asistente_mensajes`.
 *
 * @param {string} sesion_id
 * @param {string} rol        - 'user' | 'assistant' | 'system'
 * @param {string} contenido
 * @param {object} [metadata] - Datos adicionales (quick_replies, semaforo, etc.)
 * @returns {Promise<number>} ID del mensaje insertado.
 */
async function guardarMensaje(sesion_id, rol, contenido, metadata = {}) {
  const resultado = await ejecutarQuery(
    `INSERT INTO asistente_mensajes (sesion_id, rol, contenido, metadata)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [sesion_id, rol, contenido, JSON.stringify(metadata)]
  );
  return resultado.rows[0].id;
}

/**
 * Guarda una configuración validada en `asistente_configuraciones`.
 *
 * @param {string}  sesion_id
 * @param {object}  configuracion
 * @param {boolean} validada
 * @param {number}  intentos
 * @returns {Promise<object>} Fila insertada con id.
 */
async function guardarConfiguracion(sesion_id, configuracion, validada, intentos) {
  // Calcular precio total USD sumando todos los componentes
  const componentes = [
    configuracion.procesador,
    configuracion.placa_madre,
    configuracion.almacenamiento,
    configuracion.gpu,
    configuracion.fuente,
    configuracion.case,
    ...(Array.isArray(configuracion.ram) ? configuracion.ram : [configuracion.ram].filter(Boolean))
  ].filter(Boolean);

  const precioTotalUsd = componentes.reduce((suma, c) => suma + (parseFloat(c.precio_usd) || 0), 0);

  const resultado = await ejecutarQuery(
    `INSERT INTO asistente_configuraciones
       (sesion_id, configuracion, precio_total_usd, validada, intentos_validacion)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, sesion_id, configuracion, precio_total_usd, validada, intentos_validacion`,
    [sesion_id, JSON.stringify(configuracion), precioTotalUsd.toFixed(2), validada, intentos]
  );
  return resultado.rows[0];
}

/**
 * Enriquece una configuración con precios en PEN calculados con el tipo de cambio vigente.
 * Recalcula siempre desde precio_usd para garantizar consistencia (Req 11.3, 14.5).
 *
 * @param {object} configuracion
 * @param {number} tipoCambio
 * @returns {object} Configuración con campo `precio_pen` en cada componente y `precio_total_pen`.
 */
function enriquecerConPreciosPEN(configuracion, tipoCambio) {
  const tc = parseFloat(tipoCambio) || 3.75;

  function enriquecerComponente(comp) {
    if (!comp) return null;
    const precioUsd = parseFloat(comp.precio_usd) || 0;
    return {
      ...comp,
      precio_pen: parseFloat((precioUsd * tc).toFixed(2))
    };
  }

  const procesador = enriquecerComponente(configuracion.procesador);
  const placa_madre = enriquecerComponente(configuracion.placa_madre);
  const almacenamiento = enriquecerComponente(configuracion.almacenamiento);
  const gpu = enriquecerComponente(configuracion.gpu);
  const fuente = enriquecerComponente(configuracion.fuente);
  const caseComp = enriquecerComponente(configuracion.case);
  const ram = Array.isArray(configuracion.ram)
    ? configuracion.ram.map(enriquecerComponente)
    : [enriquecerComponente(configuracion.ram)].filter(Boolean);

  const todos = [procesador, placa_madre, almacenamiento, gpu, fuente, caseComp, ...ram].filter(Boolean);
  const precioTotalPen = parseFloat(todos.reduce((s, c) => s + (c.precio_pen || 0), 0).toFixed(2));

  return {
    ...configuracion,
    procesador,
    placa_madre,
    ram,
    almacenamiento,
    gpu,
    fuente,
    case: caseComp,
    precio_total_pen: precioTotalPen,
    validada: true
  };
}

// ─── Loop Double-Check ────────────────────────────────────────────────────────

/**
 * Ejecuta el loop de validación y autocorrección de la configuración propuesta.
 * Máximo MAX_INTENTOS_VALIDACION intentos antes de retornar null (Req 3.1, 3.6–3.9, 8.2).
 *
 * @param {object} configuracion - Configuración propuesta por el LLM.
 * @param {string} sesion_id     - UUID de la sesión activa.
 * @param {number} [intento=1]   - Número de intento actual (1-indexed).
 * @returns {Promise<object|null>} Fila de asistente_configuraciones o null si falla.
 */
async function ejecutarDoubleCheck(configuracion, sesion_id, intento = 1) {
  if (intento > MAX_INTENTOS_VALIDACION) {
    console.warn(`[controladorAsistente] Double-Check: máximo de intentos (${MAX_INTENTOS_VALIDACION}) alcanzado para sesión ${sesion_id}`);
    return null;
  }

  const resultado = await servicioValidacionAsistente.validar(configuracion);

  if (resultado.valida) {
    // Configuración compatible: persistir con validada = true
    const fila = await guardarConfiguracion(sesion_id, configuracion, true, intento);
    return { ...fila, configuracion };
  }

  // Incompatible: construir prompt de corrección y reintentar
  console.info(`[controladorAsistente] Double-Check intento ${intento}: errores detectados:`, resultado.errores);

  const promptCorreccion = construirPromptCorreccion(configuracion, resultado.errores);
  let respuestaCorregida;

  try {
    respuestaCorregida = await servicioLLM.generar({ promptCorreccion });
  } catch (err) {
    console.error(`[controladorAsistente] Double-Check intento ${intento}: error al llamar al LLM:`, err.message);
    return null;
  }

  if (!respuestaCorregida?.configuracion_propuesta) {
    console.warn(`[controladorAsistente] Double-Check intento ${intento}: LLM no retornó configuracion_propuesta`);
    return null;
  }

  return ejecutarDoubleCheck(respuestaCorregida.configuracion_propuesta, sesion_id, intento + 1);
}

// ─── Controladores públicos ───────────────────────────────────────────────────

/**
 * POST /api/asistente/nueva-sesion
 * Crea una sesión nueva (anónima o autenticada).
 * Consulta perfil previo si hay usuario_id (Req 16.8, 14.1, 5.1).
 */
async function nuevaSesion(req, res) {
  try {
    const usuario_id = req.body?.usuario_id ? parseInt(req.body.usuario_id, 10) : null;

    // Crear registro en asistente_sesiones con UUID generado por la BD
    const resultadoSesion = await ejecutarQuery(
      `INSERT INTO asistente_sesiones (usuario_id)
       VALUES ($1)
       RETURNING sesion_id`,
      [usuario_id || null]
    );

    const sesion_id = resultadoSesion.rows[0].sesion_id;

    // Consultar perfil previo si el usuario está autenticado (Req 5.1)
    let perfilPrevio = null;
    if (usuario_id) {
      perfilPrevio = await servicioMemoriaPerfil.obtenerPerfilPrevio(usuario_id);
    }

    return res.status(201).json({
      exito: true,
      sesion_id,
      perfil_previo: perfilPrevio
    });
  } catch (error) {
    console.error('[controladorAsistente] nuevaSesion error:', error);
    return res.status(500).json({
      exito: false,
      error: 'Error al crear la sesión. Por favor intenta de nuevo.'
    });
  }
}

/**
 * POST /api/asistente/mensaje
 * Procesa un mensaje del usuario: llama al LLM, ejecuta Double-Check si hay
 * configuración propuesta, calcula semáforo y retorna respuesta enriquecida.
 * (Req 16.1–16.3, 3.1, 4.5, 11.1–11.2, 12.1, 13.6)
 */
async function procesarMensaje(req, res) {
  const inicio = Date.now();

  // ── Validación y sanitización de entrada ──────────────────────────────────
  const { sesion_id, mensaje, usuario_id } = req.body || {};

  if (!sesion_id || typeof sesion_id !== 'string' || sesion_id.trim() === '') {
    return res.status(400).json({
      exito: false,
      error: 'El campo sesion_id es requerido.'
    });
  }

  const mensajeSanitizado = sanitizarTexto(mensaje);
  if (!mensajeSanitizado) {
    return res.status(400).json({
      exito: false,
      error: 'El mensaje no puede estar vacío.'
    });
  }

  // ── Verificar que la sesión existe ────────────────────────────────────────
  const resultadoSesion = await ejecutarQuery(
    `SELECT sesion_id FROM asistente_sesiones WHERE sesion_id = $1 LIMIT 1`,
    [sesion_id.trim()]
  ).catch(() => null);

  if (!resultadoSesion || resultadoSesion.rows.length === 0) {
    return res.status(404).json({
      exito: false,
      error: 'Sesión no encontrada. Por favor inicia una nueva sesión.'
    });
  }

  try {
    // ── 1. Guardar mensaje del usuario ────────────────────────────────────
    await guardarMensaje(sesion_id, 'user', mensajeSanitizado);

    // ── 2. Obtener historial y catálogo ───────────────────────────────────
    const [historial, tipoCambio] = await Promise.all([
      obtenerHistorialSesion(sesion_id),
      obtenerTipoCambioVigente()
    ]);

    let productos;
    try {
      productos = await obtenerProductosDisponibles();
    } catch (errBD) {
      // Req 13.6: BD de productos no disponible → mensaje amigable + asesor humano
      console.error('[controladorAsistente] Error al obtener productos:', errBD.message);
      const mensajeError = 'En este momento no puedo acceder al catálogo de productos. Te recomiendo hablar con uno de nuestros asesores para que te ayuden directamente.';
      await guardarMensaje(sesion_id, 'assistant', mensajeError, { error: 'bd_productos_no_disponible' });
      return res.status(200).json({
        exito: true,
        respuesta: mensajeError,
        quick_replies: ['Hablar con asesor'],
        semaforo: null,
        configuracion_propuesta: null,
        mostrar_asesor: true
      });
    }

    // ── 3. Llamar al LLM ──────────────────────────────────────────────────
    const systemPrompt = construirSystemPrompt(productos, tipoCambio);
    const respuestaLLM = await servicioLLM.generar({
      systemPrompt,
      historial,
      mensajeActual: mensajeSanitizado
    });

    // ── 4. Double-Check si hay configuración propuesta ────────────────────
    let configuracionValidada = null;
    let semaforo = null;

    if (respuestaLLM.configuracion_propuesta) {
      configuracionValidada = await ejecutarDoubleCheck(
        respuestaLLM.configuracion_propuesta,
        sesion_id
      );

      if (configuracionValidada) {
        // Req 6.1–6.3: calcular semáforo con la configuración validada
        semaforo = servicioSemaforo.calcular(configuracionValidada.configuracion || configuracionValidada);
      }
    }

    // ── 5. Enriquecer configuración con precios PEN ───────────────────────
    const configuracionEnriquecida = configuracionValidada
      ? enriquecerConPreciosPEN(
        configuracionValidada.configuracion || configuracionValidada,
        tipoCambio
      )
      : null;

    // ── 6. Guardar respuesta del asistente con metadata ───────────────────
    const tiempoRespuestaMs = Date.now() - inicio;
    await guardarMensaje(sesion_id, 'assistant', respuestaLLM.respuesta, {
      quick_replies: respuestaLLM.quick_replies || [],
      semaforo,
      configuracion_id: configuracionValidada?.id || null,
      tiempo_respuesta_ms: tiempoRespuestaMs,
      intentos_validacion: configuracionValidada?.intentos_validacion || 0
    });

    // ── 7. Retornar respuesta completa ────────────────────────────────────
    return res.status(200).json({
      exito: true,
      respuesta: respuestaLLM.respuesta,
      quick_replies: respuestaLLM.quick_replies || [],
      semaforo,
      configuracion_propuesta: configuracionEnriquecida,
      mostrar_asesor: !configuracionValidada && !!respuestaLLM.configuracion_propuesta
    });

  } catch (error) {
    console.error('[controladorAsistente] procesarMensaje error:', error);
    const mensajeError = 'Ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo o habla con un asesor.';
    try {
      await guardarMensaje(sesion_id, 'assistant', mensajeError, { error: error.message });
    } catch (_) { /* no bloquear la respuesta de error */ }

    return res.status(500).json({
      exito: false,
      error: mensajeError,
      mostrar_asesor: true
    });
  }
}

/**
 * POST /api/asistente/validar-configuracion
 * Endpoint público para ejecutar el Double-Check desde el frontend.
 * (Req 16.4–16.6)
 */
async function validarConfiguracion(req, res) {
  try {
    const { producto_ids } = req.body || {};

    if (!producto_ids || typeof producto_ids !== 'object') {
      return res.status(400).json({
        valida: false,
        errores: ['El campo producto_ids es requerido y debe ser un objeto.'],
        advertencias: []
      });
    }

    const resultado = await servicioValidacionAsistente.validar(producto_ids);

    return res.status(200).json({
      valida: resultado.valida,
      errores: resultado.errores,
      advertencias: resultado.advertencias
    });
  } catch (error) {
    console.error('[controladorAsistente] validarConfiguracion error:', error);
    return res.status(500).json({
      valida: false,
      errores: ['Error interno al validar la configuración.'],
      advertencias: []
    });
  }
}

/**
 * GET /api/asistente/historial/:usuario_id
 * Retorna sesiones y mensajes del usuario en los últimos HISTORIAL_DIAS días.
 * Requiere JWT; verifica que el usuario del token coincida con el parámetro.
 * Recalcula precios PEN con el tipo de cambio vigente (Req 16.7, 14.2, 14.4, 14.5, 18.2).
 */
async function obtenerHistorial(req, res) {
  try {
    const usuarioIdParam = parseInt(req.params.usuario_id, 10);

    // Req 18.2: el usuario autenticado solo puede ver sus propias sesiones
    if (!req.usuario || req.usuario.id !== usuarioIdParam) {
      return res.status(403).json({
        exito: false,
        error: 'No tienes permiso para ver el historial de este usuario.'
      });
    }

    const tipoCambio = await obtenerTipoCambioVigente();

    // Obtener sesiones del usuario en los últimos HISTORIAL_DIAS días
    const resultadoSesiones = await ejecutarQuery(
      `SELECT
         s.id,
         s.sesion_id,
         s.perfil_usuario,
         s.presupuesto_pen,
         s.estado,
         s.created_at,
         s.updated_at
       FROM asistente_sesiones s
       WHERE s.usuario_id = $1
         AND s.created_at >= NOW() - INTERVAL '${HISTORIAL_DIAS} days'
       ORDER BY s.created_at DESC`,
      [usuarioIdParam]
    );

    // Para cada sesión, obtener mensajes y configuración más reciente
    const sesiones = await Promise.all(
      resultadoSesiones.rows.map(async (sesion) => {
        const [resultadoMensajes, resultadoConfig] = await Promise.all([
          ejecutarQuery(
            `SELECT id, rol, contenido, metadata, created_at
             FROM asistente_mensajes
             WHERE sesion_id = $1
             ORDER BY created_at ASC`,
            [sesion.sesion_id]
          ),
          ejecutarQuery(
            `SELECT id, configuracion, precio_total_usd, validada, created_at
             FROM asistente_configuraciones
             WHERE sesion_id = $1 AND validada = true
             ORDER BY created_at DESC
             LIMIT 1`,
            [sesion.sesion_id]
          )
        ]);

        // Req 14.5: recalcular precios PEN con tipo de cambio vigente
        let configuracion_reciente = null;
        if (resultadoConfig.rows.length > 0) {
          const fila = resultadoConfig.rows[0];
          configuracion_reciente = {
            id: fila.id,
            configuracion: enriquecerConPreciosPEN(fila.configuracion, tipoCambio),
            precio_total_usd: parseFloat(fila.precio_total_usd),
            validada: fila.validada,
            created_at: fila.created_at
          };
        }

        return {
          ...sesion,
          mensajes: resultadoMensajes.rows,
          configuracion_reciente
        };
      })
    );

    return res.status(200).json({
      exito: true,
      sesiones,
      tipo_cambio_vigente: tipoCambio
    });
  } catch (error) {
    console.error('[controladorAsistente] obtenerHistorial error:', error);
    return res.status(500).json({
      exito: false,
      error: 'Error al obtener el historial. Por favor intenta de nuevo.'
    });
  }
}

/**
 * GET /api/asistente/sesion/:sesion_id
 * Retorna todos los mensajes de una sesión específica.
 * Permite acceso anónimo usando solo el sesion_id como identificador (Req 16.7, 14.3).
 */
async function obtenerSesion(req, res) {
  try {
    const { sesion_id } = req.params;

    if (!sesion_id || typeof sesion_id !== 'string') {
      return res.status(400).json({
        exito: false,
        error: 'El parámetro sesion_id es requerido.'
      });
    }

    // Verificar que la sesión existe
    const resultadoSesion = await ejecutarQuery(
      `SELECT sesion_id, perfil_usuario, presupuesto_pen, estado, created_at
       FROM asistente_sesiones
       WHERE sesion_id = $1
       LIMIT 1`,
      [sesion_id]
    );

    if (resultadoSesion.rows.length === 0) {
      return res.status(404).json({
        exito: false,
        error: 'Sesión no encontrada.'
      });
    }

    // Obtener mensajes de la sesión
    const resultadoMensajes = await ejecutarQuery(
      `SELECT id, rol, contenido, metadata, created_at
       FROM asistente_mensajes
       WHERE sesion_id = $1
       ORDER BY created_at ASC`,
      [sesion_id]
    );

    return res.status(200).json({
      exito: true,
      sesion: resultadoSesion.rows[0],
      mensajes: resultadoMensajes.rows
    });
  } catch (error) {
    console.error('[controladorAsistente] obtenerSesion error:', error);
    return res.status(500).json({
      exito: false,
      error: 'Error al obtener la sesión. Por favor intenta de nuevo.'
    });
  }
}

// ─── Exportaciones ────────────────────────────────────────────────────────────

module.exports = {
  nuevaSesion,
  procesarMensaje,
  validarConfiguracion,
  obtenerHistorial,
  obtenerSesion
};
