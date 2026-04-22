# Documento de Diseno - Asistente IA NSG Concierge (v2.0)

## Introduccion

Este documento describe el diseno tecnico para la mejora del Asistente IA NSG Concierge (v2.0). El sistema evoluciona el asistente conversacional existente hacia un concierge de hardware inteligente que guia a usuarios no expertos en la cotizacion de PCs, con validacion automatica de compatibilidad, argumentacion economica y experiencia Apple HIG.

El diseno se integra al cotizador existente (React + Tailwind + Node.js + PostgreSQL) reutilizando el AppContext, el sistema de tipo de cambio USD/PEN y la base de datos de productos ya implementados.

La API de IA utilizada es Google Gemini (compatible con el patron de llamadas genericas a LLMs), aunque el diseno permite sustituir el proveedor sin cambios estructurales.

---

## 1. Arquitectura General del Sistema

### 1.1 Vision de Alto Nivel

```
Usuario
  |
  v
[AsistenteIA.jsx]  <-->  [useAsistenteIA hook]
  |                              |
  v                              v
[Chat UI]              [POST /api/asistente/mensaje]
[QuickReplies]                   |
[SemaforoCapacidades]            v
[ConfiguracionPropuesta]   [controladorAsistente.js]
                                 |
                    +------------+------------+
                    |            |            |
                    v            v            v
              [LLM Service]  [Validador]  [BD Productos]
              (Gemini API)   Compatib.    (existente)
                    |            |
                    +-----+------+
                          |
                    [Loop Double-Check]
                    max 3 intentos
                          |
                          v
                   Respuesta validada al usuario
```

### 1.2 Capas del Sistema

| Capa | Responsabilidad | Tecnologia |
|------|----------------|------------|
| Presentacion | Chat UI, Quick Replies, Semaforo | React + Tailwind |
| Estado | Mensajes, sesion, configuracion propuesta | useAsistenteIA hook |
| Comunicacion | Llamadas HTTP al backend | servicios/asistente.js |
| Orquestacion | Flujo LLM + validacion + loop | controladorAsistente.js |
| IA | Generacion de respuestas y configuraciones | Google Gemini API |
| Validacion | Compatibilidad de componentes | servicioValidacionAsistente.js |
| Persistencia | Sesiones, mensajes, configuraciones | PostgreSQL |

---

## 2. Flujo de Interaccion Principal

### 2.1 Cuestionario de Estilo de Vida

```
Usuario abre el asistente
        |
        v
IA saluda y presenta Quick Replies iniciales
        |
        v
Pregunta 1: Uso principal
  [Gaming] [Trabajo/Oficina] [Edicion de video] [Uso general]
        |
        v
Pregunta 2: Calidad de juego (si aplica)
  [Estandar 1080p] [Alta 1440p] [Ultra 4K]
        |
        v
Pregunta 3: Multitarea
  [Solo jugar] [Jugar + Streaming] [Jugar + Grabar]
        |
        v
Pregunta 4: Entorno
  [Normal] [Silencioso (noche/trabajo)]
        |
        v
Pregunta 5: Presupuesto en soles
  [Hasta S/2,000] [S/2,000-4,000] [S/4,000-7,000] [Mas de S/7,000]
        |
        v
IA clasifica: Basico / Intermedio / Avanzado / Gamer Full
        |
        v
[Loop Double-Check] --> Propuesta validada
        |
        v
Presenta configuracion con Semaforo + Argumentacion de valor
```

### 2.2 Loop Double-Check (Arquitectura Interna)

```
controladorAsistente.js
        |
        v
1. LLM genera configuracion (IDs de productos)
        |
        v
2. servicioValidacionAsistente.validar(ids)
        |
   [Compatible?]
   /           \
  SI            NO (max 3 intentos)
  |              |
  v              v
Mostrar al   Construir prompt de correccion:
usuario      "Procesador X incompatible con placa Y.
             Socket AM5 != LGA1700. Selecciona
             placa compatible con AM5."
              |
              v
             LLM corrige y reintenta
              |
              v (si falla 3 veces)
             Ofrecer asesor humano por WhatsApp
```

---

