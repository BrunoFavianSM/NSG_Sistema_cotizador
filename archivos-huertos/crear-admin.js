/**
 * Script de bootstrap: crear la PRIMERA cuenta administradora.
 *
 * Uso (desde la raíz del proyecto):
 *   node archivos-huertos/crear-admin.js
 *
 * Modos de entrada (en orden de prioridad):
 *   1. Variables de entorno: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_NOMBRE,
 *      ADMIN_CORREO (opcional), ADMIN_TELEFONO (opcional)
 *   2. Prompt interactivo (la contraseña no se muestra en pantalla)
 *
 * Reglas de seguridad:
 *   - Se niega a correr si ya existe una cuenta con rol 'admin'
 *     (usar --otro-admin para crear administradores adicionales).
 *   - No acepta credenciales por argumentos de línea de comandos
 *     (quedarían en el historial del shell).
 *   - Hashea con bcryptjs y 12 rounds, igual que el backend.
 *   - Encripta correo/teléfono con ENCRYPTION_KEY, igual que el backend.
 *
 * Lee la configuración de backend/.env (DB_*, ENCRYPTION_KEY).
 */

const path = require('path');
const crypto = require('crypto');

// Las dependencias (dotenv, bcryptjs, pg) viven en backend/node_modules;
// este script está fuera de backend/ a propósito, así que se resuelven desde ahí.
const backendDir = path.resolve(__dirname, '..', 'backend');
const requireBackend = (modulo) =>
  require(require.resolve(modulo, { paths: [backendDir] }));

requireBackend('dotenv').config({ path: path.join(backendDir, '.env') });
const bcrypt = requireBackend('bcryptjs');
const { Pool } = requireBackend('pg');

const SALT_ROUNDS = 12; // debe coincidir con backend/src/servicios/servicioAuth.js

function abortar(mensaje) {
  console.error(`\n❌ ${mensaje}`);
  process.exit(1);
}

// Configuración de BD sin fallbacks inseguros: todo debe venir del .env
for (const variable of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'ENCRYPTION_KEY']) {
  if (!process.env[variable]) {
    abortar(`Falta la variable ${variable} en backend/.env`);
  }
}

if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENCRYPTION_KEY)) {
  abortar('ENCRYPTION_KEY debe ser de 64 caracteres hexadecimales (32 bytes)');
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

function hashBusqueda(texto) {
  return crypto
    .createHmac('sha256', Buffer.from(process.env.ENCRYPTION_KEY, 'hex'))
    .update(texto.toLowerCase().trim())
    .digest('hex');
}

function encriptar(texto) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
    iv
  );
  let encriptado = cipher.update(texto, 'utf8', 'hex');
  encriptado += cipher.final('hex');
  return `${iv.toString('hex')}:${encriptado}`;
}

function validarUsername(username) {
  if (!username) return 'El username es obligatorio';
  if (username.length < 3) return 'El username debe tener al menos 3 caracteres';
  if (username.length > 50) return 'El username no puede tener más de 50 caracteres';
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return 'El username solo puede tener letras, números y guiones bajos';
  return null;
}

function validarNombre(nombre) {
  if (!nombre) return 'El nombre completo es obligatorio';
  if (nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (nombre.length > 100) return 'El nombre no puede tener más de 100 caracteres';
  return null;
}

function validarCorreo(correo) {
  if (!correo) return null;
  if (correo.length > 150) return 'El correo es demasiado largo';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
    return 'Formato de correo inválido';
  return null;
}

function validarTelefono(telefono) {
  if (!telefono) return null;
  const limpio = telefono.replace(/[\s+\-()]/g, '');
  if (!/^\d{7,15}$/.test(limpio))
    return 'El teléfono debe tener entre 7 y 15 dígitos numéricos';
  return null;
}

function validarPassword(password) {
  if (!password || password.length < 10)
    return 'La contraseña debe tener al menos 10 caracteres';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password))
    return 'La contraseña debe incluir mayúsculas, minúsculas y números';
  return null;
}

async function existeAdmin() {
  const result = await pool.query(
    "SELECT id, username FROM cuentas WHERE rol = 'admin' LIMIT 1"
  );
  return result.rows[0] || null;
}

