# Documento de Diseño Técnico

## Reestructuración del Catálogo de Productos — NSG Cotizador

---

## Descripción General

Este documento describe el diseño técnico para reemplazar la tabla monolítica `productos` por 23 tablas separadas por categoría normalizada, agregar soporte de imágenes por producto, implementar un importador de CSV de Deltron, y extender el cotizador con una sección de extras opcionales.

El sistema mantiene el stack existente: Node.js + Express + PostgreSQL (backend), React + Tailwind + Vite (frontend).

---

## Arquitectura General

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)                                            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Cotizador   │  │ ImportarCSV  │  │  Panel Admin (existente) │  │
│  │  .jsx        │  │ .jsx         │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘  │
│         │                 │                                         │
│  ┌──────▼─────────────────▼──────────────────────────────────────┐  │
│  │  api.js  (cliente Axios centralizado)                         │  │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │  AppContext.jsx  (estado global: productos, extras, config)  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTP/JSON
┌─────────────────────────────▼───────────────────────────────────────┐
│  BACKEND (Node.js + Express)                                        │
│                                                                     │
│  ┌─────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  rutas/productos.js │  │  rutas/importacion.js (nuevo)        │  │
│  └──────────┬──────────┘  └──────────────┬───────────────────────┘  │
│             │                            │                          │
│  ┌──────────▼──────────┐  ┌──────────────▼───────────────────────┐  │
│  │ controladorProductos│  │  controladorImportacion.js (nuevo)   │  │
│  │ .js (refactorizado) │  └──────────────┬───────────────────────┘  │
│  └──────────┬──────────┘                 │                          │
│             │              ┌─────────────▼───────────────────────┐  │
│             │              │  servicioImportacion.js (nuevo)     │  │
│             │              └─────────────────────────────────────┘  │
│             │                                                        │
│  ┌──────────▼──────────────────────────────────────────────────┐    │
│  │  servicioCompatibilidad.js (sin cambios en lógica)          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  middleware/multer.js  (upload de imágenes y CSV)            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ pg (node-postgres)
┌─────────────────────────────▼────────────────────────────────────────┐
│  PostgreSQL                                                          │
│                                                                      │
│  productos_procesador    productos_placa_madre    productos_ram      │
│  productos_almacenamiento  productos_gpu          productos_fuente   │
│  productos_case          productos_mouse          productos_teclado  │
│  productos_webcam        productos_auricular      productos_parlante │
│  productos_software_windows  productos_software_office              │
│  productos_software_antivirus  productos_almacenamiento_externo     │
│  productos_ups           productos_estabilizador  productos_monitor  │
│  productos_cooler_aire   productos_cooler_liquido productos_conectividad │
│  productos_mousepad                                                  │
│                                                                      │
│  detalle_cotizacion (+ columna tabla_producto)                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos: CSV → Importador → Tablas → API → Frontend

```
Archivo CSV Deltron
      │
      ▼
POST /api/importacion/csv  (multer: buffer en memoria)
      │
      ▼
controladorImportacion.js
  └─► validar extensión y MIME
  └─► servicioImportacion.parsearCSV(buffer)
        └─► split por líneas, parsear campos entre comillas
        └─► retorna: [{categoria_proveedor, codigo, nombre, stock, precio_usd, garantia, flete, marca}]
  └─► servicioImportacion.importar(filas)
        └─► para cada fila:
              mapearCategoria(categoria_proveedor) → categoria | null
              si null → omitidos++, continuar
              limpiarNombre(nombre) → nombre limpio
              parsearStock(stock) → {stock, disponible_a_pedido}
              validar precio_usd numérico → si no, errores++, continuar
              upsert en productos_{categoria} por codigo_proveedor
              → INSERT ON CONFLICT (codigo_proveedor) DO UPDATE
        └─► retorna {insertados, actualizados, omitidos, errores, detalle_errores}
      │
      ▼
Respuesta JSON al frontend

Frontend (ImportarCSV.jsx)
  └─► muestra resumen: insertados / actualizados / omitidos / errores
  └─► lista detalle_errores si hay errores
```

---

## Esquema de Base de Datos

### Template de Tabla (aplicado a las 23 categorías)

```sql
CREATE TABLE IF NOT EXISTS productos_{categoria} (
  id                    SERIAL PRIMARY KEY,
  nombre                VARCHAR(300) NOT NULL,
  categoria             VARCHAR(50)  NOT NULL,
  categoria_proveedor   VARCHAR(200),
  codigo_proveedor      VARCHAR(100) NOT NULL,
  marca                 VARCHAR(100),
  socket                VARCHAR(50),
  ram_type              VARCHAR(20),
  form_factor           VARCHAR(20),
  wattage               INTEGER,
  tdp                   INTEGER,
  precio_base           DECIMAL(10,2) NOT NULL,
  precio_pen            DECIMAL(10,2),
  stock                 INTEGER      NOT NULL DEFAULT 0,
  disponible_a_pedido   BOOLEAN      NOT NULL DEFAULT false,
  tiempo_entrega_dias   INTEGER,
  descripcion_tecnica   TEXT,
  imagen_url            VARCHAR(500),
  imagen_path           VARCHAR(255),
  garantia              VARCHAR(100),
  flete                 VARCHAR(100),
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_{categoria}_codigo_proveedor UNIQUE (codigo_proveedor),
  CONSTRAINT chk_{categoria}_precio_base     CHECK  (precio_base > 0),
  CONSTRAINT chk_{categoria}_stock           CHECK  (stock >= 0)
);

CREATE INDEX IF NOT EXISTS idx_{categoria}_stock
  ON productos_{categoria}(stock);
CREATE INDEX IF NOT EXISTS idx_{categoria}_codigo_proveedor
  ON productos_{categoria}(codigo_proveedor);
CREATE INDEX IF NOT EXISTS idx_{categoria}_marca
  ON productos_{categoria}(marca);

CREATE TRIGGER trigger_{categoria}_updated_at
  BEFORE UPDATE ON productos_{categoria}
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
```

### Las 23 tablas a crear

**Armado PC (7):**
`productos_procesador`, `productos_placa_madre`, `productos_ram`,
`productos_almacenamiento`, `productos_gpu`, `productos_fuente`, `productos_case`

**Extras (16):**
`productos_mouse`, `productos_teclado`, `productos_webcam`, `productos_auricular`,
`productos_parlante`, `productos_software_windows`, `productos_software_office`,
`productos_software_antivirus`, `productos_almacenamiento_externo`, `productos_ups`,
`productos_estabilizador`, `productos_monitor`, `productos_cooler_aire`,
`productos_cooler_liquido`, `productos_conectividad`, `productos_mousepad`

### Modificación de `detalle_cotizacion`

```sql
ALTER TABLE detalle_cotizacion
  ADD COLUMN IF NOT EXISTS tabla_producto VARCHAR(50) NOT NULL DEFAULT 'productos_procesador';

-- Eliminar FK existente a productos (tabla legacy)
ALTER TABLE detalle_cotizacion
  DROP CONSTRAINT IF EXISTS detalle_cotizacion_id_producto_fkey;

-- NOTA: No se agrega FK polimórfica a las 23 tablas.
-- La integridad referencial se garantiza a nivel de aplicación:
-- controladorCotizaciones verifica existencia en la tabla indicada por tabla_producto
-- antes de insertar en detalle_cotizacion.
-- Razón: PostgreSQL no soporta FK polimórficas nativas; la alternativa (tabla de herencia
-- o tabla de IDs globales) añade complejidad innecesaria para este caso de uso.
```

