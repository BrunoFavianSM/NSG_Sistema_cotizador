# Plan de Implementación: Importación CSV con Enriquecimiento IA

## Visión general

Implementar el pipeline completo de importación de catálogo Deltron con extracción estructurada de specs por regex, cola de enriquecimiento IA en background, trazabilidad de origen de datos y visualización en el panel admin. El trabajo se divide en cinco bloques: migración de BD, backend de importación, servicio de enriquecimiento IA, endpoints nuevos y frontend.

---

## Tareas

- [x] 1. Migración de base de datos
  - [x] 1.1 Crear script de migración `migrar-enriquecimiento-ia.js`
    - Crear `backend/scripts/migrar-enriquecimiento-ia.js` siguiendo el patrón de scripts existentes en esa carpeta
    - Agregar columna `estado_enriquecimiento VARCHAR(20) NOT NULL DEFAULT 'no_aplica'` con CHECK constraint a la tabla `productos`
    - Crear índice `idx_productos_estado_enriquecimiento` sobre `productos(estado_enriquecimiento)`
    - Usar `ejecutarQuery` de `configuracion/baseDatos`, imprimir resultado y manejar errores con `process.exit(1)`
    - _Requisitos: 3.1, Restricción BD 4, Restricción BD 5_

- [x] 2. Mejoras al parser del CSV Deltron en `servicioImportacion.js`
  - [x] 2.1 Implementar detección de formato y filtrado de filas no-producto
    - Agregar lógica de detección automática de formato Deltron raw vs CSV estructurado (presencia de columnas `categoria` y `codigo_proveedor`)
    - Implementar funciones `esFilaSeparador()`, `esFilaEncabezado()` y `esFilaMetadata()` según diseño §13.1
    - Aplicar los tres filtros de descarte antes de procesar cada línea en el branch Deltron raw
    - _Requisitos: 1.1, 1.2_
  - [x] 2.2 Implementar extracción posicional de campos y limpieza de descripción raw
    - Extraer campos por posición fija (col 0–8) según tabla del diseño §13.2
    - Implementar limpieza de `descripcion_raw`: separar nombre limpio (antes de `[@@@]`) y `descripcion_general` (texto completo sin `[@@@]` ni caracteres de control), con truncado a 200 y 1000 caracteres respectivamente
    - Normalizar encoding Windows-1252 → UTF-8
    - _Requisitos: 1.3, 1.4, 1.8, 1.9_
  - [x] 2.3 Implementar validaciones de fila (precio y código)
    - Omitir silenciosamente filas con `codigo_proveedor` vacío o solo espacios
    - Registrar en `detalle_errores` las filas con `precio_usd_raw` no parseable como número positivo, con mensaje `"precio_usd inválido: {valor}"`
    - _Requisitos: 1.10, 1.11_
  - [ ]* 2.4 Escribir pruebas unitarias para el parser Deltron
    - Probar detección de formato con CSV Deltron y CSV estructurado
    - Probar filtrado de filas separador, encabezado y metadata
    - Probar limpieza de descripción con `[@@@]`, caracteres de control y encoding
    - Probar validaciones de precio inválido y código vacío
    - _Requisitos: 1.1–1.11_

