# Tarea 11.3 Completada: Crear Componente de Selección de Componentes

## Resumen

Se ha implementado exitosamente el componente `SelectorComponente.jsx`, un componente reutilizable para seleccionar componentes de hardware en el cotizador.

## Archivos Creados

### 1. `frontend/src/componentes/SelectorComponente.jsx`
Componente principal que implementa:
- ✅ Filtrado por disponibilidad (stock > 0 O disponible_a_pedido)
- ✅ Indicadores de disponibilidad (En Stock / A Pedido con días)
- ✅ Filtrado por compatibilidad (socket, RAM type, form factor)
- ✅ Selección única y múltiple
- ✅ Búsqueda de productos
- ✅ Animaciones con Framer Motion
- ✅ Diseño responsivo con Tailwind CSS

### 2. `frontend/src/componentes/SelectorComponente.test.jsx`
Suite completa de tests unitarios que valida:
- Filtrado por disponibilidad
- Indicadores de disponibilidad correctos
- Filtrado por compatibilidad (socket, RAM type)
- Selección única y múltiple
- Búsqueda de productos
- Estados de carga
- Resaltado de selección

### 3. `frontend/src/componentes/README.md`
Documentación completa del componente:
- Descripción de características
- Tabla de props
- Ejemplos de uso
- Requisitos validados
- Estructura de datos
- Comportamiento esperado

### 4. `frontend/src/componentes/ejemplo-uso-selector.jsx`
Ejemplos prácticos de integración:
- Selección de procesador
- Selección de placa madre con filtro de socket
- Selección múltiple de RAM
- Integración completa con flujo de pasos

### 5. `frontend/babel.config.js`
Configuración de Babel para tests con Jest

## Requisitos Validados

### Requisito 2.1: Control de Stock en Selección
✅ El componente consulta y muestra solo productos disponibles

### Requisito 2.2: Mostrar Solo Productos Disponibles
✅ Implementado filtro: `productos.filter(p => p.stock > 0 || p.disponible_a_pedido)`

### Requisito 2.3: Indicar Disponibilidad
✅ Indicadores implementados:
- Verde: "En Stock (cantidad)"
- Amarillo: "A Pedido (días)"
- Rojo: "Sin Stock" (oculto si no disponible a pedido)

### Requisito 3.2: Filtrar por Compatibilidad
✅ Filtros implementados:
- Socket (procesador ↔ placa madre)
- RAM type (placa madre ↔ RAM)
- Form factor (placa madre ↔ case)

## Características Principales

### 1. Filtrado Inteligente
```javascript
// Filtrado por disponibilidad
filtrados = filtrados.filter(p => p.stock > 0 || p.disponible_a_pedido);

// Filtrado por compatibilidad
if (filtrosCompatibilidad.socket) {
  filtrados = filtrados.filter(p => !p.socket || p.socket === filtrosCompatibilidad.socket);
}
```

### 2. Indicadores de Disponibilidad
```javascript
const obtenerIndicadorDisponibilidad = (producto) => {
  if (producto.stock > 0) {
    return { texto: `En Stock (${producto.stock})`, clase: 'bg-green-100 text-green-800', icono: '✓' };
  } else if (producto.disponible_a_pedido) {
    const dias = producto.tiempo_entrega_dias || 7;
    return { texto: `A Pedido (${dias}d)`, clase: 'bg-yellow-100 text-yellow-800', icono: '⏱' };
  }
};
```

### 3. Selección Única y Múltiple
```javascript
const manejarSeleccion = (producto) => {
  if (permitirMultiple) {
    // Para RAM: permitir múltiples selecciones
    if (estaSeleccionado(producto)) {
      const nuevaSeleccion = seleccionActual.filter(p => p.id !== producto.id);
      onSeleccionar(nuevaSeleccion);
    } else {
      const nuevaSeleccion = seleccionActual ? [...seleccionActual, producto] : [producto];
      onSeleccionar(nuevaSeleccion);
    }
  } else {
    // Para otros componentes: selección única
    onSeleccionar(producto);
  }
};
```

