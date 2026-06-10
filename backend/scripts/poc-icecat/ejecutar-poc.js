'use strict';

/**
 * Orquestador del POC Icecat.
 *
 * Procesamiento 100% SECUENCIAL (uno por uno, sin paralelismo) para no
 * bloquear a Deltron. Flujo por producto:
 *
 *   [Deltron] GET ficha -> extraer MPN -> guardar 00-deltron-extraccion.json
 *   sleep
 *   si hay MPN -> [Icecat] GET -> guardar 01-icecat-response.json (COMPLETO)
 *   sleep
 *
 * Si un producto falla, se loguea y se continua con el siguiente (no aborta).
 * Al final genera reporte.md con el resumen de ejecucion (sin analisis).
 *
 * Reglas duras: NO Promise.all, NO forEach async, NO workers. Solo for...of + await.
 */

const fs = require('fs');
const path = require('path');

const { validarCredenciales } = require('./config');
const { fetchDeltron } = require('./scraper-deltron');
const { consultarIcecatConVariantes } = require('./cliente-icecat');

const RUTA_PRODUCTOS = path.resolve(__dirname, 'productos-prueba.json');
const RUTA_RAW = path.resolve(__dirname, 'resultados', 'icecat-raw');

const DELAY_DELTRON_MS = 2500;
const DELAY_ICECAT_MS = 1500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function guardarJson(rutaCarpeta, archivo, contenido) {
  fs.mkdirSync(rutaCarpeta, { recursive: true });
  fs.writeFileSync(path.join(rutaCarpeta, archivo), JSON.stringify(contenido, null, 2), 'utf8');
}

// Cuenta features dentro del response de Icecat (best-effort, solo para el reporte).
function contarFeatures(data) {
  try {
    const grupos = data && data.data && data.data.FeaturesGroups;
    if (!Array.isArray(grupos)) return 0;
    return grupos.reduce((acc, g) => acc + (Array.isArray(g.Features) ? g.Features.length : 0), 0);
  } catch (_) {
    return 0;
  }
}

function contarGallery(data) {
  try {
    const g = data && data.data && data.data.Gallery;
    return Array.isArray(g) ? g.length : 0;
  } catch (_) {
    return 0;
  }
}

function mensajeIcecat(data) {
  try {
    return (data && data.Message) || (data && data.data && data.data.Message) || '';
  } catch (_) {
    return '';
  }
}

async function main() {
  validarCredenciales();

  if (!fs.existsSync(RUTA_PRODUCTOS)) {
    console.error('[ERROR] No existe productos-prueba.json. Corre primero: node seleccionar-productos.js');
    process.exit(1);
  }

  const productos = JSON.parse(fs.readFileSync(RUTA_PRODUCTOS, 'utf8'));
  const total = productos.length;
  const inicio = Date.now();
  const filas = [];

  console.log('Iniciando POC Icecat: ' + total + ' productos (secuencial)\n');

  for (let i = 0; i < total; i++) {
    const p = productos[i];
    const n = i + 1;
    const carpeta = path.join(RUTA_RAW, p.carpeta);
    const fila = {
      indice: p.indice,
      categoria: p.categoria,
      codigo: p.codigo_deltron,
      marca: p.marca_normalizada,
      mpn: null,
      deltron_estado: 'ok',
      icecat_status: null,
      icecat_msg: '',
      features: 0,
      gallery: 0
    };

    // --- Paso Deltron ---
    const deltron = await fetchDeltron(p.codigo_deltron);
    guardarJson(carpeta, '00-deltron-extraccion.json', { producto: p, resultado: deltron });
    fila.mpn = deltron.mpn;

    if (deltron.error) {
      fila.deltron_estado = deltron.error;
      console.log('[' + n + '/' + total + '] ' + p.codigo_deltron + ' -> Deltron ERROR: ' + deltron.error);
    } else if (!deltron.mpn) {
      fila.deltron_estado = 'sin_mpn';
      console.log('[' + n + '/' + total + '] ' + p.codigo_deltron + ' -> sin MPN (skip Icecat)');
    } else {
      console.log('[' + n + '/' + total + '] ' + p.codigo_deltron + ' -> MPN: ' + deltron.mpn);
    }

    await sleep(DELAY_DELTRON_MS);

    // --- Paso Icecat (solo si hay MPN) ---
    if (deltron.mpn) {
      const icecat = await consultarIcecatConVariantes({
        mpn: deltron.mpn,
        marca: p.marca_normalizada,
        sleep: () => sleep(DELAY_ICECAT_MS)
      });
      guardarJson(carpeta, '01-icecat-response.json', icecat);

      fila.icecat_status = icecat.status;
      fila.icecat_msg = mensajeIcecat(icecat.data);
      fila.features = contarFeatures(icecat.data);
      fila.gallery = contarGallery(icecat.data);
      fila.mpn_usado = icecat.mpn_usado;

      const variante = icecat.mpn_usado && icecat.mpn_usado !== deltron.mpn
        ? ' (variante: ' + icecat.mpn_usado + ')'
        : '';
      console.log(
        '          Icecat: HTTP ' + icecat.status +
        (fila.icecat_msg ? ' (' + fila.icecat_msg + ')' : '') +
        ' | features: ' + fila.features + ' | gallery: ' + fila.gallery + variante
      );

      await sleep(DELAY_ICECAT_MS);
    }

    filas.push(fila);
  }

  const segundos = Math.round((Date.now() - inicio) / 1000);
  generarReporte(filas, segundos);

  console.log('\nListo. ' + total + ' productos procesados en ' + segundos + 's.');
  console.log('JSON crudos en: ' + RUTA_RAW);
}

