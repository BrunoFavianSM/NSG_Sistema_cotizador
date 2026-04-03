# Componentes Reutilizables

## SelectorComponente

Componente reutilizable para seleccionar componentes de hardware en el cotizador.

### Características

- **Filtrado por disponibilidad**: Muestra solo productos con stock > 0 O disponible_a_pedido
- **Indicadores de disponibilidad**: Muestra "En Stock (cantidad)" o "A Pedido (días)"
- **Filtrado por compatibilidad**: Filtra por socket, RAM type, form factor
- **Selección única o múltiple**: Soporta selección de un solo producto o múltiples (para RAM)
- **Búsqueda**: Permite buscar productos por nombre o especificaciones
- **Animaciones**: Usa Framer Motion para transiciones suaves

### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `categoria` | string | Sí | Categoría de productos a mostrar ('procesador', 'placa_madre', 'ram', etc.) |
| `productos` | array | Sí | Array de productos disponibles |
| `seleccionActual` | object/array | No | Producto(s) actualmente seleccionado(s) |
| `onSeleccionar` | function | Sí | Callback cuando se selecciona un producto |
| `filtrosCompatibilidad` | object | No | Filtros de compatibilidad ({ socket, ramType, formFactor }) |
| `permitirMultiple` | boolean | No | Permite selección múltiple (default: false) |
| `cargando` | boolean | No | Muestra indicador de carga (default: false) |

### Ejemplo de Uso

#### Selección Única (Procesador)

```jsx
import SelectorComponente from '../componentes/SelectorComponente';
import { useAppContext } from '../contexto/AppContext';

function PaginaProcesador() {
  const { productos, configuracionSeleccionada, seleccionarComponente } = useAppContext();

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

#### Selección con Filtros de Compatibilidad (Placa Madre)

```jsx
function PaginaPlacaMadre() {
  const { productos, configuracionSeleccionada, seleccionarComponente } = useAppContext();

  // Filtrar por socket del procesador seleccionado
  const filtros = configuracionSeleccionada.procesador
    ? { socket: configuracionSeleccionada.procesador.socket }
    : {};

  return (
    <SelectorComponente
      categoria="placa_madre"
      productos={productos}
      seleccionActual={configuracionSeleccionada.placa_madre}
      onSeleccionar={(producto) => seleccionarComponente('placa_madre', producto)}
      filtrosCompatibilidad={filtros}
    />
  );
}
```

#### Selección Múltiple (RAM)

```jsx
function PaginaRAM() {
  const { productos, configuracionSeleccionada, agregarRAM } = useAppContext();

  // Filtrar por tipo de RAM de la placa madre
  const filtros = configuracionSeleccionada.placa_madre
    ? { ramType: configuracionSeleccionada.placa_madre.ram_type }
    : {};

  return (
    <SelectorComponente
      categoria="ram"
      productos={productos}
      seleccionActual={configuracionSeleccionada.ram}
      onSeleccionar={(modulosRAM) => {
        // modulosRAM es un array
        // Actualizar la configuración con los módulos seleccionados
      }}
      filtrosCompatibilidad={filtros}
      permitirMultiple={true}
    />
  );
}
```

### Requisitos Validados

- **Requisito 2.1**: Control de stock en selección
- **Requisito 2.2**: Mostrar solo productos con stock > 0 O disponible_a_pedido
- **Requisito 2.3**: Indicar disponibilidad (En Stock / A Pedido con días)
- **Requisito 3.2**: Filtrar por compatibilidad (socket, RAM type)

### Estructura de Datos

#### Producto

```javascript
{
  id: 1,
  nombre: 'Intel Core i5-13400',
  categoria: 'procesador',
  socket: 'LGA1700',
  ram_type: null,
  form_factor: null,
  wattage: null,
  tdp: 65,
  precio_base: 850.00,
  stock: 5,
  disponible_a_pedido: false,
  tiempo_entrega_dias: null,
  descripcion_tecnica: '10 núcleos, 16 hilos, 4.6 GHz Turbo'
}
```

#### Filtros de Compatibilidad

```javascript
{
  socket: 'LGA1700',      // Para filtrar placas madre por socket del procesador
  ramType: 'DDR5',        // Para filtrar RAM por tipo de la placa madre
  formFactor: 'ATX'       // Para filtrar cases por form factor de la placa
}
```

### Comportamiento

1. **Filtrado Automático**: El componente filtra automáticamente los productos por:
   - Categoría especificada
   - Disponibilidad (stock > 0 O disponible_a_pedido)
   - Compatibilidad (si se proporcionan filtros)

2. **Indicadores Visuales**:
   - Verde: "En Stock (cantidad)"
   - Amarillo: "A Pedido (días)"
   - Rojo: "Sin Stock" (no se muestra si no está disponible a pedido)

3. **Selección**:
   - Click en una tarjeta selecciona el producto
   - En modo múltiple, click agrega/quita de la selección
   - Producto seleccionado se resalta con borde azul

4. **Búsqueda**:
   - Filtra por nombre o descripción técnica
   - Actualización en tiempo real mientras se escribe

### Estilos

El componente usa Tailwind CSS para estilos y es completamente responsivo:
- Mobile: 1 columna
- Tablet (md): 2 columnas
- Desktop (lg): 3 columnas

### Animaciones

Usa Framer Motion para:
- Entrada de tarjetas con delay escalonado
- Transiciones suaves al seleccionar
- Hover effects

### Testing

Ver `SelectorComponente.test.jsx` para tests unitarios que validan:
- Filtrado por disponibilidad
- Indicadores de disponibilidad
- Filtrado por compatibilidad
- Selección única y múltiple
- Búsqueda de productos

---

## ValidadorCompatibilidad

Componente que muestra en tiempo real los resultados de la validación de compatibilidad entre componentes seleccionados.

### Características

- **Errores de incompatibilidad**: Muestra errores con mensajes descriptivos y iconos
- **Advertencias**: Muestra advertencias sobre fuente ajustada, componentes a pedido, etc.
- **Diseño claro**: Usa colores y iconos para diferenciar errores y advertencias
- **Animaciones suaves**: Usa Framer Motion para transiciones
- **Responsivo**: Se adapta a diferentes tamaños de pantalla

### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `resultadoValidacion` | object | Sí | Resultado de la validación del backend |
| `mostrar` | boolean | No | Controla si se muestra el componente (default: true) |
| `className` | string | No | Clases CSS adicionales |

### Estructura del Resultado de Validación

```javascript
{
  compatible: boolean,           // true si no hay errores
  errores: string[],            // Array de mensajes de error
  advertencias: string[]        // Array de mensajes de advertencia
}
```

### Ejemplo de Uso

#### Uso Básico

```jsx
import { useState, useEffect } from 'react';
import ValidadorCompatibilidad from '../componentes/ValidadorCompatibilidad';
import { validarCompatibilidad } from '../servicios/api';

