'use strict';

const { calcularSpecsFaltantes, tieneSpecsFaltantes, upsertSpecs } = require('./servicioImportacion');
const { extraerJSON, generarRespuestaConPrioridad } = require('../asistente/servicioLLM');
const { ejecutarQuery } = require('../configuracion/baseDatos');
const { obtenerConfigIAEnriquecimiento } = require('../asistente/servicioConfigIA');

const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '15000', 10);
const AI_MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || '2', 10);
const AI_INTERVAL_MS = parseInt(process.env.AI_INTERVAL_MS || '500', 10);

const MAPA_REVALIDACION_SPECS = {
  procesador: {
    tabla: 'specs_procesador',
    columnas: {
      socket: 'socket',
      cpu_nucleos: 'nucleos',
      cpu_hilos: 'hilos',
      cpu_frecuencia_base_ghz: 'frecuencia_base_ghz',
      cpu_frecuencia_boost_ghz: 'frecuencia_boost_ghz',
      cpu_tdp_w: 'tdp_w',
      cpu_graficos_integrados: 'graficos_integrados',
      arquitectura: 'arquitectura',
    },
  },
  placa_madre: {
    tabla: 'specs_placa_madre',
    columnas: {
      socket: 'socket',
      mb_chipset: 'chipset',
      mb_form_factor: 'form_factor',
      mb_ram_tipo: 'ram_tipo',
      mb_max_ram_gb: 'max_ram_gb',
      mb_slots_ram: 'slots_ram',
      mb_m2_slots: 'm2_slots',
      mb_pcie_version: 'pcie_version',
    },
  },
  ram: {
    tabla: 'specs_ram',
    columnas: {
      ram_tipo: 'ram_tipo',
      ram_capacidad_gb: 'capacidad_gb',
      ram_velocidad_mhz: 'velocidad_mhz',
      ram_latencia: 'latencia',
      ram_cantidad_modulos: 'cantidad_modulos',
    },
  },
  almacenamiento: {
    tabla: 'specs_almacenamiento',
    columnas: {
      storage_tipo: 'tipo_almacenamiento',
      storage_capacidad_gb: 'capacidad_gb',
      storage_interfaz: 'interfaz',
      storage_form_factor: 'form_factor',
      storage_nvme_gen: 'nvme_gen',
      storage_velocidad_lectura_mbps: 'velocidad_lectura_mbps',
      storage_velocidad_escritura_mbps: 'velocidad_escritura_mbps',
    },
  },
  gpu: {
    tabla: 'specs_gpu',
    columnas: {
      gpu_chipset: 'chipset',
      gpu_vram_gb: 'vram_gb',
      gpu_vram_tipo: 'vram_tipo',
      gpu_bus_bits: 'bus_bits',
      gpu_boost_mhz: 'boost_mhz',
      gpu_tdp_w: 'tdp_w',
      gpu_longitud_mm: 'longitud_mm',
      gpu_fuente_recomendada_w: 'fuente_recomendada_w',
    },
  },
  fuente: {
    tabla: 'specs_fuente',
    columnas: {
      psu_wattage: 'wattage',
      psu_certificacion: 'certificacion',
      psu_modular: 'modular',
      psu_form_factor: 'form_factor',
      psu_pcie_conectores: 'pcie_conectores',
      psu_sata_conectores: 'sata_conectores',
    },
  },
  case: {
    tabla: 'specs_case',
    columnas: {
      case_form_factor: 'form_factor',
      case_color: 'color',
      case_panel_lateral: 'panel_lateral',
      case_max_gpu_mm: 'max_gpu_mm',
      case_max_cooler_mm: 'max_cooler_mm',
      case_ventiladores_incluidos: 'ventiladores_incluidos',
      case_compatibilidad_placa: 'compatibilidad_placa',
    },
  },
};

let _cola = [];
let _procesando = false;
let _ultimaActualizacion = null;

