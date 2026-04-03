/**
 * Página de Configuración del Sistema
 * Valida Requisitos: 6.3
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';

const AdminConfiguracion = () => {
  const { autenticado, margenGanancia, actualizarMargen } = useAppContext();
  const [nuevoMargen, setNuevoMargen] = useState(margenGanancia);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [estadisticasIA, setEstadisticasIA] = useState(null);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);

  useEffect(() => {
    if (autenticado) {
      cargarEstadisticasIA();
    }
  }, [autenticado]);

  useEffect(() => {
    setNuevoMargen(margenGanancia);
  }, [margenGanancia]);

  const cargarEstadisticasIA = async () => {
    setCargandoEstadisticas(true);
    try {
      const stats = await api.obtenerEstadisticasIA();
      setEstadisticasIA(stats);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setEstadisticasIA({
        llamadas: 0,
        costoEstimado: '0.00',
        promedioTokens: 0
      });
    } finally {
      setCargandoEstadisticas(false);
    }
  };

  const manejarCambioMargen = (e) => {
    const valor = parseFloat(e.target.value);
    if (!isNaN(valor) && valor >= 0 && valor <= 100) {
      setNuevoMargen(valor);
    }
  };

  const guardarMargen = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // Actualizar en el contexto
      actualizarMargen(nuevoMargen);
      
      setMensaje({
        tipo: 'exito',
        texto: `Margen de ganancia actualizado a ${nuevoMargen}%`
      });

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setMensaje({ tipo: '', texto: '' });
      }, 3000);
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: 'Error al actualizar el margen de ganancia'
      });
    } finally {
      setGuardando(false);
    }
  };

  const calcularPrecioEjemplo = (precioBase) => {
    return (precioBase * (1 + nuevoMargen / 100)).toFixed(2);
  };

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
          <p className="text-gray-600 mt-2">Debes iniciar sesión para acceder</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Configuración del Sistema</h1>

          {/* Sección: Margen de Ganancia */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Margen de Ganancia</h2>
            <p className="text-gray-600 mb-4">
              Configura el porcentaje de margen que se aplicará a todas las cotizaciones nuevas.
            </p>

            <form onSubmit={guardarMargen} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porcentaje de Margen
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={nuevoMargen}
                      onChange={manejarCambioMargen}
                      className="w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                    />
                    <span className="text-2xl font-bold text-gray-700">%</span>
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margen Actual
                  </label>
                  <div className="text-3xl font-bold text-blue-600">
                    {margenGanancia}%
                  </div>
                </div>
              </div>

              {/* Ejemplos de cálculo */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Ejemplos de Precios</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Precio Base: S/ 1000</p>
                    <p className="font-semibold text-green-600">
                      Precio Final: S/ {calcularPrecioEjemplo(1000)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Precio Base: S/ 2500</p>
                    <p className="font-semibold text-green-600">
                      Precio Final: S/ {calcularPrecioEjemplo(2500)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Precio Base: S/ 5000</p>
                    <p className="font-semibold text-green-600">
                      Precio Final: S/ {calcularPrecioEjemplo(5000)}
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={guardando || nuevoMargen === margenGanancia}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
              >
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </motion.button>
            </form>

            {mensaje.texto && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-lg ${
                  mensaje.tipo === 'exito'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {mensaje.texto}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Sección: Estadísticas de IA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Estadísticas de Uso de IA</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={cargarEstadisticasIA}
              disabled={cargandoEstadisticas}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400"
            >
              {cargandoEstadisticas ? 'Actualizando...' : '🔄 Actualizar'}
            </motion.button>
          </div>

          {cargandoEstadisticas ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-gray-600">Cargando estadísticas...</p>
            </div>
          ) : estadisticasIA ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Llamadas totales */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-blue-800">Llamadas Totales</h3>
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-3xl font-bold text-blue-900">
                  {estadisticasIA.llamadas || 0}
                </p>
                <p className="text-xs text-blue-600 mt-1">Consultas a la API de IA</p>
              </motion.div>

              {/* Costo estimado */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-green-800">Costo Estimado</h3>
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-3xl font-bold text-green-900">
                  ${estadisticasIA.costoEstimado || '0.00'}
                </p>
                <p className="text-xs text-green-600 mt-1">USD acumulado</p>
              </motion.div>

              {/* Promedio de tokens */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-purple-800">Promedio Tokens</h3>
                  <span className="text-2xl">⚡</span>
                </div>
                <p className="text-3xl font-bold text-purple-900">
                  {estadisticasIA.promedioTokens || 0}
                </p>
                <p className="text-xs text-purple-600 mt-1">Tokens por consulta</p>
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay estadísticas disponibles
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Información</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Las estadísticas se actualizan en tiempo real</li>
              <li>• El costo es estimado basado en el uso de Gemini 1.5 Flash</li>
              <li>• Los tokens incluyen entrada y salida de la API</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminConfiguracion;