function PaginaCotizador() {
  const [componentesSeleccionados, setComponentesSeleccionados] = useState({
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null
  });

  const [resultadoValidacion, setResultadoValidacion] = useState(null);

  // Validar automáticamente cuando cambian los componentes
  useEffect(() => {
    const validar = async () => {
      // Solo validar si hay al menos 2 componentes
      const componentesConValor = Object.values(componentesSeleccionados).filter(
        c => c !== null && (Array.isArray(c) ? c.length > 0 : true)
      );

      if (componentesConValor.length < 2) {
        setResultadoValidacion(null);
        return;
      }

      try {
        const resultado = await validarCompatibilidad(componentesSeleccionados);
        setResultadoValidacion(resultado);
      } catch (error) {
        console.error('Error al validar:', error);
      }
    };

    validar();
  }, [componentesSeleccionados]);

  return (
    <div>
      {/* Selectores de componentes */}
      
      {/* Validador de compatibilidad */}
      <ValidadorCompatibilidad
        resultadoValidacion={resultadoValidacion}
        mostrar={true}
      />
      
      {/* Botón de continuar (deshabilitado si hay errores) */}
      <button
        disabled={resultadoValidacion && !resultadoValidacion.compatible}
        className="btn-primary"
      >
        Continuar
      </button>
    </div>
  );
}
```

#### Uso con Control de Visibilidad

```jsx
function PaginaCotizador() {
  const [mostrarValidacion, setMostrarValidacion] = useState(false);
  const [resultadoValidacion, setResultadoValidacion] = useState(null);

  const validarYMostrar = async () => {
    const resultado = await validarCompatibilidad(componentesSeleccionados);
    setResultadoValidacion(resultado);
    setMostrarValidacion(true);
  };

  return (
    <div>
      <button onClick={validarYMostrar}>
        Validar Compatibilidad
      </button>

      <ValidadorCompatibilidad
        resultadoValidacion={resultadoValidacion}
        mostrar={mostrarValidacion}
      />
    </div>
  );
}
```

### Ejemplos de Resultados

#### Configuración Compatible sin Advertencias

```javascript
{
  compatible: true,
  errores: [],
  advertencias: []
}
// No muestra nada (configuración perfecta)
```

#### Configuración Compatible con Advertencias

```javascript
{
  compatible: true,
  errores: [],
  advertencias: [
    '⚠️ Margen ajustado: recomendado 600W',
    '⚠️ Componentes a pedido: 7 días de entrega'
  ]
}
// Muestra panel amarillo con advertencias
```

#### Configuración Incompatible

```javascript
{
  compatible: false,
  errores: [
    '❌ Socket incompatible: AM5 vs LGA1700',
    '❌ Fuente insuficiente: requiere 500W, tiene 400W'
  ],
  advertencias: []
}
// Muestra panel rojo con errores
```

#### Errores y Advertencias Simultáneas

```javascript
{
  compatible: false,
  errores: [
    '❌ RAM incompatible: Placa soporta DDR5, seleccionado DDR4'
  ],
  advertencias: [
    '⚠️ Componentes a pedido: 10 días de entrega'
  ]
}
// Muestra ambos paneles (rojo y amarillo)
```

### Requisitos Validados

- **Requisito 3.3**: Validación de compatibilidad de componentes
- **Requisito 3.4**: Mostrar mensajes descriptivos de incompatibilidad

### Tipos de Validaciones

El backend valida:

1. **Socket**: Procesador ↔ Placa Madre
2. **Tipo de RAM**: RAM ↔ Placa Madre
3. **Form Factor**: Placa Madre ↔ Case
4. **Potencia**: Consumo Total ↔ Fuente de Poder
5. **Componentes a Pedido**: Identifica y calcula tiempo de entrega

### Comportamiento

1. **No Renderiza si**:
   - No hay resultado de validación
   - `mostrar` es false
   - No hay errores ni advertencias

2. **Muestra Errores**:
   - Panel rojo con borde izquierdo
   - Icono de advertencia
   - Lista de errores con viñetas
   - Mensaje de ayuda

3. **Muestra Advertencias**:
   - Panel amarillo con borde izquierdo
   - Icono de información
   - Lista de advertencias con viñetas
   - Mensaje de ayuda

4. **Animaciones**:
   - Entrada suave con fade-in
   - Items aparecen con delay escalonado
   - Salida suave con fade-out

### Estilos

El componente usa Tailwind CSS con:
- **Errores**: `bg-red-50`, `border-red-500`, `text-red-800`
- **Advertencias**: `bg-yellow-50`, `border-yellow-500`, `text-yellow-800`
- **Éxito**: `bg-green-50`, `border-green-500`, `text-green-800`

### Testing

Ver `ValidadorCompatibilidad.test.jsx` para tests unitarios que validan:
- Renderizado condicional
- Visualización de errores
- Visualización de advertencias
- Estilos correctos
- Manejo de casos edge


---

## ResumenCotizacion

Componente que muestra un resumen de la configuración seleccionada con precios, disponibilidad y tiempo de entrega.

### Características

- **Lista de componentes**: Muestra todos los componentes seleccionados con nombres y precios
- **Cálculo de precios**: Calcula precio base y total con margen de ganancia
- **Indicadores de disponibilidad**: Muestra "En Stock" o "A Pedido" para cada componente
- **Tiempo de entrega**: Calcula y muestra el tiempo máximo de entrega si hay componentes a pedido
- **Desglose opcional**: Puede mostrar el desglose del margen de ganancia (para admin)
- **Diseño responsivo**: Se adapta a diferentes tamaños de pantalla
- **Animaciones**: Usa Framer Motion para transiciones suaves

### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `configuracion` | object | Sí | Objeto con la configuración seleccionada (procesador, placa_madre, ram, etc.) |
| `margenGanancia` | number | No | Porcentaje de margen de ganancia (default: 20) |
| `mostrarMargen` | boolean | No | Muestra el desglose del margen (default: false) |
| `className` | string | No | Clases CSS adicionales |

### Estructura de Configuración

```javascript
{
  procesador: object | null,
  placa_madre: object | null,
  ram: array,                    // Puede ser múltiple
  almacenamiento: object | null,
  gpu: object | null,
  fuente: object | null,
  case: object | null
}
```

### Ejemplo de Uso

#### Uso Básico

```jsx
import ResumenCotizacion from '../componentes/ResumenCotizacion';
import { useAppContext } from '../contexto/AppContext';

