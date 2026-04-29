---
name: NSG Cotizador Project Context
description: Instrucciones y contexto específico para trabajar en el proyecto NSG Cotizador
type: project
---

## Proyecto NSG Cotizador - Contexto y Restricciones

**Qué es:** Un sistema de cotización (React + Tailwind, Node.js backend, SQLite/PostgreSQL)

**Technical Stack:**
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express (o similar)
- Base de datos: SQLite y PostgreSQL  
- Arquitectura: MERN-like con patrones de servicios bien definidos

## Reglas de Trabajo Específicas

### ✅ Idioma Obligatorio
- Todo el código, documentación interna, comentarios, nombres de variables/clases/métodos: **ESPAÑOL**
- Excepción: Nombres impuestos por librerías/frameworks/external APIs
- Nombres de negocio (tablas API, campos, endpoints): siempre en español con énfasis en semántica precisa
- Nombres de usuario: mantener consistencia (ej: "cotización" no "quote", "cliente" no "customer", "factura" no "invoice")

### ⚡ Prioridades en Código
1. **Seguridad**: Validar y sanitizar TODO (inputs, queries SQL, responses)
2. **Estabilidad**: Consultas parametrizadas, manejo de errores consistente
3. **Mantenibilidad**: Nombres descriptivos, código limpio, seguimiento de convenciones
4. **Claridad**: Documentación breve pero completa, estado actual del código
5. **Compatibilidad**: No romper flujos existentes ni contratos

### 📋 Estándares por Área

#### Frontend (React + Tailwind)
- **UI/UX**: Seguir patrones Apple HIG + tokens globales existentes
- **Dark Mode**: Implementar siempre, probando ambos esquemas
- **Accesibilidad**: WCAG AA (contraste >4.5:1, focus visible, ARIA, navegación con teclado)
- **Touch targets**: Mínimo 44px para elementos interactivos
- **Animaciones**: Sutiles, respetar `prefers-reduced-motion`
- **States**: Cover loading, error, empty, success en componentes críticos
- **Nombres**: 
  - Variables: `const listaCotizaciones` no `const quoteList`
  - PropTypes/Interfaces: `interface Cotizacion { id: string; monto: number }`
  - Componentes: `CotizacionFormulario`, `TarjetaProducto`

#### Backend (Node.js + Express)
- **Entradas**: Validar y sanitizar con Joi o similar
- **Consultas**: Parametrizadas (Nunca concatenar strings en consultas)
- **Autenticación**: Roles definidos, políticas de acceso por ruta
- **Logs**: No exponer datos sensibles, errores estandarizados
- **Nombres de rutas**: `POST /api/cotizaciones`, `GET /api/productos/compatibles`
- **Respuestas errores**: { error: true, mensaje: "Campo X requerido", codigo: "VALIDATION_ERROR" }

#### Base de Datos
- **Nombres**: Tablas y campos en español (ej: `cotizaciones`, `fecha_creacion`)
- **Migraciones**: Todos los cambios de esquema requieren migraciones claras y verificables
- **Constraints**: Definir restricciones e índices para integridad
- **Seed data**: Consistencia con reglas de negocio y compatibilidad
- **Modelos**: Nombres descriptivos en español (ej: `Modelo`, `EspecificacionTecnica`, `Compatibilidad`)

### 📚 Fuente de Verdad

**Documentación principal:**
- `AGENTS.md`: Instrucciones técnicas y reglas del proyecto
- `ESTRUCTURA_PROYECTO.md`: Estructura arquitectónica y diseño del proyecto
- Flujo general en archivos README principales

**Localización critical:**
- Estructura frontend: `./frontend/`
- Backend: `./backend/`
- Base de datos: `./base-datos/`
- Especificaciones de diseño (si existen): `.claude/apple-design-context.md`

### 🧪 Pruebas e Integración

**Backend:**
- Cubrir endpoints modificados con pruebas unitarias/integración
- Validar estados correctos (200, 400, 401, 500)
- Probar validaciones, seguridad, lógica de negocio

**Frontend:**
- Cubrir componentes/páginas impactados
- Probar renderizado, interacciones, estados reactivos
- Validar consumo de APIs con mocked endpoints

**Regla:** No cerrar PR/Issue sin indicar estado real de build y tests

### ✅ Definición de Terminado (DoD)

Un cambio se marca como **completo** solo cuando:
1. Implementado de punta a punta (backend → frontend → DB si aplica)
2. No rompe contratos existentes (APIs, endpoints, flujos)
3. Pruebas ejecutadas: build pasa, tests se ejecutan (aunque sea 0 tests si no aplica)
4. Documentación minima actualizada (qué cambió y por qué)
5. Riesgos identificados y comunicados

### 📤 Salida Esperada en Cada Entrega/Respuesta

**Para cada tarea:**
- Nombrar qué archivos se modificaron/crearon
- Explicar brevemente el cambio técnico/arquitectónico
- Mencionar pruebas ejecutadas y resultado (build/tests)
- Listar archivos impactados 
- Reportar riesgos restantes o próximos pasos necesarios

**Ejemplo de salida:**
```
Agregué validación de email en backend:
- Archivos: backend/src/middlewares/validacion.js
- cambios: Reglas Joi + test básico
- pruebas: npm test → PASS (todos tests backend)
- riesgo: Ninguno identificado
```

### ⚠️ Restricciones Críticas

- Lo que dice el usuario **siempre tiene precedencia** sobre este archivo AGENTS.md
- Cuando hay conflictos entre reglas, preguntar al usuario antes de proceder
- No asumir preferencias: Validar con el usuario si hay dudas

### 🔧 Convenciones de Proyecto

- **Variables de entorno**: `.env.example` como referencia, nunca subir `.env` real
- **Nombres de ramas**: (ver estándar interno si aplica)
- **Commits**: Mensajes descriptivos, enfocados en el "por qué"
- **Pull Requests**: Revisión de pares antes de mergear
- **Changelog**: Mantener un registro de cambios significativos

### 🛑 Acciones Prohibidas

- Hacer force push a main/master (solo pull request + revisión)
- Borrar ramas antiguas sin confirmación
- Cambiar estructura de base de datos sin migración
- Commitear archivos .env o secretos
- Romper flujos existentes sin plan de migración
- Quitar soporte para Dark Mode sin alternativa

### 🧩 Patrones y Buenas Prácticas

- **API Contracts**: Centralizar en servicios (ej: `servicioCotizacion.js`, no escribir URLs directamente)
- **Componentes**: Small components with single responsibility
- **Error Handling**: Estandarizado, con logging controlado
- **Logging**: Nivel adecuado (debug/info/warn/error), nunca sensitive data
- **Performance**: Indexar consultas frecuentes, evitar renderizados innecesarios
