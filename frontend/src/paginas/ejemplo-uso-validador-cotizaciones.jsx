/**
 * Ejemplo de Uso: Validador de Cotizaciones
 * 
 * Este archivo muestra cómo integrar y usar el componente ValidadorCotizaciones
 * en diferentes contextos y escenarios.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '../contexto/AppContext';
import ValidadorCotizaciones from './ValidadorCotizaciones';
import Login from './Login';

// ============================================
// EJEMPLO 1: Integración Básica en Router
// ============================================

/**
 * Configuración básica de rutas con ValidadorCotizaciones
 */
export function EjemploIntegracionBasica() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/validador" element={<ValidadorCotizaciones />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

// ============================================
// EJEMPLO 2: Con Layout de Admin
// ============================================

/**
 * Layout administrativo con navegación
 */
function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">
              NSG Latinoamerica - Admin
            </h1>
            <div className="flex gap-4">
              <a href="/admin/productos" className="text-gray-600 hover:text-gray-900">
                Productos
              </a>
              <a href="/admin/validador" className="text-blue-600 font-semibold">
                Validador
              </a>
              <a href="/admin/configuracion" className="text-gray-600 hover:text-gray-900">
                Configuración
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main>{children}</main>
    </div>
  );
}

/**
 * ValidadorCotizaciones dentro de un layout
 */
export function EjemploConLayout() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/validador"
            element={
              <AdminLayout>
                <ValidadorCotizaciones />
              </AdminLayout>
            }
          />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

// ============================================
// EJEMPLO 3: Con Protección de Rutas
// ============================================

/**
 * Componente de ruta protegida
 */
function RutaProtegida({ children }) {
  const { autenticado, cargandoAuth } = useAppContext();

  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * ValidadorCotizaciones con protección de autenticación
 */
export function EjemploRutaProtegida() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/validador"
            element={
              <RutaProtegida>
                <ValidadorCotizaciones />
              </RutaProtegida>
            }
          />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

// ============================================
// EJEMPLO 4: Uso Programático de la API
// ============================================

/**
 * Ejemplo de cómo usar las funciones de API directamente
 */
export async function ejemploUsoProgramatico() {
  const codigoTicket = 'NSG-2024-0001';

  try {
    // 1. Validar cotización
    console.log('Validando cotización...');
    const resultado = await api.validarCotizacion(codigoTicket);

    if (!resultado.valida) {
      console.error('Cotización no válida:', resultado.mensaje);
      return;
    }

    const cotizacion = resultado.cotizacion;

    // 2. Mostrar información
    console.log('Código:', cotizacion.codigo_ticket);
    console.log('Estado:', cotizacion.estado);
    console.log('Precio Original:', cotizacion.precio_total_historico);
    console.log('Precio Actual:', cotizacion.precio_total_actual);
    console.log('Diferencia:', cotizacion.diferencia_total);

    // 3. Verificar cambios de precio
    if (cotizacion.hay_cambios_precio) {
      console.log('�s�️ Hay cambios en los precios');
      
      cotizacion.componentes.forEach(comp => {
        if (Math.abs(comp.diferencia_unitaria) > 0.01) {
          console.log(
            `  - ${comp.nombre}: ${comp.diferencia_unitaria > 0 ? '+' : ''}S/ ${comp.diferencia_unitaria.toFixed(2)}`
          );
        }
      });
    }

    // 4. Verificar disponibilidad
    const noDisponibles = cotizacion.componentes.filter(
      comp => comp.stock_actual === 0 && !comp.disponible_a_pedido
    );

    if (noDisponibles.length > 0) {
      console.log('�s�️ Componentes no disponibles:');
      noDisponibles.forEach(comp => {
        console.log(`  - ${comp.nombre}`);
      });
    }

    // 5. Marcar como reclamada (si está pendiente)
    if (cotizacion.estado === 'Pendiente') {
      console.log('Marcando como reclamada...');
      await api.marcarComoReclamada(codigoTicket);
      console.log('�o" Cotización reclamada exitosamente');
    }

  } catch (error) {
    console.error('Error:', error.mensaje || error);
  }
}

// ============================================
// EJEMPLO 5: Componente Personalizado
// ============================================

/**
 * Componente que muestra resumen rápido de cotización
 */
function ResumenCotizacion({ codigoTicket }) {
  const [cotizacion, setCotizacion] = React.useState(null);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (codigoTicket) {
      cargarCotizacion();
    }
  }, [codigoTicket]);

  const cargarCotizacion = async () => {
    setCargando(true);
    setError('');

    try {
      const resultado = await api.validarCotizacion(codigoTicket);
      
      if (resultado.valida) {
        setCotizacion(resultado.cotizacion);
      } else {
        setError(resultado.mensaje);
      }
    } catch (err) {
      setError(err.mensaje || 'Error al cargar cotización');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!cotizacion) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold text-lg mb-2">{cotizacion.codigo_ticket}</h3>
      <div className="space-y-1 text-sm">
        <p>Estado: <span className="font-semibold">{cotizacion.estado}</span></p>
        <p>Precio: S/ {cotizacion.precio_total_actual.toFixed(2)}</p>
        {cotizacion.hay_cambios_precio && (
          <p className="text-orange-600">
            �s�️ Cambio: {cotizacion.diferencia_total > 0 ? '+' : ''}
            S/ {cotizacion.diferencia_total.toFixed(2)}
          </p>
        )}
        <p>Componentes: {cotizacion.componentes.length}</p>
      </div>
    </div>
  );
}

/**
 * Uso del componente de resumen
 */
