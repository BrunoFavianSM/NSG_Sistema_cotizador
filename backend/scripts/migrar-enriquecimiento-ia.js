/**
 * Migración: enriquecimiento-ia
 *
 * Agrega la columna `estado_enriquecimiento` a la tabla `productos` y crea
 * el índice correspondiente para optimizar consultas de filtrado por estado.
 *
 * Uso (desde el directorio backend/):
 *   node scripts/migrar-enriquecimiento-ia.js
 *
 * Requisitos: 3.1, Restricción BD 4, Restricción BD 5
 */

require('dotenv').config();
const { ejecutarQuery, pool } = require('../src/configuracion/baseDatos');

async function ejecutarMigracion() {
  try {
    console.log('Iniciando migración: estado_enriquecimiento en productos...');

    // Agregar columna estado_enriquecimiento con CHECK constraint (idempotente)
    const resultadoColumna = await ejecutarQuery(`
      ALTER TABLE productos
        ADD COLUMN IF NOT EXISTS estado_enriquecimiento VARCHAR(20)
          NOT NULL DEFAULT 'no_aplica'
          CHECK (estado_enriquecimiento IN ('csv', 'ia_completado', 'ia_fallido', 'pendiente', 'no_aplica'))
    `);
    console.log('  ✓ Columna estado_enriquecimiento agregada (o ya existía).');
    console.log('    Resultado:', resultadoColumna.command);

    // Crear índice para filtrado eficiente por estado (idempotente)
    const resultadoIndice = await ejecutarQuery(`
      CREATE INDEX IF NOT EXISTS idx_productos_estado_enriquecimiento
        ON productos(estado_enriquecimiento)
    `);
    console.log('  ✓ Índice idx_productos_estado_enriquecimiento creado (o ya existía).');
    console.log('    Resultado:', resultadoIndice.command);

    console.log('Migración estado_enriquecimiento completada correctamente.');
  } catch (error) {
    console.error('Error al ejecutar migración estado_enriquecimiento:', error.message);
    process.exit(1);
  } finally {
    // Cerrar el pool para que el proceso termine limpiamente
    await pool.end().catch(() => {});
  }
}

ejecutarMigracion();
