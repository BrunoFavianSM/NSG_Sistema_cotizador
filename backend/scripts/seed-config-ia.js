/**
 * Script de Seed — Configuración IA
 * Sistema de Cotización Automatizada NSG
 *
 * Requisitos: 2.3, Restricción BD 6
 *
 * Inserta las 6 claves `ia_*` en la tabla `configuracion` usando
 * INSERT ... ON CONFLICT (clave) DO NOTHING, de modo que no sobreescribe
 * valores ya configurados por el administrador.
 *
 * Uso:
 *   node backend/scripts/seed-config-ia.js
 */

const path = require('path');
const envPath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: path.resolve(__dirname, '..', envPath) });
const { pool } = require('../src/configuracion/baseDatos');

// ── Colores para logging ─────────────────────────────────────
const colors = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  red:    '\x1b[31m',
};

function log(mensaje, color = 'reset') {
  console.log(`${colors[color]}${mensaje}${colors.reset}`);
}

// ── Claves a insertar con sus valores iniciales desde .env ───
function obtenerClavesIA() {
  // Derivar modo_activo desde AGENT_PIPELINE_ENABLED
  const pipelineEnabled = process.env.AGENT_PIPELINE_ENABLED !== 'false';
  const modoActivo = pipelineEnabled ? 'pipeline' : 'gemini';

  return [
    {
      clave: 'ia_modo_activo',
      valor: modoActivo,
      descripcion: 'Modo activo del asistente: pipeline | nvidia | gemini',
    },
    {
      clave: 'ia_gemini_model',
      valor: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      descripcion: 'Modelo Gemini para modo uni-modelo',
    },
    {
      clave: 'ia_nvidia_model',
      valor: process.env.NVIDIA_MODEL || 'mistralai/mistral-small-4-119b-2603',
      descripcion: 'Modelo NVIDIA para modo uni-modelo',
    },
    {
      clave: 'ia_nvidia_classifier_model',
      valor: process.env.NVIDIA_CLASSIFIER_MODEL || 'meta/llama-3.2-3b-instruct',
      descripcion: 'Clasificador del pipeline multi-agente',
    },
    {
      clave: 'ia_nvidia_embedding_model',
      valor: process.env.NVIDIA_EMBEDDING_MODEL || 'nvidia/nv-embed-v1',
      descripcion: 'Modelo de embeddings del pipeline',
    },
    {
      clave: 'ia_nvidia_reranker_model',
      valor: process.env.NVIDIA_RERANKER_MODEL || 'nvidia/rerank-qa-mistral-4b',
      descripcion: 'Reranker del pipeline multi-agente',
    },
  ];
}

/**
 * Inserta las claves ia_* en la tabla configuracion.
 * Usa ON CONFLICT DO NOTHING para no sobreescribir valores existentes.
 */
async function insertarConfigIA(cliente) {
  log('\n⚙️  Insertando configuración IA...', 'blue');

  const claves = obtenerClavesIA();
  let insertadas = 0;
  let omitidas = 0;

  for (const { clave, valor, descripcion } of claves) {
    const resultado = await cliente.query(
      `INSERT INTO configuracion (clave, valor)
       VALUES ($1, $2)
       ON CONFLICT (clave) DO NOTHING`,
      [clave, valor]
    );

    if (resultado.rowCount > 0) {
      log(`  ✓ Insertada: ${clave} = "${valor}"`, 'green');
      insertadas++;
    } else {
      log(`  ~ Omitida (ya existe): ${clave}`, 'yellow');
      omitidas++;
    }
  }

  log(`\n  Insertadas: ${insertadas} | Omitidas (ya existían): ${omitidas}`, 'blue');
}

/**
 * Verifica que las 6 claves ia_* existen en la tabla configuracion.
 * Lanza un error si alguna clave falta.
 */
async function verificarConfigIA(cliente) {
  log('\n🔍 Verificando claves ia_* en la tabla configuracion...', 'blue');

  const clavesEsperadas = [
    'ia_modo_activo',
    'ia_gemini_model',
    'ia_nvidia_model',
    'ia_nvidia_classifier_model',
    'ia_nvidia_embedding_model',
    'ia_nvidia_reranker_model',
  ];

  const { rows } = await cliente.query(
    `SELECT clave, valor
     FROM configuracion
     WHERE clave = ANY($1)
     ORDER BY clave`,
    [clavesEsperadas]
  );

  const clavesEncontradas = new Set(rows.map(r => r.clave));
  const clavesFaltantes = clavesEsperadas.filter(c => !clavesEncontradas.has(c));

  if (clavesFaltantes.length > 0) {
    throw new Error(
      `Verificación fallida. Claves faltantes: ${clavesFaltantes.join(', ')}`
    );
  }

  log('\n📊 Estado actual de claves IA:', 'blue');
  rows.forEach(({ clave, valor }) => {
    log(`  ✓ ${clave} = "${valor}"`, 'green');
  });

  log(`\n✅ Verificación exitosa: las ${clavesEsperadas.length} claves ia_* están presentes.`, 'green');
}

/**
 * Función principal
 */
async function main(opciones = {}) {
  const { cerrarPool = true } = opciones;
  const cliente = await pool.connect();

  try {
    log('\n╔════════════════════════════════════════════╗', 'blue');
    log('║  SEED — Configuración IA (NSG Cotizador)   ║', 'blue');
    log('╚════════════════════════════════════════════╝', 'blue');

    await cliente.query('BEGIN');

    await insertarConfigIA(cliente);

    await cliente.query('COMMIT');

    await verificarConfigIA(cliente);

    log('\n✅ Seed de configuración IA completado exitosamente!', 'green');
    log('\n💡 Los valores pueden actualizarse desde el panel de administración.', 'blue');

  } catch (error) {
    await cliente.query('ROLLBACK');
    log('\n❌ Error durante el seed de configuración IA:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    cliente.release();
    if (cerrarPool) {
      await pool.end();
    }
  }
}

module.exports = { main, insertarConfigIA, verificarConfigIA };

// Ejecutar script si se llama directamente
if (require.main === module) {
  main();
}
