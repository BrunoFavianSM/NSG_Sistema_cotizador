/**
 * Tests de Integración para Productos — Arquitectura multi-tabla
 *
 * Valida el flujo completo de operaciones CRUD usando las rutas /:categoria/:id.
 *
 * Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.5, 3.6, 3.7
 * Feature: reestructuracion-catalogo-productos
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
  },
}));

// Mock del middleware multer de imagen
jest.mock('../src/middleware/multerImagen', () => ({
  single: () => (req, res, next) => next(),
}));

describe('Integración: API de Productos (multi-tabla)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/productos', () => {
    test('debe retornar lista de productos (UNION ALL sin categoría)', async () => {
      const productosMock = [
        {
          id: 1,
          nombre: 'Intel Core i7-13700K',
          categoria: 'procesador',
          socket: 'LGA1700',
          precio_base: 450.0,
          stock: 10,
          disponible_a_pedido: false,
        },
        {
          id: 2,
          nombre: 'AMD Ryzen 7 7700X',
          categoria: 'procesador',
          socket: 'AM5',
          precio_base: 380.0,
          stock: 0,
          disponible_a_pedido: true,
          tiempo_entrega_dias: 7,
        },
      ];

      ejecutarQuery.mockResolvedValue({ rows: productosMock });

      const response = await request(app).get('/api/productos').expect(200);

      expect(response.body).toEqual({
        exito: true,
        cantidad: 2,
        productos: productosMock,
      });
    });

    test('debe filtrar por categoría (tabla específica)', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });

      await request(app).get('/api/productos?categoria=procesador').expect(200);

      const queryEjecutada = ejecutarQuery.mock.calls[0][0];
      expect(queryEjecutada).toContain('productos_procesador');
      expect(queryEjecutada).not.toContain('UNION ALL');
    });

    test('debe retornar 400 para categoría inválida', async () => {
      const response = await request(app).get('/api/productos?categoria=sql_injection').expect(400);

      expect(response.body.error).toBe('Categoría inválida');
    });

    test('debe filtrar por categoría y socket', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });

      await request(app).get('/api/productos?categoria=placa_madre&socket=AM5').expect(200);

      const queryEjecutada = ejecutarQuery.mock.calls[0][0];
      expect(queryEjecutada).toContain('productos_placa_madre');
      expect(queryEjecutada).toContain('socket = $1');
    });
  });

  describe('GET /api/productos/:categoria/:id', () => {
    test('debe retornar un producto específico', async () => {
      const productoMock = {
        id: 1,
        nombre: 'Intel Core i7-13700K',
        categoria: 'procesador',
        socket: 'LGA1700',
        precio_base: 450.0,
        stock: 10,
      };

      ejecutarQuery.mockResolvedValue({ rows: [productoMock] });

      const response = await request(app).get('/api/productos/procesador/1').expect(200);

      expect(response.body).toEqual({
        exito: true,
        producto: productoMock,
      });
    });

    test('debe retornar 404 para producto inexistente', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });

      const response = await request(app).get('/api/productos/procesador/999').expect(404);

      expect(response.body.error).toBe('Producto no encontrado');
    });

    test('debe retornar 400 para categoría inválida', async () => {
      const response = await request(app).get('/api/productos/invalida/1').expect(400);

      expect(response.body.error).toBe('Categoría inválida');
    });
  });

  describe('POST /api/productos', () => {
    test('debe crear un nuevo producto en la tabla correcta', async () => {
      const nuevoProducto = {
        nombre: 'Intel Core i9-13900K',
        categoria: 'procesador',
        socket: 'LGA1700',
        tdp: 125,
        precio_base: 650.0,
        stock: 5,
        descripcion_tecnica: 'Procesador de alto rendimiento',
      };

      const productoCreado = { id: 1, ...nuevoProducto };
      ejecutarQuery.mockResolvedValue({ rows: [productoCreado] });

      const response = await request(app).post('/api/productos').send(nuevoProducto).expect(201);

      expect(response.body).toEqual({
        exito: true,
        mensaje: 'Producto creado exitosamente',
        producto: productoCreado,
      });

      // Verificar que se usa tabla multi-tabla
      const queryEjecutada = ejecutarQuery.mock.calls[0][0];
      expect(queryEjecutada).toContain('productos_procesador');
    });

    test('debe rechazar producto sin nombre', async () => {
      const productoInvalido = {
        categoria: 'procesador',
        precio_base: 450.0,
        stock: 10,
      };

      const response = await request(app).post('/api/productos').send(productoInvalido).expect(400);

      expect(response.body.error).toBe('Datos inválidos');
      expect(response.body.errores).toBeDefined();
    });

    test('debe rechazar categoría inválida', async () => {
      const productoInvalido = {
        nombre: 'Producto Test',
        categoria: 'inyeccion_sql',
        precio_base: 100,
        stock: 5,
      };

      const response = await request(app).post('/api/productos').send(productoInvalido).expect(400);

      // La validación de datos (validarProducto) se ejecuta antes de resolverTabla,
      // por lo que categoría desconocida retorna 'Datos inválidos' primero.
      expect(response.body.error).toBe('Datos inválidos');
    });
  });

  describe('PUT /api/productos/:categoria/:id', () => {
    test('debe actualizar un producto existente', async () => {
      const actualizacion = {
        precio_base: 500.0,
        stock: 15,
      };

      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, ...actualizacion }] });

      const response = await request(app).put('/api/productos/procesador/1').send(actualizacion).expect(200);

      expect(response.body.exito).toBe(true);
      expect(response.body.mensaje).toBe('Producto actualizado exitosamente');
    });

    test('debe retornar 404 para producto inexistente', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });

      const response = await request(app).put('/api/productos/procesador/999').send({ precio_base: 500.0 }).expect(404);

      expect(response.body.error).toBe('Producto no encontrado');
    });

    test('debe retornar 400 para categoría inválida', async () => {
      const response = await request(app).put('/api/productos/invalida/1').send({ stock: 5 }).expect(400);

      expect(response.body.error).toBe('Categoría inválida');
    });
  });

  describe('DELETE /api/productos/:categoria/:id', () => {
    test('debe eliminar un producto sin referencias', async () => {
      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Intel i7' }] })
        .mockResolvedValueOnce({ rows: [{ cantidad: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app).delete('/api/productos/procesador/1').expect(200);

      expect(response.body.exito).toBe(true);
      expect(response.body.mensaje).toBe('Producto eliminado exitosamente');
    });

    test('debe rechazar eliminación si está en cotizaciones', async () => {
      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'Intel i7' }] })
        .mockResolvedValueOnce({ rows: [{ cantidad: '5' }] });

      const response = await request(app).delete('/api/productos/procesador/1').expect(409);

      expect(response.body.error).toBe('Producto en uso');
    });

    test('debe retornar 400 para categoría inválida', async () => {
      const response = await request(app).delete('/api/productos/invalida/1').expect(400);

      expect(response.body.error).toBe('Categoría inválida');
    });
  });

  describe('Validación de disponibilidad (Requisito 2.2)', () => {
    test('debe incluir solo productos con stock > 0 O disponible_a_pedido', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });

      await request(app).get('/api/productos').expect(200);

      // Verificar que la query incluye la condición correcta
      const queryEjecutada = ejecutarQuery.mock.calls[0][0];
      expect(queryEjecutada).toContain('stock > 0 OR disponible_a_pedido = true');
    });
  });
});
