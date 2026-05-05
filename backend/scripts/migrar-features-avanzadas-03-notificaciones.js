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
    console.log('Iniciando migración: notificaciones_usuario...');
    await client.query('BEGIN');

    // Crear tabla notificaciones_usuario (idempotente con IF NOT EXISTS)
    await client.query(`
      CREATE TABLE IF NOT EXISTS notificaciones_usuario (
        id             SERIAL PRIMARY KEY,
        id_usuario     INTEGER NOT NULL REFERENCES usuarios_clientes(id) ON DELETE CASCADE,
        tipo           VARCHAR(50) NOT NULL,
        titulo         VARCHAR(200) NOT NULL,
        mensaje        TEXT NOT NULL,
        leida          BOOLEAN NOT NULL DEFAULT FALSE,
        fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        datos_extra    JSONB
      )
    `);
    console.log('  ✓ Tabla notificaciones_usuario creada (o ya existía).');

    // Índice parcial en notificaciones no leídas — optimiza el polling cada 30s
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_pendientes
        ON notificaciones_usuario (id_usuario, leida, fecha_creacion DESC)
        WHERE leida = FALSE
    `);
    console.log('  ✓ Índice idx_notificaciones_usuario_pendientes creado (o ya existía).');

    await client.query('COMMIT');
    console.log('Migración notificaciones_usuario completada correctamente.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error al ejecutar migración notificaciones_usuario:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

ejecutarMigracion();
