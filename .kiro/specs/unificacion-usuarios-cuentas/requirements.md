# Documento de Requisitos — Unificación de Usuarios en Tabla `cuentas`

## Introducción

El sistema Cotizador NSG mantiene actualmente dos tablas de usuarios paralelas:
`usuarios_clientes` (clientes sin cuenta, usada en cotizaciones) y `cuentas` (usuarios
autenticados con username, password y rol). Esta dualidad genera duplicación de lógica,
referencias cruzadas inconsistentes y bloquea la trazabilidad completa del historial de
un cliente desde que es ingresado por el admin hasta que se registra por cuenta propia.

Este spec describe la unificación completa bajo el patrón **guest-to-registered**:
`cuentas` pasa a ser la única tabla de identidad, con soporte para cuentas sin contraseña
(`estado = 'pendiente_activacion'`) y cuentas activas (`estado = 'activa'`). La migración
debe ser reversible, no romper el flujo existente de cotizaciones y dejar todos los
módulos dependientes apuntando a `cuentas`.

---

## Glosario

- **Cuenta**: Fila en la tabla `cuentas`. Representa cualquier identidad del sistema,
  sea un cliente sin contraseña o un usuario registrado.
- **Cuenta_Activa**: Cuenta con `estado = 'activa'` y `password_hash` no nulo. Puede
  iniciar sesión.
- **Cuenta_Pendiente**: Cuenta con `estado = 'pendiente_activacion'` y
  `password_hash = NULL`. Creada por el admin al cotizar para un cliente presencial.
- **Activacion**: Proceso por el cual una Cuenta_Pendiente establece su contraseña y
  pasa a estado `'activa'`.
- **Migrador**: Script Node.js que ejecuta la migración de datos de `usuarios_clientes`
  a `cuentas` dentro de una transacción atómica.
- **Controlador_Cotizaciones**: Módulo `controladorCotizaciones.js` que gestiona la
  creación y consulta de cotizaciones.
- **Middleware_Auth**: Módulo `auth.js` que expone `verificarTokenUsuario`,
  `verificarTokenAdmin` y `detectarUsuario`.
- **Sistema**: El backend Node.js/Express del Cotizador NSG.
- **Admin**: Usuario con `rol = 'admin'` en `cuentas`.
- **Usuario_Registrado**: Usuario con `rol = 'usuario'` y `estado = 'activa'` en `cuentas`.

---

## Requisitos

### Requisito 1: Modificación del esquema de `cuentas`

**User Story:** Como desarrollador, quiero que la tabla `cuentas` soporte identidades
sin contraseña, para que el admin pueda registrar clientes presenciales sin forzarlos
a crear una cuenta completa de inmediato.

#### Criterios de Aceptación

1. THE Sistema SHALL ejecutar una migración DDL que modifique `cuentas.password_hash`
   para aceptar valores `NULL`.
2. THE Sistema SHALL ejecutar una migración DDL que agregue la columna `cuentas.estado`
   de tipo `VARCHAR(30)` con `CHECK (estado IN ('activa', 'pendiente_activacion'))` y
   valor por defecto `'activa'`.
3. WHEN se intenta insertar una fila en `cuentas` con un valor de `estado` distinto de
   `'activa'` o `'pendiente_activacion'`, THEN THE Sistema SHALL rechazar la operación
   con un error de constraint de base de datos.
4. THE Sistema SHALL actualizar todas las filas existentes en `cuentas` al estado
   `'activa'` durante la migración DDL, para preservar el comportamiento de las cuentas
   ya registradas.
5. THE Sistema SHALL crear un índice en `cuentas(estado)` para optimizar las consultas
   de filtrado por estado.

---

### Requisito 2: Migración de datos de `usuarios_clientes` a `cuentas`

**User Story:** Como administrador del sistema, quiero que todos los clientes existentes
en `usuarios_clientes` sean migrados a `cuentas`, para que el historial de cotizaciones
quede unificado bajo una sola tabla de identidad.

#### Criterios de Aceptación

1. THE Migrador SHALL ejecutar la migración completa dentro de una única transacción
   de base de datos, de modo que cualquier error revierta todos los cambios.
