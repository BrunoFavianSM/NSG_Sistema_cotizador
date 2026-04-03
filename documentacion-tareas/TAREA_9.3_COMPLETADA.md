# Tarea 9.3 - Crear Contexto Global de Aplicación

**Estado:** ✅ COMPLETADA  
**Fecha:** 31 de Marzo, 2026  
**Requisitos:** 14.2

## Resumen

Se implementó el contexto global de la aplicación (`AppContext`) usando React Context API para gestionar el estado compartido entre componentes del frontend.

## Archivos Creados

### 1. `frontend/src/contexto/AppContext.jsx`
Implementación principal del contexto global con:

#### Estado de Autenticación
- `usuario` - Datos del usuario autenticado
- `autenticado` - Boolean de estado de autenticación
- `cargandoAuth` - Indicador de carga
- `login(username, password)` - Función de inicio de sesión
- `logout()` - Función de cierre de sesión
- `verificarAutenticacion()` - Verificación de token

#### Estado de Productos
- `productos` - Array de productos cargados
- `cargandoProductos` - Indicador de carga
- `errorProductos` - Mensaje de error
- `cargarProductos(filtros)` - Carga productos con filtros
- `obtenerProductosPorCategoria(categoria)` - Filtra por categoría
- `obtenerProductosDisponibles()` - Solo productos con stock o a pedido
- `refrescarProducto(id)` - Actualiza producto específico

#### Estado de Configuración Seleccionada
```javascript
{
  procesador: null,
  placa_madre: null,
  ram: [],
  almacenamiento: null,
  gpu: null,
  fuente: null,
  case: null
}
```

Funciones:
- `seleccionarComponente(categoria, producto)` - Selecciona componente
- `agregarRAM(producto)` - Agrega módulo de RAM
- `eliminarRAM(index)` - Elimina módulo de RAM
- `limpiarConfiguracion()` - Limpia toda la configuración
- `aplicarConfiguracion(configuracion)` - Aplica configuración completa
- `configuracionCompleta()` - Verifica si está completa
- `calcularPrecioTotal()` - Calcula precio con margen

#### Estado de Compatibilidad
- `validacionCompatibilidad` - Resultado de validación
- `validarCompatibilidad()` - Valida configuración actual

#### Estado de Margen de Ganancia
- `margenGanancia` - Porcentaje de margen (default: 20)
- `actualizarMargen(nuevoMargen)` - Actualiza margen

### 2. `frontend/src/contexto/AppContext.test.jsx`
Tests unitarios completos que cubren:
- ✅ Inicialización sin usuario autenticado
- ✅ Login correcto
- ✅ Logout correcto
- ✅ Carga de productos
- ✅ Filtrado por categoría
- ✅ Selección de componentes
- ✅ Gestión de RAM múltiple
- ✅ Limpieza de configuración
- ✅ Cálculo de precio total
- ✅ Verificación de configuración completa
- ✅ Validación de compatibilidad
- ✅ Actualización de margen

### 3. `frontend/src/contexto/ejemplo-uso.jsx`
8 ejemplos prácticos de uso:
1. Login de administrador
2. Cargar y mostrar productos
3. Selector de componentes
4. Gestión de RAM (múltiple)
5. Resumen y precio total
6. Validación de compatibilidad
7. Aplicar configuración desde IA
8. Limpiar configuración

### 4. `frontend/src/contexto/README.md`
Documentación completa con:
- Instalación y configuración
- API completa del contexto
- Ejemplos de uso detallados
- Integración con servicios API
- Guía de testing
- Notas importantes

## Características Implementadas

### 1. Gestión de Autenticación
- Verificación automática al iniciar la aplicación
- Persistencia de token en localStorage
- Manejo de sesión con verificación de token
- Funciones de login/logout integradas con API

### 2. Gestión de Productos
- Carga de productos con filtros opcionales
- Filtrado por categoría
- Filtrado por disponibilidad (stock o a pedido)
- Actualización individual de productos
- Manejo de estados de carga y error

