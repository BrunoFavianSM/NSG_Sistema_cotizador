# Contexto Global de Aplicación (AppContext)

Este módulo implementa el contexto global de la aplicación usando React Context API para gestionar el estado compartido entre componentes.

**Valida Requisitos: 14.2** - "THE Sistema_Cotizador SHALL implementar el frontend con React utilizando sintaxis JSX"

## Archivos

- `AppContext.jsx` - Implementación del contexto global con Provider y hook personalizado
- `AppContext.test.jsx` - Tests unitarios del contexto (requiere instalación de dependencias)
- `ejemplo-uso.jsx` - Ejemplos prácticos de uso del contexto en diferentes escenarios
- `README.md` - Este archivo de documentación

## Instalación

Para usar el contexto en tu aplicación, primero envuelve tu aplicación con el Provider:

```jsx
// En main.jsx o App.jsx
import { AppProvider } from './contexto/AppContext';

function App() {
  return (
    <AppProvider>
      {/* Tu aplicación aquí */}
      <Router>
        <Routes>
          {/* Rutas */}
        </Routes>
      </Router>
    </AppProvider>
  );
}
```

## Uso Básico

```jsx
import { useAppContext } from './contexto/AppContext';

function MiComponente() {
  const { 
    usuario, 
    autenticado, 
    productos,
    configuracionSeleccionada 
  } = useAppContext();

  return (
    <div>
      {autenticado && <p>Bienvenido {usuario.username}</p>}
      <p>Productos disponibles: {productos.length}</p>
    </div>
  );
}
```

## Estado y Funciones Disponibles

### 1. Autenticación

#### Estado
- `usuario` (Object|null) - Datos del usuario autenticado
- `autenticado` (Boolean) - Indica si hay un usuario autenticado
- `cargandoAuth` (Boolean) - Indica si se está verificando la autenticación

#### Funciones
- `login(username, password)` - Inicia sesión de administrador
  ```jsx
  const resultado = await login('admin', 'password');
  if (resultado.exito) {
    // Login exitoso
  }
  ```

- `logout()` - Cierra sesión del usuario
  ```jsx
  logout(); // Limpia token y redirige
  ```

- `verificarAutenticacion()` - Verifica si el token actual es válido
  ```jsx
  await verificarAutenticacion();
  ```

### 2. Productos

#### Estado
- `productos` (Array) - Lista de todos los productos cargados
- `cargandoProductos` (Boolean) - Indica si se están cargando productos
- `errorProductos` (String|null) - Mensaje de error si falla la carga

#### Funciones
- `cargarProductos(filtros)` - Carga productos con filtros opcionales
  ```jsx
  await cargarProductos({ categoria: 'procesador' });
  ```

- `obtenerProductosPorCategoria(categoria)` - Filtra productos por categoría
  ```jsx
  const procesadores = obtenerProductosPorCategoria('procesador');
  ```

- `obtenerProductosDisponibles()` - Obtiene solo productos con stock o a pedido
  ```jsx
  const disponibles = obtenerProductosDisponibles();
  ```

- `refrescarProducto(id)` - Actualiza un producto específico
  ```jsx
  await refrescarProducto(1);
  ```

### 3. Configuración Seleccionada

#### Estado
```javascript
configuracionSeleccionada = {
  procesador: null,        // Objeto del producto o null
  placa_madre: null,       // Objeto del producto o null
  ram: [],                 // Array de productos (puede ser múltiple)
  almacenamiento: null,    // Objeto del producto o null
  gpu: null,               // Objeto del producto o null
  fuente: null,            // Objeto del producto o null
  case: null               // Objeto del producto o null
}
```

#### Funciones
- `seleccionarComponente(categoria, producto)` - Selecciona un componente
  ```jsx
  seleccionarComponente('procesador', productoSeleccionado);
  ```

- `agregarRAM(producto)` - Agrega un módulo de RAM
  ```jsx
  agregarRAM(ramSeleccionada);
  ```

- `eliminarRAM(index)` - Elimina un módulo de RAM por índice
  ```jsx
  eliminarRAM(0); // Elimina el primer módulo
  ```

