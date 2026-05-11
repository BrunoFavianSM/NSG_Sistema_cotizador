# Documento de Requisitos — Mejoras del Sistema Cotizador

## Introducción

Este documento especifica los requisitos para 10 mejoras y correcciones del sistema **Cotizador NSG** (React + Tailwind + Node.js/Express + PostgreSQL). Las mejoras abarcan: recuperación de cuenta por teléfono, configuración de modelos de IA desde el panel administrativo, persistencia de la selección de componentes, corrección del logo en el PDF comercial, corrección del botón de PDF en cotizaciones vencidas, mejora del diseño del reporte Excel, etiqueta "Vencida" en el historial, auto-validación de ticket desde el historial, funcionamiento real del botón "Notificar equipo listo", y filtros de ordenamiento por precio en el cotizador.

Todos los componentes de UI deben cumplir con el estándar Apple HIG, dark mode completo y accesibilidad WCAG 2.2 AA. El idioma del proyecto es español.

---

## Glosario

- **Sistema**: El backend Node.js/Express del Cotizador NSG.
- **Frontend**: La aplicación React + Tailwind + Vite del Cotizador NSG.
- **ServicioAuth**: Módulo `servicioAuth.js` que gestiona autenticación, registro y recuperación de contraseña.
- **ServicioCorreo**: Módulo `servicioCorreo.js` que envía correos transaccionales vía SMTP/nodemailer.
- **ServicioNotificaciones**: Módulo `servicioNotificaciones.js` que envía notificaciones de estado de cotización por correo.
- **ServicioPDF**: Módulo `servicioPDF.js` que genera documentos PDF de cotizaciones.
- **ServicioExcel**: Módulo `servicioExcel.js` que genera archivos `.xlsx` de cotizaciones.
- **Cotizador**: Página `/cotizador` con el flujo de selección de componentes por pasos (`Cotizador.jsx`).
- **Historial**: Página `/historial` (`HistorialCliente.jsx`) que muestra cotizaciones pasadas.
- **Validador**: Página `/validar` (`ValidadorCotizaciones.jsx`) que verifica y completa tickets.
- **AdminConfiguracion**: Página `/admin/configuracion` (`AdminConfiguracion.jsx`) con parámetros del sistema.
- **Configuracion_Seleccionada**: Objeto en el contexto global (`AppContext`) que contiene los componentes elegidos por el usuario en el cotizador.
- **Cotizacion_Vencida**: Cotización cuya `fecha_validez` es anterior a la fecha actual y cuyo estado es `'Pendiente'`. El backend la identifica internamente como `'Caducada'`.
- **Token_Recuperacion**: Cadena hexadecimal de 32 bytes almacenada en `cuentas.token_recuperacion` con expiración de 5 minutos.
- **Modelo_IA**: Identificador de modelo de lenguaje (ej. `gemini-2.5-flash`, `mistralai/mistral-small-4-119b-2603`) usado por el asistente de IA.
- **Admin**: Usuario con rol `admin` en el sistema.
- **Usuario**: Usuario autenticado con rol `usuario` en el sistema.
- **Invitado**: Usuario no autenticado.
- **Toast**: Notificación visual temporal mostrada mediante el componente `ToastProvider` (librería `sileo`).

---

## Requisitos

---

### Requisito 1: Recuperación de cuenta por teléfono

