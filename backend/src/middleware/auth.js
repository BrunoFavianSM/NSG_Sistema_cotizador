/**
 * Middleware de Autenticación
 *
 * Verifica tokens JWT para proteger rutas con control de roles:
 * - verificarTokenAdmin: solo admin (rutas administrativas)
 * - verificarTokenUsuario: admin o usuario registrado (rutas que requieren login)
 * - detectarUsuario: no bloqueante, identifica usuario si hay token (público con variantes)
 * - verificarToken: legacy, alias de verificarTokenAdmin
 *
 * Requisitos: 10.1, 10.2, 10.3, 10.4
 */

const jwt = require('jsonwebtoken');
const { ejecutarQuery } = require('../configuracion/baseDatos');

function extraerToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader) return authHeader.split(' ')[1];

  // EventSource nativo no permite headers Authorization.
  // Se acepta token por query solo para streams protegidos; mantener rutas normales con header.
  if ((req.originalUrl || req.path || '').includes('/estado/stream') && typeof req.query?.token === 'string') {
    return req.query.token;
  }

  return null;
}

function decodificarToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return {
    id: decoded.id,
    username: decoded.username,
    nombre: decoded.nombre,
    rol: decoded.rol || 'admin' // tokens legacy sin rol se tratan como admin
  };
}

/**
 * Middleware no bloqueante: detecta usuario si hay token válido.
 * Siempre llama a next(). Si no hay token o es inválido, req.usuario = null, req.rol = null.
 */
function detectarUsuario(req, res, next) {
  const token = extraerToken(req);

  if (!token) {
    req.usuario = null;
    req.rol = null;
    return next();
  }

  try {
    const decoded = decodificarToken(token);
    req.usuario = { id: decoded.id, username: decoded.username, nombre: decoded.nombre };
    req.rol = decoded.rol;
    next();
  } catch {
    req.usuario = null;
    req.rol = null;
    next();
  }
}

/**
 * Middleware que requiere autenticación (admin o usuario).
 * Rechaza con 401 si no hay token, 403 si el rol no es válido o la cuenta no está activa.
 * Consulta BD para verificar estado actual de la cuenta (req. 7.4).
 */
async function verificarTokenUsuario(req, res, next) {
  const token = extraerToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Acceso denegado',
      mensaje: 'Se requiere iniciar sesión para acceder a este recurso'
    });
  }

  try {
    const decoded = decodificarToken(token);

    if (!['admin', 'usuario'].includes(decoded.rol)) {
      return res.status(403).json({
        error: 'Rol no autorizado',
        mensaje: 'Tu cuenta no tiene permisos para acceder a este recurso'
      });
    }

    // NUEVO: verificar estado actual en BD (req. 7.4)
    const { rows } = await ejecutarQuery(
      'SELECT estado FROM cuentas WHERE id = $1',
      [decoded.id]
    );
    if (rows.length === 0 || rows[0].estado !== 'activa') {
      return res.status(403).json({
        error: 'Cuenta no activada',
        mensaje: 'Debes activar tu cuenta antes de acceder a este recurso'
      });
    }

    req.usuario = { id: decoded.id, username: decoded.username, nombre: decoded.nombre };
    req.rol = decoded.rol;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        mensaje: 'El token de autenticación ha expirado'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Token inválido',
        mensaje: 'El token de autenticación no es válido'
      });
    }
    return res.status(500).json({
      error: 'Error de autenticación',
      mensaje: 'Error al verificar el token'
    });
  }
}

/**
 * Middleware que requiere rol admin (incluye tokens legacy sin campo rol).
 */
function verificarTokenAdmin(req, res, next) {
  const token = extraerToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Acceso denegado',
      mensaje: 'Token de autenticación no proporcionado'
    });
  }

  try {
    const decoded = decodificarToken(token);

    if (decoded.rol !== 'admin') {
      return res.status(403).json({
        error: 'Acceso restringido',
        mensaje: 'Se requieren permisos de administrador'
      });
    }

    req.usuario = { id: decoded.id, username: decoded.username, nombre: decoded.nombre };
    req.rol = 'admin';
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        mensaje: 'El token de autenticación ha expirado'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Token inválido',
        mensaje: 'El token de autenticación no es válido'
      });
    }
    return res.status(500).json({
      error: 'Error de autenticación',
      mensaje: 'Error al verificar el token'
    });
  }
}

/**
 * Alias legacy: verificarToken = verificarTokenAdmin.
 * Mantenido para compatibilidad con código existente que hace require('verificarToken').
 */
function verificarToken(req, res, next) {
  return verificarTokenAdmin(req, res, next);
}

module.exports = { verificarToken, verificarTokenAdmin, verificarTokenUsuario, detectarUsuario };
