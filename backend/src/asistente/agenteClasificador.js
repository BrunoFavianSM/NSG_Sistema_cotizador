/**
 * Agente Clasificador del Pipeline Multi-Agente
 * Modelo: meta/llama-3.2-3b-instruct (o el configurado en NVIDIA_CLASSIFIER_MODEL)
 * Extrae datos estructurados del texto libre del usuario: uso, presupuesto, perfil, preferencias.
 */

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_CLASSIFIER_MODEL = process.env.NVIDIA_CLASSIFIER_MODEL || 'meta/llama-3.2-3b-instruct';

const { extraerJSON } = require('./servicioLLM');

// ── Prompt del clasificador ──

function construirPromptClasificador(mensaje, resumenHistorial) {
  const contexto = resumenHistorial
    ? `\nContexto previo de la conversación: ${resumenHistorial}`
    : '';

  return `Eres un clasificador de intenciones para un configurador de PC en NSG Latinoamérica.
Analiza el mensaje del usuario y extrae la siguiente información en JSON válido:

{
  "uso_principal": "gaming|edicion_video|diseno_3d|oficina|null",
  "presupuesto_pen": number|null,
  "resolucion": "1080p|1440p|4k|null",
  "multitarea_stream": true|false|null,
  "preferencia_ruido": "silenciosa|indiferente|null",
  "perfil": "basico|intermedio|avanzado|gamer_full|null",
  "tiene_presupuesto_explicito": true|false,
  "pregunta_especifica": "cotizar|recomendar|presupuesto|componente|informacion|saludo|otro",
  "confianza": 0.0,
  "productos_mencionados": []
}

Reglas:
- Si menciona un monto en S/ seguido de números (ej: S/4000, 3000 soles), extraer como presupuesto_pen
- Si menciona uso (gaming, video, oficina, render), clasificar uso_principal
- "confianza" indica qué tan seguro estás de la clasificación (0.0 a 1.0)
- Si es un saludo o pregunta general, devolver pregunta_especifica: "saludo"
- Perfil se calcula: básico=S/2000-3000 sin GPU, intermedio=S/3000-5000 GPU mid, avanzado=S/5000-8000 GPU high, gamer_full=S/8000+
- No inventes datos. Si no hay suficiente información, usa null.
- Responde SOLO el JSON, sin texto adicional ni markdown.${contexto}

Mensaje del usuario: "${mensaje}"`;
}

// ── Resumir historial para contexto ──

function resumirHistorial(historial) {
  if (!historial || historial.length === 0) return null;
  // Tomar últimos 4 mensajes, solo rol y contenido truncado
  const ultimos = historial.slice(-4);
  return ultimos
    .map((m) => `${m.rol === 'user' ? 'Usuario' : 'Asistente'}: ${String(m.contenido || '').slice(0, 100)}`)
    .join(' | ');
}

// ── Llamada al clasificador ──

async function clasificar(mensaje, historial = []) {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY no configurada para clasificador');
  }

  const prompt = construirPromptClasificador(mensaje, resumirHistorial(historial));

  const respuesta = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_CLASSIFIER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 300,
      top_p: 0.9,
    }),
  });

  if (!respuesta.ok) {
    const errorBody = await respuesta.text().catch(() => '');
    const err = new Error(`Clasificador NVIDIA ${respuesta.status}: ${errorBody}`);
    err.status = respuesta.status;
    throw err;
  }

  const data = await respuesta.json();
  const texto = data?.choices?.[0]?.message?.content || '';
  const json = extraerJSON(texto);

  if (!json) {
    throw new Error('Clasificador no devolvió JSON válido');
  }

  // Validar y normalizar campos
  return normalizarClasificacion(json);
}

// ── Normalización de la clasificación ──

const USOS_VALIDOS = ['gaming', 'edicion_video', 'diseno_3d', 'oficina'];
const PERFILES_VALIDOS = ['basico', 'intermedio', 'avanzado', 'gamer_full'];
const RESOLUCIONES_VALIDAS = ['1080p', '1440p', '4k'];
const PREGUNTAS_VALIDAS = ['cotizar', 'recomendar', 'presupuesto', 'componente', 'informacion', 'saludo', 'otro'];

function normalizarClasificacion(json) {
  const uso = USOS_VALIDOS.includes(json.uso_principal) ? json.uso_principal : null;
  const perfil = PERFILES_VALIDOS.includes(json.perfil) ? json.perfil : null;
  const resolucion = RESOLUCIONES_VALIDAS.includes(json.resolucion) ? json.resolucion : null;
  const pregunta = PREGUNTAS_VALIDAS.includes(json.pregunta_especifica) ? json.pregunta_especifica : 'otro';

  const presupuesto = typeof json.presupuesto_pen === 'number' && json.presupuesto_pen >= 500 && json.presupuesto_pen <= 50000
    ? json.presupuesto_pen
    : null;

  let multitarea = null;
  if (json.multitarea_stream === true || json.multitarea_stream === 'true') multitarea = true;
  else if (json.multitarea_stream === false || json.multitarea_stream === 'false') multitarea = false;

  let ruido = null;
  if (json.preferencia_ruido === 'silenciosa') ruido = 'silenciosa';
  else if (json.preferencia_ruido === 'indiferente') ruido = 'indiferente';

  const confianza = typeof json.confianza === 'number'
    ? Math.max(0, Math.min(1, json.confianza))
    : 0.5;

  const productosMencionados = Array.isArray(json.productos_mencionados)
    ? json.productos_mencionados.filter((p) => typeof p === 'string')
    : [];

  return {
    uso_principal: uso,
    presupuesto_pen: presupuesto,
    resolucion,
    multitarea_stream: multitarea,
    preferencia_ruido: ruido,
    perfil,
    tiene_presupuesto_explicito: presupuesto !== null,
    pregunta_especifica: pregunta,
    confianza,
    productos_mencionados: productosMencionados,
  };
}

module.exports = {
  clasificar,
  normalizarClasificacion,
  construirPromptClasificador,
};
