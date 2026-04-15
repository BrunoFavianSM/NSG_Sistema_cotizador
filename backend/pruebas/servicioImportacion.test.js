'use strict';

/**
 * servicioImportacion.test.js
 * Pruebas unitarias + PBT (Property-Based Testing con fast-check)
 * del servicio de importación de catálogo CSV de Deltron.
 *
 * Cubre:
 *  - Task 14.1: pruebas unitarias de mapearCategoria, limpiarNombre,
 *               parsearStock, parsearCSV
 *  - Task 14.2 / Subtasks 2.2–2.6: propiedades 13, 14, 16, 17, 18
 *
 * Feature: reestructuracion-catalogo-productos
 */

const fc = require('fast-check');
const {
  MAPA_CATEGORIAS,
  CATEGORIAS_VALIDAS,
  mapearCategoria,
  limpiarNombre,
  parsearStock,
  parsearLineaCSV,
  parsearCSV,
  importar,
} = require('../src/servicios/servicioImportacion');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Crea un mock de db que simula un INSERT exitoso.
 * @param {boolean} esInsercion  Determina si RETURNING devuelve inserción o actualización.
 */
const mockDb = (esInsercion = true) =>
  jest.fn().mockResolvedValue({ rows: [{ es_insercion: esInsercion }] });

/**
 * Construye un buffer CSV con las líneas dadas.
 */
const csvBuffer = (lineas) => Buffer.from(lineas.join('\n'), 'utf8');

// ---------------------------------------------------------------------------
// mapearCategoria — pruebas unitarias (Task 14.1)
// ---------------------------------------------------------------------------

describe('mapearCategoria', () => {
  test('categoría reconocida exacta retorna la categoría correcta', () => {
    expect(mapearCategoria('CPU AMD Ryzen 7 5800X')).toBe('procesador');
    expect(mapearCategoria('MEM DDR4 16GB')).toBe('ram');
    expect(mapearCategoria('SSD M.2 NVMe 1TB')).toBe('almacenamiento');
    expect(mapearCategoria('Mouse USB Gaming')).toBe('mouse');
    expect(mapearCategoria('Monitor Plano 24"')).toBe('monitor');
  });

  test('categoría no reconocida retorna null', () => {
    expect(mapearCategoria('IMPRESORA LASER')).toBeNull();
    expect(mapearCategoria('TABLET ANDROID')).toBeNull();
    expect(mapearCategoria('')).toBeNull();
  });

  test('string vacío retorna null', () => {
    expect(mapearCategoria('')).toBeNull();
  });

  test('null y undefined retornan null sin lanzar excepción', () => {
    expect(mapearCategoria(null)).toBeNull();
    expect(mapearCategoria(undefined)).toBeNull();
  });

  test('mayúsculas y minúsculas son equivalentes', () => {
    expect(mapearCategoria('CPU AMD RYZEN 5 3600')).toBe('procesador');
    expect(mapearCategoria('cpu amd ryzen 5 3600')).toBe('procesador');
    expect(mapearCategoria('Cpu Amd Ryzen 5 3600')).toBe('procesador');
  });

  test('category con prefijo más específico tiene precedencia sobre prefijo corto', () => {
    // 'cases, fuente para gaming' debe ganar a 'cases, fuente para'
    expect(mapearCategoria('cases, fuente para gaming corsair')).toBe('fuente');
    // 'cases atx ver2.0' es más específico que 'cases atx'
    expect(mapearCategoria('cases atx ver2.0 mid tower')).toBe('case');
  });
});

// ---------------------------------------------------------------------------
// limpiarNombre — pruebas unitarias (Task 14.1)
// ---------------------------------------------------------------------------

describe('limpiarNombre', () => {
  test('nombre sin marcador [@@@] se retorna intacto (trim)', () => {
    expect(limpiarNombre('Intel Core i9-13900K')).toBe('Intel Core i9-13900K');
  });

  test('con marcador [@@@] retorna solo la parte anterior', () => {
    expect(limpiarNombre('ASUS ROG STRIX B550[@@@]texto adicional'))
      .toBe('ASUS ROG STRIX B550');
  });

  test('texto después del marcador es descartado completamente', () => {
    expect(limpiarNombre('Kingston 16GB DDR4[@@@]especificaciones@@verde'))
      .toBe('Kingston 16GB DDR4');
  });

  test('nombre vacío retorna string vacío', () => {
    expect(limpiarNombre('')).toBe('');
  });

  test('null y undefined retornan string vacío sin lanzar excepción', () => {
    expect(limpiarNombre(null)).toBe('');
    expect(limpiarNombre(undefined)).toBe('');
  });

  test('trim elimina espacios al inicio/fin del nombre resultante', () => {
    expect(limpiarNombre('  MSI MAG B760  [@@@]tail')).toBe('MSI MAG B760');
  });
});

