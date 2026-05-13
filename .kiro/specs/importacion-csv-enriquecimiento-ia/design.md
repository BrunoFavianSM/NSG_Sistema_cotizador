# Diseño — Importación CSV con Enriquecimiento IA

## 1. Visión general

El pipeline de importación se extiende en tres capas que se ejecutan en secuencia:

```
CSV (buffer) ──► parsearCSV() ──► construirRegistroNormalizado() ──► upsert BD
                                         │
                                  extraerSpecs() (regex)
                                         │
                              ┌──────────▼──────────┐
                              │  ¿specs completas?  │
                              └──────────┬──────────┘
                                 NO      │      SÍ
                                 ▼       │       ▼
                          cola IA        │   estado = 'csv'
                          pendiente      │
                                 ▼
                    ServicioEnriquecimientoIA (background)
                                 │
                         ┌───────▼───────┐
                         │  Gemini/NVIDIA │
                         └───────┬───────┘
                                 │
                    ┌────────────▼────────────┐
                    │  ¿JSON válido y coherente?│
                    └────────────┬────────────┘
                         SÍ      │      NO
                          ▼      │       ▼
                   ia_completado │   ia_fallido
```

**Principio de diseño clave:** la respuesta HTTP de `POST /api/importacion/csv` se devuelve inmediatamente tras el upsert en BD. El enriquecimiento IA ocurre en background sin bloquear al cliente.

---

## 2. Arquitectura de módulos

### 2.1 Módulos nuevos

| Módulo | Ubicación | Responsabilidad |
|---|---|---|
| `servicioEnriquecimientoIA.js` | `backend/src/servicios/` | Cola de enriquecimiento asíncrono, llamadas a LLM, escritura de specs en BD |
| `controladorImportacion.js` (extendido) | `backend/src/controladores/` | Nuevos endpoints: estado-enriquecimiento, reintentar-fallidos |
| `migrar-enriquecimiento-ia.js` | `backend/scripts/` | Migración: columna `estado_enriquecimiento` + índice |

### 2.2 Módulos modificados

| Módulo | Cambio |
|---|---|
| `servicioImportacion.js` | Detectar specs faltantes, asignar `estado_enriquecimiento`, encolar productos en `ServicioEnriquecimientoIA` |
| `controladorImportacion.js` | Incluir `pendientes_enriquecimiento` en respuesta; agregar 2 nuevos handlers |
| `rutas/importacion.js` | Registrar 2 nuevas rutas con `verificarTokenAdmin` + rate limiting |
| `servidor.js` | Agregar rate limiter específico para importación; inicializar `ServicioEnriquecimientoIA` al arrancar |
| `frontend/src/servicios/api.js` | Agregar `obtenerEstadoEnriquecimiento()`, `reintentarFallidos()` |
| `frontend/src/paginas/ImportarCSV.jsx` | Sección de estado IA con auto-refresh |
| `frontend/src/paginas/AdminProductos.jsx` | Badge de `estado_enriquecimiento` + filtro + banner |

---

## 3. Base de datos

### 3.1 Migración — `migrar-enriquecimiento-ia.js`

```sql
-- Agregar columna con valor por defecto seguro para registros existentes
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS estado_enriquecimiento VARCHAR(20)
    NOT NULL DEFAULT 'no_aplica'
    CHECK (estado_enriquecimiento IN ('csv','ia_completado','ia_fallido','pendiente','no_aplica'));

-- Índice para filtrado eficiente por estado
CREATE INDEX IF NOT EXISTS idx_productos_estado_enriquecimiento
  ON productos(estado_enriquecimiento);
```

El script sigue el patrón de los scripts existentes en `backend/scripts/`: usa `ejecutarQuery` de `configuracion/baseDatos`, imprime resultado y maneja errores con `process.exit(1)`.

### 3.2 Impacto en upsert existente

El `INSERT ... ON CONFLICT DO UPDATE` en `servicioImportacion.js` debe incluir `estado_enriquecimiento` en la lista de columnas actualizadas. El valor se calcula antes del upsert según la lógica de Requisito 3.

---

## 4. Backend — ServicioEnriquecimientoIA

### 4.1 Interfaz pública

```javascript
// backend/src/servicios/servicioEnriquecimientoIA.js

/**
 * Encola productos para enriquecimiento IA.
 * Llamado por servicioImportacion al finalizar el upsert.
 * @param {Array<{id_producto, categoria, nombre, descripcion_general, specs_faltantes}>} productos
 */
function encolarProductos(productos) { ... }

/**
 * Retorna el estado actual del proceso de enriquecimiento.
 * Consultado por el endpoint GET /api/importacion/estado-enriquecimiento.
 * @returns {{ en_proceso, pendientes_en_memoria, ultima_actualizacion }}
 */
function obtenerEstadoMemoria() { ... }

/**
 * Reactiva el procesamiento de la cola.
 * Llamado por POST /api/importacion/reintentar-fallidos tras mover ia_fallido → pendiente en BD.
 */
function reactivarCola() { ... }
```

### 4.2 Ciclo de vida de la cola

```
encolarProductos(lista)
    │
    ▼
_cola.push(...lista)
    │
    ▼
¿_procesando === false?
    │ SÍ
    ▼
_procesarCola()  ← loop asíncrono
    │
    ├─ tomar siguiente item de _cola
    ├─ llamarLLMParaSpecs(item)
    ├─ validarRespuestaIA(respuesta, categoria)
    ├─ escribirSpecsEnBD(id_producto, specs_validadas)
    ├─ actualizar estado_enriquecimiento en productos
    ├─ esperar AI_INTERVAL_MS (500ms mínimo)
    └─ repetir hasta _cola vacía
    │
    ▼
_procesando = false
```

La cola vive en memoria del proceso Node.js. No se usa Redis ni ninguna dependencia externa nueva. Si el servidor se reinicia, los productos con `estado_enriquecimiento = 'pendiente'` en BD se recuperan al arrancar (ver §4.5).

