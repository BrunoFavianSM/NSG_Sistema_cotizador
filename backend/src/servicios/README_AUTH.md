# Servicio de Autenticación

## Descripción

El servicio de autenticación proporciona funcionalidad completa para autenticar administradores del sistema, generar tokens JWT, y verificar credenciales usando bcrypt para hash de contraseñas.

## Requisitos

- **10.1**: Autenticación del Panel Administrativo
- **10.2**: Validación de credenciales
- **10.3**: Protección de rutas
- **10.4**: Gestión de sesiones con JWT

## Funciones Principales

### `login(username, password)`

Autentica un administrador con username y password.

**Parámetros:**
- `username` (string): Nombre de usuario
- `password` (string): Contraseña en texto plano

**Retorna:**
```javascript
{
  exito: boolean,
  token?: string,           // Token JWT si autenticación exitosa
  usuario?: {
    id: number,
    username: string,
    nombre: string
  },
  error?: string,           // Mensaje de error si falla
  detalles?: Array          // Detalles de validación si aplica
}
```

**Ejemplo:**
```javascript
const resultado = await servicioAuth.login('admin', 'password123');
if (resultado.exito) {
  console.log('Token:', resultado.token);
  console.log('Usuario:', resultado.usuario);
}
```

### `generarToken(payload, expiracion)`

Genera un token JWT para un usuario.

**Parámetros:**
- `payload` (Object): Datos del usuario `{ id, username, nombre }`
- `expiracion` (string, opcional): Tiempo de expiración (default: '24h')

**Retorna:** Token JWT (string)

**Ejemplo:**
```javascript
const token = servicioAuth.generarToken(
  { id: 1, username: 'admin', nombre: 'Admin User' },
  '24h'
);
```

### `verificarToken(token)`

Verifica si un token JWT es válido.

**Parámetros:**
- `token` (string): Token JWT a verificar

**Retorna:**
```javascript
{
  valido: boolean,
  payload?: {
    id: number,
    username: string,
    nombre: string
  },
  error?: string
}
```

**Ejemplo:**
```javascript
const resultado = servicioAuth.verificarToken(token);
if (resultado.valido) {
  console.log('Usuario:', resultado.payload.username);
}
```

### `hashPassword(password, saltRounds)`

Hashea una contraseña usando bcrypt.

**Parámetros:**
- `password` (string): Contraseña en texto plano
- `saltRounds` (number, opcional): Número de rondas de salt (default: 10)

**Retorna:** Hash de la contraseña (string)

**Ejemplo:**
```javascript
const hash = await servicioAuth.hashPassword('password123');
```

### `verificarPassword(password, hash)`

Verifica si una contraseña coincide con un hash.

**Parámetros:**
- `password` (string): Contraseña en texto plano
- `hash` (string): Hash de la contraseña

**Retorna:** `true` si coincide, `false` si no

**Ejemplo:**
```javascript
const coincide = await servicioAuth.verificarPassword('password123', hash);
```

### `obtenerAdministradorPorId(id)`

Obtiene información de un administrador por ID.

**Parámetros:**
- `id` (number): ID del administrador

**Retorna:** Objeto con datos del administrador o `null` si no existe

**Ejemplo:**
```javascript
const admin = await servicioAuth.obtenerAdministradorPorId(1);
```

## Endpoints API

### POST /api/auth/login

Autentica un administrador y retorna un token JWT.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "exito": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "username": "admin",
    "nombre": "Administrador Principal"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "exito": false,
  "error": "Usuario o contraseña incorrectos"
}
```

### POST /api/auth/verificar

Verifica si un token JWT es válido. Requiere token en header Authorization.

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "valido": true,
  "usuario": {
    "id": 1,
    "username": "admin",
    "nombre": "Administrador Principal"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Acceso denegado",
  "mensaje": "Token de autenticación no proporcionado"
}
```

## Middleware de Autenticación

El middleware `verificarToken` (en `backend/src/middleware/auth.js`) protege rutas administrativas.

**Uso:**
```javascript
const { verificarToken } = require('../middleware/auth');

router.get('/admin/productos', verificarToken, (req, res) => {
  // req.usuario contiene { id, username, nombre }
  console.log('Usuario autenticado:', req.usuario);
});
```

## Seguridad

### Bcrypt
- Usa bcrypt para hashear contraseñas con salt aleatorio
- 10 rondas de salt por defecto (configurable)
- Cada hash es único incluso para la misma contraseña

### JWT
- Tokens firmados con `JWT_SECRET` (variable de entorno)
- Expiración configurable (default: 24 horas)
- Incluye issuer: 'nsg-cotizacion-system'
- Verifica expiración y firma automáticamente

### Validación
- Valida formato de credenciales antes de consultar BD
- Username mínimo 3 caracteres
- Password mínimo 6 caracteres
- Mensajes de error genéricos para evitar enumeración de usuarios

## Variables de Entorno

```env
JWT_SECRET=tu-clave-secreta-muy-segura-aqui
```

**IMPORTANTE:** Nunca commitear `JWT_SECRET` al repositorio. Usar `.env` local.

## Pruebas

### Ejecutar pruebas unitarias:
```bash
npm test -- servicioAuth.test.js
```

### Ejecutar pruebas de integración:
```bash
npm test -- integracion-auth.test.js
```

### Cobertura de pruebas:
- 24 pruebas unitarias
- 10 pruebas de integración
- Cobertura: login, generación de tokens, verificación, hashing, rutas

## Ejemplo de Uso Completo

```javascript
// 1. Login
const loginResult = await servicioAuth.login('admin', 'password123');
if (!loginResult.exito) {
  console.error('Error:', loginResult.error);
  return;
}

// 2. Guardar token (en cliente)
const token = loginResult.token;

// 3. Usar token en requests
const response = await fetch('/api/admin/productos', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// 4. Verificar token
const verificacion = servicioAuth.verificarToken(token);
if (verificacion.valido) {
  console.log('Usuario:', verificacion.payload.username);
}
```

## Notas de Implementación

- El servicio consulta la tabla `administradores` en PostgreSQL
- Los passwords se almacenan como `password_hash` (nunca en texto plano)
- El middleware agrega `req.usuario` a requests autenticados
- Los tokens expiran después de 24 horas por defecto
- Se recomienda usar HTTPS en producción para proteger tokens

## Próximos Pasos

- Implementar refresh tokens para sesiones largas
- Agregar rate limiting específico para login
- Implementar logout con blacklist de tokens
- Agregar autenticación de dos factores (2FA)
