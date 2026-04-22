/**
 * Tests unitarios - POST /api/asistente/mensaje
 *
 * Cubre los tres casos del Requisito 21.1:
 *  1. Mensaje válido con sesión existente → 200 con exito: true
 *  2. Mensaje vacío → 400
 *  3. Sesión inválida (UUID inexistente) → 404
 *
 * servicioLLM.generar está mockeado para evitar llamadas reales a Gemini.
 */

'use strict';

const request = require('supertest');
const app     = require('../src/servidor');

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../src/configuracion/baseDatos');
jest.mock('../src/servicios/servicioLLM');
jest.mock('../src/servicios/servicioValidacionAsistente');
jest.mock('../src/servicios/servicioSemaforo');
jest.mock('../src/servicios/servicioMemoriaPerfil');

const { ejecutarQuery }           = require('../src/configuracion/baseDatos');
const servicioLLM                 = require('../src/servicios/servicioLLM');
const servicioValidacionAsistente = require('../src/servicios/servicioValidacionAsistente');
const servicioSemaforo            = require('../src/servicios/servicioSemaforo');

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const SESION_ID_VALIDA  = '550e8400-e29b-41d4-a716-446655440000';
const SESION_ID_INVALIDA = '00000000-0000-0000-0000-000000000000';

/** Respuesta mínima que devuelve el LLM mockeado */
const RESPUESTA_LLM_BASE = {
  respuesta:             'Perfecto, te recomiendo esta configuración.',
  quick_replies:         ['Ver detalles', 'Cambiar presupuesto'],
  semaforo:              null,
  configuracion_propuesta: null
};

/** Configuración propuesta de ejemplo que devuelve el LLM */
const CONFIGURACION_LLM = {
  procesador:     { id: 1, nombre: 'Ryzen 5 7600X',   precio_usd: 189.99 },
  placa_madre:    { id: 2, nombre: 'MSI B650',         precio_usd: 159.99 },
  ram:            [{ id: 3, nombre: '16GB DDR5',       precio_usd: 49.99  }],
  almacenamiento: { id: 4, nombre: '1TB NVMe',         precio_usd: 79.99  },
  gpu:            { id: 5, nombre: 'RTX 4060',         precio_usd: 299.99 },
  fuente:         { id: 6, nombre: '650W Gold',        precio_usd: 89.99  },
  case:           { id: 7, nombre: 'NZXT H510',        precio_usd: 69.99  }
};

// ─── Helpers de mock ──────────────────────────────────────────────────────────

/**
 * Configura ejecutarQuery para simular una sesión existente y respuestas
 * mínimas de BD (tipo de cambio, historial, productos, guardar mensaje).
 */
function mockearBDConSesionValida() {
  ejecutarQuery.mockImplementation((sql) => {
    // Verificar existencia de sesión
    if (sql.includes('asistente_sesiones') && sql.includes('SELECT sesion_id')) {
      return Promise.resolve({ rows: [{ sesion_id: SESION_ID_VALIDA }] });
    }
    // Tipo de cambio
    if (sql.includes("clave = 'tipo_cambio_usd_pen'")) {
      return Promise.resolve({ rows: [{ valor: '3.80' }] });
    }
    // Historial de mensajes de la sesión
    if (sql.includes('asistente_mensajes') && sql.includes('ORDER BY created_at ASC')) {
      return Promise.resolve({ rows: [] });
    }
    // Catálogo de productos
    if (sql.includes('FROM productos p')) {
      return Promise.resolve({ rows: [] });
    }
    // Guardar mensaje (INSERT)
    if (sql.includes('INSERT INTO asistente_mensajes')) {
      return Promise.resolve({ rows: [{ id: 1 }] });
    }
    // Guardar configuración (INSERT)
    if (sql.includes('INSERT INTO asistente_configuraciones')) {
      return Promise.resolve({
        rows: [{
          id: 42,
          sesion_id: SESION_ID_VALIDA,
          configuracion: CONFIGURACION_LLM,
          precio_total_usd: '939.94',
          validada: true,
          intentos_validacion: 1
        }]
      });
    }
    return Promise.resolve({ rows: [] });
  });
}