**User Story:** Como usuario registrado, quiero recuperar mi contraseña usando mi número de teléfono, para poder acceder a mi cuenta cuando no recuerdo el correo con el que me registré.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer el endpoint `POST /api/auth/recuperar-por-telefono` sin autenticación requerida, que acepta el campo `telefono` en el body.
2. WHEN se invoca `POST /api/auth/recuperar-por-telefono` con un número de teléfono registrado en `cuentas.telefono_hash`, THE Sistema SHALL generar un `Token_Recuperacion` con expiración de 5 minutos, almacenarlo en `cuentas.token_recuperacion` y `cuentas.token_recuperacion_expira`, y enviar el enlace de restablecimiento al correo asociado a esa cuenta mediante `ServicioCorreo`.
3. IF el número de teléfono no corresponde a ninguna cuenta registrada, THEN THE Sistema SHALL retornar HTTP 200 con el mensaje genérico `"Si el teléfono existe, recibirás instrucciones en tu correo registrado."` sin revelar si el número existe o no (anti-enumeración).
4. IF el número de teléfono tiene formato inválido (menos de 7 dígitos o contiene caracteres no numéricos), THEN THE Sistema SHALL retornar HTTP 400 con mensaje de error descriptivo y código `TELEFONO_INVALIDO`.
5. THE endpoint `POST /api/auth/recuperar-por-telefono` SHALL aplicar rate limiting de máximo 3 solicitudes por IP cada 15 minutos, retornando HTTP 429 al exceder el límite.
6. THE Frontend SHALL mostrar en la página `/recuperar` un enlace o pestaña "Recuperar con teléfono" que permita al usuario ingresar su número en lugar del correo.
7. WHEN el usuario envía el formulario de recuperación por teléfono, THE Frontend SHALL mostrar el mismo mensaje de confirmación genérico independientemente de si el teléfono existe o no.
8. THE campo de teléfono en el formulario de recuperación SHALL tener `type="tel"`, `autocomplete="tel"` y `aria-label="Número de teléfono"`.

---

### Requisito 2: Cambio de modo y modelos del asistente de IA desde configuración

**User Story:** Como Admin, quiero seleccionar el modo de operación del asistente de IA y configurar los modelos de cada modo desde el panel de configuración, para ajustar el comportamiento del asistente sin necesidad de modificar el archivo `.env` del servidor.

#### Contexto técnico

El asistente opera en tres modos mutuamente excluyentes controlados por la variable `AGENT_PIPELINE_ENABLED`:

