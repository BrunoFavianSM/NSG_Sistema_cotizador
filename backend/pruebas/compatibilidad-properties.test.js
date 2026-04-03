const fc = require('fast-check');
const { pool, ejecutarQuery } = require('../src/configuracion/baseDatos');
const servicioCompatibilidad = require('../src/servicios/servicioCompatibilidad');

/**
 * Feature: sistema-cotizacion-automatizada
 * Property Tests para Motor de Compatibilidad
 * 
 * Property 5: Filtrado de placas madre por socket
 * Property 6: Validación detecta incompatibilidades
 * Property 7: Configuraciones compatibles pasan validación
 */

// Generadores (Arbitraries)
const generadorSocket = () => fc.constantFrom('AM5', 'LGA1700', 'AM4', 'LGA1200');
const generadorRamType = () => fc.constantFrom('DDR4', 'DDR5');
const generadorFormFactor = () => fc.constantFrom('ATX', 'Micro-ATX', 'Mini-ITX');

const generadorProcesador = () => fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  nombre: fc.string({ minLength: 5, maxLength: 50 }),
  categoria: fc.constant('procesador'),
  socket: generadorSocket(),
  tdp: fc.integer({ min: 35, max: 250 }),
  precio_base: fc.float({ min: 100, max: 3000 }),
  stock: fc.integer({ min: 0, max: 100 })
});

const generadorPlacaMadre = (socket = null) => fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  nombre: fc.string({ minLength: 5, maxLength: 50 }),
  categoria: fc.constant('placa_madre'),
  socket: socket ? fc.constant(socket) : generadorSocket(),
  ram_type: generadorRamType(),
  form_factor: generadorFormFactor(),
  precio_base: fc.float({ min: 80, max: 800 }),
  stock: fc.integer({ min: 0, max: 100 })
});

const generadorRAM = (ramType = null) => fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  nombre: fc.string({ minLength: 5, maxLength: 50 }),
  categoria: fc.constant('ram'),
  ram_type: ramType ? fc.constant(ramType) : generadorRamType(),
  precio_base: fc.float({ min: 50, max: 500 }),
  stock: fc.integer({ min: 0, max: 100 })
});

const generadorCase = (soportaFormFactors = null) => {
  let descripcion;
  if (soportaFormFactors) {
    // Generar descripción que incluya los form factors especificados
    descripcion = fc.constant(`Case que soporta ${soportaFormFactors.join(', ')}`);
  } else {
    descripcion = fc.constantFrom(
      'Case ATX con soporte para Micro-ATX y Mini-ITX',
      'Case Micro-ATX compatible',
      'Case Mini-ITX compacto',
      'Case ATX full tower'
    );
  }
  
  return fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    nombre: fc.string({ minLength: 5, maxLength: 50 }),
    categoria: fc.constant('case'),
    descripcion_tecnica: descripcion,
    precio_base: fc.float({ min: 40, max: 400 }),
    stock: fc.integer({ min: 0, max: 100 })
  });
};

const generadorFuente = (wattage = null) => fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  nombre: fc.string({ minLength: 5, maxLength: 50 }),
  categoria: fc.constant('fuente'),
  wattage: wattage ? fc.constant(wattage) : fc.integer({ min: 300, max: 1200 }),
  precio_base: fc.float({ min: 50, max: 500 }),
  stock: fc.integer({ min: 0, max: 100 })
});

const generadorGPU = () => fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  nombre: fc.string({ minLength: 5, maxLength: 50 }),
  categoria: fc.constant('gpu'),
  tdp: fc.integer({ min: 75, max: 450 }),
  precio_base: fc.float({ min: 200, max: 5000 }),
  stock: fc.integer({ min: 0, max: 100 })
});

