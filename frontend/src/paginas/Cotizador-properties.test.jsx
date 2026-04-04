/**
 * Property-Based Tests para Cotizador - Flujo Secuencial
 * 
 * Valida:
 * - Property 8: Habilitación secuencial de categorías (Requirements 4.2)
 * - Property 9: Navegación hacia atrás permitida (Requirements 4.3)
 * - Property 10: Modificación dispara revalidación (Requirements 4.4)
 * 
 * Usa fast-check para generar casos de prueba aleatorios
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import Cotizador from './Cotizador';
import { AppProvider } from '../contexto/AppContext';

// Mock de framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Mock del módulo api para evitar problemas con import.meta
jest.mock('../servicios/api', () => ({
  obtenerProductos: jest.fn(() => Promise.resolve([])),
  validarCompatibilidad: jest.fn(() => Promise.resolve({ compatible: true, errores: [], advertencias: [] })),
  obtenerUsuarioActual: jest.fn(() => null),
  verificarToken: jest.fn(() => Promise.resolve({ valido: false })),
  login: jest.fn(),
  logout: jest.fn()
}));

// ============================================
// GENERADORES (ARBITRARIES)
// ============================================

/**
 * Genera un componente válido para una categoría específica
 */
const generadorComponente = (categoria, id) => {
  const sockets = ['AM5', 'LGA1700', 'AM4'];
  const socket = sockets[id % sockets.length];
  
  return {
    id,
    nombre: `${categoria} ${id}`,
    categoria,
    socket,
    precio_base: 100 + (id * 50),
    stock: id % 3 === 0 ? 0 : 10,
    disponible_a_pedido: id % 3 === 0
  };
};

/**
 * Genera una configuración parcial con N pasos completados
 */
const generadorConfiguracionParcial = (numPasosCompletos) => {
  const categorias = ['procesador', 'placa_madre', 'ram', 'almacenamiento', 'gpu', 'fuente', 'case'];
  const config = {
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null
  };

  for (let i = 0; i < Math.min(numPasosCompletos, categorias.length); i++) {
    const categoria = categorias[i];
    if (categoria === 'ram') {
      config.ram = [generadorComponente('ram', i + 1)];
    } else {
      config[categoria] = generadorComponente(categoria, i + 1);
    }
  }

  return config;
};

/**
 * Genera un índice de paso válido (0-6)
 */
const generadorIndicePaso = () => fc.integer({ min: 0, max: 6 });

/**
 * Genera un número de pasos completados (0-7)
 */
const generadorPasosCompletos = () => fc.integer({ min: 0, max: 7 });

// ============================================
// HELPERS
// ============================================

/**
 * Renderiza el Cotizador con un contexto mock
 */
const renderCotizadorConContexto = (contextOverrides = {}) => {
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
    cargandoProductos: false,
    ...contextOverrides
  };

  const result = render(
    <AppProvider value={mockContextValue}>
      <Cotizador />
    </AppProvider>
  );

  return { ...result, mockContextValue };
};

/**
 * Obtiene el botón de un paso específico
 */
const obtenerBotonPaso = (indicePaso) => {
  const botones = screen.getAllByRole('button');
  // Los primeros 7 botones son los pasos
  return botones[indicePaso];
};

/**
 * Verifica si un botón está habilitado
 */
const estaHabilitado = (boton) => {
  return !boton.disabled && !boton.classList.contains('cursor-not-allowed');
};

// ============================================
// PROPERTY 8: Habilitación secuencial de categorías
// **Validates: Requirements 4.2**
// ============================================