- **Modo 1 — Pipeline Multi-Agente NVIDIA** (`AGENT_PIPELINE_ENABLED=true`): usa tres modelos en secuencia — `NVIDIA_CLASSIFIER_MODEL` (clasificación de intención), `NVIDIA_EMBEDDING_MODEL` (búsqueda semántica) y `NVIDIA_RERANKER_MODEL` (reordenamiento de resultados). Si el pipeline falla, hace fallback automático al Modo 3.
- **Modo 2 — Uni-modelo NVIDIA** (`AGENT_PIPELINE_ENABLED=false` + proveedor NVIDIA): usa un único modelo `NVIDIA_MODEL` para chat completions.
- **Modo 3 — Uni-modelo Gemini** (`AGENT_PIPELINE_ENABLED=false` + proveedor Gemini): usa `GEMINI_MODEL`; es el fallback legacy cuando el pipeline está desactivado. En `servicioLLM.js`, Gemini se intenta primero y NVIDIA actúa como fallback secundario.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer el endpoint `GET /api/configuracion/modelos-ia` protegido por `verificarTokenAdmin`, que retorna el modo activo y los modelos configurados para cada modo: `modo_activo` (`'pipeline'` | `'nvidia'` | `'gemini'`), `nvidia_classifier_model`, `nvidia_embedding_model`, `nvidia_reranker_model`, `nvidia_model` y `gemini_model`.
2. THE Sistema SHALL exponer el endpoint `PUT /api/configuracion/modelos-ia` protegido por `verificarTokenAdmin`, que acepta en el body los campos `modo_activo`, `nvidia_classifier_model`, `nvidia_embedding_model`, `nvidia_reranker_model`, `nvidia_model` y `gemini_model`, y persiste los valores en la tabla `configuracion`.
3. WHEN se invoca `PUT /api/configuracion/modelos-ia` con valores válidos, THE Sistema SHALL actualizar los registros correspondientes en la tabla `configuracion` usando `INSERT ... ON CONFLICT DO UPDATE` y retornar los valores guardados.
4. IF el campo `modo_activo` recibido en `PUT /api/configuracion/modelos-ia` no es uno de los valores permitidos (`'pipeline'`, `'nvidia'`, `'gemini'`), THEN THE Sistema SHALL retornar HTTP 400 con mensaje de error descriptivo y código `MODO_INVALIDO`.
5. IF algún campo de modelo requerido por el modo activo está vacío o contiene solo espacios en blanco, THEN THE Sistema SHALL retornar HTTP 400 con mensaje de error descriptivo y código `MODELO_INVALIDO`.
6. THE ControladorAsistente SHALL leer el modo activo y los modelos desde la tabla `configuracion` en cada inicialización de sesión, usando los valores del `.env` como fallback si no existen registros en la tabla.
7. WHEN el modo activo leído desde la tabla `configuracion` es `'pipeline'`, THE ControladorAsistente SHALL establecer `PIPELINE_ENABLED=true` y usar `NVIDIA_CLASSIFIER_MODEL`, `NVIDIA_EMBEDDING_MODEL` y `NVIDIA_RERANKER_MODEL` desde la tabla.
8. WHEN el modo activo leído desde la tabla `configuracion` es `'nvidia'`, THE ControladorAsistente SHALL establecer `PIPELINE_ENABLED=false` y usar `NVIDIA_MODEL` desde la tabla para el fallback de `servicioLLM.js`.
9. WHEN el modo activo leído desde la tabla `configuracion` es `'gemini'`, THE ControladorAsistente SHALL establecer `PIPELINE_ENABLED=false` y usar `GEMINI_MODEL` desde la tabla como proveedor primario en `servicioLLM.js`.
10. THE AdminConfiguracion SHALL mostrar una sección "Asistente de IA" con un selector de modo activo que presente tres opciones: "Pipeline Multi-Agente NVIDIA", "Uni-modelo NVIDIA" y "Uni-modelo Gemini".
11. WHEN el Admin selecciona "Pipeline Multi-Agente NVIDIA", THE AdminConfiguracion SHALL mostrar tres campos de texto editables: modelo clasificador (`NVIDIA_CLASSIFIER_MODEL`), modelo de embeddings (`NVIDIA_EMBEDDING_MODEL`) y modelo reranker (`NVIDIA_RERANKER_MODEL`).
12. WHEN el Admin selecciona "Uni-modelo NVIDIA", THE AdminConfiguracion SHALL mostrar un campo de texto editable: modelo NVIDIA (`NVIDIA_MODEL`).
13. WHEN el Admin selecciona "Uni-modelo Gemini", THE AdminConfiguracion SHALL mostrar un campo de texto editable: modelo Gemini (`GEMINI_MODEL`).
14. WHEN la página AdminConfiguracion carga, THE AdminConfiguracion SHALL obtener el modo activo y los modelos actuales del endpoint `GET /api/configuracion/modelos-ia`, pre-rellenar todos los campos y seleccionar el modo correspondiente.
15. WHEN el Admin guarda la configuración, THE AdminConfiguracion SHALL mostrar un Toast de tipo `success` con el mensaje "Configuración del asistente guardada." que incluya el nombre del modo activo seleccionado.
16. IF el endpoint `PUT /api/configuracion/modelos-ia` retorna error, THEN THE AdminConfiguracion SHALL mostrar un Toast de tipo `error` con el mensaje de error retornado por el backend.
17. THE campos de modelo en AdminConfiguracion SHALL tener touch target mínimo de 44×44 px, `aria-label` descriptivo por campo y estados de error visibles con contraste WCAG AA.

---

### Requisito 3: Persistencia de la selección de componentes en el cotizador

**User Story:** Como usuario del cotizador, quiero que mi selección de componentes se mantenga al actualizar la página, para no perder el progreso de mi configuración por un recargo accidental.

