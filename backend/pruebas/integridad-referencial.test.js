const fc = require('fast-check');
const { pool, ejecutarQuery } = require('../src/configuracion/baseDatos');

/**
 * Integridad referencial en esquema reestructurado.
 */
describe('Property 25: Integridad referencial', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('Insertar cotización con id_cliente inválido debe fallar', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 999999, max: 9999999 }),
        async (idClienteInvalido) => {
          const query = `
            INSERT INTO cotizaciones (
              codigo_ticket, id_cliente, fecha_validez, precio_total, margen_aplicado
            ) VALUES ($1, $2, $3, $4, $5)
          `;
          const params = [
            `TEST-${Date.now()}`,
            idClienteInvalido,
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            1000.00,
            20.00
          ];
          await expect(ejecutarQuery(query, params)).rejects.toThrow();
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
              id_cotizacion, id_producto, tabla_producto, nombre_producto, categoria, precio_unitario, disponible_stock
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;
          const params = [
            idCotizacionInvalido,
            1,
            'productos_procesador',
            'Producto Test',
            'procesador',
            500.00,
            true
          ];
          await expect(ejecutarQuery(query, params)).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Detalle permite id_producto sin FK directa (integridad en capa de aplicación)', async () => {
    const codigoTicket = `TEST-${Date.now()}`;
    const resultCotizacion = await ejecutarQuery(
      `INSERT INTO cotizaciones (codigo_ticket, fecha_validez, precio_total, margen_aplicado)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [codigoTicket, new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 1000.00, 20.00]
    );
    const idCotizacion = resultCotizacion.rows[0].id;

    await expect(
      ejecutarQuery(
        `INSERT INTO detalle_cotizacion (
          id_cotizacion, id_producto, tabla_producto, nombre_producto, categoria, precio_unitario, disponible_stock
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [idCotizacion, 9999999, 'productos_procesador', 'Producto inexistente', 'procesador', 500.00, true]
      )
    ).resolves.toBeTruthy();

    await ejecutarQuery('DELETE FROM detalle_cotizacion WHERE id_cotizacion = $1', [idCotizacion]);
    await ejecutarQuery('DELETE FROM cotizaciones WHERE id = $1', [idCotizacion]);
  });

  test('Eliminar cotización elimina detalles en cascada (ON DELETE CASCADE)', async () => {
    const resultProducto = await ejecutarQuery(
      `INSERT INTO productos_procesador (nombre, categoria, codigo_proveedor, precio_base, stock)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Producto Cascade Test', 'procesador', `LEGACY-${Date.now()}`, 500.00, 10]
    );
    const idProducto = resultProducto.rows[0].id;

    const codigoTicket = `C-${Date.now().toString().slice(-8)}`;
    const resultCotizacion = await ejecutarQuery(
      `INSERT INTO cotizaciones (codigo_ticket, fecha_validez, precio_total, margen_aplicado)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [codigoTicket, new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 500.00, 20.00]
    );
    const idCotizacion = resultCotizacion.rows[0].id;

    await ejecutarQuery(
      `INSERT INTO detalle_cotizacion (
        id_cotizacion, id_producto, tabla_producto, nombre_producto, categoria, precio_unitario, disponible_stock
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [idCotizacion, idProducto, 'productos_procesador', 'Producto 1', 'procesador', 500.00, true]
    );

    const detallesAntes = await ejecutarQuery(
      'SELECT COUNT(*) as count FROM detalle_cotizacion WHERE id_cotizacion = $1',
      [idCotizacion]
    );
    expect(parseInt(detallesAntes.rows[0].count, 10)).toBe(1);

    await ejecutarQuery('DELETE FROM cotizaciones WHERE id = $1', [idCotizacion]);

    const detallesDespues = await ejecutarQuery(
      'SELECT COUNT(*) as count FROM detalle_cotizacion WHERE id_cotizacion = $1',
      [idCotizacion]
    );
    expect(parseInt(detallesDespues.rows[0].count, 10)).toBe(0);

    await ejecutarQuery('DELETE FROM productos_procesador WHERE id = $1', [idProducto]);
  });
});

