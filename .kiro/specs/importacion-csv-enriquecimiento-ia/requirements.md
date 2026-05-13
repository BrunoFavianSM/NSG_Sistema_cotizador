# Requisitos — Importación CSV con Enriquecimiento IA

## Introducción

Este documento especifica los requisitos para mejorar el pipeline de importación de catálogo de productos desde el CSV de Deltron. El problema central es que el parser actual, al procesar el formato raw de Deltron, vuelca toda la información del producto en el campo `nombre` dejando las columnas de specs técnicas vacías. La mejora consiste en tres partes:

1. **Extracción estructurada**: parsear correctamente el CSV sucio de Deltron y distribuir cada dato en su columna correspondiente de las tablas `specs_*`.
2. **Enriquecimiento IA en background**: para los campos que no pueden extraerse del CSV (datos no presentes en el archivo), invocar una API de IA (Gemini o NVIDIA, configurable) de forma asíncrona para completarlos.
3. **Trazabilidad de origen de datos**: indicar en `/productos` si los specs de cada componente provienen del CSV, fueron completados por IA, o la IA falló al intentar completarlos.

El pipeline aplica únicamente a componentes principales: procesador, placa madre, RAM, almacenamiento, GPU, fuente y case. Periféricos y otros productos se importan sin enriquecimiento IA.

---

## Glosario

- **CSV Deltron**: Archivo CSV en formato raw exportado por el proveedor Deltron. Tiene encoding Windows-1252/latin1, filas de separador (`___`), headers repetidos por categoría, stock como `>20`, y la descripción del producto truncada con `[@@@]`.
- **CSV estructurado**: CSV con columnas explícitas (`categoria`, `codigo_proveedor`, `nombre`, specs técnicas, etc.) — el formato de salida limpio que ya existe en `assets/CSV cotizador/`.
- **Specs técnicas**: Campos específicos de cada categoría de componente almacenados en las tablas `specs_procesador`, `specs_placa_madre`, `specs_ram`, `specs_almacenamiento`, `specs_gpu`, `specs_fuente`, `specs_case`.
- **Extracción por regex**: Proceso actual de inferir specs desde el texto del nombre/descripción del producto usando expresiones regulares.
- **Enriquecimiento IA**: Proceso asíncrono en background que usa una API de IA para completar los campos de specs que no pudieron extraerse del CSV ni por regex.
- **Estado de enriquecimiento**: Indicador por producto que registra el origen de sus specs: `csv` (datos del archivo), `ia_completado` (completado por IA), `ia_fallido` (IA intentó pero falló), `pendiente` (en cola para IA), `no_aplica` (categoría no principal).
- **ServicioImportacion**: Módulo `servicioImportacion.js` que parsea el CSV y ejecuta el upsert masivo.
- **ServicioEnriquecimientoIA**: Módulo nuevo `servicioEnriquecimientoIA.js` que gestiona la cola de enriquecimiento asíncrono.
- **Componente principal**: Producto de categoría procesador, placa_madre, ram, almacenamiento, gpu, fuente o case.
- **Componente no principal**: Producto de cualquier otra categoría (mouse, teclado, monitor, software, etc.).

---

## Requisitos

---

### Requisito 1: Extracción estructurada de specs desde el CSV Deltron

**User Story:** Como Admin, quiero que al importar el CSV de Deltron los datos técnicos de cada componente se distribuyan correctamente en sus columnas correspondientes, para que las tablas `specs_*` queden pobladas con datos reales en lugar de vacías.

#### Criterios de Aceptación

