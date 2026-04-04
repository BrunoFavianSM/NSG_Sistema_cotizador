# Página Cotizador

## Descripción

La página `Cotizador.jsx` implementa el flujo principal de cotización de computadoras con selección secuencial de componentes.

## Características Implementadas

### 1. Flujo Secuencial (Requisito 4.1)
- 7 pasos ordenados: Procesador �?' Placa Madre �?' RAM �?' Almacenamiento �?' GPU �?' Fuente �?' Case
- Cada paso debe completarse antes de avanzar al siguiente

### 2. Habilitación Condicional (Requisito 4.2)
- Solo el primer paso (Procesador) está habilitado inicialmente
- Cada paso se habilita automáticamente cuando el anterior se completa
- Los pasos no completados aparecen deshabilitados

### 3. Navegación hacia Atrás (Requisito 4.3)
- Botón "Anterior" permite regresar al paso previo
- Click directo en pasos completados permite saltar a ellos
- El primer paso no tiene botón "Anterior" habilitado

### 4. Revalidación (Requisito 4.4)
- Al cambiar cualquier componente, se revalida la compatibilidad
- Los errores y advertencias se muestran en tiempo real
- La validación se ejecuta automáticamente con cada cambio

### 5. Transiciones con Framer Motion (Requisito 13.1)
- Animaciones suaves al cambiar de paso
- Efecto de entrada/salida con desplazamiento horizontal
- Animación escalonada para las tarjetas de productos

## Integración con AppContext

El componente utiliza el contexto global para:

- `configuracionSeleccionada`: Estado actual de componentes seleccionados
- `seleccionarComponente()`: Seleccionar un componente individual
- `agregarRAM()`: Agregar módulos de RAM (puede ser múltiple)
- `eliminarRAM()`: Eliminar un módulo de RAM específico
- `validarCompatibilidad()`: Validar compatibilidad de la configuración
- `validacionCompatibilidad`: Resultado de la validación (errores/advertencias)
- `calcularPrecioTotal()`: Calcular precio total con margen
- `cargarProductos()`: Cargar catálogo de productos
- `productos`: Lista de productos disponibles
- `cargandoProductos`: Estado de carga

## Uso

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexto/AppContext';
import Cotizador from './paginas/Cotizador';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/cotizador" element={<Cotizador />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
```

## Filtrado de Productos

### Placa Madre
Cuando se selecciona un procesador, las placas madre se filtran automáticamente por socket compatible:

```javascript
if (pasoActualInfo.id === 'placa_madre' && configuracionSeleccionada.procesador) {
  const socketProcesador = configuracionSeleccionada.procesador.socket;
  productosFiltrados = productosFiltrados.filter(
    p => p.socket === socketProcesador
  );
}
```

### RAM
Permite seleccionar múltiples módulos. Cada módulo se agrega a un array.

## Indicadores Visuales

### Estados de Paso
- **Azul con escala**: Paso actual
- **Verde con �o"**: Paso completado
- **Gris claro**: Paso habilitado pero no completado
- **Gris oscuro**: Paso deshabilitado

### Disponibilidad de Productos
- **Verde**: En stock
- **Amarillo**: Disponible a pedido
- **Rojo**: Sin stock

### Mensajes de Compatibilidad
- **Rojo**: Errores críticos de compatibilidad
- **Amarillo**: Advertencias (no bloquean la cotización)
- **Azul**: Selección actual

## Animaciones

### Transición de Pasos
```javascript
const variantesContenedor = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
};
```

### Tarjetas de Productos
```javascript
const variantesTarjeta = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  })
};
```

## Responsive Design

El componente utiliza Tailwind CSS con clases responsive:

- `grid-cols-1`: 1 columna en móvil
- `md:grid-cols-2`: 2 columnas en tablet
- `lg:grid-cols-3`: 3 columnas en desktop

## Próximas Mejoras

- [ ] Integración con asistente IA
- [ ] Guardar configuración en localStorage
- [ ] Compartir configuración por URL
- [ ] Comparar múltiples configuraciones
- [ ] Exportar listado técnico

