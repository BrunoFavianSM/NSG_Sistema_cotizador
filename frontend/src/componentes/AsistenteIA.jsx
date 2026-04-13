import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { iniciarConversacionIA, continuarConversacionIA } from '../servicios/api';
import { useToast } from './feedback/ToastProvider';

const MENSAJE_BIENVENIDA = 'Hola. Soy tu asistente IA. Cuentame que tipo de PC necesitas y te recomendare una configuracion.';

function crearMensaje(rol, mensaje, extra = {}) {
  return {
    rol,
    mensaje,
    timestamp: new Date(),
    ...extra
  };
}

const AsistenteIA = ({ onAplicarRecomendacion, className = '' }) => {
  const toast = useToast();
  const reducedMotion = useReducedMotion();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [sesionId, setSesionId] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [mensajeActual, setMensajeActual] = useState('');
  const [cargando, setCargando] = useState(false);
  const [recomendacionFinal, setRecomendacionFinal] = useState(null);
  const [error, setError] = useState('');

  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!modalAbierto) return;

    if (historial.length === 0) {
      setHistorial([crearMensaje('asistente', MENSAJE_BIENVENIDA)]);
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 20);

    return () => clearTimeout(timer);
  }, [modalAbierto]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [historial, recomendacionFinal]);

  const abrirModal = () => setModalAbierto(true);

  const cerrarModal = () => {
    setModalAbierto(false);
    setError('');
  };

  const reiniciarConversacion = () => {
    setSesionId(null);
    setHistorial([crearMensaje('asistente', MENSAJE_BIENVENIDA)]);
    setMensajeActual('');
    setRecomendacionFinal(null);
    setError('');
  };

  const enviarMensaje = async () => {
    const texto = mensajeActual.trim();
    if (!texto || cargando) return;

    setMensajeActual('');
    setError('');
    setHistorial((prev) => [...prev, crearMensaje('usuario', texto)]);
    setCargando(true);

    try {
      let respuesta;

      if (!sesionId) {
        respuesta = await iniciarConversacionIA(texto);
        if (respuesta?.sesionId) {
          setSesionId(respuesta.sesionId);
        }
      } else {
        respuesta = await continuarConversacionIA(sesionId, texto);
      }

      if (respuesta?.completado && respuesta?.recomendacion) {
        setRecomendacionFinal(respuesta.recomendacion);
        setHistorial((prev) => [
          ...prev,
          crearMensaje(
            'asistente',
            respuesta.recomendacion.explicacion || 'He completado una recomendacion para ti.',
            { esRecomendacion: true }
          )
        ]);
        toast.success('Recomendacion lista', 'Revisa la sugerencia y aplicala al cotizador.');
      } else if (respuesta?.pregunta) {
        setHistorial((prev) => [...prev, crearMensaje('asistente', respuesta.pregunta)]);
      }
    } catch (err) {
      const mensaje = err?.mensaje || 'No se pudo conectar con el asistente en este momento.';
      setError(mensaje);
      setHistorial((prev) => [...prev, crearMensaje('sistema', 'Ocurrio un error al procesar tu mensaje. Intenta nuevamente.')]);
      toast.error('Asistente no disponible', mensaje);
    } finally {
      setCargando(false);
    }
  };

  const manejarKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const aplicarRecomendacion = () => {
    if (!recomendacionFinal?.componentes) return;

    try {
      onAplicarRecomendacion(recomendacionFinal.componentes);
      toast.success('Recomendacion aplicada', 'Se aplico la sugerencia en tu configuracion actual.');
      cerrarModal();
    } catch (err) {
      setError('No se pudo aplicar la recomendacion. Intenta nuevamente.');
      toast.error('Error al aplicar', 'No fue posible aplicar la recomendacion.');
    }
  };

  const formatearHora = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  const animacionMensaje = reducedMotion
    ? { initial: false, animate: false, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.18 } };

  return (
    <>
      <button
        type="button"
        onClick={abrirModal}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-accent-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] ${className}`}
        aria-haspopup="dialog"
        aria-expanded={modalAbierto}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-[var(--color-accent-text)]"
          aria-hidden="true"
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          <path d="M5 3v4" />
          <path d="M19 17v4" />
          <path d="M3 5h4" />
          <path d="M17 19h4" />
        </svg>
        <span>Asistente de Configuración</span>
      </button>

      <AnimatePresence>
        {modalAbierto && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar asistente"
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
              onClick={cerrarModal}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={reducedMotion ? undefined : { opacity: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
            />

            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label="Asistente IA"
              className="fixed inset-3 z-50 flex max-h-[calc(100vh-1.5rem)] flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-hig2 md:inset-auto md:bottom-6 md:right-6 md:h-[42rem] md:w-[28rem]"
              initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text)]">Asistente IA</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{sesionId ? 'Conversacion activa' : 'Listo para ayudarte'}</p>
                </div>

                <div className="flex items-center gap-1">
                  {sesionId ? (
                    <button
                      type="button"
                      onClick={reiniciarConversacion}
                      className="min-h-11 rounded-[var(--radius-sm)] px-3 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)]"
                    >
                      Reiniciar
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)]"
                    aria-label="Cerrar asistente"
                  >
                    ×
                  </button>
                </div>
              </header>

              <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-[var(--color-surface-soft)] p-3">
                {historial.map((mensaje, index) => {
                  const esUsuario = mensaje.rol === 'usuario';
                  const esSistema = mensaje.rol === 'sistema';

                  return (
                    <motion.div
                      key={`${mensaje.rol}-${index}`}
                      {...animacionMensaje}
                      className={`mb-3 flex ${esUsuario ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[85%]">
                        <div
                          className={`rounded-[var(--radius-md)] px-3 py-2 text-sm ${esUsuario
                            ? 'bg-[var(--color-accent)] text-white'
                            : esSistema
                              ? 'border border-[color:rgba(255,69,58,0.35)] bg-[color:rgba(255,69,58,0.10)] text-[var(--color-danger)]'
                              : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                            }`}
                        >
                          <p className="whitespace-pre-wrap">{mensaje.mensaje}</p>
                        </div>
                        <p className={`mt-1 text-[11px] text-[var(--color-text-muted)] ${esUsuario ? 'text-right' : 'text-left'}`}>
                          {formatearHora(mensaje.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                {recomendacionFinal ? (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
                    animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                  >
                    <h4 className="text-sm font-semibold text-[var(--color-text)]">Configuracion recomendada</h4>
                    <div className="mt-2 space-y-1">
                      {Object.entries(recomendacionFinal.componentes || {}).map(([categoria, producto]) => {
                        if (Array.isArray(producto)) {
                          return producto.map((item, idx) => (
                            <p key={`${categoria}-${idx}`} className="text-xs text-[var(--color-text-muted)]">
                              <strong className="text-[var(--color-text)]">{categoria.toUpperCase()} #{idx + 1}:</strong> {item.nombre}
                            </p>
                          ));
                        }

                        return (
                          <p key={categoria} className="text-xs text-[var(--color-text-muted)]">
                            <strong className="text-[var(--color-text)]">{categoria.toUpperCase()}:</strong> {producto?.nombre}
                          </p>
                        );
                      })}
                    </div>

                    {Array.isArray(recomendacionFinal.advertencias) && recomendacionFinal.advertencias.length > 0 ? (
                      <div className="mt-3 rounded-[var(--radius-sm)] border border-[color:rgba(255,214,10,0.45)] bg-[color:rgba(255,214,10,0.10)] px-2 py-2 text-xs text-[var(--color-warning)]">
                        {recomendacionFinal.advertencias[0]}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={aplicarRecomendacion}
                      className="mt-3 min-h-11 w-full rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 text-sm font-semibold text-white"
                    >
                      Aplicar configuracion
                    </button>
                  </motion.div>
                ) : null}

                {cargando ? (
                  <p className="text-xs text-[var(--color-text-muted)]" role="status" aria-live="polite">
                    Procesando respuesta...
                  </p>
                ) : null}
              </div>

              {error ? (
                <div className="border-t border-[color:rgba(255,69,58,0.3)] bg-[color:rgba(255,69,58,0.10)] px-4 py-2 text-sm text-[var(--color-danger)]">
                  {error}
                </div>
              ) : null}

              <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={mensajeActual}
                    onChange={(e) => setMensajeActual(e.target.value)}
                    onKeyDown={manejarKeyDown}
                    placeholder="Escribe tu mensaje..."
                    disabled={cargando || Boolean(recomendacionFinal)}
                    className="min-h-11 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={enviarMensaje}
                    disabled={!mensajeActual.trim() || cargando || Boolean(recomendacionFinal)}
                    className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white disabled:opacity-45"
                  >
                    Enviar
                  </button>
                </div>

                {recomendacionFinal ? (
                  <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">
                    Conversacion completada. Aplica la recomendacion o reinicia.
                  </p>
                ) : null}
              </footer>
            </motion.section>
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

