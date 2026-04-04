/**
 * Tests Unitarios para HistorialCliente
 * 
 * Valida:
 * - Renderizado del formulario de búsqueda
 * - Validación de email
 * - Búsqueda de historial
 * - Visualización de resultados
 * - Descarga de PDFs
 * - Manejo de errores
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HistorialCliente from './HistorialCliente';
import * as api from '../servicios/api';

// Mock de servicios API
jest.mock('../servicios/api', () => ({
  consultarHistorialCliente: jest.fn()
}));

// Mock de window.open
const mockWindowOpen = jest.fn();
window.open = mockWindowOpen;

describe('HistorialCliente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado inicial', () => {
    it('debe renderizar el formulario de búsqueda', () => {
      render(<HistorialCliente />);
      
      expect(screen.getByText('Historial de Cotizaciones')).toBeInTheDocument();
      expect(screen.getByLabelText('Email del Cliente')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /buscar historial/i })).toBeInTheDocument();
    });

    it('debe mostrar el placeholder correcto en el input', () => {
      render(<HistorialCliente />);
      
      const input = screen.getByPlaceholderText('ejemplo@correo.com');
      expect(input).toBeInTheDocument();
    });

    it('debe tener el input de email habilitado inicialmente', () => {
      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Validación de email', () => {
    it('debe mostrar error si el email está vacío', async () => {
      render(<HistorialCliente />);
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText('Por favor ingresa tu email')).toBeInTheDocument();
      });
    });

    it('debe mostrar error si el email es inválido', async () => {
      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'email-invalido' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText('Por favor ingresa un email válido')).toBeInTheDocument();
      });
    });

    it('debe aceptar emails válidos', async () => {
      api.consultarHistorialCliente.mockResolvedValue({
        exito: true,
        cliente: { nombre: 'Juan Pérez', email: 'juan@example.com' },
        cotizaciones: []
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(api.consultarHistorialCliente).toHaveBeenCalledWith('juan@example.com');
      });
    });

    it('debe limpiar errores al escribir en el input', async () => {
      render(<HistorialCliente />);
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText('Por favor ingresa tu email')).toBeInTheDocument();
      });
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      
      expect(screen.queryByText('Por favor ingresa tu email')).not.toBeInTheDocument();
    });
  });

  describe('Búsqueda de historial', () => {
    it('debe mostrar estado de carga durante la búsqueda', async () => {
      api.consultarHistorialCliente.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          exito: true,
          cliente: { nombre: 'Juan', email: 'juan@example.com' },
          cotizaciones: []
        }), 100))
      );

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      expect(screen.getByText('Buscando...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Buscando...')).not.toBeInTheDocument();
      });
    });

    it('debe deshabilitar el formulario durante la búsqueda', async () => {
      api.consultarHistorialCliente.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          exito: true,
          cliente: { nombre: 'Juan', email: 'juan@example.com' },
          cotizaciones: []
        }), 100))
      );

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      expect(input).toBeDisabled();
      expect(boton).toBeDisabled();
      
      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });

    it('debe llamar a la API con el email correcto', async () => {
      api.consultarHistorialCliente.mockResolvedValue({
        exito: true,
        cliente: { nombre: 'María', email: 'maria@example.com' },
        cotizaciones: []
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: '  MARIA@EXAMPLE.COM  ' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(api.consultarHistorialCliente).toHaveBeenCalledWith('maria@example.com');
      });
    });
  });

  describe('Visualización de resultados', () => {
    it('debe mostrar información del cliente', async () => {
      api.consultarHistorialCliente.mockResolvedValue({
        exito: true,
        cliente: { nombre: 'Juan Pérez', email: 'juan@example.com' },
        cotizaciones: []
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('juan@example.com')).toBeInTheDocument();
      });
    });

    it('debe mostrar mensaje cuando no hay cotizaciones', async () => {
      api.consultarHistorialCliente.mockResolvedValue({
        exito: true,
        cliente: { nombre: 'Juan', email: 'juan@example.com' },
        cotizaciones: []
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText('No hay cotizaciones')).toBeInTheDocument();
        expect(screen.getByText('0 cotizaciones encontradas')).toBeInTheDocument();
      });
    });

    it('debe mostrar lista de cotizaciones', async () => {
      api.consultarHistorialCliente.mockResolvedValue({
        exito: true,
        cliente: { nombre: 'Juan', email: 'juan@example.com' },
        cotizaciones: [
          {
            id: 1,
            codigo_ticket: 'NSG-2024-0001',
            fecha_emision: '2024-01-15T10:00:00Z',
            fecha_validez: '2024-01-18T10:00:00Z',
            precio_total: 3500.00,
            estado: 'Pendiente',
            cantidad_componentes: 7
          },
          {
            id: 2,
            codigo_ticket: 'NSG-2024-0002',
            fecha_emision: '2024-01-20T14:30:00Z',
            fecha_validez: '2024-01-23T14:30:00Z',
            precio_total: 4200.50,
            estado: 'Reclamada',
            cantidad_componentes: 8,
            fecha_reclamacion: '2024-01-21T09:00:00Z'
          }
        ]
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText('NSG-2024-0001')).toBeInTheDocument();
        expect(screen.getByText('NSG-2024-0002')).toBeInTheDocument();
        expect(screen.getByText('2 cotizaciones encontradas')).toBeInTheDocument();
      });
    });

    it('debe mostrar el estado correcto de cada cotización', async () => {
      api.consultarHistorialCliente.mockResolvedValue({
        exito: true,
        cliente: { nombre: 'Juan', email: 'juan@example.com' },
        cotizaciones: [
          {
            id: 1,
            codigo_ticket: 'NSG-2024-0001',
            fecha_emision: '2024-01-15T10:00:00Z',
            fecha_validez: '2024-01-18T10:00:00Z',
            precio_total: 3500.00,
            estado: 'Pendiente',
            cantidad_componentes: 7
          }
        ]
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
      });
    });

    it('debe mostrar el precio total formateado', async () => {
      api.consultarHistorialCliente.mockResolvedValue({
        exito: true,
        cliente: { nombre: 'Juan', email: 'juan@example.com' },
        cotizaciones: [
          {
            id: 1,
            codigo_ticket: 'NSG-2024-0001',
            fecha_emision: '2024-01-15T10:00:00Z',
            fecha_validez: '2024-01-18T10:00:00Z',
            precio_total: 3500.50,
            estado: 'Pendiente',
            cantidad_componentes: 7
          }
        ]
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText('S/ 3500.50')).toBeInTheDocument();
      });
    });
  });

  describe('Descarga de PDFs', () => {
    it('debe tener botones de descarga para cada cotización', async () => {
      api.consultarHistorialCliente.mockResolvedValue({
        exito: true,
        cliente: { nombre: 'Juan', email: 'juan@example.com' },
        cotizaciones: [
          {
            id: 1,
            codigo_ticket: 'NSG-2024-0001',
            fecha_emision: '2024-01-15T10:00:00Z',
            fecha_validez: '2024-01-18T10:00:00Z',
            precio_total: 3500.00,
            estado: 'Pendiente',
            cantidad_componentes: 7
          }
        ]
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        const botonesDescarga = screen.getAllByRole('button', { name: /descargar pdf/i });
        expect(botonesDescarga).toHaveLength(1);
      });
    });

    it('debe abrir URL correcta al descargar PDF', async () => {
      api.consultarHistorialCliente.mockResolvedValue({
        exito: true,
        cliente: { nombre: 'Juan', email: 'juan@example.com' },
        cotizaciones: [
          {
            id: 1,
            codigo_ticket: 'NSG-2024-0001',
            fecha_emision: '2024-01-15T10:00:00Z',
            fecha_validez: '2024-01-18T10:00:00Z',
            precio_total: 3500.00,
            estado: 'Pendiente',
            cantidad_componentes: 7
          }
        ]
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const botonBuscar = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('NSG-2024-0001')).toBeInTheDocument();
      });
      
      const botonDescarga = screen.getByRole('button', { name: /descargar pdf/i });
      fireEvent.click(botonDescarga);
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('/cotizaciones/NSG-2024-0001/pdf'),
        '_blank'
      );
    });
  });

  describe('Nueva búsqueda', () => {
    it('debe mostrar botón de nueva búsqueda después de cargar resultados', async () => {
      api.consultarHistorialCliente.mockResolvedValue({
        exito: true,
        cliente: { nombre: 'Juan', email: 'juan@example.com' },
        cotizaciones: []
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nueva búsqueda/i })).toBeInTheDocument();
      });
    });

    it('debe limpiar resultados al hacer nueva búsqueda', async () => {
      api.consultarHistorialCliente.mockResolvedValue({
        exito: true,
        cliente: { nombre: 'Juan', email: 'juan@example.com' },
        cotizaciones: []
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const botonBuscar = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument();
      });
      
      const botonNueva = screen.getByRole('button', { name: /nueva búsqueda/i });
      fireEvent.click(botonNueva);
      
      expect(screen.queryByText('Juan')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Email del Cliente')).toHaveValue('');
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar error cuando la API falla', async () => {
      api.consultarHistorialCliente.mockRejectedValue({
        mensaje: 'Error de conexión'
      });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText(/error de conexión/i)).toBeInTheDocument();
      });
    });

    it('debe mostrar error genérico cuando no hay mensaje específico', async () => {
      api.consultarHistorialCliente.mockRejectedValue(new Error());

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText(/error al buscar historial/i)).toBeInTheDocument();
      });
    });

    it('debe permitir reintentar después de un error', async () => {
      api.consultarHistorialCliente
        .mockRejectedValueOnce({ mensaje: 'Error temporal' })
        .mockResolvedValueOnce({
          exito: true,
          cliente: { nombre: 'Juan', email: 'juan@example.com' },
          cotizaciones: []
        });

      render(<HistorialCliente />);
      
      const input = screen.getByLabelText('Email del Cliente');
      fireEvent.change(input, { target: { value: 'juan@example.com' } });
      
      const boton = screen.getByRole('button', { name: /buscar historial/i });
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText(/error temporal/i)).toBeInTheDocument();
      });
      
      fireEvent.click(boton);
      
      await waitFor(() => {
        expect(screen.getByText('Juan')).toBeInTheDocument();
      });
    });
  });
});