### 4.3 Construcción del prompt

```javascript
function construirPromptEnriquecimiento(item) {
  return {
    systemPrompt: `Eres un experto en hardware de computadoras. 
Dado el nombre y descripción de un producto, extrae ÚNICAMENTE los campos solicitados.
Responde SOLO con un objeto JSON válido. Sin texto adicional, sin markdown.
Si no puedes determinar un valor con certeza, usa null.`,

    mensajeActual: `Producto: ${item.nombre}
Descripción: ${item.descripcion_general || 'No disponible'}
Categoría: ${item.categoria}

Extrae los siguientes campos (tipos esperados entre paréntesis):
${item.specs_faltantes.map(f => `- ${f.campo} (${f.tipo})`).join('\n')}

Responde con JSON: { "campo1": valor1, "campo2": valor2, ... }`
  };
}
```

**Seguridad:** el prompt nunca incluye `id_producto`, credenciales, ni datos internos del sistema.

### 4.4 Validación de respuesta IA

Antes de escribir en BD, cada campo se valida contra su tipo esperado:

| Tipo esperado | Validación |
|---|---|
| `number` | `typeof v === 'number' && isFinite(v) && v > 0` |
| `integer` | `Number.isInteger(v) && v > 0` |
| `string` | `typeof v === 'string' && v.trim().length > 0` |
| `boolean` | `typeof v === 'boolean'` |

Si **cualquier** campo tiene un valor incoherente (ej. `wattage: "gold"`), se descarta **toda** la respuesta y el producto queda como `ia_fallido`. No se escriben datos parciales.

### 4.5 Recuperación al arrancar servidor

En `servidor.js`, tras registrar rutas:

```javascript
// Recuperar productos pendientes de enriquecimiento al arrancar
const { reactivarDesdeDB } = require('./servicios/servicioEnriquecimientoIA');
reactivarDesdeDB(ejecutarQuery).catch(err =>
  console.warn('[EnriquecimientoIA] No se pudo recuperar cola pendiente:', err.message)
);
```

`reactivarDesdeDB` consulta `SELECT id, categoria, nombre, descripcion_general FROM productos WHERE estado_enriquecimiento = 'pendiente'`, reconstruye los items de cola y llama a `encolarProductos`.

### 4.6 Configuración desde .env

```
AI_TIMEOUT_MS=15000        # timeout por llamada a la API de IA
AI_MAX_RETRIES=2           # reintentos ante error de red/timeout
AI_INTERVAL_MS=500         # pausa mínima entre llamadas (rate limiting)
```

Leídos con `parseInt(process.env.AI_TIMEOUT_MS || '15000', 10)` etc. El servicio usa `obtenerConfigIA()` de `servicioConfigIA.js` para obtener el proveedor activo, modelo y API keys — exactamente igual que el asistente conversacional.

---

## 5. Backend — Cambios en ServicioImportacion

### 5.1 Detección de specs faltantes

Tras `extraerSpecs()`, se evalúa si el componente principal tiene todos sus campos requeridos:

```javascript
const CAMPOS_REQUERIDOS = {
  procesador:     ['socket', 'cpu_nucleos', 'cpu_frecuencia_base_ghz'],
  placa_madre:    ['socket', 'mb_chipset', 'mb_form_factor', 'mb_ram_tipo'],
  ram:            ['ram_tipo', 'ram_capacidad_gb', 'ram_velocidad_mhz'],
  almacenamiento: ['storage_tipo', 'storage_capacidad_gb', 'storage_interfaz'],
  gpu:            ['gpu_chipset', 'gpu_vram_gb'],
  fuente:         ['psu_wattage', 'psu_certificacion'],
  case:           ['case_form_factor'],
};

function tieneSpecsFaltantes(categoria, registro) {
  const requeridos = CAMPOS_REQUERIDOS[categoria] || [];
  return requeridos.some(campo => registro[campo] == null || registro[campo] === '');
}
```

### 5.2 Asignación de estado_enriquecimiento

```javascript
// En construirRegistroNormalizado(), después de calcular specs:
let estadoEnriquecimiento = 'no_aplica';
if (esCategoriaPrincipal(destino.categoria)) {
  estadoEnriquecimiento = tieneSpecsFaltantes(destino.categoria, specs)
    ? 'pendiente'
    : 'csv';
}
registro.estado_enriquecimiento = estadoEnriquecimiento;
```

### 5.3 Encolado post-upsert

En la función `importar()`, tras el upsert de cada producto principal con `estado_enriquecimiento = 'pendiente'`:

```javascript
const itemsParaIA = [];

// ... dentro del loop de filas:
if (registro.estado_enriquecimiento === 'pendiente') {
  itemsParaIA.push({
    id_producto: idProducto,
    categoria: registro.categoria,
    nombre: registro.nombre,
    descripcion_general: registro.descripcion_general,
    specs_faltantes: calcularSpecsFaltantes(registro.categoria, registro),
  });
}

// Al finalizar el loop:
if (itemsParaIA.length > 0) {
  servicioEnriquecimientoIA.encolarProductos(itemsParaIA);
}

return { insertados, actualizados, omitidos, errores, detalle_errores,
         pendientes_enriquecimiento: itemsParaIA.length };
```

### 5.4 Compatibilidad con CSV estructurado

El CSV estructurado (`assets/CSV cotizador/`) ya incluye specs explícitas en columnas. Si todos los campos requeridos están presentes, `estado_enriquecimiento = 'csv'`. Si alguno falta, `'pendiente'`. El comportamiento de parseo no cambia.

---

## 6. Backend — Nuevos endpoints

### 6.1 GET /api/importacion/estado-enriquecimiento

**Auth:** `verificarTokenAdmin`

**Lógica:** combina estado en memoria (`obtenerEstadoMemoria()`) con conteos reales de BD.

