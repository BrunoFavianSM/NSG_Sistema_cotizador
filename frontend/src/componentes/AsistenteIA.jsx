/**
 * AsistenteIA.jsx — Componente raíz v2
 *
 * Orquesta todos los subcomponentes del Asistente IA NSG Concierge.
 * Integra useAsistenteIA para toda la lógica de estado y comunicación.
 * Consume AppContext para tipoCambioUsdPen, autenticado y usuario.
 *
 * Requisitos: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7,
 *             9.7, 9.8, 9.9, 9.10, 9.11, 14.2
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';

import { useAppContext } from '../contexto/AppContext';
import { useAsistenteIA } from '../hooks/useAsistenteIA';
import * as asistente from '../servicios/asistente';

import MensajeAsistente from './AsistenteIA/MensajeAsistente';
import MensajeUsuario from './AsistenteIA/MensajeUsuario';
import QuickReplies from './AsistenteIA/QuickReplies';
import SemaforoCapacidades from './AsistenteIA/SemaforoCapacidades';
import ConfiguracionPropuesta from './AsistenteIA/ConfiguracionPropuesta';
import TypingIndicator from './AsistenteIA/TypingIndicator';
import ValidandoIndicador from './AsistenteIA/ValidandoIndicador';
import BotonAsesorHumano from './AsistenteIA/BotonAsesorHumano';
import RutaUpgrade from './AsistenteIA/RutaUpgrade';

// Número de WhatsApp del asesor (fallback; el backend lo gestiona en WHATSAPP_NUMERO_ASESOR)
const WHATSAPP_NUMERO_ASESOR = '51999999999';

// Icono de envío — SF Symbol equivalente: paperplane.fill
const IconoEnviar = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 fill-none stroke-current stroke-[1.8]"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
    />
  </svg>
);

// Icono del asistente (sparkle) para el botón de apertura
const IconoAsistente = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
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
);

// Icono de historial — SF Symbol equivalente: clock.arrow.circlepath
const IconoHistorial = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4 fill-none stroke-current stroke-[1.5]"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// ============================================================
// Subcomponente: Banner de historial previo
// ============================================================
function BannerHistorialPrevio({ sesionPrevia, onContinuar, onNueva }) {
  return (
    <div
      role="alert"
      className={[
        'mx-3 mt-3 rounded-[12px] border border-[var(--color-border)]',
        'bg-[var(--color-surface-soft)] px-4 py-3',
        'flex flex-col gap-2',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <IconoHistorial />
        <p className="text-sm font-medium text-[var(--color-text)]">
          Tienes una conversación previa
        </p>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        ¿Deseas continuar desde donde quedaste o iniciar una nueva cotización?
      </p>
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onContinuar}
          className={[
            'flex-1 min-h-[36px] px-3 py-1.5 rounded-[10px] text-xs font-semibold',
            'bg-[var(--color-accent)] text-white',
            'hover:opacity-90 transition-opacity',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
          ].join(' ')}
        >
          Continuar
        </button>
        <button
          type="button"
          onClick={onNueva}
          className={[
            'flex-1 min-h-[36px] px-3 py-1.5 rounded-[10px] text-xs font-semibold',
            'border border-[var(--color-border)] text-[var(--color-text)]',
            'hover:bg-[var(--color-surface)] transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
          ].join(' ')}
        >
          Nueva cotización
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Subcomponente: Banner de error
// ============================================================
function BannerError({ mensaje, onReintentar }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="border-t border-[color:rgba(255,69,58,0.3)] bg-[color:rgba(255,69,58,0.08)] px-4 py-2.5 flex items-center justify-between gap-3"
    >
      <p className="text-sm text-[var(--color-danger)] leading-snug">{mensaje}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className={[
            'flex-shrink-0 text-xs font-semibold text-[var(--color-danger)]',
            'underline underline-offset-2 hover:no-underline',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
          ].join(' ')}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

// ============================================================
// Componente principal
// ============================================================

/**
 * AsistenteIA — Componente raíz v2
 *
 * Props:
 * - className: string — clases adicionales para el botón de apertura
 *
 * La prop onAplicarRecomendacion se mantiene por retrocompatibilidad con v1,
 * pero la lógica principal usa aplicarConfiguracion del hook (vía AppContext).
 */
