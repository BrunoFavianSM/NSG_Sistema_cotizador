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