- `limpiarConfiguracion()` - Limpia toda la configuración
  ```jsx
  limpiarConfiguracion();
  ```

- `aplicarConfiguracion(configuracion)` - Aplica una configuración completa
  ```jsx
  aplicarConfiguracion(recomendacionIA);
  ```

- `configuracionCompleta()` - Verifica si todos los componentes están seleccionados
  ```jsx
  if (configuracionCompleta()) {
    // Habilitar botón de cotización
  }
  ```

- `calcularPrecioTotal()` - Calcula el precio total con margen aplicado
  ```jsx
  const total = calcularPrecioTotal(); // Retorna número
  ```

### 4. Compatibilidad

#### Estado
```javascript
validacionCompatibilidad = {
  compatible: true,        // Boolean
  errores: [],            // Array de strings
  advertencias: []        // Array de strings
}
```

#### Funciones
- `validarCompatibilidad()` - Valida la configuración actual
  ```jsx
  const resultado = await validarCompatibilidad();
  if (!resultado.compatible) {
    // Mostrar errores
  }
  ```

### 5. Margen de Ganancia

#### Estado
- `margenGanancia` (Number) - Porcentaje de margen (default: 20)

#### Funciones
- `actualizarMargen(nuevoMargen)` - Actualiza el margen de ganancia
  ```jsx
  actualizarMargen(25); // Establece margen al 25%
  ```

## Ejemplos Completos

### Ejemplo 1: Página de Login

```jsx
import { useAppContext } from './contexto/AppContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const { login, autenticado, cargandoAuth } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const resultado = await login(username, password);
    if (resultado.exito) {
      navigate('/admin/productos');
    } else {
      setError(resultado.error);
    }
  };

  if (cargandoAuth) return <div>Cargando...</div>;
  if (autenticado) navigate('/admin/productos');

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
        placeholder="Usuario"
        required
      />
      <input 
        type="password"
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Contraseña"
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
}
```

### Ejemplo 2: Selector de Procesadores