### Script de Migración de Datos

```sql
-- Ejecutar dentro de una transacción
BEGIN;

-- 1. Contar registros originales
DO $$
DECLARE
  conteo_original INTEGER;
  conteo_migrado  INTEGER;
BEGIN
  SELECT COUNT(*) INTO conteo_original FROM productos;

  -- 2. Migrar a tabla correspondiente según categoria
  -- Procesador
  INSERT INTO productos_procesador (
    nombre, categoria, codigo_proveedor, marca, socket, ram_type, form_factor,
    wattage, tdp, precio_base, stock, disponible_a_pedido, tiempo_entrega_dias,
    descripcion_tecnica, imagen_url, created_at, updated_at
  )
  SELECT
    nombre, 'procesador',
    COALESCE(NULLIF(trim(nombre), ''), 'LEGACY-' || id::text),
    NULL, socket, ram_type, form_factor, wattage, tdp, precio_base,
    stock, disponible_a_pedido, tiempo_entrega_dias,
    descripcion_tecnica, imagen_url, created_at, updated_at
  FROM productos
  WHERE categoria = 'procesador'
  ON CONFLICT (codigo_proveedor) DO NOTHING;

  -- (Repetir para cada categoría: placa_madre, ram, almacenamiento, gpu, fuente, case)
  -- El script completo en base-datos/migracion_v2.sql itera todas las categorías.

  -- 3. Verificar conteo
  SELECT SUM(cnt) INTO conteo_migrado FROM (
    SELECT COUNT(*) cnt FROM productos_procesador
    UNION ALL SELECT COUNT(*) FROM productos_placa_madre
    UNION ALL SELECT COUNT(*) FROM productos_ram
    UNION ALL SELECT COUNT(*) FROM productos_almacenamiento
    UNION ALL SELECT COUNT(*) FROM productos_gpu
    UNION ALL SELECT COUNT(*) FROM productos_fuente
    UNION ALL SELECT COUNT(*) FROM productos_case
  ) t;

  IF conteo_migrado < conteo_original THEN
    RAISE EXCEPTION 'Migración incompleta: % registros originales, % migrados',
      conteo_original, conteo_migrado;
  END IF;
END $$;

COMMIT;
```

Los registros sin `codigo_proveedor` conocido reciben el código temporal `LEGACY-{id}`.
La tabla `productos` original se mantiene hasta validar la migración; se elimina en un paso posterior explícito.

---

## Componentes e Interfaces

### Backend — Constante de Mapeo de Categorías

**Archivo:** `backend/src/servicios/servicioImportacion.js`

```js
// Tabla configurable: agregar nuevas categorías aquí sin tocar la lógica de importación.
// Clave: prefijo de categoria_proveedor en minúsculas (comparación startsWith).
// Valor: nombre de categoría normalizada (sufijo de tabla productos_{categoria}).
const MAPA_CATEGORIAS = {
  // Armado PC
  'cpu amd ryzen':              'procesador',
  'cpu amd athlon':             'procesador',
  'cpu ci':                     'procesador',
  'cpu cu':                     'procesador',
  'mb ci9':                     'placa_madre',
  'mb cu9':                     'placa_madre',
  'mb socket am4':              'placa_madre',
  'mb socket am5':              'placa_madre',
  'mb socket i':                'placa_madre',
  'mb socket lga':              'placa_madre',
  'mem ddr4':                   'ram',
  'mem ddr5':                   'ram',
  'mem sodimm':                 'ram',
  'mem ddr3':                   'ram',
  'ssd 2.5 sata':               'almacenamiento',
  'ssd m.2 nvme':               'almacenamiento',
  'ssd m.2 sata':               'almacenamiento',
  'disco duro 3.5 sata':        'almacenamiento',
  'video, pci exp nvidia':      'gpu',
  'video, pci exp radeon':      'gpu',
  'video, pci exp intel':       'gpu',
  'video, pci express nvidia':  'gpu',
  'cases, fuente para gaming':  'fuente',
  'cases, fuente certificada':  'fuente',
  'cases, fuente para':         'fuente',
  'cases atx ver2.0':           'case',
  'cases micro atx':            'case',
  'cases sin fuente p/gamers':  'case',
  'cases atx':                  'case',
  // Extras
  'mouse usb':                  'mouse',
  'mouse inalambrico':          'mouse',
  'mouse para gamers':          'mouse',
  'teclado usb':                'teclado',
  'teclado inalambrico':        'teclado',
  'teclado para gamers':        'teclado',
  'teclado+mouse combo kit':    'teclado',
  'teclado+mouse kit inalamb':  'teclado',
  'camara, webcam':             'webcam',
  'audio, auricular c/mic':     'auricular',
  'audio, parlante inalambrc':  'parlante',
  'ms windows business':        'software_windows',
  'ms windows consumer':        'software_windows',
  'ms esd windows business':    'software_windows',
  'ms esd windows consumer':    'software_windows',
  'ms esd office':              'software_office',
  'ms esd office 365':          'software_office',
  'ms office':                  'software_office',
  'software, antivirus':        'software_antivirus',
  'kaspersky esd consumo':      'software_antivirus',
  'kaspersky esd business':     'software_antivirus',
  'disco duro externo 2.5':     'almacenamiento_externo',
  'disco solido externo(ssd)':  'almacenamiento_externo',
  'mem flash, usb drive':       'almacenamiento_externo',
  'ups interactivo':            'ups',
  'estabilizador de tension':   'estabilizador',
  'monitor plano':              'monitor',
  'monitor curvo':              'monitor',
  'monitor gaming plano':       'monitor',
  'monitor gaming curvo':       'monitor',
  'monitores tft':              'monitor',
  'fan cooler cpu':             'cooler_aire',
  'cooler liquido cpu':         'cooler_liquido',
  'red wifi adaptadores usb':   'conectividad',
  'red wifi router-adsl':       'conectividad',
  'mouse pad/mat, accesorios':  'mousepad',
};

// Conjunto de categorías válidas (para validación rápida)
const CATEGORIAS_VALIDAS = new Set([
  'procesador', 'placa_madre', 'ram', 'almacenamiento', 'gpu', 'fuente', 'case',
  'mouse', 'teclado', 'webcam', 'auricular', 'parlante',
  'software_windows', 'software_office', 'software_antivirus',
  'almacenamiento_externo', 'ups', 'estabilizador', 'monitor',
  'cooler_aire', 'cooler_liquido', 'conectividad', 'mousepad',
]);
```

### Backend — `servicioImportacion.js`