#### Criterios de Aceptación

1. THE Frontend SHALL persistir la `Configuracion_Seleccionada` (componentes principales y extras) en `localStorage` bajo la clave `nsg_cotizador_seleccion` cada vez que el usuario modifique la selección.
2. WHEN el usuario carga o recarga la página `/cotizador`, THE Frontend SHALL leer `nsg_cotizador_seleccion` de `localStorage` y restaurar la `Configuracion_Seleccionada` en el contexto global antes del primer renderizado.
3. WHEN el usuario hace clic en "Limpiar configuración" o genera una cotización exitosamente, THE Frontend SHALL eliminar la clave `nsg_cotizador_seleccion` de `localStorage`.
4. IF el valor almacenado en `localStorage` no puede parsearse como JSON válido o tiene estructura inválida, THEN THE Frontend SHALL ignorar el valor corrupto, eliminar la clave y comenzar con una configuración vacía sin mostrar error al usuario.
5. THE persistencia SHALL incluir: componentes principales (`procesador`, `placa_madre`, `ram`, `almacenamiento`, `gpu`, `fuente`, `case`) y extras por categoría.
6. THE persistencia SHALL almacenar únicamente los IDs y tablas de los productos seleccionados, no los objetos completos, para minimizar el tamaño en `localStorage`.
7. WHEN se restaura la selección desde `localStorage`, THE Frontend SHALL verificar que cada producto almacenado aún existe en el catálogo antes de cargarlo; los productos que ya no existan SHALL ser ignorados silenciosamente.

---

### Requisito 4: Corrección del logo de empresa en el PDF comercial

**User Story:** Como Admin o Cliente, quiero que el logo de NSG aparezca correctamente en el PDF comercial generado, para que el documento tenga la identidad visual de la empresa.

#### Criterios de Aceptación

1. THE ServicioPDF SHALL buscar el logo de empresa en al menos tres rutas candidatas en orden de prioridad: `resources/logo vector-1.png` (relativo a la raíz del proyecto), `backend/assets/logo-nsg.png`, y `frontend/dist/favicon.png`.
2. WHEN ninguna de las rutas candidatas contiene un archivo de imagen válido, THE ServicioPDF SHALL generar el PDF sin logo y registrar `console.warn('[ServicioPDF] Logo no encontrado en ninguna ruta candidata')` sin interrumpir la generación del documento.
3. THE ServicioPDF SHALL verificar la existencia del archivo de logo usando `fs.existsSync` antes de intentar cargarlo, para evitar errores en tiempo de ejecución.
4. WHEN el logo es encontrado y cargado correctamente, THE PDF generado SHALL mostrar el logo en la cabecera del documento con las dimensiones definidas en los estilos (`width: 96, height: 56`).
5. THE corrección SHALL aplicar tanto al PDF comercial (`generarPDFCotizacion`) como al PDF técnico (`generarPDFListado`).

---

### Requisito 5: Corrección del botón "Generar PDF comercial" en cotización vencida

**User Story:** Como Admin o Cliente, quiero que al intentar generar el PDF de una cotización vencida se muestre una notificación de error en pantalla, para entender qué ocurrió sin que se abra una ventana con JSON de error.

#### Criterios de Aceptación

