# Plan de Implementación: Features Avanzadas del Cotizador NSG

## Resumen

Implementación end-to-end de 11 features avanzadas para el Cotizador NSG (React + Tailwind + Node.js/Express + PostgreSQL). El orden sigue las dependencias naturales: migraciones de base de datos → backend (rutas, controladores, servicios) → frontend (páginas, componentes, hooks) → tests de propiedades e integración.

**Stack**: Node.js/Express + PostgreSQL (backend) · React + Tailwind + Vite (frontend)  
**Librerías nuevas**: `xlsx`, `qrcode` (backend) · `recharts` (frontend)  
**Testing**: `fast-check` + Jest + Supertest (backend) · Vitest + Testing Library (frontend)

---

## Tareas

- [ ] 1. Migraciones de base de datos
  - Crear los tres scripts de migración en `backend/scripts/` siguiendo el patrón de `migrar-finanzas-fase1.js` (BEGIN → DDL → COMMIT, rollback en error).
  - Cada script debe ser idempotente y verificable de forma independiente.
  - _Requisitos: 3.1, 3.2, 4.1, 5.1, Restricción BD 5, 6_

  - [ ] 1.1 Crear migración `migrar-features-avanzadas-01-historial-precios.js`
    - Crear tabla `historial_precios_producto` con campos: `id`, `id_producto`, `tabla_producto`, `precio_anterior`, `precio_nuevo`, `fecha_cambio` (TIMESTAMPTZ DEFAULT NOW()), `id_usuario_admin` (FK a `usuarios_admin` ON DELETE SET NULL).
    - Crear índice `idx_historial_precios_id_producto` en `(id_producto, tabla_producto)`.
    - Crear índice `idx_historial_precios_fecha` en `(fecha_cambio DESC)`.
    - _Requisitos: 3.1, 3.2_

  - [ ] 1.2 Crear migración `migrar-features-avanzadas-02-favoritos.js`
    - Crear tabla `productos_favoritos` con campos: `id`, `id_usuario` (FK a `usuarios_clientes` ON DELETE CASCADE), `id_producto`, `tabla_producto`, `fecha_agregado` (TIMESTAMPTZ DEFAULT NOW()).
    - Agregar constraint UNIQUE `uq_favorito_usuario_producto` en `(id_usuario, id_producto, tabla_producto)`.
    - Crear índice `idx_favoritos_usuario` en `(id_usuario)`.
    - _Requisitos: 4.1_

  - [ ] 1.3 Crear migración `migrar-features-avanzadas-03-notificaciones.js`
    - Crear tabla `notificaciones_usuario` con campos: `id`, `id_usuario` (FK a `usuarios_clientes` ON DELETE CASCADE), `tipo` (VARCHAR 50), `titulo` (VARCHAR 200), `mensaje` (TEXT), `leida` (BOOLEAN DEFAULT FALSE), `fecha_creacion` (TIMESTAMPTZ DEFAULT NOW()), `datos_extra` (JSONB nullable).
    - Crear índice parcial `idx_notificaciones_usuario_pendientes` en `(id_usuario, leida, fecha_creacion DESC) WHERE leida = FALSE`.
    - _Requisitos: 5.1_

- [ ] 2. Instalar dependencias nuevas
  - Instalar `xlsx` y `qrcode` en backend. Instalar `recharts` en frontend.
  - Verificar que el build no se rompa tras la instalación.
  - _Requisitos: 2.2, 9.1_

  - [ ] 2.1 Instalar dependencias de backend
    - Ejecutar `npm install xlsx qrcode` en `backend/`.
    - Verificar que `package.json` registre las versiones exactas instaladas.
    - _Requisitos: 2.2, 9.1_

  - [ ] 2.2 Instalar dependencias de frontend
    - Ejecutar `npm install recharts` en `frontend/`.
    - Verificar que el build de Vite no produzca errores tras la instalación.
    - _Requisitos: 1.8_

- [ ] 3. Checkpoint — Migraciones y dependencias
  - Ejecutar los tres scripts de migración contra la base de datos de desarrollo.
  - Verificar que las tres tablas existen con sus índices y constraints.
  - Verificar que `npm run build` pasa en backend y frontend sin errores.
  - Preguntar al usuario si hay dudas antes de continuar.

