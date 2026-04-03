/**
 * Middleware de Autenticación
 * 
 * Verifica tokens JWT para proteger rutas administrativas
 * 
 * Requisitos: 10.1, 10.2, 10.3, 10.4
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
function verificarToken(req, res, next) {
  // Obtener token del header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Acceso denegado',
      mensaje: 'Token de autenticación no proporcionado' 
    });
  }
  
  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Agregar información del usuario al request
    req.usuario = {
      id: decoded.id,
      username: decoded.username,
      nombre: decoded.nombre
    };
    
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

module.exports = { verificarToken };
