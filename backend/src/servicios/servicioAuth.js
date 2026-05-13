/**
 * Servicio de Autenticación
 *
 * Autenticación unificada para admin y usuarios contra tabla cuentas.
 * Incluye login con lockout, registro, recuperación de contraseña,
 * generación y verificación de tokens JWT con rol.
 *
 * Requisitos: 10.1, 10.2, 10.3, 10.4
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ejecutarQuery } = require('../configuracion/baseDatos');
const { validarCredenciales, validarRegistro, validarRestablecimiento } = require('../utilidades/validacion');
const { encriptar, hashBusqueda, desencriptar } = require('../utilidades/encriptacion');
const { enviarCorreoRecuperacion } = require('./servicioCorreo');

const SALT_ROUNDS = 12;
const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;
const TOKEN_EXPIRA_MINUTOS = 5;

/**
 * Autentica un usuario (admin o usuario) contra la tabla cuentas.
 * Incluye bloqueo tras 5 intentos fallidos (15 min).
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>}
 */
async function login(username, password) {
  try {
    const validacion = validarCredenciales({ username, password });
    if (!validacion.valido) {
      return { exito: false, error: 'Credenciales inválidas', detalles: validacion.errores };
    }

    const resultado = await ejecutarQuery(
      `SELECT id, username, password_hash, nombre_completo, rol,
              estado, intentos_fallidos, bloqueado_hasta
       FROM cuentas WHERE username = $1`,
      [username]
    );

    if (resultado.rows.length === 0) {
      return { exito: false, error: 'Usuario o contraseña incorrectos' };
    }

    const cuenta = resultado.rows[0];

    // Verificar bloqueo
    if (cuenta.bloqueado_hasta && new Date(cuenta.bloqueado_hasta) > new Date()) {
      const minutosRestantes = Math.ceil(
        (new Date(cuenta.bloqueado_hasta) - new Date()) / 60000
      );
      return {
        exito: false,
        error: `Cuenta bloqueada. Intenta nuevamente en ${minutosRestantes} minuto(s).`
      };
    }

    // Verificar estado de la cuenta (Requisito 7.1, 7.3)
    if (cuenta.estado === 'pendiente_activacion') {
      return {
        exito: false,
        status: 403,
        error: 'Cuenta no activada',
        mensaje: 'Debes activar tu cuenta antes de iniciar sesión',
        codigo: 'CUENTA_PENDIENTE'
      };
    }

    const passwordValido = await bcrypt.compare(password, cuenta.password_hash);

    if (!passwordValido) {
      const nuevosIntentos = cuenta.intentos_fallidos + 1;
      if (nuevosIntentos >= MAX_INTENTOS) {
        await ejecutarQuery(
          `UPDATE cuentas SET intentos_fallidos = 0, bloqueado_hasta = CURRENT_TIMESTAMP + interval '${BLOQUEO_MINUTOS} minutes' WHERE id = $1`,
          [cuenta.id]
        );
        return {
          exito: false,
          error: `Cuenta bloqueada por ${BLOQUEO_MINUTOS} minutos tras ${MAX_INTENTOS} intentos fallidos.`
        };
      }
      await ejecutarQuery(
        'UPDATE cuentas SET intentos_fallidos = $1 WHERE id = $2',
        [nuevosIntentos, cuenta.id]
      );
      return { exito: false, error: 'Usuario o contraseña incorrectos' };
    }

    // Login exitoso: resetear intentos y bloqueo
    await ejecutarQuery(
      'UPDATE cuentas SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1',
      [cuenta.id]
    );

    const token = generarToken({
      id: cuenta.id,
      username: cuenta.username,
      nombre: cuenta.nombre_completo,
      rol: cuenta.rol
    });

    return {
      exito: true,
      token,
      usuario: {
        id: cuenta.id,
        username: cuenta.username,
        nombre: cuenta.nombre_completo,
        rol: cuenta.rol
      }
    };
  } catch (error) {
    console.error('Error en login:', error);
    return { exito: false, error: 'Error al procesar la autenticación' };
  }
}

/**
 * Registra un nuevo usuario con rol 'usuario'.
 * El correo se cifra con AES-256-CBC y se indexa con HMAC-SHA256.
 *
 * @param {Object} datos - { username, password, confirmarPassword, correo, nombre_completo, telefono }
 * @returns {Promise<Object>}
 */
