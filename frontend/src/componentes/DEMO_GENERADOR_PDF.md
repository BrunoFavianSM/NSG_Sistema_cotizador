# GeneradorPDF - Documentación Completa

## Descripción

El componente `GeneradorPDF` es responsable de generar cotizaciones formales en el sistema. Permite al usuario proporcionar datos opcionales del cliente, crea la cotización en el backend, y proporciona acceso a los PDFs generados (cotización con precios y listado técnico).

## Características

✅ **Solicitud de Datos del Cliente**: Email, nombre y teléfono opcionales  
✅ **Validación de Email**: Verifica formato válido antes de enviar  
✅ **Generación de Cotización**: Crea cotización en el backend con código ticket único  
✅ **Visualización de Código Ticket**: Muestra el código NSG-YYYY-NNNN generado  
✅ **Descarga de PDFs**: Botones para descargar cotización y listado técnico  
✅ **Manejo de Errores**: Feedback claro en caso de problemas  
✅ **Estados de Carga**: Indicadores visuales durante el proceso  
✅ **Diseño Responsivo**: Funciona en móvil, tablet y escritorio  
✅ **Animaciones Suaves**: Transiciones con Framer Motion  
✅ **Notificaciones**: Integración con Sileo para feedback

## Requisitos Validados

- **7.1**: Generar presupuesto en PDF
- **7.2**: Solicitar email opcional del cliente
- **7.3**: Generar código único (ticket)
- **7.4**: Incluir información completa en PDF
- **7.5**: Permitir descarga inmediata
- **8.3**: Asociación condicional con cliente

## Props

### `configuracion` (requerido)
**Tipo**: `Object`  
**Descripción**: Objeto con los componentes seleccionados para la cotización.

```javascript
{
  procesador: { id: 1, nombre: 'Intel Core i5', precio_base: 1200 },
  placa_madre: { id: 2, nombre: 'ASUS B550', precio_base: 800 },
  ram: [{ id: 3, nombre: 'Corsair 16GB', precio_base: 400 }],
  almacenamiento: { id: 4, nombre: 'Samsung 1TB SSD', precio_base: 600 },
  gpu: { id: 5, nombre: 'RTX 3060', precio_base: 2500 },
  fuente: { id: 6, nombre: 'EVGA 650W', precio_base: 450 },
  case: { id: 7, nombre: 'NZXT H510', precio_base: 350 }
}
```

### `margenGanancia` (opcional)
**Tipo**: `Number`  
**Default**: `20`  
**Descripción**: Porcentaje de margen de ganancia a aplicar.

### `onExito` (opcional)
**Tipo**: `Function`  
**Parámetros**: `(cotizacion: Object) => void`  
**Descripción**: Callback ejecutado cuando la cotización se genera exitosamente.

```javascript
const manejarExito = (cotizacion) => {
  console.log('Cotización generada:', cotizacion.codigo_ticket);
  // Hacer algo con la cotización
};
```

### `onError` (opcional)
**Tipo**: `Function`  
**Parámetros**: `(error: Error) => void`  
**Descripción**: Callback ejecutado cuando ocurre un error.

```javascript
const manejarError = (error) => {
  console.error('Error:', error.message);
  // Manejar el error
};
```

### `className` (opcional)
**Tipo**: `String`  
**Default**: `''`  
**Descripción**: Clases CSS adicionales para el botón principal.

## Uso Básico

```jsx
import GeneradorPDF from './componentes/GeneradorPDF';

function MiComponente() {
  const configuracion = {
    procesador: { id: 1, nombre: 'Intel Core i5', precio_base: 1200 },
    placa_madre: { id: 2, nombre: 'ASUS B550', precio_base: 800 },
    ram: [{ id: 3, nombre: 'Corsair 16GB', precio_base: 400 }],
    almacenamiento: { id: 4, nombre: 'Samsung 1TB SSD', precio_base: 600 },
    gpu: { id: 5, nombre: 'RTX 3060', precio_base: 2500 },
    fuente: { id: 6, nombre: 'EVGA 650W', precio_base: 450 },
    case: { id: 7, nombre: 'NZXT H510', precio_base: 350 }
  };

  return (
    <div>
      <h1>Mi Cotizador</h1>
      <GeneradorPDF configuracion={configuracion} />
    </div>
  );
}
```

