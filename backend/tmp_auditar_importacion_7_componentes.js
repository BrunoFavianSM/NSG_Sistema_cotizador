require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parsearCSV, importar } = require('./src/servicios/servicioImportacion');
const servicioEnriquecimientoIA = require('./src/servicios/servicioEnriquecimientoIA');
const { ejecutarQuery, pool } = require('./src/configuracion/baseDatos');

const ARCHIVO = path.join(__dirname, 'tmp_importacion_7_componentes.csv');
const ESPERA_MS = 2000;
const MAX_INTENTOS = 45;

const QUERIES_SPECS = {
  procesador: 'SELECT socket, arquitectura, nucleos, hilos, frecuencia_base_ghz, frecuencia_boost_ghz, tdp_w, graficos_integrados FROM specs_procesador WHERE id_producto = $1',
  placa_madre: 'SELECT socket, chipset, form_factor, ram_tipo, max_ram_gb, m2_slots, pcie_version FROM specs_placa_madre WHERE id_producto = $1',
  ram: 'SELECT ram_tipo, capacidad_gb, velocidad_mhz, latencia, cantidad_modulos FROM specs_ram WHERE id_producto = $1',
  almacenamiento: 'SELECT tipo_almacenamiento, capacidad_gb, interfaz, form_factor, nvme_gen, velocidad_lectura_mbps, velocidad_escritura_mbps FROM specs_almacenamiento WHERE id_producto = $1',
  gpu: 'SELECT chipset, vram_gb, vram_tipo, bus_bits, tdp_w, longitud_mm FROM specs_gpu WHERE id_producto = $1',
  fuente: 'SELECT wattage, certificacion, modular, form_factor FROM specs_fuente WHERE id_producto = $1',
  case: 'SELECT form_factor, color, panel_lateral, max_gpu_mm, compatibilidad_placa FROM specs_case WHERE id_producto = $1',
};

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function consultarProductos(codigos) {
  const { rows } = await ejecutarQuery(
    `SELECT p.id, p.codigo_proveedor, p.nombre, p.descripcion_general, p.subcategoria, p.estado_enriquecimiento,
            c.nombre AS categoria
     FROM productos p
     LEFT JOIN categorias c ON c.id = p.id_categoria
     WHERE p.codigo_proveedor = ANY($1)
     ORDER BY p.codigo_proveedor`,
    [codigos]
  );
  return rows;
}

async function consultarSpecs(idProducto, categoria) {
  const sql = QUERIES_SPECS[categoria];
  if (!sql) return null;
  const { rows } = await ejecutarQuery(sql, [idProducto]);
  return rows[0] || null;
}

(async () => {
  const buffer = fs.readFileSync(ARCHIVO);
  const filas = parsearCSV(buffer);
  const codigos = filas.map((fila) => fila.codigo);
  console.log('filas_parseadas:', JSON.stringify(filas.map((fila) => ({ categoria: fila.categoria, codigo: fila.codigo, categoria_proveedor: fila.categoria_proveedor })), null, 2));
  const categoriasPorCodigo = Object.fromEntries(filas.map((fila) => [fila.codigo, fila.categoria]));

  console.log('=== INICIO IMPORTACION CONTROLADA ===');
  console.log(JSON.stringify({ archivo: path.basename(ARCHIVO), total_filas: filas.length, codigos }, null, 2));

  const resultado = await importar(filas, ejecutarQuery);
  console.log('=== RESULTADO IMPORTACION ===');
  console.log(JSON.stringify(resultado, null, 2));

  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    const estadoMemoria = servicioEnriquecimientoIA.obtenerEstadoMemoria();
    const productos = await consultarProductos(codigos);
    const pendientes = productos.filter((p) => p.estado_enriquecimiento === 'pendiente').length;
    console.log(`espera ${intento}/${MAX_INTENTOS}: en_proceso=${estadoMemoria.en_proceso} cola=${estadoMemoria.pendientes_en_memoria} pendientes_bd=${pendientes}`);
    if (!estadoMemoria.en_proceso && estadoMemoria.pendientes_en_memoria === 0 && pendientes === 0) {
      break;
    }
    await sleep(ESPERA_MS);
  }

  const productosFinales = await consultarProductos(codigos);
  const auditoria = [];
  for (const producto of productosFinales) {
    auditoria.push({
      ...producto,
      categoria_esperada: categoriasPorCodigo[producto.codigo_proveedor] || null,
      specs: await consultarSpecs(producto.id, categoriasPorCodigo[producto.codigo_proveedor]),
    });
  }

  const resumenEstados = productosFinales.reduce((acc, item) => {
    acc[item.estado_enriquecimiento] = (acc[item.estado_enriquecimiento] || 0) + 1;
    return acc;
  }, {});

  console.log('=== AUDITORIA FINAL ===');
  console.log(JSON.stringify({ resumen_estados: resumenEstados, productos: auditoria }, null, 2));
})()
  .catch((error) => {
    console.error('=== ERROR AUDITORIA ===');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
