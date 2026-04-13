# Plan de Implementación: Reestructuración del Catálogo de Productos

## Descripción general

Reemplazar la tabla monolítica `productos` por 23 tablas separadas por categoría, agregar soporte de imágenes, implementar el importador CSV de Deltron, y extender el cotizador con una sección de extras opcionales. El orden de implementación garantiza que cada capa dependa de la anterior sin romper el sistema en ningún punto intermedio.

## Tareas

- [ ] 1. Actualizar el esquema de base de datos
  - Modificar `base-datos/schema.sql`: agregar las 23 tablas `productos_{categoria}` usando `CREATE TABLE IF NOT EXISTS` con el template definido en el diseño
  - Cada tabla incluye columnas: `id, nombre, categoria, categoria_proveedor, codigo_proveedor, marca, socket, ram_type, form_factor, wattage, tdp, precio_base, precio_pen, stock, disponible_a_pedido, tiempo_entrega_dias, descripcion_tecnica, imagen_url, imagen_path, garantia, flete, created_at, updated_at`
  - Agregar constraints `UNIQUE(codigo_proveedor)`, `CHECK(precio_base > 0)`, `CHECK(stock >= 0)` en cada tabla
  - Agregar índices en `stock`, `codigo_proveedor`, `marca` por tabla
  - Agregar trigger `actualizar_updated_at` en cada tabla (reutilizar la función existente)
  - Modificar `detalle_cotizacion`: agregar columna `tabla_producto VARCHAR(50) NOT NULL DEFAULT 'productos_procesador'` y eliminar FK `detalle_cotizacion_id_producto_fkey`
  - Mantener la tabla `productos` original (se elimina en migración posterior)
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 2. Implementar `servicioImportacion.js`
  - [ ] 2.1 Crear `backend/src/servicios/servicioImportacion.js` con las constantes `MAPA_CATEGORIAS` y `CATEGORIAS_VALIDAS`
    - Implementar `mapearCategoria(categoriaCSV)`: normaliza a minúsculas, busca la clave más larga en `MAPA_CATEGORIAS` que sea prefijo, retorna categoría o `null`
    - Implementar `limpiarNombre(descripcion)`: split por `[@@@]`, retorna primer segmento con trim
    - Implementar `parsearStock(valor)`: `>20` → `{stock:21, disponible_a_pedido:false}`, vacío → `{stock:0, disponible_a_pedido:true}`, entero N → `{stock:N, disponible_a_pedido:false}`
    - Implementar `parsearLineaCSV(linea)` y `parsearCSV(buffer)`: parsea formato Deltron `"cat","cod","nombre",stock,precio,,"garantia","flete","marca"`
    - Implementar `importar(filas, db)`: upsert por lotes con `ON CONFLICT (codigo_proveedor) DO UPDATE`, sin actualizar `imagen_url`, `imagen_path`, `socket`, `ram_type`, `form_factor`, `wattage`, `tdp`; retorna `{insertados, actualizados, omitidos, errores, detalle_errores}`
    - _Requisitos: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.11_

  - [ ]* 2.2 Escribir prueba de propiedad para `limpiarNombre`
    - **Propiedad 13: `limpiarNombre` elimina sufijo `[@@@]` en cualquier posición**
    - **Valida: Requisito 5.2**
    - Usar `fast-check`: `fc.property(fc.string(), fc.string(), (prefijo, sufijo) => limpiarNombre(prefijo + '[@@@]' + sufijo) === prefijo.trim())`
    - Comentario: `// Feature: reestructuracion-catalogo-productos, Propiedad 13`

  - [ ]* 2.3 Escribir prueba de propiedad para `parsearStock`
    - **Propiedad 14: `parsearStock` es determinista para N >= 0**
    - **Valida: Requisito 5.3**
    - Usar `fast-check`: `fc.property(fc.integer({min:0, max:9999}), n => parsearStock(n.toString()).stock === n && !parsearStock(n.toString()).disponible_a_pedido)`
    - Comentario: `// Feature: reestructuracion-catalogo-productos, Propiedad 14`

  - [ ]* 2.4 Escribir prueba de propiedad para `mapearCategoria` — entradas no reconocidas
    - **Propiedad 16: `mapearCategoria` retorna `null` para cualquier categoría no reconocida**
    - **Valida: Requisito 5.5**
    - Usar `fast-check` con filtro: strings que no sean prefijo de ninguna clave del mapa
    - Comentario: `// Feature: reestructuracion-catalogo-productos, Propiedad 16`

  - [ ]* 2.5 Escribir prueba de propiedad para `mapearCategoria` — entradas del mapa
    - **Propiedad 17: `mapearCategoria` es determinista para entradas del mapa**
    - **Valida: Requisito 5.7**
    - Verificar que para cada clave K en `MAPA_CATEGORIAS`, `mapearCategoria(K) === MAPA_CATEGORIAS[K]` siempre
    - Comentario: `// Feature: reestructuracion-catalogo-productos, Propiedad 17`

  - [ ]* 2.6 Escribir prueba de propiedad para consistencia de contadores
    - **Propiedad 18: `insertados + actualizados + omitidos + errores === total filas`**
    - **Valida: Requisito 5.9**
    - Usar `fast-check` con array de filas generadas aleatoriamente y mock de `db`
    - Comentario: `// Feature: reestructuracion-catalogo-productos, Propiedad 18`

