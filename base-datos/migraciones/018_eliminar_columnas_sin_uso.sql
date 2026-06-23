-- ============================================================
-- MIGRACION 018: eliminar columnas sin uso
--
-- - productos.flete:   100% vacia (0 de 904 filas). El "flete" del
--   cotizador es un concepto distinto (estado de UI para el costo de
--   envio de la cotizacion), no esta columna.
-- - productos.garantia: practicamente vacia (solo valores "consultar").
--   Se deja de mapear desde el CSV de importacion.
-- - cotizaciones.notas_vendedor: 100% vacia (0 de 38). El backend la
--   escribia al completar la venta, pero ningun UI la enviaba.
--
-- El codigo que referenciaba estas columnas fue removido en el mismo
-- cambio (controladorProductos, servicioImportacion, controladorCotizaciones).
-- Idempotente.
-- ============================================================
BEGIN;

ALTER TABLE productos DROP COLUMN IF EXISTS flete;
ALTER TABLE productos DROP COLUMN IF EXISTS garantia;
ALTER TABLE cotizaciones DROP COLUMN IF EXISTS notas_vendedor;

COMMIT;
