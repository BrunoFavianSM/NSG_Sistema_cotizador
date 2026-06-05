/**
 * Script para crear usuario administrador
 * Uso: node scripts/crear-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const readline = require('readline');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nsg_cotizaciones',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(texto) {
  return new Promise((resolve) => {
    rl.question(texto, resolve);
  });
}

async function crearAdmin() {
  try {
    console.log('=== Crear Usuario Administrador ===\n');
    
    const username = await pregunta('Username: ');
    const password = await pregunta('Password: ');
    const nombreCompleto = await pregunta('Nombre completo: ');
    
    if (!username || !password || !nombreCompleto) {
      console.error('❌ Todos los campos son requeridos');
      process.exit(1);
    }
    
    if (password.length < 8) {
      console.error('❌ La contraseña debe tener al menos 8 caracteres');
      process.exit(1);
    }
    
    console.log('\n⏳ Creando administrador...');
    
    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insertar en base de datos (tabla cuentas con rol admin)
    const resultado = await pool.query(
      'INSERT INTO cuentas (username, password_hash, nombre_completo, rol, estado) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, passwordHash, nombreCompleto, 'admin', 'activa']
    );
    
    console.log('\n✓ Administrador creado exitosamente');
    console.log('ID:', resultado.rows[0].id);
    console.log('Username:', username);
    console.log('Nombre:', nombreCompleto);
    console.log('Rol: admin');
    console.log('Estado: activa');
    console.log('\n⚠️  Guarda estas credenciales en un lugar seguro');
    
  } catch (error) {
    if (error.code === '23505') {
      console.error('\n❌ Error: El username ya existe');
    } else {
      console.error('\n❌ Error al crear administrador:', error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
    pool.end();
  }
}

crearAdmin();
