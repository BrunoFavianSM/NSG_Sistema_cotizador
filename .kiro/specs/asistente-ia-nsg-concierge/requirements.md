# Documento de Requisitos

## Introducción

Este documento describe los requisitos para la **mejora del Asistente IA "NSG Concierge" (v2.0)**, una evolución del asistente conversacional existente que lo transforma en un concierge de hardware inteligente. Esta versión mejora significativamente la experiencia del usuario no experto al cotizar PCs de manera guiada y personalizada, traduciendo necesidades de estilo de vida en configuraciones técnicas óptimas, validadas automáticamente por compatibilidad, y justificadas económicamente.

El sistema mejora el asistente actual del cotizador existente (React + Tailwind) y utiliza el backend con base de datos de productos, compatibilidades y tipo de cambio USD/PEN ya implementado.

---

## Glosario

- **Asistente_IA**: Componente conversacional inteligente que guía al usuario en la cotización de PCs mediante lenguaje natural.
- **Usuario_No_Experto**: Persona sin conocimientos técnicos profundos de hardware que busca una PC para sus necesidades específicas.
- **Cuestionario_Estilo_Vida**: Serie de preguntas orientadas a experiencia esperada (calidad de juego, multitarea, entorno) en lugar de especificaciones técnicas.
- **Perfil_Usuario**: Clasificación del usuario según sus necesidades: Básico, Intermedio, Avanzado, Gamer Full.
- **Double_Check**: Arquitectura de validación invisible donde la IA propone configuraciones que el backend valida automáticamente antes de mostrarlas al usuario.
- **Loop_Correccion**: Proceso interno donde configuraciones incompatibles se devuelven a la IA para corrección sin mostrar error al usuario.
- **Argumentacion_Valor**: Justificación económica de cada elección de componente explicando el trade-off de precio vs beneficio.
- **Memoria_Perfil**: Capacidad del asistente para reconocer cotizaciones previas del usuario y personalizar recomendaciones.
- **Semaforo_Capacidades**: Visualización con iconos SVG de las capacidades del sistema en diferentes áreas (Gaming, Edición, Productividad, etc.). Usa SF Symbols como `star.fill` para calificaciones de 1 a 5 estrellas.
- **Quick_Replies**: Burbujas de respuesta rápida que aparecen dinámicamente para facilitar la interacción del usuario.
- **Typing_Indicator**: Animación sutil que indica que el asistente está procesando una respuesta.
- **Escalabilidad_Humano**: Funcionalidad para ofrecer contacto con asesor humano por WhatsApp en casos específicos o complejos.
- **Backend_Validacion**: Sistema backend que verifica compatibilidad de componentes (sockets, RAM, form factors, etc.).
- **Configuracion_Propuesta**: Conjunto de IDs de productos propuesto por la IA que debe pasar validación antes de mostrarse.
- **Tipo_Cambio**: Sistema existente que convierte precios de USD a PEN para mostrar al usuario.
- **Base_Datos_Productos**: Base de datos existente con productos, precios en USD, stock y especificaciones técnicas.

---

## Requisitos

### Requisito 1: Identidad y personalidad del asistente

**Historia de usuario:** Como usuario no experto, quiero interactuar con un asistente que hable en mi idioma sin tecnicismos, para entender fácilmente las recomendaciones de hardware.

#### Criterios de aceptación

1. THE Asistente_IA SHALL presentarse como "Hardware Concierge de NSG Latinoamerica".
2. WHEN el Asistente_IA usa un término técnico, THE Asistente_IA SHALL traducirlo inmediatamente con una analogía comprensible para Usuario_No_Experto.
3. THE Asistente_IA SHALL usar ejemplos concretos de uso (jugar, tener Discord y Chrome abiertos) en lugar de especificaciones técnicas abstractas.
4. THE Asistente_IA SHALL mantener un tono amigable, profesional y orientado a soluciones durante toda la conversación.
5. WHEN el usuario hace una pregunta técnica, THE Asistente_IA SHALL responder primero con la explicación práctica y luego con el detalle técnico si es necesario.

---

### Requisito 2: Cuestionario de estilo de vida

