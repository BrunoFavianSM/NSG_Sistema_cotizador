# Documento de Requisitos — Features Avanzadas del Cotizador

## Introducción

Este documento especifica los requisitos para 11 features nuevas del sistema **Cotizador NSG** (React + Tailwind + Node.js/Express + PostgreSQL). El sistema ya cuenta con cotizador funcional, historial de clientes, administración de productos, generación de PDF y asistente IA. Las features aquí descritas amplían las capacidades analíticas, de exportación, personalización y experiencia de usuario del sistema.

Todos los componentes de UI deben cumplir con el estándar Apple HIG, dark mode completo y accesibilidad WCAG 2.2 AA. El idioma del proyecto es español.

---

## Glosario

- **Dashboard**: Página `/admin/dashboard` con métricas operativas del negocio.
- **Cotizacion**: Registro generado por el sistema con código ticket, componentes y precio total.
- **Ticket**: Código alfanumérico único (formato `NSG-YYYY-NNNN`) que identifica una cotización.
- **Producto**: Componente de hardware o periférico registrado en el catálogo.
- **Historial_Precios**: Registro de cambios de precio de un producto a lo largo del tiempo.
- **Favorito**: Relación entre un usuario autenticado y un producto marcado como preferido.
- **Notificacion**: Mensaje generado por el sistema para informar al usuario de eventos relevantes.
- **Comparador**: Panel que muestra especificaciones de hasta 3 productos en paralelo.
- **Diagrama_Compatibilidad**: Visualización SVG de los componentes seleccionados y sus relaciones de compatibilidad.
- **Asistente_IA**: Componente de chat que ayuda al usuario a encontrar productos compatibles.
- **Configuracion_Compartida**: URL codificada en base64 que representa una configuración de componentes.
- **Analizador_Presupuesto**: Componente que evalúa si el presupuesto del usuario alcanza para la configuración seleccionada.
- **Admin**: Usuario con rol `admin` en el sistema.
- **Cliente**: Usuario autenticado con rol distinto a `admin`.
- **Invitado**: Usuario no autenticado.
- **Polling**: Técnica de consulta periódica al servidor para detectar cambios.
- **QR**: Código de respuesta rápida (Quick Response) embebido en el PDF de cotización.
- **Excel**: Archivo en formato `.xlsx` generado a partir de los datos de una cotización.

---

## Requisitos

---

### Requisito 1: Dashboard de Métricas Rápidas

**User Story:** Como Admin, quiero ver un dashboard con métricas operativas del negocio, para tomar decisiones rápidas sobre inventario y ventas sin necesidad de consultar la base de datos manualmente.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer el endpoint `GET /api/dashboard/metricas` protegido por autenticación de rol `admin`.
2. WHEN el Admin accede a `GET /api/dashboard/metricas`, THE Sistema SHALL retornar el total de cotizaciones creadas en el día actual y en los últimos 7 días.
3. WHEN el Admin accede a `GET /api/dashboard/metricas`, THE Sistema SHALL retornar los 5 productos más cotizados con su nombre, categoría y cantidad de apariciones en cotizaciones.
4. WHEN el Admin accede a `GET /api/dashboard/metricas`, THE Sistema SHALL retornar el ingreso estimado acumulado del día y de la semana, calculado como la suma de `precio_total` de cotizaciones en estado `Pendiente` o `Completada`.
5. IF el Admin no está autenticado o no tiene rol `admin`, THEN THE Sistema SHALL retornar HTTP 401 o 403 con mensaje de error estandarizado.
6. THE Dashboard SHALL renderizar la página `/admin/dashboard` accesible solo para usuarios con rol `admin`.
7. WHEN la página `/admin/dashboard` carga, THE Dashboard SHALL mostrar stat cards con: total cotizaciones hoy, total cotizaciones semana, ingresos estimados hoy e ingresos estimados semana.
8. WHEN la página `/admin/dashboard` carga, THE Dashboard SHALL mostrar una lista de los 5 productos más cotizados usando el componente de gráfico de barras de Recharts.
9. WHILE los datos del dashboard se están cargando, THE Dashboard SHALL mostrar un estado de carga accesible con `aria-busy="true"`.
10. IF el endpoint retorna error, THEN THE Dashboard SHALL mostrar un estado de error con opción de reintentar la carga.
11. THE Dashboard SHALL respetar dark mode completo y cumplir contraste WCAG AA en todos sus elementos visuales.

