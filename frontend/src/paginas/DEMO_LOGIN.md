# Página de Login - Documentación Completa

## Descripción General

La página de Login (`Login.jsx`) es el punto de entrada al panel administrativo del Sistema de Cotización Automatizada. Proporciona autenticación segura mediante JWT y una interfaz moderna con animaciones fluidas.

## Características Principales

### �o. Funcionalidades Implementadas

- **Autenticación JWT**: Integración completa con el backend para validar credenciales
- **Validación de Formulario**: Validación en tiempo real de campos
- **Manejo de Errores**: Mensajes claros y descriptivos para el usuario
- **Estados de Carga**: Feedback visual durante el proceso de autenticación
- **Mostrar/Ocultar Contraseña**: Toggle para visualizar la contraseña
- **Animaciones Fluidas**: Transiciones suaves con Framer Motion
- **Diseño Responsivo**: Adaptable a todos los tamaños de pantalla
- **Accesibilidad**: Labels, ARIA attributes y navegación por teclado

### �YZ� Diseño UI/UX

- Gradiente de fondo atractivo (azul a índigo)
- Tarjeta de login con sombra y bordes redondeados
- Iconos SVG para mejor experiencia visual
- Estados hover y focus bien definidos
- Feedback visual inmediato en errores

## Requisitos Validados

- **Requisito 10.1**: Panel administrativo requiere autenticación
- **Requisito 10.2**: Redirección a login si no está autenticado
- **Requisito 10.3**: Validación de credenciales contra base de datos

## Estructura del Componente

```jsx
Login
�"o�"?�"? Estado del Formulario
�",   �"o�"?�"? username
�",   �"o�"?�"? password
�",   �"o�"?�"? cargando
�",   �"o�"?�"? error
�",   �"o�"?�"? mostrarPassword
�",   �""�"?�"? erroresValidacion
�"o�"?�"? Validación
�",   �""�"?�"? validarFormulario()
�"o�"?�"? Manejo de Eventos
�",   �"o�"?�"? manejarSubmit()
�",   �"o�"?�"? manejarCambioUsername()
�",   �""�"?�"? manejarCambioPassword()
�""�"?�"? Renderizado
    �"o�"?�"? Encabezado
    �"o�"?�"? Formulario
    �",   �"o�"?�"? Campo Username
    �",   �"o�"?�"? Campo Password
    �",   �""�"?�"? Botón Submit
    �""�"?�"? Footer
```

## API del Componente

### Props

El componente no recibe props directamente, pero utiliza el contexto de la aplicación:

```jsx
const { login } = useAppContext();
```

### Hooks Utilizados

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexto/AppContext';
```

## Validaciones Implementadas

### Username

| Validación | Mensaje de Error |
|------------|------------------|
| Campo vacío | "El nombre de usuario es requerido" |
| Menos de 3 caracteres | "El nombre de usuario debe tener al menos 3 caracteres" |

### Password

| Validación | Mensaje de Error |
|------------|------------------|
| Campo vacío | "La contraseña es requerida" |
| Menos de 6 caracteres | "La contraseña debe tener al menos 6 caracteres" |

## Flujo de Autenticación

```
1. Usuario ingresa credenciales
   �?"
2. Validación del formulario
   �?"
3. Si válido �?' Llamada a login()
   �?"
4. Backend valida credenciales
   �?"
5. Si exitoso:
   - Guarda token en localStorage
   - Actualiza contexto
   - Redirige a /admin
   �?"
6. Si falla:
   - Muestra mensaje de error
   - Mantiene al usuario en login
```

## Integración con Backend

### Endpoint Utilizado

```
POST /api/auth/login
```

### Request Body

```json
{
  "username": "admin",
  "password": "password123"
}
```

### Response Exitosa

```json
{
  "exito": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "username": "admin",
    "nombre": "Administrador"
  }
}
```

### Response Fallida

```json
{
  "exito": false,
  "error": "Usuario o contraseña incorrectos"
}
```

## Manejo de Errores

### Tipos de Errores

1. **Errores de Validación**: Mostrados debajo de cada campo
2. **Errores de Autenticación**: Mostrados en banner rojo arriba del formulario
3. **Errores de Conexión**: Mensaje genérico de error de red

### Ejemplos de Mensajes

```jsx
// Error de validación
<p className="text-sm text-red-600">
  El nombre de usuario es requerido
</p>

// Error de autenticación
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <p className="text-sm text-red-800">
    Usuario o contraseña incorrectos
  </p>
</div>

// Error de conexión
<p className="text-sm text-red-800">
  Error de conexión. Por favor, intenta nuevamente.
</p>
```

## Estados del Componente

### Estado Normal

- Campos habilitados
- Botón azul con hover
- Sin mensajes de error

### Estado de Carga

- Campos deshabilitados
- Botón con spinner animado
- Texto "Iniciando sesión..."

### Estado de Error

- Campos habilitados
- Banner de error visible
- Campos con borde rojo (si error de validación)

## Animaciones

### Framer Motion Variants

```jsx
// Contenedor principal
const variantesContenedor = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

// Banner de error
const variantesError = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: { duration: 0.3 }
  }
};
```

## Estilos Tailwind

### Clases Principales

```jsx
// Contenedor principal
className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"

// Tarjeta de login
className="bg-white p-8 rounded-xl shadow-lg"

// Input normal
className="border border-gray-300 rounded-lg px-3 py-2"

// Input con error
className="border border-red-300 bg-red-50 rounded-lg px-3 py-2"

// Botón submit
className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3"