**Historia de usuario:** Como usuario no experto, quiero responder preguntas sobre cómo usaré mi PC en lugar de especificaciones técnicas, para obtener una configuración que realmente se ajuste a mis necesidades.

#### Criterios de aceptación

1. WHEN el usuario inicia una cotización, THE Asistente_IA SHALL presentar el Cuestionario_Estilo_Vida con preguntas sobre experiencia esperada.
2. THE Cuestionario_Estilo_Vida SHALL incluir pregunta sobre calidad de juego deseada con opciones: Resolución Estándar (1080p), Alta Calidad (1440p), Ultra/4K.
3. THE Cuestionario_Estilo_Vida SHALL incluir pregunta sobre multitarea: si el usuario planea hacer streaming o grabación mientras juega.
4. THE Cuestionario_Estilo_Vida SHALL incluir pregunta sobre entorno: si necesita una PC silenciosa para trabajar o jugar de noche.
5. THE Cuestionario_Estilo_Vida SHALL incluir pregunta sobre presupuesto aproximado en soles peruanos (PEN).
6. WHEN el usuario completa el Cuestionario_Estilo_Vida, THE Asistente_IA SHALL clasificarlo en uno de los Perfil_Usuario: Básico, Intermedio, Avanzado, Gamer Full.
7. THE Asistente_IA SHALL usar Quick_Replies para las opciones de respuesta del cuestionario cuando sea aplicable.

---

### Requisito 3: Arquitectura de Double-Check y autocorrección

**Historia de usuario:** Como usuario, quiero recibir solo configuraciones válidas y compatibles, para no perder tiempo con errores técnicos que no entiendo.

#### Criterios de aceptación

1. WHEN el Asistente_IA genera una Configuracion_Propuesta, THE Asistente_IA SHALL enviar los IDs de productos al Backend_Validacion antes de mostrarla al usuario.
2. THE Backend_Validacion SHALL verificar compatibilidad de sockets entre procesador y placa madre.
3. THE Backend_Validacion SHALL verificar compatibilidad de tipo de RAM (DDR4/DDR5) entre placa madre y módulos de memoria.
4. THE Backend_Validacion SHALL verificar compatibilidad de form factor entre placa madre y case.
5. THE Backend_Validacion SHALL verificar que la fuente de poder tenga wattage suficiente para la configuración propuesta.
6. IF el Backend_Validacion detecta incompatibilidad, THEN THE Sistema SHALL ejecutar el Loop_Correccion devolviendo la configuración a la IA con detalles del error sin mostrar mensaje al usuario.
7. THE Asistente_IA SHALL corregir automáticamente la incompatibilidad y reenviar la configuración al Backend_Validacion.
8. WHEN el Backend_Validacion confirma compatibilidad completa, THE Asistente_IA SHALL mostrar la configuración al usuario con estado de validación exitosa usando icono SVG (SF Symbol `checkmark.circle.fill`).
9. THE Sistema SHALL limitar el Loop_Correccion a un máximo de 3 intentos; si falla, entonces mostrar mensaje al usuario solicitando ajustar requisitos.

---

### Requisito 4: Argumentación de valor por sol

**Historia de usuario:** Como usuario consciente del presupuesto, quiero entender por qué se eligió cada componente y cómo se optimizó mi inversión, para confiar en la recomendación.

#### Criterios de aceptación

1. WHEN el Asistente_IA presenta una Configuracion_Propuesta, THE Asistente_IA SHALL incluir Argumentacion_Valor para cada componente principal (procesador, GPU, RAM, almacenamiento, fuente).
2. THE Argumentacion_Valor SHALL explicar trade-offs económicos específicos en soles peruanos (PEN).
3. THE Argumentacion_Valor SHALL justificar por qué se eligió un componente sobre alternativas más caras o más baratas.
4. WHEN el Asistente_IA reduce especificaciones en un componente, THE Asistente_IA SHALL explicar en qué otro componente se invirtió el ahorro y por qué beneficia más al usuario.
5. THE Asistente_IA SHALL mostrar el precio total en PEN usando el Tipo_Cambio vigente del sistema existente.
6. WHEN el usuario pregunta por alternativas, THE Asistente_IA SHALL comparar precios y beneficios de forma clara y cuantificada.

