const express = require('express');
const router = express.Router();
const {
  crearCotizacion,
  consultarCotizacion,
  validarCotizacion,
  marcarComoReclamada,
  consultarHistorialCliente
} = require('../controladores/controladorCotizaciones');

// Crear nueva cotización
router.post('/', crearCotizacion);

// Consultar cotización por código ticket
router.get('/:codigoTicket', consultarCotizacion);

// Validar cotización con comparación de precios
router.get('/:codigoTicket/validar', validarCotizacion);

// Marcar cotización como reclamada
router.put('/:codigoTicket/reclamar', marcarComoReclamada);

// Consultar historial de cotizaciones por cliente
router.get('/cliente/:email', consultarHistorialCliente);

module.exports = router;