1. WHEN el usuario hace clic en el botón "Comercial" (PDF comercial) en el historial para una cotización vencida, THE Historial SHALL interceptar el error HTTP 410 retornado por el backend y mostrar un Toast de error con el mensaje "La cotización ha vencido y no puede descargarse en PDF." en lugar de abrir la URL en una nueva ventana.
2. THE función `descargarPDF` en `HistorialCliente.jsx` SHALL realizar la solicitud al endpoint de PDF de forma programática (fetch/axios) en lugar de abrir directamente la URL con `window.open`, para poder interceptar errores HTTP.
3. WHEN el endpoint de PDF retorna HTTP 410, THE Historial SHALL mostrar un Toast de tipo `error` con título "Cotización vencida" y descripción "Esta cotización superó su fecha de validez y no puede generarse en PDF."
4. WHEN el endpoint de PDF retorna cualquier otro error HTTP (500, 404, etc.), THE Historial SHALL mostrar un Toast de tipo `error` con un mensaje genérico de error.
5. WHEN el PDF se genera exitosamente (HTTP 200), THE Historial SHALL descargar el archivo directamente en el navegador usando un enlace `<a>` con `download` attribute, sin abrir una nueva ventana.
6. THE corrección SHALL aplicar únicamente al botón "Comercial"; el botón "Técnico" SHALL seguir el mismo patrón de descarga programática.

---

### Requisito 6: Mejora del diseño del reporte Excel de cotización

**User Story:** Como Admin o Cliente, quiero que el archivo Excel exportado tenga un diseño profesional con cabeceras destacadas, anchos de columna adecuados y formato de moneda, para que sea presentable al compartirlo con clientes o proveedores.

#### Criterios de Aceptación

1. THE ServicioExcel SHALL aplicar estilos de cabecera a la primera fila de cada hoja: fondo azul oscuro (`#0F172A`), texto blanco, fuente en negrita y tamaño 11pt.
2. THE ServicioExcel SHALL definir anchos de columna explícitos en la hoja "Componentes": nombre (40 caracteres), categoría (20), precio unitario (18), cantidad (10), subtotal (18).
3. THE ServicioExcel SHALL aplicar formato de número con dos decimales y símbolo de moneda a las columnas de precio unitario y subtotal en la hoja "Componentes".
4. THE ServicioExcel SHALL agregar una fila de totales al final de la hoja "Componentes" con el precio total de la cotización, con fondo gris claro (`#F1F5F9`) y texto en negrita.
5. THE ServicioExcel SHALL incluir en la hoja "Metadatos" el nombre de la empresa ("NSG Cotizador"), la fecha de generación del reporte y el estado de la cotización.
6. THE ServicioExcel SHALL aplicar bordes a todas las celdas de datos en ambas hojas para mejorar la legibilidad.
7. THE archivo Excel generado SHALL mantener compatibilidad con Microsoft Excel 2016+ y LibreOffice Calc.
8. FOR ALL cotizaciones con datos válidos, THE ServicioExcel SHALL generar un archivo que contenga todos los componentes de la cotización sin omitir ninguno (propiedad de completitud).

---

### Requisito 7: Estado "Vencida" en el historial de cotizaciones

**User Story:** Como Admin o Usuario, quiero que las cotizaciones vencidas aparezcan con el estado "Vencida" en el historial, para identificarlas claramente sin confundirme con términos técnicos internos.

#### Criterios de Aceptación

1. THE Historial SHALL mostrar el texto "Vencida" (en lugar de "Caducada") en la columna de estado para las cotizaciones cuyo estado retornado por el backend sea `'Caducada'`.
2. THE función `estadoToBadgeVariant` en `HistorialCliente.jsx` SHALL mapear el estado `'Caducada'` al variant `'danger'` del componente `Badge`, manteniendo el color rojo existente.
3. THE etiqueta "Vencida" SHALL aplicarse únicamente en la capa de presentación del frontend; el backend SHALL continuar usando el valor `'Caducada'` internamente.
4. THE filtro de estado en el historial SHALL incluir la opción "Vencida" (mapeada a `'Caducada'` al filtrar) para que el usuario pueda filtrar cotizaciones vencidas.
5. THE cambio SHALL aplicar tanto en la vista de historial del Admin como en la del Usuario autenticado.

---

### Requisito 8: Auto-validar ticket al navegar desde el historial

**User Story:** Como Admin, quiero que al hacer clic en "Validar" en el historial el ticket se valide automáticamente en la página `/validar`, para no tener que ingresar el código manualmente ni hacer clic en el botón de validar.

