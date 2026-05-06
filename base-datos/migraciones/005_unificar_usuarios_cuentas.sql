-- ============================================================
-- MIGRACIÓN 005: Unificación usuarios — Fase 1 DDL
-- Hace password_hash nullable y agrega columna estado a cuentas
-- ============================================================
BEGIN;

-- 1. password_hash pasa a ser nullable
ALTER TABLE cuentas
  ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Agregar columna estado
ALTER TABLE cuentas
  ADD COLUMN estado VARCHAR(30) NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa', 'pendiente_activacion'));

-- 3. Marcar todas las cuentas existentes como activas (ya tienen password)
UPDATE cuentas SET estado = 'activa' WHERE estado IS DISTINCT FROM 'activa';

-- 4. Índice para filtrado por estado
CREATE INDEX idx_cuentas_estado ON cuentas(estado);

-- 5. username puede ser NULL para cuentas pendientes (clientes sin username elegido)
ALTER TABLE cuentas
  ALTER COLUMN username DROP NOT NULL;

-- Nota: username sigue siendo UNIQUE cuando no es NULL (constraint existente lo garantiza)

COMMIT;
