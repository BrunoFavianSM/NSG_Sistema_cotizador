# Servicio de Asistente IA Conversacional

## Descripción

El Asistente IA es un servicio conversacional que ayuda a los clientes a encontrar la configuración de computadora ideal mediante un diálogo de 3-5 preguntas. Utiliza Google Gemini 1.5 Flash para generar recomendaciones personalizadas basadas en presupuesto, usos y preferencias del cliente.

## Características Principales

### 1. Flujo Conversacional
- Inicia conversación con mensaje del cliente
- Hace preguntas específicas para recopilar información
- Extrae automáticamente: presupuesto, usos principales, preferencias de marca
- Genera recomendación cuando tiene información suficiente

### 2. Optimizaciones de Costo
El servicio implementa múltiples estrategias para minimizar costos de API:

- **Modelo Económico**: Usa `gemini-1.5-flash` (10x más barato que gemini-pro)
- **Límite de Tokens**: Máximo 200 tokens de salida por request
- **Prompts Compactos**: Formato optimizado para reducir tokens de entrada
- **Filtrado Inteligente**: Solo envía top 3 productos por categoría
- **Cache de Recomendaciones**: Almacena recomendaciones por 1 hora
- **Historial Limitado**: Solo últimos 3 mensajes en contexto
- **Fallback sin IA**: Recomendación basada en reglas si falla la API

### 3. Validación de Recomendaciones
- Solo recomienda productos disponibles (stock > 0 O disponible_a_pedido)
- Valida compatibilidad de componentes
- Advierte sobre productos a pedido con tiempo de entrega
- Filtra productos inexistentes

## Uso

### Iniciar Conversación

```javascript
const asistenteIA = require('./servicios/asistenteIA');

const resultado = await asistenteIA.iniciarConversacion(
  'Necesito una computadora para gaming'
);

console.log(resultado);
// {
//   sesionId: 'uuid-v4',
//   pregunta: '¿Cuál es tu presupuesto aproximado?',
//   contexto: { ... }
// }
```

### Continuar Conversación

```javascript
const resultado = await asistenteIA.continuarConversacion(
  sesionId,
  'Entre 3000 y 4000 soles'
);

if (resultado.completado) {
  console.log('Recomendación:', resultado.recomendacion);
} else {
  console.log('Siguiente pregunta:', resultado.pregunta);
}
```

### Obtener Estadísticas

```javascript
const stats = asistenteIA.obtenerEstadisticas();
console.log(stats);
// {
//   llamadas: 150,
//   costoEstimado: '0.0015',
//   promedioTokens: 500,
//   cacheSize: 12
// }
```

## Endpoints API

### POST /api/ia/iniciar
Inicia una nueva conversación con el asistente.

**Request:**
```json
{
  "mensajeInicial": "Necesito una PC para diseño gráfico"
}
```

**Response:**
```json
{
  "sesionId": "550e8400-e29b-41d4-a716-446655440000",
  "pregunta": "¿Cuál es tu presupuesto aproximado?",
  "contexto": {
    "mensajeInicial": "Necesito una PC para diseño gráfico",
    "presupuesto": null,
    "usosPrincipales": ["diseño"],
    "preferencias": {},
    "preguntasRealizadas": 0
  }
}
```

### POST /api/ia/continuar
Continúa una conversación existente.

**Request:**
```json
{
  "sesionId": "550e8400-e29b-41d4-a716-446655440000",
  "respuestaCliente": "Entre 4000 y 5000 soles"
}
```

**Response (conversación en progreso):**
```json
{
  "completado": false,
  "pregunta": "¿Qué programas de diseño usarás principalmente?"
}
```

