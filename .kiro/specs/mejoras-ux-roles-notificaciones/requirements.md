# Documento de Requisitos — Mejoras UX, Roles y Notificaciones

## Introducción

Este documento especifica los requisitos para 6 mejoras del sistema **Cotizador NSG** (React + Tailwind + Node.js/Express + PostgreSQL). Las mejoras abarcan: expansión a pantalla completa del diagrama de compatibilidad, corrección del switch de disponibilidad y reposición de botones en el cotizador, balance final con porcentaje de ganancia global, control de visibilidad de acciones por rol en el panel de cotización lista, restricción del historial a cotizaciones propias por usuario, y sistema de notificaciones por cuenta con badge en la navbar.

Todos los componentes de UI deben cumplir con el estándar Apple HIG, dark mode completo y accesibilidad WCAG 2.2 AA. El idioma del proyecto es español.

---

## Glosario

- **Cotizador**: Página `/cotizador` con el flujo de selección de componentes por pasos (`Cotizador.jsx`).
- **DiagramaCompatibilidad**: Componente SVG existente (`DiagramaCompatibilidad.jsx`) que muestra relaciones de compatibilidad entre componentes seleccionados.
- **Modal_Diagrama**: Overlay de pantalla completa que expande el `DiagramaCompatibilidad` sin salir de la página.
- **Switch_Disponibilidad**: Control de alternancia ("Disponibles / Todos") que filtra los productos del paso actual en el cotizador.
- **Paso_Actual**: Sección activa del cotizador que muestra los productos de una categoría específica.
- **Balance_Final**: Resumen financiero mostrado al completar la configuración, que incluye el porcentaje de ganancia global calculado sobre el total de todos los productos seleccionados.
- **Panel_Cotizacion_Lista**: Panel o sección que aparece tras generar una cotización exitosa, con acciones como "Ver historial" y "Validar ticket".
- **Historial**: Página `/historial` (`HistorialCliente.jsx`) que muestra cotizaciones pasadas.
- **Cotizacion_Propia**: Cotización cuyo `id_cliente` en la tabla `cotizaciones` coincide con el `id` de la cuenta autenticada.
- **Admin**: Usuario con rol `admin` en el sistema (contexto global `esAdmin = true`).
- **Usuario**: Usuario autenticado con rol `usuario` en el sistema (contexto global `esUsuario = true`).
- **Invitado**: Usuario no autenticado (`esInvitado = true`).
- **Notificacion**: Registro en la tabla `notificaciones_usuario` con campos: `id`, `id_usuario`, `tipo`, `titulo`, `mensaje`, `leida`, `datos_extra`, `fecha_creacion`.
- **Badge_Notificaciones**: Indicador numérico visual sobre el ícono de notificaciones en la navbar que muestra la cantidad de notificaciones no leídas.
- **Panel_Notificaciones**: Panel desplegable o página que lista el historial completo de notificaciones del usuario autenticado.
- **usePollingNotificaciones**: Hook existente que consulta `GET /api/notificaciones/pendientes` cada 30 segundos.
- **Navbar**: Barra de navegación principal de la aplicación.
- **RutaProtegida**: Componente de ruta que requiere rol `admin`.
- **RutaProtegidaUsuario**: Componente de ruta que requiere cualquier usuario autenticado.

---

## Requisitos

---

### Requisito 1: Pantalla completa / modal en "Compatibilidad visual"

**User Story:** Como Cliente o Admin, quiero expandir el diagrama de compatibilidad a pantalla completa o modal sin salir de la página, para examinar las relaciones entre componentes con mayor detalle y comodidad.

#### Criterios de Aceptación

1. THE DiagramaCompatibilidad SHALL mostrar un botón con ícono SVG de expansión ("expand") en la esquina superior derecha de su contenedor, con touch target mínimo de 44×44 px.
2. WHEN el usuario hace clic en el botón de expansión, THE Modal_Diagrama SHALL abrirse como overlay de pantalla completa sobre el contenido actual sin navegar a otra página.
3. WHILE el Modal_Diagrama está abierto, THE Modal_Diagrama SHALL mostrar el DiagramaCompatibilidad a tamaño ampliado, ocupando al menos el 90% del viewport disponible.
4. THE Modal_Diagrama SHALL incluir un botón de cierre con ícono SVG de colapso ("collapse") accesible con `aria-label="Cerrar diagrama"` y touch target mínimo de 44×44 px.
5. WHEN el usuario presiona la tecla Escape, THE Modal_Diagrama SHALL cerrarse y devolver el foco al botón de expansión.
6. WHEN el Modal_Diagrama se abre, THE Modal_Diagrama SHALL recibir el foco automáticamente para navegación por teclado.
7. THE Modal_Diagrama SHALL aplicar `role="dialog"`, `aria-modal="true"` y `aria-label="Diagrama de compatibilidad ampliado"`.
8. THE Modal_Diagrama SHALL usar `backdrop-blur-md` con fondo translúcido oscuro, `border-radius` de 18px y sombra nivel 2 (`0 6px 24px rgba(0,0,0,.10)`) según el sistema de diseño del proyecto.
9. THE Modal_Diagrama SHALL respetar `prefers-reduced-motion` desactivando animaciones de entrada y salida cuando el usuario lo prefiera.
10. THE DiagramaCompatibilidad SHALL reemplazar los íconos de estado (compatible/incompatible) por íconos SVG inline propios del proyecto, eliminando dependencias de íconos externos.

