/**
 * Tests para Cotizador
 * 
 * Valida:
 * - Navegación secuencial entre pasos
 * - Habilitación condicional de pasos
 * - Navegación hacia atrás
 * - Integración con AppContext
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import Cotizador from './Cotizador';
import { AppProvider } from '../contexto/AppContext';

// Mock de framer-motion para evitar problemas en tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Mock del contexto con datos de prueba
const mockContextValue = {
  configuracionSeleccionada: {
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null
  },
  seleccionarComponente: jest.fn(),
  agregarRAM: jest.fn(),
  eliminarRAM: jest.fn(),
  validarCompatibilidad: jest.fn(),
  validacionCompatibilidad: {
    compatible: true,
    errores: [],
    advertencias: []
  },
  calcularPrecioTotal: jest.fn(() => 0),
  cargarProductos: jest.fn(),
  productos: [],
  cargandoProductos: false
};

const renderCotizador = (contextOverrides = {}) => {
  const contextValue = { ...mockContextValue, ...contextOverrides };
  
  return render(
    <AppProvider value={contextValue}>
      <Cotizador />
    </AppProvider>
  );
};

describe('Cotizador - Navegación Secuencial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe mostrar el paso inicial (Procesador)', () => {
    renderCotizador();
    expect(screen.getByText('Procesador')).toBeInTheDocument();
  });

  test('debe tener 7 pasos en total', () => {
    renderCotizador();
    const pasos = ['Procesador', 'Placa Madre', 'RAM', 'Almacenamiento', 'GPU', 'Fuente de Poder', 'Case'];
    
    pasos.forEach(paso => {
      expect(screen.getByText(paso)).toBeInTheDocument();
    });
  });

  test('el botón Anterior debe estar deshabilitado en el primer paso', () => {
    renderCotizador();
    const botonAnterior = screen.getByText('← Anterior');
    expect(botonAnterior).toBeDisabled();
  });

  test('el botón Siguiente debe estar deshabilitado si no hay selección', () => {
    renderCotizador();
    const botonSiguiente = screen.getByText('Siguiente →');
    expect(botonSiguiente).toBeDisabled();
  });
});

describe('Cotizador - Habilitación Condicional', () => {
  test('solo el primer paso debe estar habilitado inicialmente', () => {
    renderCotizador();
    
    // El paso 1 (Procesador) debe estar habilitado
    const paso1 = screen.getAllByRole('button')[0];
    expect(paso1).not.toBeDisabled();
    
    // Los demás pasos deben estar deshabilitados
    const paso2 = screen.getAllByRole('button')[1];
    expect(paso2).toBeDisabled();
  });

  test('debe habilitar el siguiente paso cuando se completa el actual', () => {
    const procesadorSeleccionado = {
      id: 1,
      nombre: 'Intel Core i5',
      categoria: 'procesador',
      socket: 'LGA1700',
      precio_base: 1000
    };

    renderCotizador({
      configuracionSeleccionada: {
        ...mockContextValue.configuracionSeleccionada,
        procesador: procesadorSeleccionado
      }
    });

    // El paso 2 (Placa Madre) ahora debe estar habilitado
    const paso2 = screen.getAllByRole('button')[1];
    expect(paso2).not.toBeDisabled();
  });
});

describe('Cotizador - Navegación hacia Atrás', () => {
  test('debe permitir navegar al paso anterior', async () => {
    const procesadorSeleccionado = {
      id: 1,
      nombre: 'Intel Core i5',
      categoria: 'procesador',
      socket: 'LGA1700',
      precio_base: 1000
    };

    renderCotizador({
      configuracionSeleccionada: {
        ...mockContextValue.configuracionSeleccionada,
        procesador: procesadorSeleccionado
      }
    });

    // Navegar al siguiente paso
    const botonSiguiente = screen.getByText('Siguiente →');
    fireEvent.click(botonSiguiente);

    await waitFor(() => {
      expect(screen.getByText('Placa Madre')).toBeInTheDocument();
    });

    // Navegar al paso anterior
    const botonAnterior = screen.getByText('← Anterior');
    fireEvent.click(botonAnterior);

    await waitFor(() => {
      expect(screen.getByText('Procesador')).toBeInTheDocument();
    });
  });

  test('debe permitir hacer clic en pasos anteriores completados', () => {
    const configuracionParcial = {
      procesador: { id: 1, nombre: 'Intel Core i5', socket: 'LGA1700', precio_base: 1000 },
      placa_madre: { id: 2, nombre: 'ASUS ROG', socket: 'LGA1700', precio_base: 800 },
      ram: [],
      almacenamiento: null,
      gpu: null,
      fuente: null,
      case: null
    };

    renderCotizador({
      configuracionSeleccionada: configuracionParcial
    });

    // Hacer clic en el paso 1 (Procesador)
    const paso1 = screen.getAllByRole('button')[0];
    fireEvent.click(paso1);

    // Debe mostrar el contenido del paso 1
    expect(screen.getByText('Procesador')).toBeInTheDocument();
  });
});

describe('Cotizador - Validación de Compatibilidad', () => {
  test('debe mostrar errores de compatibilidad', () => {
    renderCotizador({
      validacionCompatibilidad: {
        compatible: false,
        errores: ['Socket incompatible: AM5 vs LGA1700'],
        advertencias: []
      }
    });

    expect(screen.getByText('⚠️ Problemas de compatibilidad:')).toBeInTheDocument();
    expect(screen.getByText('Socket incompatible: AM5 vs LGA1700')).toBeInTheDocument();
  });

  test('debe mostrar advertencias', () => {
    renderCotizador({
      validacionCompatibilidad: {
        compatible: true,
        errores: [],
        advertencias: ['⚠️ Margen ajustado: recomendado 600W']
      }
    });

    expect(screen.getByText('ℹ️ Advertencias:')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Margen ajustado: recomendado 600W')).toBeInTheDocument();
  });

  test('debe llamar a validarCompatibilidad cuando cambia la configuración', () => {
    const validarCompatibilidad = jest.fn();
    
    renderCotizador({
      validarCompatibilidad,
      configuracionSeleccionada: {
        procesador: { id: 1, nombre: 'Intel Core i5' },
        placa_madre: null,
        ram: [],
        almacenamiento: null,
        gpu: null,
        fuente: null,
        case: null
      }
    });

    expect(validarCompatibilidad).toHaveBeenCalled();
  });
});

describe('Cotizador - Cálculo de Precio', () => {
  test('debe mostrar el precio total', () => {
    renderCotizador({
      calcularPrecioTotal: jest.fn(() => 5000)
    });

    expect(screen.getByText('S/ 5000.00')).toBeInTheDocument();
  });

  test('debe actualizar el precio cuando cambia la configuración', () => {
    const { rerender } = renderCotizador({
      calcularPrecioTotal: jest.fn(() => 3000)
    });

    expect(screen.getByText('S/ 3000.00')).toBeInTheDocument();

    // Simular cambio de configuración
    rerender(
      <AppProvider value={{
        ...mockContextValue,
        calcularPrecioTotal: jest.fn(() => 4500)
      }}>
        <Cotizador />
      </AppProvider>
    );

    expect(screen.getByText('S/ 4500.00')).toBeInTheDocument();
  });
});

describe('Cotizador - Selección de RAM', () => {
  test('debe permitir agregar múltiples módulos de RAM', () => {
    const agregarRAM = jest.fn();
    const ram1 = { id: 1, nombre: 'RAM 8GB DDR4', precio_base: 200 };
    const ram2 = { id: 2, nombre: 'RAM 16GB DDR4', precio_base: 400 };

    renderCotizador({
      agregarRAM,
      productos: [ram1, ram2],
      configuracionSeleccionada: {
        ...mockContextValue.configuracionSeleccionada,
        procesador: { id: 1, nombre: 'Intel Core i5' },
        placa_madre: { id: 2, nombre: 'ASUS ROG' }
      }
    });

    // Navegar al paso de RAM
    const botonSiguiente = screen.getByText('Siguiente →');
    fireEvent.click(botonSiguiente);
    fireEvent.click(botonSiguiente);

    // Seleccionar RAM
    const tarjetaRAM = screen.getByText('RAM 8GB DDR4');
    fireEvent.click(tarjetaRAM.closest('div'));

    expect(agregarRAM).toHaveBeenCalledWith(ram1);
  });

  test('debe permitir eliminar módulos de RAM', () => {
    const eliminarRAM = jest.fn();
    const ramSeleccionada = [
      { id: 1, nombre: 'RAM 8GB DDR4', precio_base: 200 }
    ];

    renderCotizador({
      eliminarRAM,
      configuracionSeleccionada: {
        ...mockContextValue.configuracionSeleccionada,
        procesador: { id: 1, nombre: 'Intel Core i5' },
        placa_madre: { id: 2, nombre: 'ASUS ROG' },
        ram: ramSeleccionada
      }
    });

    // Navegar al paso de RAM
    const botonSiguiente = screen.getByText('Siguiente →');
    fireEvent.click(botonSiguiente);
    fireEvent.click(botonSiguiente);

    // Eliminar RAM
    const botonEliminar = screen.getByText('Eliminar');
    fireEvent.click(botonEliminar);

    expect(eliminarRAM).toHaveBeenCalledWith(0);
  });
});

describe('Cotizador - Botón Finalizar', () => {
  test('debe mostrar el botón de finalizar cuando todos los pasos están completos', () => {
    const configuracionCompleta = {
      procesador: { id: 1, nombre: 'Intel Core i5' },
      placa_madre: { id: 2, nombre: 'ASUS ROG' },
      ram: [{ id: 3, nombre: 'RAM 16GB' }],
      almacenamiento: { id: 4, nombre: 'SSD 1TB' },
      gpu: { id: 5, nombre: 'RTX 4060' },
      fuente: { id: 6, nombre: 'Fuente 650W' },
      case: { id: 7, nombre: 'Case ATX' }
    };

    renderCotizador({
      configuracionSeleccionada: configuracionCompleta
    });

    // Navegar al último paso
    const paso7 = screen.getAllByRole('button')[6];
    fireEvent.click(paso7);

    expect(screen.getByText('Generar Cotización')).toBeInTheDocument();
  });
});