**Response (conversación completada):**
```json
{
  "completado": true,
  "recomendacion": {
    "componentes": {
      "procesador": { "id": 1, "nombre": "Ryzen 7 5800X", ... },
      "placa_madre": { "id": 5, "nombre": "B550 AORUS", ... },
      "ram": [{ "id": 10, "nombre": "DDR4 32GB", ... }],
      "almacenamiento": { "id": 15, "nombre": "SSD 1TB", ... },
      "gpu": { "id": 20, "nombre": "RTX 3060", ... },
      "fuente": { "id": 25, "nombre": "650W 80+ Bronze", ... },
      "case": { "id": 30, "nombre": "NZXT H510", ... }
    },
    "explicacion": "Configuración óptima para diseño gráfico con Adobe Suite",
    "advertencias": [
      "SSD 1TB: A pedido (7 días)"
    ]
  }
}
```

### GET /api/ia/estadisticas
Obtiene estadísticas de uso del servicio (para monitoreo).

**Response:**
```json
{
  "llamadas": 150,
  "costoEstimado": "0.0015",
  "promedioTokens": 500,
  "cacheSize": 12
}
```

## Extracción de Contexto

El servicio extrae automáticamente información de las respuestas del cliente:

### Presupuesto
- Detecta números de 3-5 dígitos
- Si hay 2 números: min y max
- Si hay 1 número: min = número, max = número * 1.2

**Ejemplos:**
- "Entre 3000 y 4000" → { min: 3000, max: 4000 }
- "Tengo 5000 soles" → { min: 5000, max: 6000 }

### Usos Principales
Detecta keywords en la respuesta:

- **gaming**: gaming, juegos, jugar, gamer, videojuegos
- **diseño**: diseño, photoshop, render, ilustración, gráfico
- **video**: video, edición, premiere, after effects, editar
- **oficina**: oficina, trabajo, excel, word, documentos
- **programacion**: programar, desarrollo, código, programación, developer

### Preferencias de Marca
- **Intel**: "intel"
- **AMD**: "amd" + "ryzen"
- **NVIDIA**: "nvidia" o "geforce"
- **AMD GPU**: "radeon"

## Fallback sin IA

Si la API de Gemini falla o no está disponible, el servicio usa un sistema de recomendación basado en reglas:

1. Selecciona procesador dentro del 25% del presupuesto
2. Selecciona placa madre compatible (mismo socket)
3. Selecciona RAM compatible (mismo tipo)
4. Selecciona almacenamiento dentro del 10% del presupuesto
5. Si es gaming/diseño: incluye GPU (35% del presupuesto)
6. Selecciona fuente y case

## Estimación de Costos

Con las optimizaciones implementadas:

- **Costo por recomendación**: ~$0.00001 USD
- **1000 recomendaciones/mes**: ~$0.50 USD
- **Con cache (40-60% hits)**: ~$0.20-0.30 USD/mes

## Variables de Entorno

```bash
# API Key de Google Gemini
AI_API_KEY=tu_api_key_aqui
```

## Limitaciones

- **Rate Limiting**: 5 requests por minuto por IP
- **Longitud de mensaje**: 5-500 caracteres
- **Máximo de preguntas**: 5 por conversación
- **Cache TTL**: 1 hora

## Pruebas

```bash
# Ejecutar pruebas unitarias
npm test -- asistenteIA.test.js

# Ejecutar con cobertura
npm test -- asistenteIA.test.js --coverage
```

## Monitoreo

El servicio mantiene contadores internos:
- Número de llamadas a la API
- Costo estimado acumulado
- Tamaño del cache

Accede a las estadísticas mediante:
```javascript
const stats = asistenteIA.obtenerEstadisticas();
```

O vía API:
```bash
curl http://localhost:3000/api/ia/estadisticas
```

## Mejoras Futuras

1. **Streaming de respuestas**: Mostrar respuesta mientras se genera
2. **Memoria de conversaciones**: Recordar preferencias de clientes recurrentes
3. **A/B Testing**: Comparar calidad de recomendaciones IA vs reglas
4. **Análisis de sentimiento**: Detectar frustración y ajustar tono
5. **Multiidioma**: Soporte para inglés y otros idiomas

## Referencias

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Optimización de Costos de IA](https://ai.google.dev/pricing)
- [Node-Cache Documentation](https://www.npmjs.com/package/node-cache)
