# Documentación de Casos de Uso — NSG Cotizador

**Sistema:** NSG Cotizador — Sistema Semiautomatizado de Cotización y Catalogación de Componentes
**Empresa:** NSG LATINOAMERICA E.I.R.L.
**Autores:** Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian
**Versión:** 1.0 — 2026

Este documento describe en formato tabla (plantilla RF-01) los casos de uso de los dos diagramas entregados:

1. **Diagrama de Casos de Uso del Sistema** → `diagrama-casos-uso-sistema-nsg.drawio` (casos **RF-01** a **RF-09**).
2. **Diagrama de Casos de Uso de Negocio** → `diagrama-casos-uso-negocio-nsg.drawio` (casos **CUN-01** a **CUN-11**, con relaciones `«include»` y `«extend»`).

**Actores:** Administrador (a la izquierda), Vendedor, Cliente y Servicio de IA (a la derecha).

---

# PARTE 1 — Diagrama de Casos de Uso del Sistema

**Criterio de modelado:** el **Administrador tiene acceso total al sistema**, por eso se asocia a **todos los casos de uso**. Los actores operativos (Vendedor, Cliente, Servicio de IA) se conectan únicamente a los casos que ejecutan según su rol. El acceso/login (RF-01) es una **precondición transversal**, por eso **no se dibuja como caso de uso** en el diagrama; se conserva en esta documentación por completitud.

| Caso de Uso | Actor(es) que se conectan | Observación |
|---|---|---|
| RF-02 — Gestionar Inventario | Administrador | Exclusivo de gestión |
| RF-03 — Actualizar Precios | Administrador | Exclusivo de gestión |
| RF-07 — Visualizar Dashboard | Administrador | Panel de gestión / métricas |
| RF-04 — Crear Cotización | Administrador + Vendedor | Rol operativo central |
| RF-05 — Solicitar Recomendación de IA | Administrador + Vendedor + Servicio de IA | La IA es actor secundario: reacciona, no inicia |
| RF-06 — Generar Reporte PDF | Administrador + Vendedor | — |
| RF-08 — Visualizar / Recibir Cotización | Administrador + Vendedor + Cliente | El Cliente recibe/descarga |
| RF-09 — Consultar Catálogo | Administrador + Vendedor + Cliente | El Cliente consulta el catálogo público |

**Nota:** RF-01 (Acceso) queda fuera del diagrama por ser precondición. El Administrador participa en todos los casos por su acceso total; el Cliente es un actor **externo** (no inicia sesión interna, solo consulta el catálogo y recibe su cotización).

**Relaciones del diagrama:** RF-04 `«include»` RF-09 · RF-05 `«extend»` RF-04 · RF-06 `«extend»` RF-04.

---

## RF-01 — Acceso a la Aplicación

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Acceso Controlado a la Aplicación Software. |
| **Requisitos asociados** | RI-01: Información de los Usuarios. |
| **Descripción** | El sistema deberá comportarse como se describe en el siguiente caso de uso cuando un usuario decida acceder a la aplicación. |
| **Precondición** | El usuario dispone de un nombre de usuario y una contraseña, y tiene el acceso habilitado. |
| **Postcondición** | Si el nombre de usuario y la contraseña son correctos, accede a la pantalla de inicio de la aplicación. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Ninguno. |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El usuario solicita al sistema entrar en la aplicación. |
| 2 | El sistema solicita al usuario que introduzca el nombre de usuario y su contraseña. |
| 3 | El usuario introduce su nombre y su contraseña. |
| 4 | El sistema comprueba los datos introducidos. |
| 5 | Si los datos son correctos, el sistema muestra la página de inicio de la aplicación. |

**Excepciones**

| Paso | Acción |
|---|---|
| 5 | Si el nombre de usuario no es correcto, el sistema muestra un mensaje. Ir al paso 2. |
| 5 | Si la contraseña no es correcta, el sistema muestra un mensaje. Ir al paso 2. |
| 5 | Si el usuario no tiene el acceso habilitado, el sistema muestra un mensaje. Ir al paso 2. |