## 3. Esquema de Base de Datos

### 3.1 Tablas Nuevas

```sql
-- Sesiones del asistente (anonimas o autenticadas)
CREATE TABLE IF NOT EXISTS asistente_sesiones (
  id              SERIAL PRIMARY KEY,
  sesion_id       UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  usuario_id      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  perfil_usuario  VARCHAR(20) CHECK (perfil_usuario IN ('basico','intermedio','avanzado','gamer_full')),
  presupuesto_pen NUMERIC(10,2),
  estado          VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa','completada','abandonada')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asistente_sesiones_usuario ON asistente_sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_asistente_sesiones_sesion  ON asistente_sesiones(sesion_id);

-- Mensajes de cada sesion
CREATE TABLE IF NOT EXISTS asistente_mensajes (
  id         SERIAL PRIMARY KEY,
  sesion_id  UUID NOT NULL REFERENCES asistente_sesiones(sesion_id) ON DELETE CASCADE,
  rol        VARCHAR(10) NOT NULL CHECK (rol IN ('user','assistant','system')),
  contenido  TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asistente_mensajes_sesion ON asistente_mensajes(sesion_id);

-- Configuraciones propuestas y validadas
CREATE TABLE IF NOT EXISTS asistente_configuraciones (
  id                   SERIAL PRIMARY KEY,
  sesion_id            UUID NOT NULL REFERENCES asistente_sesiones(sesion_id) ON DELETE CASCADE,
  configuracion        JSONB NOT NULL,
  precio_total_usd     NUMERIC(10,2),
  validada             BOOLEAN NOT NULL DEFAULT FALSE,
  intentos_validacion  INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asistente_config_sesion ON asistente_configuraciones(sesion_id);
```

### 3.2 Estructura del campo metadata (asistente_mensajes)

```json
{
  "quick_replies": ["Ver configuracion", "Cambiar presupuesto", "Hablar con asesor"],
  "semaforo": {
    "gaming": 4,
    "edicion_video": 2,
    "productividad": 5,
    "streaming": 3,
    "renderizado_3d": 1
  },
  "configuracion_id": 42,
  "tiempo_respuesta_ms": 1240,
  "intentos_validacion": 1
}
```

### 3.3 Estructura del campo configuracion (asistente_configuraciones)

```json
{
  "procesador":     { "id": 12, "nombre": "AMD Ryzen 5 7600X",       "precio_usd": 189.99 },
  "placa_madre":    { "id": 34, "nombre": "MSI B650 Tomahawk",        "precio_usd": 159.99 },
  "ram":            [{ "id": 56, "nombre": "Kingston 16GB DDR5",      "precio_usd": 49.99 }],
  "almacenamiento": { "id": 78, "nombre": "Samsung 970 Evo 1TB",      "precio_usd": 79.99 },
  "gpu":            { "id": 90, "nombre": "RTX 4060 8GB",             "precio_usd": 299.99 },
  "fuente":         { "id": 23, "nombre": "Corsair 650W 80+ Gold",    "precio_usd": 89.99 },
  "case":           { "id": 45, "nombre": "NZXT H510",                "precio_usd": 69.99 }
}
```

---

## 4. API REST - Endpoints

### 4.1 Tabla de Endpoints

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /api/asistente/nueva-sesion | Opcional | Inicia sesion nueva |
| POST | /api/asistente/mensaje | Opcional | Envia mensaje al asistente |
| POST | /api/asistente/validar-configuracion | Opcional | Valida compatibilidad |
| GET  | /api/asistente/historial/:usuario_id | JWT | Historial del usuario |
| GET  | /api/asistente/sesion/:sesion_id | Opcional | Mensajes de una sesion |

### 4.2 POST /api/asistente/nueva-sesion

Request:
```json
{ "usuario_id": 5 }
```

