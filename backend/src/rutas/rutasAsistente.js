/**
 * rutasAsistente.js
 * Rutas Express para el Asistente IA NSG Concierge v2.
 *
 * Endpoints:
 *  POST /nueva-sesion           — Crea sesión nueva (anónima o autenticada)
 *  POST /mensaje                — Procesa mensaje del usuario
 *  POST /validar-configuracion  — Valida compatibilidad de componentes
 *  GET  /historial/:usuario_id  — Historial del usuario (requiere JWT)
 *  GET  /sesion/:sesion_id      — Mensajes de una sesión específica
 *
 * Seguridad:
 *  - Rate limiting: 20 req/min por IP (rutas anónimas), 60 req/min por usuario autenticado
 *  - JWT requerido en rutas de historial (Req 18.1, 18.5)
 *
 * Requisitos: 16.1, 16.4, 16.7, 16.8, 16.9, 16.10, 15.7, 18.1, 18.5
 */

'use strict';

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const { verificarToken } = require('../middleware/auth');
const controladorAsistente = require('../controladores/controladorAsistente');

const router = express.Router();

// ─── Rate limiters ────────────────────────────────────────────────────────────

/**
 * Limitador para rutas anónimas: 20 solicitudes por minuto por IP.
 * Aplica a /nueva-sesion, /mensaje, /validar-configuracion y /sesion/:sesion_id.
 * (Req 15.7, 18.1)
 */
const limitadorAnonimo = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: parseInt(process.env.ASISTENTE_RATE_LIMIT_POR_IP || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    exito: false,
    error: 'Demasiadas solicitudes. Por favor espera un momento antes de continuar.'
  }
});

/**
 * Limitador para rutas autenticadas: 60 solicitudes por minuto por usuario.
 * Aplica a /historial/:usuario_id.
 * (Req 18.5)
 */
const limitadorAutenticado = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar ID de usuario autenticado como clave si está disponible, si no usar IP
    return req.usuario?.id ? `usuario_${req.usuario.id}` : req.ip;
  },
  message: {
    exito: false,
    error: 'Demasiadas solicitudes. Por favor espera un momento antes de continuar.'
  }
});

// ─── Rutas anónimas (sin JWT requerido) ───────────────────────────────────────

/**
 * POST /api/asistente/nueva-sesion
 * Crea una sesión nueva, anónima o autenticada.
 * Body: { usuario_id?: number }
 * Response 201: { exito: true, sesion_id: string, perfil_previo: object|null }
 */
router.post('/nueva-sesion', limitadorAnonimo, controladorAsistente.nuevaSesion);

/**
 * POST /api/asistente/mensaje
 * Procesa un mensaje del usuario con loop Double-Check.
 * Body: { sesion_id: string, mensaje: string, usuario_id?: number }
 * Response 200: { exito: true, respuesta, quick_replies, semaforo, configuracion_propuesta }
 */
router.post('/mensaje', limitadorAnonimo, controladorAsistente.procesarMensaje);

/**
 * POST /api/asistente/validar-configuracion
 * Valida compatibilidad de una configuración de componentes.
 * Body: { producto_ids: { procesador, placa_madre, ram, almacenamiento, gpu, fuente, case } }
 * Response 200: { valida: boolean, errores: string[], advertencias: string[] }
 */
router.post('/validar-configuracion', limitadorAnonimo, controladorAsistente.validarConfiguracion);

/**
 * GET /api/asistente/sesion/:sesion_id
 * Retorna todos los mensajes de una sesión específica.
 * Acceso anónimo permitido usando el sesion_id como identificador.
 * Response 200: { exito: true, sesion: object, mensajes: array }
 */
router.get('/sesion/:sesion_id', limitadorAnonimo, controladorAsistente.obtenerSesion);

// ─── Rutas autenticadas (JWT requerido) ───────────────────────────────────────

/**
 * GET /api/asistente/historial/:usuario_id
 * Retorna sesiones y mensajes del usuario en los últimos N días.
 * Requiere JWT; el usuario solo puede ver su propio historial (Req 18.2).
 * Response 200: { exito: true, sesiones: array, tipo_cambio_vigente: number }
 */
router.get(
  '/historial/:usuario_id',
  verificarToken,
  limitadorAutenticado,
  controladorAsistente.obtenerHistorial
);

module.exports = router;
