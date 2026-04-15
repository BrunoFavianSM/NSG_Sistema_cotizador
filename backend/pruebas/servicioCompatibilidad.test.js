/**
 * Tests para el Servicio de Compatibilidad
 * Valida: Requisitos 3.1, 3.2, 3.3, 3.4
 */

const servicioCompatibilidad = require('../src/servicios/servicioCompatibilidad');

describe('Servicio de Compatibilidad', () => {
  describe('Validación de Socket', () => {
    test('Socket incompatible detectado', () => {
      const procesador = { socket: 'AM5' };
      const placaMadre = { socket: 'LGA1700' };
      
      const resultado = servicioCompatibilidad.validarSocket(procesador, placaMadre);
      
      expect(resultado).toBe(false);
    });

    test('Socket compatible detectado', () => {
      const procesador = { socket: 'AM5' };
      const placaMadre = { socket: 'AM5' };
      
      const resultado = servicioCompatibilidad.validarSocket(procesador, placaMadre);
      
      expect(resultado).toBe(true);
    });

    test('Filtrado de placas por socket', () => {
      const placas = [
        { id: 1, nombre: 'Placa AM5', socket: 'AM5' },
        { id: 2, nombre: 'Placa LGA1700', socket: 'LGA1700' },
        { id: 3, nombre: 'Placa AM5 2', socket: 'AM5' }
      ];
      
      const filtradas = servicioCompatibilidad.filtrarPlacasPorSocket(placas, 'AM5');
      
      expect(filtradas).toHaveLength(2);
      expect(filtradas.every(p => p.socket === 'AM5')).toBe(true);
    });
  });

  describe('Validación de Tipo RAM', () => {
    test('RAM incompatible detectada', () => {
      const placaMadre = { ram_type: 'DDR4' };
      const modulosRAM = [{ ram_type: 'DDR5' }];
      
      const resultado = servicioCompatibilidad.validarTipoRAM(placaMadre, modulosRAM);
      
      expect(resultado).toBe(false);
    });

    test('RAM compatible detectada', () => {
      const placaMadre = { ram_type: 'DDR5' };
      const modulosRAM = [{ ram_type: 'DDR5' }];
      
      const resultado = servicioCompatibilidad.validarTipoRAM(placaMadre, modulosRAM);
      
      expect(resultado).toBe(true);
    });
  });

  describe('Validación de Form Factor', () => {
    test('Form factor incompatible detectado', () => {
      const placaMadre = { form_factor: 'ATX' };
      const caseGabinete = { descripcion_tecnica: 'Case Mini-ITX compacto' };
      
      const resultado = servicioCompatibilidad.validarFormFactor(placaMadre, caseGabinete);
      
      expect(resultado).toBe(false);
    });

    test('Form factor compatible detectado', () => {
      const placaMadre = { form_factor: 'Micro-ATX' };
      const caseGabinete = { descripcion_tecnica: 'Case ATX con soporte Micro-ATX y Mini-ITX' };
      
      const resultado = servicioCompatibilidad.validarFormFactor(placaMadre, caseGabinete);
      
      expect(resultado).toBe(true);
    });

    test('Parseo de form factors desde descripción', () => {
      const desc1 = 'Case ATX con soporte para Micro-ATX';
      const ff1 = servicioCompatibilidad.parsearFormFactors(desc1);
      expect(ff1).toContain('ATX');
      expect(ff1).toContain('Micro-ATX');
      expect(ff1).toContain('Mini-ITX');

      const desc2 = 'Case Mini-ITX compacto';
      const ff2 = servicioCompatibilidad.parsearFormFactors(desc2);
      expect(ff2).toContain('Mini-ITX');
      expect(ff2).not.toContain('ATX');
    });
  });

  describe('Cálculo de Consumo Eléctrico', () => {
    test('Consumo total calculado correctamente', () => {
      const componentes = {
        procesador: { tdp: 65 },
        gpu: { tdp: 250 },
        placa_madre: {},
        ram: [{}, {}], // 2 módulos
        almacenamiento: {}
      };
      
      const consumo = servicioCompatibilidad.calcularConsumoTotal(componentes);
      
      // 65 + 250 + 35 + 8 + 6 + 20 = 384W
      // Con margen 25%: 384 * 1.25 = 480W
      expect(consumo).toBe(480);
    });

    test('Fuente insuficiente detectada', () => {
      const componentes = {
        procesador: { tdp: 65 },
        gpu: { tdp: 250 },
        placa_madre: {},
        ram: [{}],
        almacenamiento: {},
        fuente: { wattage: 300 }
      };
      
      const resultado = servicioCompatibilidad.validarPotencia(componentes);
      
      expect(resultado.suficiente).toBe(false);
      expect(resultado.consumoTotal).toBeGreaterThan(resultado.wattajeFuente);
    });

    test('Fuente suficiente detectada', () => {
      const componentes = {
        procesador: { tdp: 65 },
        gpu: { tdp: 150 },
        placa_madre: {},
        ram: [{}],
        almacenamiento: {},
        fuente: { wattage: 500 }
      };
      
      const resultado = servicioCompatibilidad.validarPotencia(componentes);
      
      expect(resultado.suficiente).toBe(true);
    });
  });

  describe('Identificación de Componentes a Pedido', () => {
    test('Identifica componentes a pedido correctamente', () => {
      const componentes = {
        procesador: { stock: 5, disponible_a_pedido: false },
        placa_madre: { stock: 0, disponible_a_pedido: true, tiempo_entrega_dias: 7 },
        ram: [
          { stock: 0, disponible_a_pedido: true, tiempo_entrega_dias: 5 }
        ],
        gpu: { stock: 0, disponible_a_pedido: false }
      };
      
      const aPedido = servicioCompatibilidad.identificarComponentesAPedido(componentes);
      
      expect(aPedido).toHaveLength(2);
      expect(aPedido.every(c => c.stock === 0 && c.disponible_a_pedido)).toBe(true);
    });
  });

  describe('Validación Completa de Configuración', () => {
    test('Configuración compatible pasa validación', () => {
      const componentes = {
        procesador: { socket: 'AM5', tdp: 65 },
        placa_madre: { socket: 'AM5', ram_type: 'DDR5', form_factor: 'ATX' },
        ram: [{ ram_type: 'DDR5' }],
        gpu: { tdp: 150 },
        almacenamiento: {},
        fuente: { wattage: 600 },
        case: { descripcion_tecnica: 'Case ATX' }
      };
      
      const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
      
      expect(resultado.compatible).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    test('Configuración incompatible detecta errores', () => {
      const componentes = {
        procesador: { socket: 'AM5', tdp: 65 },
        placa_madre: { socket: 'LGA1700', ram_type: 'DDR5', form_factor: 'ATX' },
        ram: [{ ram_type: 'DDR4' }],
        gpu: { tdp: 250 },
        fuente: { wattage: 300 },
        case: { descripcion_tecnica: 'Case Mini-ITX' }
      };
      
      const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
      
      expect(resultado.compatible).toBe(false);
      expect(resultado.errores.length).toBeGreaterThan(0);
      expect(resultado.errores.some(e => e.includes('Socket incompatible'))).toBe(true);
      expect(resultado.errores.some(e => e.includes('RAM incompatible'))).toBe(true);
      expect(resultado.errores.some(e => e.includes('Case no soporta'))).toBe(true);
      expect(resultado.errores.some(e => e.includes('Fuente insuficiente'))).toBe(true);
    });

    test('Advertencias para componentes a pedido', () => {
      const componentes = {
        procesador: { socket: 'AM5', tdp: 65, stock: 0, disponible_a_pedido: true, tiempo_entrega_dias: 7 },
        placa_madre: { socket: 'AM5', ram_type: 'DDR5', form_factor: 'ATX' },
        ram: [{ ram_type: 'DDR5' }],
        fuente: { wattage: 600 }
      };
      
      const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
      
      expect(resultado.compatible).toBe(true);
      expect(resultado.advertencias.length).toBeGreaterThan(0);
      expect(resultado.advertencias.some(a => a.includes('Componentes a pedido'))).toBe(true);
    });

    test('Advertencia para margen ajustado de fuente', () => {
      const componentes = {
        procesador: { tdp: 65 },
        gpu: { tdp: 200 },
        placa_madre: {},
        ram: [{}],
        almacenamiento: {},
        fuente: { wattage: 400 } // Justo suficiente pero sin margen ideal
      };
      
      const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
      
      // Consumo: 65 + 200 + 50 + 5 + 10 + 20 = 350W * 1.2 = 420W
      // Fuente: 400W < 420W (error) o 400W < 350W * 1.2 (advertencia)
      expect(resultado.errores.length > 0 || resultado.advertencias.length > 0).toBe(true);
    });
  });
});