Response 201:
```json
{
  "exito": true,
  "sesion_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 4.3 POST /api/asistente/mensaje

Request:
```json
{
  "sesion_id": "550e8400-e29b-41d4-a716-446655440000",
  "mensaje": "Quiero una PC para jugar a 1080p con presupuesto de S/3500",
  "usuario_id": 5
}
```

Response 200:
```json
{
  "exito": true,
  "respuesta": "Perfecto! Con S/3,500 puedo armarte una PC Intermedia...",
  "quick_replies": ["Ver configuracion", "Cambiar presupuesto", "Hablar con asesor"],
  "semaforo": {
    "gaming": 4,
    "edicion_video": 2,
    "productividad": 5,
    "streaming": 3,
    "renderizado_3d": 1
  },
  "configuracion_propuesta": {
    "procesador":     { "id": 12, "nombre": "Ryzen 5 7600X", "precio_pen": 720.00 },
    "placa_madre":    { "id": 34, "nombre": "MSI B650",       "precio_pen": 608.00 },
    "ram":            [{ "id": 56, "nombre": "16GB DDR5",     "precio_pen": 190.00 }],
    "almacenamiento": { "id": 78, "nombre": "1TB NVMe",       "precio_pen": 304.00 },
    "gpu":            { "id": 90, "nombre": "RTX 4060",       "precio_pen": 1140.00 },
    "fuente":         { "id": 23, "nombre": "650W Gold",      "precio_pen": 342.00 },
    "case":           { "id": 45, "nombre": "NZXT H510",      "precio_pen": 266.00 },
    "precio_total_pen": 3570.00,
    "validada": true
  }
}
```

### 4.4 POST /api/asistente/validar-configuracion

Request:
```json
{
  "producto_ids": {
    "procesador": 12,
    "placa_madre": 34,
    "ram": [56],
    "almacenamiento": 78,
    "gpu": 90,
    "fuente": 23,
    "case": 45
  }
}
```

Response 200 (compatible):
```json
{
  "valida": true,
  "errores": [],
  "advertencias": ["La fuente de 650W tiene margen ajustado con esta GPU"]
}
```

Response 200 (incompatible):
```json
{
  "valida": false,
  "errores": [
    "Socket incompatible: procesador AM5 con placa LGA1700",
    "RAM DDR5 incompatible con placa que solo soporta DDR4"
  ],
  "advertencias": []
}
```

---

## 5. Diseno del Backend

### 5.1 Estructura de Archivos Nuevos

```
backend/src/
  controladores/
    controladorAsistente.js         # Orquestador principal
  servicios/
    servicioLLM.js                  # Wrapper Gemini API (intercambiable)
    servicioValidacionAsistente.js  # Logica de compatibilidad de componentes
    servicioSemaforo.js             # Calculo de calificaciones por categoria
    servicioMemoriaPerfil.js        # Historial y personalizacion por usuario
  rutas/
    rutasAsistente.js               # Definicion de rutas Express
  prompts/
    systemPrompt.js                 # Prompt del sistema para el LLM
    promptCorreccion.js             # Prompts del loop de correccion
```

### 5.2 controladorAsistente.js - Funcion principal

```javascript
async function procesarMensaje(req, res) {
  const { sesion_id, mensaje, usuario_id } = req.body;

  // 1. Guardar mensaje del usuario en BD
  await guardarMensaje(sesion_id, 'user', mensaje);

  // 2. Obtener historial de la sesion como contexto para el LLM
  const historial = await obtenerHistorialSesion(sesion_id);

  // 3. Obtener catalogo de productos disponibles
  const productos = await obtenerProductosDisponibles();

  // 4. Obtener tipo de cambio vigente de la tabla configuracion
  const tipoCambio = await obtenerTipoCambioVigente();

  // 5. Llamar al LLM con contexto completo
  const respuestaLLM = await servicioLLM.generar({
    systemPrompt: construirSystemPrompt(productos, tipoCambio),
    historial,
    mensajeActual: mensaje
  });

  // 6. Si la respuesta incluye configuracion, ejecutar Double-Check
  let configuracionValidada = null;
  if (respuestaLLM.configuracion_propuesta) {
    configuracionValidada = await ejecutarDoubleCheck(
      respuestaLLM.configuracion_propuesta,
      sesion_id
    );
  }

  // 7. Calcular semaforo si hay configuracion valida
  const semaforo = configuracionValidada
    ? servicioSemaforo.calcular(configuracionValidada)
    : null;

  // 8. Guardar respuesta del asistente con metadata
  await guardarMensaje(sesion_id, 'assistant', respuestaLLM.respuesta, {
    quick_replies: respuestaLLM.quick_replies,
    semaforo,
    configuracion_id: configuracionValidada?.id
  });

  return res.json({
    exito: true,
    respuesta: respuestaLLM.respuesta,
    quick_replies: respuestaLLM.quick_replies || [],
    semaforo,
    configuracion_propuesta: configuracionValidada
      ? await enriquecerConPreciosPEN(configuracionValidada, tipoCambio)
      : null
  });
}

