/**
 * Ejemplo de Uso: Login
 * 
 * Demuestra cómo integrar la página de Login en la aplicación
 * y configurar las rutas protegidas.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from '../contexto/AppContext';
import Login from './Login';

// ============================================
// COMPONENTE DE RUTA PROTEGIDA
// ============================================

/**
 * Componente que protege rutas que requieren autenticación
 * Redirige a /login si el usuario no está autenticado
 */
const RutaProtegida = ({ children }) => {
  const { autenticado, cargandoAuth } = useAppContext();

  // Mostrar loading mientras se verifica la autenticación
  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  // Renderizar el componente protegido
  return children;
};

// ============================================
// COMPONENTE DE PANEL ADMIN (EJEMPLO)
// ============================================

const PanelAdmin = () => {
  const { usuario, logout } = useAppContext();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Panel Administrativo
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Bienvenido, {usuario?.nombre || usuario?.username}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            <p className="text-gray-600">
              Contenido del panel administrativo...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

// ============================================
// CONFIGURACIÓN DE RUTAS
// ============================================

const App = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Ruta pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Ruta protegida del panel admin */}
          <Route
            path="/admin"
            element={
              <RutaProtegida>
                <PanelAdmin />
              </RutaProtegida>
            }
          />

          {/* Ruta por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;

// ============================================
// EJEMPLO 2: REDIRECCIÓN AUTOMÁTICA SI YA ESTÁ AUTENTICADO
// ============================================

/**
 * Wrapper para Login que redirige a /admin si ya está autenticado
 */
const LoginConRedireccion = () => {
  const { autenticado, cargandoAuth } = useAppContext();

  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (autenticado) {
    return <Navigate to="/admin" replace />;
  }

  return <Login />;
};

// Uso en Routes:
// <Route path="/login" element={<LoginConRedireccion />} />

// ============================================
// EJEMPLO 3: MANEJO DE ERRORES PERSONALIZADO
// ============================================

/**
 * Login con manejo de errores personalizado
 */
const LoginConErroresPersonalizados = () => {
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const { login } = useAppContext();
  const navigate = useNavigate();

  const manejarLogin = async (username, password) => {
    const resultado = await login(username, password);

    if (resultado.exito) {
      setIntentosFallidos(0);
      navigate('/admin');
    } else {
      setIntentosFallidos(prev => prev + 1);

      if (intentosFallidos >= 3) {
        // Bloquear temporalmente después de 3 intentos fallidos
        alert('Demasiados intentos fallidos. Por favor, espera 5 minutos.');
      }
    }
  };

  return <Login onLogin={manejarLogin} />;
};

// ============================================
// EJEMPLO 4: INTEGRACIÓN CON REACT QUERY
// ============================================

import { useQuery, useMutation } from '@tanstack/react-query';
import * as api from '../servicios/api';

const LoginConReactQuery = () => {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: ({ username, password }) => api.login(username, password),
    onSuccess: (data) => {
      if (data.exito) {
        navigate('/admin');
      }
    }
  });

  const handleSubmit = (username, password) => {
    loginMutation.mutate({ username, password });
  };

  return (
    <Login
      onSubmit={handleSubmit}
      isLoading={loginMutation.isPending}
      error={loginMutation.error?.message}
    />
  );
};

// ============================================
// EJEMPLO 5: PERSISTENCIA DE RUTA ANTERIOR
// ============================================

/**
 * Redirige al usuario a la página que intentaba acceder
 * antes de ser redirigido al login
 */
const RutaProtegidaConMemoria = ({ children }) => {
  const { autenticado } = useAppContext();
  const location = useLocation();

  if (!autenticado) {
    // Guardar la ubicación actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const LoginConMemoria = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAppContext();

  const from = location.state?.from?.pathname || '/admin';

  const handleLogin = async (username, password) => {
    const resultado = await login(username, password);

    if (resultado.exito) {
      // Redirigir a la página que intentaba acceder
      navigate(from, { replace: true });
    }
  };

  return <Login onLogin={handleLogin} />;
};

// ============================================
// EJEMPLO 6: RECORDAR USUARIO
// ============================================

const LoginConRecordarUsuario = () => {
  const [recordarUsuario, setRecordarUsuario] = useState(false);
  const [usuarioGuardado, setUsuarioGuardado] = useState('');

  useEffect(() => {
    // Cargar usuario guardado al montar
    const saved = localStorage.getItem('recordar_usuario');
    if (saved) {
      setUsuarioGuardado(saved);
      setRecordarUsuario(true);
    }
  }, []);

  const handleLogin = async (username, password) => {
    const resultado = await login(username, password);

    if (resultado.exito) {
      // Guardar usuario si está marcado "recordar"
      if (recordarUsuario) {
        localStorage.setItem('recordar_usuario', username);
      } else {
        localStorage.removeItem('recordar_usuario');
      }

      navigate('/admin');
    }
  };

  return (
    <div>
      <Login
        defaultUsername={usuarioGuardado}
        onLogin={handleLogin}
      />
      <div className="mt-4 text-center">
        <label className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={recordarUsuario}
            onChange={(e) => setRecordarUsuario(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-600">Recordar usuario</span>
        </label>
      </div>
    </div>
  );
};

// ============================================
// NOTAS DE IMPLEMENTACIÓN
// ============================================

/**
 * SEGURIDAD:
 * 
 * 1. NUNCA guardar contraseñas en localStorage
 * 2. Solo guardar el token JWT en localStorage
 * 3. Implementar rate limiting en el backend
 * 4. Usar HTTPS en producción
 * 5. Implementar CSRF protection
 * 6. Validar tokens en cada request
 * 
 * MEJORES PRÁCTICAS:
 * 
 * 1. Mostrar mensajes de error genéricos (no revelar si el usuario existe)
 * 2. Implementar timeout de sesión
 * 3. Limpiar tokens al cerrar sesión
 * 4. Validar tokens al cargar la aplicación
 * 5. Manejar tokens expirados correctamente
 * 
 * ACCESIBILIDAD:
 * 
 * 1. Labels asociados a inputs
 * 2. Mensajes de error descriptivos
 * 3. Estados de carga visibles
 * 4. Navegación por teclado
 * 5. Contraste de colores adecuado
 */