- [ ] 3. Implementar middleware multer
  - [ ] 3.1 Crear `backend/src/middleware/multerImagen.js`
    - `diskStorage` en `uploads/`, nombre aleatorio con `crypto.randomBytes(16).toString('hex') + ext`
    - Filtro MIME: aceptar solo `image/jpeg`, `image/png`, `image/webp`; rechazar con error `{codigo: 'TIPO_INVALIDO'}`
    - Límite de tamaño: 5 MB
    - _Requisitos: 2.3, 2.4_

  - [ ] 3.2 Crear `backend/src/middleware/multerCSV.js`
    - `memoryStorage` (buffer en memoria para procesamiento inmediato)
    - Filtro: extensión `.csv` y MIME `text/csv`, `text/plain` o que incluya `csv`
    - Límite de tamaño: 50 MB
    - _Requisitos: 5.10_

- [ ] 4. Refactorizar `controladorProductos.js`
  - Reemplazar toda la lógica existente que apunta a la tabla `productos` por la nueva arquitectura multi-tabla
  - Agregar `TABLAS_VALIDAS` (Set con las 23 tablas) como whitelist anti-injection
  - Implementar `resolverTabla(categoria)`: valida contra `TABLAS_VALIDAS`, lanza `Error` si inválida
  - Definir `CAMPOS_COMUNES` con los campos a retornar en todas las consultas
  - Refactorizar `obtenerProductos`: con `categoria` → query tabla específica; sin `categoria` → UNION ALL de 23 tablas
  - Refactorizar `obtenerProductoPorId`: ruta `/:categoria/:id`, usa `resolverTabla`
  - Refactorizar `crearProducto`, `actualizarProducto`, `eliminarProducto`: usan `resolverTabla` para determinar tabla destino
  - Agregar `subirImagenProducto(req, res)`: actualiza `imagen_path` en la tabla correcta
  - _Requisitos: 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 5. Actualizar `controladorCotizaciones.js`
  - Agregar `TABLAS_VALIDAS` (importar desde `controladorProductos` o duplicar la constante)
  - Modificar validación de componentes: cada item del payload debe incluir `tabla_producto`; validar que esté en `TABLAS_VALIDAS`
  - Modificar consulta de productos: agrupar componentes por `tabla_producto`, consultar cada tabla por separado en lugar de `FROM productos`
  - Modificar INSERT en `detalle_cotizacion`: incluir `tabla_producto` en los campos insertados
  - Mantener toda la lógica financiera (margen, IGV, tipo de cambio) sin cambios
  - _Requisitos: 8.3, 8.5, 9.4_

- [ ] 6. Crear `controladorImportacion.js`
  - Crear `backend/src/controladores/controladorImportacion.js`
  - Implementar `importarCSV(req, res)`: validar que `req.file` existe, llamar `servicioImportacion.parsearCSV(req.file.buffer)`, luego `servicioImportacion.importar(filas, ejecutarQuery)`, retornar JSON con `{insertados, actualizados, omitidos, errores, detalle_errores}`
  - Manejar error de archivo no recibido → HTTP 400
  - _Requisitos: 5.1, 5.9, 5.10, 5.12_

