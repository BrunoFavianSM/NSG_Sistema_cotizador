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
} = require('../controladores/controladorConfiguracion');

router.get('/margen', obtenerMargen);
router.put('/margen', verificarToken, actualizarMargen);
router.put('/tipo-cambio', verificarToken, actualizarModoTipoCambio);

// ── Configuración de modelos de IA ──
router.get('/modelos-ia', verificarTokenAdmin, obtenerModelosIA);
router.put('/modelos-ia', verificarTokenAdmin, actualizarModelosIA);

// ── Configuración de claves API de IA ──
router.get('/api-keys-ia', verificarTokenAdmin, obtenerApiKeysIA);
router.put('/api-keys-ia', verificarTokenAdmin, actualizarApiKeysIA);

module.exports = router;
