# 🔒 Componente RutaProtegida - Guía de Uso

## Descripción

El componente `RutaProtegida` es un wrapper de seguridad que protege rutas administrativas verificando la autenticación del usuario antes de permitir el acceso. Si el usuario no está autenticado, lo redirige automáticamente a la página de login.

## Características

✅ Verificación automática de autenticación  
✅ Validación de token JWT  
✅ Redirección automática a login  
✅ Estado de loading durante verificación  
✅ Integración con AppContext  
✅ Soporte para cualquier componente hijo  

## Requisitos Validados

- **Requisito 10.1**: Requerir autenticación antes de permitir acceso
- **Requisito 10.2**: Validar JWT antes de permitir acceso

## Instalación

El componente ya está incluido en el proyecto. Solo necesitas importarlo:

```jsx
import RutaProtegida from '../componentes/RutaProtegida';
```

## Uso Básico

### Ejemplo 1: Proteger una Ruta Simple

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

### Ejemplo 2: Múltiples Rutas Protegidas

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

### Ejemplo 3: Con Layout Compartido

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

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `children` | ReactNode | Sí | Componente(s) a renderizar si está autenticado |

## Estados del Componente

### 1. Loading (Verificando Autenticación)

Cuando `cargandoAuth = true`:

```jsx
<div className="min-h-screen flex items-center justify-center">
  <div className="text-center">
    <div className="spinner"></div>
    <p>Verificando autenticación...</p>
  </div>
</div>
```

### 2. No Autenticado

Cuando `autenticado = false`:

```jsx
<Navigate to="/login" replace />
```

### 3. Autenticado

Cuando `autenticado = true`:

```jsx
{children}
```

## Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│ Usuario intenta acceder a /admin/productos                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ RutaProtegida verifica estado de autenticación              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ cargandoAuth │          │ autenticado  │
│   = true     │          │   = false    │
└──────┬───────┘          └──────┬───────┘
       │                         │
       ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ Mostrar      │          │ Redirigir a  │
│ Loading      │          │ /login       │
└──────────────┘          └──────────────┘
                                 
        ┌─────────────────────────┘
        │
        ▼
┌──────────────┐
│ autenticado  │
│   = true     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Renderizar   │
│ children     │
└──────────────┘
```

## Integración con AppContext

El componente depende de los siguientes valores del contexto:

```jsx
const { autenticado, cargandoAuth } = useAppContext();
```

### Estados del Contexto

| Estado | Tipo | Descripción |
|--------|------|-------------|
| `autenticado` | boolean | Indica si el usuario está autenticado |
| `cargandoAuth` | boolean | Indica si está verificando la autenticación |
| `usuario` | object | Datos del usuario autenticado (opcional) |

## Ejemplos de Uso Avanzado

### Con Redirección Post-Login

```jsx
// En Login.jsx
const manejarLogin = async () => {
  const resultado = await login(username, password);
  if (resultado.exito) {
    // Redirigir a la página que intentaba acceder
    navigate('/admin/productos');
  }
};
```

### Con Roles de Usuario

```jsx
const RutaProtegidaConRol = ({ children, rolesPermitidos }) => {
  const { autenticado, cargandoAuth, usuario } = useAppContext();

  if (cargandoAuth) {
    return <Loading />;
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  if (!rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/sin-permiso" replace />;
  }

  return children;
};

// Uso
<Route 
  path="/admin/configuracion" 
  element={
    <RutaProtegidaConRol rolesPermitidos={['admin', 'superadmin']}>
      <AdminConfiguracion />
    </RutaProtegidaConRol>
  } 
/>
```

### Con Página 404

```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  
  <Route 
    path="/admin/*" 
    element={
      <RutaProtegida>
        <Routes>
          <Route path="productos" element={<AdminProductos />} />
          <Route path="*" element={<Pagina404 />} />
        </Routes>
      </RutaProtegida>
    } 
  />
</Routes>
```

## Testing

### Test de Redirección

```jsx
test('debe redirigir a /login cuando no está autenticado', () => {
  mockContextValue.autenticado = false;
  
  render(
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/admin" 
          element={
            <RutaProtegida>
              <AdminProductos />
            </RutaProtegida>
          } 
        />
      </Routes>
    </BrowserRouter>
  );

  expect(screen.getByText('Login')).toBeInTheDocument();
});
```

### Test de Renderizado

```jsx
test('debe renderizar children cuando está autenticado', () => {
  mockContextValue.autenticado = true;
  
  render(
    <BrowserRouter>
      <Routes>
        <Route 
          path="/admin" 
          element={
            <RutaProtegida>
              <AdminProductos />
            </RutaProtegida>
          } 
        />
      </Routes>
    </BrowserRouter>
  );

  expect(screen.getByText('Panel Administrativo')).toBeInTheDocument();
});
```

## Mejores Prácticas

### ✅ DO

- Envolver todas las rutas administrativas con `RutaProtegida`
- Usar `replace` en `Navigate` para evitar loops
- Proporcionar feedback visual durante la carga
- Mantener la lógica de autenticación en `AppContext`
- Probar todos los estados (loading, autenticado, no autenticado)

### ❌ DON'T

- No verificar autenticación manualmente en cada componente
- No confiar solo en localStorage sin validar el token
- No omitir el estado de loading
- No crear múltiples componentes de protección de rutas
- No mezclar lógica de autenticación con lógica de negocio

## Seguridad

### Verificación de Token

El componente verifica el token JWT en cada renderizado:

```jsx
// En AppContext.jsx
useEffect(() => {
  verificarAutenticacion();
}, []);

const verificarAutenticacion = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    const resultado = await api.verificarToken();
    if (resultado.valido) {
      setAutenticado(true);
    } else {
      logout();
    }
  }
};
```

### Limpieza de Estado

Al hacer logout, se limpia todo el estado:

```jsx
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  setUsuario(null);
  setAutenticado(false);
};
```

## Troubleshooting

### Problema: Loop de Redirección

**Causa**: La ruta de login también está protegida

**Solución**: Asegúrate de que `/login` NO esté envuelto en `RutaProtegida`

```jsx
// ❌ INCORRECTO
<Route 
  path="/login" 
  element={
    <RutaProtegida>
      <Login />
    </RutaProtegida>
  } 
/>

// ✅ CORRECTO
<Route path="/login" element={<Login />} />
```

### Problema: Flash de Contenido No Autorizado

**Causa**: No se muestra el estado de loading

**Solución**: El componente ya maneja esto automáticamente con `cargandoAuth`

### Problema: Token Expirado No Detectado

**Causa**: No se verifica el token con el backend

**Solución**: Implementar verificación en `AppContext`:

```jsx
const verificarAutenticacion = async () => {
  try {
    const resultado = await api.verificarToken();
    if (!resultado.valido) {
      logout();
    }
  } catch (error) {
    logout();
  }
};
```

## Recursos Adicionales

- [React Router v6 Documentation](https://reactrouter.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [React Context API](https://react.dev/reference/react/useContext)

## Soporte

Para preguntas o problemas, consulta:
- Documentación del proyecto: `README.md`
- Ejemplos de uso: `ejemplo-uso-ruta-protegida.jsx`
- Tests: `RutaProtegida.test.jsx`
