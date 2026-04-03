const express = require('express');
const router = express.Router();
const servicioAuth = require('../servicios/servicioAuth');
const { verificarToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Autentica un administrador y retorna un token JWT
 * 
 * Body: { username: string, password: string }
 * Response: { exito: boolean, token?: string, usuario?: Object, error?: string }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        exito: false,
        error: 'Username y password son requeridos'
      });
    }

    const resultado = await servicioAuth.login(username, password);

    if (!resultado.exito) {
      return res.status(401).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({
      exito: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/auth/verificar
 * Verifica si un token JWT es válido
 * Requiere middleware de autenticación
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { valido: boolean, usuario: Object }
 */
router.post('/verificar', verificarToken, async (req, res) => {
  try {
    // Si llegamos aquí, el token es válido (verificado por middleware)
    res.json({
      valido: true,
      usuario: req.usuario
    });
  } catch (error) {
    console.error('Error en /verificar:', error);
    res.status(500).json({
      valido: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