- [ ] 4. Feature 1 — Dashboard de métricas rápidas (backend)
  - Crear `backend/src/controladores/controladorDashboard.js` y `backend/src/rutas/dashboard.js`.
  - Registrar la ruta en `backend/src/app.js` (o el archivo de entrada de rutas).
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 4.1 Implementar `controladorDashboard.obtenerMetricas`
    - Escribir la consulta SQL con CTEs: `cotizaciones_hoy`, `cotizaciones_semana`, `productos_top` (ver diseño).
    - Usar `ejecutarQuery` con consulta parametrizada.
    - Retornar `{ exito: true, hoy: {...}, semana: {...}, productosTop: [...] }`.
    - _Requisitos: 1.2, 1.3, 1.4_

  - [ ] 4.2 Crear ruta `GET /api/dashboard/metricas` con middleware `verificarTokenAdmin`
    - Crear `backend/src/rutas/dashboard.js` con la ruta protegida.
    - Registrar en el archivo principal de rutas.
    - Retornar HTTP 401/403 con mensaje estandarizado si el token es inválido o el rol no es admin.
    - _Requisitos: 1.1, 1.5_

  - [ ]* 4.3 Escribir tests de propiedades para métricas del dashboard
    - Crear `backend/src/__tests__/propiedades/dashboard.property.test.js`.
    - **Property 1: Conteo de cotizaciones por período es exacto** — Validates: Requisito 1.2
    - **Property 2: Ranking de productos más cotizados es correcto** — Validates: Requisito 1.3
    - **Property 3: Ingreso estimado es la suma correcta de cotizaciones activas** — Validates: Requisito 1.4
    - Usar mocks de `ejecutarQuery`; mínimo 100 iteraciones con `fc.assert`.
    - _Requisitos: 1.2, 1.3, 1.4_

  - [ ]* 4.4 Escribir test de integración para el endpoint de dashboard
    - Crear `backend/src/__tests__/integracion/dashboard.test.js`.
    - Cubrir: autenticación requerida (401), rol no-admin (403), respuesta exitosa con estructura correcta.
    - _Requisitos: 1.1, 1.5_

- [ ] 5. Feature 1 — Dashboard de métricas rápidas (frontend)
  - Crear `frontend/src/paginas/Dashboard.jsx` y registrar la ruta `/admin/dashboard` en `App.jsx` con `RutaProtegida`.
  - Agregar `obtenerMetricasDashboard` en `frontend/src/servicios/api.js`.
  - _Requisitos: 1.6, 1.7, 1.8, 1.9, 1.10, 1.11_

  - [ ] 5.1 Agregar `obtenerMetricasDashboard` en `api.js`
    - Implementar la función que llama a `GET /api/dashboard/metricas` y retorna los datos.
    - _Requisitos: 1.7_

  - [ ] 5.2 Implementar página `Dashboard.jsx`
    - Renderizar 4 stat cards: total cotizaciones hoy, total cotizaciones semana, ingresos estimados hoy, ingresos estimados semana.
    - Renderizar gráfico de barras con Recharts mostrando los 5 productos más cotizados.
    - Implementar estado de carga con `aria-busy="true"` mientras los datos se obtienen.
    - Implementar estado de error con botón de reintento.
    - Aplicar dark mode completo y contraste WCAG AA en todos los elementos.
    - _Requisitos: 1.7, 1.8, 1.9, 1.10, 1.11_

  - [ ] 5.3 Registrar ruta `/admin/dashboard` en `App.jsx`
    - Envolver con `RutaProtegida` (solo admin).
    - _Requisitos: 1.6_

