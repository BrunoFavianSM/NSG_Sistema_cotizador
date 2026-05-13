/**
 * Tests de Propiedades — Configuración IA
 *
 * Property 3: Modo IA leído desde BD siempre tiene fallback al .env
 *   Validates: Requisito 2.6
 *
 * Property 4: Validación de modo activo rechaza valores no permitidos
 *   Validates: Requisito 2.4
 */

'use strict';

const fc = require('fast-check');

// ── Mock de baseDatos ANTES de requerir los módulos que lo usan ──
jest.mock('../../configuracion/baseDatos');
const { ejecutarQuery } = require('../../configuracion/baseDatos');

// ── Módulos bajo prueba ──
const { obtenerConfigIA } = require('../../asistente/servicioConfigIA');
const { actualizarModelosIA } = require('../../controladores/controladorConfiguracion');

// ── Campos obligatorios que debe retornar obtenerConfigIA() ──
const CAMPOS_REQUERIDOS = [
  'modo_activo',
  'gemini_model',
  'nvidia_model',
  'nvidia_classifier_model',
  'nvidia_embedding_model',
  'nvidia_reranker_model',
  'pipeline_enabled',
];

// ── Claves IA que puede devolver la BD ──
const CLAVES_IA = [
  'ia_modo_activo',
  'ia_gemini_model',
  'ia_nvidia_model',
  'ia_nvidia_classifier_model',
  'ia_nvidia_embedding_model',
  'ia_nvidia_reranker_model',
];

// ── Modos válidos ──
const MODOS_VALIDOS = ['pipeline', 'nvidia', 'gemini'];

