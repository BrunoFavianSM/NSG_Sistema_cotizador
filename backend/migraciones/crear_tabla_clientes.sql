-- Migración: Crear tabla clientes
-- Fecha: 2026-05-27
-- Descripción: Tabla para almacenar información de clientes para autocompletado

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre_completo VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT clientes_email_unique UNIQUE (email)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_clientes_updated_at();

-- Comentarios
COMMENT ON TABLE clientes IS 'Tabla de clientes para autocompletado y búsqueda rápida';
COMMENT ON COLUMN clientes.email IS 'Email del cliente (único)';
COMMENT ON COLUMN clientes.telefono IS 'Teléfono del cliente';
