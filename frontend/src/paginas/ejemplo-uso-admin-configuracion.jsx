/**
 * Ejemplo de Uso: AdminConfiguracion
 * 
 * Este archivo demuestra cómo integrar y usar el componente AdminConfiguracion
 * en diferentes escenarios.
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AppProvider } from '../contexto/AppContext';
import AdminConfiguracion from './AdminConfiguracion';

// ============================================
// EJEMPLO 1: Integración Básica
// ============================================

function EjemploBasico() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

// ============================================
// EJEMPLO 2: Con Navegación
// ============================================

function EjemploConNavegacion() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100">
          {/* Barra de navegación */}
          <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex gap-4">
                <Link 
                  to="/admin/productos" 
                  className="text-gray-600 hover:text-blue-600"
                >
                  Productos
                </Link>
                <Link 
                  to="/admin/configuracion" 
                  className="text-gray-600 hover:text-blue-600"
                >
                  Configuración
                </Link>
              </div>
            </div>
          </nav>

          {/* Rutas */}
          <Routes>
            <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

// ============================================
// EJEMPLO 3: Con Layout Administrativo
// ============================================

function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Panel Admin</h2>
          <nav className="space-y-2">
            <Link 
              to="/admin/dashboard" 
              className="block px-4 py-2 rounded hover:bg-gray-100"
            >
              �Y"S Dashboard
            </Link>
            <Link 
              to="/admin/productos" 
              className="block px-4 py-2 rounded hover:bg-gray-100"
            >
              �Y"� Productos
            </Link>
            <Link 
              to="/admin/configuracion" 
              className="block px-4 py-2 rounded bg-blue-50 text-blue-600"
            >
              �sT️ Configuración
            </Link>
          </nav>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

function EjemploConLayout() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AdminLayout>
          <Routes>
            <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
          </Routes>
        </AdminLayout>
      </BrowserRouter>
    </AppProvider>
  );
}

// ============================================
// EJEMPLO 4: Uso Programático del Contexto
// ============================================

import { useAppContext } from '../contexto/AppContext';

function ComponenteQueUsaMargen() {
  const { margenGanancia, actualizarMargen } = useAppContext();

  const calcularPrecioFinal = (precioBase) => {
    return precioBase * (1 + margenGanancia / 100);
  };

  const ajustarMargenRapido = (porcentaje) => {
    actualizarMargen(porcentaje);
    console.log(`Margen actualizado a ${porcentaje}%`);
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Margen Actual: {margenGanancia}%
      </h3>

      {/* Ejemplo de cálculo */}
      <div className="mb-4">
        <p>Precio Base: S/ 1000</p>
        <p className="font-bold text-green-600">
          Precio Final: S/ {calcularPrecioFinal(1000).toFixed(2)}
        </p>
      </div>

      {/* Botones de ajuste rápido */}
      <div className="flex gap-2">
        <button 
          onClick={() => ajustarMargenRapido(15)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          15%
        </button>
        <button 
          onClick={() => ajustarMargenRapido(20)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          20%
        </button>
        <button 
          onClick={() => ajustarMargenRapido(25)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          25%
        </button>
      </div>
    </div>
  );
}

// ============================================
// EJEMPLO 5: Monitoreo de Estadísticas
// ============================================

import { useState, useEffect } from 'react';
import * as api from '../servicios/api';

function MonitorEstadisticasIA() {
  const [stats, setStats] = useState(null);
  const [actualizando, setActualizando] = useState(false);

  const cargarEstadisticas = async () => {
    setActualizando(true);
    try {
      const data = await api.obtenerEstadisticasIA();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActualizando(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarEstadisticas, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div>Cargando...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Monitor de IA</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600">Llamadas</p>
          <p className="text-2xl font-bold">{stats.llamadas}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Costo</p>
          <p className="text-2xl font-bold">${stats.costoEstimado}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Tokens</p>
          <p className="text-2xl font-bold">{stats.promedioTokens}</p>
        </div>
      </div>

      <button
        onClick={cargarEstadisticas}
        disabled={actualizando}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {actualizando ? 'Actualizando...' : 'Actualizar'}
      </button>
    </div>
  );
}

// ============================================
// EJEMPLO 6: Validación de Margen
// ============================================

function FormularioMargenPersonalizado() {
  const { margenGanancia, actualizarMargen } = useAppContext();
  const [valor, setValor] = useState(margenGanancia);
  const [error, setError] = useState('');

  const validarYGuardar = () => {
    setError('');

    // Validaciones
    if (valor < 0) {
      setError('El margen no puede ser negativo');
      return;
    }
    if (valor > 100) {
      setError('El margen no puede ser mayor a 100%');
      return;
    }
    if (isNaN(valor)) {
      setError('Ingresa un número válido');
      return;
    }

    // Guardar
    actualizarMargen(valor);
    alert(`Margen actualizado a ${valor}%`);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Configurar Margen</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Porcentaje de Margen
        </label>
        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(parseFloat(e.target.value))}
          className="w-full px-3 py-2 border rounded"
          min="0"
          max="100"
          step="0.1"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}

      <button
        onClick={validarYGuardar}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Guardar
      </button>
    </div>
  );
}

// ============================================
// EJEMPLO 7: Dashboard con Configuración
// ============================================

function DashboardAdmin() {
  const { margenGanancia } = useAppContext();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.obtenerEstadisticasIA().then(setStats);
  }, []);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Dashboard Administrativo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Tarjeta: Margen */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">Margen Actual</h3>
          <p className="text-3xl font-bold text-blue-600">{margenGanancia}%</p>
          <Link 
            to="/admin/configuracion" 
            className="text-sm text-blue-500 hover:underline mt-2 inline-block"
          >
            Modificar �?'
          </Link>
        </div>

        {/* Tarjeta: Llamadas IA */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">Llamadas IA</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats?.llamadas || 0}
          </p>
        </div>

        {/* Tarjeta: Costo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">Costo IA</h3>
          <p className="text-3xl font-bold text-purple-600">
            ${stats?.costoEstimado || '0.00'}
          </p>
        </div>

        {/* Tarjeta: Tokens */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-2">Tokens Promedio</h3>
          <p className="text-3xl font-bold text-orange-600">
            {stats?.promedioTokens || 0}
          </p>
        </div>
      </div>

      {/* Acceso rápido a configuración */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="flex gap-4">
          <Link
            to="/admin/configuracion"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            �sT️ Configuración
          </Link>
          <Link
            to="/admin/productos"
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            �Y"� Productos
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPORTAR EJEMPLOS
// ============================================

export {
  EjemploBasico,
  EjemploConNavegacion,
  EjemploConLayout,
  ComponenteQueUsaMargen,
  MonitorEstadisticasIA,
  FormularioMargenPersonalizado,
  DashboardAdmin
};

// Ejemplo por defecto
export default EjemploBasico;

