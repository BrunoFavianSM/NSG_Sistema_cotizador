import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AsistenteIA from './AsistenteIA';
import * as api from '../servicios/api';
import { ToastProvider } from './feedback/ToastProvider';

jest.mock('../servicios/api', () => ({
  iniciarConversacionIA: jest.fn(),
  continuarConversacionIA: jest.fn()
}));

const renderWithProviders = (ui) => render(<ToastProvider>{ui}</ToastProvider>);

describe('AsistenteIA', () => {
  const onAplicar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza boton y abre modal', async () => {
    renderWithProviders(<AsistenteIA onAplicarRecomendacion={onAplicar} />);
    fireEvent.click(screen.getByText('Ayuda IA'));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Asistente IA' })).toBeInTheDocument();
      expect(screen.getByText(/Hola\. Soy tu asistente IA/i)).toBeInTheDocument();
    });
  });

  test('inicia conversacion con primer mensaje', async () => {
    api.iniciarConversacionIA.mockResolvedValue({
      sesionId: 's1',
      pregunta: '¿Presupuesto?'
    });

    renderWithProviders(<AsistenteIA onAplicarRecomendacion={onAplicar} />);
    fireEvent.click(screen.getByText('Ayuda IA'));

    const input = await screen.findByPlaceholderText('Escribe tu mensaje...');
    fireEvent.change(input, { target: { value: 'Necesito una PC' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(api.iniciarConversacionIA).toHaveBeenCalledWith('Necesito una PC');
    });
  });

  test('muestra y aplica recomendacion final', async () => {
    api.iniciarConversacionIA.mockResolvedValue({ sesionId: 's1', pregunta: '¿Presupuesto?' });
    api.continuarConversacionIA.mockResolvedValue({
      completado: true,
      recomendacion: {
        componentes: {
          procesador: { id: 1, nombre: 'Intel Core i5' }
        },
        explicacion: 'Recomendacion lista',
        advertencias: []
      }
    });

    renderWithProviders(<AsistenteIA onAplicarRecomendacion={onAplicar} />);
    fireEvent.click(screen.getByText('Ayuda IA'));

    const input = await screen.findByPlaceholderText('Escribe tu mensaje...');
    fireEvent.change(input, { target: { value: 'Gaming' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(api.iniciarConversacionIA).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText('Escribe tu mensaje...'), { target: { value: 'S/3000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(screen.getByText(/Configuracion recomendada/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Aplicar configuracion/i }));
    expect(onAplicar).toHaveBeenCalledWith({ procesador: { id: 1, nombre: 'Intel Core i5' } });
  });

  test('muestra error de comunicacion', async () => {
    api.iniciarConversacionIA.mockRejectedValue({ mensaje: 'Error de conexion' });

    renderWithProviders(<AsistenteIA onAplicarRecomendacion={onAplicar} />);
    fireEvent.click(screen.getByText('Ayuda IA'));

    const input = await screen.findByPlaceholderText('Escribe tu mensaje...');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(screen.getAllByText(/Error de conexion/i).length).toBeGreaterThan(0);
    });
  });

  test('permite reiniciar conversacion', async () => {
    api.iniciarConversacionIA.mockResolvedValue({ sesionId: 's1', pregunta: '¿Presupuesto?' });

    renderWithProviders(<AsistenteIA onAplicarRecomendacion={onAplicar} />);
    fireEvent.click(screen.getByText('Ayuda IA'));

    const input = await screen.findByPlaceholderText('Escribe tu mensaje...');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(api.iniciarConversacionIA).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));

    await waitFor(() => {
      expect(screen.getByText(/Hola\. Soy tu asistente IA/i)).toBeInTheDocument();
    });
  });
});
