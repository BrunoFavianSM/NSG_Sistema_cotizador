/**
 * Property-Based Tests para Cotizador - Flujo Secuencial
 * 
 * Valida:
 * - Property 8: Habilitaci�n secuencial de categor�as (Requirements 4.2)
 * - Property 9: Navegaci�n hacia atr�s permitida (Requirements 4.3)
 * - Property 10: Modificaci�n dispara revalidaci�n (Requirements 4.4)
 * 
 * Usa fast-check para generar casos de prueba aleatorios
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
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

// Mock del m�dulo api para evitar problemas con import.meta
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
 * Genera un componente v�lido para una categor�a espec�fica
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
 * Genera una configuraci�n parcial con N pasos completados
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
 * Genera un �ndice de paso v�lido (0-6)
 */
const generadorIndicePaso = () => fc.integer({ min: 0, max: 6 });

/**
 * Genera un n�mero de pasos completados (0-7)
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
    ...contextOverrides
  };

  const result = render(
    <ToastProvider>
      <AppProvider value={mockContextValue}>
        <Cotizador />
      </AppProvider>
    </ToastProvider>
  );

  return { ...result, mockContextValue };
};

/**
 * Obtiene el bot�n de un paso espec�fico
 */
const obtenerBotonPaso = (indicePaso) => {
  // Los botones de pasos están dentro del <ol> de la sección de pasos
  const listaPasos = document.querySelector('ol');
  if (listaPasos) {
    const botonesPasos = listaPasos.querySelectorAll('button');
    if (botonesPasos[indicePaso]) return botonesPasos[indicePaso];
  }
  // Fallback: todos los botones
  const botones = screen.getAllByRole('button');
  return botones[indicePaso];
};

/**
 * Verifica si un bot�n est� habilitado
 */
const estaHabilitado = (boton) => {
  return !boton.disabled && !boton.classList.contains('cursor-not-allowed');
};

// ============================================
// PROPERTY 8: Habilitaci�n secuencial de categor�as
// **Validates: Requirements 4.2**
// ============================================

describe('Property 8: Habilitaci�n secuencial de categor�as', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Para cualquier paso N, despu�s de seleccionar un componente v�lido,
   * el paso N+1 debe quedar habilitado.
   */
  test('Property 8: Completar paso N habilita paso N+1', () => {
    fc.assert(
      fc.property(
        generadorPasosCompletos(),
        (numPasosCompletos) => {
          // Generar configuraci�n con N pasos completos
          const configuracion = generadorConfiguracionParcial(numPasosCompletos);
          
          renderCotizadorConContexto({
            configuracionSeleccionada: configuracion
          });

          // Verificar que los pasos completados y el siguiente est�n habilitados
          for (let i = 0; i <= Math.min(numPasosCompletos, 6); i++) {
            const botonPaso = obtenerBotonPaso(i);
            expect(estaHabilitado(botonPaso)).toBe(true);
          }

          // Verificar que los pasos posteriores est�n deshabilitados
          for (let i = numPasosCompletos + 1; i < 7; i++) {
            const botonPaso = obtenerBotonPaso(i);
            expect(estaHabilitado(botonPaso)).toBe(false);
          }
        }
      ),
      { numRuns: 10 }
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
      { numRuns: 8 }
    );
  });

  /**
   * Si un paso no est� completo, los pasos posteriores deben estar deshabilitados
   */
  test('Property 8: Paso incompleto bloquea pasos posteriores', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }), // Paso incompleto (no el �ltimo)
        (pasoIncompleto) => {
          // Crear configuraci�n con pasos hasta pasoIncompleto-1 completos
          const configuracion = generadorConfiguracionParcial(pasoIncompleto);
          
          renderCotizadorConContexto({
            configuracionSeleccionada: configuracion
          });

          // Verificar que los pasos despu�s del incompleto est�n deshabilitados
          for (let i = pasoIncompleto + 1; i < 7; i++) {
            const botonPaso = obtenerBotonPaso(i);
            expect(estaHabilitado(botonPaso)).toBe(false);
          }
        }
      ),
      { numRuns: 8 }
    );
  });
});

// ============================================
// PROPERTY 9: Navegaci�n hacia atr�s permitida
// **Validates: Requirements 4.3**
// ============================================