- [x] 3. Mejoras a `extraerSpecs()` por categoría en `servicioImportacion.js`
  - [x] 3.1 Implementar patrones regex para procesador, placa madre y RAM
    - Procesador: `cpu_nucleos` (cores/C/núcleos), `cpu_hilos` (threads/T), `cpu_graficos_integrados` (código F / "sin gráficos" / Radeon Graphics / Intel UHD)
    - Placa madre: `socket` (AM4/AM5/LGA1700), `mb_chipset` (A520/B550/B850/etc.), `mb_form_factor` (ATX/MICRO-ATX/MINI-ITX), `mb_ram_tipo` (DDR4/DDR5)
    - RAM: `ram_latencia` (CL16/CAS 16/16CL), `ram_velocidad_mhz` (MHz y MT/s), `ram_cantidad_modulos` (1x16GB)
    - _Requisitos: 2.1, 2.2, 2.3_
  - [x] 3.2 Implementar patrones regex para almacenamiento, GPU, fuente y case
    - Almacenamiento: `storage_velocidad_lectura_mbps`, `storage_velocidad_escritura_mbps`, `storage_form_factor` (M.2/2.5"/3.5")
    - GPU: `gpu_chipset` (NVIDIA GeForce RTX/AMD Radeon RX completo), `gpu_bus_bits` (256-bit), `gpu_vram_tipo` (GDDR6/GDDR7)
    - Fuente: `psu_modular` (Full/Semi/No Modular), `psu_certificacion` mejorada (80plus gold/80+ Gold)
    - Case: `case_color` (negro/blanco/gris/plateado/rojo/azul en ES e EN), `case_panel_lateral` (Vidrio Templado/Malla Metálica/Acrílico Transparente)
    - _Requisitos: 2.4, 2.5, 2.6, 2.7_
  - [x] 3.3 Extender funciones normalizadoras para tolerancia a variaciones
    - Extender `normalizarFormFactor()` para cubrir matx/m-atx/microatx → MICRO-ATX, mini-itx/miniitx → MINI-ITX, e-atx/eatx → E-ATX
    - Verificar que "gddr 6" → "GDDR6" y "80plus gold" → "80+ Gold" queden cubiertos por los regex de §3.2
    - _Requisito: 2.8_
  - [ ]* 3.4 Escribir pruebas unitarias para `extraerSpecs()` por categoría
    - Probar cada campo nuevo con al menos un caso positivo y uno negativo por categoría
    - Probar tolerancia a variaciones de capitalización y abreviaciones (matx, gddr 6, 80plus gold)
    - _Requisitos: 2.1–2.8_

- [x] 4. Lógica de estado de enriquecimiento en `servicioImportacion.js`
  - [x] 4.1 Implementar `CAMPOS_REQUERIDOS`, `tieneSpecsFaltantes()` y asignación de `estado_enriquecimiento`
    - Definir el mapa `CAMPOS_REQUERIDOS` completo según diseño §15 para las 7 categorías principales
    - Implementar `tieneSpecsFaltantes(categoria, registro)` que retorna `true` si algún campo requerido es `null` o `''`
    - En `construirRegistroNormalizado()`, asignar `estado_enriquecimiento`: `'csv'` si specs completas, `'pendiente'` si faltan campos, `'no_aplica'` para categorías no principales
    - _Requisitos: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.2 Implementar encolado post-upsert y retorno de `pendientes_enriquecimiento`
    - Incluir `estado_enriquecimiento` en el `INSERT ... ON CONFLICT DO UPDATE` del upsert
    - Acumular `itemsParaIA` durante el loop de filas y llamar `servicioEnriquecimientoIA.encolarProductos()` al finalizar (sin bloquear)
    - Retornar `pendientes_enriquecimiento: itemsParaIA.length` en el objeto de resultado de `importar()`
    - Implementar `calcularSpecsFaltantes(categoria, registro)` para construir la lista de campos faltantes con sus tipos esperados
    - _Requisitos: 3.3, 4.1, 4.2_
  - [x] 4.3 Actualizar `controladorProductos.js` para incluir `estado_enriquecimiento` en `GET /api/productos`
    - Agregar `p.estado_enriquecimiento` al SELECT de la query principal de productos en `controladorProductos.js`
    - _Requisito: 3.8_
  - [ ]* 4.4 Escribir pruebas unitarias para la lógica de estado de enriquecimiento
    - Probar que componentes con specs completas reciben `'csv'`
    - Probar que componentes con specs faltantes reciben `'pendiente'`
    - Probar que categorías no principales reciben `'no_aplica'`
    - Probar reimportación de producto con `ia_fallido` → queda `'pendiente'`
    - _Requisitos: 3.1–3.7_

- [x] 5. Punto de control — Backend de importación
  - Asegurarse de que todos los tests del bloque 2–4 pasen. Verificar que el CSV Deltron de ejemplo (`assets/DCW_20260407094705.csv`) se parsea correctamente y que el CSV estructurado (`assets/CSV cotizador/productos.csv`) sigue importándose sin cambios. Consultar al usuario si hay dudas.