---

## RF-02 — Gestionar Inventario

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-02: Estandarización Técnica del 100% de las Fichas Técnicas. |
| **Requisitos asociados** | RF-01: Acceso a la Aplicación. |
| **Descripción** | El sistema deberá comportarse como se describe cuando un administrador decide gestionar el inventario de componentes del catálogo. |
| **Precondición** | El administrador ha iniciado sesión con credenciales válidas y permisos elevados. |
| **Postcondición** | El inventario queda actualizado y los cambios quedan disponibles para cotizaciones futuras. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Carga inicial realizada con 873 componentes y periféricos (Cap. IV, sección 4.5.2). |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El administrador accede al módulo de gestión de inventario desde el panel principal. |
| 2 | El sistema muestra la lista de componentes y periféricos registrados con sus datos técnicos básicos. |
| 3 | El administrador selecciona una operación: crear, editar o eliminar un componente. |
| 4 | El sistema solicita los datos técnicos del componente (nombre, categoría, socket, TDP, precio base, stock). |
| 5 | El administrador ingresa los datos del componente. |
| 6 | El sistema valida la información técnica ingresada. |
| 7 | El sistema registra el componente en la base de datos PostgreSQL. |
| 8 | El sistema confirma la operación exitosamente y actualiza la lista visible. |

**Excepciones**

| Paso | Acción |
|---|---|
| 6 | Si algún dato técnico es inválido o está vacío, el sistema muestra un mensaje de error. Ir al paso 4. |
| 7 | Si ocurre un error en la base de datos, el sistema muestra un mensaje. Ir al paso 2. |

---

## RF-03 — Actualizar Precios

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos de Respuesta al Cliente. OBJ-02: Estandarización Técnica del 100% de las Fichas Técnicas. |
| **Requisitos asociados** | RF-01: Acceso a la Aplicación. RF-02: Gestionar Inventario. |
| **Descripción** | El sistema deberá permitir al administrador actualizar los precios base, márgenes de ganancia e impuestos aplicados a los componentes del catálogo. |
| **Precondición** | El administrador ha iniciado sesión y existe al menos un componente registrado en el inventario. |
| **Postcondición** | Los precios y márgenes quedan actualizados y disponibles para las nuevas cotizaciones. |
| **Importancia** | Importante |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Forma parte del protocolo de sostenibilidad operativa: actualización semanal de precios y stock (Cap. IV, sección 4.2.2). |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El administrador accede al módulo de configuración de precios. |
| 2 | El sistema muestra la lista de componentes con sus precios actuales y márgenes aplicados. |
| 3 | El administrador selecciona un componente o aplica un cambio masivo por categoría. |
| 4 | El sistema muestra el detalle del precio base, margen e impuesto del componente. |
| 5 | El administrador actualiza el precio base, el margen o el impuesto. |
| 6 | El sistema valida que los nuevos valores sean numéricos y positivos. |
| 7 | El sistema registra la actualización en la base de datos. |
| 8 | El sistema confirma la operación y muestra el nuevo precio calculado. |

**Excepciones**

| Paso | Acción |
|---|---|
| 6 | Si el valor ingresado no es numérico o es negativo, el sistema muestra un mensaje. Ir al paso 5. |
| 7 | Si ocurre un error en la base de datos, el sistema muestra un mensaje. Ir al paso 2. |

---