function PaginaCotizador() {
  const { configuracionSeleccionada, margenGanancia } = useAppContext();

  return (
    <div className="container mx-auto p-4">
      <ResumenCotizacion
        configuracion={configuracionSeleccionada}
        margenGanancia={margenGanancia}
      />
    </div>
  );
}
```

#### Uso con Desglose de Margen (Admin)

```jsx
function PanelAdmin() {
  const { configuracionSeleccionada, margenGanancia } = useAppContext();

  return (
    <ResumenCotizacion
      configuracion={configuracionSeleccionada}
      margenGanancia={margenGanancia}
      mostrarMargen={true} // Muestra subtotal, margen y total
    />
  );
}
```

#### Uso en Sidebar

```jsx
function CotizadorConSidebar() {
  const { configuracionSeleccionada, margenGanancia } = useAppContext();

  return (
    <div className="flex gap-6">
      {/* Contenido principal */}
      <main className="flex-1">
        {/* Selectores de componentes */}
      </main>

      {/* Sidebar con resumen */}
      <aside className="w-80">
        <ResumenCotizacion
          configuracion={configuracionSeleccionada}
          margenGanancia={margenGanancia}
          className="sticky top-4"
        />
      </aside>
    </div>
  );
}
```

### Requisitos Validados

- **Requisito 6.1**: Cálculo de precio total sumando precios_base
- **Requisito 6.2**: Aplicación del margen de ganancia configurable

### Funcionalidades

#### 1. Cálculo de Precios

El componente calcula automáticamente:
- **Precio Base**: Suma de todos los precios_base de los componentes
- **Margen**: Porcentaje aplicado al precio base
- **Precio Total**: Precio base × (1 + margen/100)

```javascript
// Ejemplo:
// Precio base: S/ 4000
// Margen: 20%
// Total: S/ 4000 × 1.20 = S/ 4800
```

#### 2. Detección de Componentes a Pedido

Identifica automáticamente componentes con:
- `stock === 0`
- `disponible_a_pedido === true`

Y calcula el tiempo máximo de entrega entre todos los componentes a pedido.

#### 3. Indicadores Visuales

- **Verde**: "En Stock (cantidad)" - Producto disponible inmediatamente
- **Amarillo**: "A Pedido (días)" - Producto requiere pedido al proveedor

#### 4. Información de Entrega

Si hay componentes a pedido, muestra:
- Cantidad de componentes a pedido
- Tiempo máximo de entrega en días
- Lista detallada de componentes a pedido con sus tiempos individuales

### Comportamiento

1. **Sin Componentes**: No renderiza nada si la configuración está vacía
2. **Componentes Parciales**: Muestra solo los componentes seleccionados
3. **RAM Múltiple**: Enumera cada módulo de RAM como "RAM #1", "RAM #2", etc.
4. **Precios Decimales**: Formatea todos los precios con 2 decimales (S/ 1234.56)

### Estilos

El componente usa Tailwind CSS con:
- **Fondo**: `bg-white` con `shadow-lg`
- **Componentes**: Fondo `bg-gray-50` con hover `bg-gray-100`
- **Precios**: Texto azul `text-blue-600` para destacar
- **Badges**: Verde para stock, amarillo para a pedido
- **Nota**: Fondo azul claro `bg-blue-50` para información adicional

### Animaciones

Usa Framer Motion para:
- Entrada del contenedor con fade-in y slide-up
- Items aparecen con delay escalonado
- Transiciones suaves entre estados

### Testing

Ver `ResumenCotizacion.test.jsx` para tests unitarios que validan:
- Renderizado condicional
- Cálculo de precio base
- Aplicación de margen de ganancia
- Detección de componentes a pedido
- Cálculo de tiempo de entrega
- Indicadores de disponibilidad
- Formateo de precios
- Manejo de RAM múltiple

### Ejemplos Adicionales

Ver `ejemplo-uso-resumen.jsx` para más ejemplos incluyendo:
- Resumen en modal
- Comparación de configuraciones
- Integración con validación
- Uso en diferentes layouts

---

## AsistenteIA

Componente de interfaz conversacional para interactuar con el asistente de inteligencia artificial y obtener recomendaciones personalizadas de configuraciones de PC.

### Características

- **Botón flotante "Ayuda IA"**: Visible y accesible en todo momento
- **Modal conversacional**: Interfaz de chat moderna y responsiva
- **Historial de mensajes**: Muestra toda la conversación con timestamps
- **Recomendaciones personalizadas**: Genera configuraciones basadas en necesidades del usuario
- **Aplicar recomendación**: Un click para aplicar la configuración recomendada
- **Notificaciones Sileo**: Feedback visual de éxito/error
- **Animaciones Framer Motion**: Transiciones suaves y profesionales
- **Diseño responsivo**: Se adapta a móvil y escritorio

### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `onAplicarRecomendacion` | function | Sí | Callback que recibe los componentes recomendados cuando el usuario acepta |
| `className` | string | No | Clases CSS adicionales para el botón flotante |

### Ejemplo de Uso

#### Uso Básico

```jsx
import { useState } from 'react';
import AsistenteIA from '../componentes/AsistenteIA';

