-- ============================================================
-- MIGRACIÓN 014: baja lógica de cuentas (soft-delete)
-- Agrega el estado 'desactivada' a cuentas. La baja la inicia el
-- propio usuario (con su contraseña) y es reversible por un admin.
-- Los datos y cotizaciones se conservan; el middleware ya bloquea
-- el acceso de cuentas con estado != 'activa'.
-- Idempotente.
-- ============================================================
BEGIN;

ALTER TABLE cuentas DROP CONSTRAINT IF EXISTS cuentas_estado_check;
ALTER TABLE cuentas ADD CONSTRAINT cuentas_estado_check
  CHECK ((estado)::text = ANY (ARRAY[
    'activa'::character varying,
    'pendiente_activacion'::character varying,
    'desactivada'::character varying
  ]::text[]));

COMMIT;
