/**
 * AsistenteIA.test.jsx — Tests del componente raíz v2
 *
 * Cubre: renderizado inicial, envío de mensaje, quick replies,
 * typing indicator y botón de asesor humano.
 *
 * Requisitos: 21.4
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AsistenteIA from './AsistenteIA';

// ── Mocks ──────────────────────────────────────────────────

// Mock del hook useAsistenteIA para aislar el componente
jest.mock('../hooks/useAsistenteIA', () => ({
  useAsistenteIA: jest.fn(),
}));

// Mock del servicio asistente (para la consulta de historial)
jest.mock('../servicios/asistente', () => ({
  nuevaSesion: jest.fn().mockResolvedValue({ exito: true, sesion_id: 'test-uuid' }),
  enviarMensaje: jest.fn(),
  obtenerHistorial: jest.fn().mockResolvedValue({ exito: false }),
  obtenerSesion: jest.fn(),
  validarConfiguracion: jest.fn(),
}));

// Mock del AppContext
jest.mock('../contexto/AppContext', () => ({
  useAppContext: jest.fn().mockReturnValue({
    autenticado: false,
    usuario: null,
    tipoCambioUsdPen: 3.75,
    aplicarConfiguracion: jest.fn(),
  }),
}));

// Mock de framer-motion para simplificar tests
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => true,
}));

import { useAsistenteIA } from '../hooks/useAsistenteIA';

// Estado base del hook para tests
const estadoHookBase = {
  mensajes: [],
  cargando: false,
  quickReplies: [],
  configuracionPropuesta: null,
  semaforo: null,
  error: null,
  mostrarAsesor: false,
  sesionId: 'test-uuid',
  tipoCambioUsdPen: 3.75,
  enviarMensaje: jest.fn(),
  seleccionarQuickReply: jest.fn(),
  ocultarQuickReplies: jest.fn(),
  aplicarConfiguracion: jest.fn(),
  reiniciar: jest.fn(),
};

// ── Helper de render ───────────────────────────────────────
const renderComponente = (propsExtra = {}) => {
  return render(<AsistenteIA {...propsExtra} />);
};

// ── Tests ──────────────────────────────────────────────────

describe('AsistenteIA v2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAsistenteIA.mockReturnValue({ ...estadoHookBase });
  });

  // ── Renderizado inicial ──────────────────────────────────

  test('renderiza el botón de apertura', () => {
    renderComponente();
    expect(screen.getByRole('button', { name: /asistente de configuración/i })).toBeInTheDocument();
  });

  test('el modal no está visible inicialmente', () => {
    renderComponente();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('abre el modal al hacer clic en el botón', async () => {
    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /NSG Concierge/i })).toBeInTheDocument();
    });
  });

  test('muestra el botón de asesor humano en el header al abrir', async () => {
    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /hablar con un asesor humano/i })).toBeInTheDocument();
    });
  });

  // ── Envío de mensaje ─────────────────────────────────────

  test('envía mensaje al escribir y presionar Enter', async () => {
    const enviarMensajeMock = jest.fn();
    useAsistenteIA.mockReturnValue({ ...estadoHookBase, enviarMensaje: enviarMensajeMock });

    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    const input = await screen.findByPlaceholderText('Escribe tu mensaje...');
    fireEvent.change(input, { target: { value: 'Necesito una PC para gaming' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(enviarMensajeMock).toHaveBeenCalledWith('Necesito una PC para gaming');
    });
  });

  test('envía mensaje al hacer clic en el botón de envío', async () => {
    const enviarMensajeMock = jest.fn();
    useAsistenteIA.mockReturnValue({ ...estadoHookBase, enviarMensaje: enviarMensajeMock });

    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    const input = await screen.findByPlaceholderText('Escribe tu mensaje...');
    fireEvent.change(input, { target: { value: 'Hola' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar mensaje/i }));

    await waitFor(() => {
      expect(enviarMensajeMock).toHaveBeenCalledWith('Hola');
    });
  });

  test('el botón de envío está deshabilitado con input vacío', async () => {
    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    await waitFor(() => {
      const botonEnviar = screen.getByRole('button', { name: /enviar mensaje/i });
      expect(botonEnviar).toBeDisabled();
    });
  });

  // ── Typing indicator ─────────────────────────────────────

  test('muestra typing indicator cuando cargando es true', async () => {
    useAsistenteIA.mockReturnValue({ ...estadoHookBase, cargando: true });

    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    await waitFor(() => {
      expect(screen.getByRole('status', { name: /el asistente está escribiendo/i })).toBeInTheDocument();
    });
  });

  test('no muestra typing indicator cuando cargando es false', async () => {
    useAsistenteIA.mockReturnValue({ ...estadoHookBase, cargando: false });

    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: /el asistente está escribiendo/i })).not.toBeInTheDocument();
    });
  });

  // ── Quick replies ────────────────────────────────────────

  test('muestra quick replies cuando hay opciones disponibles', async () => {
    useAsistenteIA.mockReturnValue({
      ...estadoHookBase,
      quickReplies: ['Gaming', 'Trabajo', 'Edición de video'],
    });

    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    await waitFor(() => {
      expect(screen.getByRole('group', { name: /respuestas rápidas/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /respuesta rápida: gaming/i })).toBeInTheDocument();
    });
  });

  test('oculta quick replies cuando el usuario empieza a escribir', async () => {
    const ocultarMock = jest.fn();
    useAsistenteIA.mockReturnValue({
      ...estadoHookBase,
      quickReplies: ['Gaming', 'Trabajo'],
      ocultarQuickReplies: ocultarMock,
    });

    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    const input = await screen.findByPlaceholderText('Escribe tu mensaje...');
    fireEvent.change(input, { target: { value: 'a' } });

    expect(ocultarMock).toHaveBeenCalled();
  });

  // ── Mensajes ─────────────────────────────────────────────

  test('renderiza mensajes del usuario y del asistente', async () => {
    useAsistenteIA.mockReturnValue({
      ...estadoHookBase,
      mensajes: [
        { id: 'u1', rol: 'user', contenido: 'Hola', timestamp: new Date().toISOString() },
        { id: 'a1', rol: 'assistant', contenido: 'Hola, soy NSG Concierge', timestamp: new Date().toISOString(), metadata: {} },
      ],
    });

    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    await waitFor(() => {
      expect(screen.getByText('Hola')).toBeInTheDocument();
      expect(screen.getByText('Hola, soy NSG Concierge')).toBeInTheDocument();
    });
  });

  // ── Error ────────────────────────────────────────────────

  test('muestra banner de error cuando hay un error', async () => {
    useAsistenteIA.mockReturnValue({
      ...estadoHookBase,
      error: 'Hubo un problema al conectar con el asistente.',
    });

    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/hubo un problema al conectar/i)).toBeInTheDocument();
    });
  });

  // ── Asesor humano ────────────────────────────────────────

  test('muestra botón de asesor completo cuando mostrarAsesor es true', async () => {
    useAsistenteIA.mockReturnValue({ ...estadoHookBase, mostrarAsesor: true });

    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    await waitFor(() => {
      // Debe haber al menos 2 links de WhatsApp (header compacto + footer completo)
      const links = screen.getAllByRole('link', { name: /hablar con un asesor humano/i });
      expect(links.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Reiniciar ────────────────────────────────────────────

  test('llama a reiniciar al hacer clic en el botón Reiniciar', async () => {
    const reiniciarMock = jest.fn();
    useAsistenteIA.mockReturnValue({ ...estadoHookBase, reiniciar: reiniciarMock });

    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /reiniciar conversación/i }));
    });

    expect(reiniciarMock).toHaveBeenCalled();
  });

  // ── Cerrar modal ─────────────────────────────────────────

  test('cierra el modal al hacer clic en el botón de cerrar', async () => {
    renderComponente();
    fireEvent.click(screen.getByRole('button', { name: /asistente de configuración/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Hay dos botones con este label: el backdrop y el × del header; usar el último (×)
    const botonesClose = screen.getAllByRole('button', { name: /cerrar asistente/i });
    fireEvent.click(botonesClose[botonesClose.length - 1]);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
