/**
 * Agente Reranker del Pipeline Multi-Agente
 * Toma los candidatos del Buscador (top-K por categoría) y selecciona el mejor
 * producto de cada categoría según: compatibilidad, presupuesto y score semántico.
 *
 * Flujo:
 * 1. Agrupar candidatos por categoría (normalizando nombres)
 * 2. Para cada categoría, seleccionar el mejor producto según presupuesto + score
 * 3. Aplicar filtros de compatibilidad determinísticos (socket CPU↔placa, etc.)
 * 4. Devolver configuracion_propuesta con 7 slots
 */

const servicioCompatibilidad = require('../servicios/servicioCompatibilidad');

// ── Normalizar nombre de categoría a clave interna ──

const MAPA_CATEGORIAS = {
  procesador: 'procesador',
  cpu: 'procesador',
  placa_madre: 'placa_madre',
  'placa madre': 'placa_madre',
  motherboard: 'placa_madre',
  ram: 'ram',
  memoria: 'ram',
  almacenamiento: 'almacenamiento',
  disco: 'almacenamiento',
  ssd: 'almacenamiento',
  hdd: 'almacenamiento',
  gpu: 'gpu',
  grafica: 'gpu',
  video: 'gpu',
  tarjeta_grafica: 'gpu',
  'tarjeta grafica': 'gpu',
  'tarjeta de video': 'gpu',
  fuente: 'fuente',
  fuente_de_poder: 'fuente',
  'fuente de poder': 'fuente',
  psu: 'fuente',
  case: 'case',
  gabinete: 'case',
  chasis: 'case',
};

function normalizarCategoria(nombre) {
  if (!nombre) return null;
  const clave = nombre.toLowerCase().trim();
  return MAPA_CATEGORIAS[clave] || clave;
}

// ── Seleccionar mejor producto de una categoría ──

function seleccionarMejor(candidatos, presupuestoMax, porcentajePresupuesto) {
  if (!candidatos || candidatos.length === 0) return null;

  const presupuestoCategoria = presupuestoMax ? presupuestoMax * porcentajePresupuesto : null;

  // Ordenar: primero los que están dentro del presupuesto (con mejor score),
  // luego los más cercanos al presupuesto
  const ordenados = [...candidatos].sort((a, b) => {
    const precioA = a.producto?.precio_usd || 0;
    const precioB = b.producto?.precio_usd || 0;

    if (presupuestoCategoria) {
      // Preferir precio dentro del presupuesto de categoría
      const dentroA = precioA <= presupuestoCategoria ? 1 : 0;
      const dentroB = precioB <= presupuestoCategoria ? 1 : 0;
      if (dentroA !== dentroB) return dentroB - dentroA; // los que caben primero

      // Entre los que caben, mejor score
      if (dentroA) return (b.score || 0) - (a.score || 0);
      // Entre los que no caben, el más cercano al presupuesto
      const diffA = Math.abs(precioA - presupuestoCategoria);
      const diffB = Math.abs(precioB - presupuestoCategoria);
      return diffA - diffB;
    }
    // Sin presupuesto, mejor score primero
    return (b.score || 0) - (a.score || 0);
  });

  return ordenados[0].producto || null;
}

// ── Distribución de presupuesto por uso ──
// Porcentaje del presupuesto TOTAL que debe ir a cada categoría

const DISTRIBUCION = {
  gaming_1080p:  { procesador: 0.21, gpu: 0.26, ram: 0.16, almacenamiento: 0.12, placa_madre: 0.14, fuente: 0.06, case: 0.06 },
  gaming_1440p:  { procesador: 0.24, gpu: 0.30, ram: 0.18, almacenamiento: 0.12, placa_madre: 0.14, fuente: 0.06, case: 0.06 },
  gaming_4k:     { procesador: 0.24, gpu: 0.34, ram: 0.20, almacenamiento: 0.14, placa_madre: 0.14, fuente: 0.06, case: 0.06 },
  edicion_video: { procesador: 0.24, gpu: 0.27, ram: 0.20, almacenamiento: 0.16, placa_madre: 0.14, fuente: 0.06, case: 0.06 },
  diseno_3d:     { procesador: 0.22, gpu: 0.32, ram: 0.18, almacenamiento: 0.14, placa_madre: 0.14, fuente: 0.06, case: 0.06 },
  oficina:       { procesador: 0.25, gpu: 0.12, ram: 0.18, almacenamiento: 0.12, placa_madre: 0.14, fuente: 0.06, case: 0.06 },
  default:       { procesador: 0.22, gpu: 0.26, ram: 0.16, almacenamiento: 0.12, placa_madre: 0.14, fuente: 0.06, case: 0.06 },
};

