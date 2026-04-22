# Documento de Requisitos

## Introducción

Este documento describe los requisitos para tres mejoras interrelacionadas al sistema de cotización de NSG Latinoamerica E.I.R.L.:

1. **Sistema híbrido de tipo de cambio USD → PEN**: Permite al administrador elegir entre un tipo de cambio ingresado manualmente (comportamiento actual) o uno obtenido automáticamente desde la API pública de [decolecta.com](https://api.decolecta.com/), con caché en `localStorage` y conversión exclusivamente en el frontend.

2. **Secciones de Embalaje y Flete en el cotizador**: Dos nuevas secciones configurables por el admin en la vista del cotizador, con precios editables y activación/desactivación independiente.

3. **Fórmula de cálculo financiero extendida**: Desglose financiero completo visible para el admin en el panel de resumen del cotizador, incorporando embalaje, flete, margen de ganancia, utilidad y precio de venta con IGV en USD y PEN.

La base de datos almacena todos los precios en USD. La conversión a PEN se realiza exclusivamente en el frontend al momento de renderizar.

---

## Glosario

- **Cotizador**: Aplicación React de NSG Latinoamerica para armar y cotizar configuraciones de PC.
- **Admin**: Usuario administrador autenticado con acceso a vistas y funciones restringidas.
- **Cliente**: Usuario no autenticado que navega el cotizador para armar su configuración.
- **Tipo_de_Cambio**: Valor numérico que representa cuántos soles peruanos (PEN) equivalen a un dólar estadounidense (USD).
- **Modo_Manual**: Modo de tipo de cambio donde el Admin ingresa el valor directamente.
- **Modo_Automatico**: Modo de tipo de cambio donde el Sistema obtiene el valor desde la API externa decolecta.com.
- **Hook_Tipo_Cambio**: Custom hook React `useExchangeRate` que gestiona la lógica de obtención, caché y estado del tipo de cambio.
- **Proxy_Tipo_Cambio**: Endpoint del backend Node.js/Express que actúa como intermediario para ocultar el token de la API externa.
- **Cache_Tipo_Cambio**: Valor del tipo de cambio almacenado en `localStorage` junto con un timestamp de expiración de 24 horas.
- **Embalaje**: Costo adicional opcional por empaque del equipo; puede ser Básico o Avanzado.
- **Flete**: Costo adicional opcional por transporte del equipo.
- **Costo_CPU**: Suma de los 7 componentes principales (Procesador, Placa madre, RAM, Almacenamiento, GPU, Fuente, Case) más Embalaje y Flete si están activados.
- **Costo_CPU_Perifericos**: Suma de Costo_CPU más todos los extras (periféricos, audio, software, almacenamiento externo, energía, monitor, refrigeración, conectividad).
- **Utilidad_USD**: Resultado de aplicar el margen de ganancia sobre el Costo_CPU_Perifericos en USD.
- **Precio_Venta_USD**: Suma de Costo_CPU_Perifericos más Utilidad_USD.
- **IGV**: Impuesto General a las Ventas peruano, aplicado sobre el Precio_Venta_USD.
- **Precio_Venta_USD_con_IGV**: Precio_Venta_USD más el monto de IGV.
- **Precio_Venta_PEN_con_IGV**: Precio_Venta_USD_con_IGV multiplicado por el Tipo_de_Cambio vigente.
- **Resumen_Financiero**: Panel lateral del cotizador que muestra el desglose financiero completo para el Admin.
- **AppContext**: Contexto global React (`AppContext.jsx`) que gestiona estado compartido de la aplicación.
- **Configuracion_BD**: Tabla `configuracion` de PostgreSQL que almacena pares clave-valor de parámetros del sistema.
- **AdminConfiguracion**: Página React (`AdminConfiguracion.jsx`) donde el Admin gestiona parámetros globales del sistema.
- **apis_net_pe**: Servicio externo peruano que provee el tipo de cambio oficial USD/PEN publicado por SUNAT. Se accede a través de la API de [decolecta.com](https://api.decolecta.com/) con el endpoint `GET /v1/tipo-cambio/sunat`.

---

## Requisitos

### Requisito 1: Configuración del modo de tipo de cambio

**Historia de usuario:** Como Admin, quiero elegir entre tipo de cambio manual o automático (API), para que el sistema use siempre el valor más conveniente y actualizado sin necesidad de intervención diaria.

#### Criterios de aceptación

1. THE Configuracion_BD SHALL almacenar la clave `modo_tipo_cambio` con los valores posibles `manual` o `automatico`.
2. WHEN el Admin accede a AdminConfiguracion, THE AdminConfiguracion SHALL mostrar un selector de modo con las opciones "Manual" y "Automático (API)".
3. WHEN el Admin selecciona el modo "Manual", THE AdminConfiguracion SHALL mostrar el campo de ingreso numérico del tipo de cambio (comportamiento actual).
4. WHEN el Admin selecciona el modo "Automático (API)", THE AdminConfiguracion SHALL ocultar el campo de ingreso manual y mostrar el valor obtenido de la API en modo solo lectura junto con un botón "Actualizar tipo de cambio".
5. WHEN el Admin guarda la configuración, THE Sistema SHALL persistir el valor de `modo_tipo_cambio` en la Configuracion_BD.
6. IF la petición de guardado falla, THEN THE AdminConfiguracion SHALL mostrar un mensaje de error descriptivo sin perder los valores ingresados por el Admin.

---

### Requisito 2: Obtención automática del tipo de cambio desde la API externa

**Historia de usuario:** Como Admin, quiero que el sistema obtenga el tipo de cambio oficial USD/PEN desde la API de decolecta.com (SUNAT) una vez al día, para no tener que actualizarlo manualmente cada jornada.

#### Criterios de aceptación

1. WHEN el modo activo es `automatico`, THE Hook_Tipo_Cambio SHALL consultar el Proxy_Tipo_Cambio del backend para obtener el tipo de cambio vigente.
2. THE Proxy_Tipo_Cambio SHALL leer el token de autenticación de la variable de entorno `APIS_NET_TOKEN` y nunca exponerlo en respuestas al cliente.
3. WHEN el Proxy_Tipo_Cambio recibe una petición válida, THE Proxy_Tipo_Cambio SHALL retornar el tipo de cambio USD/PEN obtenido de decolecta.com con estructura `{ exito: true, tipo_cambio: number, fuente: "automatico" }`.
4. IF la API externa decolecta.com no responde o retorna un error, THEN THE Proxy_Tipo_Cambio SHALL retornar un error estructurado con código HTTP 502 y mensaje descriptivo en español.
5. IF la API externa retorna un valor de tipo de cambio menor o igual a 0 o no numérico, THEN THE Proxy_Tipo_Cambio SHALL rechazar el valor y retornar un error con código HTTP 422.
6. THE Hook_Tipo_Cambio SHALL almacenar el tipo de cambio obtenido en la Cache_Tipo_Cambio con un timestamp de obtención.
7. WHEN el Hook_Tipo_Cambio se inicializa y existe una Cache_Tipo_Cambio con antigüedad menor a 24 horas, THE Hook_Tipo_Cambio SHALL usar el valor en caché sin realizar una nueva petición al Proxy_Tipo_Cambio.
8. WHEN el Hook_Tipo_Cambio se inicializa y la Cache_Tipo_Cambio tiene antigüedad mayor o igual a 24 horas o no existe, THE Hook_Tipo_Cambio SHALL solicitar un nuevo valor al Proxy_Tipo_Cambio.
9. WHEN el Admin presiona el botón "Actualizar tipo de cambio" en AdminConfiguracion, THE Hook_Tipo_Cambio SHALL invalidar la Cache_Tipo_Cambio y solicitar un nuevo valor al Proxy_Tipo_Cambio independientemente de su antigüedad.
10. IF el modo activo es `automatico` y la obtención del tipo de cambio falla, THEN THE Hook_Tipo_Cambio SHALL usar el último valor en caché disponible y mostrar una advertencia visible al Admin indicando que el valor puede estar desactualizado.
11. IF el modo activo es `automatico` y no existe ningún valor en caché ni se pudo obtener uno nuevo, THEN THE Hook_Tipo_Cambio SHALL usar el valor de `tipo_cambio_usd_pen` almacenado en Configuracion_BD como respaldo y mostrar una advertencia al Admin.

---

### Requisito 3: Integración del tipo de cambio en el contexto global

**Historia de usuario:** Como sistema, quiero que el tipo de cambio vigente (manual o automático) esté disponible en el AppContext, para que todos los componentes que necesiten conversión USD/PEN usen siempre el mismo valor sin duplicar lógica.

#### Criterios de aceptación

1. THE AppContext SHALL exponer el valor `tipoCambioUsdPen` que refleja el tipo de cambio vigente según el modo activo (`manual` o `automatico`).
2. THE AppContext SHALL exponer el valor `modoTipoCambio` con el modo activo (`manual` o `automatico`).
3. WHEN el modo activo es `automatico`, THE AppContext SHALL obtener el tipo de cambio a través del Hook_Tipo_Cambio.
4. WHEN el modo activo es `manual`, THE AppContext SHALL usar el valor `tipo_cambio_usd_pen` almacenado en Configuracion_BD.
5. THE AppContext SHALL exponer la función `cargarConfiguracion` que obtiene desde el backend el modo activo, el tipo de cambio manual, el margen de ganancia y la tasa de IGV en una sola petición.
6. WHEN el tipo de cambio cambia en el AppContext, THE Cotizador SHALL recalcular automáticamente todos los montos en PEN sin requerir acción del usuario.

---

### Requisito 4: Conversión de moneda exclusivamente en el frontend

**Historia de usuario:** Como sistema, quiero que la conversión de USD a PEN ocurra únicamente en el frontend al momento de renderizar, para mantener la base de datos limpia con precios en USD y evitar inconsistencias por tipos de cambio históricos.

#### Criterios de aceptación

1. THE Sistema SHALL almacenar todos los precios de productos en la base de datos exclusivamente en USD.
2. THE Sistema SHALL NO persistir el tipo de cambio obtenido de la API externa en la Configuracion_BD.
3. WHEN el Cotizador renderiza montos en PEN, THE Cotizador SHALL calcular la conversión multiplicando el monto en USD por el `tipoCambioUsdPen` vigente del AppContext.
4. THE Cotizador SHALL usar `useMemo` para calcular los montos convertidos a PEN, de modo que el recálculo solo ocurra cuando cambien los precios en USD o el tipo de cambio.
5. FOR ALL montos mostrados en PEN en el Cotizador, el valor mostrado SHALL ser igual al monto en USD multiplicado por el `tipoCambioUsdPen` vigente con precisión de dos decimales.

---

### Requisito 5: Sección de Embalaje en el cotizador

**Historia de usuario:** Como Admin, quiero configurar el costo de embalaje directamente en el cotizador, para incluirlo o excluirlo del cálculo de precio según la necesidad de cada cotización.

#### Criterios de aceptación

1. WHEN el usuario autenticado es Admin y accede al Cotizador, THE Cotizador SHALL mostrar la sección "Embalaje" en el panel de configuración.
2. THE Cotizador SHALL mostrar dos opciones de embalaje mutuamente excluyentes: "Básico" con precio por defecto de $20 USD y "Avanzado" con precio por defecto de $30 USD.
3. THE Cotizador SHALL mostrar un control de activación (toggle) para la sección de Embalaje que permita incluirla o excluirla del cálculo.
4. WHEN el Embalaje está desactivado, THE Cotizador SHALL excluir el costo de embalaje del Costo_CPU y del Resumen_Financiero.
5. WHEN el Embalaje está activado, THE Cotizador SHALL incluir el precio de la opción seleccionada en el Costo_CPU.
6. WHEN el Admin modifica el precio de la opción "Básico" o "Avanzado", THE Cotizador SHALL actualizar inmediatamente el Resumen_Financiero con el nuevo valor.
7. IF el Admin ingresa un precio de embalaje menor o igual a 0 o no numérico, THEN THE Cotizador SHALL mostrar un mensaje de validación y mantener el último valor válido.
8. THE Cotizador SHALL mostrar la sección de Embalaje únicamente cuando el usuario autenticado es Admin; los Clientes no deben ver esta sección.

---

### Requisito 6: Sección de Flete en el cotizador

**Historia de usuario:** Como Admin, quiero configurar el costo de flete directamente en el cotizador, para incluirlo o excluirlo del cálculo de precio según si el equipo requiere transporte.

#### Criterios de aceptación

1. WHEN el usuario autenticado es Admin y accede al Cotizador, THE Cotizador SHALL mostrar la sección "Flete (Transportista)" en el panel de configuración.
2. THE Cotizador SHALL mostrar un campo de precio editable para el Flete con valor por defecto de $20 USD.
3. THE Cotizador SHALL mostrar un control de activación (toggle) para la sección de Flete que permita incluirla o excluirla del cálculo.
4. WHEN el Flete está desactivado, THE Cotizador SHALL excluir el costo de flete del Costo_CPU y del Resumen_Financiero.
5. WHEN el Flete está activado, THE Cotizador SHALL incluir el precio de flete configurado en el Costo_CPU.
6. WHEN el Admin modifica el precio del Flete, THE Cotizador SHALL actualizar inmediatamente el Resumen_Financiero con el nuevo valor.
7. IF el Admin ingresa un precio de flete menor o igual a 0 o no numérico, THEN THE Cotizador SHALL mostrar un mensaje de validación y mantener el último valor válido.
8. THE Cotizador SHALL mostrar la sección de Flete únicamente cuando el usuario autenticado es Admin; los Clientes no deben ver esta sección.

---

### Requisito 7: Fórmula de cálculo financiero extendida

**Historia de usuario:** Como Admin, quiero ver el desglose financiero completo en el panel de resumen del cotizador, para entender la composición del precio de venta y tomar decisiones informadas sobre márgenes y costos adicionales.

#### Criterios de aceptación

1. WHEN el usuario autenticado es Admin y accede al Cotizador, THE Cotizador SHALL mostrar el Resumen_Financiero con el desglose completo de la fórmula de cálculo.
2. THE Cotizador SHALL calcular el Costo_CPU como la suma de los precios de los 7 componentes principales más el precio de Embalaje (si está activado) más el precio de Flete (si está activado).
3. THE Cotizador SHALL calcular el Costo_CPU_Perifericos como la suma del Costo_CPU más los precios de todos los extras seleccionados (periféricos, audio, software, almacenamiento externo, energía, monitor, refrigeración, conectividad).
4. THE Cotizador SHALL calcular la Utilidad_USD como el resultado de multiplicar el Costo_CPU_Perifericos por el porcentaje de margen de ganancia configurado.
5. THE Cotizador SHALL calcular el Precio_Venta_USD como la suma del Costo_CPU_Perifericos más la Utilidad_USD.
6. THE Cotizador SHALL calcular el IGV como el resultado de multiplicar el Precio_Venta_USD por la tasa de IGV configurada.
7. THE Cotizador SHALL calcular el Precio_Venta_USD_con_IGV como la suma del Precio_Venta_USD más el monto de IGV.
8. THE Cotizador SHALL calcular el Precio_Venta_PEN_con_IGV como el resultado de multiplicar el Precio_Venta_USD_con_IGV por el Tipo_de_Cambio vigente.
9. THE Resumen_Financiero SHALL mostrar cada línea del desglose con su etiqueta, monto en USD y monto equivalente en PEN.
10. WHEN cualquier componente, extra, precio de embalaje, precio de flete, margen de ganancia, tasa de IGV o tipo de cambio cambia, THE Resumen_Financiero SHALL recalcular y mostrar los valores actualizados de forma inmediata.
11. THE Cotizador SHALL mostrar el Resumen_Financiero completo únicamente cuando el usuario autenticado es Admin; los Clientes ven únicamente el precio total con IGV.
12. FOR ALL cálculos del Resumen_Financiero, la suma de Costo_CPU_Perifericos más Utilidad_USD SHALL ser igual al Precio_Venta_USD con una tolerancia de $0.01 USD.

---

### Requisito 8: Migración de base de datos

**Historia de usuario:** Como sistema, quiero que la tabla `configuracion` incluya la clave `modo_tipo_cambio`, para persistir la preferencia del Admin sobre el modo de tipo de cambio entre sesiones y reinicios del servidor.

#### Criterios de aceptación

1. THE Configuracion_BD SHALL contener la clave `modo_tipo_cambio` con valor por defecto `manual` tras ejecutar la migración.
2. WHEN se ejecuta la migración, THE Sistema SHALL insertar la clave `modo_tipo_cambio` con valor `manual` usando `ON CONFLICT (clave) DO NOTHING` para no sobreescribir configuraciones existentes.
3. THE Configuracion_BD SHALL aceptar únicamente los valores `manual` o `automatico` para la clave `modo_tipo_cambio`.
4. THE Sistema SHALL incluir un script de migración SQL independiente y verificable en `base-datos/migraciones/` que pueda ejecutarse de forma idempotente.

---

### Requisito 9: Extensión del servicio de API del frontend

**Historia de usuario:** Como sistema, quiero que el servicio centralizado de API del frontend exponga funciones para obtener y actualizar el modo de tipo de cambio y para consultar el tipo de cambio automático, para mantener todos los contratos de API centralizados y evitar URLs hardcodeadas en componentes.

#### Criterios de aceptación

1. THE api_js SHALL exponer la función `obtenerTipoCambioAutomatico()` que realiza una petición GET al endpoint `/tipo-cambio/automatico` del backend.
2. THE api_js SHALL exponer la función `obtenerConfiguracion()` que retorna en una sola petición el margen de ganancia, la tasa de IGV, el tipo de cambio manual y el modo de tipo de cambio activo.
3. THE api_js SHALL exponer la función `actualizarModoTipoCambio(modo)` que realiza una petición PUT al endpoint `/configuracion/tipo-cambio` con el nuevo modo.
4. WHEN cualquier función del api_js recibe un error de red o HTTP, THE api_js SHALL lanzar un objeto de error con la propiedad `mensaje` en español.
5. THE api_js SHALL NO contener URLs de endpoints hardcodeadas fuera de la constante `API_BASE_URL`.

---

### Requisito 10: Seguridad del token de la API externa

**Historia de usuario:** Como administrador del sistema, quiero que el token de autenticación de decolecta.com nunca sea expuesto al navegador del cliente, para proteger las credenciales del servicio externo ante usuarios no autorizados.

#### Criterios de aceptación

1. THE Proxy_Tipo_Cambio SHALL leer el token de la API externa exclusivamente desde la variable de entorno `APIS_NET_TOKEN` del servidor Node.js/Express.
2. THE Sistema SHALL NO incluir el token de la API externa en ninguna respuesta HTTP enviada al cliente.
3. THE Sistema SHALL NO incluir el token de la API externa en el código fuente del frontend ni en variables de entorno con prefijo `VITE_`.
4. IF la variable de entorno `APIS_NET_TOKEN` no está definida al iniciar el servidor, THEN THE Servidor SHALL registrar un mensaje de advertencia en el log de inicio indicando que el modo automático no estará disponible.
5. THE Proxy_Tipo_Cambio SHALL aplicar autenticación de administrador antes de procesar la petición, de modo que solo usuarios autenticados puedan forzar una actualización del tipo de cambio.

---

### Requisito 11: Estados de carga, error y éxito en la UI

**Historia de usuario:** Como Admin, quiero que la interfaz me informe claramente el estado de las operaciones relacionadas con el tipo de cambio, embalaje y flete, para saber en todo momento si los datos son confiables y si las acciones se completaron correctamente.

#### Criterios de aceptación

1. WHEN el Hook_Tipo_Cambio está obteniendo el tipo de cambio desde el Proxy_Tipo_Cambio, THE AdminConfiguracion SHALL mostrar un indicador de carga en el área del tipo de cambio automático.
2. WHEN el Hook_Tipo_Cambio obtiene exitosamente el tipo de cambio, THE AdminConfiguracion SHALL mostrar el valor obtenido junto con la fecha y hora de la última actualización.
3. IF el Hook_Tipo_Cambio no puede obtener el tipo de cambio y usa un valor de respaldo, THE AdminConfiguracion SHALL mostrar una advertencia visible indicando que el valor puede estar desactualizado y la fuente del valor de respaldo.
4. WHEN el Admin guarda la configuración de modo de tipo de cambio exitosamente, THE AdminConfiguracion SHALL mostrar una notificación de éxito con el modo guardado.
5. WHEN el Admin activa o desactiva Embalaje o Flete en el Cotizador, THE Resumen_Financiero SHALL actualizarse de forma inmediata sin indicador de carga, dado que el cálculo es local.
6. THE Cotizador SHALL mostrar el estado de carga mientras obtiene el tipo de cambio automático antes de renderizar montos en PEN.
