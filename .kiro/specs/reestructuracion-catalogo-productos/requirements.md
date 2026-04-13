# Documento de Requisitos

## Introducción

Reestructuración completa del catálogo de productos del sistema de cotización automatizada NSG Latinoamérica. Se reemplaza la tabla `productos` por una tabla unificada `catalogo_productos`. El importador de CSV de Deltron carga **únicamente los productos de las 7 categorías del cotizador** (procesador, placa_madre, ram, almacenamiento, gpu, fuente, case), ignorando el resto del catálogo. La arquitectura queda abierta para agregar más categorías en el futuro. Se agrega soporte mejorado de imágenes (URL externa + archivo local), se adaptan backend y frontend para la nueva estructura, y se crea una interfaz de carga de CSV para ingestar el archivo de Deltron a la base de datos.

---

## Glosario

- **Catalogo_Productos**: Nueva tabla unificada que reemplaza a `productos`, almacenando todos los ítems del proveedor Deltron con sus metadatos originales y campos normalizados para el cotizador.
- **Categoria_Proveedor**: Categoría original del CSV de Deltron (ej: `"cpu amd ryzen 5 sam4 5xxx"`), preservada tal cual para trazabilidad.
- **Categoria_Normalizada**: Categoría simplificada usada por el cotizador (ej: `procesador`, `ram`, `gpu`). Mapea una o más categorías del proveedor a un único valor de dominio.
- **Codigo_Proveedor**: Código único del producto en el catálogo Deltron (ej: `"cpam4r55500"`).
- **CSV_Deltron**: Archivo `DCW_YYYYMMDDHHMMSS.csv` generado por Deltron con formato: `"categoria","codigo","nombre_descripcion",stock,precio_usd,,"garantia","flete","marca"`.
- **Importador_CSV**: Componente backend que parsea el CSV de Deltron y realiza upsert en `catalogo_productos`.
- **Interfaz_Importacion**: Página frontend `/admin/importar-csv` que permite cargar el CSV y monitorear el proceso.
- **Controlador_Productos**: Módulo backend `controladorProductos.js` que gestiona CRUD de `catalogo_productos`.
- **Controlador_Importacion**: Módulo backend `controladorImportacion.js` que gestiona la ingesta del CSV.
- **Servicio_Compatibilidad**: Módulo `servicioCompatibilidad.js` que valida compatibilidad técnica entre componentes del cotizador.
- **Cotizador**: Página frontend `Cotizador.jsx` que guía al usuario en la selección de componentes para armar una PC.
- **AppContext**: Contexto global de React que gestiona estado de productos, autenticación y configuración seleccionada.
- **API_Service**: Módulo frontend `api.js` que centraliza todas las llamadas HTTP al backend.
- **Detalle_Cotizacion**: Tabla que registra los productos incluidos en cada cotización; mantiene FK a `catalogo_productos`.
- **Imagen_URL**: URL externa que apunta a una imagen del producto (ej: enlace del fabricante).
- **Imagen_Path**: Ruta relativa del archivo de imagen subido localmente al servidor.
- **Precio_PEN**: Precio en soles peruanos, calculado a partir de `precio_base` (USD) y el tipo de cambio configurado.
- **Upsert**: Operación que inserta un registro si no existe o lo actualiza si ya existe, usando `codigo_proveedor` como clave de identificación.
- **Admin**: Usuario autenticado con rol de administrador en el sistema.

---

## Requisitos

### Requisito 1: Migración del esquema de base de datos

**User Story:** Como administrador del sistema, quiero reemplazar la tabla `productos` por tablas separadas por categoría de producto, para que el catálogo esté organizado y soporte la carga masiva desde CSV.

#### Criterios de Aceptación