#### Criterios de Aceptación

1. WHEN el usuario navega a `/validar?ticket={codigoTicket}` con un parámetro `ticket` válido en la URL, THE Validador SHALL ejecutar automáticamente la validación del ticket sin requerir interacción adicional del usuario.
2. THE auto-validación SHALL ejecutarse en un `useEffect` que observe el parámetro `ticket` de `searchParams`, disparándose únicamente cuando el parámetro está presente y no vacío.
3. WHILE la auto-validación está en progreso, THE Validador SHALL mostrar el estado de carga (`LoadingSpinner`) con el mensaje "Validando cotización...".
4. IF la auto-validación retorna un error, THE Validador SHALL mostrar el estado de error con la descripción del problema y la opción de reintentar manualmente.
5. WHEN la auto-validación es exitosa, THE Validador SHALL mostrar el detalle completo de la cotización sin mostrar el toast de "Cotización encontrada" (para evitar ruido en la navegación automática).
6. THE campo de código de ticket SHALL pre-rellenarse con el valor del parámetro `ticket` de la URL antes de ejecutar la auto-validación, para que el usuario pueda ver qué ticket se está validando.

---

### Requisito 9: Funcionamiento del botón "Notificar equipo listo" en `/validar`

**User Story:** Como Admin, quiero que el botón "Notificar equipo listo" en la página de validación envíe un correo real al cliente notificando que su equipo está listo para recoger, para comunicarme con el cliente de forma efectiva desde el sistema.

#### Criterios de Aceptación

1. WHEN el Admin hace clic en "Notificar equipo listo" para una cotización con cliente registrado, THE Sistema SHALL enviar un correo electrónico real al correo del cliente usando `nodemailer` con la configuración SMTP del `.env`.
2. THE correo enviado SHALL incluir: asunto `"NSG - Tu equipo está listo para recoger (${codigoTicket})"`, nombre del cliente en el saludo, código de ticket, estado de la cotización, fecha de emisión y fecha de validez.
3. THE correo SHALL usar la misma plantilla HTML del `ServicioCorreo` existente (con logo embebido como `cid:nsg-logo`, tipografía del sistema y colores de la marca NSG).
4. IF el cliente de la cotización no tiene correo registrado o el correo no puede desencriptarse, THEN THE Sistema SHALL retornar HTTP 422 con mensaje de error `"El cliente no tiene correo registrado para notificar"` y código `CORREO_NO_DISPONIBLE`.
5. IF el envío de correo falla por error SMTP, THEN THE Sistema SHALL retornar HTTP 500 con mensaje de error descriptivo y registrar el error en consola con el prefijo `[ServicioNotificaciones]`.
6. WHEN el correo se envía exitosamente, THE Sistema SHALL retornar HTTP 200 con `{ exito: true, mensaje: "Correo enviado al cliente." }`.
7. WHEN el correo se envía exitosamente, THE Validador SHALL mostrar un Toast de tipo `success` con el mensaje "Correo enviado al cliente.".
8. IF el envío falla, THE Validador SHALL mostrar un Toast de tipo `error` con el mensaje del error retornado por el backend.
9. THE `ServicioNotificaciones` SHALL usar `nodemailer.createTransport` con la misma lógica de fallback DNS que `ServicioCorreo` para garantizar entrega en entornos con resolución DNS variable.

---

### Requisito 10: Filtros de ordenamiento por precio en el cotizador

**User Story:** Como usuario del cotizador, quiero ordenar los productos de cada paso por precio de mayor a menor o de menor a mayor, para encontrar rápidamente las opciones que se ajustan a mi presupuesto.

#### Criterios de Aceptación

