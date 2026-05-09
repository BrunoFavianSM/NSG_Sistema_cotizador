/**
 * Controlador del Asistente IA
 * Orquesta los 5 endpoints: nuevaSesion, procesarMensaje,
 * validarConfiguracion, obtenerHistorial, obtenerSesion.
 */

const servicioSesion = require('./servicioSesion');
const servicioCuestionario = require('./servicioCuestionario');
const sistemaPrompt = require('./sistemaPrompt');
const servicioLLM = require('./servicioLLM');
const servicioSemaforo = require('./servicioSemaforo');
const servicioCompatibilidad = require('../servicios/servicioCompatibilidad');
const orquestadorAgentes = require('./orquestadorAgentes');
const { sanitizarInput } = require('../utilidades/sanitizacion');
const { ejecutarQuery } = require('../configuracion/baseDatos');

const PIPELINE_ENABLED = process.env.AGENT_PIPELINE_ENABLED !== 'false';

// ── 1. POST /nueva-sesion ──

async function nuevaSesion(req, res) {
  try {
    const { usuario_id } = req.body || {};
    const { sesion_id, perfil_previo } = await servicioSesion.crearSesion(usuario_id || null);

    return res.status(201).json({
      exito: true,
      sesion_id,
      perfil_previo,
    });
  } catch (error) {
    console.error('[Asistente] Error en nuevaSesion:', error.message);
    return res.status(500).json({ exito: false, mensaje: 'Error interno. Intenta de nuevo.' });
  }
}

// ── 2. POST /mensaje (MAIN ORCHESTRATOR) ──

