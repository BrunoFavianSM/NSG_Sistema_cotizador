# Plan de Implementación: Mejoras del Sistema Cotizador

## Resumen

Implementación end-to-end de 10 mejoras y correcciones para el Cotizador NSG. El orden sigue las dependencias naturales: seed de BD → backend (servicios, controladores, rutas) → frontend (páginas, componentes, hooks) → tests.

**Stack**: Node.js/Express + PostgreSQL (backend) · React + Tailwind + Vite (frontend)
**Testing**: `fast-check` + Jest + Supertest (backend) · Vitest + Testing Library (frontend)

---

## Tareas

- [ ] 1. Seed de configuración IA en base de datos
  - Insertar las 6 claves `ia_*` en la tabla `configuracion` existente usando `INSERT ... ON CONFLICT DO NOTHING`.
  - Este seed es prerequisito para el Req. 2 (configuración IA).
  - _Requisitos: 2.3, Restricción BD 6_

  - [ ] 1.1 Crear script `backend/scripts/seed-config-ia.js`
    - Insertar claves: `ia_modo_activo`, `ia_gemini_model`, `ia_nvidia_model`, `ia_nvidia_classifier_model`, `ia_nvidia_embedding_model`, `ia_nvidia_reranker_model`.
    - Usar valores del `.env` como valores iniciales.
    - Usar `INSERT INTO configuracion (clave, valor) VALUES (...) ON CONFLICT (clave) DO NOTHING`.
    - Verificar que las 6 claves existen tras la ejecución.
    - _Requisitos: 2.3_

- [ ] 2. Req. 1 — Recuperación de cuenta por teléfono (backend)
  - Implementar el endpoint `POST /api/auth/recuperar-por-telefono` con respuesta genérica anti-enumeración.
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 2.1 Implementar `servicioAuth.recuperarPorTelefono(telefono)`
    - Validar formato de teléfono con `/^\d{7,15}$/` → retornar `{ exito: false, status: 400, codigo: 'TELEFONO_INVALIDO' }` si inválido.
    - Calcular `telefono_hash = HMAC-SHA256(telefono, ENCRYPTION_KEY)`.
    - Buscar en `cuentas` por `telefono_hash`.
    - Si existe: generar token hex de 32 bytes, guardar en `token_recuperacion` y `token_recuperacion_expira = NOW() + INTERVAL '5 minutes'`, desencriptar correo y llamar a `ServicioCorreo.enviarEnlaceRecuperacion`.
    - Siempre retornar respuesta genérica (anti-enumeración).
    - _Requisitos: 1.1, 1.2, 1.3, 1.4_

  - [ ] 2.2 Agregar endpoint `POST /api/auth/recuperar-por-telefono` en `backend/src/rutas/auth.js`
    - Reutilizar `limitadorRecuperacion` existente (rate limit 3 req/15min por IP).
    - Llamar a `servicioAuth.recuperarPorTelefono(req.body.telefono)`.
    - Retornar HTTP 400 si `TELEFONO_INVALIDO`, HTTP 429 si rate limit, HTTP 200 con mensaje genérico en todos los demás casos.
    - _Requisitos: 1.1, 1.5_

  - [ ]* 2.3 Escribir tests de propiedades para recuperación por teléfono
    - Crear `backend/src/__tests__/propiedades/recuperacionTelefono.property.test.js`.
    - **Property 1: Recuperación por teléfono nunca revela existencia de cuenta** — Para cualquier teléfono (registrado o no), la respuesta HTTP debe ser 200 con el mismo mensaje genérico. Validates: Requisito 1.3.
    - **Property 2: Token de recuperación expira en exactamente 5 minutos** — Para cualquier cuenta con token generado, `token_recuperacion_expira` debe ser `NOW() + 5min` con tolerancia ±1s. Validates: Requisito 1.2.
    - Usar mocks de `ejecutarQuery`; mínimo 100 iteraciones con `fc.assert`.
    - _Requisitos: 1.2, 1.3_

