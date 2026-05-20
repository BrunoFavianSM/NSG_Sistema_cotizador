'use strict';
/**
 * Script de limpieza post-importación:
 * 1. Limpia el artefacto "[@" del final de los nombres en BD
 * 2. Resetea a 'pendiente' los productos con ia_completado pero specs vacías
 *    (la IA los procesó con nombres truncados y devolvió null para todo)
 *
 * Uso: node scripts/limpiar-nombres-y-resetear-ia.js
 */
require('dotenv').config();
const { ejecutarQuery, pool } = require('../src/configuracion/baseDatos');

async function ejecutar() {
  try {
    console.log('=== Limpieza de nombres y reset de enriquecimiento IA ===\n');

    // 1. Limpiar artefacto "[@" del final de nombres
    const limpiezaNombres = await ejecutarQuery(`
      UPDATE productos
      SET nombre = TRIM(REGEXP_REPLACE(nombre, '\\s*\\[@*\\s*$', '', 'g'))
      WHERE nombre ~ '\\[@*\\s*$'
      RETURNING id
    `);
    console.log(`Nombres limpiados: ${limpiezaNombres.rowCount}`);

    // 2. Limpiar descripcion_general también
    const limpiezaDesc = await ejecutarQuery(`
      UPDATE productos
      SET descripcion_general = TRIM(REGEXP_REPLACE(descripcion_general, '\\s*\\[@*\\s*$', '', 'g'))
      WHERE descripcion_general ~ '\\[@*\\s*$'
      RETURNING id
    `);
    console.log(`Descripciones limpiadas: ${limpiezaDesc.rowCount}`);

    // 3. Resetear procesadores ia_completado con specs vacías
    const resetProcesador = await ejecutarQuery(`
      UPDATE productos p
      SET estado_enriquecimiento = 'pendiente'
      WHERE p.estado_enriquecimiento = 'ia_completado'
        AND p.id_categoria = (SELECT id FROM categorias WHERE nombre = 'procesador')
        AND EXISTS (
          SELECT 1 FROM specs_procesador sp
          WHERE sp.id_producto = p.id
            AND sp.socket IS NULL
            AND sp.nucleos IS NULL
            AND sp.frecuencia_base_ghz IS NULL
        )
      RETURNING p.id
    `);
    console.log(`Procesadores reseteados a pendiente: ${resetProcesador.rowCount}`);

    // 4. Resetear placa_madre ia_completado con specs vacías
    const resetMB = await ejecutarQuery(`
      UPDATE productos p
      SET estado_enriquecimiento = 'pendiente'
      WHERE p.estado_enriquecimiento = 'ia_completado'
        AND p.id_categoria = (SELECT id FROM categorias WHERE nombre = 'placa_madre')
        AND EXISTS (
          SELECT 1 FROM specs_placa_madre sp
          WHERE sp.id_producto = p.id
            AND sp.socket IS NULL
            AND sp.chipset IS NULL
        )
      RETURNING p.id
    `);
    console.log(`Placas madre reseteadas a pendiente: ${resetMB.rowCount}`);

    // 5. Resetear GPU ia_completado con specs vacías
    const resetGPU = await ejecutarQuery(`
      UPDATE productos p
      SET estado_enriquecimiento = 'pendiente'
      WHERE p.estado_enriquecimiento = 'ia_completado'
        AND p.id_categoria = (SELECT id FROM categorias WHERE nombre = 'gpu')
        AND EXISTS (
          SELECT 1 FROM specs_gpu sp
          WHERE sp.id_producto = p.id
            AND sp.chipset IS NULL
            AND sp.vram_gb IS NULL
        )
      RETURNING p.id
    `);
    console.log(`GPUs reseteadas a pendiente: ${resetGPU.rowCount}`);

    // 6. Resetear RAM ia_completado con specs vacías
    const resetRAM = await ejecutarQuery(`
      UPDATE productos p
      SET estado_enriquecimiento = 'pendiente'
      WHERE p.estado_enriquecimiento = 'ia_completado'
        AND p.id_categoria = (SELECT id FROM categorias WHERE nombre = 'ram')
        AND EXISTS (
          SELECT 1 FROM specs_ram sp
          WHERE sp.id_producto = p.id
            AND sp.ram_tipo IS NULL
            AND sp.capacidad_gb IS NULL
        )
      RETURNING p.id
    `);
    console.log(`RAMs reseteadas a pendiente: ${resetRAM.rowCount}`);

    // 7. Resetear fuente ia_completado con specs vacías
    const resetFuente = await ejecutarQuery(`
      UPDATE productos p
      SET estado_enriquecimiento = 'pendiente'
      WHERE p.estado_enriquecimiento = 'ia_completado'
        AND p.id_categoria = (SELECT id FROM categorias WHERE nombre = 'fuente')
        AND EXISTS (
          SELECT 1 FROM specs_fuente sp
          WHERE sp.id_producto = p.id
            AND sp.wattage IS NULL
        )
      RETURNING p.id
    `);
    console.log(`Fuentes reseteadas a pendiente: ${resetFuente.rowCount}`);

    // 8. Resetear case ia_completado con specs vacías
    const resetCase = await ejecutarQuery(`
      UPDATE productos p
      SET estado_enriquecimiento = 'pendiente'
      WHERE p.estado_enriquecimiento = 'ia_completado'
        AND p.id_categoria = (SELECT id FROM categorias WHERE nombre = 'case')
        AND EXISTS (
          SELECT 1 FROM specs_case sp
          WHERE sp.id_producto = p.id
            AND sp.form_factor IS NULL
        )
      RETURNING p.id
    `);
    console.log(`Cases reseteados a pendiente: ${resetCase.rowCount}`);

    // Resumen final
    const resumen = await ejecutarQuery(`
      SELECT estado_enriquecimiento, COUNT(*)::int as total
      FROM productos
      GROUP BY estado_enriquecimiento
      ORDER BY total DESC
    `);
    console.log('\n=== Estado final en BD ===');
    resumen.rows.forEach(r => console.log(' ', r.estado_enriquecimiento, ':', r.total));

    console.log('\nListo. Reinicia el servidor para que reactivarDesdeDB() encole los pendientes.');

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

ejecutar();