function PaginaCotizador() {
  const [configuracion, setConfiguracion] = useState({
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null
  });

  const manejarAplicarRecomendacion = (componentesRecomendados) => {
    // Actualizar configuración con la recomendación
    setConfiguracion(prev => ({
      ...prev,
      ...componentesRecomendados
    }));
    
    // Opcional: validar compatibilidad, navegar, etc.
  };

  return (
    <div>
      {/* Tu interfaz de cotizador */}
      
      {/* Asistente IA - siempre visible */}
      <AsistenteIA onAplicarRecomendacion={manejarAplicarRecomendacion} />
    </div>
  );
}
```

#### Uso con Validación Automática

```jsx
import { useState, useEffect } from 'react';
import AsistenteIA from '../componentes/AsistenteIA';
import { validarCompatibilidad } from '../servicios/api';

function PaginaCotizador() {
  const [configuracion, setConfiguracion] = useState({});
  const [validacion, setValidacion] = useState(null);

  const manejarAplicarRecomendacion = async (componentesRecomendados) => {
    // Actualizar configuración
    setConfiguracion(prev => ({
      ...prev,
      ...componentesRecomendados
    }));
    
    // Validar automáticamente
    try {
      const resultado = await validarCompatibilidad(componentesRecomendados);
      setValidacion(resultado);
      
      if (!resultado.compatible) {
        // Mostrar advertencia
        if (window.Sileo) {
          window.Sileo.warning('La recomendación tiene incompatibilidades');
        }
      }
    } catch (error) {
      console.error('Error al validar:', error);
    }
  };

  return (
    <div>
      {/* Interfaz */}
      <AsistenteIA onAplicarRecomendacion={manejarAplicarRecomendacion} />
    </div>
  );
}
```

### Requisitos Validados

- **Requisito 5.1**: Botón "Ayuda IA" visible en la interfaz
- **Requisito 5.2**: Interfaz conversacional para interactuar con IA
- **Requisito 5.3**: Recopilación de información del cliente (presupuesto, uso, preferencias)
- **Requisito 5.4**: Aplicar recomendación a configuración actual
- **Requisito 13.2**: Notificaciones con Sileo
- **Requisito 13.3**: Animaciones con Framer Motion

### Flujo de Conversación

1. **Usuario hace click en "Ayuda IA"**
   - Se abre el modal con mensaje de bienvenida

2. **Usuario escribe su necesidad inicial**
   - Ejemplo: "Necesito una PC para gaming"
   - Se envía al backend que inicia la conversación

3. **IA hace 3-5 preguntas para recopilar información**
   - Presupuesto: "¿Cuál es tu presupuesto aproximado?"
   - Uso: "¿Para qué usarás principalmente la PC?"
   - Preferencias: "¿Tienes alguna preferencia de marca?"

4. **IA genera recomendación personalizada**
   - Se muestra una tarjeta especial con la configuración
   - Lista todos los componentes recomendados
   - Muestra advertencias si hay componentes a pedido

5. **Usuario puede aplicar la recomendación**
   - Click en "Aplicar esta Configuración"
   - Se ejecuta el callback `onAplicarRecomendacion`
   - Se cierra el modal automáticamente

### Estructura de Recomendación

```javascript
{
  componentes: {
    procesador: { id: 1, nombre: 'Intel Core i5-13400F' },
    placa_madre: { id: 5, nombre: 'ASUS B660M-A' },
    ram: [
      { id: 10, nombre: 'Corsair Vengeance 16GB DDR4' }
    ],
    almacenamiento: { id: 15, nombre: 'Kingston NV2 500GB NVMe' },
    gpu: { id: 20, nombre: 'NVIDIA RTX 3060 12GB' },
    fuente: { id: 25, nombre: 'Cooler Master 650W 80+ Bronze' },
    case: { id: 30, nombre: 'NZXT H510 Flow' }
  },
  explicacion: 'Configuración ideal para gaming 1080p',
  advertencias: [
    'GPU: A pedido (7 días)',
    'Fuente ajustada: recomendado 700W'
  ]
}
```

### Integración con Backend

El componente usa dos funciones de la API:

1. **`iniciarConversacionIA(mensajeInicial)`**
   - Inicia una nueva conversación
   - Retorna: `{ sesionId, pregunta, contexto }`

2. **`continuarConversacionIA(sesionId, respuestaCliente)`**
   - Continúa una conversación existente
   - Retorna: `{ completado, pregunta?, recomendacion? }`

### Características Técnicas

#### Estado del Componente

- `modalAbierto`: Controla la visibilidad del modal
- `sesionId`: ID de la sesión de conversación con el backend
- `historial`: Array de mensajes (usuario, asistente, sistema)
- `mensajeActual`: Texto que el usuario está escribiendo
- `cargando`: Indica si se está esperando respuesta de la IA
- `recomendacionFinal`: Objeto con la configuración recomendada
- `error`: Mensaje de error si algo falla

#### Manejo de Errores

- Si falla la comunicación con el backend, se muestra un mensaje de error
- El usuario puede intentar de nuevo
- Se muestra un mensaje en el chat indicando el problema
- Fallback graceful: el usuario puede reiniciar la conversación

#### Accesibilidad

- Input con placeholder descriptivo
- Botones con títulos (tooltips)
- Colores con buen contraste
- Navegación por teclado (Enter para enviar)
- Indicadores visuales claros de estado

### Personalización

#### Cambiar Posición del Botón

```jsx
<AsistenteIA 
  onAplicarRecomendacion={manejarAplicarRecomendacion}
  className="bottom-20 right-20" // Personalizar posición