- [ ] 6. Feature 2 — Exportar cotizaciones a Excel
  - Crear `backend/src/servicios/servicioExcel.js`, extender `backend/src/rutas/cotizaciones.js` y agregar botón en `HistorialCliente`.
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [ ] 6.1 Implementar `servicioExcel.generarExcelCotizacion(cotizacion)`
    - Crear `backend/src/servicios/servicioExcel.js` usando la librería `xlsx`.
    - Hoja 1 "Metadatos": código ticket, fecha de emisión, fecha de validez, precio total.
    - Hoja 2 "Componentes": columnas nombre, categoría, precio unitario, cantidad.
    - Retornar un `Buffer` con el archivo `.xlsx`.
    - _Requisitos: 2.2_

  - [ ] 6.2 Implementar controlador `exportarExcel` y ruta `GET /api/cotizaciones/:codigoTicket/excel`
    - Validar formato del ticket con regex `NSG-\d{4}-\d{4}`; retornar HTTP 400 si inválido.
    - Consultar la cotización; retornar HTTP 404 si no existe.
    - Llamar a `servicioExcel.generarExcelCotizacion` y responder con `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` y `Content-Disposition: attachment; filename="cotizacion-{codigoTicket}.xlsx"`.
    - Proteger con `verificarTokenUsuario`.
    - _Requisitos: 2.1, 2.3, 2.4, 2.5_

  - [ ]* 6.3 Escribir tests de propiedades para generación de Excel
    - Crear `backend/src/__tests__/propiedades/excel.property.test.js`.
    - **Property 4: Excel generado contiene todos los datos de la cotización** — Validates: Requisito 2.2
    - **Property 5: Formato inválido de ticket siempre retorna HTTP 400** — Validates: Requisito 2.5
    - _Requisitos: 2.2, 2.5_

  - [ ] 6.4 Agregar `exportarExcelCotizacion` en `api.js` y botón en `HistorialCliente`
    - Implementar `exportarExcelCotizacion(codigoTicket)` con `responseType: 'blob'` para descarga directa.
    - Agregar botón "Exportar Excel" en cada fila de la tabla de historial con `aria-label="Exportar Excel de cotización {codigoTicket}"` y touch target mínimo 44×44 px.
    - _Requisitos: 2.6, 2.7, 2.8, 2.9_

- [ ] 7. Feature 3 — Historial de cambios de precios
  - Modificar `controladorProductos.actualizarProducto` para registrar historial en transacción. Crear endpoint de consulta y actualizar `AdminProductos`.
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ] 7.1 Modificar `actualizarProducto` para insertar en `historial_precios_producto`
    - Dentro de `ejecutarTransaccion`, detectar si `precio_base` cambió.
    - Si cambió, insertar en `historial_precios_producto` con `precio_anterior`, `precio_nuevo`, `tabla_producto`, `id_usuario_admin` (del token).
    - La inserción debe ocurrir en la misma transacción que la actualización del producto.
    - _Requisitos: 3.3_

  - [ ] 7.2 Implementar endpoint `GET /api/productos/:id/historial-precios`
    - Crear controlador que consulte `historial_precios_producto` filtrado por `id_producto` y `tabla_producto`, ordenado por `fecha_cambio DESC`.
    - Retornar HTTP 404 si el producto no existe.
    - Proteger con `verificarTokenAdmin`.
    - _Requisitos: 3.4, 3.5, 3.6_

  - [ ]* 7.3 Escribir tests de propiedades para historial de precios
    - Crear `backend/src/__tests__/propiedades/historialPrecios.property.test.js`.
    - **Property 6: Actualizar precio siempre crea registro en historial** — Validates: Requisito 3.3
    - **Property 7: Historial de precios está ordenado descendentemente** — Validates: Requisito 3.5
    - _Requisitos: 3.3, 3.5_

  - [ ] 7.4 Actualizar `AdminProductos` para mostrar precio anterior tachado e indicador de historial
    - Agregar `obtenerHistorialPrecios(idProducto)` en `api.js`.
    - Mostrar precio anterior tachado junto al precio actual cuando existe al menos un registro en historial.
    - Mostrar ícono o badge indicador cuando el producto tiene historial disponible.
    - Garantizar contraste WCAG AA del precio tachado en dark mode y light mode.
    - _Requisitos: 3.7, 3.8, 3.9_

- [ ] 8. Checkpoint — Features 1, 2 y 3
  - Verificar que los tres endpoints nuevos responden correctamente con Postman o curl.
  - Verificar que el botón de Excel descarga un archivo válido.
  - Verificar que actualizar el precio de un producto crea un registro en `historial_precios_producto`.
  - Asegurarse de que todos los tests pasen. Preguntar al usuario si hay dudas antes de continuar.

