/**
 * Script para crear un usuario administrador.
 * Uso: node scripts/crear-admin.js [username] [password] [nombre] [correo] [telefono]
 *
 * Si se pasan todos los argumentos, no pregunta por consola (modo CI).
 * Si falta alguno, pregunta interactivamente.
 *
 * Inserta en la tabla `cuentas` con rol='admin' y estado='activa',
 * encriptando correo/teléfono y hasheando el password igual que el backend.
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nsg_cotizaciones',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

function hashBusqueda(texto) {
  const claveHex = process.env.ENCRYPTION_KEY;
  if (!claveHex) throw new Error('ENCRYPTION_KEY no está definida en .env');
  return crypto
    .createHmac('sha256', Buffer.from(claveHex, 'hex'))
    .update(texto.toLowerCase().trim())
    .digest('hex');
}

function encriptar(texto) {
  const clave = process.env.ENCRYPTION_KEY;
  if (!clave) throw new Error('ENCRYPTION_KEY no está definida en .env');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(clave, 'hex'),
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
    if (!wasRaw) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let buffer = '';
    const onData = (char) => {
      const c = char.toString();
      if (c === '\n' || c === '\r' || c === '') {
        stdin.removeListener('data', onData);
        if (!wasRaw) stdin.setRawMode(false);
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
  const errU = validarUsername(username);
  if (errU) throw new Error(errU);

  const nombre = await pregunta('Nombre completo: ');
  const errN = validarNombre(nombre);
  if (errN) throw new Error(errN);

  const correo = await pregunta('Correo (opcional, Enter para omitir): ');
  const errC = validarCorreo(correo);
  if (errC) throw new Error(errC);

  const telefono = await pregunta('Teléfono (opcional, Enter para omitir): ');
  const errT = validarTelefono(telefono);
  if (errT) throw new Error(errT);

  const password = await preguntaSecreta('Password (mínimo 8 caracteres): ');
  if (password.length < 8)
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  const confirmar = await preguntaSecreta('Confirma el password: ');
  if (password !== confirmar) throw new Error('Las contraseñas no coinciden');

  return { username, nombre, correo, telefono, password };
}

async function crearAdmin() {
  let datos;
  try {
    const [, , usernameArg, passwordArg, nombreArg, correoArg, telefonoArg] =
      process.argv;

    if (usernameArg && passwordArg && nombreArg) {
      datos = {
        username: usernameArg,
        password: passwordArg,
        nombre: nombreArg,
        correo: correoArg || '',
        telefono: telefonoArg || '',
      };
    } else {
      process.stdin.setEncoding('utf8');
      process.stdin.resume();
      datos = await pedirDatosInteractivo();
    }

    const { username, password, nombre, correo, telefono } = datos;

    const errU = validarUsername(username);
    if (errU) throw new Error(errU);
    const errN = validarNombre(nombre);
    if (errN) throw new Error(errN);
    const errC = validarCorreo(correo);
    if (errC) throw new Error(errC);
    const errT = validarTelefono(telefono);
    if (errT) throw new Error(errT);
    if (password.length < 8)
      throw new Error('La contraseña debe tener al menos 8 caracteres');

    const existente = await yaExiste(username, correo || null);
    if (existente)
      throw new Error(
        `Ya existe una cuenta con username "${existente.username}" (id=${existente.id})`
      );

    console.log('\n⏳ Creando administrador...');

    const passwordHash = await bcrypt.hash(password, 10);
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
    if (correo) console.log('  Correo:', correo);
    if (telefono) console.log('  Teléfono:', telefono);
    console.log('  Rol: admin');
    console.log('  Estado: activa');
    console.log('\n⚠️  Guarda estas credenciales en un lugar seguro');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

crearAdmin();
