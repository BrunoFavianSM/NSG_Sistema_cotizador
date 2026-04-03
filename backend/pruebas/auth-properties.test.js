/**
 * Feature: sistema-cotizacion-automatizada
 * Property Tests para Autenticación
 * 
 * Property 23: Rutas protegidas requieren autenticación
 * Property 24: Autenticación válida retorna token
 */

const fc = require('fast-check');
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool, ejecutarQuery } = require('../src/configuracion/baseDatos');
const servicioAuth = require('../src/servicios/servicioAuth');
const { verificarToken } = require('../src/middleware/auth');

// Importar rutas
const authRoutes = require('../src/rutas/auth');
const productosRoutes = require('../src/rutas/productos');

// ============================================
// Configuración de App de Prueba
// ============================================

function crearAppPrueba() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/productos', productosRoutes);
  return app;
}

// ============================================
// Generadores (Arbitraries)
// ============================================

/**
 * Genera credenciales válidas para administradores
 */
const generadorCredencialesValidas = () => fc.record({
  username: fc.string({ minLength: 3, maxLength: 20 })
    .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
  password: fc.string({ minLength: 6, maxLength: 50 })
});

/**
 * Genera credenciales inválidas (username o password muy cortos)
 */
const generadorCredencialesInvalidas = () => fc.oneof(
  // Username muy corto
  fc.record({
    username: fc.string({ minLength: 0, maxLength: 2 }),
    password: fc.string({ minLength: 6, maxLength: 50 })
  }),
  // Password muy corto
  fc.record({
    username: fc.string({ minLength: 3, maxLength: 20 }),
    password: fc.string({ minLength: 0, maxLength: 5 })
  }),
  // Ambos inválidos
  fc.record({
    username: fc.string({ minLength: 0, maxLength: 2 }),
    password: fc.string({ minLength: 0, maxLength: 5 })
  })
);

/**
 * Genera tokens JWT inválidos
 */
const generadorTokenInvalido = () => fc.oneof(
  fc.constant(''),
  fc.constant('token-invalido'),
  fc.constant('abc.def.ghi'),
  fc.string({ minLength: 10, maxLength: 100 })
);

/**
 * Genera datos de producto para crear
 */
