const express = require('express');
const router = express.Router();
const { verificarToken, verificarTokenAdmin, verificarTokenAdminOVendedor, verificarTokenUsuario } = require('../middleware/auth');
const {
  crearCotizacion,
  consultarCotizacion,
  validarCotizacion,
  obtenerPdfCotizacion,
  obtenerPdfTecnico,
  notificarCotizacionLista,
  marcarComoReclamada,
  consultarHistorialCliente,
  obtenerPropias,
  listarClientesRegistrados,
  exportarExcel
} = require('../controladores/controladorCotizaciones');

// Crear nueva cotizacion (requiere login: admin o usuario)
router.post('/', verificarTokenUsuario, crearCotizacion);

// Listar todos los clientes registrados (admin o vendedor)
router.get('/clientes', verificarTokenAdminOVendedor, listarClientesRegistrados);

// Cotizaciones propias del usuario autenticado (debe ir ANTES de rutas con parámetros)
// Requisito: 5.1
router.get('/propias', verificarTokenUsuario, obtenerPropias);

// Historial por cliente (debe ir antes de /:codigoTicket)
router.get('/cliente/:email', consultarHistorialCliente);

// Consultar y validar cotizacion por codigo ticket
router.get('/:codigoTicket', consultarCotizacion);
router.get('/:codigoTicket/validar', validarCotizacion);

// Descargas PDF
router.get('/:codigoTicket/pdf', obtenerPdfCotizacion);
router.get('/:codigoTicket/pdf-tecnico', obtenerPdfTecnico);

// Exportar a Excel (requiere login: admin o usuario)
router.get('/:codigoTicket/excel', verificarTokenUsuario, exportarExcel);

// Flujo operativo (admin o vendedor: el vendedor gestiona/completa ventas)
router.put('/:codigoTicket/reclamar', verificarTokenAdminOVendedor, marcarComoReclamada);
router.post('/:codigoTicket/notificar-listo', verificarTokenAdminOVendedor, notificarCotizacionLista);

module.exports = router;

