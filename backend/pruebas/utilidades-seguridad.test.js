/**
 * Tests para Utilidades de Seguridad
 * 
 * Valida el correcto funcionamiento de:
 * - Encriptación/Desencriptación (AES-256-CBC)
 * - Sanitización de inputs
 * - Validación de datos
 */

const { 
  encriptar, 
  desencriptar, 
  generarClaveEncriptacion 
} = require('../src/utilidades/encriptacion');

const {
  sanitizarInput,
  sanitizarObjeto,
  validarEmail,
  validarTelefono,
  validarSinCodigoMalicioso,
  normalizarNombre,
  limitarLongitud
} = require('../src/utilidades/sanitizacion');

const {
  validarProducto,
  validarCliente,
  validarCotizacion,
  validarEstadoCotizacion,
  validarMargen,
  validarId,
  validarCodigoTicket,
  validarCredenciales
} = require('../src/utilidades/validacion');

// Configurar clave de encriptación para tests
process.env.ENCRYPTION_KEY = generarClaveEncriptacion();

describe('Módulo de Encriptación', () => {
  describe('encriptar y desencriptar', () => {
    test('debe encriptar y desencriptar correctamente un texto', () => {
      const textoOriginal = 'cliente@ejemplo.com';
      const encriptado = encriptar(textoOriginal);
      const desencriptado = desencriptar(encriptado);
      
      expect(desencriptado).toBe(textoOriginal);
      expect(encriptado).not.toBe(textoOriginal);
      expect(encriptado).toContain(':');
    });

    test('debe generar diferentes valores encriptados para el mismo texto', () => {
      const texto = 'test@ejemplo.com';
      const encriptado1 = encriptar(texto);
      const encriptado2 = encriptar(texto);
      
      // Deben ser diferentes debido al IV aleatorio
      expect(encriptado1).not.toBe(encriptado2);
      
      // Pero ambos deben desencriptar al mismo valor
      expect(desencriptar(encriptado1)).toBe(texto);
      expect(desencriptar(encriptado2)).toBe(texto);
    });

    test('debe manejar caracteres especiales', () => {
      const texto = 'ñáéíóú@ejemplo.com';
      const encriptado = encriptar(texto);
      const desencriptado = desencriptar(encriptado);
      
      expect(desencriptado).toBe(texto);
    });

    test('debe lanzar error al encriptar valor no string', () => {
      expect(() => encriptar(null)).toThrow();
      expect(() => encriptar(undefined)).toThrow();
      expect(() => encriptar(123)).toThrow();
    });

    test('debe lanzar error al desencriptar formato inválido', () => {
      expect(() => desencriptar('formato_invalido')).toThrow();
      expect(() => desencriptar('')).toThrow();
      expect(() => desencriptar(null)).toThrow();
    });
  });

  describe('generarClaveEncriptacion', () => {
    test('debe generar clave de 64 caracteres hexadecimales', () => {
      const clave = generarClaveEncriptacion();
      
      expect(clave).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(clave)).toBe(true);
    });

    test('debe generar claves diferentes en cada llamada', () => {
      const clave1 = generarClaveEncriptacion();
      const clave2 = generarClaveEncriptacion();
      
      expect(clave1).not.toBe(clave2);
    });
  });
});