- [ ] 9. Feature 4 — Favoritos de productos (backend)
  - Crear `backend/src/rutas/favoritos.js` con los tres endpoints y su controlador.
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ] 9.1 Implementar `controladorFavoritos` con los tres métodos
    - `obtenerFavoritos`: SELECT con JOIN a la tabla de producto correspondiente usando `id_producto` y `tabla_producto`; filtrar por `id_usuario` del token.
    - `agregarFavorito`: INSERT en `productos_favoritos`; manejar violación de constraint único retornando HTTP 409 con código `FAVORITO_DUPLICADO`.
    - `eliminarFavorito`: DELETE verificando que el favorito pertenece al usuario autenticado; retornar HTTP 404 con código `FAVORITO_NO_ENCONTRADO` si no existe.
    - _Requisitos: 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ] 9.2 Crear rutas `GET/POST /api/productos/favoritos` y `DELETE /api/productos/favoritos/:idProducto`
    - Proteger todas las rutas con `verificarTokenUsuario`.
    - Registrar en el archivo principal de rutas.
    - _Requisitos: 4.2_

  - [ ]* 9.3 Escribir test de propiedad para round-trip de favoritos
    - Crear `backend/src/__tests__/propiedades/favoritos.property.test.js`.
    - **Property 8: Round-trip de favoritos (agregar → consultar → eliminar)** — Validates: Requisitos 4.3, 4.4, 4.6
    - _Requisitos: 4.3, 4.4, 4.6_

- [ ] 10. Feature 4 — Favoritos de productos (frontend)
  - Agregar funciones en `api.js`, botón de favorito en `SelectorComponente`, y crear página `/perfil`.
  - _Requisitos: 4.8, 4.9, 4.10, 4.11, 4.12, 4.13_

  - [ ] 10.1 Agregar funciones de favoritos en `api.js`
    - Implementar `obtenerFavoritos`, `agregarFavorito(idProducto)` y `eliminarFavorito(idProducto)`.
    - _Requisitos: 4.3, 4.4, 4.6_

  - [ ] 10.2 Agregar botón de favorito (❤️) en `SelectorComponente`
    - Mostrar el botón solo para usuarios autenticados.
    - Implementar optimistic update: alternar estado visual inmediatamente antes de confirmar con el servidor.
    - `aria-label` dinámico: "Agregar a favoritos: {nombre}" / "Quitar de favoritos: {nombre}".
    - Touch target mínimo 44×44 px.
    - _Requisitos: 4.8, 4.9, 4.10_

  - [ ] 10.3 Crear página `Perfil.jsx` en `frontend/src/paginas/`
    - Mostrar lista de productos favoritos del usuario con opción de quitar cada uno.
    - Mostrar estado vacío con CTA al cotizador si no hay favoritos.
    - Registrar ruta `/perfil` en `App.jsx` con `RutaProtegidaUsuario`.
    - Aplicar dark mode completo y contraste WCAG AA.
    - _Requisitos: 4.11, 4.12, 4.13_

- [ ] 11. Feature 5 — Notificaciones en tiempo real (backend)
  - Crear `backend/src/rutas/notificaciones.js` con los dos endpoints y su controlador.
  - Modificar `crearCotizacion` para insertar notificación en la misma transacción.
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 11.1 Implementar `controladorNotificaciones`
    - `obtenerPendientes`: SELECT de `notificaciones_usuario` donde `id_usuario = $1 AND leida = false ORDER BY fecha_creacion DESC`.
    - `marcarLeida`: UPDATE `leida = true` donde `id = $1 AND id_usuario = $2`; retornar HTTP 404 con código `NOTIFICACION_NO_ENCONTRADA` si no existe o pertenece a otro usuario.
    - _Requisitos: 5.2, 5.5_

  - [ ] 11.2 Crear rutas `GET /api/notificaciones/pendientes` y `PATCH /api/notificaciones/:id/leer`
    - Proteger ambas rutas con `verificarTokenUsuario`.
    - Registrar en el archivo principal de rutas.
    - _Requisitos: 5.2, 5.5_

  - [ ] 11.3 Modificar `crearCotizacion` para insertar notificación `cotizacion_creada`
    - Dentro de la transacción existente de `crearCotizacion`, si el usuario está autenticado (rol `usuario`), insertar en `notificaciones_usuario` con `tipo = 'cotizacion_creada'`, `titulo`, `mensaje` y `datos_extra = { codigoTicket }`.
    - _Requisitos: 5.3_

  - [ ]* 11.4 Escribir test de propiedad para notificaciones al crear cotización
    - Crear `backend/src/__tests__/propiedades/notificaciones.property.test.js`.
    - **Property 9: Crear cotización siempre genera notificación para usuario autenticado** — Validates: Requisito 5.3
    - _Requisitos: 5.3_

