# Plan de Implementación — Mejoras UX, Roles y Notificaciones

## Visión general

Implementación incremental de 6 mejoras sobre el Cotizador NSG, organizadas en tres capas:
1. **UX del cotizador** — ModalDiagrama, corrección switch/botones, BalanceFinal
2. **Control de acceso por rol** — Panel cotización lista, historial propio
3. **Sistema de notificaciones** — Badge en navbar + PanelNotificaciones

Cada tarea construye sobre la anterior. Los tests de propiedades se ubican junto a la implementación para detectar errores temprano.

---

## Tareas

- [ ] 1. Crear `ModalDiagrama.jsx` e integrar botón de expansión en `DiagramaCompatibilidad.jsx`
  - [ ] 1.1 Crear `frontend/src/componentes/cotizador/ModalDiagrama.jsx`
    - Implementar overlay de pantalla completa con `role="dialog"`, `aria-modal="true"`, `aria-label="Diagrama de compatibilidad ampliado"`
    - Renderizar `DiagramaCompatibilidad` ampliado ocupando ≥ 90 % del viewport
    - Botón de cierre con `aria-label="Cerrar diagrama"` y touch target 44×44 px
    - Gestión de foco: recibir foco al abrir, devolver foco al botón de expansión al cerrar
    - Cerrar con tecla Escape (listener en `keydown`)
    - Fondo `backdrop-blur-md` translúcido oscuro, `border-radius` 18 px, sombra nivel 2
    - Respetar `prefers-reduced-motion` desactivando animaciones de entrada/salida
    - Dark mode completo
    - _Requisitos: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_
  - [ ] 1.2 Modificar `frontend/src/componentes/cotizador/DiagramaCompatibilidad.jsx`
    - Agregar estado `modalAbierto` (useState)
    - Agregar botón de expansión en esquina superior derecha con ícono SVG inline de "expand", touch target 44×44 px
    - Reemplazar íconos de estado (compatible/incompatible) por SVG inline propios del proyecto, eliminando dependencias externas
    - Pasar `onCerrar` y ref del botón de expansión a `ModalDiagrama`
    - _Requisitos: 1.1, 1.10_
  - [ ]* 1.3 Escribir tests de componente para `ModalDiagrama`
    - Verificar apertura, cierre con Escape, devolución de foco, atributos ARIA
    - Archivo: `frontend/src/__tests__/ModalDiagrama.test.jsx`
    - _Requisitos: 1.4, 1.5, 1.6, 1.7_

- [ ] 2. Corregir switch "Disponibles/Todos" y reubicar botones "Anterior"/"Siguiente" en `Cotizador.jsx`
  - [ ] 2.1 Corregir posicionamiento del `Switch_Disponibilidad` en `Cotizador.jsx`
    - Mover el switch al interior del contenedor del `Paso_Actual`, centrado horizontalmente
    - Asegurar `role="switch"`, `aria-checked` con valor booleano, `aria-label="Filtrar por disponibilidad"`
    - Contraste WCAG AA en estado activo/inactivo en dark y light mode
    - _Requisitos: 2.4, 2.5, 2.6_
  - [ ] 2.2 Corregir lógica de filtrado del switch en `Cotizador.jsx`
    - Estado "Disponibles": mostrar solo productos con `stock > 0` o `disponible_a_pedido === true`
    - Estado "Todos": mostrar todos los productos sin filtro
    - _Requisitos: 2.1, 2.2, 2.3_
  - [ ]* 2.3 Escribir property test para filtro de disponibilidad
    - **Property 1: Filtro de disponibilidad es correcto**
    - **Valida: Requisitos 2.1, 2.2, 2.3**
    - Archivo: `frontend/src/__tests__/propiedades/filtroDisponibilidad.property.test.js`
    - Usar `fc.array(fc.record({ stock: fc.integer(), disponible_a_pedido: fc.boolean() }))` con 100 iteraciones
  - [ ] 2.4 Reubicar botones "Anterior" y "Siguiente" en `Cotizador.jsx`
    - Mover los botones a la parte superior del área de contenido del `Paso_Actual`, antes de la lista de productos
    - Botón "Anterior" deshabilitado cuando `pasoActual === 0`
    - Botón "Siguiente" deshabilitado cuando `pasoActual === PASOS.length - 1`
    - Touch target 44×44 px; estados `hover`, `active`, `focus-visible`, `disabled` definidos
    - _Requisitos: 2.7, 2.8, 2.9, 2.10_
  - [ ]* 2.5 Escribir property test para botones de navegación
    - **Property 2: Botones de navegación respetan los límites del paso**
    - **Valida: Requisitos 2.8, 2.9**
    - Archivo: `frontend/src/__tests__/propiedades/botonesNavegacion.property.test.js`
    - Usar `fc.integer({ min: 0, max: PASOS.length - 1 })` con 100 iteraciones