- [ ] 3. Req. 1 — Recuperación por teléfono (frontend)
  - Agregar pestaña "Número de teléfono" en la página de recuperación de contraseña.
  - _Requisitos: 1.6, 1.7, 1.8_

  - [ ] 3.1 Modificar `frontend/src/paginas/RecuperarContrasena.jsx`
    - Agregar estado `metodo` con valores `'correo'` | `'telefono'`.
    - Renderizar selector de método (dos pestañas o botones toggle) con touch target mínimo 44px.
    - Cuando `metodo === 'telefono'`: mostrar campo `<input type="tel" autoComplete="tel" aria-label="Número de teléfono" />`.
    - Al enviar formulario de teléfono: llamar a `POST /api/auth/recuperar-por-telefono`.
    - Mostrar el mismo mensaje de confirmación genérico independientemente del resultado.
    - Aplicar dark mode completo y accesibilidad WCAG AA.
    - _Requisitos: 1.6, 1.7, 1.8_

- [ ] 4. Req. 2 — Configuración de modo y modelos de IA (backend)
  - Crear `servicioConfigIA.js` y los endpoints `GET/PUT /api/configuracion/modelos-ia`.
  - Integrar lectura dinámica en el asistente para que los cambios surtan efecto sin reiniciar el servidor.
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [ ] 4.1 Crear `backend/src/asistente/servicioConfigIA.js`
    - Definir constante `CLAVES` con las 6 claves `ia_*`.
    - Definir `DEFAULTS` leyendo del `.env` como fallback.
    - Implementar `obtenerConfigIA()`: SELECT de las 6 claves desde `configuracion`, mapear a objeto con `pipeline_enabled` derivado de `modo_activo`.
    - En caso de error de BD: retornar `DEFAULTS` con `console.warn`.
    - Exportar `{ obtenerConfigIA, CLAVES }`.
    - _Requisitos: 2.6_

  - [ ] 4.2 Implementar `obtenerModelosIA` y `actualizarModelosIA` en `controladorConfiguracion.js`
    - `obtenerModelosIA`: SELECT de las 6 claves `ia_*` desde `configuracion`, retornar objeto con fallback a `.env`.
    - `actualizarModelosIA`: validar `modo_activo ∈ ['pipeline', 'nvidia', 'gemini']` → 400 `MODO_INVALIDO`; validar modelos requeridos por modo no vacíos → 400 `MODELO_INVALIDO`; `INSERT ... ON CONFLICT DO UPDATE` para cada clave; retornar config guardada.
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 4.3 Agregar rutas `GET/PUT /api/configuracion/modelos-ia` en `backend/src/rutas/configuracion.js`
    - Proteger ambas rutas con `verificarTokenAdmin`.
    - _Requisitos: 2.1, 2.2_

  - [ ] 4.4 Integrar `servicioConfigIA` en `controladorAsistente.js`
    - Reemplazar la constante de módulo `PIPELINE_ENABLED` por llamada a `servicioConfigIA.obtenerConfigIA()` al inicio de `procesarMensaje`.
    - Pasar `configIA` como parámetro a `orquestadorAgentes.ejecutarPipeline` y a `servicioLLM.generarRespuesta`.
    - _Requisitos: 2.6, 2.7, 2.8, 2.9_

  - [ ] 4.5 Actualizar `servicioLLM.js` para recibir modelos como parámetros
    - Agregar parámetro `configIA` a `generarRespuesta({ ..., configIA })`.
    - Usar `configIA?.gemini_model || GEMINI_MODEL` y `configIA?.nvidia_model || NVIDIA_MODEL` en `llamarGemini` y `llamarNVIDIA`.
    - Mantener las constantes de módulo como fallback (no eliminarlas).
    - _Requisitos: 2.8, 2.9_

  - [ ] 4.6 Actualizar `orquestadorAgentes.js` para recibir `configIA`
    - Agregar parámetro `configIA` a `ejecutarPipeline`.
    - Usar `configIA?.pipeline_enabled ?? ENABLED` para el flag del pipeline.
    - Pasar `configIA?.nvidia_classifier_model` a `agenteClasificador.clasificar`.
    - _Requisitos: 2.7_

  - [ ] 4.7 Actualizar `agenteClasificador.js` para recibir modelo como parámetro
    - Agregar parámetro `modelo` a la función `clasificar(mensaje, historial, modelo)`.
    - Usar `modelo || NVIDIA_CLASSIFIER_MODEL` (fallback a constante de módulo).
    - _Requisitos: 2.7_

  - [ ]* 4.8 Escribir tests de propiedades para configuración IA
    - Crear `backend/src/__tests__/propiedades/configIA.property.test.js`.
    - **Property 3: Modo IA leído desde BD siempre tiene fallback al .env** — Para cualquier estado de la tabla (vacía, claves faltantes, error de BD), `obtenerConfigIA()` retorna objeto completo con todos los campos no nulos. Validates: Requisito 2.6.
    - **Property 4: Validación de modo activo rechaza valores no permitidos** — Para cualquier string que no sea `'pipeline'`, `'nvidia'` o `'gemini'`, el endpoint retorna HTTP 400 con código `MODO_INVALIDO`. Validates: Requisito 2.4.
    - Usar mocks de `ejecutarQuery`; mínimo 100 iteraciones.
    - _Requisitos: 2.4, 2.6_


