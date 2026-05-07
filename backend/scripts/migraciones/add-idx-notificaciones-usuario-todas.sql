-- Migración: Índice para consulta de todas las notificaciones de un usuario
-- Optimiza GET /api/notificaciones/todas (paginada, ordenada por fecha_creacion DESC)
-- Complementa el índice parcial existente (WHERE leida = FALSE) para la consulta de pendientes.
-- Requisito: Restricción transversal 6 (BD)

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_todas
  ON notificaciones_usuario (id_usuario, fecha_creacion DESC);
