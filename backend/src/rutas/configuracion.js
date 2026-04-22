const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  obtenerMargen,
  actualizarMargen,
  actualizarModoTipoCambio
} = require('../controladores/controladorConfiguracion');

router.get('/margen', obtenerMargen);
router.put('/margen', verificarToken, actualizarMargen);
router.put('/tipo-cambio', verificarToken, actualizarModoTipoCambio);

module.exports = router;
