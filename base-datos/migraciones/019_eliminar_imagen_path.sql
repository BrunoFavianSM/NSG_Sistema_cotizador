-- ============================================================
-- MIGRACION 019: eliminar productos.imagen_path
--
-- Columna 100% vacia (0 de 904). Servia a una feature de subida de
-- imagen local que no tenia UI (ningun frontend la usaba). Se elimino
-- el endpoint de subida y el middleware multer en el mismo cambio.
-- Las imagenes de producto se sirven por imagen_url. Idempotente.
-- ============================================================
BEGIN;
ALTER TABLE productos DROP COLUMN IF EXISTS imagen_path;
COMMIT;