2. WHEN el Migrador se ejecuta, THE Migrador SHALL insertar en `cuentas` una fila por
   cada fila existente en `usuarios_clientes`, con los siguientes mapeos:
   - `cuentas.nombre_completo` ← `usuarios_clientes.nombre`
   - `cuentas.correo_encrypted` ← `usuarios_clientes.correo`
   - `cuentas.correo_hash` ← `usuarios_clientes.correo_hash`
   - `cuentas.telefono_encrypted` ← `usuarios_clientes.telefono`
   - `cuentas.password_hash` ← `NULL`
   - `cuentas.estado` ← `'pendiente_activacion'`
   - `cuentas.rol` ← `'usuario'`
   - `cuentas.username` ← valor derivado del correo_hash (prefijo `'guest_'` + primeros
     16 caracteres del correo_hash) para garantizar unicidad sin exponer datos reales.
3. WHEN el Migrador se ejecuta, THE Migrador SHALL actualizar `cotizaciones.id_cliente`
   para que cada fila apunte al nuevo `id` en `cuentas` correspondiente al cliente
   migrado, dentro de la misma transacción.
4. THE Migrador SHALL verificar al finalizar que el número de filas migradas a `cuentas`
   con `estado = 'pendiente_activacion'` sea igual al número de filas que existían en
   `usuarios_clientes` antes de la migración.
5. THE Migrador SHALL incluir un script de rollback separado que restaure el estado
   previo: elimina las filas migradas de `cuentas`, restaura la FK de
   `cotizaciones.id_cliente` a `usuarios_clientes` y registra en consola cada paso
   ejecutado.
6. IF el Migrador detecta un correo_hash en `usuarios_clientes` que ya existe en
   `cuentas`, THEN THE Migrador SHALL reutilizar la fila existente en `cuentas` (sin
   duplicar) y actualizar `cotizaciones.id_cliente` para apuntar a esa fila.

---

### Requisito 3: Cambio de FK `cotizaciones.id_cliente` a `cuentas`

**User Story:** Como desarrollador, quiero que `cotizaciones.id_cliente` referencie
`cuentas(id)` en lugar de `usuarios_clientes(id)`, para que todas las cotizaciones
queden vinculadas a la tabla unificada de identidad.

#### Criterios de Aceptación

1. THE Sistema SHALL ejecutar una migración DDL que elimine la FK existente
   `cotizaciones_id_cliente_fkey` (que apunta a `usuarios_clientes`) y cree una nueva
   FK que apunte a `cuentas(id)` con `ON DELETE SET NULL`.
2. WHEN se inserta una cotización con un `id_cliente` que existe en `cuentas`, THE
   Sistema SHALL aceptar la operación sin error de FK.
3. WHEN se intenta insertar una cotización con un `id_cliente` que no existe en
   `cuentas`, THEN THE Sistema SHALL rechazar la operación con error de FK de base
   de datos.
4. THE Sistema SHALL mantener el índice existente `idx_cotizaciones_cliente` sobre
   `cotizaciones(id_cliente)` tras el cambio de FK.

---

### Requisito 4: Creación de Cuenta_Pendiente desde el flujo de cotización

**User Story:** Como admin, quiero que al ingresar nombre, correo y teléfono de un
cliente presencial en el cotizador, el sistema cree automáticamente una
Cuenta_Pendiente, para que ese cliente pueda activar su cuenta en el futuro y ver
sus cotizaciones.

#### Criterios de Aceptación

1. WHEN el Admin envía una solicitud `POST /api/cotizaciones` con `nombre_cliente`,
   `email_cliente` y opcionalmente `telefono_cliente`, THE Controlador_Cotizaciones
   SHALL buscar en `cuentas` por `correo_hash` del email proporcionado.
2. IF no existe ninguna fila en `cuentas` con ese `correo_hash`, THEN THE
   Controlador_Cotizaciones SHALL insertar una nueva fila en `cuentas` con
   `estado = 'pendiente_activacion'`, `password_hash = NULL` y `rol = 'usuario'`,
   dentro de la misma transacción de la cotización.
3. IF ya existe una fila en `cuentas` con ese `correo_hash` (sea `'activa'` o
   `'pendiente_activacion'`), THEN THE Controlador_Cotizaciones SHALL reutilizar esa
   fila sin crear un duplicado.
