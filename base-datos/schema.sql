-- ============================================
-- SCHEMA: Sistema de Cotización Automatizada
-- NSG Latinoamerica E.I.R.L.
-- Versión: Unificada (Híbrida Normalizada)
-- ============================================

BEGIN;

-- 1. EXTENSIONES Y FUNCIONES BASE
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. INFRAESTRUCTURA DE SEGURIDAD Y USUARIOS
CREATE TABLE administradores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios_clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  correo VARCHAR(300) UNIQUE NOT NULL, -- Encriptado (AES-256)
  correo_hash VARCHAR(64) UNIQUE,      -- HMAC-SHA256 para búsqueda
  telefono VARCHAR(100),               -- Encriptado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CONFIGURACIÓN DEL SISTEMA
CREATE TABLE configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(50) UNIQUE NOT NULL,
  valor VARCHAR(255) NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('margen_ganancia_default', '20', 'Porcentaje de margen por defecto para cotizaciones'),
  ('tasa_igv', '18', 'Porcentaje de IGV aplicado al precio neto'),
  ('tipo_cambio_usd_pen', '3.75', 'Tipo de cambio referencial USD a PEN')
ON CONFLICT (clave) DO NOTHING;

-- 4. CATÁLOGO DE PRODUCTOS (MODELO HÍBRIDO NORMALIZADO)
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  es_componente_principal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marcas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  id_categoria INTEGER NOT NULL REFERENCES categorias(id),
  id_marca INTEGER REFERENCES marcas(id),
  subcategoria VARCHAR(40),
  categoria_proveedor VARCHAR(200),
  codigo_proveedor VARCHAR(100) NOT NULL UNIQUE,
  nombre VARCHAR(320) NOT NULL,
  descripcion_general TEXT,
  precio_base NUMERIC(10,2) NOT NULL CHECK (precio_base > 0 AND precio_base <= 100000),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  disponible_a_pedido BOOLEAN NOT NULL DEFAULT false,
  garantia VARCHAR(100),
  flete VARCHAR(100),
  imagen_url VARCHAR(500),
  imagen_path VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CREATE INDEXES PARA PRODUCTOS
CREATE INDEX idx_productos_categoria ON productos(id_categoria);
CREATE INDEX idx_productos_marca ON productos(id_marca);
CREATE INDEX idx_productos_stock ON productos(stock);
CREATE INDEX idx_productos_codigo ON productos(codigo_proveedor);
CREATE INDEX idx_productos_nombre ON productos(nombre);