function encolarProductos(productos) {
  if (!Array.isArray(productos) || productos.length === 0) return;

  _cola.push(...productos);
  _ultimaActualizacion = new Date().toISOString();

  if (!_procesando) {
    _procesarCola().catch((err) =>
      console.error('[EnriquecimientoIA] Error inesperado en _procesarCola:', err.message)
    );
  }
}

function obtenerEstadoMemoria() {
  return {
    en_proceso: _procesando,
    pendientes_en_memoria: _cola.length,
    ultima_actualizacion: _ultimaActualizacion,
  };
}

function reactivarCola() {
  if (_cola.length > 0 && !_procesando) {
    _procesarCola().catch((err) =>
      console.error('[EnriquecimientoIA] Error inesperado al reactivar cola:', err.message)
    );
  }
}

async function reactivarDesdeDB(queryFn) {
  const fn = queryFn || ejecutarQuery;
  const sql = `
    SELECT id, subcategoria AS categoria, nombre, descripcion_general
    FROM productos
    WHERE estado_enriquecimiento = 'pendiente'
  `;

  const resultado = await fn(sql);
  const filas = resultado.rows || [];

  if (filas.length === 0) return;

  console.log(`[EnriquecimientoIA] Recuperando ${filas.length} productos pendientes desde BD...`);

  const items = filas.map((fila) => ({
    id_producto: fila.id,
    categoria: fila.categoria,
    nombre: fila.nombre,
    descripcion_general: fila.descripcion_general,
    specs_faltantes: calcularSpecsFaltantes(fila.categoria, {}),
  }));

  encolarProductos(items);
}

function construirGuiaFormatoCampo(campo, tipo) {
  const guias = {
    socket: 'string corto. Ejemplos: "AM4", "AM5", "LGA1700".',
    cpu_nucleos: 'integer positivo. Solo número entero.',
    cpu_hilos: 'integer positivo. Solo número entero.',
    cpu_frecuencia_base_ghz: 'number decimal en GHz. Ejemplo: 3.4',
    cpu_frecuencia_boost_ghz: 'number decimal en GHz. Ejemplo: 5.6',
    cpu_tdp_w: 'integer positivo en watts. Ejemplo: 125',
    cpu_graficos_integrados: 'boolean true o false.',
    arquitectura: 'string corto. Ejemplos: "Zen 4", "Alder Lake".',
    mb_chipset: 'string corto. Ejemplos: "B650", "Z790".',
    mb_form_factor: 'string corto. Ejemplos: "ATX", "MICRO-ATX", "MINI-ITX".',
    mb_ram_tipo: 'string corto. Ejemplos: "DDR4", "DDR5".',
    mb_max_ram_gb: 'integer positivo. Ejemplo: 128',
    mb_slots_ram: 'integer positivo. Ejemplo: 4',
    mb_m2_slots: 'integer positivo. Ejemplo: 2',
    mb_pcie_version: 'string corto. Ejemplos: "4.0", "5.0".',
    ram_tipo: 'string corto. Ejemplos: "DDR4", "DDR5".',
    ram_capacidad_gb: 'integer positivo. Ejemplo: 16',
    ram_velocidad_mhz: 'integer positivo en MHz. Ejemplo: 3200',
    ram_latencia: 'string corto. Ejemplo: "CL16".',
    ram_cantidad_modulos: 'integer positivo. Ejemplo: 2',
    storage_tipo: 'string corto. Ejemplos: "SSD", "HDD", "NVMe".',
    storage_capacidad_gb: 'integer positivo en GB. Convertir TB a GB si aplica.',
    storage_interfaz: 'string corto. Ejemplos: "SATA III", "NVMe PCIe 4.0", "USB".',
    storage_form_factor: 'string corto. Ejemplos: "2.5\"", "M.2", "3.5\"".',
    storage_nvme_gen: 'string corto. Ejemplos: "Gen 3", "Gen 4", "Gen 5".',
    storage_velocidad_lectura_mbps: 'integer positivo en MB/s.',
    storage_velocidad_escritura_mbps: 'integer positivo en MB/s.',
    gpu_chipset: 'string corto. Ejemplos: "RTX 4060", "RX 7600".',
    gpu_vram_gb: 'integer positivo en GB.',
    gpu_vram_tipo: 'string corto. Ejemplos: "GDDR6", "GDDR6X".',
    gpu_bus_bits: 'integer positivo. Ejemplo: 128',
    gpu_boost_mhz: 'integer positivo en MHz. Ejemplo: 2610',
    gpu_tdp_w: 'integer positivo en watts.',
    gpu_longitud_mm: 'integer positivo en milímetros.',
    gpu_fuente_recomendada_w: 'integer positivo en watts. Ejemplo: 650',
    psu_wattage: 'integer positivo en watts.',
    psu_certificacion: 'string corto. Ejemplos: "80+ Bronze", "80+ Gold".',
    psu_modular: 'string corto. Solo uno de: "Full Modular", "Semi Modular", "No Modular".',
    psu_form_factor: 'string corto. Ejemplo: "ATX".',
    psu_pcie_conectores: 'integer positivo. Ejemplo: 2',
    psu_sata_conectores: 'integer positivo. Ejemplo: 6',
    case_form_factor: 'string corto. Ejemplos: "ATX", "MICRO-ATX", "MINI-ITX".',
    case_color: 'string corto. Ejemplos: "Negro", "Blanco".',
    case_panel_lateral: 'string corto. Ejemplos: "Vidrio Templado", "Acrílico Transparente", "Malla Metálica".',
    case_max_gpu_mm: 'integer positivo en milímetros.',
    case_max_cooler_mm: 'integer positivo en milímetros.',
    case_ventiladores_incluidos: 'integer positivo. Ejemplo: 3',
    case_compatibilidad_placa: 'string corto. Ejemplos: "ATX, MICRO-ATX, MINI-ITX".',
  };

  return guias[campo] || `Debe respetar el tipo ${tipo}.`;
}