**Respuesta:**
```json
{
  "en_proceso": true,
  "pendientes": 42,
  "completados": 158,
  "fallidos": 3,
  "ultima_actualizacion": "2026-05-12T14:35:00.000Z"
}
```

Los conteos `pendientes`, `completados`, `fallidos` se obtienen con una sola query:
```sql
SELECT estado_enriquecimiento, COUNT(*) AS total
FROM productos
WHERE estado_enriquecimiento IN ('pendiente','ia_completado','ia_fallido')
GROUP BY estado_enriquecimiento
```

### 6.2 POST /api/importacion/reintentar-fallidos

**Auth:** `verificarTokenAdmin`  
**Rate limit:** máximo 10 req / 15 min por IP (limiter dedicado en `servidor.js`)

**Lógica:**
1. `UPDATE productos SET estado_enriquecimiento = 'pendiente' WHERE estado_enriquecimiento = 'ia_fallido' RETURNING id, categoria, nombre, descripcion_general`
2. Si `rowCount === 0` → HTTP 200 `{ exito: true, mensaje: "No hay productos fallidos para reintentar", reintentados: 0 }`
3. Si `rowCount > 0` → reconstruir items de cola, llamar `encolarProductos()`, `reactivarCola()` → HTTP 200 `{ exito: true, reintentados: N }`

---

## 7. Backend — Cambios en rutas y servidor

### 7.1 rutas/importacion.js

```javascript
// Rutas nuevas (agregar a las existentes)
router.get(
  '/estado-enriquecimiento',
  verificarTokenAdmin,
  ctrl.obtenerEstadoEnriquecimiento
);

router.post(
  '/reintentar-fallidos',
  verificarTokenAdmin,
  limitadorReintento,   // rate limit 10/15min
  ctrl.reintentarFallidos
);
```

### 7.2 servidor.js

```javascript
// Rate limiter específico para reintentar-fallidos
const limitadorReintento = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10 * devMultiplier,
  ...mensajeRateLimit,
});

// Inicialización al arrancar (no bloquea)
const servicioEnriquecimientoIA = require('./servicios/servicioEnriquecimientoIA');
servicioEnriquecimientoIA.reactivarDesdeDB(ejecutarQuery).catch(err =>
  console.warn('[EnriquecimientoIA] Cola pendiente no recuperada:', err.message)
);
```

---

## 8. Frontend — ImportarCSV.jsx

### 8.1 Nuevos estados

```javascript
const [estadoIA, setEstadoIA] = useState(null);   // respuesta de GET /estado-enriquecimiento
const [reintentando, setReintentando] = useState(false);
```

### 8.2 Sección "Estado del enriquecimiento IA"

Se muestra solo cuando `resultado !== null` (tras una importación exitosa).

**Estructura visual:**

```
┌─────────────────────────────────────────────────────┐
│  Estado del enriquecimiento IA                      │
│                                                     │
│  [●] Enriqueciendo datos con IA...  (si en_proceso) │
│                                                     │
│  Pendientes   Completados   Fallidos                │
│     42            158           3                   │
│                                                     │
│  Última actualización: 12 may 2026, 14:35           │
│                                                     │
│  [Reintentar productos fallidos]  (si fallidos > 0) │
└─────────────────────────────────────────────────────┘
```

### 8.3 Auto-refresh

```javascript
useEffect(() => {
  if (!resultado) return;

  const consultar = async () => {
    try {
      const data = await api.obtenerEstadoEnriquecimiento();
      setEstadoIA(data);
    } catch { /* silencioso */ }
  };

  consultar(); // consulta inmediata al mostrar resultado

  if (!estadoIA?.en_proceso) return; // no iniciar intervalo si ya terminó

  const intervalo = setInterval(consultar, 10_000);
  return () => clearInterval(intervalo);
}, [resultado, estadoIA?.en_proceso]);
```

### 8.4 Resumen de importación extendido

El campo `pendientes_enriquecimiento` de la respuesta del backend se muestra como quinta tarjeta en el grid de resultados:

```
Insertados | Actualizados | Omitidos | Errores | Pendientes IA
```

### 8.5 Animación con prefers-reduced-motion

El indicador de progreso usa la clase `animate-pulse` de Tailwind condicionalmente:

```jsx
<span
  className={`inline-block h-2 w-2 rounded-full bg-[var(--color-warning)]
    ${!prefersReducedMotion ? 'animate-pulse' : ''}`}
  aria-hidden="true"
/>
```

`prefersReducedMotion` se obtiene con `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

---

## 9. Frontend — AdminProductos.jsx

### 9.1 Badge de estado_enriquecimiento

Componente `BadgeEnriquecimiento` (inline en la página o en `componentes/ui/`):

```jsx
const CONFIG_BADGE = {
  csv:           { texto: 'Datos CSV',     color: 'success',  pulso: false },
  ia_completado: { texto: 'Completado IA', color: 'accent',   pulso: false },
  ia_fallido:    { texto: 'IA Falló',      color: 'danger',   pulso: false },
  pendiente:     { texto: 'Pendiente IA',  color: 'warning',  pulso: true  },
  no_aplica:     null,  // sin badge
};
```

Colores mapeados a tokens CSS existentes: `--color-success`, `--color-accent`, `--color-danger`, `--color-warning`.

**Accesibilidad:**
```jsx
<span
  role="status"
  aria-label={`Estado de datos: ${config.texto}`}
  className={`badge badge-${config.color} ${config.pulso && !prefersReducedMotion ? 'animate-pulse' : ''}`}
>
  {config.texto}
</span>
```

### 9.2 Clic en badge ia_fallido

Al hacer clic en el badge `ia_fallido`, se muestra un tooltip/popover (no modal completo, para no interrumpir el flujo de la tabla):

```
"Los datos técnicos no pudieron completarse automáticamente.
 Puedes editar el producto manualmente o usar 'Reintentar IA'
 en el panel de importación."
