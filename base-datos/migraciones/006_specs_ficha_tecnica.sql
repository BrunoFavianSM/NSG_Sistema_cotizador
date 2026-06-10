-- ============================================================
-- MIGRACIÓN 006: ficha_tecnica JSONB en tablas specs_* (modelo híbrido)
-- Las columnas tipadas se mantienen (las usa el sistema de compatibilidad).
-- ficha_tecnica almacena las especificaciones importantes curadas de
-- Icecat/Deltron para mostrar (en español), sin guardar el JSON completo.
-- Idempotente.
-- ============================================================
BEGIN;

ALTER TABLE specs_procesador     ADD COLUMN IF NOT EXISTS ficha_tecnica JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE specs_placa_madre    ADD COLUMN IF NOT EXISTS ficha_tecnica JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE specs_ram            ADD COLUMN IF NOT EXISTS ficha_tecnica JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE specs_almacenamiento ADD COLUMN IF NOT EXISTS ficha_tecnica JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE specs_gpu            ADD COLUMN IF NOT EXISTS ficha_tecnica JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE specs_fuente         ADD COLUMN IF NOT EXISTS ficha_tecnica JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE specs_case           ADD COLUMN IF NOT EXISTS ficha_tecnica JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMIT;
