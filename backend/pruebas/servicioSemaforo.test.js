'use strict';

/**
 * Tests de servicioSemaforo.js
 *
 * Incluye:
 * - Tests unitarios con ejemplos concretos de productos reales de la BD
 * - Test de propiedad (PBT): Semaforo acotado
 *   Valida: Requisitos 6.1, 6.3
 */

const fc = require('fast-check');
const {
  calcular,
  extraerCapacidadGB,
  extraerVRAM,
  clasificarGPU,
  clasificarCPU,
  esTipoSSD
} = require('../src/servicios/servicioSemaforo');

// ---------------------------------------------------------------------------
// Tests unitarios - helpers
// ---------------------------------------------------------------------------

describe('extraerCapacidadGB', () => {
  test('extrae GB de nombre tipico de RAM', () => {
    expect(extraerCapacidadGB('Kingston 16GB DDR5')).toBe(16);
    expect(extraerCapacidadGB('Corsair 32GB DDR4')).toBe(32);
    expect(extraerCapacidadGB('G.Skill 8GB DDR4')).toBe(8);
  });

  test('retorna 0 si no hay GB en el nombre', () => {
    expect(extraerCapacidadGB('Kingston DDR5')).toBe(0);
    expect(extraerCapacidadGB('')).toBe(0);
    expect(extraerCapacidadGB(null)).toBe(0);
  });
});

describe('extraerVRAM', () => {
  test('extrae VRAM de nombres de GPU reales', () => {
    expect(extraerVRAM('RTX 4060 8GB')).toBe(8);
    expect(extraerVRAM('RX 7900 XTX 24GB')).toBe(24);
    expect(extraerVRAM('RTX 4090 24GB')).toBe(24);
    expect(extraerVRAM('GTX 1660 6GB')).toBe(6);
  });

  test('retorna 0 si no hay GB en el nombre', () => {
    expect(extraerVRAM('RTX 4060')).toBe(0);
    expect(extraerVRAM(null)).toBe(0);
  });
});

describe('clasificarGPU', () => {
  test('tier 5 para GPUs de gama alta', () => {
    expect(clasificarGPU('NVIDIA RTX 4090 24GB')).toBe(5);
    expect(clasificarGPU('AMD RX 7900 XTX 24GB')).toBe(5);
  });

  test('tier 4 para GPUs de gama alta-media', () => {
    expect(clasificarGPU('NVIDIA RTX 4070 12GB')).toBe(4);
    expect(clasificarGPU('AMD RX 7800 XT 16GB')).toBe(4);
  });

  test('tier 3 para GPUs de gama media', () => {
    expect(clasificarGPU('NVIDIA RTX 4060 8GB')).toBe(3);
    expect(clasificarGPU('AMD RX 7600 8GB')).toBe(3);
  });

  test('tier 2 para GPUs de gama media-baja', () => {
    expect(clasificarGPU('NVIDIA RTX 3060 12GB')).toBe(2);
    expect(clasificarGPU('AMD RX 6600 8GB')).toBe(2);
    expect(clasificarGPU('NVIDIA GTX 1660 6GB')).toBe(2);
  });

  test('tier 1 para GPUs de entrada o desconocidas', () => {
    expect(clasificarGPU('Intel UHD 630')).toBe(1);
    expect(clasificarGPU('')).toBe(1);
    expect(clasificarGPU(null)).toBe(1);
  });
});

describe('clasificarCPU', () => {
  test('tier 5 para Ryzen 9 / i9', () => {
    expect(clasificarCPU('AMD Ryzen 9 7950X')).toBe(5);
    expect(clasificarCPU('Intel Core i9-13900K')).toBe(5);
  });

  test('tier 4 para Ryzen 7 / i7', () => {
    expect(clasificarCPU('AMD Ryzen 7 7700X')).toBe(4);
    expect(clasificarCPU('Intel Core i7-13700K')).toBe(4);
  });

  test('tier 3 para Ryzen 5 / i5', () => {
    expect(clasificarCPU('AMD Ryzen 5 7600X')).toBe(3);
    expect(clasificarCPU('Intel Core i5-13600K')).toBe(3);
  });

  test('tier 2 para Ryzen 3 / i3', () => {
    expect(clasificarCPU('AMD Ryzen 3 4300G')).toBe(2);
    expect(clasificarCPU('Intel Core i3-12100')).toBe(2);
  });

  test('tier 1 para Celeron, Pentium, Athlon y desconocidos', () => {
    expect(clasificarCPU('Intel Celeron G6900')).toBe(1);
    expect(clasificarCPU('Intel Pentium Gold G7400')).toBe(1);
    expect(clasificarCPU('AMD Athlon 3000G')).toBe(1);
    expect(clasificarCPU('')).toBe(1);
    expect(clasificarCPU(null)).toBe(1);
  });
});

