/**
 * Tests para el servicio de API
 * 
 * Valida la configuración y funciones del cliente Axios
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import * as api from './api';

// Mock de axios
jest.mock('axios');

describe('Servicio de API', () => {
  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Limpiar localStorage
    localStorage.clear();
  });

  describe('Configuración de Axios', () => {
    it('debe tener la configuración base correcta', () => {
      expect(api.default.defaults.baseURL).toBeDefined();
      expect(api.default.defaults.timeout).toBe(30000);
      expect(api.default.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Autenticación', () => {
    it('debe iniciar sesión correctamente', async () => {
      const mockResponse = {
        data: {
          exito: true,
          token: 'test-token',
          usuario: { id: 1, username: 'admin' }
        }
      };

      api.default.post = jest.fn().mockResolvedValue(mockResponse);

      const resultado = await api.login('admin', 'password');

      expect(resultado.exito).toBe(true);
      expect(resultado.token).toBe('test-token');
      expect(localStorage.getItem('token')).toBe('test-token');
    });

    it('debe verificar si el usuario está autenticado', () => {
      expect(api.estaAutenticado()).toBe(false);

      localStorage.setItem('token', 'test-token');
      expect(api.estaAutenticado()).toBe(true);
    });

    it('debe obtener el usuario actual desde localStorage', () => {
      const usuario = { id: 1, username: 'admin' };
      localStorage.setItem('usuario', JSON.stringify(usuario));

      const resultado = api.obtenerUsuarioActual();
      expect(resultado).toEqual(usuario);
    });

    it('debe cerrar sesión correctamente', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('usuario', JSON.stringify({ id: 1 }));

      // Mock window.location
      delete window.location;
      window.location = { href: '' };

      api.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('usuario')).toBeNull();
    });
  });

  describe('Productos', () => {
    it('debe obtener todos los productos', async () => {
      const mockProductos = [
        { id: 1, nombre: 'Producto 1' },
        { id: 2, nombre: 'Producto 2' }
      ];

      api.default.get = jest.fn().mockResolvedValue({ data: mockProductos });

      const resultado = await api.obtenerProductos();
      expect(resultado).toEqual(mockProductos);
      expect(api.default.get).toHaveBeenCalledWith('/productos', { params: {} });
    });

    it('debe obtener un producto por ID', async () => {
      const mockProducto = { id: 1, nombre: 'Producto 1' };

      api.default.get = jest.fn().mockResolvedValue({ data: mockProducto });

      const resultado = await api.obtenerProductoPorId(1);
      expect(resultado).toEqual(mockProducto);
      expect(api.default.get).toHaveBeenCalledWith('/productos/1');
    });

    it('debe crear un nuevo producto', async () => {
      const nuevoProducto = { nombre: 'Nuevo Producto', precio: 100 };
      const mockResponse = { id: 1, ...nuevoProducto };

      api.default.post = jest.fn().mockResolvedValue({ data: mockResponse });

      const resultado = await api.crearProducto(nuevoProducto);
      expect(resultado).toEqual(mockResponse);
      expect(api.default.post).toHaveBeenCalledWith('/productos', nuevoProducto);
    });
  });

  describe('Cotizaciones', () => {
    it('debe crear una nueva cotización', async () => {
      const cotizacion = { cliente: 'Test', productos: [] };
      const mockResponse = { codigoTicket: 'ABC123', ...cotizacion };

      api.default.post = jest.fn().mockResolvedValue({ data: mockResponse });

      const resultado = await api.crearCotizacion(cotizacion);
      expect(resultado).toEqual(mockResponse);
    });

    it('debe consultar una cotización por código', async () => {
      const mockCotizacion = { codigoTicket: 'ABC123', estado: 'pendiente' };

      api.default.get = jest.fn().mockResolvedValue({ data: mockCotizacion });

      const resultado = await api.consultarCotizacion('ABC123');
      expect(resultado).toEqual(mockCotizacion);
      expect(api.default.get).toHaveBeenCalledWith('/cotizaciones/ABC123');
    });
  });

  describe('Compatibilidad', () => {
    it('debe validar compatibilidad de componentes', async () => {
      const componentes = { procesador: 1, motherboard: 2 };
      const mockResponse = { compatible: true, errores: [], advertencias: [] };

      api.default.post = jest.fn().mockResolvedValue({ data: mockResponse });

      const resultado = await api.validarCompatibilidad(componentes);
      expect(resultado).toEqual(mockResponse);
      expect(api.default.post).toHaveBeenCalledWith('/compatibilidad/validar', { componentes });
    });
  });

  describe('Inteligencia Artificial', () => {
    it('debe iniciar una conversación con IA', async () => {
      const mockResponse = {
        sesionId: 'session-123',
        pregunta: '¿Qué tipo de PC necesitas?',
        contexto: {}
      };

      api.default.post = jest.fn().mockResolvedValue({ data: mockResponse });

      const resultado = await api.iniciarConversacionIA('Necesito una PC');
      expect(resultado).toEqual(mockResponse);
    });

    it('debe continuar una conversación con IA', async () => {
      const mockResponse = {
        completado: false,
        pregunta: '¿Qué presupuesto tienes?'
      };

      api.default.post = jest.fn().mockResolvedValue({ data: mockResponse });

      const resultado = await api.continuarConversacionIA('session-123', 'Para gaming');
      expect(resultado).toEqual(mockResponse);
    });
  });

  describe('Funciones auxiliares', () => {
    it('debe verificar el estado de salud del servidor', async () => {
      const mockResponse = { estado: 'ok', baseDatos: 'conectada' };

      axios.get = jest.fn().mockResolvedValue({ data: mockResponse });

      const resultado = await api.verificarSalud();
      expect(resultado).toEqual(mockResponse);
    });
  });
});