// ---------------------------------------------------------------------------
// parsearStock — pruebas unitarias (Task 14.1)
// ---------------------------------------------------------------------------

describe('parsearStock', () => {
  test('">20" retorna stock:21, disponible_a_pedido:false', () => {
    expect(parsearStock('>20')).toEqual({ stock: 21, disponible_a_pedido: false });
  });

  test('valor vacío retorna stock:0, disponible_a_pedido:true', () => {
    expect(parsearStock('')).toEqual({ stock: 0, disponible_a_pedido: true });
  });

  test('entero positivo N retorna stock:N, disponible_a_pedido:false', () => {
    expect(parsearStock('5')).toEqual({ stock: 5, disponible_a_pedido: false });
    expect(parsearStock('100')).toEqual({ stock: 100, disponible_a_pedido: false });
  });

  test('cero retorna stock:0, disponible_a_pedido:false', () => {
    expect(parsearStock('0')).toEqual({ stock: 0, disponible_a_pedido: false });
  });

  test('valor inesperado (texto no numérico) retorna a pedido', () => {
    expect(parsearStock('N/A')).toEqual({ stock: 0, disponible_a_pedido: true });
    expect(parsearStock('--')).toEqual({ stock: 0, disponible_a_pedido: true });
  });

  test('null retorna stock:0, disponible_a_pedido:true', () => {
    expect(parsearStock(null)).toEqual({ stock: 0, disponible_a_pedido: true });
  });
});

// ---------------------------------------------------------------------------
// parsearCSV — pruebas unitarias (Task 14.1)
// ---------------------------------------------------------------------------

describe('parsearCSV', () => {
  test('línea bien formada se parsea correctamente', () => {
    const linea = '"CPU AMD Ryzen","CPD001","Ryzen 5 3600[@@@]Box",5,89.90,,"1 año","Incluido","AMD"';
    const filas = parsearCSV(csvBuffer([linea]));

    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      _fila:               1,
      categoria_proveedor: 'CPU AMD Ryzen',
      codigo:              'CPD001',
      nombre_descripcion:  'Ryzen 5 3600[@@@]Box',
      stock_raw:           '5',
      precio_usd_raw:      '89.90',
      garantia:            '1 año',
      marca:               'AMD',
    });
  });

  test('línea con campos vacíos se parsea sin errores', () => {
    const linea = '"CATEGORIA","COD001","Nombre",,,,,,';
    const filas = parsearCSV(csvBuffer([linea]));

    expect(filas).toHaveLength(1);
    expect(filas[0].stock_raw).toBe('');
    expect(filas[0].precio_usd_raw).toBe('');
    expect(filas[0].garantia).toBe('');
    expect(filas[0].marca).toBe('');
  });

  test('líneas vacías son ignoradas', () => {
    const buffer = csvBuffer(['"A","B","C",1,10,,,,', '', '   ', '"D","E","F",2,20,,,,']);
    const filas = parsearCSV(buffer);
    expect(filas).toHaveLength(2);
  });

  test('saltos de línea CRLF son manejados correctamente', () => {
    const buffer = Buffer.from('"A","B","C",1,10,,,,\r\n"D","E","F",2,20,,,,', 'utf8');
    const filas = parsearCSV(buffer);
    expect(filas).toHaveLength(2);
  });

  test('número de fila (_fila) es 1-indexed y correcto', () => {
    const buffer = csvBuffer([
      '"CAT1","COD1","N1",1,10,,,,',
      '"CAT2","COD2","N2",2,20,,,,',
    ]);
    const filas = parsearCSV(buffer);
    expect(filas[0]._fila).toBe(1);
    expect(filas[1]._fila).toBe(2);
  });

  test('CSV estructurado se parsea con encabezados nuevos', () => {
    const buffer = csvBuffer([
      'tabla_destino,subcategoria,categoria,categoria_proveedor,codigo_proveedor,marca,nombre,descripcion_tecnica,stock,disponible_a_pedido,precio_base,garantia,flete,socket,form_factor,wattage,tdp,ram_type',
      'productos_perifericos,mouse,perifericos,mouse usb,MOU123,Logitech,Mouse M100,,10,false,12.5,1 año,D,,,,,',
    ]);
    const filas = parsearCSV(buffer);
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      _fila: 2,
      subcategoria: 'mouse',
      categoria: 'perifericos',
      categoria_proveedor: 'mouse usb',
      codigo: 'MOU123',
      nombre_descripcion: 'Mouse M100',
      stock_raw: '10',
      precio_usd_raw: '12.5',
      marca: 'Logitech',
    });
  });
});

// ---------------------------------------------------------------------------
// importar — pruebas de integración unitaria
// ---------------------------------------------------------------------------

