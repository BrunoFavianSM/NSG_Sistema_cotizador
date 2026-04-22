'use strict';

/**
 * servicioSemaforo.js
 * Calcula las calificaciones de capacidad (1-5 estrellas) de una configuracion de PC
 * para las categorias: Gaming, Edicion de Video, Productividad, Streaming, Renderizado 3D.
 *
 * Requisitos: 6.1, 6.2, 6.3
 */

// ---------------------------------------------------------------------------
// Helpers de extraccion y clasificacion
// ---------------------------------------------------------------------------

/**
 * Extrae la capacidad en GB de un nombre de modulo de RAM.
 * Ejemplos: "Kingston 16GB DDR5" -> 16, "Corsair 32GB DDR4" -> 32
 * @param {string} ram - Nombre del producto de RAM
 * @returns {number} Capacidad en GB (0 si no se puede parsear)
 */
function extraerCapacidadGB(ram) {
  if (!ram || typeof ram !== 'string') return 0;
  const coincidencia = ram.match(/(\d+)\s*GB/i);
  return coincidencia ? parseInt(coincidencia[1], 10) : 0;
}

/**
 * Extrae la VRAM en GB del nombre de una GPU.
 * Ejemplos: "RTX 4060 8GB" -> 8, "RX 7900 XTX 24GB" -> 24
 * @param {string} gpu - Nombre del producto de GPU
 * @returns {number} VRAM en GB (0 si no se puede parsear)
 */
function extraerVRAM(gpu) {
  if (!gpu || typeof gpu !== 'string') return 0;
  const coincidencia = gpu.match(/(\d+)\s*GB/i);
  return coincidencia ? parseInt(coincidencia[1], 10) : 0;
}

/**
 * Clasifica una GPU en un tier del 1 al 5 segun su modelo.
 * Tier 5: RTX 4090, RX 7900 XTX, RTX 3090
 * Tier 4: RTX 4070, RX 7800 XT, RTX 3080
 * Tier 3: RTX 4060, RX 7600, RTX 3070
 * Tier 2: RTX 3060, RX 6600, GTX 1070
 * Tier 1: GTX 1660, RX 580, GTX 1060 y menores
 * @param {string} gpu - Nombre del producto de GPU
 * @returns {number} Tier de 1 a 5
 */
function clasificarGPU(gpu) {
  if (!gpu || typeof gpu !== 'string') return 1;
  const nombre = gpu.toUpperCase();

  // Tier 5 - GPUs de gama alta
  if (
    nombre.includes('RTX 4090') ||
    nombre.includes('RTX 3090') ||
    nombre.includes('RX 7900 XTX') ||
    nombre.includes('RX 7900 XT') ||
    nombre.includes('RX 6900') ||
    nombre.includes('RX 6950')
  ) return 5;

  // Tier 4 - GPUs de gama alta-media
  if (
    nombre.includes('RTX 4080') ||
    nombre.includes('RTX 4070') ||
    nombre.includes('RTX 3080') ||
    nombre.includes('RTX 3070') ||
    nombre.includes('RX 7800') ||
    nombre.includes('RX 7700') ||
    nombre.includes('RX 6800') ||
    nombre.includes('RX 6750')
  ) return 4;

  // Tier 3 - GPUs de gama media
  if (
    nombre.includes('RTX 4060') ||
    nombre.includes('RTX 3060 TI') ||
    nombre.includes('RTX 3060 Ti') ||
    nombre.includes('RX 7600') ||
    nombre.includes('RX 6700') ||
    nombre.includes('RX 6650') ||
    nombre.includes('GTX 1080')
  ) return 3;

  // Tier 2 - GPUs de gama media-baja
  if (
    nombre.includes('RTX 3060') ||
    nombre.includes('RTX 2060') ||
    nombre.includes('RX 6600') ||
    nombre.includes('RX 6500') ||
    nombre.includes('GTX 1070') ||
    nombre.includes('GTX 1660')
  ) return 2;

  // Tier 1 - GPUs de entrada o no identificadas
  return 1;
}

/**
 * Clasifica un procesador en un tier del 1 al 5 segun su modelo.
 * Tier 5: Ryzen 9, Core i9
 * Tier 4: Ryzen 7, Core i7
 * Tier 3: Ryzen 5, Core i5
 * Tier 2: Ryzen 3, Core i3
 * Tier 1: Celeron, Pentium, Athlon y menores
 * @param {string} procesador - Nombre del producto de CPU
 * @returns {number} Tier de 1 a 5
 */
function clasificarCPU(procesador) {
  if (!procesador || typeof procesador !== 'string') return 1;
  const nombre = procesador.toUpperCase();

  // Tier 5 - Procesadores de alto rendimiento
  if (
    nombre.includes('RYZEN 9') ||
    nombre.includes('CORE I9') ||
    nombre.includes('I9-')
  ) return 5;

  // Tier 4 - Procesadores de gama alta-media
  if (
    nombre.includes('RYZEN 7') ||
    nombre.includes('CORE I7') ||
    nombre.includes('I7-')
  ) return 4;

  // Tier 3 - Procesadores de gama media
  if (
    nombre.includes('RYZEN 5') ||
    nombre.includes('CORE I5') ||
    nombre.includes('I5-')
  ) return 3;

  // Tier 2 - Procesadores de gama media-baja
  if (
    nombre.includes('RYZEN 3') ||
    nombre.includes('CORE I3') ||
    nombre.includes('I3-')
  ) return 2;

  // Tier 1 - Procesadores de entrada o no identificados
  if (
    nombre.includes('CELERON') ||
    nombre.includes('PENTIUM') ||
    nombre.includes('ATHLON')
  ) return 1;

  return 1;
}