---

### Requisito 2: Corrección del switch "Disponibles/Todos" y reposición de botones en el cotizador

**User Story:** Como Cliente o Admin, quiero que el switch "Disponibles/Todos" funcione correctamente y esté posicionado dentro del área del paso actual, y que los botones "Anterior" y "Siguiente" estén en la parte superior del contenido del paso, para navegar y filtrar productos de forma intuitiva.

#### Criterios de Aceptación

1. THE Switch_Disponibilidad SHALL alternar correctamente entre los estados "Disponibles" (muestra solo productos con `stock > 0` o `disponible_a_pedido = true`) y "Todos" (muestra todos los productos sin filtro de stock).
2. WHEN el usuario activa el estado "Disponibles", THE Cotizador SHALL filtrar la lista de productos del Paso_Actual mostrando únicamente los que tienen `stock > 0` o `disponible_a_pedido = true`.
3. WHEN el usuario activa el estado "Todos", THE Cotizador SHALL mostrar todos los productos del Paso_Actual sin aplicar filtro de disponibilidad.
4. THE Switch_Disponibilidad SHALL estar posicionado centrado horizontalmente dentro del área del Paso_Actual, no fuera del contenedor del paso.
5. THE Switch_Disponibilidad SHALL mantener su estado seleccionado de forma visible con contraste WCAG AA en ambos modos (dark y light).
6. THE Switch_Disponibilidad SHALL tener `role="switch"`, `aria-checked` con el valor booleano del estado actual, y `aria-label="Filtrar por disponibilidad"`.
7. THE Cotizador SHALL mostrar los botones "Anterior" y "Siguiente" en la parte superior del área de contenido del Paso_Actual, antes de la lista de productos.
8. THE botón "Anterior" SHALL estar deshabilitado (`disabled`) cuando el usuario está en el primer paso (índice 0).
9. THE botón "Siguiente" SHALL estar deshabilitado (`disabled`) cuando el usuario está en el último paso.
10. THE botones "Anterior" y "Siguiente" SHALL tener touch target mínimo de 44×44 px y estados `hover`, `active`, `focus-visible` y `disabled` definidos.

---

### Requisito 3: Balance final con porcentaje de ganancia global

**User Story:** Como Admin, quiero ver al final del cotizador un balance con el porcentaje de ganancia calculado sobre el total de todos los productos seleccionados, para conocer la rentabilidad global de la configuración antes de generar la cotización.

#### Criterios de Aceptación

1. THE Balance_Final SHALL mostrarse en el paso de resumen o generación de cotización, visible únicamente para usuarios con rol `admin`.
2. THE Balance_Final SHALL calcular el costo neto total como la suma de `precio_base` de todos los productos seleccionados (componentes principales + extras), sin aplicar margen ni IGV.
3. THE Balance_Final SHALL calcular el precio de venta total aplicando el `margenGanancia` del contexto global sobre el costo neto total.
4. THE Balance_Final SHALL calcular el porcentaje de ganancia global como: `((precio_venta_total - costo_neto_total) / costo_neto_total) * 100`, redondeado a dos decimales.
5. THE Balance_Final SHALL mostrar: costo neto total, precio de venta total (sin IGV), monto de ganancia en la moneda de vista activa, y el porcentaje de ganancia global.
6. WHEN el porcentaje de ganancia es mayor a cero, THE Balance_Final SHALL mostrar el porcentaje con color de éxito (`#34C759`).
7. WHEN el porcentaje de ganancia es igual a cero, THE Balance_Final SHALL mostrar el porcentaje con color neutro (`var(--color-text-muted)`).
8. THE Balance_Final SHALL actualizarse automáticamente cada vez que el usuario modifique la configuración de componentes o extras.
9. THE Balance_Final SHALL respetar dark mode completo y cumplir contraste WCAG AA en todos sus estados.
10. THE Balance_Final SHALL usar `aria-live="polite"` para anunciar cambios de valor a tecnologías asistivas.

