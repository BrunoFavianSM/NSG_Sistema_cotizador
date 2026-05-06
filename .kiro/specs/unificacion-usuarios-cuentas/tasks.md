# Plan de Implementación: Unificación de Usuarios en Tabla `cuentas`

## Resumen

Migración en 4 fases para unificar `usuarios_clientes` y `cuentas` bajo el patrón
guest-to-registered. Cada fase es verificable y reversible antes de pasar a la siguiente.

## Tareas

- [x] 1. Fase 1 — Migración DDL: modificar esquema de `cuentas`
  - Crear el archivo `base-datos/migraciones/005_unificar_usuarios_cuentas.sql`
  - Agregar `ALTER TABLE cuentas ALTER COLUMN password_hash DROP NOT NULL`
  - Agregar columna `estado VARCHAR(30) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'pendiente_activacion'))`
  - Ejecutar `UPDATE cuentas SET estado = 'activa'` para filas existentes
  - Crear índice `idx_cuentas_estado ON cuentas(estado)`
  - Hacer `username` nullable con `ALTER COLUMN username DROP NOT NULL`
  - Envolver todo en `BEGIN; ... COMMIT;`
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Fase 2 — Script migrador de datos
  - [x] 2.1 Crear `backend/scripts/migrar-005-unificar-usuarios.js` con la función `migrar(cliente)`
    - Implementar los 7 pasos del migrador: contar, iterar, mapear IDs, redirigir cotizaciones, verificar conteo, cambiar FK, renombrar tabla
    - Generar `username` como `guest_` + primeros 16 chars del `correo_hash` para cuentas nuevas
    - Manejar el caso de `correo_hash` duplicado reutilizando la cuenta existente
    - Agregar comentario SQL de deprecación con fecha en `usuarios_clientes_deprecated`
    - Verificar que ninguna FK activa apunte a `usuarios_clientes_deprecated` al finalizar
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.6, 9.1, 9.2, 9.3_

  - [x] 2.2 Agregar soporte para flags `--rollback` y `--confirmar-produccion`
    - Implementar función `rollback(cliente)` que elimine filas migradas, restaure FK a `usuarios_clientes` y registre cada paso en consola
    - Bloquear el paso de renombrado de tabla si no se pasa `--confirmar-produccion` en entorno de producción
    - _Requisitos: 2.5, 9.4_

  - [ ]* 2.3 Escribir test de integración para el migrador
    - Test: migrar N filas → exactamente N filas con `estado = 'pendiente_activacion'` en `cuentas`
    - Test: migrar con `correo_hash` duplicado → reutiliza cuenta existente, no duplica
    - Test: rollback → restaura estado previo sin filas residuales
    - _Requisitos: 2.4, 2.5, 2.6_

- [x] 3. Checkpoint — Verificar Fase 1 y Fase 2
  - Asegurarse de que todos los tests del migrador pasen, preguntar al usuario si hay dudas antes de continuar con los cambios de código.

- [x] 4. Fase 3 — Actualizar `servicioAuth.js`
  - [x] 4.1 Modificar `login()` para verificar `estado` de la cuenta
    - Agregar `estado` al `SELECT` de la query de login
    - Agregar verificación `if (cuenta.estado === 'pendiente_activacion')` antes de `bcrypt.compare`, retornando `{ exito: false, status: 403, codigo: 'CUENTA_PENDIENTE' }`
    - _Requisitos: 7.1, 7.3_

  - [ ]* 4.2 Escribir test de propiedad para `login()` con Cuenta_Pendiente
    - **Propiedad 1: Login con Cuenta_Pendiente siempre retorna 403**
    - **Valida: Requisitos 7.1, 7.3**
    - Usar `fast-check` con mocks de `ejecutarQuery`; mínimo 100 iteraciones
    - Archivo: `backend/src/__tests__/propiedades/unificacionUsuarios.property.test.js`

  - [x] 4.3 Modificar `registrar()` para detectar Cuenta_Pendiente
    - Cambiar el bloque de verificación de `correoExiste` para distinguir entre `estado = 'pendiente_activacion'` (retornar `{ status: 409, codigo: 'CUENTA_PENDIENTE_ACTIVACION' }`) y cuenta activa (retornar `{ status: 409, error: 'El correo electrónico ya está registrado' }`)
    - _Requisitos: 5.1, 5.2_

  - [x] 4.4 Implementar la función `activarCuenta(datos)` en `servicioAuth.js`
    - Validar inputs: `password` >= 8 chars, `username` requerido
    - Buscar cuenta por `correo_hash` con `estado = 'pendiente_activacion'`; retornar 404 si no existe
    - Verificar unicidad de `username`; retornar 409 con `codigo: 'USERNAME_EN_USO'` si ya existe
    - Hashear contraseña con `hashPassword()`
    - `UPDATE cuentas SET password_hash, username, estado='activa', intentos_fallidos=0, bloqueado_hasta=NULL WHERE correo_hash=$3 AND estado='pendiente_activacion'`
    - Generar JWT y retornar `{ exito: true, token, usuario }`
    - _Requisitos: 5.3, 5.4, 5.5_

  - [ ]* 4.5 Escribir test de propiedad para `activarCuenta()`
    - **Propiedad 2: Activación con contraseña válida siempre cambia estado a `'activa'`**
    - **Valida: Requisito 5.3**
    - Usar `fast-check`; verificar que `estado = 'activa'` y `password_hash` no nulo tras activación exitosa

  - [x] 4.6 Exportar `activarCuenta` en `module.exports` de `servicioAuth.js`
    - _Requisitos: 5.3_

