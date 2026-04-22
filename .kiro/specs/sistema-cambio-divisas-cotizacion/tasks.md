# Plan de Implementación: Sistema de Cambio de Divisas y Cotización

## Resumen

Implementación del sistema híbrido de tipo de cambio USD/PEN, secciones de Embalaje y Flete en el cotizador, y fórmula de cálculo financiero extendida para NSG Latinoamerica E.I.R.L.

El orden de implementación sigue la dependencia natural: base de datos → backend → servicios frontend → hooks y contexto → componentes → integración en páginas → pruebas.

---

## Tareas

- [x] 1. Migración de base de datos
  - Crear el archivo `base-datos/migraciones/001_agregar_modo_tipo_cambio.sql` con la sentencia `INSERT INTO configuracion` para la clave `modo_tipo_cambio` con valor por defecto `'manual'`, usando `ON CONFLICT (clave) DO NOTHING` para garantizar idempotencia.
  - Envolver la migración en `BEGIN` / `COMMIT`.
  - _Requisitos: 8.1, 8.2, 8.3, 8.4_

- [x] 2. Backend — Proxy de tipo de cambio automático
  - [x] 2.1 Crear `backend/src/controladores/controladorTipoCambio.js`
    - Implementar `obtenerTipoCambioAutomatico(req, res)` que lea `process.env.APIS_NET_TOKEN`.
    - Si el token no existe → responder 503 con mensaje descriptivo en español.
    - Llamar a `https://api.decolecta.com/v1/tipo-cambio/sunat` con `Authorization: Bearer ${token}`.
    - La respuesta es un array; tomar el último elemento (registro más reciente del día).
    - Validar que `registro.venta` sea numérico y > 0; si no → 422.
    - Si la API externa falla → 502 con mensaje en español.
    - Respuesta exitosa: `{ exito: true, tipo_cambio: number, fuente: "automatico", fecha: string }`.
    - El token **nunca** debe aparecer en ninguna respuesta al cliente.
    - _Requisitos: 2.2, 2.3, 2.4, 2.5, 10.1, 10.2_

  - [ ]* 2.2 Escribir prueba de propiedad para el proxy (Propiedad 1)
    - **Propiedad 1: Estructura de respuesta del proxy para cualquier valor válido**
    - **Valida: Requisito 2.3**
    - Para cualquier `venta` numérico positivo (mockeado), la respuesta debe tener `{ exito: true, tipo_cambio: number > 0, fuente: "automatico", fecha: string }`.

  - [ ]* 2.3 Escribir prueba de propiedad para rechazo de valores inválidos (Propiedad 2)
    - **Propiedad 2: Proxy rechaza valores de tipo de cambio inválidos**
    - **Valida: Requisito 2.5**
    - Para cualquier valor ≤ 0, NaN, null o string no numérico retornado por la API mockeada, el proxy debe responder HTTP 422.

  - [ ]* 2.4 Escribir prueba de propiedad: respuesta nunca contiene el token (Propiedad 14)
    - **Propiedad 14: Respuesta del proxy nunca contiene el token de la API externa**
    - **Valida: Requisito 10.2**
    - Para cualquier escenario (éxito, 422, 502, 503), el cuerpo JSON serializado no debe contener el valor de `APIS_NET_TOKEN`.

  - [x] 2.5 Crear `backend/src/rutas/tipoCambio.js`
    - Definir `GET /automatico` con middleware `verificarToken` antes del controlador.
    - Exportar el router.
    - _Requisitos: 2.1, 10.5_

- [x] 3. Backend — Extensión del controlador de configuración
  - [x] 3.1 Modificar `backend/src/controladores/controladorConfiguracion.js`
    - Agregar `'modo_tipo_cambio'` a la consulta SQL en `obtenerMapaConfiguracion()`.
    - Incluir `modo_tipo_cambio` en el payload retornado por `construirPayloadConfiguracion()`.
    - Implementar `actualizarModoTipoCambio(req, res)` que valide que `req.body.modo` sea exactamente `"manual"` o `"automatico"` (400 si no), persista en BD con `guardarConfiguracion()` y retorne `{ exito: true, modo_tipo_cambio, mensaje }`.
    - Exportar `actualizarModoTipoCambio`.
    - _Requisitos: 1.1, 1.5, 8.1, 8.3_

  - [ ]* 3.2 Escribir prueba de propiedad para rechazo de modo inválido (Propiedad 12)
    - **Propiedad 12: Endpoint de modo rechaza valores inválidos**
    - **Valida: Requisito 8.3**
    - Para cualquier string que no sea `"manual"` ni `"automatico"`, el endpoint debe responder HTTP 400.

  - [x] 3.3 Modificar `backend/src/rutas/configuracion.js`
    - Importar `actualizarModoTipoCambio` del controlador.
    - Agregar `router.put('/tipo-cambio', verificarToken, actualizarModoTipoCambio)`.
    - _Requisitos: 1.5, 9.3_