```js
/**
 * @param {string} categoriaCSV  — valor original del campo categoria del CSV
 * @returns {string|null}  — categoria normalizada o null si no mapea
 */
function mapearCategoria(categoriaCSV) {
  const normalizada = String(categoriaCSV || '').toLowerCase().trim();
  // Buscar la clave más larga que sea prefijo de la categoria del CSV
  // (orden descendente por longitud para evitar matches parciales incorrectos)
  const claves = Object.keys(MAPA_CATEGORIAS).sort((a, b) => b.length - a.length);
  for (const clave of claves) {
    if (normalizada.startsWith(clave)) {
      return MAPA_CATEGORIAS[clave];
    }
  }
  return null;
}

/**
 * @param {string} descripcion  — campo nombre_descripcion del CSV
 * @returns {string}  — nombre limpio sin sufijo [@@@]
 */
function limpiarNombre(descripcion) {
  return String(descripcion || '').split('[@@@]')[0].trim();
}

/**
 * @param {string} valor  — campo stock del CSV
 * @returns {{ stock: number, disponible_a_pedido: boolean }}
 */
function parsearStock(valor) {
  const v = String(valor || '').trim();
  if (v === '>20') return { stock: 21, disponible_a_pedido: false };
  if (v === '')    return { stock: 0,  disponible_a_pedido: true  };
  const n = parseInt(v, 10);
  if (!isNaN(n) && n >= 0) return { stock: n, disponible_a_pedido: false };
  // Valor inesperado: tratar como disponible a pedido
  return { stock: 0, disponible_a_pedido: true };
}

/**
 * @param {Buffer} buffer  — contenido del archivo CSV
 * @returns {Array<Object>}  — filas parseadas
 * Formato CSV Deltron: "categoria","codigo","nombre_descripcion",stock,precio_usd,,"garantia","flete","marca"
 */
function parsearCSV(buffer) {
  const texto = buffer.toString('utf8');
  const lineas = texto.split(/\r?\n/).filter(l => l.trim());
  return lineas.map((linea, indice) => {
    // Parseo simple: campos separados por coma, strings entre comillas dobles
    const campos = parsearLineaCSV(linea);
    return {
      _fila: indice + 1,
      categoria_proveedor: (campos[0] || '').replace(/^"|"$/g, '').trim(),
      codigo:              (campos[1] || '').replace(/^"|"$/g, '').trim(),
      nombre_descripcion:  (campos[2] || '').replace(/^"|"$/g, '').trim(),
      stock_raw:           (campos[3] || '').trim(),
      precio_usd_raw:      (campos[4] || '').trim(),
      garantia:            (campos[6] || '').replace(/^"|"$/g, '').trim(),
      flete:               (campos[7] || '').replace(/^"|"$/g, '').trim(),
      marca:               (campos[8] || '').replace(/^"|"$/g, '').trim(),
    };
  });
}

/**
 * @param {Array<Object>} filas  — resultado de parsearCSV
 * @param {Object} db  — instancia de ejecutarQuery
 * @returns {Promise<{ insertados, actualizados, omitidos, errores, detalle_errores }>}
 */
async function importar(filas, db) {
  let insertados = 0, actualizados = 0, omitidos = 0, errores = 0;
  const detalle_errores = [];

  for (const fila of filas) {
    const categoria = mapearCategoria(fila.categoria_proveedor);
    if (!categoria) { omitidos++; continue; }

    const precio = parseFloat(fila.precio_usd_raw);
    if (!fila.precio_usd_raw || isNaN(precio) || precio <= 0) {
      errores++;
      detalle_errores.push({ fila: fila._fila, mensaje: `precio_usd inválido: "${fila.precio_usd_raw}"` });
      continue;
    }

    const nombre = limpiarNombre(fila.nombre_descripcion);
    const { stock, disponible_a_pedido } = parsearStock(fila.stock_raw);
    const tabla = `productos_${categoria}`;

    try {
      const resultado = await db(
        `INSERT INTO ${tabla}
           (nombre, categoria, categoria_proveedor, codigo_proveedor, marca,
            precio_base, stock, disponible_a_pedido, garantia, flete)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (codigo_proveedor) DO UPDATE SET
           nombre             = EXCLUDED.nombre,
           categoria_proveedor= EXCLUDED.categoria_proveedor,
           precio_base        = EXCLUDED.precio_base,
           stock              = EXCLUDED.stock,
           disponible_a_pedido= EXCLUDED.disponible_a_pedido,
           garantia           = EXCLUDED.garantia,
           flete              = EXCLUDED.flete,
           marca              = EXCLUDED.marca
         RETURNING (xmax = 0) AS es_insercion`,
        [nombre, categoria, fila.categoria_proveedor, fila.codigo,
         fila.marca, precio, stock, disponible_a_pedido, fila.garantia, fila.flete]
      );
      if (resultado.rows[0].es_insercion) insertados++;
      else actualizados++;
    } catch (err) {
      errores++;
      detalle_errores.push({ fila: fila._fila, mensaje: err.message });
    }
  }

  return { insertados, actualizados, omitidos, errores, detalle_errores };
}
```

**Decisión de diseño:** El upsert usa `ON CONFLICT (codigo_proveedor) DO UPDATE` y excluye explícitamente `imagen_url`, `imagen_path`, `socket`, `ram_type`, `form_factor`, `wattage`, `tdp` del SET — estos campos solo se modifican manualmente por el admin, nunca por el importador.

### Backend — `controladorProductos.js` (refactorizado)

```js
// Tablas válidas (whitelist para prevenir SQL injection en nombres de tabla)
const TABLAS_VALIDAS = new Set([
  'productos_procesador', 'productos_placa_madre', 'productos_ram',
  'productos_almacenamiento', 'productos_gpu', 'productos_fuente', 'productos_case',
  'productos_mouse', 'productos_teclado', 'productos_webcam', 'productos_auricular',
  'productos_parlante', 'productos_software_windows', 'productos_software_office',
  'productos_software_antivirus', 'productos_almacenamiento_externo', 'productos_ups',
  'productos_estabilizador', 'productos_monitor', 'productos_cooler_aire',
  'productos_cooler_liquido', 'productos_conectividad', 'productos_mousepad',
]);

/**
 * Resuelve el nombre de tabla a partir de la categoría normalizada.
 * @param {string} categoria
 * @returns {string}  nombre de tabla validado
 * @throws {Error}  si la categoría no es válida
 */
function resolverTabla(categoria) {
  const tabla = `productos_${categoria}`;
  if (!TABLAS_VALIDAS.has(tabla)) {
    throw new Error(`Categoría inválida: ${categoria}`);
  }
  return tabla;
}

// Campos comunes retornados en todas las consultas
const CAMPOS_COMUNES = `
  id, nombre, categoria, codigo_proveedor, marca,
  socket, ram_type, form_factor, wattage, tdp,
  precio_base, precio_pen, stock, disponible_a_pedido,
  tiempo_entrega_dias, descripcion_tecnica,
  imagen_url, imagen_path, garantia, flete,
  created_at, updated_at