```

Implementado con un `<div role="tooltip">` posicionado con CSS relativo al badge.

### 9.3 Filtro por estado_enriquecimiento

Se agrega al selector de filtros existente (junto al filtro de categoría):

```jsx
<select
  value={filtroEstado}
  onChange={e => setFiltroEstado(e.target.value)}
  aria-label="Filtrar por estado de enriquecimiento"
  className="min-h-11 ..."
>
  <option value="">Todos los estados</option>
  <option value="csv">Datos CSV</option>
  <option value="ia_completado">Completado IA</option>
  <option value="ia_fallido">IA Falló</option>
  <option value="pendiente">Pendiente IA</option>
  <option value="no_aplica">Sin enriquecimiento</option>
</select>
```

El filtro se aplica en el frontend sobre los datos ya cargados (no requiere nueva llamada a API si el catálogo ya está en memoria).

### 9.4 Banner de productos pendientes

Se muestra sobre la tabla cuando hay productos con `estado_enriquecimiento = 'pendiente'`:

```jsx
{pendientesCount > 0 && (
  <div role="status" aria-live="polite"
    className="surface-card border-l-4 border-[var(--color-warning)] p-3 flex items-center justify-between">
    <p className="text-sm text-[var(--color-text)]">
      <strong>{pendientesCount}</strong> productos pendientes de enriquecimiento IA
    </p>
    <button onClick={() => navigate('/admin/importar-csv')}
      className="min-h-11 text-sm font-medium text-[var(--color-accent)]">
      Ver estado →
    </button>
  </div>
)}
```

---

## 10. Frontend — api.js (nuevas funciones)

```javascript
// Obtener estado del enriquecimiento IA
export async function obtenerEstadoEnriquecimiento() {
  const { data } = await api.get('/importacion/estado-enriquecimiento');
  return data;
}

// Reintentar productos fallidos
export async function reintentarFallidos() {
  const { data } = await api.post('/importacion/reintentar-fallidos');
  return data;
}
```

---

## 11. Flujo de datos completo (secuencia)

```
Admin sube CSV
      │
      ▼
POST /api/importacion/csv
      │
      ├─ parsearCSV(buffer)
      ├─ construirRegistroNormalizado() × N filas
      │     └─ extraerSpecs() (regex)
      │     └─ asignar estado_enriquecimiento
      ├─ upsert productos + specs_* en BD
      ├─ encolarProductos(itemsConSpecsFaltantes)  ← no bloquea
      │
      ▼
HTTP 200 { insertados, actualizados, omitidos, errores, pendientes_enriquecimiento }
      │
      ▼ (background, independiente)
ServicioEnriquecimientoIA._procesarCola()
      │
      ├─ obtenerConfigIA() → proveedor + modelo + API key
      ├─ construirPromptEnriquecimiento(item)
      ├─ generarRespuesta({ systemPrompt, historial:[], mensajeActual, configIA })
      │     └─ Gemini → NVIDIA fallback (servicioLLM.js existente)
      ├─ validarRespuestaIA(respuesta, categoria)
      ├─ upsertSpecs(db, categoria, id_producto, specsValidadas)
      ├─ UPDATE productos SET estado_enriquecimiento = 'ia_completado' WHERE id = ?
      └─ esperar AI_INTERVAL_MS
      │
      ▼ (si falla)
UPDATE productos SET estado_enriquecimiento = 'ia_fallido' WHERE id = ?

      │
      ▼ (frontend polling cada 10s)
GET /api/importacion/estado-enriquecimiento
      └─ { en_proceso, pendientes, completados, fallidos, ultima_actualizacion }
```

---

## 12. Decisiones de diseño

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Cola en memoria (array JS) | Redis / BullMQ | Sin dependencias nuevas; el volumen de productos por importación es manejable (< 5000). Si el servidor se reinicia, `reactivarDesdeDB` recupera los pendientes. |
| Reutilizar `servicioLLM.js` existente | Nuevo cliente HTTP directo | Evita duplicar lógica de reintentos, backoff, fallback Gemini→NVIDIA y parser JSON robusto. |
| Validación estricta: descartar toda respuesta si hay un campo incoherente | Guardar campos válidos parcialmente | Datos parciales en specs_* son peores que datos vacíos: rompen filtros de compatibilidad y confunden al usuario. |
| `estado_enriquecimiento` en tabla `productos` | Tabla separada de auditoría | Simplicidad. El requisito pide solo el estado actual, no historial de cambios. |
| Polling cada 10s desde frontend | WebSocket / SSE | Menor complejidad; la frecuencia de actualización no requiere tiempo real. El polling se detiene automáticamente cuando `en_proceso = false`. |
| `verificarTokenAdmin` en endpoints nuevos | `verificarToken` (alias) | Los nuevos endpoints son operaciones administrativas sensibles. `verificarTokenAdmin` es explícito sobre el rol requerido. |

---

## 13. Mejoras al parser del CSV Deltron (Req 1)

Esta sección detalla los cambios concretos a `parsearCSV()` y `construirRegistroNormalizado()` para el formato Deltron raw. El CSV estructurado no se toca.

### 13.1 Filtrado de filas no-producto

Dentro del branch Deltron raw de `parsearCSV()`, antes de procesar cada línea se aplican tres filtros de descarte:

```javascript
function esFilaSeparador(linea) {
  // Líneas como: "_______________","_______________",...
  return /^["_,\s]+$/.test(linea);
}

function esFilaEncabezado(linea) {
  // Líneas que contienen los headers repetidos por categoría
  const upper = linea.toUpperCase();
  return upper.includes('CODIGO') && upper.includes('STOCK') && upper.includes('PREC DISTRIB');
}

function esFilaMetadata(linea) {
  // Líneas de cabecera del archivo (LISTA DE PRECIOS, TIPO DE CAMBIO, etc.)
  const upper = linea.toUpperCase();
  return upper.includes('LISTA DE PRECIOS') ||
         upper.includes('GENERADA EL') ||
         upper.includes('ALMACEN') ||
         upper.includes('TIPO DE CAMBIO');
}
```

Solo se procesan las líneas que no caen en ninguno de estos tres filtros.

### 13.2 Extracción posicional de campos

Para las filas que pasan el filtro, los campos se extraen por posición fija:

| Posición | Campo interno | Notas |
|---|---|---|
| col 0 | `categoria_proveedor` | Ej. `"cpu amd ryzen"` |
| col 1 | `codigo` | Ej. `"cpuam5ryzen97950x"` |
| col 2 | `nombre_descripcion` | Descripción raw con `[@@@]` |
| col 3 | `stock_raw` | `">20"`, `""`, o número |
| col 4 | `precio_usd_raw` | Precio en USD |
| col 6 | `garantia` | Letra de garantía |
| col 8 | `marca` | Nombre de marca |

### 13.3 Limpieza de descripción raw

En `construirRegistroNormalizado()`, antes de llamar a `extraerSpecs()`:

```javascript
// Separar nombre limpio de descripción completa
const partes = String(fila.nombre_descripcion || '').split('[@@@]');
const nombreLimpio = normalizarTextoHumano(partes[0])
  .replace(/\s+/g, ' ').trim().slice(0, 200);

// descripcion_general: texto completo sin [@@@] ni caracteres de control
const descripcionCompleta = normalizarTextoHumano(
  String(fila.nombre_descripcion || '').replace(/\[@@@\].*/s, '')
).replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);
```

El `nombre` se trunca a 200 caracteres. La `descripcion_general` a 1000 caracteres. Ambos se pasan a `extraerSpecs()` para maximizar la extracción por regex.

### 13.4 Validaciones de fila

```javascript
// Req 1.11: código vacío → omitir silenciosamente
if (!registro.codigo_proveedor || !registro.codigo_proveedor.trim()) {
  omitidos++;
  continue;
}