// ── Modelos requeridos por modo ──
const MODELOS_POR_MODO = {
  pipeline: {
    nvidia_classifier_model: 'meta/llama-3.2-3b-instruct',
    nvidia_embedding_model: 'nvidia/nv-embed-v1',
    nvidia_reranker_model: 'nvidia/rerank-qa-mistral-4b',
  },
  nvidia: {
    nvidia_model: 'mistralai/mistral-small-4-119b-2603',
  },
  gemini: {
    gemini_model: 'gemini-2.5-flash',
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Property 3: Modo IA leído desde BD siempre tiene fallback al .env
// **Validates: Requisito 2.6**
// ────────────────────────────────────────────────────────────────────────────
describe('Property 3: obtenerConfigIA() siempre retorna objeto completo con fallback al .env', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retorna todos los campos cuando la BD devuelve filas arbitrarias', async () => {
    // Generador: array de registros con claves IA y valores no vacíos
    const rowsArbitrario = fc.array(
      fc.record({
        clave: fc.constantFrom(...CLAVES_IA),
        valor: fc.string({ minLength: 1, maxLength: 50 }),
      })
    );

    await fc.assert(
      fc.asyncProperty(rowsArbitrario, async (rows) => {
        ejecutarQuery.mockResolvedValueOnce({ rows });

        const config = await obtenerConfigIA();

        // Todos los campos requeridos deben estar presentes y no ser nulos/undefined
        for (const campo of CAMPOS_REQUERIDOS) {
          expect(config[campo]).toBeDefined();
          expect(config[campo]).not.toBeNull();
          expect(config[campo]).not.toBe('');
        }

        // pipeline_enabled debe ser booleano
        expect(typeof config.pipeline_enabled).toBe('boolean');

        // modo_activo debe ser string no vacío
        expect(typeof config.modo_activo).toBe('string');
        expect(config.modo_activo.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  test('retorna todos los campos cuando la BD devuelve tabla vacía', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant([]), async (rows) => {
        ejecutarQuery.mockResolvedValueOnce({ rows });

        const config = await obtenerConfigIA();

        for (const campo of CAMPOS_REQUERIDOS) {
          expect(config[campo]).toBeDefined();
          expect(config[campo]).not.toBeNull();
          expect(config[campo]).not.toBe('');
        }
      }),
      { numRuns: 10 }
    );
  });

  test('retorna todos los campos cuando la BD lanza un error', async () => {
    // Generador: mensajes de error arbitrarios
    const mensajeError = fc.string({ minLength: 1, maxLength: 100 });

    await fc.assert(
      fc.asyncProperty(mensajeError, async (mensaje) => {
        ejecutarQuery.mockRejectedValueOnce(new Error(mensaje));

        const config = await obtenerConfigIA();

        for (const campo of CAMPOS_REQUERIDOS) {
          expect(config[campo]).toBeDefined();
          expect(config[campo]).not.toBeNull();
          expect(config[campo]).not.toBe('');
        }

        // pipeline_enabled debe ser booleano incluso en error
        expect(typeof config.pipeline_enabled).toBe('boolean');
      }),
      { numRuns: 100 }
    );
  });

  test('retorna todos los campos cuando la BD devuelve claves parciales', async () => {
    // Generador: subconjunto aleatorio de claves IA
    const clavesParcialesArbitrarias = fc.array(
      fc.record({
        clave: fc.constantFrom(...CLAVES_IA),
        valor: fc.string({ minLength: 1, maxLength: 50 }),
      }),
      { minLength: 0, maxLength: 3 }
    );

    await fc.assert(
      fc.asyncProperty(clavesParcialesArbitrarias, async (rows) => {
        ejecutarQuery.mockResolvedValueOnce({ rows });

        const config = await obtenerConfigIA();

        for (const campo of CAMPOS_REQUERIDOS) {
          expect(config[campo]).toBeDefined();
          expect(config[campo]).not.toBeNull();
          expect(config[campo]).not.toBe('');
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Property 4: Validación de modo activo rechaza valores no permitidos
// **Validates: Requisito 2.4**
// ────────────────────────────────────────────────────────────────────────────
describe('Property 4: actualizarModelosIA() rechaza modos no permitidos con HTTP 400 MODO_INVALIDO', () => {
  /**
   * Construye mocks de req y res de Express para capturar la respuesta.
   */
  function crearMocks(body) {
    const res = {
      _status: null,
      _json: null,
      status(code) {
        this._status = code;
        return this;
      },
      json(data) {
        this._json = data;
        return this;
      },
    };
    const req = { body };
    return { req, res };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rechaza cualquier string que no sea pipeline, nvidia o gemini', async () => {
    // Generador: strings que NO son modos válidos
    const modoInvalido = fc
      .string()
      .filter((s) => !MODOS_VALIDOS.includes(s));

    await fc.assert(
      fc.asyncProperty(modoInvalido, async (modo) => {
        const { req, res } = crearMocks({ modo_activo: modo });

        await actualizarModelosIA(req, res);

        expect(res._status).toBe(400);
        expect(res._json).toBeDefined();
        expect(res._json.codigo).toBe('MODO_INVALIDO');
      }),
      { numRuns: 100 }
    );
  });

  test('rechaza modo_activo ausente (undefined)', async () => {
    const { req, res } = crearMocks({});

    await actualizarModelosIA(req, res);

    expect(res._status).toBe(400);
    expect(res._json.codigo).toBe('MODO_INVALIDO');
  });

  test('rechaza modo_activo null', async () => {
    const { req, res } = crearMocks({ modo_activo: null });

    await actualizarModelosIA(req, res);

    expect(res._status).toBe(400);
    expect(res._json.codigo).toBe('MODO_INVALIDO');
  });

  test('acepta modos válidos sin retornar MODO_INVALIDO', async () => {
    // Para modos válidos con todos los modelos requeridos, NO debe retornar 400 MODO_INVALIDO
    for (const modo of MODOS_VALIDOS) {
      const body = { modo_activo: modo, ...MODELOS_POR_MODO[modo] };
      const { req, res } = crearMocks(body);

      // Mockear ejecutarQuery para el INSERT y el SELECT final
      ejecutarQuery
        .mockResolvedValueOnce({ rows: [] }) // INSERT modo_activo
        .mockResolvedValueOnce({ rows: [] }) // INSERT gemini_model
        .mockResolvedValueOnce({ rows: [] }) // INSERT nvidia_model
        .mockResolvedValueOnce({ rows: [] }) // INSERT nvidia_classifier_model
        .mockResolvedValueOnce({ rows: [] }) // INSERT nvidia_embedding_model
        .mockResolvedValueOnce({ rows: [] }) // INSERT nvidia_reranker_model
        .mockResolvedValueOnce({ rows: [] }); // SELECT final

      await actualizarModelosIA(req, res);

      // No debe ser 400 con MODO_INVALIDO
      const esModoInvalido =
        res._status === 400 && res._json?.codigo === 'MODO_INVALIDO';
      expect(esModoInvalido).toBe(false);
    }
  });
});
