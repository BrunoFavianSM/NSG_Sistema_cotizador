'use strict';

/**
 * Lee el CSV de Deltron, clasifica los productos en las 7 categorias del
 * cotizador, normaliza la marca y selecciona 4 productos por categoria
 * (28 en total) para el POC de Icecat.
 *
 * Salida: productos-prueba.json
 *
 * NO scrapea ni consulta nada. Solo lee el CSV local y arma la lista.
 */

const fs = require('fs');
const path = require('path');

const RUTA_CSV = path.resolve(__dirname, '../../assets/DCW_20260407094705.csv');
const RUTA_SALIDA = path.resolve(__dirname, 'productos-prueba.json');
const PRODUCTOS_POR_CATEGORIA = 4;

// ---------------------------------------------------------------------------
// Parser CSV minimo (maneja campos entre comillas con comas internas).
// ---------------------------------------------------------------------------
function parsearLinea(linea) {
  const campos = [];
  let actual = '';
  let dentroComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      dentroComillas = !dentroComillas;
    } else if (c === ',' && !dentroComillas) {
      campos.push(actual);
      actual = '';
    } else {
      actual += c;
    }
  }
  campos.push(actual);
  return campos;
}

// ---------------------------------------------------------------------------
// Clasificacion: categoria del CSV (columna 0) -> categoria del cotizador.
// Se excluyen secciones que NO son el componente principal (coolers,
// accesorios, repuestos, memorias flash/USB, NAS, fuentes de servidor, etc.).
// ---------------------------------------------------------------------------
function clasificar(categoriaCsv) {
  const c = categoriaCsv.toLowerCase().trim();

  // Procesador: "cpu ..." pero NO coolers de CPU.
  if (/^cpu /.test(c) && !/cooler|fan/.test(c)) return 'Procesador';

  // Placa madre: "mb ..."
  if (/^mb /.test(c)) return 'Placa madre';

  // Memoria RAM de escritorio (DIMM). Se excluye SODIMM (laptop) y flash/USB/SD.
  if (/^mem ddr/.test(c) && !/sodimm|flash/.test(c)) return 'Memoria RAM';

  // Almacenamiento interno: SSD, disco duro 3.5, disco solido externo, storage.
  if (/^ssd |^disco duro 3\.5|^disco solido externo|^storage/.test(c)) return 'Almacenamiento';

  // Tarjeta grafica: "video, pci ex..."
  if (/^video, pci ex/.test(c)) return 'Tarjeta grafica';

  // Fuente de poder (excluye fuentes de servidor).
  if (/^cases, fuente/.test(c)) return 'Fuente de poder';

  // Case / gabinete (excluye accesorios, repuestos y fuentes dentro de cases).
  if (/^cases atx|^cases micro atx|^cases sin fuente|^y gabinetes/.test(c)) return 'Case';

  return null;
}

// ---------------------------------------------------------------------------
// Normalizacion de marca: el CSV trae marcas sucias / en minuscula /
// con sufijos. Icecat exige el nombre canonico del fabricante.
// ---------------------------------------------------------------------------
const ALIAS_MARCA = {
  'amd-advanced micro device': 'AMD',
  'amd': 'AMD',
  'intel corp': 'Intel',
  'intel oem': 'Intel',
  'intel latam': 'Intel',
  'gigabyte': 'Gigabyte',
  'asus': 'ASUS',
  'msi': 'MSI',
  'asrock': 'ASRock',
  'kingston': 'Kingston',
  'western digital': 'Western Digital',
  'teamgroup': 'Team Group',
  'samsung': 'Samsung',
  'sandisk': 'SanDisk',
  'toshiba - storage': 'Toshiba',
  'seagate': 'Seagate',
  'corsair': 'Corsair',
  'a-data': 'ADATA',
  'patriot': 'Patriot',
  'hiksemi': 'HIKSEMI',
  'xfx': 'XFX',
  'pny technologies': 'PNY',
  'cooler master': 'Cooler Master',
  'predator': 'Acer',
  'biwin': 'Biwin',
  'acer': 'Acer',
  'tripp-lite': 'Tripp Lite'
};

// Marcas genericas / no presentes en Icecat: se descartan de entrada.
const MARCAS_DESCARTAR = new Set([
  'teros',
  'zz otras marcas',
  'advance computer corp',
  'deltron',
  'hp enterprise - servidores',
  'qnap',
  'asustor'
]);

function normalizarMarca(marcaCruda) {
  const k = marcaCruda.trim().toLowerCase();
  return ALIAS_MARCA[k] || marcaCruda.trim();
}

// Prioridad de marcas mainstream por categoria (mejor cobertura en Icecat).
const PRIORIDAD = {
  'Procesador': ['Intel', 'AMD'],
  'Placa madre': ['ASUS', 'Gigabyte', 'MSI', 'ASRock'],
  'Memoria RAM': ['Kingston', 'Corsair', 'ADATA', 'Team Group', 'Patriot'],
  'Almacenamiento': ['Samsung', 'Western Digital', 'Kingston', 'Seagate', 'SanDisk', 'Toshiba'],
  'Tarjeta grafica': ['ASUS', 'Gigabyte', 'MSI', 'XFX', 'PNY'],
  'Fuente de poder': ['ASUS', 'Gigabyte', 'ASRock'],
  'Case': ['Cooler Master', 'MSI', 'ASUS']
};

