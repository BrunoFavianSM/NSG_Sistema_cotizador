/**
 * Tests de Integración para Productos
 * 
 * Valida el flujo completo de operaciones CRUD con la base de datos
 * 
 * Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3
 */

const request = require('supertest');
const express = require('express');
const { ejecutarQuery } = require('../src/configuracion/baseDatos');
const rutasProductos = require('../src/rutas/productos');

// Crear app de prueba
const app = express();
app.use(express.json());
app.use('/api/productos', rutasProductos);

// Mock de la base de datos
jest.mock('../src/configuracion/baseDatos');

// Mock del middleware de autenticación
jest.mock('../src/middleware/auth', () => ({
  verificarToken: (req, res, next) => {
    req.usuario = { id: 1, username: 'admin', nombre: 'Admin Test' };
    next();
  }
}));

describe('Integración: API de Productos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/productos', () => {
    test('debe retornar lista de productos disponibles', async () => {
      const productosMock = [
        {
          id: 1,
          nombre: 'Intel Core i7-13700K',
          categoria: 'procesador',
          socket: 'LGA1700',
          precio_base: 450.00,
          stock: 10,
          disponible_a_pedido: false
        },
        {
          id: 2,
          nombre: 'AMD Ryzen 7 7700X',
          categoria: 'procesador',
          socket: 'AM5',
          precio_base: 380.00,
          stock: 0,
          disponible_a_pedido: true,
          tiempo_entrega_dias: 7
        }
      ];
      
      ejecutarQuery.mockResolvedValue({ rows: productosMock });
      
      const response = await request(app)
        .get('/api/productos')
        .expect(200);
      
      expect(response.body).toEqual({
        exito: true,
        cantidad: 2,
        productos: productosMock
      });
    });
    
    test('debe filtrar por categoría', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await request(app)
        .get('/api/productos?categoria=procesador')
        .expect(200);
      
      expect(ejecutarQuery).toHaveBeenCalledWith(
        expect.stringContaining('categoria = $1'),
        ['procesador']
      );
    });
    
    test('debe filtrar por socket', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await request(app)
        .get('/api/productos?socket=AM5')
        .expect(200);
      
      expect(ejecutarQuery).toHaveBeenCalledWith(
        expect.stringContaining('socket = $1'),
        ['AM5']
      );
    });
  });
  
  describe('GET /api/productos/:id', () => {
    test('debe retornar un producto específico', async () => {
      const productoMock = {
        id: 1,
        nombre: 'Intel Core i7-13700K',
        categoria: 'procesador',
        socket: 'LGA1700',
        precio_base: 450.00,
        stock: 10
      };
      
      ejecutarQuery.mockResolvedValue({ rows: [productoMock] });
      
      const response = await request(app)
        .get('/api/productos/1')
        .expect(200);
      
      expect(response.body).toEqual({
        exito: true,
        producto: productoMock
      });
    });
    
    test('debe retornar 404 para producto inexistente', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      const response = await request(app)
        .get('/api/productos/999')
        .expect(404);
      
      expect(response.body.error).toBe('Producto no encontrado');
    });
  });
  
  describe('POST /api/productos', () => {
    test('debe crear un nuevo producto', async () => {
      const nuevoProducto = {
        nombre: 'Intel Core i9-13900K',
        categoria: 'procesador',
        socket: 'LGA1700',
        tdp: 125,
        precio_base: 650.00,
        stock: 5,
        descripcion_tecnica: 'Procesador de alto rendimiento'
      };
      
      const productoCreado = { id: 1, ...nuevoProducto };
      ejecutarQuery.mockResolvedValue({ rows: [productoCreado] });
      
      const response = await request(app)
        .post('/api/productos')
        .send(nuevoProducto)
        .expect(201);
      
      expect(response.body).toEqual({
        exito: true,
        mensaje: 'Producto creado exitosamente',
        producto: productoCreado
      });
    });
    
    test('debe rechazar producto sin nombre', async () => {
      const productoInvalido = {
        categoria: 'procesador',
        precio_base: 450.00,
        stock: 10
      };
      
      const response = await request(app)
        .post('/api/productos')
        .send(productoInvalido)
        .expect(400);
      
      expect(response.body.error).toBe('Datos inválidos');
      expect(response.body.errores).toBeDefined();
    });
  });
  
  describe('PUT /api/productos/:id', () => {
    test('debe actualizar un producto existente', async () => {
      const actualizacion = {
        precio_base: 500.00,
        stock: 15
      };
      
      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, ...actualizacion }] });
      
      const response = await request(app)
        .put('/api/productos/1')
        .send(actualizacion)
        .expect(200);
      
      expect(response.body.exito).toBe(true);
      expect(response.body.mensaje).toBe('Producto actualizado exitosamente');
    });
    
    test('debe retornar 404 para producto inexistente', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      const response = await request(app)
        .put('/api/productos/999')
        .send({ precio_base: 500.00 })
        .expect(404);
      
      expect(response.body.error).toBe('Producto no encontrado');
    });
  });
  
  describe('DELETE /api/productos/:id', () => {
    test('debe eliminar un producto sin referencias', async () => {
      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Intel i7' }] })
        .mockResolvedValueOnce({ rows: [{ cantidad: '0' }] })
        .mockResolvedValueOnce({ rows: [] });
      
      const response = await request(app)
        .delete('/api/productos/1')
        .expect(200);
      
      expect(response.body.exito).toBe(true);
      expect(response.body.mensaje).toBe('Producto eliminado exitosamente');
    });
    
    test('debe rechazar eliminación si está en cotizaciones', async () => {
      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Intel i7' }] })
        .mockResolvedValueOnce({ rows: [{ cantidad: '5' }] });
      
      const response = await request(app)
        .delete('/api/productos/1')
        .expect(409);
      
      expect(response.body.error).toBe('Producto en uso');
    });
  });
  
  describe('Validación de disponibilidad (Requisito 2.2)', () => {
    test('debe incluir solo productos con stock > 0 O disponible_a_pedido', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await request(app)
        .get('/api/productos')
        .expect(200);
      
      // Verificar que la query incluye la condición correcta
      expect(ejecutarQuery).toHaveBeenCalledWith(
        expect.stringContaining('stock > 0 OR disponible_a_pedido = true'),
        []
      );
    });
  });
});