- [ ] 12. Feature 5 — Notificaciones en tiempo real (frontend)
  - Crear hook `usePollingNotificaciones` y componente `NotificacionToast`.
  - _Requisitos: 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12_

  - [ ] 12.1 Agregar funciones de notificaciones en `api.js`
    - Implementar `obtenerNotificacionesPendientes()` y `marcarNotificacionLeida(idNotificacion)`.
    - _Requisitos: 5.2, 5.5_

  - [ ] 12.2 Crear hook `usePollingNotificaciones` en `frontend/src/hooks/`
    - Consultar `GET /api/notificaciones/pendientes` cada 30 segundos usando `setInterval`.
    - Iniciar el polling automáticamente cuando el usuario está autenticado.
    - Detener el polling al desmontar el componente o al cerrar sesión (cleanup en `useEffect`).
    - En caso de error del endpoint, registrar en consola y continuar el ciclo sin interrumpir la UI.
    - _Requisitos: 5.6, 5.7, 5.12_

  - [ ] 12.3 Crear componente `NotificacionToast` en `frontend/src/componentes/feedback/`
    - Mostrar título y mensaje de la notificación.
    - Animación de entrada y salida respetando `prefers-reduced-motion`.
    - Botón de cierre con `aria-label="Cerrar notificación"`.
    - Auto-desaparecer después de 5 segundos si el usuario no interactúa.
    - _Requisitos: 5.8, 5.9, 5.10, 5.11_

  - [ ] 12.4 Integrar `usePollingNotificaciones` y `NotificacionToast` en el layout principal
    - Renderizar un `NotificacionToast` por cada notificación nueva recibida por el hook.
    - Marcar la notificación como leída al cerrar el toast.
    - _Requisitos: 5.8_

- [ ] 13. Checkpoint — Features 4 y 5
  - Verificar que los endpoints de favoritos y notificaciones responden correctamente.
  - Verificar que crear una cotización como usuario autenticado genera una notificación en la BD.
  - Verificar que el polling se inicia y detiene correctamente en el navegador.
  - Asegurarse de que todos los tests pasen. Preguntar al usuario si hay dudas antes de continuar.

- [ ] 14. Feature 6 — Panel de comparación de productos
  - Crear hook `useComparador`, componente `PanelComparador` y agregar botón "Comparar" en el selector.
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

  - [ ] 14.1 Crear hook `useComparador` en `frontend/src/hooks/`
    - Gestionar lista de hasta 3 productos para comparar (estado local o en contexto).
    - Exponer métodos: `agregarAComparador(producto)`, `quitarDeComparador(idProducto)`, `limpiarComparador()`.
    - Si se intenta agregar un cuarto producto, retornar un flag de error con mensaje informativo.
    - _Requisitos: 6.3, 6.4_

  - [ ] 14.2 Agregar botón "Comparar" en tarjetas de producto del selector
    - Mostrar botón "Comparar" en cada tarjeta dentro del selector de componentes.
    - `aria-label="Comparar {nombre del producto}"`.
    - Al hacer clic, llamar a `agregarAComparador`; mostrar mensaje si se alcanza el límite de 3.
    - _Requisitos: 6.2, 6.3, 6.4, 6.10_

  - [ ] 14.3 Implementar componente `PanelComparador` en `frontend/src/componentes/cotizador/`
    - Mostrar especificaciones técnicas de los productos en columnas paralelas, agrupadas por categoría (nombre, precio, socket, RAM type, form factor, wattage, etc.).
    - Resaltar visualmente las diferencias entre productos en cada fila.
    - Mostrar el panel solo cuando hay al menos 2 productos en la lista de comparación.
    - Incluir botón de cierre accesible por producto con `aria-label="Quitar {nombre} de la comparación"`.
    - Navegación por teclado entre columnas con teclas de flecha.
    - Dark mode completo y contraste WCAG AA.
    - _Requisitos: 6.1, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [ ] 14.4 Integrar `PanelComparador` en `Cotizador.jsx`
    - Renderizar el panel debajo o al lado del selector de componentes cuando hay productos en comparación.
    - _Requisitos: 6.5_

