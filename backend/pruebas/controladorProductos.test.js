/**
 * Tests para Controlador de Productos â€” Arquitectura multi-tabla
 *
 * Valida operaciones CRUD, filtrado, validaciÃ³n, resolverTabla y manejo de errores.
 * Actualizado para usar rutas /:categoria/:id y validar whitelist de tablas.
 *
 * Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.5, 3.6, 3.7
 * Feature: reestructuracion-catalogo-productos
 */

const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  resolverTabla,
  TABLAS_VALIDAS,
} = require('../src/controladores/controladorProductos');
const { ejecutarQuery } = require('../src/configuracion/baseDatos');

// Mock de la base de datos
jest.mock('../src/configuracion/baseDatos');

describe('Controlador de Productos', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      query: {},
      params: {},
      body: {},
      usuario: { id: 1, username: 'admin', nombre: 'Admin Test' },
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  // ---------------------------------------------------------------------------
  // resolverTabla
  // ---------------------------------------------------------------------------
  describe('resolverTabla', () => {
    test('retorna nombre de tabla correcto para categorÃ­a vÃ¡lida', () => {
      expect(resolverTabla('procesador')).toBe('productos_procesador');
      expect(resolverTabla('gpu')).toBe('productos_gpu');
      expect(resolverTabla('ram')).toBe('productos_ram');
      expect(resolverTabla('cooler_aire')).toBe('productos_refrigeracion');
    });

    test('acepta categorÃ­a en mayÃºsculas', () => {
      expect(resolverTabla('PROCESADOR')).toBe('productos_procesador');
      expect(resolverTabla('GPU')).toBe('productos_gpu');
    });

    test('acepta categorÃ­a con espacios', () => {
      expect(resolverTabla(' procesador ')).toBe('productos_procesador');
    });

    test('lanza error para Categoría inválida', () => {
      expect(() => resolverTabla('invalida')).toThrow('Categoría inválida');
      expect(() => resolverTabla('productos; DROP TABLE')).toThrow('Categoría inválida');
    });

    test('lanza error para string vacÃ­o', () => {
      expect(() => resolverTabla('')).toThrow('Categoría inválida');
    });

    test('lanza error para null/undefined', () => {
      expect(() => resolverTabla(null)).toThrow('Categoría inválida');
      expect(() => resolverTabla(undefined)).toThrow('Categoría inválida');
    });

    test('TABLAS_VALIDAS contiene 23 categorÃ­as', () => {
      expect(TABLAS_VALIDAS.size).toBeGreaterThanOrEqual(15);
    });
  });

  // ---------------------------------------------------------------------------
  // obtenerProductos
  // ---------------------------------------------------------------------------
  describe('obtenerProductos', () => {
    test('debe retornar todos los productos (UNION ALL) sin filtro de categorÃ­a', async () => {
      const productosMock = [
        { id: 1, nombre: 'Intel i7', categoria: 'procesador', stock: 5, disponible_a_pedido: false },
        { id: 2, nombre: 'AMD Ryzen 5', categoria: 'procesador', stock: 0, disponible_a_pedido: true },
      ];

      ejecutarQuery.mockResolvedValue({ rows: productosMock });

      await obtenerProductos(req, res);

      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        cantidad: 2,
        productos: productosMock,
      });

      // Verifica que el query contiene UNION ALL (sin categorÃ­a especificada)
      const queryEjecutada = ejecutarQuery.mock.calls[0][0];
      expect(queryEjecutada).toContain('UNION ALL');
    });

    test('debe filtrar por categorÃ­a usando tabla especÃ­fica', async () => {
      req.query.categoria = 'procesador';

      ejecutarQuery.mockResolvedValue({ rows: [] });

      await obtenerProductos(req, res);

      const queryEjecutada = ejecutarQuery.mock.calls[0][0];
      expect(queryEjecutada).toContain('productos_procesador');
      expect(queryEjecutada).not.toContain('UNION ALL');
    });

    test('debe filtrar por categorÃ­a y socket', async () => {
      req.query.categoria = 'placa_madre';
      req.query.socket = 'AM5';

      ejecutarQuery.mockResolvedValue({ rows: [] });

      await obtenerProductos(req, res);

      const queryEjecutada = ejecutarQuery.mock.calls[0][0];
      expect(queryEjecutada).toContain('productos_placa_madre');
      expect(queryEjecutada).toContain('socket = $1');
      expect(ejecutarQuery).toHaveBeenCalledWith(expect.any(String), ['AM5']);
    });

    test('debe retornar 400 para Categoría inválida', async () => {
      req.query.categoria = 'sql_injection; DROP TABLE';

      await obtenerProductos(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Categoría inválida' })
      );
    });

    test('debe manejar errores de base de datos', async () => {
      ejecutarQuery.mockRejectedValue(new Error('Error de conexiÃ³n'));

      await obtenerProductos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener productos',
        mensaje: 'No se pudieron recuperar los productos',
      });
    });

    test('debe incluir filtro stock > 0 OR disponible_a_pedido', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });

      await obtenerProductos(req, res);

      const queryEjecutada = ejecutarQuery.mock.calls[0][0];
      expect(queryEjecutada).toContain('stock > 0 OR disponible_a_pedido = true');
    });
  });

  // ---------------------------------------------------------------------------
  // obtenerProductoPorId â€” ahora requiere req.params.categoria
  // ---------------------------------------------------------------------------
  describe('obtenerProductoPorId', () => {
    test('debe retornar un producto por ID vÃ¡lido', async () => {
      req.params.categoria = 'procesador';
      req.params.id = '1';
      const productoMock = { id: 1, nombre: 'Intel i7', categoria: 'procesador' };

      ejecutarQuery.mockResolvedValue({ rows: [productoMock] });

      await obtenerProductoPorId(req, res);

      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        producto: productoMock,
      });
    });

    test('debe retornar 400 para ID inválido', async () => {
      req.params.categoria = 'procesador';
      req.params.id = 'abc';

      await obtenerProductoPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'ID inválido',
        mensaje: expect.any(String),
      });
    });

    test('debe retornar 400 para Categoría inválida', async () => {
      req.params.categoria = 'inyeccion_sql';
      req.params.id = '1';

      await obtenerProductoPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Categoría inválida' })
      );
    });

    test('debe retornar 404 si el producto no existe', async () => {
      req.params.categoria = 'procesador';
      req.params.id = '999';

      ejecutarQuery.mockResolvedValue({ rows: [] });

      await obtenerProductoPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Producto no encontrado',
        mensaje: expect.stringContaining('999'),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // crearProducto
  // ---------------------------------------------------------------------------
  describe('crearProducto', () => {
    test('debe crear un producto vÃ¡lido en la tabla correcta', async () => {
      req.body = {
        nombre: 'Intel Core i7-13700K',
        categoria: 'procesador',
        socket: 'LGA1700',
        tdp: 125,
        precio_base: 450.00,
        stock: 10,
      };

      const productoCreado = { id: 1, ...req.body };
      ejecutarQuery.mockResolvedValue({ rows: [productoCreado] });

      await crearProducto(req, res);

      // Verifica que se insertÃ³ en la tabla correcta
      const queryEjecutada = ejecutarQuery.mock.calls[0][0];
      expect(queryEjecutada).toContain('productos_procesador');

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        mensaje: 'Producto creado exitosamente',
        producto: productoCreado,
      });
    });

    test('debe rechazar producto con Datos inválidos', async () => {
      req.body = {
        nombre: 'AB',
        categoria: 'procesador',
        precio_base: -100,
        stock: 10,
      };

      await crearProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Datos inválidos',
        errores: expect.any(Array),
      });
    });

    test('debe retornar 400 para Categoría inválida', async () => {
      req.body = {
        nombre: 'Producto Test',
        categoria: 'invalida',
        precio_base: 100,
        stock: 5,
      };

      await crearProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debe manejar productos duplicados', async () => {
      req.body = {
        nombre: 'Intel Core i7-13700K',
        categoria: 'procesador',
        socket: 'LGA1700',
        tdp: 125,
        precio_base: 450.00,
        stock: 10,
      };

      const error = new Error('Duplicate');
      error.code = '23505';
      ejecutarQuery.mockRejectedValue(error);

      await crearProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Producto duplicado',
        mensaje: expect.any(String),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // actualizarProducto â€” ahora requiere req.params.categoria
  // ---------------------------------------------------------------------------
  describe('actualizarProducto', () => {
    test('debe actualizar un producto existente en tabla correcta', async () => {
      req.params.categoria = 'procesador';
      req.params.id = '1';
      req.body = {
        precio_base: 500.00,
        stock: 15,
      };

      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, ...req.body }] });

      await actualizarProducto(req, res);

      // Verifica tabla correcta
      const queryExistencia = ejecutarQuery.mock.calls[0][0];
      expect(queryExistencia).toContain('productos_procesador');

      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        mensaje: 'Producto actualizado exitosamente',
        producto: expect.objectContaining({ id: 1 }),
      });
    });

    test('debe retornar 404 si el producto no existe', async () => {
      req.params.categoria = 'procesador';
      req.params.id = '999';
      req.body = { precio_base: 500.00 };

      ejecutarQuery.mockResolvedValue({ rows: [] });

      await actualizarProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe retornar 400 si no hay datos para actualizar', async () => {
      req.params.categoria = 'procesador';
      req.params.id = '1';
      req.body = {};

      ejecutarQuery.mockResolvedValue({ rows: [{ id: 1 }] });

      await actualizarProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Sin datos para actualizar',
        mensaje: expect.any(String),
      });
    });

    test('debe retornar 400 para Categoría inválida', async () => {
      req.params.categoria = 'inyeccion';
      req.params.id = '1';
      req.body = { stock: 5 };

      await actualizarProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Categoría inválida' })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // eliminarProducto â€” ahora requiere req.params.categoria
  // ---------------------------------------------------------------------------
  describe('eliminarProducto', () => {
    test('debe eliminar un producto sin referencias', async () => {
      req.params.categoria = 'procesador';
      req.params.id = '1';

      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Intel i7' }] })
        .mockResolvedValueOnce({ rows: [{ cantidad: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await eliminarProducto(req, res);

      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        mensaje: 'Producto eliminado exitosamente',
        producto: { id: 1, nombre: 'Intel i7' },
      });
    });

    test('debe rechazar eliminaciÃ³n si estÃ¡ en cotizaciones', async () => {
      req.params.categoria = 'procesador';
      req.params.id = '1';

      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Intel i7' }] })
        .mockResolvedValueOnce({ rows: [{ cantidad: '5' }] });

      await eliminarProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Producto en uso',
        mensaje: expect.stringContaining('cotizaciones'),
      });
    });

    test('debe retornar 404 si el producto no existe', async () => {
      req.params.categoria = 'procesador';
      req.params.id = '999';

      ejecutarQuery.mockResolvedValue({ rows: [] });

      await eliminarProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('debe retornar 400 para Categoría inválida', async () => {
      req.params.categoria = 'malicious_table';
      req.params.id = '1';

      await eliminarProducto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ---------------------------------------------------------------------------
  // ValidaciÃ³n de disponibilidad
  // ---------------------------------------------------------------------------
  describe('ValidaciÃ³n de disponibilidad', () => {
    test('debe incluir productos con stock > 0', async () => {
      const productosMock = [
        { id: 1, nombre: 'Producto A', stock: 5, disponible_a_pedido: false },
      ];

      ejecutarQuery.mockResolvedValue({ rows: productosMock });

      await obtenerProductos(req, res);

      const queryEjecutada = ejecutarQuery.mock.calls[0][0];
      expect(queryEjecutada).toContain('stock > 0 OR disponible_a_pedido = true');
    });

    test('debe incluir productos disponibles a pedido', async () => {
      const productosMock = [
        { id: 2, nombre: 'Producto B', stock: 0, disponible_a_pedido: true },
      ];

      ejecutarQuery.mockResolvedValue({ rows: productosMock });

      await obtenerProductos(req, res);

      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        cantidad: 1,
        productos: productosMock,
      });
    });
  });
});