`;

/**
 * GET /api/productos?categoria=X&marca=Y&busqueda=Z&socket=S&ram_type=R
 * Sin categoria: UNION de las 23 tablas.
 * Con categoria: consulta tabla específica.
 */
async function obtenerProductos(req, res) {
  const { categoria, marca, busqueda, socket, ram_type } = req.query;
  const params = [];
  let idx = 1;

  const construirWhere = () => {
    const condiciones = ['(stock > 0 OR disponible_a_pedido = true)'];
    if (marca) {
      condiciones.push(`marca ILIKE $${idx++}`);
      params.push(`%${marca}%`);
    }
    if (busqueda) {
      condiciones.push(`(nombre ILIKE $${idx++} OR descripcion_tecnica ILIKE $${idx++})`);
      params.push(`%${busqueda}%`, `%${busqueda}%`);
    }
    if (socket) {
      condiciones.push(`socket = $${idx++}`);
      params.push(socket);
    }
    if (ram_type) {
      condiciones.push(`ram_type = $${idx++}`);
      params.push(ram_type);
    }
    return condiciones.join(' AND ');
  };

  try {
    let query;
    if (categoria) {
      const tabla = resolverTabla(categoria);
      const where = construirWhere();
      query = `SELECT ${CAMPOS_COMUNES} FROM ${tabla} WHERE ${where} ORDER BY nombre`;
    } else {
      // UNION de las 23 tablas
      const tablas = [...TABLAS_VALIDAS];
      const where = construirWhere();
      const paramsBase = [...params];
      const selects = tablas.map(tabla => {
        // Cada SELECT en el UNION usa los mismos parámetros
        return `SELECT ${CAMPOS_COMUNES} FROM ${tabla} WHERE ${where}`;
      });
      // Resetear params para el UNION (cada SELECT usa los mismos $1..$N)
      params.length = 0;
      params.push(...paramsBase);
      query = `(${selects.join(') UNION ALL (')}) ORDER BY categoria, nombre`;
    }

    const resultado = await ejecutarQuery(query, params);
    res.json({ exito: true, cantidad: resultado.rows.length, productos: resultado.rows });
  } catch (error) {
    if (error.message.startsWith('Categoría inválida')) {
      return res.status(400).json({ error: 'Categoría inválida', mensaje: error.message });
    }
    res.status(500).json({ error: 'Error al obtener productos' });
  }
}

/**
 * GET /api/productos/:categoria/:id
 */
async function obtenerProductoPorId(req, res) {
  const { categoria, id } = req.params;
  try {
    const tabla = resolverTabla(categoria);
    const resultado = await ejecutarQuery(
      `SELECT ${CAMPOS_COMUNES} FROM ${tabla} WHERE id = $1`,
      [parseInt(id, 10)]
    );
    if (!resultado.rows.length) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ exito: true, producto: resultado.rows[0] });
  } catch (error) {
    if (error.message.startsWith('Categoría inválida')) {
      return res.status(400).json({ error: 'Categoría inválida' });
    }
    res.status(500).json({ error: 'Error al obtener producto' });
  }
}

/**
 * POST /api/productos/:categoria/:id/imagen
 * Requiere autenticación. Usa multer (ver rutas).
 */
async function subirImagenProducto(req, res) {
  const { categoria, id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió archivo' });
  }
  try {
    const tabla = resolverTabla(categoria);
    const imagenPath = `uploads/${req.file.filename}`;
    await ejecutarQuery(
      `UPDATE ${tabla} SET imagen_path = $1 WHERE id = $2`,
      [imagenPath, parseInt(id, 10)]
    );
    res.json({ exito: true, imagen_path: imagenPath });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar imagen' });
  }
}
```

**Seguridad:** Los nombres de tabla nunca se construyen por concatenación directa de input del usuario. `resolverTabla()` valida contra `TABLAS_VALIDAS` (whitelist) antes de usar el nombre en la query. Los valores de filtro siempre van como parámetros `$N`.

### Backend — Multer (imágenes y CSV)

```js
// middleware/multerImagen.js
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const almacenamientoImagen = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nombre = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, nombre);
  },
});

const filtroImagen = (req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (tiposPermitidos.includes(file.mimetype)) cb(null, true);
  else cb(Object.assign(new Error('Tipo de archivo no permitido'), { codigo: 'TIPO_INVALIDO' }));
};

const uploadImagen = multer({
  storage: almacenamientoImagen,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: filtroImagen,
});

// middleware/multerCSV.js
const uploadCSV = multer({
  storage: multer.memoryStorage(), // CSV en memoria para procesamiento inmediato
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const tiposPermitidos = ['text/csv', 'text/plain', 'application/csv'];
    if (ext === '.csv' && (tiposPermitidos.includes(file.mimetype) || file.mimetype.includes('csv'))) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Solo se aceptan archivos .csv'), { codigo: 'TIPO_INVALIDO' }));
    }
  },
});
```

### Backend — Rutas

**`rutas/productos.js`** (actualizado):

```js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const uploadImagen = require('../middleware/multerImagen');
const ctrl = require('../controladores/controladorProductos');

// Públicas
router.get('/',                          ctrl.obtenerProductos);
router.get('/:categoria/:id',            ctrl.obtenerProductoPorId);

// Protegidas
router.post('/',                         verificarToken, ctrl.crearProducto);
router.put('/:categoria/:id',            verificarToken, ctrl.actualizarProducto);
router.delete('/:categoria/:id',         verificarToken, ctrl.eliminarProducto);
router.post('/:categoria/:id/imagen',    verificarToken,
  uploadImagen.single('imagen'),
  (err, req, res, next) => {
    if (err?.codigo === 'TIPO_INVALIDO') return res.status(400).json({ error: err.message });
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Archivo demasiado grande (máx 5 MB)' });
    next(err);
  },
  ctrl.subirImagenProducto
);

module.exports = router;
```

**`rutas/importacion.js`** (nuevo):

```js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const uploadCSV = require('../middleware/multerCSV');
const ctrl = require('../controladores/controladorImportacion');

router.post('/csv',
  verificarToken,
  uploadCSV.single('archivo'),
  (err, req, res, next) => {
    if (err?.codigo === 'TIPO_INVALIDO') return res.status(400).json({ error: err.message });
    next(err);
  },
  ctrl.importarCSV
);

module.exports = router;
```

**`servidor.js`** — agregar registro:

```js
const rutasImportacion = require('./rutas/importacion');
app.use('/api/importacion', rutasImportacion);
```

---

## Modelos de Datos

### Objeto Producto (respuesta de API)

```ts
interface Producto {
  id:                   number;
  nombre:               string;
  categoria:            string;          // categoria normalizada
  codigo_proveedor:     string;
  marca:                string | null;
  socket:               string | null;
  ram_type:             string | null;
  form_factor:          string | null;
  wattage:              number | null;
  tdp:                  number | null;
  precio_base:          number;          // USD
  precio_pen:           number | null;   // PEN calculado
  stock:                number;
  disponible_a_pedido:  boolean;
  tiempo_entrega_dias:  number | null;
  descripcion_tecnica:  string | null;
  imagen_url:           string | null;
  imagen_path:          string | null;
  garantia:             string | null;
  flete:                string | null;
  created_at:           string;          // ISO 8601
  updated_at:           string;
}
```

### Objeto Extra en Payload de Cotización

```ts
interface ItemCotizacion {
  id_producto:    number;
  tabla_producto: string;   // ej: "productos_monitor"
  cantidad:       number;   // >= 1
}
```

### Resultado de Importación

```ts
interface ResultadoImportacion {
  insertados:      number;
  actualizados:    number;
  omitidos:        number;   // filas con categoria no reconocida
  errores:         number;
  detalle_errores: Array<{ fila: number; mensaje: string }>;
}
```

### Fila CSV Deltron (parseada)

```ts
interface FilaCSV {
  _fila:               number;   // número de línea (para detalle_errores)
  categoria_proveedor: string;
  codigo:              string;
  nombre_descripcion:  string;
  stock_raw:           string;
  precio_usd_raw:      string;
  garantia:            string;
  flete:               string;
  marca:               string;
}
```

---

## Frontend — AppContext

### Cambios en estado

```js
// Estado adicional para extras
const [extras, setExtras] = useState({});
// Estructura: { [categoria]: [{ producto, cantidad }] }
// Ejemplo: { monitor: [{ producto: {...}, cantidad: 2 }] }
```

### Funciones nuevas/modificadas