function construirPromptEnriquecimiento(item) {
  const campos = item.specs_faltantes.map(({ campo, tipo }) => `- ${campo} (${tipo}): ${construirGuiaFormatoCampo(campo, tipo)}`).join('\n');
  const claves = item.specs_faltantes.map(({ campo }) => campo);
  const ejemplo = Object.fromEntries(claves.map((campo) => [campo, null]));

  return {
    systemPrompt: `Eres un extractor de datos técnicos de hardware para una base de datos.
Tu única tarea es completar campos faltantes para un producto.
Debes responder SOLO un objeto JSON válido.
No agregues texto, explicaciones, markdown, comentarios ni campos extra.
Incluye EXCLUSIVAMENTE las claves solicitadas.
Si un valor no puede determinarse con alta certeza, usa null.
Respeta exactamente el tipo de dato solicitado: string, integer, number o boolean.`,

    mensajeActual: `Categoria: ${item.categoria}
Producto: ${item.nombre}
Descripcion: ${item.descripcion_general || 'No disponible'}

Campos exactos requeridos para BD:
${campos}

Reglas estrictas:
- Devuelve solo estas claves: ${claves.join(', ')}
- No devuelvas unidades dentro de números.
- No devuelvas arreglos ni texto fuera del JSON.
- Si no sabes un valor con certeza, devuelve null en esa clave.
- No inventes especificaciones.

Plantilla exacta esperada:
${JSON.stringify(ejemplo)}`,
  };
}