---

### Requisito 4: Control de visibilidad por rol en "Cotización lista"

**User Story:** Como Admin, quiero que los botones "Ver historial" y "Validar ticket" en el panel de cotización lista sean visibles solo para usuarios con rol `admin`, para que los usuarios con rol `usuario` no accedan a funciones administrativas desde ese panel.

#### Criterios de Aceptación

1. THE Panel_Cotizacion_Lista SHALL mostrar los botones "Ver historial" y "Validar ticket" únicamente cuando el usuario autenticado tiene rol `admin` (`esAdmin === true` en el contexto global).
2. WHEN el usuario tiene rol `usuario`, THE Panel_Cotizacion_Lista SHALL ocultar completamente los botones "Ver historial" y "Validar ticket" del DOM (no solo con CSS, sino con renderizado condicional).
3. WHEN el usuario es Invitado, THE Panel_Cotizacion_Lista SHALL ocultar completamente los botones "Ver historial" y "Validar ticket" del DOM.
4. THE Panel_Cotizacion_Lista SHALL mostrar a todos los usuarios (Admin, Usuario e Invitado) el código de ticket generado y el botón de descarga de PDF.
5. THE control de visibilidad SHALL basarse exclusivamente en el valor de `esAdmin` del contexto global `AppContext`, sin lógica de rol duplicada en el componente.
6. IF el rol del usuario cambia durante la sesión, THEN THE Panel_Cotizacion_Lista SHALL reflejar el nuevo estado de visibilidad en el siguiente renderizado.

---

### Requisito 5: Historial `/historial` solo muestra cotizaciones propias

**User Story:** Como Usuario autenticado, quiero que el historial cargue automáticamente mis propias cotizaciones sin necesidad de ingresar mi correo, y que no pueda ver cotizaciones de otros usuarios, para proteger la privacidad de los datos y simplificar mi experiencia.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer el endpoint `GET /api/cotizaciones/propias` protegido por `verificarTokenUsuario`, que retorna únicamente las cotizaciones cuyo `id_cliente` coincide con el `id` de la cuenta autenticada en el token.
2. WHEN un Usuario autenticado navega a `/historial`, THE Historial SHALL cargar automáticamente las Cotizaciones_Propias del usuario sin requerir ingreso de correo electrónico.
3. WHILE el Usuario tiene rol `usuario`, THE Historial SHALL ocultar el campo de búsqueda por correo electrónico del DOM (renderizado condicional, no solo CSS).
4. WHILE el usuario tiene rol `admin`, THE Historial SHALL mostrar el campo de búsqueda por correo electrónico y la lista de clientes registrados, manteniendo el comportamiento actual.
5. WHILE el usuario tiene rol `usuario`, THE Historial SHALL deshabilitar (`disabled`) los botones "Validar", "Técnico" y "Excel" en cada fila de la tabla de cotizaciones.
6. THE botones deshabilitados para rol `usuario` SHALL tener `aria-disabled="true"` y apariencia visual de estado deshabilitado con contraste WCAG AA.
7. IF un Usuario con rol `usuario` intenta acceder a `GET /api/cotizaciones/cliente/:email` con un email diferente al suyo, THEN THE Sistema SHALL retornar HTTP 403 con mensaje de error estandarizado y código `ACCESO_DENEGADO`.
8. THE endpoint `GET /api/cotizaciones/propias` SHALL retornar la misma estructura de respuesta que `GET /api/cotizaciones/cliente/:email` para mantener compatibilidad con el frontend existente.
9. THE endpoint `GET /api/cotizaciones/propias` SHALL usar consultas SQL parametrizadas con el `id` del usuario del token, sin aceptar parámetros de identificación de usuario en la query string o body.
10. IF el usuario autenticado no tiene cotizaciones propias, THEN THE Historial SHALL mostrar un estado vacío con mensaje descriptivo y CTA para ir al cotizador.

---

### Requisito 6: Notificaciones por cuenta con badge en navbar