4. THE Controlador_Cotizaciones SHALL asignar el `id` de la cuenta encontrada o creada
   como `cotizaciones.id_cliente` en la cotización resultante.
5. WHEN el Admin envía `POST /api/cotizaciones` sin `email_cliente`, THE
   Controlador_Cotizaciones SHALL crear la cotización con `id_cliente = NULL`, sin
   crear ninguna fila en `cuentas`.
6. IF el `email_cliente` proporcionado tiene formato inválido, THEN THE
   Controlador_Cotizaciones SHALL retornar HTTP 400 con `{ exito: false, error:
   'Datos de cliente inválidos' }` sin crear cotización ni cuenta.

---

### Requisito 5: Flujo de activación de Cuenta_Pendiente

**User Story:** Como cliente presencial, quiero poder registrarme con mi correo y
crear una contraseña para activar mi cuenta, para que pueda ver todas las cotizaciones
que el admin hizo a mi nombre.

#### Criterios de Aceptación

1. WHEN un usuario envía `POST /api/auth/registro` con un correo que corresponde a
   una Cuenta_Pendiente existente, THE Sistema SHALL detectar la cuenta pendiente en
   lugar de crear una nueva fila.
2. WHEN se detecta una Cuenta_Pendiente durante el registro, THE Sistema SHALL
   solicitar al usuario que establezca una contraseña para activar su cuenta, en lugar
   de retornar un error de "correo ya registrado".
3. WHEN el usuario proporciona una contraseña válida para activar una Cuenta_Pendiente,
   THE Sistema SHALL actualizar `cuentas.password_hash` con el hash bcrypt de la
   contraseña y cambiar `cuentas.estado` a `'activa'`, dentro de una transacción.
4. WHEN el usuario proporciona una contraseña que no cumple los requisitos mínimos
   (menos de 8 caracteres), THEN THE Sistema SHALL retornar HTTP 400 con `{ exito:
   false, error: 'Contraseña inválida' }` sin modificar la cuenta.
5. WHEN la activación se completa exitosamente, THE Sistema SHALL retornar HTTP 200
   con `{ exito: true, mensaje: 'Cuenta activada exitosamente' }` y un token JWT
   válido para la sesión.

---

### Requisito 6: Visibilidad del historial de cotizaciones tras activación

**User Story:** Como cliente que acaba de activar su cuenta, quiero ver todas las
cotizaciones que el admin generó a mi nombre antes de que me registrara, para tener
un historial completo desde el primer contacto.

#### Criterios de Aceptación

1. WHEN un Usuario_Registrado consulta `GET /api/cotizaciones/historial`, THE Sistema
   SHALL retornar todas las cotizaciones cuyo `id_cliente` coincide con el `id` de la
   cuenta del usuario autenticado, incluyendo las generadas cuando la cuenta tenía
   `estado = 'pendiente_activacion'`.
2. THE Sistema SHALL ordenar el historial de cotizaciones por `fecha_emision`
   descendente.
3. WHEN un Usuario_Registrado consulta el historial y no tiene cotizaciones asociadas,
   THE Sistema SHALL retornar HTTP 200 con `{ exito: true, cotizaciones: [] }`.

---

### Requisito 7: Control de acceso por estado de cuenta

**User Story:** Como administrador del sistema, quiero que solo las cuentas activas
puedan iniciar sesión, para que los clientes presenciales no puedan autenticarse sin
haber establecido una contraseña.

#### Criterios de Aceptación

1. WHEN un usuario intenta hacer login con credenciales de una Cuenta_Pendiente, THEN
   THE Middleware_Auth SHALL retornar HTTP 403 con `{ error: 'Cuenta no activada',
   mensaje: 'Debes activar tu cuenta antes de iniciar sesión' }`.
2. WHEN un usuario intenta hacer login con credenciales de una Cuenta_Activa válida,
   THE Middleware_Auth SHALL emitir un token JWT con `{ id, username, rol, estado }` y
   retornar HTTP 200.
3. THE Middleware_Auth SHALL verificar `cuentas.estado = 'activa'` durante el proceso
   de login, antes de emitir el token JWT.
4. WHEN un token JWT válido llega a `verificarTokenUsuario` y la cuenta asociada tiene
   `estado = 'pendiente_activacion'` en base de datos, THEN THE Middleware_Auth SHALL
   retornar HTTP 403 con `{ error: 'Cuenta no activada' }`.

