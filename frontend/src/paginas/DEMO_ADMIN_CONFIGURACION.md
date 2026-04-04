# Demo: AdminConfiguracion

## Descripción

La página `AdminConfiguracion` permite a los administradores gestionar la configuración del sistema, específicamente:
- Modificar el margen de ganancia aplicado a las cotizaciones
- Visualizar estadísticas de uso de la API de IA (llamadas, costo estimado, tokens)

**Valida Requisitos:** 6.3

## Características Principales

### 1. Gestión de Margen de Ganancia
- Input numérico con validación (0-100%)
- Muestra margen actual vs nuevo margen
- Ejemplos de cálculo en tiempo real
- Botón de guardar habilitado solo cuando hay cambios

### 2. Estadísticas de IA
- Llamadas totales a la API
- Costo estimado acumulado (USD)
- Promedio de tokens por consulta
- Botón de actualización manual
- Indicador de carga

### 3. Validaciones
- Margen entre 0% y 100%
- No permite valores negativos
- Acepta decimales (ej: 15.5%)
- Previene guardado sin cambios

## Estructura del Componente

```
AdminConfiguracion/
�"o�"?�"? Estado de autenticación
�"o�"?�"? Sección: Margen de Ganancia
�",   �"o�"?�"? Input de porcentaje
�",   �"o�"?�"? Margen actual
�",   �"o�"?�"? Ejemplos de precios
�",   �""�"?�"? Botón guardar
�""�"?�"? Sección: Estadísticas de IA
    �"o�"?�"? Llamadas totales
    �"o�"?�"? Costo estimado
    �"o�"?�"? Promedio tokens
    �""�"?�"? Botón actualizar
```

## Uso del Contexto

```javascript
const { 
  autenticado,           // Verifica acceso
  margenGanancia,        // Margen actual
  actualizarMargen       // Función para actualizar
} = useAppContext();
```

## Flujo de Actualización de Margen

1. Usuario modifica el input de porcentaje
2. Ejemplos de precios se actualizan en tiempo real
3. Botón "Guardar" se habilita
4. Al hacer clic en guardar:
   - Se llama a `actualizarMargen(nuevoValor)`
   - Se muestra mensaje de éxito
   - El margen se actualiza en el contexto global
5. Nuevas cotizaciones usarán el nuevo margen

## Ejemplos de Precios

El componente muestra 3 ejemplos con diferentes precios base:
- S/ 1000 �?' Precio final con margen
- S/ 2500 �?' Precio final con margen
- S/ 5000 �?' Precio final con margen

Fórmula: `Precio Final = Precio Base �- (1 + Margen/100)`

## Estadísticas de IA

### Datos Mostrados

1. **Llamadas Totales**: Número de consultas a la API de IA
2. **Costo Estimado**: Costo acumulado en USD
3. **Promedio Tokens**: Tokens promedio por consulta

### Actualización

- Se cargan automáticamente al montar el componente
- Botón "�Y"" Actualizar" para refrescar manualmente
- Manejo de errores con valores por defecto (0)

## Animaciones

Usa Framer Motion para:
- Fade in de secciones
- Hover en tarjetas de estadísticas
- Aparición de mensajes de éxito/error
- Interacciones con botones

## Estilos

- Tailwind CSS para diseño responsivo
- Gradientes en tarjetas de estadísticas
- Colores semánticos (azul, verde, púrpura)
- Diseño de tarjetas con sombras

## Protección de Ruta

Si el usuario no está autenticado:
```jsx
<div className="min-h-screen bg-gray-100 flex items-center justify-center">
  <div className="text-center">
    <h2>Acceso Denegado</h2>
    <p>Debes iniciar sesión para acceder</p>
  </div>
</div>
```

## Mensajes de Feedback

### �?xito
```
Margen de ganancia actualizado a X%
```
- Fondo verde
- Se oculta automáticamente después de 3 segundos

### Error
```
Error al actualizar el margen de ganancia
```
- Fondo rojo
- Permanece hasta que el usuario realice otra acción

## Integración con API

### Obtener Estadísticas
```javascript
const stats = await api.obtenerEstadisticasIA();
// Retorna: { llamadas, costoEstimado, promedioTokens }
```

### Actualizar Margen
```javascript
actualizarMargen(nuevoMargen);
// Actualiza el contexto global
```

## Casos de Uso

### Caso 1: Ajustar Margen de Ganancia
1. Admin accede a la página
2. Ve margen actual: 20%
3. Cambia a 25%
4. Ve ejemplos actualizados
5. Hace clic en "Guardar Cambios"
6. Recibe confirmación
7. Nuevas cotizaciones usan 25%

### Caso 2: Monitorear Uso de IA
1. Admin accede a la página
2. Ve estadísticas cargándose
3. Observa:
   - 150 llamadas
   - $0.75 USD gastado
   - 500 tokens promedio
4. Hace clic en "Actualizar"
5. Estadísticas se refrescan

### Caso 3: Validación de Input
1. Admin intenta ingresar -5%
2. Input no acepta el valor
3. Admin intenta ingresar 150%
4. Input no acepta el valor
5. Admin ingresa 15.5%
6. Valor aceptado correctamente

## Testing

El componente incluye tests para:
- �o. Protección de acceso
- �o. Renderizado correcto
- �o. Cambio de margen
- �o. Cálculo de ejemplos
- �o. Validaciones (0-100%)
- �o. Guardado de cambios
- �o. Mensajes de feedback
- �o. Carga de estadísticas
- �o. Actualización manual
- �o. Manejo de errores

## Mejoras Futuras

1. **Historial de Cambios**: Mostrar log de cambios de margen
2. **Gráficos**: Visualizar tendencias de uso de IA
3. **Alertas**: Notificar cuando el costo supere un umbral
4. **Configuraciones Adicionales**: Otros parámetros del sistema
5. **Exportar Estadísticas**: Descargar reporte en CSV/PDF

## Notas Técnicas

- El margen se almacena en el contexto global (`AppContext`)
- Las estadísticas se obtienen del endpoint `/api/ia/estadisticas`
- El componente es responsivo (mobile-first)
- Usa `useState` para estado local y `useEffect` para carga inicial
- Implementa debouncing implícito en el cálculo de ejemplos

## Dependencias

```json
{
  "react": "^18.0.0",
  "framer-motion": "^10.0.0",
  "tailwindcss": "^3.0.0"
}
```

## Ejemplo de Integración

```jsx
import AdminConfiguracion from './paginas/AdminConfiguracion';

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
      </Routes>
    </AppProvider>
  );
}
```