function obtenerDistribucion(uso, resolucion) {
  if (uso === 'gaming') {
    if (resolucion === '4k') return DISTRIBUCION.gaming_4k;
    if (resolucion === '1440p') return DISTRIBUCION.gaming_1440p;
    return DISTRIBUCION.gaming_1080p;
  }
  if (uso === 'edicion_video') return DISTRIBUCION.edicion_video;
  if (uso === 'diseno_3d') return DISTRIBUCION.diseno_3d;
  if (uso === 'oficina') return DISTRIBUCION.oficina;
  return DISTRIBUCION.default;
}

// ── Función principal ──

async function rerank(clasificacion, candidatosPorCategoria, { tipoCambio, margen, igv }) {
  const uso = clasificacion.uso_principal || 'default';
  const resolucion = clasificacion.resolucion;
  const distribucion = obtenerDistribucion(uso, resolucion);

  // Calcular presupuesto total en USD
  const presupuestoUsd = clasificacion.presupuesto_pen
    ? clasificacion.presupuesto_pen / tipoCambio / ((1 + margen / 100) * (1 + igv / 100))
    : null;

  // Normalizar claves del Map de categorías
  const candidatosNormalizados = new Map();
  for (const [clave, items] of candidatosPorCategoria) {
    const cat = normalizarCategoria(clave);
    if (cat && items && items.length > 0) {
      candidatosNormalizados.set(cat, items);
    }
  }

  // Seleccionar mejor producto para cada categoría
  const seleccion = {};
  const ordenCategorias = ['procesador', 'placa_madre', 'ram', 'almacenamiento', 'gpu', 'fuente', 'case'];

  for (const cat of ordenCategorias) {
    const items = candidatosNormalizados.get(cat) || [];
    const pct = distribucion[cat] || 0.10;
    seleccion[cat] = seleccionarMejor(items, presupuestoUsd, pct);
  }

  // Verificar compatibilidad CPU↔Placa (filtro básico por socket si hay datos)
  const cpuSocket = seleccion.procesador?.socket || null;
  const placaSocket = seleccion.placa_madre?.socket || null;
  if (cpuSocket && placaSocket && cpuSocket !== placaSocket) {
    // Incompatibilidad detectada: buscar placa compatible
    const placasCompatibles = (candidatosNormalizados.get('placa_madre') || [])
      .filter((p) => (p.producto?.socket || null) === cpuSocket);
    if (placasCompatibles.length > 0) {
      seleccion.placa_madre = seleccionarMejor(placasCompatibles, presupuestoUsd, distribucion.placa_madre || 0.14);
    } else {
      console.warn('[Reranker] No se encontró placa compatible con socket', cpuSocket);
    }
  }

  return {
    configuracion_propuesta: {
      procesador: seleccion.procesador ? { id: seleccion.procesador.id } : null,
      placa_madre: seleccion.placa_madre ? { id: seleccion.placa_madre.id } : null,
      ram: seleccion.ram ? [{ id: seleccion.ram.id }] : [],
      almacenamiento: seleccion.almacenamiento ? { id: seleccion.almacenamiento.id } : null,
      gpu: seleccion.gpu ? { id: seleccion.gpu.id } : null,
      fuente: seleccion.fuente ? { id: seleccion.fuente.id } : null,
      case: seleccion.case ? { id: seleccion.case.id } : null,
    },
    perfil: clasificacion.perfil || inferirPerfil(clasificacion),
    confianza: 0.7,
    alternativas: [],
  };
}

// ── Fallback: selección directa por categoría (sin compatibilidad) ──

function rerankFallback(clasificacion, candidatosPorCategoria, { tipoCambio, margen, igv }) {
  return rerank(clasificacion, candidatosPorCategoria, { tipoCambio, margen, igv });
}

// ── Inferir perfil ──

function inferirPerfil(clasificacion) {
  const p = clasificacion.presupuesto_pen;
  const uso = clasificacion.uso_principal;

  if (!p) {
    if (uso === 'oficina') return 'basico';
    if (uso === 'gaming' || uso === 'diseno_3d') return 'avanzado';
    return 'intermedio';
  }
  if (p <= 3000) return 'basico';
  if (p <= 5000) return 'intermedio';
  if (p <= 8000) return 'avanzado';
  return 'gamer_full';
}

module.exports = {
  rerank,
  rerankFallback,
  obtenerDistribucion,
  inferirPerfil,
};