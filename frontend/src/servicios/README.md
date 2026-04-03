# Servicios de API

Este directorio contiene los servicios para comunicación con el backend.

## api.js

Cliente Axios configurado para todas las llamadas al backend.

### Características

- **Configuración centralizada**: Base URL, timeout y headers
- **Interceptores de solicitud**: Agregan automáticamente el token JWT
- **Interceptores de respuesta**: Manejo centralizado de errores HTTP
- **Gestión de tokens**: Almacenamiento y recuperación automática de JWT
- **Manejo de errores**: Redirección automática en caso de token inválido

### Configuración

Crear un archivo `.env` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:3000/api
```

### Uso

```javascript
import { 
  login, 
  obtenerProductos, 
  crearCotizacion,
  validarCompatibilidad,
  iniciarConversacionIA 
} from './servicios/api';

// Autenticación
const resultado = await login('admin', 'password');

// Productos
const productos = await obtenerProductos({ categoria: 'procesadores' });
const producto = await obtenerProductoPorId(1);

// Cotizaciones
const cotizacion = await crearCotizacion({
  cliente: { nombre: 'Juan', email: 'juan@example.com' },
  productos: [{ id: 1, cantidad: 1 }]
});

// Compatibilidad
const validacion = await validarCompatibilidad({
  procesador: 1,
  motherboard: 2,
  ram: 3
});

// IA
const conversacion = await iniciarConversacionIA('Necesito una PC para gaming');
```

### Funciones Disponibles

#### Autenticación
- `login(username, password)` - Iniciar sesión
- `verificarToken()` - Verificar token actual
- `logout()` - Cerrar sesión
- `obtenerUsuarioActual()` - Obtener usuario desde localStorage
- `estaAutenticado()` - Verificar si hay sesión activa

#### Productos
- `obtenerProductos(filtros)` - Listar productos con filtros
- `obtenerProductoPorId(id)` - Obtener producto específico
- `crearProducto(producto)` - Crear nuevo producto (requiere auth)
- `actualizarProducto(id, producto)` - Actualizar producto (requiere auth)
- `eliminarProducto(id)` - Eliminar producto (requiere auth)

#### Cotizaciones
- `crearCotizacion(cotizacion)` - Crear nueva cotización
- `consultarCotizacion(codigoTicket)` - Consultar cotización
- `validarCotizacion(codigoTicket)` - Validar precios
- `marcarComoReclamada(codigoTicket)` - Marcar como reclamada
- `consultarHistorialCliente(email)` - Historial del cliente

#### Compatibilidad
- `validarCompatibilidad(componentes)` - Validar compatibilidad

#### Inteligencia Artificial
- `iniciarConversacionIA(mensajeInicial)` - Iniciar conversación
- `continuarConversacionIA(sesionId, respuesta)` - Continuar conversación
- `obtenerEstadisticasIA()` - Estadísticas de uso

#### Auxiliares
- `verificarSalud()` - Estado del servidor

### Manejo de Errores

Todos los errores son manejados automáticamente:

- **401 Unauthorized**: Redirige a login y limpia tokens
- **403 Forbidden**: Acceso prohibido
- **404 Not Found**: Recurso no encontrado
- **429 Too Many Requests**: Rate limit excedido
- **500 Internal Server Error**: Error del servidor
- **Network Error**: Error de conexión

```javascript
try {
  const productos = await obtenerProductos();
} catch (error) {
  console.error('Error:', error.mensaje || error.error);
}
```

### Tokens JWT

Los tokens se gestionan automáticamente:

1. Al hacer login, el token se guarda en localStorage
2. Cada solicitud incluye el token en el header Authorization
3. Si el token expira, se redirige automáticamente a login
4. Al hacer logout, se eliminan token y datos de usuario

### Testing

Ejecutar tests:

```bash
npm test api.test.js
```