const CATEGORIAS = [
  'Procesador',
  'Placa madre',
  'Memoria RAM',
  'Almacenamiento',
  'Tarjeta grafica',
  'Fuente de poder',
  'Case'
];

function slug(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

// ---------------------------------------------------------------------------
// Seleccion: prioriza diversidad de marca; si no hay 4 marcas mainstream,
// completa con modelos adicionales de las marcas ya elegidas.
// ---------------------------------------------------------------------------
function seleccionar(productos, categoria) {
  const prioridad = PRIORIDAD[categoria] || [];
  const porMarca = new Map();
  for (const p of productos) {
    if (!porMarca.has(p.marca_normalizada)) porMarca.set(p.marca_normalizada, []);
    porMarca.get(p.marca_normalizada).push(p);
  }

  // Orden de marcas: primero las de la lista de prioridad, luego el resto.
  const marcasOrdenadas = [
    ...prioridad.filter((m) => porMarca.has(m)),
    ...[...porMarca.keys()].filter((m) => !prioridad.includes(m))
  ];

  const elegidos = [];

  // Ronda 1: un producto por marca distinta (maxima diversidad de marca).
  for (const marca of marcasOrdenadas) {
    if (elegidos.length >= PRODUCTOS_POR_CATEGORIA) break;
    elegidos.push(porMarca.get(marca)[0]);
  }

  // Ronda 2+: si faltan, agregar modelos adicionales de las marcas elegidas.
  let indiceModelo = 1;
  while (elegidos.length < PRODUCTOS_POR_CATEGORIA) {
    let agregadoEnRonda = false;
    for (const marca of marcasOrdenadas) {
      if (elegidos.length >= PRODUCTOS_POR_CATEGORIA) break;
      const lista = porMarca.get(marca);
      if (lista[indiceModelo]) {
        elegidos.push(lista[indiceModelo]);
        agregadoEnRonda = true;
      }
    }
    indiceModelo++;
    if (!agregadoEnRonda) break; // no hay mas productos disponibles
  }

  return elegidos;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
/**
 * Lee el CSV, clasifica y normaliza, y devuelve TODOS los productos validos
 * agrupados por las 7 categorias del cotizador (sin seleccionar todavia).
 * Reutilizable por otros scripts (ej. obtener-ejemplos.js).
 */
function cargarPorCategoria() {
  if (!fs.existsSync(RUTA_CSV)) {
    console.error('[ERROR] No se encontro el CSV en: ' + RUTA_CSV);
    process.exit(1);
  }

  const lineas = fs.readFileSync(RUTA_CSV, 'latin1').split(/\r?\n/);
  const porCategoria = {};
  CATEGORIAS.forEach((c) => (porCategoria[c] = []));

  for (const linea of lineas) {
    const f = parsearLinea(linea);
    if (f.length < 9) continue;
    const codigo = f[1].trim();
    if (!codigo || codigo === 'CODIGO') continue;

    const categoria = clasificar(f[0]);
    if (!categoria) continue;

    const marcaCsv = f[f.length - 1].trim();
    if (MARCAS_DESCARTAR.has(marcaCsv.toLowerCase())) continue;

    const marcaNormalizada = normalizarMarca(marcaCsv);
    if (MARCAS_DESCARTAR.has(marcaNormalizada.toLowerCase())) continue;

    porCategoria[categoria].push({
      codigo_deltron: codigo,
      categoria,
      marca_csv: marcaCsv,
      marca_normalizada: marcaNormalizada,
      nombre_esperado: f[2].replace(/\[@@@.*$/, '').trim().slice(0, 100)
    });
  }

  return porCategoria;
}

function main() {
  const porCategoria = cargarPorCategoria();

  // Seleccion + numeracion global.
  const seleccionados = [];
  let indice = 1;
  for (const categoria of CATEGORIAS) {
    const elegidos = seleccionar(porCategoria[categoria], categoria);
    if (elegidos.length < PRODUCTOS_POR_CATEGORIA) {
      console.warn(
        '[ADVERTENCIA] ' + categoria + ': solo se encontraron ' +
        elegidos.length + '/' + PRODUCTOS_POR_CATEGORIA + ' productos.'
      );
    }
    for (const p of elegidos) {
      const num = String(indice).padStart(2, '0');
      p.indice = indice;
      p.carpeta = num + '-' + slug(categoria) + '-' + slug(p.marca_normalizada) + '-' + slug(p.codigo_deltron);
      seleccionados.push(p);
      indice++;
    }
  }

  fs.writeFileSync(RUTA_SALIDA, JSON.stringify(seleccionados, null, 2), 'utf8');

  console.log('Productos seleccionados: ' + seleccionados.length);
  CATEGORIAS.forEach((c) => {
    const n = seleccionados.filter((p) => p.categoria === c).length;
    const marcas = seleccionados.filter((p) => p.categoria === c).map((p) => p.marca_normalizada).join(', ');
    console.log('  ' + c + ': ' + n + '  [' + marcas + ']');
  });
  console.log('\nArchivo generado: ' + RUTA_SALIDA);
}

module.exports = {
  cargarPorCategoria,
  clasificar,
  normalizarMarca,
  slug,
  CATEGORIAS
};

if (require.main === module) {
  main();
}
