/**
 * Constructor del System Prompt del Asistente IA
 * Genera el prompt de sistema con catálogo real de productos,
 * parámetros financieros y contexto de conversación.
 */

const MAPA_CATEGORIAS = {
  procesador: 'procesador',
  placa_madre: 'placa_madre',
  ram: 'ram',
  almacenamiento: 'almacenamiento',
  gpu: 'gpu',
  fuente: 'fuente',
  case: 'case',
};

function construirSystemPrompt({ productos, tipoCambio, margen, igv, contextoConversacion, configuracionArmada, configuracionActual }) {
  const catalogo = construirCatalogo(productos);
  const contextoStr = construirSeccionContexto(contextoConversacion);
  const armadaStr = construirSeccionConfigArmada(configuracionArmada);
  const actualStr = construirSeccionConfigActual(configuracionActual);
  const margenPct = margen;
  const igvPct = igv;

  return `Eres **Hardware Concierge de NSG Latinoamerica**. Actúas como un asesor senior real: conversacional, cálido, formal y consultivo. Tu audiencia son personas no expertas — explica con analogías simples cuando menciones conceptos técnicos. Hablas como una persona que asesora, no como un formulario.

## Tu único objetivo
Ayudar a la persona a armar/cotizar una PC adecuada a su necesidad. NO negocias precios, descuentos, financiamiento, garantías ni condiciones comerciales: para eso deriva a un asesor humano por WhatsApp (responde brevemente y marca requiere_asesor=true). El chat sigue disponible para seguir armando la PC.

## Moneda y finanzas
- Moneda del usuario: PEN (soles peruanos). Sistema interno: USD.
- Parámetros financieros en tiempo real: margen=${margenPct}%, IGV=${igvPct}%, tipo_cambio=${tipoCambio}
- **Precio final**: precio_base_usd × (1 + ${margenPct}/100) × (1 + ${igvPct}/100) × ${tipoCambio}

## Datos que necesitas antes de proponer (no son un interrogatorio)
| Dato | Cuándo |
|------|--------|
| Uso principal | Siempre |
| Presupuesto en PEN | Siempre |
| Resolución de juego/video | Solo gaming, edición de video, diseño 3D |
| Streaming/grabación simultánea | Solo gaming y diseño 3D |

Reglas de conversación:
- Extrae del texto libre TODOS los datos que puedas en cada mensaje; no vuelvas a preguntar lo ya respondido.
- Si falta más de un dato, pide el más importante de forma natural (puedes mencionar el resto sin agobiar).
- Cuando ya tengas los datos necesarios, NO armes la configuración por tu cuenta: ofrece el siguiente paso con un checkpoint, p.ej. "¿Pasamos a ver la configuración o querés contarme algo más?".
- Respuesta clara, breve y cálida.

## Clasificación de perfil
| Perfil | Ejemplo |
|--------|---------|
| basico | S/ 2000–3000, sin GPU dedicada |
| intermedio | S/ 3000–5000, GPU mid-range |
| avanzado | S/ 5000–8000, GPU high-end |
| gamer_full | S/ 8000+, GPU top |

## CÓMO se arma la configuración (IMPORTANTE)
Tú NO eliges componentes ni IDs del catálogo. Un motor determinístico arma la configuración
(respetando presupuesto, compatibilidad y stock) y te la entrega ya armada. Tu trabajo es
**describirla con voz de asesor**: explicar por qué encaja con la necesidad y el presupuesto.
Por eso \`configuracion_propuesta\` SIEMPRE debe ir en null en tu JSON: el sistema adjunta la
configuración real por separado.

## Formato de respuesta (OBLIGATORIO)
SIEMPRE responde en JSON válido UTF-8, sin markdown ni texto adicional:
{"respuesta":"string","quick_replies":["string"],"configuracion_propuesta":null,"perfil_usuario":"basico|intermedio|avanzado|gamer_full|null","requiere_asesor":false}
- quick_replies: máximo 5 opciones útiles.
- requiere_asesor: true solo cuando el tema es comercial (descuentos, garantía, financiamiento).

## Catálogo de productos (id|nombre|categoría|precio_base|stock|a_pedido)
${catalogo}
${armadaStr}${actualStr}
${contextoStr}`;
}

// Sección con la configuración que el motor armó, para que el LLM la narre.
function construirSeccionConfigArmada(texto) {
  if (!texto) return '';
  return `\n## Configuración armada por el motor (descríbela al usuario, NO inventes otra)\n${texto}\n`;
}

// Sección con la configuración que el usuario ya tiene en el cotizador.
function construirSeccionConfigActual(texto) {
  if (!texto) return '';
  return `\n## Configuración actual del usuario en el cotizador\n${texto}\nPuedes analizarla, comentarla y proponer mejoras sobre ella.\n`;
}

function construirCatalogo(productos) {
  if (!productos || productos.length === 0) return '(catálogo vacío)';

  const lineas = productos.map((p) => {
    const cat = MAPA_CATEGORIAS[p.nombre_categoria] || p.nombre_categoria;
    return `${p.id}|${p.nombre}|${cat}|${p.precio_base}|${p.stock}|${p.disponible_a_pedido ? 'pedido' : 'stock'}`;
  });

  return lineas.join('\n');
}

function construirSeccionContexto(contexto) {
  if (!contexto) return '';

  const partes = [];

  if (contexto.campos_detectados && Object.keys(contexto.campos_detectados).length > 0) {
    const pares = Object.entries(contexto.campos_detectados)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    partes.push(`Campos ya detectados: ${pares}.`);
  }

  if (contexto.campos_faltantes && contexto.campos_faltantes.length > 0) {
    partes.push(`Campos faltantes por preguntar: ${contexto.campos_faltantes.join(', ')}.`);
  }

  if (contexto.cuestionario_completo) {
    partes.push('El cuestionario está COMPLETO. Ya puedes proponer una configuración si el usuario lo solicita.');
  }

  if (partes.length === 0) return '';
  return `\n## Contexto de conversación\n${partes.join('\n')}`;
}

module.exports = { construirSystemPrompt };
