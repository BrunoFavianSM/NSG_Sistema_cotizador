const express = require('express');
const router = express.Router();
const { verificarToken, verificarTokenAdmin } = require('../middleware/auth');
const {
  obtenerMargen,
  actualizarMargen,
  actualizarModoTipoCambio,
  obtenerModelosIA,
  actualizarModelosIA,
  obtenerApiKeysIA,
  actualizarApiKeysIA,
  obtenerModelosIAEnriquecimiento,
  actualizarModelosIAEnriquecimiento,
} = require('../controladores/controladorConfiguracion');

router.get('/margen', obtenerMargen);
router.put('/margen', verificarToken, actualizarMargen);
router.put('/tipo-cambio', verificarToken, actualizarModoTipoCambio);

router.get('/modelos-ia', verificarTokenAdmin, obtenerModelosIA);
router.put('/modelos-ia', verificarTokenAdmin, actualizarModelosIA);
router.get('/api-keys-ia', verificarTokenAdmin, obtenerApiKeysIA);
router.put('/api-keys-ia', verificarTokenAdmin, actualizarApiKeysIA);

router.get('/modelos-ia-enriquecimiento', verificarTokenAdmin, obtenerModelosIAEnriquecimiento);
router.put('/modelos-ia-enriquecimiento', verificarTokenAdmin, actualizarModelosIAEnriquecimiento);

module.exports = router;
