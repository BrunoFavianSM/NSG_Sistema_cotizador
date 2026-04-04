/**
 * Tests para AdminConfiguracion
 * Valida Requisitos: 6.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfiguracion from './AdminConfiguracion';
import * as api from '../servicios/api';

// Mock del contexto
const mockActualizarMargen = jest.fn();
const mockContextValue = {
  autenticado: true,
  margenGanancia: 20,
  actualizarMargen: mockActualizarMargen
};

jest.mock('../contexto/AppContext', () => ({
  useAppContext: () => mockContextValue
}));

// Mock de framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  }
}));

// Mock de la API
jest.mock('../servicios/api', () => ({
  obtenerEstadisticasIA: jest.fn()
}));

describe('AdminConfiguracion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContextValue.autenticado = true;
    mockContextValue.margenGanancia = 20;
    api.obtenerEstadisticasIA.mockResolvedValue({
      llamadas: 150,
      costoEstimado: '0.75',
      promedioTokens: 500
    });
  });

  test('muestra acceso denegado si no está autenticado', () => {
    mockContextValue.autenticado = false;
    render(<AdminConfiguracion />);
    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
  });

  test('renderiza correctamente cuando está autenticado', async () => {
    render(<AdminConfiguracion />);
    
    expect(screen.getByText('Configuración del Sistema')).toBeInTheDocument();
    expect(screen.getByText('Margen de Ganancia')).toBeInTheDocument();
    expect(screen.getByText('Estadísticas de Uso de IA')).toBeInTheDocument();
  });

  test('muestra el margen actual correctamente', () => {
    render(<AdminConfiguracion />);
    
    const margenActual = screen.getByText('20%');
    expect(margenActual).toBeInTheDocument();
  });

  test('permite cambiar el valor del margen', () => {
    render(<AdminConfiguracion />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '25' } });
    
    expect(input.value).toBe('25');
  });

  test('calcula ejemplos de precios correctamente', () => {
    render(<AdminConfiguracion />);
    
    // Con margen del 20%, precio base 1000 debe ser 1200
    expect(screen.getByText(/Precio Final: S\/ 1200\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Precio Final: S\/ 3000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Precio Final: S\/ 6000\.00/)).toBeInTheDocument();
  });

  test('actualiza ejemplos cuando cambia el margen', () => {
    render(<AdminConfiguracion />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '30' } });
    
    // Con margen del 30%, precio base 1000 debe ser 1300
    expect(screen.getByText(/Precio Final: S\/ 1300\.00/)).toBeInTheDocument();
  });

  test('deshabilita el botón guardar si el margen no cambió', () => {
    render(<AdminConfiguracion />);
    
    const botonGuardar = screen.getByRole('button', { name: /Guardar Cambios/i });
    expect(botonGuardar).toBeDisabled();
  });

  test('habilita el botón guardar cuando el margen cambia', () => {
    render(<AdminConfiguracion />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '25' } });
    
    const botonGuardar = screen.getByRole('button', { name: /Guardar Cambios/i });
    expect(botonGuardar).not.toBeDisabled();
  });

  test('guarda el margen correctamente', async () => {
    render(<AdminConfiguracion />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '25' } });
    
    const botonGuardar = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(botonGuardar);
    
    await waitFor(() => {
      expect(mockActualizarMargen).toHaveBeenCalledWith(25);
    });
  });

  test('muestra mensaje de éxito después de guardar', async () => {
    render(<AdminConfiguracion />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '25' } });
    
    const botonGuardar = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(botonGuardar);
    
    await waitFor(() => {
      expect(screen.getByText(/Margen de ganancia actualizado a 25%/)).toBeInTheDocument();
    });
  });

  test('no permite valores negativos en el margen', () => {
    render(<AdminConfiguracion />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '-5' } });
    
    // El valor no debe cambiar
    expect(input.value).toBe('20');
  });

  test('no permite valores mayores a 100 en el margen', () => {
    render(<AdminConfiguracion />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '150' } });
    
    // El valor no debe cambiar
    expect(input.value).toBe('20');
  });

  test('carga estadísticas de IA al montar', async () => {
    render(<AdminConfiguracion />);
    
    await waitFor(() => {
      expect(api.obtenerEstadisticasIA).toHaveBeenCalled();
    });
  });

  test('muestra estadísticas de IA correctamente', async () => {
    render(<AdminConfiguracion />);
    
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Llamadas
      expect(screen.getByText('$0.75')).toBeInTheDocument(); // Costo
      expect(screen.getByText('500')).toBeInTheDocument(); // Tokens
    });
  });

  test('muestra indicador de carga mientras obtiene estadísticas', () => {
    render(<AdminConfiguracion />);
    
    expect(screen.getByText('Cargando estadísticas...')).toBeInTheDocument();
  });

  test('maneja error al cargar estadísticas', async () => {
    api.obtenerEstadisticasIA.mockRejectedValue(new Error('Error de red'));
    
    render(<AdminConfiguracion />);
    
    await waitFor(() => {
      // Debe mostrar valores por defecto (hay múltiples "0", verificamos que existan)
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });
  });

  test('permite actualizar estadísticas manualmente', async () => {
    render(<AdminConfiguracion />);
    
    await waitFor(() => {
      expect(api.obtenerEstadisticasIA).toHaveBeenCalledTimes(1);
    });
    
    const botonActualizar = screen.getByRole('button', { name: /Actualizar/i });
    fireEvent.click(botonActualizar);
    
    await waitFor(() => {
      expect(api.obtenerEstadisticasIA).toHaveBeenCalledTimes(2);
    });
  });

  test('muestra información sobre las estadísticas', async () => {
    render(<AdminConfiguracion />);
    
    await waitFor(() => {
      expect(screen.getByText(/Las estadísticas se actualizan en tiempo real/)).toBeInTheDocument();
      expect(screen.getByText(/El costo es estimado basado en el uso de Gemini 1.5 Flash/)).toBeInTheDocument();
    });
  });

  test('calcula precio ejemplo con decimales correctamente', () => {
    render(<AdminConfiguracion />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '15.5' } });
    
    // Con margen del 15.5%, precio base 1000 debe ser 1155.00
    expect(screen.getByText(/Precio Final: S\/ 1155\.00/)).toBeInTheDocument();
  });

  test('muestra tres ejemplos de precios diferentes', () => {
    render(<AdminConfiguracion />);
    
    expect(screen.getByText(/Precio Base: S\/ 1000/)).toBeInTheDocument();
    expect(screen.getByText(/Precio Base: S\/ 2500/)).toBeInTheDocument();
    expect(screen.getByText(/Precio Base: S\/ 5000/)).toBeInTheDocument();
  });

  test('el formulario previene submit por defecto', async () => {
    render(<AdminConfiguracion />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '25' } });
    
    const form = screen.getByRole('button', { name: /Guardar Cambios/i }).closest('form');
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
    
    form.dispatchEvent(submitEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});