function generarReporte(filas, segundos) {
  const sinMpn = filas.filter((f) => !f.mpn);
  const conRespuesta = filas.filter((f) => f.icecat_status === 200 && /ok/i.test(f.icecat_msg));
  const sinIcecat = filas.filter((f) => f.mpn && !(f.icecat_status === 200 && /ok/i.test(f.icecat_msg)));

  let md = '# Reporte de ejecucion - POC Icecat\n\n';
  md += '- Fecha: ' + new Date().toISOString() + '\n';
  md += '- Productos procesados: ' + filas.length + '\n';
  md += '- MPN extraido en Deltron: ' + (filas.length - sinMpn.length) + '/' + filas.length + '\n';
  md += '- Icecat respondio OK: ' + conRespuesta.length + '/' + filas.length + '\n';
  md += '- Tiempo total: ' + segundos + 's\n\n';

  md += '## Resumen por producto\n\n';
  md += '| # | Categoria | Codigo | Marca | MPN | Icecat | features | gallery |\n';
  md += '|---|---|---|---|---|---|---|---|\n';
  for (const f of filas) {
    md += '| ' + f.indice + ' | ' + f.categoria + ' | ' + f.codigo + ' | ' + f.marca +
      ' | ' + (f.mpn || '-') + ' | ' + (f.icecat_status || f.deltron_estado) +
      (f.icecat_msg ? ' ' + f.icecat_msg : '') + ' | ' + f.features + ' | ' + f.gallery + ' |\n';
  }

  md += '\n## Productos sin MPN en Deltron\n\n';
  md += sinMpn.length
    ? sinMpn.map((f) => '- [' + f.categoria + '] ' + f.codigo + ' (' + f.deltron_estado + ')').join('\n') + '\n'
    : '_Ninguno._\n';

  md += '\n## Productos con MPN pero sin datos OK en Icecat\n\n';
  md += sinIcecat.length
    ? sinIcecat.map((f) => '- [' + f.categoria + '] ' + f.codigo + ' MPN:' + f.mpn +
        ' -> HTTP ' + f.icecat_status + ' ' + f.icecat_msg).join('\n') + '\n'
    : '_Ninguno._\n';

  md += '\n> Este reporte es solo un resumen de ejecucion. El analisis de campos ' +
    'y la decision de que datos usar se hace en una tarea posterior, revisando ' +
    'los archivos 01-icecat-response.json.\n';

  fs.writeFileSync(path.join(RUTA_RAW, 'reporte.md'), md, 'utf8');
}

main().catch((err) => {
  console.error('[ERROR FATAL]', err);
  process.exit(1);
});