- [ ] 6. Crear `servicioEnriquecimientoIA.js`
  - [x] 6.1 Implementar la cola en memoria y la interfaz pública del servicio
    - Crear `backend/src/servicios/servicioEnriquecimientoIA.js`
    - Implementar variables de estado internas: `_cola`, `_procesando`, `_ultimaActualizacion`
    - Implementar `encolarProductos(productos)`: agrega items a `_cola` e inicia `_procesarCola()` si no está en proceso
    - Implementar `obtenerEstadoMemoria()`: retorna `{ en_proceso, pendientes_en_memoria, ultima_actualizacion }`
    - Implementar `reactivarCola()`: reactiva el procesamiento si hay items en cola
    - Implementar `reactivarDesdeDB(ejecutarQuery)`: consulta productos con `estado_enriquecimiento = 'pendiente'` en BD, reconstruye items y llama `encolarProductos()`
    - _Requisitos: 4.1, 4.2, 4.3_
  - [x] 6.2 Implementar construcción del prompt y llamada al LLM
    - Implementar `construirPromptEnriquecimiento(item)` según diseño §4.3: system prompt de experto en hardware, mensaje con nombre/descripción/categoría y lista de campos faltantes con tipos esperados
    - Asegurarse de que el prompt nunca incluya `id_producto`, credenciales ni datos internos
    - Usar `obtenerConfigIA()` de `servicioConfigIA.js` para obtener proveedor, modelo y API keys
    - Seleccionar modelo según `configIA.modo_activo`: `gemini_model` si `'gemini'`, `nvidia_model` si `'nvidia'` o `'pipeline'`
    - Llamar a `generarRespuesta()` de `servicioLLM.js` con `{ systemPrompt, historial: [], mensajeActual, configIA }`
    - _Requisitos: 4.4, 4.5, 4.6, Restricción Seg 1_
  - [x] 6.3 Implementar validación de respuesta IA y escritura en BD
    - Implementar `validarRespuestaIA(respuestaTexto, categoria)`: parsear JSON, validar cada campo contra su tipo esperado (number, integer, string, boolean) según tabla del diseño §4.4
    - Si cualquier campo es incoherente, lanzar error y descartar toda la respuesta (no escribir datos parciales)
    - Reutilizar `upsertSpecs()` de `servicioImportacion.js` para escribir specs validadas en BD (garantiza SQL parametrizado e idempotencia)
    - Actualizar `estado_enriquecimiento = 'ia_completado'` en `productos` tras escritura exitosa
    - _Requisitos: 4.7, 4.8, Restricción Seg 2, Restricción BD 6_
  - [x] 6.4 Implementar `procesarItemConReintentos()` y el loop principal `_procesarCola()`
    - Implementar `procesarItemConReintentos(item, db)` con hasta `AI_MAX_RETRIES` reintentos (desde `.env`, default 2) ante errores de red/timeout, con backoff de `500ms * (intento + 1)`
    - Marcar producto como `ia_fallido` tras agotar reintentos
    - Implementar `_procesarCola(db)` con el loop asíncrono: tomar item, procesar, esperar `AI_INTERVAL_MS` (desde `.env`, default 500ms), repetir hasta cola vacía
    - Aplicar timeout `AI_TIMEOUT_MS` (desde `.env`, default 15000ms) por llamada a la API
    - Implementar logging con prefijo `[EnriquecimientoIA]`: inicio, progreso cada 10 productos y fin, con conteo de completados y fallidos
    - _Requisitos: 4.3, 4.9, 4.10, 4.11_
  - [ ]* 6.5 Escribir pruebas unitarias para `servicioEnriquecimientoIA.js`
    - Probar `validarRespuestaIA()` con respuesta JSON válida, JSON inválido y campos con tipos incorrectos
    - Probar que una respuesta con un campo incoherente descarta toda la respuesta
    - Probar `construirPromptEnriquecimiento()` para verificar que no incluye datos sensibles
    - Probar `obtenerEstadoMemoria()` en distintos estados de la cola
    - _Requisitos: 4.7, 4.8, Restricción Seg 1_