// Req 1.10: precio inválido → error con mensaje específico
const precio = parsearPrecio(fila.precio_usd_raw);
if (!Number.isFinite(precio) || precio <= 0) {
  errores++;
  detalle_errores.push({
    fila: fila._fila,
    mensaje: `precio_usd inválido: "${fila.precio_usd_raw}"`
  });
  continue;
}
```

### 13.5 Reimportación de productos ia_fallido (Req 3.7)

Cuando un producto ya existe en BD con `estado_enriquecimiento = 'ia_fallido'` y se reimporta desde un nuevo CSV, el upsert sobreescribe el estado:

```javascript
// En el INSERT ... ON CONFLICT DO UPDATE:
// estado_enriquecimiento se incluye en las columnas actualizadas.
// Si el nuevo registro calcula estado = 'pendiente', sobreescribe 'ia_fallido'.
// Esto ocurre naturalmente porque construirRegistroNormalizado() recalcula
// el estado desde cero basándose en las specs extraídas del CSV actual.
```

No se necesita lógica especial: si el CSV nuevo tampoco tiene las specs, el estado queda `'pendiente'` y el producto vuelve a la cola IA.

---

## 14. Mejoras a extraerSpecs() por categoría (Req 2)

Esta sección detalla los patrones regex nuevos o mejorados que se agregan a la función `extraerSpecs()` existente en `servicioImportacion.js`. Solo se documentan los campos que actualmente no se extraen o se extraen incorrectamente.

### 14.1 Procesador — campos nuevos/mejorados

```javascript
// nucleos: "20-core", "6-cores", "6C", "6 núcleos"
cpu_nucleos: extraerNumero(/(\d{1,2})\s*[-]?\s*cores?/i, texto)
          || extraerNumero(/(\d{1,2})\s*c\b/i, texto)
          || extraerNumero(/(\d{1,2})\s*n[uú]cleos?/i, texto),

// hilos: "20-thread", "12T"
cpu_hilos: extraerNumero(/(\d{1,2})\s*[-]?\s*threads?/i, texto)
        || extraerNumero(/(\d{1,2})\s*t\b/i, texto),

// graficos_integrados: false si código termina en F o nombre dice "sin gráficos"
cpu_graficos_integrados:
  /\bi[3579]-\d{4,5}f\b/i.test(nombre) || textoLower.includes('sin gr') ? false
  : textoLower.includes('radeon graphics') || /ryzen\s*\d+\s*\d+g\b/i.test(textoLower)
    || textoLower.includes('intel uhd') || textoLower.includes('intel iris') ? true
  : null,  // null = desconocido, candidato para IA
```

### 14.2 RAM — campos nuevos

```javascript
// latencia: "CL16", "cl16", "16CL", "CAS 16"
ram_latencia: (() => {
  const m = texto.match(/\bcl[-\s]?(\d{1,2})\b/i)
           || texto.match(/\bcas[-\s]?(\d{1,2})\b/i)
           || texto.match(/\b(\d{1,2})[-\s]?cl\b/i);
  return m ? `CL${m[1]}` : null;
})(),

// velocidad: también desde "3200MT/s", "4800 MT/s"
ram_velocidad_mhz: extraerNumero(/(\d{3,5})\s*mhz/i, texto)
               || extraerNumero(/(\d{3,5})\s*mt\/s/i, texto),
```

### 14.3 Almacenamiento — campos nuevos

```javascript
// velocidad_lectura_mbps: "550 MB/s", "7000MB/s read", "seq read: 7000"
storage_velocidad_lectura_mbps:
  extraerNumero(/(?:seq(?:uential)?\s*)?read[:\s]*(\d{3,5})\s*mb\/s/i, texto)
  || extraerNumero(/(\d{3,5})\s*mb\/s\s*(?:read|lectura)/i, texto)
  || extraerNumero(/(\d{3,5})\s*mb\/s/i, texto),  // primer valor = lectura