/>
```

#### Estilos del Modal

El modal usa clases de Tailwind CSS. Puedes modificar:
- Tamaño: `md:w-[450px] md:h-[650px]`
- Colores del header: `from-purple-600 to-blue-600`
- Bordes: `rounded-2xl`

### Testing

El componente incluye tests unitarios que verifican:

✅ Renderizado del botón "Ayuda IA"
✅ Apertura del modal
✅ Mensaje de bienvenida
✅ Envío de mensajes
✅ Inicio de conversación
✅ Continuación de conversación
✅ Mostrar recomendación
✅ Aplicar recomendación
✅ Manejo de errores
✅ Reiniciar conversación
✅ Cerrar modal

Ejecutar tests:
```bash
npm test -- AsistenteIA.test.jsx
```

### Optimización de Costos de IA

El backend implementa varias optimizaciones:

1. **Modelo Económico**: Usa `gemini-1.5-flash` (10x más barato)
2. **Límite de Tokens**: Máximo 200 tokens de salida
3. **Filtrado de Productos**: Solo top 3 por categoría
4. **Cache**: Recomendaciones cacheadas por 1 hora
5. **Historial Limitado**: Solo últimos 3 mensajes
6. **Fallback**: Recomendación básica sin IA si falla

### Ejemplos Adicionales

Ver `ejemplo-uso-asistente.jsx` para más ejemplos y `DEMO_ASISTENTE.md` para documentación completa incluyendo:
- Flujo detallado de conversación
- Ejemplos de recomendaciones
- Personalización avanzada
- Mejoras futuras opcionales

---

## RutaProtegida

Componente wrapper que protege rutas administrativas verificando la autenticación del usuario antes de permitir el acceso.

### Características

- **Verificación automática**: Verifica si el usuario está autenticado usando AppContext
- **Validación de JWT**: Verifica que el token JWT sea válido
- **Redirección automática**: Redirige a /login si no está autenticado
- **Estado de loading**: Muestra indicador de carga durante la verificación
- **Integración con React Router**: Usa Navigate para redirecciones
- **Renderizado condicional**: Solo renderiza children si está autenticado

### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `children` | ReactNode | Sí | Componente(s) a renderizar si está autenticado |

### Ejemplo de Uso

#### Uso Básico

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '../contexto/AppContext';
import RutaProtegida from '../componentes/RutaProtegida';
import Login from '../paginas/Login';
import AdminProductos from '../paginas/AdminProductos';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Ruta protegida */}
          <Route 
            path="/admin" 
            element={
              <RutaProtegida>
                <AdminProductos />
              </RutaProtegida>
            } 
          />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
```