1. THE `ServicioImportacion` SHALL detectar automáticamente si el CSV recibido es formato Deltron raw o CSV estructurado, usando la presencia de columnas `categoria` y `codigo_proveedor` en el encabezado como criterio de distinción.
2. WHEN el CSV es formato Deltron raw, THE `ServicioImportacion` SHALL filtrar y descartar las filas de separador (líneas que contienen solo guiones bajos `___`) y las filas de encabezado repetido (líneas que contienen `CODIGO`, `STOCK`, `PREC DISTRIB`) antes de procesar los datos.
3. WHEN el CSV es formato Deltron raw, THE `ServicioImportacion` SHALL extraer de cada fila de producto los siguientes campos posicionales: `categoria_proveedor` (col 0), `codigo_proveedor` (col 1), `descripcion_raw` (col 2), `stock_raw` (col 3), `precio_usd_raw` (col 4), `garantia` (col 6), `marca` (col 8).
4. THE `ServicioImportacion` SHALL limpiar la `descripcion_raw` eliminando el sufijo `[@@@]` y todo lo que sigue, caracteres de control, y normalizando encoding (Windows-1252 → UTF-8) antes de usarla como base para extracción de specs.
5. THE `ServicioImportacion` SHALL intentar extraer specs técnicas desde la `descripcion_raw` completa (no truncada) usando las funciones `extraerSpecs()` existentes, mejorando los patrones regex para cubrir los campos actualmente vacíos según la tabla de campos por categoría definida en el Requisito 2.
6. WHEN un campo de spec puede extraerse con confianza desde la descripción del CSV, THE `ServicioImportacion` SHALL escribirlo directamente en la columna correspondiente de la tabla `specs_*` sin invocar la IA.
7. WHEN un campo de spec no puede extraerse del CSV (valor `null` tras aplicar regex), THE `ServicioImportacion` SHALL marcarlo como candidato para enriquecimiento IA.
8. THE `ServicioImportacion` SHALL generar el nombre limpio del producto (`nombre`) tomando únicamente la parte antes de `[@@@]` en la descripción, normalizando espacios y encoding, con longitud máxima de 200 caracteres.
9. THE `ServicioImportacion` SHALL generar la `descripcion_general` del producto como el texto completo de la descripción raw limpia (sin `[@@@]` ni caracteres de control), con longitud máxima de 1000 caracteres.
10. IF el `precio_usd_raw` no puede parsearse como número positivo válido, THEN THE `ServicioImportacion` SHALL omitir esa fila y registrarla en `detalle_errores` con mensaje `"precio_usd inválido: {valor}"`.
11. IF el `codigo_proveedor` está vacío o es solo espacios, THEN THE `ServicioImportacion` SHALL omitir esa fila silenciosamente (sin contarla como error).

---

### Requisito 2: Campos de specs a extraer por categoría

**User Story:** Como Admin, quiero que el sistema extraiga el máximo de datos técnicos posibles desde el CSV, para minimizar la dependencia de la IA y reducir el costo de llamadas a APIs externas.

#### Criterios de Aceptación

1. PARA la categoría `procesador`, THE `ServicioImportacion` SHALL intentar extraer: `socket` (ej. `LGA1700`, `AM4`, `AM5`), `frecuencia_base_ghz`, `frecuencia_boost_ghz`, `tdp_w`, `nucleos` (desde texto como "20-core", "6-cores"), `hilos`, `graficos_integrados` (false si el código termina en `F` o el nombre contiene "sin gráficos").
2. PARA la categoría `placa_madre`, THE `ServicioImportacion` SHALL intentar extraer: `socket` (ej. `AM4`, `AM5`, `LGA1700`), `chipset` (ej. `A520`, `B550`, `B850`), `form_factor` (ej. `ATX`, `MICRO-ATX`, `MINI-ITX`), `ram_tipo` (ej. `DDR4`, `DDR5`).
3. PARA la categoría `ram`, THE `ServicioImportacion` SHALL intentar extraer: `ram_tipo` (ej. `DDR4`, `DDR5`), `capacidad_gb` (ej. `16` desde "16GB"), `velocidad_mhz` (ej. `3200` desde "3200MHz" o "3200MT/s"), `latencia` (ej. `CL16` desde "cl16"), `cantidad_modulos` (ej. `1` desde "1x16GB").
4. PARA la categoría `almacenamiento`, THE `ServicioImportacion` SHALL intentar extraer: `tipo_almacenamiento` (`HDD`, `SSD`, `NVMe`), `capacidad_gb` (convirtiendo TB a GB), `interfaz` (ej. `SATA III`, `NVMe PCIe 4.0`), `form_factor` (ej. `3.5"`, `2.5"`, `M.2`), `velocidad_lectura_mbps` (ej. `550` desde "550 MB/s"), `velocidad_escritura_mbps`.
5. PARA la categoría `gpu`, THE `ServicioImportacion` SHALL intentar extraer: `chipset` (ej. `AMD Radeon RX 9070 XT`, `NVIDIA GeForce RTX 5060 Ti`), `vram_gb`, `vram_tipo` (ej. `GDDR6`, `GDDR7`), `bus_bits` (ej. `256` desde "256-bit"), `tdp_w`, `longitud_mm`.
6. PARA la categoría `fuente`, THE `ServicioImportacion` SHALL intentar extraer: `wattage` (ej. `1000` desde "1000W"), `certificacion` (ej. `80+ Gold` desde "80 plus gold"), `modular` (`Full Modular`, `No Modular`), `form_factor` (`ATX`).
7. PARA la categoría `case`, THE `ServicioImportacion` SHALL intentar extraer: `form_factor` (ej. `ATX`, `Micro-ATX`, `Mini-ITX`), `color` (ej. `Blanco`, `Negro`), `panel_lateral` (ej. `Vidrio Templado`, `Malla Metálica`, `Acrílico Transparente`).
8. THE extracción SHALL ser tolerante a variaciones de capitalización, espaciado y abreviaciones comunes (ej. "matx" = "MICRO-ATX", "gddr 6" = "GDDR6", "80plus gold" = "80+ Gold").