describe('esTipoSSD', () => {
  test('retorna true para SSD/NVMe/M.2 y modelos conocidos', () => {
    expect(esTipoSSD('Samsung 970 Evo 1TB NVMe')).toBe(true);
    expect(esTipoSSD('Kingston A400 SSD 480GB')).toBe(true);
    expect(esTipoSSD('WD Blue SN570 1TB M.2')).toBe(true);
    expect(esTipoSSD('Samsung 870 EVO 1TB SATA')).toBe(true);
    expect(esTipoSSD('Samsung 980 Pro 1TB NVMe')).toBe(true);
  });

  test('retorna false para HDD y desconocidos', () => {
    expect(esTipoSSD('Seagate Barracuda 2TB HDD')).toBe(false);
    expect(esTipoSSD('WD Blue 1TB 7200RPM')).toBe(false);
    expect(esTipoSSD('')).toBe(false);
    expect(esTipoSSD(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests unitarios - calcular (ejemplos de configuraciones reales)
// ---------------------------------------------------------------------------

describe('calcular - configuraciones de ejemplo', () => {
  const configGamerFull = {
    gpu: 'NVIDIA RTX 4090 24GB',
    ram: ['Kingston 32GB DDR5', 'Kingston 32GB DDR5'],
    procesador: 'AMD Ryzen 9 7950X',
    almacenamiento: 'Samsung 980 Pro 2TB NVMe'
  };

  const configBasica = {
    gpu: 'Intel UHD 630',
    ram: ['Kingston 8GB DDR4'],
    procesador: 'Intel Celeron G6900',
    almacenamiento: 'Seagate Barracuda 1TB HDD'
  };

  const configIntermedia = {
    gpu: 'NVIDIA RTX 4060 8GB',
    ram: ['Kingston 16GB DDR5'],
    procesador: 'AMD Ryzen 5 7600X',
    almacenamiento: 'Samsung 970 Evo 1TB NVMe'
  };

  test('configuracion gamer full tiene calificaciones altas', () => {
    const resultado = calcular(configGamerFull);
    expect(resultado.gaming).toBeGreaterThanOrEqual(4);
    expect(resultado.productividad).toBeGreaterThanOrEqual(4);
  });

  test('configuracion basica tiene calificaciones bajas', () => {
    const resultado = calcular(configBasica);
    expect(resultado.gaming).toBeLessThanOrEqual(2);
    expect(resultado.edicion_video).toBeLessThanOrEqual(2);
  });

  test('configuracion intermedia tiene calificaciones en rango valido', () => {
    const resultado = calcular(configIntermedia);
    expect(resultado.gaming).toBeGreaterThanOrEqual(1);
    expect(resultado.gaming).toBeLessThanOrEqual(5);
  });

  test('retorna todas las categorias requeridas', () => {
    const resultado = calcular(configIntermedia);
    expect(resultado).toHaveProperty('gaming');
    expect(resultado).toHaveProperty('edicion_video');
    expect(resultado).toHaveProperty('productividad');
    expect(resultado).toHaveProperty('streaming');
    expect(resultado).toHaveProperty('renderizado_3d');
  });

  test('acepta ram como array de objetos { nombre }', () => {
    const config = {
      gpu: { nombre: 'NVIDIA RTX 4060 8GB' },
      ram: [{ nombre: 'Kingston 16GB DDR5' }],
      procesador: { nombre: 'AMD Ryzen 5 7600X' },
      almacenamiento: { nombre: 'Samsung 970 Evo 1TB NVMe' }
    };
    const resultado = calcular(config);
    expect(resultado.gaming).toBeGreaterThanOrEqual(1);
    expect(resultado.gaming).toBeLessThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// Test de propiedad (PBT) - Propiedad 3: Semaforo acotado
// Valida: Requisitos 6.1, 6.3
// ---------------------------------------------------------------------------

/**
 * Propiedad 3: Semaforo acotado
 * Para cualquier configuracion valida, todas las calificaciones del semaforo
 * estan en el rango [1, 5].
 *
 * **Valida: Requisitos 6.1, 6.3**
 */
describe('PBT - Propiedad 3: Semaforo acotado [Valida: Requisitos 6.1, 6.3]', () => {
  // Generadores de nombres de componentes realistas
  const gpuNombres = fc.constantFrom(
    'NVIDIA RTX 4090 24GB',
    'NVIDIA RTX 4080 16GB',
    'NVIDIA RTX 4070 12GB',
    'NVIDIA RTX 4060 8GB',
    'NVIDIA RTX 3090 24GB',
    'NVIDIA RTX 3080 10GB',
    'NVIDIA RTX 3070 8GB',
    'NVIDIA RTX 3060 12GB',
    'NVIDIA GTX 1660 6GB',
    'NVIDIA GTX 1060 6GB',
    'AMD RX 7900 XTX 24GB',
    'AMD RX 7800 XT 16GB',
    'AMD RX 7600 8GB',
    'AMD RX 6800 XT 16GB',
    'AMD RX 6600 8GB',
    'AMD RX 580 8GB',
    'Intel UHD 630',
    'GPU Desconocida',
    ''
  );

  const ramNombres = fc.constantFrom(
    'Kingston 8GB DDR4',
    'Kingston 16GB DDR4',
    'Kingston 32GB DDR4',
    'Kingston 16GB DDR5',
    'Kingston 32GB DDR5',
    'Corsair 8GB DDR4',
    'Corsair 16GB DDR4',
    'G.Skill 32GB DDR5',
    'RAM Generica 4GB',
    ''
  );

  const cpuNombres = fc.constantFrom(
    'AMD Ryzen 9 7950X',
    'AMD Ryzen 9 5900X',
    'AMD Ryzen 7 7700X',
    'AMD Ryzen 7 5800X',
    'AMD Ryzen 5 7600X',
    'AMD Ryzen 5 5600X',
    'AMD Ryzen 3 4300G',
    'AMD Athlon 3000G',
    'Intel Core i9-13900K',
    'Intel Core i7-13700K',
    'Intel Core i5-13600K',
    'Intel Core i3-12100',
    'Intel Celeron G6900',
    'Intel Pentium Gold G7400',
    'CPU Desconocida',
    ''
  );

  const almacenamientoNombres = fc.constantFrom(
    'Samsung 980 Pro 1TB NVMe',
    'Samsung 970 Evo 1TB NVMe',
    'Samsung 870 EVO 1TB SATA SSD',
    'WD Blue SN570 1TB M.2',
    'Kingston A400 480GB SSD',
    'Seagate Barracuda 1TB HDD',
    'Seagate Barracuda 2TB HDD',
    'WD Blue 1TB 7200RPM',
    'Almacenamiento Desconocido',
    ''
  );

  // Generador de configuracion completa con strings (formato directo)
  const configuracionArbitraria = fc.record({
    gpu: gpuNombres,
    ram: fc.array(ramNombres, { minLength: 1, maxLength: 4 }),
    procesador: cpuNombres,
    almacenamiento: almacenamientoNombres
  });

  test('todas las calificaciones estan en [1, 5] para cualquier configuracion', () => {
    fc.assert(
      fc.property(configuracionArbitraria, (configuracion) => {
        const resultado = calcular(configuracion);

        const categorias = ['gaming', 'edicion_video', 'productividad', 'streaming', 'renderizado_3d'];

        for (const categoria of categorias) {
          const valor = resultado[categoria];
          if (valor < 1 || valor > 5) return false;
          if (!Number.isInteger(valor)) return false;
        }

        return true;
      }),
      { numRuns: 1000 }
    );
  });

  test('el resultado siempre contiene las 5 categorias requeridas', () => {
    fc.assert(
      fc.property(configuracionArbitraria, (configuracion) => {
        const resultado = calcular(configuracion);
        return (
          'gaming'         in resultado &&
          'edicion_video'  in resultado &&
          'productividad'  in resultado &&
          'streaming'      in resultado &&
          'renderizado_3d' in resultado
        );
      }),
      { numRuns: 500 }
    );
  });
});