1. THE Sistema SHALL eliminar la tabla `productos` y crear **una tabla por cada categoría normalizada**, con la siguiente estructura de columnas compartida: `id`, `nombre`, `categoria`, `categoria_proveedor`, `codigo_proveedor`, `marca`, `socket`, `ram_type`, `form_factor`, `wattage`, `tdp`, `precio_base`, `precio_pen`, `stock`, `disponible_a_pedido`, `tiempo_entrega_dias`, `descripcion_tecnica`, `imagen_url`, `imagen_path`, `garantia`, `flete`, `created_at`, `updated_at`. Las tablas a crear son: `productos_procesador`, `productos_placa_madre`, `productos_ram`, `productos_almacenamiento`, `productos_gpu`, `productos_fuente`, `productos_case`, `productos_mouse`, `productos_teclado`, `productos_webcam`, `productos_auricular`, `productos_parlante`, `productos_software_windows`, `productos_software_office`, `productos_software_antivirus`, `productos_almacenamiento_externo`, `productos_ups`, `productos_estabilizador`, `productos_monitor`, `productos_cooler_aire`, `productos_cooler_liquido`, `productos_conectividad`, `productos_mousepad`.
2. THE Sistema SHALL definir `codigo_proveedor` como columna con constraint `UNIQUE NOT NULL` en cada tabla de productos.
3. THE Sistema SHALL definir `precio_base` con constraint `CHECK (precio_base > 0)` y `stock` con constraint `CHECK (stock >= 0)` en cada tabla de productos.
4. THE Sistema SHALL crear índices en cada tabla de productos sobre las columnas `stock`, `codigo_proveedor` y `marca`.
5. THE Sistema SHALL actualizar la FK de `detalle_cotizacion.id_producto` para soportar referencias a cualquiera de las 23 tablas de productos. Para esto, `detalle_cotizacion` SHALL agregar la columna `tabla_producto` (VARCHAR(50) NOT NULL) que indica de qué tabla proviene el producto referenciado.
6. THE Sistema SHALL incluir el trigger `actualizar_updated_at` en cada tabla de productos para mantener `updated_at` actualizado automáticamente.
7. THE Sistema SHALL proveer el script `base-datos/schema.sql` actualizado que cree las 23 tablas con sus índices, constraints y triggers de forma idempotente (usando `CREATE TABLE IF NOT EXISTS`).

---

### Requisito 2: Soporte de imágenes por producto

**User Story:** Como administrador, quiero que cada producto pueda tener una imagen URL externa y/o una imagen subida localmente, para que el cotizador muestre imágenes de los productos y el panel admin permita gestionarlas.

#### Criterios de Aceptación

1. THE Catalogo_Productos SHALL almacenar `imagen_url` (VARCHAR(500), nullable) para URLs externas e `imagen_path` (VARCHAR(255), nullable) para rutas de archivos locales.
2. WHEN un Admin envía una solicitud `POST /api/productos/:id/imagen` con un archivo en formato `multipart/form-data`, THE Controlador_Productos SHALL guardar el archivo en el directorio de uploads del servidor y actualizar `imagen_path` del producto con la ruta relativa del archivo guardado.
3. WHEN se recibe un archivo de imagen en el endpoint de upload, THE Controlador_Productos SHALL aceptar únicamente archivos con tipo MIME `image/jpeg`, `image/png` o `image/webp` y rechazar cualquier otro tipo con código HTTP 400.
4. WHEN se recibe un archivo de imagen en el endpoint de upload, THE Controlador_Productos SHALL rechazar archivos con tamaño superior a 5 MB con código HTTP 413.
5. WHEN el Cotizador renderiza una tarjeta de producto, THE Cotizador SHALL mostrar `imagen_path` si está disponible, o `imagen_url` como fallback, o un placeholder SVG si ninguna está disponible.
6. WHEN un Admin actualiza `imagen_url` de un producto mediante `PUT /api/productos/:id`, THE Controlador_Productos SHALL validar que el valor sea una URL con formato válido (protocolo `http` o `https`) antes de persistir.

---

### Requisito 3: Adaptación del backend al nuevo catálogo

