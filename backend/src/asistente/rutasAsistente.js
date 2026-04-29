/**
 * Rutas del Asistente IA
 * Express router con rate limiting para los 5 endpoints del asistente.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const controlador = require('./controladorAsistente');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiter: 20 requests por minuto por IP
const limitadorAsistente = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.ip,
  message: {
    exito: false,
    mensaje: 'Demasiadas solicitudes al asistente. Espera un momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/asistente/nueva-sesion
router.post('/nueva-sesion', limitadorAsistente, controlador.nuevaSesion);

// POST /api/asistente/mensaje
router.post('/mensaje', limitadorAsistente, controlador.procesarMensaje);

// POST /api/asistente/validar-configuracion
router.post('/validar-configuracion', limitadorAsistente, controlador.validarConfiguracion);

// GET /api/asistente/historial/:usuario_id (requiere JWT)
router.get('/historial/:usuario_id', verificarToken, controlador.obtenerHistorial);

// GET /api/asistente/sesion/:sesion_id (sin auth, acceso anónimo)
router.get('/sesion/:sesion_id', controlador.obtenerSesion);

module.exports = router;