- [ ] 5. Req. 2 — Configuración de modo y modelos de IA (frontend)
  - Agregar sección "Asistente de IA" en `AdminConfiguracion.jsx` con selector de modo y campos condicionales.
  - _Requisitos: 2.10, 2.11, 2.12, 2.13, 2.14, 2.15, 2.16, 2.17_

  - [ ] 5.1 Modificar `frontend/src/paginas/AdminConfiguracion.jsx`
    - Agregar estado `modoIA` (`'pipeline'` | `'nvidia'` | `'gemini'`) y estado `modelos` con los 5 campos de modelo.
    - Al cargar la página: llamar a `GET /api/configuracion/modelos-ia` y pre-rellenar estado.
    - Renderizar selector de modo (segmented control o radio group) con touch target mínimo 44px.
    - Renderizar campos condicionales según modo: pipeline → 3 campos NVIDIA; nvidia → 1 campo NVIDIA model; gemini → 1 campo Gemini model.
    - Al guardar: llamar a `PUT /api/configuracion/modelos-ia`; mostrar toast `success` con modo activo o toast `error` con mensaje del backend.
    - Cada campo debe tener `aria-label` descriptivo y estado de error visible con contraste WCAG AA.
    - Aplicar dark mode completo.
    - _Requisitos: 2.10, 2.11, 2.12, 2.13, 2.14, 2.15, 2.16, 2.17_

- [ ] 6. Req. 3 — Persistencia de selección de componentes
  - Crear hook `usePersistenciaSeleccion.js` e integrarlo en `Cotizador.jsx`.
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 6.1 Crear `frontend/src/hooks/usePersistenciaSeleccion.js`
    - Definir clave `'nsg_cotizador_seleccion'`.
    - `useEffect` de restauración: leer `localStorage`, parsear JSON, validar estructura, filtrar productos inexistentes en catálogo, llamar a `setSeleccion`. En caso de JSON corrupto: `localStorage.removeItem` silencioso.
    - `useEffect` de persistencia: cuando `seleccion` cambia, extraer solo IDs y tablas (`extraerIDs`), guardar en `localStorage`.
    - Exportar `limpiarPersistencia` (callback que llama a `localStorage.removeItem`).
    - _Requisitos: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7_

  - [ ] 6.2 Integrar `usePersistenciaSeleccion` en `frontend/src/paginas/Cotizador.jsx`
    - Importar y llamar al hook pasando `seleccion`, `setSeleccion` y `todosLosProductos`.
    - Llamar a `limpiarPersistencia()` al generar cotización exitosamente.
    - Llamar a `limpiarPersistencia()` al hacer clic en "Limpiar configuración".
    - _Requisitos: 3.3_

  - [ ]* 6.3 Escribir tests para persistencia de selección
    - Crear `frontend/src/__tests__/usePersistenciaSeleccion.test.js`.
    - **Property 5: Persistencia round-trip de selección** — Para cualquier selección con IDs válidos, serializar y deserializar produce selección equivalente. Validates: Requisito 3.1, 3.2.
    - Test: JSON corrupto en localStorage → selección vacía sin error.
    - Test: `limpiarPersistencia` → localStorage vacío.
    - _Requisitos: 3.1, 3.2, 3.4_