// velocidad_escritura_mbps: "520 MB/s write"
storage_velocidad_escritura_mbps:
  extraerNumero(/(?:seq(?:uential)?\s*)?writ[e\s]*[:\s]*(\d{3,5})\s*mb\/s/i, texto)
  || extraerNumero(/(\d{3,5})\s*mb\/s\s*(?:writ|escritura)/i, texto),

// form_factor: "3.5\"", "3.5 pulgadas"
storage_form_factor:
  textoLower.includes('m.2') ? 'M.2'
  : textoLower.includes('2.5') ? '2.5"'
  : textoLower.includes('3.5') ? '3.5"'
  : null,
```

### 14.4 GPU — campos nuevos

```javascript
// chipset completo: "AMD Radeon RX 9070 XT", "NVIDIA GeForce RTX 5060 Ti"
gpu_chipset: (() => {
  const m = texto.match(/(nvidia\s+geforce\s+(?:rtx|gtx)\s*\d{3,4}(?:\s*ti)?)/i)
           || texto.match(/(amd\s+radeon\s+rx\s*\d{4}(?:\s*xt)?)/i)
           || texto.match(/(rtx\s*\d{3,4}(?:\s*ti)?|gtx\s*\d{3,4}|rx\s*\d{4}(?:\s*xt)?)/i);
  return m ? m[1].replace(/\s+/g, ' ').trim().toUpperCase() : null;
})(),

// bus_bits: "256-bit", "256 bit", "256bits"
gpu_bus_bits: extraerNumero(/(\d{2,3})\s*[-]?\s*bits?/i, texto),

// vram_tipo: "GDDR6", "GDDR 6", "gddr6x", "GDDR7"
gpu_vram_tipo: (() => {
  const m = texto.match(/\bgddr\s*(\d\w*)\b/i);
  return m ? `GDDR${m[1].toUpperCase()}` : null;
})(),
```

### 14.5 Fuente — campos nuevos

```javascript
// modular: "full modular", "semi-modular", "no modular", "non-modular"
psu_modular: textoLower.includes('full modular') || textoLower.includes('fully modular')
  ? 'Full Modular'
  : textoLower.includes('semi') && textoLower.includes('modular')
  ? 'Semi Modular'
  : textoLower.includes('no modular') || textoLower.includes('non-modular')
    || textoLower.includes('no-modular')
  ? 'No Modular'
  : textoLower.includes('modular') ? 'Modular'
  : null,

// certificacion mejorada: "80plus gold", "80 plus gold", "80+ gold"
psu_certificacion: (() => {
  const m = texto.match(/80\s*[+\s]?\s*plus\s*(bronze|gold|silver|platinum|titanium)?/i)
           || texto.match(/80\s*\+\s*(bronze|gold|silver|platinum|titanium)?/i);
  if (!m) return null;
  const nivel = (m[1] || '').toUpperCase();
  return nivel ? `80+ ${nivel.charAt(0) + nivel.slice(1).toLowerCase()}` : '80+';
})(),
```

### 14.6 Case — campos nuevos

```javascript
// color: ampliar a más colores en español e inglés
case_color: (() => {
  const m = texto.match(/\b(black|negro|white|blanco|gris|gray|grey|silver|plateado|red|rojo|blue|azul)\b/i);
  const mapa = { black:'Negro', negro:'Negro', white:'Blanco', blanco:'Blanco',
                 gris:'Gris', gray:'Gris', grey:'Gris', silver:'Plateado',
                 plateado:'Plateado', red:'Rojo', rojo:'Rojo', blue:'Azul', azul:'Azul' };
  return m ? (mapa[m[1].toLowerCase()] || m[1]) : null;
})(),

// panel_lateral: "vidrio templado", "tempered glass", "mesh", "acrilico"
case_panel_lateral: (() => {
  const t = textoLower;
  if (t.includes('vidrio templado') || t.includes('tempered glass') || t.includes('tg')) return 'Vidrio Templado';
  if (t.includes('mesh') || t.includes('malla')) return 'Malla Metálica';
  if (t.includes('acril') || t.includes('acryl')) return 'Acrílico Transparente';
  return null;
})(),
```

### 14.7 Tolerancia a variaciones (Req 2.8)

Las funciones normalizadoras existentes se extienden:

```javascript
function normalizarFormFactor(texto) {
  const t = texto.toLowerCase();
  if (t.includes('e-atx') || t.includes('eatx') || t.includes('extended atx')) return 'E-ATX';
  if (t.includes('micro atx') || t.includes('m-atx') || t.includes('matx')
      || t.includes('microatx') || t.includes('micro-atx')) return 'MICRO-ATX';
  if (t.includes('mini itx') || t.includes('mini-itx') || t.includes('miniitx')) return 'MINI-ITX';
  if (t.includes('atx')) return 'ATX';
  return null;
}

