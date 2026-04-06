/**
 * Tests para AppContext
 * 
 * Valida Requisitos: 14.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AppProvider, useAppContext } from './AppContext';
import * as api from '../servicios/api';

// Mock del módulo de API
vi.mock('../servicios/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  verificarToken: vi.fn(),
  obtenerUsuarioActual: vi.fn(),
  obtenerProductos: vi.fn(),
  obtenerProductoPorId: vi.fn(),
  validarCompatibilidad: vi.fn(),
  obtenerMargenGanancia: vi.fn(),
  actualizarMargenGanancia: vi.fn()
}));

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.obtenerMargenGanancia.mockResolvedValue({
      exito: true,
      margen_ganancia: 20
    });
    api.actualizarMargenGanancia.mockResolvedValue({
      exito: true,
      margen_ganancia: 25
    });
  });

  describe('Autenticación', () => {
    it('debe inicializar sin usuario autenticado', async () => {
      api.obtenerUsuarioActual.mockReturnValue(null);
      
      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.cargandoAuth).toBe(false);
      });

      expect(result.current.autenticado).toBe(false);
      expect(result.current.usuario).toBeNull();
    });

    it('debe hacer login correctamente', async () => {
      api.obtenerUsuarioActual.mockReturnValue(null);
      api.login.mockResolvedValue({
        exito: true,
        usuario: { id: 1, username: 'admin' },
        token: 'test-token'
      });

      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.cargandoAuth).toBe(false);
      });

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login('admin', 'password');
      });

      expect(loginResult.exito).toBe(true);
      expect(result.current.autenticado).toBe(true);
      expect(result.current.usuario).toEqual({ id: 1, username: 'admin' });
    });

    it('debe hacer logout correctamente', async () => {
      api.obtenerUsuarioActual.mockReturnValue({ id: 1, username: 'admin' });
      localStorage.setItem('token', 'test-token');
      api.verificarToken.mockResolvedValue({ valido: true });

      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.autenticado).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.autenticado).toBe(false);
      expect(result.current.usuario).toBeNull();
    });
  });

  describe('Productos', () => {
    it('debe cargar productos correctamente', async () => {
      api.obtenerUsuarioActual.mockReturnValue(null);
      const productosSimulados = [
        { id: 1, nombre: 'Procesador Intel i5', categoria: 'procesador', precio_base: 500 },
        { id: 2, nombre: 'RAM 8GB', categoria: 'ram', precio_base: 100 }
      ];
      api.obtenerProductos.mockResolvedValue(productosSimulados);

      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.cargandoAuth).toBe(false);
      });

      await act(async () => {
        await result.current.cargarProductos();
      });

      expect(result.current.productos).toEqual(productosSimulados);
      expect(result.current.cargandoProductos).toBe(false);
    });

    it('debe filtrar productos por categoría', async () => {
      api.obtenerUsuarioActual.mockReturnValue(null);
      const productosSimulados = [
        { id: 1, nombre: 'Procesador Intel i5', categoria: 'procesador', precio_base: 500 },
        { id: 2, nombre: 'RAM 8GB', categoria: 'ram', precio_base: 100 },
        { id: 3, nombre: 'Procesador AMD Ryzen', categoria: 'procesador', precio_base: 450 }
      ];
      api.obtenerProductos.mockResolvedValue(productosSimulados);

      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.cargandoAuth).toBe(false);
      });

      await act(async () => {
        await result.current.cargarProductos();
      });

      const procesadores = result.current.obtenerProductosPorCategoria('procesador');
      expect(procesadores).toHaveLength(2);
      expect(procesadores.every(p => p.categoria === 'procesador')).toBe(true);
    });
  });

  describe('Configuración Seleccionada', () => {
    it('debe seleccionar componentes correctamente', async () => {
      api.obtenerUsuarioActual.mockReturnValue(null);

      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.cargandoAuth).toBe(false);
      });

      const procesador = { id: 1, nombre: 'Intel i5', precio_base: 500 };

      act(() => {
        result.current.seleccionarComponente('procesador', procesador);
      });

      expect(result.current.configuracionSeleccionada.procesador).toEqual(procesador);
    });

    it('debe agregar y eliminar RAM correctamente', async () => {
      api.obtenerUsuarioActual.mockReturnValue(null);

      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.cargandoAuth).toBe(false);
      });

      const ram1 = { id: 1, nombre: 'RAM 8GB', precio_base: 100 };
      const ram2 = { id: 2, nombre: 'RAM 16GB', precio_base: 200 };

      act(() => {
        result.current.agregarRAM(ram1);
        result.current.agregarRAM(ram2);
      });

      expect(result.current.configuracionSeleccionada.ram).toHaveLength(2);

      act(() => {
        result.current.eliminarRAM(0);
      });

      expect(result.current.configuracionSeleccionada.ram).toHaveLength(1);
      expect(result.current.configuracionSeleccionada.ram[0]).toEqual(ram2);
    });

    it('debe limpiar configuración correctamente', async () => {
      api.obtenerUsuarioActual.mockReturnValue(null);

      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.cargandoAuth).toBe(false);
      });

      act(() => {
        result.current.seleccionarComponente('procesador', { id: 1, nombre: 'Intel i5' });
        result.current.agregarRAM({ id: 2, nombre: 'RAM 8GB' });
      });

      expect(result.current.configuracionSeleccionada.procesador).not.toBeNull();
      expect(result.current.configuracionSeleccionada.ram).toHaveLength(1);

      act(() => {
        result.current.limpiarConfiguracion();
      });

      expect(result.current.configuracionSeleccionada.procesador).toBeNull();
      expect(result.current.configuracionSeleccionada.ram).toHaveLength(0);
    });

    it('debe calcular precio total correctamente', async () => {
      api.obtenerUsuarioActual.mockReturnValue(null);

      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.cargandoAuth).toBe(false);
      });

      act(() => {
        result.current.seleccionarComponente('procesador', { id: 1, precio_base: 500 });
        result.current.seleccionarComponente('placa_madre', { id: 2, precio_base: 300 });
        result.current.agregarRAM({ id: 3, precio_base: 100 });
        result.current.agregarRAM({ id: 4, precio_base: 100 });
      });

      const precioTotal = result.current.calcularPrecioTotal();
      
      // Total base: 500 + 300 + 100 + 100 = 1000
      // Con margen 20%: 1000 * 1.20 = 1200
      expect(precioTotal).toBe(1200);
    });

    it('debe verificar si configuración está completa', async () => {
      api.obtenerUsuarioActual.mockReturnValue(null);

      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.cargandoAuth).toBe(false);
      });

      expect(result.current.configuracionCompleta()).toBe(false);

      act(() => {
        result.current.seleccionarComponente('procesador', { id: 1 });
        result.current.seleccionarComponente('placa_madre', { id: 2 });
        result.current.agregarRAM({ id: 3 });
        result.current.seleccionarComponente('almacenamiento', { id: 4 });
        result.current.seleccionarComponente('gpu', { id: 5 });
        result.current.seleccionarComponente('fuente', { id: 6 });
        result.current.seleccionarComponente('case', { id: 7 });
      });

      expect(result.current.configuracionCompleta()).toBe(true);
    });
  });

  describe('Compatibilidad', () => {
    it('debe validar compatibilidad correctamente', async () => {
      api.obtenerUsuarioActual.mockReturnValue(null);
      api.validarCompatibilidad.mockResolvedValue({
        compatible: true,
        errores: [],
        advertencias: ['Margen ajustado de potencia']
      });

      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.cargandoAuth).toBe(false);
      });

      let validacion;
      await act(async () => {
        validacion = await result.current.validarCompatibilidad();
      });

      expect(validacion.compatible).toBe(true);
      expect(validacion.advertencias).toHaveLength(1);
    });
  });

  describe('Margen de Ganancia', () => {
    it('debe actualizar margen de ganancia', async () => {
      api.obtenerUsuarioActual.mockReturnValue(null);

      const { result } = renderHook(() => useAppContext(), {
        wrapper: AppProvider
      });

      await waitFor(() => {
        expect(result.current.cargandoAuth).toBe(false);
      });

      expect(result.current.margenGanancia).toBe(20);

      act(() => {
        result.current.actualizarMargen(25);
      });

      await waitFor(() => {
        expect(result.current.margenGanancia).toBe(25);
      });
    });
  });
});

