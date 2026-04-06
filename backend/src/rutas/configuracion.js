const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  obtenerMargen,
  actualizarMargen
} = require('../controladores/controladorConfiguracion');

router.get('/margen', obtenerMargen);
router.put('/margen', verificarToken, actualizarMargen);

module.exports = router;