1. THE Cotizador SHALL mostrar un control de ordenamiento por precio en la barra de filtros de cada paso de componentes (procesador, placa madre, RAM, almacenamiento, GPU, fuente, case).
2. THE control de ordenamiento SHALL ofrecer tres opciones: "Relevancia" (orden por defecto), "Menor precio" y "Mayor precio".
3. WHEN el usuario selecciona "Menor precio", THE Cotizador SHALL ordenar la lista de productos del paso actual de menor a mayor `precio_base`, manteniendo los demás filtros activos.
4. WHEN el usuario selecciona "Mayor precio", THE Cotizador SHALL ordenar la lista de productos del paso actual de mayor a menor `precio_base`, manteniendo los demás filtros activos.
5. WHEN el usuario selecciona "Relevancia", THE Cotizador SHALL restaurar el orden original de los productos (sin ordenamiento por precio).
6. THE ordenamiento por precio SHALL aplicarse después de todos los demás filtros activos (disponibilidad, marca, modelo, etc.), sin eliminar los productos filtrados.
7. FOR ALL listas de productos ordenadas por "Menor precio", cada producto SHALL tener `precio_base` menor o igual al del producto siguiente en la lista (propiedad de orden ascendente).
8. FOR ALL listas de productos ordenadas por "Mayor precio", cada producto SHALL tener `precio_base` mayor o igual al del producto siguiente en la lista (propiedad de orden descendente).
9. THE control de ordenamiento SHALL mantener su estado seleccionado al cambiar de paso y al aplicar otros filtros.
10. THE control de ordenamiento SHALL tener touch target mínimo de 44×44 px, `aria-label="Ordenar por precio"` y estados `hover`, `focus-visible` definidos con contraste WCAG AA.
11. THE control de ordenamiento SHALL también aplicarse a la sección de extras (periféricos, audio, etc.) cuando está desplegada.

---

### Requisito 11: Configuración de claves API de IA desde el panel administrativo

**User Story:** Como Admin, quiero configurar las claves API de Google Gemini y NVIDIA desde el panel de configuración, para no tener que editar el archivo `.env` del servidor cada vez que necesite rotar o cambiar una clave.

#### Contexto técnico

Las claves API se usan en 5 módulos del asistente como constantes de módulo leídas al arrancar el servidor:
- `servicioLLM.js` — `GEMINI_API_KEY` (Gemini) y `NVIDIA_API_KEY` (NVIDIA uni-modelo)
- `agenteClasificador.js` — `NVIDIA_API_KEY` (pipeline clasificador)
- `servicioEmbeddings.js` — `NVIDIA_API_KEY` (pipeline embeddings)
- `orquestadorAgentes.js` — `NVIDIA_API_KEY` (validación de disponibilidad)
- `inicializarCache.js` — `NVIDIA_API_KEY` (precarga de embeddings)

