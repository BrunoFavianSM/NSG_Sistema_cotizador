import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../contexto/AppContext';
import * as asistente from '../servicios/asistente';

const MENSAJE_BIENVENIDA_BASE = {
  rol: 'assistant',
  contenido:
    'Hola, soy tu asesor de NSG. Te ayudo a cotizar una PC ideal segun tu presupuesto y uso. Empecemos por lo principal.',
  metadata: {
    quick_replies: ['Gaming', 'Oficina/Estudio', 'Edicion de video', 'Tengo presupuesto'],
    semaforo: null,
    configuracion_propuesta: null,
  },
};

function crearMensajeBienvenida() {
  return {
    id: `assistant-bienvenida-${Date.now()}`,
    rol: MENSAJE_BIENVENIDA_BASE.rol,
    contenido: MENSAJE_BIENVENIDA_BASE.contenido,
    timestamp: new Date().toISOString(),
    metadata: MENSAJE_BIENVENIDA_BASE.metadata,
  };
}

export function useAsistenteIA({ sesionId: sesionIdProp = null, usuarioId = null, activo = true } = {}) {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [configuracionPropuesta, setConfiguracionPropuesta] = useState(null);
  const [semaforo, setSemaforo] = useState(null);
  const [error, setError] = useState(null);
  const [mostrarAsesor, setMostrarAsesor] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [etapaConversacion, setEtapaConversacion] = useState('cuestionario');

  const sesionIdRef = useRef(sesionIdProp);
  const [sesionIdEstado, setSesionIdEstado] = useState(sesionIdProp);
  const inicializadoRef = useRef(false);

  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const { tipoCambioUsdPen, autenticado, usuario, aplicarConfiguracion: aplicarConfiguracionContexto } = useAppContext();

  const resolverUsuarioId = useCallback(() => {
    if (usuarioId !== null && usuarioId !== undefined) return usuarioId;
    if (autenticado && usuario?.id) return usuario.id;
    return null;
  }, [usuarioId, autenticado, usuario]);

  const registrarDebug = useCallback((evento, detalle = {}) => {
    setDebugLogs((prev) => [
      ...prev.slice(-149),
      {
        ts: new Date().toISOString(),
        evento,
        detalle
      }
    ]);
  }, []);

  const sembrarBienvenida = useCallback(() => {
    setMensajes((prev) => {
      if (prev.length > 0) return prev;
      return [crearMensajeBienvenida()];
    });
    setQuickReplies(MENSAJE_BIENVENIDA_BASE.metadata.quick_replies);
  }, []);

  useEffect(() => {
    if (!activo) return;
    if (inicializadoRef.current) return;

    if (sesionIdProp) {
      sesionIdRef.current = sesionIdProp;
      setSesionIdEstado(sesionIdProp);
      inicializadoRef.current = true;
      sembrarBienvenida();
      registrarDebug('sesion_reutilizada', { sesionId: sesionIdProp });
      return;
    }

    const iniciarSesion = async () => {
      try {
        const uid = resolverUsuarioId();
        const resultado = await asistente.nuevaSesion(uid);
        if (!montadoRef.current) return;

        if (resultado?.exito && resultado?.sesion_id) {
          sesionIdRef.current = resultado.sesion_id;
          setSesionIdEstado(resultado.sesion_id);
          inicializadoRef.current = true;
          sembrarBienvenida();
          registrarDebug('sesion_creada', { sesionId: resultado.sesion_id });
        } else {
          setError(resultado?.error || 'No se pudo iniciar la sesion del asistente. Por favor, recarga la pagina.');
          setMostrarAsesor(true);
          registrarDebug('error_sesion', { error: resultado?.error || 'fallo nuevaSesion' });
        }
      } catch (_) {
        if (!montadoRef.current) return;
        setError('No se pudo iniciar la sesion del asistente. Por favor, recarga la pagina.');
        setMostrarAsesor(true);
        registrarDebug('error_sesion', { error: 'exception nuevaSesion' });
      }
    };

    iniciarSesion();
  }, [activo, sesionIdProp, resolverUsuarioId, sembrarBienvenida]);

  const llamarConRetry = useCallback(async (fn, maxIntentos = 2) => {
    let ultimoError;
    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        const resultado = await fn();
        if (resultado?.exito === false) {
          ultimoError = new Error(resultado.error || 'Error del servidor');
          if (intento < maxIntentos) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          continue;
        }
        return resultado;
      } catch (err) {
        ultimoError = err;
        if (intento < maxIntentos) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    throw ultimoError;
  }, []);

  const enviarMensaje = useCallback(
    async (texto) => {
      if (!texto?.trim()) return;

      const sesionActual = sesionIdRef.current;
      if (!sesionActual) {
        setError('No hay sesion activa. Abre el chat e intenta de nuevo.');
        return;
      }

      const mensajeUsuario = {
        id: `user-${Date.now()}`,
        rol: 'user',
        contenido: texto.trim(),
        timestamp: new Date().toISOString(),
      };

      setMensajes((prev) => [...prev, mensajeUsuario]);
      registrarDebug('mensaje_usuario', { contenido: texto.trim() });
      setQuickReplies([]);
      setError(null);
      setCargando(true);

      try {
        const uid = resolverUsuarioId();
        const resultado = await llamarConRetry(() => asistente.enviarMensaje(sesionActual, texto.trim(), uid), 2);
        registrarDebug('respuesta_api', {
          exito: !!resultado?.exito,
          tieneConfig: !!resultado?.configuracion_propuesta,
          quickReplies: Array.isArray(resultado?.quick_replies) ? resultado.quick_replies.length : 0,
          mostrarAsesor: !!resultado?.mostrar_asesor,
          etapa: resultado?.etapa || null,
          faltantes: Array.isArray(resultado?.cuestionario_faltantes) ? resultado.cuestionario_faltantes : []
        });

        if (!montadoRef.current) return;

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

        setMensajes((prev) => {
          const ultimo = prev[prev.length - 1];
          if (
            ultimo?.rol === 'assistant' &&
            String(ultimo?.contenido || '').trim() === String(mensajeAsistente.contenido || '').trim()
          ) {
            return prev;
          }
          return [...prev, mensajeAsistente];
        });

        setQuickReplies(resultado.quick_replies || []);
        setSemaforo(resultado.semaforo || null);
        setConfiguracionPropuesta(resultado.configuracion_propuesta || null);
        setEtapaConversacion(resultado.etapa || 'cuestionario');
      } catch (_) {
        if (!montadoRef.current) return;
        setError('Hubo un problema al conectar con el asistente. Por favor, intenta de nuevo o contacta a un asesor.');
        setMostrarAsesor(true);
        registrarDebug('error_envio', { error: 'fallo enviarMensaje' });
      } finally {
        if (montadoRef.current) {
          setCargando(false);
        }
      }
    },
    [llamarConRetry, resolverUsuarioId]
  );

  const seleccionarQuickReply = useCallback(
    (texto) => {
      setQuickReplies([]);
      enviarMensaje(texto);
      registrarDebug('quick_reply', { texto });
    },
    [enviarMensaje, registrarDebug]
  );

  const ocultarQuickReplies = useCallback(() => {
    setQuickReplies([]);
  }, []);

  const aplicarConfiguracion = useCallback(() => {
    if (configuracionPropuesta && aplicarConfiguracionContexto) {
      aplicarConfiguracionContexto(configuracionPropuesta);
    }
  }, [configuracionPropuesta, aplicarConfiguracionContexto]);

  const reiniciar = useCallback(async () => {
    setMensajes([]);
    setCargando(false);
    setQuickReplies([]);
    setConfiguracionPropuesta(null);
    setSemaforo(null);
    setError(null);
    setMostrarAsesor(false);
    setDebugLogs([]);
    setEtapaConversacion('cuestionario');
    sesionIdRef.current = null;
    setSesionIdEstado(null);
    inicializadoRef.current = false;

    try {
      const uid = resolverUsuarioId();
      const resultado = await asistente.nuevaSesion(uid);
      if (!montadoRef.current) return;

      if (resultado?.exito && resultado?.sesion_id) {
        sesionIdRef.current = resultado.sesion_id;
        setSesionIdEstado(resultado.sesion_id);
        inicializadoRef.current = true;
        sembrarBienvenida();
        registrarDebug('sesion_reiniciada', { sesionId: resultado.sesion_id });
      } else {
        setError(resultado?.error || 'No se pudo reiniciar la sesion. Por favor, recarga la pagina.');
        setMostrarAsesor(true);
        registrarDebug('error_reinicio', { error: resultado?.error || 'fallo reinicio' });
      }
    } catch (_) {
      if (!montadoRef.current) return;
      setError('No se pudo reiniciar la sesion. Por favor, recarga la pagina.');
      setMostrarAsesor(true);
      registrarDebug('error_reinicio', { error: 'exception reinicio' });
    }
  }, [resolverUsuarioId, sembrarBienvenida, registrarDebug]);

  return {
    mensajes,
    cargando,
    quickReplies,
    configuracionPropuesta,
    semaforo,
    error,
    mostrarAsesor,
    sesionId: sesionIdEstado,
    tipoCambioUsdPen,
    debugLogs,
    etapaConversacion,
    enviarMensaje,
    seleccionarQuickReply,
    ocultarQuickReplies,
    aplicarConfiguracion,
    reiniciar,
  };
}

export default useAsistenteIA;