- [ ] 7. Req. 4 — Corrección del logo en PDF comercial
  - Modificar `servicioPDF.js` para buscar el logo en múltiples rutas candidatas.
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 7.1 Modificar `backend/src/servicios/servicioPDF.js`
    - Agregar función `resolverRutaLogo()` que itera sobre las 3 rutas candidatas usando `fs.existsSync`.
    - Rutas en orden: `resources/logo vector-1.png` (raíz del proyecto), `backend/assets/logo-nsg.png`, `frontend/dist/favicon.png`.
    - Si ninguna existe: retornar `null` y registrar `console.warn('[ServicioPDF] Logo no encontrado en ninguna ruta candidata')`.
    - Usar `resolverRutaLogo()` en `generarPDFCotizacion` y `generarPDFListado`; si retorna `null`, generar PDF sin logo sin lanzar error.
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 8. Req. 5 — Corrección del botón PDF en cotización vencida
  - Cambiar la descarga de PDF de `window.open` a fetch programático para interceptar errores HTTP.
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 8.1 Modificar función de descarga PDF en `frontend/src/paginas/HistorialCliente.jsx`
    - Reemplazar `window.open(url)` por función `descargarPDF(codigoTicket, tipo)` que usa `fetch` con header `Authorization`.
    - Si respuesta HTTP 410: mostrar toast `error` con título "Cotización vencida" y descripción "Esta cotización superó su fecha de validez y no puede generarse en PDF."
    - Si otro error HTTP: mostrar toast `error` con mensaje genérico.
    - Si HTTP 200: crear blob, generar URL con `URL.createObjectURL`, disparar descarga con `<a download>`, limpiar con `URL.revokeObjectURL`.
    - Aplicar el mismo patrón al botón "Técnico".
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 9. Req. 6 — Mejora del diseño del reporte Excel
  - Actualizar `servicioExcel.js` con estilos profesionales.
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ] 9.1 Modificar `backend/src/servicios/servicioExcel.js`
    - Aplicar estilo de cabecera a primera fila: fondo `#0F172A`, texto blanco, negrita, 11pt.
    - Definir anchos de columna en hoja "Componentes": nombre (40), categoría (20), precio unitario (18), cantidad (10), subtotal (18).
    - Aplicar formato de número `'"$"#,##0.00'` a columnas de precio unitario y subtotal.
    - Agregar fila de totales al final con fondo `#F1F5F9`, texto en negrita.
    - Agregar hoja "Metadatos" con empresa, fecha de generación y estado de cotización.
    - Aplicar bordes a todas las celdas de datos en ambas hojas.
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_


