# Utilidades de Seguridad

Este módulo proporciona funciones de seguridad para el Sistema de Cotización Automatizada.

## Módulos Disponibles

### 1. Encriptación (`encriptacion.js`)

Proporciona funciones para encriptar y desencriptar datos sensibles usando AES-256-CBC.

#### Uso

```javascript
const { encriptar, desencriptar, generarClaveEncriptacion } = require('./utilidades/encriptacion');

// Encriptar un email
const emailEncriptado = encriptar('cliente@ejemplo.com');
console.log(emailEncriptado); // "a1b2c3d4e5f6....:f7e8d9c0b1a2...."

// Desencriptar
const emailOriginal = desencriptar(emailEncriptado);
console.log(emailOriginal); // "cliente@ejemplo.com"

// Generar nueva clave de encriptación (solo para setup inicial)
const nuevaClave = generarClaveEncriptacion();
console.log('ENCRYPTION_KEY=' + nuevaClave);
```

#### Configuración

Antes de usar las funciones de encriptación, debes configurar la variable de entorno `ENCRYPTION_KEY`:

```bash
# Generar una clave
node -e "console.log(require('./src/utilidades/encriptacion').generarClaveEncriptacion())"

# Agregar al archivo .env
ENCRYPTION_KEY=tu_clave_de_64_caracteres_hexadecimales
```

### 2. Sanitización (`sanitizacion.js`)

Proporciona funciones para sanitizar y validar inputs del usuario.

#### Uso

```javascript
const {
  sanitizarInput,
  sanitizarObjeto,
  validarEmail,
  validarTelefono,
  validarSinCodigoMalicioso,
  normalizarNombre,
  limitarLongitud
} = require('./utilidades/sanitizacion');

// Sanitizar input individual
const nombreLimpio = sanitizarInput('<script>alert(1)</script>Juan');
console.log(nombreLimpio); // "Juan"

// Sanitizar objeto completo
const datos = {
  nombre: '<b>Juan</b>',
  descripcion: 'Producto <script>alert(1)</script>',
  precio: 100
};
const datosSanitizados = sanitizarObjeto(datos);
// { nombre: 'Juan', descripcion: 'Producto', precio: 100 }

// Validar email
const resultadoEmail = validarEmail('usuario@ejemplo.com');
if (resultadoEmail.valido) {
  console.log('Email válido:', resultadoEmail.email);
} else {
  console.log('Error:', resultadoEmail.error);
}

// Validar teléfono
const resultadoTelefono = validarTelefono('+51 987 654 321');
if (resultadoTelefono.valido) {
  console.log('Teléfono limpio:', resultadoTelefono.telefono); // "+51987654321"
}

// Validar código malicioso
const validacion = validarSinCodigoMalicioso('texto normal');
if (!validacion.valido) {
  console.log('Código malicioso detectado:', validacion.error);
}

// Normalizar nombre
const nombreNormalizado = normalizarNombre('juan pérez garcía');
console.log(nombreNormalizado); // "Juan Pérez García"

// Limitar longitud
const textoLimitado = limitarLongitud('Texto muy largo...', 10);
console.log(textoLimitado); // "Texto mu..."
```

### 3. Validación (`validacion.js`)

Proporciona funciones para validar estructuras de datos complejas.

#### Uso

```javascript
const {
  validarProducto,
  validarCliente,
  validarCotizacion,
  validarEstadoCotizacion,
  validarMargen,
  validarId,
  validarCodigoTicket,
  validarCredenciales
} = require('./utilidades/validacion');

// Validar producto
const producto = {
  nombre: 'Intel Core i7-13700K',
  categoria: 'procesador',
  socket: 'LGA1700',
  precio_base: 450.00,
  stock: 10,
  tdp: 125
};

const resultadoProducto = validarProducto(producto);
if (!resultadoProducto.valido) {
  console.log('Errores:', resultadoProducto.errores);
  // [{ campo: 'nombre', mensaje: 'Nombre es requerido' }, ...]
}

// Validar cliente
const cliente = {
  nombre: 'Juan Pérez',
  correo: 'juan@ejemplo.com',
  telefono: '+51987654321'
};

const resultadoCliente = validarCliente(cliente);
if (resultadoCliente.valido) {
  console.log('Cliente válido');
}

// Validar cotización
const cotizacion = {
  componentes: [
    { id: 1, nombre: 'Intel i7', precio: 450 },
    { id: 2, nombre: 'RAM 16GB', precio: 80 }
  ],
  precio_total: 636,
  margen_aplicado: 20
};

const resultadoCotizacion = validarCotizacion(cotizacion);

// Validar estado
const resultadoEstado = validarEstadoCotizacion('Pendiente');
if (resultadoEstado.valido) {
  console.log('Estado válido');
}

// Validar margen
const resultadoMargen = validarMargen(20);
if (resultadoMargen.valido) {
  console.log('Margen válido');
}

// Validar ID
const resultadoId = validarId('5');
if (resultadoId.valido) {
  console.log('ID válido:', resultadoId.id); // 5 (convertido a número)
}

// Validar código de ticket
const resultadoTicket = validarCodigoTicket('NSG-2024-0001');
if (resultadoTicket.valido) {
  console.log('Código válido');
}

// Validar credenciales
const credenciales = {
  username: 'admin',
  password: 'password123'
};

const resultadoCredenciales = validarCredenciales(credenciales);
if (!resultadoCredenciales.valido) {
  console.log('Errores:', resultadoCredenciales.errores);
}
```

## Ejemplo de Uso en Controladores

### Ejemplo: Crear Producto

