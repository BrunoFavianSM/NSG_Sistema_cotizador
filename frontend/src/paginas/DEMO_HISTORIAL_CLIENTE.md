# Documentación: HistorialCliente

## Descripción General

El componente `HistorialCliente` permite a los clientes consultar todas sus cotizaciones previas ingresando su email. Proporciona una interfaz intuitiva para visualizar el historial completo y descargar los PDFs de cada cotización.

## Requisitos Validados

- **15.1**: Los clientes pueden consultar historial de cotizaciones por email
- **15.2**: El historial muestra todas las cotizaciones del cliente
- **15.3**: Los clientes pueden descargar PDFs de cotizaciones anteriores

## Características Principales

### 1. Búsqueda por Email
- Formulario simple con un campo de email
- Validación de formato en tiempo real
- Normalización automática (trim y lowercase)
- Mensajes de error claros y específicos

### 2. Visualización de Historial
- Lista completa de cotizaciones del cliente
- Información detallada de cada cotización:
  - Código de ticket
  - Fecha de emisión
  - Fecha de validez
  - Precio total
  - Estado (Pendiente, Reclamada, Caducada)
  - Cantidad de componentes
  - Fecha de reclamación (si aplica)

### 3. Descarga de PDFs
- Botón de descarga para cada cotización
- Apertura en nueva pestaña
- URL construida dinámicamente según el código de ticket

### 4. Estados de la Interfaz
- **Inicial**: Formulario de búsqueda
- **Cargando**: Indicador de progreso durante la búsqueda
- **Resultados**: Lista de cotizaciones encontradas
- **Sin resultados**: Mensaje cuando no hay cotizaciones
- **Error**: Mensajes de error específicos

### 5. Experiencia de Usuario
- Animaciones suaves con Framer Motion
- Diseño responsive (móvil, tablet, desktop)
- Feedback visual inmediato
- Navegación intuitiva

## Estructura del Componente

```
HistorialCliente/
�"o�"?�"? Estado del formulario
�",   �"o�"?�"? email
�",   �"o�"?�"? emailValido
�",   �""�"?�"? errores de validación
�"o�"?�"? Estado de búsqueda
�",   �"o�"?�"? buscando
�",   �"o�"?�"? historialCargado
�",   �""�"?�"? error
�"o�"?�"? Estado del historial
�",   �"o�"?�"? cliente (nombre, email)
�",   �""�"?�"? cotizaciones[]
�""�"?�"? Funciones
    �"o�"?�"? validarEmail()
    �"o�"?�"? manejarBusqueda()
    �"o�"?�"? descargarPDF()
    �"o�"?�"? formatearFecha()
    �""�"?�"? nuevaBusqueda()
```

## Uso Básico

```jsx
import HistorialCliente from './paginas/HistorialCliente';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexto/AppContext';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/historial" element={<HistorialCliente />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
```

## Integración con API

El componente utiliza la función `consultarHistorialCliente` del servicio API:

```javascript
import { consultarHistorialCliente } from '../servicios/api';

// Llamada a la API
const resultado = await consultarHistorialCliente(email);

// Respuesta esperada
{
  exito: true,
  cliente: {
    nombre: "Juan Pérez",
    email: "juan@example.com"
  },
  cantidad: 2,
  cotizaciones: [
    {
      id: 1,
      codigo_ticket: "NSG-2024-0001",
      fecha_emision: "2024-01-15T10:00:00Z",
      fecha_validez: "2024-01-18T10:00:00Z",
      precio_total: 3500.00,
      estado: "Pendiente",
      cantidad_componentes: 7,
      fecha_reclamacion: null
    }
  ]
}
```

## Validación de Email

El componente implementa validación robusta de emails:

```javascript
const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
```

**Emails válidos:**
- `usuario@example.com`
- `nombre.apellido@empresa.com.pe`
- `test123@mail.co`

**Emails inválidos:**
- `usuario@` (sin dominio)
- `@example.com` (sin usuario)
- `usuario example.com` (sin @)
- `usuario@` (incompleto)

## Descarga de PDFs

La descarga de PDFs se realiza mediante la apertura de una URL en nueva pestaña:

```javascript
const descargarPDF = (codigoTicket) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const pdfUrl = `${apiUrl}/cotizaciones/${codigoTicket}/pdf`;
  window.open(pdfUrl, '_blank');
};
```

**Endpoint del backend:**
```
GET /api/cotizaciones/:codigoTicket/pdf
```

## Estados de Cotización

El componente muestra diferentes badges según el estado:

| Estado | Color | Descripción |
|--------|-------|-------------|
| Pendiente | Amarillo | Cotización activa, no reclamada |
| Reclamada | Verde | Cliente reclamó la cotización |
| Caducada | Rojo | Cotización expiró (>3 días) |

```javascript
const obtenerColorEstado = (estado) => {
  switch (estado) {
    case 'Pendiente':
      return 'bg-yellow-100 text-yellow-800';
    case 'Reclamada':
      return 'bg-green-100 text-green-800';
    case 'Caducada':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
```

## Formato de Fechas

Las fechas se formatean en español peruano:

```javascript
const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

**Ejemplo de salida:**
```
15 de enero de 2024, 10:00
```

## Animaciones

El componente utiliza Framer Motion para animaciones suaves:

### Animación de entrada del contenedor
```javascript
const variantesContenedor = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};
```

### Animación escalonada de tarjetas
```javascript
const variantesTarjeta = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3
    }
  })
};
```

## Diseño Responsive

El componente se adapta a diferentes tamaños de pantalla:

### Móvil (< 768px)
- Layout de una columna
- Información apilada verticalmente
- Botones de ancho completo

### Tablet (768px - 1024px)
- Grid de 2 columnas para información
- Botones de tamaño medio

### Desktop (> 1024px)
- Layout horizontal optimizado
- Grid de información en 2 columnas
- Espaciado amplio

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
  {/* Contenido responsive */}
</div>
```