---

### Requisito 5: Memoria de perfil y personalización

**Historia de usuario:** Como usuario recurrente, quiero que el asistente recuerde mis cotizaciones anteriores, para recibir recomendaciones personalizadas basadas en mi historial.

#### Criterios de aceptación

1. WHEN un usuario autenticado inicia una nueva cotización, THE Asistente_IA SHALL consultar el historial de cotizaciones previas del usuario.
2. IF el usuario tiene cotizaciones previas, THEN THE Asistente_IA SHALL mencionar el Perfil_Usuario identificado anteriormente y preguntar si desea una configuración similar o diferente.
3. THE Asistente_IA SHALL usar información de cotizaciones previas para ajustar el rango de presupuesto sugerido.
4. WHEN el usuario solicita "algo mejor que la vez anterior", THE Asistente_IA SHALL identificar la cotización previa y proponer mejoras específicas justificadas.
5. THE Sistema SHALL almacenar el Perfil_Usuario identificado en cada cotización para uso futuro.

---

### Requisito 6: Visualización de capacidades con semáforo

**Historia de usuario:** Como usuario no experto, quiero ver de forma visual y simple qué tan buena es la PC propuesta para diferentes usos, para entender rápidamente si cumple mis expectativas.

#### Criterios de aceptación

1. WHEN el Asistente_IA presenta una Configuracion_Propuesta, THE Asistente_IA SHALL mostrar el Semaforo_Capacidades con calificación de 1 a 5 estrellas usando iconos SVG (SF Symbol `star.fill`) para cada categoría.
2. THE Semaforo_Capacidades SHALL incluir las categorías: Gaming, Edición de Video, Productividad/Oficina, Streaming, Renderizado 3D.
3. THE Asistente_IA SHALL calcular la calificación de cada categoría basándose en las especificaciones de los componentes seleccionados.
4. THE Semaforo_Capacidades SHALL actualizarse automáticamente cuando el usuario solicite cambios en la configuración.
5. WHEN el usuario hace clic en una categoría del Semaforo_Capacidades, THE Asistente_IA SHALL explicar por qué la configuración recibió esa calificación y qué componente limita o potencia esa capacidad.
6. THE iconos de estrellas SHALL usar rendering mode "hierarchical" con opacidad variable para estrellas parciales o vacías, siguiendo Apple HIG.
7. THE iconos SHALL ser accesibles con ARIA labels apropiados (ej: "4 de 5 estrellas para Gaming").

---

### Requisito 7: Guía de upgrade futuro

**Historia de usuario:** Como usuario que planea mejorar su PC con el tiempo, quiero saber qué componentes puedo actualizar en el futuro, para tomar una decisión informada sobre escalabilidad.

#### Criterios de aceptación

1. WHEN el Asistente_IA presenta una Configuracion_Propuesta, THE Asistente_IA SHALL incluir una sección de "Ruta de Upgrade" con recomendaciones de mejoras futuras.
2. THE Asistente_IA SHALL identificar el componente con mayor potencial de upgrade (típicamente RAM o GPU).
3. THE Asistente_IA SHALL indicar el costo aproximado en PEN de upgrades comunes (agregar RAM, cambiar GPU, agregar SSD).
4. WHEN la placa madre soporta expansión futura (slots M.2 adicionales, slots RAM libres), THE Asistente_IA SHALL mencionarlo explícitamente como ventaja.
5. THE Asistente_IA SHALL advertir si algún componente (como procesador o placa madre) limitará upgrades futuros significativos.

---

### Requisito 8: Escalabilidad a asesor humano

**Historia de usuario:** Como usuario con necesidades muy específicas o complejas, quiero poder contactar a un asesor humano fácilmente, para recibir atención personalizada cuando el asistente no pueda resolver mi caso.

#### Criterios de aceptación

