/**
 * promptCorreccion.js
 * Construye el prompt de corrección para el loop Double-Check del Asistente IA.
 *
 * Responsabilidades:
 *  - Recibir la configuración incompatible y los errores específicos detectados.
 *  - Instruir al LLM a corregir SOLO los componentes incompatibles.
 *  - Mantener el resto de la configuración intacta para minimizar cambios.
 *  - Retornar el mismo schema JSON que el system prompt principal.
 *
 * Requisitos: 3.6, 3.7
 */

'use strict';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Serializa la configuración actual de forma legible para el LLM.
 *
 * @param {object} configuracion - Configuración propuesta con IDs y nombres.
 * @returns {string} Representación JSON indentada de la configuración.
 */
function serializarConfiguracion(configuracion) {
  // Normalizar ram como array si viene como objeto único
  const config = {
    ...configuracion,
    ram: Array.isArray(configuracion.ram)
      ? configuracion.ram
      : (configuracion.ram ? [configuracion.ram] : []),
  };
  return JSON.stringify(config, null, 2);
}

/**
 * Identifica qué categorías de componentes están involucradas en los errores.
 * Ayuda al LLM a saber exactamente qué debe cambiar.
 *
 * @param {string[]} errores - Lista de mensajes de error del validador.
 * @returns {string[]} Categorías de componentes a corregir.
 */
function identificarComponentesAfectados(errores) {
  const afectados = new Set();

  for (const error of errores) {
    const e = error.toLowerCase();
    if (e.includes('socket'))                                    afectados.add('procesador y/o placa_madre');
    if (e.includes('ram') || e.includes('ddr'))                 afectados.add('ram y/o placa_madre');
    if (e.includes('form factor') || e.includes('factor de forma')) afectados.add('case y/o placa_madre');
    if (e.includes('fuente') || e.includes('wattage') || e.includes('watts')) afectados.add('fuente');
    if (e.includes('gpu') || e.includes('longitud') || e.includes('espacio')) afectados.add('gpu y/o case');
    if (e.includes('gráficos integrados') || e.includes('graficos integrados')) afectados.add('procesador o gpu');
    if (e.includes('m.2') || e.includes('nvme'))                afectados.add('almacenamiento y/o placa_madre');
  }

  return afectados.size > 0
    ? [...afectados]
    : ['revisar todos los componentes'];
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Construye el prompt de corrección para el loop Double-Check.
 *
 * @param {object}   configuracion - Configuración actual con IDs y nombres de componentes.
 * @param {string[]} errores       - Errores de compatibilidad detectados por el validador.
 * @returns {string} Prompt de corrección listo para enviar al LLM.
 */
function construirPromptCorreccion(configuracion, errores) {
  const configJSON = serializarConfiguracion(configuracion);
  const componentesAfectados = identificarComponentesAfectados(errores);
  const listaErrores = errores.map((e, i) => `  ${i + 1}. ${e}`).join('\n');
  const listaAfectados = componentesAfectados.map((c) => `  - ${c}`).join('\n');

  return `
# TAREA: CORRECCIÓN DE CONFIGURACIÓN INCOMPATIBLE

Eres el Hardware Concierge de NSG Latinoamerica. El sistema de validación detectó incompatibilidades en la configuración que propusiste. Debes corregirla.

---

## CONFIGURACIÓN ACTUAL (con errores)

\`\`\`json
${configJSON}
\`\`\`

---

## ERRORES DE COMPATIBILIDAD DETECTADOS

${listaErrores}

---

## COMPONENTES QUE DEBES CORREGIR

Solo modifica los componentes involucrados en los errores:
${listaAfectados}

**NO cambies** los componentes que no están relacionados con los errores listados.

---

## INSTRUCCIONES DE CORRECCIÓN

1. Analiza cada error y determina qué componente(s) deben cambiar para resolverlo.
2. Selecciona componentes de reemplazo del catálogo que sean compatibles entre sí.
3. Mantén el presupuesto total lo más cercano posible al original.
4. Prioriza componentes con stock > 0. Si no hay alternativa, usa disponible_a_pedido = true.
5. Asegúrate de que la nueva configuración resuelva TODOS los errores listados.

Reglas de compatibilidad a verificar:
- Socket del procesador DEBE coincidir con el socket de la placa madre.
- Tipo de RAM (DDR4/DDR5) DEBE coincidir con lo que soporta la placa madre.
- Form factor de la placa madre DEBE ser compatible con el case.
- Wattage de la fuente DEBE ser ≥ consumo estimado total (con margen del 25%).
- Si hay almacenamiento M.2/NVMe, la placa madre DEBE tener slots M.2 disponibles.

---

## FORMATO DE RESPUESTA (OBLIGATORIO)

Responde ÚNICAMENTE con un JSON válido con este schema exacto. Sin texto fuera del JSON.

\`\`\`json
{
  "respuesta": "string — Texto interno de corrección (no se muestra al usuario). Describe brevemente qué cambiaste y por qué.",
  "quick_replies": [],
  "configuracion_propuesta": {
    "procesador":     { "id": 0, "nombre": "string", "precio_usd": 0 },
    "placa_madre":    { "id": 0, "nombre": "string", "precio_usd": 0 },
    "ram":            [{ "id": 0, "nombre": "string", "precio_usd": 0 }],
    "almacenamiento": { "id": 0, "nombre": "string", "precio_usd": 0 },
    "gpu":            { "id": 0, "nombre": "string", "precio_usd": 0 },
    "fuente":         { "id": 0, "nombre": "string", "precio_usd": 0 },
    "case":           { "id": 0, "nombre": "string", "precio_usd": 0 }
  }
}
\`\`\`

IMPORTANTE:
- El campo "respuesta" es solo para registro interno; el usuario nunca lo verá.
- "quick_replies" debe ser un array vacío [].
- "configuracion_propuesta" DEBE estar presente y ser una configuración completa y compatible.
- Usa SOLO IDs válidos del catálogo de productos. NUNCA inventes IDs.
- NO incluyas "semaforo" en esta respuesta de corrección.
`.trim();
}

// ─── Exportaciones ────────────────────────────────────────────────────────────

module.exports = { construirPromptCorreccion };