describe('Módulo de Sanitización', () => {
  describe('sanitizarInput', () => {
    test('debe remover tags HTML', () => {
      expect(sanitizarInput('<script>alert("xss")</script>')).toBe('');
      expect(sanitizarInput('<b>texto</b>')).toBe('texto');
    });

    test('debe remover eventos JavaScript', () => {
      expect(sanitizarInput('texto onclick="alert(1)"')).toBe('texto');
      expect(sanitizarInput('<img onerror="alert(1)">')).toBe('');
    });

    test('debe mantener texto limpio sin cambios', () => {
      expect(sanitizarInput('Texto normal')).toBe('Texto normal');
      expect(sanitizarInput('Producto Intel i7')).toBe('Producto Intel i7');
    });

    test('debe manejar valores no string', () => {
      expect(sanitizarInput(null)).toBe('');
      expect(sanitizarInput(undefined)).toBe('');
      expect(sanitizarInput(123)).toBe('');
    });
  });

  describe('sanitizarObjeto', () => {
    test('debe sanitizar todos los strings en un objeto', () => {
      const obj = {
        nombre: '<script>alert(1)</script>',
        descripcion: 'Texto normal',
        precio: 100
      };
      
      const sanitizado = sanitizarObjeto(obj);
      
      expect(sanitizado.nombre).toBe('');
      expect(sanitizado.descripcion).toBe('Texto normal');
      expect(sanitizado.precio).toBe(100);
    });

    test('debe sanitizar objetos anidados', () => {
      const obj = {
        producto: {
          nombre: '<b>Intel</b>',
          specs: {
            socket: 'AM5'
          }
        }
      };
      
      const sanitizado = sanitizarObjeto(obj);
      
      expect(sanitizado.producto.nombre).toBe('Intel');
      expect(sanitizado.producto.specs.socket).toBe('AM5');
    });
  });

  describe('validarEmail', () => {
    test('debe validar emails correctos', () => {
      const resultado = validarEmail('usuario@ejemplo.com');
      
      expect(resultado.valido).toBe(true);
      expect(resultado.email).toBe('usuario@ejemplo.com');
    });

    test('debe rechazar emails inválidos', () => {
      expect(validarEmail('email_invalido').valido).toBe(false);
      expect(validarEmail('').valido).toBe(false);
      expect(validarEmail(null).valido).toBe(false);
    });

    test('debe normalizar emails a minúsculas', () => {
      const resultado = validarEmail('Usuario@Ejemplo.COM');
      
      expect(resultado.valido).toBe(true);
      expect(resultado.email).toBe('usuario@ejemplo.com');
    });

    test('debe rechazar emails muy largos', () => {
      const emailLargo = 'a'.repeat(100) + '@ejemplo.com';
      const resultado = validarEmail(emailLargo);
      
      expect(resultado.valido).toBe(false);
    });
  });

  describe('validarTelefono', () => {
    test('debe validar teléfonos correctos', () => {
      expect(validarTelefono('987654321').valido).toBe(true);
      expect(validarTelefono('+51987654321').valido).toBe(true);
      expect(validarTelefono('+1 234 567 8900').valido).toBe(true);
    });

    test('debe limpiar espacios y caracteres no numéricos', () => {
      const resultado = validarTelefono('+51 987 654 321');
      
      expect(resultado.valido).toBe(true);
      expect(resultado.telefono).toBe('+51987654321');
    });

    test('debe rechazar teléfonos muy cortos o largos', () => {
      expect(validarTelefono('123').valido).toBe(false);
      expect(validarTelefono('1'.repeat(20)).valido).toBe(false);
    });
  });

  describe('validarSinCodigoMalicioso', () => {
    test('debe detectar código malicioso', () => {
      expect(validarSinCodigoMalicioso('<script>alert(1)</script>').valido).toBe(false);
      expect(validarSinCodigoMalicioso('javascript:alert(1)').valido).toBe(false);
      expect(validarSinCodigoMalicioso('<iframe src="evil.com">').valido).toBe(false);
      expect(validarSinCodigoMalicioso('onclick="alert(1)"').valido).toBe(false);
    });

    test('debe permitir texto limpio', () => {
      expect(validarSinCodigoMalicioso('Texto normal').valido).toBe(true);
      expect(validarSinCodigoMalicioso('Producto Intel i7').valido).toBe(true);
    });
  });

  describe('normalizarNombre', () => {
    test('debe capitalizar nombres correctamente', () => {
      expect(normalizarNombre('juan pérez')).toBe('Juan Pérez');
      expect(normalizarNombre('MARÍA GARCÍA')).toBe('María García');
      expect(normalizarNombre('pedro')).toBe('Pedro');
    });

    test('debe manejar valores inválidos', () => {
      expect(normalizarNombre('')).toBe('');
      expect(normalizarNombre(null)).toBe('');
    });
  });

  describe('limitarLongitud', () => {
    test('debe limitar texto largo', () => {
      const texto = 'Este es un texto muy largo que debe ser limitado';
      const limitado = limitarLongitud(texto, 20);
      
      expect(limitado.length).toBeLessThanOrEqual(20);
      expect(limitado).toContain('...');
    });

    test('debe mantener texto corto sin cambios', () => {
      expect(limitarLongitud('Texto corto', 20)).toBe('Texto corto');
    });
  });
});