## Uso con Contexto Global

```jsx
import GeneradorPDF from './componentes/GeneradorPDF';
import { useAppContext } from './contexto/AppContext';

function MiComponente() {
  const { configuracionSeleccionada, margenGanancia } = useAppContext();

  return (
    <GeneradorPDF 
      configuracion={configuracionSeleccionada}
      margenGanancia={margenGanancia}
    />
  );
}
```

## Uso con Callbacks

```jsx
import { useState } from 'react';
import GeneradorPDF from './componentes/GeneradorPDF';

function MiComponente() {
  const [ultimaCotizacion, setUltimaCotizacion] = useState(null);

  const manejarExito = (cotizacion) => {
    setUltimaCotizacion(cotizacion);
    console.log('Código ticket:', cotizacion.codigo_ticket);
  };

  const manejarError = (error) => {
    console.error('Error:', error);
    alert('No se pudo generar la cotización');
  };

  return (
    <div>
      <GeneradorPDF 
        configuracion={configuracion}
        onExito={manejarExito}
        onError={manejarError}
      />

      {ultimaCotizacion && (
        <div>
          <p>Última cotización: {ultimaCotizacion.codigo_ticket}</p>
          <p>Total: S/ {ultimaCotizacion.precio_total.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
```

## Estructura del Objeto Cotización

Cuando se genera exitosamente, el objeto cotización tiene la siguiente estructura:

```javascript
{
  id: 1,
  codigo_unico: '123e4567-e89b-12d3-a456-426614174000',
  codigo_ticket: 'NSG-2024-0001',
  fecha_emision: '2024-01-15T10:00:00.000Z',
  fecha_validez: '2024-01-18T10:00:00.000Z',
  precio_total: 7560.00,
  margen_aplicado: 20,
  estado: 'Pendiente',
  componentes: [
    {
      id: 1,
      id_producto: 1,
      nombre: 'Intel Core i5',
      categoria: 'procesador',
      precio_unitario: 1200.00,
      cantidad: 1,
      disponible_stock: true
    },
    // ... más componentes
  ]
}
```

## Flujo de Uso

1. **Usuario hace clic en "Generar Cotización PDF"**
   - Se abre un modal con formulario

2. **Usuario proporciona datos opcionales**
   - Email (validado)
   - Nombre completo
   - Teléfono

3. **Usuario hace clic en "Generar Cotización"**
   - Se valida el email si fue proporcionado
   - Se preparan los componentes
   - Se envía solicitud al backend
   - Se muestra indicador de carga

4. **Backend procesa la solicitud**
   - Valida disponibilidad de productos
   - Genera código ticket único
   - Crea registro en base de datos
   - Retorna información de la cotización

5. **Se muestra el resultado**
   - Código ticket en grande
   - Información de la cotización
   - Botones para descargar PDFs
   - Instrucciones para reclamar

## Validaciones

### Email
- Formato válido: `usuario@dominio.com`
- Opcional: puede dejarse vacío
- Validación en tiempo real con feedback visual

### Componentes
- Debe haber al menos un componente seleccionado
- Cada componente debe tener `id` y `precio_base`
- RAM puede ser un array con múltiples módulos

## Estados del Componente

### Estado Inicial
- Modal cerrado
- Formulario vacío
- Sin errores

### Estado de Carga
- Botón deshabilitado
- Spinner visible
- Texto "Generando..."

### Estado de Éxito
- Código ticket visible
- Información de cotización mostrada
- Botones de descarga habilitados

### Estado de Error
- Mensaje de error visible
- Formulario habilitado para reintentar
- Notificación Sileo de error