async function procesarMensaje(req, res) {
  try {
    const { sesion_id, mensaje, usuario_id } = req.body || {};

    // Validación de entrada
    if (!sesion_id) {
      return res.status(400).json({ exito: false, mensaje: 'sesion_id es requerido' });
    }
    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      return res.status(400).json({ exito: false, mensaje: 'Mensaje vacío' });
    }

    // Sanitizar input
    const mensajeSanitizado = sanitizarInput(mensaje);
    if (!mensajeSanitizado) {
      return res.status(400).json({ exito: false, mensaje: 'Mensaje vacío después de sanitizar' });
    }

    // Verificar que la sesión existe ANTES de guardar el mensaje
    const sesionCheck = await ejecutarQuery(
      'SELECT sesion_id FROM asistente_sesiones WHERE sesion_id = $1',
      [sesion_id]
    );
    if (sesionCheck.rows.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'Sesión no encontrada' });
    }

    // Guardar mensaje del usuario
    await servicioSesion.guardarMensaje(sesion_id, 'user', mensajeSanitizado);

    // Obtener historial (últimos 8 mensajes)
    const historial = await servicioSesion.obtenerHistorialMensajes(sesion_id, 8);

    // Obtener parámetros financieros
    const { margen, igv, tipoCambio } = await servicioSesion.obtenerParametrosFinancieros();

    // Obtener catálogo de productos
    const productos = await servicioSesion.obtenerProductosDisponibles();

    // Construir estado del cuestionario
    const cuestionario = servicioCuestionario.construirEstadoCuestionario(historial);

    // Construir contexto de conversación
    const contextoConversacion = servicioCuestionario.construirContextoConversacion(cuestionario, historial);

    // Construir system prompt
    const systemPrompt = sistemaPrompt.construirSystemPrompt({
      productos,
      tipoCambio,
      margen,
      igv,
      contextoConversacion,
    });

        // Intentar pipeline multi-agente (Clasificador → Buscador → Reranker) primero
    let respuestaLLM;
    let modoPipeline = false;

    if (PIPELINE_ENABLED) {
      try {
        respuestaLLM = await orquestadorAgentes.ejecutarPipeline({
          mensaje: mensajeSanitizado,
          historial,
          productos,
          tipoCambio,
          margen,
          igv,
          contextoConversacion,
          cuestionario,
          ejecutarQuery,
        });
        modoPipeline = true;
        console.info('[Asistente] Pipeline multi-agente completado exitosamente');
      } catch (errorPipeline) {
        console.warn('[Asistente] Pipeline multi-agente fallo, usando LLM legacy:', errorPipeline.message);
      }
    }

    // Fallback al LLM legacy (Gemini → NVIDIA) si el pipeline no esta habilitado o fallo
    if (!modoPipeline) {
      try {
        respuestaLLM = await servicioLLM.generarRespuesta({
          systemPrompt,
          historial,
          mensajeActual: mensajeSanitizado,
        });
      } catch (errorLLM) {
        const status = errorLLM.tipo === 'rate_limit' ? 502 : 502;
        const msg =
          errorLLM.tipo === 'rate_limit'
            ? 'El servicio de IA esta saturado. Intenta en un momento.'
            : errorLLM.tipo === 'invalid_json'
              ? 'No se pudo procesar la respuesta. Intenta de nuevo.'
              : 'El servicio de IA no esta disponible temporalmente.';
        return res.status(status).json({ exito: false, mensaje: msg });
      }
    }
    // Validar campos requeridos del LLM response
    respuestaLLM.respuesta = respuestaLLM.respuesta || '';
  if (!respuestaLLM.respuesta.trim()) {
    respuestaLLM.respuesta = 'No pude generar una respuesta. Intenta de nuevo o consulta con un asesor.';
  }
    respuestaLLM.quick_replies = Array.isArray(respuestaLLM.quick_replies) ? respuestaLLM.quick_replies : [];
    respuestaLLM.configuracion_propuesta = respuestaLLM.configuracion_propuesta || null;
    respuestaLLM.perfil_usuario = respuestaLLM.perfil_usuario || null;
    respuestaLLM.requiere_asesor = respuestaLLM.requiere_asesor || false;

    let semaforo = null;
    let validacion = null;
    let configuracionGuardada = null;

    // Si el LLM propuso una configuración → Double-Check
    if (respuestaLLM.configuracion_propuesta && typeof respuestaLLM.configuracion_propuesta === 'object') {
      const configRaw = respuestaLLM.configuracion_propuesta;

      // Double-Check con servicioCompatibilidad
      try {
        validacion = await servicioCompatibilidad.validarConfiguracionConBD(configRaw, ejecutarQuery);
      } catch (errorCompat) {
        console.error('[Asistente] Error en Double-Check:', errorCompat.message);
        validacion = { compatible: false, errores: ['Error al validar compatibilidad'], advertencias: [] };
      }

      // Siempre devolver la config (con warnings si no es compatible — decisión de usuario)
      const esValida = validacion && validacion.compatible;
      configuracionGuardada = await servicioSesion.guardarConfiguracion(
        sesion_id,
        configRaw,
        esValida,
        1
      );

      // Enriquecer con precios en PEN
      respuestaLLM.configuracion_propuesta = enriquecerPreciosPEN(
        configRaw,
        productos,
        margen,
        igv,
        tipoCambio
      );

      // Calcular semáforo (necesitamos los componentes normalizados con specs)
      try {
        const mapa = await servicioCompatibilidad.obtenerMapaComponentesDesdeBD(configRaw, ejecutarQuery);
        const normalizados = {
          procesador: servicioCompatibilidad.convertirComponenteBD(configRaw.procesador, mapa),
          placa_madre: servicioCompatibilidad.convertirComponenteBD(configRaw.placa_madre, mapa),
          ram: (configRaw.ram || []).map((r) => servicioCompatibilidad.convertirComponenteBD(r, mapa)).filter(Boolean),
          almacenamiento: Array.isArray(configRaw.almacenamiento)
            ? configRaw.almacenamiento.map((a) => servicioCompatibilidad.convertirComponenteBD(a, mapa)).filter(Boolean)
            : servicioCompatibilidad.convertirComponenteBD(configRaw.almacenamiento, mapa),
          gpu: servicioCompatibilidad.convertirComponenteBD(configRaw.gpu, mapa),
          fuente: servicioCompatibilidad.convertirComponenteBD(configRaw.fuente, mapa),
          case: servicioCompatibilidad.convertirComponenteBD(configRaw.case, mapa),
        };

        // Agregar specs al mapa para el semáforo
        const mapaConSpecs = new Map(mapa);
        semaforo = servicioSemaforo.calcularSemaforo(normalizados);
      } catch (errorSemaforo) {
        console.error('[Asistente] Error calculando semáforo:', errorSemaforo.message);
      }

      // Incluir advertencias de validación en la respuesta
      if (validacion && !validacion.compatible) {
        respuestaLLM.configuracion_propuesta.validacion = {
          compatible: false,
          errores: validacion.errores,
          advertencias: validacion.advertencias,
        };
      }
    }

    // Actualizar estado de sesión
    try {
      const nuevoEstado = cuestionario.completo
        ? 'listo_para_cotizar'
        : 'cuestionario';
      const perfilParaGuardar = respuestaLLM.perfil_usuario || cuestionario.uso || null;
      const presupuesto = cuestionario.presupuestoPen || null;

      await servicioSesion.actualizarEstadoSesion(sesion_id, nuevoEstado, perfilParaGuardar, presupuesto);
    } catch (errorSesion) {
      console.error('[Asistente] Error actualizando sesión:', errorSesion.message);
    }

    // Guardar mensaje del asistente
    const metadataAsistente = {
      quick_replies: respuestaLLM.quick_replies,
      perfil_usuario: respuestaLLM.perfil_usuario,
      requiere_asesor: respuestaLLM.requiere_asesor,
    };
    if (semaforo) metadataAsistente.semaforo = semaforo;
    if (configuracionGuardada) metadataAsistente.configuracion_id = configuracionGuardada.id;

    await servicioSesion.guardarMensaje(sesion_id, 'assistant', respuestaLLM.respuesta, metadataAsistente);

    // Construir respuesta al frontend
    const respuesta = {
      exito: true,
      respuesta: respuestaLLM.respuesta,
      quick_replies: respuestaLLM.quick_replies,
      perfil_usuario: respuestaLLM.perfil_usuario,
      requiere_asesor: respuestaLLM.requiere_asesor,
      configuracion_propuesta: respuestaLLM.configuracion_propuesta,
      semaforo,
    };

    return res.json(respuesta);
  } catch (error) {
    console.error('[Asistente] Error no manejado en procesarMensaje:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno. Intenta de nuevo.' });
  }
}

