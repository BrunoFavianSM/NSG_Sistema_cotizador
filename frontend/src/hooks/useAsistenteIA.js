import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../contexto/AppContext';
import * as asistente from '../servicios/asistente';

/**
 * Hook de lógica y estado del Asistente IA NSG Concierge v2.
 *
 * Gestiona: mensajes, sesión, quick replies, configuración propuesta,
 * semáforo de capacidades, errores con reintento automático y escalada
 * a asesor humano tras 2 fallos consecutivos.
 *
 * Valida Requisitos: 19.2, 19.3, 19.5, 10.6, 13.3, 13.4, 13.5
 *
 * @param {object} opciones
 * @param {string|null} opciones.sesionId   - UUID de sesión existente (opcional)
 * @param {number|null} opciones.usuarioId  - ID del usuario autenticado (opcional)
 */
export function useAsistenteIA({ sesionId: sesionIdProp = null, usuarioId = null } = {}) {
  // ============================================
  // ESTADO PÚBLICO
  // ============================================
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [configuracionPropuesta, setConfiguracionPropuesta] = useState(null);
  const [semaforo, setSemaforo] = useState(null);
  const [error, setError] = useState(null);

  // ============================================
  // ESTADO INTERNO
  // ============================================
  const [mostrarAsesor, setMostrarAsesor] = useState(false);

  // Usar ref para sesionId para evitar stale closures en callbacks
  const sesionIdRef = useRef(sesionIdProp);
  const [sesionIdEstado, setSesionIdEstado] = useState(sesionIdProp);

  // Ref para evitar actualizaciones de estado en componentes desmontados
  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  // ============================================
  // CONSUMIR APP CONTEXT
  // ============================================
  const { tipoCambioUsdPen, autenticado, usuario, aplicarConfiguracion: aplicarConfiguracionContexto } = useAppContext();

  // Resolver usuarioId: prop tiene prioridad, luego usuario del contexto
  const resolverUsuarioId = useCallback(() => {
    if (usuarioId !== null && usuarioId !== undefined) return usuarioId;
    if (autenticado && usuario?.id) return usuario.id;
    return null;
  }, [usuarioId, autenticado, usuario]);

  // ============================================
  // INICIALIZACIÓN: crear sesión al montar si no se pasó sesionId
  // ============================================
  useEffect(() => {
    // Si ya se pasó un sesionId externo, usarlo directamente
    if (sesionIdProp) {
      sesionIdRef.current = sesionIdProp;
      setSesionIdEstado(sesionIdProp);
      return;
    }

    // Crear nueva sesión
    const iniciarSesion = async () => {
      try {
        const uid = resolverUsuarioId();
        const resultado = await asistente.nuevaSesion(uid);
        if (!montadoRef.current) return;

        if (resultado?.exito && resultado?.sesion_id) {
          sesionIdRef.current = resultado.sesion_id;
          setSesionIdEstado(resultado.sesion_id);
        } else {
          // Fallo al crear sesión: mostrar error pero no bloquear el render
          setError(
            resultado?.error ||
            'No se pudo iniciar la sesión del asistente. Por favor, recarga la página.'
          );
          setMostrarAsesor(true);
        }
      } catch (err) {
        if (!montadoRef.current) return;
        setError('No se pudo iniciar la sesión del asistente. Por favor, recarga la página.');
        setMostrarAsesor(true);
      }
    };

    iniciarSesion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  // ============================================
  // LÓGICA DE RETRY
  // ============================================

  /**
   * Ejecuta una función async con reintentos automáticos.
   * Espera 1 segundo entre intentos.
   *
   * @param {Function} fn          - Función async a ejecutar
   * @param {number}   maxIntentos - Número máximo de intentos (default: 2)
   * @returns {Promise<any>}       - Resultado de la función o lanza error tras agotar intentos
   */
  const llamarConRetry = useCallback(async (fn, maxIntentos = 2) => {
    let ultimoError;
    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        const resultado = await fn();
        // Si el servicio retorna { exito: false }, tratar como error recuperable
        if (resultado?.exito === false) {
          ultimoError = new Error(resultado.error || 'Error del servidor');
          if (intento < maxIntentos) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          continue;
        }
        return resultado;
      } catch (err) {
        ultimoError = err;
        if (intento < maxIntentos) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    throw ultimoError;
  }, []);

  // ============================================
  // ENVIAR MENSAJE
  // ============================================

  /**
   * Envía un mensaje del usuario al asistente.
   * Aplica optimistic update, retry automático (máx 2) y escalada a asesor.
   *
   * @param {string} texto - Texto del mensaje a enviar
   */
  const enviarMensaje = useCallback(async (texto) => {
    if (!texto?.trim()) return;

    const sesionActual = sesionIdRef.current;
    if (!sesionActual) {
      setError('No hay sesión activa. Por favor, recarga la página.');
      return;
    }

    // Optimistic update: agregar mensaje del usuario inmediatamente
    const mensajeUsuario = {
      id: `user-${Date.now()}`,
      rol: 'user',
      contenido: texto.trim(),
      timestamp: new Date().toISOString(),
    };

    setMensajes(prev => [...prev, mensajeUsuario]);
    setQuickReplies([]);
    setError(null);
    setCargando(true);

    try {
      const uid = resolverUsuarioId();

      const resultado = await llamarConRetry(
        () => asistente.enviarMensaje(sesionActual, texto.trim(), uid),
        2
      );

      if (!montadoRef.current) return;

      // Agregar respuesta del asistente
      const mensajeAsistente = {
        id: `assistant-${Date.now()}`,
        rol: 'assistant',
        contenido: resultado.respuesta || '',
        timestamp: new Date().toISOString(),
        metadata: {
          quick_replies: resultado.quick_replies || [],
          semaforo: resultado.semaforo || null,
          configuracion_propuesta: resultado.configuracion_propuesta || null,
        },
      };

      setMensajes(prev => [...prev, mensajeAsistente]);

      // Actualizar quick replies, semáforo y configuración propuesta
      setQuickReplies(resultado.quick_replies || []);
      setSemaforo(resultado.semaforo || null);
      setConfiguracionPropuesta(resultado.configuracion_propuesta || null);

    } catch (err) {
      if (!montadoRef.current) return;

      // Tras 2 reintentos fallidos: mensaje amigable + mostrar asesor
      setError(
        'Hubo un problema al conectar con el asistente. Por favor, intenta de nuevo o contacta a un asesor.'
      );
      setMostrarAsesor(true);
    } finally {
      if (montadoRef.current) {
        setCargando(false);
      }
    }
  }, [llamarConRetry, resolverUsuarioId]);

  // ============================================
  // SELECCIONAR QUICK REPLY
  // ============================================

  /**
   * Selecciona una opción de quick reply y la envía como mensaje.
   * Limpia los quick replies antes de enviar.
   *
   * @param {string} texto - Texto del quick reply seleccionado
   */
  const seleccionarQuickReply = useCallback((texto) => {
    setQuickReplies([]);
    enviarMensaje(texto);
  }, [enviarMensaje]);

  // ============================================
  // OCULTAR QUICK REPLIES (Requisito 10.6)
  // ============================================

  /**
   * Oculta los quick replies cuando el usuario empieza a escribir.
   * El componente debe llamar esta función en el onChange del input.
   */
  const ocultarQuickReplies = useCallback(() => {
    setQuickReplies([]);
  }, []);

  // ============================================
  // APLICAR CONFIGURACIÓN
  // ============================================

  /**
   * Carga la configuración propuesta en el cotizador a través del AppContext.
   */
  const aplicarConfiguracion = useCallback(() => {
    if (configuracionPropuesta && aplicarConfiguracionContexto) {
      aplicarConfiguracionContexto(configuracionPropuesta);
    }
  }, [configuracionPropuesta, aplicarConfiguracionContexto]);

  // ============================================
  // REINICIAR
  // ============================================

  /**
   * Limpia todo el estado y crea una nueva sesión.
   */
  const reiniciar = useCallback(async () => {
    // Limpiar estado
    setMensajes([]);
    setCargando(false);
    setQuickReplies([]);
    setConfiguracionPropuesta(null);
    setSemaforo(null);
    setError(null);
    setMostrarAsesor(false);
    sesionIdRef.current = null;
    setSesionIdEstado(null);

    // Crear nueva sesión
    try {
      const uid = resolverUsuarioId();
      const resultado = await asistente.nuevaSesion(uid);
      if (!montadoRef.current) return;

      if (resultado?.exito && resultado?.sesion_id) {
        sesionIdRef.current = resultado.sesion_id;
        setSesionIdEstado(resultado.sesion_id);
      } else {
        setError(
          resultado?.error ||
          'No se pudo reiniciar la sesión. Por favor, recarga la página.'
        );
        setMostrarAsesor(true);
      }
    } catch (err) {
      if (!montadoRef.current) return;
      setError('No se pudo reiniciar la sesión. Por favor, recarga la página.');
      setMostrarAsesor(true);
    }
  }, [resolverUsuarioId]);

  // ============================================
  // RETORNO DEL HOOK
  // ============================================
  return {
    // Estado público
    mensajes,
    cargando,
    quickReplies,
    configuracionPropuesta,
    semaforo,
    error,
    mostrarAsesor,
    sesionId: sesionIdEstado,
    tipoCambioUsdPen,

    // Acciones
    enviarMensaje,
    seleccionarQuickReply,
    ocultarQuickReplies,
    aplicarConfiguracion,
    reiniciar,
  };
}

export default useAsistenteIA;