## Integración con Backend

### Endpoint Utilizado
```
POST /api/cotizaciones
```

### Payload Enviado
```javascript
{
  componentes: [
    { id_producto: 1, cantidad: 1 },
    { id_producto: 2, cantidad: 1 },
    // ...
  ],
  email_cliente: 'cliente@example.com',  // opcional
  nombre_cliente: 'Juan Pérez',          // opcional
  telefono_cliente: '999888777'          // opcional
}
```

### Respuesta Esperada
```javascript
{
  exito: true,
  mensaje: 'Cotización creada exitosamente',
  cotizacion: {
    id: 1,
    codigo_ticket: 'NSG-2024-0001',
    // ... más datos
  }
}
```

## Descarga de PDFs

**Nota**: La funcionalidad de descarga de PDFs está pendiente de implementación en el backend.

Se requieren los siguientes endpoints:
```
GET /api/cotizaciones/:codigoTicket/pdf/cotizacion
GET /api/cotizaciones/:codigoTicket/pdf/listado
```

Actualmente, al hacer clic en los botones de descarga, se muestra un mensaje informativo.

## Estilos y Diseño

### Colores
- **Botón principal**: Gradiente verde (green-600 a emerald-600)
- **Código ticket**: Azul (blue-700)
- **Precio total**: Verde (green-600)
- **Errores**: Rojo (red-600)
- **Advertencias**: Amarillo (yellow-600)

### Responsividad
- **Móvil**: Modal ocupa toda la pantalla
- **Tablet/Desktop**: Modal centrado con ancho fijo (550px)

### Animaciones
- **Entrada del modal**: Scale + fade in
- **Salida del modal**: Scale + fade out
- **Botón hover**: Scale 1.02
- **Botón click**: Scale 0.98

## Accesibilidad

- ✅ Etiquetas descriptivas en inputs
- ✅ Placeholders informativos
- ✅ Estados disabled claros
- ✅ Feedback visual en validaciones
- ✅ Mensajes de error descriptivos
- ✅ Botones con íconos y texto

## Manejo de Errores

### Errores Comunes

1. **Sin componentes seleccionados**
   ```
   Error: No hay componentes seleccionados
   ```

2. **Email inválido**
   ```
   Validación en tiempo real con mensaje "Email inválido"
   ```

3. **Error de red**
   ```
   Error: No se pudo conectar con el servidor
   ```

4. **Producto no disponible**
   ```
   Error: Producto "..." no está disponible
   ```

## Testing

El componente incluye tests exhaustivos:

- ✅ Renderizado del botón principal
- ✅ Apertura y cierre del modal
- ✅ Validación de email
- ✅ Generación de cotización
- ✅ Manejo de errores
- ✅ Callbacks onExito y onError
- ✅ Estados de carga
- ✅ Múltiples módulos RAM
- ✅ Props personalizadas

Ejecutar tests:
```bash
npm test GeneradorPDF.test.jsx
```

## Mejoras Futuras

1. **Descarga de PDFs**: Implementar endpoints en backend
2. **Vista previa**: Mostrar preview del PDF antes de descargar
3. **Compartir**: Opción para compartir cotización por email
4. **Historial**: Mostrar historial de cotizaciones del cliente
5. **Impresión**: Opción para imprimir directamente
6. **QR Code**: Generar código QR con el código ticket

## Dependencias

- `react`: ^18.0.0
- `framer-motion`: ^10.0.0
- `prop-types`: ^15.8.0

## Notas Técnicas

- El componente usa `useState` para manejo de estado local
- Las animaciones son manejadas por Framer Motion
- La validación de email usa regex estándar
- Los PDFs se generan en el backend con PDFKit
- El código ticket sigue el formato NSG-YYYY-NNNN

## Soporte

Para reportar bugs o solicitar features, contacta al equipo de desarrollo.

## Licencia

Este componente es parte del Sistema de Cotización Automatizada de NSG Latinoamerica E.I.R.L.
