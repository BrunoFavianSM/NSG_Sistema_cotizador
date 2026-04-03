-- ============================================
-- SCHEMA: Sistema de Cotización Automatizada
-- NSG Latinoamerica E.I.R.L.
-- ============================================

-- Tabla de Administradores
CREATE TABLE administradores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios Clientes
CREATE TABLE usuarios_clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  correo VARCHAR(300) UNIQUE NOT NULL, -- Encriptado (AES-256 produce strings más largos)
  correo_hash VARCHAR(64) UNIQUE,      -- HMAC-SHA256 para búsqueda determinística
  telefono VARCHAR(100),               -- Encriptado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  socket VARCHAR(50),
  ram_type VARCHAR(20),
  form_factor VARCHAR(20),
  wattage INTEGER,
  tdp INTEGER,
  precio_base DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  disponible_a_pedido BOOLEAN DEFAULT false,
  tiempo_entrega_dias INTEGER,
  descripcion_tecnica TEXT,
  imagen_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT check_stock_positive CHECK (stock >= 0),
  CONSTRAINT check_precio_positive CHECK (precio_base > 0)
);

CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_stock ON productos(stock);
CREATE INDEX idx_productos_socket ON productos(socket);

-- Tabla de Configuración
CREATE TABLE configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(50) UNIQUE NOT NULL,
  valor VARCHAR(255) NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO configuracion (clave, valor, descripcion) 
VALUES ('margen_ganancia', '20', 'Porcentaje de margen de ganancia');

-- Tabla de Cotizaciones
CREATE TABLE cotizaciones (
  id SERIAL PRIMARY KEY,
  codigo_unico UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  codigo_ticket VARCHAR(20) UNIQUE NOT NULL,
  id_cliente INTEGER REFERENCES usuarios_clientes(id) ON DELETE SET NULL,
  fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_validez TIMESTAMP NOT NULL,
  precio_total DECIMAL(10, 2) NOT NULL,
  margen_aplicado DECIMAL(5, 2) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  fecha_reclamacion TIMESTAMP,
  id_vendedor INTEGER REFERENCES administradores(id),
  notas_vendedor TEXT,
  
  CONSTRAINT check_precio_total_positive CHECK (precio_total > 0),
  CONSTRAINT check_estado_valido CHECK (estado IN ('Pendiente', 'Completada', 'Caducada', 'Reclamada'))
);

CREATE INDEX idx_cotizaciones_codigo ON cotizaciones(codigo_unico);
CREATE INDEX idx_cotizaciones_ticket ON cotizaciones(codigo_ticket);
CREATE INDEX idx_cotizaciones_cliente ON cotizaciones(id_cliente);

-- Tabla de Detalle de Cotización
CREATE TABLE detalle_cotizacion (
  id SERIAL PRIMARY KEY,
  id_cotizacion INTEGER NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  id_producto INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  nombre_producto VARCHAR(200) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  descripcion_tecnica TEXT,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  disponible_stock BOOLEAN NOT NULL,
  
  CONSTRAINT check_precio_unitario_positive CHECK (precio_unitario > 0),
  CONSTRAINT check_cantidad_positive CHECK (cantidad > 0)
);

CREATE INDEX idx_detalle_cotizacion ON detalle_cotizacion(id_cotizacion);

-- Tabla de Conversaciones con IA
CREATE TABLE conversaciones_ia (
  id SERIAL PRIMARY KEY,
  sesion_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  contexto_cliente JSONB NOT NULL,
  historial_mensajes JSONB NOT NULL,
  estado VARCHAR(20) DEFAULT 'activa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Auditoría
CREATE TABLE auditoria (
  id SERIAL PRIMARY KEY,
  tabla_afectada VARCHAR(50) NOT NULL,
  accion VARCHAR(20) NOT NULL,
  id_registro INTEGER,
  id_usuario INTEGER REFERENCES administradores(id),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Triggers
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_configuracion_updated_at
  BEFORE UPDATE ON configuracion
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- Secuencia para códigos ticket (se reinicia por año via función)
CREATE SEQUENCE IF NOT EXISTS seq_codigo_ticket START 1;

-- Función para generar código ticket
CREATE OR REPLACE FUNCTION generar_codigo_ticket()
RETURNS VARCHAR AS $$
DECLARE
  anio INTEGER;
  seq_name VARCHAR;
  nuevo_numero BIGINT;
  nuevo_codigo VARCHAR;
BEGIN
  anio := EXTRACT(YEAR FROM CURRENT_DATE);
  seq_name := 'seq_ticket_' || anio;

  -- Crear secuencia del año si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_sequences WHERE sequencename = seq_name
  ) THEN
    EXECUTE format('CREATE SEQUENCE %I START 1', seq_name);
  END IF;

  -- Obtener siguiente valor de la secuencia del año
  EXECUTE format('SELECT nextval(%L)', seq_name) INTO nuevo_numero;

  nuevo_codigo := 'NSG-' || anio || '-' || LPAD(nuevo_numero::TEXT, 4, '0');

  RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;