- [ ] 3. Checkpoint — Verificar que el cotizador funciona correctamente
  - Asegurar que todos los tests pasan, que el switch filtra correctamente y los botones están en posición correcta. Consultar al usuario si hay dudas.

- [ ] 4. Crear `BalanceFinal.jsx` e integrarlo en `Cotizador.jsx`
  - [ ] 4.1 Crear `frontend/src/componentes/cotizador/BalanceFinal.jsx`
    - Calcular costo neto total: suma de `precio_base × cantidad` de todos los productos seleccionados (principales + extras)
    - Calcular precio de venta total: `costoNeto × (1 + margenGanancia / 100)` usando `margenGanancia` de `AppContext`
    - Calcular porcentaje de ganancia: `((precioVenta - costoNeto) / costoNeto) × 100` redondeado a 2 decimales
    - Mostrar: costo neto total, precio de venta total (sin IGV), monto de ganancia, porcentaje de ganancia
    - Porcentaje > 0: color `#34C759`; porcentaje === 0: color `var(--color-text-muted)`
    - `aria-live="polite"` para anunciar cambios a tecnologías asistivas
    - Dark mode completo, contraste WCAG AA
    - _Requisitos: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10_
  - [ ] 4.2 Integrar `BalanceFinal` en `Cotizador.jsx`
    - Renderizar `{esAdmin && <BalanceFinal ... />}` en el paso de resumen/generación
    - Pasar los productos seleccionados y extras como props; el componente se actualiza automáticamente al cambiar la configuración
    - _Requisitos: 3.1, 3.8_
  - [ ]* 4.3 Escribir property tests para `BalanceFinal`
    - **Property 3: Cálculo del balance financiero es matemáticamente correcto**
    - **Property 4: Color del porcentaje de ganancia refleja el valor**
    - **Valida: Requisitos 3.2, 3.3, 3.4, 3.6, 3.7**
    - Archivo: `frontend/src/__tests__/propiedades/balanceFinal.property.test.js`
    - Usar `fc.array(fc.record({ precio_base: fc.float({ min: 0 }), cantidad: fc.integer({ min: 1 }) }))` y `fc.integer({ min: 0, max: 100 })` con 100 iteraciones
  - [ ]* 4.4 Escribir tests de componente para `BalanceFinal`
    - Verificar renderizado de todos los campos, colores según porcentaje, `aria-live`
    - Archivo: `frontend/src/__tests__/BalanceFinal.test.jsx`
    - _Requisitos: 3.5, 3.6, 3.7, 3.10_

- [ ] 5. Aplicar control de visibilidad por rol en `SuccessState` de `Cotizador.jsx`
  - [ ] 5.1 Modificar el panel `SuccessState` en `Cotizador.jsx`
    - Envolver los botones "Ver historial" y "Validar ticket" con `{esAdmin && ...}` (renderizado condicional, no CSS)
    - Obtener `esAdmin` exclusivamente de `AppContext`
    - Mantener visibles para todos los roles: código de ticket y botón de descarga de PDF
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ]* 5.2 Escribir property tests para el panel de cotización lista
    - **Property 5: Botones administrativos del panel lista son invisibles para usuarios no-admin**
    - **Property 6: Código ticket y botón PDF son visibles para todos los usuarios**
    - **Valida: Requisitos 4.1, 4.2, 4.3, 4.4**
    - Archivo: `frontend/src/__tests__/propiedades/panelCotizacionLista.property.test.js`
    - Usar `fc.record({ esAdmin: fc.boolean() })` con 100 iteraciones; mockear `AppContext`

