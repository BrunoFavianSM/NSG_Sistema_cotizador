/**
 * Feature: sistema-cotizacion-automatizada
 * Property Tests para Cotizaciones
 * 
 * Property 13: Cálculo de precio total con margen
 * Property 14: Margen no afecta cotizaciones existentes
 * Property 16: Código ticket es único y válido
 * Property 18: Persistencia completa de cotización
 * Property 19: Asociación condicional con cliente
 * Property 20: Estados de cotización son válidos
 * Property 21: Validación retorna comparación de precios
 * Property 22: Marcar como reclamada actualiza estado
 * Property 26: Historial retorna todas las cotizaciones
 * Property 28: Código ticket es secuencial por año
 */

const fc = require('fast-check');
const { pool, ejecutarQuery, ejecutarTransaccion } = require('../src/configuracion/baseDatos');
const {
  crearCotizacion,
  consultarCotizacion,
  validarCotizacion,
  marcarComoReclamada,
  consultarHistorialCliente,
  obtenerMargenGanancia,
  generarCodigoTicket,
  buscarOCrearCliente,
  calcularPrecioTotal
} = require('../src/controladores/controladorCotizaciones');

// ============================================
// Generadores (Arbitraries)
// ============================================

/**
 * Genera un componente de producto válido
 */
const generadorComponente = () => fc.record({
  id_producto: fc.integer({ min: 1, max: 1000 }),
  cantidad: fc.option(fc.integer({ min: 1, max: 10 }), { nil: 1 })
});

/**
 * Genera un array de componentes (1-7 componentes)
 */
const generadorComponentes = () => fc.array(
  generadorComponente(),
  { minLength: 1, maxLength: 7 }
);

/**
 * Genera un margen de ganancia válido (0-100%)
 */
const generadorMargen = () => fc.float({ min: 0, max: 100, noNaN: true })
  .map(n => parseFloat(n.toFixed(2)));

/**
 * Genera un email válido
 */
const generadorEmail = () => fc.emailAddress();

/**
 * Genera un nombre de cliente
 */
const generadorNombre = () => fc.string({ minLength: 3, maxLength: 50 })
  .filter(s => s.trim().length >= 3);

/**
 * Genera un teléfono válido
 */
const generadorTelefono = () => fc.stringOf(
  fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
  { minLength: 9, maxLength: 15 }
);

/**
 * Genera datos de cotización completos
 */
const generadorDatosCotizacion = () => fc.record({
  componentes: generadorComponentes(),
  email_cliente: fc.option(generadorEmail(), { nil: null }),
  nombre_cliente: fc.option(generadorNombre(), { nil: null }),
  telefono_cliente: fc.option(generadorTelefono(), { nil: null })
});

/**
 * Genera un estado de cotización válido
 */
const generadorEstado = () => fc.constantFrom(
  'Pendiente',
  'Completada',
  'Caducada',
  'Reclamada'
);

// ============================================
// Utilidades de Test
// ============================================

/**
 * Limpia las tablas relacionadas con cotizaciones
 */
async function limpiarCotizaciones() {
  await ejecutarQuery('DELETE FROM detalle_cotizacion');
  await ejecutarQuery('DELETE FROM cotizaciones');
  await ejecutarQuery('DELETE FROM usuarios_clientes');
  await ejecutarQuery('DELETE FROM productos');
  // Resetear secuencia del año actual para que los códigos sean predecibles
  const anio = new Date().getFullYear();
  const seqName = `seq_ticket_${anio}`;
  try {
    await ejecutarQuery(`ALTER SEQUENCE ${seqName} RESTART WITH 1`);
  } catch (e) {
    // La secuencia puede no existir aún, se creará en la primera llamada
  }
}

/**
 * Crea productos de prueba en la base de datos
 */
async function crearProductosPrueba(cantidad = 10) {
  const productos = [];
  const categorias = ['procesador', 'placa_madre', 'ram', 'almacenamiento', 'gpu', 'fuente', 'case'];
  
  for (let i = 0; i < cantidad; i++) {
    const resultado = await ejecutarQuery(
      `INSERT INTO productos (nombre, categoria, precio_base, stock, disponible_a_pedido)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, categoria, precio_base, stock, disponible_a_pedido`,
      [
        `Producto Test ${i + 1}`,
        categorias[i % categorias.length],
        100 + (i * 50),
        10,
        false
      ]
    );
    productos.push(resultado.rows[0]);
  }
  
  return productos;
}

/**
 * Configura el margen de ganancia en la base de datos
 */
