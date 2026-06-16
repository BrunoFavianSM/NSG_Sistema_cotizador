# Checklist de Seguridad — Antes de subir a producción

Resultado de la auditoría de seguridad (2026-06-10). Los fixes de código ya están
aplicados; esta lista cubre lo que SOLO puede hacerse al momento del despliegue.

## Obligatorio antes del despliegue

- [ ] Generar secretos reales (nunca los del `.env.example`):
  - `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
  - `ENCRYPTION_KEY`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Si la BD actual usó la `ENCRYPTION_KEY` de ejemplo (`0123...cdef`), hay que
    re-cifrar correos/teléfonos con la clave nueva (script de migración).
- [ ] Configurar `TURNSTILE_SECRET_KEY` (el servidor NO arranca en producción sin ella).
- [ ] Configurar `DB_PASSWORD` fuerte y un usuario PostgreSQL dedicado de mínimo
      privilegio (no `postgres`). `DB_SSL=true` si la BD no es localhost.
- [ ] Definir `FRONTEND_URL` con el dominio real (CORS).
- [ ] `NODE_ENV=production`.
- [ ] Verificar que la cuenta admin actual NO tenga la contraseña `admin123`
      (estuvo en el seed histórico). Si la tiene, rotarla.
- [ ] Crear el primer admin con `node archivos-huertos/crear-admin.js`
      (se niega si ya existe un admin; `--otro-admin` para adicionales).
- [ ] Tratar como comprometidos los tokens `\restrict` de pg_dump que estuvieron
      commiteados (historial git): no reutilizar esos respaldos cifrados.
- [ ] Servir el frontend con HTTPS y estas cabeceras en el servidor web:
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; connect-src 'self' <URL_API>`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## Riesgos aceptados (documentados)

- `GET /api/configuracion/margen` sigue público: el cotizador calcula precios en
  el navegador y necesita margen/IGV/tipo de cambio. Mejora futura recomendada:
  calcular precios en el backend y dejar de exponer margen y `precio_base` (costo).
- `xlsx@0.18.5`: solo se usa para ESCRIBIR exports (los CVE conocidos afectan el
  parseo de archivos no confiables, que no ocurre). Migrar a `exceljs` si en el
  futuro se importan archivos xlsx de usuarios.
- `esbuild`/`vite` (2 advisories moderate): afectan solo al dev server, no al
  build de producción. Resolver al migrar a Vite 8.
- Token JWT en `localStorage`: trade-off aceptado; mitigado con expiración de 8h,
  CSP y eliminación de toda lógica sensible del frontend. Mejora futura: cookies
  `HttpOnly` + refresh tokens.

## Verificación rápida post-despliegue

```bash
# Todos deben devolver 401 sin token:
curl -i https://API/api/clientes/emails
curl -i https://API/api/clientes/buscar?q=test
curl -i https://API/api/cotizaciones/cliente/x@y.com
curl -i https://API/api/cotizaciones/NSG-2026-0001/pdf

# Debe devolver 200 con cuerpo genérico aunque el correo no exista:
curl -i -X POST https://API/api/auth/recuperar -H "Content-Type: application/json" -d '{"correo":"noexiste@x.com"}'

# La respuesta pública de cotización NO debe incluir margen_aplicado ni costo_unitario_neto_usd:
curl -s https://API/api/cotizaciones/<TICKET_VALIDO>
```