## Manejo de Errores

El componente maneja diferentes tipos de errores:

### 1. Errores de Validación
```javascript
if (!email.trim()) {
  setError('Por favor ingresa tu email');
  return;
}

if (!validarEmail(email)) {
  setError('Por favor ingresa un email válido');
  return;
}
```

### 2. Errores de API
```javascript
try {
  const resultado = await consultarHistorialCliente(email);
  // ...
} catch (err) {
  setError(err.mensaje || 'Error al buscar historial');
}
```

### 3. Errores de Red
```javascript
catch (err) {
  console.error('Error al buscar historial:', err);
  setError('Error al buscar historial. Por favor, intenta nuevamente.');
}
```

## Casos de Uso

### Caso 1: Cliente Consulta su Historial
1. Cliente ingresa su email
2. Sistema valida el formato
3. Se busca en el backend
4. Se muestran todas las cotizaciones
5. Cliente puede descargar PDFs

### Caso 2: Email sin Cotizaciones
1. Cliente ingresa email válido
2. Sistema busca en el backend
3. No se encuentran cotizaciones
4. Se muestra mensaje informativo
5. Cliente puede intentar con otro email

### Caso 3: Error de Conexión
1. Cliente ingresa email
2. Falla la conexión con el backend
3. Se muestra mensaje de error
4. Cliente puede reintentar

### Caso 4: Nueva Búsqueda
1. Cliente ve sus resultados
2. Hace clic en "Nueva Búsqueda"
3. Se limpia el formulario
4. Puede buscar otro email

## Testing

El componente incluye tests completos:

### Tests de Renderizado
- Formulario inicial
- Campos y botones
- Placeholders correctos

### Tests de Validación
- Email vacío
- Email inválido
- Email válido
- Limpieza de errores

### Tests de Búsqueda
- Estado de carga
- Deshabilitación durante búsqueda
- Llamada a API correcta
- Normalización de email

### Tests de Resultados
- Información del cliente
- Lista de cotizaciones
- Estados correctos
- Formato de precios

### Tests de Descarga
- Botones presentes
- URL correcta
- Apertura en nueva pestaña

### Tests de Errores
- Errores de API
- Errores genéricos
- Reintentos

## Configuración

### Variables de Entorno

```env
# .env
VITE_API_URL=http://localhost:3000/api
```

### Dependencias Requeridas

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "framer-motion": "^10.16.0",
    "axios": "^1.6.0"
  }
}
```

### Tailwind CSS

Asegúrate de tener Tailwind configurado en `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Personalización

### Cambiar Colores

```jsx
// Cambiar color del header
<div className="bg-blue-600"> {/* Cambiar a bg-purple-600 */}

// Cambiar color de botones
<button className="bg-blue-600 hover:bg-blue-700">
  {/* Cambiar a bg-green-600 hover:bg-green-700 */}
</button>
```

### Modificar Animaciones

```javascript
// Hacer animaciones más rápidas
const variantesContenedor = {
  visible: {
    transition: { duration: 0.3 } // Cambiar de 0.5 a 0.3
  }
};

// Cambiar delay entre tarjetas
const variantesTarjeta = {
  visible: (i) => ({
    transition: {
      delay: i * 0.05 // Cambiar de 0.1 a 0.05
    }
  })
};
```

### Cambiar Formato de Fecha

```javascript
const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short', // Cambiar de 'long' a 'short'
    day: 'numeric'
    // Remover hour y minute para solo mostrar fecha
  });
};
```

## Mejores Prácticas

1. **Validación**: Siempre validar el email antes de enviar
2. **Normalización**: Convertir email a lowercase y hacer trim
3. **Feedback**: Mostrar estados de carga claramente
4. **Errores**: Proporcionar mensajes de error específicos
5. **Accesibilidad**: Usar labels y ARIA attributes
6. **Performance**: Limpiar estados al desmontar
7. **Seguridad**: No exponer información sensible en URLs

## Troubleshooting

### Problema: No se muestran las cotizaciones
**Solución**: Verificar que el email esté registrado en el backend

### Problema: Error al descargar PDF
**Solución**: Verificar que el endpoint `/cotizaciones/:codigoTicket/pdf` esté implementado

### Problema: Animaciones no funcionan
**Solución**: Verificar que Framer Motion esté instalado correctamente

### Problema: Estilos no se aplican
**Solución**: Verificar configuración de Tailwind CSS

## Roadmap Futuro

- [ ] Filtros por fecha y estado
- [ ] Ordenamiento de resultados
- [ ] Paginación para muchas cotizaciones
- [ ] Búsqueda por código de ticket
- [ ] Exportar historial completo
- [ ] Comparación entre cotizaciones
- [ ] Notificaciones de nuevas cotizaciones

## Soporte

Para más información o soporte:
- Revisar `ejemplo-uso-historial-cliente.jsx`
- Consultar tests en `HistorialCliente.test.jsx`
- Revisar documentación de API en `backend/src/controladores/README.md`

---

**�sltima actualización**: Enero 2024  
**Versión**: 1.0.0  
**Autor**: Sistema de Cotización Automatizada - NSG Latinoamerica E.I.R.L.

