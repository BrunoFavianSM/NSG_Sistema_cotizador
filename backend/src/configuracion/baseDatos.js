const { Pool } = require('pg');

// SEGURIDAD: en producción no se permiten credenciales por defecto.
if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD es obligatoria en producción (no se permiten credenciales por defecto)');
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nsg_cotizaciones',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // TLS hacia PostgreSQL para despliegues no locales (DB_SSL=true)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
});

pool.on('connect', () => console.log('Conectado a PostgreSQL'));
pool.on('error', (err) => {
  console.error('Error en PostgreSQL:', err);
  process.exit(-1);
});

const ejecutarQuery = async (texto, parametros) => {
  const inicio = Date.now();
  try {
    const resultado = await pool.query(texto, parametros);
    const duracion = Date.now() - inicio;
    if (duracion > 1000) {
      console.warn(`Query lenta (${duracion}ms):`, texto);
    }
    return resultado;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
};

const ejecutarTransaccion = async (callback) => {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await callback(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
};

module.exports = { pool, ejecutarQuery, ejecutarTransaccion };
