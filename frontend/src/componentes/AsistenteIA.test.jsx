/**
 * Tests para Componente Asistente IA
 * 
 * Tests unitarios básicos para verificar el comportamiento del componente
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AsistenteIA from './AsistenteIA';
import * as api from '../servicios/api';

// Mock de las funciones de API
jest.mock('../servicios/api', () => ({
  iniciarConversacionIA: jest.fn(),
  continuarConversacionIA: jest.fn()
}));

// Mock de Sileo
global.window.Sileo = {
  success: jest.fn(),
  error: jest.fn()
};

describe('AsistenteIA', () => {
  const mockOnAplicarRecomendacion = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza el botón "Ayuda IA"', () => {
    render(<AsistenteIA onAplicarRecomendacion={mockOnAplicarRecomendacion} />);
    
    const boton = screen.getByText('Ayuda IA');
    expect(boton).toBeDefined();
  });

  test('abre el modal al hacer click en el botón', async () => {
    render(<AsistenteIA onAplicarRecomendacion={mockOnAplicarRecomendacion} />);
    
    const boton = screen.getByText('Ayuda IA');
    fireEvent.click(boton);
    
    await waitFor(() => {
      expect(screen.getByText('Asistente IA')).toBeDefined();
    });
  });

  test('muestra mensaje de bienvenida al abrir', async () => {
    render(<AsistenteIA onAplicarRecomendacion={mockOnAplicarRecomendacion} />);
    
    const boton = screen.getByText('Ayuda IA');
    fireEvent.click(boton);
    
    await waitFor(() => {
      expect(screen.getByText(/Soy tu asistente de IA/)).toBeDefined();
    });
  });

  test('permite escribir un mensaje', async () => {
    render(<AsistenteIA onAplicarRecomendacion={mockOnAplicarRecomendacion} />);
    
    const boton = screen.getByText('Ayuda IA');
    fireEvent.click(boton);
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      expect(input).toBeDefined();
      
      fireEvent.change(input, { target: { value: 'Necesito una PC para gaming' } });
      expect(input.value).toBe('Necesito una PC para gaming');
    });
  });

  test('inicia conversación al enviar primer mensaje', async () => {
    const mockRespuesta = {
      sesionId: 'test-session-123',
      pregunta: '¿Cuál es tu presupuesto?',
      contexto: {}
    };
    
    api.iniciarConversacionIA.mockResolvedValue(mockRespuesta);
    
    render(<AsistenteIA onAplicarRecomendacion={mockOnAplicarRecomendacion} />);
    
    const boton = screen.getByText('Ayuda IA');
    fireEvent.click(boton);
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      fireEvent.change(input, { target: { value: 'Necesito una PC' } });
      
      const enviarBtn = input.nextElementSibling;
      fireEvent.click(enviarBtn);
    });
    
    await waitFor(() => {
      expect(api.iniciarConversacionIA).toHaveBeenCalledWith('Necesito una PC');
    });
  });

  test('continúa conversación con sesión existente', async () => {
    const mockInicio = {
      sesionId: 'test-session-123',
      pregunta: '¿Cuál es tu presupuesto?',
      contexto: {}
    };
    
    const mockContinuar = {
      completado: false,
      pregunta: '¿Para qué usarás la PC?'
    };
    
    api.iniciarConversacionIA.mockResolvedValue(mockInicio);
    api.continuarConversacionIA.mockResolvedValue(mockContinuar);
    
    render(<AsistenteIA onAplicarRecomendacion={mockOnAplicarRecomendacion} />);
    
    const boton = screen.getByText('Ayuda IA');
    fireEvent.click(boton);
    
    // Primer mensaje
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      fireEvent.change(input, { target: { value: 'Necesito una PC' } });
      const enviarBtn = input.nextElementSibling;
      fireEvent.click(enviarBtn);
    });
    
    // Esperar respuesta
    await waitFor(() => {
      expect(api.iniciarConversacionIA).toHaveBeenCalled();
    });
    
    // Segundo mensaje
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      fireEvent.change(input, { target: { value: 'S/3000' } });
      const enviarBtn = input.nextElementSibling;
      fireEvent.click(enviarBtn);
    });
    
    await waitFor(() => {
      expect(api.continuarConversacionIA).toHaveBeenCalledWith('test-session-123', 'S/3000');
    });
  });

  test('muestra recomendación cuando la conversación se completa', async () => {
    const mockRecomendacion = {
      completado: true,
      recomendacion: {
        componentes: {
          procesador: { id: 1, nombre: 'Intel Core i5' },
          placa_madre: { id: 2, nombre: 'ASUS B550' }
        },
        explicacion: 'Configuración ideal para gaming',
        advertencias: []
      }
    };
    
    api.iniciarConversacionIA.mockResolvedValue({
      sesionId: 'test-session',
      pregunta: '¿Presupuesto?'
    });
    
    api.continuarConversacionIA.mockResolvedValue(mockRecomendacion);
    
    render(<AsistenteIA onAplicarRecomendacion={mockOnAplicarRecomendacion} />);
    
    const boton = screen.getByText('Ayuda IA');
    fireEvent.click(boton);
    
    // Enviar mensaje
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      fireEvent.change(input, { target: { value: 'PC gaming' } });
      const enviarBtn = input.nextElementSibling;
      fireEvent.click(enviarBtn);
    });
    
    // Enviar segundo mensaje que completa la conversación
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      fireEvent.change(input, { target: { value: 'S/3000' } });
      const enviarBtn = input.nextElementSibling;
      fireEvent.click(enviarBtn);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Configuración Recomendada')).toBeDefined();
      expect(screen.getByText('Intel Core i5')).toBeDefined();
    });
  });

  test('aplica recomendación al hacer click en el botón', async () => {
    const mockRecomendacion = {
      completado: true,
      recomendacion: {
        componentes: {
          procesador: { id: 1, nombre: 'Intel Core i5' }
        },
        explicacion: 'Configuración ideal',
        advertencias: []
      }
    };
    
    api.iniciarConversacionIA.mockResolvedValue({
      sesionId: 'test-session',
      pregunta: '¿Presupuesto?'
    });
    
    api.continuarConversacionIA.mockResolvedValue(mockRecomendacion);
    
    render(<AsistenteIA onAplicarRecomendacion={mockOnAplicarRecomendacion} />);
    
    const boton = screen.getByText('Ayuda IA');
    fireEvent.click(boton);
    
    // Completar conversación
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      fireEvent.change(input, { target: { value: 'PC gaming' } });
      const enviarBtn = input.nextElementSibling;
      fireEvent.click(enviarBtn);
    });
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      fireEvent.change(input, { target: { value: 'S/3000' } });
      const enviarBtn = input.nextElementSibling;
      fireEvent.click(enviarBtn);
    });
    
    // Aplicar recomendación
    await waitFor(() => {
      const aplicarBtn = screen.getByText('Aplicar esta Configuración');
      fireEvent.click(aplicarBtn);
    });
    
    expect(mockOnAplicarRecomendacion).toHaveBeenCalledWith({
      procesador: { id: 1, nombre: 'Intel Core i5' }
    });
  });

  test('muestra error cuando falla la comunicación con IA', async () => {
    api.iniciarConversacionIA.mockRejectedValue({
      mensaje: 'Error de conexión'
    });
    
    render(<AsistenteIA onAplicarRecomendacion={mockOnAplicarRecomendacion} />);
    
    const boton = screen.getByText('Ayuda IA');
    fireEvent.click(boton);
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      fireEvent.change(input, { target: { value: 'Test' } });
      const enviarBtn = input.nextElementSibling;
      fireEvent.click(enviarBtn);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/hubo un problema/)).toBeDefined();
    });
  });

  test('permite reiniciar la conversación', async () => {
    api.iniciarConversacionIA.mockResolvedValue({
      sesionId: 'test-session',
      pregunta: '¿Presupuesto?'
    });
    
    render(<AsistenteIA onAplicarRecomendacion={mockOnAplicarRecomendacion} />);
    
    const boton = screen.getByText('Ayuda IA');
    fireEvent.click(boton);
    
    // Enviar un mensaje para crear sesión
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      fireEvent.change(input, { target: { value: 'Test' } });
      const enviarBtn = input.nextElementSibling;
      fireEvent.click(enviarBtn);
    });
    
    // Esperar a que se cree la sesión
    await waitFor(() => {
      expect(api.iniciarConversacionIA).toHaveBeenCalled();
    });
    
    // Ahora el botón de reiniciar debería estar visible
    await waitFor(() => {
      const reiniciarBtn = screen.getByTitle('Reiniciar conversación');
      expect(reiniciarBtn).toBeDefined();
      fireEvent.click(reiniciarBtn);
    });
    
    // Verificar que el input se limpió
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Escribe tu mensaje...');
      expect(input.value).toBe('');
    });
  });

  test('cierra el modal al hacer click en cerrar', async () => {
    render(<AsistenteIA onAplicarRecomendacion={mockOnAplicarRecomendacion} />);
    
    const boton = screen.getByText('Ayuda IA');
    fireEvent.click(boton);
    
    await waitFor(() => {
      expect(screen.getByText('Asistente IA')).toBeDefined();
    });
    
    // Buscar y hacer click en el botón de cerrar (X)
    const cerrarBtns = screen.getAllByRole('button');
    const cerrarBtn = cerrarBtns.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && svg.querySelector('path[d*="M6 18L18 6M6 6l12 12"]');
    });
    
    if (cerrarBtn) {
      fireEvent.click(cerrarBtn);
      
      await waitFor(() => {
        expect(screen.queryByText('Asistente IA')).toBeNull();
      });
    }
  });
});