describe('Property 5: Filtrado de placas madre por socket', () => {
  /**
   * Para cualquier procesador con socket S, filtrar placas madre debe retornar 
   * únicamente placas con socket S.
   * 
   * **Validates: Requirements 3.2**
   */
  
  test('Filtrado retorna solo placas con socket compatible', () => {
    fc.assert(
      fc.property(
        generadorSocket(),
        fc.array(generadorPlacaMadre(), { minLength: 5, maxLength: 20 }),
        (socketProcesador, placasMadre) => {
          // Filtrar placas madre por socket
          const placasFiltradas = servicioCompatibilidad.filtrarPlacasPorSocket(
            placasMadre,
            socketProcesador
          );
          
          // Todas las placas filtradas deben tener el socket correcto
          placasFiltradas.forEach(placa => {
            expect(placa.socket).toBe(socketProcesador);
          });
          
          // Verificar que no se perdieron placas compatibles
          const placasCompatibles = placasMadre.filter(p => p.socket === socketProcesador);
          expect(placasFiltradas.length).toBe(placasCompatibles.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Filtrado sin socket retorna todas las placas', () => {
    fc.assert(
      fc.property(
        fc.array(generadorPlacaMadre(), { minLength: 1, maxLength: 20 }),
        (placasMadre) => {
          const placasFiltradas = servicioCompatibilidad.filtrarPlacasPorSocket(
            placasMadre,
            null
          );
          
          // Sin socket especificado, debe retornar todas
          expect(placasFiltradas.length).toBe(placasMadre.length);
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Property 6: Validación detecta incompatibilidades', () => {
  /**
   * Para cualquier configuración con incompatibilidad conocida, la validación 
   * debe retornar compatible=false con errores descriptivos.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  
  test('Detecta incompatibilidad de socket procesador-placa', () => {
    fc.assert(
      fc.property(
        generadorSocket(),
        generadorSocket(),
        (socket1, socket2) => {
          fc.pre(socket1 !== socket2); // Solo casos donde son diferentes
          
          const procesador = { socket: socket1, tdp: 65 };
          const placaMadre = { socket: socket2, ram_type: 'DDR4', form_factor: 'ATX' };
          
          const componentes = {
            procesador,
            placa_madre: placaMadre
          };
          
          const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
          
          // Debe detectar incompatibilidad
          expect(resultado.compatible).toBe(false);
          expect(resultado.errores.length).toBeGreaterThan(0);
          expect(resultado.errores.some(e => e.includes('Socket incompatible'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Detecta incompatibilidad de tipo RAM', () => {
    fc.assert(
      fc.property(
        generadorRamType(),
        generadorRamType(),
        generadorSocket(),
        (ramType1, ramType2, socket) => {
          fc.pre(ramType1 !== ramType2); // Solo casos donde son diferentes
          
          const placaMadre = { 
            socket, 
            ram_type: ramType1, 
            form_factor: 'ATX' 
          };
          const ram = [{ ram_type: ramType2 }];
          
          const componentes = {
            placa_madre: placaMadre,
            ram
          };
          
          const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
          
          // Debe detectar incompatibilidad
          expect(resultado.compatible).toBe(false);
          expect(resultado.errores.length).toBeGreaterThan(0);
          expect(resultado.errores.some(e => e.includes('RAM incompatible'))).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Detecta incompatibilidad de form factor placa-case', () => {
    // Test específico: Placa ATX con case Mini-ITX (incompatible)
    const placaMadre = { 
      socket: 'AM5', 
      ram_type: 'DDR4', 
      form_factor: 'ATX' 
    };
    const caseGabinete = { 
      descripcion_tecnica: 'Case Mini-ITX compacto' 
    };
    
    const componentes = {
      placa_madre: placaMadre,
      case: caseGabinete
    };
    
    const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
    
    // Debe detectar incompatibilidad (ATX no cabe en Mini-ITX)
    expect(resultado.compatible).toBe(false);
    expect(resultado.errores.length).toBeGreaterThan(0);
    expect(resultado.errores.some(e => e.includes('Case no soporta'))).toBe(true);
  });

  test('Detecta fuente insuficiente', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 200 }), // Fuente pequeña
        fc.integer({ min: 150, max: 250 }), // TDP procesador alto
        fc.integer({ min: 200, max: 400 }), // TDP GPU alto
        (wattajeFuente, tdpProcesador, tdpGPU) => {
          const componentes = {
            procesador: { tdp: tdpProcesador, socket: 'AM5' },
            gpu: { tdp: tdpGPU },
            placa_madre: { socket: 'AM5', ram_type: 'DDR5', form_factor: 'ATX' },
            ram: [{ ram_type: 'DDR5' }],
            almacenamiento: {},
            fuente: { wattage: wattajeFuente }
          };
          
          const consumoTotal = servicioCompatibilidad.calcularConsumoTotal(componentes);
          
          // Si la fuente es insuficiente
          if (wattajeFuente < consumoTotal) {
            const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
            
            expect(resultado.compatible).toBe(false);
            expect(resultado.errores.some(e => e.includes('Fuente insuficiente'))).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Detecta componentes a pedido', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }), // Días de entrega
        (diasEntrega) => {
          const componentes = {
            procesador: { 
              socket: 'AM5', 
              tdp: 65,
              stock: 0, 
              disponible_a_pedido: true,
              tiempo_entrega_dias: diasEntrega
            },
            placa_madre: { 
              socket: 'AM5', 
              ram_type: 'DDR5', 
              form_factor: 'ATX',
              stock: 10
            }
          };
          
          const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
          
          // Debe incluir advertencia sobre componentes a pedido
          expect(resultado.advertencias.length).toBeGreaterThan(0);
          expect(resultado.advertencias.some(a => 
            a.includes('Componentes a pedido') && a.includes(`${diasEntrega} días`)
          )).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Property 7: Configuraciones compatibles pasan validación', () => {
  /**
   * Para cualquier configuración donde todos los componentes son compatibles, 
   * la validación debe retornar compatible=true.
   * 
   * **Validates: Requirements 3.3**
   */
  
  test('Configuración compatible pasa validación', () => {
    fc.assert(
      fc.property(
        generadorSocket(),
        generadorRamType(),
        generadorFormFactor(),
        fc.integer({ min: 400, max: 1200 }), // Fuente suficiente
        (socket, ramType, formFactor, wattajeFuente) => {
          // Crear componentes compatibles
          const procesador = { 
            socket, 
            tdp: 65,
            stock: 10
          };
          
          const placaMadre = { 
            socket, 
            ram_type: ramType, 
            form_factor: formFactor,
            stock: 10
          };
          
          const ram = [{ ram_type: ramType, stock: 10 }];
          
          const gpu = { tdp: 150, stock: 10 };
          
          const almacenamiento = { stock: 10 };
          
          const fuente = { wattage: wattajeFuente, stock: 10 };
          
          // Case que soporta el form factor de la placa
          let descripcionCase;
          if (formFactor === 'ATX') {
            descripcionCase = 'Case ATX con soporte para Micro-ATX y Mini-ITX';
          } else if (formFactor === 'Micro-ATX') {
            descripcionCase = 'Case Micro-ATX compatible con Mini-ITX';
          } else {
            descripcionCase = 'Case Mini-ITX compacto';
          }
          
          const caseGabinete = { 
            descripcion_tecnica: descripcionCase,
            stock: 10
          };
          
          const componentes = {
            procesador,
            placa_madre: placaMadre,
            ram,
            gpu,
            almacenamiento,
            fuente,
            case: caseGabinete
          };
          
          const consumoTotal = servicioCompatibilidad.calcularConsumoTotal(componentes);
          
          // Solo validar si la fuente es suficiente
          if (wattajeFuente >= consumoTotal) {
            const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
            
            // Debe ser compatible
            expect(resultado.compatible).toBe(true);
            expect(resultado.errores.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Configuración mínima compatible pasa validación', () => {
    fc.assert(
      fc.property(
        generadorSocket(),
        generadorRamType(),
        (socket, ramType) => {
          // Configuración mínima: solo procesador y placa madre
          const componentes = {
            procesador: { socket, tdp: 65 },
            placa_madre: { socket, ram_type: ramType, form_factor: 'ATX' }
          };
          
          const resultado = servicioCompatibilidad.validarConfiguracion(componentes);
          
          // Debe ser compatible (sin errores)
          expect(resultado.compatible).toBe(true);
          expect(resultado.errores.length).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Validación de socket individual es correcta', () => {
    fc.assert(
      fc.property(
        generadorSocket(),
        (socket) => {
          const procesador = { socket };
          const placaMadre = { socket };
          
          const esCompatible = servicioCompatibilidad.validarSocket(procesador, placaMadre);
          
          expect(esCompatible).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Validación de tipo RAM individual es correcta', () => {
    fc.assert(
      fc.property(
        generadorRamType(),
        (ramType) => {
          const placaMadre = { ram_type: ramType };
          const modulosRAM = [{ ram_type: ramType }];
          
          const esCompatible = servicioCompatibilidad.validarTipoRAM(placaMadre, modulosRAM);
          
          expect(esCompatible).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Validación de form factor individual es correcta', () => {
    fc.assert(
      fc.property(
        generadorFormFactor(),
        (formFactor) => {
          const placaMadre = { form_factor: formFactor };
          
          // Case ATX soporta todos los form factors
          const caseGabinete = { 
            descripcion_tecnica: 'Case ATX con soporte para Micro-ATX y Mini-ITX' 
          };
          
          const esCompatible = servicioCompatibilidad.validarFormFactor(placaMadre, caseGabinete);
          
          expect(esCompatible).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Validación de potencia con fuente suficiente', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 150 }), // TDP procesador
        fc.integer({ min: 100, max: 300 }), // TDP GPU
        (tdpProcesador, tdpGPU) => {
          const componentes = {
            procesador: { tdp: tdpProcesador },
            gpu: { tdp: tdpGPU },
            placa_madre: {},
            ram: [{}],
            almacenamiento: {}
          };
          
          const consumoTotal = servicioCompatibilidad.calcularConsumoTotal(componentes);
          
          // Fuente con margen suficiente
          componentes.fuente = { wattage: consumoTotal + 100 };
          
          const resultado = servicioCompatibilidad.validarPotencia(componentes);
          
          expect(resultado.suficiente).toBe(true);
          expect(resultado.consumoTotal).toBe(consumoTotal);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Cálculo de consumo eléctrico', () => {
  test('Consumo total incluye todos los componentes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 35, max: 250 }), // TDP procesador
        fc.integer({ min: 75, max: 450 }), // TDP GPU
        fc.integer({ min: 1, max: 4 }),    // Cantidad de módulos RAM
        (tdpProcesador, tdpGPU, cantidadRAM) => {
          const componentes = {
            procesador: { tdp: tdpProcesador },
            gpu: { tdp: tdpGPU },
            placa_madre: {},
            ram: Array(cantidadRAM).fill({}),
            almacenamiento: {}
          };
          
          const consumoTotal = servicioCompatibilidad.calcularConsumoTotal(componentes);
          
          // Consumo mínimo esperado (sin margen del 20%)
          const consumoBase = tdpProcesador + tdpGPU + 50 + (cantidadRAM * 5) + 10 + 20;
          const consumoEsperado = Math.ceil(consumoBase * 1.2);
          
          expect(consumoTotal).toBe(consumoEsperado);
          expect(consumoTotal).toBeGreaterThan(consumoBase);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Consumo sin GPU es menor', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 35, max: 250 }),
        (tdpProcesador) => {
          const componentesConGPU = {
            procesador: { tdp: tdpProcesador },
            gpu: { tdp: 200 },
            placa_madre: {},
            ram: [{}],
            almacenamiento: {}
          };
          
          const componentesSinGPU = {
            procesador: { tdp: tdpProcesador },
            placa_madre: {},
            ram: [{}],
            almacenamiento: {}
          };
          
          const consumoConGPU = servicioCompatibilidad.calcularConsumoTotal(componentesConGPU);
          const consumoSinGPU = servicioCompatibilidad.calcularConsumoTotal(componentesSinGPU);
          
          expect(consumoConGPU).toBeGreaterThan(consumoSinGPU);
        }
      ),
      { numRuns: 30 }
    );
  });
});

describe('Parseo de form factors', () => {
  test('Detecta ATX correctamente', () => {
    const descripciones = [
      'Case ATX full tower',
      'Gabinete ATX con ventilación',
      'Case atx espacioso'
    ];
    
    descripciones.forEach(desc => {
      const formFactors = servicioCompatibilidad.parsearFormFactors(desc);
      expect(formFactors).toContain('ATX');
      // ATX soporta también los más pequeños
      expect(formFactors).toContain('Micro-ATX');
      expect(formFactors).toContain('Mini-ITX');
    });
  });

  test('Detecta Micro-ATX correctamente', () => {
    const descripciones = [
      'Case Micro-ATX compacto',
      'Gabinete micro-atx',
      'Case MICRO-ATX'
    ];
    
    descripciones.forEach(desc => {
      const formFactors = servicioCompatibilidad.parsearFormFactors(desc);
      expect(formFactors).toContain('Micro-ATX');
    });
  });

  test('Detecta Mini-ITX correctamente', () => {
    const descripciones = [
      'Case Mini-ITX pequeño',
      'Gabinete mini-itx',
      'Case MINI-ITX ultra compacto'
    ];
    
    descripciones.forEach(desc => {
      const formFactors = servicioCompatibilidad.parsearFormFactors(desc);
      expect(formFactors).toContain('Mini-ITX');
    });
  });

  test('Default es ATX si no se especifica', () => {
    const descripciones = [
      'Case genérico',
      'Gabinete estándar',
      ''
    ];
    
    descripciones.forEach(desc => {
      const formFactors = servicioCompatibilidad.parsearFormFactors(desc);
      expect(formFactors).toContain('ATX');
    });
  });
});
