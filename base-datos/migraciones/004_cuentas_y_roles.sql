-- ============================================
-- MIGRACIÓN 004: Tabla cuentas (unificada) + roles
-- Reemplaza administradores como tabla única de auth
-- Agrega soporte para usuarios registrados, bloqueo y recuperación
-- ============================================

BEGIN;

-- 1. Crear tabla cuentas (unifica admin + usuarios)
CREATE TABLE cuentas (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  correo_encrypted VARCHAR(300),              -- AES-256-CBC
  correo_hash VARCHAR(64) UNIQUE,             -- HMAC-SHA256 para búsqueda
  nombre_completo VARCHAR(100) NOT NULL,
  telefono_encrypted VARCHAR(100),            -- AES-256-CBC (opcional)
  telefono_hash VARCHAR(64),                  -- HMAC-SHA256 (opcional)
  rol VARCHAR(20) NOT NULL DEFAULT 'usuario'
    CHECK (rol IN ('admin', 'usuario')),
  intentos_fallidos INTEGER NOT NULL DEFAULT 0
    CHECK (intentos_fallidos >= 0),
  bloqueado_hasta TIMESTAMP,                  -- NULL = no bloqueado
  token_recuperacion VARCHAR(255),            -- forgot password
  token_recuperacion_expira TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cuentas_correo_hash ON cuentas(correo_hash);
CREATE INDEX idx_cuentas_rol ON cuentas(rol);
CREATE INDEX idx_cuentas_telefono_hash ON cuentas(telefono_hash);

-- 2. Migrar administradores existentes a cuentas
INSERT INTO cuentas (id, username, password_hash, nombre_completo, rol, created_at)
SELECT id, username, password_hash, nombre_completo, 'admin', created_at
FROM administradores;

-- 3. Ajustar secuencia de cuentas
SELECT setval('cuentas_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM cuentas), false);

-- 4. Actualizar FK cotizaciones.id_vendedor → cuentas
ALTER TABLE cotizaciones
  DROP CONSTRAINT IF EXISTS cotizaciones_id_vendedor_fkey;

ALTER TABLE cotizaciones
  ADD CONSTRAINT cotizaciones_id_vendedor_fkey
  FOREIGN KEY (id_vendedor) REFERENCES cuentas(id);

-- 5. Actualizar FK auditoria.id_usuario → cuentas
ALTER TABLE auditoria
  DROP CONSTRAINT IF EXISTS auditoria_id_usuario_fkey;

ALTER TABLE auditoria
  ADD CONSTRAINT auditoria_id_usuario_fkey
  FOREIGN KEY (id_usuario) REFERENCES cuentas(id);

-- 6. Trigger updated_at
CREATE TRIGGER trigger_cuentas_updated_at
  BEFORE UPDATE ON cuentas
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

COMMIT;