### 3. Gestión de Configuración
- Selección de componentes individuales
- Soporte para RAM múltiple (array)
- Limpieza de configuración
- Aplicación de configuración completa (útil para IA)
- Verificación de configuración completa
- Cálculo automático de precio con margen

### 4. Validación de Compatibilidad
- Integración con servicio de compatibilidad del backend
- Almacenamiento de errores y advertencias
- Actualización automática del estado de validación

### 5. Configuración de Margen
- Gestión del margen de ganancia
- Aplicación automática en cálculo de precios

## Integración con API

El contexto utiliza todas las funciones del módulo `servicios/api.js`:

```javascript
// Autenticación
api.login(username, password)
api.logout()
api.verificarToken()
api.obtenerUsuarioActual()

// Productos
api.obtenerProductos(filtros)
api.obtenerProductoPorId(id)

// Compatibilidad
api.validarCompatibilidad(componentes)
```

## Uso en la Aplicación

### Configuración Inicial
```jsx
// En main.jsx
import { AppProvider } from './contexto/AppContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppProvider>
    <App />
  </AppProvider>
);
```

### Uso en Componentes
```jsx
import { useAppContext } from './contexto/AppContext';

function MiComponente() {
  const { 
    usuario, 
    productos, 
    configuracionSeleccionada,
    calcularPrecioTotal 
  } = useAppContext();
  
  // Usar el estado y funciones
}
```

## Validación de Requisitos

### Requisito 14.2 ✅
**"THE Sistema_Cotizador SHALL implementar el frontend con React utilizando sintaxis JSX"**

✅ Implementado con React Context API  
✅ Sintaxis JSX en todos los componentes  
✅ Hooks personalizados (useAppContext)  
✅ Provider pattern para estado global  
✅ Integración completa con servicios API

## Beneficios de la Implementación

1. **Estado Centralizado**: Un único punto de verdad para el estado global
2. **Fácil Acceso**: Hook personalizado `useAppContext()` para acceso simple
3. **Tipado Claro**: Estructura bien definida del estado
4. **Reutilizable**: Funciones compartidas entre componentes
5. **Testeable**: Tests unitarios completos
6. **Documentado**: README y ejemplos extensivos
7. **Escalable**: Fácil agregar nuevo estado o funciones

## Próximos Pasos

Este contexto está listo para ser usado en:

1. **Tarea 10**: Implementar componentes de UI
   - SelectorComponente
   - ValidadorCompatibilidad
   - ResumenCotizacion
   - AsistenteIA

2. **Tarea 11**: Implementar páginas
   - Cotizador
   - AdminProductos
   - ValidadorCotizaciones

3. **Tarea 12**: Rutas protegidas
   - RutaProtegida usando `autenticado`

## Testing

Los tests están implementados pero requieren instalación de dependencias:

```bash
cd frontend
npm install
npm test -- AppContext.test.jsx
```

## Notas Técnicas

### Inicialización
- El contexto verifica automáticamente la autenticación al montar
- Los productos NO se cargan automáticamente (deben cargarse explícitamente)

### Persistencia
- Token y usuario se guardan en localStorage
- Se limpian automáticamente en logout o token inválido

### RAM Múltiple
- La RAM es un array para soportar múltiples módulos
- Usar `agregarRAM()` y `eliminarRAM()` en lugar de `seleccionarComponente()`

### Cálculo de Precios
- El margen se aplica automáticamente en `calcularPrecioTotal()`
- Suma todos los componentes incluyendo múltiples RAMs

### Validación
- La validación NO es automática
- Debe llamarse explícitamente con `validarCompatibilidad()`

## Conclusión

✅ **TAREA COMPLETADA EXITOSAMENTE**

El contexto global está implementado, documentado y listo para ser usado en el resto de la aplicación. Proporciona una base sólida para la gestión del estado global con:

- Autenticación completa
- Gestión de productos
- Configuración de cotización
- Validación de compatibilidad
- Cálculo de precios

Todos los archivos tienen sintaxis correcta (verificado con getDiagnostics) y están listos para integración con los componentes de UI y páginas.
