# Plan: Pipeline Multi-Agente con Modelos NVIDIA Especializados

## Contexto

El asistente IA NSG Concierge actual usa un solo LLM (Gemini primario, NVIDIA fallback) para realizar **todas** las tareas: entender al usuario, clasificar su perfil, buscar productos en catálogo, seleccionar componentes y generar la respuesta. Esto es ineficiente: un modelo gigante haciendo todo genera alto costo de tokens, latencia innecesaria y calidad subóptima en tareas específicas.

Se propone reemplazar el monolito con un **pipeline de 3 agentes especializados** usando modelos de NVIDIA, cada uno óptimo para su tarea. El flujo actual (Gemini → NVIDIA) se mantiene como fallback completo.

## Arquitectura Propuesta

```
Mensaje usuario
     |
     v
[1] CLASIFICADOR (Llama-3.2-3B)
    Extrae: uso, presupuesto, perfil, preferencias → JSON
     |
     v
[2] BUSCADOR (nv-embed-v1)
    Embedding semántico → top-N candidatos por categoría
     |
     v
[3] RERANKER (rerank-qa-mistral-4b)
    Re-ordena por compatibilidad + presupuesto → configuración final
     |
     v
[4] Double-Check (servicioCompatibilidad.js) — SIN CAMBIOS
[5] Semáforo (servicioSemaforo.js) — SIN CAMBIOS
[6] Respuesta al frontend — SIN CAMBIOS
```

## Archivos Nuevos

| Archivo | Propósito |
|---------|-----------|
| `backend/src/asistente/agenteClasificador.js` | Llama-3.2: extrae datos estructurados del texto del usuario |
| `backend/src/asistente/agenteBuscador.js` | nv-embed-v1: embeddings + búsqueda semántica en catálogo |
| `backend/src/asistente/agenteReranker.js` | rerank-qa-mistral-4b: refina selección de componentes |
| `backend/src/asistente/servicioEmbeddings.js` | Cache de embeddings de productos, similaridad coseno |
| `backend/src/asistente/orquestadorAgentes.js` | Orquesta pipeline, timeouts, fallbacks graceful |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `backend/src/asistente/controladorAsistente.js` | Insertar lógica condicional: intentar pipeline agentes, fallback a Gemini→NVIDIA |
| `backend/src/asistente/sistemaPrompt.js` | Agregar `construirSystemPromptClasificador()` — prompt liviano sin catálogo |
| `backend/.env` | Agregar variables: `NVIDIA_CLASSIFIER_MODEL`, `NVIDIA_EMBEDDING_MODEL`, `NVIDIA_RERANKER_MODEL`, `EMBEDDING_CACHE_TTL`, `AGENT_PIPELINE_TIMEOUT_MS`, `AGENT_PIPELINE_ENABLED` |

## Servicios Reutilizados (SIN CAMBIOS)

- `backend/src/asistente/servicioLLM.js` → funciones `llamarConReintentos`, `extraerJSON`, `ErrorLLM`
- `backend/src/asistente/servicioSesion.js` → `obtenerProductosDisponibles`, `obtenerParametrosFinancieros`
- `backend/src/asistente/servicioCuestionario.js` → `construirEstadoCuestionario` (fallback determinístico)
- `backend/src/asistente/servicioSemaforo.js` → `calcularSemaforo`
- `backend/src/servicios/servicioCompatibilidad.js` → `validarConfiguracionConBD`, `obtenerMapaComponentesDesdeBD`

## Flujo de Datos Detallado

### 1. Clasificador (agenteClasificador.js)
- **Modelo**: `meta/llama-3.2-3b-instruct`
- **Endpoint**: `POST /v1/chat/completions` (OpenAI-compatible)
- **Prompt**: ~200 tokens, solo pide extraer JSON estructurado (sin catálogo)
- **Salida**: `{ uso_principal, presupuesto_pen, resolucion, perfil, pregunta_especifica, confianza }`
- **Timeout**: 5s
- **Fallback**: `servicioCuestionario.construirEstadoCuestionario()` (determinístico, existe)

### 2. Buscador (agenteBuscador.js + servicioEmbeddings.js)
- **Modelo**: `nvidia/nv-embed-v1`
- **Endpoint**: `POST /v1/embeddings`
- **Estrategia**: Cache en memoria (node-cache, TTL 300s). Embeddings generados por producto (~140 productos)
- **Similaridad**: Coseno entre embedding de query y embeddings de productos
- **Salida**: Map<categoria, Producto[]> con top-N candidatos
- **Timeout**: 8s
- **Fallback**: Búsqueda SQL con ILIKE/filtros tradicionales

### 3. Reranker (agenteReranker.js)
- **Modelo**: `nvidia/rerank-qa-mistral-4b`
- **Endpoint**: `POST /v1/ranking`
- **Filtros determinísticos primero**: socket, RAM, form factor, presupuesto (usa servicioCompatibilidad)
- **Luego reranking**: combinaciones pasan por reranker con query del usuario
- **Salida**: `{ configuracion_propuesta, confianza, alternativas }`
- **Timeout**: 5s
- **Fallback**: Combinación manual con servicioCompatibilidad

### 4. Orquestador (orquestadorAgentes.js)
- Timeout total: 15s configurable
- Feature flag: `AGENT_PIPELINE_ENABLED`
- Si cualquier agente falla → degrade graceful al fallback de ese agente
- Si todo el pipeline falla → lanzar error para que controlador caiga en Gemini→NVIDIA legacy
- Construye objeto `respuestaLLM` con mismo contrato que `servicioLLM.generarRespuesta()`

## Sin pgvector

El catálogo es pequeño (~140 productos). Los embeddings se calculan en memoria cada 5 minutos (TTL cache). Similaridad coseno en JavaScript puro — sin depender de extensiones PostgreSQL.

## Contrato Frontend (SIN CAMBIOS)

El endpoint `POST /api/asistente/mensaje` retorna exactamente la misma estructura JSON. El frontend no requiere ningún cambio.

## Verificación

1. El pipeline multi-agente se puede deshabilitar con `AGENT_PIPELINE_ENABLED=false` y el sistema vuelve al flujo Gemini→NVIDIA actual
2. Cada agente tiene su propio timeout y fallback — el sistema nunca se queda sin respuesta
3. El Double-Check, semáforo y guardado en BD son idénticos al flujo actual
4. El contrato de API con el frontend no cambia