- [ ] 10. Req. 7 — Estado "Vencida" en historial de cotizaciones
  - Cambio puntual en la capa de presentación del historial.
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 10.1 Modificar `frontend/src/paginas/HistorialCliente.jsx`
    - Agregar mapa `ESTADO_LABELS` con `'Caducada': 'Vencida'` (y los demás estados sin cambio).
    - Agregar mapa `ESTADO_VARIANTS` con `'Caducada': 'danger'`.
    - Usar `ESTADO_LABELS[cotizacion.estado]` en la columna de estado del historial.
    - Agregar opción "Vencida" (value `'Caducada'`) en el selector de filtro de estado.
    - Verificar que el cambio aplica tanto en la vista de Admin como en la de Usuario.
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 11. Req. 8 — Auto-validación de ticket desde historial
  - Pasar el código de ticket por URL y auto-ejecutar la validación en `/validar`.
  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ] 11.1 Modificar botón "Validar" en `frontend/src/paginas/HistorialCliente.jsx`
    - Cambiar el botón/enlace "Validar" para navegar a `/validar?ticket=${cotizacion.codigo_ticket}` usando `<Link>` de React Router.
    - _Requisitos: 8.1_

  - [ ] 11.2 Modificar `frontend/src/paginas/ValidadorCotizaciones.jsx`
    - Importar `useSearchParams` de `react-router-dom`.
    - Agregar `useEffect` que observe `searchParams.get('ticket')`: si está presente y no vacío, pre-rellenar el campo `codigoTicket` y llamar a `validarTicket(ticketParam, { silencioso: true })`.
    - En `validarTicket` con `opciones.silencioso = true`: no mostrar toast de "Cotización encontrada".
    - Mientras auto-validación en progreso: mostrar `LoadingSpinner` con texto "Validando cotización...".
    - Si auto-validación retorna error: mostrar estado de error con descripción y botón "Reintentar".
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 12. Req. 9 — Notificar equipo listo (backend)
  - Implementar el envío real de correo en el endpoint `POST /api/cotizaciones/:ticket/notificar-listo`.
  - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.9_

  - [ ] 12.1 Agregar función `notificarEquipoListo` en `backend/src/servicios/servicioNotificaciones.js`
    - Desencriptar `cliente_correo_encrypted` con AES; si falla → lanzar `{ status: 422, codigo: 'CORREO_NO_DISPONIBLE' }`.
    - Construir plantilla HTML con: nombre del cliente, código de ticket, estado, fecha de emisión, fecha de validez. Reutilizar estructura de `ServicioCorreo` (logo como `cid:nsg-logo`).
    - Crear transporter con `nodemailer.createTransport` usando la misma lógica de fallback DNS que `ServicioCorreo`.
    - Enviar correo con asunto `"NSG - Tu equipo está listo para recoger (${codigoTicket})"`.
    - En error SMTP: registrar `console.error('[ServicioNotificaciones] Error SMTP:', error)` y relanzar.
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 9.9_

  - [ ] 12.2 Implementar `notificarCotizacionLista` en `controladorCotizaciones.js`
    - Buscar cotización con datos del cliente (JOIN con `cuentas`).
    - Si no existe: HTTP 404.
    - Llamar a `servicioNotificaciones.notificarEquipoListo(cotizacion)`.
    - Si error 422: retornar HTTP 422 con `{ error, codigo, mensaje }`.
    - Si error SMTP: retornar HTTP 500 con mensaje descriptivo.
    - Si éxito: retornar HTTP 200 con `{ exito: true, mensaje: 'Correo enviado al cliente.' }`.
    - _Requisitos: 9.4, 9.5, 9.6_

- [ ] 13. Req. 9 — Notificar equipo listo (frontend)
  - Conectar el botón "Notificar equipo listo" en `/validar` con el endpoint real.
  - _Requisitos: 9.7, 9.8_

  - [ ] 13.1 Modificar `frontend/src/paginas/ValidadorCotizaciones.jsx`
    - Implementar función `notificarEquipoListo()` que llama a `POST /api/cotizaciones/:ticket/notificar-listo`.
    - Si éxito: mostrar toast `success` con "Correo enviado al cliente."
    - Si error: mostrar toast `error` con el mensaje retornado por el backend.
    - Conectar la función al botón "Notificar equipo listo" existente.
    - _Requisitos: 9.7, 9.8_

