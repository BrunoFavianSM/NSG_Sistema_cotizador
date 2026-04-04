/**
 * Ejemplo de Uso: HistorialCliente
 * 
 * Este archivo demuestra cómo integrar el componente HistorialCliente
 * en diferentes contextos de la aplicación.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HistorialCliente from './HistorialCliente';
import { AppProvider } from '../contexto/AppContext';

// ============================================
// EJEMPLO 1: Uso básico en una ruta
// ============================================
function EjemploBasico() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/historial" element={<HistorialCliente />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

// ============================================
// EJEMPLO 2: Con navegación desde otra página
// ============================================
function EjemploConNavegacion() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div>
          {/* Menú de navegación */}
          <nav className="bg-blue-600 text-white p-4">
            <div className="max-w-7xl mx-auto flex gap-4">
              <Link to="/" className="hover:underline">Inicio</Link>
              <Link to="/cotizador" className="hover:underline">Cotizador</Link>
              <Link to="/historial" className="hover:underline">Mi Historial</Link>
            </div>
          </nav>

          {/* Rutas */}
          <Routes>
            <Route path="/" element={<PaginaInicio />} />
            <Route path="/cotizador" element={<div>Cotizador</div>} />
            <Route path="/historial" element={<HistorialCliente />} />
          </Routes>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}

function PaginaInicio() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Bienvenido</h1>
      <p className="mb-4">Sistema de Cotización Automatizada</p>
      <Link 
        to="/historial" 
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Ver Mi Historial
      </Link>
    </div>
  );
}

// ============================================
// EJEMPLO 3: Integración con página de confirmación
// ============================================
function EjemploConConfirmacion() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/confirmacion" element={<PaginaConfirmacion />} />
          <Route path="/historial" element={<HistorialCliente />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

function PaginaConfirmacion() {
  const emailCliente = 'cliente@example.com'; // Email de la cotización recién creada

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Cotización Creada!
          </h1>
          <p className="text-gray-600">
            Tu cotización ha sido generada exitosamente
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Código de ticket: <span className="font-bold">NSG-2024-0001</span>
          </p>
          <p className="text-sm text-blue-800 mt-1">
            Email: <span className="font-bold">{emailCliente}</span>
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/historial"
            className="block w-full px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Todas Mis Cotizaciones
          </Link>
          <button
            onClick={() => window.print()}
            className="block w-full px-6 py-3 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors"
          >
            Imprimir Cotización
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EJEMPLO 4: Con modal de acceso rápido
// ============================================
function EjemploConModal() {
  const [mostrarModal, setMostrarModal] = React.useState(false);

  return (
    <BrowserRouter>
      <AppProvider>
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">Mi Dashboard</h1>
          
          <button
            onClick={() => setMostrarModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Consultar Historial
          </button>

          {/* Modal */}
          {mostrarModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto m-4">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Historial de Cotizaciones</h2>
                  <button
                    onClick={() => setMostrarModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-0">
                  <HistorialCliente />
                </div>
              </div>
            </div>
          )}
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}

// ============================================
// EJEMPLO 5: Con pre-llenado de email desde props
// ============================================
function HistorialClienteConEmail({ emailInicial }) {
  // Wrapper que podría pre-llenar el email si se pasa como prop
  // Nota: Requeriría modificar HistorialCliente para aceptar props
  return <HistorialCliente />;
}

function EjemploConEmailPrellenado() {
  const emailUsuario = 'usuario@example.com';

  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route 
            path="/mi-historial" 
            element={<HistorialClienteConEmail emailInicial={emailUsuario} />} 
          />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

// ============================================
// EJEMPLO 6: Integración en App.jsx completa
// ============================================
function EjemploAppCompleto() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <span className="text-xl font-bold text-blue-600">NSG</span>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link
                      to="/"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Inicio
                    </Link>
                    <Link
                      to="/cotizador"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Cotizador
                    </Link>
                    <Link
                      to="/historial"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Mi Historial
                    </Link>
                    <Link
                      to="/validador"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Validar Cotización
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
          </header>

          {/* Main Content */}
          <main>
            <Routes>
              <Route path="/" element={<PaginaInicio />} />
              <Route path="/cotizador" element={<div>Cotizador</div>} />
              <Route path="/historial" element={<HistorialCliente />} />
              <Route path="/validador" element={<div>Validador</div>} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t mt-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-gray-500 text-sm">
                © 2024 NSG Latinoamerica E.I.R.L. - Sistema de Cotización Automatizada
              </p>
            </div>
          </footer>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}

// ============================================
// NOTAS DE IMPLEMENTACI�"N
// ============================================

/*
INTEGRACI�"N EN App.jsx:

import HistorialCliente from './paginas/HistorialCliente';

<Routes>
  <Route path="/historial" element={<HistorialCliente />} />
</Routes>

REQUISITOS:
- React Router DOM instalado
- AppProvider envolviendo la aplicación
- Servicios API configurados correctamente
- Framer Motion instalado para animaciones
- Tailwind CSS configurado

FUNCIONALIDADES:
1. Búsqueda de historial por email
2. Validación de formato de email
3. Visualización de lista de cotizaciones
4. Descarga de PDFs
5. Estados de carga y error
6. Animaciones suaves
7. Diseño responsive

FLUJO DE USO:
1. Usuario ingresa su email
2. Sistema valida el formato
3. Se busca el historial en el backend
4. Se muestran las cotizaciones encontradas
5. Usuario puede descargar PDFs de cada cotización
6. Usuario puede hacer una nueva búsqueda

PERSONALIZACI�"N:
- Colores: Modificar clases de Tailwind
- Animaciones: Ajustar variantes de Framer Motion
- Formato de fecha: Cambiar opciones en formatearFecha()
- URL de API: Configurar en .env (VITE_API_URL)
*/

export {
  EjemploBasico,
  EjemploConNavegacion,
  EjemploConConfirmacion,
  EjemploConModal,
  EjemploConEmailPrellenado,
  EjemploAppCompleto
};

