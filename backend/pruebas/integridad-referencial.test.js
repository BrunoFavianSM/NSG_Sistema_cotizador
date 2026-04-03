const fc = require('fast-check');
const { pool, ejecutarQuery } = require('../src/configuracion/baseDatos');

/**
 * Feature: sistema-cotizacion-automatizada
 * Property 25: Integridad referencial
 * 
 * Para cualquier intento de insertar con FK inválida, la operación debe fallar.
 * 
 * Validates: Requirements 11.6
 */

describe('Property 25: Integridad referencial', () => {
  beforeAll(async () => {
    // Asegurar que las tablas existen
    await ejecutarQuery('SELECT 1 FROM productos LIMIT 1').catch(() => {});
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Insertar cotización con id_cliente inválido debe fallar', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 999999, max: 9999999 }), // ID que no existe
        async (idClienteInvalido) => {
          // Intentar insertar cotización con FK inválida
          const query = `
            INSERT INTO cotizaciones (
              codigo_ticket, 
              id_cliente, 
              fecha_validez, 
              precio_total, 
              margen_aplicado
            ) VALUES ($1, $2, $3, $4, $5)
          `;
          
          const params = [
            `TEST-${Date.now()}`,
            idClienteInvalido,
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            1000.00,
            20.00
          ];

          // Debe lanzar error de FK
          await expect(
            ejecutarQuery(query, params)
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Insertar detalle_cotizacion con id_cotizacion inválido debe fallar', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 999999, max: 9999999 }),
        async (idCotizacionInvalido) => {
          const query = `
            INSERT INTO detalle_cotizacion (
              id_cotizacion,
              id_producto,
              nombre_producto,
              categoria,
              precio_unitario,
              disponible_stock
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `;
          
          const params = [
            idCotizacionInvalido,
            1,
            'Producto Test',
            'procesador',
            500.00,
            true
          ];

          await expect(
            ejecutarQuery(query, params)
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Insertar detalle_cotizacion con id_producto inválido debe fallar', async () => {
    // Primero crear una cotización válida
    const codigoTicket = `TEST-${Date.now()}`;
    const resultCotizacion = await ejecutarQuery(
      `INSERT INTO cotizaciones (
        codigo_ticket, 
        fecha_validez, 
        precio_total, 
        margen_aplicado
      ) VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        codigoTicket,
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        1000.00,
        20.00
      ]
    );

    const idCotizacion = resultCotizacion.rows[0].id;

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 999999, max: 9999999 }),
        async (idProductoInvalido) => {
          const query = `
            INSERT INTO detalle_cotizacion (
              id_cotizacion,
              id_producto,
              nombre_producto,
              categoria,
              precio_unitario,
              disponible_stock
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `;
          
          const params = [
            idCotizacion,
            idProductoInvalido,
            'Producto Test',
            'procesador',
            500.00,
            true
          ];

          await expect(
            ejecutarQuery(query, params)
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );

    // Limpiar
    await ejecutarQuery('DELETE FROM cotizaciones WHERE codigo_ticket = $1', [codigoTicket]);
  });

  test('Eliminar producto referenciado en detalle_cotizacion debe fallar (ON DELETE RESTRICT)', async () => {
    // Crear producto de prueba
    const resultProducto = await ejecutarQuery(
      `INSERT INTO productos (
        nombre, 
        categoria, 
        precio_base, 
        stock
      ) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Producto Test FK', 'procesador', 500.00, 10]
    );
    const idProducto = resultProducto.rows[0].id;

    // Crear cotización
    const codigoTicket = `T-${Date.now().toString().slice(-8)}`;
    const resultCotizacion = await ejecutarQuery(
      `INSERT INTO cotizaciones (
        codigo_ticket, 
        fecha_validez, 
        precio_total, 
        margen_aplicado
      ) VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        codigoTicket,
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        500.00,
        20.00
      ]
    );
    const idCotizacion = resultCotizacion.rows[0].id;

    // Crear detalle que referencia el producto
    await ejecutarQuery(
      `INSERT INTO detalle_cotizacion (
        id_cotizacion,
        id_producto,
        nombre_producto,
        categoria,
        precio_unitario,
        disponible_stock
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [idCotizacion, idProducto, 'Producto Test FK', 'procesador', 500.00, true]
    );

    // Intentar eliminar el producto debe fallar por ON DELETE RESTRICT
    await expect(
      ejecutarQuery('DELETE FROM productos WHERE id = $1', [idProducto])
    ).rejects.toThrow();

    // Limpiar (primero detalle, luego cotización, luego producto)
    await ejecutarQuery('DELETE FROM detalle_cotizacion WHERE id_cotizacion = $1', [idCotizacion]);
    await ejecutarQuery('DELETE FROM cotizaciones WHERE id = $1', [idCotizacion]);
    await ejecutarQuery('DELETE FROM productos WHERE id = $1', [idProducto]);
  });

  test('Eliminar cotización debe eliminar detalles en cascada (ON DELETE CASCADE)', async () => {
    // Crear producto
    const resultProducto = await ejecutarQuery(
      `INSERT INTO productos (
        nombre, 
        categoria, 
        precio_base, 
        stock
      ) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Producto Cascade Test', 'procesador', 500.00, 10]
    );
    const idProducto = resultProducto.rows[0].id;

    // Crear cotización
    const codigoTicket = `C-${Date.now().toString().slice(-8)}`;
    const resultCotizacion = await ejecutarQuery(
      `INSERT INTO cotizaciones (
        codigo_ticket, 
        fecha_validez, 
        precio_total, 
        margen_aplicado
      ) VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        codigoTicket,
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        500.00,
        20.00
      ]
    );
    const idCotizacion = resultCotizacion.rows[0].id;

    // Crear varios detalles
    await ejecutarQuery(
      `INSERT INTO detalle_cotizacion (
        id_cotizacion,
        id_producto,
        nombre_producto,
        categoria,
        precio_unitario,
        disponible_stock
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [idCotizacion, idProducto, 'Producto 1', 'procesador', 500.00, true]
    );

    await ejecutarQuery(
      `INSERT INTO detalle_cotizacion (
        id_cotizacion,
        id_producto,
        nombre_producto,
        categoria,
        precio_unitario,
        disponible_stock
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [idCotizacion, idProducto, 'Producto 2', 'ram', 200.00, true]
    );

    // Verificar que existen detalles
    const detallesAntes = await ejecutarQuery(
      'SELECT COUNT(*) as count FROM detalle_cotizacion WHERE id_cotizacion = $1',
      [idCotizacion]
    );
    expect(parseInt(detallesAntes.rows[0].count)).toBe(2);

    // Eliminar cotización
    await ejecutarQuery('DELETE FROM cotizaciones WHERE id = $1', [idCotizacion]);

    // Verificar que los detalles fueron eliminados en cascada
    const detallesDespues = await ejecutarQuery(
      'SELECT COUNT(*) as count FROM detalle_cotizacion WHERE id_cotizacion = $1',
      [idCotizacion]
    );
    expect(parseInt(detallesDespues.rows[0].count)).toBe(0);

    // Limpiar producto
    await ejecutarQuery('DELETE FROM productos WHERE id = $1', [idProducto]);
  });

  test('Eliminar cliente debe establecer id_cliente a NULL en cotizaciones (ON DELETE SET NULL)', async () => {
    // Crear cliente
    const resultCliente = await ejecutarQuery(
      `INSERT INTO usuarios_clientes (
        nombre, 
        correo
      ) VALUES ($1, $2) RETURNING id`,
      ['Cliente Test', `test-${Date.now()}@example.com`]
    );
    const idCliente = resultCliente.rows[0].id;

    // Crear cotización asociada al cliente
    const codigoTicket = `N-${Date.now().toString().slice(-8)}`;
    const resultCotizacion = await ejecutarQuery(
      `INSERT INTO cotizaciones (
        codigo_ticket,
        id_cliente,
        fecha_validez, 
        precio_total, 
        margen_aplicado
      ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        codigoTicket,
        idCliente,
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        500.00,
        20.00
      ]
    );
    const idCotizacion = resultCotizacion.rows[0].id;

    // Verificar que la cotización tiene id_cliente
    const cotizacionAntes = await ejecutarQuery(
      'SELECT id_cliente FROM cotizaciones WHERE id = $1',
      [idCotizacion]
    );
    expect(cotizacionAntes.rows[0].id_cliente).toBe(idCliente);

    // Eliminar cliente
    await ejecutarQuery('DELETE FROM usuarios_clientes WHERE id = $1', [idCliente]);

    // Verificar que id_cliente fue establecido a NULL
    const cotizacionDespues = await ejecutarQuery(
      'SELECT id_cliente FROM cotizaciones WHERE id = $1',
      [idCotizacion]
    );
    expect(cotizacionDespues.rows[0].id_cliente).toBeNull();

    // Limpiar
    await ejecutarQuery('DELETE FROM cotizaciones WHERE id = $1', [idCotizacion]);
  });
});