---

### Requisito 2: Exportar Cotizaciones a Excel

**User Story:** Como Cliente o Admin, quiero exportar una cotización a formato Excel, para compartirla o procesarla en herramientas de hoja de cálculo.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer el endpoint `GET /api/cotizaciones/:codigoTicket/excel` protegido por autenticación.
2. WHEN se invoca `GET /api/cotizaciones/:codigoTicket/excel`, THE Sistema SHALL generar un archivo `.xlsx` usando la librería `xlsx` con los datos de la cotización: código ticket, fecha de emisión, fecha de validez, lista de componentes (nombre, categoría, precio unitario, cantidad) y precio total.
3. WHEN el archivo Excel es generado, THE Sistema SHALL responder con `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` y el header `Content-Disposition: attachment; filename="cotizacion-{codigoTicket}.xlsx"`.
4. IF el código ticket no existe, THEN THE Sistema SHALL retornar HTTP 404 con mensaje de error estandarizado.
5. IF el código ticket tiene formato inválido, THEN THE Sistema SHALL retornar HTTP 400 con mensaje de error estandarizado.
6. THE HistorialCliente SHALL mostrar un botón "Exportar Excel" en cada fila de cotización de la tabla de historial.
7. WHEN el usuario hace clic en "Exportar Excel", THE HistorialCliente SHALL iniciar la descarga del archivo `.xlsx` correspondiente al ticket seleccionado.
8. THE botón "Exportar Excel" SHALL tener un `aria-label` descriptivo que incluya el código de ticket.
9. THE botón "Exportar Excel" SHALL tener un touch target mínimo de 44×44 px.

---

### Requisito 3: Historial de Cambios de Precios

**User Story:** Como Admin, quiero ver el historial de cambios de precio de cada producto, para auditar variaciones y mostrar el precio anterior al cliente como referencia.

#### Criterios de Aceptación

1. THE Sistema SHALL crear la tabla `historial_precios_producto` con los campos: `id`, `id_producto` (FK a `productos`), `precio_anterior`, `precio_nuevo`, `fecha_cambio` (timestamp con zona horaria), `id_usuario_admin` (FK a usuario que realizó el cambio).
2. THE tabla `historial_precios_producto` SHALL tener un índice en `id_producto` para optimizar consultas de historial por producto.
3. WHEN `actualizarProducto()` modifica el campo `precio_base` de un producto, THE Sistema SHALL insertar un registro en `historial_precios_producto` con el precio anterior, el precio nuevo y el timestamp del cambio dentro de la misma transacción.
4. THE Sistema SHALL exponer el endpoint `GET /api/productos/:id/historial-precios` protegido por autenticación de rol `admin`.
5. WHEN se invoca `GET /api/productos/:id/historial-precios`, THE Sistema SHALL retornar la lista de cambios de precio del producto ordenada por `fecha_cambio` descendente.
6. IF el producto no existe, THEN THE Sistema SHALL retornar HTTP 404 con mensaje de error estandarizado.
7. THE AdminProductos SHALL mostrar el precio anterior tachado junto al precio actual cuando el producto tiene al menos un registro en `historial_precios_producto`.
8. THE precio anterior tachado SHALL tener contraste suficiente para ser legible en dark mode y light mode (WCAG AA).
9. THE AdminProductos SHALL mostrar un indicador visual (ícono o badge) cuando un producto tiene historial de cambios de precio disponible.

---

### Requisito 4: Favoritos de Productos

**User Story:** Como Cliente autenticado, quiero marcar productos como favoritos, para acceder rápidamente a los componentes que más me interesan al armar una configuración.

#### Criterios de Aceptación

