-- ============================================================
-- MIGRACIÓN 012: arreglo del generador de código de ticket
-- Problema: generar_codigo_ticket() usa una secuencia por año, pero si en la
-- tabla hay tickets que no avanzaron la secuencia (seed/restore), nextval
-- devuelve un número ya usado -> "llave duplicada cotizaciones_codigo_ticket_key".
--
-- Solución:
--  1) Función AUTO-REPARABLE: si el código generado ya existe, avanza la
--     secuencia hasta encontrar uno libre (a prueba de desincronización).
--  2) Adelanta la secuencia del año actual al máximo ticket existente.
-- Idempotente.
-- ============================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.generar_codigo_ticket()
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
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

  -- Buscar un número libre (la secuencia podría estar desincronizada del MAX real).
  LOOP
    EXECUTE format('SELECT nextval(%L)', seq_name) INTO nuevo_numero;
    nuevo_codigo := 'NSG-' || anio || '-' || LPAD(nuevo_numero::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM cotizaciones WHERE codigo_ticket = nuevo_codigo);
  END LOOP;

  RETURN nuevo_codigo;
END;
$function$;

-- Adelantar la secuencia del año actual al máximo número de ticket existente.
DO $$
DECLARE
  anio INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  seq_name VARCHAR := 'seq_ticket_' || EXTRACT(YEAR FROM CURRENT_DATE);
  max_num BIGINT;
BEGIN
  SELECT COALESCE(MAX(SPLIT_PART(codigo_ticket, '-', 3)::int), 0)
    INTO max_num
    FROM cotizaciones
   WHERE codigo_ticket LIKE ('NSG-' || anio || '-%');

  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = seq_name) THEN
    EXECUTE format('CREATE SEQUENCE %I START 1', seq_name);
  END IF;

  -- setval con is_called=true => el próximo nextval devuelve max_num + 1.
  PERFORM setval(seq_name, GREATEST(max_num, 1), true);
END $$;

COMMIT;