- [x] 4. Backend — Montar ruta en servidor
  - Modificar `backend/src/servidor.js` para agregar `app.use('/api/tipo-cambio', require('./rutas/tipoCambio'))`.
  - Agregar advertencia de inicio: si `!process.env.APIS_NET_TOKEN` → `console.warn('[ADVERTENCIA] APIS_NET_TOKEN no está definido...')`.
  - _Requisitos: 10.4_

- [x] 5. Checkpoint — Verificar backend
  - Asegurar que todos los tests del backend pasen y que el servidor inicie sin errores. Consultar al usuario si surgen dudas.

- [x] 6. Frontend — Extensión de `api.js`
  - [x] 6.1 Agregar las tres nuevas funciones a `frontend/src/servicios/api.js`
    - `obtenerTipoCambioAutomatico()`: GET `/tipo-cambio/automatico`, lanza error con propiedad `mensaje` en español ante cualquier fallo.
    - `obtenerConfiguracion()`: GET `/configuracion/margen`, retorna el payload completo incluyendo `modo_tipo_cambio`.
    - `actualizarModoTipoCambio(modo)`: PUT `/configuracion/tipo-cambio` con body `{ modo }`, lanza error con propiedad `mensaje` en español ante cualquier fallo.
    - Todas las URLs deben derivarse de `API_BASE_URL`; sin URLs hardcodeadas fuera de esa constante.
    - _Requisitos: 9.1, 9.2, 9.3, 9.5_

  - [ ]* 6.2 Escribir prueba de propiedad para errores de api.js (Propiedad 13)
    - **Propiedad 13: Funciones de api.js lanzan error con propiedad `mensaje` en español**
    - **Valida: Requisito 9.4**
    - Para cualquier error de red o HTTP (4xx, 5xx) simulado, las tres funciones nuevas deben lanzar un objeto con `mensaje` (string en español, no vacío).

- [x] 7. Frontend — Hook `useExchangeRate`
  - [x] 7.1 Crear `frontend/src/hooks/useExchangeRate.js`
    - Aceptar `{ modo, valorManual }` como parámetros.
    - Modo `"manual"`: retornar `valorManual` directamente sin llamadas externas.
    - Modo `"automatico"`:
      - Al montar: leer `nsg_tipo_cambio_cache` de `localStorage`.
      - Si `Date.now() - cache.timestamp < 86_400_000` → usar caché.
      - Si no → llamar `api.obtenerTipoCambioAutomatico()` y guardar en caché.
      - Si falla y hay caché → usar caché + `advertencia`.
      - Si falla y no hay caché → usar `valorManual` + `advertencia`.
    - Exponer: `{ tipoCambio, cargando, error, advertencia, ultimaActualizacion, forzarActualizacion }`.
    - `forzarActualizacion()` invalida caché y repite la petición.
    - _Requisitos: 2.1, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

  - [ ]* 7.2 Escribir prueba de propiedad para lógica de caché (Propiedad 3)
    - **Propiedad 3: Lógica de caché del hook de tipo de cambio**
    - **Valida: Requisitos 2.7, 2.8**
    - Para cualquier timestamp almacenado: si `Date.now() - timestamp < 86_400_000` → usa caché sin llamar al proxy; si ≥ 86_400_000 o no existe → llama al proxy.

- [x] 8. Frontend — Extensión de `AppContext`
  - [x] 8.1 Modificar `frontend/src/contexto/AppContext.jsx`
    - Agregar estado `modoTipoCambio` (default `'manual'`) y `tipoCambioManualBD`.
    - Instanciar `useExchangeRate({ modo: modoTipoCambio, valorManual: tipoCambioManualBD })` dentro de `AppProviderInternal`.
    - Sincronizar `tipoCambioUsdPen` con el valor del hook cuando el modo es `"automatico"`, o con el valor de BD cuando es `"manual"`.
    - Implementar `cargarConfiguracion()` que llame a `api.obtenerConfiguracion()` y actualice `modoTipoCambio`, `tipoCambioManualBD`, `margenGanancia`, `tasaIgv` y `tipoCambioUsdPen`.
    - Mantener `cargarMargenGanancia()` por retrocompatibilidad.
    - Extender `calcularSubtotalNeto({ embalaje, flete })` para aceptar parámetros opcionales de embalaje y flete.
    - Exponer en el contexto: `modoTipoCambio`, `cargandoTipoCambio`, `errorTipoCambio`, `advertenciaTipoCambio`, `ultimaActualizacionTC`, `forzarActualizacionTC`, `cargarConfiguracion`.
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.4_

  - [ ]* 8.2 Escribir prueba de propiedad para AppContext (Propiedad 4)
    - **Propiedad 4: AppContext refleja el tipo de cambio correcto según el modo activo**
    - **Valida: Requisitos 3.1, 3.6**
    - Para cualquier combinación de modo y valor de TC, `tipoCambioUsdPen` debe ser el valor de BD en modo manual y el del hook en modo automático.