1. THE Sistema SHALL crear la tabla `productos_favoritos` con los campos: `id`, `id_usuario` (FK a `usuarios_clientes`), `id_producto` (FK a `productos`), `fecha_agregado` (timestamp). La combinación `(id_usuario, id_producto)` SHALL ser única.
2. THE Sistema SHALL exponer los endpoints `GET /api/productos/favoritos`, `POST /api/productos/favoritos` y `DELETE /api/productos/favoritos/:idProducto`, todos protegidos por autenticación de usuario.
3. WHEN se invoca `GET /api/productos/favoritos`, THE Sistema SHALL retornar la lista de productos favoritos del usuario autenticado con sus datos completos.
4. WHEN se invoca `POST /api/productos/favoritos` con un `id_producto` válido, THE Sistema SHALL agregar el producto a los favoritos del usuario autenticado.
5. IF el producto ya está en favoritos del usuario, THEN THE Sistema SHALL retornar HTTP 409 con mensaje de error estandarizado.
6. WHEN se invoca `DELETE /api/productos/favoritos/:idProducto`, THE Sistema SHALL eliminar el producto de los favoritos del usuario autenticado.
7. IF el producto no está en favoritos del usuario, THEN THE Sistema SHALL retornar HTTP 404 con mensaje de error estandarizado.
8. THE SelectorComponente SHALL mostrar un botón con ícono de corazón (❤️) en cada tarjeta de producto para usuarios autenticados.
9. WHEN el usuario hace clic en el botón de favorito, THE SelectorComponente SHALL alternar el estado de favorito del producto con feedback visual inmediato (optimistic update).
10. THE botón de favorito SHALL tener `aria-label` que indique el estado actual ("Agregar a favoritos" / "Quitar de favoritos") y el nombre del producto.
11. THE Sistema SHALL crear la página `/perfil` accesible para usuarios autenticados.
12. WHEN el usuario navega a `/perfil`, THE Perfil SHALL mostrar la lista de productos favoritos del usuario con opción de quitar cada uno.
13. IF el usuario no tiene favoritos, THEN THE Perfil SHALL mostrar un estado vacío con CTA para ir al cotizador.

---

### Requisito 5: Notificaciones en Tiempo Real (Polling)

**User Story:** Como Cliente autenticado, quiero recibir notificaciones cuando mi cotización esté lista o cuando haya novedades relevantes, para estar informado sin necesidad de revisar manualmente el sistema.

#### Criterios de Aceptación

1. THE Sistema SHALL crear la tabla `notificaciones_usuario` con los campos: `id`, `id_usuario` (FK a `usuarios_clientes`), `tipo` (varchar), `titulo` (varchar), `mensaje` (text), `leida` (boolean, default false), `fecha_creacion` (timestamp), `datos_extra` (jsonb, nullable).
2. THE Sistema SHALL exponer el endpoint `GET /api/notificaciones/pendientes` protegido por autenticación de usuario, que retorna las notificaciones no leídas del usuario autenticado.
3. WHEN se crea una cotización exitosamente en `crearCotizacion()` y el usuario está autenticado, THE Sistema SHALL insertar una notificación de tipo `cotizacion_creada` en `notificaciones_usuario` con el código ticket en `datos_extra`.
4. WHEN se invoca `notificarCotizacionLista()` para un usuario autenticado, THE Sistema SHALL insertar una notificación de tipo `cotizacion_lista` en `notificaciones_usuario`.
5. THE Sistema SHALL exponer el endpoint `PATCH /api/notificaciones/:id/leer` protegido por autenticación de usuario, que marca una notificación como leída.
6. THE Frontend SHALL implementar el hook `usePollingNotificaciones` que consulta `GET /api/notificaciones/pendientes` cada 30 segundos mientras el usuario está autenticado.
7. WHILE el usuario está autenticado, THE usePollingNotificaciones SHALL iniciar el polling automáticamente y detenerlo al desmontar el componente o al cerrar sesión.
8. WHEN el hook recibe notificaciones pendientes, THE Frontend SHALL renderizar el componente `NotificacionToast` para cada notificación nueva.
9. THE NotificacionToast SHALL mostrar el título y mensaje de la notificación con animación de entrada y salida respetando `prefers-reduced-motion`.
10. THE NotificacionToast SHALL incluir un botón de cierre accesible con `aria-label="Cerrar notificación"`.
11. THE NotificacionToast SHALL desaparecer automáticamente después de 5 segundos si el usuario no interactúa con ella.
12. IF el endpoint de notificaciones retorna error, THEN THE usePollingNotificaciones SHALL registrar el error en consola sin interrumpir la experiencia del usuario.