## RF-04 — Crear Cotización

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos de Respuesta al Cliente. OBJ-03: Validación Automática de Compatibilidad entre Componentes. |
| **Requisitos asociados** | RF-01: Acceso a la Aplicación. RF-02: Gestionar Inventario. RF-09: Consultar Catálogo `«include»`. |
| **Descripción** | El sistema deberá permitir al vendedor (o administrador) crear una cotización técnica de componentes para un cliente, integrando validación de compatibilidad y cálculo automatizado de precios. |
| **Precondición** | El usuario ha iniciado sesión y existe al menos un componente registrado en el catálogo. |
| **Postcondición** | La cotización queda registrada, validada y disponible para generar el reporte PDF o continuar su edición. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Caso central del sistema. Redujo el tiempo de emisión de proformas de 66 a menos de 2 minutos (Cap. IV, sección 4.5.4). |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El usuario accede al módulo de cotización desde el panel principal. |
| 2 | El sistema muestra el catálogo de componentes disponibles filtrables por categoría y socket. |
| 3 | El usuario selecciona los componentes que conformarán la cotización. |
| 4 | El sistema valida automáticamente la compatibilidad técnica entre los componentes seleccionados (Socket, RAM, TDP). |
| 5 | El sistema calcula el precio total aplicando márgenes de ganancia, descuentos e impuestos. |
| 6 | El usuario revisa el resumen financiero y los datos del cliente. |
| 7 | El usuario confirma la cotización. |
| 8 | El sistema registra la cotización en la base de datos con un código único. |
| 9 | El sistema muestra la cotización generada y la opción de generar el reporte PDF. |

**Excepciones**

| Paso | Acción |
|---|---|
| 4 | Si los componentes seleccionados son incompatibles, el sistema muestra una alerta y bloquea el avance. Ir al paso 3. |
| 7 | Si ocurre un error en la base de datos, el sistema muestra un mensaje. Ir al paso 2. |

---

## RF-05 — Solicitar Recomendación de IA

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos. OBJ-02: Estandarización Técnica. OBJ-03: Validación de Compatibilidad. |
| **Requisitos asociados** | RF-01: Acceso a la Aplicación. RF-04: Crear Cotización (`«extend»`). |
| **Descripción** | El sistema deberá permitir al vendedor solicitar al asistente de IA recomendaciones de componentes según presupuesto, uso previsto y compatibilidad requerida. |
| **Precondición** | El vendedor ha iniciado sesión y el catálogo de componentes está cargado en la base de datos. |
| **Postcondición** | El vendedor recibe recomendaciones técnicas validadas, aplicables a su cotización. |
| **Importancia** | Importante |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Arquitectura multimodelo: Gemini 2.5 Flash (generativo), Llama 3.2 (clasificación), NV-Embed (embeddings), Rerank QA Mistral (reordenamiento) y Mistral Small (respaldo). |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El vendedor accede al módulo del asistente de IA desde el cotizador. |
| 2 | El sistema muestra la interfaz conversacional del asistente. |
| 3 | El vendedor ingresa una consulta en lenguaje natural describiendo presupuesto, uso previsto y preferencias. |
| 4 | El sistema envía la consulta al Servicio de IA externo (Google Gemini 2.5 Flash). |
| 5 | El Servicio de IA procesa la consulta, clasifica los componentes (Llama 3.2) y reordena resultados (Rerank QA Mistral). |
| 6 | El sistema recibe y muestra al vendedor las recomendaciones con su justificación técnica. |
| 7 | El vendedor selecciona los componentes sugeridos para incluirlos en la cotización. |
| 8 | El sistema registra la selección y redirige al módulo de cotización. |

**Excepciones**

| Paso | Acción |
|---|---|
| 5 | Si el Servicio de IA principal no responde, el sistema activa el modelo de respaldo (Mistral Small). Volver al paso 4. |
| 6 | Si la consulta no genera resultados relevantes, el sistema sugiere reformular la consulta. Volver al paso 3. |

---