const generadorProducto = () => fc.record({
  nombre: fc.string({ minLength: 5, maxLength: 50 }),
  categoria: fc.constantFrom('procesador', 'placa_madre', 'ram', 'almacenamiento', 'gpu', 'fuente', 'case'),
  precio_base: fc.float({ min: 10, max: 10000, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
  stock: fc.integer({ min: 0, max: 100 })
});

/**
 * Genera rutas protegidas (admin) - solo POST que siempre funciona
 */
const generadorRutaProtegida = () => fc.record({
  metodo: fc.constant('POST'), // Solo POST para evitar 404 en rutas sin ID
  ruta: fc.constant('/api/productos'),
  body: fc.option(generadorProducto(), { nil: {} }) // Siempre enviar al menos objeto vacío
});

// ============================================
// Utilidades de Test
// ============================================

/**
 * Limpia la tabla de administradores
 */
async function limpiarAdministradores() {
  await ejecutarQuery('DELETE FROM administradores');
}

/**
 * Crea un administrador en la base de datos
 */
async function crearAdministrador(username, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const resultado = await ejecutarQuery(
    `INSERT INTO administradores (username, password_hash, nombre_completo)
     VALUES ($1, $2, $3)
     RETURNING id, username, nombre_completo`,
    [username, passwordHash, `Admin ${username}`]
  );
  return resultado.rows[0];
}

/**
 * Genera un token JWT válido
 */
function generarTokenValido(payload = null) {
  const defaultPayload = {
    id: 1,
    username: 'admin',
    nombre: 'Administrador Principal'
  };
  
  return jwt.sign(
    payload || defaultPayload,
    process.env.JWT_SECRET,
    {
      expiresIn: '24h',
      issuer: 'nsg-cotizacion-system'
    }
  );
}

/**
 * Genera un token JWT expirado
 */
function generarTokenExpirado() {
  return jwt.sign(
    { id: 1, username: 'admin', nombre: 'Admin' },
    process.env.JWT_SECRET,
    { expiresIn: '-1s' }
  );
}

// ============================================
// Property 23: Rutas protegidas requieren autenticación
// **Validates: Requirements 10.1**
// ============================================

describe('Property 23: Rutas protegidas requieren autenticación', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-property-tests-12345';
    app = crearAppPrueba();
  });

  beforeEach(async () => {
    await limpiarAdministradores();
  });

  test('Cualquier ruta protegida sin token retorna 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorRutaProtegida(),
        async (rutaConfig) => {
          // Hacer request sin token (solo POST)
          const response = await request(app)
            .post(rutaConfig.ruta)
            .send(rutaConfig.body || {});

          // Debe retornar 401 (no autenticado)
          expect(response.status).toBe(401);
          expect(response.body.error).toBeDefined();
          expect(response.body.error).toContain('Acceso denegado');
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Cualquier ruta protegida con token inválido retorna 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorRutaProtegida(),
        generadorTokenInvalido(),
        async (rutaConfig, tokenInvalido) => {
          // Hacer request con token inválido (solo POST)
          const response = await request(app)
            .post(rutaConfig.ruta)
            .set('Authorization', `Bearer ${tokenInvalido}`)
            .send(rutaConfig.body || {});

          // Debe retornar 403 (token inválido) o 401 (token vacío)
          expect([401, 403]).toContain(response.status);
          expect(response.body.error).toBeDefined();
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Cualquier ruta protegida con token expirado retorna 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorRutaProtegida(),
        async (rutaConfig) => {
          const tokenExpirado = generarTokenExpirado();
          
          // Hacer request con token expirado (solo POST)
          const response = await request(app)
            .post(rutaConfig.ruta)
            .set('Authorization', `Bearer ${tokenExpirado}`)
            .send(rutaConfig.body || {});

          // Debe retornar 401 (token expirado)
          expect(response.status).toBe(401);
          expect(response.body.error).toBeDefined();
          expect(response.body.error).toContain('Token expirado');
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Rutas protegidas con token válido permiten acceso', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorProducto(),
        async (producto) => {
          const tokenValido = generarTokenValido();
          
          // Intentar crear producto con token válido
          const response = await request(app)
            .post('/api/productos')
            .set('Authorization', `Bearer ${tokenValido}`)
            .send(producto);

          // No debe retornar 401 o 403 (puede retornar otros errores de validación)
          expect(response.status).not.toBe(401);
          expect(response.status).not.toBe(403);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Rutas públicas no requieren autenticación', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          '/api/productos',
          '/api/productos/1',
          '/api/productos/999'
        ),
        async (rutaPublica) => {
          // GET no requiere autenticación
          const response = await request(app)
            .get(rutaPublica);

          // No debe retornar 401 o 403 (puede retornar 404 si no existe)
          expect(response.status).not.toBe(401);
          expect(response.status).not.toBe(403);
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Header Authorization sin Bearer retorna 401 o 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorRutaProtegida(),
        fc.string({ minLength: 10, maxLength: 100 }),
        async (rutaConfig, tokenSinBearer) => {
          // Hacer request con Authorization sin "Bearer " (solo POST)
          const response = await request(app)
            .post(rutaConfig.ruta)
            .set('Authorization', tokenSinBearer) // Sin "Bearer "
            .send(rutaConfig.body || {});

          // Debe retornar 401 (formato incorrecto) o 403 (token inválido)
          expect([401, 403]).toContain(response.status);
          expect(response.body.error).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ============================================
// Property 24: Autenticación válida retorna token
// **Validates: Requirements 10.3**
// ============================================

describe('Property 24: Autenticación válida retorna token', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-property-tests-12345';
    app = crearAppPrueba();
  });

  beforeEach(async () => {
    await limpiarAdministradores();
  });

  test('Cualquier credencial válida retorna exito=true y token JWT', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorCredencialesValidas(),
        async (credenciales) => {
          // Limpiar antes de crear para evitar duplicados
          await limpiarAdministradores();
          
          // Crear administrador con estas credenciales
          await crearAdministrador(credenciales.username, credenciales.password);

          // Intentar login
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              username: credenciales.username,
              password: credenciales.password
            });

          // Debe retornar éxito
          expect(response.status).toBe(200);
          expect(response.body.exito).toBe(true);
          
          // Debe retornar token
          expect(response.body.token).toBeDefined();
          expect(typeof response.body.token).toBe('string');
          expect(response.body.token.length).toBeGreaterThan(0);
          
          // Token debe tener formato JWT (3 partes separadas por puntos)
          const partes = response.body.token.split('.');
          expect(partes.length).toBe(3);
          
          // Debe retornar información del usuario
          expect(response.body.usuario).toBeDefined();
          expect(response.body.usuario.username).toBe(credenciales.username);
          expect(response.body.usuario.id).toBeDefined();
          expect(response.body.usuario.nombre).toBeDefined();
        }
      ),
      { numRuns: 10 } // Reducido para evitar timeout
    );
  }, 30000); // Timeout de 30 segundos

  test('Token retornado es válido y verificable', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorCredencialesValidas(),
        async (credenciales) => {
          // Limpiar antes de crear
          await limpiarAdministradores();
          
          // Crear administrador
          await crearAdministrador(credenciales.username, credenciales.password);

          // Login
          const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
              username: credenciales.username,
              password: credenciales.password
            });

          expect(loginResponse.status).toBe(200);
          expect(loginResponse.body.token).toBeDefined();

          // Verificar que el token es válido usando el servicio
          const verificacion = servicioAuth.verificarToken(loginResponse.body.token);
          
          expect(verificacion.valido).toBe(true);
          expect(verificacion.payload).toBeDefined();
          expect(verificacion.payload.username).toBe(credenciales.username);
          expect(verificacion.error).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  test('Token retornado permite acceso a rutas protegidas', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorCredencialesValidas(),
        generadorProducto(),
        async (credenciales, producto) => {
          // Limpiar antes de crear
          await limpiarAdministradores();
          
          // Crear administrador
          await crearAdministrador(credenciales.username, credenciales.password);

          // Login
          const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
              username: credenciales.username,
              password: credenciales.password
            });

          expect(loginResponse.status).toBe(200);
          const token = loginResponse.body.token;

          // Usar token para acceder a ruta protegida
          const protectedResponse = await request(app)
            .post('/api/productos')
            .set('Authorization', `Bearer ${token}`)
            .send(producto);

          // No debe retornar 401 o 403
          expect(protectedResponse.status).not.toBe(401);
          expect(protectedResponse.status).not.toBe(403);
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  test('Credenciales inválidas retornan exito=false sin token', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorCredencialesValidas(),
        fc.string({ minLength: 6, maxLength: 50 }),
        async (credenciales, passwordIncorrecto) => {
          // Asegurar que el password incorrecto es diferente
          fc.pre(passwordIncorrecto !== credenciales.password);

          // Limpiar antes de crear
          await limpiarAdministradores();
          
          // Crear administrador
          await crearAdministrador(credenciales.username, credenciales.password);

          // Intentar login con password incorrecto
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              username: credenciales.username,
              password: passwordIncorrecto
            });

          // Debe retornar error
          expect(response.status).toBe(401);
          expect(response.body.exito).toBe(false);
          expect(response.body.error).toBeDefined();
          
          // NO debe retornar token
          expect(response.body.token).toBeUndefined();
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  test('Usuario inexistente retorna exito=false sin token', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorCredencialesValidas(),
        async (credenciales) => {
          // NO crear el administrador (usuario inexistente)

          // Intentar login
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              username: credenciales.username,
              password: credenciales.password
            });

          // Debe retornar error
          expect(response.status).toBe(401);
          expect(response.body.exito).toBe(false);
          expect(response.body.error).toBeDefined();
          
          // NO debe retornar token
          expect(response.body.token).toBeUndefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Token contiene información correcta del usuario', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorCredencialesValidas(),
        async (credenciales) => {
          // Limpiar antes de crear
          await limpiarAdministradores();
          
          // Crear administrador
          const admin = await crearAdministrador(credenciales.username, credenciales.password);

          // Login
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              username: credenciales.username,
              password: credenciales.password
            });

          expect(response.status).toBe(200);
          const token = response.body.token;

          // Decodificar token (sin verificar, solo para inspeccionar)
          const decoded = jwt.decode(token);
          
          expect(decoded).toBeDefined();
          expect(decoded.id).toBe(admin.id);
          expect(decoded.username).toBe(credenciales.username);
          expect(decoded.nombre).toBe(admin.nombre_completo);
          expect(decoded.iss).toBe('nsg-cotizacion-system');
          expect(decoded.exp).toBeDefined(); // Debe tener expiración
        }
      ),
      { numRuns: 10 }
    );
  }, 30000);

  test('Múltiples logins del mismo usuario generan tokens diferentes', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorCredencialesValidas(),
        async (credenciales) => {
          // Limpiar antes de crear
          await limpiarAdministradores();
          
          // Crear administrador
          await crearAdministrador(credenciales.username, credenciales.password);

          // Primer login
          const response1 = await request(app)
            .post('/api/auth/login')
            .send({
              username: credenciales.username,
              password: credenciales.password
            });

          // Esperar 1 segundo para asegurar timestamp diferente
          await new Promise(resolve => setTimeout(resolve, 1100));

          // Segundo login
          const response2 = await request(app)
            .post('/api/auth/login')
            .send({
              username: credenciales.username,
              password: credenciales.password
            });

          expect(response1.status).toBe(200);
          expect(response2.status).toBe(200);

          const token1 = response1.body.token;
          const token2 = response2.body.token;

          // Los tokens deben ser diferentes (tienen timestamps diferentes)
          expect(token1).not.toBe(token2);
          
          // Pero ambos deben ser válidos
          const verificacion1 = servicioAuth.verificarToken(token1);
          const verificacion2 = servicioAuth.verificarToken(token2);
          
          expect(verificacion1.valido).toBe(true);
          expect(verificacion2.valido).toBe(true);
        }
      ),
      { numRuns: 3 } // Reducido porque cada run toma >1 segundo
    );
  }, 60000); // Timeout de 60 segundos

  test('Credenciales con formato inválido retornan error sin token', async () => {
    await fc.assert(
      fc.asyncProperty(
        generadorCredencialesInvalidas(),
        async (credencialesInvalidas) => {
          // Intentar login con credenciales inválidas
          const response = await request(app)
            .post('/api/auth/login')
            .send({
              username: credencialesInvalidas.username,
              password: credencialesInvalidas.password
            });

          // Debe retornar error (400 o 401)
          expect([400, 401]).toContain(response.status);
          expect(response.body.exito).toBe(false);
          expect(response.body.error).toBeDefined();
          
          // NO debe retornar token
          expect(response.body.token).toBeUndefined();
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ============================================
// Cleanup
// ============================================

afterAll(async () => {
  await limpiarAdministradores();
  await pool.end();
});