1. WHEN el Asistente_IA detecta que el usuario tiene requisitos fuera de los perfiles estándar, THE Asistente_IA SHALL ofrecer contacto con asesor humano por WhatsApp.
2. WHEN el Loop_Correccion falla después de 3 intentos, THE Asistente_IA SHALL ofrecer Escalabilidad_Humano automáticamente.
3. WHEN el usuario solicita explícitamente hablar con una persona, THE Asistente_IA SHALL proporcionar enlace directo a WhatsApp con mensaje pre-llenado que incluye el contexto de la conversación.
4. THE Asistente_IA SHALL incluir un botón visible "Hablar con asesor" en la interfaz durante toda la conversación.
5. THE mensaje pre-llenado de WhatsApp SHALL incluir: nombre del usuario (si está autenticado), Perfil_Usuario identificado, presupuesto indicado, y resumen de requisitos especiales.

---

### Requisito 9: Interfaz de usuario con Apple HIG

**Historia de usuario:** Como usuario, quiero una interfaz limpia, moderna y fácil de usar, para tener una experiencia agradable durante la cotización.

#### Criterios de aceptación

1. THE interfaz del Asistente_IA SHALL seguir los principios de diseño de Apple HIG con jerarquía visual clara y minimalista.
2. THE Asistente_IA SHALL mostrar un Typing_Indicator con animación sutil mientras procesa respuestas.
3. THE Typing_Indicator SHALL usar animación de puntos suspensivos con timing de 0.6s por ciclo.
4. THE interfaz SHALL usar bordes redondeados de 24px para las burbujas de mensaje según especificación del usuario.
5. THE interfaz SHALL usar sombras suaves (shadow-sm) para dar profundidad sin ser intrusivas.
6. THE Quick_Replies SHALL aparecer como burbujas con altura mínima de 44px para cumplir touch targets.
7. THE interfaz SHALL soportar dark mode completo con transiciones suaves entre modos usando system colors semánticos.
8. THE interfaz SHALL ser completamente accesible por teclado con indicadores de foco visibles.
9. THE interfaz SHALL respetar `prefers-reduced-motion` deshabilitando animaciones cuando el usuario lo configure.
10. THE interfaz SHALL usar SF Symbols para todos los iconos del sistema (ej: `paperplane.fill` para enviar, `ellipsis.bubble` para typing indicator).
11. THE iconos SHALL usar rendering mode "hierarchical" o "monochrome" según el contexto para mantener consistencia visual.

---

### Requisito 10: Quick Replies dinámicos

**Historia de usuario:** Como usuario móvil, quiero responder rápidamente con opciones predefinidas, para agilizar la conversación sin tener que escribir.

#### Criterios de aceptación

1. WHEN el Asistente_IA hace una pregunta con opciones limitadas, THE Asistente_IA SHALL mostrar Quick_Replies con las opciones disponibles.
2. THE Quick_Replies SHALL aparecer debajo del último mensaje del asistente con animación de entrada sutil (fade-in 200ms).
3. WHEN el usuario selecciona un Quick_Reply, THE Quick_Reply SHALL desaparecer y el texto seleccionado SHALL aparecer como mensaje del usuario.
4. THE Quick_Replies SHALL ser scrolleables horizontalmente cuando no quepan en una línea.
5. THE Quick_Replies SHALL tener altura mínima de 44px y padding horizontal de 16px para cumplir con touch targets.
6. WHEN el usuario comienza a escribir, THE Quick_Replies SHALL ocultarse automáticamente.
7. THE Quick_Replies SHALL ser navegables por teclado (Tab para moverse, Enter para seleccionar).

---

### Requisito 11: Integración con sistema de tipo de cambio

**Historia de usuario:** Como usuario peruano, quiero ver todos los precios en soles (PEN), para entender el costo real sin tener que hacer conversiones mentales.

#### Criterios de aceptación

1. THE Asistente_IA SHALL consultar el Tipo_Cambio vigente del sistema existente (implementado en el spec `sistema-cambio-divisas-cotizacion`).
2. THE Asistente_IA SHALL mostrar todos los precios en soles peruanos (PEN) con formato `S/ X,XXX.XX`.
3. WHEN el Tipo_Cambio se actualiza durante una sesión activa, THE Asistente_IA SHALL recalcular y actualizar los precios mostrados automáticamente.
4. THE Asistente_IA SHALL usar el mismo mecanismo de conversión USD→PEN que el resto del cotizador para mantener consistencia.
5. WHEN el Asistente_IA menciona ahorros o diferencias de precio, THE Asistente_IA SHALL expresarlos en PEN.