async function llamarLLMParaSpecs(item) {
  const configIA = await obtenerConfigIAEnriquecimiento();
  const { systemPrompt, mensajeActual } = construirPromptEnriquecimiento(item);

  if (!Array.isArray(configIA.prioridad_proveedores) || configIA.prioridad_proveedores.length === 0) {
    throw new Error('[EnriquecimientoIA] No hay proveedores habilitados para el enriquecimiento');
  }

  const promesaTimeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`[EnriquecimientoIA] Timeout de ${AI_TIMEOUT_MS}ms al llamar al LLM`)),
      AI_TIMEOUT_MS
    )
  );

  const resultado = await Promise.race([
    generarRespuestaConPrioridad({
      systemPrompt,
      historial: [],
      mensajeActual,
      configIA,
      prioridadProveedores: configIA.prioridad_proveedores,
    }),
    promesaTimeout,
  ]);

  return JSON.stringify(resultado);
}

function normalizarValorIA(campo, tipo, valor) {
  if (valor === null || valor === undefined) return null;

  if (tipo === 'integer') {
    if (typeof valor === 'number' && Number.isInteger(valor) && valor > 0) return valor;
    if (typeof valor === 'string') {
      const limpio = valor.trim().replace(/,/g, '').match(/-?\d+/)?.[0];
      if (!limpio) return '__INVALIDO__';
      const numero = Number.parseInt(limpio, 10);
      return Number.isInteger(numero) && numero > 0 ? numero : '__INVALIDO__';
    }
    return '__INVALIDO__';
  }

  if (tipo === 'number') {
    if (typeof valor === 'number' && Number.isFinite(valor) && valor > 0) return valor;
    if (typeof valor === 'string') {
      const limpio = valor.trim().replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)?.[0];
      if (!limpio) return '__INVALIDO__';
      const numero = Number.parseFloat(limpio);
      return Number.isFinite(numero) && numero > 0 ? numero : '__INVALIDO__';
    }
    return '__INVALIDO__';
  }

  if (tipo === 'boolean') {
    if (typeof valor === 'boolean') return valor;
    if (typeof valor === 'string') {
      const texto = valor.trim().toLowerCase();
      if (['true', 'si', 'sí', 'yes'].includes(texto)) return true;
      if (['false', 'no'].includes(texto)) return false;
    }
    return '__INVALIDO__';
  }

  if (tipo === 'string') {
    if (typeof valor !== 'string') return '__INVALIDO__';
    const limpio = valor.trim();
    return limpio ? limpio : '__INVALIDO__';
  }

  return valor;
}

function validarRespuestaIA(respuestaTexto, _categoria, specsFaltantes) {
  const parsed = extraerJSON(respuestaTexto);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('La respuesta de la IA no es un objeto JSON válido');
  }

  const specsValidadas = {};

  for (const { campo, tipo } of specsFaltantes) {
    const normalizado = normalizarValorIA(campo, tipo, parsed[campo]);

    if (normalizado === null || normalizado === undefined) continue;
    if (normalizado === '__INVALIDO__') {
      throw new Error(
        `Campo "${campo}" esperaba tipo "${tipo}" pero recibió valor incoherente: ${JSON.stringify(parsed[campo])}`
      );
    }

    specsValidadas[campo] = normalizado;
  }

  return specsValidadas;
}

async function obtenerRegistroConsolidadoDesdeBD(db, item) {
  const definicion = MAPA_REVALIDACION_SPECS[item.categoria];
  if (!definicion) return {};

  const columnas = Object.entries(definicion.columnas)
    .map(([campoLogico, columnaBD]) => `${definicion.tabla}.${columnaBD} AS ${campoLogico}`)
    .join(', ');

  const { rows } = await db(
    `SELECT ${columnas}
     FROM ${definicion.tabla}
     WHERE id_producto = $1`,
    [item.id_producto]
  );

  return rows[0] || {};
}