- [ ] 7. Nuevos endpoints de importación
  - [~] 7.1 Implementar handlers en `controladorImportacion.js`
    - Agregar `obtenerEstadoEnriquecimiento`: combina `obtenerEstadoMemoria()` con conteos reales de BD (query GROUP BY `estado_enriquecimiento`), retorna `{ en_proceso, pendientes, completados, fallidos, ultima_actualizacion }`
    - Agregar `reintentarFallidos`: UPDATE `ia_fallido` → `'pendiente'` con RETURNING, reconstruir items de cola, llamar `encolarProductos()` y `reactivarCola()`, retornar `{ exito, reintentados }` o `{ exito, mensaje, reintentados: 0 }` si no hay fallidos
    - Incluir `pendientes_enriquecimiento` en la respuesta del handler existente `importarCSV`
    - _Requisitos: 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 7.2 Registrar nuevas rutas en `rutas/importacion.js` y configurar `servidor.js`
    - Agregar `GET /estado-enriquecimiento` con `verificarTokenAdmin` en `rutas/importacion.js`
    - Agregar `POST /reintentar-fallidos` con `verificarTokenAdmin` y `limitadorReintento` en `rutas/importacion.js`
    - Crear `limitadorReintento` en `servidor.js` (10 req / 15 min por IP) siguiendo el patrón de rate limiters existentes
    - Inicializar `servicioEnriquecimientoIA.reactivarDesdeDB(ejecutarQuery)` en `servidor.js` al arrancar (sin bloquear, con `.catch()` para log de advertencia)
    - _Requisitos: 5.1, 5.3, Restricción Seg 3_
  - [ ]* 7.3 Escribir pruebas de integración para los nuevos endpoints
    - Probar `GET /api/importacion/estado-enriquecimiento` con token admin válido e inválido
    - Probar `POST /api/importacion/reintentar-fallidos` con y sin productos fallidos
    - Probar que `POST /api/importacion/csv` incluye `pendientes_enriquecimiento` en la respuesta
    - _Requisitos: 4.1, 4.2, 5.1–5.5_

- [x] 8. Punto de control — Backend completo
  - Asegurarse de que todos los tests del bloque 6–7 pasen. Verificar que el servidor arranca sin errores y que `reactivarDesdeDB` se ejecuta al iniciar. Consultar al usuario si hay dudas.

- [ ] 9. Frontend — `api.js` y componente `BadgeEnriquecimiento`
  - [x] 9.1 Agregar funciones de API en `frontend/src/servicios/api.js`
    - Implementar `obtenerEstadoEnriquecimiento()`: GET `/importacion/estado-enriquecimiento`
    - Implementar `reintentarFallidos()`: POST `/importacion/reintentar-fallidos`
    - _Requisitos: 5.1, 5.3_
  - [~] 9.2 Crear componente `BadgeEnriquecimiento`
    - Crear el componente (en `componentes/ui/` o inline en `AdminProductos.jsx`) con la configuración `CONFIG_BADGE` del diseño §9.1
    - Usar tokens CSS existentes: `--color-success`, `--color-accent`, `--color-danger`, `--color-warning`
    - Agregar `role="status"` y `aria-label="Estado de datos: {texto}"` para accesibilidad WCAG AA
    - Retornar `null` para `estado_enriquecimiento = 'no_aplica'` o valor desconocido
    - Aplicar `animate-pulse` condicionalmente respetando `prefers-reduced-motion` para el estado `pendiente`
    - Touch target mínimo de 44×44px en el badge `ia_fallido` (clickeable)
    - _Requisitos: 6.1, 6.2, 6.6, 6.7, Restricción UI 7, 8, 10, 11_

- [ ] 10. Frontend — `AdminProductos.jsx`
  - [x] 10.1 Integrar `BadgeEnriquecimiento` en la tabla de productos
    - Mostrar el badge en cada fila de componente principal usando el campo `estado_enriquecimiento` de la respuesta de `GET /api/productos`
    - _Requisito: 6.1, 6.2_
  - [x] 10.2 Implementar tooltip en badge `ia_fallido` y filtro por estado
    - Al hacer clic en badge `ia_fallido`, mostrar `<div role="tooltip">` con el mensaje del diseño §9.2
    - Agregar `<select>` de filtro por `estado_enriquecimiento` junto al filtro de categoría existente, con `aria-label` y `min-h-11`
    - Aplicar el filtro sobre los datos ya cargados en memoria (sin nueva llamada a API)
    - _Requisitos: 6.3, 6.4_
  - [x] 10.3 Implementar banner de productos pendientes
    - Calcular `pendientesCount` desde los productos cargados
    - Mostrar banner con `role="status"` y `aria-live="polite"` cuando `pendientesCount > 0`, con botón "Ver estado →" que navega a `/admin/importar-csv`
    - Botón con `min-h-11` para touch target
    - _Requisito: 6.5_
  - [ ]* 10.4 Escribir pruebas del componente `BadgeEnriquecimiento`
    - Probar renderizado de cada estado (csv, ia_completado, ia_fallido, pendiente, no_aplica)
    - Probar que `no_aplica` no renderiza badge
    - Probar que `aria-label` es correcto en cada estado
    - Probar que `animate-pulse` no se aplica cuando `prefers-reduced-motion: reduce`
    - _Requisitos: 6.1, 6.2, 6.6, 6.7_

