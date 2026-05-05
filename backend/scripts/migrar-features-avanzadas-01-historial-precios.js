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
    console.log('Iniciando migración: historial_precios_producto...');
    await client.query('BEGIN');

    // Crear tabla historial_precios_producto (idempotente con IF NOT EXISTS)
    await client.query(`
      CREATE TABLE IF NOT EXISTS historial_precios_producto (
        id               SERIAL PRIMARY KEY,
        id_producto      INTEGER NOT NULL,
        tabla_producto   VARCHAR(60) NOT NULL,
        precio_anterior  DECIMAL(12, 2) NOT NULL,
        precio_nuevo     DECIMAL(12, 2) NOT NULL,
        fecha_cambio     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        id_usuario_admin INTEGER REFERENCES cuentas(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✓ Tabla historial_precios_producto creada (o ya existía).');

    // Índice en (id_producto, tabla_producto) para consultas por producto
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_historial_precios_id_producto
        ON historial_precios_producto (id_producto, tabla_producto)
    `);
    console.log('  ✓ Índice idx_historial_precios_id_producto creado (o ya existía).');

    // Índice en fecha_cambio DESC para ordenamiento eficiente
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_historial_precios_fecha
        ON historial_precios_producto (fecha_cambio DESC)
    `);
    console.log('  ✓ Índice idx_historial_precios_fecha creado (o ya existía).');

    await client.query('COMMIT');
    console.log('Migración historial_precios_producto completada correctamente.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error al ejecutar migración historial_precios_producto:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

ejecutarMigracion();
