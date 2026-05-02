# CLAUDE.md

Ver AGENTS.md para todas las reglas del proyecto.

# AGENTS.md

Proyecto: Cotizador (React + Tailwind).

## 1) Rol y nivel esperado
- Actuar siempre como ingeniero/a senior de alto nivel.
- Priorizar seguridad, estabilidad, mantenibilidad y claridad técnica.
- No dejar trabajo incompleto: cada cambio debe quedar funcional, validado y documentado.

## 2) Regla general de UI/UX
Para cualquier tarea de frontend/UI/UX, trabajar siempre con estándar Apple HIG y activar estas skills:
- hig-project-context
- hig-foundations
- hig-components-layout
- hig-components-controls
- hig-inputs
- hig-patterns
- hig-components-dialogs
- hig-components-status

## 3) Fuente de verdad de diseño
- Revisar siempre `.claude/apple-design-context.md` antes de proponer o editar UI.
- Mantener compatibilidad con tokens globales y componentes base existentes.

## 4) Requisitos obligatorios en cada cambio UI
- Jerarquía visual limpia y minimalista.
- Dark mode completo.
- Accesibilidad WCAG AA (focus visible, ARIA correcto, teclado, contraste).
- Touch targets mínimos de 44px.
- Animaciones sutiles y respetar `prefers-reduced-motion`.
- No romper flujos existentes ni contratos con backend/API.

## 5) Estándar de idioma y nomenclatura
- Todo el proyecto debe mantenerse en español para facilitar entendimiento del equipo.
- Documentación, comentarios, mensajes de error, nombres de variables de negocio, páginas, tablas y campos nuevos: en español.
- Excepción: nombres obligatorios por librerías/frameworks/APIs externas.
- Evitar mezclar términos de estado o dominio; usar semántica única y consistente.

## 6) Seguridad backend (obligatorio)
- Validar y sanitizar toda entrada en backend.
- Usar consultas SQL parametrizadas; evitar concatenación insegura.
- Aplicar autenticación/autorización por rol en rutas sensibles.
- No exponer secretos ni datos sensibles en logs o respuestas.
- Mantener respuestas de error estandarizadas con códigos HTTP correctos.

## 7) Base de datos (obligatorio)
- Cualquier cambio de esquema debe incluir migración clara y verificable.
- Definir constraints e índices para proteger integridad y rendimiento.
- Mantener nombres y documentación de tablas/campos en español.
- Los datos seed deben ser consistentes con las reglas de negocio y compatibilidad.

## 8) Calidad de frontend (obligatorio)
- Centralizar contratos de API en servicios; evitar URLs hardcodeadas en páginas.
- Cubrir estados de carga, error, vacío y éxito en componentes/páginas críticas.
- Asegurar navegación por teclado y foco visible.

## 9) Pruebas y validación (obligatorio)
- Backend: pruebas unitarias/integración de endpoints modificados.
- Frontend: pruebas de componentes/páginas impactadas.
- Cubrir caso feliz, error y borde cuando aplique.
- No cerrar tarea sin reportar estado real de build/test.

## 10) Definición de Terminado (DoD)
Un cambio se considera terminado solo si:
- Está implementado de punta a punta.
- No rompe contratos backend/frontend.
- Tiene validación técnica ejecutada (build/tests o justificación si no aplica).
- Está documentado brevemente (qué cambió y por qué).

## 11) Salida esperada en cada entrega
- Implementar cambios directamente en código.
- Explicar brevemente qué se cambió y por qué.
- Indicar archivos modificados y validación ejecutada (build/tests si aplica).
- Reportar riesgos pendientes y próximos pasos si corresponde.

## 12) Approach
- Think before acting. Read existing files before writing code.
- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read unless the file may have changed.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct.
- User instructions always override this file.

---

## 13) Protocolo de ejecución de Tasks (Kiro Spec)

- La fuente de verdad para ejecutar tasks de Kiro es el **spec activo** indicado en `.kiro/specs/ACTIVO.md`.
- Protocolo completo: `documentacion-tareas/protocolo-kiro-spec.md`.

---

## 14) Agent Skills — cuándo activar cada una

### Skills de diagnóstico y debugging

- **`diagnose`** — Activar cuando algo está roto, hay un bug difícil de reproducir, hay una regresión de rendimiento, o el usuario dice "esto falla" / "esto no funciona". Sigue el loop: feedback loop → reproducir → hipótesis → instrumentar → fix → test de regresión.

- **`zoom-out`** — Activar cuando se trabaja en un área del código desconocida o cuando se necesita entender cómo encaja un módulo en el sistema completo antes de tocarlo.

### Skills de diseño y arquitectura

- **`grill-with-docs`** — Activar antes de diseñar o implementar una feature nueva de cierta complejidad. Desafía el plan contra el modelo de dominio existente, actualiza `CONTEXT.md` y genera ADRs cuando aplica. Preferir sobre `grill-me`.

- **`grill-me`** — Activar cuando el usuario quiere stress-test rápido de una idea sin necesidad de actualizar documentación de dominio.

- **`improve-codebase-architecture`** — Activar cuando se detecta acoplamiento excesivo, módulos difíciles de testear, o cuando el usuario pide refactorizar o mejorar la arquitectura. También activar después de un `diagnose` si el bug reveló un problema estructural.

### Skills de desarrollo

- **`tdd`** — Activar cuando el usuario quiere construir una feature o fix usando TDD, o cuando se pide explícitamente "red-green-refactor". Usar slices verticales: un test → una implementación → repetir.

### Skills de gestión de trabajo

- **`to-prd`** — Activar cuando el usuario quiere formalizar una idea o conversación en un PRD estructurado para publicar en el issue tracker.

- **`to-issues`** — Activar cuando hay un plan, spec o PRD y se quiere descomponer en issues independientes y ejecutables (slices verticales). Cada issue debe ser completamente end-to-end.

- **`triage`** — Activar cuando el usuario quiere revisar, clasificar o mover issues en el issue tracker. Gestiona el flujo: `needs-triage` → `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`.

### Skills de setup y meta

- **`setup-matt-pocock-skills`** — Correr una sola vez al inicio del proyecto para configurar issue tracker, vocabulario de labels y ubicación de docs de dominio. Requerida antes del primer uso de `to-issues`, `triage` o `to-prd`.

- **`write-a-skill`** — Activar solo cuando el usuario quiere crear una nueva skill personalizada.

### Resumen de activación por contexto

| Situación | Skill a activar |
|---|---|
| Algo está roto / bug difícil | `diagnose` |
| Área de código desconocida | `zoom-out` |
| Diseñar feature nueva | `grill-with-docs` |
| Stress-test rápido de idea | `grill-me` |
| Refactor / mejorar arquitectura | `improve-codebase-architecture` |
| Desarrollo con tests primero | `tdd` |
| Formalizar idea en PRD | `to-prd` |
| Descomponer plan en issues | `to-issues` |
| Gestionar/clasificar issues | `triage` |
| Setup inicial del proyecto | `setup-matt-pocock-skills` |
| Crear nueva skill | `write-a-skill` |
