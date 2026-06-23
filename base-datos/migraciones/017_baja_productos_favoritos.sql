-- ============================================================
-- MIGRACION 017: baja de la funcionalidad de favoritos
--
-- Se elimina la feature de productos favoritos a pedido del equipo.
-- Se da de baja la tabla junto con su backend (ruta/controlador) y
-- el frontend (seccion de Perfil, boton de favorito en el selector).
--
-- Idempotente.
-- ============================================================
BEGIN;

DROP TABLE IF EXISTS productos_favoritos;

COMMIT;
