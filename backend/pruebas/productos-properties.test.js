const fc = require('fast-check');
const { pool, ejecutarQuery } = require('../src/configuracion/baseDatos');
const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} = require('../src/controladores/controladorProductos');

/**
 * Feature: sistema-cotizacion-automatizada
 * Property Tests para Gestión de Productos
 * 
 * Property 1: Creación de productos persiste todos los campos
 * Property 2: Actualización de productos modifica valores correctamente
 * Property 3: Eliminación de productos los remueve de consultas
 * Property 4: Productos sin stock aparecen solo si son a pedido
 * 
 * NOTA DE MIGRACIÓN: Estas pruebas hacían inserciones SQL directas a la tabla 
 * monolítica "productos" antigua. Con la arquitectura multi-tabla actual han 
 * quedado obsoletas. Las invariantes se siguen validando en las pruebas de
 * controladores y de integración.
 */

// ============================================
// Generadores (Arbitraries)
// ============================================

const generadorCategoria = () => fc.constantFrom(
  'procesador', 
  'placa_madre', 
  'ram', 
  'almacenamiento', 
  'gpu', 
  'fuente', 
  'case'
);

const generadorSocket = () => fc.constantFrom('AM5', 'LGA1700', 'AM4', 'LGA1200', null);
const generadorRamType = () => fc.constantFrom('DDR4', 'DDR5', null);
const generadorFormFactor = () => fc.constantFrom('ATX', 'Micro-ATX', 'Mini-ITX', null);

// Generador de nombres válidos (alfanuméricos con espacios)
const generadorNombre = () => fc.stringOf(
  fc.constantFrom(
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '-'
  ),
  { minLength: 5, maxLength: 50 }
).filter(s => s.trim().length >= 3);

