/**
 * Página de Login de Administrador
 * 
 * Formulario de autenticación para acceso al panel administrativo.
 * - Valida credenciales contra el backend
 * - Almacena JWT en localStorage
 * - Redirige a /admin tras login exitoso
 * - Muestra errores de validación
 * 
 * Valida Requisitos: 10.1, 10.2, 10.3
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexto/AppContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAppContext();

  // Estado del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Errores de validación
  const [erroresValidacion, setErroresValidacion] = useState({
    username: '',
    password: ''
  });

  /**
   * Valida el formulario antes de enviar
   */
  const validarFormulario = () => {
    const errores = {};
    let valido = true;

    // Validar username
    if (!username.trim()) {
      errores.username = 'El nombre de usuario es requerido';
      valido = false;
    } else if (username.length < 3) {
      errores.username = 'El nombre de usuario debe tener al menos 3 caracteres';
      valido = false;
    }

    // Validar password
    if (!password) {
      errores.password = 'La contraseña es requerida';
      valido = false;
    } else if (password.length < 6) {
      errores.password = 'La contraseña debe tener al menos 6 caracteres';
      valido = false;
    }

    setErroresValidacion(errores);
    return valido;
  };

  /**
   * Maneja el envío del formulario
   */
  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar formulario
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      const resultado = await login(username, password);

      if (resultado.exito) {
        // Login exitoso - redirigir a panel admin
        navigate('/admin');
      } else {
        // Login fallido - mostrar error
        setError(resultado.error || 'Usuario o contraseña incorrectos');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  /**
   * Limpia el error cuando el usuario empieza a escribir
   */
  const manejarCambioUsername = (e) => {
    setUsername(e.target.value);
    setError('');
    setErroresValidacion(prev => ({ ...prev, username: '' }));
  };

  const manejarCambioPassword = (e) => {
    setPassword(e.target.value);
    setError('');
    setErroresValidacion(prev => ({ ...prev, password: '' }));
  };

  // Variantes de animación
  const variantesContenedor = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  const variantesError = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={variantesContenedor}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full space-y-8"
      >
        {/* Encabezado */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center"
          >
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </motion.div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Panel Administrativo
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            NSG Latinoamerica E.I.R.L.
          </p>
        </div>

        {/* Formulario */}
        <motion.form
          className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg"
          onSubmit={manejarSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Error general */}
          {error && (
            <motion.div
              variants={variantesError}
              initial="hidden"
              animate="visible"
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Campo Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={manejarCambioUsername}
                disabled={cargando}
                className={`
                  appearance-none relative block w-full px-3 py-2
                  border rounded-lg placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all duration-200
                  ${erroresValidacion.username
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                  }
                  ${cargando ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                `}
                placeholder="Ingresa tu usuario"
              />
              {erroresValidacion.username && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {erroresValidacion.username}
                </motion.p>
              )}
            </div>

            {/* Campo Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={manejarCambioPassword}
                  disabled={cargando}
                  className={`
                    appearance-none relative block w-full px-3 py-2 pr-10
                    border rounded-lg placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                    ${erroresValidacion.password
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                    }
                    ${cargando ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                  `}
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  disabled={cargando}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {mostrarPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {erroresValidacion.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {erroresValidacion.password}
                </motion.p>
              )}
            </div>
          </div>

          {/* Botón de submit */}
          <div>
            <motion.button
              type="submit"
              disabled={cargando}
              whileHover={{ scale: cargando ? 1 : 1.02 }}
              whileTap={{ scale: cargando ? 1 : 0.98 }}
              className={`
                group relative w-full flex justify-center py-3 px-4
                border border-transparent text-sm font-medium rounded-lg
                text-white transition-all duration-200
                ${cargando
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }
              `}
            >
              {cargando ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Iniciando sesión...
                </div>
              ) : (
                <span className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Iniciar Sesión
                </span>
              )}
            </motion.button>
          </div>
        </motion.form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-xs text-gray-500">
            Sistema de Cotización Automatizada v1.0
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