- [ ] 15. Feature 7 — Validación visual de compatibilidad (Diagrama SVG)
  - Crear componente `DiagramaCompatibilidad` e integrarlo en `Cotizador.jsx`.
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [ ] 15.1 Implementar componente `DiagramaCompatibilidad` en `frontend/src/componentes/cotizador/`
    - Renderizar un SVG con nodos para: CPU, Motherboard, RAM, GPU y Fuente de poder.
    - Mostrar nodos de componentes seleccionados con el nombre del producto; nodos no seleccionados en estado deshabilitado (color neutro, opacidad reducida).
    - Dibujar líneas de conexión: CPU↔Motherboard, Motherboard↔RAM, Motherboard↔GPU, Fuente↔todos.
    - Colorear líneas en verde (`#34C759`) cuando los componentes conectados son compatibles.
    - Colorear líneas en rojo (`#FF453A`) y mostrar ícono de advertencia cuando hay incompatibilidad detectada.
    - Agregar `role="img"` y `aria-label` descriptivo del estado de compatibilidad global.
    - Respetar `prefers-reduced-motion` desactivando animaciones de transición.
    - Diseño responsivo que se adapte a pantallas móviles.
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [ ] 15.2 Integrar `DiagramaCompatibilidad` en `Cotizador.jsx`
    - Mostrar el diagrama cuando hay al menos un componente seleccionado.
    - Pasar la lista de componentes seleccionados y las incompatibilidades detectadas como props.
    - _Requisitos: 7.2_

- [ ] 16. Feature 8 — Búsqueda por compatibilidad (IA Concierge)
  - Extender el endpoint `GET /api/productos/buscar` con parámetros de compatibilidad.
  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ] 16.1 Extender `GET /api/productos/buscar` con filtros de compatibilidad
    - Agregar parámetros opcionales de query: `procesador`, `ram_tipo`, `socket`.
    - Aplicar filtros con AND lógico cuando se proporcionan múltiples parámetros.
    - Validar y sanitizar todos los parámetros antes de ejecutar la consulta; retornar HTTP 400 con código `PARAMETROS_INVALIDOS` si alguno es inválido.
    - Retornar lista vacía con mensaje descriptivo si no hay productos compatibles.
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.7, 8.8_

  - [ ]* 16.2 Escribir tests de propiedades para búsqueda por compatibilidad
    - Crear `backend/src/__tests__/propiedades/busqueda.property.test.js`.
    - **Property 10: Filtro de búsqueda por socket retorna solo productos compatibles** — Validates: Requisito 8.2
    - **Property 11: Filtros múltiples aplican AND lógico** — Validates: Requisitos 8.3, 8.4
    - _Requisitos: 8.2, 8.3, 8.4_

  - [ ] 16.3 Actualizar `AsistenteIA` para usar filtros de compatibilidad
    - Agregar `buscarProductosCompatibles(filtros)` en `api.js`.
    - Cuando el asistente recibe una consulta de compatibilidad, llamar al endpoint con los filtros correspondientes e incluir los productos encontrados con sus especificaciones en la respuesta.
    - _Requisitos: 8.5, 8.6_

- [ ] 17. Feature 9 — Código QR en PDF de cotización
  - Extender `ServicioPDF` para generar e insertar el QR en el documento.
  - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ] 17.1 Extender `ServicioPDF` para generar e insertar código QR
    - En `construirDocumentoCotizacion()`, generar el QR con `qrcode.toDataURL()` codificando `{BASE_URL}/validar?ticket={codigoTicket}`.
    - Insertar el QR en el PDF en la sección de metadatos o pie de página con tamaño mínimo 80×80 puntos.
    - Si `qrcode.toDataURL()` lanza excepción, generar el PDF sin QR y registrar `console.error('[ServicioPDF] Error al generar QR:', error)`.
    - Verificar que el flujo existente de descarga desde `HistorialCliente` y `ValidadorCotizaciones` no se rompa.
    - _Requisitos: 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 17.2 Escribir test de propiedad para QR en PDF
    - Crear `backend/src/__tests__/propiedades/qr.property.test.js`.
    - **Property 12: QR codifica la URL de validación correcta** — Validates: Requisito 9.2
    - _Requisitos: 9.2_

