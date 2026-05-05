/**
 * Rutas de Notificaciones de Usuario
 *
 * Todas las rutas requieren autenticación de usuario (admin o usuario registrado).
 *
 * GET   /api/notificaciones/pendientes  → obtenerPendientes
 * PATCH /api/notificaciones/:id/leer    → marcarLeida
 *
 * Requisitos: 5.2, 5.5
 */

const express = require('express');
const router = express.Router();
const { verificarTokenUsuario } = require('../middleware/auth');
const { obtenerPendientes, marcarLeida } = require('../controladores/controladorNotificaciones');

// Obtener notificaciones no leídas del usuario autenticado
router.get('/pendientes', verificarTokenUsuario, obtenerPendientes);

// Marcar una notificación como leída
router.patch('/:id/leer', verificarTokenUsuario, marcarLeida);

module.exports = router;