**User Story:** Como Usuario autenticado, quiero ver un badge con el número de notificaciones pendientes en la navbar y acceder a un historial de todas mis notificaciones, para estar informado de eventos relevantes de mi cuenta sin perder el contexto de la página actual.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer el endpoint `GET /api/notificaciones/todas` protegido por `verificarTokenUsuario`, que retorna todas las notificaciones (leídas y no leídas) del usuario autenticado, ordenadas por `fecha_creacion` descendente, con paginación opcional (`limit`, `offset`).
2. WHEN el hook `usePollingNotificaciones` recibe la respuesta de `GET /api/notificaciones/pendientes`, THE Navbar SHALL mostrar el Badge_Notificaciones con el conteo de notificaciones no leídas (`leida = false`) del usuario autenticado.
3. WHEN el conteo de notificaciones no leídas es cero, THE Navbar SHALL ocultar el Badge_Notificaciones.
4. WHEN el conteo de notificaciones no leídas es mayor a 99, THE Badge_Notificaciones SHALL mostrar el texto "99+" en lugar del número exacto.
5. THE Badge_Notificaciones SHALL posicionarse sobre el ícono de notificaciones en la Navbar, con fondo de color `#FF453A` (danger), texto blanco, tamaño mínimo de 18×18 px y `border-radius` circular.
6. THE Badge_Notificaciones SHALL cumplir contraste WCAG AA (texto blanco sobre fondo `#FF453A`) y tener `aria-label` que incluya el conteo (ejemplo: `"3 notificaciones pendientes"`).
7. THE Navbar SHALL incluir un ícono de notificaciones con touch target mínimo de 44×44 px que al hacer clic abra el Panel_Notificaciones.
8. THE Panel_Notificaciones SHALL mostrar la lista de todas las notificaciones del usuario (leídas y no leídas), con título, mensaje, fecha de creación y estado de lectura para cada una.
9. WHEN el usuario hace clic en una notificación no leída en el Panel_Notificaciones, THE Panel_Notificaciones SHALL marcarla como leída invocando `PATCH /api/notificaciones/:id/leer` y actualizar el Badge_Notificaciones.
10. THE Panel_Notificaciones SHALL mostrar un botón "Marcar todas como leídas" que invoque `PATCH /api/notificaciones/leer-todas` y actualice el Badge_Notificaciones a cero.
11. THE Sistema SHALL exponer el endpoint `PATCH /api/notificaciones/leer-todas` protegido por `verificarTokenUsuario`, que marca como leídas todas las notificaciones no leídas del usuario autenticado.
12. THE Panel_Notificaciones SHALL aplicar diseño Apple HIG: fondo con `backdrop-blur-md`, `border-radius` de 14px, separadores entre ítems, y estados de lectura diferenciados visualmente (no leída: fondo con tinte de acento; leída: fondo neutro).
13. WHILE el Panel_Notificaciones está cargando, THE Panel_Notificaciones SHALL mostrar un estado de carga accesible con `aria-busy="true"`.
14. IF el endpoint retorna error, THEN THE Panel_Notificaciones SHALL mostrar un estado de error con opción de reintentar.
15. THE Panel_Notificaciones SHALL ser accesible por teclado con navegación entre ítems usando teclas de flecha y cierre con Escape.
16. THE Panel_Notificaciones SHALL respetar `prefers-reduced-motion` en todas sus animaciones de apertura, cierre y transición de estado.

---

## Restricciones Transversales

### Seguridad
1. THE Sistema SHALL validar y sanitizar todos los parámetros de entrada en los nuevos endpoints antes de ejecutar consultas a la base de datos.
2. THE Sistema SHALL usar consultas SQL parametrizadas en todos los nuevos endpoints; está prohibida la concatenación directa de valores de usuario en queries.
3. THE Sistema SHALL aplicar autenticación y autorización por rol en todos los endpoints nuevos que lo requieran.
4. THE Sistema SHALL retornar respuestas de error estandarizadas con códigos HTTP correctos y campo `codigo` en todos los nuevos endpoints.
5. THE endpoint `GET /api/cotizaciones/propias` SHALL ignorar cualquier parámetro de identificación de usuario en query string o body; el `id` del usuario se obtiene exclusivamente del token JWT.

### Base de Datos
6. IF se requieren nuevas columnas o índices para soportar los endpoints nuevos, THEN THE Sistema SHALL incluir migraciones SQL verificables.
7. THE consultas de historial propio SHALL usar el campo `id_cliente` de la tabla `cotizaciones` para filtrar por el `id` de la cuenta autenticada, sin depender del correo electrónico.

### UI/UX
8. THE Sistema SHALL implementar todos los nuevos componentes y páginas con dark mode completo sin excepciones visuales.
9. THE Sistema SHALL garantizar touch targets mínimos de 44×44 px en todos los elementos interactivos nuevos.
10. THE Sistema SHALL implementar estados de carga, error, vacío y éxito en todos los nuevos componentes y páginas críticas.
11. THE Sistema SHALL respetar `prefers-reduced-motion` en todas las animaciones de los nuevos componentes.
12. THE control de visibilidad por rol SHALL implementarse siempre mediante renderizado condicional en React (no mediante CSS `display: none` o `visibility: hidden`), para evitar exposición de elementos en el DOM.
