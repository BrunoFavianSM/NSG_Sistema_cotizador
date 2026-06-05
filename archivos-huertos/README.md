# Archivos Huérfanos Migrados

## Ubicación
`backend/scripts/archivos-huertos/`

## Archivos movidos

### 1. `crear-admin.js`
- **Ubicación original:** `backend/scripts/crear-admin.js`
- **Motivo del movimiento:** Actualizado para usar la tabla `cuentas` en lugar de la tabla eliminada `administradores`
- **Cambio:** Ahora inserta usuarios con `rol = 'admin'` en la tabla `cuentas`
- **Uso actual:** Para crear usuarios administradores del sistema

### 2. `seed-datos-prueba.js`
- **Ubicación original:** `backend/scripts/seed-datos-prueba.js`
- **Motivo del movimiento:** Tablas `administradores` y `clientes` ya no existen
- **Nota:** Este script estaba usando las tablas eliminadas, necesita actualizar referencias si se usa

## Tablas eliminadas (referencias en estos scripts)
- `administradores` → reemplazada por `cuentas` con `rol = 'admin'`
- `clientes` → reemplazada por `cuentas` con `rol = 'usuario'`

## Relacionado con
- Eliminación de tablas no usadas (2026-05-30)
- Migración a estructura unificada de usuarios en `cuentas`
