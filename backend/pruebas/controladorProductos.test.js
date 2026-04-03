/**
 * Tests para Controlador de Productos
 * 
 * Valida operaciones CRUD, filtrado, validación y manejo de errores
 * 
 * Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3
 */

const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} = require('../src/controladores/controladorProductos');
const { ejecutarQuery } = require('../src/configuracion/baseDatos');

// Mock de la base de datos
jest.mock('../src/configuracion/baseDatos');

describe('Controlador de Productos', () => {
  let req, res;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request y response
    req = {
      query: {},
      params: {},
      body: {},
      usuario: { id: 1, username: 'admin', nombre: 'Admin Test' }
    };
    
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });
  
  describe('obtenerProductos', () => {
    test('debe retornar todos los productos disponibles', async () => {
      const productosMock = [
        { id: 1, nombre: 'Intel i7', categoria: 'procesador', stock: 5, disponible_a_pedido: false },
        { id: 2, nombre: 'AMD Ryzen 5', categoria: 'procesador', stock: 0, disponible_a_pedido: true }
      ];
      
      ejecutarQuery.mockResolvedValue({ rows: productosMock });
      
      await obtenerProductos(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        cantidad: 2,
        productos: productosMock
      });
    });
    
    test('debe filtrar por categoría', async () => {
      req.query.categoria = 'procesador';
      
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await obtenerProductos(req, res);
      
      expect(ejecutarQuery).toHaveBeenCalledWith(
        expect.stringContaining('categoria = $1'),
        ['procesador']
      );
    });
    
    test('debe filtrar por socket', async () => {
      req.query.socket = 'AM5';
      
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await obtenerProductos(req, res);
      
      expect(ejecutarQuery).toHaveBeenCalledWith(
        expect.stringContaining('socket = $1'),
        ['AM5']
      );
    });
    
    test('debe filtrar por categoría y socket', async () => {
      req.query.categoria = 'placa_madre';
      req.query.socket = 'AM5';
      
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await obtenerProductos(req, res);
      
      expect(ejecutarQuery).toHaveBeenCalledWith(
        expect.stringContaining('categoria = $1'),
        ['placa_madre', 'AM5']
      );
    });
    
    test('debe manejar errores de base de datos', async () => {
      ejecutarQuery.mockRejectedValue(new Error('Error de conexión'));
      
      await obtenerProductos(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener productos',
        mensaje: 'No se pudieron recuperar los productos'
      });
    });
  });
  
  describe('obtenerProductoPorId', () => {
    test('debe retornar un producto por ID válido', async () => {
      req.params.id = '1';
      const productoMock = { id: 1, nombre: 'Intel i7', categoria: 'procesador' };
      
      ejecutarQuery.mockResolvedValue({ rows: [productoMock] });
      
      await obtenerProductoPorId(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        producto: productoMock
      });
    });
    
    test('debe retornar 400 para ID inválido', async () => {
      req.params.id = 'abc';
      
      await obtenerProductoPorId(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'ID inválido',
        mensaje: expect.any(String)
      });
    });
    
    test('debe retornar 404 si el producto no existe', async () => {
      req.params.id = '999';
      
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await obtenerProductoPorId(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Producto no encontrado',
        mensaje: expect.stringContaining('999')
      });
    });
  });
  
  describe('crearProducto', () => {
    test('debe crear un producto válido', async () => {
      req.body = {
        nombre: 'Intel Core i7-13700K',
        categoria: 'procesador',
        socket: 'LGA1700',
        tdp: 125,
        precio_base: 450.00,
        stock: 10
      };
      
      const productoCreado = { id: 1, ...req.body };
      ejecutarQuery.mockResolvedValue({ rows: [productoCreado] });
      
      await crearProducto(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        mensaje: 'Producto creado exitosamente',
        producto: productoCreado
      });
    });
    
    test('debe rechazar producto con datos inválidos', async () => {
      req.body = {
        nombre: 'AB', // Muy corto
        categoria: 'procesador',
        precio_base: -100, // Negativo
        stock: 10
      };
      
      await crearProducto(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Datos inválidos',
        errores: expect.any(Array)
      });
    });
    
    test('debe manejar productos duplicados', async () => {
      req.body = {
        nombre: 'Intel Core i7-13700K',
        categoria: 'procesador',
        socket: 'LGA1700',
        tdp: 125,
        precio_base: 450.00,
        stock: 10
      };
      
      const error = new Error('Duplicate');
      error.code = '23505';
      ejecutarQuery.mockRejectedValue(error);
      
      await crearProducto(req, res);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Producto duplicado',
        mensaje: expect.any(String)
      });
    });
  });
  
  describe('actualizarProducto', () => {
    test('debe actualizar un producto existente', async () => {
      req.params.id = '1';
      req.body = {
        precio_base: 500.00,
        stock: 15
      };
      
      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Verificar existencia
        .mockResolvedValueOnce({ rows: [{ id: 1, ...req.body }] }); // Actualizar
      
      await actualizarProducto(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        mensaje: 'Producto actualizado exitosamente',
        producto: expect.objectContaining({ id: 1 })
      });
    });
    
    test('debe retornar 404 si el producto no existe', async () => {
      req.params.id = '999';
      req.body = { precio_base: 500.00 };
      
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await actualizarProducto(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });
    
    test('debe retornar 400 si no hay datos para actualizar', async () => {
      req.params.id = '1';
      req.body = {};
      
      ejecutarQuery.mockResolvedValue({ rows: [{ id: 1 }] });
      
      await actualizarProducto(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Sin datos para actualizar',
        mensaje: expect.any(String)
      });
    });
  });
  
  describe('eliminarProducto', () => {
    test('debe eliminar un producto sin referencias', async () => {
      req.params.id = '1';
      
      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Intel i7' }] }) // Verificar existencia
        .mockResolvedValueOnce({ rows: [{ cantidad: '0' }] }) // Verificar cotizaciones
        .mockResolvedValueOnce({ rows: [] }); // Eliminar
      
      await eliminarProducto(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        mensaje: 'Producto eliminado exitosamente',
        producto: { id: 1, nombre: 'Intel i7' }
      });
    });
    
    test('debe rechazar eliminación si está en cotizaciones', async () => {
      req.params.id = '1';
      
      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Intel i7' }] })
        .mockResolvedValueOnce({ rows: [{ cantidad: '5' }] }); // En 5 cotizaciones
      
      await eliminarProducto(req, res);
      
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Producto en uso',
        mensaje: expect.stringContaining('cotizaciones')
      });
    });
    
    test('debe retornar 404 si el producto no existe', async () => {
      req.params.id = '999';
      
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await eliminarProducto(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
  
  describe('Validación de disponibilidad', () => {
    test('debe incluir productos con stock > 0', async () => {
      const productosMock = [
        { id: 1, nombre: 'Producto A', stock: 5, disponible_a_pedido: false }
      ];
      
      ejecutarQuery.mockResolvedValue({ rows: productosMock });
      
      await obtenerProductos(req, res);
      
      expect(ejecutarQuery).toHaveBeenCalledWith(
        expect.stringContaining('stock > 0 OR disponible_a_pedido = true'),
        []
      );
    });
    
    test('debe incluir productos disponibles a pedido', async () => {
      const productosMock = [
        { id: 2, nombre: 'Producto B', stock: 0, disponible_a_pedido: true }
      ];
      
      ejecutarQuery.mockResolvedValue({ rows: productosMock });
      
      await obtenerProductos(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        cantidad: 1,
        productos: productosMock
      });
    });
  });
});