## RF-06 — Generar Reporte PDF

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-02: Estandarización Técnica del 100% de las Fichas Técnicas. |
| **Requisitos asociados** | RF-01: Acceso a la Aplicación. RF-04: Crear Cotización (`«extend»`). |
| **Descripción** | El sistema deberá generar automáticamente un documento PDF profesional con los detalles de la cotización, incluyendo identidad corporativa, código único, fecha de caducidad y especificaciones técnicas. |
| **Precondición** | Existe una cotización registrada y confirmada en el sistema. |
| **Postcondición** | El documento PDF queda disponible para descarga y entrega al cliente. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | El Cliente recibe y descarga el PDF pero no lo genera. Generación automatizada mediante PDFKit en el backend (Cap. IV, sección 4.1.4). |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El vendedor accede al detalle de la cotización confirmada. |
| 2 | El sistema muestra la opción de generar el reporte PDF. |
| 3 | El vendedor solicita la generación del reporte PDF. |
| 4 | El sistema compila la información de la cotización (cliente, componentes, precios, márgenes). |
| 5 | El sistema genera el documento PDF con la librería PDFKit en el backend Node.js. |
| 6 | El sistema incluye: logotipo, datos de contacto, código único, fecha de caducidad y fichas técnicas. |
| 7 | El sistema almacena el documento generado y notifica su disponibilidad. |
| 8 | El sistema ofrece la descarga del PDF al vendedor para su entrega al cliente. |

**Excepciones**

| Paso | Acción |
|---|---|
| 5 | Si ocurre un error en la generación del PDF, el sistema muestra un mensaje. Volver al paso 3. |
| 8 | Si la descarga falla por conexión, el sistema permite reintentar la operación. |

---

## RF-07 — Visualizar Dashboard

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos de Respuesta al Cliente. |
| **Requisitos asociados** | RF-01: Acceso a la Aplicación. |
| **Descripción** | El sistema deberá permitir al administrador y al vendedor visualizar un panel con indicadores de gestión y métricas del proceso de cotización. |
| **Precondición** | El usuario ha iniciado sesión en el sistema con credenciales válidas. |
| **Postcondición** | El usuario visualiza indicadores actualizados del desempeño del sistema. |
| **Importancia** | Importante |
| **Urgencia** | Postergado |
| **Comentarios** | Caso pendiente de implementación; se incluye en el diagrama como funcionalidad prevista. |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El usuario accede al módulo de dashboard desde el panel principal. |
| 2 | El sistema recupera las métricas operativas del sistema. |
| 3 | El sistema muestra: total de cotizaciones, cotizaciones pendientes, ventas del periodo y componentes más cotizados. |
| 4 | El usuario aplica filtros por periodo de tiempo o categoría de producto. |
| 5 | El sistema actualiza los indicadores mostrados según los filtros aplicados. |

**Excepciones**

| Paso | Acción |
|---|---|
| 2 | Si ocurre un error al recuperar las métricas, el sistema muestra un mensaje. Ir al paso 1. |
| 5 | Si los filtros no retornan datos en el periodo, el sistema muestra un estado vacío. |

---

## RF-08 — Visualizar / Recibir Cotización

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos de Respuesta al Cliente. |
| **Requisitos asociados** | RF-01: Acceso a la Aplicación. RF-04: Crear Cotización. |
| **Descripción** | El sistema deberá permitir al vendedor visualizar el detalle de las cotizaciones generadas y al cliente recibir y descargar la cotización en formato PDF. |
| **Precondición** | Existe al menos una cotización registrada en el sistema. |
| **Postcondición** | El usuario visualiza o descarga los detalles completos de la cotización. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Beneficio técnico no cuantificable: historial de cotizaciones para NSG LATINOAMERICA E.I.R.L. (Cap. VI, sección 6.1). |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El usuario accede al historial o módulo de cotizaciones. |
| 2 | El sistema muestra la lista de cotizaciones disponibles con su estado. |
| 3 | El usuario selecciona una cotización de la lista. |
| 4 | El sistema muestra el detalle completo de la cotización. |
| 5 | El usuario descarga el PDF asociado (cliente) o continúa con el seguimiento comercial (vendedor). |

**Excepciones**

| Paso | Acción |
|---|---|
| 2 | Si no hay cotizaciones registradas, el sistema muestra un estado vacío. |
| 4 | Si la cotización seleccionada ya no existe, el sistema muestra un mensaje. Volver al paso 2. |

---