---

### Requisito 6: Panel de Comparación de Productos

**User Story:** Como Cliente o Admin, quiero comparar hasta 3 productos en paralelo, para tomar decisiones informadas al seleccionar componentes.

#### Criterios de Aceptación

1. THE Frontend SHALL implementar el componente `PanelComparador` que acepta una lista de hasta 3 productos y muestra sus especificaciones en columnas paralelas.
2. THE Cotizador SHALL mostrar un botón "Comparar" en cada tarjeta de producto dentro del selector de componentes.
3. WHEN el usuario hace clic en "Comparar" para un producto, THE Cotizador SHALL agregar el producto a la lista de comparación (máximo 3).
4. IF el usuario intenta agregar un cuarto producto a la comparación, THEN THE Cotizador SHALL mostrar un mensaje informativo indicando el límite de 3 productos.
5. WHEN hay al menos 2 productos en la lista de comparación, THE PanelComparador SHALL ser visible y mostrar las especificaciones técnicas agrupadas por categoría (nombre, precio, socket, RAM type, form factor, wattage, etc.).
6. THE PanelComparador SHALL resaltar visualmente las diferencias entre productos en cada fila de especificación.
7. THE PanelComparador SHALL permitir al usuario quitar un producto de la comparación con un botón de cierre accesible.
8. THE PanelComparador SHALL ser accesible por teclado con navegación entre columnas usando teclas de flecha.
9. THE PanelComparador SHALL respetar dark mode completo y cumplir contraste WCAG AA.
10. THE botón "Comparar" SHALL tener un `aria-label` descriptivo que incluya el nombre del producto.

---

### Requisito 7: Validación Visual de Compatibilidad (Diagrama SVG)

**User Story:** Como Cliente o Admin, quiero ver un diagrama visual de los componentes seleccionados y sus relaciones de compatibilidad, para identificar incompatibilidades de forma intuitiva.

#### Criterios de Aceptación

1. THE Frontend SHALL implementar el componente `DiagramaCompatibilidad` que renderiza un diagrama SVG con nodos para: CPU, Motherboard, RAM, GPU y Fuente de poder.
2. WHEN el usuario tiene al menos un componente seleccionado, THE DiagramaCompatibilidad SHALL mostrar los nodos correspondientes a los componentes seleccionados con el nombre del producto.
3. THE DiagramaCompatibilidad SHALL dibujar líneas de conexión entre nodos relacionados (CPU↔Motherboard, Motherboard↔RAM, Motherboard↔GPU, Fuente↔todos).
4. WHEN existe una incompatibilidad detectada entre dos componentes, THE DiagramaCompatibilidad SHALL colorear la línea de conexión correspondiente en rojo (`#FF453A`) y mostrar un ícono de advertencia.
5. WHEN todos los componentes conectados son compatibles, THE DiagramaCompatibilidad SHALL colorear las líneas de conexión en verde (`#34C759`).
6. WHEN un nodo corresponde a un componente no seleccionado, THE DiagramaCompatibilidad SHALL renderizar el nodo en estado deshabilitado (color neutro, opacidad reducida).
7. THE DiagramaCompatibilidad SHALL incluir atributos ARIA apropiados (`role="img"`, `aria-label` descriptivo del estado de compatibilidad) para accesibilidad.
8. THE DiagramaCompatibilidad SHALL respetar `prefers-reduced-motion` desactivando animaciones de transición cuando el usuario lo prefiera.
9. THE DiagramaCompatibilidad SHALL ser responsivo y adaptarse a pantallas móviles sin perder legibilidad.

---

### Requisito 8: Búsqueda por Compatibilidad (IA Concierge)

