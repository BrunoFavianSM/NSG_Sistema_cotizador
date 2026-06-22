-- ============================================================
-- MIGRACIÓN 015: separar nombre_completo en nombre + apellidos
-- Agrega columnas estructuradas `nombre` y `apellidos`. `nombre_completo`
-- se conserva como campo autoritativo de visualización (= nombre + ' ' + apellidos),
-- para no romper PDF, emails, historial ni JWT que ya lo leen.
-- Las cuentas nuevas guardan el corte limpio (registro/decolecta); las existentes
-- se rellenan best-effort (primer token = nombre, resto = apellidos).
-- Idempotente.
-- ============================================================
BEGIN;

ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);
ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS apellidos VARCHAR(100);

-- Backfill best-effort desde nombre_completo (solo filas aún sin separar).
UPDATE cuentas
   SET nombre = CASE
                  WHEN position(' ' IN btrim(nombre_completo)) > 0
                    THEN split_part(btrim(nombre_completo), ' ', 1)
                  ELSE btrim(nombre_completo)
                END,
       apellidos = CASE
                  WHEN position(' ' IN btrim(nombre_completo)) > 0
                    THEN btrim(substring(btrim(nombre_completo) FROM position(' ' IN btrim(nombre_completo)) + 1))
                  ELSE ''
                END
 WHERE nombre IS NULL
   AND nombre_completo IS NOT NULL
   AND btrim(nombre_completo) <> '';

-- Resincronizar la secuencia de id (puede quedar atrasada si hubo inserciones
-- con id explícito en seeds/restauraciones). Sin esto, crear cuentas nuevas
-- falla con "llave duplicada cuentas_pkey".
SELECT setval(
  pg_get_serial_sequence('cuentas', 'id'),
  GREATEST((SELECT COALESCE(MAX(id), 1) FROM cuentas), 1)
);

COMMIT;