// "gddr 6" → "GDDR6" ya cubierto por regex en §15.4
// "80plus gold" → "80+ Gold" ya cubierto por regex en §15.5
// "matx" → "MICRO-ATX" cubierto por normalizarFormFactor extendida
```

---

## 15. CAMPOS_REQUERIDOS completo (Req 2 + Req 3)

El mapa de §5.1 se amplía para incluir todos los campos del Req 2. Estos son los campos que, si están vacíos, disparan el enriquecimiento IA:

```javascript
const CAMPOS_REQUERIDOS = {
  procesador: [
    'socket', 'cpu_nucleos', 'cpu_hilos',
    'cpu_frecuencia_base_ghz', 'cpu_graficos_integrados',
  ],
  placa_madre: [
    'socket', 'mb_chipset', 'mb_form_factor', 'mb_ram_tipo',
  ],
  ram: [
    'ram_tipo', 'ram_capacidad_gb', 'ram_velocidad_mhz', 'ram_latencia',
  ],
  almacenamiento: [
    'storage_tipo', 'storage_capacidad_gb', 'storage_interfaz', 'storage_form_factor',
  ],
  gpu: [
    'gpu_chipset', 'gpu_vram_gb', 'gpu_vram_tipo', 'gpu_bus_bits',
  ],
  fuente: [
    'psu_wattage', 'psu_certificacion', 'psu_modular',
  ],
  case: [
    'case_form_factor', 'case_color', 'case_panel_lateral',
  ],
};
```

**Nota:** `cpu_tdp_w`, `gpu_tdp_w`, `gpu_longitud_mm`, `storage_velocidad_lectura_mbps`, `storage_velocidad_escritura_mbps` y `mb_max_ram_gb` se extraen si están disponibles pero **no** son requeridos para determinar el estado — su ausencia no dispara enriquecimiento IA por sí sola.

---

## 16. Cambios en GET /api/productos (Req 3.8)

El endpoint `GET /api/productos` debe incluir `estado_enriquecimiento` en cada producto de la respuesta.

**Archivo a modificar:** `backend/src/controladores/controladorProductos.js`

**Cambio:** agregar `estado_enriquecimiento` al `SELECT` de la query principal de productos:

```sql
SELECT p.id, p.nombre, p.precio_base, p.stock, p.disponible_a_pedido,
       p.codigo_proveedor, p.garantia, p.imagen_url,
       p.estado_enriquecimiento,   -- ← campo nuevo
       c.nombre AS categoria,
       m.nombre AS marca,
       ...
FROM productos p
LEFT JOIN categorias c ON p.id_categoria = c.id
LEFT JOIN marcas m ON p.id_marca = m.id
...
```

Este es el único cambio en `controladorProductos.js`. No afecta ningún otro campo ni contrato existente.

**Archivo adicional a la lista §13:** `backend/src/controladores/controladorProductos.js`

---

## 17. Selección de modelo por modo activo (Req 4.5)

En `servicioEnriquecimientoIA.js`, al construir la llamada al LLM:

```javascript
const configIA = await obtenerConfigIA();

// Selección de modelo según modo activo
const modeloParaEnriquecimiento =
  configIA.modo_activo === 'gemini'
    ? configIA.gemini_model
    : configIA.nvidia_model;  // cubre 'nvidia' y 'pipeline'

