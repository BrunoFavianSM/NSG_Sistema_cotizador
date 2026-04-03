/**
 * Tests para GeneradorPDF
 * 
 * Valida:
 * - Renderizado del botón principal
 * - Apertura y cierre del modal
 * - Validación de email
 * - Generación de cotización
 * - Manejo de errores
 * - Visualización del código ticket
 * - Botones de descarga de PDF
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GeneradorPDF from './GeneradorPDF';
import * as api from '../servicios/api';

// Mock del módulo de API
jest.mock('../servicios/api', () => ({
  crearCotizacion: jest.fn()
}));

// Mock de Sileo
global.Sileo = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

describe('GeneradorPDF', () => {
  const configuracionEjemplo = {
    procesador: { id: 1, nombre: 'Intel Core i5', precio_base: 1200 },
    placa_madre: { id: 2, nombre: 'ASUS B550', precio_base: 800 },
    ram: [{ id: 3, nombre: 'Corsair 16GB', precio_base: 400 }],
    almacenamiento: { id: 4, nombre: 'Samsung 1TB SSD', precio_base: 600 },
    gpu: { id: 5, nombre: 'RTX 3060', precio_base: 2500 },
    fuente: { id: 6, nombre: 'EVGA 650W', precio_base: 450 },
    case: { id: 7, nombre: 'NZXT H510', precio_base: 350 }
  };

  const cotizacionRespuesta = {
    exito: true,
    cotizacion: {
      id: 1,
      codigo_unico: '123e4567-e89b-12d3-a456-426614174000',
      codigo_ticket: 'NSG-2024-0001',
      fecha_emision: new Date('2024-01-15T10:00:00'),
      fecha_validez: new Date('2024-01-18T10:00:00'),
      precio_total: 7560.00,
      margen_aplicado: 20,
      estado: 'Pendiente',
      componentes: []
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // TESTS DE RENDERIZADO
  // ============================================

  test('debe renderizar el botón principal', () => {
    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const boton = screen.getByText('Generar Cotización PDF');
    expect(boton).toBeDefined();
  });

  test('debe mostrar el ícono de PDF en el botón', () => {
    const { container } = render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
  });

  // ============================================
  // TESTS DE MODAL
  // ============================================

  test('debe abrir el modal al hacer clic en el botón', async () => {
    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const boton = screen.getByText('Generar Cotización PDF');
    fireEvent.click(boton);

    await waitFor(() => {
      expect(screen.getAllByText('Generar Cotización').length).toBeGreaterThan(0);
    });
  });

  test('debe mostrar campos de formulario en el modal', async () => {
    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const boton = screen.getByText('Generar Cotización PDF');
    fireEvent.click(boton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('tu@email.com')).toBeDefined();
      expect(screen.getByPlaceholderText('Juan Pérez')).toBeDefined();
      expect(screen.getByPlaceholderText('999 999 999')).toBeDefined();
    });
  });

  test('debe cerrar el modal al hacer clic en cancelar', async () => {
    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      expect(screen.getByText('Cancelar')).toBeDefined();
    });

    const botonCancelar = screen.getByText('Cancelar');
    fireEvent.click(botonCancelar);

    await waitFor(() => {
      expect(screen.queryByText('Generar Cotización')).toBeNull();
    });
  });

  test('debe cerrar el modal al hacer clic en la X', async () => {
    const { container } = render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      expect(screen.getAllByText('Generar Cotización').length).toBeGreaterThan(0);
    });

    // Buscar el botón de cerrar (X) por su SVG path
    const botonCerrar = container.querySelector('button svg path[d*="M6 18L18 6M6 6l12 12"]')?.closest('button');
    expect(botonCerrar).toBeDefined();
    
    fireEvent.click(botonCerrar);

    await waitFor(() => {
      expect(screen.queryByText('Datos del cliente (opcional)')).toBeNull();
    });
  });

  // ============================================
  // TESTS DE VALIDACIÓN
  // ============================================

  test('debe validar email inválido', async () => {
    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const boton = screen.getByText('Generar Cotización PDF');
    fireEvent.click(boton);

    await waitFor(() => {
      const inputEmail = screen.getByPlaceholderText('tu@email.com');
      fireEvent.change(inputEmail, { target: { value: 'email-invalido' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeDefined();
    });
  });

  test('debe aceptar email válido', async () => {
    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const boton = screen.getByText('Generar Cotización PDF');
    fireEvent.click(boton);

    await waitFor(() => {
      const inputEmail = screen.getByPlaceholderText('tu@email.com');
      fireEvent.change(inputEmail, { target: { value: 'cliente@example.com' } });
    });

    await waitFor(() => {
      expect(screen.queryByText('Email inválido')).toBeNull();
    });
  });

  test('debe deshabilitar botón de generar con email inválido', async () => {
    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const inputEmail = screen.getByPlaceholderText('tu@email.com');
      fireEvent.change(inputEmail, { target: { value: 'email-invalido' } });
    });

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      expect(botonGenerar?.disabled).toBe(true);
    });
  });

  // ============================================
  // TESTS DE GENERACIÓN DE COTIZACIÓN
  // ============================================

  test('debe generar cotización sin datos de cliente', async () => {
    api.crearCotizacion.mockResolvedValue(cotizacionRespuesta);

    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      expect(api.crearCotizacion).toHaveBeenCalledWith({
        componentes: expect.arrayContaining([
          { id_producto: 1, cantidad: 1 },
          { id_producto: 2, cantidad: 1 },
          { id_producto: 3, cantidad: 1 },
          { id_producto: 4, cantidad: 1 },
          { id_producto: 5, cantidad: 1 },
          { id_producto: 6, cantidad: 1 },
          { id_producto: 7, cantidad: 1 }
        ]),
        email_cliente: undefined,
        nombre_cliente: undefined,
        telefono_cliente: undefined
      });
    });
  });

  test('debe generar cotización con datos de cliente', async () => {
    api.crearCotizacion.mockResolvedValue(cotizacionRespuesta);

    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const inputEmail = screen.getByPlaceholderText('tu@email.com');
      const inputNombre = screen.getByPlaceholderText('Juan Pérez');
      const inputTelefono = screen.getByPlaceholderText('999 999 999');

      fireEvent.change(inputEmail, { target: { value: 'cliente@example.com' } });
      fireEvent.change(inputNombre, { target: { value: 'Juan Pérez' } });
      fireEvent.change(inputTelefono, { target: { value: '999888777' } });
    });

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      expect(api.crearCotizacion).toHaveBeenCalledWith(
        expect.objectContaining({
          email_cliente: 'cliente@example.com',
          nombre_cliente: 'Juan Pérez',
          telefono_cliente: '999888777'
        })
      );
    });
  });

  test('debe mostrar código ticket después de generar', async () => {
    api.crearCotizacion.mockResolvedValue(cotizacionRespuesta);

    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      expect(screen.getByText('NSG-2024-0001')).toBeDefined();
      expect(screen.getByText('Código de Ticket')).toBeDefined();
    });
  });

  test('debe mostrar información de la cotización generada', async () => {
    api.crearCotizacion.mockResolvedValue(cotizacionRespuesta);

    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      expect(screen.getByText('Fecha de emisión:')).toBeDefined();
      expect(screen.getByText('Válida hasta:')).toBeDefined();
      expect(screen.getByText('Precio total:')).toBeDefined();
      expect(screen.getByText('S/ 7560.00')).toBeDefined();
      expect(screen.getByText('Pendiente')).toBeDefined();
    });
  });

  test('debe mostrar botones de descarga de PDF', async () => {
    api.crearCotizacion.mockResolvedValue(cotizacionRespuesta);

    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      expect(screen.getByText('Cotización con Precios')).toBeDefined();
      expect(screen.getByText('Listado Técnico')).toBeDefined();
    });
  });

  test('debe llamar a Sileo.success después de generar', async () => {
    api.crearCotizacion.mockResolvedValue(cotizacionRespuesta);

    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      expect(global.Sileo.success).toHaveBeenCalledWith('¡Cotización generada exitosamente!');
    });
  });

  test('debe llamar a onExito después de generar', async () => {
    api.crearCotizacion.mockResolvedValue(cotizacionRespuesta);
    const onExito = jest.fn();

    render(<GeneradorPDF configuracion={configuracionEjemplo} onExito={onExito} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      expect(onExito).toHaveBeenCalledWith(cotizacionRespuesta.cotizacion);
    });
  });

  // ============================================
  // TESTS DE MANEJO DE ERRORES
  // ============================================

  test('debe mostrar error cuando falla la API', async () => {
    api.crearCotizacion.mockRejectedValue(new Error('Error de red'));

    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error de red/i)).toBeDefined();
    });
  });

  test('debe llamar a Sileo.error cuando falla', async () => {
    api.crearCotizacion.mockRejectedValue(new Error('Error de red'));

    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      expect(global.Sileo.error).toHaveBeenCalled();
    });
  });

  test('debe llamar a onError cuando falla', async () => {
    const error = new Error('Error de red');
    api.crearCotizacion.mockRejectedValue(error);
    const onError = jest.fn();

    render(<GeneradorPDF configuracion={configuracionEjemplo} onError={onError} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  test('debe mostrar estado de cargando durante generación', async () => {
    api.crearCotizacion.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(cotizacionRespuesta), 100))
    );

    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    // Verificar que muestra "Generando..."
    await waitFor(() => {
      expect(screen.getByText('Generando...')).toBeDefined();
    });

    // Esperar a que termine
    await waitFor(() => {
      expect(screen.getByText('NSG-2024-0001')).toBeDefined();
    }, { timeout: 200 });
  });

  // ============================================
  // TESTS DE PREPARACIÓN DE COMPONENTES
  // ============================================

  test('debe incluir todos los componentes en la solicitud', async () => {
    api.crearCotizacion.mockResolvedValue(cotizacionRespuesta);

    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      const llamada = api.crearCotizacion.mock.calls[0][0];
      expect(llamada.componentes).toHaveLength(7);
    });
  });

  test('debe manejar múltiples módulos RAM', async () => {
    api.crearCotizacion.mockResolvedValue(cotizacionRespuesta);

    const configuracionConMultipleRAM = {
      ...configuracionEjemplo,
      ram: [
        { id: 3, nombre: 'Corsair 16GB', precio_base: 400 },
        { id: 8, nombre: 'Corsair 16GB', precio_base: 400 }
      ]
    };

    render(<GeneradorPDF configuracion={configuracionConMultipleRAM} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      const llamada = api.crearCotizacion.mock.calls[0][0];
      expect(llamada.componentes).toHaveLength(8); // 6 componentes + 2 RAM
      expect(llamada.componentes.filter(c => c.id_producto === 3 || c.id_producto === 8)).toHaveLength(2);
    });
  });

  // ============================================
  // TESTS DE DESCARGA DE PDF
  // ============================================

  test('debe mostrar mensaje al intentar descargar PDF', async () => {
    api.crearCotizacion.mockResolvedValue(cotizacionRespuesta);

    render(<GeneradorPDF configuracion={configuracionEjemplo} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    await waitFor(() => {
      const botonDescarga = screen.getByText('Cotización con Precios');
      fireEvent.click(botonDescarga);
    });

    await waitFor(() => {
      expect(global.Sileo.info).toHaveBeenCalledWith('Función de descarga de PDF en desarrollo');
    });
  });

  // ============================================
  // TESTS DE PROPS
  // ============================================

  test('debe aplicar className personalizado', () => {
    const { container } = render(
      <GeneradorPDF configuracion={configuracionEjemplo} className="custom-class" />
    );
    
    const boton = container.querySelector('.custom-class');
    expect(boton).toBeDefined();
  });

  test('debe usar margen de ganancia personalizado', async () => {
    api.crearCotizacion.mockResolvedValue(cotizacionRespuesta);

    render(<GeneradorPDF configuracion={configuracionEjemplo} margenGanancia={25} />);
    
    const botonAbrir = screen.getByText('Generar Cotización PDF');
    fireEvent.click(botonAbrir);

    await waitFor(() => {
      const botonGenerar = screen.getAllByText('Generar Cotización').find(
        el => el.tagName === 'SPAN'
      )?.parentElement;
      fireEvent.click(botonGenerar);
    });

    // El margen se aplica en el backend, aquí solo verificamos que se envíe la solicitud
    await waitFor(() => {
      expect(api.crearCotizacion).toHaveBeenCalled();
    });
  });
});
