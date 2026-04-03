/**
 * Pruebas Unitarias para Asistente IA
 * 
 * Valida el funcionamiento del servicio de IA conversacional
 * incluyendo optimizaciones de costo y fallbacks.
 */

const asistenteIA = require('../src/servicios/asistenteIA');
const { ejecutarQuery } = require('../src/configuracion/baseDatos');

// Mock de la base de datos
jest.mock('../src/configuracion/baseDatos');

describe('Asistente IA - Servicio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actualizarContexto', () => {
    test('debe extraer presupuesto de números en la respuesta', () => {
      const contexto = {
        presupuesto: null,
        usosPrincipales: [],
        preferencias: {}
      };

      asistenteIA.actualizarContexto(contexto, 'Mi presupuesto es entre 3000 y 4000 soles');

      expect(contexto.presupuesto).toBeDefined();
      expect(contexto.presupuesto.min).toBe(3000);
      expect(contexto.presupuesto.max).toBe(4000);
    });

    test('debe extraer presupuesto único y calcular máximo', () => {
      const contexto = {
        presupuesto: null,
        usosPrincipales: [],
        preferencias: {}
      };

      asistenteIA.actualizarContexto(contexto, 'Tengo 5000 soles');

      expect(contexto.presupuesto).toBeDefined();
      expect(contexto.presupuesto.min).toBe(5000);
      expect(contexto.presupuesto.max).toBe(6000); // 5000 * 1.2
    });

    test('debe detectar uso gaming', () => {
      const contexto = {
        presupuesto: null,
        usosPrincipales: [],
        preferencias: {}
      };

      asistenteIA.actualizarContexto(contexto, 'Quiero jugar videojuegos y gaming');

      expect(contexto.usosPrincipales).toContain('gaming');
    });

    test('debe detectar múltiples usos', () => {
      const contexto = {
        presupuesto: null,
        usosPrincipales: [],
        preferencias: {}
      };

      asistenteIA.actualizarContexto(contexto, 'Para diseño gráfico y edición de video');

      expect(contexto.usosPrincipales).toContain('diseño');
      expect(contexto.usosPrincipales).toContain('video');
    });

    test('debe detectar preferencia de marca Intel', () => {
      const contexto = {
        presupuesto: null,
        usosPrincipales: [],
        preferencias: {}
      };

      asistenteIA.actualizarContexto(contexto, 'Prefiero procesadores Intel');

      expect(contexto.preferencias.marcaProcesador).toBe('Intel');
    });

    test('debe detectar preferencia de marca AMD', () => {
      const contexto = {
        presupuesto: null,
        usosPrincipales: [],
        preferencias: {}
      };

      asistenteIA.actualizarContexto(contexto, 'Me gustan los Ryzen de AMD');

      expect(contexto.preferencias.marcaProcesador).toBe('AMD');
    });

    test('debe detectar preferencia de GPU NVIDIA', () => {
      const contexto = {
        presupuesto: null,
        usosPrincipales: [],
        preferencias: {}
      };

      asistenteIA.actualizarContexto(contexto, 'Quiero una GeForce de NVIDIA');

      expect(contexto.preferencias.marcaGPU).toBe('NVIDIA');
    });

    test('no debe duplicar usos ya detectados', () => {
      const contexto = {
        presupuesto: null,
        usosPrincipales: ['gaming'],
        preferencias: {}
      };

      asistenteIA.actualizarContexto(contexto, 'También para jugar juegos');

      expect(contexto.usosPrincipales).toEqual(['gaming']);
      expect(contexto.usosPrincipales.length).toBe(1);
    });
  });

  describe('tieneInformacionSuficiente', () => {
    test('debe retornar true si tiene presupuesto y usos', () => {
      const contexto = {
        presupuesto: { min: 3000, max: 4000 },
        usosPrincipales: ['gaming'],
        preguntasRealizadas: 2
      };

      expect(asistenteIA.tieneInformacionSuficiente(contexto)).toBe(true);
    });

    test('debe retornar false si falta presupuesto', () => {
      const contexto = {
        presupuesto: null,
        usosPrincipales: ['gaming'],
        preguntasRealizadas: 2
      };

      expect(asistenteIA.tieneInformacionSuficiente(contexto)).toBe(false);
    });

    test('debe retornar false si faltan usos', () => {
      const contexto = {
        presupuesto: { min: 3000, max: 4000 },
        usosPrincipales: [],
        preguntasRealizadas: 2
      };

      expect(asistenteIA.tieneInformacionSuficiente(contexto)).toBe(false);
    });

    test('debe retornar true si se alcanzaron 5 preguntas', () => {
      const contexto = {
        presupuesto: null,
        usosPrincipales: [],
        preguntasRealizadas: 5
      };

      expect(asistenteIA.tieneInformacionSuficiente(contexto)).toBe(true);
    });
  });

  describe('filtrarProductosRelevantes', () => {
    const productosEjemplo = [
      { id: 1, categoria: 'procesador', precio_base: 500, stock: 10 },
      { id: 2, categoria: 'procesador', precio_base: 1000, stock: 5 },
      { id: 3, categoria: 'procesador', precio_base: 1500, stock: 3 },
      { id: 4, categoria: 'procesador', precio_base: 2000, stock: 0 },
      { id: 5, categoria: 'placa_madre', precio_base: 300, stock: 8 },
      { id: 6, categoria: 'placa_madre', precio_base: 600, stock: 4 },
      { id: 7, categoria: 'placa_madre', precio_base: 900, stock: 2 },
      { id: 8, categoria: 'placa_madre', precio_base: 1200, stock: 1 },
      { id: 9, categoria: 'ram', precio_base: 200, stock: 15 },
      { id: 10, categoria: 'ram', precio_base: 400, stock: 10 }
    ];

    test('debe filtrar productos por presupuesto', () => {
      const contexto = {
        presupuesto: { min: 2000, max: 3000 }
      };

      const filtrados = asistenteIA.filtrarProductosRelevantes(productosEjemplo, contexto);

      // Max por componente = 3000 / 4 = 750
      const preciosMaximos = filtrados.map(p => p.precio_base);
      expect(Math.max(...preciosMaximos)).toBeLessThanOrEqual(750);
    });

    test('debe limitar a top 3 por categoría', () => {
      const contexto = {
        presupuesto: { min: 1000, max: 5000 }
      };

      const filtrados = asistenteIA.filtrarProductosRelevantes(productosEjemplo, contexto);

      // Contar productos por categoría
      const porCategoria = {};
      filtrados.forEach(p => {
        porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1;
      });

      // Cada categoría debe tener máximo 3 productos
      Object.values(porCategoria).forEach(count => {
        expect(count).toBeLessThanOrEqual(3);
      });
    });

    test('debe priorizar productos con stock', () => {
      const contexto = {
        presupuesto: { min: 1000, max: 5000 }
      };

      const filtrados = asistenteIA.filtrarProductosRelevantes(productosEjemplo, contexto);

      // Verificar que productos con stock aparecen primero en cada categoría
      const procesadores = filtrados.filter(p => p.categoria === 'procesador');
      if (procesadores.length > 1) {
        expect(procesadores[0].stock).toBeGreaterThanOrEqual(procesadores[procesadores.length - 1].stock);
      }
    });

    test('debe retornar todos los productos si no hay presupuesto', () => {
      const contexto = {};

      const filtrados = asistenteIA.filtrarProductosRelevantes(productosEjemplo, contexto);

      // Debe haber productos de todas las categorías (limitado a top 3)
      const categorias = [...new Set(filtrados.map(p => p.categoria))];
      expect(categorias.length).toBeGreaterThan(0);
    });
  });

  describe('generarRecomendacionBasica (fallback)', () => {
    const productosEjemplo = [
      { id: 1, categoria: 'procesador', socket: 'AM5', precio_base: 500, stock: 10 },
      { id: 2, categoria: 'placa_madre', socket: 'AM5', ram_type: 'DDR5', precio_base: 300, stock: 5 },
      { id: 3, categoria: 'ram', ram_type: 'DDR5', precio_base: 200, stock: 8 },
      { id: 4, categoria: 'almacenamiento', precio_base: 150, stock: 12 },
      { id: 5, categoria: 'gpu', precio_base: 800, stock: 3 },
      { id: 6, categoria: 'fuente', precio_base: 100, stock: 15 },
      { id: 7, categoria: 'case', precio_base: 80, stock: 10 }
    ];

    test('debe generar configuración básica sin IA', () => {
      const contexto = {
        presupuesto: { min: 3000, max: 4000 },
        usosPrincipales: ['oficina']
      };

      const recomendacion = asistenteIA.generarRecomendacionBasica(contexto, productosEjemplo);

      expect(recomendacion).toHaveProperty('componentes');
      expect(recomendacion).toHaveProperty('explicacion');
      expect(recomendacion).toHaveProperty('advertencias');
      expect(recomendacion.explicacion).toContain('sin IA');
    });

    test('debe seleccionar procesador dentro del presupuesto', () => {
      const contexto = {
        presupuesto: { min: 3000, max: 4000 },
        usosPrincipales: ['oficina']
      };

      const recomendacion = asistenteIA.generarRecomendacionBasica(contexto, productosEjemplo);

      if (recomendacion.componentes.procesador) {
        expect(recomendacion.componentes.procesador.precio_base).toBeLessThan(4000 * 0.25);
      }
    });

    test('debe seleccionar placa madre compatible con procesador', () => {
      const contexto = {
        presupuesto: { min: 3000, max: 4000 },
        usosPrincipales: ['oficina']
      };

      const recomendacion = asistenteIA.generarRecomendacionBasica(contexto, productosEjemplo);

      if (recomendacion.componentes.procesador && recomendacion.componentes.placa_madre) {
        expect(recomendacion.componentes.placa_madre.socket).toBe(
          recomendacion.componentes.procesador.socket
        );
      }
    });

    test('debe seleccionar RAM compatible con placa madre', () => {
      const contexto = {
        presupuesto: { min: 3000, max: 4000 },
        usosPrincipales: ['oficina']
      };

      const recomendacion = asistenteIA.generarRecomendacionBasica(contexto, productosEjemplo);

      if (recomendacion.componentes.placa_madre && recomendacion.componentes.ram) {
        expect(recomendacion.componentes.ram[0].ram_type).toBe(
          recomendacion.componentes.placa_madre.ram_type
        );
      }
    });

    test('debe incluir GPU para gaming', () => {
      const contexto = {
        presupuesto: { min: 3000, max: 4000 },
        usosPrincipales: ['gaming']
      };

      const recomendacion = asistenteIA.generarRecomendacionBasica(contexto, productosEjemplo);

      expect(recomendacion.componentes.gpu).toBeDefined();
    });

    test('debe incluir GPU para diseño', () => {
      const contexto = {
        presupuesto: { min: 3000, max: 4000 },
        usosPrincipales: ['diseño']
      };

      const recomendacion = asistenteIA.generarRecomendacionBasica(contexto, productosEjemplo);

      expect(recomendacion.componentes.gpu).toBeDefined();
    });

    test('puede omitir GPU para oficina', () => {
      const contexto = {
        presupuesto: { min: 1000, max: 1500 },
        usosPrincipales: ['oficina']
      };

      const recomendacion = asistenteIA.generarRecomendacionBasica(contexto, productosEjemplo);

      // GPU es opcional para oficina
      expect(recomendacion.componentes).toBeDefined();
    });
  });

  describe('validarRecomendacion', () => {
    const productosEjemplo = [
      { id: 1, categoria: 'procesador', nombre: 'Ryzen 5', stock: 10, disponible_a_pedido: false },
      { id: 2, categoria: 'placa_madre', nombre: 'B550', stock: 5, disponible_a_pedido: false },
      { id: 3, categoria: 'ram', nombre: 'DDR4 16GB', stock: 0, disponible_a_pedido: true, tiempo_entrega_dias: 7 }
    ];

    test('debe validar que productos existen', async () => {
      const recomendacionIA = {
        procesador: 1,
        placa_madre: 2,
        ram: [3],
        explicacion: 'Config recomendada'
      };

      const validada = await asistenteIA.validarRecomendacion(recomendacionIA, productosEjemplo);

      expect(validada.componentes.procesador).toBeDefined();
      expect(validada.componentes.placa_madre).toBeDefined();
      expect(validada.componentes.ram).toHaveLength(1);
    });

    test('debe filtrar productos que no existen', async () => {
      const recomendacionIA = {
        procesador: 1,
        placa_madre: 999, // No existe
        explicacion: 'Config recomendada'
      };

      const validada = await asistenteIA.validarRecomendacion(recomendacionIA, productosEjemplo);

      expect(validada.componentes.procesador).toBeDefined();
      expect(validada.componentes.placa_madre).toBeUndefined();
    });

    test('debe advertir sobre productos a pedido', async () => {
      const recomendacionIA = {
        ram: [3], // A pedido
        explicacion: 'Config recomendada'
      };

      const validada = await asistenteIA.validarRecomendacion(recomendacionIA, productosEjemplo);

      expect(validada.advertencias.length).toBeGreaterThan(0);
      expect(validada.advertencias[0]).toContain('A pedido');
      expect(validada.advertencias[0]).toContain('7');
    });

    test('debe manejar arrays de IDs', async () => {
      const recomendacionIA = {
        ram: [3, 999], // Uno existe, otro no
        explicacion: 'Config recomendada'
      };

      const validada = await asistenteIA.validarRecomendacion(recomendacionIA, productosEjemplo);

      expect(validada.componentes.ram).toHaveLength(1);
      expect(validada.componentes.ram[0].id).toBe(3);
    });

    test('debe preservar explicación', async () => {
      const recomendacionIA = {
        procesador: 1,
        explicacion: 'Configuración óptima para gaming'
      };

      const validada = await asistenteIA.validarRecomendacion(recomendacionIA, productosEjemplo);

      expect(validada.explicacion).toBe('Configuración óptima para gaming');
    });
  });

  describe('obtenerEstadisticas', () => {
    test('debe retornar estadísticas de uso', () => {
      const stats = asistenteIA.obtenerEstadisticas();

      expect(stats).toHaveProperty('llamadas');
      expect(stats).toHaveProperty('costoEstimado');
      expect(stats).toHaveProperty('promedioTokens');
      expect(stats).toHaveProperty('cacheSize');
      expect(typeof stats.llamadas).toBe('number');
      expect(typeof stats.costoEstimado).toBe('string');
    });
  });
});