## RF-09 — Consultar Catálogo

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-02: Estandarización Técnica del 100% de las Fichas Técnicas. |
| **Requisitos asociados** | RF-01: Acceso a la Aplicación. |
| **Descripción** | El sistema deberá permitir al vendedor y al cliente consultar el catálogo de componentes y periféricos disponibles, aplicando filtros por categoría, marca, precio y compatibilidad. |
| **Precondición** | El usuario ha iniciado sesión y el catálogo de componentes está cargado en la base de datos. |
| **Postcondición** | El usuario obtiene la información técnica y comercial del componente consultado. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Catálogo centralizado con 873 componentes y periféricos cargados inicialmente (Cap. IV, sección 4.5.2). |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El usuario accede al módulo de catálogo desde el panel principal. |
| 2 | El sistema muestra la lista de componentes disponibles con paginación. |
| 3 | El usuario aplica filtros por categoría, marca, rango de precio o tipo de socket. |
| 4 | El sistema muestra los componentes que cumplen los criterios de búsqueda. |
| 5 | El usuario selecciona un componente de la lista. |
| 6 | El sistema muestra la ficha técnica detallada del componente. |

**Excepciones**

| Paso | Acción |
|---|---|
| 4 | Si ningún componente cumple los filtros, el sistema muestra un estado vacío. |
| 6 | Si el componente seleccionado no existe, el sistema muestra un mensaje. Volver al paso 2. |

---

# PARTE 2 — Diagrama de Casos de Uso de Negocio

Representa el proceso de negocio de cotización y catalogación desde la perspectiva de la empresa, usando relaciones `«include»` (subproceso siempre ejecutado) y `«extend»` (subproceso opcional/condicional).

| Caso de Negocio | Actor(es) | Relaciones |
|---|---|---|
| CUN-01 — Solicitar Cotización | Cliente | — |
| CUN-02 — Consultar Catálogo de Componentes | Cliente, Vendedor, Administrador | — |
| CUN-03 — Atender y Elaborar Cotización | Vendedor | `«include»` CUN-02, CUN-04, CUN-05, CUN-06 · `«extend»` CUN-07 |
| CUN-04 — Validar Compatibilidad Técnica | (incluido por CUN-03) | — |
| CUN-05 — Calcular Presupuesto | (incluido por CUN-03) | — |
| CUN-06 — Emitir Proforma PDF | (incluido por CUN-03) | — |
| CUN-07 — Asistir Selección con IA | Servicio de IA | `«extend»` CUN-03 |
| CUN-08 — Entregar Proforma al Cliente | Vendedor, Cliente | `«extend»` ← CUN-09 |
| CUN-09 — Realizar Seguimiento Comercial | Vendedor | `«extend»` CUN-08 |
| CUN-10 — Gestionar Catálogo Técnico | Administrador | `«include»` CUN-11 |
| CUN-11 — Actualizar Precios y Márgenes | (incluido por CUN-10) | — |

**Trazabilidad con el sistema:** CUN-03 ↔ RF-04 · CUN-04 ↔ validación en RF-04 · CUN-05 ↔ cálculo en RF-04 · CUN-06 ↔ RF-06 · CUN-07 ↔ RF-05 · CUN-08 ↔ RF-08 · CUN-10 ↔ RF-02 · CUN-11 ↔ RF-03 · CUN-02 ↔ RF-09.

---

## CUN-01 — Solicitar Cotización

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos de Respuesta al Cliente. |
| **Actor de negocio** | Cliente. |
| **Descripción** | El proceso inicia cuando el cliente solicita un presupuesto de equipo o componentes a través de un canal de contacto (presencial, WhatsApp o correo). |
| **Precondición** | El cliente tiene una necesidad de equipamiento o componentes informáticos. |
| **Postcondición** | La solicitud queda registrada y deriva al vendedor para su atención. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Disparador del proceso de negocio. Reemplaza el flujo manual disperso en Excel/WhatsApp descrito en el Cap. III. |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El cliente expresa su necesidad de cotización (uso previsto, presupuesto aproximado). |
| 2 | El vendedor recibe la solicitud y registra los requerimientos del cliente. |
| 3 | El proceso deriva a la atención y elaboración de la cotización (CUN-03). |