**User Story:** Como desarrollador, quiero que el backend opere sobre `catalogo_productos` en lugar de `productos`, para que todos los endpoints existentes continúen funcionando con la nueva estructura sin romper contratos con el frontend.

#### Criterios de Aceptación

1. WHEN el frontend llama a `GET /api/productos`, THE Controlador_Productos SHALL consultar la tabla correspondiente según el parámetro `categoria` y retornar los campos: `id`, `nombre`, `categoria`, `codigo_proveedor`, `marca`, `socket`, `ram_type`, `form_factor`, `wattage`, `tdp`, `precio_base`, `stock`, `disponible_a_pedido`, `tiempo_entrega_dias`, `descripcion_tecnica`, `imagen_url`, `imagen_path`, `created_at`, `updated_at`.
2. WHEN `GET /api/productos` recibe el parámetro `categoria`, THE Controlador_Productos SHALL consultar la tabla `productos_{categoria}` correspondiente. Si no se provee `categoria`, SHALL retornar productos de todas las 23 tablas mediante UNION.
3. WHEN `GET /api/productos` recibe el parámetro `marca`, THE Controlador_Productos SHALL filtrar por la columna `marca` usando comparación case-insensitive.
4. WHEN `GET /api/productos` recibe el parámetro `busqueda`, THE Controlador_Productos SHALL filtrar productos cuyo `nombre` o `descripcion_tecnica` contenga el texto buscado usando `ILIKE`.
5. WHEN un Admin llama a `POST /api/productos`, THE Controlador_Productos SHALL requerir autenticación JWT, determinar la tabla destino a partir del campo `categoria` del body, y validar que `nombre`, `categoria`, `codigo_proveedor` y `precio_base` estén presentes antes de insertar.
6. WHEN un Admin llama a `PUT /api/productos/:categoria/:id`, THE Controlador_Productos SHALL requerir autenticación JWT y actualizar únicamente los campos provistos en el body en la tabla `productos_{categoria}`.
7. WHEN un Admin llama a `DELETE /api/productos/:categoria/:id` y el producto tiene referencias en `detalle_cotizacion`, THE Controlador_Productos SHALL retornar HTTP 409 con mensaje descriptivo sin eliminar el registro.
8. THE Servicio_Compatibilidad SHALL leer los campos `socket`, `ram_type`, `form_factor`, `wattage`, `tdp` y `descripcion_tecnica` desde las tablas de productos correspondientes sin cambios en la lógica de validación de compatibilidad.

---

### Requisito 4: Adaptación del frontend al nuevo catálogo

**User Story:** Como desarrollador frontend, quiero que el Cotizador, AppContext y api.js funcionen con la nueva estructura de `catalogo_productos`, para que la experiencia del usuario no se vea interrumpida tras la migración.

#### Criterios de Aceptación

1. THE API_Service SHALL exponer la función `subirImagenProducto(id, archivo)` que llame a `POST /api/productos/:id/imagen` con `Content-Type: multipart/form-data`.
2. THE Cotizador SHALL filtrar productos por `p.categoria === pasoInfo.categoria` usando la columna `categoria` (normalizada) de los productos retornados por el backend, sin cambios en la lógica de filtrado existente.
3. WHEN AppContext carga productos mediante `cargarProductos()`, THE AppContext SHALL mapear la respuesta del backend a la estructura interna del cotizador, incluyendo los campos `imagen_url` e `imagen_path` en cada objeto de producto.
4. WHEN el Cotizador renderiza una tarjeta de producto con `imagen_path` o `imagen_url` disponible, THE Cotizador SHALL mostrar la imagen con dimensiones máximas de 80×80px y texto alternativo igual al `nombre` del producto.
5. THE API_Service SHALL mantener la firma existente de `obtenerProductos(filtros)`, `crearProducto(producto)`, `actualizarProducto(id, producto)` y `eliminarProducto(id)` sin cambios en sus contratos de entrada/salida visibles al consumidor.

---

