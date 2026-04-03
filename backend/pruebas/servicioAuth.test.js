/**
 * Pruebas para Servicio de Autenticación
 * 
 * Valida funcionalidad de login, generación de tokens JWT,
 * y verificación de contraseñas con bcrypt.
 */

const servicioAuth = require('../src/servicios/servicioAuth');
const { ejecutarQuery } = require('../src/configuracion/baseDatos');
const bcrypt = require('bcrypt');

// Mock de la base de datos
jest.mock('../src/configuracion/baseDatos');

describe('Servicio de Autenticación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configurar JWT_SECRET para las pruebas
    process.env.JWT_SECRET = 'test-secret-key-12345';
  });

  describe('login', () => {
    it('debe autenticar correctamente con credenciales válidas', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      
      ejecutarQuery.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'admin',
          password_hash: passwordHash,
          nombre_completo: 'Administrador Principal'
        }]
      });

      const resultado = await servicioAuth.login('admin', 'password123');

      expect(resultado.exito).toBe(true);
      expect(resultado.token).toBeDefined();
      expect(resultado.usuario).toEqual({
        id: 1,
        username: 'admin',
        nombre: 'Administrador Principal'
      });
      expect(resultado.error).toBeUndefined();
    });

    it('debe rechazar credenciales con username inválido', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });

      const resultado = await servicioAuth.login('usuarioInexistente', 'password123');

      expect(resultado.exito).toBe(false);
      expect(resultado.error).toBe('Usuario o contraseña incorrectos');
      expect(resultado.token).toBeUndefined();
    });

    it('debe rechazar credenciales con password incorrecto', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      
      ejecutarQuery.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'admin',
          password_hash: passwordHash,
          nombre_completo: 'Administrador Principal'
        }]
      });

      const resultado = await servicioAuth.login('admin', 'passwordIncorrecto');

      expect(resultado.exito).toBe(false);
      expect(resultado.error).toBe('Usuario o contraseña incorrectos');
      expect(resultado.token).toBeUndefined();
    });

    it('debe validar que el username tenga mínimo 3 caracteres', async () => {
      const resultado = await servicioAuth.login('ab', 'password123');

      expect(resultado.exito).toBe(false);
      expect(resultado.error).toBe('Credenciales inválidas');
      expect(resultado.detalles).toBeDefined();
    });

    it('debe validar que el password tenga mínimo 6 caracteres', async () => {
      const resultado = await servicioAuth.login('admin', '12345');

      expect(resultado.exito).toBe(false);
      expect(resultado.error).toBe('Credenciales inválidas');
      expect(resultado.detalles).toBeDefined();
    });

    it('debe manejar errores de base de datos', async () => {
      ejecutarQuery.mockRejectedValue(new Error('Error de conexión'));

      const resultado = await servicioAuth.login('admin', 'password123');

      expect(resultado.exito).toBe(false);
      expect(resultado.error).toBe('Error al procesar la autenticación');
    });
  });

  describe('generarToken', () => {
    it('debe generar un token JWT válido', () => {
      const payload = {
        id: 1,
        username: 'admin',
        nombre: 'Administrador Principal'
      };

      const token = servicioAuth.generarToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT tiene 3 partes
    });

    it('debe generar token con expiración personalizada', () => {
      const payload = { id: 1, username: 'admin', nombre: 'Admin' };
      const token = servicioAuth.generarToken(payload, '1h');

      expect(token).toBeDefined();
      
      // Verificar que el token contiene la expiración correcta
      const resultado = servicioAuth.verificarToken(token);
      expect(resultado.valido).toBe(true);
    });

    it('debe lanzar error si JWT_SECRET no está configurado', () => {
      delete process.env.JWT_SECRET;

      const payload = { id: 1, username: 'admin', nombre: 'Admin' };

      expect(() => {
        servicioAuth.generarToken(payload);
      }).toThrow('JWT_SECRET no está configurado');
    });
  });

  describe('verificarToken', () => {
    it('debe verificar correctamente un token válido', () => {
      const payload = {
        id: 1,
        username: 'admin',
        nombre: 'Administrador Principal'
      };

      const token = servicioAuth.generarToken(payload);
      const resultado = servicioAuth.verificarToken(token);

      expect(resultado.valido).toBe(true);
      expect(resultado.payload).toEqual({
        id: 1,
        username: 'admin',
        nombre: 'Administrador Principal'
      });
      expect(resultado.error).toBeUndefined();
    });

    it('debe rechazar token inválido', () => {
      const tokenInvalido = 'token.invalido.xyz';
      const resultado = servicioAuth.verificarToken(tokenInvalido);

      expect(resultado.valido).toBe(false);
      expect(resultado.error).toBe('Token inválido');
    });

    it('debe rechazar token vacío', () => {
      const resultado = servicioAuth.verificarToken('');

      expect(resultado.valido).toBe(false);
      expect(resultado.error).toBe('Token no proporcionado');
    });

    it('debe rechazar token null', () => {
      const resultado = servicioAuth.verificarToken(null);

      expect(resultado.valido).toBe(false);
      expect(resultado.error).toBe('Token no proporcionado');
    });

    it('debe detectar token expirado', () => {
      const payload = { id: 1, username: 'admin', nombre: 'Admin' };
      const token = servicioAuth.generarToken(payload, '-1s'); // Token ya expirado

      // Esperar un momento para asegurar que expire
      const resultado = servicioAuth.verificarToken(token);

      expect(resultado.valido).toBe(false);
      expect(resultado.error).toBe('Token expirado');
    });
  });

  describe('hashPassword', () => {
    it('debe hashear una contraseña correctamente', async () => {
      const password = 'password123';
      const hash = await servicioAuth.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt genera hashes largos
    });

    it('debe generar hashes diferentes para la misma contraseña', async () => {
      const password = 'password123';
      const hash1 = await servicioAuth.hashPassword(password);
      const hash2 = await servicioAuth.hashPassword(password);

      expect(hash1).not.toBe(hash2); // bcrypt usa salt aleatorio
    });

    it('debe permitir especificar saltRounds', async () => {
      const password = 'password123';
      const hash = await servicioAuth.hashPassword(password, 5);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });
  });

  describe('verificarPassword', () => {
    it('debe verificar correctamente una contraseña válida', async () => {
      const password = 'password123';
      const hash = await servicioAuth.hashPassword(password);

      const resultado = await servicioAuth.verificarPassword(password, hash);

      expect(resultado).toBe(true);
    });

    it('debe rechazar una contraseña incorrecta', async () => {
      const password = 'password123';
      const hash = await servicioAuth.hashPassword(password);

      const resultado = await servicioAuth.verificarPassword('passwordIncorrecto', hash);

      expect(resultado).toBe(false);
    });

    it('debe manejar hash inválido', async () => {
      const resultado = await servicioAuth.verificarPassword('password123', 'hash-invalido');

      expect(resultado).toBe(false);
    });
  });

  describe('obtenerAdministradorPorId', () => {
    it('debe obtener administrador por ID', async () => {
      ejecutarQuery.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'admin',
          nombre_completo: 'Administrador Principal',
          created_at: new Date()
        }]
      });

      const resultado = await servicioAuth.obtenerAdministradorPorId(1);

      expect(resultado).toBeDefined();
      expect(resultado.id).toBe(1);
      expect(resultado.username).toBe('admin');
      expect(resultado.nombre_completo).toBe('Administrador Principal');
      expect(ejecutarQuery).toHaveBeenCalledWith(
        'SELECT id, username, nombre_completo, created_at FROM administradores WHERE id = $1',
        [1]
      );
    });

    it('debe retornar null si el administrador no existe', async () => {
      ejecutarQuery.mockResolvedValue({ rows: [] });

      const resultado = await servicioAuth.obtenerAdministradorPorId(999);

      expect(resultado).toBeNull();
    });

    it('debe propagar errores de base de datos', async () => {
      ejecutarQuery.mockRejectedValue(new Error('Error de conexión'));

      await expect(servicioAuth.obtenerAdministradorPorId(1)).rejects.toThrow('Error de conexión');
    });
  });

  describe('Integración: Flujo completo de autenticación', () => {
    it('debe completar flujo de registro, login y verificación', async () => {
      // 1. Hashear contraseña (simula registro)
      const password = 'password123';
      const hash = await servicioAuth.hashPassword(password);

      // 2. Simular login
      ejecutarQuery.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'admin',
          password_hash: hash,
          nombre_completo: 'Administrador Principal'
        }]
      });

      const loginResult = await servicioAuth.login('admin', password);
      expect(loginResult.exito).toBe(true);
      expect(loginResult.token).toBeDefined();

      // 3. Verificar token generado
      const verificacion = servicioAuth.verificarToken(loginResult.token);
      expect(verificacion.valido).toBe(true);
      expect(verificacion.payload.username).toBe('admin');
    });
  });
});