**Excepciones**

| Paso | Acción |
|---|---|
| 1 | Si la necesidad no corresponde al rubro de la empresa, el vendedor informa al cliente y cierra la solicitud. |

---

## CUN-02 — Consultar Catálogo de Componentes

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-02: Estandarización Técnica del 100% de las Fichas Técnicas. |
| **Actor de negocio** | Cliente, Vendedor, Administrador. |
| **Descripción** | Permite consultar la disponibilidad, especificaciones y precios de los componentes del catálogo técnico centralizado. |
| **Precondición** | El catálogo técnico se encuentra cargado y actualizado. |
| **Postcondición** | El consultante obtiene información técnica y comercial confiable de los componentes. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Subproceso incluido por CUN-03 (toda cotización consulta el catálogo). Corresponde a RF-09. |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El consultante accede al catálogo de componentes. |
| 2 | Aplica filtros por categoría, marca, precio o compatibilidad. |
| 3 | El catálogo devuelve los componentes que cumplen los criterios con su ficha técnica. |

**Excepciones**

| Paso | Acción |
|---|---|
| 3 | Si ningún componente cumple los criterios, se informa la ausencia de resultados. |

---

## CUN-03 — Atender y Elaborar Cotización

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos. OBJ-03: Validación Automática de Compatibilidad. |
| **Actor de negocio** | Vendedor. |
| **Descripción** | Caso de negocio central. El vendedor selecciona componentes y elabora la cotización técnica. **Incluye** la consulta del catálogo (CUN-02), la validación de compatibilidad (CUN-04), el cálculo del presupuesto (CUN-05) y la emisión de la proforma (CUN-06). **Se extiende** opcionalmente con la asistencia de IA (CUN-07). |
| **Precondición** | Existe una solicitud de cotización (CUN-01) y el catálogo está disponible. |
| **Postcondición** | La cotización técnica queda elaborada, validada y lista para entrega. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Núcleo del proceso de innovación. Reduce el tiempo de ciclo de 66 minutos a menos de 2 minutos (Cap. IV). Corresponde a RF-04. |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El vendedor consulta el catálogo de componentes (`«include»` CUN-02). |
| 2 | Selecciona los componentes según los requerimientos del cliente. |
| 3 | El sistema valida la compatibilidad técnica de la configuración (`«include»` CUN-04). |
| 4 | El sistema calcula el presupuesto con márgenes, descuentos e impuestos (`«include»` CUN-05). |
| 5 | (Opcional) El vendedor solicita asistencia de IA para optimizar la selección (`«extend»` CUN-07). |
| 6 | El vendedor confirma la cotización y se emite la proforma (`«include»` CUN-06). |

**Excepciones**

| Paso | Acción |
|---|---|
| 3 | Si la configuración es incompatible, el proceso bloquea el avance y solicita corregir la selección. Volver al paso 2. |

---

## CUN-04 — Validar Compatibilidad Técnica

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-03: Validación Automática de Compatibilidad entre Componentes. |
| **Relación** | `«include»` de CUN-03 (subproceso obligatorio). |
| **Descripción** | Verifica automáticamente la compatibilidad técnica entre los componentes seleccionados (Socket / Placa Madre, RAM, TDP). |
| **Precondición** | Hay al menos dos componentes seleccionados en la cotización. |
| **Postcondición** | La configuración queda marcada como compatible o se reportan los conflictos detectados. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Elimina errores humanos de compatibilidad. Objetivo específico OBJ-03 del proyecto. |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El subproceso recibe la lista de componentes seleccionados. |
| 2 | Compara los atributos técnicos críticos (Socket, RAM, TDP). |
| 3 | Confirma la compatibilidad o reporta los conflictos encontrados. |

**Excepciones**

