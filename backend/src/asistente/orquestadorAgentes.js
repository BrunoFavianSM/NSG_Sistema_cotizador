/**
 * Orquestador del Pipeline Multi-Agente
 * Coordina los 3 agentes (Clasificador → Buscador → Reranker) con timeouts
 * individuales y fallbacks graceful. Si todo el pipeline falla, lanza error
 * para que el controlador caiga en el flujo Gemini → NVIDIA (legacy).
 */

const agenteClasificador = require('./agenteClasificador');
const agenteBuscador = require('./agenteBuscador');
const agenteReranker = require('./agenteReranker');
const servicioCuestionario = require('./servicioCuestionario');

const ENABLED = process.env.AGENT_PIPELINE_ENABLED !== 'false';
const TIMEOUT_TOTAL_MS = parseInt(process.env.AGENT_PIPELINE_TIMEOUT_MS || '45000', 10);
const TIMEOUT_CLASIFICADOR_MS = 5000;
const TIMEOUT_BUSCADOR_MS = 30000;
const TIMEOUT_RERANKER_MS = 5000;

// Keywords que indican el usuario quiere ver su configuración
const KEYWORDS_COTIZAR = ['ver mi configuracion', 'ver mi configuración', 'mostrar configuracion', 'mostrar configuración',
  'armar pc', 'cotizar', 'ver config', 'ver propuesta', 'mostrar propuesta', 'generar configuracion',
  'generar configuración', 'que me recomiendas', 'qué me recomiendas', 'ver la config', 'ver mi pc'];

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

// ── Utilidad: ejecutar con timeout ──