### Requisito 5: Importador de CSV de Deltron (backend)

**User Story:** Como administrador, quiero un endpoint que parsee el archivo CSV de Deltron y realice upsert masivo en `catalogo_productos`, para que el catálogo se mantenga actualizado con los precios y stock del proveedor.

#### Criterios de Aceptación

1. WHEN un Admin envía `POST /api/importacion/csv` con un archivo CSV en `multipart/form-data`, THE Controlador_Importacion SHALL parsear el archivo usando el formato Deltron: `"categoria","codigo","nombre_descripcion",stock,precio_usd,,"garantia","flete","marca"`.
2. WHEN el Importador_CSV parsea una fila del CSV, THE Importador_CSV SHALL limpiar el campo `nombre_descripcion` eliminando el sufijo `[@@@]` y todo texto posterior, conservando solo la descripción principal.
3. WHEN el Importador_CSV parsea el campo `stock` de una fila, THE Importador_CSV SHALL interpretar el valor `>20` como `stock = 21` y `disponible_a_pedido = false`, el valor vacío como `stock = 0` y `disponible_a_pedido = true`, y cualquier número entero como `stock = N` y `disponible_a_pedido = false`.
4. WHEN el Importador_CSV procesa una fila con `codigo` ya existente en `catalogo_productos`, THE Importador_CSV SHALL actualizar los campos `nombre`, `categoria_proveedor`, `precio_base`, `stock`, `disponible_a_pedido`, `garantia`, `flete` y `marca` sin modificar `imagen_url`, `imagen_path` ni campos de compatibilidad técnica (`socket`, `ram_type`, `form_factor`, `wattage`, `tdp`).
5. WHEN el Importador_CSV procesa una fila cuya `categoria_proveedor` no mapea a ninguna de las 7 categorías del cotizador, THE Importador_CSV SHALL omitir esa fila silenciosamente (sin contarla como error ni como insertada/actualizada).
6. WHEN el Importador_CSV procesa una fila con `codigo` nuevo y categoría reconocida, THE Importador_CSV SHALL insertar el registro asignando `categoria_proveedor` con el valor original del CSV y `categoria` con el valor normalizado resultante del mapeo.
7. THE Importador_CSV SHALL aplicar el siguiente mapeo de categorías del CSV a categorías del cotizador:
   - `cpu amd ryzen *`, `cpu amd athlon *`, `cpu ci* *`, `cpu cu* *` → `procesador`
   - `mb ci9 *`, `mb cu9 *`, `mb socket am4 *`, `mb socket am5 *`, `mb socket i *`, `mb socket lga*` → `placa_madre`
   - `mem ddr4 *`, `mem ddr5 *`, `mem sodimm *`, `mem ddr3 *` → `ram`
   - `ssd 2.5 sata`, `ssd m.2 nvme`, `ssd m.2 sata`, `disco duro 3.5 sata`, `disco duro externo 2.5`, `disco solido externo(ssd)` → `almacenamiento`
   - `video, pci exp nvidia gam`, `video, pci exp radeon gam`, `video, pci exp intel gam`, `video, pci express nvidia` → `gpu`
   - `cases, fuente para gaming`, `cases, fuente certificada`, `cases, fuente para` → `fuente`
   - `cases atx ver2.0`, `cases atx ver2.0 s/fuente`, `cases micro atx`, `cases sin fuente p/gamers`, `cases atx` → `case`
   - `mouse usb`, `mouse inalambrico`, `mouse para gamers` → `mouse`
   - `teclado usb`, `teclado inalambrico`, `teclado para gamers`, `teclado+mouse combo kit`, `teclado+mouse kit inalamb` → `teclado`
   - `camara, webcam` → `webcam`
   - `audio, auricular c/mic` → `auricular`
   - `audio, parlante inalambrc` → `parlante`
   - `ms windows business`, `ms windows consumer`, `ms esd windows business`, `ms esd windows consumer` → `software_windows`
   - `ms esd office`, `ms esd office 365`, `ms office` → `software_office`
   - `software, antivirus`, `kaspersky esd consumo`, `kaspersky esd business` → `software_antivirus`
   - `disco duro externo 2.5`, `disco solido externo(ssd)`, `mem flash, usb drive` → `almacenamiento_externo`
   - `ups interactivo` → `ups`
   - `estabilizador de tension` → `estabilizador`
   - `monitor plano *`, `monitor curvo *`, `monitor gaming plano *`, `monitor gaming curvo *`, `monitores tft *` → `monitor`
   - `fan cooler cpu` → `cooler_aire`
   - `cooler liquido cpu 120`, `cooler liquido cpu 240`, `cooler liquido cpu 280`, `cooler liquido cpu 360` → `cooler_liquido`
   - `red wifi adaptadores usb`, `red wifi router-adsl` → `conectividad`
   - `mouse pad/mat, accesorios` → `mousepad`
   - Cualquier otra categoría → omitir (no importar).
