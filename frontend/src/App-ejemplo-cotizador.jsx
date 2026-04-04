/**
 * Ejemplo de integración del Cotizador en la aplicación principal
 * 
 * Este archivo muestra cómo integrar la página Cotizador con:
 * - React Router para navegación
 * - AppProvider para estado global
 * - Rutas protegidas (opcional)
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AppProvider } from './contexto/AppContext';
import Cotizador from './paginas/Cotizador';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100">
          {/* Navegación simple */}
          <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link to="/" className="text-xl font-bold text-gray-900">
                    NSG Latinoamerica
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <Link
                    to="/cotizador"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Cotizar PC
                  </Link>
                  <Link
                    to="/validar"
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition"
                  >
                    Validar Cotización
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Rutas */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cotizador" element={<Cotizador />} />
            <Route path="/validar" element={<ValidarCotizacion />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

// Componente Home simple
function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenido al Sistema de Cotización
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Configura tu PC ideal paso a paso
        </p>
        <Link
          to="/cotizador"
          className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
        >
          Comenzar Cotización
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-4xl mb-4">�Y-�️</div>
          <h3 className="text-xl font-semibold mb-2">Selección Guiada</h3>
          <p className="text-gray-600">
            Proceso paso a paso para elegir cada componente de tu PC
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-4xl mb-4">�o.</div>
          <h3 className="text-xl font-semibold mb-2">Validación Automática</h3>
          <p className="text-gray-600">
            Verificamos la compatibilidad de todos los componentes en tiempo real
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-4xl mb-4">�Y""</div>
          <h3 className="text-xl font-semibold mb-2">Cotización en PDF</h3>
          <p className="text-gray-600">
            Descarga tu presupuesto formal con código de validación
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente ValidarCotizacion placeholder
function ValidarCotizacion() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Validar Cotización
        </h1>
        <p className="text-gray-600 mb-6">
          Ingresa tu código de ticket para validar tu cotización
        </p>
        <input
          type="text"
          placeholder="NSG-2024-0001"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
          Validar
        </button>
      </div>
    </div>
  );
}

export default App;