async function registrar(datos) {
  try {
    const validacion = validarRegistro(datos);
    if (!validacion.valido) {
      return { exito: false, status: 400, error: 'Datos inválidos', detalles: validacion.errores };
    }

    // Verificar unicidad de username
    const usernameExiste = await ejecutarQuery(
      'SELECT id FROM cuentas WHERE username = $1',
      [datos.username]
    );
    if (usernameExiste.rows.length > 0) {
      return { exito: false, status: 409, error: 'El nombre de usuario ya está en uso' };
    }

    // Verificar unicidad de correo (vía hash)
    const correoNormalizado = datos.correo.trim().toLowerCase();
    const correoHash = hashBusqueda(correoNormalizado);
    const correoExiste = await ejecutarQuery(
      'SELECT id, estado FROM cuentas WHERE correo_hash = $1',
      [correoHash]
    );
    if (correoExiste.rows.length > 0) {
      const cuentaExistente = correoExiste.rows[0];
      if (cuentaExistente.estado === 'pendiente_activacion') {
        return {
          exito: false,
          status: 409,
          error: 'Correo con cuenta pendiente de activación',
          codigo: 'CUENTA_PENDIENTE_ACTIVACION',
          mensaje: 'Este correo ya tiene cotizaciones asociadas. Activa tu cuenta para acceder a ellas.'
        };
      }
      return { exito: false, status: 409, error: 'El correo electrónico ya está registrado' };
    }

    // Cifrar correo
    const correoEncrypted = encriptar(correoNormalizado);

    // Cifrar teléfono si se proporciona
    let telefonoEncrypted = null;
    let telefonoHash = null;
    if (datos.telefono) {
      telefonoEncrypted = encriptar(datos.telefono);
      telefonoHash = hashBusqueda(datos.telefono);
    }

    // Hashear contraseña
    const passwordHash = await hashPassword(datos.password);

    const insert = await ejecutarQuery(
      `INSERT INTO cuentas (username, password_hash, correo_encrypted, correo_hash, nombre_completo, telefono_encrypted, telefono_hash, rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'usuario')
       RETURNING id, username, nombre_completo, rol`,
      [datos.username, passwordHash, correoEncrypted, correoHash, datos.nombre_completo, telefonoEncrypted, telefonoHash]
    );

    const cuenta = insert.rows[0];

    const token = generarToken({
      id: cuenta.id,
      username: cuenta.username,
      nombre: cuenta.nombre_completo,
      rol: cuenta.rol
    });

    return {
      exito: true,
      token,
      usuario: {
        id: cuenta.id,
        username: cuenta.username,
        nombre: cuenta.nombre_completo,
        rol: cuenta.rol
      }
    };
  } catch (error) {
    console.error('Error en registrar:', error);
    return { exito: false, status: 500, error: 'Error al procesar el registro' };
  }
}

/**
 * Solicita recuperación de contraseña: genera token y lo guarda.
 * Siempre retorna éxito genérico (anti-enumeración de correos).
 *
 * @param {string} correo
 * @returns {Promise<Object>}
 */