```js
/**
 * Carga productos de una categoría específica.
 * @param {string} categoria  — nombre normalizado
 * @param {Object} filtros    — { marca, busqueda, socket, ram_type }
 */
const cargarProductosPorCategoria = async (categoria, filtros = {}) => {
  setCargandoProductos(true);
  try {
    const data = await api.obtenerProductosPorCategoria(categoria, filtros);
    const lista = data.productos || [];
    setProductos(prev => {
      // Reemplazar productos de esta categoría, mantener el resto
      const sinCategoria = prev.filter(p => p.categoria !== categoria);
      return [...sinCategoria, ...lista];
    });
    return lista;
  } finally {
    setCargandoProductos(false);
  }
};

/**
 * Carga múltiples categorías de extras en paralelo.
 * @param {string[]} categorias
 */
const cargarExtras = async (categorias) => {
  const resultados = await Promise.all(
    categorias.map(cat => api.obtenerProductosPorCategoria(cat))
  );
  const nuevosProductos = resultados.flatMap(r => r.productos || []);
  setProductos(prev => {
    const sinExtras = prev.filter(p => !categorias.includes(p.categoria));
    return [...sinExtras, ...nuevosProductos];
  });
};

/**
 * Agrega o incrementa un extra en la selección.
 * @param {string} categoria
 * @param {Object} producto
 */
const agregarExtra = (categoria, producto) => {
  setExtras(prev => {
    const lista = prev[categoria] || [];
    const existente = lista.find(item => item.producto.id === producto.id);
    if (existente) {
      return {
        ...prev,
        [categoria]: lista.map(item =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        ),
      };
    }
    return { ...prev, [categoria]: [...lista, { producto, cantidad: 1 }] };
  });
};

/**
 * Reduce en 1 la cantidad de un extra; lo elimina si llega a 0.
 */
const quitarExtra = (categoria, idProducto) => {
  setExtras(prev => {
    const lista = (prev[categoria] || [])
      .map(item => item.producto.id === idProducto
        ? { ...item, cantidad: item.cantidad - 1 }
        : item
      )
      .filter(item => item.cantidad > 0);
    return { ...prev, [categoria]: lista };
  });
};
```

### `construirPayloadCotizacion()` actualizado

```js
const construirPayloadCotizacion = () => {
  const componentes = [];

  // Componentes principales (pasos 1-7)
  const pushComponente = (producto, tablaProducto, cantidad = 1) => {
    if (!producto) return;
    componentes.push({
      id_producto:    producto.id,
      tabla_producto: tablaProducto,
      cantidad,
    });
  };

  pushComponente(configuracionSeleccionada.procesador,    'productos_procesador');
  pushComponente(configuracionSeleccionada.placa_madre,   'productos_placa_madre');
  pushComponente(configuracionSeleccionada.almacenamiento,'productos_almacenamiento');
  pushComponente(configuracionSeleccionada.gpu,           'productos_gpu');
  pushComponente(configuracionSeleccionada.fuente,        'productos_fuente');
  pushComponente(configuracionSeleccionada.case,          'productos_case');

  Object.values(ramAgrupada).forEach(item =>
    pushComponente(item.producto, 'productos_ram', item.cantidad)
  );

  // Extras opcionales
  Object.entries(extras).forEach(([categoria, items]) => {
    items.forEach(({ producto, cantidad }) => {
      pushComponente(producto, `productos_${categoria}`, cantidad);
    });
  });

  return {
    componentes,
    margen_personalizado: Number(margenGanancia),
    ...(nombreClienteLimpio && { nombre_cliente: nombreClienteLimpio }),
    ...(emailClienteLimpio  && { email_cliente:  emailClienteLimpio  }),
    ...(telefonoClienteLimpio && { telefono_cliente: telefonoClienteLimpio }),
  };
};
```

---

## Frontend — Cotizador (Sección "Otros")

### Estructura de pasos actualizada

```js
// Pasos 1-7 sin cambios (procesador → case)
// Paso 8: sección "Otros" (extras opcionales)

const SUBSECCIONES_EXTRAS = [
  {
    id: 'perifericos',
    titulo: 'Periféricos',
    categorias: ['mouse', 'teclado', 'mousepad', 'webcam'],
  },
  {
    id: 'audio',
    titulo: 'Audio',
    categorias: ['auricular', 'parlante'],
  },
  {
    id: 'software',
    titulo: 'Software',
    categorias: ['software_windows', 'software_office', 'software_antivirus'],
  },
  {
    id: 'almacenamiento_externo',
    titulo: 'Almacenamiento externo',
    categorias: ['almacenamiento_externo'],
  },
  {
    id: 'energia',
    titulo: 'Energía',
    categorias: ['ups', 'estabilizador'],
  },
  {
    id: 'monitor',
    titulo: 'Monitor',
    categorias: ['monitor'],
  },
  {
    id: 'refrigeracion',
    titulo: 'Refrigeración',
    categorias: ['cooler_aire', 'cooler_liquido'],
  },
  {
    id: 'conectividad',
    titulo: 'Conectividad',
    categorias: ['conectividad'],
  },
];
```

### Comportamiento de la sección "Otros"

- Se muestra después del paso `case` (paso 7), como paso 8 opcional.
- Cada subsección es colapsable (acordeón). Por defecto todas colapsadas.
- Al expandir una subsección, se llama `cargarExtras(subseccion.categorias)` si los productos no están cargados.
- Cada producto muestra: imagen (80×80px), nombre, precio, stock badge, y controles `−` / cantidad / `+`.
- El botón "Generar cotización" está disponible desde el paso 7 en adelante (los extras son opcionales).
- El precio total en el resumen lateral incluye los extras seleccionados.

### Cálculo de precio total con extras

```js
const calcularSubtotalNeto = () => {
  let total = calcularSubtotalComponentesPrincipales(); // lógica existente

  // Sumar extras
  Object.values(extras).forEach(items => {
    items.forEach(({ producto, cantidad }) => {
      total += parseFloat(producto.precio_base) * cantidad;
    });
  });

  return total;
};
```

---

## Frontend — `ImportarCSV.jsx`

### Estructura del componente

```jsx
// Ruta: /admin/importar-csv
// Protegida: redirige a /login si no autenticado

export default function ImportarCSV() {
  const [archivo, setArchivo]           = useState(null);
  const [preview, setPreview]           = useState([]);   // primeras 10 filas
  const [importando, setImportando]     = useState(false);
  const [resultado, setResultado]       = useState(null);
  const [error, setError]               = useState('');
  const [arrastrandoSobre, setArrastrandoSobre] = useState(false);

  // Drag & drop handlers
  const onDragOver  = (e) => { e.preventDefault(); setArrastrandoSobre(true); };
  const onDragLeave = ()  => setArrastrandoSobre(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setArrastrandoSobre(false);
    const file = e.dataTransfer.files[0];
    if (file) procesarArchivo(file);
  };

  const procesarArchivo = (file) => {
    setArchivo(file);
    setResultado(null);
    setError('');
    // Leer primeras 10 líneas para preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const lineas = e.target.result.split(/\r?\n/).filter(l => l.trim()).slice(0, 10);
      setPreview(lineas.map(parsearLineaPreview));
    };
    reader.readAsText(file, 'utf-8');
  };

  const importar = async () => {
    if (!archivo) return;
    setImportando(true);
    setError('');
    try {
      const res = await api.importarCSV(archivo);
      setResultado(res);
    } catch (err) {
      setError(err?.mensaje || 'Error al importar. Intenta nuevamente.');
    } finally {
      setImportando(false);
    }
  };

  // Render: zona drag&drop, tabla preview, botón importar, resumen resultado
}
```

### Tabla de preview

Columnas: `Categoría` | `Código` | `Nombre` | `Stock` | `Precio USD` | `Garantía` | `Flete` | `Marca`

### Resumen de resultado

