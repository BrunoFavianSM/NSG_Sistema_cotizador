require('dotenv').config();
const { Client } = require('pg');

async function ejecutarMigracion() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'nsg_cotizaciones',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    await client.connect();
    console.log('Iniciando migración: productos_favoritos...');
    await client.query('BEGIN');

    // Crear tabla productos_favoritos (idempotente con IF NOT EXISTS)
    await client.query(`
      CREATE TABLE IF NOT EXISTS productos_favoritos (
        id             SERIAL PRIMARY KEY,
        id_usuario     INTEGER NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
        id_producto    INTEGER NOT NULL,
        tabla_producto VARCHAR(60) NOT NULL,
        fecha_agregado TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_favorito_usuario_producto UNIQUE (id_usuario, id_producto, tabla_producto)
      )
    `);
    console.log('  ✓ Tabla productos_favoritos creada (o ya existía).');

    // Índice en id_usuario para consultas de favoritos por usuario
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_favoritos_usuario
        ON productos_favoritos (id_usuario)
    `);
    console.log('  ✓ Índice idx_favoritos_usuario creado (o ya existía).');

    await client.query('COMMIT');
    console.log('Migración productos_favoritos completada correctamente.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error al ejecutar migración productos_favoritos:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

ejecutarMigracion();
