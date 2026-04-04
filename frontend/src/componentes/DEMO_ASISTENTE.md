# Demo: Componente Asistente IA

## Descripción

El componente `AsistenteIA` proporciona una interfaz conversacional para que los usuarios interactúen con el asistente de inteligencia artificial y obtengan recomendaciones personalizadas de configuraciones de PC.

## Características Implementadas

�o. **Requisito 5.1**: Botón "Ayuda IA" visible y accesible
- Botón flotante en la esquina inferior derecha
- Diseño atractivo con gradiente purple-blue
- Animaciones suaves al hover

�o. **Requisito 5.2**: Modal/panel con interfaz de chat
- Modal responsivo que se adapta a móvil y escritorio
- Diseño moderno con header colorido
- Opciones para reiniciar o cerrar la conversación

�o. **Requisito 5.3**: Historial de conversación
- Muestra todos los mensajes del usuario y el asistente
- Scroll automático al último mensaje
- Formato diferenciado para mensajes de usuario, asistente y sistema
- Timestamps en cada mensaje

�o. **Requisito 5.4**: Aplicar recomendación
- Tarjeta especial para mostrar la configuración recomendada
- Lista detallada de todos los componentes
- Advertencias sobre componentes a pedido
- Botón para aplicar la recomendación con un click

�o. **Requisito 13.2**: Notificaciones con Sileo
- Notificación de éxito al aplicar recomendación
- Notificación de error si algo falla

�o. **Requisito 13.3**: Animaciones con Framer Motion
- Animaciones suaves al abrir/cerrar modal
- Transiciones en mensajes
- Indicador de "escribiendo" animado
- Efectos hover en botones

## Cómo Usar

### 1. Importar el Componente

```jsx
import AsistenteIA from './componentes/AsistenteIA';
```

### 2. Usar en tu Aplicación

```jsx
function MiCotizador() {
  const [configuracion, setConfiguracion] = useState({
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null
  });

  const manejarAplicarRecomendacion = (componentesRecomendados) => {
    // Actualizar configuración con la recomendación
    setConfiguracion(prev => ({
      ...prev,
      ...componentesRecomendados
    }));
    
    // Opcional: validar compatibilidad, navegar, etc.
  };

  return (
    <div>
      {/* Tu interfaz de cotizador */}
      
      {/* Asistente IA - siempre visible */}
      <AsistenteIA onAplicarRecomendacion={manejarAplicarRecomendacion} />
    </div>
  );
}
```

### 3. Props del Componente

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `onAplicarRecomendacion` | `function` | Sí | Callback que recibe los componentes recomendados cuando el usuario acepta la recomendación |
| `className` | `string` | No | Clases CSS adicionales para el botón flotante |

## Flujo de Conversación

1. **Usuario hace click en "Ayuda IA"**
   - Se abre el modal con mensaje de bienvenida

2. **Usuario escribe su necesidad inicial**
   - Ejemplo: "Necesito una PC para gaming"
   - Se envía al backend que inicia la conversación

3. **IA hace preguntas para recopilar información**
   - Presupuesto: "¿Cuál es tu presupuesto aproximado?"
   - Uso: "¿Para qué usarás principalmente la PC?"
   - Preferencias: "¿Tienes alguna preferencia de marca?"

4. **Después de 3-5 preguntas, IA genera recomendación**
   - Se muestra una tarjeta especial con la configuración
   - Lista todos los componentes recomendados
   - Muestra advertencias si hay componentes a pedido

5. **Usuario puede aplicar la recomendación**
   - Click en "Aplicar esta Configuración"
   - Se ejecuta el callback `onAplicarRecomendacion`
   - Se cierra el modal automáticamente

## Ejemplo de Recomendación

```javascript
{
  componentes: {
    procesador: { id: 1, nombre: 'Intel Core i5-13400F' },
    placa_madre: { id: 5, nombre: 'ASUS B660M-A' },
    ram: [
      { id: 10, nombre: 'Corsair Vengeance 16GB DDR4' }
    ],
    almacenamiento: { id: 15, nombre: 'Kingston NV2 500GB NVMe' },
    gpu: { id: 20, nombre: 'NVIDIA RTX 3060 12GB' },
    fuente: { id: 25, nombre: 'Cooler Master 650W 80+ Bronze' },
    case: { id: 30, nombre: 'NZXT H510 Flow' }
  },
  explicacion: 'Configuración ideal para gaming 1080p con excelente relación precio-rendimiento',
  advertencias: [
    'GPU: A pedido (7 días)',
    'Fuente ajustada: recomendado 700W para mayor margen'
  ]
}
```

