/**
 * Rutas de Compatibilidad
 * 
 * Define los endpoints para validación de compatibilidad de componentes
 * 
 * Requisitos: 3.3
 */

const express = require('express');
const router = express.Router();
const servicioCompatibilidad = require('../servicios/servicioCompatibilidad');

/**
 * POST /api/compatibilidad/validar
 * Valida la compatibilidad entre componentes seleccionados
 * 
 * Body: { componentes: Object }
 * Response: { compatible: boolean, errores: string[], advertencias: string[] }
 */
router.post('/validar', async (req, res) => {
  try {
    const { componentes } = req.body;

    if (!componentes || typeof componentes !== 'object') {
      return res.status(400).json({
        error: 'Se requiere un objeto "componentes" en el body'
      });
    }

    const resultado = servicioCompatibilidad.validarConfiguracion(componentes);

    res.json(resultado);
  } catch (error) {
    console.error('Error en /validar:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: error.message
    });
  }
});

module.exports = router;