---

### Requisito 8: Actualización de FK en tablas de features avanzadas

**User Story:** Como desarrollador, quiero que `productos_favoritos` y
`notificaciones_usuario` referencien `cuentas(id)` en lugar de `usuarios_clientes(id)`,
para que las features avanzadas funcionen con la tabla unificada.

#### Criterios de Aceptación

1. THE Sistema SHALL ejecutar migraciones DDL que eliminen las FK existentes de
   `productos_favoritos.id_usuario` y `notificaciones_usuario.id_usuario` que apuntan
   a `usuarios_clientes`, y creen nuevas FK que apunten a `cuentas(id)` con
   `ON DELETE CASCADE`.
2. WHEN se inserta una fila en `productos_favoritos` con un `id_usuario` que existe en
   `cuentas`, THE Sistema SHALL aceptar la operación sin error de FK.
3. WHEN se inserta una fila en `notificaciones_usuario` con un `id_usuario` que existe
   en `cuentas`, THE Sistema SHALL aceptar la operación sin error de FK.
4. WHEN se elimina una fila de `cuentas`, THE Sistema SHALL eliminar en cascada todas
   las filas asociadas en `productos_favoritos` y `notificaciones_usuario`.
5. THE Sistema SHALL actualizar los scripts de migración
   `migrar-features-avanzadas-02-favoritos.js` y
   `migrar-features-avanzadas-03-notificaciones.js` para que las sentencias
   `CREATE TABLE IF NOT EXISTS` referencien `cuentas(id)` en lugar de
   `usuarios_clientes(id)`.

---

### Requisito 9: Deprecación de `usuarios_clientes`

**User Story:** Como desarrollador, quiero que `usuarios_clientes` quede marcada como
deprecada y eventualmente eliminada, para reducir la deuda técnica y evitar que nuevo
código la referencie.

#### Criterios de Aceptación

1. THE Sistema SHALL renombrar la tabla `usuarios_clientes` a `usuarios_clientes_deprecated`
   como paso final de la migración, una vez verificado que todas las FK han sido
   redirigidas a `cuentas`.
2. THE Sistema SHALL incluir en el script de migración un comentario SQL que documente
   la fecha de deprecación y el motivo.
3. THE Migrador SHALL verificar que ninguna FK activa apunte a `usuarios_clientes_deprecated`
   antes de completar la migración, y registrar el resultado en consola.
4. WHERE el entorno es producción, THE Migrador SHALL requerir confirmación explícita
   (`--confirmar-produccion`) antes de ejecutar el renombrado de la tabla.

---

### Requisito 10: Tests de regresión para endpoints afectados

**User Story:** Como desarrollador, quiero tests de regresión para todos los endpoints
que usaban `usuarios_clientes`, para garantizar que el comportamiento observable no
cambia tras la migración.

#### Criterios de Aceptación

1. THE Sistema SHALL incluir tests de integración para `POST /api/cotizaciones` que
   verifiquen: creación de Cuenta_Pendiente cuando el correo no existe, reutilización
   de cuenta existente cuando el correo ya está en `cuentas`, y creación de cotización
   sin cliente cuando no se proporciona email.
2. THE Sistema SHALL incluir tests de integración para `GET /api/cotizaciones/:ticket`
   que verifiquen que el JOIN con `cuentas` retorna `cliente_nombre` y `cliente_email`
   correctamente desencriptados.
3. THE Sistema SHALL incluir tests de integración para `GET /api/cotizaciones/historial`
   que verifiquen que un usuario autenticado ve solo sus propias cotizaciones.
4. THE Sistema SHALL incluir tests de integración para `POST /api/auth/login` que
   verifiquen que una Cuenta_Pendiente recibe HTTP 403 y una Cuenta_Activa recibe
   HTTP 200 con token.
5. THE Sistema SHALL incluir tests de integración para `POST /api/auth/registro` que
   verifiquen el flujo de activación de Cuenta_Pendiente (correo existente → activar
   con contraseña → estado cambia a 'activa').
6. WHEN se ejecuta la suite de tests de regresión, THE Sistema SHALL completar todos
   los tests sin errores en un entorno con base de datos de test (`NODE_ENV=test`).
