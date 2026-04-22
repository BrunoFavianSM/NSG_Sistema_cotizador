/**
 * Tests para AdminConfiguracion
 * Actualizado para reflejar la nueva UI con selector de modo de tipo de cambio.
 * Valida Requisitos: 1.2, 1.3, 1.4, 1.5, 11.1, 11.2, 11.3, 11.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminConfiguracion from './AdminConfiguracion';
import * as api from '../servicios/api';
import { ToastProvider } from '../componentes/feedback/ToastProvider';

// Mock del contexto con todos los valores que usa el componente refactorizado
const mockForzarActualizacionTC = jest.fn();
const mockActualizarConfiguracionFinanciera = jest.fn();

const mockContextValue = {
  autenticado: true,
  margenGanancia: 20,
  tasaIgv: 18,
  tipoCambioUsdPen: 3.75,
  actualizarMargen: jest.fn(),
  actualizarConfiguracionFinanciera: mockActualizarConfiguracionFinanciera,
  modoTipoCambio: 'manual',
  cargandoTipoCambio: false,
  advertenciaTipoCambio: null,
  ultimaActualizacionTC: null,
  forzarActualizacionTC: mockForzarActualizacionTC,
};

jest.mock('../contexto/AppContext', () => ({
  useAppContext: () => mockContextValue,
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));

jest.mock('../servicios/api', () => ({
  obtenerEstadisticasIA: jest.fn(),
  actualizarModoTipoCambio: jest.fn(),
  limpiarCatalogo: jest.fn(),
}));

describe('AdminConfiguracion', () => {
  const renderPagina = () =>
    render(
      <ToastProvider>
        <AdminConfiguracion />
      </ToastProvider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockContextValue.autenticado = true;
    mockContextValue.margenGanancia = 20;
    mockContextValue.tasaIgv = 18;
    mockContextValue.tipoCambioUsdPen = 3.75;
    mockContextValue.modoTipoCambio = 'manual';
    mockContextValue.cargandoTipoCambio = false;
    mockContextValue.advertenciaTipoCambio = null;
    mockContextValue.ultimaActualizacionTC = null;
    api.obtenerEstadisticasIA.mockResolvedValue({
      llamadas: 150,
      costoEstimado: '0.75',
      promedioTokens: 500,
    });
    api.actualizarModoTipoCambio.mockResolvedValue({ exito: true, modo_tipo_cambio: 'manual' });
    mockActualizarConfiguracionFinanciera.mockResolvedValue({
      exito: true,
      margen_ganancia: 20,
      tasa_igv: 18,
      tipo_cambio_usd_pen: 3.75,
    });
  });

  // ── Acceso ────────────────────────────────────────────────────────────────

  test('muestra acceso restringido si no está autenticado', () => {
    mockContextValue.autenticado = false;
    renderPagina();
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
  });

  test('renderiza correctamente cuando está autenticado', async () => {
    renderPagina();
    expect(screen.getByText('Configuración del Sistema')).toBeInTheDocument();
    expect(screen.getByText('Parámetros financieros')).toBeInTheDocument();
  });

  // ── Selector de modo de tipo de cambio (Requisito 1.2) ───────────────────

  test('muestra el selector de modo de tipo de cambio', () => {
    renderPagina();
    expect(screen.getByRole('radiogroup', { name: /modo de tipo de cambio/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /manual/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /autom/i })).toBeInTheDocument();
  });

  test('el modo manual está seleccionado por defecto', () => {
    renderPagina();
    const botonManual = screen.getByRole('radio', { name: /manual/i });
    expect(botonManual).toHaveAttribute('aria-checked', 'true');
  });

  test('el campo de tipo de cambio es visible en modo manual (Requisito 1.3)', () => {
    renderPagina();
    expect(screen.getByLabelText(/tipo cambio/i)).toBeInTheDocument();
  });

  test('el campo de tipo de cambio se oculta en modo automático (Requisito 1.4)', () => {
    mockContextValue.modoTipoCambio = 'automatico';
    renderPagina();
    expect(screen.queryByLabelText(/tipo cambio/i)).not.toBeInTheDocument();
  });

  // ── Modo automático: indicadores de UI (Requisitos 11.1, 11.2, 11.3) ─────

  test('muestra indicador de carga en modo automático cuando está cargando (Requisito 11.1)', () => {
    mockContextValue.modoTipoCambio = 'automatico';
    mockContextValue.cargandoTipoCambio = true;
    renderPagina();
    expect(screen.getByText(/obteniendo tipo de cambio/i)).toBeInTheDocument();
  });

  test('muestra advertencia de respaldo cuando hay advertencia (Requisito 11.3)', () => {
    mockContextValue.modoTipoCambio = 'automatico';
    mockContextValue.advertenciaTipoCambio = 'Usando valor en caché desactualizado.';
    renderPagina();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/usando valor en caché desactualizado/i)).toBeInTheDocument();
  });

  test('muestra botón de actualizar tipo de cambio en modo automático (Requisito 2.9)', () => {
    mockContextValue.modoTipoCambio = 'automatico';
    renderPagina();
    expect(screen.getByRole('button', { name: /actualizar tipo de cambio/i })).toBeInTheDocument();
  });

  test('llama a forzarActualizacionTC al hacer clic en actualizar', () => {
    mockContextValue.modoTipoCambio = 'automatico';
    renderPagina();
    const boton = screen.getByRole('button', { name: /actualizar tipo de cambio/i });
    fireEvent.click(boton);
    expect(mockForzarActualizacionTC).toHaveBeenCalled();
  });

  // ── Guardar modo (Requisito 1.5) ──────────────────────────────────────────

  test('el botón guardar modo está deshabilitado si el modo no cambió', () => {
    renderPagina();
    const botonGuardarModo = screen.getByRole('button', { name: /guardar modo/i });
    expect(botonGuardarModo).toBeDisabled();
  });

  test('el botón guardar modo se habilita al cambiar el modo', () => {
    renderPagina();
    const botonAutomatico = screen.getByRole('radio', { name: /autom/i });
    fireEvent.click(botonAutomatico);
    const botonGuardarModo = screen.getByRole('button', { name: /guardar modo/i });
    expect(botonGuardarModo).not.toBeDisabled();
  });

  test('llama a api.actualizarModoTipoCambio al guardar modo (Requisito 1.5)', async () => {
    renderPagina();
    const botonAutomatico = screen.getByRole('radio', { name: /autom/i });
    fireEvent.click(botonAutomatico);
    const botonGuardarModo = screen.getByRole('button', { name: /guardar modo/i });
    fireEvent.click(botonGuardarModo);
    await waitFor(() => {
      expect(api.actualizarModoTipoCambio).toHaveBeenCalledWith('automatico');
    });
  });

  // ── Campos financieros ────────────────────────────────────────────────────

  test('muestra los campos de margen e IGV', () => {
    renderPagina();
    expect(screen.getByLabelText(/margen/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/igv/i)).toBeInTheDocument();
  });

  test('carga estadísticas de IA al montar', async () => {
    renderPagina();
    await waitFor(() => {
      expect(api.obtenerEstadisticasIA).toHaveBeenCalled();
    });
  });

  test('muestra estadísticas de IA correctamente', async () => {
    renderPagina();
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });
});