// Se pasa configIA completo a generarRespuesta() — servicioLLM.js
// selecciona el proveedor correcto internamente según gemini_api_key / nvidia_api_key
const respuesta = await generarRespuesta({
  systemPrompt: prompt.systemPrompt,
  historial: [],
  mensajeActual: prompt.mensajeActual,
  configIA,
});
```

`servicioLLM.js` ya maneja el fallback Gemini → NVIDIA internamente. El `ServicioEnriquecimientoIA` no necesita reimplementar esa lógica.

---

## 18. Estrategia de reintentos (Req 4.9, 4.10)

Hay dos capas de reintentos que operan en niveles distintos y no se solapan:

| Capa | Dónde | Qué reintenta | Configuración |
|---|---|---|---|
| **Capa 1 — LLM** | `servicioLLM.js` | Errores HTTP 429/5xx de la API de IA | `MAX_REINTENTOS = 3` hardcodeado, backoff exponencial |
| **Capa 2 — Enriquecimiento** | `servicioEnriquecimientoIA.js` | Errores de red/timeout que no llegan a la capa LLM (ej. DNS, conexión rechazada) | `AI_MAX_RETRIES` desde .env, default 2 |

La Capa 2 envuelve la llamada completa a `generarRespuesta()`. Si `generarRespuesta()` lanza una excepción después de agotar sus propios reintentos internos, la Capa 2 reintenta el item completo hasta `AI_MAX_RETRIES` veces antes de marcarlo como `ia_fallido`.

```javascript
async function procesarItemConReintentos(item, db) {
  const maxReintentos = parseInt(process.env.AI_MAX_RETRIES || '2', 10);
  let ultimoError;

  for (let intento = 0; intento <= maxReintentos; intento++) {
    try {
      const configIA = await obtenerConfigIA();
      const prompt = construirPromptEnriquecimiento(item);
      const respuesta = await generarRespuesta({ ...prompt, historial: [], configIA });
      const specsValidadas = validarRespuestaIA(respuesta, item.categoria);
      await escribirSpecsEnBD(db, item.id_producto, item.categoria, specsValidadas);
      await db('UPDATE productos SET estado_enriquecimiento = $1 WHERE id = $2',
               ['ia_completado', item.id_producto]);
      return 'completado';
    } catch (err) {
      ultimoError = err;
      if (intento < maxReintentos) {
        await esperar(500 * (intento + 1));
      }
    }
  }

  await db('UPDATE productos SET estado_enriquecimiento = $1 WHERE id = $2',
           ['ia_fallido', item.id_producto]);
  console.error(`[EnriquecimientoIA] Fallido tras ${maxReintentos + 1} intentos — ${item.nombre}: ${ultimoError?.message}`);
  return 'fallido';
}
```

---

## 19. Logging [EnriquecimientoIA] (Req 4.11)

```javascript
async function _procesarCola(db) {
  _procesando = true;
  const total = _cola.length;
  let completados = 0;
  let fallidos = 0;

  console.log(`[EnriquecimientoIA] Iniciando cola: ${total} productos`);

  while (_cola.length > 0) {
    const item = _cola.shift();
    const resultado = await procesarItemConReintentos(item, db);

    if (resultado === 'completado') completados++;
    else fallidos++;

    _ultimaActualizacion = new Date();

    // Progreso cada 10 productos
    const procesados = completados + fallidos;
    if (procesados % 10 === 0) {
      console.log(`[EnriquecimientoIA] Progreso: ${procesados}/${total} — ✓${completados} ✗${fallidos}`);
    }

    if (_cola.length > 0) {
      await esperar(parseInt(process.env.AI_INTERVAL_MS || '500', 10));
    }
  }

  console.log(`[EnriquecimientoIA] Cola finalizada — ✓${completados} completados, ✗${fallidos} fallidos`);
  _procesando = false;
}
```

---

## 20. UI — Estados de carga, error, vacío y éxito (Restricción UI 9)

### 20.1 Sección estado IA en ImportarCSV.jsx

| Estado | UI |
|---|---|
| Cargando (primera consulta) | Skeleton de 3 contadores con `animate-pulse` |
| `en_proceso = true` | Indicador animado + contadores actualizándose |
| `en_proceso = false`, sin fallidos | Mensaje "Enriquecimiento completado" en verde |
| `en_proceso = false`, con fallidos | Contadores + botón "Reintentar productos fallidos" en rojo |
| Error de red al consultar estado | Mensaje "No se pudo obtener el estado. Reintentando..." (silencioso, no bloquea) |

### 20.2 Botón "Reintentar productos fallidos" — Toast (Req 7.5)

```jsx
const handleReintentar = async () => {
  setReintentando(true);
  try {
    const data = await api.reintentarFallidos();
    mostrarToast({
      tipo: 'success',
      mensaje: data.reintentados > 0
        ? `${data.reintentados} productos encolados para reintento.`
        : 'No hay productos fallidos para reintentar.'
    });
    // Forzar refresh inmediato del estado
    const nuevoEstado = await api.obtenerEstadoEnriquecimiento();
    setEstadoIA(nuevoEstado);
  } catch {
    mostrarToast({ tipo: 'error', mensaje: 'Error al reintentar. Intenta nuevamente.' });
  } finally {
    setReintentando(false);
  }
};
```

El componente `Toast` ya existe en el proyecto (`componentes/feedback/`). Se usa el mismo patrón que en otras páginas.

### 20.3 Formato de ultima_actualizacion (Req 7.6)

```javascript
function formatearFechaEspanol(isoString) {
  if (!isoString) return '—';
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(isoString));
  // Resultado: "12 may 2026, 14:35"
}
```

### 20.4 AdminProductos.jsx — estados de carga y error

El badge `BadgeEnriquecimiento` maneja el caso `estado_enriquecimiento` ausente o desconocido:

```jsx
function BadgeEnriquecimiento({ estado }) {
  const config = CONFIG_BADGE[estado];
  if (!config) return null;  // no_aplica o valor desconocido → sin badge
  // ...
}
```

---

## 21. UI — Dark mode y touch targets (Restricciones UI 7, 8)

Todos los elementos nuevos usan exclusivamente tokens CSS del sistema de diseño existente:

- Fondos: `var(--color-bg)`, `var(--color-surface)`, `var(--color-surface-hover)`
- Texto: `var(--color-text)`, `var(--color-text-muted)`
- Bordes: `var(--color-border)`
- Semánticos: `var(--color-success)`, `var(--color-accent)`, `var(--color-warning)`, `var(--color-danger)`

Estos tokens ya tienen valores para light y dark mode definidos en el CSS global. No se necesitan clases `dark:` adicionales.

**Touch targets:** todos los botones nuevos tienen `min-h-11` (44px) y padding horizontal mínimo `px-4`. El badge `ia_fallido` clickeable tiene `min-h-[44px] min-w-[44px]` para cumplir el mínimo táctil.

---

## 22. Seguridad — SQL parametrizado en escritura IA (Restricción Seg 2)

La función `escribirSpecsEnBD()` en `servicioEnriquecimientoIA.js` usa el mismo patrón `INSERT ... ON CONFLICT DO UPDATE` con placeholders `$1, $2, ...` que ya usa `upsertSpecs()` en `servicioImportacion.js`:

```javascript
async function escribirSpecsEnBD(db, idProducto, categoria, specs) {
  // Reutiliza la función upsertSpecs() existente de servicioImportacion.js
  // que ya usa consultas parametrizadas. No se construye SQL por concatenación.
  const { upsertSpecs } = require('./servicioImportacion');
  await upsertSpecs(db, categoria, idProducto, specs);
}
```

Reutilizar `upsertSpecs()` existente garantiza idempotencia (Restricción BD 6) y SQL parametrizado (Restricción Seg 2) sin duplicar código.

---

## 23. Compatibilidad — Categorías no mapeadas (Restricción Compat 13)

El comportamiento existente se preserva sin cambios:

- `mapearCategoria()` retorna `null` para categorías no reconocidas
- `construirRegistroNormalizado()` retorna `null` cuando `categoriaEntrada` es null
- En `importar()`, un registro `null` incrementa `omitidos` y continúa al siguiente
- `estado_enriquecimiento` nunca se asigna para estas filas (no llegan al upsert)

No se requiere ningún cambio de código para este comportamiento — ya funciona así.

---

## 24. Lista completa de archivos a crear / modificar (actualizada)

### Crear nuevos
- `backend/scripts/migrar-enriquecimiento-ia.js`
- `backend/src/servicios/servicioEnriquecimientoIA.js`

### Modificar existentes
- `backend/src/servicios/servicioImportacion.js` — filtrado filas Deltron, limpieza descripción, mejoras regex, CAMPOS_REQUERIDOS completo, asignación estado, encolado
- `backend/src/controladores/controladorImportacion.js` — 2 nuevos handlers, `pendientes_enriquecimiento` en respuesta
- `backend/src/controladores/controladorProductos.js` — agregar `estado_enriquecimiento` al SELECT
- `backend/src/rutas/importacion.js` — 2 nuevas rutas
- `backend/src/servidor.js` — rate limiter de reintento, inicialización de cola al arrancar
- `frontend/src/servicios/api.js` — 2 nuevas funciones
- `frontend/src/paginas/ImportarCSV.jsx` — sección estado IA, auto-refresh, tarjeta pendientes, Toast, formato fecha
- `frontend/src/paginas/AdminProductos.jsx` — badge, filtro, banner