async function ejecutarDoubleCheck(configuracion, sesion_id, intento = 1) {
  if (intento > 3) return null; // Fallo tras 3 intentos -> asesor humano

  const resultado = await servicioValidacionAsistente.validar(configuracion);

  if (resultado.valida) {
    return await guardarConfiguracion(sesion_id, configuracion, true, intento);
  }

  // Construir prompt de correccion con los errores especificos
  const promptCorreccion = construirPromptCorreccion(configuracion, resultado.errores);
  const respuestaCorregida = await servicioLLM.generar({ promptCorreccion });

  return ejecutarDoubleCheck(
    respuestaCorregida.configuracion_propuesta,
    sesion_id,
    intento + 1
  );
}
```

### 5.3 servicioLLM.js - Wrapper Gemini (intercambiable)

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generar({ systemPrompt, historial = [], mensajeActual, promptCorreccion }) {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    systemInstruction: systemPrompt || promptCorreccion,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500,
      responseMimeType: 'application/json'
    }
  });

  const chat = model.startChat({
    history: historial.map(m => ({
      role: m.rol === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.contenido }]
    }))
  });

  const resultado = await chat.sendMessage(mensajeActual || '');
  return JSON.parse(resultado.response.text());
}

module.exports = { generar };
```

### 5.4 System Prompt - Estructura

El system prompt incluye los siguientes bloques en orden:

1. **Identidad**: "Eres el Hardware Concierge de NSG Latinoamerica. Tu mision es ayudar a personas sin conocimientos tecnicos a elegir la PC perfecta para su estilo de vida."
2. **Reglas de analogias**: "Siempre traduce terminos tecnicos con ejemplos cotidianos. Ejemplo: 16GB de RAM es como tener un escritorio amplio donde puedes tener muchas cosas abiertas a la vez."
3. **Catalogo de productos**: JSON con IDs, nombres, precios USD, socket, ram_type, form_factor, wattage, stock.
4. **Tipo de cambio**: "El tipo de cambio actual es 1 USD = S/ {tipoCambio}. Muestra SIEMPRE los precios en soles."
5. **Formato de respuesta JSON**: Schema exacto que debe retornar el LLM.
6. **Reglas de argumentacion de valor**: "Justifica cada componente explicando el trade-off economico en soles."
7. **Ejemplos few-shot**: 2 conversaciones completas de ejemplo.

---

## 6. Diseno del Frontend

### 6.1 Estructura de Componentes

```
frontend/src/
  componentes/
    AsistenteIA/
      AsistenteIA.jsx              # Componente raiz (mejora del existente)
      MensajeAsistente.jsx         # Burbuja de mensaje del asistente
      MensajeUsuario.jsx           # Burbuja de mensaje del usuario
      QuickReplies.jsx             # Burbujas de respuesta rapida
      SemaforoCapacidades.jsx      # Visualizacion de estrellas SVG
      ConfiguracionPropuesta.jsx   # Tarjeta de configuracion validada
      TypingIndicator.jsx          # Animacion de puntos suspensivos
      BotonAsesorHumano.jsx        # CTA para WhatsApp
      RutaUpgrade.jsx              # Guia de mejoras futuras
  hooks/
    useAsistenteIA.js              # Hook de logica y estado
  servicios/
    asistente.js                   # Llamadas HTTP al backend
```

### 6.2 useAsistenteIA.js - Firma del Hook