- [x] 5. Fase 3 — Actualizar `auth.js` (middleware)
  - [x] 5.1 Modificar `verificarTokenUsuario()` para consultar `estado` en BD
    - Agregar `import { ejecutarQuery }` si no está presente
    - Después de `decodificarToken(token)`, ejecutar `SELECT estado FROM cuentas WHERE id = $1`
    - Si la cuenta no existe o `estado !== 'activa'`, retornar HTTP 403 con `{ error: 'Cuenta no activada' }`
    - _Requisitos: 7.4_

  - [ ]* 5.2 Escribir test de propiedad para `verificarTokenUsuario()`
    - **Propiedad 7: `verificarTokenUsuario` rechaza tokens de cuentas pendientes**
    - **Valida: Requisito 7.4**
    - Usar `fast-check`; para cualquier JWT válido cuyo `id` corresponde a cuenta pendiente, el middleware debe retornar 403 sin llamar a `next()`

- [x] 6. Fase 3 — Actualizar `controladorCotizaciones.js`
  - [x] 6.1 Reemplazar la función `buscarOCrearCliente()` para usar `cuentas` en lugar de `usuarios_clientes`
    - Cambiar `SELECT id, nombre, telefono FROM usuarios_clientes WHERE correo_hash = $1` → `SELECT id, nombre_completo AS nombre, telefono_encrypted AS telefono FROM cuentas WHERE correo_hash = $1`
    - Cambiar `UPDATE usuarios_clientes SET nombre=... WHERE id=...` → `UPDATE cuentas SET nombre_completo=... WHERE id=...`
    - Cambiar `INSERT INTO usuarios_clientes (nombre, correo, correo_hash, telefono)` → `INSERT INTO cuentas (nombre_completo, correo_encrypted, correo_hash, telefono_encrypted, rol, estado, password_hash) VALUES (..., 'usuario', 'pendiente_activacion', NULL)`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.2 Escribir test de propiedad para creación de Cuenta_Pendiente desde cotización
    - **Propiedad 3: Cotización con correo nuevo crea exactamente una Cuenta_Pendiente**
    - **Valida: Requisito 4.2**
    - Usar `fast-check`; para cualquier correo no existente en `cuentas`, verificar que se crea exactamente una fila con `estado = 'pendiente_activacion'`

  - [ ]* 6.3 Escribir test de propiedad para no-duplicación de cuentas
    - **Propiedad 4: Cotización con correo existente nunca duplica filas en `cuentas`**
    - **Valida: Requisito 4.3**
    - Usar `fast-check`; para cualquier correo ya existente (activo o pendiente), el conteo de filas con ese `correo_hash` debe seguir siendo exactamente 1

  - [x] 6.4 Actualizar el JOIN en `obtenerCotizacionConDetallesPorTicket()`
    - Cambiar `LEFT JOIN usuarios_clientes uc ON uc.id = c.id_cliente` → `LEFT JOIN cuentas uc ON uc.id = c.id_cliente`
    - Actualizar alias de columnas: `uc.nombre_completo AS cliente_nombre`, `uc.correo_encrypted AS cliente_correo`
    - _Requisitos: 3.1, 3.2, 10.2_

  - [x] 6.5 Actualizar la query de listado de clientes
    - Cambiar `FROM usuarios_clientes uc LEFT JOIN cotizaciones c ON c.id_cliente = uc.id` → `FROM cuentas uc LEFT JOIN cotizaciones c ON c.id_cliente = uc.id WHERE uc.rol = 'usuario'`
    - _Requisitos: 4.1_

  - [x] 6.6 Actualizar la query de búsqueda para notificaciones
    - Cambiar `SELECT id, nombre FROM usuarios_clientes WHERE correo_hash = $1` → `SELECT id, nombre_completo AS nombre FROM cuentas WHERE correo_hash = $1`
    - _Requisitos: 4.1_