| Paso | Acción |
|---|---|
| 3 | Si existen incompatibilidades, se notifica a CUN-03 para corregir la selección. |

---

## CUN-05 — Calcular Presupuesto

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos de Respuesta al Cliente. |
| **Relación** | `«include»` de CUN-03 (subproceso obligatorio). |
| **Descripción** | Calcula automáticamente el precio total de la cotización aplicando márgenes de ganancia (Markup), descuentos e IGV. |
| **Precondición** | La configuración de componentes es válida y compatible. |
| **Postcondición** | El presupuesto total queda calculado con precisión, sin errores manuales. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Reemplaza el cálculo manual de márgenes que generaba pérdida de margen (Cap. III). |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El subproceso recibe los componentes confirmados con sus precios base. |
| 2 | Aplica el margen de ganancia configurado por componente o categoría. |
| 3 | Aplica descuentos comerciales e impuestos (IGV). |
| 4 | Devuelve el total calculado a CUN-03. |

**Excepciones**

| Paso | Acción |
|---|---|
| 2 | Si un componente no tiene precio o margen definido, se notifica para completarlo. |

---

## CUN-06 — Emitir Proforma PDF

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-02: Estandarización Técnica del 100% de las Fichas Técnicas. |
| **Relación** | `«include»` de CUN-03 (subproceso obligatorio). |
| **Descripción** | Genera el documento de proforma en PDF con identidad corporativa, código único, fecha de caducidad y especificaciones técnicas estandarizadas. |
| **Precondición** | La cotización está validada y con presupuesto calculado. |
| **Postcondición** | La proforma queda emitida y disponible para entrega al cliente. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Estandariza el 100% de las fichas técnicas. Generación con PDFKit. Corresponde a RF-06. |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El subproceso compila los datos de la cotización (cliente, componentes, precios). |
| 2 | Aplica la plantilla corporativa estandarizada (logotipo, contacto, código, caducidad). |
| 3 | Genera y almacena el documento PDF. |

**Excepciones**

| Paso | Acción |
|---|---|
| 3 | Si ocurre un error en la generación, se reintenta la emisión del documento. |

---

## CUN-07 — Asistir Selección con IA

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos. OBJ-03: Validación de Compatibilidad. |
| **Actor de negocio** | Servicio de IA (Gemini / NVIDIA). |
| **Relación** | `«extend»` de CUN-03 (subproceso opcional/condicional). |
| **Descripción** | Cuando el vendedor lo solicita, el Servicio de IA recomienda componentes compatibles según presupuesto y uso previsto, optimizando la selección. |
| **Precondición** | El catálogo está cargado y el vendedor solicita asistencia durante la elaboración. |
| **Postcondición** | El vendedor incorpora recomendaciones técnicas validadas a la cotización. |
| **Importancia** | Importante |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Extensión opcional: la cotización puede completarse sin IA. Corresponde a RF-05. |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El vendedor describe en lenguaje natural el presupuesto y uso previsto. |
| 2 | El Servicio de IA procesa, clasifica y reordena las recomendaciones. |
| 3 | Devuelve las sugerencias con justificación técnica al vendedor. |

**Excepciones**

| Paso | Acción |
|---|---|
| 2 | Si el modelo principal no responde, se activa el modelo de respaldo (Mistral Small). |

---

## CUN-08 — Entregar Proforma al Cliente

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos de Respuesta al Cliente. |
| **Actor de negocio** | Vendedor, Cliente. |
| **Descripción** | El vendedor entrega la proforma generada al cliente, quien la recibe y descarga en formato PDF. **Se extiende** con el seguimiento comercial (CUN-09). |
| **Precondición** | La proforma fue emitida (CUN-06). |
| **Postcondición** | El cliente recibe la proforma estandarizada en un tiempo de respuesta menor a 2 minutos. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Cierra el valor entregado al actor de negocio. Corresponde a RF-08. |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El vendedor comparte la proforma con el cliente por el canal acordado. |
| 2 | El cliente recibe y descarga el documento PDF. |
| 3 | El cliente revisa la propuesta técnica y económica. |

