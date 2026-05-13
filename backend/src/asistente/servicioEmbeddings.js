/**
 * Servicio de Embeddings para Pipeline Multi-Agente
 * Caché en memoria de embeddings de productos, generación de embeddings
 * vía NVIDIA API, y cálculo de similaridad coseno.
 */

const NodeCache = require('node-cache');

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_EMBEDDING_MODEL = process.env.NVIDIA_EMBEDDING_MODEL || 'nvidia/nv-embed-v1';

const CACHE_TTL = parseInt(process.env.EMBEDDING_CACHE_TTL || '300', 10);
const CACHE_MAX = parseInt(process.env.EMBEDDING_CACHE_MAX_ITEMS || '500', 10);
const EMBEDDING_FETCH_TIMEOUT_MS = parseInt(process.env.EMBEDDING_FETCH_TIMEOUT_MS || '15000', 10);

// Caché: clave → { embedding: number[], texto: string }
const cacheEmbeddings = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 120, maxKeys: CACHE_MAX });

// ── Similaridad coseno ──

function similitudCoseno(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// ── Construcción de texto para embedding ──

function construirTextoProducto(producto) {
  const partes = [producto.nombre, producto.nombre_categoria];
  // Incluir specs relevantes si están disponibles en el objeto
  if (producto.socket) partes.push(producto.socket);
  if (producto.nucleos) partes.push(`${producto.nucleos} nucleos`);
  if (producto.hilos) partes.push(`${producto.hilos} hilos`);
  if (producto.vram_gb) partes.push(`${producto.vram_gb}GB VRAM`);
  if (producto.capacidad_gb) partes.push(`${producto.capacidad_gb}GB`);
  if (producto.ram_tipo) partes.push(producto.ram_tipo);
  if (producto.form_factor) partes.push(producto.form_factor);
  if (producto.wattage) partes.push(`${producto.wattage}W`);
  if (producto.tipo_almacenamiento) partes.push(producto.tipo_almacenamiento);
  if (producto.tdp_w) partes.push(`${producto.tdp_w}W TDP`);
  return partes.join(' ');
}

function construirTextoQuery(clasificacion) {
  const partes = [];
  if (clasificacion.uso_principal) partes.push(`PC para ${clasificacion.uso_principal}`);
  if (clasificacion.presupuesto_pen) partes.push(`presupuesto S/${clasificacion.presupuesto_pen}`);
  if (clasificacion.resolucion) partes.push(clasificacion.resolucion);
  if (clasificacion.multitarea_stream) partes.push('streaming simultaneo');
  if (clasificacion.preferencia_ruido === 'silenciosa') partes.push('silenciosa');
  return partes.join(' ') || 'PC de escritorio';
}

// ── Llamada a NVIDIA Embeddings API ──

async function generarEmbedding(textos, tipo = 'query', apiKey) {
  const keyEfectiva = apiKey || NVIDIA_API_KEY;

  if (!keyEfectiva) {
    throw new Error('NVIDIA_API_KEY no configurada para embeddings');
  }

  const input = Array.isArray(textos) ? textos : [textos];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMBEDDING_FETCH_TIMEOUT_MS);

  let respuesta;
  try {
    respuesta = await fetch(`${NVIDIA_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyEfectiva}`,
      },
      body: JSON.stringify({
        model: NVIDIA_EMBEDDING_MODEL,
        input,
        input_type: tipo,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!respuesta.ok) {
    const errorBody = await respuesta.text().catch(() => '');
    const err = new Error(`NVIDIA Embedding ${respuesta.status}: ${errorBody}`);
    err.status = respuesta.status;
    throw err;
  }

  const data = await respuesta.json();
  return data.data.map((d) => d.embedding);
}

// ── Caché de embeddings de productos ──

/**
 * Genera y cachea embeddings para todos los productos del catálogo.
 * Retorna un Map<productoId, { embedding, texto }>
 */
async function obtenerEmbeddingsProductos(productos, ejecutarQuery, apiKey) {
  const cacheKey = 'embeddings_catalogo_completo';
  const cacheado = cacheEmbeddings.get(cacheKey);
  if (cacheado && cacheado.productos) {
    // Verificar que los productos no cambiaron (comparar cantidad)
    if (cacheado.cantidad === productos.length) {
      return cacheado.mapa;
    }
  }

  // Enriquecer productos con specs desde BD
  const ids = productos.map((p) => p.id);
  let mapaSpecs = new Map();
  try {
    if (ejecutarQuery && ids.length > 0) {
      const resultado = await ejecutarQuery(
        `SELECT p.id,
          sp.socket AS cpu_socket, sp.tdp_w AS cpu_tdp_w, sp.nucleos AS cpu_nucleos,
          sm.socket AS mb_socket, sm.ram_tipo AS mb_ram_tipo, sm.form_factor AS mb_form_factor,
          sr.ram_tipo, sr.velocidad_mhz,
          sg.tdp_w AS gpu_tdp_w, sg.vram_gb AS gpu_vram_gb,
          sf.wattage,
          sa.tipo_almacenamiento, sa.capacidad_gb
         FROM productos p
         LEFT JOIN specs_procesador sp ON sp.id_producto = p.id
         LEFT JOIN specs_placa_madre sm ON sm.id_producto = p.id
         LEFT JOIN specs_ram sr ON sr.id_producto = p.id
         LEFT JOIN specs_gpu sg ON sg.id_producto = p.id
         LEFT JOIN specs_fuente sf ON sf.id_producto = p.id
         LEFT JOIN specs_almacenamiento sa ON sa.id_producto = p.id
         WHERE p.id = ANY($1::int[])`,
        [ids]
      );
      mapaSpecs = new Map(resultado.rows.map((r) => [r.id, r]));
    }
  } catch (error) {
    console.warn('[Embeddings] No se pudieron obtener specs, usando productos base:', error.message);
  }

  // Construir textos para embedding
  const textos = productos.map((p) => {
    const specs = mapaSpecs.get(p.id) || {};
    return construirTextoProducto({
      ...p,
      socket: specs.cpu_socket || specs.mb_socket || null,
      nucleos: specs.cpu_nucleos || null,
      vram_gb: specs.gpu_vram_gb || null,
      capacidad_gb: specs.capacidad_gb || null,
      ram_tipo: specs.ram_tipo || specs.mb_ram_tipo || null,
      form_factor: specs.mb_form_factor || null,
      wattage: specs.wattage || null,
      tipo_almacenamiento: specs.tipo_almacenamiento || null,
      tdp_w: specs.cpu_tdp_w || specs.gpu_tdp_w || null,
    });
  });

  // Generar embeddings en lotes de 32 (límite típico de NVIDIA API)
  const LOTE = 32;
  let todosLosEmbeddings = [];

  for (let i = 0; i < textos.length; i += LOTE) {
    const lote = textos.slice(i, i + LOTE);
      try {
        const embeddings = await generarEmbedding(lote, 'passage', apiKey);
        todosLosEmbeddings = todosLosEmbeddings.concat(embeddings);
    } catch (error) {
      console.error(`[Embeddings] Error en lote ${i}:`, error.message);
      // Lanzar error para que agenteBuscador caiga al fallback SQL
      throw new Error(`Embeddings fallaron en lote ${i}: ${error.message}`);
    }
  }

  // Construir mapa final
  const mapaFinal = new Map();
  for (let i = 0; i < productos.length; i++) {
    mapaFinal.set(productos[i].id, {
      embedding: todosLosEmbeddings[i],
      texto: textos[i],
      producto: productos[i],
    });
  }

  // Guardar en caché
  cacheEmbeddings.set(cacheKey, { mapa: mapaFinal, cantidad: productos.length });

  return mapaFinal;
}

// ── Búsqueda semántica ──

/**
 * Busca productos por similaridad semántica contra la query del usuario.
 * Retorna top-K productos por categoría.
 */
async function buscarSemantico(clasificacion, productos, ejecutarQuery, topK = 5, apiKey) {
  const mapaEmbeddings = await obtenerEmbeddingsProductos(productos, ejecutarQuery, apiKey);
  const textoQuery = construirTextoQuery(clasificacion);

  let queryEmbedding;
  try {
    const [embedding] = await generarEmbedding([textoQuery], 'query', apiKey);
    queryEmbedding = embedding;
  } catch (error) {
    console.error('[Embeddings] Error generando embedding de query:', error.message);
    throw error;
  }

  // Calcular similaridad contra todos los productos
  const resultados = [];
  for (const [id, data] of mapaEmbeddings) {
    if (!data.embedding || data.embedding.every((v) => v === 0)) continue;
    const score = similitudCoseno(queryEmbedding, data.embedding);
    resultados.push({
      id,
      score,
      producto: data.producto,
      texto: data.texto,
    });
  }

  // Ordenar por score descendente
  resultados.sort((a, b) => b.score - a.score);

  // Agrupar por categoría
  const porCategoria = new Map();
  for (const r of resultados) {
    const cat = MAPA_CATEGORIAS_EMBEDDING[r.producto.nombre_categoria] || r.producto.nombre_categoria;
    if (!porCategoria.has(cat)) {
      porCategoria.set(cat, []);
    }
    if (porCategoria.get(cat).length < topK) {
      porCategoria.get(cat).push(r);
    }
  }

  return porCategoria;
}

// ── Verificar si hay caché de embeddings disponible ──

function cacheDisponible() {
  const cacheado = cacheEmbeddings.get('embeddings_catalogo_completo');
  return !!(cacheado && cacheado.mapa && cacheado.mapa.size > 0);
}

// Mapeo de categorías de BD a categorías internas
const MAPA_CATEGORIAS_EMBEDDING = {
  procesador: 'procesador',
  placa_madre: 'placa_madre',
  ram: 'ram',
  almacenamiento: 'almacenamiento',
  gpu: 'gpu',
  fuente: 'fuente',
  case: 'case',
};

module.exports = {
  similitudCoseno,
  construirTextoProducto,
  construirTextoQuery,
  generarEmbedding,
  obtenerEmbeddingsProductos,
  buscarSemantico,
  cacheDisponible,
};
