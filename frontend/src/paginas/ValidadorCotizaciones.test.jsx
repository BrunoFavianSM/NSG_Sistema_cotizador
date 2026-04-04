/**
 * Tests para ValidadorCotizaciones
 * 
 * Valida:
 * - Búsqueda por código ticket
 * - Visualización de detalles de cotización
 * - Comparación de precios
 * - Marcar como reclamada
 * - Manejo de errores
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ValidadorCotizaciones from './ValidadorCotizaciones';

// Mock de servicios/api
jest.mock('../servicios/api', () => ({
  validarCotizacion: jest.fn(),
  marcarComoReclamada: jest.fn()
}));

// Mock del contexto
const mockContextValue = {
  autenticado: true,
  usuario: { id: 1, username: 'admin' }
};

jest.mock('../contexto/AppContext', () => ({
  ...jest.requireActual('../contexto/AppContext'),
  useAppContext: () => mockContextValue,
  AppProvider: ({ children }) => children
}));

// Mock de framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    form: ({ children, ...props }) => <form {...props}>{children}</form>,
    tr: ({ children, ...props }) => <tr {...props}>{children}</tr>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Import API después de los mocks
const api = require('../servicios/api');

// Componente wrapper con contexto
const renderWithContext = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ValidadorCotizaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Autenticación', () => {
    test('muestra el formulario si está autenticado', () => {
      renderWithContext(<ValidadorCotizaciones />);
      
      expect(screen.getByText('Validador de Cotizaciones')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('NSG-2024-0001')).toBeInTheDocument();
    });
  });

  describe('Búsqueda de cotización', () => {
    test('permite ingresar código de ticket', () => {
      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'nsg-2024-0001' } });
      
      expect(input.value).toBe('NSG-2024-0001'); // Debe convertir a mayúsculas
    });

    test('deshabilita el botón de búsqueda cuando está vacío', () => {
      renderWithContext(<ValidadorCotizaciones />);
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      expect(botonBuscar).toBeDisabled();
    });

    test('habilita el botón de búsqueda cuando hay texto', () => {
      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      expect(botonBuscar).not.toBeDisabled();
    });

    test('muestra error cuando la cotización no existe', async () => {
      api.validarCotizacion.mockRejectedValue({
        mensaje: 'Cotización no encontrada'
      });

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-9999' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('Cotización no encontrada')).toBeInTheDocument();
      });
    });

    test('muestra error cuando la cotización está caducada', async () => {
      api.validarCotizacion.mockResolvedValue({
        valida: false,
        mensaje: 'Cotización caducada'
      });

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('Cotización caducada')).toBeInTheDocument();
      });
    });
  });

  describe('Visualización de cotización válida', () => {
    const cotizacionMock = {
      valida: true,
      cotizacion: {
        codigo_ticket: 'NSG-2024-0001',
        fecha_emision: '2024-01-15T10:00:00Z',
        fecha_validez: '2024-01-18T10:00:00Z',
        estado: 'Pendiente',
        precio_total_historico: 3500.00,
        precio_total_actual: 3600.00,
        diferencia_total: 100.00,
        hay_cambios_precio: true,
        margen_aplicado: 20,
        componentes: [
          {
            nombre: 'Intel Core i5-12400F',
            categoria: 'procesador',
            cantidad: 1,
            precio_historico: 800.00,
            precio_actual: 850.00,
            diferencia_unitaria: 50.00,
            stock_actual: 5,
            disponible_a_pedido: false
          },
          {
            nombre: 'ASUS TUF B660M',
            categoria: 'placa_madre',
            cantidad: 1,
            precio_historico: 500.00,
            precio_actual: 500.00,
            diferencia_unitaria: 0,
            stock_actual: 0,
            disponible_a_pedido: true
          }
        ]
      }
    };

    test('muestra información general de la cotización', async () => {
      api.validarCotizacion.mockResolvedValue(cotizacionMock);

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('NSG-2024-0001')).toBeInTheDocument();
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
      });
    });

    test('muestra resumen de precios correctamente', async () => {
      api.validarCotizacion.mockResolvedValue(cotizacionMock);

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('S/ 3500.00')).toBeInTheDocument(); // Precio original
        expect(screen.getByText('S/ 3600.00')).toBeInTheDocument(); // Precio actual
        expect(screen.getByText('+S/ 100.00')).toBeInTheDocument(); // Diferencia
      });
    });

    test('muestra alerta cuando hay cambios de precio', async () => {
      api.validarCotizacion.mockResolvedValue(cotizacionMock);

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText(/Los precios han aumentado/)).toBeInTheDocument();
      });
    });

    test('muestra tabla de componentes con detalles', async () => {
      api.validarCotizacion.mockResolvedValue(cotizacionMock);

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('Intel Core i5-12400F')).toBeInTheDocument();
        expect(screen.getByText('ASUS TUF B660M')).toBeInTheDocument();
        expect(screen.getByText('En Stock')).toBeInTheDocument();
        expect(screen.getByText('A Pedido')).toBeInTheDocument();
      });
    });

    test('muestra diferencias de precio por componente', async () => {
      api.validarCotizacion.mockResolvedValue(cotizacionMock);

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('+S/ 50.00')).toBeInTheDocument(); // Diferencia del procesador
        expect(screen.getByText('Sin cambio')).toBeInTheDocument(); // Placa madre sin cambio
      });
    });
  });

  describe('Marcar como reclamada', () => {
    const cotizacionPendiente = {
      valida: true,
      cotizacion: {
        codigo_ticket: 'NSG-2024-0001',
        fecha_emision: '2024-01-15T10:00:00Z',
        fecha_validez: '2024-01-18T10:00:00Z',
        estado: 'Pendiente',
        precio_total_historico: 3500.00,
        precio_total_actual: 3500.00,
        diferencia_total: 0,
        hay_cambios_precio: false,
        componentes: []
      }
    };

    test('muestra botón de marcar como reclamada para cotizaciones pendientes', async () => {
      api.validarCotizacion.mockResolvedValue(cotizacionPendiente);

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('�o" Marcar como Reclamada')).toBeInTheDocument();
      });
    });

    test('no muestra botón para cotizaciones ya reclamadas', async () => {
      const cotizacionReclamada = {
        ...cotizacionPendiente,
        cotizacion: {
          ...cotizacionPendiente.cotizacion,
          estado: 'Reclamada'
        }
      };

      api.validarCotizacion.mockResolvedValue(cotizacionReclamada);

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.queryByText('�o" Marcar como Reclamada')).not.toBeInTheDocument();
      });
    });

    test('marca cotización como reclamada exitosamente', async () => {
      api.validarCotizacion.mockResolvedValue(cotizacionPendiente);
      api.marcarComoReclamada.mockResolvedValue({
        exito: true,
        mensaje: 'Cotización marcada como reclamada'
      });

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('�o" Marcar como Reclamada')).toBeInTheDocument();
      });

      const botonReclamar = screen.getByText('�o" Marcar como Reclamada');
      fireEvent.click(botonReclamar);
      
      await waitFor(() => {
        expect(api.marcarComoReclamada).toHaveBeenCalledWith('NSG-2024-0001');
        expect(screen.getByText('Cotización marcada como reclamada exitosamente')).toBeInTheDocument();
      });
    });

    test('muestra error al fallar marcar como reclamada', async () => {
      api.validarCotizacion.mockResolvedValue(cotizacionPendiente);
      api.marcarComoReclamada.mockRejectedValue({
        mensaje: 'Error al actualizar'
      });

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('�o" Marcar como Reclamada')).toBeInTheDocument();
      });

      const botonReclamar = screen.getByText('�o" Marcar como Reclamada');
      fireEvent.click(botonReclamar);
      
      await waitFor(() => {
        expect(screen.getByText('Error al actualizar')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidad de limpiar', () => {
    test('muestra botón limpiar después de buscar', async () => {
      api.validarCotizacion.mockResolvedValue({
        valida: true,
        cotizacion: {
          codigo_ticket: 'NSG-2024-0001',
          fecha_emision: '2024-01-15T10:00:00Z',
          fecha_validez: '2024-01-18T10:00:00Z',
          estado: 'Pendiente',
          precio_total_historico: 3500.00,
          precio_total_actual: 3500.00,
          diferencia_total: 0,
          hay_cambios_precio: false,
          componentes: []
        }
      });

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('Limpiar')).toBeInTheDocument();
      });
    });

    test('limpia la búsqueda al hacer clic en limpiar', async () => {
      api.validarCotizacion.mockResolvedValue({
        valida: true,
        cotizacion: {
          codigo_ticket: 'NSG-2024-0001',
          fecha_emision: '2024-01-15T10:00:00Z',
          fecha_validez: '2024-01-18T10:00:00Z',
          estado: 'Pendiente',
          precio_total_historico: 3500.00,
          precio_total_actual: 3500.00,
          diferencia_total: 0,
          hay_cambios_precio: false,
          componentes: []
        }
      });

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('NSG-2024-0001')).toBeInTheDocument();
      });

      const botonLimpiar = screen.getByText('Limpiar');
      fireEvent.click(botonLimpiar);
      
      expect(input.value).toBe('');
      expect(screen.queryByText('NSG-2024-0001')).not.toBeInTheDocument();
    });
  });

  describe('Formateo de datos', () => {
    test('formatea precios con 2 decimales', async () => {
      api.validarCotizacion.mockResolvedValue({
        valida: true,
        cotizacion: {
          codigo_ticket: 'NSG-2024-0001',
          fecha_emision: '2024-01-15T10:00:00Z',
          fecha_validez: '2024-01-18T10:00:00Z',
          estado: 'Pendiente',
          precio_total_historico: 3500.5,
          precio_total_actual: 3600.75,
          diferencia_total: 100.25,
          hay_cambios_precio: true,
          componentes: []
        }
      });

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('S/ 3500.50')).toBeInTheDocument();
        expect(screen.getByText('S/ 3600.75')).toBeInTheDocument();
        expect(screen.getByText('+S/ 100.25')).toBeInTheDocument();
      });
    });

    test('muestra diferencia negativa correctamente', async () => {
      api.validarCotizacion.mockResolvedValue({
        valida: true,
        cotizacion: {
          codigo_ticket: 'NSG-2024-0001',
          fecha_emision: '2024-01-15T10:00:00Z',
          fecha_validez: '2024-01-18T10:00:00Z',
          estado: 'Pendiente',
          precio_total_historico: 3600.00,
          precio_total_actual: 3500.00,
          diferencia_total: -100.00,
          hay_cambios_precio: true,
          componentes: []
        }
      });

      renderWithContext(<ValidadorCotizaciones />);
      
      const input = screen.getByPlaceholderText('NSG-2024-0001');
      fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });
      
      const botonBuscar = screen.getByText('�Y"� Buscar');
      fireEvent.click(botonBuscar);
      
      await waitFor(() => {
        expect(screen.getByText('S/ -100.00')).toBeInTheDocument();
        expect(screen.getByText(/Los precios han disminuido/)).toBeInTheDocument();
      });
    });
  });
});