async function yaExiste(username, correo) {
  const condiciones = ['username = $1'];
  const params = [username];
  if (correo) {
    condiciones.push('correo_hash = $2');
    params.push(hashBusqueda(correo));
  }
  const result = await pool.query(
    `SELECT id, username FROM cuentas WHERE ${condiciones.join(' OR ')}`,
    params
  );
  return result.rows[0] || null;
}

async function pregunta(texto) {
  process.stdout.write(texto);
  return new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

async function preguntaSecreta(texto) {
  process.stdout.write(texto);
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    if (!wasRaw && stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let buffer = '';
    const onData = (char) => {
      const c = char.toString();
      if (c === '\n' || c === '\r' || c === '') {
        stdin.removeListener('data', onData);
        if (!wasRaw && stdin.setRawMode) stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write('\n');
        resolve(buffer);
      } else if (c === '' || c === '\b') {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (c >= ' ') {
        buffer += c;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

async function pedirDatosInteractivo() {
  const username = await pregunta('Username (solo letras, números y _): ');
  const nombre = await pregunta('Nombre completo: ');
  const correo = await pregunta('Correo (opcional, Enter para omitir): ');
  const telefono = await pregunta('Teléfono (opcional, Enter para omitir): ');
  const password = await preguntaSecreta('Password (mín. 10, mayús/minús/número): ');
  const confirmar = await preguntaSecreta('Confirma el password: ');
  if (password !== confirmar) throw new Error('Las contraseñas no coinciden');
  return { username, nombre, correo, telefono, password };
}

function leerDatosDesdeEnv() {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_NOMBRE } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_NOMBRE) return null;
  return {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
    nombre: ADMIN_NOMBRE,
    correo: process.env.ADMIN_CORREO || '',
    telefono: process.env.ADMIN_TELEFONO || '',
  };
}

async function crearAdmin() {
  try {
    console.log('=== Bootstrap de cuenta administradora ===\n');

    const adminExistente = await existeAdmin();
    const permitirAdicional = process.argv.includes('--otro-admin');
    if (adminExistente && !permitirAdicional) {
      abortar(
        `Ya existe un administrador ("${adminExistente.username}", id=${adminExistente.id}).\n` +
        '   Si realmente necesitas otro, vuelve a ejecutar con --otro-admin.'
      );
    }

    let datos = leerDatosDesdeEnv();
    if (!datos) {
      process.stdin.setEncoding('utf8');
      process.stdin.resume();
      datos = await pedirDatosInteractivo();
    }

    const { username, password, nombre, correo, telefono } = datos;

    for (const error of [
      validarUsername(username),
      validarNombre(nombre),
      validarCorreo(correo),
      validarTelefono(telefono),
      validarPassword(password),
    ]) {
      if (error) throw new Error(error);
    }

    const existente = await yaExiste(username, correo || null);
    if (existente)
      throw new Error(
        `Ya existe una cuenta con username "${existente.username}" (id=${existente.id})`
      );

    console.log('\n⏳ Creando administrador...');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const correoEncrypted = correo ? encriptar(correo) : null;
    const correoHash = correo ? hashBusqueda(correo) : null;
    const telefonoEncrypted = telefono ? encriptar(telefono) : null;
    const telefonoHash = telefono ? hashBusqueda(telefono) : null;

    const resultado = await pool.query(
      `INSERT INTO cuentas
        (username, password_hash, correo_encrypted, correo_hash,
         nombre_completo, telefono_encrypted, telefono_hash, rol, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'admin', 'activa')
       RETURNING id`,
      [
        username,
        passwordHash,
        correoEncrypted,
        correoHash,
        nombre,
        telefonoEncrypted,
        telefonoHash,
      ]
    );

    console.log('\n✓ Administrador creado exitosamente');
    console.log('  ID:', resultado.rows[0].id);
    console.log('  Username:', username);
    console.log('  Nombre:', nombre);
    console.log('  Rol: admin / Estado: activa');
    console.log('\n⚠️  Guarda las credenciales en un gestor de contraseñas seguro.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

crearAdmin();