Las claves deben almacenarse **encriptadas con AES-256** en la tabla `configuracion` usando la misma `ENCRYPTION_KEY` del `.env`. El `.env` sigue siendo la fuente de verdad para `ENCRYPTION_KEY`, `JWT_SECRET` y credenciales de BD — solo las API keys de IA se mueven a la BD.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer el endpoint `GET /api/configuracion/api-keys-ia` protegido por `verificarTokenAdmin`, que retorna si cada clave está configurada en BD (`{ gemini_configurada: bool, nvidia_configurada: bool }`) **sin revelar el valor real de las claves**.
2. THE Sistema SHALL exponer el endpoint `PUT /api/configuracion/api-keys-ia` protegido por `verificarTokenAdmin`, que acepta `gemini_api_key` y/o `nvidia_api_key` en el body y los persiste encriptados con AES-256 en la tabla `configuracion`.
3. WHEN se invoca `PUT /api/configuracion/api-keys-ia`, THE Sistema SHALL encriptar cada clave recibida con `encriptarAES(valor)` antes de almacenarla en la tabla `configuracion` bajo las claves `ia_gemini_api_key_enc` e `ia_nvidia_api_key_enc`.
4. IF un campo de clave API recibido está vacío o contiene solo espacios en blanco, THEN THE Sistema SHALL retornar HTTP 400 con código `API_KEY_INVALIDA`.
5. THE `servicioConfigIA.obtenerConfigIA()` SHALL también retornar las API keys desencriptadas (`gemini_api_key`, `nvidia_api_key`), usando los valores del `.env` como fallback si no existen registros en BD.
6. WHEN `servicioLLM.js` recibe `configIA` con `gemini_api_key` definida, THE Sistema SHALL usar ese valor en lugar de `process.env.GEMINI_API_KEY` para inicializar el cliente de Gemini.
7. WHEN `agenteClasificador.js`, `servicioEmbeddings.js` y `orquestadorAgentes.js` reciben `configIA` con `nvidia_api_key` definida, THE Sistema SHALL usar ese valor en lugar de `process.env.NVIDIA_API_KEY` en los headers de autorización.
8. THE AdminConfiguracion SHALL mostrar en la sección "Asistente de IA" dos campos de tipo password para las claves API: "Clave API de Google Gemini" y "Clave API de NVIDIA".
9. THE campos de clave API SHALL mostrar un indicador visual ("✓ Configurada" en verde / "No configurada" en gris) basado en la respuesta del endpoint `GET /api/configuracion/api-keys-ia`, sin mostrar el valor real.
10. WHEN el Admin escribe en un campo de clave API, THE campo SHALL mostrar el valor como texto enmascarado (`type="password"`) con opción de revelar temporalmente (`type="text"`) mediante un botón de ojo.
11. WHEN el Admin guarda las claves, THE AdminConfiguracion SHALL mostrar un Toast de tipo `success` con "Claves API guardadas correctamente." o un Toast de tipo `error` con el mensaje del backend si falla.
12. THE Sistema SHALL nunca retornar el valor real de las claves API en ninguna respuesta de API, incluyendo el endpoint `GET /api/configuracion/modelos-ia`.
13. THE claves API almacenadas en BD SHALL ser desencriptadas en memoria solo en el momento de usarlas para llamadas a APIs externas, nunca almacenadas en variables de proceso globales.

---

## Restricciones Transversales

### Seguridad
1. THE Sistema SHALL validar y sanitizar todos los parámetros de entrada en los nuevos endpoints antes de ejecutar consultas a la base de datos.
2. THE Sistema SHALL usar consultas SQL parametrizadas en todos los nuevos endpoints; está prohibida la concatenación directa de valores de usuario en queries.
3. THE Sistema SHALL aplicar autenticación y autorización por rol en todos los endpoints nuevos que lo requieran.
4. THE Sistema SHALL retornar respuestas de error estandarizadas con códigos HTTP correctos y campo `codigo` en todos los nuevos endpoints.
5. THE endpoint `POST /api/auth/recuperar-por-telefono` SHALL nunca revelar si un número de teléfono está registrado o no (respuesta genérica anti-enumeración).

### Base de Datos
6. IF se requieren nuevas claves en la tabla `configuracion` para los modelos de IA, THE Sistema SHALL insertar los registros con `INSERT ... ON CONFLICT DO UPDATE` para garantizar idempotencia.
7. THE consultas de búsqueda por teléfono SHALL usar `telefono_hash` (HMAC-SHA256) para búsqueda determinística, nunca el valor encriptado directamente.

### UI/UX
8. THE Sistema SHALL implementar todos los nuevos componentes y cambios de UI con dark mode completo sin excepciones visuales.
9. THE Sistema SHALL garantizar touch targets mínimos de 44×44 px en todos los elementos interactivos nuevos o modificados.
10. THE Sistema SHALL implementar estados de carga, error, vacío y éxito en todos los nuevos flujos críticos.
11. THE Sistema SHALL respetar `prefers-reduced-motion` en todas las animaciones de los nuevos componentes.
12. THE control de visibilidad por rol SHALL implementarse siempre mediante renderizado condicional en React, no mediante CSS `display: none`.