function ejecutarConTimeout(promesa, timeoutMs, nombre) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${nombre} excedió timeout de ${timeoutMs}ms`));
    }, timeoutMs);

    promesa
      .then((resultado) => {
        clearTimeout(timer);
        resolve(resultado);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// ── Generar respuesta conversacional ──

function generarRespuestaConversacional(clasificacion, configPropuesta, tipoCambio, margen, igv, cuestionarioCompleto) {
  const factor = (1 + margen / 100) * (1 + igv / 100) * tipoCambio;
  const fmt = (usd) => `S/${Math.round(usd * factor).toLocaleString('es-PE')}`;

  const uso = clasificacion.uso_principal;
  const presupuesto = clasificacion.presupuesto_pen;
  const resolucion = clasificacion.resolucion;

  const partes = [];
  const quickReplies = [];

  // ── Sin configuración → responder según qué falta ──
  if (!configPropuesta) {
    if (!uso) {
      partes.push('¡Hola! Cuéntame, ¿qué uso le darás a tu PC?');
      quickReplies.push('Gaming', 'Oficina/Estudio', 'Edición de video', 'Diseño 3D');
    } else if (!presupuesto) {
      const mapUsos = { gaming: 'gaming', edicion_video: 'edición de video', diseno_3d: 'diseño 3D', oficina: 'oficina' };
      partes.push(`Perfecto, para **${mapUsos[uso] || uso}**. ¿Cuál es tu presupuesto estimado en soles?`);
      quickReplies.push('S/ 2000-3000', 'S/ 3000-5000', 'S/ 5000-8000', 'S/ 8000+');
    } else {
      partes.push('Estoy buscando los mejores componentes para tu presupuesto...');
      quickReplies.push('Ver mi configuración', 'Cambiar presupuesto', 'Hablar con asesor');
    }
    return {
      respuesta: partes.join(' '),
      quick_replies: quickReplies.slice(0, 5),
    };
  }

  // ── Con configuración disponible ──
  if (!cuestionarioCompleto) {
    const mapUsos = { gaming: 'gaming', edicion_video: 'edición de video', diseno_3d: 'diseño 3D', oficina: 'oficina' };

    if (!resolucion && (uso === 'gaming' || uso === 'edicion_video' || uso === 'diseno_3d')) {
      partes.push(`Genial, para **${mapUsos[uso] || uso}** con **S/${presupuesto.toLocaleString('es-PE')}**.`);
      partes.push(' ¿A qué resolución piensas jugar o trabajar?');
      quickReplies.push('1080p', '1440p', '4K', 'No estoy seguro');
      quickReplies.push('Ver mi configuración');
    } else {
      partes.push(`Gracias por la información. Tengo lista una configuración para **${mapUsos[uso] || uso}**`);
      if (resolucion) partes.push(` a **${resolucion}**`);
      partes.push('. ¿Quieres que te la muestre?');
      quickReplies.push('Ver mi configuración', 'Cambiar presupuesto', 'Hablar con asesor');
    }
    return {
      respuesta: partes.join(' '),
      quick_replies: quickReplies.slice(0, 5),
    };
  }

  // ── Cuestionario completo → mostrar configuración ──
  const mapUsos = { gaming: 'gaming', edicion_video: 'edición de video', diseno_3d: 'diseño 3D', oficina: 'oficina' };
  partes.push(`Basado en tu necesidad de **${mapUsos[uso] || uso}**`);
  if (presupuesto) partes.push(`con un presupuesto de **S/${presupuesto.toLocaleString('es-PE')}**`);
  partes.push(', armé esta configuración:');

  const listar = (label, data) => {
    if (!data) return '';
    if (Array.isArray(data)) {
      return data.filter(Boolean).map((d) => `\n- **${label}**: ${d.nombre} — ${fmt(d.precio_usd || 0)}`).join('');
    }
    if (data.nombre) return `\n- **${label}**: ${data.nombre} — ${fmt(data.precio_usd || 0)}`;
    return '';
  };

  if (configPropuesta.procesador?.nombre) partes.push(listar('Procesador', configPropuesta.procesador));
  if (configPropuesta.placa_madre?.nombre) partes.push(listar('Placa madre', configPropuesta.placa_madre));
  if (configPropuesta.ram?.length > 0) {
    const r = configPropuesta.ram.filter(Boolean);
    if (r.length > 0) partes.push(`\n- **RAM**: ${r.map((x) => x.nombre).join(' + ')} — ${r.map((x) => fmt(x.precio_usd || 0)).join(' + ')}`);
  }
  if (configPropuesta.almacenamiento?.nombre) partes.push(listar('Almacenamiento', configPropuesta.almacenamiento));
  if (configPropuesta.gpu?.nombre) partes.push(listar('GPU', configPropuesta.gpu));
  if (configPropuesta.fuente?.nombre) partes.push(listar('Fuente', configPropuesta.fuente));
  if (configPropuesta.case?.nombre) partes.push(listar('Case', configPropuesta.case));

  if (configPropuesta.precio_total_pen) {
    partes.push(`\n\n**Total estimado: S/${configPropuesta.precio_total_pen.toLocaleString('es-PE')}**`);
    const pct = presupuesto ? Math.round((configPropuesta.precio_total_pen / presupuesto) * 100) : null;
    if (pct && pct >= 85 && pct <= 115) {
      partes.push(' ✅ dentro del presupuesto');
    } else if (pct && pct > 115) {
      partes.push(' ⚠️ excede ligeramente el presupuesto');
    }
  }

  quickReplies.push('Aplicar al cotizador', 'Ver otra opción', 'Cambiar presupuesto');

  return {
    respuesta: partes.join(' '),
    quick_replies: quickReplies.slice(0, 5),
  };
}

// ── Función principal: ejecutar pipeline ──

async function ejecutarPipeline({ mensaje, historial, productos, tipoCambio, margen, igv, contextoConversacion, cuestionario, ejecutarQuery, configIA }) {
  const enabled = configIA?.pipeline_enabled ?? ENABLED;

  if (!enabled) {
    throw new Error('Pipeline multi-agente deshabilitado por configuración');
  }

  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY no configurada');
  }

  // Envolver todo el pipeline con timeout total
  return ejecutarConTimeout(_ejecutarPipelineInterno({ mensaje, historial, productos, tipoCambio, margen, igv, contextoConversacion, cuestionario, ejecutarQuery, configIA }), TIMEOUT_TOTAL_MS, 'Pipeline');
}

async function _ejecutarPipelineInterno({ mensaje, historial, productos, tipoCambio, margen, igv, contextoConversacion, cuestionario, ejecutarQuery, configIA }) {


    // ── Paso 0: Detección determinística de intención ──
    const intencionDetectada = detectarIntencionDeterministica(mensaje);

    // ── Paso 1: Clasificador ──
    let clasificacion;
    try {
        clasificacion = await ejecutarConTimeout(
            agenteClasificador.clasificar(mensaje, historial, configIA),
            TIMEOUT_CLASIFICADOR_MS,
            'Clasificador'
        );
        // Sobreescribir si la detección determinística es más confiable
        if (intencionDetectada && clasificacion.pregunta_especifica !== 'cotizar' && clasificacion.pregunta_especifica !== 'recomendar') {
            clasificacion.pregunta_especifica = intencionDetectada;
        }
    } catch (errorClasificador) {
        console.warn('[Orquestador] Clasificador falló, usando cuestionario determinístico:', errorClasificador.message);
        clasificacion = fallbackClasificador(cuestionario, historial);
        if (intencionDetectada) {
            clasificacion.pregunta_especifica = intencionDetectada;
        }
    }

  // Enriquecer clasificación con datos del cuestionario determinístico
  if (!clasificacion.uso_principal && cuestionario.uso) {
    clasificacion.uso_principal = cuestionario.uso;
  }
  if (!clasificacion.presupuesto_pen && cuestionario.presupuestoPen) {
    clasificacion.presupuesto_pen = cuestionario.presupuestoPen;
  }
  if (!clasificacion.resolucion && cuestionario.resolucion) {
    clasificacion.resolucion = cuestionario.resolucion;
  }
  if (clasificacion.multitarea_stream === null && cuestionario.multitarea !== null && cuestionario.multitarea !== undefined) {
    clasificacion.multitarea_stream = cuestionario.multitarea;
  }
  if (!clasificacion.preferencia_ruido && cuestionario.ruido) {
    clasificacion.preferencia_ruido = cuestionario.ruido;
  }

  // ── Paso 2: Buscador + Reranker (cuando hay uso + presupuesto) ──
  // No esperar al cuestionario completo: el Clasificador extrae datos incrementalmente.
  // La respuesta conversacional decide si mostrar la config o pedir más datos.
  const listoParaCotizar = (
    clasificacion.uso_principal !== null &&
    clasificacion.presupuesto_pen !== null
  );

  let candidatos = null;
  let configPropuesta = null;

  if (listoParaCotizar && productos && productos.length > 0) {
    try {
      candidatos = await ejecutarConTimeout(
        agenteBuscador.buscarProductos(clasificacion, productos, ejecutarQuery, configIA?.nvidia_api_key),
        TIMEOUT_BUSCADOR_MS,
        'Buscador'
      );
    } catch (errorBuscador) {
      console.warn('[Orquestador] Buscador falló:', errorBuscador.message);
      candidatos = null;
    }

    // ── Paso 3: Reranker (solo si hay candidatos) ──
    if (candidatos && candidatos.size > 0) {
      try {
        configPropuesta = await ejecutarConTimeout(
          agenteReranker.rerank(clasificacion, candidatos, { tipoCambio, margen, igv }),
          TIMEOUT_RERANKER_MS,
          'Reranker'
        );
      } catch (errorReranker) {
        console.warn('[Orquestador] Reranker falló, usando selección directa:', errorReranker.message);
        configPropuesta = agenteReranker.rerankFallback(clasificacion, candidatos, { tipoCambio, margen, igv });
      }
    }
  }

  // ── Construir respuesta final ──
  // Incluir configuracion_propuesta cuando:
  //   a) El cuestionario determinístico está completo, O
  //   b) El usuario pidió explícitamente ver la configuración (clasificador)
    const listoParaCotizarDeterministico = cuestionario?.uso && cuestionario?.presupuestoPen;
    const pideCotizar = clasificacion?.pregunta_especifica === 'cotizar' || clasificacion?.pregunta_especifica === 'recomendar';
    const mostrarConfig = cuestionario?.completo === true || pideCotizar || (listoParaCotizarDeterministico && intencionDetectada);

  const configEnriquecida = configPropuesta?.configuracion_propuesta && mostrarConfig
    ? enriquecerConfigPropuesta(
        configPropuesta.configuracion_propuesta,
        productos,
        tipoCambio,
        margen,
        igv
      )
    : null;

  const respuestaConversacional = generarRespuestaConversacional(
    clasificacion,
    configEnriquecida,
    tipoCambio,
    margen,
    igv,
    mostrarConfig
  );

  return {
    respuesta: respuestaConversacional.respuesta,
    quick_replies: respuestaConversacional.quick_replies,
    configuracion_propuesta: mostrarConfig ? (configPropuesta?.configuracion_propuesta || null) : null,
    perfil_usuario: clasificacion.perfil || agenteReranker.inferirPerfil(clasificacion),
    requiere_asesor: false,
    // Metadatos internos para debugging
    _pipeline_metadatos: {
      clasificacion,
      agentes_ejecutados: {
        clasificador: !!clasificacion,
        buscador: !!candidatos,
        reranker: !!configPropuesta,
      },
      confianza_clasificacion: clasificacion.confianza,
    },
  };
}

// ── Enriquecer configuración con datos completos de productos ──

function enriquecerConfigPropuesta(config, productos, tipoCambio, margen, igv) {
  const productosMap = new Map(productos.map((p) => [p.id, p]));
  const factor = (1 + margen / 100) * (1 + igv / 100) * tipoCambio;

  const enriquecer = (item) => {
    if (!item || !item.id) return item;
    const prod = productosMap.get(Number(item.id));
    if (!prod) return item;
    return {
      ...item,
      nombre: prod.nombre,
      precio_usd: prod.precio_usd || 0,
      precio_pen: Math.round((prod.precio_usd || 0) * factor * 100) / 100,
    };
  };

  const resultado = {
    procesador: enriquecer(config.procesador),
    placa_madre: enriquecer(config.placa_madre),
    ram: (config.ram || []).map(enriquecer),
    almacenamiento: enriquecer(config.almacenamiento),
    gpu: enriquecer(config.gpu),
    fuente: enriquecer(config.fuente),
    case: enriquecer(config.case),
  };

  const sumar = (comp) => (comp?.precio_usd || 0);
  const totalUsd =
    sumar(resultado.procesador) +
    sumar(resultado.placa_madre) +
    (resultado.ram || []).reduce((s, r) => s + sumar(r), 0) +
    sumar(resultado.almacenamiento) +
    sumar(resultado.gpu) +
    sumar(resultado.fuente) +
    sumar(resultado.case);

  resultado.precio_total_usd = Math.round(totalUsd * 100) / 100;
  resultado.precio_total_pen = Math.round(totalUsd * factor * 100) / 100;

  return resultado;
}

// ── Fallback del clasificador ──

function fallbackClasificador(cuestionario, historial) {
  return {
    uso_principal: cuestionario.uso || null,
    presupuesto_pen: cuestionario.presupuestoPen || null,
    resolucion: cuestionario.resolucion || null,
    multitarea_stream: cuestionario.multitarea ?? null,
    preferencia_ruido: cuestionario.ruido || null,
    perfil: null,
    tiene_presupuesto_explicito: cuestionario.presupuestoPen !== null,
    pregunta_especifica: cuestionario.completo ? 'cotizar' : 'informacion',
    confianza: 0.3,
    productos_mencionados: [],
  };
}

// ── Detección determinística de intención ──

function detectarIntencionDeterministica(mensaje) {
    if (!mensaje || typeof mensaje !== 'string') return null;
    const t = mensaje.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (KEYWORDS_COTIZAR.some((kw) => t.includes(kw))) {
        return 'cotizar';
    }
    return null;
}


module.exports = {
  ejecutarPipeline,
  generarRespuestaConversacional,
};
