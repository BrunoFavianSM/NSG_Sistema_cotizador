-- ============================================================
-- MIGRACIÓN 013: estado "Confirmada" + verificación por ventas
-- Una cotización nace 'Pendiente' (UI: "Sin confirmar"). El cliente
-- pide confirmar contactando a ventas por WhatsApp (se registra la
-- solicitud). Admin/vendedor la verifica y pasa a 'Confirmada'.
-- Una 'Confirmada' ya no caduca y queda fijada.
-- No mueve stock: el negocio es a pedido al proveedor (Deltron).
-- Idempotente.
-- ============================================================
BEGIN;

-- Ampliar el conjunto de estados válidos para incluir 'Confirmada'.
ALTER TABLE cotizaciones DROP CONSTRAINT IF EXISTS check_estado_valido;
ALTER TABLE cotizaciones ADD CONSTRAINT check_estado_valido
  CHECK ((estado)::text = ANY (ARRAY[
    'Pendiente'::character varying,
    'Confirmada'::character varying,
    'Completada'::character varying,
    'Caducada'::character varying,
    'Reclamada'::character varying
  ]::text[]));

-- Cuándo el cliente solicitó confirmar (contacto a ventas por WhatsApp).
ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS fecha_solicitud_confirmacion timestamp without time zone;

-- Cuándo admin/vendedor confirmó/verificó la cotización.
ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS fecha_confirmacion timestamp without time zone;

-- Quién confirmó (admin/vendedor). Si se da de baja la cuenta, queda NULL.
ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS id_confirmador integer;

-- Columna requerida por el trigger BEFORE UPDATE `trigger_cotizaciones_updated_at`
-- (función `actualizar_updated_at`, convención del proyecto ya usada en `cuentas`
-- y `productos`). Sin esta columna, CUALQUIER UPDATE a `cotizaciones` falla con
-- "el registro «new» no tiene un campo «updated_at»", lo que rompe tanto la
-- confirmación nueva como el flujo existente de reclamar/completar.
ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;

ALTER TABLE cotizaciones DROP CONSTRAINT IF EXISTS cotizaciones_id_confirmador_fkey;
ALTER TABLE cotizaciones ADD CONSTRAINT cotizaciones_id_confirmador_fkey
  FOREIGN KEY (id_confirmador) REFERENCES cuentas(id) ON DELETE SET NULL;

COMMIT;
