-- ============================================================
-- MIGRACIÓN 008: DNI en cuentas + rol 'vendedor'
-- - dni VARCHAR (admite ceros a la izquierda; NO numérico). Obligatorio se
--   aplica a nivel de aplicación en el registro (las cuentas existentes no
--   tienen DNI todavía; el admin debe completarlas). No se fuerza NOT NULL
--   en BD para no romper las cuentas actuales.
-- - rol amplía el CHECK para incluir 'vendedor'.
-- Idempotente.
-- ============================================================
BEGIN;

-- DNI: texto, solo dígitos, 8 a 15 caracteres (permite ceros iniciales).
ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS dni VARCHAR(15);

ALTER TABLE cuentas DROP CONSTRAINT IF EXISTS cuentas_dni_check;
ALTER TABLE cuentas ADD CONSTRAINT cuentas_dni_check
  CHECK (dni IS NULL OR dni ~ '^[0-9]{8,15}$');

-- DNI único cuando está presente (permite múltiples NULL).
CREATE UNIQUE INDEX IF NOT EXISTS uq_cuentas_dni ON cuentas(dni) WHERE dni IS NOT NULL;

-- Ampliar rol para incluir 'vendedor'.
ALTER TABLE cuentas DROP CONSTRAINT IF EXISTS cuentas_rol_check;
ALTER TABLE cuentas ADD CONSTRAINT cuentas_rol_check
  CHECK (rol IN ('admin', 'vendedor', 'usuario'));

COMMIT;
