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
    console.log('Iniciando migracion Fase 1 Finanzas...');
    await client.query('BEGIN');

    await client.query(`
      INSERT INTO configuracion (clave, valor, descripcion)
      VALUES
        ('margen_ganancia_default', '20', 'Porcentaje de margen por defecto para cotizaciones'),
        ('tasa_igv', '18', 'Porcentaje de IGV aplicado al precio neto'),
        ('tipo_cambio_usd_pen', '3.75', 'Tipo de cambio referencial USD a PEN')
      ON CONFLICT (clave) DO NOTHING
    `);

    await client.query(`ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS moneda_base VARCHAR(3) NOT NULL DEFAULT 'USD'`);
    await client.query(`ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS subtotal_neto DECIMAL(12, 2) NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS igv_porcentaje DECIMAL(5, 2) NOT NULL DEFAULT 18`);
    await client.query(`ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS igv_monto DECIMAL(12, 2) NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS total_con_igv DECIMAL(12, 2) NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS tipo_cambio_referencia DECIMAL(10, 4) NOT NULL DEFAULT 3.75`);
    await client.query(`ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS subtotal_neto_pen DECIMAL(12, 2) NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS igv_monto_pen DECIMAL(12, 2) NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS total_con_igv_pen DECIMAL(12, 2) NOT NULL DEFAULT 0`);

    await client.query(`ALTER TABLE detalle_cotizacion ADD COLUMN IF NOT EXISTS costo_unitario_neto_usd DECIMAL(12, 2) NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE detalle_cotizacion ADD COLUMN IF NOT EXISTS margen_aplicado DECIMAL(5, 2) NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE detalle_cotizacion ADD COLUMN IF NOT EXISTS precio_unitario_neto_usd DECIMAL(12, 2) NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE detalle_cotizacion ADD COLUMN IF NOT EXISTS igv_unitario_usd DECIMAL(12, 2) NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE detalle_cotizacion ADD COLUMN IF NOT EXISTS precio_unitario_total_usd DECIMAL(12, 2) NOT NULL DEFAULT 0`);

    await client.query(`
      UPDATE cotizaciones
      SET
        subtotal_neto = COALESCE(NULLIF(subtotal_neto, 0), precio_total),
        igv_porcentaje = COALESCE(NULLIF(igv_porcentaje, 0), (SELECT valor::DECIMAL FROM configuracion WHERE clave = 'tasa_igv' LIMIT 1), 18),
        total_con_igv = COALESCE(NULLIF(total_con_igv, 0), precio_total),
        tipo_cambio_referencia = COALESCE(NULLIF(tipo_cambio_referencia, 0), (SELECT valor::DECIMAL FROM configuracion WHERE clave = 'tipo_cambio_usd_pen' LIMIT 1), 3.75),
        subtotal_neto_pen = COALESCE(NULLIF(subtotal_neto_pen, 0), subtotal_neto * tipo_cambio_referencia),
        igv_monto_pen = COALESCE(NULLIF(igv_monto_pen, 0), igv_monto * tipo_cambio_referencia),
        total_con_igv_pen = COALESCE(NULLIF(total_con_igv_pen, 0), total_con_igv * tipo_cambio_referencia)
    `);

    await client.query(`
      UPDATE detalle_cotizacion
      SET
        costo_unitario_neto_usd = COALESCE(NULLIF(costo_unitario_neto_usd, 0), precio_unitario),
        precio_unitario_neto_usd = COALESCE(NULLIF(precio_unitario_neto_usd, 0), precio_unitario),
        precio_unitario_total_usd = COALESCE(NULLIF(precio_unitario_total_usd, 0), precio_unitario)
    `);

    await client.query(`UPDATE cotizaciones SET precio_total = total_con_igv WHERE total_con_igv > 0`);
    await client.query(`UPDATE detalle_cotizacion SET precio_unitario = precio_unitario_total_usd WHERE precio_unitario_total_usd > 0`);

    await client.query('COMMIT');
    console.log('Migracion completada correctamente.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error al ejecutar migracion Fase 1 Finanzas:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

ejecutarMigracion();