/**
 * Determina si el almacenamiento es de tipo SSD (NVMe, M.2, SATA SSD).
 * Ejemplos que retornan true: "Samsung 970 Evo 1TB NVMe", "Kingston A400 SSD", "WD Blue SN570 M.2"
 * Ejemplos que retornan false: "Seagate Barracuda 2TB HDD", "WD Blue 1TB"
 * @param {string} almacenamiento - Nombre del producto de almacenamiento
 * @returns {boolean} true si es SSD, false si es HDD u otro
 */
function esTipoSSD(almacenamiento) {
  if (!almacenamiento || typeof almacenamiento !== 'string') return false;
  const nombre = almacenamiento.toUpperCase();

  return (
    nombre.includes('SSD') ||
    nombre.includes('NVME') ||
    nombre.includes('NVMe') ||
    nombre.includes('M.2') ||
    nombre.includes('970') ||
    nombre.includes('980') ||
    nombre.includes('870') ||
    nombre.includes('860') ||
    nombre.includes('850') ||
    nombre.includes('SN') ||   // WD SN570, SN750, SN850
    nombre.includes('EVO') ||  // Samsung Evo series
    nombre.includes('PRO')     // Samsung Pro series (SSD)
  );
}

// ---------------------------------------------------------------------------
// Funcion principal de calculo
// ---------------------------------------------------------------------------

/**
 * Calcula las calificaciones de capacidad de una configuracion de PC.
 * Todas las calificaciones estan garantizadas en el rango [1, 5].
 *
 * @param {object} configuracion - Configuracion de la PC
 * @param {string|object} configuracion.gpu - GPU (nombre o { nombre })
 * @param {Array<string|object>} configuracion.ram - Array de modulos de RAM
 * @param {string|object} configuracion.procesador - Procesador (nombre o { nombre })
 * @param {string|object} configuracion.almacenamiento - Almacenamiento (nombre o { nombre })
 * @returns {{ gaming: number, edicion_video: number, productividad: number, streaming: number, renderizado_3d: number }}
 */
function calcular(configuracion) {
  const { gpu, ram, procesador, almacenamiento } = configuracion;

  // Normalizar: aceptar tanto string directo como objeto { nombre }
  const nombreGPU          = typeof gpu === 'string'           ? gpu           : (gpu?.nombre           || '');
  const nombreProcesador   = typeof procesador === 'string'    ? procesador    : (procesador?.nombre    || '');
  const nombreAlmacenamiento = typeof almacenamiento === 'string' ? almacenamiento : (almacenamiento?.nombre || '');

  // Normalizar array de RAM (puede ser array de strings u objetos)
  const ramArray = Array.isArray(ram) ? ram : (ram ? [ram] : []);
  const ramNombres = ramArray.map(r => (typeof r === 'string' ? r : (r?.nombre || '')));

  // Calcular metricas base
  const ramTotalGB = ramNombres.reduce((suma, r) => suma + extraerCapacidadGB(r), 0);
  const gpuVram    = extraerVRAM(nombreGPU);
  const gpuTier    = clasificarGPU(nombreGPU);
  const cpuTier    = clasificarCPU(nombreProcesador);
  const esSSD      = esTipoSSD(nombreAlmacenamiento);

  // Calcular calificaciones con rango garantizado [1, 5]
  return {
    gaming: Math.max(1, Math.min(5,
      Math.round((gpuTier * 0.7) + (cpuTier * 0.3))
    )),

    edicion_video: Math.max(1, Math.min(5,
      Math.round(
        (gpuVram >= 8 ? 3 : 1) +
        (ramTotalGB >= 32 ? 2 : ramTotalGB >= 16 ? 1 : 0)
      )
    )),

    productividad: Math.max(1, Math.min(5,
      Math.round(
        (cpuTier * 0.5) +
        (ramTotalGB >= 16 ? 2 : 1) +
        (esSSD ? 1 : 0)
      )
    )),

    streaming: Math.max(1, Math.min(5,
      Math.round(
        (cpuTier * 0.6) +
        (ramTotalGB >= 16 ? 1.5 : 1) +
        (gpuTier * 0.2)
      )
    )),

    renderizado_3d: Math.max(1, Math.min(5,
      Math.round(
        (gpuVram >= 12 ? 3 : gpuVram >= 8 ? 2 : 1) +
        (cpuTier * 0.4)
      )
    ))
  };
}

// ---------------------------------------------------------------------------
// Exportaciones
// ---------------------------------------------------------------------------

module.exports = {
  calcular,
  // Exportar helpers para facilitar testing unitario
  extraerCapacidadGB,
  extraerVRAM,
  clasificarGPU,
  clasificarCPU,
  esTipoSSD
};