**User Story:** Como Cliente o Admin, quiero que el Asistente IA pueda buscar productos filtrando por compatibilidad con los componentes ya seleccionados, para recibir recomendaciones precisas y evitar incompatibilidades.

#### Criterios de Aceptación

1. THE Sistema SHALL extender el endpoint `GET /api/productos/buscar` para aceptar los parámetros de query: `procesador` (nombre o modelo), `ram_tipo` (DDR4, DDR5, etc.) y `socket` (LGA1700, AM5, etc.).
2. WHEN se invoca `GET /api/productos/buscar` con el parámetro `socket`, THE Sistema SHALL retornar solo productos cuyo campo `socket` coincida con el valor proporcionado.
3. WHEN se invoca `GET /api/productos/buscar` con el parámetro `ram_tipo`, THE Sistema SHALL retornar solo productos cuyo campo `ram_type` coincida con el valor proporcionado.
4. WHEN se invoca `GET /api/productos/buscar` con múltiples parámetros de compatibilidad, THE Sistema SHALL aplicar todos los filtros de forma conjunta (AND lógico).
5. THE AsistenteIA SHALL utilizar los endpoints de búsqueda con filtros de compatibilidad cuando el usuario solicite recomendaciones de componentes.
6. WHEN el AsistenteIA recibe una consulta de compatibilidad, THE AsistenteIA SHALL incluir en la respuesta los productos encontrados con sus especificaciones relevantes.
7. IF no se encuentran productos compatibles con los filtros aplicados, THEN THE Sistema SHALL retornar una lista vacía con un mensaje descriptivo.
8. THE endpoint `GET /api/productos/buscar` SHALL validar y sanitizar todos los parámetros de entrada antes de ejecutar la consulta.

---

### Requisito 9: Código QR en PDF de Cotización

**User Story:** Como Cliente, quiero que el PDF de mi cotización incluya un código QR con la URL de validación, para verificar la autenticidad de la cotización de forma rápida desde cualquier dispositivo.

#### Criterios de Aceptación

1. THE Sistema SHALL instalar la librería `qrcode` en el backend para la generación de códigos QR.
2. WHEN se genera el PDF de una cotización, THE ServicioPDF SHALL generar un código QR que codifica la URL de validación de la cotización (formato: `{BASE_URL}/validar?ticket={codigoTicket}`).
3. THE ServicioPDF SHALL insertar el código QR generado en el PDF de cotización, posicionado en la sección de metadatos o pie de página.
4. THE código QR en el PDF SHALL tener un tamaño mínimo de 80×80 puntos para ser legible por lectores estándar.
5. IF la generación del QR falla, THEN THE ServicioPDF SHALL generar el PDF sin el QR y registrar el error en consola, sin interrumpir la entrega del documento.
6. THE PDF generado con QR SHALL mantener compatibilidad con el flujo existente de descarga desde `HistorialCliente` y `ValidadorCotizaciones`.

---

### Requisito 10: Exportar Configuraciones Guardadas (URL Codificada)

**User Story:** Como Cliente o Admin, quiero generar un enlace para compartir mi configuración de componentes, para que otra persona pueda cargarla directamente en el cotizador sin tener que seleccionar cada componente manualmente.

#### Criterios de Aceptación

1. THE Cotizador SHALL mostrar un botón "Generar link para compartir" cuando hay al menos un componente seleccionado en la configuración actual.
2. WHEN el usuario hace clic en "Generar link para compartir", THE Cotizador SHALL codificar la configuración actual (IDs de productos seleccionados y sus categorías) en base64 y construir una URL con el formato `/configuracion?config={base64}`.
3. WHEN el usuario hace clic en "Generar link para compartir", THE Cotizador SHALL copiar la URL generada al portapapeles y mostrar un toast de confirmación.
4. THE Frontend SHALL implementar la ruta `/configuracion` que acepta el parámetro `config` en la query string.
5. WHEN el usuario navega a `/configuracion?config={base64}`, THE ConfiguracionCompartida SHALL decodificar el parámetro base64 y cargar automáticamente los componentes correspondientes en el cotizador.
6. IF el parámetro `config` es inválido o no puede decodificarse, THEN THE ConfiguracionCompartida SHALL mostrar un mensaje de error descriptivo y redirigir al cotizador vacío.
7. IF algún producto codificado en la URL ya no existe en el catálogo, THEN THE ConfiguracionCompartida SHALL cargar los productos disponibles e informar al usuario cuáles no pudieron cargarse.
8. THE URL generada SHALL ser válida y reproducible: decodificar la misma configuración siempre produce la misma URL.
9. THE botón "Generar link para compartir" SHALL tener un `aria-label` descriptivo y touch target mínimo de 44×44 px.