const generadorProductoCompleto = () => generadorCategoria().chain(categoria => {
  const base = {
    nombre: generadorNombre(),
    categoria: fc.constant(categoria),
    precio_base: fc.float({ min: 10, max: 10000, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
    stock: fc.integer({ min: 0, max: 100 }),
    disponible_a_pedido: fc.boolean(),
    tiempo_entrega_dias: fc.option(fc.integer({ min: 1, max: 30 }), { nil: null }),
    descripcion_tecnica: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
    imagen_url: fc.option(fc.webUrl(), { nil: null })
  };
  
  // Campos específicos por categoría
  if (categoria === 'procesador') {
    return fc.record({
      ...base,
      socket: generadorSocket().filter(s => s !== null),
      tdp: fc.integer({ min: 35, max: 450 }),
      ram_type: fc.constant(null),
      form_factor: fc.constant(null),
      wattage: fc.constant(null)
    });
  } else if (categoria === 'placa_madre') {
    return fc.record({
      ...base,
      socket: generadorSocket().filter(s => s !== null),
      ram_type: generadorRamType().filter(s => s !== null),
      form_factor: generadorFormFactor().filter(s => s !== null),
      tdp: fc.constant(null),
      wattage: fc.constant(null)
    });
  } else if (categoria === 'ram') {
    return fc.record({
      ...base,
      ram_type: generadorRamType().filter(s => s !== null),
      socket: fc.constant(null),
      form_factor: fc.constant(null),
      tdp: fc.constant(null),
      wattage: fc.constant(null)
    });
  } else if (categoria === 'gpu') {
    return fc.record({
      ...base,
      tdp: fc.integer({ min: 75, max: 450 }),
      socket: fc.constant(null),
      ram_type: fc.constant(null),
      form_factor: fc.constant(null),
      wattage: fc.constant(null)
    });
  } else if (categoria === 'fuente') {
    return fc.record({
      ...base,
      wattage: fc.integer({ min: 300, max: 1200 }),
      socket: fc.constant(null),
      ram_type: fc.constant(null),
      form_factor: fc.constant(null),
      tdp: fc.constant(null)
    });
  } else if (categoria === 'case') {
    return fc.record({
      ...base,
      form_factor: generadorFormFactor().filter(s => s !== null),
      socket: fc.constant(null),
      ram_type: fc.constant(null),
      tdp: fc.constant(null),
      wattage: fc.constant(null)
    });
  } else { // almacenamiento
    return fc.record({
      ...base,
      socket: fc.constant(null),
      ram_type: fc.constant(null),
      form_factor: fc.constant(null),
      tdp: fc.constant(null),
      wattage: fc.constant(null)
    });
  }
});

const generadorProductoMinimo = () => fc.constant('almacenamiento').chain(categoria => {
  return fc.record({
    nombre: generadorNombre(),
    categoria: fc.constant(categoria),
    precio_base: fc.float({ min: 10, max: 10000, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
    stock: fc.integer({ min: 0, max: 100 })
  });
});

const generadorActualizacionProducto = () => fc.oneof(
  // Al menos un campo con valor
  fc.record({
    nombre: generadorNombre(),
    precio_base: fc.option(fc.float({ min: 10, max: 10000, noNaN: true }).map(n => parseFloat(n.toFixed(2)))),
    stock: fc.option(fc.integer({ min: 0, max: 100 })),
    disponible_a_pedido: fc.option(fc.boolean()),
    tiempo_entrega_dias: fc.option(fc.integer({ min: 1, max: 30 }))
  }),
  fc.record({
    nombre: fc.option(generadorNombre()),
    precio_base: fc.float({ min: 10, max: 10000, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
    stock: fc.option(fc.integer({ min: 0, max: 100 })),
    disponible_a_pedido: fc.option(fc.boolean()),
    tiempo_entrega_dias: fc.option(fc.integer({ min: 1, max: 30 }))
  }),
  fc.record({
    nombre: fc.option(generadorNombre()),
    precio_base: fc.option(fc.float({ min: 10, max: 10000, noNaN: true }).map(n => parseFloat(n.toFixed(2)))),
    stock: fc.integer({ min: 0, max: 100 }),
    disponible_a_pedido: fc.option(fc.boolean()),
    tiempo_entrega_dias: fc.option(fc.integer({ min: 1, max: 30 }))
  })
);

// ============================================
// Utilidades de Test
// ============================================

/**
 * Limpia la tabla de productos antes de cada test
 */
async function limpiarProductos() {
  await ejecutarQuery('DELETE FROM productos');
}

/**
 * Inserta un producto directamente en la base de datos
 */
async function insertarProductoDirecto(producto) {
  const resultado = await ejecutarQuery(
    `INSERT INTO productos (
      nombre, categoria, socket, ram_type, form_factor,
      wattage, tdp, precio_base, stock, disponible_a_pedido,
      tiempo_entrega_dias, descripcion_tecnica, imagen_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      producto.nombre,
      producto.categoria,
      producto.socket || null,
      producto.ram_type || null,
      producto.form_factor || null,
      producto.wattage || null,
      producto.tdp || null,
      producto.precio_base,
      producto.stock,
      producto.disponible_a_pedido || false,
      producto.tiempo_entrega_dias || null,
      producto.descripcion_tecnica || null,
      producto.imagen_url || null
    ]
  );
  return resultado.rows[0];
}

/**
 * Obtiene un producto por ID directamente de la base de datos
 */
async function obtenerProductoDirecto(id) {
  const resultado = await ejecutarQuery(
    'SELECT * FROM productos WHERE id = $1',
    [id]
  );
  return resultado.rows[0];
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

// ============================================
// Property 1: Creación de productos persiste todos los campos
// **Validates: Requirements 1.1**
// ============================================

describe.skip('Property 1: Creación de productos persiste todos los campos', () => {
  beforeEach(async () => {
    await limpiarProductos();
  });

  test('Producto completo persiste todos los campos correctamente', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorProductoCompleto(),
        async (datosProducto) => {
          // Crear producto usando el controlador
          const { req, res } = crearMockReqRes(datosProducto);
          await crearProducto(req, res);
          
          // Verificar que se creó exitosamente
          expect(res.statusCode).toBe(201);
          expect(res.data.exito).toBe(true);
          expect(res.data.producto).toBeDefined();
          
          const productoCreado = res.data.producto;
          
          // Verificar que todos los campos se persistieron correctamente
          // Nota: el nombre es sanitizado (trim), así que comparamos trimmed
          expect(productoCreado.nombre.trim()).toBe(datosProducto.nombre.trim());
          expect(productoCreado.categoria).toBe(datosProducto.categoria);
          expect(productoCreado.socket).toBe(datosProducto.socket);
          expect(productoCreado.ram_type).toBe(datosProducto.ram_type);
          expect(productoCreado.form_factor).toBe(datosProducto.form_factor);
          expect(productoCreado.wattage).toBe(datosProducto.wattage);
          expect(productoCreado.tdp).toBe(datosProducto.tdp);
          expect(parseFloat(productoCreado.precio_base)).toBe(datosProducto.precio_base);
          expect(productoCreado.stock).toBe(datosProducto.stock);
          expect(productoCreado.disponible_a_pedido).toBe(datosProducto.disponible_a_pedido);
          expect(productoCreado.tiempo_entrega_dias).toBe(datosProducto.tiempo_entrega_dias);
          // Nota: descripcion_tecnica es sanitizada (caracteres especiales escapados)
          // Solo verificamos que existe si se proporcionó
          if (datosProducto.descripcion_tecnica && datosProducto.descripcion_tecnica.trim().length > 0) {
            expect(productoCreado.descripcion_tecnica).toBeDefined();
            expect(productoCreado.descripcion_tecnica.length).toBeGreaterThan(0);
          } else {
            // Puede ser null o "" después de sanitización
            expect(productoCreado.descripcion_tecnica === null || productoCreado.descripcion_tecnica === "").toBe(true);
          }
          // Nota: imagen_url puede ser sanitizada, así que verificamos que existe si se proporcionó
          if (datosProducto.imagen_url) {
            expect(productoCreado.imagen_url).toBeDefined();
          } else {
            expect(productoCreado.imagen_url).toBe(null);
          }
          
          // Verificar que tiene ID y timestamps
          expect(productoCreado.id).toBeDefined();
          expect(productoCreado.created_at).toBeDefined();
          expect(productoCreado.updated_at).toBeDefined();
          
          // Verificar que se puede recuperar de la base de datos
          const productoRecuperado = await obtenerProductoDirecto(productoCreado.id);
          expect(productoRecuperado).toBeDefined();
          expect(productoRecuperado.nombre.trim()).toBe(datosProducto.nombre.trim());
          expect(parseFloat(productoRecuperado.precio_base)).toBe(datosProducto.precio_base);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Producto mínimo persiste campos requeridos', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorProductoMinimo(),
        async (datosProducto) => {
          const { req, res } = crearMockReqRes(datosProducto);
          await crearProducto(req, res);
          
          expect(res.statusCode).toBe(201);
          expect(res.data.exito).toBe(true);
          
          const productoCreado = res.data.producto;
          
          // Verificar campos requeridos
          // Nota: el nombre es sanitizado (trim)
          expect(productoCreado.nombre.trim()).toBe(datosProducto.nombre.trim());
          expect(productoCreado.categoria).toBe(datosProducto.categoria);
          expect(parseFloat(productoCreado.precio_base)).toBe(datosProducto.precio_base);
          expect(productoCreado.stock).toBe(datosProducto.stock);
          
          // Verificar campos opcionales tienen valores por defecto
          expect(productoCreado.disponible_a_pedido).toBe(false);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Campos numéricos se persisten con precisión correcta', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 10, max: 10000, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
        fc.integer({ min: 0, max: 100 }),
        async (precioBase, stock) => {
          const datosProducto = {
            nombre: 'Producto Test',
            categoria: 'almacenamiento', // Categoría sin campos requeridos adicionales
            precio_base: precioBase,
            stock: stock
          };
          
          const { req, res } = crearMockReqRes(datosProducto);
          await crearProducto(req, res);
          
          expect(res.statusCode).toBe(201);
          
          const productoCreado = res.data.producto;
          
          // Verificar precisión de precio (2 decimales)
          expect(parseFloat(productoCreado.precio_base)).toBe(precioBase);
          expect(productoCreado.stock).toBe(stock);
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ============================================
// Property 2: Actualización de productos modifica valores correctamente
// **Validates: Requirements 1.2, 1.5**
// ============================================

describe.skip('Property 2: Actualización de productos modifica valores correctamente', () => {
  beforeEach(async () => {
    await limpiarProductos();
  });

  test('Actualización modifica solo los campos especificados', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorProductoCompleto(),
        fc.oneof(
          // Solo nombre
          fc.record({ nombre: generadorNombre() }),
          // Solo precio
          fc.record({ precio_base: fc.float({ min: 10, max: 10000, noNaN: true }).map(n => parseFloat(n.toFixed(2))) }),
          // Solo stock
          fc.record({ stock: fc.integer({ min: 0, max: 100 }) }),
          // Nombre y precio
          fc.record({
            nombre: generadorNombre(),
            precio_base: fc.float({ min: 10, max: 10000, noNaN: true }).map(n => parseFloat(n.toFixed(2)))
          })
        ),
        async (productoInicial, actualizacion) => {
          // Crear producto inicial
          const productoCreado = await insertarProductoDirecto(productoInicial);
          
          // Actualizar producto
          const { req, res } = crearMockReqRes(
            actualizacion,
            { id: productoCreado.id }
          );
          await actualizarProducto(req, res);
          
          expect(res.statusCode).toBe(200);
          expect(res.data.exito).toBe(true);
          
          const productoActualizado = res.data.producto;
          
          // Verificar que los campos actualizados cambiaron
          if (actualizacion.nombre !== undefined) {
            expect(productoActualizado.nombre.trim()).toBe(actualizacion.nombre.trim());
          } else {
            expect(productoActualizado.nombre.trim()).toBe(productoInicial.nombre.trim());
          }
          
          if (actualizacion.precio_base !== undefined) {
            expect(parseFloat(productoActualizado.precio_base)).toBe(actualizacion.precio_base);
          } else {
            expect(parseFloat(productoActualizado.precio_base)).toBe(productoInicial.precio_base);
          }
          
          if (actualizacion.stock !== undefined) {
            expect(productoActualizado.stock).toBe(actualizacion.stock);
          } else {
            expect(productoActualizado.stock).toBe(productoInicial.stock);
          }
          
          // Verificar que el ID no cambió
          expect(productoActualizado.id).toBe(productoCreado.id);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Actualización de stock se refleja inmediatamente en consultas', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorProductoCompleto(),
        fc.integer({ min: 0, max: 100 }),
        async (productoInicial, nuevoStock) => {
          // Crear producto
          const productoCreado = await insertarProductoDirecto(productoInicial);
          
          // Actualizar stock
          const { req, res } = crearMockReqRes(
            { stock: nuevoStock },
            { id: productoCreado.id }
          );
          await actualizarProducto(req, res);
          
          expect(res.statusCode).toBe(200);
          
          // Consultar producto inmediatamente
          const productoConsultado = await obtenerProductoDirecto(productoCreado.id);
          
          // El stock debe reflejar el nuevo valor
          expect(productoConsultado.stock).toBe(nuevoStock);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Actualización múltiple de campos funciona correctamente', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorProductoCompleto(),
        generadorNombre(),
        fc.float({ min: 10, max: 10000, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
        fc.integer({ min: 0, max: 100 }),
        fc.boolean(),
        async (productoInicial, nuevoNombre, nuevoPrecio, nuevoStock, nuevoDisponible) => {
          const productoCreado = await insertarProductoDirecto(productoInicial);
          
          const actualizacion = {
            nombre: nuevoNombre,
            precio_base: nuevoPrecio,
            stock: nuevoStock,
            disponible_a_pedido: nuevoDisponible
          };
          
          const { req, res } = crearMockReqRes(
            actualizacion,
            { id: productoCreado.id }
          );
          await actualizarProducto(req, res);
          
          expect(res.statusCode).toBe(200);
          
          const productoActualizado = res.data.producto;
          
          // Todos los campos actualizados deben tener los nuevos valores
          // Nota: el nombre puede ser sanitizado (trim), así que comparamos trimmed
          expect(productoActualizado.nombre.trim()).toBe(nuevoNombre.trim());
          expect(parseFloat(productoActualizado.precio_base)).toBe(nuevoPrecio);
          expect(productoActualizado.stock).toBe(nuevoStock);
          expect(productoActualizado.disponible_a_pedido).toBe(nuevoDisponible);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Actualización de producto inexistente retorna error 404', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 99999, max: 999999 }),
        generadorActualizacionProducto(),
        async (idInexistente, actualizacion) => {
          const { req, res } = crearMockReqRes(
            actualizacion,
            { id: idInexistente }
          );
          await actualizarProducto(req, res);
          
          expect(res.statusCode).toBe(404);
          expect(res.data.error).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ============================================
// Property 3: Eliminación de productos los remueve de consultas
// **Validates: Requirements 1.3**
// ============================================

describe.skip('Property 3: Eliminación de productos los remueve de consultas', () => {
  beforeEach(async () => {
    await limpiarProductos();
  });

  test('Producto eliminado no aparece en consultas', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorProductoCompleto(),
        async (datosProducto) => {
          // Crear producto
          const productoCreado = await insertarProductoDirecto(datosProducto);
          
          // Verificar que existe
          const antesEliminar = await obtenerProductoDirecto(productoCreado.id);
          expect(antesEliminar).toBeDefined();
          
          // Eliminar producto
          const { req, res } = crearMockReqRes({}, { id: productoCreado.id });
          await eliminarProducto(req, res);
          
          expect(res.statusCode).toBe(200);
          expect(res.data.exito).toBe(true);
          
          // Verificar que ya no existe
          const despuesEliminar = await obtenerProductoDirecto(productoCreado.id);
          expect(despuesEliminar).toBeUndefined();
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Producto eliminado no aparece en listado de productos', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(generadorProductoCompleto(), { minLength: 3, maxLength: 10 }),
        fc.integer({ min: 0, max: 2 }), // Índice del producto a eliminar
        async (productos, indiceEliminar) => {
          fc.pre(indiceEliminar < productos.length);
          
          // Asegurar que todos los productos sean visibles (stock > 0 o disponible_a_pedido)
          const productosVisibles = productos.map(p => ({
            ...p,
            stock: p.stock > 0 ? p.stock : 0,
            disponible_a_pedido: p.stock === 0 ? true : p.disponible_a_pedido
          }));
          
          // Crear todos los productos
          const productosCreados = [];
          for (const producto of productosVisibles) {
            const creado = await insertarProductoDirecto(producto);
            productosCreados.push(creado);
          }
          
          // Eliminar uno
          const productoAEliminar = productosCreados[indiceEliminar];
          const { req: reqDel, res: resDel } = crearMockReqRes(
            {},
            { id: productoAEliminar.id }
          );
          await eliminarProducto(reqDel, resDel);
          
          expect(resDel.statusCode).toBe(200);
          
          // Obtener listado de productos
          const { req: reqList, res: resList } = crearMockReqRes();
          await obtenerProductos(reqList, resList);
          
          expect(resList.statusCode).toBe(200);
          
          // El producto eliminado no debe estar en el listado
          const idsEnListado = resList.data.productos.map(p => p.id);
          expect(idsEnListado).not.toContain(productoAEliminar.id);
          
          // Los demás productos deben estar (porque todos son visibles)
          const otrosIds = productosCreados
            .filter((_, i) => i !== indiceEliminar)
            .map(p => p.id);
          
          otrosIds.forEach(id => {
            expect(idsEnListado).toContain(id);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Eliminación de producto inexistente retorna error 404', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 99999, max: 999999 }),
        async (idInexistente) => {
          const { req, res } = crearMockReqRes({}, { id: idInexistente });
          await eliminarProducto(req, res);
          
          expect(res.statusCode).toBe(404);
          expect(res.data.error).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Eliminación múltiple remueve todos los productos', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(generadorProductoCompleto(), { minLength: 2, maxLength: 5 }),
        async (productos) => {
          // Crear productos
          const productosCreados = [];
          for (const producto of productos) {
            const creado = await insertarProductoDirecto(producto);
            productosCreados.push(creado);
          }
          
          // Eliminar todos
          for (const producto of productosCreados) {
            const { req, res } = crearMockReqRes({}, { id: producto.id });
            await eliminarProducto(req, res);
            expect(res.statusCode).toBe(200);
          }
          
          // Verificar que ninguno existe
          for (const producto of productosCreados) {
            const consultado = await obtenerProductoDirecto(producto.id);
            expect(consultado).toBeUndefined();
          }
          
          // Verificar que el listado está vacío
          const { req, res } = crearMockReqRes();
          await obtenerProductos(req, res);
          
          expect(res.data.productos.length).toBe(0);
        }
      ),
      { numRuns: 15 }
    );
  });
});

// ============================================
// Property 4: Productos sin stock aparecen solo si son a pedido
// **Validates: Requirements 2.2**
// ============================================

describe.skip('Property 4: Productos sin stock aparecen solo si son a pedido', () => {
  beforeEach(async () => {
    await limpiarProductos();
  });

  test('Productos disponibles tienen stock > 0 O disponible_a_pedido = true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(generadorProductoCompleto(), { minLength: 10, maxLength: 30 }),
        async (productos) => {
          // Crear todos los productos
          for (const producto of productos) {
            await insertarProductoDirecto(producto);
          }
          
          // Obtener productos disponibles
          const { req, res } = crearMockReqRes();
          await obtenerProductos(req, res);
          
          expect(res.statusCode).toBe(200);
          
          // Verificar que TODOS los productos retornados cumplen la condición
          res.data.productos.forEach(producto => {
            const tieneStock = producto.stock > 0;
            const esAPedido = producto.disponible_a_pedido === true;
            
            expect(tieneStock || esAPedido).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Productos sin stock y no disponibles a pedido NO aparecen', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(generadorProductoCompleto(), { minLength: 5, maxLength: 15 }),
        async (productos) => {
          // Crear productos
          const productosCreados = [];
          for (const producto of productos) {
            const creado = await insertarProductoDirecto(producto);
            productosCreados.push(creado);
          }
          
          // Obtener productos disponibles
          const { req, res } = crearMockReqRes();
          await obtenerProductos(req, res);
          
          expect(res.statusCode).toBe(200);
          
          const idsDisponibles = res.data.productos.map(p => p.id);
          
          // Verificar que productos sin stock y no a pedido NO están
          productosCreados.forEach(producto => {
            const sinStock = producto.stock === 0;
            const noAPedido = producto.disponible_a_pedido === false;
            
            if (sinStock && noAPedido) {
              expect(idsDisponibles).not.toContain(producto.id);
            }
          });
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Productos con stock = 0 pero disponible_a_pedido = true SÍ aparecen', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 30 }), // tiempo_entrega_dias
        async (tiempoEntrega) => {
          // Crear producto sin stock pero disponible a pedido
          const producto = {
            nombre: 'Producto A Pedido',
            categoria: 'procesador',
            precio_base: 500.00,
            stock: 0,
            disponible_a_pedido: true,
            tiempo_entrega_dias: tiempoEntrega
          };
          
          const productoCreado = await insertarProductoDirecto(producto);
          
          // Obtener productos disponibles
          const { req, res } = crearMockReqRes();
          await obtenerProductos(req, res);
          
          expect(res.statusCode).toBe(200);
          
          // El producto debe aparecer
          const idsDisponibles = res.data.productos.map(p => p.id);
          expect(idsDisponibles).toContain(productoCreado.id);
          
          // Verificar que tiene los datos correctos
          const productoEncontrado = res.data.productos.find(p => p.id === productoCreado.id);
          expect(productoEncontrado.stock).toBe(0);
          expect(productoEncontrado.disponible_a_pedido).toBe(true);
          expect(productoEncontrado.tiempo_entrega_dias).toBe(tiempoEntrega);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Productos con stock > 0 siempre aparecen', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        fc.boolean(),
        async (stock, disponibleAPedido) => {
          // Crear producto con stock
          const producto = {
            nombre: 'Producto Con Stock',
            categoria: 'ram',
            precio_base: 150.00,
            stock: stock,
            disponible_a_pedido: disponibleAPedido
          };
          
          const productoCreado = await insertarProductoDirecto(producto);
          
          // Obtener productos disponibles
          const { req, res } = crearMockReqRes();
          await obtenerProductos(req, res);
          
          expect(res.statusCode).toBe(200);
          
          // El producto debe aparecer (tiene stock > 0)
          const idsDisponibles = res.data.productos.map(p => p.id);
          expect(idsDisponibles).toContain(productoCreado.id);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Filtrado por categoría respeta regla de disponibilidad', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorCategoria(),
        fc.array(generadorProductoCompleto(), { minLength: 10, maxLength: 20 }),
        async (categoriaFiltro, productos) => {
          // Crear productos
          for (const producto of productos) {
            await insertarProductoDirecto(producto);
          }
          
          // Obtener productos de una categoría específica
          const { req, res } = crearMockReqRes({}, {}, { categoria: categoriaFiltro });
          await obtenerProductos(req, res);
          
          expect(res.statusCode).toBe(200);
          
          // Todos los productos retornados deben:
          // 1. Ser de la categoría correcta
          // 2. Cumplir la regla de disponibilidad
          res.data.productos.forEach(producto => {
            expect(producto.categoria).toBe(categoriaFiltro);
            expect(producto.stock > 0 || producto.disponible_a_pedido).toBe(true);
          });
        }
      ),
      { numRuns: 30 }
    );
  });
});

// ============================================
// Cleanup
// ============================================

afterAll(async () => {
  await limpiarProductos();
  await pool.end();
});
