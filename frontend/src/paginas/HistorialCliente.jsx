/**
 * Página de Historial de Cliente
 * 
 * Permite a los clientes consultar sus cotizaciones previas usando su email.
 * - Formulario para ingresar email del cliente
 * - Validación de formato de email
 * - Lista de cotizaciones previas con detalles
 * - Botón para descargar PDFs de cada cotización
 * - Manejo de estados: loading, error, sin resultados
 * 
 * Valida Requisitos: 15.1, 15.2, 15.3
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { consultarHistorialCliente } from '../servicios/api';

/**
 * Obtiene la URL base de la API
 * Compatible con Vite (import.meta.env) y Jest (process.env)
 */
const getApiUrl = () => {
  // En tests (Jest), usar process.env
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  // En producción/desarrollo (Vite), usar import.meta.env
  // Usar Function constructor para evitar que Jest parsee import.meta
  try {
    const getViteEnv = new Function('return import.meta.env.VITE_API_URL');
    return getViteEnv() || 'http://localhost:3000/api';
  } catch {
    return 'http://localhost:3000/api';
  }
};

const HistorialCliente = () => {
  // Estado del formulario
  const [email, setEmail] = useState('');
  const [emailValido, setEmailValido] = useState(true);
  
  // Estado de la búsqueda
  const [buscando, setBuscando] = useState(false);
  const [historialCargado, setHistorialCargado] = useState(false);
  const [error, setError] = useState('');
  
  // Estado del historial
  const [cliente, setCliente] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);

  /**
   * Valida el formato del email
   */
  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  /**
   * Maneja el cambio en el input de email
   */
  const manejarCambioEmail = (e) => {
    const nuevoEmail = e.target.value;
    setEmail(nuevoEmail);
    setEmailValido(true);
    setError('');
  };

  /**
   * Maneja el envío del formulario
   */
  const manejarBusqueda = async (e) => {
    e.preventDefault();
    setError('');

    // Validar email
    if (!email.trim()) {
      setEmailValido(false);
      setError('Por favor ingresa tu email');
      return;
    }

    if (!validarEmail(email)) {
      setEmailValido(false);
      setError('Por favor ingresa un email válido');
      return;
    }

    setBuscando(true);
    setHistorialCargado(false);

    try {
      const resultado = await consultarHistorialCliente(email.trim().toLowerCase());

      if (resultado.exito) {
        setBuscando(false);
        setCliente(resultado.cliente);
        setCotizaciones(resultado.cotizaciones || []);
        setHistorialCargado(true);
      } else {
        setError(resultado.mensaje || 'No se pudo cargar el historial');
      }
    } catch (err) {
      console.error('Error al buscar historial:', err);
      setError(err.mensaje || 'Error al buscar historial. Por favor, intenta nuevamente.');
    } finally {
      setBuscando(false);
    }
  };

  /**
   * Descarga el PDF de una cotización
   */
  const descargarPDF = (codigoTicket) => {
    // Construir URL del PDF
    const apiUrl = getApiUrl();
    const pdfUrl = `${apiUrl}/cotizaciones/${codigoTicket}/pdf`;
    
    // Abrir en nueva pestaña para descargar
    window.open(pdfUrl, '_blank');
  };

  /**
   * Formatea la fecha para mostrar
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
        return 'bg-yellow-100 text-yellow-800';
      case 'Reclamada':
        return 'bg-green-100 text-green-800';
      case 'Caducada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Reinicia la búsqueda
   */
  const nuevaBusqueda = () => {
    setEmail('');
    setHistorialCargado(false);
    setCotizaciones([]);
    setCliente(null);
    setError('');
    setEmailValido(true);
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

  const variantesTarjeta = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <motion.div
          variants={variantesContenedor}
          initial="hidden"
          animate="visible"
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4"
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </motion.div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Historial de Cotizaciones
          </h1>
          <p className="text-gray-600">
            Consulta tus cotizaciones previas ingresando tu email
          </p>
        </motion.div>

        {/* Formulario de búsqueda */}
        {!historialCargado && (
          <motion.div
            variants={variantesContenedor}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl shadow-lg p-8 mb-6"
          >
            <form onSubmit={manejarBusqueda} className="space-y-6">
              {/* Error general */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
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

              {/* Campo de email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email del Cliente
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={manejarCambioEmail}
                  disabled={buscando}
                  className={`
                    appearance-none relative block w-full px-4 py-3
                    border rounded-lg placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                    ${!emailValido
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                    }
                    ${buscando ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                  `}
                  placeholder="ejemplo@correo.com"
                />
                {!emailValido && (
                  <p className="mt-2 text-sm text-red-600">
                    Por favor ingresa un email válido
                  </p>
                )}
              </div>

              {/* Botón de búsqueda */}
              <motion.button
                type="submit"
                disabled={buscando}
                whileHover={{ scale: buscando ? 1 : 1.02 }}
                whileTap={{ scale: buscando ? 1 : 0.98 }}
                className={`
                  w-full flex justify-center items-center py-3 px-4
                  border border-transparent text-sm font-medium rounded-lg
                  text-white transition-all duration-200
                  ${buscando
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }
                `}
              >
                {buscando ? (
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
                    Buscando...
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Buscar Historial
                  </span>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Resultados del historial */}
          {historialCargado && cliente && (
            <div className="space-y-6">
              {/* Información del cliente */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {cliente?.nombre || 'Cliente'}
                    </h2>
                    <p className="text-gray-600">{cliente?.email}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {cotizaciones.length} {cotizaciones.length === 1 ? 'cotización encontrada' : 'cotizaciones encontradas'}
                    </p>
                  </div>
                  <button
                    onClick={nuevaBusqueda}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Nueva Búsqueda
                  </button>
                </div>
              </div>

              {/* Lista de cotizaciones */}
              {cotizaciones.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl shadow-lg p-12 text-center"
                >
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No hay cotizaciones
                  </h3>
                  <p className="text-gray-600">
                    No se encontraron cotizaciones para este email
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {cotizaciones.map((cotizacion, index) => (
                    <motion.div
                      key={cotizacion.id}
                      custom={index}
                      variants={variantesTarjeta}
                      initial="hidden"
                      animate="visible"
                      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Información de la cotización */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {cotizacion.codigo_ticket}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${obtenerColorEstado(cotizacion.estado)}`}>
                              {cotizacion.estado}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Emitida: {formatearFecha(cotizacion.fecha_emision)}</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Válida hasta: {formatearFecha(cotizacion.fecha_validez)}</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              <span>{cotizacion.cantidad_componentes} componentes</span>
                            </div>
                            {cotizacion.fecha_reclamacion && (
                              <div className="flex items-center">
                                <svg className="h-4 w-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Reclamada: {formatearFecha(cotizacion.fecha_reclamacion)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Precio y acciones */}
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Precio Total</p>
                            <p className="text-2xl font-bold text-green-600">
                              S/ {cotizacion.precio_total.toFixed(2)}
                            </p>
                          </div>
                          
                          <motion.button
                            onClick={() => descargarPDF(cotizacion.codigo_ticket)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Descargar PDF
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default HistorialCliente;