- [ ] 7. Actualizar rutas y servidor
  - [ ] 7.1 Actualizar `backend/src/rutas/productos.js`
    - Cambiar rutas `/:id` por `/:categoria/:id` para GET, PUT, DELETE
    - Agregar ruta `POST /:categoria/:id/imagen` con `uploadImagen.single('imagen')` y manejo de errores multer
    - _Requisitos: 2.2, 3.5, 3.6, 3.7_

  - [ ] 7.2 Crear `backend/src/rutas/importacion.js`
    - Ruta `POST /csv` con `verificarToken`, `uploadCSV.single('archivo')`, manejo de error `TIPO_INVALIDO`, y `ctrl.importarCSV`
    - _Requisitos: 5.10, 5.12_

  - [ ] 7.3 Actualizar `backend/src/servidor.js`
    - Registrar `app.use('/api/importacion', require('./rutas/importacion'))`
    - Agregar `app.use('/uploads', express.static('uploads'))` para servir imágenes locales
    - _Requisitos: 2.2, 5.12_

- [ ] 8. Actualizar utilidades backend
  - [ ] 8.1 Actualizar `backend/src/utilidades/validacion.js`
    - Ampliar el array `categoriasValidas` en `validarProducto` de 7 a 23 categorías
    - Mantener validaciones específicas por categoría (`socket` para procesador/placa_madre, `ram_type` para ram/placa_madre, etc.)
    - _Requisitos: 3.5_

  - [ ] 8.2 Actualizar `backend/src/servicios/servicioPDF.js`
    - Ampliar el objeto `mapa` en `formatearCategoria` para incluir las 16 categorías de extras (mouse, teclado, webcam, auricular, parlante, software_windows, software_office, software_antivirus, almacenamiento_externo, ups, estabilizador, monitor, cooler_aire, cooler_liquido, conectividad, mousepad)
    - _Requisitos: 8.5_

- [ ] 9. Checkpoint — Verificar backend completo
  - Asegurar que todos los tests del backend pasan, preguntar al usuario si hay dudas antes de continuar con el frontend.

- [ ] 10. Actualizar `frontend/src/servicios/api.js`
  - Agregar `obtenerProductosPorCategoria(categoria, filtros)`: `GET /api/productos?categoria={categoria}&...filtros`
  - Agregar `subirImagenProducto(categoria, id, archivo)`: `POST /api/productos/{categoria}/{id}/imagen` con `Content-Type: multipart/form-data`
  - Agregar `importarCSV(archivo)`: `POST /api/importacion/csv` con `Content-Type: multipart/form-data` y `timeout: 120000`
  - Mantener firmas existentes de `obtenerProductos`, `crearProducto`, `actualizarProducto`, `eliminarProducto` sin cambios
  - _Requisitos: 4.1, 4.5, 6.8_

- [ ] 11. Actualizar `frontend/src/contexto/AppContext.jsx`
  - Agregar estado `extras: {}` (objeto indexado por categoría, cada valor es array de `{producto, cantidad}`)
  - Implementar `agregarExtra(categoria, producto)`: si el producto ya existe en la categoría, incrementa cantidad; si no, lo agrega con cantidad 1
  - Implementar `quitarExtra(categoria, idProducto)`: decrementa cantidad; si llega a 0, elimina el item
  - Implementar `cargarExtras(categorias[])`: `Promise.all` de `obtenerProductosPorCategoria` para cada categoría del array
  - Actualizar `construirPayloadCotizacion()`: incluir `tabla_producto: 'productos_${categoria}'` en todos los items (componentes principales y extras)
  - _Requisitos: 4.3, 8.3, 8.4_

- [ ] 12. Actualizar `frontend/src/paginas/Cotizador.jsx` — sección "Otros"
  - Definir constante `SUBSECCIONES_EXTRAS` con 8 grupos: Periféricos (mouse, teclado, mousepad, webcam), Audio (auricular, parlante), Software (software_windows, software_office, software_antivirus), Almacenamiento externo, Energía (ups, estabilizador), Monitor, Refrigeración (cooler_aire, cooler_liquido), Conectividad
  - Agregar paso 8 "Otros" después del paso `case` en el flujo del cotizador
  - Cada subsección es un acordeón colapsable; al expandir, llamar `cargarExtras(subseccion.categorias)` si los productos no están cargados aún
  - Mostrar controles `−` / cantidad / `+` por producto dentro de cada subsección
  - Incluir extras en el cálculo del precio total mostrado
  - El botón "Generar cotización" debe estar disponible desde el paso 7 (case) en adelante
  - Permitir omitir completamente la sección "Otros" y generar cotización solo con los 7 componentes
  - _Requisitos: 4.2, 4.4, 8.2, 8.3, 8.4, 8.6_