- [ ] 18. Checkpoint — Features 6, 7, 8 y 9
  - Verificar que el comparador funciona con 2 y 3 productos y bloquea el cuarto.
  - Verificar que el diagrama SVG muestra colores correctos según compatibilidad.
  - Verificar que la búsqueda con filtros retorna solo productos compatibles.
  - Verificar que el PDF generado incluye el QR y que el QR decodifica la URL correcta.
  - Asegurarse de que todos los tests pasen. Preguntar al usuario si hay dudas antes de continuar.

- [ ] 19. Feature 10 — Exportar configuraciones guardadas (URL codificada)
  - Implementar lógica de codificación/decodificación en frontend y crear página `/configuracion`.
  - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

  - [ ] 19.1 Implementar funciones puras `generarUrlConfiguracion` y `decodificarConfiguracion` en `api.js`
    - `generarUrlConfiguracion(configuracion)`: serializar el objeto de configuración (IDs de productos por categoría) a JSON, codificar en base64 y construir la URL `/configuracion?config={base64}`.
    - `decodificarConfiguracion(base64)`: decodificar base64, parsear JSON y retornar el objeto de configuración; lanzar error si el string es inválido.
    - Garantizar que la función es determinista: la misma entrada siempre produce la misma URL.
    - _Requisitos: 10.2, 10.8_

  - [ ]* 19.2 Escribir tests de propiedades para configuración compartida
    - Crear `backend/src/__tests__/propiedades/configuracionCompartida.property.test.js` (o en frontend si la lógica es puramente de frontend).
    - **Property 13: Round-trip de configuración compartida (codificar → decodificar)** — Validates: Requisitos 10.2, 10.5, 10.8
    - **Property 14: URL de configuración es determinista** — Validates: Requisito 10.8
    - _Requisitos: 10.2, 10.5, 10.8_

  - [ ] 19.3 Agregar botón "Generar link para compartir" en `Cotizador.jsx`
    - Mostrar el botón solo cuando hay al menos un componente seleccionado.
    - Al hacer clic: generar la URL, copiarla al portapapeles con `navigator.clipboard.writeText`, mostrar toast de confirmación.
    - `aria-label="Generar link para compartir configuración"`, touch target mínimo 44×44 px.
    - _Requisitos: 10.1, 10.2, 10.3, 10.9_

  - [ ] 19.4 Crear página `ConfiguracionCompartida.jsx` y ruta `/configuracion`
    - Leer el parámetro `config` de la query string al montar el componente.
    - Decodificar con `decodificarConfiguracion`; si falla, mostrar mensaje de error descriptivo y redirigir al cotizador vacío.
    - Cargar los productos correspondientes en el cotizador; si algún producto no existe, cargar los disponibles y mostrar toast informativo con los nombres de los no encontrados.
    - Registrar ruta `/configuracion` en `App.jsx` (accesible sin autenticación).
    - _Requisitos: 10.4, 10.5, 10.6, 10.7_

- [ ] 20. Feature 11 — Validación de presupuesto
  - Crear componente `AnalizadorPresupuesto` e integrarlo en `Cotizador.jsx`.
  - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

  - [ ] 20.1 Implementar componente `AnalizadorPresupuesto` en `frontend/src/componentes/cotizador/`
    - Campo de entrada numérico para el presupuesto máximo; aceptar valores positivos en la moneda activa (USD o PEN).
    - Comparar en tiempo real el presupuesto ingresado con el precio total de la configuración actual.
    - Mostrar monto de exceso en color `#FF453A` con mensaje descriptivo cuando `precio_total > presupuesto`.
    - Mostrar mensaje de confirmación en color `#34C759` cuando `precio_total <= presupuesto`.
    - Mostrar recomendaciones de ahorro (componentes ordenados por `precio_base` descendente) cuando hay exceso.
    - Mostrar mensaje de validación bajo el campo si el valor es no numérico o negativo.
    - Dark mode completo y contraste WCAG AA en todos los estados.
    - Accesible por teclado; anunciar cambios de estado con `aria-live="polite"`.
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5, 11.7, 11.8, 11.9, 11.10_

  - [ ]* 20.2 Escribir tests de propiedades para análisis de presupuesto
    - Crear `frontend/src/__tests__/presupuesto.property.test.js` (o en backend si la lógica se extrae a función pura).
    - **Property 15: Análisis de presupuesto es correcto para cualquier par (presupuesto, precio_total)** — Validates: Requisitos 11.2, 11.3, 11.4
    - **Property 16: Recomendaciones de ahorro están ordenadas por costo descendente** — Validates: Requisito 11.5
    - _Requisitos: 11.2, 11.3, 11.4, 11.5_

  - [ ] 20.3 Integrar `AnalizadorPresupuesto` en `Cotizador.jsx`
    - Renderizar el componente en el panel lateral o sección de resumen del cotizador.
    - Actualizar el análisis automáticamente cada vez que el usuario modifique la configuración de componentes.
    - _Requisitos: 11.6_