describe('importar', () => {
  const filasBase = [
    {
      _fila: 1,
      categoria_proveedor: 'CPU AMD Ryzen 5',
      codigo: 'R5-3600',
      nombre_descripcion: 'Ryzen 5 3600[@@@]Box',
      stock_raw: '5',
      precio_usd_raw: '89.90',
      garantia: '1 año',
      flete: 'Incluido',
      marca: 'AMD',
    },
  ];

  test('fila válida con inserción nueva incrementa insertados', async () => {
    const db = mockDb(true);
    const resultado = await importar(filasBase, db);
    expect(resultado.insertados).toBe(1);
    expect(resultado.actualizados).toBe(0);
    expect(resultado.omitidos).toBe(0);
    expect(resultado.errores).toBe(0);
  });

  test('fila válida con conflicto incrementa actualizados', async () => {
    const db = mockDb(false);
    const resultado = await importar(filasBase, db);
    expect(resultado.actualizados).toBe(1);
    expect(resultado.insertados).toBe(0);
  });

  test('fila sin categoría reconocida incrementa omitidos', async () => {
    const db = mockDb();
    const filas = [{ ...filasBase[0], categoria_proveedor: 'IMPRESORA LASER' }];
    const resultado = await importar(filas, db);
    expect(resultado.omitidos).toBe(1);
    expect(db).not.toHaveBeenCalled();
  });

  test('precio inválido incrementa errores y agrega detalle', async () => {
    const db = mockDb();
    const filas = [{ ...filasBase[0], precio_usd_raw: 'N/A' }];
    const resultado = await importar(filas, db);
    expect(resultado.errores).toBe(1);
    expect(resultado.detalle_errores).toHaveLength(1);
    expect(resultado.detalle_errores[0].fila).toBe(1);
    expect(db).not.toHaveBeenCalled();
  });

  test('precio cero incrementa errores', async () => {
    const db = mockDb();
    const filas = [{ ...filasBase[0], precio_usd_raw: '0' }];
    const resultado = await importar(filas, db);
    expect(resultado.errores).toBe(1);
  });

  test('error de DB incrementa errores y agrega detalle', async () => {
    const db = jest.fn().mockRejectedValue(new Error('duplicate key value'));
    const resultado = await importar(filasBase, db);
    expect(resultado.errores).toBe(1);
    expect(resultado.detalle_errores[0].mensaje).toContain('duplicate key value');
  });

  test('upsert nunca incluye imagen_url, imagen_path, socket, ram_type, form_factor, wattage, tdp en UPDATE', async () => {
    const db = mockDb(false);
    await importar(filasBase, db);
    const sql = db.mock.calls[0][0];
    // Las columnas protegidas NO deben aparecer en el SET del UPDATE
    expect(sql).not.toMatch(/imagen_url\s*=/);
    expect(sql).not.toMatch(/imagen_path\s*=/);
    expect(sql).not.toMatch(/socket\s*=/);
    expect(sql).not.toMatch(/ram_type\s*=/);
    expect(sql).not.toMatch(/form_factor\s*=/);
    expect(sql).not.toMatch(/wattage\s*=/);
    expect(sql).not.toMatch(/tdp\s*=/);
  });
});

// ===========================================================================
// PROPERTY-BASED TESTING (fast-check) — Subtasks 2.2–2.6 / Task 14.2
// ===========================================================================

const PBT_RUNS = 100;

// ---------------------------------------------------------------------------
// Propiedad 13: limpiarNombre elimina sufijo [@@@] en cualquier posición
// Feature: reestructuracion-catalogo-productos, Propiedad 13
// Valida: Requisito 5.2
// ---------------------------------------------------------------------------

describe('PBT — Propiedad 13: limpiarNombre elimina sufijo [@@@]', () => {
  test('para cualquier prefijo + [@@@] + sufijo, retorna solo el prefijo con trim', () => {
    // Feature: reestructuracion-catalogo-productos, Propiedad 13
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 100 }),
        (prefijo, sufijo) => {
          const entrada = prefijo + '[@@@]' + sufijo;
          const resultado = limpiarNombre(entrada);
          const esperado = prefijo.trim().replace(/\s+/g, ' ');
          return resultado === esperado;
        }
      ),
      { numRuns: PBT_RUNS }
    );
  });
});

// ---------------------------------------------------------------------------
// Propiedad 14: parsearStock es determinista para N >= 0
// Feature: reestructuracion-catalogo-productos, Propiedad 14
// Valida: Requisito 5.3
// ---------------------------------------------------------------------------