---

### Requisito 11: Validación de Presupuesto

**User Story:** Como Cliente o Admin, quiero ingresar un presupuesto máximo y recibir un análisis de si la configuración seleccionada lo supera, con recomendaciones de ahorro, para tomar decisiones de compra informadas.

#### Criterios de Aceptación

1. THE Frontend SHALL implementar el componente `AnalizadorPresupuesto` con un campo de entrada numérico para el presupuesto máximo del usuario.
2. WHEN el usuario ingresa un presupuesto, THE AnalizadorPresupuesto SHALL comparar el valor ingresado con el precio total de la configuración actual en tiempo real.
3. WHEN el precio total supera el presupuesto ingresado, THE AnalizadorPresupuesto SHALL mostrar el monto de exceso con color de alerta (`#FF453A`) y un mensaje descriptivo.
4. WHEN el precio total es igual o menor al presupuesto ingresado, THE AnalizadorPresupuesto SHALL mostrar un mensaje de confirmación con color de éxito (`#34C759`).
5. WHEN el precio total supera el presupuesto, THE AnalizadorPresupuesto SHALL mostrar recomendaciones de ahorro identificando los componentes de mayor costo relativo en la configuración.
6. THE AnalizadorPresupuesto SHALL actualizar el análisis automáticamente cada vez que el usuario modifique la configuración de componentes.
7. THE campo de presupuesto SHALL aceptar valores numéricos positivos en la moneda de vista activa (USD o PEN).
8. IF el usuario ingresa un valor no numérico o negativo, THEN THE AnalizadorPresupuesto SHALL mostrar un mensaje de validación bajo el campo con lenguaje directo y accionable.
9. THE AnalizadorPresupuesto SHALL respetar dark mode completo y cumplir contraste WCAG AA en todos sus estados (normal, exceso, dentro de presupuesto, error).
10. THE AnalizadorPresupuesto SHALL ser accesible por teclado y anunciar cambios de estado mediante `aria-live="polite"`.

---

## Restricciones Transversales

### Seguridad
1. THE Sistema SHALL validar y sanitizar todos los parámetros de entrada en los nuevos endpoints antes de ejecutar consultas a la base de datos.
2. THE Sistema SHALL usar consultas SQL parametrizadas en todos los nuevos endpoints; está prohibida la concatenación directa de valores de usuario en queries.
3. THE Sistema SHALL aplicar autenticación y autorización por rol en todos los endpoints nuevos que lo requieran.
4. THE Sistema SHALL retornar respuestas de error estandarizadas con códigos HTTP correctos en todos los nuevos endpoints.

### Base de Datos
5. THE Sistema SHALL incluir migraciones SQL verificables para cada nueva tabla: `historial_precios_producto`, `productos_favoritos` y `notificaciones_usuario`.
6. THE migraciones SHALL definir constraints de integridad referencial (FK), índices de rendimiento y restricciones de unicidad donde corresponda.

### UI/UX
7. THE Sistema SHALL implementar todos los nuevos componentes y páginas con dark mode completo sin excepciones visuales.
8. THE Sistema SHALL garantizar touch targets mínimos de 44×44 px en todos los elementos interactivos nuevos.
9. THE Sistema SHALL implementar estados de carga, error, vacío y éxito en todos los nuevos componentes y páginas críticas.
10. THE Sistema SHALL respetar `prefers-reduced-motion` en todas las animaciones de los nuevos componentes.