```javascript
const { validarProducto } = require('../utilidades/validacion');
const { sanitizarObjeto } = require('../utilidades/sanitizacion');

async function crearProducto(req, res) {
  try {
    // 1. Sanitizar datos de entrada
    const datosSanitizados = sanitizarObjeto(req.body);
    
    // 2. Validar datos
    const validacion = validarProducto(datosSanitizados);
    
    if (!validacion.valido) {
      return res.status(400).json({
        error: 'Datos inválidos',
        errores: validacion.errores
      });
    }
    
    // 3. Insertar en base de datos
    const resultado = await ejecutarQuery(
      `INSERT INTO productos (nombre, categoria, precio_base, stock)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        datosSanitizados.nombre,
        datosSanitizados.categoria,
        datosSanitizados.precio_base,
        datosSanitizados.stock
      ]
    );
    
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
```

### Ejemplo: Crear Cliente con Datos Encriptados

```javascript
const { encriptar } = require('../utilidades/encriptacion');
const { validarCliente } = require('../utilidades/validacion');
const { sanitizarObjeto, validarEmail, validarTelefono } = require('../utilidades/sanitizacion');

async function crearCliente(req, res) {
  try {
    // 1. Sanitizar datos
    const datosSanitizados = sanitizarObjeto(req.body);
    
    // 2. Validar datos
    const validacion = validarCliente(datosSanitizados);
    
    if (!validacion.valido) {
      return res.status(400).json({
        error: 'Datos inválidos',
        errores: validacion.errores
      });
    }
    
    // 3. Encriptar datos sensibles
    const correoEncriptado = encriptar(datosSanitizados.correo);
    const telefonoEncriptado = datosSanitizados.telefono 
      ? encriptar(datosSanitizados.telefono) 
      : null;
    
    // 4. Insertar en base de datos
    const resultado = await ejecutarQuery(
      `INSERT INTO usuarios_clientes (nombre, correo, telefono)
       VALUES ($1, $2, $3) RETURNING id, nombre, created_at`,
      [
        datosSanitizados.nombre,
        correoEncriptado,
        telefonoEncriptado
      ]
    );
    
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
```

### Ejemplo: Obtener Cliente con Datos Desencriptados

```javascript
const { desencriptar } = require('../utilidades/encriptacion');

async function obtenerCliente(req, res) {
  try {
    const { id } = req.params;
    
    // Validar ID
    const validacionId = validarId(id);
    if (!validacionId.valido) {
      return res.status(400).json({ error: validacionId.error });
    }
    
    // Consultar base de datos
    const resultado = await ejecutarQuery(
      'SELECT * FROM usuarios_clientes WHERE id = $1',
      [validacionId.id]
    );
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    const cliente = resultado.rows[0];
    
    // Desencriptar datos sensibles
    cliente.correo = desencriptar(cliente.correo);
    if (cliente.telefono) {
      cliente.telefono = desencriptar(cliente.telefono);
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
```

## Mejores Prácticas

### 1. Siempre Sanitizar Antes de Validar

```javascript
// ✅ CORRECTO
const datosSanitizados = sanitizarObjeto(req.body);
const validacion = validarProducto(datosSanitizados);

// ❌ INCORRECTO
const validacion = validarProducto(req.body); // Sin sanitizar
```

### 2. Encriptar Datos Sensibles

```javascript
// ✅ CORRECTO - Encriptar antes de guardar
const correoEncriptado = encriptar(email);
await ejecutarQuery('INSERT INTO usuarios_clientes (correo) VALUES ($1)', [correoEncriptado]);

// ❌ INCORRECTO - Guardar en texto plano
await ejecutarQuery('INSERT INTO usuarios_clientes (correo) VALUES ($1)', [email]);
```

### 3. Validar Todos los Inputs

```javascript
// ✅ CORRECTO
const validacionId = validarId(req.params.id);
if (!validacionId.valido) {
  return res.status(400).json({ error: validacionId.error });
}

// ❌ INCORRECTO - Confiar en el input sin validar
const id = req.params.id;
await ejecutarQuery('SELECT * FROM productos WHERE id = $1', [id]);
```

### 4. Manejar Errores de Encriptación

```javascript
// ✅ CORRECTO
try {
  const correo = desencriptar(correoEncriptado);
  return correo;
} catch (error) {
  console.error('Error al desencriptar:', error);
  return null; // O manejar apropiadamente
}

// ❌ INCORRECTO - No manejar errores
const correo = desencriptar(correoEncriptado); // Puede fallar
```

## Tests

Todos los módulos tienen tests completos. Para ejecutarlos:

```bash
cd backend
npm test -- utilidades-seguridad.test.js
```

## Requisitos Validados

- **Requisito 10.1**: Autenticación del Panel Administrativo
- **Requisito 10.2**: Protección de rutas administrativas
- **Requisito 10.3**: Validación de credenciales
- **Requisito 10.4**: Prevención de accesos no autorizados

## Seguridad

- **Encriptación**: AES-256-CBC con IV aleatorio
- **Sanitización**: Remoción de tags HTML, scripts y eventos JavaScript
- **Validación**: Validación estricta de tipos y formatos
- **SQL Injection**: Prevención mediante queries parametrizadas (usar siempre con `ejecutarQuery`)
- **XSS**: Prevención mediante sanitización de inputs

## Notas Importantes

1. **ENCRYPTION_KEY**: Debe ser un string hexadecimal de 64 caracteres (32 bytes). Generar con `generarClaveEncriptacion()`.
2. **Nunca** almacenar la clave de encriptación en el código fuente.
3. **Siempre** usar queries parametrizadas para prevenir SQL injection.
4. **Siempre** sanitizar inputs antes de procesarlos.
5. **Siempre** validar datos antes de insertarlos en la base de datos.
