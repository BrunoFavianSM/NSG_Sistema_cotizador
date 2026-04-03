# Demo: Página de Administración de Productos

## Descripción

`AdminProductos.jsx` es la página de administración completa para gestionar el catálogo de productos del sistema de cotización. Proporciona funcionalidad CRUD completa con interfaz intuitiva.

## Características Principales

### ✅ Listado de Productos
- Tabla con todos los productos registrados
- Columnas: ID, Nombre, Categoría, Precio, Stock, Disponibilidad a Pedido
- Indicadores visuales de stock (verde/rojo)
- Paginación automática con scroll

### ✅ Creación de Productos
- Modal con formulario completo
- Campos condicionales según categoría
- Validación de datos requeridos
- Feedback visual de guardado

### ✅ Edición de Productos
- Modal pre-llenado con datos actuales
- Actualización en tiempo real
- Preserva datos no modificados

### ✅ Eliminación de Productos
- Modal de confirmación
- Previene eliminación accidental
- Feedback de éxito/error

### ✅ Filtros y Búsqueda
- Filtro por categoría
- Búsqueda por nombre
- Actualización en tiempo real

### ✅ Actualización de Stock
- Edición directa del stock
- Refleja cambios inmediatamente
- Indicador visual de disponibilidad

## Campos del Formulario

### Campos Obligatorios
- **Nombre**: Nombre del producto
- **Categoría**: procesador, placa_madre, ram, almacenamiento, gpu, fuente, case
- **Precio Base**: Precio en soles (S/)
- **Stock**: Cantidad disponible

### Campos Condicionales

**Para Procesador y Placa Madre:**
- Socket (Ej: AM5, LGA1700)

**Para RAM y Placa Madre:**
- Tipo de RAM (DDR4, DDR5)

**Para Placa Madre y Case:**
- Form Factor (ATX, Micro-ATX, Mini-ITX)

**Para Fuente:**
- Potencia en Watts

**Para Procesador y GPU:**
- TDP en Watts

### Campos Opcionales
- **Disponible a Pedido**: Checkbox
- **Tiempo de Entrega**: Días (solo si está a pedido)
- **Descripción Técnica**: Texto largo
- **URL de Imagen**: Link a imagen del producto

## Uso en Aplicación

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminProductos from './paginas/AdminProductos';
import { AppProvider } from './contexto/AppContext';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/productos" element={<AdminProductos />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
```

## Requisitos Validados

- **1.1**: Crear nuevos productos ✅
- **1.2**: Actualizar productos existentes ✅
- **1.3**: Eliminar productos ✅
- **1.4**: Visualizar todos los productos ✅
- **1.5**: Actualización de stock en tiempo real ✅

## Flujo de Trabajo

### Crear Producto
1. Click en "Nuevo Producto"
2. Llenar formulario
3. Campos condicionales aparecen según categoría
4. Click en "Crear"
5. Producto aparece en tabla

### Editar Producto
1. Click en "Editar" en fila del producto
2. Modal se abre con datos actuales
3. Modificar campos necesarios
4. Click en "Actualizar"
5. Cambios se reflejan inmediatamente

### Eliminar Producto
1. Click en "Eliminar" en fila del producto
2. Modal de confirmación aparece
3. Click en "Eliminar" para confirmar
4. Producto desaparece de tabla

### Filtrar/Buscar
1. Usar dropdown de categoría para filtrar
2. Escribir en campo de búsqueda para buscar por nombre
3. Tabla se actualiza automáticamente

## Seguridad

- Requiere autenticación (token JWT)
- Verifica permisos de administrador
- Redirige a login si no autenticado
- Todas las operaciones protegidas por backend

## Animaciones

- Fade in al cargar
- Modales con scale animation
- Hover effects en botones
- Smooth transitions

## Responsive

- Tabla con scroll horizontal en móviles
- Modales adaptables
- Botones táctiles optimizados
- Layout flexible

## Testing

Ver `AdminProductos.test.jsx` para tests completos:
- Renderizado
- CRUD operations
- Filtros y búsqueda
- Validaciones
- Estados de carga/error
- Autenticación

## Dependencias

- React 18+
- Framer Motion (animaciones)
- React Router (navegación)
- Tailwind CSS (estilos)
- API service (backend communication)
- AppContext (estado global)
