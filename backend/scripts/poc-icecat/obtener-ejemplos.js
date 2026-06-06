'use strict';

/**
 * Obtiene UN ejemplo COMPLETO de Icecat por cada una de las 7 categorias.
 *
 * Estrategia: para cada categoria recorre productos del CSV cambiando de codigo
 * hasta conseguir un response 200 con features (data real). Si un codigo pide
 * suscripcion (403) o no existe (404), pasa al siguiente del mismo componente.
 *
 * Prioriza marcas que SI estan en Open Icecat (gratis) para converger rapido.
 * Procesamiento secuencial con delays (no paralelo).
 *
 * Salida: resultados/ejemplos/{categoria}/ con 00-deltron + 01-icecat completos.
 */

const fs = require('fs');
const path = require('path');

const { validarCredenciales } = require('./config');
const { fetchDeltron } = require('./scraper-deltron');
const { consultarIcecatConVariantes } = require('./cliente-icecat');
const { cargarPorCategoria, slug, CATEGORIAS } = require('./seleccionar-productos');

const RUTA_EJEMPLOS = path.resolve(__dirname, 'resultados', 'ejemplos');
const DELAY_DELTRON_MS = 2500;
const DELAY_ICECAT_MS = 1500;
const MAX_INTENTOS = 12; // tope de codigos a probar por categoria

// Marcas con datos en Open Icecat (gratis), confirmadas en el POC.
const MARCAS_OPEN = ['ASUS', 'Gigabyte', 'MSI', 'Kingston', 'ADATA', 'Samsung', 'Seagate'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function guardarJson(rutaCarpeta, archivo, contenido) {
  fs.mkdirSync(rutaCarpeta, { recursive: true });
  fs.writeFileSync(path.join(rutaCarpeta, archivo), JSON.stringify(contenido, null, 2), 'utf8');
}

function contarFeatures(data) {
  try {
    const grupos = data && data.data && data.data.FeaturesGroups;
    if (!Array.isArray(grupos)) return 0;
    return grupos.reduce((acc, g) => acc + (Array.isArray(g.Features) ? g.Features.length : 0), 0);
  } catch (_) {
    return 0;
  }
}

/**
 * Ordena candidatos: primero marcas Open (en round-robin para variar marca),
 * luego el resto. Asi el primer intento suele dar data y no se repite marca.
 */
function ordenarCandidatos(productos) {
  const open = productos.filter((p) => MARCAS_OPEN.includes(p.marca_normalizada));
  const resto = productos.filter((p) => !MARCAS_OPEN.includes(p.marca_normalizada));

  const porMarca = new Map();
  for (const p of open) {
    const orden = MARCAS_OPEN.indexOf(p.marca_normalizada);
    if (!porMarca.has(orden)) porMarca.set(orden, []);
    porMarca.get(orden).push(p);
  }

  // Round-robin entre marcas Open (1 de cada marca por ronda).
  const ordenadas = [...porMarca.keys()].sort((a, b) => a - b);
  const interleaved = [];
  let i = 0;
  let quedan = true;
  while (quedan) {
    quedan = false;
    for (const k of ordenadas) {
      const lista = porMarca.get(k);
      if (lista[i]) {
        interleaved.push(lista[i]);
        quedan = true;
      }
    }
    i++;
  }

  return [...interleaved, ...resto];
}

async function buscarEjemplo(categoria, productos) {
  const candidatos = ordenarCandidatos(productos).slice(0, MAX_INTENTOS);
  console.log('\n=== ' + categoria + ' (probando hasta ' + candidatos.length + ' codigos) ===');

  for (let i = 0; i < candidatos.length; i++) {
    const p = candidatos[i];
    const intento = i + 1;

    const deltron = await fetchDeltron(p.codigo_deltron);
    await sleep(DELAY_DELTRON_MS);

    if (!deltron.mpn) {
      console.log('  [' + intento + '] ' + p.codigo_deltron + ' (' + p.marca_normalizada + ') -> sin MPN, siguiente');
      continue;
    }

    const icecat = await consultarIcecatConVariantes({
      mpn: deltron.mpn,
      marca: p.marca_normalizada,
      sleep: () => sleep(DELAY_ICECAT_MS)
    });
    await sleep(DELAY_ICECAT_MS);

    const features = contarFeatures(icecat.data);
    const okData = icecat.status === 200 && features > 0;
    const motivo = icecat.status === 200 ? 'OK ' + features + ' features'
      : icecat.status === 403 ? '403 pago'
      : icecat.status === 404 ? '404 no existe'
      : 'HTTP ' + icecat.status;

    console.log('  [' + intento + '] ' + p.codigo_deltron + ' (' + p.marca_normalizada +
      ') MPN:' + (icecat.mpn_usado || deltron.mpn) + ' -> ' + motivo);

    if (okData) {
      const carpeta = path.join(RUTA_EJEMPLOS, slug(categoria) + '-' + slug(p.marca_normalizada) + '-' + slug(p.codigo_deltron));
      guardarJson(carpeta, '00-deltron-extraccion.json', { producto: p, resultado: deltron });
      guardarJson(carpeta, '01-icecat-response.json', icecat);
      console.log('  >> EJEMPLO COMPLETO guardado: ' + path.basename(carpeta) + ' (' + features + ' features)');
      return { categoria, ok: true, codigo: p.codigo_deltron, marca: p.marca_normalizada, features, carpeta: path.basename(carpeta) };
    }
  }

  console.log('  >> SIN ejemplo completo para ' + categoria + ' (se agotaron ' + candidatos.length + ' codigos)');
  return { categoria, ok: false, intentos: candidatos.length };
}

async function main() {
  validarCredenciales();
  const porCategoria = cargarPorCategoria();
  const resultados = [];

  for (const categoria of CATEGORIAS) {
    const r = await buscarEjemplo(categoria, porCategoria[categoria] || []);
    resultados.push(r);
  }

  console.log('\n\n===== RESUMEN =====');
  for (const r of resultados) {
    if (r.ok) {
      console.log('  OK  ' + r.categoria.padEnd(16) + ' ' + r.marca + ' / ' + r.codigo + ' (' + r.features + ' features)');
    } else {
      console.log('  --  ' + r.categoria.padEnd(16) + ' SIN ejemplo (Open no cubre esta categoria)');
    }
  }
  const ok = resultados.filter((r) => r.ok).length;
  console.log('\n  ' + ok + '/' + CATEGORIAS.length + ' categorias con ejemplo completo.');
  console.log('  Ejemplos en: ' + RUTA_EJEMPLOS);
}

main().catch((err) => {
  console.error('[ERROR FATAL]', err);
  process.exit(1);
});
