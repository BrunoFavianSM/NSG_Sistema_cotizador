-- ============================================================
-- MIGRACIÓN 010: integridad referencial historial/detalle -> productos
-- - historial_precios_producto.id_producto -> productos(id) ON DELETE CASCADE
--   (al eliminar un producto se borra su historial de precios).
-- - detalle_cotizacion.id_producto -> productos(id) ON DELETE SET NULL
--   (mantiene el snapshot de la cotización aunque se borre el producto).
-- Los FK se crean NOT VALID: NO modifican ni eliminan datos existentes; solo
-- aplican a operaciones nuevas y a la regla ON DELETE. La validación de filas
-- históricas puede hacerse luego (VALIDATE CONSTRAINT) previa limpieza
-- autorizada de huérfanos.
-- Idempotente.
-- ============================================================
BEGIN;

-- Historial de precios -> productos (CASCADE)
ALTER TABLE historial_precios_producto DROP CONSTRAINT IF EXISTS fk_historial_producto;
ALTER TABLE historial_precios_producto
  ADD CONSTRAINT fk_historial_producto
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE NOT VALID;

CREATE INDEX IF NOT EXISTS idx_historial_id_producto ON historial_precios_producto(id_producto);

-- Detalle de cotización -> productos (SET NULL, conserva snapshot)
ALTER TABLE detalle_cotizacion ALTER COLUMN id_producto DROP NOT NULL;
ALTER TABLE detalle_cotizacion DROP CONSTRAINT IF EXISTS fk_detalle_producto;
ALTER TABLE detalle_cotizacion
  ADD CONSTRAINT fk_detalle_producto
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE SET NULL NOT VALID;

CREATE INDEX IF NOT EXISTS idx_detalle_id_producto ON detalle_cotizacion(id_producto);

COMMIT;