8. THE Importador_CSV SHALL exponer la tabla de mapeo como una constante configurable en el código, de modo que agregar nuevas categorías en el futuro solo requiera editar esa constante sin cambiar la lógica de importación.
9. WHEN el Importador_CSV finaliza el procesamiento, THE Controlador_Importacion SHALL retornar un objeto JSON con los campos: `insertados` (entero), `actualizados` (entero), `omitidos` (entero, filas de categorías no reconocidas), `errores` (entero) y `detalle_errores` (array de objetos con `fila` y `mensaje`).
10. IF el archivo recibido en `POST /api/importacion/csv` no tiene extensión `.csv` o su tipo MIME no es `text/csv` o `text/plain`, THEN THE Controlador_Importacion SHALL retornar HTTP 400 con mensaje descriptivo sin procesar el archivo.
11. IF el Importador_CSV encuentra una fila con `precio_usd` vacío o no numérico, THEN THE Importador_CSV SHALL omitir esa fila, incrementar el contador `errores` y registrar el número de fila y motivo en `detalle_errores`.
12. THE Controlador_Importacion SHALL requerir autenticación JWT de Admin para acceder al endpoint `POST /api/importacion/csv`.

---

### Requisito 6: Interfaz de carga de CSV (frontend)

**User Story:** Como administrador, quiero una página `/admin/importar-csv` que me permita seleccionar el archivo CSV de Deltron, previsualizar su contenido y monitorear el resultado de la importación, para que pueda actualizar el catálogo sin acceso directo a la base de datos.

#### Criterios de Aceptación

1. THE Interfaz_Importacion SHALL ser accesible únicamente para usuarios autenticados como Admin; WHEN un usuario no autenticado accede a `/admin/importar-csv`, THE Sistema SHALL redirigir a `/login`.
2. THE Interfaz_Importacion SHALL permitir seleccionar un archivo CSV mediante un input de tipo file o mediante arrastrar y soltar (drag & drop) sobre una zona designada.
3. WHEN el usuario selecciona un archivo CSV, THE Interfaz_Importacion SHALL mostrar una tabla de previsualización con las primeras 10 filas del archivo, con columnas: `Categoría`, `Código`, `Nombre`, `Stock`, `Precio USD`, `Garantía`, `Flete`, `Marca`.
4. WHEN el usuario hace clic en el botón "Importar", THE Interfaz_Importacion SHALL deshabilitar el botón, mostrar un indicador de progreso y llamar al endpoint `POST /api/importacion/csv`.
5. WHEN el backend retorna el resultado de la importación, THE Interfaz_Importacion SHALL mostrar un resumen con: cantidad de productos insertados, actualizados y con error, y SHALL listar los errores individuales si `detalle_errores` no está vacío.
6. IF la llamada al endpoint falla con error de red o HTTP 5xx, THEN THE Interfaz_Importacion SHALL mostrar un mensaje de error descriptivo y habilitar nuevamente el botón "Importar" para reintentar.
7. THE Interfaz_Importacion SHALL incluir un enlace de navegación de regreso al panel de administración.
8. THE API_Service SHALL exponer la función `importarCSV(archivo)` que llame a `POST /api/importacion/csv` con `Content-Type: multipart/form-data` y retorne la respuesta del backend.

