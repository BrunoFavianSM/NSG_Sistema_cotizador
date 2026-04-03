# Frontend - Sistema de Cotización Automatizada

Aplicación web construida con React y Vite para el sistema de cotización de NSG Latinoamerica.

## Estructura

```
frontend/
├── src/
│   ├── componentes/        # Componentes React reutilizables
│   │   ├── SelectorComponente.jsx
│   │   ├── ValidadorCompatibilidad.jsx
│   │   ├── ResumenCotizacion.jsx
│   │   ├── AsistenteIA.jsx
│   │   ├── GeneradorPDF.jsx
│   │   └── RutaProtegida.jsx
│   ├── paginas/            # Páginas principales
│   │   ├── Cotizador.jsx
│   │   ├── Login.jsx
│   │   ├── AdminProductos.jsx
│   │   ├── AdminConfiguracion.jsx
│   │   ├── ValidadorCotizaciones.jsx
│   │   └── HistorialCliente.jsx
│   ├── servicios/          # Servicios de API
│   │   └── api.js
│   ├── contexto/           # Context API
│   │   └── AppContext.jsx
│   ├── App.jsx             # Componente principal
│   └── main.jsx            # Punto de entrada
├── public/                 # Archivos estáticos
└── index.html              # HTML base
```

## Instalación

```bash
npm install
npm run dev
```

## Scripts Disponibles

```bash
npm run dev        # Servidor de desarrollo (puerto 5173)
npm run build      # Build para producción
npm run preview    # Preview del build
npm test           # Ejecutar tests
npm run lint       # Linter
```

## Tecnologías

- **React 18+**: Librería de UI
- **Vite**: Build tool y dev server
- **Tailwind CSS**: Framework de estilos
- **Framer Motion**: Animaciones
- **Axios**: Cliente HTTP
- **React Router**: Navegación

## Características

### Sistema de Cotización
- Flujo secuencial de selección de componentes
- Validación de compatibilidad en tiempo real
- Indicadores de stock y disponibilidad
- Cálculo automático de precios

### Asistente IA
- Interfaz conversacional
- Recomendaciones personalizadas
- Aplicación automática de configuración

### Panel Administrativo
- Gestión de productos (CRUD)
- Actualización de stock
- Configuración de margen
- Validación de cotizaciones

### Generación de PDFs
- Descarga de cotización con precios
- Descarga de listado técnico
- Código ticket visible

## Rutas

### Públicas
- `/` - Página principal de cotización
- `/historial` - Historial de cotizaciones del cliente

### Protegidas (requieren autenticación)
- `/admin/login` - Login de administrador
- `/admin/productos` - Gestión de productos
- `/admin/configuracion` - Configuración del sistema
- `/admin/validar` - Validación de cotizaciones

## Contexto Global

El estado global se maneja con Context API:

```javascript
const { 
  productos,
  configuracionSeleccionada,
  usuario,
  margenGanancia 
} = useAppContext();
```

## Servicios API

Todos los servicios están en `src/servicios/api.js`:

```javascript
import api from './servicios/api';

// Productos
const productos = await api.obtenerProductos();

// Cotizaciones
const cotizacion = await api.crearCotizacion(datos);

// IA
const respuesta = await api.iniciarConversacionIA(mensaje);
```

## Estilos

### Tailwind CSS
Configurado en `tailwind.config.js` con colores personalizados:

```javascript
colors: {
  'nsg-primary': '#1e40af',
  'nsg-secondary': '#3b82f6',
  'nsg-accent': '#60a5fa',
}
```

### Animaciones
Framer Motion para transiciones suaves:

```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  {/* contenido */}
</motion.div>
```

## Componentes Principales

### SelectorComponente
Muestra productos disponibles con filtros de compatibilidad.

### ValidadorCompatibilidad
Valida y muestra errores/advertencias de compatibilidad.

### ResumenCotizacion
Muestra resumen de componentes seleccionados y precio total.

### AsistenteIA
Interfaz conversacional para recomendaciones.

### GeneradorPDF
Genera y descarga PDFs de cotización.

### RutaProtegida
HOC para proteger rutas administrativas.

## Testing

### Unit Tests
```bash
npm test
```

### Tests de Componentes
```bash
npm test -- --testPathPattern=componentes
```

## Build para Producción

```bash
npm run build
```

Los archivos se generan en `dist/`:
- HTML, CSS, JS minificados
- Assets optimizados
- Source maps

## Despliegue

### Servidor Estático
```bash
npm run build
# Servir carpeta dist/ con nginx, apache, etc.
```

### Vercel
```bash
vercel deploy
```

### Netlify
```bash
netlify deploy --prod
```

## Variables de Entorno

Crear `.env` en la raíz del frontend:

```bash
VITE_API_URL=http://localhost:3000
```

Acceder en código:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Proxy de Desarrollo

Configurado en `vite.config.js` para evitar CORS:

```javascript
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

## Troubleshooting

### Error "Cannot find module"
```bash
npm install
```

### Puerto 5173 en uso
Cambiar en `vite.config.js`:
```javascript
server: { port: 5174 }
```

### Error de CORS
Verificar que el backend tenga configurado CORS para `http://localhost:5173`

### Estilos no se aplican
Verificar que Tailwind esté configurado correctamente:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Mejores Prácticas

- Componentes pequeños y reutilizables
- Hooks personalizados para lógica compartida
- Context API para estado global
- Lazy loading de rutas
- Optimización de imágenes
- Code splitting automático con Vite