**Excepciones**

| Paso | Acción |
|---|---|
| 2 | Si la entrega falla por conexión, el vendedor reintenta el envío. |

---

## CUN-09 — Realizar Seguimiento Comercial

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos de Respuesta al Cliente. |
| **Actor de negocio** | Vendedor. |
| **Relación** | `«extend»` de CUN-08 (subproceso opcional/condicional). |
| **Descripción** | Cuando la cotización queda pendiente, el vendedor realiza seguimiento comercial al cliente para concretar la venta usando el historial registrado. |
| **Precondición** | Existe una cotización entregada en estado pendiente. |
| **Postcondición** | La oportunidad comercial avanza hacia el cierre o queda registrada para futuro contacto. |
| **Importancia** | Importante |
| **Urgencia** | Postergado |
| **Comentarios** | Extensión opcional habilitada por el historial centralizado de cotizaciones (Cap. VI). |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El vendedor consulta el historial de cotizaciones pendientes. |
| 2 | Contacta al cliente para resolver dudas o ajustar la propuesta. |
| 3 | Actualiza el estado de la cotización según el resultado. |

**Excepciones**

| Paso | Acción |
|---|---|
| 2 | Si el cliente no responde, se reprograma el seguimiento. |

---

## CUN-10 — Gestionar Catálogo Técnico

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-02: Estandarización Técnica del 100% de las Fichas Técnicas. |
| **Actor de negocio** | Administrador. |
| **Descripción** | El administrador mantiene el catálogo técnico centralizado: alta, edición y baja de componentes y periféricos. **Incluye** la actualización de precios y márgenes (CUN-11). |
| **Precondición** | El administrador cuenta con permisos elevados. |
| **Postcondición** | El catálogo técnico queda actualizado y consistente para todo el proceso de cotización. |
| **Importancia** | Vital |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Base del proceso. 873 componentes catalogados inicialmente. Corresponde a RF-02. |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El administrador accede a la gestión del catálogo técnico. |
| 2 | Crea, edita o elimina componentes con sus atributos técnicos (socket, TDP, stock). |
| 3 | Actualiza precios base y márgenes (`«include»` CUN-11). |
| 4 | El catálogo queda registrado y disponible para cotizaciones. |

**Excepciones**

| Paso | Acción |
|---|---|
| 2 | Si los datos técnicos son inválidos, el sistema solicita corregirlos. |

---

## CUN-11 — Actualizar Precios y Márgenes

| Campo | Detalle |
|---|---|
| **Versión** | 1.0 |
| **Autores** | Solano Campos, Luis Francisco; Saldarriaga Mejías, Bruno Favian |
| **Objetivos Asociados** | OBJ-01: Reducción de Tiempos. OBJ-02: Estandarización Técnica. |
| **Relación** | `«include»` de CUN-10 (subproceso obligatorio). |
| **Descripción** | Actualiza precios base, márgenes de ganancia e impuestos de los componentes del catálogo, garantizando cotizaciones rentables y consistentes. |
| **Precondición** | Existe al menos un componente registrado en el catálogo. |
| **Postcondición** | Los precios y márgenes quedan actualizados para las nuevas cotizaciones. |
| **Importancia** | Importante |
| **Urgencia** | Inmediatamente |
| **Comentarios** | Protocolo de sostenibilidad operativa: actualización semanal (Cap. IV, sección 4.2.2). Corresponde a RF-03. |

**Secuencia normal**

| Paso | Acción |
|---|---|
| 1 | El subproceso recibe el componente o categoría a actualizar. |
| 2 | Registra el nuevo precio base, margen o impuesto. |
| 3 | Valida que los valores sean numéricos y positivos. |
| 4 | Confirma la actualización en el catálogo. |

**Excepciones**

| Paso | Acción |
|---|---|
| 3 | Si el valor es inválido o negativo, se solicita corregirlo. |
