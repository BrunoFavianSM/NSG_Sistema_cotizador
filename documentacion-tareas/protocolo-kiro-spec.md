# Protocolo de ejecución de Tasks (Kiro Spec)

Este protocolo aplica a cualquier agente de IA (Kiro, Claude Code, Cursor, Codex, etc.) que ejecute tareas definidas en un **spec** de Kiro dentro de este repositorio.

## 1) Fuente de verdad (orden de lectura obligatorio)

Antes de ejecutar cualquier tarea, leer siempre estos tres archivos del **spec activo** (ver `.kiro/specs/ACTIVO.md`) en este orden:

1. `requirements.md` — fuente de verdad de qué debe hacer el sistema
2. `design.md` — arquitectura, contratos de API, esquema de BD y decisiones técnicas
3. `tasks.md` — lista de tareas con estado actual

No ejecutar ninguna tarea sin haber leído los tres archivos. El diseño y los requisitos son vinculantes.

## 2) Cómo ejecutar una tarea

1. Identificar la tarea a ejecutar por su número (ej: `11.3`).
2. Leer los `_Requisitos:` referenciados en esa tarea dentro de `requirements.md`.
3. Verificar en `design.md` la arquitectura relevante (componentes, endpoints, esquema).
4. Revisar si hay tareas previas dependientes que deban estar completas primero.
5. Implementar el cambio mínimo necesario para cumplir la tarea.
6. Validar: build sin errores + tests si aplica.
7. Marcar la tarea como completada en `tasks.md` cambiando `[ ]` por `[x]`.

## 3) Tareas opcionales

- Las tareas marcadas con `*` en su descripción son **opcionales** (MVP).
- Por defecto: **no ejecutar tareas opcionales** salvo que el usuario lo indique explícitamente.
- Si el usuario pide "hacer todo", preguntar antes de ejecutar las opcionales.

## 4) Marcado de tareas completadas

Al terminar una tarea, actualizar `tasks.md` inmediatamente:

```markdown
- [x] 11.3 Crear componente de selección de componentes   ← completada
- [ ] 11.4 Crear componente de validación en tiempo real   ← pendiente
```

Si una subtarea se completa pero la tarea padre tiene subtareas pendientes, marcar solo la subtarea:

```markdown
- [ ] 11. Implementar frontend - Sistema Cotizador
  - [x] 11.1 Crear página principal de cotización   ← completada
  - [ ] 11.2 Escribir property tests para flujo secuencial   ← pendiente
```

La tarea padre se marca `[x]` solo cuando todas sus subtareas están `[x]`.

## 5) Checkpoints

Las tareas numeradas como **Checkpoint** (3, 7, 10, 13, 16) son puntos de pausa obligatorios:

- Ejecutar todos los tests disponibles.
- Reportar resultado real (no asumir que pasan).
- **Esperar confirmación del usuario antes de continuar** con el siguiente bloque de tareas.

## 6) Restricciones durante ejecución

- No modificar `requirements.md` ni `design.md` durante la ejecución de tasks.
- Si se detecta un conflicto entre la tarea y el diseño, reportarlo al usuario antes de proceder.
- No saltarse tareas de la secuencia sin justificación explícita.
- Mantener todo el código en español (variables de negocio, comentarios, mensajes) según `AGENTS.md`.