/**
 * Configura ejecutarQuery para simular que la sesión NO existe.
 */
function mockearBDSinSesion() {
  ejecutarQuery.mockImplementation((sql) => {
    if (sql.includes('asistente_sesiones') && sql.includes('SELECT sesion_id')) {
      return Promise.resolve({ rows: [] }); // sesión no encontrada
    }
    return Promise.resolve({ rows: [] });
  });
}

// ─── Suite principal ──────────────────────────────────────────────────────────

describe('POST /api/asistente/mensaje', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // LLM mockeado por defecto: respuesta sin configuración propuesta
    servicioLLM.generar.mockResolvedValue(RESPUESTA_LLM_BASE);

    // Validador mockeado: siempre válido
    servicioValidacionAsistente.validar.mockResolvedValue({
      valida: true,
      errores: [],
      advertencias: []
    });

    // Semáforo mockeado
    servicioSemaforo.calcular.mockReturnValue({
      gaming: 4, edicion_video: 2, productividad: 5, streaming: 3, renderizado_3d: 1
    });
  });

  // ── Caso 1: mensaje válido con sesión existente ──────────────────────────

  describe('Caso 1 - mensaje válido con sesión existente', () => {
    test('debe retornar 200 con exito: true y respuesta del asistente', async () => {
      mockearBDConSesionValida();

      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({
          sesion_id: SESION_ID_VALIDA,
          mensaje:   'Quiero una PC para gaming con presupuesto de S/3500'
        });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.exito).toBe(true);
      expect(respuesta.body.respuesta).toBe(RESPUESTA_LLM_BASE.respuesta);
    });

    test('debe incluir quick_replies en la respuesta', async () => {
      mockearBDConSesionValida();

      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: 'Hola' });

      expect(respuesta.status).toBe(200);
      expect(Array.isArray(respuesta.body.quick_replies)).toBe(true);
    });

    test('debe llamar a servicioLLM.generar exactamente una vez', async () => {
      mockearBDConSesionValida();

      await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: 'Hola' });

      expect(servicioLLM.generar).toHaveBeenCalledTimes(1);
    });

    test('debe ejecutar Double-Check y retornar configuracion_propuesta cuando el LLM la incluye', async () => {
      mockearBDConSesionValida();

      servicioLLM.generar.mockResolvedValue({
        ...RESPUESTA_LLM_BASE,
        configuracion_propuesta: CONFIGURACION_LLM
      });

      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: 'Dame una configuración' });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.exito).toBe(true);
      // La configuración debe estar enriquecida con precios PEN
      expect(respuesta.body.configuracion_propuesta).not.toBeNull();
      expect(respuesta.body.configuracion_propuesta.validada).toBe(true);
    });

    test('debe retornar semaforo cuando hay configuracion_propuesta válida', async () => {
      mockearBDConSesionValida();

      servicioLLM.generar.mockResolvedValue({
        ...RESPUESTA_LLM_BASE,
        configuracion_propuesta: CONFIGURACION_LLM
      });

      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: 'Dame una configuración' });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.semaforo).not.toBeNull();
      expect(respuesta.body.semaforo).toHaveProperty('gaming');
    });

    test('debe aceptar usuario_id opcional en el body', async () => {
      mockearBDConSesionValida();

      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: 'Hola', usuario_id: 5 });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.exito).toBe(true);
    });

    test('debe sanitizar el mensaje antes de procesarlo', async () => {
      mockearBDConSesionValida();

      // Mensaje con caracteres de control que deben ser eliminados
      const mensajeConCaracteresControl = 'Hola\x00\x01\x1F mundo';

      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: mensajeConCaracteresControl });

      expect(respuesta.status).toBe(200);
      // El LLM debe haber recibido el mensaje sanitizado
      const llamadaLLM = servicioLLM.generar.mock.calls[0][0];
      expect(llamadaLLM.mensajeActual).not.toContain('\x00');
    });
  });

  // ── Caso 2: mensaje vacío → 400 ──────────────────────────────────────────

  describe('Caso 2 - mensaje vacío', () => {
    test('debe retornar 400 cuando el mensaje es una cadena vacía', async () => {
      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: '' });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.exito).toBe(false);
      expect(respuesta.body.error).toBeDefined();
    });

    test('debe retornar 400 cuando el mensaje es solo espacios en blanco', async () => {
      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: '   ' });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.exito).toBe(false);
    });

    test('debe retornar 400 cuando el mensaje está ausente del body', async () => {
      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.exito).toBe(false);
    });

    test('debe retornar 400 cuando el mensaje es null', async () => {
      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: null });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.exito).toBe(false);
    });

    test('no debe llamar al LLM cuando el mensaje es vacío', async () => {
      await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: '' });

      expect(servicioLLM.generar).not.toHaveBeenCalled();
    });

    test('debe retornar 400 cuando sesion_id está ausente', async () => {
      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ mensaje: 'Hola' });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.exito).toBe(false);
    });

    test('debe retornar 400 cuando sesion_id es una cadena vacía', async () => {
      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: '', mensaje: 'Hola' });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.exito).toBe(false);
    });
  });

  // ── Caso 3: sesión inválida (UUID inexistente) → 404 ─────────────────────

  describe('Caso 3 - sesión inválida (UUID inexistente)', () => {
    test('debe retornar 404 cuando la sesión no existe en la BD', async () => {
      mockearBDSinSesion();

      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_INVALIDA, mensaje: 'Hola' });

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.exito).toBe(false);
      expect(respuesta.body.error).toBeDefined();
    });

    test('no debe llamar al LLM cuando la sesión no existe', async () => {
      mockearBDSinSesion();

      await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_INVALIDA, mensaje: 'Hola' });

      expect(servicioLLM.generar).not.toHaveBeenCalled();
    });

    test('debe retornar 404 con mensaje descriptivo', async () => {
      mockearBDSinSesion();

      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_INVALIDA, mensaje: 'Hola' });

      expect(respuesta.status).toBe(404);
      expect(typeof respuesta.body.error).toBe('string');
      expect(respuesta.body.error.length).toBeGreaterThan(0);
    });
  });

  // ── Manejo de errores del LLM ─────────────────────────────────────────────

  describe('Manejo de errores del LLM', () => {
    test('debe retornar 500 cuando el LLM falla', async () => {
      mockearBDConSesionValida();
      servicioLLM.generar.mockRejectedValue(new Error('Gemini API error'));

      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: 'Hola' });

      expect(respuesta.status).toBe(500);
      expect(respuesta.body.exito).toBe(false);
    });

    test('debe retornar mostrar_asesor: true cuando el LLM falla', async () => {
      mockearBDConSesionValida();
      servicioLLM.generar.mockRejectedValue(new Error('Timeout'));

      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: 'Hola' });

      expect(respuesta.body.mostrar_asesor).toBe(true);
    });

    test('debe retornar mensaje amigable cuando la BD de productos no está disponible', async () => {
      // Sesión existe pero productos fallan
      ejecutarQuery.mockImplementation((sql) => {
        if (sql.includes('asistente_sesiones') && sql.includes('SELECT sesion_id')) {
          return Promise.resolve({ rows: [{ sesion_id: SESION_ID_VALIDA }] });
        }
        if (sql.includes("clave = 'tipo_cambio_usd_pen'")) {
          return Promise.resolve({ rows: [{ valor: '3.80' }] });
        }
        if (sql.includes('asistente_mensajes') && sql.includes('ORDER BY created_at ASC')) {
          return Promise.resolve({ rows: [] });
        }
        if (sql.includes('FROM productos p')) {
          return Promise.reject(new Error('BD no disponible'));
        }
        if (sql.includes('INSERT INTO asistente_mensajes')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({ rows: [] });
      });

      const respuesta = await request(app)
        .post('/api/asistente/mensaje')
        .send({ sesion_id: SESION_ID_VALIDA, mensaje: 'Hola' });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.exito).toBe(true);
      expect(respuesta.body.mostrar_asesor).toBe(true);
      expect(respuesta.body.quick_replies).toContain('Hablar con asesor');
    });
  });
});
