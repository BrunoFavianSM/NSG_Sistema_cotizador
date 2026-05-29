/**
 * rutas/clientes.js
 *
 * Rutas para gestión de clientes.
 */

const express = require('express');
const { buscarCliente, obtenerEmails } = require('../controladores/controladorClientes');

const router = express.Router();

// GET /api/clientes/buscar?q={email|telefono}
router.get('/buscar', buscarCliente);

// GET /api/clientes/emails
router.get('/emails', obtenerEmails);

module.exports = router;