- [ ] 6. Checkpoint — Verificar UX del cotizador completa
  - Asegurar que todos los tests pasan y que el balance, el modal y el panel lista funcionan correctamente. Consultar al usuario si hay dudas.

- [ ] 7. Crear endpoint `GET /api/cotizaciones/propias` y adaptar `HistorialCliente.jsx`
  - [ ] 7.1 Implementar `obtenerPropias` en `backend/src/controladores/controladorCotizaciones.js`
    - Consulta SQL parametrizada usando `req.usuario.id` (del token JWT); no aceptar parámetros de usuario en query string ni body
    - Retornar misma estructura que `GET /api/cotizaciones/cliente/:email`: `{ exito: true, cliente: { nombre, email }, cotizaciones: [...] }`
    - Incluir campos: `id`, `codigo_ticket`, `fecha_emision`, `fecha_validez`, `precio_total`, `margen_aplicado`, `estado`, campos financieros, datos de notificación
    - Manejo de error estándar: 401 `NO_AUTORIZADO` si sin token
    - _Requisitos: 5.1, 5.8, 5.9_
  - [ ] 7.2 Registrar ruta `GET /api/cotizaciones/propias` en `backend/src/rutas/cotizaciones.js`
    - Proteger con middleware `verificarTokenUsuario`
    - Registrar antes de rutas con parámetros para evitar conflictos de matching
    - _Requisitos: 5.1_
  - [ ] 7.3 Agregar función `obtenerCotizacionesPropias` en `frontend/src/servicios/api.js`
    - `export const obtenerCotizacionesPropias = async () => { ... }`
    - Llamar a `GET /api/cotizaciones/propias` con token de autenticación
    - _Requisitos: 5.2_
  - [ ] 7.4 Agregar índice SQL recomendado si no existe
    - Crear migración o script: `CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_todas ON notificaciones_usuario (id_usuario, fecha_creacion DESC);`
    - Archivo: `backend/scripts/migraciones/add-idx-notificaciones-usuario-todas.sql`
    - _Requisitos: Restricción transversal 6 (BD)_
  - [ ] 7.5 Modificar `frontend/src/paginas/HistorialCliente.jsx`
    - Para `esUsuario === true`: cargar automáticamente con `obtenerCotizacionesPropias()` al montar, sin requerir ingreso de email
    - Para `esUsuario === true`: ocultar campo de búsqueda por email del DOM (renderizado condicional)
    - Para `esUsuario === true`: deshabilitar botones "Validar", "Técnico" y "Excel" con `disabled={true}` y `aria-disabled="true"`
    - Para `esAdmin === true`: mantener comportamiento actual (campo email, lista de clientes, botones habilitados)
    - Estado vacío con mensaje descriptivo y CTA al cotizador cuando no hay cotizaciones propias
    - Estados de carga y error con botón "Reintentar"
    - _Requisitos: 5.2, 5.3, 5.4, 5.5, 5.6, 5.10_
  - [ ]* 7.6 Escribir property tests para `HistorialCliente`
    - **Property 7: Campo de búsqueda por email se muestra según el rol**
    - **Property 8: Botones de acción están deshabilitados para rol usuario**
    - **Valida: Requisitos 5.3, 5.4, 5.5, 5.6**
    - Archivo: `frontend/src/__tests__/propiedades/historialCliente.property.test.js`
    - Usar `fc.record({ esAdmin: fc.boolean(), esUsuario: fc.boolean() })` con 100 iteraciones; mockear `AppContext` y `api.js`
  - [ ]* 7.7 Escribir property test para endpoint `/propias` (backend)
    - **Property 9: Endpoint /propias rechaza acceso a cotizaciones ajenas**
    - **Valida: Requisito 5.7**
    - Archivo: `backend/src/__tests__/propiedades/cotizacionesPropias.property.test.js`
    - Usar `fast-check` con `fc.record({ emailPropio: fc.emailAddress(), emailAjeno: fc.emailAddress() })` con 100 iteraciones; mockear `ejecutarQuery`
  - [ ]* 7.8 Escribir tests de componente para `HistorialCliente`
    - Verificar carga automática para rol usuario, campo email oculto, botones disabled, estado vacío, estado error
    - Archivo: `frontend/src/__tests__/HistorialCliente.test.jsx`
    - _Requisitos: 5.2, 5.3, 5.5, 5.10_