async function solicitarRecuperacion(correo) {
  try {
    const correoNormalizado = correo.trim().toLowerCase();
    let correoHash;
    try {
      correoHash = hashBusqueda(correoNormalizado);
    } catch {
      return { exito: false, encontrado: false, mensaje: 'Cuenta no encontrada.' };
    }

    const resultado = await ejecutarQuery(
      'SELECT id FROM cuentas WHERE correo_hash = $1',
      [correoHash]
    );

    if (resultado.rows.length === 0) {
      return { exito: false, encontrado: false, mensaje: 'Cuenta no encontrada.' };
    }

    const cuenta = resultado.rows[0];
    const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + TOKEN_EXPIRA_MINUTOS * 60 * 1000);

    await ejecutarQuery(
      'UPDATE cuentas SET token_recuperacion = $1, token_recuperacion_expira = $2 WHERE id = $3',
      [tokenRecuperacion, expira, cuenta.id]
    );

    const enlace = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer?token=${tokenRecuperacion}`;
    enviarCorreoRecuperacion(correoNormalizado, enlace)
      .then(() => {
        console.log(`[RECUPERACION] Correo enviado para cuenta ${cuenta.id}`);
        console.log(`[RECUPERACION] Expira: ${expira.toISOString()}`);
      })
      .catch((errorCorreo) => {
        console.error(`[RECUPERACION] Falló envío para cuenta ${cuenta.id}:`, errorCorreo);
      });

    return { exito: true, encontrado: true, mensaje: 'Correo enviado. Revisa tu bandeja de entrada.' };
  } catch (error) {
    console.error('Error en solicitarRecuperacion:', error);
    return { exito: false, encontrado: false, mensaje: 'Error al procesar la solicitud. Intenta nuevamente.' };
  }
}

/**
 * Restablece la contraseña usando un token de recuperación.
 *
 * @param {string} token
 * @param {string} nuevaPassword
 * @param {string} confirmarPassword
 * @returns {Promise<Object>}
 */
async function restablecerContrasena(token, nuevaPassword, confirmarPassword) {
  try {
    // Validar inputs
    const validacion = validarRestablecimiento({ token, nuevaPassword, confirmarPassword });
    if (!validacion.valido) {
      return { exito: false, status: 400, error: 'Datos inválidos', detalles: validacion.errores };
    }

    // Buscar cuenta con token válido y no expirado
    const resultado = await ejecutarQuery(
      `SELECT id FROM cuentas
       WHERE token_recuperacion = $1
         AND token_recuperacion_expira IS NOT NULL
         AND token_recuperacion_expira > CURRENT_TIMESTAMP`,
      [token]
    );

    if (resultado.rows.length === 0) {
      return { exito: false, status: 400, error: 'El enlace de recuperación no es válido o ha expirado.' };
    }

    const cuenta = resultado.rows[0];
    const passwordHash = await hashPassword(nuevaPassword);

    await ejecutarQuery(
      `UPDATE cuentas
       SET password_hash = $1,
           token_recuperacion = NULL,
           token_recuperacion_expira = NULL,
           intentos_fallidos = 0,
           bloqueado_hasta = NULL
       WHERE id = $2`,
      [passwordHash, cuenta.id]
    );

    return { exito: true, mensaje: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' };
  } catch (error) {
    console.error('Error en restablecerContrasena:', error);
    return { exito: false, status: 500, error: 'Error al restablecer la contraseña' };
  }
}

/**
 * Genera un token JWT con rol incluido.
 *
 * @param {Object} payload - { id, username, nombre, rol }
 * @param {string} [expiracion='24h']
 * @returns {string}
 */
function generarToken(payload, expiracion = '24h') {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en las variables de entorno');
  }

  return jwt.sign(
    { id: payload.id, username: payload.username, nombre: payload.nombre, rol: payload.rol },
    process.env.JWT_SECRET,
    { expiresIn: expiracion, issuer: 'nsg-cotizacion-system' }
  );
}

/**
 * Verifica un token JWT y retorna el payload incluyendo rol.
 *
 * @param {string} token
 * @returns {Object} { valido, payload?, error? }
 */
function verificarToken(token) {
  try {
    if (!token) {
      return { valido: false, error: 'Token no proporcionado' };
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
        nombre: payload.nombre,
        rol: payload.rol || 'admin'
      }
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valido: false, error: 'Token expirado' };
    }
    if (error.name === 'JsonWebTokenError') {
      return { valido: false, error: 'Token inválido' };
    }
    return { valido: false, error: 'Error al verificar el token' };
  }
}

/**
 * Hashea contraseña con bcrypt (rondas 12).
 *
 * @param {string} password
 * @param {number} [saltRounds=12]
 * @returns {Promise<string>}
 */
async function hashPassword(password, saltRounds = SALT_ROUNDS) {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Error al hashear contraseña:', error);
    throw new Error('Error al procesar la contraseña');
  }
}

/**
 * Verifica contraseña contra hash.
 *
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
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
 * Obtiene información de una cuenta por ID.
 *
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function obtenerCuentaPorId(id) {
  try {
    const resultado = await ejecutarQuery(
      'SELECT id, username, nombre_completo, rol, created_at FROM cuentas WHERE id = $1',
      [id]
    );

    if (resultado.rows.length === 0) return null;
    return resultado.rows[0];
  } catch (error) {
    console.error('Error al obtener cuenta:', error);
    throw error;
  }
}

/**
 * Activa una Cuenta_Pendiente estableciendo username y contraseña.
 * Cambia estado de 'pendiente_activacion' a 'activa'.
 *
 * @param {Object} datos - { correo, username, password, confirmarPassword }
 * @returns {Promise<Object>}
 */
async function activarCuenta(datos) {
  try {
    const { correo, username, password } = datos;

    // 1. Validar inputs
    if (!username || username.trim().length === 0) {
      return { exito: false, status: 400, error: 'El nombre de usuario es requerido', codigo: 'USERNAME_REQUERIDO' };
    }
    if (!password || password.length < 8) {
      return { exito: false, status: 400, error: 'La contraseña debe tener al menos 8 caracteres', codigo: 'PASSWORD_INVALIDO' };
    }
    if (!correo) {
      return { exito: false, status: 400, error: 'El correo es requerido', codigo: 'CORREO_REQUERIDO' };
    }

    // 2. Buscar cuenta por correo_hash con estado='pendiente_activacion'
    const correoNormalizado = correo.trim().toLowerCase();
    const correoHash = hashBusqueda(correoNormalizado);

    const resultadoCuenta = await ejecutarQuery(
      "SELECT id, nombre_completo, rol FROM cuentas WHERE correo_hash = $1 AND estado = 'pendiente_activacion'",
      [correoHash]
    );

    if (resultadoCuenta.rows.length === 0) {
      return { exito: false, status: 404, error: 'Cuenta pendiente no encontrada para ese correo', codigo: 'CUENTA_NO_ENCONTRADA' };
    }

    const cuenta = resultadoCuenta.rows[0];

    // 3. Verificar unicidad de username
    const usernameExiste = await ejecutarQuery(
      'SELECT id FROM cuentas WHERE username = $1 AND id != $2',
      [username.trim(), cuenta.id]
    );
    if (usernameExiste.rows.length > 0) {
      return { exito: false, status: 409, error: 'El nombre de usuario ya está en uso', codigo: 'USERNAME_EN_USO' };
    }

    // 4. Hashear contraseña
    const passwordHash = await hashPassword(password);

    // 5. Activar cuenta
    await ejecutarQuery(
      `UPDATE cuentas
       SET password_hash = $1, username = $2, estado = 'activa',
           intentos_fallidos = 0, bloqueado_hasta = NULL, updated_at = NOW()
       WHERE correo_hash = $3 AND estado = 'pendiente_activacion'`,
      [passwordHash, username.trim(), correoHash]
    );

    // 6. Generar JWT y retornar
    const token = generarToken({
      id: cuenta.id,
      username: username.trim(),
      nombre: cuenta.nombre_completo,
      rol: cuenta.rol
    });

    return {
      exito: true,
      token,
      usuario: {
        id: cuenta.id,
        username: username.trim(),
        nombre: cuenta.nombre_completo,
        rol: cuenta.rol
      }
    };
  } catch (error) {
    console.error('Error en activarCuenta:', error);
    return { exito: false, status: 500, error: 'Error al activar la cuenta' };
  }
}

/**
 * Solicita recuperación de contraseña por número de teléfono.
 * Siempre retorna respuesta genérica (anti-enumeración).
 *
 * @param {string} telefono
 * @returns {Promise<Object>}
 */
async function recuperarPorTelefono(telefono) {
  // 1. Validar formato de teléfono
  if (!telefono || !/^\d{7,15}$/.test(telefono)) {
    return { exito: false, status: 400, codigo: 'TELEFONO_INVALIDO' };
  }

  try {
    // 2. Calcular hash del teléfono (mismo patrón que hashBusqueda)
    const telefonoHash = hashBusqueda(telefono);

    // 3. Buscar en cuentas por telefono_hash
    const resultado = await ejecutarQuery(
      'SELECT id, correo_encrypted FROM cuentas WHERE telefono_hash = $1',
      [telefonoHash]
    );

    if (resultado.rows.length === 0) {
      return { exito: false, encontrado: false, mensaje: 'Cuenta no encontrada.' };
    }

    const cuenta = resultado.rows[0];

    // 4. Generar token de recuperación
    const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + TOKEN_EXPIRA_MINUTOS * 60 * 1000);

    await ejecutarQuery(
      'UPDATE cuentas SET token_recuperacion = $1, token_recuperacion_expira = $2 WHERE id = $3',
      [tokenRecuperacion, expira, cuenta.id]
    );

    // 5. Desencriptar correo y enviar enlace de recuperación
    try {
      const correoDesencriptado = desencriptar(cuenta.correo_encrypted);
      const enlace = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer?token=${tokenRecuperacion}`;
      enviarCorreoRecuperacion(correoDesencriptado, enlace)
        .then(() => {
          console.log(`[RECUPERACION_TELEFONO] Correo enviado para cuenta ${cuenta.id}`);
        })
        .catch((errorCorreo) => {
          console.error(`[RECUPERACION_TELEFONO] Falló envío para cuenta ${cuenta.id}:`, errorCorreo);
        });
    } catch (errorDesencriptar) {
      console.error(`[RECUPERACION_TELEFONO] Error al desencriptar correo para cuenta ${cuenta.id}:`, errorDesencriptar);
    }

    return { exito: true, encontrado: true, mensaje: 'Correo enviado. Revisa la bandeja de entrada asociada a este número.' };
  } catch (error) {
    console.error('Error en recuperarPorTelefono:', error);
    return { exito: false, encontrado: false, mensaje: 'Error al procesar la solicitud. Intenta nuevamente.' };
  }
}

// Retrocompatibilidad
const obtenerAdministradorPorId = obtenerCuentaPorId;

module.exports = {
  login,
  registrar,
  activarCuenta,
  solicitarRecuperacion,
  recuperarPorTelefono,
  restablecerContrasena,
  generarToken,
  verificarToken,
  hashPassword,
  verificarPassword,
  obtenerCuentaPorId,
  obtenerAdministradorPorId
};