export function EjemploResumen() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Cotizaciones Recientes</h2>
      <div className="grid grid-cols-3 gap-4">
        <ResumenCotizacion codigoTicket="NSG-2024-0001" />
        <ResumenCotizacion codigoTicket="NSG-2024-0002" />
        <ResumenCotizacion codigoTicket="NSG-2024-0003" />
      </div>
    </div>
  );
}

// ============================================
// EJEMPLO 6: Hook Personalizado
// ============================================

/**
 * Hook personalizado para validar cotizaciones
 */
function useValidadorCotizacion() {
  const [cotizacion, setCotizacion] = React.useState(null);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState('');

  const validar = async (codigoTicket) => {
    setCargando(true);
    setError('');
    setCotizacion(null);

    try {
      const resultado = await api.validarCotizacion(codigoTicket);
      
      if (resultado.valida) {
        setCotizacion(resultado.cotizacion);
        return { exito: true, cotizacion: resultado.cotizacion };
      } else {
        setError(resultado.mensaje);
        return { exito: false, error: resultado.mensaje };
      }
    } catch (err) {
      const mensaje = err.mensaje || 'Error al validar cotización';
      setError(mensaje);
      return { exito: false, error: mensaje };
    } finally {
      setCargando(false);
    }
  };

  const marcarReclamada = async () => {
    if (!cotizacion) {
      return { exito: false, error: 'No hay cotización cargada' };
    }

    try {
      await api.marcarComoReclamada(cotizacion.codigo_ticket);
      setCotizacion(prev => ({ ...prev, estado: 'Reclamada' }));
      return { exito: true };
    } catch (err) {
      const mensaje = err.mensaje || 'Error al marcar como reclamada';
      setError(mensaje);
      return { exito: false, error: mensaje };
    }
  };

  const limpiar = () => {
    setCotizacion(null);
    setError('');
  };

  return {
    cotizacion,
    cargando,
    error,
    validar,
    marcarReclamada,
    limpiar
  };
}

/**
 * Componente que usa el hook personalizado
 */
export function EjemploConHook() {
  const { cotizacion, cargando, error, validar, marcarReclamada, limpiar } = useValidadorCotizacion();
  const [codigo, setCodigo] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    validar(codigo);
  };

  return (
    <div className="p-8">
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="NSG-2024-0001"
          className="border rounded px-4 py-2 mr-2"
        />
        <button
          type="submit"
          disabled={cargando}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {cargando ? 'Buscando...' : 'Buscar'}
        </button>
        {cotizacion && (
          <button
            type="button"
            onClick={limpiar}
            className="bg-gray-200 px-4 py-2 rounded ml-2"
          >
            Limpiar
          </button>
        )}
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          {error}
        </div>
      )}

      {cotizacion && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">{cotizacion.codigo_ticket}</h2>
          <p>Estado: {cotizacion.estado}</p>
          <p>Precio: S/ {cotizacion.precio_total_actual.toFixed(2)}</p>
          
          {cotizacion.estado === 'Pendiente' && (
            <button
              onClick={marcarReclamada}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            >
              Marcar como Reclamada
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// EJEMPLO 7: Integración con Notificaciones
// ============================================

/**
 * ValidadorCotizaciones con sistema de notificaciones
 */
export function EjemploConNotificaciones() {
  const [notificaciones, setNotificaciones] = React.useState([]);

  const agregarNotificacion = (mensaje, tipo = 'info') => {
    const id = Date.now();
    setNotificaciones(prev => [...prev, { id, mensaje, tipo }]);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  return (
    <div>
      {/* Notificaciones */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notificaciones.map(notif => (
          <div
            key={notif.id}
            className={`px-4 py-3 rounded shadow-lg ${
              notif.tipo === 'exito' ? 'bg-green-500' :
              notif.tipo === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            } text-white`}
          >
            {notif.mensaje}
          </div>
        ))}
      </div>

      {/* Validador */}
      <ValidadorCotizaciones onNotificacion={agregarNotificacion} />
    </div>
  );
}

// ============================================
// EJEMPLO 8: Testing
// ============================================

/**
 * Ejemplo de cómo testear el componente
 */
export const ejemploTesting = `
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../contexto/AppContext';
import ValidadorCotizaciones from './ValidadorCotizaciones';
import * as api from '../servicios/api';

// Mock de API
vi.mock('../servicios/api');

test('busca y muestra cotización', async () => {
  // Configurar mock
  api.validarCotizacion.mockResolvedValue({
    valida: true,
    cotizacion: {
      codigo_ticket: 'NSG-2024-0001',
      estado: 'Pendiente',
      precio_total_actual: 3500.00,
      componentes: []
    }
  });

  // Renderizar
  render(
    <BrowserRouter>
      <AppProvider>
        <ValidadorCotizaciones />
      </AppProvider>
    </BrowserRouter>
  );

  // Ingresar código
  const input = screen.getByPlaceholderText('NSG-2024-0001');
  fireEvent.change(input, { target: { value: 'NSG-2024-0001' } });

  // Buscar
  const boton = screen.getByText('�Y"� Buscar');
  fireEvent.click(boton);

  // Verificar resultado
  await waitFor(() => {
    expect(screen.getByText('NSG-2024-0001')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });
});
`;

// ============================================
// EXPORTAR TODOS LOS EJEMPLOS
// ============================================

export default {
  EjemploIntegracionBasica,
  EjemploConLayout,
  EjemploRutaProtegida,
  ejemploUsoProgramatico,
  EjemploResumen,
  EjemploConHook,
  EjemploConNotificaciones,
  ejemploTesting
};

