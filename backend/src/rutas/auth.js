const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const servicioAuth = require('../servicios/servicioAuth');
const { verificarToken } = require('../middleware/auth');

// Rate limiter para registro (5 intentos / 15 min)
const limitadorRegistro = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    exito: false,
    error: 'Demasiados intentos de registro. Intenta mas tarde.'
  }
});

// Rate limiter para recuperación (3 intentos / 15 min)
const limitadorRecuperacion = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    exito: false,
    error: 'Demasiadas solicitudes de recuperacion. Intenta mas tarde.'
  }
});

/**
 * POST /api/auth/login
 * Autentica un usuario (admin o usuario registrado) y retorna token JWT
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
      console.warn(`[LOGIN_FALLIDO] username=${username} ip=${req.ip}`);
      return res.status(resultado.status || 401).json(resultado);
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
 * Verifica si un token JWT es válido. Retorna rol en el usuario.
 */
router.post('/verificar', verificarToken, async (req, res) => {
  try {
    res.json({
      valido: true,
      usuario: req.usuario,
      rol: req.rol
    });
  } catch (error) {
    console.error('Error en /verificar:', error);
    res.status(500).json({
      valido: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/auth/registro
 * Registra un nuevo usuario con rol 'usuario'.
 */
router.post('/registro', limitadorRegistro, async (req, res) => {
  try {
    const { username, password, confirmarPassword, correo, nombre_completo, telefono } = req.body;

    if (!username || !password || !confirmarPassword || !correo || !nombre_completo) {
      return res.status(400).json({
        exito: false,
        error: 'Todos los campos requeridos deben ser proporcionados',
        detalles: [
          { campo: 'username', mensaje: !username ? 'Username es requerido' : null },
          { campo: 'password', mensaje: !password ? 'Contrasena es requerida' : null },
          { campo: 'confirmarPassword', mensaje: !confirmarPassword ? 'Confirmar contrasena es requerido' : null },
          { campo: 'correo', mensaje: !correo ? 'Correo electronico es requerido' : null },
          { campo: 'nombre_completo', mensaje: !nombre_completo ? 'Nombre completo es requerido' : null }
        ].filter(d => d.mensaje)
      });
    }

    const resultado = await servicioAuth.registrar({
      username: username.trim(),
      password,
      confirmarPassword,
      correo: correo.trim().toLowerCase(),
      nombre_completo: nombre_completo.trim(),
      telefono: telefono ? telefono.trim() : null
    });

    if (!resultado.exito) {
      return res.status(resultado.status || 400).json(resultado);
    }

    res.status(201).json(resultado);
  } catch (error) {
    console.error('Error en /registro:', error);
    res.status(500).json({
      exito: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/auth/recuperar
 * Solicita recuperación de contraseña. Siempre retorna éxito genérico.
 */
router.post('/recuperar', limitadorRecuperacion, async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({
        exito: false,
        error: 'Correo electronico es requerido'
      });
    }

    const resultado = await servicioAuth.solicitarRecuperacion(correo);

    if (!resultado.exito) {
      return res.status(404).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error en /recuperar:', error);
    res.status(500).json({
      exito: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/auth/recuperar-por-telefono
 * Solicita recuperación de contraseña por número de teléfono.
 * Siempre retorna respuesta genérica (anti-enumeración).
 */
router.post('/recuperar-por-telefono', limitadorRecuperacion, async (req, res) => {
  try {
    const { telefono } = req.body;

    const resultado = await servicioAuth.recuperarPorTelefono(telefono);

    if (!resultado.exito && resultado.codigo === 'TELEFONO_INVALIDO') {
      return res.status(400).json(resultado);
    }

    if (!resultado.exito) {
      return res.status(404).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error en /recuperar-por-telefono:', error);
    res.status(500).json({
      exito: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/auth/restablecer
 * Restablece contraseña con token de recuperación.
 */
router.post('/restablecer', async (req, res) => {
  try {
    const { token, nuevaPassword, confirmarPassword } = req.body;

    if (!token || !nuevaPassword || !confirmarPassword) {
      return res.status(400).json({
        exito: false,
        error: 'Token, nueva contrasena y confirmacion son requeridos'
      });
    }

    const resultado = await servicioAuth.restablecerContrasena(token, nuevaPassword, confirmarPassword);

    if (!resultado.exito) {
      return res.status(resultado.status || 400).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error en /restablecer:', error);
    res.status(500).json({
      exito: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/auth/activar
 * Activa una Cuenta_Pendiente estableciendo username y contraseña.
 * Cambia estado de 'pendiente_activacion' a 'activa' y retorna JWT.
 */
router.post('/activar', async (req, res) => {
  try {
    const { correo, username, password, confirmarPassword } = req.body;

    if (!correo || !username || !password) {
      return res.status(400).json({
        exito: false,
        error: 'Correo, username y password son requeridos'
      });
    }

    if (confirmarPassword !== undefined && password !== confirmarPassword) {
      return res.status(400).json({
        exito: false,
        error: 'Las contraseñas no coinciden'
      });
    }

    const resultado = await servicioAuth.activarCuenta({
      correo: correo.trim().toLowerCase(),
      username: username.trim(),
      password,
      confirmarPassword
    });

    if (!resultado.exito) {
      return res.status(resultado.status || 400).json(resultado);
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error en /activar:', error);
    res.status(500).json({
      exito: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;