- [x] 9. Frontend — Componente `SeccionEmbalaje`
  - [x] 9.1 Crear `frontend/src/componentes/cotizador/SeccionEmbalaje.jsx`
    - Props: `{ activo, opcion, precioBasico, precioAvanzado, onToggle, onCambiarOpcion, onCambiarPrecio }`.
    - Toggle de activación con touch target mínimo de 44px.
    - Dos opciones mutuamente excluyentes (radio-style): "Básico" ($20 default) y "Avanzado" ($30 default).
    - Campos de precio editables con validación inline: precio ≤ 0 o no numérico → mensaje de error, mantiene último valor válido.
    - Visible solo cuando `autenticado === true`.
    - Dark mode completo, accesibilidad WCAG AA, `prefers-reduced-motion`.
    - _Requisitos: 5.1, 5.2, 5.3, 5.6, 5.7, 5.8_

  - [ ]* 9.2 Escribir prueba de propiedad para toggle de embalaje (Propiedad 6)
    - **Propiedad 6: Toggle de embalaje incluye/excluye su precio del Costo_CPU**
    - **Valida: Requisitos 5.4, 5.5**
    - Para cualquier precio de embalaje positivo y opción seleccionada, `calcularSubtotalNeto()` no incluye embalaje cuando está desactivado e incluye exactamente el precio de la opción cuando está activado.

  - [ ]* 9.3 Escribir prueba de propiedad para precios inválidos (Propiedad 8)
    - **Propiedad 8: Precios inválidos son rechazados y se mantiene el último valor válido**
    - **Valida: Requisitos 5.7, 6.7**
    - Para cualquier valor ≤ 0, NaN, string vacío o null ingresado como precio, la validación lo rechaza y el precio efectivo permanece igual al último valor válido.

- [x] 10. Frontend — Componente `SeccionFlete`
  - [x] 10.1 Crear `frontend/src/componentes/cotizador/SeccionFlete.jsx`
    - Props: `{ activo, precio, onToggle, onCambiarPrecio }`.
    - Toggle de activación con touch target mínimo de 44px.
    - Campo de precio editable con validación inline: precio ≤ 0 o no numérico → mensaje de error, mantiene último valor válido.
    - Visible solo cuando `autenticado === true`.
    - Dark mode completo, accesibilidad WCAG AA, `prefers-reduced-motion`.
    - _Requisitos: 6.1, 6.2, 6.3, 6.6, 6.7, 6.8_

  - [ ]* 10.2 Escribir prueba de propiedad para toggle de flete (Propiedad 7)
    - **Propiedad 7: Toggle de flete incluye/excluye su precio del Costo_CPU**
    - **Valida: Requisitos 6.4, 6.5**
    - Para cualquier precio de flete positivo, `calcularSubtotalNeto()` no incluye flete cuando está desactivado e incluye exactamente ese precio cuando está activado.

- [x] 11. Frontend — Componente `ResumenFinancieroAdmin`
  - [x] 11.1 Crear `frontend/src/componentes/cotizador/ResumenFinancieroAdmin.jsx`
    - Props: `{ resumen, tipoCambio }`.
    - Implementar `calcularResumenFinancieroAdmin()` como función pura (o importarla de utilidades) con la fórmula completa:
      `Costo_CPU → Costo_CPU_Periféricos → Utilidad_USD → Precio_Venta_USD → IGV_USD → Precio_Final_USD → Precio_Final_PEN`.
    - Renderizar tabla de desglose con columna USD y columna PEN, calculada con `useMemo`.
    - Actualización inmediata ante cualquier cambio en inputs (sin indicador de carga, cálculo local).
    - Visible solo cuando `autenticado === true`.
    - Dark mode completo, accesibilidad WCAG AA.
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 11.5_

  - [ ]* 11.2 Escribir prueba de propiedad para la fórmula financiera extendida (Propiedad 9)
    - **Propiedad 9: Fórmula financiera extendida es matemáticamente correcta**
    - **Valida: Requisitos 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8**
    - Para cualquier combinación de precios de componentes, extras, embalaje, flete, margen (0–100%) y tasa IGV (0–100%), `calcularResumenFinancieroAdmin()` debe satisfacer simultáneamente todas las ecuaciones de la fórmula.

  - [ ]* 11.3 Escribir prueba de propiedad para el invariante financiero (Propiedad 10)
    - **Propiedad 10: Invariante financiero — Costo + Utilidad = Precio_Venta**
    - **Valida: Requisito 7.12**
    - Para cualquier `Costo_CPU_Periféricos` y `margen_ganancia`, `|Costo_CPU_Periféricos + Utilidad_USD - Precio_Venta_USD| ≤ 0.01`.

  - [ ]* 11.4 Escribir prueba de propiedad para conversión USD→PEN (Propiedad 5)
    - **Propiedad 5: Conversión USD→PEN es siempre monto_usd × tipo_cambio**
    - **Valida: Requisitos 4.3, 4.5**
    - Para cualquier monto USD ≥ 0 y tipo de cambio positivo, el monto en PEN debe ser exactamente `monto_usd × tipoCambioUsdPen` redondeado a dos decimales (tolerancia < 0.01).

  - [ ]* 11.5 Escribir prueba de propiedad para renderizado completo (Propiedad 11)
    - **Propiedad 11: ResumenFinancieroAdmin renderiza todas las líneas con USD y PEN**
    - **Valida: Requisitos 7.9, 7.10, 11.5**
    - Para cualquier objeto resumen válido, el componente debe renderizar las 6 líneas del desglose (Costo CPU, Costo CPU+Periféricos, Utilidad, Precio Venta, IGV, Precio Final) con valor USD y equivalente PEN.