describe('Property 8: Habilitación secuencial de categorías', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Para cualquier paso N, después de seleccionar un componente válido,
   * el paso N+1 debe quedar habilitado.
   */
  test('Property 8: Completar paso N habilita paso N+1', () => {
    fc.assert(
      fc.property(
        generadorPasosCompletos(),
        (numPasosCompletos) => {
          // Generar configuración con N pasos completos
          const configuracion = generadorConfiguracionParcial(numPasosCompletos);
          
          renderCotizadorConContexto({
            configuracionSeleccionada: configuracion
          });

          // Verificar que los pasos completados y el siguiente estén habilitados
          for (let i = 0; i <= Math.min(numPasosCompletos, 6); i++) {
            const botonPaso = obtenerBotonPaso(i);
            expect(estaHabilitado(botonPaso)).toBe(true);
          }

          // Verificar que los pasos posteriores estén deshabilitados
          for (let i = numPasosCompletos + 1; i < 7; i++) {
            const botonPaso = obtenerBotonPaso(i);
            expect(estaHabilitado(botonPaso)).toBe(false);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * El primer paso (procesador) siempre debe estar habilitado
   */
  test('Property 8: Paso 0 siempre habilitado', () => {
    fc.assert(
      fc.property(
        generadorPasosCompletos(),
        (numPasosCompletos) => {
          const configuracion = generadorConfiguracionParcial(numPasosCompletos);
          
          renderCotizadorConContexto({
            configuracionSeleccionada: configuracion
          });

          const botonPaso0 = obtenerBotonPaso(0);
          expect(estaHabilitado(botonPaso0)).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Si un paso no está completo, los pasos posteriores deben estar deshabilitados
   */
  test('Property 8: Paso incompleto bloquea pasos posteriores', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }), // Paso incompleto (no el último)
        (pasoIncompleto) => {
          // Crear configuración con pasos hasta pasoIncompleto-1 completos
          const configuracion = generadorConfiguracionParcial(pasoIncompleto);
          
          renderCotizadorConContexto({
            configuracionSeleccionada: configuracion
          });

          // Verificar que los pasos después del incompleto estén deshabilitados
          for (let i = pasoIncompleto + 1; i < 7; i++) {
            const botonPaso = obtenerBotonPaso(i);
            expect(estaHabilitado(botonPaso)).toBe(false);
          }
        }
      ),
      { numRuns: 40 }
    );
  });
});

// ============================================
// PROPERTY 9: Navegación hacia atrás permitida
// **Validates: Requirements 4.3**
// ============================================

describe('Property 9: Navegación hacia atrás permitida', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Para cualquier paso N > 0, debe ser posible navegar a pasos anteriores
   */
  test('Property 9: Navegación a pasos anteriores siempre permitida', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }), // Paso actual (no el primero)
        fc.integer({ min: 0, max: 6 }), // Paso destino
        (pasoActual, pasoDestino) => {
          // Solo probar si pasoDestino <= pasoActual (navegación hacia atrás o mismo paso)
          fc.pre(pasoDestino <= pasoActual);

          // Crear configuración con suficientes pasos completos
          const configuracion = generadorConfiguracionParcial(pasoActual + 1);
          
          renderCotizadorConContexto({
            configuracionSeleccionada: configuracion
          });

          // Navegar al paso actual
          const botonPasoActual = obtenerBotonPaso(pasoActual);
          fireEvent.click(botonPasoActual);

          // Intentar navegar al paso destino (anterior o igual)
          const botonPasoDestino = obtenerBotonPaso(pasoDestino);
          
          // El botón debe estar habilitado
          expect(estaHabilitado(botonPasoDestino)).toBe(true);
          
          // Debe ser clickeable
          fireEvent.click(botonPasoDestino);
          
          // No debe lanzar error
          expect(true).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * El botón "Anterior" debe estar habilitado en cualquier paso > 0
   */
  test('Property 9: Botón Anterior habilitado en pasos > 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }),
        (pasoActual) => {
          const configuracion = generadorConfiguracionParcial(pasoActual + 1);
          
          const { container } = renderCotizadorConContexto({
            configuracionSeleccionada: configuracion
          });

          // Navegar al paso actual
          const botonPaso = obtenerBotonPaso(pasoActual);
          fireEvent.click(botonPaso);

          // Verificar que el botón Anterior esté habilitado
          // Usar getAllByText y tomar el último (el más reciente)
          const botonesAnteriores = screen.getAllByText('�?� Anterior');
          const botonAnterior = botonesAnteriores[botonesAnteriores.length - 1];
          expect(botonAnterior).not.toBeDisabled();
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 40 }
    );
  });

  /**
   * El botón "Anterior" debe estar deshabilitado en el paso 0
   */
  test('Property 9: Botón Anterior deshabilitado en paso 0', () => {
    fc.assert(
      fc.property(
        generadorPasosCompletos(),
        (numPasosCompletos) => {
          const configuracion = generadorConfiguracionParcial(numPasosCompletos);
          
          const { container } = renderCotizadorConContexto({
            configuracionSeleccionada: configuracion
          });

          // Navegar al paso 0
          const botonPaso0 = obtenerBotonPaso(0);
          fireEvent.click(botonPaso0);

          // Verificar que el botón Anterior esté deshabilitado
          const botonesAnteriores = screen.getAllByText('�?� Anterior');
          const botonAnterior = botonesAnteriores[botonesAnteriores.length - 1];
          expect(botonAnterior).toBeDisabled();
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Navegar hacia atrás y luego hacia adelante debe funcionar
   */
  test('Property 9: Navegación bidireccional funciona', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 6 }),
        (pasoInicial) => {
          const configuracion = generadorConfiguracionParcial(pasoInicial + 1);
          
          const { container } = renderCotizadorConContexto({
            configuracionSeleccionada: configuracion
          });

          // Navegar al paso inicial
          const botonPasoInicial = obtenerBotonPaso(pasoInicial);
          fireEvent.click(botonPasoInicial);

          // Navegar hacia atrás
          const botonesAnteriores = screen.getAllByText('�?� Anterior');
          const botonAnterior = botonesAnteriores[botonesAnteriores.length - 1];
          fireEvent.click(botonAnterior);

          // Navegar hacia adelante
          const botonesSiguientes = screen.getAllByText('Siguiente �?'');
          const botonSiguiente = botonesSiguientes[botonesSiguientes.length - 1];
          fireEvent.click(botonSiguiente);

          // No debe lanzar error
          expect(true).toBe(true);
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 40 }
    );
  });
});

// ============================================
// PROPERTY 10: Modificación dispara revalidación
// **Validates: Requirements 4.4**
// ============================================

describe('Property 10: Modificación dispara revalidación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Para cualquier configuración parcial, modificar un componente
   * debe disparar nueva validación
   * 
   * Nota: Este test verifica que validarCompatibilidad se llama cuando
   * hay componentes seleccionados (el useEffect en Cotizador.jsx se dispara
   * cuando configuracionSeleccionada cambia)
   */
  test('Property 10: Configuración con componentes dispara validación', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7 }), // Número de pasos completos
        (numPasosCompletos) => {
          const validarCompatibilidad = jest.fn();
          
          // Crear configuración con algunos pasos completos
          const configuracion = generadorConfiguracionParcial(numPasosCompletos);
          
          const { container } = renderCotizadorConContexto({
            configuracionSeleccionada: configuracion,
            validarCompatibilidad
          });

          // Verificar que se llamó a validarCompatibilidad
          // (el useEffect se dispara al montar con configuración no vacía)
          expect(validarCompatibilidad).toHaveBeenCalled();
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 40 }
    );
  });

  /**
   * Configuración con RAM debe disparar validación
   */
  test('Property 10: Configuración con RAM dispara validación', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // Número de módulos RAM
        (numModulosRAM) => {
          const validarCompatibilidad = jest.fn();
          
          // Configuración con procesador, placa madre y RAM
          const configuracion = generadorConfiguracionParcial(2);
          configuracion.ram = [];
          for (let i = 0; i < numModulosRAM; i++) {
            configuracion.ram.push(generadorComponente('ram', i + 100));
          }

          const { container } = renderCotizadorConContexto({
            configuracionSeleccionada: configuracion,
            validarCompatibilidad
          });

          // Verificar que se llamó a validarCompatibilidad
          expect(validarCompatibilidad).toHaveBeenCalled();
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Configuración completa debe disparar validación
   */
  test('Property 10: Configuración completa dispara validación', () => {
    fc.assert(
      fc.property(
        fc.constant(7), // Configuración completa
        (numPasosCompletos) => {
          const validarCompatibilidad = jest.fn();
          
          // Configuración completa
          const configuracion = generadorConfiguracionParcial(numPasosCompletos);

          const { container } = renderCotizadorConContexto({
            configuracionSeleccionada: configuracion,
            validarCompatibilidad
          });

          // Verificar que se llamó a validarCompatibilidad
          expect(validarCompatibilidad).toHaveBeenCalled();
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Validación no debe llamarse si no hay componentes seleccionados
   */
  test('Property 10: Sin componentes no dispara validación', () => {
    const validarCompatibilidad = jest.fn();
    
    const { container } = renderCotizadorConContexto({
      configuracionSeleccionada: {
        procesador: null,
        placa_madre: null,
        ram: [],
        almacenamiento: null,
        gpu: null,
        fuente: null,
        case: null
      },
      validarCompatibilidad
    });

    // Verificar que NO se llamó a validarCompatibilidad
    expect(validarCompatibilidad).not.toHaveBeenCalled();
    
    // Limpiar
    container.remove();
  });
});

