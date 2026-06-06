-- ============================================================
-- MIGRACIÓN 007: catálogo de etiquetas de perfil + FK en productos
-- Etiquetas gestionadas manualmente por el administrador de productos.
-- Las 4 etiquetas (Básico/Medio/Avanzado/Gamer Full) son datos de catálogo
-- requeridos por la funcionalidad (no son datos de prueba).
-- Idempotente.
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS etiquetas (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(40) NOT NULL UNIQUE,
  orden      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO etiquetas (nombre, orden) VALUES
  ('Básico', 1),
  ('Medio', 2),
  ('Avanzado', 3),
  ('Gamer Full', 4)
ON CONFLICT (nombre) DO NOTHING;

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS id_etiqueta INTEGER REFERENCES etiquetas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_productos_id_etiqueta ON productos(id_etiqueta);

COMMIT;