---

### Requisito 3: Estado de enriquecimiento por producto

**User Story:** Como Admin, quiero saber el origen de los datos técnicos de cada componente, para identificar cuáles necesitan revisión manual o re-enriquecimiento.

#### Criterios de Aceptación

1. THE tabla `productos` SHALL incluir una columna `estado_enriquecimiento` de tipo `VARCHAR(20)` con los valores posibles: `csv`, `ia_completado`, `ia_fallido`, `pendiente`, `no_aplica`. El valor por defecto SHALL ser `no_aplica`.
2. WHEN un componente principal es importado y todos sus campos de specs requeridos se extrajeron exitosamente del CSV, THE `ServicioImportacion` SHALL establecer `estado_enriquecimiento = 'csv'`.
3. WHEN un componente principal es importado y al menos un campo de spec requerido quedó vacío tras la extracción del CSV, THE `ServicioImportacion` SHALL establecer `estado_enriquecimiento = 'pendiente'` e insertar el producto en la cola de enriquecimiento IA.
4. WHEN un componente no principal es importado, THE `ServicioImportacion` SHALL establecer `estado_enriquecimiento = 'no_aplica'`.
5. WHEN el `ServicioEnriquecimientoIA` completa exitosamente el enriquecimiento de un producto, THE Sistema SHALL actualizar `estado_enriquecimiento = 'ia_completado'` en la tabla `productos`.
6. WHEN el `ServicioEnriquecimientoIA` falla al enriquecer un producto (timeout, error de API, respuesta inválida), THE Sistema SHALL actualizar `estado_enriquecimiento = 'ia_fallido'` en la tabla `productos`.
7. WHEN un producto con `estado_enriquecimiento = 'ia_fallido'` es reimportado desde un nuevo CSV, THE `ServicioImportacion` SHALL reintentar el enriquecimiento IA estableciendo `estado_enriquecimiento = 'pendiente'`.
8. THE endpoint `GET /api/productos` SHALL incluir el campo `estado_enriquecimiento` en la respuesta de cada producto.

---

### Requisito 4: Cola de enriquecimiento IA en background

**User Story:** Como Admin, quiero que el enriquecimiento con IA ocurra en background sin bloquear la respuesta de importación, para que el catálogo esté disponible inmediatamente después de subir el CSV.

#### Criterios de Aceptación