---

### Requisito 8: Extras opcionales en la cotización

**User Story:** Como cliente, quiero poder agregar periféricos, software, monitor, UPS y otros accesorios como extras opcionales a mi cotización de PC, para obtener un presupuesto completo en una sola cotización.

#### Criterios de Aceptación

1. THE Sistema SHALL reconocer las siguientes 16 categorías como **extras opcionales**, cada una con su propia tabla en la base de datos: `mouse`, `teclado`, `webcam`, `auricular`, `parlante`, `software_windows`, `software_office`, `software_antivirus`, `almacenamiento_externo`, `ups`, `estabilizador`, `monitor`, `cooler_aire`, `cooler_liquido`, `conectividad`, `mousepad`.
2. THE Cotizador SHALL mostrar una sección **"Otros"** al final del flujo de armado (después del paso `case`), organizada en subsecciones separadas por categoría: Periféricos (mouse, teclado, mousepad, webcam), Audio (auricular, parlante), Software (windows, office, antivirus), Almacenamiento externo, Energía (ups, estabilizador), Monitor, Refrigeración (cooler aire, cooler líquido), Conectividad.
3. WHEN el usuario agrega un extra desde cualquier subsección, THE Cotizador SHALL incluirlo en el cálculo del precio total y en el payload de la cotización con su `id_producto`, `tabla_producto` y `cantidad`.
4. THE Cotizador SHALL permitir agregar múltiples unidades de un mismo extra (ej: 2 monitores, 3 licencias de Windows).
5. WHEN se genera la cotización con extras, THE Controlador_Cotizaciones SHALL incluir los extras en `detalle_cotizacion` con los mismos campos que los componentes principales, usando `tabla_producto` para identificar de qué tabla proviene cada producto.
6. THE Cotizador SHALL permitir omitir completamente la sección "Otros" y generar la cotización solo con los 7 componentes del armado de PC.
7. THE API_Service SHALL exponer endpoints `GET /api/productos/:categoria` para cada una de las 23 categorías, retornando los productos de la tabla correspondiente.

---

### Requisito 9: Integridad referencial y compatibilidad con cotizaciones existentes

**User Story:** Como administrador del sistema, quiero que la migración preserve las cotizaciones existentes y sus detalles, para que el historial de cotizaciones no se pierda ni se corrompa durante la reestructuración.

#### Criterios de Aceptación

1. THE Sistema SHALL migrar todos los registros existentes de `productos` a `catalogo_productos` antes de eliminar la tabla original, preservando `id`, `nombre`, `categoria`, `socket`, `ram_type`, `form_factor`, `wattage`, `tdp`, `precio_base`, `stock`, `disponible_a_pedido`, `tiempo_entrega_dias`, `descripcion_tecnica`, `imagen_url`, `created_at` y `updated_at`.
2. THE Sistema SHALL asignar un `codigo_proveedor` temporal con formato `LEGACY-{id}` a los registros migrados desde `productos` que no tengan código de proveedor conocido.
3. WHEN la migración se ejecuta, THE Sistema SHALL verificar que el conteo de registros en `catalogo_productos` sea igual al conteo previo en `productos` antes de eliminar la tabla original.
4. THE Sistema SHALL actualizar la FK `detalle_cotizacion.id_producto` para referenciar `catalogo_productos(id)` sin modificar los valores de `id_producto` existentes, garantizando que todas las cotizaciones históricas mantengan sus referencias válidas.
5. IF la migración falla en cualquier paso, THEN THE Sistema SHALL revertir todos los cambios ejecutados en esa transacción, dejando el esquema en su estado original.