- [ ] 13. Crear `frontend/src/paginas/ImportarCSV.jsx`
  - Ruta `/admin/importar-csv`, protegida: redirigir a `/login` si el usuario no está autenticado
  - Zona drag & drop + input file para seleccionar el CSV
  - Al seleccionar archivo: parsear localmente las primeras 10 filas y mostrar tabla de previsualización con columnas: Categoría, Código, Nombre, Stock, Precio USD, Garantía, Flete, Marca
  - Botón "Importar": deshabilitar durante la importación, mostrar spinner
  - Al recibir respuesta: mostrar resumen con insertados, actualizados, omitidos, errores; listar `detalle_errores` si no está vacío
  - En error de red o HTTP 5xx: mostrar mensaje descriptivo y rehabilitar el botón "Importar"
  - Incluir enlace de regreso al panel de administración
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 14. Escribir pruebas
  - [ ] 14.1 Crear `backend/pruebas/servicioImportacion.test.js`
    - Pruebas unitarias de `mapearCategoria`: categoría reconocida, categoría no reconocida, string vacío, mayúsculas
    - Pruebas unitarias de `limpiarNombre`: sin marcador, con marcador, con texto después del marcador
    - Pruebas unitarias de `parsearStock`: `>20`, vacío, entero positivo, cero, valor inesperado
    - Pruebas unitarias de `parsearCSV`: línea bien formada, línea con campos vacíos
    - _Requisitos: 5.2, 5.3, 5.7_

  - [ ]* 14.2 Agregar pruebas PBT en `backend/pruebas/servicioImportacion.test.js`
    - Incluir las propiedades 13, 14, 16, 17, 18 usando `fast-check` con `numRuns: 100`
    - Cada test con comentario `// Feature: reestructuracion-catalogo-productos, Propiedad N`
    - _Requisitos: 5.2, 5.3, 5.5, 5.7, 5.9_

  - [ ] 14.3 Crear `backend/pruebas/controladorImportacion.test.js`
    - Sin autenticación → HTTP 401
    - Archivo sin extensión `.csv` → HTTP 400
    - CSV válido → respuesta con contadores correctos (`insertados + actualizados + omitidos + errores === total filas`)
    - _Requisitos: 5.9, 5.10, 5.12_

  - [ ]* 14.4 Actualizar `backend/pruebas/controladorProductos.test.js`
    - Actualizar tests existentes para usar rutas `/:categoria/:id`
    - Agregar test de `resolverTabla` con categoría válida → retorna nombre de tabla correcto
    - Agregar test de `resolverTabla` con categoría inválida → lanza error / retorna HTTP 400
    - _Requisitos: 3.1, 3.2, 3.5, 3.6, 3.7_

  - [ ]* 14.5 Actualizar `backend/pruebas/controladorCotizaciones.test.js`
    - Actualizar payload de prueba para incluir `tabla_producto` en cada componente
    - Verificar que cotización con extras incluye `tabla_producto` en `detalle_cotizacion`
    - _Requisitos: 8.3, 8.5_

  - [ ]* 14.6 Crear `frontend/src/paginas/ImportarCSV.test.jsx`
    - Render inicial: muestra zona drag & drop y botón "Importar" deshabilitado
    - Al seleccionar archivo: muestra tabla de previsualización con máximo 10 filas
    - Al hacer clic en "Importar": deshabilita botón y muestra spinner
    - Al recibir respuesta exitosa: muestra resumen con contadores
    - En error de red: muestra mensaje de error y rehabilita botón
    - _Requisitos: 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 15. Checkpoint final — Asegurar que todos los tests pasan
  - Ejecutar suite completa de pruebas backend y frontend, preguntar al usuario si hay dudas antes de cerrar.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- El orden de implementación es estricto: BD → servicios puros → middleware → controladores → rutas → frontend
- La tabla `productos` original se mantiene durante toda la implementación; su eliminación es un paso manual posterior a validar la migración
- `resolverTabla()` es la única función que puede construir nombres de tabla; nunca concatenar input del usuario directamente en SQL
- El upsert del importador nunca sobreescribe `imagen_url`, `imagen_path`, `socket`, `ram_type`, `form_factor`, `wattage`, `tdp`
