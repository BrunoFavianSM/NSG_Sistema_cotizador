const request = require('supertest');
const app = require('../src/servidor');

describe('Servidor Express - Tarea 2.1', () => {
  describe('Health Check', () => {
    test('GET /health debe retornar estado del servidor', async () => {
      const response = await request(app).get('/health');
      
      // Puede retornar 200 (BD conectada) o 500 (BD no disponible en tests)
      expect([200, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('estado');
      expect(['ok', 'error']).toContain(response.body.estado);
      
      if (response.status === 200) {
        expect(response.body.baseDatos).toBe('conectada');
      } else {
        expect(response.body.baseDatos).toBe('desconectada');
      }
    });
  });

  describe('Middleware de Seguridad', () => {
    test('Debe incluir headers de seguridad (Helmet)', async () => {
      const response = await request(app).get('/health');
      
      // Helmet agrega varios headers de seguridad
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('Debe configurar CORS correctamente', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Manejo de Errores', () => {
    test('Debe retornar 404 para rutas no encontradas', async () => {
      const response = await request(app).get('/ruta-inexistente');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('no encontrada');
    });

    test('Debe manejar errores de JSON inválido', async () => {
      const response = await request(app)
        .post('/api/productos')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      
      expect([400, 501]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    test('Debe aplicar rate limiting a rutas /api/', async () => {
      const response = await request(app).get('/api/productos');
      
      // Verificar que el rate limiter está activo
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
    });
  });

  describe('Rutas Base', () => {
    test('Rutas de productos deben existir', async () => {
      const response = await request(app).get('/api/productos');
      
      // Debe retornar 501 (no implementado) o 200, no 404
      expect([200, 501]).toContain(response.status);
    });

    test('Rutas de cotizaciones deben existir', async () => {
      const response = await request(app).post('/api/cotizaciones');
      
      expect([200, 501, 400]).toContain(response.status);
    });

    test('Rutas de compatibilidad deben existir', async () => {
      const response = await request(app).post('/api/compatibilidad/validar');
      
      expect([200, 501, 400]).toContain(response.status);
    });

    test('Rutas de IA deben existir', async () => {
      const response = await request(app).post('/api/ia/iniciar');
      
      expect([200, 501, 400]).toContain(response.status);
    });

    test('Rutas de auth deben existir', async () => {
      const response = await request(app).post('/api/auth/login');
      
      expect([200, 501, 400, 401]).toContain(response.status);
    });
  });

  describe('Parsers', () => {
    test('Debe parsear JSON correctamente', async () => {
      const response = await request(app)
        .post('/api/productos')
        .send({ nombre: 'Test', precio: 100 })
        .set('Content-Type', 'application/json');
      
      // Si el parser funciona, no debe dar error 400 por parsing
      expect(response.status).not.toBe(400);
    });

    test('Debe parsear URL-encoded correctamente', async () => {
      const response = await request(app)
        .post('/api/productos')
        .send('nombre=Test&precio=100')
        .set('Content-Type', 'application/x-www-form-urlencoded');
      
      expect(response.status).not.toBe(400);
    });
  });
});