- [ ] 8. Checkpoint — Verificar historial y endpoint /propias
  - Asegurar que todos los tests pasan y que el historial carga automáticamente para usuarios. Consultar al usuario si hay dudas.

- [ ] 9. Crear endpoints de notificaciones y extender `usePollingNotificaciones`
  - [ ] 9.1 Implementar `obtenerTodas` en `backend/src/controladores/controladorNotificaciones.js`
    - Consulta SQL parametrizada: `SELECT ... FROM notificaciones_usuario WHERE id_usuario = $1 ORDER BY fecha_creacion DESC LIMIT $2 OFFSET $3`
    - Parámetros opcionales: `limit` (default 50, máx 100), `offset` (default 0)
    - Validar que `limit` esté en `[1, 100]` y `offset >= 0`; retornar 400 `PARAMETROS_INVALIDOS` si no
    - Respuesta: `{ exito: true, total: N, notificaciones: [...] }`
    - _Requisitos: 6.1_
  - [ ] 9.2 Implementar `marcarTodasLeidas` en `backend/src/controladores/controladorNotificaciones.js`
    - `UPDATE notificaciones_usuario SET leida = true WHERE id_usuario = $1 AND leida = false RETURNING id`
    - Respuesta: `{ exito: true, actualizadas: N }`
    - _Requisitos: 6.11_
  - [ ] 9.3 Registrar nuevas rutas en `backend/src/rutas/notificaciones.js`
    - `GET /api/notificaciones/todas` → `verificarTokenUsuario` → `obtenerTodas`
    - `PATCH /api/notificaciones/leer-todas` → `verificarTokenUsuario` → `marcarTodasLeidas`
    - _Requisitos: 6.1, 6.11_
  - [ ] 9.4 Agregar funciones en `frontend/src/servicios/api.js`
    - `export const obtenerTodasNotificaciones = async ({ limit = 50, offset = 0 } = {}) => { ... }`
    - `export const marcarTodasNotificacionesLeidas = async () => { ... }`
    - _Requisitos: 6.1, 6.10, 6.11_
  - [ ] 9.5 Extender `frontend/src/hooks/usePollingNotificaciones.js`
    - Exponer `conteoNoLeidas` (número de notificaciones con `leida === false`) además de `notificaciones`
    - Mantener compatibilidad con los consumidores existentes del hook
    - _Requisitos: 6.2_

- [ ] 10. Crear `BadgeNotificaciones.jsx` e integrarlo en `AppShell.jsx`
  - [ ] 10.1 Crear `frontend/src/componentes/ui/BadgeNotificaciones.jsx`
    - Recibir prop `conteo: number`
    - Si `conteo === 0`: no renderizar nada (retornar `null`)
    - Si `1 ≤ conteo ≤ 99`: mostrar `String(conteo)`
    - Si `conteo > 99`: mostrar `"99+"`
    - Fondo `#FF453A`, texto blanco, tamaño mínimo 18×18 px, `border-radius` circular
    - `aria-label` dinámico: `"${conteo} notificaciones pendientes"` (o `"99+ notificaciones pendientes"`)
    - Contraste WCAG AA verificado
    - _Requisitos: 6.4, 6.5, 6.6_
  - [ ] 10.2 Integrar `BadgeNotificaciones` en `AppShell.jsx`
    - Agregar ícono de notificaciones en el header con touch target 44×44 px
    - Superponer `BadgeNotificaciones` con `conteoNoLeidas` del hook `usePollingNotificaciones`
    - El clic en el ícono abre `PanelNotificaciones`
    - Solo visible para usuarios autenticados (`!esInvitado`)
    - _Requisitos: 6.2, 6.3, 6.7_
  - [ ]* 10.3 Escribir property tests para `BadgeNotificaciones`
    - **Property 10: Badge muestra el conteo correcto de notificaciones no leídas**
    - **Valida: Requisitos 6.2, 6.3, 6.4**
    - Archivo: `frontend/src/__tests__/propiedades/badgeNotificaciones.property.test.js`
    - Usar `fc.nat()` (enteros ≥ 0) con 100 iteraciones; verificar presencia en DOM, texto y aria-label
  - [ ]* 10.4 Escribir tests de componente para `BadgeNotificaciones`
    - Verificar los tres casos (0, 1-99, >99) y el `aria-label`
    - Archivo: `frontend/src/__tests__/BadgeNotificaciones.test.jsx`
    - _Requisitos: 6.3, 6.4, 6.5, 6.6_

