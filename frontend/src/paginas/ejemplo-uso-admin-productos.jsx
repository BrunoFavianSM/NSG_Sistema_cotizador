/**
 * Ejemplo de Uso: AdminProductos
 * 
 * Demuestra cómo integrar la página de administración de productos
 * en una aplicación React con rutas protegidas.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from '../contexto/AppContext';
import AdminProductos from './AdminProductos';
import Login from './Login';

// Componente de ruta protegida
const RutaProtegida = ({ children }) => {
  const { autenticado, cargandoAuth } = useAppContext();

  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return autenticado ? children : <Navigate to="/login" replace />;
};

// Layout de administración con navegación
const LayoutAdmin = ({ children }) => {
  const { usuario, logout } = useAppContext();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Panel Administrativo</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Hola, {usuario?.nombre_completo}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Navegación */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <a
              href="/admin/productos"
              className="py-4 px-2 border-b-2 border-blue-600 text-blue-600 font-medium"
            >
              Productos
            </a>
            <a
              href="/admin/cotizaciones"
              className="py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700"
            >
              Cotizaciones
            </a>
            <a
              href="/admin/configuracion"
              className="py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700"
            >
              Configuración
            </a>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main>{children}</main>
    </div>
  );
};

// Aplicación completa
function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route
            path="/admin/productos"
            element={
              <RutaProtegida>
                <LayoutAdmin>
                  <AdminProductos />
                </LayoutAdmin>
              </RutaProtegida>
            }
          />

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/admin/productos" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;

// ============================================
// EJEMPLO 2: Uso directo sin layout
// ============================================

function AppSimple() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/productos"
            element={
              <RutaProtegida>
                <AdminProductos />
              </RutaProtegida>
            }
          />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

// ============================================
// EJEMPLO 3: Integración con otras páginas admin
// ============================================

import AdminCotizaciones from './AdminCotizaciones';
import AdminConfiguracion from './AdminConfiguracion';

function AppCompleto() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={<RutaProtegida><LayoutAdmin /></RutaProtegida>}>
            <Route path="productos" element={<AdminProductos />} />
            <Route path="cotizaciones" element={<AdminCotizaciones />} />
            <Route path="configuracion" element={<AdminConfiguracion />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

// ============================================
// EJEMPLO 4: Uso con notificaciones
// ============================================

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AppConNotificaciones() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/productos"
            element={
              <RutaProtegida>
                <AdminProductos />
              </RutaProtegida>
            }
          />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

// ============================================
// NOTAS DE IMPLEMENTACI�"N
// ============================================

/*
1. AUTENTICACI�"N:
   - AdminProductos verifica autenticación automáticamente
   - Usa RutaProtegida para proteger la ruta
   - Redirige a /login si no autenticado

2. CONTEXTO:
   - Debe estar envuelto en AppProvider
   - Proporciona estado de autenticación y productos
   - Maneja token JWT automáticamente

3. RUTAS:
   - Usar React Router v6+
   - Rutas protegidas con componente RutaProtegida
   - Navigate para redirecciones

4. LAYOUT:
   - Opcional: crear layout con navegación
   - Header con info de usuario y logout
   - Navegación entre secciones admin

5. NOTIFICACIONES:
   - Opcional: integrar react-toastify o similar
   - Mostrar feedback de operaciones CRUD
   - Mejorar UX con mensajes claros

6. PERMISOS:
   - Backend valida permisos en cada endpoint
   - Frontend solo oculta UI
   - Nunca confiar solo en validación frontend

7. ACTUALIZACI�"N EN TIEMPO REAL:
   - Productos se recargan después de cada operación
   - Stock se actualiza automáticamente
   - Tabla se refresca tras crear/editar/eliminar

8. MANEJO DE ERRORES:
   - Errores de API se muestran en UI
   - Validación de formulario antes de enviar
   - Feedback visual de estados de carga
*/