describe('PBT — Propiedad 14: parsearStock es determinista para N >= 0', () => {
  test('para cualquier entero N en [0, 9999], stock===N y disponible_a_pedido===false', () => {
    // Feature: reestructuracion-catalogo-productos, Propiedad 14
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9999 }),
        (n) => {
          const resultado = parsearStock(n.toString());
          return resultado.stock === n && resultado.disponible_a_pedido === false;
        }
      ),
      { numRuns: PBT_RUNS }
    );
  });
});

// ---------------------------------------------------------------------------
// Propiedad 16: mapearCategoria retorna null para entradas no reconocidas
// Feature: reestructuracion-catalogo-productos, Propiedad 16
// Valida: Requisito 5.5
// ---------------------------------------------------------------------------

describe('PBT — Propiedad 16: mapearCategoria retorna null para no reconocidas', () => {
  // Pre-calcular claves en minúsculas una sola vez
  const clavesMin = Object.keys(MAPA_CATEGORIAS).map((k) => k.toLowerCase());

  test('string que no comienza con ninguna clave del mapa retorna null', () => {
    // Feature: reestructuracion-catalogo-productos, Propiedad 16
    fc.assert(
      fc.property(
        // Generar strings cuyo valor en minúsculas NO sea prefijo de ninguna clave
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => {
          const norm = s.toLowerCase().trim();
          return !clavesMin.some((clave) => norm.startsWith(clave));
        }),
        (s) => mapearCategoria(s) === null
      ),
      { numRuns: PBT_RUNS }
    );
  });
});

// ---------------------------------------------------------------------------
// Propiedad 17: mapearCategoria es determinista para entradas del mapa
// Feature: reestructuracion-catalogo-productos, Propiedad 17
// Valida: Requisito 5.7
// ---------------------------------------------------------------------------

describe('PBT — Propiedad 17: mapearCategoria es determinista para claves del mapa', () => {
  const entradas = Object.entries(MAPA_CATEGORIAS);

  test('para cada clave K en MAPA_CATEGORIAS, mapearCategoria(K) === MAPA_CATEGORIAS[K]', () => {
    // Feature: reestructuracion-catalogo-productos, Propiedad 17
    fc.assert(
      fc.property(
        fc.constantFrom(...entradas),
        ([clave, valorEsperado]) => mapearCategoria(clave) === valorEsperado
      ),
      { numRuns: PBT_RUNS }
    );
  });
});

// ---------------------------------------------------------------------------
// Propiedad 18: insertados + actualizados + omitidos + errores === total filas
// Feature: reestructuracion-catalogo-productos, Propiedad 18
// Valida: Requisito 5.9
// ---------------------------------------------------------------------------

describe('PBT — Propiedad 18: contadores suman al total de filas', () => {
  // Generador de fila aleatoria con valores que pueden ser válidos o inválidos
  const filaArbitraria = fc.record({
    _fila:               fc.nat({ max: 9999 }).map((n) => n + 1),
    categoria_proveedor: fc.oneof(
      // 50% de probabilidad de categoría reconocida
      fc.constantFrom(...Object.keys(MAPA_CATEGORIAS)),
      // 50% de probabilidad de categoría no reconocida
      fc.string({ minLength: 1, maxLength: 30 }).filter(
        (s) => !Object.keys(MAPA_CATEGORIAS).some((k) => s.toLowerCase().trim().startsWith(k))
      )
    ),
    codigo:              fc.string({ minLength: 1, maxLength: 20 }),
    nombre_descripcion:  fc.string({ minLength: 1, maxLength: 100 }),
    stock_raw:           fc.oneof(
      fc.constant('>20'),
      fc.constant(''),
      fc.nat({ max: 50 }).map(String)
    ),
    precio_usd_raw:      fc.oneof(
      // Precios válidos
      fc.float({ min: Math.fround(0.01), max: Math.fround(9999), noNaN: true }).map((p) => p.toFixed(2)),
      // Precios inválidos
      fc.constant(''),
      fc.constant('N/A'),
      fc.constant('0'),
      fc.constant('-1'),
    ),
    garantia:            fc.string({ minLength: 0, maxLength: 30 }),
    flete:               fc.string({ minLength: 0, maxLength: 20 }),
    marca:               fc.string({ minLength: 0, maxLength: 30 }),
  });

  test('suma de contadores es siempre igual al número total de filas', async () => {
    // Feature: reestructuracion-catalogo-productos, Propiedad 18
    await fc.assert(
      fc.asyncProperty(
        fc.array(filaArbitraria, { minLength: 0, maxLength: 20 }),
        async (filas) => {
          // Mock de db: simula éxito con inserción nueva
          const db = jest.fn().mockResolvedValue({ rows: [{ es_insercion: true }] });
          const resultado = await importar(filas, db);
          const suma = resultado.insertados + resultado.actualizados + resultado.omitidos + resultado.errores;
          return suma === filas.length;
        }
      ),
      { numRuns: PBT_RUNS }
    );
  });
});