- [ ] 14. Req. 10 — Filtros de ordenamiento por precio en el cotizador
  - Agregar control de ordenamiento por precio en la barra de filtros del cotizador.
  - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.9, 10.10, 10.11_

  - [ ] 14.1 Implementar función `ordenarProductos` en `frontend/src/paginas/Cotizador.jsx`
    - Función pura: `ordenarProductos(productos, orden)` donde `orden ∈ ['relevancia', 'menor', 'mayor']`.
    - `'relevancia'`: retornar lista sin modificar.
    - `'menor'`: `[...productos].sort((a, b) => a.precio_base - b.precio_base)`.
    - `'mayor'`: `[...productos].sort((a, b) => b.precio_base - a.precio_base)`.
    - Aplicar después de todos los filtros activos (no reemplazar filtros existentes).
    - _Requisitos: 10.3, 10.4, 10.5, 10.6_

  - [ ] 14.2 Agregar estado y control de UI en `frontend/src/paginas/Cotizador.jsx`
    - Agregar estado `ordenPrecio` inicializado en `'relevancia'`.
    - Renderizar control de ordenamiento (grupo de botones con `aria-pressed`) en la barra de filtros de cada paso de componentes y en la sección de extras.
    - Opciones: "Relevancia", "Menor precio", "Mayor precio".
    - Touch target mínimo 44px, `aria-label="Ordenar por precio"`, estados `hover` y `focus-visible` con contraste WCAG AA.
    - El estado `ordenPrecio` se mantiene al cambiar de paso y al aplicar otros filtros.
    - Aplicar dark mode completo.
    - _Requisitos: 10.1, 10.2, 10.9, 10.10, 10.11_

  - [ ]* 14.3 Escribir tests de propiedades para ordenamiento de precio
    - Crear `frontend/src/__tests__/ordenamientoPrecio.test.js`.
    - **Property 6: Ordenamiento ascendente correcto** — Para cualquier lista de N productos con precios arbitrarios, `ordenarProductos(lista, 'menor')` produce lista donde cada elemento tiene `precio_base` ≤ al siguiente. Validates: Requisito 10.7.
    - **Property 7: Ordenamiento descendente correcto** — Para cualquier lista, `ordenarProductos(lista, 'mayor')` produce lista donde cada elemento tiene `precio_base` ≥ al siguiente. Validates: Requisito 10.8.
    - **Property 8: Ordenamiento no elimina productos** — Para cualquier lista de N productos y cualquier modo, la lista resultante tiene exactamente N elementos. Validates: Requisito 10.6.
    - Usar `fast-check` con mínimo 100 iteraciones.
    - _Requisitos: 10.6, 10.7, 10.8_

- [ ] 15. Checkpoint final — Verificación end-to-end
  - Verificar que todos los cambios funcionan de punta a punta sin romper flujos existentes.
  - _Requisitos: Todos_

  - [ ] 15.1 Verificar build de backend y frontend
    - Ejecutar `npm run build` (o equivalente) en backend y frontend.
    - Confirmar que no hay errores de compilación ni imports rotos.
    - _Requisitos: Restricciones transversales_

  - [ ] 15.2 Ejecutar tests existentes para detectar regresiones
    - Ejecutar suite de tests existente en backend (`npm test`).
    - Confirmar que los tests que pasaban antes siguen pasando.
    - Reportar cualquier regresión detectada.
    - _Requisitos: Restricciones transversales_

  - [ ]* 15.3 Ejecutar tests de propiedades nuevos
    - Ejecutar `recuperacionTelefono.property.test.js`, `configIA.property.test.js`, `ordenamientoPrecio.test.js`, `usePersistenciaSeleccion.test.js`.
    - Confirmar que todas las properties pasan con mínimo 100 iteraciones.
    - _Requisitos: Properties 1-8_

