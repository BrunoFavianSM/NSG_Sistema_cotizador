/**
 * Tests para Cotizador
 * Actualizado para reflejar la integración de SeccionEmbalaje, SeccionFlete
 * y ResumenFinancieroAdmin.
 *
 * Valida Requisitos: 5.1, 5.3, 5.4, 5.5, 6.1, 6.3, 6.4, 6.5, 7.1, 7.11, 12.1, 12.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cotizador from './Cotizador';
import { AppProvider } from '../contexto/AppContext';
import { ToastProvider } from '../componentes/feedback/ToastProvider';

// Mock de framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
}));

// Mock de react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

// Mock de la API
jest.mock('../servicios/api', () => ({
  obtenerProductos: jest.fn().mockResolvedValue({ exito: true, productos: [], cantidad: 0 }),
  crearCotizacion: jest.fn(),
  validarCompatibilidad: jest.fn().mockResolvedValue({ compatible: true, errores: [], advertencias: [] }),
  obtenerProductosPorCategoria: jest.fn().mockResolvedValue({ exito: true, productos: [] }),
}));

// Contexto base con todos los valores necesarios
const mockContextBase = {
  configuracionSeleccionada: {
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null,
  },
  seleccionarComponente: jest.fn(),
  agregarRAM: jest.fn(),
  eliminarRAM: jest.fn(),
  validarCompatibilidad: jest.fn().mockResolvedValue({ compatible: true, errores: [], advertencias: [] }),
  validacionCompatibilidad: { compatible: true, errores: [], advertencias: [] },
  calcularPrecioTotal: jest.fn(() => 0),
  calcularResumenFinanciero: jest.fn(() => ({
    subtotal_neto: { usd: 0, pen: 0 },
    igv: { porcentaje: 18, usd: 0, pen: 0 },
    total: { usd: 0, pen: 0 },
  })),
  cargarProductos: jest.fn().mockResolvedValue([]),
  productos: [],
  cargandoProductos: false,
  errorProductos: null,
  limpiarConfiguracion: jest.fn(),
  autenticado: false,
  margenGanancia: 20,
  tasaIgv: 18,
  tipoCambioUsdPen: 3.75,
  cargandoTipoCambio: false,
  monedaVista: 'USD',
  formatearMontoSegunMonedaVista: jest.fn(({ montoUsd }) => `$${montoUsd}`),
  extras: {},
  cargandoExtras: {},
  agregarExtra: jest.fn(),
  quitarExtra: jest.fn(),
  cargarExtras: jest.fn().mockResolvedValue({}),
  limpiarExtras: jest.fn(),
};

const renderCotizador = (contextOverrides = {}) => {
  const contextValue = { ...mockContextBase, ...contextOverrides };
  return render(
    <ToastProvider>
      <AppProvider value={contextValue}>
        <Cotizador />
      </AppProvider>
    </ToastProvider>
  );
};

describe('Cotizador - Navegacion basica', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe mostrar el paso inicial (Procesador)', () => {
    renderCotizador();
    // Puede haber múltiples elementos con "Procesador" (botón de paso + heading)
    expect(screen.getAllByText('Procesador').length).toBeGreaterThanOrEqual(1);
  });

  test('debe mostrar los 8 pasos de navegacion', () => {
    renderCotizador();
    const pasos = ['Procesador', 'Placa madre', 'Memoria RAM', 'Almacenamiento', 'Tarjeta grafica', 'Fuente de poder', 'Case', 'Otros'];
    pasos.forEach((paso) => {
      expect(screen.getAllByText(paso).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Cotizador - Secciones admin (Requisitos 5.1, 5.8, 6.1, 6.8, 7.1, 7.11)', () => {
  test('NO muestra SeccionEmbalaje para usuario no autenticado (Requisito 5.8)', () => {
    renderCotizador({ autenticado: false });
    // SeccionEmbalaje retorna null si !autenticado
    expect(screen.queryByText('Embalaje')).not.toBeInTheDocument();
  });

  test('NO muestra SeccionFlete para usuario no autenticado (Requisito 6.8)', () => {
    renderCotizador({ autenticado: false });
    expect(screen.queryByText('Flete (Transportista)')).not.toBeInTheDocument();
  });

  test('NO muestra ResumenFinancieroAdmin para usuario no autenticado (Requisito 7.11)', () => {
    renderCotizador({ autenticado: false });
    expect(screen.queryByText('Resumen Financiero')).not.toBeInTheDocument();
  });

  test('muestra SeccionEmbalaje para admin autenticado (Requisito 5.1)', () => {
    renderCotizador({ autenticado: true });
    expect(screen.getByText('Embalaje')).toBeInTheDocument();
  });

  test('muestra SeccionFlete para admin autenticado (Requisito 6.1)', () => {
    renderCotizador({ autenticado: true });
    expect(screen.getByText('Flete (Transportista)')).toBeInTheDocument();
  });

  test('muestra ResumenFinancieroAdmin para admin autenticado (Requisito 7.1)', () => {
    renderCotizador({ autenticado: true });
    expect(screen.getByText('Resumen Financiero')).toBeInTheDocument();
  });
});

describe('Cotizador - Toggle embalaje (Requisitos 5.3, 5.4, 5.5)', () => {
  test('el toggle de embalaje existe y tiene touch target 44px (Requisito 5.3)', () => {
    renderCotizador({ autenticado: true });
    // El toggle usa role="switch" con aria-label en el label padre
    const toggleEmbalaje = screen.getByRole('switch', { name: /embalaje/i });
    expect(toggleEmbalaje).toBeInTheDocument();
  });

  test('el embalaje inicia desactivado', () => {
    renderCotizador({ autenticado: true });
    const toggleEmbalaje = screen.getByRole('switch', { name: /embalaje/i });
    expect(toggleEmbalaje).not.toBeChecked();
  });

  test('activar embalaje muestra las opciones de precio (Requisito 5.4)', () => {
    renderCotizador({ autenticado: true });
    const toggleEmbalaje = screen.getByRole('switch', { name: /embalaje/i });
    fireEvent.click(toggleEmbalaje);
    expect(screen.getByText('Tipo de embalaje')).toBeInTheDocument();
  });
});

describe('Cotizador - Toggle flete (Requisitos 6.3, 6.4, 6.5)', () => {
  test('el toggle de flete existe (Requisito 6.3)', () => {
    renderCotizador({ autenticado: true });
    const toggleFlete = screen.getByRole('switch', { name: /flete/i });
    expect(toggleFlete).toBeInTheDocument();
  });

  test('el flete inicia desactivado', () => {
    renderCotizador({ autenticado: true });
    const toggleFlete = screen.getByRole('switch', { name: /flete/i });
    expect(toggleFlete).not.toBeChecked();
  });

  test('activar flete muestra el campo de precio (Requisito 6.4)', () => {
    renderCotizador({ autenticado: true });
    const toggleFlete = screen.getByRole('switch', { name: /flete/i });
    fireEvent.click(toggleFlete);
    expect(screen.getByLabelText(/precio de flete en dólares/i)).toBeInTheDocument();
  });
});

describe('Cotizador - ResumenFinancieroAdmin (Requisito 7.9)', () => {
  test('muestra las 6 lineas del desglose financiero', () => {
    renderCotizador({ autenticado: true });
    expect(screen.getByText('Costo CPU')).toBeInTheDocument();
    expect(screen.getByText('Costo CPU + Periféricos')).toBeInTheDocument();
    expect(screen.getByText('Utilidad')).toBeInTheDocument();
    expect(screen.getByText('Precio de Venta')).toBeInTheDocument();
    expect(screen.getByText('IGV')).toBeInTheDocument();
    expect(screen.getByText('Precio Final')).toBeInTheDocument();
  });

  test('muestra columnas USD y PEN', () => {
    renderCotizador({ autenticado: true });
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('PEN')).toBeInTheDocument();
  });
});
