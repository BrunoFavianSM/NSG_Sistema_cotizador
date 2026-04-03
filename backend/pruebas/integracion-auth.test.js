/**
 * Pruebas de Integración para Rutas de Autenticación
 * 
 * Valida endpoints de login y verificación de tokens
 */

const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/rutas/auth');
const servicioAuth = require('../src/servicios/servicioAuth');

// Mock del servicio de autenticación
jest.mock('../src/servicios/servicioAuth');

// Configurar app de prueba
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Rutas de Autenticación - Integración', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key-12345';
  });

  describe('POST /api/auth/login', () => {
    it('debe autenticar correctamente con credenciales válidas', async () => {
      const mockResponse = {
        exito: true,
        token: 'mock-jwt-token',
        usuario: {
          id: 1,
          username: 'admin',
          nombre: 'Administrador Principal'
        }
      };

      servicioAuth.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(servicioAuth.login).toHaveBeenCalledWith('admin', 'password123');
    });

    it('debe retornar 401 con credenciales inválidas', async () => {
      const mockResponse = {
        exito: false,
        error: 'Usuario o contraseña incorrectos'
      };

      servicioAuth.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'passwordIncorrecto'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual(mockResponse);
    });

    it('debe retornar 400 si falta username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.exito).toBe(false);
      expect(response.body.error).toBe('Username y password son requeridos');
    });

    it('debe retornar 400 si falta password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin'
        });

      expect(response.status).toBe(400);
      expect(response.body.exito).toBe(false);
      expect(response.body.error).toBe('Username y password son requeridos');
    });

    it('debe manejar errores del servicio', async () => {
      servicioAuth.login.mockRejectedValue(new Error('Error de base de datos'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body.exito).toBe(false);
      expect(response.body.error).toBe('Error interno del servidor');
    });
  });

  describe('POST /api/auth/verificar', () => {
    it('debe verificar token válido correctamente', async () => {
      // Generar un token real para la prueba
      const payload = {
        id: 1,
        username: 'admin',
        nombre: 'Administrador Principal'
      };
      
      // Usar el servicio real para generar token
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h',
        issuer: 'nsg-cotizacion-system'
      });

      const response = await request(app)
        .post('/api/auth/verificar')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.valido).toBe(true);
      expect(response.body.usuario).toEqual({
        id: 1,
        username: 'admin',
        nombre: 'Administrador Principal'
      });
    });

    it('debe rechazar request sin token', async () => {
      const response = await request(app)
        .post('/api/auth/verificar');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Acceso denegado');
    });

    it('debe rechazar token inválido', async () => {
      const response = await request(app)
        .post('/api/auth/verificar')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Token inválido');
    });

    it('debe rechazar token expirado', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: 1, username: 'admin', nombre: 'Admin' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Token ya expirado
      );

      const response = await request(app)
        .post('/api/auth/verificar')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token expirado');
    });
  });

  describe('Flujo completo de autenticación', () => {
    it('debe permitir login y luego verificar el token generado', async () => {
      // Generar token real
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: 1, username: 'admin', nombre: 'Administrador Principal' },
        process.env.JWT_SECRET,
        { expiresIn: '24h', issuer: 'nsg-cotizacion-system' }
      );

      // Mock del login
      servicioAuth.login.mockResolvedValue({
        exito: true,
        token: token,
        usuario: {
          id: 1,
          username: 'admin',
          nombre: 'Administrador Principal'
        }
      });

      // 1. Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.exito).toBe(true);
      expect(loginResponse.body.token).toBeDefined();

      // 2. Verificar token
      const verifyResponse = await request(app)
        .post('/api/auth/verificar')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.valido).toBe(true);
      expect(verifyResponse.body.usuario.username).toBe('admin');
    });
  });
});