---

### Requisito 12: Integración con base de datos de productos

**Historia de usuario:** Como sistema, quiero que el asistente use la base de datos de productos existente, para mantener consistencia de precios y disponibilidad con el resto del cotizador.

#### Criterios de aceptación

1. THE Asistente_IA SHALL consultar la Base_Datos_Productos existente para obtener productos, precios y disponibilidad.
2. THE Asistente_IA SHALL respetar el estado de stock de los productos (disponible, a pedido, sin stock).
3. WHEN un producto está sin stock, THE Asistente_IA SHALL proponer automáticamente una alternativa equivalente sin mencionar el producto no disponible.
4. THE Asistente_IA SHALL usar los precios en USD de la base de datos y convertirlos a PEN usando el Tipo_Cambio.
5. THE Asistente_IA SHALL considerar la información de compatibilidad almacenada en la base de datos (sockets, RAM type, form factors).

---

### Requisito 13: Manejo de estados de carga y error

**Historia de usuario:** Como usuario, quiero saber claramente cuándo el sistema está procesando y cuándo ocurre un error, para entender el estado de mi cotización.

#### Criterios de aceptación

1. WHEN el Asistente_IA está generando una respuesta, THE interfaz SHALL mostrar el Typing_Indicator.
2. WHEN el Backend_Validacion está verificando compatibilidad, THE interfaz SHALL mostrar un indicador de "Validando configuración..." discreto.
3. IF ocurre un error de red o backend, THEN THE Asistente_IA SHALL mostrar un mensaje amigable explicando el problema y ofreciendo reintentar.
4. IF el error persiste después de 2 reintentos, THEN THE Asistente_IA SHALL ofrecer Escalabilidad_Humano.
5. THE Asistente_IA SHALL mantener el contexto de la conversación incluso después de un error, permitiendo al usuario continuar desde donde quedó.
6. WHEN la Base_Datos_Productos no está disponible, THE Asistente_IA SHALL informar al usuario y ofrecer contacto con asesor humano.

---

### Requisito 14: Persistencia de conversación

**Historia de usuario:** Como usuario, quiero que mi conversación con el asistente se guarde, para poder volver más tarde y continuar desde donde quedé.

#### Criterios de aceptación

1. THE Sistema SHALL guardar el historial completo de la conversación del usuario en la base de datos.
2. WHEN un usuario autenticado regresa al cotizador, THE Asistente_IA SHALL ofrecer continuar la conversación anterior o iniciar una nueva.
3. THE Sistema SHALL almacenar el Perfil_Usuario identificado, respuestas del Cuestionario_Estilo_Vida, y configuraciones propuestas.
4. THE Sistema SHALL mantener el historial de conversación por un mínimo de 90 días.
5. WHEN el usuario solicita "mostrar mi última cotización", THE Asistente_IA SHALL recuperar y mostrar la configuración más reciente con precios actualizados.

---

### Requisito 15: Modelo de IA y configuración

**Historia de usuario:** Como administrador del sistema, quiero configurar el modelo de IA y sus parámetros, para optimizar la calidad de las respuestas y controlar costos.

#### Criterios de aceptación

1. THE Sistema SHALL usar un modelo de lenguaje grande (LLM) compatible con OpenAI API o similar.
2. THE Sistema SHALL almacenar la API key del modelo de IA en variable de entorno del servidor, nunca expuesta al cliente.
3. THE Sistema SHALL permitir configurar parámetros del modelo: temperatura, max_tokens, top_p.
4. THE Sistema SHALL incluir un system prompt que define la personalidad, reglas de traducción de tecnicismos, y formato de respuestas del Asistente_IA.
5. THE system prompt SHALL incluir instrucciones para generar Argumentacion_Valor y usar analogías comprensibles.
6. THE Sistema SHALL incluir ejemplos de conversaciones (few-shot learning) en el prompt para mejorar la calidad de respuestas.
7. THE Sistema SHALL implementar rate limiting para prevenir abuso de la API del modelo de IA.