- [ ] 11. Frontend — `ImportarCSV.jsx`
  - [x] 11.1 Agregar tarjeta "Pendientes IA" al resumen de importación
    - Mostrar `pendientes_enriquecimiento` de la respuesta del backend como quinta tarjeta en el grid de resultados (Insertados | Actualizados | Omitidos | Errores | Pendientes IA)
    - _Requisito: 7.1_
  - [x] 11.2 Implementar sección "Estado del enriquecimiento IA" con auto-refresh
    - Mostrar la sección solo cuando `resultado !== null` (tras importación exitosa)
    - Implementar el `useEffect` de auto-refresh del diseño §8.3: consulta inmediata + intervalo de 10s mientras `en_proceso = true`, detener cuando `en_proceso = false`
    - Mostrar skeleton de carga en la primera consulta, indicador animado cuando `en_proceso = true`, contadores de pendientes/completados/fallidos
    - Mostrar `ultima_actualizacion` formateada con `Intl.DateTimeFormat('es-PE', ...)` según diseño §20.3
    - Respetar `prefers-reduced-motion` en el indicador de progreso animado
    - _Requisitos: 7.2, 7.3, 7.6, 7.8, 7.9_
  - [x] 11.3 Implementar botón "Reintentar productos fallidos" con Toast
    - Mostrar el botón cuando `en_proceso = false && fallidos > 0`
    - Implementar `handleReintentar()` del diseño §20.2: llamar `api.reintentarFallidos()`, mostrar Toast `success` con conteo o Toast `error` si falla, forzar refresh inmediato del estado
    - Usar el componente `Toast` existente del proyecto
    - _Requisitos: 7.4, 7.5_
  - [ ]* 11.4 Escribir pruebas del componente `ImportarCSV.jsx` (sección IA)
    - Probar que la sección de estado no se muestra antes de importar
    - Probar que el auto-refresh se detiene cuando `en_proceso = false`
    - Probar que el botón "Reintentar" muestra Toast success/error según respuesta
    - Probar que `prefers-reduced-motion` desactiva la animación del indicador
    - _Requisitos: 7.1–7.9_

- [x] 12. Punto de control final — Integración completa
  - Asegurarse de que todos los tests pasen. Verificar el flujo completo: subir CSV Deltron → importación responde inmediatamente con `pendientes_enriquecimiento` → badge `pendiente` aparece en `/productos` → sección de estado en `/importar-csv` muestra progreso → badges cambian a `ia_completado` o `ia_fallido` al terminar. Consultar al usuario si hay dudas.

---

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los puntos de control garantizan validación incremental antes de avanzar al siguiente bloque
- El diseño usa JavaScript (Node.js/Express + React) — no se requiere selección de lenguaje
- El diseño no incluye sección de "Correctness Properties", por lo que no se agregan property-based tests; las pruebas son unitarias y de integración
- `upsertSpecs()` de `servicioImportacion.js` se reutiliza en `servicioEnriquecimientoIA.js` para garantizar SQL parametrizado e idempotencia sin duplicar código

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["2.4", "3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3"] },
    { "id": 6, "tasks": ["4.4", "6.1"] },
    { "id": 7, "tasks": ["6.2", "6.3"] },
    { "id": 8, "tasks": ["6.4"] },
    { "id": 9, "tasks": ["6.5", "7.1"] },
    { "id": 10, "tasks": ["7.2"] },
    { "id": 11, "tasks": ["7.3", "9.1", "9.2"] },
    { "id": 12, "tasks": ["10.1"] },
    { "id": 13, "tasks": ["10.2", "10.3", "11.1"] },
    { "id": 14, "tasks": ["10.4", "11.2", "11.3"] },
    { "id": 15, "tasks": ["11.4"] }
  ]
}
```