- [ ] 16. Req. 11 — Configuración de claves API de IA desde panel admin
  - Almacenar `GEMINI_API_KEY` y `NVIDIA_API_KEY` encriptadas en BD para no depender del `.env`.
  - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11, 11.12, 11.13_

  - [ ] 16.1 Extender `servicioConfigIA.js` para leer y desencriptar API keys desde BD
    - Agregar claves `ia_gemini_api_key_enc` e `ia_nvidia_api_key_enc` al objeto `CLAVES`.
    - En `obtenerConfigIA()`: leer ambas claves encriptadas, desencriptar con `desencriptarAES`, retornar como `gemini_api_key` y `nvidia_api_key`.
    - Usar `process.env.GEMINI_API_KEY` y `process.env.NVIDIA_API_KEY` como fallback si no hay registros en BD.
    - Las claves desencriptadas solo existen en el objeto retornado, nunca en variables globales.
    - _Requisitos: 11.5, 11.13_

  - [ ] 16.2 Implementar `obtenerApiKeysIA` y `actualizarApiKeysIA` en `controladorConfiguracion.js`
    - `obtenerApiKeysIA`: SELECT de las 2 claves `ia_*_api_key_enc`; retornar `{ gemini_configurada: bool, nvidia_configurada: bool }` sin revelar valores.
    - `actualizarApiKeysIA`: validar que al menos una clave viene en el body; encriptar con `encriptarAES`; `INSERT ... ON CONFLICT DO UPDATE` para cada clave presente; retornar `{ exito: true }`.
    - Si campo vacío o solo espacios: HTTP 400 con código `API_KEY_INVALIDA`.
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.12_

  - [ ] 16.3 Agregar rutas `GET/PUT /api/configuracion/api-keys-ia` en `configuracion.js`
    - Proteger ambas rutas con `verificarTokenAdmin`.
    - _Requisitos: 11.1, 11.2_

  - [ ] 16.4 Propagar `nvidia_api_key` de `configIA` a `agenteClasificador.js`
    - Modificar `clasificar(mensaje, historial, configIA)` para aceptar `configIA` como tercer parámetro.
    - Usar `configIA?.nvidia_api_key || NVIDIA_API_KEY` en el header `Authorization` de la llamada fetch.
    - _Requisitos: 11.7_

  - [ ] 16.5 Propagar `nvidia_api_key` de `configIA` a `servicioEmbeddings.js`
    - Modificar `generarEmbedding(textos, tipo, apiKey)` para aceptar `apiKey` como tercer parámetro.
    - Usar `apiKey || NVIDIA_API_KEY` en el header `Authorization`.
    - Actualizar las llamadas desde `agenteBuscador.js` y `orquestadorAgentes.js` para pasar la key.
    - _Requisitos: 11.7_

  - [ ] 16.6 Actualizar `servicioLLM.js` para usar API keys de `configIA`
    - En `llamarGemini`: usar `configIA?.gemini_api_key || GEMINI_API_KEY` para inicializar `new GoogleGenerativeAI(key)`.
    - En `llamarNVIDIA`: usar `configIA?.nvidia_api_key || NVIDIA_API_KEY` en el header `Authorization`.
    - _Requisitos: 11.6_

  - [ ] 16.7 Agregar campos de clave API en `AdminConfiguracion.jsx`
    - Al cargar: llamar a `GET /api/configuracion/api-keys-ia` y actualizar indicadores de estado.
    - Renderizar dos campos `type="password"` con botón toggle de visibilidad (ojo) para Gemini y NVIDIA.
    - Mostrar indicador "✓ Configurada" (verde) o "No configurada" (gris) según respuesta del GET.
    - Al guardar: llamar a `PUT /api/configuracion/api-keys-ia` solo con los campos que el Admin haya llenado.
    - Toast `success` con "Claves API guardadas correctamente." o toast `error` con mensaje del backend.
    - Touch target mínimo 44px en todos los controles, dark mode completo, `aria-label` en cada campo.
    - _Requisitos: 11.8, 11.9, 11.10, 11.11_
