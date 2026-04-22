# Plan de Implementacion: Asistente IA NSG Concierge (v2.0)

## Vision general

Migracion del asistente IA existente (v1) a la arquitectura v2 completa: nuevas tablas BD, servicios backend orquestados con loop Double-Check, endpoints REST v2, hook `useAsistenteIA`, subcomponentes React con Apple HIG, semaforo de capacidades, quick replies, typing indicator, boton de asesor humano y ruta de upgrade. Se reutilizan `servicioCompatibilidad.js` y el sistema de tipo de cambio existentes.

---

## Tareas

- [x] 1. Migracion de base de datos - tablas v2
  - Crear `base-datos/migraciones/002_asistente_ia_tablas.sql` con las tres tablas nuevas: `asistente_sesiones`, `asistente_mensajes`, `asistente_configuraciones`.
  - Incluir todos los indices (`idx_asistente_sesiones_usuario`, `idx_asistente_sesiones_sesion`, `idx_asistente_mensajes_sesion`, `idx_asistente_config_sesion`).
  - La migracion debe ser idempotente (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
  - Incluir comentarios en espanol en cada campo.
  - _Requisitos: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [x] 2. Variables de entorno y configuracion del backend
  - Agregar al `backend/.env` las variables: `GEMINI_API_KEY`, `GEMINI_MODEL`, `ASISTENTE_MAX_INTENTOS_VALIDACION`, `ASISTENTE_RATE_LIMIT_POR_IP`, `ASISTENTE_HISTORIAL_DIAS`, `WHATSAPP_NUMERO_ASESOR`.
  - Documentar cada variable con comentario en `backend/.env`.
  - _Requisitos: 15.2, 15.3, 18.7_

- [x] 3. Implementar `backend/src/servicios/servicioLLM.js`
  - Crear wrapper de Google Gemini con `GEMINI_API_KEY` y `GEMINI_MODEL` desde variables de entorno.
  - Implementar funcion `generar({ systemPrompt, historial, mensajeActual, promptCorreccion })`.
  - Usar `responseMimeType: application/json` para respuesta estructurada.
  - Mapear historial al formato `{ role: user|model, parts }` que espera Gemini.
  - Parsear y retornar el JSON de la respuesta del LLM.
  - _Requisitos: 15.1, 15.2, 15.3_

- [x] 4. Implementar `backend/src/prompts/systemPrompt.js` y `promptCorreccion.js`
  - [x] 4.1 Crear `systemPrompt.js` con funcion `construirSystemPrompt(productos, tipoCambio)`
    - Bloque de identidad: "Hardware Concierge de NSG Latinoamerica".
    - Reglas de analogias para terminos tecnicos.
    - Catalogo de productos como JSON compacto (id, nombre, precio_usd, socket, ram_type, form_factor, wattage, stock).
    - Regla explicita: si un producto esta sin stock y sin disponible_a_pedido, el LLM NO debe proponerlo y debe elegir una alternativa equivalente sin mencionarlo al usuario.
    - Tipo de cambio vigente y regla de mostrar precios en PEN con formato `S/ X,XXX.XX`.
    - Schema JSON exacto de respuesta del LLM (respuesta, quick_replies, semaforo, configuracion_propuesta).
    - Reglas de argumentacion de valor por sol.
    - 2 ejemplos few-shot de conversaciones completas.
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 12.3, 15.4, 15.5, 15.6_
  - [x] 4.2 Crear `promptCorreccion.js` con funcion `construirPromptCorreccion(configuracion, errores)`
    - Incluir los errores especificos de compatibilidad en el prompt.
    - Instruir al LLM a corregir solo los componentes incompatibles.
    - _Requisitos: 3.6, 3.7_

- [x] 5. Implementar `backend/src/servicios/servicioValidacionAsistente.js`
  - Crear funcion `validar(configuracion)` que reutilice la logica de `servicioCompatibilidad.js`.
  - Verificar: socket procesador con placa madre, tipo RAM con placa madre, form factor con case, wattage fuente >= consumo estimado.
  - Retornar `{ valida: boolean, errores: string[], advertencias: string[] }`.
  - _Requisitos: 3.2, 3.3, 3.4, 3.5_

- [x] 6. Implementar `backend/src/servicios/servicioSemaforo.js`
  - Crear funcion `calcular(configuracion)` con el algoritmo de puntuacion del diseno.
  - Implementar helpers: `extraerCapacidadGB(ram)`, `extraerVRAM(gpu)`, `clasificarGPU(gpu)`, `clasificarCPU(procesador)`, `esTipoSSD(almacenamiento)`.
  - Retornar objeto con calificaciones 1-5 para: `gaming`, `edicion_video`, `productividad`, `streaming`, `renderizado_3d`.
  - Garantizar que ninguna calificacion salga del rango [1, 5] (`Math.min(5, ...)`).
  - _Requisitos: 6.1, 6.2, 6.3_

  - [ ]* 6.1 Escribir tests de propiedad para `servicioSemaforo.calcular`
    - **Propiedad 3: Semaforo acotado** - para cualquier configuracion valida, todas las calificaciones del semaforo estan en [1, 5].
    - **Valida: Requisito 6.1, 6.3**

- [x] 7. Implementar `backend/src/servicios/servicioMemoriaPerfil.js`
  - Crear funcion `obtenerPerfilPrevio(usuario_id)` que consulte `asistente_sesiones` y `asistente_configuraciones`.
  - Retornar: perfil_usuario previo, presupuesto_pen previo, configuracion mas reciente.
  - Retornar `null` si el usuario no tiene historial o no esta autenticado.
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Implementar `backend/src/controladores/controladorAsistente.js`
  - [x] 8.1 Implementar funcion `nuevaSesion(req, res)`
    - Crear registro en `asistente_sesiones` con `sesion_id` UUID, `usuario_id` opcional.
    - Consultar perfil previo con `servicioMemoriaPerfil` si hay `usuario_id`.
    - Retornar `{ exito: true, sesion_id }` con status 201.
    - _Requisitos: 16.8, 14.1, 5.1_
  - [x] 8.2 Implementar funcion `procesarMensaje(req, res)`
    - Validar y sanitizar `{ sesion_id, mensaje, usuario_id }`.
    - Guardar mensaje del usuario en `asistente_mensajes`.
    - Obtener historial de la sesion y catalogo de productos.
    - Obtener tipo de cambio vigente de la tabla `configuracion`.
    - Llamar a `servicioLLM.generar` con system prompt construido.
    - Si la respuesta incluye `configuracion_propuesta`, ejecutar `ejecutarDoubleCheck`.
    - Calcular semaforo con `servicioSemaforo.calcular` si hay configuracion valida.
    - Enriquecer configuracion con precios PEN usando tipo de cambio.
    - Guardar respuesta del asistente con metadata en `asistente_mensajes`.
    - Si la BD de productos no esta disponible, retornar mensaje amigable y ofrecer asesor humano.
    - Retornar respuesta completa al frontend.
    - _Requisitos: 16.1, 16.2, 16.3, 3.1, 4.5, 11.1, 11.2, 12.1, 13.6_
  - [x] 8.3 Implementar funcion `ejecutarDoubleCheck(configuracion, sesion_id, intento)`
    - Llamar a `servicioValidacionAsistente.validar`.
    - Si valida: guardar en `asistente_configuraciones` con `validada = true`.
    - Si invalida y `intento < 3`: construir prompt de correccion y reintentar con LLM.
    - Si falla tras 3 intentos: retornar `null` (frontend mostrara asesor humano).
    - _Requisitos: 3.1, 3.6, 3.7, 3.8, 3.9, 8.2_
  - [x] 8.4 Implementar funcion `obtenerHistorial(req, res)`
    - Verificar que `usuario_id` del JWT coincide con el parametro de ruta.
    - Consultar sesiones y mensajes del usuario en los ultimos `ASISTENTE_HISTORIAL_DIAS` dias.
    - Al recuperar una configuracion previa, recalcular precios PEN con el tipo de cambio vigente actual.
    - _Requisitos: 16.7, 14.2, 14.4, 14.5, 18.2_
  - [x] 8.5 Implementar funcion `obtenerSesion(req, res)`
    - Retornar todos los mensajes de una `sesion_id` especifica.
    - Permitir acceso anonimo (sin JWT) usando solo el `sesion_id` como identificador.
    - _Requisitos: 16.7, 14.3_

- [x] 9. Checkpoint - validar backend core
  - Asegurar que todos los servicios y el controlador compilan sin errores.
  - Verificar que la migracion SQL es idempotente ejecutandola dos veces.
  - Asegurar que todos los tests pasan, preguntar al usuario si hay dudas.

- [x] 10. Implementar `backend/src/rutas/rutasAsistente.js` y registrar en servidor
  - [x] 10.1 Crear `rutasAsistente.js` con los 5 endpoints del diseno
    - `POST /nueva-sesion` -> `controladorAsistente.nuevaSesion`
    - `POST /mensaje` -> `controladorAsistente.procesarMensaje`
    - `POST /validar-configuracion` -> `controladorAsistente.validarConfiguracion`
    - `GET /historial/:usuario_id` -> `controladorAsistente.obtenerHistorial` (requiere JWT)
    - `GET /sesion/:sesion_id` -> `controladorAsistente.obtenerSesion`
    - Aplicar `express-rate-limit`: 20 req/min por IP, 60 req/min por usuario autenticado.
    - Aplicar middleware JWT en rutas que lo requieren.
    - _Requisitos: 16.1, 16.4, 16.7, 16.8, 16.9, 16.10, 15.7, 18.1, 18.5_
  - [x] 10.2 Registrar `rutasAsistente.js` en `backend/src/servidor.js`
    - Montar bajo el prefijo `/api/asistente`.
    - _Requisitos: 16.1_

- [x] 11. Tests backend - endpoints v2
  - [x] 11.1 Tests unitarios de `POST /api/asistente/mensaje`
    - Caso: mensaje valido con sesion existente -> respuesta 200 con `exito: true`.
    - Caso: mensaje vacio -> respuesta 400.
    - Caso: sesion invalida (UUID inexistente) -> respuesta 404.
    - Mockear `servicioLLM.generar` para evitar llamadas reales a Gemini.
    - _Requisitos: 21.1_
  - [ ]* 11.2 Tests unitarios de `POST /api/asistente/validar-configuracion`
    - Caso: configuracion valida (socket, RAM, form factor, wattage compatibles) -> `{ valida: true }`.
    - Caso: socket incompatible (AM5 con LGA1700) -> `{ valida: false, errores: [...] }`.
    - Caso: RAM incompatible (DDR5 con placa DDR4) -> `{ valida: false, errores: [...] }`.
    - _Requisitos: 21.2_

- [x] 12. Implementar `frontend/src/servicios/asistente.js`
  - Crear funciones HTTP para los 5 endpoints v2: `nuevaSesion`, `enviarMensaje`, `validarConfiguracion`, `obtenerHistorial`, `obtenerSesion`.
  - Usar la URL base centralizada del proyecto (no hardcodear).
  - Manejar errores HTTP y retornar mensajes estructurados.
  - _Requisitos: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 13. Implementar `frontend/src/hooks/useAsistenteIA.js`
  - Implementar el hook con la firma del diseno: `{ mensajes, cargando, quickReplies, configuracionPropuesta, semaforo, error, enviarMensaje, seleccionarQuickReply, aplicarConfiguracion, reiniciar }`.
  - Consumir `tipoCambioUsdPen`, `autenticado` y `usuario` del `AppContext`.
  - Gestionar estado de sesion: crear nueva sesion al montar si no existe.
  - Ocultar quick replies cuando el usuario empieza a escribir.
  - Manejar errores de red con reintento automatico hasta 2 veces antes de mostrar error al usuario.
  - Tras 2 reintentos fallidos, actualizar estado `error` con mensaje amigable y activar `mostrarAsesor = true`.
  - _Requisitos: 19.2, 19.3, 19.5, 10.6, 13.3, 13.4, 13.5_

- [x] 14. Implementar subcomponentes de `frontend/src/componentes/AsistenteIA/`
  - [x] 14.1 Crear `TypingIndicator.jsx`
    - Tres puntos con `animate-bounce`, `animationDelay` escalonado (0, 0.2s, 0.4s), duracion 0.6s.
    - `role="status"` y `aria-label="El asistente esta escribiendo"`.
    - Respetar `prefers-reduced-motion` deshabilitando la animacion.
    - _Requisitos: 9.2, 9.3, 9.9, 13.1_
  - [x] 14.1b Agregar indicador "Validando configuracion..." en el chat
    - Mostrar mensaje de estado discreto (texto pequeno + spinner SVG) mientras el Double-Check esta en curso.
    - Desaparecer automaticamente cuando el backend retorna la respuesta.
    - Respetar `prefers-reduced-motion` (sin spinner animado si esta activo).
    - _Requisitos: 13.2_
  - [x] 14.2 Crear `QuickReplies.jsx`
    - Burbujas scrolleables horizontalmente con `overflow-x: auto`.
    - `min-height: 44px`, `padding: 8px 16px`, `border-radius: 20px`, borde color accent.
    - Animacion de entrada fade-in 200ms (respetar `prefers-reduced-motion`).
    - Navegacion por teclado: Tab para moverse, Enter para seleccionar.
    - Al seleccionar, llamar `onSeleccionar(texto)` y desaparecer.
    - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7, 9.6_
  - [x] 14.3 Crear `SemaforoCapacidades.jsx`
    - Cinco filas: Gaming, Edicion de Video, Productividad/Oficina, Streaming, Renderizado 3D.
    - Estrellas SVG (`star.fill` / `star`) con `role="img"` y `aria-label="N de 5 estrellas para X"`.
    - Rendering mode "hierarchical": estrellas llenas con `fill-[var(--color-warning)]`, vacias con `stroke-[var(--color-text-muted)]`.
    - Al hacer clic en una fila, llamar `onExplicar(categoria)` para que el asistente explique.
    - Adaptarse a dark mode con system colors semanticos.
    - _Requisitos: 6.1, 6.2, 6.4, 6.5, 6.6, 6.7, 9.1, 20.8_
  - [x] 14.4 Crear `ConfiguracionPropuesta.jsx`
    - Tarjeta con lista de componentes y precios en PEN (`S/ X,XXX.XX`).
    - Icono de validacion exitosa SVG (`checkmark.circle.fill`) cuando `validada = true`.
    - Seccion de advertencias (productos a pedido) con estilo warning.
    - Boton "Aplicar configuracion" que llama `onAplicar()`.
    - _Requisitos: 3.8, 4.1, 4.5, 11.2, 12.2_
  - [x] 14.5 Crear `MensajeAsistente.jsx` y `MensajeUsuario.jsx`
    - Burbujas con `border-radius: 24px 24px 24px 4px` (asistente) y `24px 24px 4px 24px` (usuario).
    - `max-width: 80%`, `padding: 12px 16px`, `shadow-hig3` en burbuja asistente.
    - Burbuja usuario: `bg-[var(--color-accent)]`, texto blanco.
    - Timestamp en `text-[11px]` alineado segun el rol.
    - _Requisitos: 9.4, 9.5, 9.1_
  - [x] 14.6 Crear `BotonAsesorHumano.jsx`
    - Boton visible durante toda la conversacion con icono SVG (`person.crop.circle.badge.questionmark`).
    - Construir URL de WhatsApp con `WHATSAPP_NUMERO_ASESOR` y mensaje pre-llenado que incluye: nombre del usuario (si autenticado), perfil identificado, presupuesto, resumen de requisitos.
    - `min-height: 44px`, accesible por teclado, ARIA label descriptivo.
    - _Requisitos: 8.1, 8.3, 8.4, 8.5_
  - [x] 14.7 Crear `RutaUpgrade.jsx`
    - Seccion colapsable con componente de mayor potencial de upgrade (RAM o GPU).
    - Mostrar costo aproximado en PEN de upgrades comunes.
    - Mencionar slots disponibles (M.2, RAM) si la placa madre los tiene.
    - Advertir si procesador o placa madre limitan upgrades futuros.
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 15. Refactorizar `frontend/src/componentes/AsistenteIA.jsx` (v2)
  - Convertir a componente raiz que orquesta todos los subcomponentes de `AsistenteIA/`.
  - Integrar `useAsistenteIA` hook para toda la logica de estado y comunicacion.
  - Consumir `AppContext` para `tipoCambioUsdPen`, `autenticado`, `usuario`.
  - Mostrar `TypingIndicator` mientras `cargando === true`.
  - Mostrar `QuickReplies` cuando `quickReplies.length > 0` y el usuario no esta escribiendo.
  - Mostrar `SemaforoCapacidades` y `ConfiguracionPropuesta` cuando `configuracionPropuesta !== null`.
  - Mostrar `RutaUpgrade` junto a la configuracion propuesta.
  - Mantener `BotonAsesorHumano` visible durante toda la conversacion.
  - Ofrecer continuar conversacion previa si el usuario autenticado tiene historial.
  - Icono de envio SVG (`paperplane.fill`), input con `border-radius: 24px`, `min-height: 44px`.
  - Dark mode completo, navegacion por teclado, ARIA roles correctos.
  - _Requisitos: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 9.7, 9.8, 9.9, 9.10, 9.11, 14.2_

- [x] 16. Checkpoint - validar integracion frontend-backend
  - Asegurar que el componente AsistenteIA v2 se monta sin errores.
  - Verificar que el flujo completo (nueva sesion -> mensaje -> quick replies -> configuracion -> semaforo) funciona end-to-end.
  - Asegurar que todos los tests pasan, preguntar al usuario si hay dudas.

- [x] 17. Tests frontend
  - [x] 17.1 Tests del componente `AsistenteIA` v2
    - Renderizado inicial: muestra mensaje de bienvenida y boton de asesor humano.
    - Envio de mensaje: aparece burbuja de usuario y typing indicator.
    - Quick replies: se muestran y al seleccionar uno envia el mensaje.
    - Typing indicator: aparece durante carga y desaparece al recibir respuesta.
    - Mockear `useAsistenteIA` para aislar el componente.
    - _Requisitos: 21.4_
  - [ ]* 17.2 Tests del hook `useAsistenteIA`
    - Estado de carga: `cargando` es `true` durante la llamada y `false` al terminar.
    - Manejo de error: `error` se actualiza con mensaje amigable ante fallo de red.
    - Actualizacion de mensajes: `mensajes` crece con cada intercambio.
    - Mockear `servicios/asistente.js` para aislar el hook.
    - _Requisitos: 21.5_
  - [ ]* 17.3 Tests de accesibilidad
    - Navegacion por teclado: Tab llega a todos los elementos interactivos.
    - ARIA labels: typing indicator, semaforo, boton de asesor tienen labels descriptivos.
    - Quick replies: navegables con Tab y activables con Enter.
    - _Requisitos: 21.6_

- [x] 18. Checkpoint final - asegurar calidad completa
  - Ejecutar todos los tests del backend y frontend.
  - Verificar que las rutas v1 (`/api/ia/iniciar`, `/api/ia/continuar`) siguen funcionando para no romper compatibilidad.
  - Verificar dark mode y `prefers-reduced-motion` en el componente refactorizado.
  - Asegurar que todos los tests pasan, preguntar al usuario si hay dudas.

- [ ]* 19. Crear documentacion de iconografia SVG
  - Crear archivo `frontend/src/componentes/AsistenteIA/ICONOGRAFIA.md` listando todos los iconos SVG usados.
  - Documentar: nombre del icono, SF Symbol equivalente, proposito, componente donde se usa.
  - _Requisitos: 20.10_

---

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP mas rapido.
- Cada tarea referencia requisitos especificos para trazabilidad.
- Los tests de backend deben mockear `servicioLLM.generar` para evitar costos reales de API.
- Las rutas v1 (`/api/ia/*`) deben mantenerse intactas durante la migracion para no romper el frontend v1 hasta que el refactor este completo.
- El loop Double-Check es interno al backend; el frontend nunca ve configuraciones no validadas.
- La propiedad de correctitud "Semaforo acotado" (Propiedad 3 del diseno) es la mas adecuada para PBT dado su naturaleza universal y cuantificable.
ouble-Check es interno al backend; el frontend nunca ve configuraciones no validadas.








