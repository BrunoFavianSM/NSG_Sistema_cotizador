-- ============================================================
-- Migracion 003: ampliar estados permitidos en asistente_sesiones
-- Proyecto: NSG Cotizador
--
-- Objetivo:
-- Permitir nuevos estados del flujo del asistente:
--   - cuestionario
--   - listo_para_cotizar
--   - cotizacion_generada
--
-- Tambien mantiene compatibilidad con estados anteriores:
--   - activa
--   - completada
--   - abandonada
-- ============================================================

BEGIN;

ALTER TABLE asistente_sesiones
  DROP CONSTRAINT IF EXISTS asistente_sesiones_estado_check;

ALTER TABLE asistente_sesiones
  ADD CONSTRAINT asistente_sesiones_estado_check
  CHECK (
    estado IN (
      'activa',
      'completada',
      'abandonada',
      'cuestionario',
      'listo_para_cotizar',
      'cotizacion_generada'
    )
  );

COMMIT;