## Características Técnicas

### Estado del Componente

- `modalAbierto`: Controla la visibilidad del modal
- `sesionId`: ID de la sesión de conversación con el backend
- `historial`: Array de mensajes (usuario, asistente, sistema)
- `mensajeActual`: Texto que el usuario está escribiendo
- `cargando`: Indica si se está esperando respuesta de la IA
- `recomendacionFinal`: Objeto con la configuración recomendada
- `error`: Mensaje de error si algo falla

### Integración con Backend

El componente usa dos funciones de la API:

1. **`iniciarConversacionIA(mensajeInicial)`**
   - Inicia una nueva conversación
   - Retorna: `{ sesionId, pregunta, contexto }`

2. **`continuarConversacionIA(sesionId, respuestaCliente)`**
   - Continúa una conversación existente
   - Retorna: `{ completado, pregunta?, recomendacion? }`

### Manejo de Errores

- Si falla la comunicación con el backend, se muestra un mensaje de error
- El usuario puede intentar de nuevo
- Se muestra un mensaje en el chat indicando el problema
- Fallback graceful: el usuario puede reiniciar la conversación

### Accesibilidad

- Input con placeholder descriptivo
- Botones con títulos (tooltips)
- Colores con buen contraste
- Navegación por teclado (Enter para enviar)
- Indicadores visuales claros de estado

## Personalización

### Cambiar Posición del Botón

```jsx
<AsistenteIA 
  onAplicarRecomendacion={manejarAplicarRecomendacion}
  className="bottom-20 right-20" // Personalizar posición
/>
```

### Estilos del Modal

El modal usa clases de Tailwind CSS. Puedes modificar:
- Tamaño: `md:w-[450px] md:h-[650px]`
- Colores del header: `from-purple-600 to-blue-600`
- Bordes: `rounded-2xl`

## Testing

El componente incluye tests unitarios que verifican:

�o. Renderizado del botón "Ayuda IA"
�o. Apertura del modal
�o. Mensaje de bienvenida
�o. Envío de mensajes
�o. Inicio de conversación
�o. Continuación de conversación
�o. Mostrar recomendación
�o. Aplicar recomendación
�o. Manejo de errores
�o. Reiniciar conversación
�o. Cerrar modal

Ejecutar tests:
```bash
npm test AsistenteIA.test.jsx
```

## Notas de Implementación

1. **Optimización de Costos de IA**
   - El backend usa `gemini-1.5-flash` (10x más barato)
   - Limita tokens de salida a 200
   - Filtra productos por presupuesto
   - Cache de recomendaciones (1 hora)
   - Solo últimos 3 mensajes en historial

2. **Experiencia de Usuario**
   - Scroll automático al último mensaje
   - Indicador de "escribiendo" mientras la IA procesa
   - Deshabilitar input cuando hay recomendación final
   - Opción de reiniciar conversación en cualquier momento

3. **Responsive Design**
   - En móvil: modal ocupa toda la pantalla
   - En desktop: modal flotante en esquina inferior derecha
   - Botón flotante siempre visible

## Próximas Mejoras (Opcionales)

- [ ] Soporte para adjuntar imágenes
- [ ] Historial de conversaciones previas
- [ ] Exportar conversación como PDF
- [ ] Sugerencias rápidas (botones predefinidos)
- [ ] Modo oscuro
- [ ] Sonidos de notificación
- [ ] Typing indicators más elaborados
- [ ] Reacciones a mensajes (�Y'� �Y'Z)

## Soporte

Para problemas o preguntas sobre el componente:
1. Revisar este documento
2. Revisar el código fuente con comentarios
3. Ejecutar los tests para verificar funcionalidad
4. Consultar la documentación del backend (README_IA.md)