async function escribirSpecsEnBD(db, item, specsValidadas) {
  await upsertSpecs(db, item.categoria, item.id_producto, specsValidadas);

  const registroConsolidado = await obtenerRegistroConsolidadoDesdeBD(db, item);

  const camposSolicitadosPendientes = (item.specs_faltantes || []).some(({ campo }) => {
    const valor = registroConsolidado[campo];
    return valor == null || valor === '';
  });

  const estadoFinal = !camposSolicitadosPendientes && !tieneSpecsFaltantes(item.categoria, registroConsolidado)
    ? 'ia_completado'
    : 'ia_fallido';

  await db(
    `UPDATE productos
     SET estado_enriquecimiento = $2
     WHERE id = $1`,
    [item.id_producto, estadoFinal]
  );

  if (estadoFinal !== 'ia_completado') {
    const faltantes = calcularSpecsFaltantes(item.categoria, registroConsolidado).map(({ campo }) => campo);
    const faltantesSolicitados = (item.specs_faltantes || [])
      .map(({ campo }) => campo)
      .filter((campo) => registroConsolidado[campo] == null || registroConsolidado[campo] === '');
    const faltantesUnicos = [...new Set([...faltantesSolicitados, ...faltantes])];
    throw new Error(`La IA no completo todos los campos requeridos con suficiente certeza. Faltantes: ${faltantesUnicos.join(', ')}`);
  }

  _ultimaActualizacion = new Date().toISOString();
}

async function marcarComoFallido(db, idProducto) {
  await db(
    `UPDATE productos
     SET estado_enriquecimiento = 'ia_fallido'
     WHERE id = $1`,
    [idProducto]
  );

  _ultimaActualizacion = new Date().toISOString();
}

async function procesarItemConReintentos(item) {
  for (let intento = 0; intento <= AI_MAX_RETRIES; intento++) {
    try {
      const respuestaTexto = await llamarLLMParaSpecs(item);
      const specsValidadas = validarRespuestaIA(respuestaTexto, item.categoria, item.specs_faltantes);
      await escribirSpecsEnBD(ejecutarQuery, item, specsValidadas);
      return true;
    } catch (err) {
      const esUltimoIntento = intento === AI_MAX_RETRIES;

      if (esUltimoIntento) {
        console.error(
          `[EnriquecimientoIA] Fallido tras ${AI_MAX_RETRIES + 1} intentos — producto ${item.id_producto}: ${err.message}`
        );
        await marcarComoFallido(ejecutarQuery, item.id_producto);
        return false;
      }

      const espera = 500 * (intento + 1);
      console.warn(
        `[EnriquecimientoIA] Intento ${intento + 1} fallido para producto ${item.id_producto}: ${err.message}. Reintentando en ${espera}ms...`
      );
      await new Promise((r) => setTimeout(r, espera));
    }
  }
}

async function _procesarCola() {
  if (_procesando) return;
  _procesando = true;

  let completados = 0;
  let fallidos = 0;
  const total = _cola.length;

  console.log(`[EnriquecimientoIA] Iniciando procesamiento de ${total} productos en cola...`);

  while (_cola.length > 0) {
    const item = _cola.shift();
    const procesados = completados + fallidos + 1;

    const exito = await procesarItemConReintentos(item);
    if (exito) completados++;
    else fallidos++;

    if (procesados % 10 === 0) {
      console.log(
        `[EnriquecimientoIA] Progreso: ${procesados}/${total} — completados: ${completados}, fallidos: ${fallidos}`
      );
    }

    if (_cola.length > 0) {
      await new Promise((r) => setTimeout(r, AI_INTERVAL_MS));
    }
  }

  _procesando = false;
  _ultimaActualizacion = new Date().toISOString();
  console.log(`[EnriquecimientoIA] Cola procesada. Completados: ${completados}, Fallidos: ${fallidos}`);
}

module.exports = {
  encolarProductos,
  obtenerEstadoMemoria,
  reactivarCola,
  reactivarDesdeDB,
  construirPromptEnriquecimiento,
  llamarLLMParaSpecs,
  validarRespuestaIA,
  escribirSpecsEnBD,
  marcarComoFallido,
  procesarItemConReintentos,
};