#### Múltiples Rutas Protegidas

```jsx
<Routes>
  <Route path="/login" element={<Login />} />

  <Route 
    path="/admin/productos" 
    element={
      <RutaProtegida>
        <AdminProductos />
      </RutaProtegida>
    } 
  />
  
  <Route 
    path="/admin/configuracion" 
    element={
      <RutaProtegida>
        <AdminConfiguracion />
      </RutaProtegida>
    } 
  />
  
  <Route 
    path="/admin/validador" 
    element={
      <RutaProtegida>
        <ValidadorCotizaciones />
      </RutaProtegida>
    } 
  />
</Routes>
```

#### Con Layout Compartido

```jsx
const LayoutAdmin = ({ children }) => (
  <div className="min-h-screen bg-gray-100">
    <nav className="bg-white shadow-sm p-4">
      <h1>Panel Administrativo</h1>
    </nav>
    <main className="p-8">{children}</main>
  </div>
);

<Route 
  path="/admin/*" 
  element={
    <RutaProtegida>
      <LayoutAdmin>
        <Routes>
          <Route path="productos" element={<AdminProductos />} />
          <Route path="configuracion" element={<AdminConfiguracion />} />
        </Routes>
      </LayoutAdmin>
    </RutaProtegida>
  } 
/>
```

