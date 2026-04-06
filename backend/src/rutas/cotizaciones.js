const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  crearCotizacion,
  consultarCotizacion,
  validarCotizacion,
  obtenerPdfCotizacion,
  obtenerPdfTecnico,
  notificarCotizacionLista,
  marcarComoReclamada,
  consultarHistorialCliente
} = require('../controladores/controladorCotizaciones');

// Crear nueva cotizacion
router.post('/', crearCotizacion);

// Historial por cliente (debe ir antes de /:codigoTicket)
router.get('/cliente/:email', consultarHistorialCliente);

// Consultar y validar cotizacion por codigo ticket
router.get('/:codigoTicket', consultarCotizacion);
router.get('/:codigoTicket/validar', validarCotizacion);

// Descargas PDF
router.get('/:codigoTicket/pdf', obtenerPdfCotizacion);
router.get('/:codigoTicket/pdf-tecnico', obtenerPdfTecnico);

// Flujo operativo admin
router.put('/:codigoTicket/reclamar', verificarToken, marcarComoReclamada);
router.post('/:codigoTicket/notificar-listo', verificarToken, notificarCotizacionLista);

module.exports = router;

