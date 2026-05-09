/**
 * Pruebas Unitarias — controladorAsistente
 * Validación de entrada, verificación de sesión.
 */

const controlador = require('../../src/asistente/controladorAsistente');

// Mock de todos los servicios
jest.mock('../../src/asistente/servicioSesion', () => ({
  crearSesion: jest.fn(),
  guardarMensaje: jest.fn().mockResolvedValue(1),
  obtenerHistorialMensajes: jest.fn().mockResolvedValue([]),
  obtenerParametrosFinancieros: jest.fn().mockResolvedValue({ margen: 15, igv: 18, tipoCambio: 3.7 }),
  obtenerProductosDisponibles: jest.fn().mockResolvedValue([]),
  guardarConfiguracion: jest.fn().mockResolvedValue({ id: 1 }),
  obtenerSesionesUsuario: jest.fn().mockResolvedValue([]),
  actualizarEstadoSesion: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/asistente/servicioCuestionario', () => ({
  construirEstadoCuestionario: jest.fn().mockReturnValue({ uso: null, faltantes: ['uso'], completo: false }),
  construirContextoConversacion: jest.fn().mockReturnValue({ campos_detectados: {}, campos_faltantes: ['uso'] }),
}));

jest.mock('../../src/asistente/sistemaPrompt', () => ({
  construirSystemPrompt: jest.fn(() => 'System prompt mock'),
}));

jest.mock('../../src/asistente/servicioLLM', () => ({
  generarRespuesta: jest.fn().mockResolvedValue({
    respuesta: '¿Para qué usarás tu PC?',
    quick_replies: ['Gaming'],
    configuracion_propuesta: null,
    perfil_usuario: null,
    requiere_asesor: false,
  }),
  ErrorLLM: class ErrorLLM extends Error {
    constructor(mensaje, tipo) { super(mensaje); this.tipo = tipo; this.name = 'ErrorLLM'; }
  },
}));

jest.mock('../../src/asistente/orquestadorAgentes', () => ({
  ejecutarPipeline: jest.fn().mockRejectedValue(new Error('Pipeline deshabilitado')),
}));

jest.mock('../../src/asistente/servicioSemaforo', () => ({
  calcularSemaforo: jest.fn().mockReturnValue({ gaming: 5, edicion_video: 4, productividad: 6, streaming: 3, renderizado_3d: 4 }),
}));

jest.mock('../../src/servicios/servicioCompatibilidad', () => ({
  validarConfiguracionConBD: jest.fn().mockResolvedValue({ compatible: true, errores: [], advertencias: [] }),
  obtenerMapaComponentesDesdeBD: jest.fn().mockResolvedValue(new Map()),
  convertirComponenteBD: jest.fn().mockReturnValue({}),
}));

jest.mock('../../src/configuracion/baseDatos', () => ({
  ejecutarQuery: jest.fn().mockResolvedValue({ rows: [{ sesion_id: 'uuid-1' }] }),
}));

jest.mock('../../src/utilidades/sanitizacion', () => ({
  sanitizarInput: jest.fn((msg) => msg?.trim() || ''),
}));

const servicioSesion = require('../../src/asistente/servicioSesion');
const { ejecutarQuery } = require('../../src/configuracion/baseDatos');
const servicioLLM = require('../../src/asistente/servicioLLM');

describe('controladorAsistente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AGENT_PIPELINE_ENABLED = 'false';
  });

  describe('nuevaSesion', () => {
    test('crea sesión exitosamente', async () => {
      servicioSesion.crearSesion.mockResolvedValue({ sesion_id: 'uuid-1', perfil_previo: null });
      const req = { body: { usuario_id: 1 } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controlador.nuevaSesion(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        exito: true,
        sesion_id: 'uuid-1',
      }));
    });

    test('retorna 500 si crearSesion falla', async () => {
      servicioSesion.crearSesion.mockRejectedValue(new Error('DB error'));
      const req = { body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controlador.nuevaSesion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('procesarMensaje', () => {
    test('400 si falta sesion_id', async () => {
      const req = { body: { mensaje: 'hola' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controlador.procesarMensaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 si mensaje vacío', async () => {
      const req = { body: { sesion_id: 'uuid-1', mensaje: '' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controlador.procesarMensaje(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('404 si sesión no existe — verifica ANTES de guardar mensaje', async () => {
      ejecutarQuery.mockResolvedValueOnce({ rows: [] }); // sesión no encontrada

      const req = { body: { sesion_id: 'no-existe', mensaje: 'hola' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controlador.procesarMensaje(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      // Mensaje del usuario NO se guardó porque la sesión no existe
      expect(servicioSesion.guardarMensaje).not.toHaveBeenCalled();
    });

    test('respuesta exitosa — llama al LLM y retorna respuesta', async () => {
      const req = { body: { sesion_id: 'uuid-1', mensaje: 'hola' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controlador.procesarMensaje(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        exito: true,
        respuesta: '¿Para qué usarás tu PC?',
      }));
    });

    test('fallback si respuesta del LLM está vacía', async () => {
      servicioLLM.generarRespuesta.mockResolvedValueOnce({
        respuesta: '',
        quick_replies: [],
        configuracion_propuesta: null,
        perfil_usuario: null,
        requiere_asesor: false,
      });

      const req = { body: { sesion_id: 'uuid-1', mensaje: 'cotizar' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controlador.procesarMensaje(req, res);

      const responseArg = res.json.mock.calls[0][0];
      expect(responseArg.respuesta).toContain('No pude generar una respuesta');
    });

    test('502 si el LLM falla con rate_limit', async () => {
      const err = new (require('../../src/asistente/servicioLLM').ErrorLLM)('Rate limited', 'rate_limit');
      servicioLLM.generarRespuesta.mockRejectedValueOnce(err);

      const req = { body: { sesion_id: 'uuid-1', mensaje: 'hola' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controlador.procesarMensaje(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
    });
  });

  describe('validarConfiguracion', () => {
    test('400 si producto_ids vacío', async () => {
      const req = { body: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controlador.validarConfiguracion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('obtenerHistorial', () => {
    test('400 si falta usuario_id', async () => {
      const req = { params: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controlador.obtenerHistorial(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('obtenerSesion', () => {
    test('400 si falta sesion_id', async () => {
      const req = { params: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await controlador.obtenerSesion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