```jsx
{resultado && (
  <div>
    <p>Insertados: {resultado.insertados}</p>
    <p>Actualizados: {resultado.actualizados}</p>
    <p>Omitidos: {resultado.omitidos}</p>
    <p>Errores: {resultado.errores}</p>
    {resultado.detalle_errores.length > 0 && (
      <ul>
        {resultado.detalle_errores.map((e, i) => (
          <li key={i}>Fila {e.fila}: {e.mensaje}</li>
        ))}
      </ul>
    )}
  </div>
)}
```

---

## Frontend — `api.js` (funciones nuevas)

```js
/**
 * Obtiene productos de una categoría específica con filtros opcionales.
 * @param {string} categoria
 * @param {Object} filtros  — { marca, busqueda, socket, ram_type }
 */
export const obtenerProductosPorCategoria = async (categoria, filtros = {}) => {
  const response = await api.get('/productos', {
    params: { categoria, ...filtros },
  });
  return response.data;
};

/**
 * Sube una imagen para un producto.
 * @param {string} categoria
 * @param {number} id
 * @param {File}   archivo
 */
export const subirImagenProducto = async (categoria, id, archivo) => {
  const formData = new FormData();
  formData.append('imagen', archivo);
  const response = await api.post(`/productos/${categoria}/${id}/imagen`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Importa un archivo CSV de Deltron.
 * @param {File} archivo
 * @returns {Promise<ResultadoImportacion>}
 */
export const importarCSV = async (archivo) => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const response = await api.post('/importacion/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 minutos para archivos grandes
  });
  return response.data;
};
```

Las firmas existentes de `obtenerProductos`, `crearProducto`, `actualizarProducto` y `eliminarProducto` no cambian.

---

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema — esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables automáticamente.*

Las siguientes propiedades se derivan del análisis de los criterios de aceptación. Se excluyen criterios de esquema (SMOKE), criterios de UI no computables, y criterios de infraestructura externa.

---

### Propiedad 1: Constraints de precio y stock son universales

*Para cualquier* tabla de productos y cualquier intento de insertar un registro con `precio_base <= 0` o `stock < 0`, la operación debe ser rechazada por la base de datos con un error de constraint.

**Valida: Requisito 1.3**

---

### Propiedad 2: El trigger `updated_at` se dispara en cualquier UPDATE

*Para cualquier* tabla de productos y cualquier registro existente, ejecutar un UPDATE sobre cualquier campo debe resultar en que `updated_at` sea mayor o igual al valor anterior.

**Valida: Requisito 1.6**

---

### Propiedad 3: Idempotencia del script de migración

*Para cualquier* estado inicial de la base de datos, ejecutar `schema.sql` dos veces consecutivas debe producir el mismo estado final que ejecutarlo una vez (sin errores, sin duplicados).

**Valida: Requisito 1.7**

---

### Propiedad 4: Validación de tipo MIME de imagen

*Para cualquier* tipo MIME que no sea `image/jpeg`, `image/png` o `image/webp`, el endpoint `POST /api/productos/:categoria/:id/imagen` debe retornar HTTP 400.

**Valida: Requisito 2.3**

---

### Propiedad 5: Validación de tamaño de imagen

*Para cualquier* archivo con tamaño mayor a 5 MB enviado al endpoint de imagen, la respuesta debe ser HTTP 413. Para cualquier archivo con tamaño menor o igual a 5 MB con tipo MIME válido, no debe retornar 413.

**Valida: Requisito 2.4**

---

### Propiedad 6: Prioridad de imagen en tarjeta de producto

*Para cualquier* combinación de `{imagen_path, imagen_url}` en un producto, la URL de imagen mostrada en la tarjeta del cotizador debe seguir la prioridad: `imagen_path` > `imagen_url` > placeholder SVG. Si `imagen_path` está definido, nunca se muestra `imagen_url` ni el placeholder.

**Valida: Requisito 2.5**

---

### Propiedad 7: Validación de URL de imagen

*Para cualquier* string que no sea una URL con protocolo `http://` o `https://`, el endpoint `PUT /api/productos/:categoria/:id` debe rechazar el campo `imagen_url` con HTTP 400.

**Valida: Requisito 2.6**

---

### Propiedad 8: Respuesta de GET /api/productos contiene campos requeridos

*Para cualquier* categoría válida de las 23, la respuesta de `GET /api/productos?categoria=X` debe contener exactamente los campos: `id`, `nombre`, `categoria`, `codigo_proveedor`, `marca`, `socket`, `ram_type`, `form_factor`, `wattage`, `tdp`, `precio_base`, `stock`, `disponible_a_pedido`, `tiempo_entrega_dias`, `descripcion_tecnica`, `imagen_url`, `imagen_path`, `created_at`, `updated_at`.

**Valida: Requisito 3.1**

---

### Propiedad 9: Filtrado por marca es case-insensitive

*Para cualquier* marca M con variaciones de mayúsculas/minúsculas (ej: "asus", "ASUS", "Asus"), `GET /api/productos?marca=M` debe retornar el mismo conjunto de productos independientemente de la capitalización del parámetro.

**Valida: Requisito 3.3**

---

### Propiedad 10: Búsqueda retorna solo resultados que contienen el término

*Para cualquier* término de búsqueda T, todos los productos retornados por `GET /api/productos?busqueda=T` deben contener T en su `nombre` o `descripcion_tecnica` (comparación case-insensitive).

**Valida: Requisito 3.4**

---

### Propiedad 11: Validación de campos obligatorios en creación

*Para cualquier* body de `POST /api/productos` que omita al menos uno de los campos `nombre`, `categoria`, `codigo_proveedor` o `precio_base`, la respuesta debe ser HTTP 400.

**Valida: Requisito 3.5**

---

### Propiedad 12: Actualización parcial preserva campos no enviados

*Para cualquier* subconjunto de campos actualizables enviados en `PUT /api/productos/:categoria/:id`, los campos no incluidos en el body deben mantener sus valores originales sin cambios.

**Valida: Requisito 3.6**

---

### Propiedad 13: `limpiarNombre` elimina sufijo `[@@@]` en cualquier posición

*Para cualquier* string que contenga la secuencia `[@@@]`, `limpiarNombre(s)` debe retornar únicamente el texto anterior a `[@@@]`, sin espacios finales, independientemente de lo que haya después del marcador.

**Valida: Requisito 5.2**

---

### Propiedad 14: `parsearStock` es determinista y cubre todos los casos

*Para cualquier* entero N >= 0, `parsearStock(N.toString())` debe retornar `{stock: N, disponible_a_pedido: false}`.
`parsearStock(">20")` debe retornar `{stock: 21, disponible_a_pedido: false}`.
`parsearStock("")` debe retornar `{stock: 0, disponible_a_pedido: true}`.

**Valida: Requisito 5.3**

---

### Propiedad 15: Upsert preserva campos de imagen y compatibilidad técnica

*Para cualquier* producto existente con `imagen_url`, `imagen_path`, `socket`, `ram_type`, `form_factor`, `wattage` o `tdp` definidos, ejecutar el importador con una fila que tenga el mismo `codigo_proveedor` no debe modificar ninguno de esos campos.

**Valida: Requisito 5.4**

---

### Propiedad 16: `mapearCategoria` retorna null para cualquier categoría no reconocida

*Para cualquier* string que no sea prefijo de ninguna clave en `MAPA_CATEGORIAS`, `mapearCategoria(s)` debe retornar `null`.

**Valida: Requisito 5.5**

---

### Propiedad 17: `mapearCategoria` es determinista para entradas del mapa