1. THE `controladorImportacion.importarCSV` SHALL responder al cliente con el resultado del upsert (insertados, actualizados, omitidos, errores) inmediatamente después de completar la escritura en BD, sin esperar a que la IA procese ningún producto.
2. THE respuesta de `POST /api/importacion/csv` SHALL incluir el campo `pendientes_enriquecimiento` con el número de productos encolados para procesamiento IA.
3. THE `ServicioEnriquecimientoIA` SHALL procesar la cola de forma secuencial con un intervalo mínimo de 500ms entre llamadas a la API de IA, para evitar rate limiting.
4. THE `ServicioEnriquecimientoIA` SHALL leer la configuración de proveedor IA (Gemini o NVIDIA) y el modelo a usar desde la tabla `configuracion`, usando los valores del `.env` como fallback — los mismos endpoints `GET /api/configuracion/modelos-ia` y `GET /api/configuracion/api-keys-ia` ya existentes.
5. THE `ServicioEnriquecimientoIA` SHALL usar el modelo configurado para enriquecimiento: si el modo activo es `gemini`, usar `gemini_model`; si es `nvidia` o `pipeline`, usar `nvidia_model`.
6. THE `ServicioEnriquecimientoIA` SHALL construir un prompt estructurado que incluya: nombre del producto, descripción disponible, categoría, y la lista exacta de campos faltantes a completar con sus tipos de dato esperados.
7. THE `ServicioEnriquecimientoIA` SHALL parsear la respuesta de la IA como JSON y validar que los valores retornados sean coherentes con los tipos esperados (números para wattage/frecuencias, strings para socket/chipset, etc.) antes de escribirlos en BD.
8. IF la respuesta de la IA no puede parsearse como JSON válido o contiene valores incoherentes, THE `ServicioEnriquecimientoIA` SHALL marcar el producto como `ia_fallido` sin escribir datos parciales en las tablas `specs_*`.
9. THE `ServicioEnriquecimientoIA` SHALL aplicar un timeout de `AI_TIMEOUT_MS` (desde `.env`, default 15000ms) por llamada a la API de IA.
10. THE `ServicioEnriquecimientoIA` SHALL reintentar hasta `AI_MAX_RETRIES` veces (desde `.env`, default 2) ante errores de red o timeout antes de marcar el producto como `ia_fallido`.
11. THE `ServicioEnriquecimientoIA` SHALL registrar en consola con prefijo `[EnriquecimientoIA]` el inicio, progreso (cada 10 productos) y fin del procesamiento de la cola, incluyendo conteo de completados y fallidos.

---

### Requisito 5: Endpoint de estado de enriquecimiento

**User Story:** Como Admin, quiero consultar el estado del enriquecimiento IA en curso o del último proceso completado, para saber cuántos productos están pendientes y si hubo errores.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer el endpoint `GET /api/importacion/estado-enriquecimiento` protegido por `verificarTokenAdmin`, que retorna el estado actual del proceso de enriquecimiento IA.
2. THE respuesta de `GET /api/importacion/estado-enriquecimiento` SHALL incluir: `en_proceso` (boolean), `pendientes` (número de productos con `estado_enriquecimiento = 'pendiente'`), `completados` (número con `ia_completado`), `fallidos` (número con `ia_fallido`), `ultima_actualizacion` (timestamp del último cambio de estado).
3. THE Sistema SHALL exponer el endpoint `POST /api/importacion/reintentar-fallidos` protegido por `verificarTokenAdmin`, que mueve todos los productos con `estado_enriquecimiento = 'ia_fallido'` a `'pendiente'` y reactiva la cola de enriquecimiento.
4. WHEN se invoca `POST /api/importacion/reintentar-fallidos` y no hay productos fallidos, THE Sistema SHALL retornar HTTP 200 con `{ exito: true, mensaje: "No hay productos fallidos para reintentar", reintentados: 0 }`.
5. WHEN se invoca `POST /api/importacion/reintentar-fallidos` y hay productos fallidos, THE Sistema SHALL retornar HTTP 200 con `{ exito: true, reintentados: N }` donde N es el número de productos encolados.

---

### Requisito 6: Indicador de estado de enriquecimiento en `/productos`

**User Story:** Como Admin, quiero ver en la lista de productos si los datos técnicos de cada componente provienen del CSV, fueron completados por IA, o la IA falló, para tener control sobre la calidad del catálogo.

#### Criterios de Aceptación

1. THE página `/productos` (panel admin) SHALL mostrar un indicador visual de `estado_enriquecimiento` para cada componente principal en la lista de productos.
2. THE indicador SHALL usar los siguientes estilos diferenciados:
   - `csv`: badge verde con texto "Datos CSV"
   - `ia_completado`: badge azul con texto "Completado IA"
   - `ia_fallido`: badge rojo con texto "IA Falló"
   - `pendiente`: badge amarillo con texto "Pendiente IA" con animación de pulso sutil
   - `no_aplica`: sin badge (componentes no principales)
3. THE página `/productos` SHALL incluir un filtro por `estado_enriquecimiento` que permita al Admin ver solo los productos en un estado específico.
4. WHEN el Admin hace clic en el badge `ia_fallido` de un producto, THE Frontend SHALL mostrar un modal o tooltip con el mensaje "Los datos técnicos no pudieron completarse automáticamente. Puedes editar el producto manualmente o usar el botón 'Reintentar IA'."
5. THE página `/productos` SHALL mostrar un banner informativo cuando haya productos con `estado_enriquecimiento = 'pendiente'`, indicando "X productos pendientes de enriquecimiento IA" con un botón "Ver estado" que navega al panel de importación.
6. THE indicador de `estado_enriquecimiento` SHALL tener `aria-label` descriptivo (ej. `aria-label="Estado de datos: Completado por IA"`) y contraste WCAG AA.
7. THE badge `pendiente` SHALL respetar `prefers-reduced-motion`: si el usuario prefiere movimiento reducido, SHALL mostrar el badge estático sin animación de pulso.

