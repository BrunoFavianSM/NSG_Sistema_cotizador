# Demo: Validador de Cotizaciones

## Descripción

El **Validador de Cotizaciones** es una página del panel administrativo que permite a los vendedores validar cotizaciones de clientes en tienda física. Busca cotizaciones por código ticket, muestra comparación de precios actuales vs históricos, verifica disponibilidad de componentes y permite marcar cotizaciones como reclamadas.

## Características Principales

### 1. Búsqueda por Código Ticket
- Campo de entrada para código ticket (formato: NSG-YYYY-NNNN)
- Conversión automática a mayúsculas
- Validación en tiempo real
- Botón de búsqueda con estado de carga

### 2. Información General de Cotización
- Código de ticket prominente
- Fechas de emisión y validez
- Estado actual (Pendiente, Reclamada, Caducada)
- Badges con colores según estado

### 3. Resumen de Precios
- **Precio Original**: Precio al momento de emisión
- **Precio Actual**: Precio con valores actuales de productos
- **Diferencia**: Cambio total en el precio
- Colores visuales según si aumentó o disminuyó

### 4. Tabla de Componentes
- Lista completa de componentes
- Comparación precio histórico vs actual
- Diferencia por componente
- Indicador de disponibilidad:
  - �o" En Stock (verde)
  - ⏱ A Pedido (naranja)
  - �o- No Disponible (rojo)

### 5. Alertas de Cambios
- Alerta visual cuando hay cambios de precio
- Mensaje diferente según si aumentó o disminuyó
- Colores distintivos (naranja para aumento, azul para disminución)

### 6. Marcar como Reclamada
- Botón para confirmar reclamación
- Solo visible para cotizaciones pendientes
- Confirmación con mensaje de éxito
- Actualización automática del estado

## Flujo de Uso

### Escenario 1: Validar Cotización Vigente

```
1. Cliente llega a tienda con código: NSG-2024-0001
2. Vendedor ingresa código en el campo de búsqueda
3. Sistema muestra:
   - Información general
   - Precios (original: S/ 3500, actual: S/ 3600)
   - Diferencia: +S/ 100
   - Alerta: "Los precios han aumentado"
   - Tabla con 7 componentes
   - Disponibilidad de cada componente
4. Vendedor revisa con cliente el aumento
5. Cliente acepta
6. Vendedor hace clic en "Marcar como Reclamada"
7. Sistema confirma y actualiza estado
```

### Escenario 2: Cotización Caducada

```
1. Cliente llega con código: NSG-2024-0050
2. Vendedor ingresa código
3. Sistema muestra error: "Cotización caducada"
4. Vendedor informa al cliente
5. Cliente debe generar nueva cotización
```

### Escenario 3: Precios Disminuyeron

```
1. Cliente llega con código: NSG-2024-0075
2. Vendedor busca cotización
3. Sistema muestra:
   - Precio original: S/ 4000
   - Precio actual: S/ 3800
   - Diferencia: -S/ 200 (en verde)
   - Alerta: "Los precios han disminuido"
4. Cliente se beneficia del descuento
5. Vendedor marca como reclamada
```

### Escenario 4: Componente No Disponible

```
1. Vendedor busca: NSG-2024-0100
2. Sistema muestra tabla de componentes
3. Un componente muestra: "�o- No Disponible"
4. Vendedor informa al cliente
5. Opciones:
   - Esperar restock
   - Cambiar componente
   - Generar nueva cotización
```

## Validaciones

### Código Ticket
- Formato: NSG-YYYY-NNNN
- Año válido (2020-2099)
- Número de 4 dígitos
- Conversión automática a mayúsculas

### Estados de Cotización
- **Pendiente**: Puede ser reclamada
- **Reclamada**: Ya fue procesada
- **Caducada**: Pasó fecha de validez (3 días)

### Disponibilidad de Componentes
- **En Stock**: stock_actual > 0
- **A Pedido**: stock_actual = 0 && disponible_a_pedido = true
- **No Disponible**: stock_actual = 0 && disponible_a_pedido = false

## Interfaz de Usuario