*Para cualquier* clave K en `MAPA_CATEGORIAS`, `mapearCategoria(K)` debe retornar siempre `MAPA_CATEGORIAS[K]`, independientemente del número de veces que se llame.

**Valida: Requisitos 5.6, 5.7**

---

### Propiedad 18: Los contadores de importación son consistentes

*Para cualquier* lote de N filas procesadas por el importador, la suma `insertados + actualizados + omitidos + errores` debe ser igual a N.

**Valida: Requisito 5.9**

---

### Propiedad 19: Validación de tipo de archivo CSV

*Para cualquier* archivo cuya extensión no sea `.csv` o cuyo tipo MIME no sea `text/csv` ni `text/plain`, `POST /api/importacion/csv` debe retornar HTTP 400.

**Valida: Requisito 5.10**

---

### Propiedad 20: Filas con precio inválido se registran en detalle_errores

*Para cualquier* fila del CSV con `precio_usd` vacío o no numérico, el importador debe incrementar el contador `errores` y agregar un objeto `{fila, mensaje}` a `detalle_errores`.

**Valida: Requisito 5.11**

---

### Propiedad 21: Preview muestra exactamente min(N, 10) filas

*Para cualquier* archivo CSV con N filas de datos, el componente `ImportarCSV` debe mostrar exactamente `Math.min(N, 10)` filas en la tabla de previsualización.

**Valida: Requisito 6.3**

---

### Propiedad 22: El payload de cotización incluye tabla_producto para todos los extras

*Para cualquier* extra agregado desde cualquier categoría, `construirPayloadCotizacion()` debe incluir un objeto con `id_producto`, `tabla_producto` (con formato `productos_{categoria}`) y `cantidad >= 1`.

**Valida: Requisito 8.3**

---

### Propiedad 23: La migración preserva todos los registros

*Para cualquier* conjunto de registros en la tabla `productos`, después de ejecutar la migración, la suma de registros en las 23 tablas nuevas debe ser mayor o igual al conteo original en `productos`.

**Valida: Requisitos 9.1, 9.3**

---

## Impacto en Archivos Existentes del Backend

Esta sección documenta todos los archivos existentes que requieren modificación, con el cambio específico requerido en cada uno.

### `base-datos/schema.sql` — REEMPLAZAR

- Eliminar tabla `productos` y sus índices/triggers
- Agregar las 23 tablas `productos_{categoria}` con el template compartido
- Modificar `detalle_cotizacion`: agregar columna `tabla_producto VARCHAR(50) NOT NULL DEFAULT 'productos_procesador'` y eliminar la FK `detalle_cotizacion_id_producto_fkey` (que apuntaba a `productos`)
- La integridad referencial de `id_producto` se garantiza a nivel de aplicación (ver `controladorCotizaciones`)

### `backend/src/controladores/controladorCotizaciones.js` — MODIFICAR

**Cambio crítico:** La función `crearCotizacion` actualmente hace:
```js
// ANTES (línea ~430):
const productos = await cliente.query(
  `SELECT id, nombre, categoria, precio_base, stock, disponible_a_pedido, descripcion_tecnica
   FROM productos WHERE id IN (${placeholders})`,
  idsProductos
);
```

**Debe cambiarse a:** agrupar los componentes por `tabla_producto`, hacer una query por tabla, y unir los resultados:
```js
// DESPUÉS:
// Agrupar componentes por tabla_producto
const porTabla = {};
for (const comp of datosSanitizados.componentes) {
  const tabla = comp.tabla_producto; // ej: "productos_procesador"
  if (!TABLAS_VALIDAS.has(tabla)) throw new Error(`Tabla inválida: ${tabla}`);
  if (!porTabla[tabla]) porTabla[tabla] = [];
  porTabla[tabla].push(comp.id_producto);
}

// Consultar cada tabla y unir resultados
const mapaProductos = new Map();
for (const [tabla, ids] of Object.entries(porTabla)) {
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const resultado = await cliente.query(
    `SELECT id, nombre, categoria, precio_base, stock, disponible_a_pedido, descripcion_tecnica
     FROM ${tabla} WHERE id IN (${placeholders})`,
    ids
  );
  resultado.rows.forEach(p => mapaProductos.set(`${tabla}:${p.id}`, p));
}
```

El payload de cotización del frontend debe incluir `tabla_producto` en cada componente. El `detalle_cotizacion` INSERT debe incluir `tabla_producto`.

**Validación adicional:** Antes de insertar, verificar que `tabla_producto` esté en `TABLAS_VALIDAS` (whitelist).

### `backend/src/utilidades/validacion.js` — MODIFICAR

La función `validarProducto` tiene hardcodeadas solo 7 categorías:
```js
// ANTES:
const categoriasValidas = ['procesador', 'placa_madre', 'ram', 'almacenamiento', 'gpu', 'fuente', 'case'];
```

**Debe ampliarse a las 23 categorías:**
```js
// DESPUÉS:
const CATEGORIAS_VALIDAS_PRODUCTOS = new Set([
  'procesador', 'placa_madre', 'ram', 'almacenamiento', 'gpu', 'fuente', 'case',
  'mouse', 'teclado', 'webcam', 'auricular', 'parlante',
  'software_windows', 'software_office', 'software_antivirus',
  'almacenamiento_externo', 'ups', 'estabilizador', 'monitor',
  'cooler_aire', 'cooler_liquido', 'conectividad', 'mousepad',
]);
```

Las validaciones de `socket`, `ram_type`, `form_factor`, `wattage`, `tdp` solo aplican a las 7 categorías de armado de PC — mantener esa lógica sin cambios.

### `backend/src/servicios/servicioPDF.js` — MODIFICAR

La función `formatearCategoria` solo mapea 7 categorías:
```js
// ANTES:
const mapa = { procesador: 'Procesador', placa_madre: 'Placa Madre', ... };
```

**Ampliar para las 16 categorías extras:**
```js
// DESPUÉS:
const mapa = {
  procesador: 'Procesador', placa_madre: 'Placa Madre', ram: 'RAM',
  almacenamiento: 'Almacenamiento', gpu: 'GPU', fuente: 'Fuente', case: 'Case',
  mouse: 'Mouse', teclado: 'Teclado', webcam: 'Webcam',
  auricular: 'Auricular', parlante: 'Parlante',
  software_windows: 'Windows', software_office: 'Office',
  software_antivirus: 'Antivirus', almacenamiento_externo: 'Almac. Externo',
  ups: 'UPS', estabilizador: 'Estabilizador', monitor: 'Monitor',
  cooler_aire: 'Cooler Aire', cooler_liquido: 'Cooler Líquido',
  conectividad: 'Conectividad', mousepad: 'Mousepad',
};
```

### `backend/src/servidor.js` — MODIFICAR

Agregar registro de la nueva ruta de importación:
```js
// Agregar después de las rutas existentes:
app.use('/api/importacion', require('./rutas/importacion'));
// Servir archivos de uploads (imágenes subidas):
app.use('/uploads', express.static('uploads'));
```

### Archivos que NO requieren cambios

- `backend/src/configuracion/baseDatos.js` — sin cambios
- `backend/src/middleware/auth.js` — sin cambios
- `backend/src/rutas/compatibilidad.js` — sin cambios (servicioCompatibilidad recibe objetos, no consulta BD)
- `backend/src/servicios/servicioCompatibilidad.js` — sin cambios en lógica
- `backend/src/servicios/servicioNotificaciones.js` — sin cambios
- `backend/src/controladores/controladorConfiguracion.js` — sin cambios
- `backend/src/rutas/auth.js`, `cotizaciones.js`, `configuracion.js`, `ia.js` — sin cambios en rutas