const AsistenteIA = ({ onAplicarRecomendacion = null, className = '' }) => {
  const reducedMotion = useReducedMotion();

  // ── Estado del modal ──────────────────────────────────────
  const [modalAbierto, setModalAbierto] = useState(false);

  // ── Estado del input ──────────────────────────────────────
  const [textoInput, setTextoInput] = useState('');
  const [estaEscribiendo, setEstaEscribiendo] = useState(false);

  // ── Estado de historial previo ────────────────────────────
  const [sesionPrevia, setSesionPrevia] = useState(null);
  const [mostrarBannerHistorial, setMostrarBannerHistorial] = useState(false);
  const [historialConsultado, setHistorialConsultado] = useState(false);

  // ── Refs ──────────────────────────────────────────────────
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const timerEscribiendoRef = useRef(null);

  // ── AppContext ────────────────────────────────────────────
  const { autenticado, usuario } = useAppContext();

  // ── Hook del asistente ────────────────────────────────────
  const {
    mensajes,
    cargando,
    quickReplies,
    configuracionPropuesta,
    semaforo,
    error,
    mostrarAsesor,
    enviarMensaje,
    seleccionarQuickReply,
    ocultarQuickReplies,
    aplicarConfiguracion,
    reiniciar,
  } = useAsistenteIA({
    usuarioId: autenticado && usuario?.id ? usuario.id : null,
  });

  // ── Scroll automático al último mensaje ───────────────────
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensajes, cargando]);

  // ── Foco en input al abrir modal ──────────────────────────
  useEffect(() => {
    if (!modalAbierto) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [modalAbierto]);

  // ── Consultar historial previo al abrir (usuarios autenticados) ──
  useEffect(() => {
    if (!modalAbierto || !autenticado || !usuario?.id || historialConsultado) return;

    const consultarHistorial = async () => {
      setHistorialConsultado(true);
      try {
        const resultado = await asistente.obtenerHistorial(usuario.id);
        if (resultado?.exito && resultado?.sesiones?.length > 0) {
          // Tomar la sesión más reciente
          const masReciente = resultado.sesiones[0];
          setSesionPrevia(masReciente);
          // Solo mostrar banner si no hay mensajes en la sesión actual
          if (mensajes.length === 0) {
            setMostrarBannerHistorial(true);
          }
        }
      } catch {
        // Silencioso: no bloquear la experiencia si falla la consulta de historial
      }
    };

    consultarHistorial();
  }, [modalAbierto, autenticado, usuario, historialConsultado, mensajes.length]);

  // ── Limpiar timer al desmontar ────────────────────────────
  useEffect(() => {
    return () => {
      if (timerEscribiendoRef.current) clearTimeout(timerEscribiendoRef.current);
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────

  const abrirModal = () => setModalAbierto(true);

  const cerrarModal = () => setModalAbierto(false);

  const manejarCambioInput = (e) => {
    const valor = e.target.value;
    setTextoInput(valor);

    // Ocultar quick replies cuando el usuario empieza a escribir (Req 10.6)
    if (valor.length > 0 && !estaEscribiendo) {
      setEstaEscribiendo(true);
      ocultarQuickReplies();
    }

    // Resetear flag de "escribiendo" si borra todo el texto
    if (valor.length === 0) {
      setEstaEscribiendo(false);
    }
  };

  const manejarEnvio = useCallback(async () => {
    const texto = textoInput.trim();
    if (!texto || cargando) return;

    setTextoInput('');
    setEstaEscribiendo(false);
    setMostrarBannerHistorial(false);
    await enviarMensaje(texto);
  }, [textoInput, cargando, enviarMensaje]);

  const manejarKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      manejarEnvio();
    }
  };

  const manejarSeleccionQuickReply = (texto) => {
    setMostrarBannerHistorial(false);
    seleccionarQuickReply(texto);
  };

  const manejarAplicarConfiguracion = () => {
    aplicarConfiguracion();
    // Retrocompatibilidad con prop v1
    if (onAplicarRecomendacion && configuracionPropuesta) {
      try { onAplicarRecomendacion(configuracionPropuesta); } catch { /* silencioso */ }
    }
  };

  const manejarExplicarCapacidad = (categoria) => {
    const etiquetas = {
      gaming: 'Gaming',
      edicion_video: 'Edición de Video',
      productividad: 'Productividad',
      streaming: 'Streaming',
      renderizado_3d: 'Renderizado 3D',
    };
    enviarMensaje(`¿Por qué la configuración tiene esa puntuación en ${etiquetas[categoria] || categoria}?`);
  };

  const manejarContinuarHistorial = () => {
    setMostrarBannerHistorial(false);
    // La sesión ya está activa; solo cerramos el banner
  };

  const manejarNuevaCotizacion = () => {
    setMostrarBannerHistorial(false);
    setSesionPrevia(null);
    reiniciar();
  };

  const manejarReiniciar = () => {
    setSesionPrevia(null);
    setMostrarBannerHistorial(false);
    setHistorialConsultado(false);
    reiniciar();
  };

  // ── Datos para BotonAsesorHumano ──────────────────────────
  const nombreUsuario = autenticado && usuario?.nombre ? usuario.nombre : null;

  // Extraer presupuesto y perfil de la configuración propuesta si existe
  const presupuestoEstimado = configuracionPropuesta?.precio_total_pen ?? null;

  // ── Animaciones ───────────────────────────────────────────
  const animMensaje = reducedMotion
    ? {}
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.15 } };

  // ── Determinar si mostrar quick replies ───────────────────
  const mostrarQuickReplies = quickReplies.length > 0 && !estaEscribiendo;

  return (
    <>
      {/* ── Botón de apertura ── */}
      <button
        type="button"
        onClick={abrirModal}
        aria-haspopup="dialog"
        aria-expanded={modalAbierto}
        aria-label="Abrir asistente de configuración"
        className={[
          'inline-flex min-h-11 items-center justify-center gap-2',
          'rounded-[var(--radius-md)] border border-[var(--color-border)]',
          'bg-[var(--color-surface-soft)] px-4 py-2',
          'text-sm font-semibold text-[var(--color-text)]',
          'transition-colors duration-higNormal ease-hig',
          'hover:bg-[var(--color-accent-soft)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
          className,
        ].join(' ')}
      >
        <IconoAsistente />
        <span>Asistente de Configuración</span>
      </button>

      {/* ── Modal del asistente ── */}
      <AnimatePresence>
        {modalAbierto && (
          <>
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Cerrar asistente"
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
              onClick={cerrarModal}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={reducedMotion ? undefined : { opacity: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
            />

            {/* Panel del asistente */}
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label="Asistente IA NSG Concierge"
              className={[
                'fixed inset-3 z-50 flex max-h-[calc(100vh-1.5rem)] flex-col',
                'rounded-[var(--radius-lg)] border border-[var(--color-border)]',
                'bg-[var(--color-surface)] shadow-hig2',
                'md:inset-auto md:bottom-6 md:right-6 md:h-[46rem] md:w-[30rem]',
              ].join(' ')}
              initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
            >
              {/* ── Header ── */}
              <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <IconoAsistente />
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[var(--color-text)] leading-tight">
                      NSG Concierge
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {cargando ? 'Procesando...' : 'Hardware Concierge · NSG Latinoamérica'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Botón asesor humano compacto — siempre visible (Req 8.4) */}
                  <BotonAsesorHumano
                    numeroWhatsApp={WHATSAPP_NUMERO_ASESOR}
                    nombreUsuario={nombreUsuario}
                    presupuesto={presupuestoEstimado}
                    variante="compacto"
                  />

                  {/* Reiniciar */}
                  <button
                    type="button"
                    onClick={manejarReiniciar}
                    aria-label="Reiniciar conversación"
                    className={[
                      'min-h-11 px-3 rounded-[var(--radius-sm)]',
                      'text-xs font-medium text-[var(--color-text-muted)]',
                      'hover:bg-[var(--color-surface-soft)] transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
                    ].join(' ')}
                  >
                    Reiniciar
                  </button>

                  {/* Cerrar */}
                  <button
                    type="button"
                    onClick={cerrarModal}
                    aria-label="Cerrar asistente"
                    className={[
                      'min-h-11 min-w-11 flex items-center justify-center rounded-[var(--radius-sm)]',
                      'text-[var(--color-text-muted)] text-lg leading-none',
                      'hover:bg-[var(--color-surface-soft)] transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
                    ].join(' ')}
                  >
                    ×
                  </button>
                </div>
              </header>

              {/* ── Área de chat ── */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto bg-[var(--color-surface-soft)] p-3 flex flex-col gap-3"
                aria-live="polite"
                aria-label="Conversación con el asistente"
              >
                {/* Banner de historial previo (Req 14.2) */}
                {mostrarBannerHistorial && sesionPrevia && (
                  <BannerHistorialPrevio
                    sesionPrevia={sesionPrevia}
                    onContinuar={manejarContinuarHistorial}
                    onNueva={manejarNuevaCotizacion}
                  />
                )}

                {/* Mensajes */}
                {mensajes.map((mensaje) => {
                  const esUsuario = mensaje.rol === 'user';

                  if (esUsuario) {
                    return (
                      <motion.div
                        key={mensaje.id}
                        {...animMensaje}
                        className="flex justify-end"
                      >
                        <MensajeUsuario
                          contenido={mensaje.contenido}
                          timestamp={mensaje.timestamp}
                        />
                      </motion.div>
                    );
                  }

                  // Mensaje del asistente — puede incluir semáforo y configuración
                  const metaSemaforo = mensaje.metadata?.semaforo ?? null;
                  const metaConfig = mensaje.metadata?.configuracion_propuesta ?? null;

                  return (
                    <motion.div
                      key={mensaje.id}
                      {...animMensaje}
                      className="flex justify-start"
                    >
                      <MensajeAsistente
                        contenido={mensaje.contenido}
                        timestamp={mensaje.timestamp}
                      >
                        {/* Semáforo embebido en el mensaje si viene en metadata */}
                        {metaSemaforo && (
                          <SemaforoCapacidades
                            semaforo={metaSemaforo}
                            onExplicar={manejarExplicarCapacidad}
                          />
                        )}
                        {/* Configuración embebida en el mensaje si viene en metadata */}
                        {metaConfig && (
                          <>
                            <ConfiguracionPropuesta
                              configuracion={metaConfig}
                              advertencias={metaConfig.advertencias || []}
                              onAplicar={manejarAplicarConfiguracion}
                            />
                            {metaConfig.ruta_upgrade && (
                              <RutaUpgrade rutaUpgrade={metaConfig.ruta_upgrade} />
                            )}
                          </>
                        )}
                      </MensajeAsistente>
                    </motion.div>
                  );
                })}

                {/* Indicador de validación (Req 13.2) — visible mientras carga y hay config en curso */}
                <ValidandoIndicador visible={cargando && mensajes.length > 0} />

                {/* Typing indicator (Req 9.2, 13.1) */}
                {cargando && (
                  <motion.div
                    {...animMensaje}
                    className="flex justify-start"
                  >
                    <div
                      className="bg-[var(--color-surface-soft)] shadow-[var(--shadow-2)]"
                      style={{ borderRadius: '24px 24px 24px 4px' }}
                    >
                      <TypingIndicator />
                    </div>
                  </motion.div>
                )}

                {/* Semáforo y configuración propuesta actuales (Req 6.1, 19.4) */}
                {configuracionPropuesta && !cargando && (
                  <motion.div
                    {...animMensaje}
                    className="flex flex-col gap-3"
                  >
                    {semaforo && (
                      <SemaforoCapacidades
                        semaforo={semaforo}
                        onExplicar={manejarExplicarCapacidad}
                      />
                    )}
                    <ConfiguracionPropuesta
                      configuracion={configuracionPropuesta}
                      advertencias={configuracionPropuesta.advertencias || []}
                      onAplicar={manejarAplicarConfiguracion}
                    />
                    {/* Ruta de upgrade junto a la configuración (Req 7.1) */}
                    {configuracionPropuesta.ruta_upgrade && (
                      <RutaUpgrade rutaUpgrade={configuracionPropuesta.ruta_upgrade} />
                    )}
                  </motion.div>
                )}
              </div>

              {/* ── Quick Replies (Req 10.1–10.7) ── */}
              {mostrarQuickReplies && (
                <div className="px-3 py-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
                  <QuickReplies
                    opciones={quickReplies}
                    onSeleccionar={manejarSeleccionQuickReply}
                  />
                </div>
              )}

              {/* ── Banner de error (Req 13.3) ── */}
              {error && (
                <BannerError
                  mensaje={error}
                  onReintentar={null}
                />
              )}

              {/* ── Botón asesor humano completo cuando mostrarAsesor (Req 8.2, 13.4) ── */}
              {mostrarAsesor && (
                <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-soft)] flex-shrink-0">
                  <BotonAsesorHumano
                    numeroWhatsApp={WHATSAPP_NUMERO_ASESOR}
                    nombreUsuario={nombreUsuario}
                    presupuesto={presupuestoEstimado}
                    variante="completo"
                  />
                </div>
              )}

              {/* ── Footer: input de texto ── */}
              <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <label htmlFor="asistente-input" className="sr-only">
                    Escribe tu mensaje al asistente
                  </label>
                  <input
                    id="asistente-input"
                    ref={inputRef}
                    type="text"
                    value={textoInput}
                    onChange={manejarCambioInput}
                    onKeyDown={manejarKeyDown}
                    placeholder="Escribe tu mensaje..."
                    disabled={cargando}
                    autoComplete="off"
                    aria-label="Mensaje para el asistente"
                    className={[
                      'flex-1 min-h-[44px] px-4 text-sm',
                      'border border-[var(--color-border)]',
                      'bg-[var(--color-surface)] text-[var(--color-text)]',
                      'placeholder:text-[var(--color-text-muted)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]',
                      'disabled:opacity-60 transition-opacity',
                    ].join(' ')}
                    style={{ borderRadius: '24px' }}
                  />

                  <button
                    type="button"
                    onClick={manejarEnvio}
                    disabled={!textoInput.trim() || cargando}
                    aria-label="Enviar mensaje"
                    className={[
                      'flex items-center justify-center',
                      'min-h-[44px] min-w-[44px] rounded-full',
                      'bg-[var(--color-accent)] text-white',
                      'hover:opacity-90 active:opacity-80',
                      'disabled:opacity-40 transition-opacity',
                      'focus-visible:outline-none focus-visible:ring-2',
                      'focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2',
                      'focus-visible:ring-offset-[var(--color-surface)]',
                    ].join(' ')}
                  >
                    <IconoEnviar />
                  </button>
                </div>
              </footer>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

AsistenteIA.propTypes = {
  onAplicarRecomendacion: PropTypes.func,
  className: PropTypes.string,
};

export default AsistenteIA;