- [ ] 11. Crear `PanelNotificaciones.jsx` e integrarlo en `AppShell.jsx`
  - [ ] 11.1 Crear `frontend/src/componentes/notificaciones/PanelNotificaciones.jsx`
    - Cargar notificaciones con `obtenerTodasNotificaciones()` al abrir el panel
    - Mostrar lista con: título, mensaje, fecha de creación y estado de lectura por cada notificación
    - Estado no leída: fondo con tinte de acento; estado leída: fondo neutro
    - Clic en notificación no leída: invocar `PATCH /api/notificaciones/:id/leer` y actualizar conteo del badge
    - Botón "Marcar todas como leídas": invocar `marcarTodasNotificacionesLeidas()` y actualizar badge a 0
    - Estado de carga con `aria-busy="true"`
    - Estado de error con botón "Reintentar"
    - Diseño Apple HIG: `backdrop-blur-md`, `border-radius` 14 px, separadores entre ítems
    - Cierre con tecla Escape; navegación entre ítems con teclas de flecha
    - `prefers-reduced-motion` respetado en animaciones de apertura/cierre
    - Dark mode completo, contraste WCAG AA
    - _Requisitos: 6.8, 6.9, 6.10, 6.12, 6.13, 6.14, 6.15, 6.16_
  - [ ] 11.2 Integrar `PanelNotificaciones` en `AppShell.jsx`
    - Controlar apertura/cierre con estado local `panelAbierto`
    - Pasar callback para actualizar `conteoNoLeidas` al marcar notificaciones como leídas
    - _Requisitos: 6.7_
  - [ ]* 11.3 Escribir property test para `PanelNotificaciones`
    - **Property 11: Panel de notificaciones renderiza todos los campos de cada notificación**
    - **Valida: Requisito 6.8**
    - Archivo: `frontend/src/__tests__/propiedades/badgeNotificaciones.property.test.js` (agregar en el mismo archivo)
    - Usar `fc.array(fc.record({ titulo: fc.string(), mensaje: fc.string(), fecha_creacion: fc.date(), leida: fc.boolean() }))` con 100 iteraciones
  - [ ]* 11.4 Escribir tests de componente para `PanelNotificaciones`
    - Verificar renderizado de lista, marcar leída, marcar todas, estado carga, estado error, navegación por teclado
    - Archivo: `frontend/src/__tests__/PanelNotificaciones.test.jsx`
    - _Requisitos: 6.8, 6.9, 6.10, 6.13, 6.14, 6.15_

- [ ] 12. Checkpoint final — Verificar integración completa
  - Asegurar que todos los tests pasan (propiedades + componentes + integración). Verificar que el badge, el panel de notificaciones y el historial funcionan de punta a punta. Consultar al usuario si hay dudas.

---

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia requisitos específicos para trazabilidad completa.
- Los tests de propiedades usan `fast-check` (ya instalado) con mínimo 100 iteraciones por propiedad.
- Los tests de componentes usan Vitest + Testing Library (ya configurados).
- El control de visibilidad por rol se implementa **siempre** con renderizado condicional React, nunca con CSS.
- El endpoint `/propias` obtiene el `id` del usuario **exclusivamente** del token JWT; nunca de query string o body.
- Los checkpoints son puntos de validación explícitos antes de continuar con la siguiente capa.
