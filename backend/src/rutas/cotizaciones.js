const express = require('express');
const router = express.Router();
const { verificarToken, verificarTokenAdmin, verificarTokenUsuario } = require('../middleware/auth');
const {
  crearCotizacion,
  consultarCotizacion,
  validarCotizacion,
  obtenerPdfCotizacion,
  obtenerPdfTecnico,
  notificarCotizacionLista,
  marcarComoReclamada,
  consultarHistorialCliente,
  listarClientesRegistrados
} = require('../controladores/controladorCotizaciones');

// Crear nueva cotizacion (requiere login: admin o usuario)
router.post('/', verificarTokenUsuario, crearCotizacion);

// Listar todos los clientes registrados (solo admin)
router.get('/clientes', verificarTokenAdmin, listarClientesRegistrados);

// Historial por cliente (debe ir antes de /:codigoTicket)
router.get('/cliente/:email', consultarHistorialCliente);

// Consultar y validar cotizacion por codigo ticket
router.get('/:codigoTicket', consultarCotizacion);
router.get('/:codigoTicket/validar', validarCotizacion);

// Descargas PDF
router.get('/:codigoTicket/pdf', obtenerPdfCotizacion);
router.get('/:codigoTicket/pdf-tecnico', obtenerPdfTecnico);

// Flujo operativo admin
router.put('/:codigoTicket/reclamar', verificarTokenAdmin, marcarComoReclamada);
router.post('/:codigoTicket/notificar-listo', verificarTokenAdmin, notificarCotizacionLista);

module.exports = router;