---

### Requisito 16: Endpoint de API para el asistente

**Historia de usuario:** Como sistema frontend, quiero endpoints de API claros y bien definidos para comunicarme con el asistente, para mantener separación de responsabilidades.

#### Criterios de aceptación

1. THE Backend SHALL exponer endpoint `POST /api/asistente/mensaje` para enviar mensajes del usuario al Asistente_IA.
2. THE endpoint `/api/asistente/mensaje` SHALL aceptar: `{ mensaje: string, sesion_id: string, usuario_id?: number }`.
3. THE endpoint `/api/asistente/mensaje` SHALL retornar: `{ respuesta: string, quick_replies?: string[], semaforo?: object, configuracion_propuesta?: object }`.
4. THE Backend SHALL exponer endpoint `POST /api/asistente/validar-configuracion` para ejecutar el Double_Check.
5. THE endpoint `/api/asistente/validar-configuracion` SHALL aceptar: `{ producto_ids: { procesador: number, placa_madre: number, ... } }`.
6. THE endpoint `/api/asistente/validar-configuracion` SHALL retornar: `{ valida: boolean, errores?: string[], sugerencias?: object }`.
7. THE Backend SHALL exponer endpoint `GET /api/asistente/historial/:usuario_id` para recuperar conversaciones previas.
8. THE Backend SHALL exponer endpoint `POST /api/asistente/nueva-sesion` para iniciar una nueva conversación.
9. THE Backend SHALL aplicar autenticación JWT en todos los endpoints del asistente para usuarios autenticados.
10. THE Backend SHALL permitir uso anónimo del asistente con sesión temporal identificada por `sesion_id` UUID.

---

### Requisito 17: Esquema de base de datos para el asistente

**Historia de usuario:** Como sistema, quiero almacenar conversaciones y perfiles de usuario de forma estructurada, para soportar Memoria_Perfil y análisis futuro.

#### Criterios de aceptación

1. THE Sistema SHALL crear tabla `asistente_sesiones` con campos: `id`, `sesion_id` (UUID), `usuario_id` (nullable), `perfil_usuario`, `presupuesto_pen`, `created_at`, `updated_at`.
2. THE Sistema SHALL crear tabla `asistente_mensajes` con campos: `id`, `sesion_id` (FK), `rol` (user/assistant), `contenido`, `metadata` (JSON), `created_at`.
3. THE Sistema SHALL crear tabla `asistente_configuraciones` con campos: `id`, `sesion_id` (FK), `configuracion` (JSON con IDs de productos), `precio_total_usd`, `validada`, `created_at`.
4. THE Sistema SHALL crear índices en `sesion_id` y `usuario_id` para optimizar consultas de historial.
5. THE Sistema SHALL incluir migración SQL verificable e idempotente para crear estas tablas.
6. THE campo `metadata` en `asistente_mensajes` SHALL almacenar información adicional como quick_replies mostrados, semaforo_capacidades, y tiempo de respuesta.

---

### Requisito 18: Seguridad y privacidad

**Historia de usuario:** Como usuario, quiero que mis conversaciones con el asistente sean privadas y seguras, para confiar en el sistema con mi información.

#### Criterios de aceptación

1. THE Sistema SHALL aplicar autenticación JWT para asociar conversaciones a usuarios autenticados.
2. THE Sistema SHALL permitir a usuarios autenticados ver solo sus propias conversaciones.
3. THE Sistema SHALL sanitizar todos los inputs del usuario antes de enviarlos al modelo de IA para prevenir prompt injection.
4. THE Sistema SHALL NO almacenar información sensible (tarjetas de crédito, contraseñas) en el historial de conversaciones.
5. THE Sistema SHALL implementar rate limiting por IP y por usuario para prevenir abuso.
6. THE Sistema SHALL registrar en logs del servidor intentos de acceso no autorizado a conversaciones.
7. THE API key del modelo de IA SHALL almacenarse exclusivamente en variable de entorno del servidor, nunca expuesta al cliente.

---

### Requisito 19: Componente React del asistente