- [x] 12. Frontend — Integración en `Cotizador.jsx`
  - [x] 12.1 Agregar estados locales de embalaje y flete en `frontend/src/paginas/Cotizador.jsx`
    - `embalaje`: `{ activo: false, opcion: 'basico', precioBasico: 20, precioAvanzado: 30 }`.
    - `flete`: `{ activo: false, precio: 20 }`.
    - _Requisitos: 5.3, 6.3_

  - [x] 12.2 Integrar `SeccionEmbalaje`, `SeccionFlete` y `ResumenFinancieroAdmin` en `Cotizador.jsx`
    - Renderizar condicionalmente solo cuando `autenticado === true`.
    - Calcular `resumenAdmin` con `useMemo` usando `calcularResumenFinancieroAdmin({ configuracionSeleccionada, extras, embalaje, flete, margenGanancia, tasaIgv, tipoCambioUsdPen })`.
    - Pasar los handlers correctos a cada componente (`onToggle`, `onCambiarOpcion`, `onCambiarPrecio`).
    - Mostrar estado de carga mientras se obtiene el tipo de cambio automático antes de renderizar montos en PEN.
    - _Requisitos: 4.4, 5.1, 5.4, 5.5, 6.1, 6.4, 6.5, 7.1, 7.11, 11.6_

- [x] 13. Frontend — Integración en `AdminConfiguracion.jsx`
  - [x] 13.1 Modificar `frontend/src/paginas/AdminConfiguracion.jsx`
    - Agregar estado local `modoTipoCambio` sincronizado con el contexto.
    - Agregar selector de modo (segmented control: "Manual" / "Automático (API)") con accesibilidad WCAG AA.
    - En modo manual: mostrar campo de tipo de cambio editable (comportamiento actual).
    - En modo automático: ocultar campo manual, mostrar valor en solo lectura con fecha/hora de última actualización, botón "Actualizar tipo de cambio" que llame a `forzarActualizacionTC()`, indicador de carga mientras se obtiene el valor, advertencia si se usa valor de respaldo.
    - Al guardar: llamar a `api.actualizarModoTipoCambio(modo)` y mostrar notificación de éxito o error descriptivo.
    - No perder valores ingresados si la petición falla.
    - _Requisitos: 1.2, 1.3, 1.4, 1.5, 1.6, 11.1, 11.2, 11.3, 11.4_

- [x] 14. Checkpoint final — Verificar integración completa
  - Asegurar que todos los tests pasen (backend y frontend), que el build no tenga errores y que los flujos de embalaje, flete, tipo de cambio manual/automático y resumen financiero funcionen de punta a punta. Consultar al usuario si surgen dudas.

---

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia los requisitos específicos para trazabilidad completa.
- Los checkpoints (tareas 5 y 14) garantizan validación incremental.
- Las pruebas de propiedad usan **fast-check** con mínimo 100 iteraciones por prueba.
- Cada prueba de propiedad debe incluir el tag: `// Feature: sistema-cambio-divisas-cotizacion, Propiedad N: <texto>`.
- Las pruebas unitarias y de propiedad son complementarias: las unitarias cubren casos concretos y borde, las de propiedad verifican corrección general.
- No romper contratos existentes: `cargarMargenGanancia()`, `calcularSubtotalNeto()` sin parámetros y los endpoints actuales deben seguir funcionando.