---

## Manejo de Errores

### Backend

| Situación | Código HTTP | Respuesta |
|-----------|-------------|-----------|
| Categoría inválida en URL | 400 | `{ error: "Categoría inválida", mensaje: "..." }` |
| Campos obligatorios faltantes | 400 | `{ error: "Datos inválidos", errores: [...] }` |
| Tipo MIME de imagen inválido | 400 | `{ error: "Tipo de archivo no permitido" }` |
| Archivo CSV inválido | 400 | `{ error: "Solo se aceptan archivos .csv" }` |
| URL de imagen con formato inválido | 400 | `{ error: "URL inválida", mensaje: "..." }` |
| Producto no encontrado | 404 | `{ error: "Producto no encontrado" }` |
| Imagen > 5 MB | 413 | `{ error: "Archivo demasiado grande (máx 5 MB)" }` |
| Producto en uso en cotizaciones | 409 | `{ error: "Producto en uso", mensaje: "..." }` |
| Error de base de datos | 500 | `{ error: "Error interno" }` |
| Sin autenticación | 401 | `{ error: "Token requerido" }` |

### Manejo de errores en `servicioImportacion`

- Errores de fila individual (precio inválido, error de BD) no abortan el proceso completo.
- Se acumulan en `detalle_errores` con número de fila y mensaje descriptivo.
- Errores de parseo del CSV completo (archivo corrupto) sí abortan con HTTP 500.
- El importador usa transacciones por lotes de 100 filas para rendimiento y recuperabilidad.

### Frontend

- Estados de carga, error, vacío y éxito cubiertos en `ImportarCSV.jsx` y en la sección "Otros" del cotizador.
- Errores de red en importación: mensaje descriptivo + botón "Reintentar" habilitado.
- Errores de validación de imagen: toast con mensaje específico.
- Si `cargarExtras` falla para una subsección, se muestra estado de error solo en esa subsección (no bloquea el resto).

---

## Estrategia de Testing

### Enfoque dual: pruebas unitarias + pruebas basadas en propiedades

Las pruebas unitarias cubren ejemplos concretos, casos borde y puntos de integración.
Las pruebas basadas en propiedades (PBT) verifican invariantes universales con inputs generados aleatoriamente.

**Librería PBT elegida:** `fast-check` (JavaScript/Node.js)
- Mínimo 100 iteraciones por propiedad (`numRuns: 100`)
- Cada test referencia la propiedad del diseño con un comentario: `// Feature: reestructuracion-catalogo-productos, Propiedad N: <texto>`

### Pruebas unitarias (backend)

**`servicioImportacion.test.js`:**
- `parsearCSV`: fila completa, fila con campos vacíos, fila con comillas internas
- `limpiarNombre`: sin marcador, con marcador al final, con marcador en medio
- `parsearStock`: ">20", "", "0", "5", "100", valor no numérico
- `mapearCategoria`: cada clave del mapa, string vacío, categoría desconocida
- `importar`: inserción nueva, actualización (verifica que imagen/compatibilidad no cambian), fila con precio inválido, fila con categoría omitida

**`controladorProductos.test.js`:**
- `resolverTabla`: todas las categorías válidas, categoría inválida lanza error
- `obtenerProductos`: con categoria, sin categoria (UNION), con filtros combinados
- `subirImagenProducto`: archivo válido actualiza imagen_path, sin archivo retorna 400

**`controladorImportacion.test.js`:**
- Sin autenticación → 401
- Archivo no CSV → 400
- CSV válido → resultado con contadores correctos

### Pruebas basadas en propiedades (backend)

```js
// Feature: reestructuracion-catalogo-productos, Propiedad 13: limpiarNombre elimina sufijo [@@@]
test('limpiarNombre elimina sufijo [@@@] en cualquier posición', () => {
  fc.assert(fc.property(
    fc.string(), fc.string(),
    (prefijo, sufijo) => {
      const entrada = `${prefijo}[@@@]${sufijo}`;
      const resultado = limpiarNombre(entrada);
      expect(resultado).toBe(prefijo.trim());
      expect(resultado).not.toContain('[@@@]');
    }
  ), { numRuns: 100 });
});

// Feature: reestructuracion-catalogo-productos, Propiedad 14: parsearStock es determinista
test('parsearStock(N) retorna {stock: N, disponible_a_pedido: false} para N >= 0', () => {
  fc.assert(fc.property(
    fc.integer({ min: 0, max: 9999 }),
    (n) => {
      const resultado = parsearStock(n.toString());
      expect(resultado).toEqual({ stock: n, disponible_a_pedido: false });
    }
  ), { numRuns: 100 });
});

// Feature: reestructuracion-catalogo-productos, Propiedad 16: mapearCategoria retorna null para no reconocidas
test('mapearCategoria retorna null para cualquier string no en el mapa', () => {
  fc.assert(fc.property(
    fc.string().filter(s => !Object.keys(MAPA_CATEGORIAS).some(k => s.toLowerCase().startsWith(k))),
    (s) => {
      expect(mapearCategoria(s)).toBeNull();
    }
  ), { numRuns: 100 });
});

// Feature: reestructuracion-catalogo-productos, Propiedad 18: contadores son consistentes
test('insertados + actualizados + omitidos + errores = total filas', () => {
  fc.assert(fc.property(
    fc.array(fc.record({
      categoria_proveedor: fc.string(),
      codigo: fc.string({ minLength: 1 }),
      nombre_descripcion: fc.string(),
      stock_raw: fc.oneof(fc.constant('>20'), fc.constant(''), fc.nat().map(String)),
      precio_usd_raw: fc.oneof(fc.float({ min: 0.01 }).map(String), fc.constant(''), fc.constant('abc')),
      garantia: fc.string(),
      flete: fc.string(),
      marca: fc.string(),
    }), { minLength: 1, maxLength: 50 }),
    async (filas) => {
      const resultado = await importar(filas, mockDb);
      const total = resultado.insertados + resultado.actualizados
                  + resultado.omitidos + resultado.errores;
      expect(total).toBe(filas.length);
    }
  ), { numRuns: 100 });
});
```

### Pruebas unitarias (frontend)

**`ImportarCSV.test.jsx`:**
- Renderiza zona drag & drop e input de archivo
- Al seleccionar archivo, muestra tabla de preview con máximo 10 filas
- Botón "Importar" deshabilitado mientras importa
- Muestra resumen correcto con resultado del backend
- Error de red muestra mensaje y habilita botón

**`AppContext.test.jsx`:**
- `agregarExtra` incrementa cantidad si producto ya existe
- `quitarExtra` elimina item cuando cantidad llega a 0
- `construirPayloadCotizacion` incluye `tabla_producto` para todos los items

### Pruebas de integración

- `GET /api/productos?categoria=procesador` retorna solo productos de `productos_procesador`
- `GET /api/productos` sin categoria retorna productos de todas las tablas
- Upsert por `codigo_proveedor` no modifica `imagen_path` ni `socket`
- Migración: conteo antes = conteo después

### Pruebas smoke (post-migración)

- Las 23 tablas existen con las columnas requeridas
- `codigo_proveedor` tiene constraint UNIQUE en cada tabla
- Los índices existen en `stock`, `codigo_proveedor`, `marca`
- `detalle_cotizacion` tiene columna `tabla_producto`
- El trigger `updated_at` existe en cada tabla

---