// ── 3. POST /validar-configuracion ──

async function validarConfiguracion(req, res) {
  try {
    const { producto_ids } = req.body || {};

    if (!producto_ids || typeof producto_ids !== 'object') {
      return res.status(400).json({ valida: false, errores: ['producto_ids es requerido'] });
    }

    // Construir objeto de componentes con IDs
    const componentes = {
      procesador: producto_ids.procesador ? { id: producto_ids.procesador } : null,
      placa_madre: producto_ids.placa_madre ? { id: producto_ids.placa_madre } : null,
      ram: (producto_ids.ram || []).map((id) => ({ id })),
      almacenamiento: producto_ids.almacenamiento ? { id: producto_ids.almacenamiento } : null,
      gpu: producto_ids.gpu ? { id: producto_ids.gpu } : null,
      fuente: producto_ids.fuente ? { id: producto_ids.fuente } : null,
      case: producto_ids.case ? { id: producto_ids.case } : null,
    };

    const resultado = await servicioCompatibilidad.validarConfiguracionConBD(componentes, ejecutarQuery);

    return res.json({
      valida: resultado.compatible,
      errores: resultado.errores,
      advertencias: resultado.advertencias,
    });
  } catch (error) {
    console.error('[Asistente] Error en validarConfiguracion:', error.message);
    return res.status(500).json({ valida: false, errores: ['Error interno al validar'] });
  }
}

// ── 4. GET /historial/:usuario_id ──

async function obtenerHistorial(req, res) {
  try {
    const usuario_id = req.params.usuario_id;
    if (!usuario_id) {
      return res.status(400).json({ exito: false, mensaje: 'usuario_id es requerido' });
    }

    const sesiones = await servicioSesion.obtenerSesionesUsuario(Number(usuario_id));
    return res.json({ exito: true, sesiones });
  } catch (error) {
    console.error('[Asistente] Error en obtenerHistorial:', error.message);
    return res.status(500).json({ exito: false, mensaje: 'Error interno. Intenta de nuevo.' });
  }
}

// ── 5. GET /sesion/:sesion_id ──

async function obtenerSesion(req, res) {
  try {
    const sesion_id = req.params.sesion_id;
    if (!sesion_id) {
      return res.status(400).json({ exito: false, mensaje: 'sesion_id es requerido' });
    }

    const mensajes = await servicioSesion.obtenerHistorialMensajes(sesion_id, 100);
    return res.json({ exito: true, mensajes });
  } catch (error) {
    console.error('[Asistente] Error en obtenerSesion:', error.message);
    return res.status(500).json({ exito: false, mensaje: 'Error interno. Intenta de nuevo.' });
  }
}

// ── Utilidad: Enriquecer precios PEN ──

function enriquecerPreciosPEN(config, productos, margen, igv, tipoCambio) {
  const productosMap = new Map(productos.map((p) => [p.id, p]));
  const factor = (1 + margen / 100) * (1 + igv / 100) * tipoCambio;

  const enriquecerComponente = (comp) => {
    if (!comp || !comp.id) return comp;
    const producto = productosMap.get(Number(comp.id));
    if (!producto) return comp;
    return {
      ...comp,
      nombre: producto.nombre,
      precio_usd: producto.precio_usd,
      precio_pen: Math.round(producto.precio_usd * factor * 100) / 100,
    };
  };

  const enriquecido = {
    procesador: enriquecerComponente(config.procesador),
    placa_madre: enriquecerComponente(config.placa_madre),
    ram: (config.ram || []).map(enriquecerComponente),
    almacenamiento: enriquecerComponente(config.almacenamiento),
    gpu: enriquecerComponente(config.gpu),
    fuente: enriquecerComponente(config.fuente),
    case: enriquecerComponente(config.case),
  };

  // Calcular precio total
  let precioTotalUsd = 0;
  const sumar = (comp) => {
    if (comp && comp.precio_usd) precioTotalUsd += comp.precio_usd;
  };

  sumar(enriquecido.procesador);
  sumar(enriquecido.placa_madre);
  (enriquecido.ram || []).forEach(sumar);
  sumar(enriquecido.almacenamiento);
  sumar(enriquecido.gpu);
  sumar(enriquecido.fuente);
  sumar(enriquecido.case);

  enriquecido.precio_total_usd = Math.round(precioTotalUsd * 100) / 100;
  enriquecido.precio_total_pen = Math.round(precioTotalUsd * factor * 100) / 100;

  return enriquecido;
}

module.exports = {
  nuevaSesion,
  procesarMensaje,
  validarConfiguracion,
  obtenerHistorial,
  obtenerSesion,
};