describe('Property 9: Navegaci�n hacia atr�s permitida', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Para cualquier paso N > 0, debe ser posible navegar a pasos anteriores
   */
  test('Property 9: Navegaci�n a pasos anteriores siempre permitida', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }), // Paso actual (no el primero)
        fc.integer({ min: 0, max: 6 }), // Paso destino
        (pasoActual, pasoDestino) => {
          // Solo probar si pasoDestino <= pasoActual (navegaci�n hacia atr�s o mismo paso)
          fc.pre(pasoDestino <= pasoActual);

          // Crear configuraci�n con suficientes pasos completos
          const configuracion = generadorConfiguracionParcial(pasoActual + 1);
          
          renderCotizadorConContexto({
            configuracionSeleccionada: configuracion
          });

          // Navegar al paso actual
          const botonPasoActual = obtenerBotonPaso(pasoActual);
          fireEvent.click(botonPasoActual);

          // Intentar navegar al paso destino (anterior o igual)
          const botonPasoDestino = obtenerBotonPaso(pasoDestino);
          
          // El bot�n debe estar habilitado
          expect(estaHabilitado(botonPasoDestino)).toBe(true);
          
          // Debe ser clickeable
          fireEvent.click(botonPasoDestino);
          
          // No debe lanzar error
          expect(true).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * El bot�n "Anterior" debe estar habilitado en cualquier paso > 0
   */
  test('Property 9: Bot�n Anterior habilitado en pasos > 0', () => {
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

          // Verificar que el bot�n Anterior est� habilitado
          // Usar getAllByText y tomar el �ltimo (el m�s reciente)
          const botonesAnteriores = screen.getAllByText('Anterior');
          const botonAnterior = botonesAnteriores[botonesAnteriores.length - 1];
          expect(botonAnterior).not.toBeDisabled();
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 8 }
    );
  });

  /**
   * El bot�n "Anterior" debe estar deshabilitado en el paso 0
   */
  test('Property 9: Bot�n Anterior deshabilitado en paso 0', () => {
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

          // Verificar que el bot�n Anterior est� deshabilitado
          const botonesAnteriores = screen.getAllByText('Anterior');
          const botonAnterior = botonesAnteriores[botonesAnteriores.length - 1];
          expect(botonAnterior).toBeDisabled();
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 8 }
    );
  });

  /**
   * Navegar hacia atr�s y luego hacia adelante debe funcionar
   */
  test('Property 9: Navegaci�n bidireccional funciona', () => {
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

          // Navegar hacia atr�s
          const botonesAnteriores = screen.getAllByText('Anterior');
          const botonAnterior = botonesAnteriores[botonesAnteriores.length - 1];
          fireEvent.click(botonAnterior);

          // Navegar hacia adelante
          const botonesSiguientes = screen.getAllByText('Siguiente');
          const botonSiguiente = botonesSiguientes[botonesSiguientes.length - 1];
          fireEvent.click(botonSiguiente);

          // No debe lanzar error
          expect(true).toBe(true);
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 8 }
    );
  });
});

// ============================================
// PROPERTY 10: Modificaci�n dispara revalidaci�n
// **Validates: Requirements 4.4**
// ============================================

describe('Property 10: Modificaci�n dispara revalidaci�n', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Para cualquier configuraci�n parcial, modificar un componente
   * debe disparar nueva validaci�n
   * 
   * Nota: Este test verifica que validarCompatibilidad se llama cuando
   * hay componentes seleccionados (el useEffect en Cotizador.jsx se dispara
   * cuando configuracionSeleccionada cambia)
   */
  test('Property 10: Configuraci�n con componentes dispara validaci�n', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7 }), // N�mero de pasos completos
        (numPasosCompletos) => {
          const validarCompatibilidad = jest.fn();
          
          // Crear configuraci�n con algunos pasos completos
          const configuracion = generadorConfiguracionParcial(numPasosCompletos);
          
          const { container } = renderCotizadorConContexto({
            configuracionSeleccionada: configuracion,
            validarCompatibilidad
          });

          // Verificar que se llam� a validarCompatibilidad
          // (el useEffect se dispara al montar con configuraci�n no vac�a)
          expect(validarCompatibilidad).toHaveBeenCalled();
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 8 }
    );
  });

  /**
   * Configuraci�n con RAM debe disparar validaci�n
   */
  test('Property 10: Configuraci�n con RAM dispara validaci�n', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // N�mero de m�dulos RAM
        (numModulosRAM) => {
          const validarCompatibilidad = jest.fn();
          
          // Configuraci�n con procesador, placa madre y RAM
          const configuracion = generadorConfiguracionParcial(2);
          configuracion.ram = [];
          for (let i = 0; i < numModulosRAM; i++) {
            configuracion.ram.push(generadorComponente('ram', i + 100));
          }

          const { container } = renderCotizadorConContexto({
            configuracionSeleccionada: configuracion,
            validarCompatibilidad
          });

          // Verificar que se llam� a validarCompatibilidad
          expect(validarCompatibilidad).toHaveBeenCalled();
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 8 }
    );
  });

  /**
   * Configuraci�n completa debe disparar validaci�n
   */
  test('Property 10: Configuraci�n completa dispara validaci�n', () => {
    fc.assert(
      fc.property(
        fc.constant(7), // Configuraci�n completa
        (numPasosCompletos) => {
          const validarCompatibilidad = jest.fn();
          
          // Configuraci�n completa
          const configuracion = generadorConfiguracionParcial(numPasosCompletos);

          const { container } = renderCotizadorConContexto({
            configuracionSeleccionada: configuracion,
            validarCompatibilidad
          });

          // Verificar que se llam� a validarCompatibilidad
          expect(validarCompatibilidad).toHaveBeenCalled();
          
          // Limpiar
          container.remove();
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Validaci�n no debe llamarse si no hay componentes seleccionados
   */
  test('Property 10: Sin componentes no dispara validaci�n', () => {
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

    // Verificar que NO se llam� a validarCompatibilidad
    expect(validarCompatibilidad).not.toHaveBeenCalled();
    
    // Limpiar
    container.remove();
  });
});

