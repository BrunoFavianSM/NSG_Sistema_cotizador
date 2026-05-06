/**
 * Migrador 005 — Unificación usuarios_clientes → cuentas
 *
 * Uso:
 *   node migrar-005-unificar-usuarios.js
 *   node migrar-005-unificar-usuarios.js --rollback
 *   node migrar-005-unificar-usuarios.js --confirmar-produccion  (entorno prod)
 *
 * Pasos:
 *   1. Contar filas en usuarios_clientes
 *   2. Por cada fila en usuarios_clientes:
 *      a. Si correo_hash ya existe en cuentas → registrar mapeo id_uc → id_cuenta
 *      b. Si no existe → INSERT en cuentas con estado='pendiente_activacion'
 *   3. UPDATE cotizaciones SET id_cliente = nuevo_id WHERE id_cliente = id_uc_original
 *   4. Verificar conteo: filas migradas == filas originales
 *   5. Cambiar FK cotizaciones.id_cliente → cuentas(id)
 *   6. Renombrar usuarios_clientes → usuarios_clientes_deprecated + agregar COMMENT con fecha
 *   7. Verificar que ninguna FK activa apunte a usuarios_clientes_deprecated
 */

/**
 * Ejecuta la migración completa dentro de la transacción provista por `cliente`.
 * El llamador es responsable de BEGIN / COMMIT / ROLLBACK.
 *
 * @param {import('pg').PoolClient | import('pg').Client} cliente - Conexión pg activa
 * @returns {Promise<void>}
 */