async function configurarMargen(margen) {
  await ejecutarQuery(
    `UPDATE configuracion SET valor = $1 WHERE clave = 'margen_ganancia'`,
    [margen.toString()]
  );
}

/**
 * Mock de request/response para controladores
 */
function crearMockReqRes(body = {}, params = {}, query = {}) {
  const req = {
    body,
    params,
    query
  };
  
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
  
  return { req, res };
}

/**
 * Inserta una cotización directamente en la base de datos
 */
async function insertarCotizacionDirecta(datos) {
  const codigoTicket = await generarCodigoTicket();
  
  const resultado = await ejecutarQuery(
    `INSERT INTO cotizaciones (
      codigo_ticket, id_cliente, fecha_validez, precio_total,
      margen_aplicado, estado
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      codigoTicket,
      datos.id_cliente || null,
      datos.fecha_validez || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      datos.precio_total,
      datos.margen_aplicado,
      datos.estado || 'Pendiente'
    ]
  );
  
  return resultado.rows[0];
}

/**
 * Obtiene una cotización por código ticket
 */
async function obtenerCotizacionPorTicket(codigoTicket) {
  const resultado = await ejecutarQuery(
    'SELECT * FROM cotizaciones WHERE codigo_ticket = $1',
    [codigoTicket]
  );
  return resultado.rows[0];
}

/**
 * Obtiene los detalles de una cotización
 */
async function obtenerDetallesCotizacion(idCotizacion) {
  const resultado = await ejecutarQuery(
    'SELECT * FROM detalle_cotizacion WHERE id_cotizacion = $1',
    [idCotizacion]
  );
  return resultado.rows;
}

// ============================================
// Property 13: Cálculo de precio total con margen
// **Validates: Requirements 6.1, 6.2**
// ============================================

describe('Property 13: Cálculo de precio total con margen', () => {
  beforeEach(async () => {
    await limpiarCotizaciones();
  });

  test('Precio total = suma(precios_base) × (1 + margen/100)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            precio_base: fc.float({ min: 10, max: 1000, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
            cantidad: fc.integer({ min: 1, max: 5 })
          }),
          { minLength: 1, maxLength: 7 }
        ),
        generadorMargen(),
        async (componentes, margen) => {
          // Calcular precio esperado
          const precioBase = componentes.reduce((total, comp) => {
            return total + (comp.precio_base * comp.cantidad);
          }, 0);
          
          const precioEsperado = precioBase * (1 + margen / 100);
          
          // Calcular usando la función del controlador
          const precioCalculado = calcularPrecioTotal(componentes, margen);
          
          // Verificar que coinciden (con tolerancia de 0.01 por redondeo)
          expect(Math.abs(precioCalculado - precioEsperado)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Precio total aumenta cuando aumenta el margen', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            precio_base: fc.float({ min: 10, max: 1000, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
            cantidad: fc.integer({ min: 1, max: 5 })
          }),
          { minLength: 1, maxLength: 7 }
        ),
        fc.float({ min: 0, max: 50, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
        fc.float({ min: 51, max: 100, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
        async (componentes, margenBajo, margenAlto) => {
          const precioConMargenBajo = calcularPrecioTotal(componentes, margenBajo);
          const precioConMargenAlto = calcularPrecioTotal(componentes, margenAlto);
          
          // El precio con margen alto debe ser mayor
          expect(precioConMargenAlto).toBeGreaterThan(precioConMargenBajo);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Margen de 0% retorna suma de precios base', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            precio_base: fc.float({ min: 10, max: 1000, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
            cantidad: fc.integer({ min: 1, max: 5 })
          }),
          { minLength: 1, maxLength: 7 }
        ),
        async (componentes) => {
          const precioBase = componentes.reduce((total, comp) => {
            return total + (comp.precio_base * comp.cantidad);
          }, 0);
          
          const precioCalculado = calcularPrecioTotal(componentes, 0);
          
          expect(Math.abs(precioCalculado - precioBase)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================
// Property 14: Margen no afecta cotizaciones existentes
// **Validates: Requirements 6.4**
// ============================================

describe('Property 14: Margen no afecta cotizaciones existentes', () => {
  beforeEach(async () => {
    await limpiarCotizaciones();
  });

  test('Cambiar margen no modifica margen_aplicado de cotizaciones existentes', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorMargen(),
        generadorMargen(),
        async (margenInicial, margenNuevo) => {
          fc.pre(Math.abs(margenInicial - margenNuevo) > 1); // Asegurar que son diferentes
          
          // Configurar margen inicial
          await configurarMargen(margenInicial);
          
          // Crear cotización con margen inicial
          const cotizacion = await insertarCotizacionDirecta({
            precio_total: 1000,
            margen_aplicado: margenInicial
          });
          
          // Cambiar margen en configuración
          await configurarMargen(margenNuevo);
          
          // Verificar que la cotización mantiene el margen original
          const cotizacionRecuperada = await obtenerCotizacionPorTicket(cotizacion.codigo_ticket);
          
          expect(parseFloat(cotizacionRecuperada.margen_aplicado)).toBe(margenInicial);
          expect(parseFloat(cotizacionRecuperada.margen_aplicado)).not.toBe(margenNuevo);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Múltiples cotizaciones mantienen sus márgenes históricos', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(generadorMargen(), { minLength: 3, maxLength: 5 }),
        async (margenes) => {
          const cotizaciones = [];
          
          // Crear cotizaciones con diferentes márgenes
          for (const margen of margenes) {
            await configurarMargen(margen);
            
            const cotizacion = await insertarCotizacionDirecta({
              precio_total: 1000,
              margen_aplicado: margen
            });
            
            cotizaciones.push({ cotizacion, margenOriginal: margen });
          }
          
          // Cambiar margen a un valor completamente diferente
          await configurarMargen(99.99);
          
          // Verificar que todas las cotizaciones mantienen sus márgenes originales
          for (const { cotizacion, margenOriginal } of cotizaciones) {
            const recuperada = await obtenerCotizacionPorTicket(cotizacion.codigo_ticket);
            expect(parseFloat(recuperada.margen_aplicado)).toBe(margenOriginal);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ============================================
// Property 16: Código ticket es único y válido
// **Validates: Requirements 7.3**
// ============================================

describe('Property 16: Código ticket es único y válido', () => {
  beforeEach(async () => {
    await limpiarCotizaciones();
  });

  test('Todos los códigos ticket generados son únicos', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 20 }),
        async (cantidad) => {
          const codigos = new Set();
          
          // Generar múltiples códigos
          for (let i = 0; i < cantidad; i++) {
            const codigo = await generarCodigoTicket();
            
            // Verificar que no existe duplicado
            expect(codigos.has(codigo)).toBe(false);
            
            codigos.add(codigo);
          }
          
          // Verificar que todos son únicos
          expect(codigos.size).toBe(cantidad);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Códigos ticket siguen formato NSG-YYYY-NNNN', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (cantidad) => {
          const anioActual = new Date().getFullYear();
          const regex = new RegExp(`^NSG-${anioActual}-\\d{4}$`);
          
          for (let i = 0; i < cantidad; i++) {
            const codigo = await generarCodigoTicket();
            
            // Verificar formato
            expect(codigo).toMatch(regex);
            
            // Verificar partes
            const partes = codigo.split('-');
            expect(partes.length).toBe(3);
            expect(partes[0]).toBe('NSG');
            expect(partes[1]).toBe(anioActual.toString());
            expect(partes[2].length).toBe(4);
            expect(/^\d{4}$/.test(partes[2])).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Códigos ticket en cotizaciones son únicos en la base de datos', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 10 }),
        async (cantidad) => {
          const cotizaciones = [];
          
          // Crear múltiples cotizaciones
          for (let i = 0; i < cantidad; i++) {
            const cotizacion = await insertarCotizacionDirecta({
              precio_total: 1000 + i,
              margen_aplicado: 20
            });
            
            cotizaciones.push(cotizacion);
          }
          
          // Verificar que todos los códigos son únicos
          const codigos = cotizaciones.map(c => c.codigo_ticket);
          const codigosUnicos = new Set(codigos);
          
          expect(codigosUnicos.size).toBe(cantidad);
        }
      ),
      { numRuns: 15 }
    );
  });
});

// ============================================
// Property 18: Persistencia completa de cotización
// **Validates: Requirements 7.6, 8.1, 8.2**
// ============================================

describe('Property 18: Persistencia completa de cotización', () => {
  beforeEach(async () => {
    await limpiarCotizaciones();
  });

  test('Crear cotización persiste registro en cotizaciones y N detalles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 7 }),
        generadorMargen(),
        async (cantidadComponentes, margen) => {
          // Crear productos de prueba
          const productos = await crearProductosPrueba(cantidadComponentes);
          
          // Configurar margen
          await configurarMargen(margen);
          
          // Preparar datos de cotización
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          const { req, res } = crearMockReqRes({ componentes });
          
          // Crear cotización
          await crearCotizacion(req, res);
          
          expect(res.statusCode).toBe(201);
          expect(res.data.exito).toBe(true);
          
          const cotizacionCreada = res.data.cotizacion;
          
          // Verificar que existe en la tabla cotizaciones
          const cotizacion = await obtenerCotizacionPorTicket(cotizacionCreada.codigo_ticket);
          expect(cotizacion).toBeDefined();
          
          // Verificar que existen N detalles
          const detalles = await obtenerDetallesCotizacion(cotizacion.id);
          expect(detalles.length).toBe(cantidadComponentes);
          
          // Verificar que cada detalle tiene los campos requeridos
          detalles.forEach(detalle => {
            expect(detalle.id_cotizacion).toBe(cotizacion.id);
            expect(detalle.id_producto).toBeDefined();
            expect(detalle.nombre_producto).toBeDefined();
            expect(detalle.categoria).toBeDefined();
            expect(parseFloat(detalle.precio_unitario)).toBeGreaterThan(0);
            expect(detalle.cantidad).toBeGreaterThan(0);
            expect(typeof detalle.disponible_stock).toBe('boolean');
          });
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  test('Detalles de cotización contienen snapshot de precios', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        async (cantidadComponentes) => {
          // Crear productos
          const productos = await crearProductosPrueba(cantidadComponentes);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          const { req, res } = crearMockReqRes({ componentes });
          await crearCotizacion(req, res);
          
          expect(res.statusCode).toBe(201);
          
          const cotizacionCreada = res.data.cotizacion;
          const cotizacion = await obtenerCotizacionPorTicket(cotizacionCreada.codigo_ticket);
          const detalles = await obtenerDetallesCotizacion(cotizacion.id);
          
          // Verificar que los precios en detalles coinciden con los precios originales
          detalles.forEach((detalle, index) => {
            const productoOriginal = productos.find(p => p.id === detalle.id_producto);
            expect(parseFloat(detalle.precio_unitario)).toBe(parseFloat(productoOriginal.precio_base));
          });
        }
      ),
      { numRuns: 15 }
    );
  }, 30000);
});

// ============================================
// Property 19: Asociación condicional con cliente
// **Validates: Requirements 8.3**
// ============================================

describe('Property 19: Asociación condicional con cliente', () => {
  beforeEach(async () => {
    await limpiarCotizaciones();
  });

  test('Cotización con email tiene id_cliente no nulo', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        generadorEmail(),
        generadorNombre(),
        async (cantidadComponentes, email, nombre) => {
          const productos = await crearProductosPrueba(cantidadComponentes);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          const { req, res } = crearMockReqRes({
            componentes,
            email_cliente: email,
            nombre_cliente: nombre
          });
          
          await crearCotizacion(req, res);
          
          expect(res.statusCode).toBe(201);
          
          const cotizacionCreada = res.data.cotizacion;
          const cotizacion = await obtenerCotizacionPorTicket(cotizacionCreada.codigo_ticket);
          
          // Debe tener id_cliente
          expect(cotizacion.id_cliente).not.toBeNull();
          expect(cotizacion.id_cliente).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  test('Cotización sin email tiene id_cliente nulo', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (cantidadComponentes) => {
          const productos = await crearProductosPrueba(cantidadComponentes);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          const { req, res } = crearMockReqRes({
            componentes
            // Sin email_cliente
          });
          
          await crearCotizacion(req, res);
          
          expect(res.statusCode).toBe(201);
          
          const cotizacionCreada = res.data.cotizacion;
          const cotizacion = await obtenerCotizacionPorTicket(cotizacionCreada.codigo_ticket);
          
          // No debe tener id_cliente
          expect(cotizacion.id_cliente).toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  test('Mismo email reutiliza cliente existente', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorEmail(),
        generadorNombre(),
        async (email, nombre) => {
          const productos = await crearProductosPrueba(2);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          // Primera cotización
          const { req: req1, res: res1 } = crearMockReqRes({
            componentes,
            email_cliente: email,
            nombre_cliente: nombre
          });
          
          await crearCotizacion(req1, res1);
          expect(res1.statusCode).toBe(201);
          
          const cotizacion1 = await obtenerCotizacionPorTicket(res1.data.cotizacion.codigo_ticket);
          
          // Segunda cotización con mismo email
          const { req: req2, res: res2 } = crearMockReqRes({
            componentes,
            email_cliente: email,
            nombre_cliente: nombre
          });
          
          await crearCotizacion(req2, res2);
          expect(res2.statusCode).toBe(201);
          
          const cotizacion2 = await obtenerCotizacionPorTicket(res2.data.cotizacion.codigo_ticket);
          
          // Deben compartir el mismo id_cliente
          expect(cotizacion1.id_cliente).toBe(cotizacion2.id_cliente);
        }
      ),
      { numRuns: 15 }
    );
  }, 30000);
});

// ============================================
// Property 20: Estados de cotización son válidos
// **Validates: Requirements 8.4**
// ============================================

describe('Property 20: Estados de cotización son válidos', () => {
  beforeEach(async () => {
    await limpiarCotizaciones();
  });

  test('Todas las cotizaciones tienen estado válido', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(generadorEstado(), { minLength: 3, maxLength: 10 }),
        async (estados) => {
          const estadosValidos = ['Pendiente', 'Completada', 'Caducada', 'Reclamada'];
          
          // Crear cotizaciones con diferentes estados
          for (const estado of estados) {
            await insertarCotizacionDirecta({
              precio_total: 1000,
              margen_aplicado: 20,
              estado
            });
          }
          
          // Consultar todas las cotizaciones
          const resultado = await ejecutarQuery('SELECT estado FROM cotizaciones');
          
          // Verificar que todos los estados son válidos
          resultado.rows.forEach(row => {
            expect(estadosValidos).toContain(row.estado);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Cotización nueva tiene estado Pendiente', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (cantidadComponentes) => {
          const productos = await crearProductosPrueba(cantidadComponentes);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          const { req, res } = crearMockReqRes({ componentes });
          await crearCotizacion(req, res);
          
          expect(res.statusCode).toBe(201);
          
          const cotizacionCreada = res.data.cotizacion;
          expect(cotizacionCreada.estado).toBe('Pendiente');
          
          const cotizacion = await obtenerCotizacionPorTicket(cotizacionCreada.codigo_ticket);
          expect(cotizacion.estado).toBe('Pendiente');
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  test('Estado no puede ser valor inválido', async () => {
    // Intentar insertar con estado inválido debe fallar
    await expect(async () => {
      await ejecutarQuery(
        `INSERT INTO cotizaciones (
          codigo_ticket, fecha_validez, precio_total, margen_aplicado, estado
        ) VALUES ($1, $2, $3, $4, $5)`,
        ['NSG-2024-9999', new Date(), 1000, 20, 'EstadoInvalido']
      );
    }).rejects.toThrow();
  });
});

// ============================================
// Property 21: Validación retorna comparación de precios
// **Validates: Requirements 9.5, 9.6**
// ============================================

describe('Property 21: Validación retorna comparación de precios', () => {
  beforeEach(async () => {
    await limpiarCotizaciones();
  });

  test('Validación retorna precios históricos y actuales', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 5 }),
        async (cantidadComponentes) => {
          const productos = await crearProductosPrueba(cantidadComponentes);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          // Crear cotización
          const { req: reqCrear, res: resCrear } = crearMockReqRes({ componentes });
          await crearCotizacion(reqCrear, resCrear);
          
          expect(resCrear.statusCode).toBe(201);
          const codigoTicket = resCrear.data.cotizacion.codigo_ticket;
          
          // Validar cotización
          const { req: reqValidar, res: resValidar } = crearMockReqRes(
            {},
            { codigoTicket }
          );
          
          await validarCotizacion(reqValidar, resValidar);
          
          expect(resValidar.statusCode).toBe(200);
          expect(resValidar.data.valida).toBe(true);
          
          const validacion = resValidar.data.cotizacion;
          
          // Verificar que contiene comparación de precios
          expect(validacion.precio_total_historico).toBeDefined();
          expect(validacion.precio_total_actual).toBeDefined();
          expect(validacion.diferencia_total).toBeDefined();
          expect(validacion.hay_cambios_precio).toBeDefined();
          
          // Verificar que tiene componentes con comparación
          expect(validacion.componentes).toBeDefined();
          expect(Array.isArray(validacion.componentes)).toBe(true);
          expect(validacion.componentes.length).toBe(cantidadComponentes);
          
          validacion.componentes.forEach(comp => {
            expect(comp.precio_historico).toBeDefined();
            expect(comp.precio_actual).toBeDefined();
            expect(comp.diferencia_unitaria).toBeDefined();
            expect(comp.subtotal_historico).toBeDefined();
            expect(comp.subtotal_actual).toBeDefined();
            expect(comp.diferencia_subtotal).toBeDefined();
          });
        }
      ),
      { numRuns: 15 }
    );
  }, 30000);

  test('Diferencia total es suma de diferencias de componentes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 4 }),
        async (cantidadComponentes) => {
          const productos = await crearProductosPrueba(cantidadComponentes);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          // Crear cotización
          const { req: reqCrear, res: resCrear } = crearMockReqRes({ componentes });
          await crearCotizacion(reqCrear, resCrear);
          
          const codigoTicket = resCrear.data.cotizacion.codigo_ticket;
          
          // Validar
          const { req: reqValidar, res: resValidar } = crearMockReqRes(
            {},
            { codigoTicket }
          );
          
          await validarCotizacion(reqValidar, resValidar);
          
          const validacion = resValidar.data.cotizacion;
          
          // Calcular suma de diferencias de componentes
          const sumaDiferencias = validacion.componentes.reduce((total, comp) => {
            return total + comp.diferencia_subtotal;
          }, 0);
          
          // Debe coincidir con diferencia_total (con tolerancia por redondeo)
          expect(Math.abs(validacion.diferencia_total - sumaDiferencias)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 15 }
    );
  }, 30000);
});

// ============================================
// Property 22: Marcar como reclamada actualiza estado
// **Validates: Requirements 9.7**
// ============================================

describe('Property 22: Marcar como reclamada actualiza estado', () => {
  beforeEach(async () => {
    await limpiarCotizaciones();
  });

  test('Cotización Pendiente cambia a Reclamada', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        async (cantidadComponentes) => {
          const productos = await crearProductosPrueba(cantidadComponentes);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          // Crear cotización (estado inicial: Pendiente)
          const { req: reqCrear, res: resCrear } = crearMockReqRes({ componentes });
          await crearCotizacion(reqCrear, resCrear);
          
          expect(resCrear.statusCode).toBe(201);
          const codigoTicket = resCrear.data.cotizacion.codigo_ticket;
          
          // Verificar estado inicial
          let cotizacion = await obtenerCotizacionPorTicket(codigoTicket);
          expect(cotizacion.estado).toBe('Pendiente');
          
          // Marcar como reclamada
          const { req: reqReclamar, res: resReclamar } = crearMockReqRes(
            {},
            { codigoTicket }
          );
          
          await marcarComoReclamada(reqReclamar, resReclamar);
          
          expect(resReclamar.statusCode).toBe(200);
          expect(resReclamar.data.exito).toBe(true);
          expect(resReclamar.data.cotizacion.estado).toBe('Reclamada');
          
          // Verificar en base de datos
          cotizacion = await obtenerCotizacionPorTicket(codigoTicket);
          expect(cotizacion.estado).toBe('Reclamada');
          expect(cotizacion.fecha_reclamacion).not.toBeNull();
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  test('Marcar como reclamada establece fecha_reclamacion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 2 }),
        async (cantidadComponentes) => {
          const productos = await crearProductosPrueba(cantidadComponentes);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          const { req: reqCrear, res: resCrear } = crearMockReqRes({ componentes });
          await crearCotizacion(reqCrear, resCrear);
          
          const codigoTicket = resCrear.data.cotizacion.codigo_ticket;
          
          // Antes de reclamar, no debe tener fecha
          let cotizacion = await obtenerCotizacionPorTicket(codigoTicket);
          expect(cotizacion.fecha_reclamacion).toBeNull();
          
          const antesDeReclamar = Date.now();
          
          // Marcar como reclamada
          const { req: reqReclamar, res: resReclamar } = crearMockReqRes(
            {},
            { codigoTicket }
          );
          
          await marcarComoReclamada(reqReclamar, resReclamar);
          
          const despuesDeReclamar = Date.now();
          
          // Verificar que tiene fecha_reclamacion
          cotizacion = await obtenerCotizacionPorTicket(codigoTicket);
          expect(cotizacion.fecha_reclamacion).not.toBeNull();
          
          const fechaReclamacion = new Date(cotizacion.fecha_reclamacion).getTime();
          
          // La fecha debe estar entre antes y después de la operación
          // Agregar margen de 100ms para diferencias de reloj entre Node y PostgreSQL
          expect(fechaReclamacion).toBeGreaterThanOrEqual(antesDeReclamar - 100);
          expect(fechaReclamacion).toBeLessThanOrEqual(despuesDeReclamar + 100);
        }
      ),
      { numRuns: 15 }
    );
  }, 30000);

  test('No se puede reclamar cotización que no está Pendiente', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('Completada', 'Caducada', 'Reclamada'),
        async (estadoInicial) => {
          // Crear cotización con estado diferente a Pendiente
          const cotizacion = await insertarCotizacionDirecta({
            precio_total: 1000,
            margen_aplicado: 20,
            estado: estadoInicial
          });
          
          // Intentar marcar como reclamada
          const { req, res } = crearMockReqRes(
            {},
            { codigoTicket: cotizacion.codigo_ticket }
          );
          
          await marcarComoReclamada(req, res);
          
          // Debe retornar error
          expect(res.statusCode).toBe(400);
          expect(res.data.error).toBeDefined();
        }
      ),
      { numRuns: 15 }
    );
  });
});

// ============================================
// Property 26: Historial retorna todas las cotizaciones
// **Validates: Requirements 15.2**
// ============================================

describe('Property 26: Historial retorna todas las cotizaciones', () => {
  beforeEach(async () => {
    await limpiarCotizaciones();
  });

  test('Cliente con N cotizaciones recibe exactamente N en historial', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        generadorEmail(),
        generadorNombre(),
        async (cantidadCotizaciones, email, nombre) => {
          const productos = await crearProductosPrueba(3);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          // Crear N cotizaciones para el mismo cliente
          for (let i = 0; i < cantidadCotizaciones; i++) {
            const { req, res } = crearMockReqRes({
              componentes,
              email_cliente: email,
              nombre_cliente: nombre
            });
            
            await crearCotizacion(req, res);
            expect(res.statusCode).toBe(201);
          }
          
          // Consultar historial
          const { req: reqHistorial, res: resHistorial } = crearMockReqRes(
            {},
            { email }
          );
          
          await consultarHistorialCliente(reqHistorial, resHistorial);
          
          expect(resHistorial.statusCode).toBe(200);
          expect(resHistorial.data.exito).toBe(true);
          expect(resHistorial.data.cantidad).toBe(cantidadCotizaciones);
          expect(resHistorial.data.cotizaciones.length).toBe(cantidadCotizaciones);
        }
      ),
      { numRuns: 15 }
    );
  }, 40000);

  test('Historial incluye información completa de cada cotización', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 4 }),
        generadorEmail(),
        generadorNombre(),
        async (cantidadCotizaciones, email, nombre) => {
          const productos = await crearProductosPrueba(3);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          // Crear cotizaciones
          for (let i = 0; i < cantidadCotizaciones; i++) {
            const { req, res } = crearMockReqRes({
              componentes,
              email_cliente: email,
              nombre_cliente: nombre
            });
            
            await crearCotizacion(req, res);
          }
          
          // Consultar historial
          const { req: reqHistorial, res: resHistorial } = crearMockReqRes(
            {},
            { email }
          );
          
          await consultarHistorialCliente(reqHistorial, resHistorial);
          
          // Verificar que cada cotización tiene campos completos
          resHistorial.data.cotizaciones.forEach(cotizacion => {
            expect(cotizacion.id).toBeDefined();
            expect(cotizacion.codigo_unico).toBeDefined();
            expect(cotizacion.codigo_ticket).toBeDefined();
            expect(cotizacion.fecha_emision).toBeDefined();
            expect(cotizacion.fecha_validez).toBeDefined();
            expect(cotizacion.precio_total).toBeGreaterThan(0);
            expect(cotizacion.margen_aplicado).toBeGreaterThanOrEqual(0);
            expect(cotizacion.estado).toBeDefined();
            expect(cotizacion.cantidad_componentes).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 10 }
    );
  }, 40000);

  test('Historial de email sin cotizaciones retorna array vacío', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorEmail(),
        async (emailSinCotizaciones) => {
          // No crear ninguna cotización para este email
          
          const { req, res } = crearMockReqRes(
            {},
            { email: emailSinCotizaciones }
          );
          
          await consultarHistorialCliente(req, res);
          
          expect(res.statusCode).toBe(200);
          expect(res.data.exito).toBe(true);
          expect(res.data.cotizaciones).toEqual([]);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Historial solo incluye cotizaciones del cliente específico', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorEmail(),
        generadorEmail(),
        generadorNombre(),
        generadorNombre(),
        fc.integer({ min: 2, max: 4 }),
        fc.integer({ min: 2, max: 4 }),
        async (email1, email2, nombre1, nombre2, cant1, cant2) => {
          fc.pre(email1 !== email2); // Asegurar emails diferentes
          
          const productos = await crearProductosPrueba(3);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          // Crear cotizaciones para cliente 1
          for (let i = 0; i < cant1; i++) {
            const { req, res } = crearMockReqRes({
              componentes,
              email_cliente: email1,
              nombre_cliente: nombre1
            });
            await crearCotizacion(req, res);
          }
          
          // Crear cotizaciones para cliente 2
          for (let i = 0; i < cant2; i++) {
            const { req, res } = crearMockReqRes({
              componentes,
              email_cliente: email2,
              nombre_cliente: nombre2
            });
            await crearCotizacion(req, res);
          }
          
          // Consultar historial de cliente 1
          const { req: req1, res: res1 } = crearMockReqRes({}, { email: email1 });
          await consultarHistorialCliente(req1, res1);
          
          expect(res1.data.cantidad).toBe(cant1);
          
          // Consultar historial de cliente 2
          const { req: req2, res: res2 } = crearMockReqRes({}, { email: email2 });
          await consultarHistorialCliente(req2, res2);
          
          expect(res2.data.cantidad).toBe(cant2);
        }
      ),
      { numRuns: 10 }
    );
  }, 50000);
});

// ============================================
// Property 28: Código ticket es secuencial por año
// **Validates: Requirements 7.3**
// ============================================

describe('Property 28: Código ticket es secuencial por año', () => {
  beforeEach(async () => {
    await limpiarCotizaciones();
  });

  test('Códigos ticket son secuenciales dentro del mismo año', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 10 }),
        async (cantidad) => {
          // Resetear secuencia para que los números sean predecibles
          await limpiarCotizaciones();
          const anioActual = new Date().getFullYear();
          const codigos = [];
          
          // Generar múltiples códigos
          for (let i = 0; i < cantidad; i++) {
            const codigo = await generarCodigoTicket();
            codigos.push(codigo);
          }
          
          // Extraer números secuenciales
          const numeros = codigos.map(codigo => {
            const partes = codigo.split('-');
            return parseInt(partes[2]);
          });
          
          // Verificar que son secuenciales
          for (let i = 1; i < numeros.length; i++) {
            expect(numeros[i]).toBe(numeros[i - 1] + 1);
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  test('Primer código del año es NSG-YYYY-0001', async () => {
    // Limpiar para asegurar que no hay códigos previos
    await limpiarCotizaciones();
    
    const anioActual = new Date().getFullYear();
    const codigo = await generarCodigoTicket();
    
    expect(codigo).toBe(`NSG-${anioActual}-0001`);
  });

  test('Códigos incrementan correctamente después del primero', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 8 }),
        async (cantidad) => {
          // Resetear secuencia antes de cada run para que sea predecible
          await limpiarCotizaciones();
          const anioActual = new Date().getFullYear();
          
          // Generar códigos
          const codigos = [];
          for (let i = 0; i < cantidad; i++) {
            const codigo = await generarCodigoTicket();
            codigos.push(codigo);
          }
          
          // Verificar formato y secuencia
          codigos.forEach((codigo, index) => {
            const numeroEsperado = (index + 1).toString().padStart(4, '0');
            expect(codigo).toBe(`NSG-${anioActual}-${numeroEsperado}`);
          });
        }
      ),
      { numRuns: 15 }
    );
  });

  test('Cotizaciones creadas tienen códigos secuenciales', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 6 }),
        async (cantidad) => {
          const productos = await crearProductosPrueba(2);
          await configurarMargen(20);
          
          const componentes = productos.map(p => ({
            id_producto: p.id,
            cantidad: 1
          }));
          
          const codigosCreados = [];
          
          // Crear múltiples cotizaciones
          for (let i = 0; i < cantidad; i++) {
            const { req, res } = crearMockReqRes({ componentes });
            await crearCotizacion(req, res);
            
            expect(res.statusCode).toBe(201);
            codigosCreados.push(res.data.cotizacion.codigo_ticket);
          }
          
          // Extraer números
          const numeros = codigosCreados.map(codigo => {
            const partes = codigo.split('-');
            return parseInt(partes[2]);
          });
          
          // Verificar secuencia
          for (let i = 1; i < numeros.length; i++) {
            expect(numeros[i]).toBe(numeros[i - 1] + 1);
          }
        }
      ),
      { numRuns: 10 }
    );
  }, 40000);
});

// ============================================
// Cleanup
// ============================================

afterAll(async () => {
  await limpiarCotizaciones();
  await pool.end();
});
