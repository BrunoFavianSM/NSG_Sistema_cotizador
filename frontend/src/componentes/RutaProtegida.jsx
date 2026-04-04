/**
 * Componente de Protección de Rutas
 * 
 * Wrapper que protege rutas administrativas verificando autenticación.
 * - Verifica si el usuario está autenticado usando AppContext
 * - Verifica si existe un token JWT válido
 * - Redirige a /login si no está autenticado
 * - Renderiza el componente hijo si está autenticado
 * 
 * Valida Requisitos: 10.1, 10.2
 */

import { Navigate } from 'react-router-dom';
import { useAppContext } from '../contexto/AppContext';

const RutaProtegida = ({ children }) => {
  const { autenticado, cargandoAuth } = useAppContext();

  // Mostrar loading mientras se verifica la autenticación
  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizar el componente hijo
  return children;
};

export default RutaProtegida;

