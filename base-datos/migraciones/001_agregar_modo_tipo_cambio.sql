-- ============================================================
-- Migración 001: Agregar modo_tipo_cambio a la tabla configuracion
-- Proyecto: NSG Latinoamerica E.I.R.L. — Sistema de Cotización
-- Requisitos: 8.1, 8.2, 8.3, 8.4
--
-- Idempotente: usa ON CONFLICT (clave) DO NOTHING.
-- No sobreescribe el valor si la clave ya existe.
--
-- Ejecución:
--   psql -d <base_de_datos> -f 001_agregar_modo_tipo_cambio.sql
-- ============================================================

BEGIN;

INSERT INTO configuracion (clave, valor, descripcion)
VALUES (
  'modo_tipo_cambio',
  'manual',
  'Modo de obtención del tipo de cambio USD/PEN: manual (ingresado por admin) o automatico (API api.decolecta.com/SUNAT)'
)
ON CONFLICT (clave) DO NOTHING;

COMMIT;
