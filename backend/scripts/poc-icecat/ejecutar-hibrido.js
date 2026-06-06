'use strict';

/**
 * Orquestador HIBRIDO Icecat + Deltron.
 *
 * Para cada producto (productos-prueba.json):
 *   1. Descarga la ficha de Deltron UNA sola vez -> extrae MPN.
 *   2. Consulta Icecat con ese MPN (+ variantes).
 *   3a. Si Icecat responde 200 con features -> usa Icecat (fuente: icecat).
 *   3b. Si Icecat da 403 (pago) / 404 (no existe) / sin data -> parsea las
 *       Especificaciones del MISMO HTML de Deltron (fuente: deltron-scraping).
 *
 * Una sola request a Deltron por producto (gentil). Secuencial, con delays.
 * Salida: resultados/hibrido/{carpeta}/01-final.json + reporte.md
 */

const fs = require('fs');
const path = require('path');

const { validarCredenciales } = require('./config');
const { descargarHtmlDeltron, extraerMpnDeHtml } = require('./scraper-deltron');
const { consultarIcecatConVariantes } = require('./cliente-icecat');
const { construirFichaDeHtml } = require('./scraper-deltron-specs');

const RUTA_PRODUCTOS = path.resolve(__dirname, 'productos-prueba.json');
const RUTA_OUT = path.resolve(__dirname, 'resultados', 'hibrido');

const DELAY_DELTRON_MS = 2500;
const DELAY_ICECAT_MS = 1500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function guardarJson(carpeta, archivo, contenido) {
  fs.mkdirSync(carpeta, { recursive: true });
  fs.writeFileSync(path.join(carpeta, archivo), JSON.stringify(contenido, null, 2), 'utf8');
}

function contarFeatures(data) {
  try {
    const g = data && data.data && data.data.FeaturesGroups;
    return Array.isArray(g) ? g.reduce((a, x) => a + (Array.isArray(x.Features) ? x.Features.length : 0), 0) : 0;
  } catch (_) {
    return 0;
  }
}

async function main() {
  validarCredenciales();

  if (!fs.existsSync(RUTA_PRODUCTOS)) {
    console.error('[ERROR] Falta productos-prueba.json. Corre: node seleccionar-productos.js');
    process.exit(1);
  }

  const productos = JSON.parse(fs.readFileSync(RUTA_PRODUCTOS, 'utf8'));
  const total = productos.length;
  const filas = [];
  const inicio = Date.now();

  console.log('HIBRIDO Icecat + Deltron: ' + total + ' productos (secuencial)\n');

  for (let i = 0; i < total; i++) {
    const p = productos[i];
    const n = i + 1;
    const carpeta = path.join(RUTA_OUT, p.carpeta);
    const fila = { indice: p.indice, categoria: p.categoria, codigo: p.codigo_deltron, marca: p.marca_normalizada, fuente: null, features: 0, detalle: '' };

    // 1) Una sola descarga de Deltron.
    const { html, status: statusDeltron, error: errDeltron } = await descargarHtmlDeltron(p.codigo_deltron);
    await sleep(DELAY_DELTRON_MS);

    if (!html) {
      fila.fuente = 'fallo-deltron';
      fila.detalle = errDeltron || ('http_' + statusDeltron);
      guardarJson(carpeta, '01-final.json', { fuente: 'fallo-deltron', producto: p, error: fila.detalle });
      console.log('[' + n + '/' + total + '] ' + p.codigo_deltron + ' -> Deltron FALLO (' + fila.detalle + ')');
      filas.push(fila);
      continue;
    }

    const datosMpn = extraerMpnDeHtml(html, p.codigo_deltron);

    // 2) Icecat (si hay MPN).
    let final = null;
    if (datosMpn.mpn) {
      const icecat = await consultarIcecatConVariantes({ mpn: datosMpn.mpn, marca: p.marca_normalizada, sleep: () => sleep(DELAY_ICECAT_MS) });
      await sleep(DELAY_ICECAT_MS);
      const feats = contarFeatures(icecat.data);
      if (icecat.status === 200 && feats > 0) {
        final = icecat;
        final.fuente = 'icecat';
        fila.fuente = 'icecat';
        fila.features = feats;
        fila.detalle = 'MPN ' + (icecat.mpn_usado || datosMpn.mpn);
      } else {
        fila.detalle = 'Icecat ' + icecat.status + (icecat.status === 403 ? ' pago' : icecat.status === 404 ? ' no existe' : '');
      }
    } else {
      fila.detalle = 'sin MPN';
    }

    // 3) Fallback: specs de Deltron desde el MISMO html.
    if (!final) {
      const ficha = construirFichaDeHtml(html, p.codigo_deltron, p.marca_normalizada);
      final = ficha;
      const feats = contarFeatures(ficha.data);
      fila.fuente = ficha.ok ? 'deltron-scraping' : 'sin-datos';
      fila.features = feats;
      fila.detalle += ' -> Deltron specs (' + feats + ')';
    }

    guardarJson(carpeta, '01-final.json', final);
    console.log('[' + n + '/' + total + '] ' + p.codigo_deltron + ' (' + p.marca_normalizada + ') -> ' + fila.fuente + ' | features: ' + fila.features + ' | ' + fila.detalle);
    filas.push(fila);
  }

  const segundos = Math.round((Date.now() - inicio) / 1000);
  generarReporte(filas, segundos);
  const icecat = filas.filter((f) => f.fuente === 'icecat').length;
  const deltron = filas.filter((f) => f.fuente === 'deltron-scraping').length;
  console.log('\nListo en ' + segundos + 's. Icecat: ' + icecat + ' | Deltron-scraping: ' + deltron + ' | total con datos: ' + (icecat + deltron) + '/' + total);
  console.log('Salida: ' + RUTA_OUT);
}

function generarReporte(filas, segundos) {
  const icecat = filas.filter((f) => f.fuente === 'icecat');
  const deltron = filas.filter((f) => f.fuente === 'deltron-scraping');
  const sin = filas.filter((f) => f.fuente === 'sin-datos' || f.fuente === 'fallo-deltron');

  let md = '# Reporte HIBRIDO Icecat + Deltron\n\n';
  md += '- Fecha: ' + new Date().toISOString() + '\n';
  md += '- Total: ' + filas.length + '\n';
  md += '- Desde Icecat (oficial): ' + icecat.length + '\n';
  md += '- Desde Deltron (scraping fallback): ' + deltron.length + '\n';
  md += '- Con datos (Icecat + Deltron): ' + (icecat.length + deltron.length) + '/' + filas.length + '\n';
  md += '- Sin datos: ' + sin.length + '\n';
  md += '- Tiempo: ' + segundos + 's\n\n';

  md += '| # | Categoria | Codigo | Marca | Fuente | features | detalle |\n';
  md += '|---|---|---|---|---|---|---|\n';
  for (const f of filas) {
    md += '| ' + f.indice + ' | ' + f.categoria + ' | ' + f.codigo + ' | ' + f.marca + ' | ' + f.fuente + ' | ' + f.features + ' | ' + f.detalle + ' |\n';
  }
  fs.mkdirSync(RUTA_OUT, { recursive: true });
  fs.writeFileSync(path.join(RUTA_OUT, 'reporte.md'), md, 'utf8');
}

main().catch((err) => {
  console.error('[ERROR FATAL]', err);
  process.exit(1);
});