**Historia de usuario:** Como desarrollador frontend, quiero un componente React reutilizable y bien estructurado para el asistente, para facilitar mantenimiento y testing.

#### Criterios de aceptación

1. THE Sistema SHALL crear componente `AsistenteIA.jsx` como componente principal del asistente.
2. THE componente `AsistenteIA` SHALL gestionar estado local de: mensajes, typing indicator, quick replies, configuración propuesta.
3. THE componente `AsistenteIA` SHALL usar custom hook `useAsistenteIA` para lógica de comunicación con backend.
4. THE Sistema SHALL crear subcomponentes: `MensajeAsistente`, `MensajeUsuario`, `QuickReplies`, `SemaforoCapacidades`, `ConfiguracionPropuesta`.
5. THE componente `AsistenteIA` SHALL integrarse con el `AppContext` existente para acceder a `tipoCambioUsdPen` y `autenticado`.
6. THE componente `AsistenteIA` SHALL ser accesible por teclado con navegación lógica entre elementos.
7. THE componente `AsistenteIA` SHALL incluir ARIA labels y roles apropiados para lectores de pantalla.

---

### Requisito 20: Iconografía y sistema de diseño visual

**Historia de usuario:** Como usuario, quiero una interfaz visualmente consistente con iconografía clara y profesional, para tener una experiencia moderna y coherente.

#### Criterios de aceptación

1. THE Sistema SHALL usar SF Symbols o equivalentes SVG para toda la iconografía del asistente.
2. THE Sistema SHALL definir un conjunto de iconos estándar para acciones comunes:
   - Enviar mensaje: `paperplane.fill`
   - Typing indicator: `ellipsis.bubble`
   - Validación exitosa: `checkmark.circle.fill`
   - Error: `exclamationmark.triangle.fill`
   - Asesor humano: `person.crop.circle.badge.questionmark`
   - Configuración guardada: `bookmark.fill`
   - Historial: `clock.arrow.circlepath`
3. THE iconos SHALL usar rendering mode "hierarchical" para iconos con jerarquía visual (ej: badges, indicadores de estado).
4. THE iconos SHALL usar rendering mode "monochrome" para iconos de acción simple (ej: botones de navegación).
5. THE iconos SHALL adaptarse automáticamente a light/dark mode usando system colors.
6. THE iconos SHALL tener tamaño mínimo de 24x24px para cumplir con touch targets en móvil.
7. THE Sistema SHALL usar SF Symbol weights que coincidan con el peso de la tipografía adyacente (regular, medium, semibold).
8. THE iconos de calificación (estrellas) SHALL usar `star.fill` para estrellas completas y `star` para estrellas vacías.
9. THE iconos SHALL incluir ARIA labels descriptivos para accesibilidad (ej: "Enviar mensaje", "Validación exitosa").
10. THE Sistema SHALL mantener un archivo de documentación de iconografía listando todos los SF Symbols usados y su propósito.

---

### Requisito 21: Testing del asistente

**Historia de usuario:** Como desarrollador, quiero pruebas automatizadas del asistente, para garantizar calidad y prevenir regresiones.

#### Criterios de aceptación

1. THE Sistema SHALL incluir pruebas unitarias del endpoint `POST /api/asistente/mensaje` con casos: mensaje válido, mensaje vacío, sesión inválida.
2. THE Sistema SHALL incluir pruebas unitarias del endpoint `POST /api/asistente/validar-configuracion` con casos: configuración válida, incompatibilidad de socket, incompatibilidad de RAM.
3. THE Sistema SHALL incluir pruebas de integración del flujo completo: cuestionario → propuesta → validación → presentación.
4. THE Sistema SHALL incluir pruebas del componente `AsistenteIA` verificando: renderizado de mensajes, envío de mensaje, mostrar quick replies, mostrar typing indicator.
5. THE Sistema SHALL incluir pruebas del custom hook `useAsistenteIA` verificando: estados de carga, manejo de errores, actualización de mensajes.
6. THE Sistema SHALL incluir pruebas de accesibilidad verificando: navegación por teclado, ARIA labels, contraste de colores.
7. THE Sistema SHALL mockear las llamadas al modelo de IA en las pruebas para evitar costos y dependencias externas.


