-- ============================================================
-- Migración 002: Tablas del Asistente IA NSG Concierge v2.0
-- Proyecto: NSG Latinoamerica E.I.R.L. — Sistema de Cotización
-- Requisitos: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
--
-- Idempotente: usa CREATE TABLE IF NOT EXISTS y
--              CREATE INDEX IF NOT EXISTS.
-- Puede ejecutarse múltiples veces sin error ni pérdida de datos.
--
-- Ejecución:
--   psql -d <base_de_datos> -f 002_asistente_ia_tablas.sql
-- ============================================================

BEGIN;

-- ============================================================
-- TABLA: asistente_sesiones
-- Almacena cada sesión de conversación con el asistente IA.
-- Puede ser anónima (usuario_id NULL) o autenticada.
-- ============================================================
CREATE TABLE IF NOT EXISTS asistente_sesiones (
  -- Identificador interno autoincremental
  id              SERIAL PRIMARY KEY,

  -- UUID público de la sesión, usado como identificador externo
  -- (nunca se expone el id interno al frontend)
  sesion_id       UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

  -- Usuario autenticado asociado a la sesión (nullable para sesiones anónimas)
  usuario_id      INTEGER REFERENCES usuarios_clientes(id) ON DELETE SET NULL,

  -- Perfil identificado por el asistente durante el cuestionario de estilo de vida
  perfil_usuario  VARCHAR(20) CHECK (
    perfil_usuario IN ('basico', 'intermedio', 'avanzado', 'gamer_full')
  ),

  -- Presupuesto indicado por el usuario en soles peruanos (PEN)
  presupuesto_pen NUMERIC(10, 2),

  -- Estado actual de la sesión
  estado          VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (
    estado IN ('activa', 'completada', 'abandonada')
  ),

  -- Fecha y hora de creación de la sesión (con zona horaria)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Fecha y hora de la última actualización de la sesión
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para buscar sesiones por usuario autenticado (historial de usuario)
CREATE INDEX IF NOT EXISTS idx_asistente_sesiones_usuario
  ON asistente_sesiones(usuario_id);

-- Índice para buscar sesiones por su UUID público (acceso desde frontend)
CREATE INDEX IF NOT EXISTS idx_asistente_sesiones_sesion
  ON asistente_sesiones(sesion_id);

-- ============================================================
-- TABLA: asistente_mensajes
-- Almacena cada mensaje intercambiado en una sesión.
-- Incluye mensajes del usuario, del asistente y del sistema.
-- ============================================================
CREATE TABLE IF NOT EXISTS asistente_mensajes (
  -- Identificador interno autoincremental
  id         SERIAL PRIMARY KEY,

  -- Referencia a la sesión a la que pertenece este mensaje
  sesion_id  UUID NOT NULL REFERENCES asistente_sesiones(sesion_id) ON DELETE CASCADE,

  -- Rol del emisor del mensaje: usuario, asistente o sistema
  rol        VARCHAR(10) NOT NULL CHECK (rol IN ('user', 'assistant', 'system')),

  -- Contenido textual del mensaje
  contenido  TEXT NOT NULL,

  -- Metadatos adicionales en formato JSON:
  -- quick_replies mostrados, semaforo_capacidades, configuracion_id,
  -- tiempo_respuesta_ms, intentos_validacion
  metadata   JSONB NOT NULL DEFAULT '{}',

  -- Fecha y hora de creación del mensaje (con zona horaria)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para recuperar todos los mensajes de una sesión ordenados por fecha
CREATE INDEX IF NOT EXISTS idx_asistente_mensajes_sesion
  ON asistente_mensajes(sesion_id);

-- ============================================================
-- TABLA: asistente_configuraciones
-- Almacena las configuraciones de PC propuestas por el LLM
-- y su estado de validación tras el loop Double-Check.
-- ============================================================
CREATE TABLE IF NOT EXISTS asistente_configuraciones (
  -- Identificador interno autoincremental
  id                  SERIAL PRIMARY KEY,

  -- Referencia a la sesión en la que se generó esta configuración
  sesion_id           UUID NOT NULL REFERENCES asistente_sesiones(sesion_id) ON DELETE CASCADE,

  -- Configuración completa en JSON: IDs y nombres de cada componente
  -- (procesador, placa_madre, ram, almacenamiento, gpu, fuente, case)
  configuracion       JSONB NOT NULL,

  -- Precio total de la configuración en dólares (USD), calculado al momento de proponer
  precio_total_usd    NUMERIC(10, 2),

  -- Indica si la configuración pasó la validación de compatibilidad (Double-Check)
  -- Solo las configuraciones con validada = TRUE se muestran al usuario
  validada            BOOLEAN NOT NULL DEFAULT FALSE,

  -- Número de intentos de validación realizados en el loop Double-Check (máximo 3)
  intentos_validacion INTEGER NOT NULL DEFAULT 0,

  -- Fecha y hora de creación del registro (con zona horaria)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para recuperar configuraciones de una sesión específica
CREATE INDEX IF NOT EXISTS idx_asistente_config_sesion
  ON asistente_configuraciones(sesion_id);

COMMIT;
