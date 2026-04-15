'use strict';

/**
 * Rutas de Importación CSV
 *
 * POST /csv — Importar catálogo desde CSV de Deltron.
 * Requiere autenticación.
 *
 * Requisitos: 5.10, 5.12
 */

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const uploadCSV = require('../middleware/multerCSV');
const ctrl = require('../controladores/controladorImportacion');

router.post(
  '/csv',
  verificarToken,
  (req, res, next) => {
    uploadCSV.single('archivo')(req, res, (err) => {
      if (err) {
        if (err.codigo === 'TIPO_INVALIDO') {
          return res.status(400).json({ error: err.message });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'Archivo demasiado grande (máx 50 MB)' });
        }
        return next(err);
      }
      next();
    });
  },
  ctrl.importarCSV
);

module.exports = router;
