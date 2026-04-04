# Apple Design Context

## Product
- **Name**: Cotizador
- **Description**: Aplicación web para configurar PCs y generar cotizaciones de forma clara, rápida y profesional.
- **Category**: Utility / Productivity (B2B ventas)
- **Stage**: Redesign

## Platforms
| Platform | Supported | Min OS | Notes |
|----------|-----------|--------|-------|
| iOS      | No        | N/A    | Se adopta lenguaje visual HIG en web |
| iPadOS   | No        | N/A    | Se prioriza layout responsive tablet |
| macOS    | No        | N/A    | Look & feel inspirado en apps nativas Apple |
| tvOS     | No        | N/A    | N/A |
| watchOS  | No        | N/A    | N/A |
| visionOS | No        | N/A    | N/A |

## Technology
- **UI Framework**: React + Tailwind CSS
- **Architecture**: SPA (single-window app)
- **Apple Technologies**: Ninguna nativa (solo inspiración HIG aplicada a interfaz web)

## Design System
- **Base**: Custom design system inspirado en Apple HIG, aplicado globalmente.
- **Brand Colors**:
  - Accent primario: azul tipo iOS (`#0A84FF` en dark, `#007AFF` en light)
  - Success: verde (`#34C759`)
  - Warning: naranja (`#FF9F0A`)
  - Danger: rojo (`#FF453A`)
- **Typography**:
  - Prioridad: `SF Pro Display`, `SF Pro Text`
  - Fallback: `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, sans-serif
  - Escala recomendada:
    - Display: 40/48 semibold
    - H1: 32/40 semibold
    - H2: 24/32 semibold
    - H3: 20/28 medium
    - Body: 16/24 regular
    - Footnote: 13/18 regular
- **Dark Mode**: Requerido en todas las pantallas y componentes (sin excepciones visuales).
- **Dynamic Type**: N/A web; equivalente: tipografía fluid + zoom browser 200% sin ruptura.

## Accessibility
- **Target Level**: Comprehensive (WCAG 2.2 AA)
- **Key Considerations**:
  - Contraste mínimo AA (texto normal >= 4.5:1, grande >= 3:1).
  - Focus visible claro en todos los interactivos (`:focus-visible`).
  - Touch targets mínimos de 44x44 px.
  - Navegación completa por teclado.
  - Estados semánticos y feedback de error legible.
  - Respeto de `prefers-reduced-motion`.

## Users
- **Primary Persona**: Vendedor/a técnico y cliente que arma una PC por componentes.
- **Key Use Cases**:
  - Seleccionar componentes por categoría.
  - Revisar compatibilidad y precio total.
  - Generar y validar cotización.
  - Administrar catálogo de productos.
- **Known Challenges**:
  - Evitar sobrecarga visual en tablas/formularios.
  - Mantener claridad entre estados de stock, validación y errores.
  - Sostener consistencia visual entre vistas públicas y admin.

## Global UI Rules (Project-Wide)
1. **Visual Hierarchy**
- Priorizar una sola acción primaria por pantalla.
- Evitar más de 3 niveles de énfasis visual simultáneos.

2. **Spacing System**
- Usar escala base de 4: `4, 8, 12, 16, 20, 24, 32, 40, 48`.
- Padding de contenedor principal: `px-4` móvil, `px-6` tablet, `px-8` desktop.
- Separación vertical entre bloques de sección: mínimo `24`.

3. **Surfaces and Depth**
- Superficie base limpia, con capas elevadas mediante sombra suave:
  - Level 1: `0 1px 2px rgba(0,0,0,.06)`
  - Level 2: `0 6px 24px rgba(0,0,0,.10)`
- Glass/blur solo en overlays, modales, nav fija o paneles flotantes:
  - `backdrop-blur-md` + fondo translúcido, nunca opaco total.

4. **Corner Radius**
- Inputs y controles pequeños: `10px`
- Cards y paneles: `14px`
- Modales y contenedores destacados: `18px`

5. **Motion**
- Transiciones cortas: `150-250ms`.
- Easing recomendado: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Animación solo para explicar cambio de estado (no decorativa).

6. **Color Behavior**
- Light y dark deben compartir jerarquía, no solo invertir colores.
- Evitar grises lavados en dark mode; priorizar legibilidad.
- Estados de éxito/alerta/error siempre acompañados de icono y texto.

7. **Forms and Data Entry**
- Labels siempre visibles (no depender solo de placeholder).
- Mensajes de error bajo campo, con lenguaje directo y accionable.
- Validación inmediata suave + validación final al submit.

8. **Tables and Dense Screens**
- Priorizar legibilidad sobre cantidad de columnas.
- Encabezados sticky donde aporte contexto.
- Estados vacíos con CTA útil, no solo texto “sin datos”.

9. **Component Consistency**
- Buttons:
  - Primary: relleno accent, alto contraste.
  - Secondary: neutral tonal.
  - Tertiary: ghost.
- Inputs, selects, textareas con altura visual consistente.
- Estados (`hover`, `active`, `focus`, `disabled`) obligatorios en todos.

10. **Implementation Policy**
- Todo nuevo componente o pantalla debe respetar este documento.
- Si una regla entra en conflicto con UX real del flujo, se documenta la excepción.