### Colores de Estado
- **Pendiente**: Amarillo (bg-yellow-100)
- **Reclamada**: Verde (bg-green-100)
- **Caducada**: Rojo (bg-red-100)

### Colores de Diferencia de Precio
- **Aumento**: Rojo (text-red-600)
- **Disminución**: Verde (text-green-600)
- **Sin cambio**: Gris (text-gray-400)

### Animaciones
- Entrada suave de resultados
- Transiciones en hover
- Feedback visual en botones
- Aparición secuencial de filas de tabla

## Manejo de Errores

### Errores Comunes
1. **Código no encontrado**
   - Mensaje: "Cotización no encontrada"
   - Acción: Verificar código con cliente

2. **Cotización caducada**
   - Mensaje: "Cotización caducada"
   - Acción: Generar nueva cotización

3. **Error de conexión**
   - Mensaje: "Error al buscar cotización"
   - Acción: Verificar conexión y reintentar

4. **Error al reclamar**
   - Mensaje: "Error al marcar como reclamada"
   - Acción: Reintentar o contactar soporte

## Requisitos Validados

- **9.1**: Interfaz de búsqueda por código ticket
- **9.2**: Búsqueda en base de datos
- **9.3**: Mensaje de error para código inválido
- **9.4**: Mensaje de error para cotización caducada
- **9.5**: Comparación de precios actuales vs históricos
- **9.6**: Visualización de diferencia total y disponibilidad
- **9.7**: Funcionalidad de marcar como reclamada

## Integración con Backend

### Endpoints Utilizados

```javascript
// Validar cotización con comparación de precios
GET /api/cotizaciones/:codigoTicket/validar

// Respuesta exitosa
{
  exito: true,
  valida: true,
  cotizacion: {
    codigo_ticket: "NSG-2024-0001",
    fecha_emision: "2024-01-15T10:00:00Z",
    fecha_validez: "2024-01-18T10:00:00Z",
    estado: "Pendiente",
    precio_total_historico: 3500.00,
    precio_total_actual: 3600.00,
    diferencia_total: 100.00,
    hay_cambios_precio: true,
    componentes: [...]
  }
}

// Marcar como reclamada
PUT /api/cotizaciones/:codigoTicket/reclamar

// Respuesta exitosa
{
  exito: true,
  mensaje: "Cotización marcada como reclamada",
  cotizacion: {
    codigo_ticket: "NSG-2024-0001",
    estado: "Reclamada",
    fecha_reclamacion: "2024-01-16T14:30:00Z"
  }
}
```

## Accesibilidad

- Labels descriptivos en formularios
- Colores con suficiente contraste
- Feedback visual y textual
- Estados de carga claros
- Mensajes de error descriptivos

## Responsive Design

- **Móvil**: Tabla con scroll horizontal
- **Tablet**: Layout optimizado
- **Desktop**: Vista completa con espaciado amplio

## Testing

### Tests Unitarios
- Búsqueda por código
- Visualización de detalles
- Comparación de precios
- Marcar como reclamada
- Manejo de errores

### Tests de Integración
- Flujo completo de validación
- Actualización de estado
- Sincronización con backend

## Mejoras Futuras

1. **Historial de Búsquedas**
   - Guardar últimas búsquedas del vendedor
   - Acceso rápido a cotizaciones recientes

2. **Impresión**
   - Botón para imprimir resumen
   - Formato optimizado para impresión

3. **Notificaciones**
   - Alertas cuando componente vuelve a stock
   - Notificación de cotizaciones próximas a caducar

4. **Estadísticas**
   - Cotizaciones validadas por vendedor
   - Tiempo promedio de validación
   - Tasa de conversión

5. **Búsqueda Avanzada**
   - Por rango de fechas
   - Por cliente (email)
   - Por estado

## Notas de Implementación

- Usa Framer Motion para animaciones
- Tailwind CSS para estilos
- React Hooks para estado
- Context API para autenticación
- Axios para llamadas API

## Soporte

Para problemas o preguntas:
- Revisar logs del navegador (F12)
- Verificar conexión con backend
- Consultar documentación de API
- Contactar equipo de desarrollo