async function migrar(cliente) {
  // ─────────────────────────────────────────────────────────────────────────────
  // Paso 1: contar filas en usuarios_clientes
  // ─────────────────────────────────────────────────────────────────────────────
  const { rows: [{ total }] } = await cliente.query(
    'SELECT COUNT(*) AS total FROM usuarios_clientes'
  );
  const totalOriginal = Number(total);
  console.log(`[005] Clientes a migrar: ${totalOriginal}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // Paso 2: migrar filas de usuarios_clientes → cuentas
  // ─────────────────────────────────────────────────────────────────────────────
  const { rows: clientesOriginales } = await cliente.query(
    'SELECT id, nombre, correo, correo_hash, telefono FROM usuarios_clientes ORDER BY id'
  );

  /** @type {Map<number, number>} Mapeo id_usuarios_clientes → id_cuentas */
  const mapaIds = new Map();
  /** @type {Set<number>} IDs de cuentas recién insertadas (no reutilizadas) */
  const idsInsertados = new Set();

  for (const uc of clientesOriginales) {
    // Verificar si correo_hash ya existe en cuentas (req. 2.6)
    const { rows: existente } = await cliente.query(
      'SELECT id FROM cuentas WHERE correo_hash = $1',
      [uc.correo_hash]
    );

    if (existente.length > 0) {
      // Reutilizar cuenta existente — no duplicar (req. 2.6)
      mapaIds.set(uc.id, existente[0].id);
      console.log(`[005]   Correo ya existe en cuentas → reutilizando id=${existente[0].id} (uc.id=${uc.id})`);
    } else {
      // Generar username único: 'guest_' + primeros 16 chars del correo_hash (req. 2.2)
      const username = uc.correo_hash
        ? `guest_${uc.correo_hash.substring(0, 16)}`
        : null;

      const { rows: [nueva] } = await cliente.query(
        `INSERT INTO cuentas
           (username, password_hash, correo_encrypted, correo_hash,
            nombre_completo, telefono_encrypted, rol, estado, created_at, updated_at)
         VALUES ($1, NULL, $2, $3, $4, $5, 'usuario', 'pendiente_activacion', NOW(), NOW())
         RETURNING id`,
        [
          username,
          uc.correo,
          uc.correo_hash,
          uc.nombre || 'Cliente',
          uc.telefono || null
        ]
      );
      mapaIds.set(uc.id, nueva.id);
      idsInsertados.add(nueva.id);
      console.log(`[005]   Insertado en cuentas: id=${nueva.id}, username=${username} (uc.id=${uc.id})`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Paso 3: redirigir cotizaciones.id_cliente al nuevo id en cuentas (req. 2.3)
  // ─────────────────────────────────────────────────────────────────────────────
  let cotizacionesActualizadas = 0;
  for (const [idUc, idCuenta] of mapaIds) {
    const resultado = await cliente.query(
      'UPDATE cotizaciones SET id_cliente = $1 WHERE id_cliente = $2',
      [idCuenta, idUc]
    );
    cotizacionesActualizadas += resultado.rowCount || 0;
  }
  console.log(`[005] Cotizaciones redirigidas: ${cotizacionesActualizadas}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // Paso 4: verificar conteo — filas insertadas == filas originales sin duplicado (req. 2.4)
  // Los clientes cuyo correo_hash ya existía en cuentas fueron reutilizados (no insertados).
  // La verificación correcta es: insertados + reutilizados == totalOriginal
  // ─────────────────────────────────────────────────────────────────────────────
  const totalMapeados = mapaIds.size; // debe ser igual a totalOriginal
  if (totalMapeados !== totalOriginal) {
    throw new Error(
      `[005] Verificación fallida: se esperaban ${totalOriginal} clientes mapeados, ` +
      `pero solo se mapearon ${totalMapeados}. Revirtiendo.`
    );
  }
  console.log(
    `[005] Verificación OK: ${totalOriginal} originales → ` +
    `${idsInsertados.size} insertados + ${totalOriginal - idsInsertados.size} reutilizados`
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Paso 5: cambiar FK cotizaciones.id_cliente → cuentas(id) (req. 3.1)
  // ─────────────────────────────────────────────────────────────────────────────
  await cliente.query(`
    ALTER TABLE cotizaciones
      DROP CONSTRAINT IF EXISTS cotizaciones_id_cliente_fkey
  `);
  await cliente.query(`
    ALTER TABLE cotizaciones
      ADD CONSTRAINT cotizaciones_id_cliente_fkey
      FOREIGN KEY (id_cliente) REFERENCES cuentas(id) ON DELETE SET NULL
  `);
  console.log('[005] FK cotizaciones.id_cliente → cuentas(id) actualizada.');

  // ─────────────────────────────────────────────────────────────────────────────
  // Paso 6: renombrar usuarios_clientes → usuarios_clientes_deprecated (req. 9.1, 9.2)
  // ─────────────────────────────────────────────────────────────────────────────
  await cliente.query(
    'ALTER TABLE usuarios_clientes RENAME TO usuarios_clientes_deprecated'
  );

  const fechaDeprecacion = new Date().toISOString().split('T')[0];
  await cliente.query(`
    COMMENT ON TABLE usuarios_clientes_deprecated IS
    'DEPRECADA ${fechaDeprecacion} — migrada a tabla cuentas (migración 005). No usar en código nuevo.'
  `);
  console.log(`[005] Tabla renombrada a usuarios_clientes_deprecated (${fechaDeprecacion}).`);

  // ─────────────────────────────────────────────────────────────────────────────
  // Paso 7: verificar que ninguna FK activa apunte a usuarios_clientes_deprecated (req. 9.3)
  // ─────────────────────────────────────────────────────────────────────────────
  const { rows: fksActivas } = await cliente.query(`
    SELECT conname, conrelid::regclass AS tabla_origen
    FROM pg_constraint
    WHERE confrelid = 'usuarios_clientes_deprecated'::regclass
      AND contype = 'f'
  `);

  if (fksActivas.length > 0) {
    const detalle = fksActivas.map(r => `${r.conname} (desde ${r.tabla_origen})`).join(', ');
    throw new Error(
      `[005] FKs activas apuntan a usuarios_clientes_deprecated: ${detalle}. ` +
      'Actualiza esas tablas antes de completar la migración.'
    );
  }
  console.log('[005] Verificación FK: ninguna FK activa apunta a usuarios_clientes_deprecated. ✓');
  console.log('[005] Migración 005 completada exitosamente.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Función rollback — restaura el estado previo a la migración (req. 2.5, 9.4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Revierte la migración 005 dentro de la transacción provista por `cliente`.
 * El llamador es responsable de BEGIN / COMMIT / ROLLBACK.
 *
 * Pasos:
 *   1. Restaurar la tabla usuarios_clientes_deprecated → usuarios_clientes (si existe)
 *   2. Restaurar la FK cotizaciones.id_cliente → usuarios_clientes
 *   3. Redirigir cotizaciones.id_cliente de vuelta a los ids de usuarios_clientes
 *   4. Eliminar las filas en cuentas insertadas por la migración
 *      (estado='pendiente_activacion' y username LIKE 'guest_%')
 *
 * @param {import('pg').PoolClient | import('pg').Client} cliente - Conexión pg activa
 * @returns {Promise<void>}
 */
async function rollback(cliente) {
  console.log('[005-rollback] Iniciando rollback de migración 005...');

  // ─────────────────────────────────────────────────────────────────────────────
  // Paso 1: Restaurar tabla usuarios_clientes_deprecated → usuarios_clientes
  // ─────────────────────────────────────────────────────────────────────────────
  const { rows: tablaDeprecada } = await cliente.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'usuarios_clientes_deprecated'
  `);

  if (tablaDeprecada.length > 0) {
    await cliente.query(
      'ALTER TABLE usuarios_clientes_deprecated RENAME TO usuarios_clientes'
    );
    console.log('[005-rollback] Tabla usuarios_clientes_deprecated renombrada de vuelta a usuarios_clientes.');
  } else {
    console.log('[005-rollback] Tabla usuarios_clientes_deprecated no existe — omitiendo renombrado.');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Paso 2: Restaurar FK cotizaciones.id_cliente → usuarios_clientes (si la tabla existe)
  // ─────────────────────────────────────────────────────────────────────────────
  const { rows: tablaUc } = await cliente.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'usuarios_clientes'
  `);

  if (tablaUc.length > 0) {
    // Redirigir cotizaciones: buscar filas en cuentas guest_ y mapear de vuelta a usuarios_clientes
    // Obtener todos los clientes en usuarios_clientes con su correo_hash
    const { rows: clientesUc } = await cliente.query(
      'SELECT id, correo_hash FROM usuarios_clientes ORDER BY id'
    );

    let cotizacionesRestauradas = 0;
    for (const uc of clientesUc) {
      // Buscar la cuenta correspondiente en cuentas por correo_hash
      const { rows: cuentaCorrespondiente } = await cliente.query(
        "SELECT id FROM cuentas WHERE correo_hash = $1 AND estado = 'pendiente_activacion' AND username LIKE 'guest_%'",
        [uc.correo_hash]
      );

      if (cuentaCorrespondiente.length > 0) {
        const resultado = await cliente.query(
          'UPDATE cotizaciones SET id_cliente = $1 WHERE id_cliente = $2',
          [uc.id, cuentaCorrespondiente[0].id]
        );
        cotizacionesRestauradas += resultado.rowCount || 0;
      }
    }
    console.log(`[005-rollback] Cotizaciones restauradas a usuarios_clientes: ${cotizacionesRestauradas}`);

    // Restaurar FK cotizaciones.id_cliente → usuarios_clientes
    await cliente.query(`
      ALTER TABLE cotizaciones
        DROP CONSTRAINT IF EXISTS cotizaciones_id_cliente_fkey
    `);
    await cliente.query(`
      ALTER TABLE cotizaciones
        ADD CONSTRAINT cotizaciones_id_cliente_fkey
        FOREIGN KEY (id_cliente) REFERENCES usuarios_clientes(id) ON DELETE SET NULL
    `);
    console.log('[005-rollback] FK cotizaciones.id_cliente restaurada → usuarios_clientes(id).');
  } else {
    console.log('[005-rollback] Tabla usuarios_clientes no existe — omitiendo restauración de FK.');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Paso 3: Eliminar filas en cuentas insertadas por la migración
  //         (estado='pendiente_activacion' y username LIKE 'guest_%')
  // ─────────────────────────────────────────────────────────────────────────────
  const { rowCount: eliminadas } = await cliente.query(`
    DELETE FROM cuentas
    WHERE estado = 'pendiente_activacion'
      AND username LIKE 'guest_%'
  `);
  console.log(`[005-rollback] Filas eliminadas de cuentas (guest pendientes): ${eliminadas}`);

  console.log('[005-rollback] Rollback completado exitosamente.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Bloque CLI principal
// ─────────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  require('dotenv').config();
  const { Client } = require('pg');

  const args = process.argv.slice(2);
  const esRollback = args.includes('--rollback');
  const confirmarProduccion = args.includes('--confirmar-produccion');

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'nsg_cotizaciones',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  });

  (async () => {
    try {
      await client.connect();
      await client.query('BEGIN');

      if (esRollback) {
        console.log('[005-rollback] Modo rollback activado.');
        await rollback(client);
      } else {
        // Verificar flag de producción ANTES del paso 6 (renombrado de tabla)
        // La función migrar() ejecuta el renombrado en el paso 6.
        // Si estamos en producción sin confirmación, detenemos antes de ejecutar.
        if (process.env.NODE_ENV === 'production' && !confirmarProduccion) {
          console.error(
            '[005] ERROR: Entorno de producción detectado.\n' +
            '[005] El paso 6 (renombrado de usuarios_clientes → usuarios_clientes_deprecated) ' +
            'requiere confirmación explícita.\n' +
            '[005] Ejecuta con el flag --confirmar-produccion para continuar:\n' +
            '[005]   node migrar-005-unificar-usuarios.js --confirmar-produccion'
          );
          await client.query('ROLLBACK');
          process.exitCode = 1;
          return;
        }

        await migrar(client);
      }

      await client.query('COMMIT');
      console.log('[005] Transacción confirmada (COMMIT).');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[005] Error durante la ejecución — transacción revertida (ROLLBACK):', error.message);
      process.exitCode = 1;
    } finally {
      await client.end().catch(() => {});
    }
  })();
}

module.exports = { migrar, rollback };
