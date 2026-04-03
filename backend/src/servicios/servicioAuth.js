/**
 * Servicio de Autenticación
 * 
 * Proporciona funciones para autenticación de administradores,
 * generación y verificación de tokens JWT.
 * 
 * Requisitos: 10.1, 10.2, 10.3, 10.4
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ejecutarQuery } = require('../configuracion/baseDatos');
const { validarCredenciales } = require('../utilidades/validacion');

/**
 * Autentica un administrador con username y password
 * 
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<Object>} { exito: boolean, token?: string, usuario?: Object, error?: string }
 * 
 * @example
 * const resultado = await login('admin', 'password123');
 * if (resultado.exito) {
 *   console.log('Token:', resultado.token);
 * }
 */
async function login(username, password) {
  try {
    // Validar credenciales
    const validacion = validarCredenciales({ username, password });
    if (!validacion.valido) {
      return {
        exito: false,
        error: 'Credenciales inválidas',
        detalles: validacion.errores
      };
    }

    // Buscar administrador en la base de datos
    const resultado = await ejecutarQuery(
      'SELECT id, username, password_hash, nombre_completo FROM administradores WHERE username = $1',
      [username]
    );

    if (resultado.rows.length === 0) {
      return {
        exito: false,
        error: 'Usuario o contraseña incorrectos'
      };
    }

    const administrador = resultado.rows[0];

    // Verificar contraseña con bcrypt
    const passwordValido = await bcrypt.compare(password, administrador.password_hash);

    if (!passwordValido) {
      return {
        exito: false,
        error: 'Usuario o contraseña incorrectos'
      };
    }

    // Generar token JWT
    const token = generarToken({
      id: administrador.id,
      username: administrador.username,
      nombre: administrador.nombre_completo
    });

    return {
      exito: true,
      token,
      usuario: {
        id: administrador.id,
        username: administrador.username,
        nombre: administrador.nombre_completo
      }
    };
  } catch (error) {
    console.error('Error en login:', error);
    return {
      exito: false,
      error: 'Error al procesar la autenticación'
    };
  }
}

/**
 * Genera un token JWT para un usuario
 * 
 * @param {Object} payload - Datos del usuario { id, username, nombre }
 * @param {string} [expiracion='24h'] - Tiempo de expiración del token
 * @returns {string} Token JWT
 * 
 * @example
 * const token = generarToken({ id: 1, username: 'admin', nombre: 'Admin User' });
 */
function generarToken(payload, expiracion = '24h') {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en las variables de entorno');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiracion,
    issuer: 'nsg-cotizacion-system'
  });
}

/**
 * Verifica un token JWT
 * 
 * @param {string} token - Token JWT a verificar
 * @returns {Object} { valido: boolean, payload?: Object, error?: string }
 * 
 * @example
 * const resultado = verificarToken(token);
 * if (resultado.valido) {
 *   console.log('Usuario:', resultado.payload.username);
 * }
 */
function verificarToken(token) {
  try {
    if (!token) {
      return {
        valido: false,
        error: 'Token no proporcionado'
      };
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no está configurado en las variables de entorno');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    return {
      valido: true,
      payload: {
        id: payload.id,
        username: payload.username,
        nombre: payload.nombre
      }
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        valido: false,
        error: 'Token expirado'
      };
    }

    if (error.name === 'JsonWebTokenError') {
      return {
        valido: false,
        error: 'Token inválido'
      };
    }

    return {
      valido: false,
      error: 'Error al verificar el token'
    };
  }
}

/**
 * Hashea una contraseña usando bcrypt
 * 
 * @param {string} password - Contraseña en texto plano
 * @param {number} [saltRounds=10] - Número de rondas de salt
 * @returns {Promise<string>} Hash de la contraseña
 * 
 * @example
 * const hash = await hashPassword('password123');
 */
async function hashPassword(password, saltRounds = 10) {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Error al hashear contraseña:', error);
    throw new Error('Error al procesar la contraseña');
  }
}

/**
 * Verifica si una contraseña coincide con un hash
 * 
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash de la contraseña
 * @returns {Promise<boolean>} true si coincide, false si no
 * 
 * @example
 * const coincide = await verificarPassword('password123', hash);
 */
async function verificarPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    return false;
  }
}

/**
 * Obtiene información de un administrador por ID
 * 
 * @param {number} id - ID del administrador
 * @returns {Promise<Object|null>} Datos del administrador o null si no existe
 */
async function obtenerAdministradorPorId(id) {
  try {
    const resultado = await ejecutarQuery(
      'SELECT id, username, nombre_completo, created_at FROM administradores WHERE id = $1',
      [id]
    );

    if (resultado.rows.length === 0) {
      return null;
    }

    return resultado.rows[0];
  } catch (error) {
    console.error('Error al obtener administrador:', error);
    throw error;
  }
}

module.exports = {
  login,
  generarToken,
  verificarToken,
  hashPassword,
  verificarPassword,
  obtenerAdministradorPorId
};
