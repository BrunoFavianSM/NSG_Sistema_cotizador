-- ============================================================
-- MIGRACIÓN 011: estados de enriquecimiento sin nomenclatura "IA"
-- El enriquecimiento ya no usa IA (reemplazado por Icecat/Deltron).
-- Renombra: ia_completado -> enriquecido, ia_fallido -> fallido.
-- Estados finales: pendiente | enriquecido | fallido | csv | no_aplica.
-- Idempotente.
-- ============================================================
BEGIN;

-- 1) Eliminar el/los CHECK existentes sobre estado_enriquecimiento (por nombre dinámico).
--    Debe ir ANTES de migrar valores, porque el CHECK viejo no admite los nuevos.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
     WHERE conrelid = 'productos'::regclass AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%estado_enriquecimiento%'
  LOOP
    EXECUTE 'ALTER TABLE productos DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- 2) Migrar valores legacy.
UPDATE productos SET estado_enriquecimiento = 'enriquecido' WHERE estado_enriquecimiento = 'ia_completado';
UPDATE productos SET estado_enriquecimiento = 'fallido'     WHERE estado_enriquecimiento = 'ia_fallido';

-- 3) Agregar el nuevo CHECK.
ALTER TABLE productos ADD CONSTRAINT productos_estado_enriquecimiento_check
  CHECK (estado_enriquecimiento IN ('pendiente', 'enriquecido', 'fallido', 'csv', 'no_aplica'));

COMMIT;