```javascript
function useAsistenteIA({ sesionId, usuarioId }) {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [configuracionPropuesta, setConfiguracionPropuesta] = useState(null);
  const [semaforo, setSemaforo] = useState(null);
  const [error, setError] = useState(null);

  const enviarMensaje = async (texto) => { ... };
  const seleccionarQuickReply = (texto) => enviarMensaje(texto);
  const aplicarConfiguracion = () => { ... }; // Llama a AppContext.aplicarConfiguracion
  const reiniciar = async () => { ... };

  return {
    mensajes, cargando, quickReplies,
    configuracionPropuesta, semaforo, error,
    enviarMensaje, seleccionarQuickReply,
    aplicarConfiguracion, reiniciar
  };
}
```

### 6.3 Integracion con AppContext

El componente AsistenteIA consume del AppContext existente:

- `tipoCambioUsdPen` - para mostrar precios en PEN en la UI
- `autenticado` y `usuario` - para personalizar la experiencia y memoria de perfil
- `aplicarConfiguracion(config)` - para cargar la configuracion propuesta en el cotizador

### 6.4 SemaforoCapacidades.jsx - Iconografia SVG (sin emojis)

```jsx
// Estrella llena - SF Symbol equivalente: star.fill
const EstrellaLlena = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[var(--color-warning)] stroke-none" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

// Estrella vacia - SF Symbol equivalente: star
const EstrellaVacia = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-[var(--color-text-muted)] stroke-[1.5]" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

// Icono validacion exitosa - SF Symbol equivalente: checkmark.circle.fill
const IconoValidado = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-[var(--color-success)] stroke-2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

// Icono enviar - SF Symbol equivalente: paperplane.fill
const IconoEnviar = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
  </svg>
);
```

Uso en SemaforoCapacidades:
```jsx
function FilaCapacidad({ label, icono, puntuacion, max = 5 }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[var(--color-text-muted)]">{icono}</span>
      <span className="w-28 text-sm text-[var(--color-text)]">{label}</span>
      <div
        className="flex gap-0.5"
        role="img"
        aria-label={`${puntuacion} de ${max} estrellas para ${label}`}
      >
        {Array.from({ length: max }, (_, i) =>
          i < puntuacion ? <EstrellaLlena key={i} /> : <EstrellaVacia key={i} />
        )}
      </div>
    </div>
  );
}
```

### 6.5 TypingIndicator.jsx

```jsx
export default function TypingIndicator() {
  return (
    <div role="status" aria-label="El asistente esta escribiendo" className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-[var(--color-text-muted)] animate-bounce"
          style={{ animationDelay: `${i * 0.2}s`, animationDuration: '0.6s' }}
        />
      ))}
    </div>
  );
}
```

### 6.6 Estilos de Burbujas de Chat (Apple HIG)

| Elemento | Estilos |
|----------|---------|
| Burbuja asistente | bg: surface-soft, border-radius: 24px 24px 24px 4px, max-width: 80%, padding: 12px 16px, shadow-hig3 |
| Burbuja usuario | bg: accent, color: white, border-radius: 24px 24px 4px 24px, max-width: 80%, padding: 12px 16px |
| Quick Reply | border: 1px accent, color: accent, border-radius: 20px, min-height: 44px, padding: 8px 16px |
| Input de texto | border-radius: 24px, min-height: 44px, padding: 12px 16px |

---

## 7. Calculo del Semaforo de Capacidades

### 7.1 Algoritmo de Puntuacion (servicioSemaforo.js)

```javascript
function calcular(configuracion) {
  const { gpu, ram, procesador, almacenamiento } = configuracion;

  const ramTotalGB = ram.reduce((sum, r) => sum + extraerCapacidadGB(r), 0);
  const gpuVram    = extraerVRAM(gpu);       // en GB
  const gpuTier    = clasificarGPU(gpu);     // 1-5 segun modelo
  const cpuTier    = clasificarCPU(procesador); // 1-5 segun modelo
  const esSSD      = esTipoSSD(almacenamiento);

  return {
    gaming:         Math.min(5, Math.round((gpuTier * 0.7) + (cpuTier * 0.3))),
    edicion_video:  Math.min(5, Math.round((gpuVram >= 8 ? 3 : 1) + (ramTotalGB >= 32 ? 2 : ramTotalGB >= 16 ? 1 : 0))),
    productividad:  Math.min(5, Math.round((cpuTier * 0.5) + (ramTotalGB >= 16 ? 2 : 1) + (esSSD ? 1 : 0))),
    streaming:      Math.min(5, Math.round((cpuTier * 0.6) + (ramTotalGB >= 16 ? 1.5 : 1) + (gpuTier * 0.2))),
    renderizado_3d: Math.min(5, Math.round((gpuVram >= 12 ? 3 : gpuVram >= 8 ? 2 : 1) + (cpuTier * 0.4)))
  };
}
```