```jsx
import { useAppContext } from './contexto/AppContext';
import { useEffect } from 'react';

function SelectorProcesador() {
  const { 
    productos,
    configuracionSeleccionada,
    seleccionarComponente,
    obtenerProductosPorCategoria,
    cargarProductos,
    cargandoProductos
  } = useAppContext();

  useEffect(() => {
    cargarProductos();
  }, []);

  const procesadores = obtenerProductosPorCategoria('procesador')
    .filter(p => p.stock > 0 || p.disponible_a_pedido);

  if (cargandoProductos) return <div>Cargando productos...</div>;

  return (
    <div>
      <h2>Selecciona un Procesador</h2>
      <div className="grid grid-cols-3 gap-4">
        {procesadores.map(proc => (
          <div 
            key={proc.id}
            onClick={() => seleccionarComponente('procesador', proc)}
            className={`
              p-4 border rounded cursor-pointer
              ${configuracionSeleccionada.procesador?.id === proc.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300'}
            `}
          >
            <h3 className="font-bold">{proc.nombre}</h3>
            <p>Socket: {proc.socket}</p>
            <p>TDP: {proc.tdp}W</p>
            <p className="text-lg font-bold">S/ {proc.precio_base}</p>
            {proc.stock === 0 && (
              <span className="text-orange-500">A pedido</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Ejemplo 3: Resumen de Cotización

```jsx
import { useAppContext } from './contexto/AppContext';

function ResumenCotizacion() {
  const { 
    configuracionSeleccionada,
    calcularPrecioTotal,
    configuracionCompleta,
    validacionCompatibilidad,
    validarCompatibilidad,
    margenGanancia
  } = useAppContext();

  const handleValidar = async () => {
    await validarCompatibilidad();
  };

  const precioTotal = calcularPrecioTotal();
  const completa = configuracionCompleta();

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Resumen de Configuración</h2>
      
      <div className="space-y-2 mb-4">
        <ComponenteItem 
          nombre="Procesador" 
          componente={configuracionSeleccionada.procesador} 
        />
        <ComponenteItem 
          nombre="Placa Madre" 
          componente={configuracionSeleccionada.placa_madre} 
        />
        <div>
          <strong>RAM:</strong> {configuracionSeleccionada.ram.length} módulos
          {configuracionSeleccionada.ram.map((ram, i) => (
            <div key={i} className="ml-4">- {ram.nombre}</div>
          ))}
        </div>
        <ComponenteItem 
          nombre="Almacenamiento" 
          componente={configuracionSeleccionada.almacenamiento} 
        />
        <ComponenteItem 
          nombre="GPU" 
          componente={configuracionSeleccionada.gpu} 
        />
        <ComponenteItem 
          nombre="Fuente" 
          componente={configuracionSeleccionada.fuente} 
        />
        <ComponenteItem 
          nombre="Case" 
          componente={configuracionSeleccionada.case} 
        />
      </div>

      <button 
        onClick={handleValidar}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Validar Compatibilidad
      </button>

      {validacionCompatibilidad.errores.length > 0 && (
        <div className="bg-red-100 p-3 rounded mb-4">
          <h3 className="font-bold text-red-700">Errores:</h3>
          {validacionCompatibilidad.errores.map((error, i) => (
            <p key={i} className="text-red-600">{error}</p>
          ))}
        </div>
      )}

      {validacionCompatibilidad.advertencias.length > 0 && (
        <div className="bg-yellow-100 p-3 rounded mb-4">
          <h3 className="font-bold text-yellow-700">Advertencias:</h3>
          {validacionCompatibilidad.advertencias.map((adv, i) => (
            <p key={i} className="text-yellow-600">{adv}</p>
          ))}
        </div>
      )}

      <div className="border-t pt-4">
        <p className="text-sm text-gray-600">Margen aplicado: {margenGanancia}%</p>
        <p className="text-3xl font-bold text-green-600">
          Total: S/ {precioTotal.toFixed(2)}
        </p>
      </div>

      {completa && validacionCompatibilidad.compatible ? (
        <button className="w-full bg-green-500 text-white py-3 rounded mt-4">
          Generar Cotización
        </button>
      ) : (
        <p className="text-gray-500 mt-4">
          Completa todos los componentes y valida la compatibilidad para continuar
        </p>
      )}
    </div>
  );
}

function ComponenteItem({ nombre, componente }) {
  return (
    <div>
      <strong>{nombre}:</strong> {componente?.nombre || 'No seleccionado'}
      {componente && (
        <span className="ml-2 text-gray-600">
          (S/ {componente.precio_base})
        </span>
      )}
    </div>
  );
}
```

## Integración con Servicios API

El contexto utiliza las funciones del módulo `servicios/api.js` para comunicarse con el backend:

```javascript
import * as api from '../servicios/api';

// El contexto llama a:
api.login(username, password)
api.verificarToken()
api.obtenerProductos(filtros)
api.validarCompatibilidad(componentes)
// etc.
```

## Testing

Para ejecutar los tests (requiere instalación de dependencias):

```bash
cd frontend
npm install
npm test -- AppContext.test.jsx
```

Los tests cubren:
- Autenticación (login, logout, verificación)
- Carga y filtrado de productos
- Selección de componentes
- Gestión de RAM múltiple
- Cálculo de precios
- Validación de compatibilidad
- Actualización de margen

## Notas Importantes

1. **Inicialización**: El contexto verifica automáticamente la autenticación al cargar
2. **Persistencia**: Los tokens se guardan en localStorage
3. **Productos**: Deben cargarse explícitamente con `cargarProductos()`
4. **RAM Múltiple**: La RAM es un array, usa `agregarRAM()` y `eliminarRAM()`
5. **Validación**: Llama a `validarCompatibilidad()` antes de generar cotización
6. **Margen**: El margen se aplica automáticamente en `calcularPrecioTotal()`

## Próximos Pasos

Este contexto está listo para ser usado en:
- Componentes de UI (SelectorComponente, ResumenCotizacion, etc.)
- Páginas (Cotizador, AdminProductos, etc.)
- Rutas protegidas (RutaProtegida)
- Integración con Asistente IA

Ver `ejemplo-uso.jsx` para más ejemplos prácticos.
