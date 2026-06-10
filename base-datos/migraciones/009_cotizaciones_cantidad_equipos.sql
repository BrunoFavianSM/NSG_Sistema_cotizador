-- ============================================================
-- MIGRACIÓN 009: cantidad de equipos (multi-PC) en cotizaciones
-- Multiplicador de N equipos iguales por cotización. Las cotizaciones
-- existentes quedan con 1 (DEFAULT). Idempotente.
-- ============================================================
BEGIN;

ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS cantidad_equipos INTEGER NOT NULL DEFAULT 1;

ALTER TABLE cotizaciones DROP CONSTRAINT IF EXISTS cotizaciones_cantidad_equipos_check;
ALTER TABLE cotizaciones ADD CONSTRAINT cotizaciones_cantidad_equipos_check
  CHECK (cantidad_equipos >= 1);

COMMIT;