-- 5. TABLAS DE ESPECIFICACIONES TÉCNICAS (1:1 con Productos)
CREATE TABLE specs_procesador (
  id_producto INTEGER PRIMARY KEY REFERENCES productos(id) ON DELETE CASCADE,
  socket VARCHAR(50),
  arquitectura VARCHAR(80),
  nucleos INTEGER,
  hilos INTEGER,
  frecuencia_base_ghz NUMERIC(4,2),
  frecuencia_boost_ghz NUMERIC(4,2),
  tdp_w INTEGER,
  graficos_integrados BOOLEAN,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE specs_placa_madre (
  id_producto INTEGER PRIMARY KEY REFERENCES productos(id) ON DELETE CASCADE,
  socket VARCHAR(50),
  chipset VARCHAR(80),
  form_factor VARCHAR(30),
  ram_tipo VARCHAR(30),
  max_ram_gb INTEGER,
  slots_ram INTEGER,
  pcie_version VARCHAR(20),
  m2_slots INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE specs_ram (
  id_producto INTEGER PRIMARY KEY REFERENCES productos(id) ON DELETE CASCADE,
  ram_tipo VARCHAR(30),
  capacidad_gb INTEGER,
  velocidad_mhz INTEGER,
  latencia VARCHAR(20),
  modulos VARCHAR(30),
  cantidad_modulos INTEGER,
  rgb BOOLEAN,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE specs_almacenamiento (
  id_producto INTEGER PRIMARY KEY REFERENCES productos(id) ON DELETE CASCADE,
  tipo_almacenamiento VARCHAR(40),
  capacidad_gb INTEGER,
  interfaz VARCHAR(40),
  form_factor VARCHAR(30),
  velocidad_lectura_mbps INTEGER,
  velocidad_escritura_mbps INTEGER,
  nvme_gen VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE specs_gpu (
  id_producto INTEGER PRIMARY KEY REFERENCES productos(id) ON DELETE CASCADE,
  chipset VARCHAR(120),
  vram_gb INTEGER,
  vram_tipo VARCHAR(30),
  bus_bits INTEGER,
  boost_mhz INTEGER,
  tdp_w INTEGER,
  longitud_mm INTEGER,
  fuente_recomendada_w INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE specs_fuente (
  id_producto INTEGER PRIMARY KEY REFERENCES productos(id) ON DELETE CASCADE,
  wattage INTEGER,
  certificacion VARCHAR(30),
  modular VARCHAR(30),
  form_factor VARCHAR(30),
  pcie_conectores INTEGER,
  sata_conectores INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE specs_case (
  id_producto INTEGER PRIMARY KEY REFERENCES productos(id) ON DELETE CASCADE,
  form_factor VARCHAR(30),
  compatibilidad_placa VARCHAR(60),
  max_gpu_mm INTEGER,
  max_cooler_mm INTEGER,
  ventiladores_incluidos INTEGER,
  color VARCHAR(40),
  panel_lateral VARCHAR(60),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. TRANSACCIONES: COTIZACIONES
CREATE TABLE cotizaciones (
  id SERIAL PRIMARY KEY,
  codigo_unico UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  codigo_ticket VARCHAR(20) UNIQUE NOT NULL,
  id_cliente INTEGER REFERENCES usuarios_clientes(id) ON DELETE SET NULL,
  fecha_emision TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_validez TIMESTAMP NOT NULL,
  moneda_base VARCHAR(3) NOT NULL DEFAULT 'USD',
  subtotal_neto DECIMAL(12, 2) NOT NULL DEFAULT 0,
  igv_porcentaje DECIMAL(5, 2) NOT NULL DEFAULT 18,
  igv_monto DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_con_igv DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tipo_cambio_referencia DECIMAL(10, 4) NOT NULL DEFAULT 1,
  subtotal_neto_pen DECIMAL(12, 2) NOT NULL DEFAULT 0,
  igv_monto_pen DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_con_igv_pen DECIMAL(12, 2) NOT NULL DEFAULT 0,
  precio_total DECIMAL(10, 2) NOT NULL,
  margen_aplicado DECIMAL(5, 2) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  fecha_reclamacion TIMESTAMP,
  id_vendedor INTEGER REFERENCES administradores(id),
  notas_vendedor TEXT,
  
  CONSTRAINT check_precio_total_positive CHECK (precio_total > 0),
  CONSTRAINT check_estado_valido CHECK (estado IN ('Pendiente', 'Completada', 'Caducada', 'Reclamada'))
);

CREATE INDEX idx_cotizaciones_ticket ON cotizaciones(codigo_ticket);
CREATE INDEX idx_cotizaciones_cliente ON cotizaciones(id_cliente);

CREATE TABLE detalle_cotizacion (
  id SERIAL PRIMARY KEY,
  id_cotizacion INTEGER NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  id_producto INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  tabla_producto VARCHAR(60) NOT NULL DEFAULT 'productos', -- Para compatibilidad futura
  nombre_producto VARCHAR(200) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  descripcion_tecnica TEXT,
  costo_unitario_neto_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
  margen_aplicado DECIMAL(5, 2) NOT NULL DEFAULT 0,
  precio_unitario_neto_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
  igv_unitario_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
  precio_unitario_total_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  disponible_stock BOOLEAN NOT NULL,
  
  CONSTRAINT check_precio_unitario_positive CHECK (precio_unitario > 0),
  CONSTRAINT check_cantidad_positive CHECK (cantidad > 0)
);

CREATE INDEX idx_detalle_cotizacion_id ON detalle_cotizacion(id_cotizacion);

-- 7. NOTIFICACIONES, IA Y AUDITORÍA
CREATE TABLE notificaciones_cotizacion (
  id SERIAL PRIMARY KEY,
  id_cotizacion INTEGER NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL DEFAULT 'listo_recojo',
  email_destino VARCHAR(320) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  payload JSONB,
  respuesta JSONB,
  mensaje_error TEXT,
  fecha_intento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_envio TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_notificacion_estado CHECK (estado IN ('pendiente', 'enviada', 'fallida'))
);

CREATE TABLE conversaciones_ia (
  id SERIAL PRIMARY KEY,
  sesion_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  contexto_cliente JSONB NOT NULL,
  historial_mensajes JSONB NOT NULL,
  estado VARCHAR(20) DEFAULT 'activa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- 8. TRIGGERS Y UTILIDADES FINALES
CREATE TRIGGER trigger_configuracion_updated_at
  BEFORE UPDATE ON configuracion
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trigger_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- Triggers para tablas de specs
CREATE TRIGGER trigger_specs_procesador_updated_at BEFORE UPDATE ON specs_procesador FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_specs_placa_madre_updated_at BEFORE UPDATE ON specs_placa_madre FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_specs_ram_updated_at BEFORE UPDATE ON specs_ram FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_specs_almacenamiento_updated_at BEFORE UPDATE ON specs_almacenamiento FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_specs_gpu_updated_at BEFORE UPDATE ON specs_gpu FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_specs_fuente_updated_at BEFORE UPDATE ON specs_fuente FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_specs_case_updated_at BEFORE UPDATE ON specs_case FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- Función para generar código ticket correlativo
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

  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = seq_name) THEN
    EXECUTE format('CREATE SEQUENCE %I START 1', seq_name);
  END IF;

  EXECUTE format('SELECT nextval(%L)', seq_name) INTO nuevo_numero;
  nuevo_codigo := 'NSG-' || anio || '-' || LPAD(nuevo_numero::TEXT, 4, '0');
  RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

-- 9. DATOS SEMILLA (CATEGORÍAS)
INSERT INTO categorias (nombre, es_componente_principal) VALUES
  ('procesador', true),
  ('placa_madre', true),
  ('ram', true),
  ('almacenamiento', true),
  ('gpu', true),
  ('fuente', true),
  ('case', true),
  ('perifericos', false),
  ('audio', false),
  ('software', false),
  ('almacenamiento_externo', false),
  ('energia', false),
  ('monitor', false),
  ('refrigeracion', false),
  ('conectividad', false),
  ('mouse', false),
  ('teclado', false),
  ('webcam', false),
  ('auricular', false),
  ('parlante', false),
  ('ups', false),
  ('estabilizador', false),
  ('cooler_aire', false),
  ('cooler_liquido', false),
  ('mousepad', false)
ON CONFLICT (nombre) DO NOTHING;

COMMIT;