// Botón deshabilitado
className="bg-blue-400 cursor-not-allowed text-white rounded-lg py-3"
```

## Testing

### Cobertura de Tests

- �o. Renderizado correcto del formulario
- �o. Validación de campos vacíos
- �o. Validación de longitud mínima
- �o. Mostrar/ocultar contraseña
- �o. Envío de formulario con credenciales válidas
- �o. Manejo de errores de autenticación
- �o. Manejo de errores de conexión
- �o. Estados de carga
- �o. Navegación tras login exitoso
- �o. Accesibilidad (labels, autocomplete)

### Ejecutar Tests

```bash
cd frontend
npm test Login.test.jsx
```

### Cobertura Esperada

- **Líneas**: > 90%
- **Funciones**: > 95%
- **Branches**: > 85%

## Uso en la Aplicación

### Configuración de Rutas

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './paginas/Login';
import PanelAdmin from './paginas/PanelAdmin';
import RutaProtegida from './componentes/RutaProtegida';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RutaProtegida>
              <PanelAdmin />
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### Componente de Ruta Protegida

```jsx
const RutaProtegida = ({ children }) => {
  const { autenticado, cargandoAuth } = useAppContext();

  if (cargandoAuth) {
    return <LoadingSpinner />;
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
```

## Seguridad

### Mejores Prácticas Implementadas

1. **No almacenar contraseñas**: Solo se envían al backend, nunca se guardan
2. **Token JWT en localStorage**: Almacenamiento seguro del token
3. **Validación en frontend y backend**: Doble capa de validación
4. **Mensajes genéricos**: No revelar si el usuario existe o no
5. **HTTPS en producción**: Comunicación encriptada

### Recomendaciones Adicionales

- Implementar rate limiting en el backend (máximo 5 intentos por 15 minutos)
- Agregar CAPTCHA después de 3 intentos fallidos
- Implementar 2FA para mayor seguridad
- Logs de intentos de login fallidos
- Notificaciones de login desde nuevos dispositivos

## Accesibilidad

### Características Implementadas

- �o. Labels asociados a inputs con `htmlFor`
- �o. Atributos `autoComplete` para autocompletado del navegador
- �o. Mensajes de error descriptivos
- �o. Estados de carga anunciados visualmente
- �o. Contraste de colores WCAG AA
- �o. Navegación por teclado funcional
- �o. Focus visible en todos los elementos interactivos

### Atributos ARIA

```jsx
<input
  id="username"
  name="username"
  type="text"
  autoComplete="username"
  aria-label="Nombre de usuario"
  aria-required="true"
  aria-invalid={!!erroresValidacion.username}
  aria-describedby={erroresValidacion.username ? "username-error" : undefined}
/>

{erroresValidacion.username && (
  <p id="username-error" role="alert">
    {erroresValidacion.username}
  </p>
)}
```

## Personalización

### Cambiar Colores

```jsx
// Cambiar color primario de azul a verde
className="bg-green-600 hover:bg-green-700"  // Botón
className="focus:ring-green-500"             // Focus ring
className="text-green-600"                   // Texto
```

### Cambiar Logo

```jsx
// Reemplazar el icono de candado con logo personalizado
<img
  src="/logo-nsg.png"
  alt="NSG Latinoamerica"
  className="h-16 w-16 mx-auto"
/>
```

### Agregar Campos Adicionales

```jsx
// Ejemplo: Agregar campo de email
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

## Troubleshooting

### Problema: No redirige después del login

**Solución**: Verificar que `useNavigate` esté dentro de un `BrowserRouter`

```jsx
// �O Incorrecto
<Login />

// �o. Correcto
<BrowserRouter>
  <Login />
</BrowserRouter>
```

### Problema: Token no se guarda

**Solución**: Verificar que el backend retorne el token correctamente

```jsx
// Verificar en la consola del navegador
console.log('Token guardado:', localStorage.getItem('token'));
```

### Problema: Error de CORS

**Solución**: Configurar CORS en el backend

```javascript
// backend/src/servidor.js
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Problema: Animaciones no funcionan

**Solución**: Verificar que Framer Motion esté instalado

```bash
npm install framer-motion
```

## Performance

### Optimizaciones Implementadas

1. **Debounce en validación**: Evita validar en cada tecla
2. **Lazy loading**: Componentes cargados bajo demanda
3. **Memoización**: Funciones memoizadas con `useCallback`
4. **Animaciones optimizadas**: GPU-accelerated con `transform`

### Métricas Esperadas

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 90

## Changelog

### v1.0.0 (2024-01-15)

- �o. Implementación inicial del componente Login
- �o. Validación de formulario
- �o. Integración con backend
- �o. Animaciones con Framer Motion
- �o. Tests unitarios completos
- �o. Documentación completa

## Próximas Mejoras

- [ ] Agregar opción "Recordar usuario"
- [ ] Implementar recuperación de contraseña
- [ ] Agregar autenticación con Google/Microsoft
- [ ] Implementar 2FA
- [ ] Agregar modo oscuro
- [ ] Internacionalización (i18n)

## Recursos Adicionales

- [Documentación de React Router](https://reactrouter.com/)
- [Documentación de Framer Motion](https://www.framer.com/motion/)
- [Guía de Tailwind CSS](https://tailwindcss.com/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Soporte

Para preguntas o problemas, contactar al equipo de desarrollo:

- **Email**: dev@nsg-latinoamerica.com
- **Documentación**: Ver `ejemplo-uso-login.jsx`
- **Tests**: Ver `Login.test.jsx`

---

**�sltima actualización**: 2024-01-15  
**Versión**: 1.0.0  
**Autor**: Sistema de Cotización Automatizada - NSG Latinoamerica E.I.R.L.

