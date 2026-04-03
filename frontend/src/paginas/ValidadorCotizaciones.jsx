/**
 * Página de Validación de Cotizaciones
 * 
 * Permite a los vendedores validar cotizaciones en tienda:
 * - Búsqueda por código ticket (NSG-YYYY-NNNN)
 * - Muestra detalle completo con comparación de precios
 * - Muestra diferencia total y disponibilidad actual
 * - Permite marcar como reclamada
 * 
 * Valida Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';

const ValidadorCotizaciones = () => {
  const { autenticado } = useAppContext();
  const [codigoTicket, setCodigoTicket] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [cotizacion, setCotizacion] = useState(null);
  const [error, setError] = useState('');
  const [reclamando, setReclamando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  /**
   * Busca y valida una cotización por código ticket
   */
  const buscarCotizacion = async (e) => {
    e.preventDefault();
    setBuscando(true);
    setError('');
    setCotizacion(null);
    setMensajeExito('');

    try {
      const resultado = await api.validarCotizacion(codigoTicket.trim());
      
      if (!resultado.valida) {
        setError(resultado.mensaje || 'Cotización no válida');
        return;
      }

      setCotizacion(resultado.cotizacion);
    } catch (err) {
      setError(err.mensaje || 'Error al buscar cotización. Verifica el código.');
    } finally {
      setBuscando(false);
    }
  };

  /**
   * Marca la cotización como reclamada
   */
  const marcarReclamada = async () => {
    if (!cotizacion) return;

    setReclamando(true);
    setError('');

    try {
      await api.marcarComoReclamada(cotizacion.codigo_ticket);
      
      setMensajeExito('Cotización marcada como reclamada exitosamente');
      setCotizacion(prev => ({ ...prev, estado: 'Reclamada' }));
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setMensajeExito('');
        limpiarBusqueda();
      }, 3000);
    } catch (err) {
      setError(err.mensaje || 'Error al marcar como reclamada');
    } finally {
      setReclamando(false);
    }
  };

  /**
   * Limpia la búsqueda actual
   */
  const limpiarBusqueda = () => {
    setCodigoTicket('');
    setCotizacion(null);
    setError('');
    setMensajeExito('');
  };

  /**
   * Formatea fecha a formato legible
   */
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Obtiene el color del badge según el estado
   */
  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Reclamada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Caducada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  /**
   * Obtiene el icono de disponibilidad
   */
  const obtenerIconoDisponibilidad = (componente) => {
    if (componente.stock_actual > 0) {
      return { texto: 'En Stock', color: 'text-green-600', icono: '✓' };
    } else if (componente.disponible_a_pedido) {
      return { texto: 'A Pedido', color: 'text-orange-600', icono: '⏱' };
    } else {
      return { texto: 'No Disponible', color: 'text-red-600', icono: '✗' };
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Validador de Cotizaciones
          </h1>
          <p className="text-gray-600">
            Busca y valida cotizaciones de clientes por código ticket
          </p>
        </motion.div>

        {/* Formulario de búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <form onSubmit={buscarCotizacion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Ticket
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={codigoTicket}
                  onChange={(e) => setCodigoTicket(e.target.value.toUpperCase())}
                  placeholder="NSG-2024-0001"
                  disabled={buscando}
                  className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-mono disabled:bg-gray-100"
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={buscando || !codigoTicket.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
                >
                  {buscando ? (
                    <div className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Buscando...
                    </div>
                  ) : (
                    '🔍 Buscar'
                  )}
                </motion.button>
                {cotizacion && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={limpiarBusqueda}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Limpiar
                  </motion.button>
                )}
              </div>
            </div>
          </form>

          {/* Mensaje de error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mensaje de éxito */}
          <AnimatePresence>
            {mensajeExito && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-green-800">{mensajeExito}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Resultados de la cotización */}
        <AnimatePresence>
          {cotizacion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Información general */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {cotizacion.codigo_ticket}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Emitida: {formatearFecha(cotizacion.fecha_emision)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Válida hasta: {formatearFecha(cotizacion.fecha_validez)}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${obtenerColorEstado(cotizacion.estado)}`}>
                    {cotizacion.estado}
                  </span>
                </div>

                {/* Resumen de precios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium mb-1">Precio Original</p>
                    <p className="text-2xl font-bold text-blue-900">
                      S/ {cotizacion.precio_total_historico.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-600 font-medium mb-1">Precio Actual</p>
                    <p className="text-2xl font-bold text-green-900">
                      S/ {cotizacion.precio_total_actual.toFixed(2)}
                    </p>
                  </div>
                  <div className={`rounded-lg p-4 border ${
                    cotizacion.diferencia_total > 0 
                      ? 'bg-red-50 border-red-200' 
                      : cotizacion.diferencia_total < 0
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className={`text-sm font-medium mb-1 ${
                      cotizacion.diferencia_total > 0 
                        ? 'text-red-600' 
                        : cotizacion.diferencia_total < 0
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}>
                      Diferencia
                    </p>
                    <p className={`text-2xl font-bold ${
                      cotizacion.diferencia_total > 0 
                        ? 'text-red-900' 
                        : cotizacion.diferencia_total < 0
                        ? 'text-green-900'
                        : 'text-gray-900'
                    }`}>
                      {cotizacion.diferencia_total >= 0 ? '+' : ''}
                      S/ {cotizacion.diferencia_total.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Alerta de cambios de precio */}
                {cotizacion.hay_cambios_precio && (
                  <div className={`rounded-lg p-4 mb-6 ${
                    cotizacion.diferencia_total > 0 
                      ? 'bg-orange-50 border border-orange-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center">
                      <svg className={`h-5 w-5 mr-2 ${
                        cotizacion.diferencia_total > 0 ? 'text-orange-500' : 'text-blue-500'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className={`text-sm font-medium ${
                        cotizacion.diferencia_total > 0 ? 'text-orange-800' : 'text-blue-800'
                      }`}>
                        {cotizacion.diferencia_total > 0 
                          ? '⚠️ Los precios han aumentado desde la emisión de la cotización'
                          : '✓ Los precios han disminuido desde la emisión de la cotización'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla de componentes */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Componentes ({cotizacion.componentes.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Componente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Original</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Actual</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diferencia</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponibilidad</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cotizacion.componentes.map((comp, index) => {
                        const disponibilidad = obtenerIconoDisponibilidad(comp);
                        const tieneCambio = Math.abs(comp.diferencia_unitaria) > 0.01;
                        
                        return (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{comp.nombre}</p>
                                <p className="text-xs text-gray-500">{comp.categoria.replace('_', ' ')}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {comp.cantidad}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              S/ {comp.precio_historico.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={tieneCambio ? 'font-semibold' : ''}>
                                S/ {comp.precio_actual.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {tieneCambio ? (
                                <span className={`font-semibold ${
                                  comp.diferencia_unitaria > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {comp.diferencia_unitaria > 0 ? '+' : ''}
                                  S/ {comp.diferencia_unitaria.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400">Sin cambio</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`flex items-center ${disponibilidad.color} font-medium`}>
                                <span className="mr-1">{disponibilidad.icono}</span>
                                {disponibilidad.texto}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botón de acción */}
              {cotizacion.estado === 'Pendiente' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        ¿Confirmar reclamación?
                      </h3>
                      <p className="text-sm text-gray-600">
                        Marca esta cotización como reclamada por el cliente
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={marcarReclamada}
                      disabled={reclamando}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
                    >
                      {reclamando ? (
                        <div className="flex items-center">
                          <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Procesando...
                        </div>
                      ) : (
                        '✓ Marcar como Reclamada'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ValidadorCotizaciones;