- [ ] 21. Tests de componentes frontend
  - Crear los archivos de test para los nuevos componentes y hooks en `frontend/src/__tests__/`.
  - _Requisitos: Restricción UI/UX 7-10_

  - [ ]* 21.1 Escribir tests para `AnalizadorPresupuesto`
    - Crear `frontend/src/__tests__/AnalizadorPresupuesto.test.jsx`.
    - Cubrir: lógica de comparación, estado de exceso, estado dentro de presupuesto, estado de error por valor inválido, accesibilidad `aria-live`.
    - _Requisitos: 11.2, 11.3, 11.4, 11.8, 11.10_

  - [ ]* 21.2 Escribir tests para `PanelComparador`
    - Crear `frontend/src/__tests__/PanelComparador.test.jsx`.
    - Cubrir: límite de 3 productos, resaltado de diferencias, botón de cierre, navegación por teclado.
    - _Requisitos: 6.3, 6.4, 6.6, 6.7, 6.8_

  - [ ]* 21.3 Escribir tests para `DiagramaCompatibilidad`
    - Crear `frontend/src/__tests__/DiagramaCompatibilidad.test.jsx`.
    - Cubrir: renderizado de nodos, colores de líneas según compatibilidad, atributos ARIA.
    - _Requisitos: 7.4, 7.5, 7.7_

  - [ ]* 21.4 Escribir tests para `NotificacionToast`
    - Crear `frontend/src/__tests__/NotificacionToast.test.jsx`.
    - Cubrir: renderizado de título y mensaje, botón de cierre, auto-desaparición a los 5 segundos.
    - _Requisitos: 5.9, 5.10, 5.11_

  - [ ]* 21.5 Escribir tests para `usePollingNotificaciones`
    - Crear `frontend/src/__tests__/usePollingNotificaciones.test.js`.
    - Cubrir: inicio del polling al montar, parada al desmontar, manejo silencioso de errores.
    - _Requisitos: 5.7, 5.12_

  - [ ]* 21.6 Escribir tests para `ConfiguracionCompartida` (round-trip base64)
    - Crear `frontend/src/__tests__/configuracionCompartida.test.js`.
    - Cubrir: decodificación correcta, manejo de base64 inválido, carga parcial con productos faltantes.
    - _Requisitos: 10.5, 10.6, 10.7_

- [ ] 22. Checkpoint final — Integración completa
  - Ejecutar la suite completa de tests de backend (`npm test` en `backend/`).
  - Ejecutar la suite completa de tests de frontend (`npm run test -- --run` en `frontend/`).
  - Verificar que el build de producción de frontend no produce errores (`npm run build`).
  - Verificar que todas las rutas nuevas están registradas y accesibles.
  - Verificar dark mode completo en todos los componentes nuevos.
  - Verificar accesibilidad básica: focus visible, aria-labels, touch targets en elementos interactivos nuevos.
  - Asegurarse de que todos los tests pasen. Preguntar al usuario si hay dudas antes de cerrar.

---

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia los requisitos específicos para trazabilidad completa.
- El orden de las tareas respeta las dependencias: migraciones BD → backend → frontend → tests.
- Los tests de propiedades usan mocks de `ejecutarQuery`/`ejecutarTransaccion` para mantener velocidad y determinismo (100+ iteraciones sin I/O real).
- Los tests de integración con Supertest usan la base de datos de test (`NODE_ENV=test`, `.env.test`).
- Las funciones puras de frontend (`generarUrlConfiguracion`, `decodificarConfiguracion`, lógica de presupuesto) deben extraerse a módulos separados para facilitar los tests de propiedades.
- Todos los componentes nuevos deben respetar los tokens de diseño globales definidos en `.claude/apple-design-context.md`.