describe('Módulo de Validación', () => {
  describe('validarProducto', () => {
    test('debe validar producto correcto', () => {
      const producto = {
        nombre: 'Intel Core i7-13700K',
        categoria: 'procesador',
        socket: 'LGA1700',
        precio_base: 450.00,
        stock: 10,
        tdp: 125
      };
      
      const resultado = validarProducto(producto);
      
      expect(resultado.valido).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    test('debe rechazar producto sin nombre', () => {
      const producto = {
        categoria: 'procesador',
        precio_base: 450.00,
        stock: 10
      };
      
      const resultado = validarProducto(producto);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.campo === 'nombre')).toBe(true);
    });

    test('debe rechazar precio negativo', () => {
      const producto = {
        nombre: 'Producto Test',
        categoria: 'ram',
        precio_base: -100,
        stock: 5
      };
      
      const resultado = validarProducto(producto);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.campo === 'precio_base')).toBe(true);
    });

    test('debe rechazar stock negativo', () => {
      const producto = {
        nombre: 'Producto Test',
        categoria: 'ram',
        precio_base: 100,
        stock: -5
      };
      
      const resultado = validarProducto(producto);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.campo === 'stock')).toBe(true);
    });

    test('debe requerir socket para procesador', () => {
      const producto = {
        nombre: 'Intel i7',
        categoria: 'procesador',
        precio_base: 450,
        stock: 10,
        tdp: 125
      };
      
      const resultado = validarProducto(producto);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.campo === 'socket')).toBe(true);
    });

    test('debe requerir wattage para fuente', () => {
      const producto = {
        nombre: 'Fuente 600W',
        categoria: 'fuente',
        precio_base: 80,
        stock: 5
      };
      
      const resultado = validarProducto(producto);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.campo === 'wattage')).toBe(true);
    });
  });

  describe('validarCliente', () => {
    test('debe validar cliente correcto', () => {
      const cliente = {
        nombre: 'Juan Pérez',
        correo: 'juan@ejemplo.com',
        telefono: '+51987654321'
      };
      
      const resultado = validarCliente(cliente);
      
      expect(resultado.valido).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    test('debe rechazar cliente sin correo', () => {
      const cliente = {
        nombre: 'Juan Pérez'
      };
      
      const resultado = validarCliente(cliente);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.campo === 'correo')).toBe(true);
    });

    test('debe permitir cliente sin teléfono', () => {
      const cliente = {
        nombre: 'Juan Pérez',
        correo: 'juan@ejemplo.com'
      };
      
      const resultado = validarCliente(cliente);
      
      expect(resultado.valido).toBe(true);
    });
  });

  describe('validarCotizacion', () => {
    test('debe validar cotización correcta', () => {
      const cotizacion = {
        componentes: [
          { id: 1, nombre: 'Intel i7', precio: 450 },
          { id: 2, nombre: 'RAM 16GB', precio: 80 }
        ],
        precio_total: 636,
        margen_aplicado: 20
      };
      
      const resultado = validarCotizacion(cotizacion);
      
      expect(resultado.valido).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    test('debe rechazar cotización sin componentes', () => {
      const cotizacion = {
        componentes: [],
        precio_total: 500,
        margen_aplicado: 20
      };
      
      const resultado = validarCotizacion(cotizacion);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.campo === 'componentes')).toBe(true);
    });

    test('debe rechazar margen fuera de rango', () => {
      const cotizacion = {
        componentes: [{ id: 1, nombre: 'Test', precio: 100 }],
        precio_total: 150,
        margen_aplicado: 150
      };
      
      const resultado = validarCotizacion(cotizacion);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.campo === 'margen_aplicado')).toBe(true);
    });
  });

  describe('validarEstadoCotizacion', () => {
    test('debe validar estados correctos', () => {
      expect(validarEstadoCotizacion('Pendiente').valido).toBe(true);
      expect(validarEstadoCotizacion('Completada').valido).toBe(true);
      expect(validarEstadoCotizacion('Caducada').valido).toBe(true);
      expect(validarEstadoCotizacion('Reclamada').valido).toBe(true);
    });

    test('debe rechazar estados inválidos', () => {
      expect(validarEstadoCotizacion('Invalido').valido).toBe(false);
      expect(validarEstadoCotizacion('').valido).toBe(false);
      expect(validarEstadoCotizacion(null).valido).toBe(false);
    });
  });

  describe('validarMargen', () => {
    test('debe validar márgenes correctos', () => {
      expect(validarMargen(0).valido).toBe(true);
      expect(validarMargen(20).valido).toBe(true);
      expect(validarMargen(100).valido).toBe(true);
    });

    test('debe rechazar márgenes fuera de rango', () => {
      expect(validarMargen(-1).valido).toBe(false);
      expect(validarMargen(101).valido).toBe(false);
      expect(validarMargen(null).valido).toBe(false);
    });
  });

  describe('validarId', () => {
    test('debe validar IDs correctos', () => {
      expect(validarId(1).valido).toBe(true);
      expect(validarId('5').valido).toBe(true);
      expect(validarId(100).valido).toBe(true);
    });

    test('debe rechazar IDs inválidos', () => {
      expect(validarId(0).valido).toBe(false);
      expect(validarId(-1).valido).toBe(false);
      expect(validarId('abc').valido).toBe(false);
      expect(validarId(null).valido).toBe(false);
    });
  });

  describe('validarCodigoTicket', () => {
    test('debe validar códigos correctos', () => {
      expect(validarCodigoTicket('NSG-2024-0001').valido).toBe(true);
      expect(validarCodigoTicket('NSG-2025-9999').valido).toBe(true);
    });

    test('debe rechazar códigos inválidos', () => {
      expect(validarCodigoTicket('NSG-24-001').valido).toBe(false);
      expect(validarCodigoTicket('ABC-2024-0001').valido).toBe(false);
      expect(validarCodigoTicket('NSG-2024-001').valido).toBe(false);
      expect(validarCodigoTicket('').valido).toBe(false);
    });
  });

  describe('validarCredenciales', () => {
    test('debe validar credenciales correctas', () => {
      const credenciales = {
        username: 'admin',
        password: 'password123'
      };
      
      const resultado = validarCredenciales(credenciales);
      
      expect(resultado.valido).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    test('debe rechazar username muy corto', () => {
      const credenciales = {
        username: 'ab',
        password: 'password123'
      };
      
      const resultado = validarCredenciales(credenciales);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.campo === 'username')).toBe(true);
    });

    test('debe rechazar password muy corto', () => {
      const credenciales = {
        username: 'admin',
        password: '12345'
      };
      
      const resultado = validarCredenciales(credenciales);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some(e => e.campo === 'password')).toBe(true);
    });
  });
});