### 4. Búsqueda en Tiempo Real
```javascript
if (busqueda.trim()) {
  const termino = busqueda.toLowerCase();
  filtrados = filtrados.filter(p =>
    p.nombre.toLowerCase().includes(termino) ||
    (p.descripcion_tecnica && p.descripcion_tecnica.toLowerCase().includes(termino))
  );
}
```

## Props del Componente

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `categoria` | string | Sí | Categoría de productos ('procesador', 'placa_madre', 'ram', etc.) |
| `productos` | array | Sí | Array de productos disponibles |
| `seleccionActual` | object/array | No | Producto(s) seleccionado(s) |
| `onSeleccionar` | function | Sí | Callback de selección |
| `filtrosCompatibilidad` | object | No | Filtros ({ socket, ramType, formFactor }) |
| `permitirMultiple` | boolean | No | Permite selección múltiple (default: false) |
| `cargando` | boolean | No | Muestra indicador de carga (default: false) |

## Ejemplos de Uso

### Selección de Procesador
```jsx
<SelectorComponente
  categoria="procesador"
  productos={productos}
  seleccionActual={configuracionSeleccionada.procesador}
  onSeleccionar={(producto) => seleccionarComponente('procesador', producto)}
/>
```

### Selección de Placa Madre con Filtro
```jsx
<SelectorComponente
  categoria="placa_madre"
  productos={productos}
  seleccionActual={configuracionSeleccionada.placa_madre}
  onSeleccionar={(producto) => seleccionarComponente('placa_madre', producto)}
  filtrosCompatibilidad={{ socket: configuracionSeleccionada.procesador.socket }}
/>
```

### Selección Múltiple de RAM
```jsx
<SelectorComponente
  categoria="ram"
  productos={productos}
  seleccionActual={configuracionSeleccionada.ram}
  onSeleccionar={(modulosRAM) => actualizarRAM(modulosRAM)}
  filtrosCompatibilidad={{ ramType: configuracionSeleccionada.placa_madre.ram_type }}
  permitirMultiple={true}
/>
```

## Integración con AppContext

El componente está diseñado para integrarse perfectamente con el `AppContext`:

```jsx
import { useAppContext } from '../contexto/AppContext';

function PaginaCotizador() {
  const {
    productos,
    configuracionSeleccionada,
    seleccionarComponente,
    agregarRAM
  } = useAppContext();

  return (
    <SelectorComponente
      categoria="procesador"
      productos={productos}
      seleccionActual={configuracionSeleccionada.procesador}
      onSeleccionar={(producto) => seleccionarComponente('procesador', producto)}
    />
  );
}
```

## Diseño Responsivo

El componente se adapta a diferentes tamaños de pantalla:
- **Mobile**: 1 columna
- **Tablet (md)**: 2 columnas
- **Desktop (lg)**: 3 columnas

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Tarjetas de productos */}
</div>
```

## Animaciones

Usa Framer Motion para transiciones suaves:
```jsx
const variantesTarjeta = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3
    }
  })
};
```

## Testing

Se han creado tests unitarios completos que validan:
- ✅ Filtrado por disponibilidad
- ✅ Indicadores de disponibilidad
- ✅ Filtrado por compatibilidad
- ✅ Selección única y múltiple
- ✅ Búsqueda de productos
- ✅ Estados de carga
- ✅ Resaltado de selección

## Dependencias Instaladas

- `prop-types`: Para validación de props

## Próximos Pasos

1. Integrar el componente en la página `Cotizador.jsx`
2. Reemplazar la lógica de selección actual con el nuevo componente
3. Probar el flujo completo de selección
4. Validar la integración con el backend

## Notas Técnicas

- El componente es completamente reutilizable
- No tiene estado interno complejo (controlled component)
- Sigue el patrón de composición de React
- Compatible con TypeScript (usando PropTypes)
- Accesible y semántico
- Optimizado para rendimiento (useEffect con dependencias correctas)

## Conclusión

El componente `SelectorComponente` está completamente implementado y listo para ser integrado en el cotizador. Cumple con todos los requisitos especificados y proporciona una experiencia de usuario fluida y profesional.