- [x] 7. Fase 3 — Nuevo endpoint `POST /api/auth/activar`
  - [x] 7.1 Agregar `controladorAuth.activarCuenta` en `backend/src/controladores/controladorAuth.js`
    - Extraer `{ correo, username, password, confirmarPassword }` del body
    - Llamar a `servicioAuth.activarCuenta(datos)` y mapear el resultado a la respuesta HTTP correspondiente (200, 400, 404, 409)
    - _Requisitos: 5.3, 5.4, 5.5_

  - [x] 7.2 Registrar la ruta en `backend/src/rutas/auth.js`
    - Agregar `router.post('/activar', controladorAuth.activarCuenta)`
    - _Requisitos: 5.3_

- [x] 8. Fase 3 — Actualizar scripts de features avanzadas
  - En `backend/scripts/migrar-features-avanzadas-02-favoritos.js`, cambiar `REFERENCES usuarios_clientes(id) ON DELETE CASCADE` → `REFERENCES cuentas(id) ON DELETE CASCADE`
  - En `backend/scripts/migrar-features-avanzadas-03-notificaciones.js`, aplicar el mismo cambio de FK
  - _Requisitos: 8.1, 8.5_

- [x] 9. Checkpoint — Verificar Fase 3
  - Asegurarse de que todos los tests de propiedades y unitarios pasen. Preguntar al usuario si hay dudas antes de continuar con los tests de integración.

- [x] 10. Tests de integración
  - [x] 10.1 Crear `backend/src/__tests__/integracion/auth.unificacion.test.js`
    - Test: `POST /api/auth/login` con Cuenta_Pendiente → HTTP 403
    - Test: `POST /api/auth/login` con Cuenta_Activa válida → HTTP 200 + token
    - Test: `POST /api/auth/registro` con correo pendiente → HTTP 409 + `codigo: 'CUENTA_PENDIENTE_ACTIVACION'`
    - Test: `POST /api/auth/registro` con correo activo → HTTP 409
    - Test: `POST /api/auth/activar` con datos válidos → HTTP 200 + token + `estado='activa'`
    - Test: `POST /api/auth/activar` con password < 8 chars → HTTP 400
    - _Requisitos: 10.4, 10.5_

  - [x] 10.2 Crear `backend/src/__tests__/integracion/cotizaciones.unificacion.test.js`
    - Test: `POST /api/cotizaciones` con correo nuevo → crea Cuenta_Pendiente en `cuentas`
    - Test: `POST /api/cotizaciones` con correo existente → reutiliza cuenta, no duplica
    - Test: `POST /api/cotizaciones` sin email → `id_cliente = NULL`
    - Test: `GET /api/cotizaciones/:ticket` → JOIN con `cuentas` retorna `cliente_nombre` y `cliente_email` desencriptados
    - Test: `GET /api/cotizaciones/historial` → usuario autenticado ve solo sus cotizaciones (pre y post activación)
    - _Requisitos: 10.1, 10.2, 10.3_

  - [ ]* 10.3 Escribir test de propiedad para historial post-activación
    - **Propiedad 5: Historial post-activación incluye cotizaciones pre-activación**
    - **Valida: Requisito 6.1**
    - Usar `fast-check`; para N cotizaciones creadas con cuenta pendiente, tras activar, el historial debe contener exactamente esas N cotizaciones

  - [ ]* 10.4 Escribir test de propiedad para el migrador (conteo)
    - **Propiedad 6: El migrador preserva el conteo de clientes**
    - **Valida: Requisito 2.4**
    - Usar `fast-check`; para N filas en `usuarios_clientes` con `correo_hash` únicos no presentes en `cuentas`, tras migrar, el número de nuevas filas pendientes debe ser exactamente N

- [x] 11. Checkpoint final — Asegurarse de que todos los tests pasen
  - Ejecutar la suite completa con `NODE_ENV=test`. Asegurarse de que todos los tests pasen, preguntar al usuario si hay dudas antes de declarar la migración completa.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints garantizan validación incremental entre fases
- Los tests de propiedades usan `fast-check` (ya instalado como devDependency en backend)
- Los tests de integración requieren `NODE_ENV=test` con base de datos de test
- El renombrado de `usuarios_clientes` → `usuarios_clientes_deprecated` requiere `--confirmar-produccion` en producción