### Requisitos Validados

- **Requisito 10.1**: Requerir autenticación antes de permitir acceso
- **Requisito 10.2**: Validar JWT antes de permitir acceso

### Flujo de Autenticación

1. **Usuario intenta acceder a /admin/productos**
2. **RutaProtegida verifica autenticación**
3. **Si cargandoAuth = true** → Muestra loading
4. **Si autenticado = false** → Redirige a /login
5. **Si autenticado = true** → Renderiza AdminProductos

### Estados del Componente

#### 1. Loading (Verificando Autenticación)

Cuando `cargandoAuth = true`:

```jsx
<div className="min-h-screen flex items-center justify-center">
  <div className="text-center">
    <div className="spinner"></div>
    <p>Verificando autenticación...</p>
  </div>
</div>
```

#### 2. No Autenticado

Cuando `autenticado = false`:

```jsx
<Navigate to="/login" replace />
```

#### 3. Autenticado

Cuando `autenticado = true`:

```jsx
{children}
```

### Integración con AppContext

El componente depende de:
- `autenticado`: boolean que indica si el usuario está autenticado
- `cargandoAuth`: boolean que indica si está verificando autenticación
- `usuario`: objeto con datos del usuario (opcional)

### Seguridad

- Verifica JWT en cada renderizado
- No confía solo en localStorage
- Valida token con el backend
- Limpia estado al hacer logout
- Previene acceso no autorizado

### Testing

Ver `RutaProtegida.test.jsx` para tests unitarios que validan:
- Redirección a login cuando no está autenticado
- Renderizado de children cuando está autenticado
- Mostrar loading mientras verifica autenticación
- Verificación de token JWT
- Integración con AppContext
- Manejo de casos edge

### Ejemplos Adicionales

Ver `ejemplo-uso-ruta-protegida.jsx` para más ejemplos y `DEMO_RUTA_PROTEGIDA.md` para documentación completa incluyendo:
- Múltiples patrones de uso
- Integración con layouts
- Manejo de redirecciones
- Mejores prácticas de seguridad
- Troubleshooting común