---

## 8. Seguridad

| Medida | Implementacion |
|--------|---------------|
| API Key Gemini | Variable de entorno GEMINI_API_KEY, nunca expuesta al cliente |
| Autenticacion | JWT para endpoints de historial; sesion_id UUID para usuarios anonimos |
| Sanitizacion | Limpiar inputs antes de enviar al LLM para prevenir prompt injection |
| Rate limiting | express-rate-limit: 20 req/min por IP, 60 req/min por usuario autenticado |
| Autorizacion | Usuario autenticado solo puede ver sus propias sesiones |
| Logs | Registrar intentos de acceso no autorizado sin exponer datos sensibles |

---

## 9. Integracion con Sistemas Existentes

### 9.1 AppContext (frontend/src/contexto/AppContext.jsx)

El componente AsistenteIA consume del AppContext existente sin modificarlo:

- `tipoCambioUsdPen` - para mostrar precios en PEN
- `autenticado` y `usuario` - para personalizar la experiencia
- `aplicarConfiguracion(config)` - para cargar la configuracion propuesta en el cotizador

### 9.2 Sistema de Tipo de Cambio

El backend consulta la tabla `configuracion` (ya existente) para obtener el tipo de cambio vigente antes de construir el system prompt del LLM. Esto garantiza que los precios en soles sean consistentes con el resto del sistema.

### 9.3 Base de Datos de Productos

El backend consulta los productos con `stock > 0 OR disponible_a_pedido = true` e incluye sus IDs, nombres, precios USD y specs de compatibilidad en el system prompt como catalogo JSON. El LLM solo puede proponer productos reales con IDs validos.

### 9.4 Validador de Compatibilidad Existente

El `servicioValidacionAsistente.js` reutiliza la logica de validacion ya implementada en el cotizador (socket, ram_type, form_factor, wattage) para el loop Double-Check.

---

## 10. Variables de Entorno Requeridas

```env
# Agregar al backend/.env
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-1.5-flash
ASISTENTE_MAX_INTENTOS_VALIDACION=3
ASISTENTE_RATE_LIMIT_POR_IP=20
ASISTENTE_HISTORIAL_DIAS=90
WHATSAPP_NUMERO_ASESOR=51999999999
```

---

## 11. Migracion de Base de Datos

Archivo: `base-datos/migraciones/002_asistente_ia_tablas.sql`

Incluye en orden:
1. `CREATE TABLE IF NOT EXISTS asistente_sesiones`
2. `CREATE TABLE IF NOT EXISTS asistente_mensajes`
3. `CREATE TABLE IF NOT EXISTS asistente_configuraciones`
4. Indices de rendimiento con `CREATE INDEX IF NOT EXISTS`
5. Comentarios en espanol en cada campo

La migracion es idempotente: puede ejecutarse multiples veces sin error.

---

## 12. Propiedades de Correctitud (PBT)

| Propiedad | Descripcion |
|-----------|-------------|
| Compatibilidad garantizada | Toda configuracion mostrada al usuario tiene `validada = true` en BD |
| Precios PEN consistentes | `precio_pen = precio_usd * tipo_cambio` con tolerancia de +/- 0.01 |
| Semaforo acotado | Toda calificacion del semaforo esta en el rango [1, 5] |
| Loop terminante | El Loop_Correccion termina en maximo 3 intentos, nunca en bucle infinito |
| Sesion aislada | Los mensajes de una sesion_id nunca son visibles desde otra sesion_id |
| Stock respetado | El LLM nunca propone productos con `stock = 0 AND disponible_a_pedido = false` |

