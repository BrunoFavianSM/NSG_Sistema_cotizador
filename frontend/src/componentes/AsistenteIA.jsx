/**
 * Componente Asistente IA
 * 
 * Interfaz conversacional para interactuar con el asistente IA.
 * Características:
 * - Botón "Ayuda IA" visible y accesible
 * - Modal/panel con interfaz de chat
 * - Historial de mensajes (usuario y asistente)
 * - Input para enviar mensajes
 * - Mostrar recomendación final con opción de aplicarla
 * - Usar Sileo para notificaciones de éxito/error
 * - Diseño responsivo con Tailwind CSS
 * - Animaciones con Framer Motion
 * 
 * Valida Requisitos: 5.1, 5.2, 5.3, 5.4, 13.2, 13.3
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { iniciarConversacionIA, continuarConversacionIA } from '../servicios/api';

const AsistenteIA = ({
  onAplicarRecomendacion,
  className = ''
}) => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [sesionId, setSesionId] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [mensajeActual, setMensajeActual] = useState('');
  const [cargando, setCargando] = useState(false);
  const [recomendacionFinal, setRecomendacionFinal] = useState(null);
  const [error, setError] = useState(null);
  
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  /**
   * Scroll automático al último mensaje
   */
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [historial]);

  /**
   * Focus en input cuando se abre el modal
   */
  useEffect(() => {
    if (modalAbierto && inputRef.current) {
      inputRef.current.focus();
    }
  }, [modalAbierto]);

  /**
   * Abre el modal y muestra mensaje de bienvenida
   */
  const abrirModal = () => {
    setModalAbierto(true);
    if (historial.length === 0) {
      setHistorial([{
        rol: 'asistente',
        mensaje: '¡Hola! Soy tu asistente de IA. Cuéntame qué tipo de computadora necesitas y te ayudaré a encontrar la configuración perfecta. 😊',
        timestamp: new Date()
      }]);
    }
  };

  /**
   * Cierra el modal
   */
  const cerrarModal = () => {
    setModalAbierto(false);
    setError(null);
  };

  /**
   * Reinicia la conversación
   */
  const reiniciarConversacion = () => {
    setSesionId(null);
    setHistorial([{
      rol: 'asistente',
      mensaje: '¡Hola! Soy tu asistente de IA. Cuéntame qué tipo de computadora necesitas y te ayudaré a encontrar la configuración perfecta. 😊',
      timestamp: new Date()
    }]);
    setRecomendacionFinal(null);
    setError(null);
    setMensajeActual('');
  };

  /**
   * Envía un mensaje al asistente IA
   */
  const enviarMensaje = async () => {
    if (!mensajeActual.trim() || cargando) return;

    const mensajeUsuario = mensajeActual.trim();
    setMensajeActual('');
    setError(null);

    // Agregar mensaje del usuario al historial
    const nuevoMensajeUsuario = {
      rol: 'usuario',
      mensaje: mensajeUsuario,
      timestamp: new Date()
    };
    setHistorial(prev => [...prev, nuevoMensajeUsuario]);

    setCargando(true);

    try {
      let respuesta;

      if (!sesionId) {
        // Primera interacción: iniciar conversación
        respuesta = await iniciarConversacionIA(mensajeUsuario);
        setSesionId(respuesta.sesionId);
      } else {
        // Continuar conversación existente
        respuesta = await continuarConversacionIA(sesionId, mensajeUsuario);
      }

      // Agregar respuesta del asistente al historial
      if (respuesta.completado && respuesta.recomendacion) {
        // Conversación completada: mostrar recomendación
        setRecomendacionFinal(respuesta.recomendacion);
        
        const mensajeRecomendacion = {
          rol: 'asistente',
          mensaje: respuesta.recomendacion.explicacion || '¡He preparado una recomendación personalizada para ti!',
          timestamp: new Date(),
          esRecomendacion: true
        };
        setHistorial(prev => [...prev, mensajeRecomendacion]);
      } else if (respuesta.pregunta) {
        // Siguiente pregunta
        const mensajeAsistente = {
          rol: 'asistente',
          mensaje: respuesta.pregunta,
          timestamp: new Date()
        };
        setHistorial(prev => [...prev, mensajeAsistente]);
      }
    } catch (err) {
      console.error('Error al comunicarse con IA:', err);
      setError(err.mensaje || 'No se pudo conectar con el asistente. Por favor, intenta de nuevo.');
      
      // Agregar mensaje de error al historial
      const mensajeError = {
        rol: 'sistema',
        mensaje: 'Lo siento, hubo un problema al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      setHistorial(prev => [...prev, mensajeError]);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Maneja el evento de presionar Enter
   */
  const manejarKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  /**
   * Aplica la recomendación a la configuración actual
   */
  const aplicarRecomendacion = () => {
    if (!recomendacionFinal || !onAplicarRecomendacion) return;

    try {
      onAplicarRecomendacion(recomendacionFinal.componentes);
      
      // Mostrar notificación de éxito (Sileo)
      if (window.Sileo) {
        window.Sileo.success('¡Recomendación aplicada con éxito!');
      }
      
      cerrarModal();
    } catch (err) {
      console.error('Error al aplicar recomendación:', err);
      setError('No se pudo aplicar la recomendación. Por favor, intenta de nuevo.');
      
      // Mostrar notificación de error (Sileo)
      if (window.Sileo) {
        window.Sileo.error('Error al aplicar la recomendación');
      }
    }
  };

  /**
   * Formatea la hora del mensaje
   */
  const formatearHora = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Renderiza un mensaje del historial
   */
  const renderizarMensaje = (mensaje, index) => {
    const esUsuario = mensaje.rol === 'usuario';
    const esSistema = mensaje.rol === 'sistema';

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex ${esUsuario ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[80%] ${esUsuario ? 'order-2' : 'order-1'}`}>
          <div
            className={`
              rounded-lg px-4 py-3 shadow-sm
              ${esUsuario
                ? 'bg-blue-600 text-white'
                : esSistema
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-gray-100 text-gray-900'
              }
            `}
          >
            <p className="text-sm whitespace-pre-wrap">{mensaje.mensaje}</p>
          </div>
          <p className={`text-xs text-gray-500 mt-1 ${esUsuario ? 'text-right' : 'text-left'}`}>
            {formatearHora(mensaje.timestamp)}
          </p>
        </div>
      </motion.div>
    );
  };

  /**
   * Renderiza la tarjeta de recomendación
   */
  const renderizarRecomendacion = () => {
    if (!recomendacionFinal) return null;

    const { componentes, advertencias = [] } = recomendacionFinal;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-lg"
      >
        <h4 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
          <span>✨</span>
          <span>Configuración Recomendada</span>
        </h4>

        {/* Lista de componentes */}
        <div className="space-y-2 mb-4">
          {Object.entries(componentes).map(([categoria, producto]) => {
            // Manejar arrays (RAM)
            if (Array.isArray(producto)) {
              return producto.map((item, idx) => (
                <div key={`${categoria}-${idx}`} className="flex items-start gap-2 text-sm">
                  <span className="font-semibold text-blue-700 min-w-[120px]">
                    {categoria.toUpperCase()} #{idx + 1}:
                  </span>
                  <span className="text-gray-800">{item.nombre}</span>
                </div>
              ));
            }

            // Componentes individuales
            return (
              <div key={categoria} className="flex items-start gap-2 text-sm">
                <span className="font-semibold text-blue-700 min-w-[120px]">
                  {categoria.toUpperCase()}:
                </span>
                <span className="text-gray-800">{producto.nombre}</span>
              </div>
            );
          })}
        </div>

        {/* Advertencias */}
        {advertencias.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs font-semibold text-yellow-800 mb-1">Advertencias:</p>
            <ul className="space-y-1">
              {advertencias.map((adv, idx) => (
                <li key={idx} className="text-xs text-yellow-700">• {adv}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Botón para aplicar */}
        <button
          onClick={aplicarRecomendacion}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          Aplicar esta Configuración
        </button>
      </motion.div>
    );
  };

  // Variantes de animación para el modal
  const variantesOverlay = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const variantesModal = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      {/* Botón "Ayuda IA" - Requisito 5.1 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={abrirModal}
        className={`
          fixed bottom-6 right-6 z-40
          flex items-center gap-2 px-6 py-3
          bg-gradient-to-r from-purple-600 to-blue-600
          hover:from-purple-700 hover:to-blue-700
          text-white font-semibold rounded-full
          shadow-lg hover:shadow-xl
          transition-all duration-300
          ${className}
        `}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <span>Ayuda IA</span>
      </motion.button>

      {/* Modal de Chat - Requisito 5.2 */}
      <AnimatePresence>
        {modalAbierto && (
          <>
            {/* Overlay */}
            <motion.div
              variants={variantesOverlay}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={cerrarModal}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />

            {/* Modal */}
            <motion.div
              variants={variantesModal}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-4 md:inset-auto md:right-6 md:bottom-6 md:w-[450px] md:h-[650px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Asistente IA</h3>
                    <p className="text-xs text-white text-opacity-90">
                      {sesionId ? 'Conversación activa' : 'Listo para ayudarte'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sesionId && (
                    <button
                      onClick={reiniciarConversacion}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                      title="Reiniciar conversación"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={cerrarModal}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Historial de mensajes - Requisito 5.3 */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 bg-gray-50"
              >
                {historial.map((mensaje, index) => renderizarMensaje(mensaje, index))}

                {/* Recomendación final */}
                {recomendacionFinal && renderizarRecomendacion()}

                {/* Indicador de cargando */}
                {cargando && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start mb-4"
                  >
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-2 bg-red-50 border-t border-red-200"
                >
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Input de mensaje */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={mensajeActual}
                    onChange={(e) => setMensajeActual(e.target.value)}
                    onKeyPress={manejarKeyPress}
                    placeholder="Escribe tu mensaje..."
                    disabled={cargando || !!recomendacionFinal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={enviarMensaje}
                    disabled={!mensajeActual.trim() || cargando || !!recomendacionFinal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
                {recomendacionFinal && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Conversación completada. Puedes aplicar la recomendación o reiniciar.
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

AsistenteIA.propTypes = {
  onAplicarRecomendacion: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default AsistenteIA;