---

### Requisito 7: Panel de importación en `/importar-csv`

**User Story:** Como Admin, quiero ver el resultado detallado de la importación y el estado del enriquecimiento IA en la página de importación, para tener visibilidad completa del proceso.

#### Criterios de Aceptación

1. THE página `/importar-csv` SHALL mostrar, tras una importación exitosa, un resumen con: total de filas procesadas, insertados, actualizados, omitidos, errores, y pendientes de enriquecimiento IA.
2. THE página `/importar-csv` SHALL incluir una sección "Estado del enriquecimiento IA" que consulte `GET /api/importacion/estado-enriquecimiento` y muestre los contadores en tiempo real con auto-refresh cada 10 segundos mientras `en_proceso = true`.
3. WHEN `en_proceso = true`, THE sección de estado SHALL mostrar un indicador de progreso animado con el texto "Enriqueciendo datos con IA...".
4. WHEN `en_proceso = false` y `fallidos > 0`, THE sección de estado SHALL mostrar un botón "Reintentar productos fallidos" que invoque `POST /api/importacion/reintentar-fallidos`.
5. WHEN el Admin hace clic en "Reintentar productos fallidos", THE Frontend SHALL mostrar un Toast de tipo `success` con "X productos encolados para reintento." o un Toast de tipo `error` si el endpoint falla.
6. THE sección de estado SHALL mostrar `ultima_actualizacion` formateada como fecha y hora local en español (ej. "Última actualización: 12 may 2026, 14:35").
7. THE página `/importar-csv` SHALL mantener el comportamiento existente de subida de archivo CSV sin romper el flujo actual.
8. THE auto-refresh SHALL detenerse automáticamente cuando `en_proceso = false`, para no generar requests innecesarios.
9. THE sección de estado SHALL respetar `prefers-reduced-motion`: si el usuario prefiere movimiento reducido, el indicador de progreso SHALL ser estático.

---

## Restricciones Transversales

### Seguridad
1. THE `ServicioEnriquecimientoIA` SHALL nunca incluir en el prompt enviado a la IA datos sensibles del sistema (credenciales, IDs internos de BD, tokens).
2. THE `ServicioEnriquecimientoIA` SHALL validar y sanitizar la respuesta de la IA antes de escribirla en BD, usando consultas SQL parametrizadas.
3. THE endpoint `POST /api/importacion/reintentar-fallidos` SHALL requerir `verificarTokenAdmin` y aplicar rate limiting de máximo 10 solicitudes por IP cada 15 minutos.

### Base de Datos
4. THE columna `estado_enriquecimiento` SHALL agregarse a la tabla `productos` mediante una migración SQL versionada en `scripts/`, con valor por defecto `'no_aplica'` para no romper registros existentes.
5. THE migración SHALL incluir un índice en `productos(estado_enriquecimiento)` para optimizar las consultas de filtrado por estado.
6. THE `ServicioEnriquecimientoIA` SHALL actualizar las tablas `specs_*` usando `INSERT ... ON CONFLICT (id_producto) DO UPDATE` para garantizar idempotencia.

### UI/UX
7. THE Sistema SHALL implementar todos los nuevos componentes con dark mode completo.
8. THE Sistema SHALL garantizar touch targets mínimos de 44×44 px en todos los elementos interactivos nuevos.
9. THE Sistema SHALL cubrir estados de carga, error, vacío y éxito en todos los nuevos flujos.
10. THE Sistema SHALL respetar `prefers-reduced-motion` en todas las animaciones nuevas.
11. THE indicadores de estado SHALL ser accesibles por teclado y tener `aria-label` descriptivos.

### Compatibilidad
12. THE mejoras al `ServicioImportacion` SHALL mantener compatibilidad total con el CSV estructurado existente — el formato de salida limpio (`assets/CSV cotizador/`) SHALL seguir importándose correctamente sin cambios.
13. THE pipeline de importación SHALL funcionar correctamente con CSVs de Deltron que contengan categorías no mapeadas (periféricos, software, etc.) — esas filas SHALL omitirse silenciosamente como en el comportamiento actual.
