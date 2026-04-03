/**
 * EJEMPLO DE USO: Componente RutaProtegida
 * 
 * Este archivo muestra cómo usar el componente RutaProtegida
 * para proteger rutas administrativas en la aplicación.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '../contexto/AppContext';
import RutaProtegida from './RutaProtegida';
import Login from '../paginas/Login';
import AdminProductos from '../paginas/AdminProductos';
import AdminConfiguracion from '../paginas/AdminConfiguracion';
import ValidadorCotizaciones from '../paginas/ValidadorCotizaciones';

// ============================================
// EJEMPLO 1: Uso Básico
// ============================================

const EjemploBasico = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Ruta protegida */}
          <Route 
            path="/admin" 
            element={
              <RutaProtegida>
                <AdminProductos />
              </RutaProtegida>
            } 
          />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
};

// ============================================
// EJEMPLO 2: Múltiples Rutas Protegidas
// ============================================

const EjemploMultiplesRutas = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Múltiples rutas protegidas */}
          <Route 
            path="/admin/productos" 
            element={
              <RutaProtegida>
                <AdminProductos />
              </RutaProtegida>
            } 
          />
          
          <Route 
            path="/admin/configuracion" 
            element={
              <RutaProtegida>
                <AdminConfiguracion />
              </RutaProtegida>
            } 
          />
          
          <Route 
            path="/admin/validador" 
            element={
              <RutaProtegida>
                <ValidadorCotizaciones />
              </RutaProtegida>
            } 
          />

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
};

// ============================================
// EJEMPLO 3: Layout Compartido con Rutas Protegidas
// ============================================

const LayoutAdmin = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Panel Administrativo</h1>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

const EjemploConLayout = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas con layout compartido */}
          <Route 
            path="/admin/*" 
            element={
              <RutaProtegida>
                <LayoutAdmin>
                  <Routes>
                    <Route path="productos" element={<AdminProductos />} />
                    <Route path="configuracion" element={<AdminConfiguracion />} />
                    <Route path="validador" element={<ValidadorCotizaciones />} />
                    <Route path="" element={<Navigate to="productos" replace />} />
                  </Routes>
                </LayoutAdmin>
              </RutaProtegida>
            } 
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
};

// ============================================
// EJEMPLO 4: Con Componente de Navegación
// ============================================

const NavegacionAdmin = () => {
  return (
    <nav className="bg-blue-600 text-white p-4">
      <ul className="flex space-x-4">
        <li><a href="/admin/productos" className="hover:underline">Productos</a></li>
        <li><a href="/admin/configuracion" className="hover:underline">Configuración</a></li>
        <li><a href="/admin/validador" className="hover:underline">Validador</a></li>
      </ul>
    </nav>
  );
};

const EjemploConNavegacion = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route 
            path="/admin/*" 
            element={
              <RutaProtegida>
                <div>
                  <NavegacionAdmin />
                  <Routes>
                    <Route path="productos" element={<AdminProductos />} />
                    <Route path="configuracion" element={<AdminConfiguracion />} />
                    <Route path="validador" element={<ValidadorCotizaciones />} />
                  </Routes>
                </div>
              </RutaProtegida>
            } 
          />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
};

// ============================================
// EJEMPLO 5: Manejo de Redirección Después del Login
// ============================================

const EjemploConRedireccion = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route 
            path="/admin/productos" 
            element={
              <RutaProtegida>
                <AdminProductos />
              </RutaProtegida>
            } 
          />

          {/* Redirigir a productos después del login */}
          <Route 
            path="/admin" 
            element={<Navigate to="/admin/productos" replace />} 
          />

          {/* Redirigir raíz a login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
};

// ============================================
// EJEMPLO 6: Con Página 404
// ============================================

const Pagina404 = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-800">404</h1>
      <p className="text-gray-600 mt-2">Página no encontrada</p>
      <a href="/login" className="text-blue-600 hover:underline mt-4 inline-block">
        Volver al inicio
      </a>
    </div>
  </div>
);

const EjemploCon404 = () => {
  return (
    <BrowserRouter>
      <AppProvider>
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

          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Ruta 404 */}
          <Route path="*" element={<Pagina404 />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
};

// ============================================
// NOTAS DE IMPLEMENTACIÓN
// ============================================

/*
CARACTERÍSTICAS CLAVE:

1. VERIFICACIÓN AUTOMÁTICA:
   - El componente verifica automáticamente si el usuario está autenticado
   - Usa el contexto AppContext para obtener el estado de autenticación
   - Verifica la existencia de un token JWT válido

2. REDIRECCIÓN AUTOMÁTICA:
   - Si no está autenticado, redirige a /login
   - Usa replace para no agregar entrada al historial
   - Preserva la URL original para redirección post-login

3. LOADING STATE:
   - Muestra un spinner mientras verifica la autenticación
   - Evita flashes de contenido no autorizado
   - Mejora la experiencia de usuario

4. RENDERIZADO CONDICIONAL:
   - Solo renderiza children si está autenticado
   - Soporta cualquier componente como children
   - Preserva props de los componentes hijos

FLUJO DE AUTENTICACIÓN:

1. Usuario intenta acceder a /admin/productos
2. RutaProtegida verifica autenticación
3. Si cargandoAuth = true → Muestra loading
4. Si autenticado = false → Redirige a /login
5. Si autenticado = true → Renderiza AdminProductos

INTEGRACIÓN CON APPCONTEXT:

El componente depende de:
- autenticado: boolean que indica si el usuario está autenticado
- cargandoAuth: boolean que indica si está verificando autenticación
- usuario: objeto con datos del usuario (opcional)

MEJORES PRÁCTICAS:

1. Siempre envolver rutas administrativas con RutaProtegida
2. Usar replace en Navigate para evitar loops de redirección
3. Proporcionar feedback visual durante la carga
4. Mantener la lógica de autenticación en AppContext
5. Usar rutas anidadas para layouts compartidos

SEGURIDAD:

- Verifica JWT en cada renderizado
- No confía solo en localStorage
- Valida token con el backend
- Limpia estado al hacer logout
- Previene acceso no autorizado

ACCESIBILIDAD:

- Mensaje de loading descriptivo
- Navegación clara con teclado
- Redirecciones semánticas
- Estados visuales claros

TESTING:

- Probar redirección cuando no autenticado
- Probar renderizado cuando autenticado
- Probar estado de loading
- Probar integración con AppContext
- Probar casos edge (múltiples children, props, etc.)
*/

export {
  EjemploBasico,
  EjemploMultiplesRutas,
  EjemploConLayout,
  EjemploConNavegacion,
  EjemploConRedireccion,
  EjemploCon404
};
