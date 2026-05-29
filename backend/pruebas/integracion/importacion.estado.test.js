jest.mock('../../src/configuracion/baseDatos', () => ({
  ejecutarQuery: jest.fn(),
}));

jest.mock('../../src/servicios/servicioEnriquecimientoIA', () => ({
  obtenerEstadoMemoria: jest.fn(),
}));

const { ejecutarQuery } = require('../../src/configuracion/baseDatos');
const servicioEnriquecimientoIA = require('../../src/servicios/servicioEnriquecimientoIA');
const {
  construirEstadoEnriquecimiento,
  transmitirEstadoEnriquecimiento,
} = require('../../src/controladores/controladorImportacion');

describe('controladorImportacion estado enriquecimiento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    servicioEnriquecimientoIA.obtenerEstadoMemoria.mockReturnValue({
      en_proceso: true,
      pendientes_en_memoria: 2,
      ultima_actualizacion: '2026-05-28T10:00:00.000Z',
    });
    ejecutarQuery.mockResolvedValue({
      rows: [
        { estado_enriquecimiento: 'pendiente', total: '7' },
        { estado_enriquecimiento: 'ia_completado', total: '11' },
        { estado_enriquecimiento: 'ia_fallido', total: '3' },
      ],
    });
  });

  test('construye estado combinando memoria y conteos BD', async () => {
    const estado = await construirEstadoEnriquecimiento();

    expect(estado).toEqual({
      en_proceso: true,
      pendientes: 7,
      pendientes_en_memoria: 2,
      completados: 11,
      fallidos: 3,
      ultima_actualizacion: '2026-05-28T10:00:00.000Z',
    });
  });

  test('stream SSE envía evento inicial y limpia intervalos al cerrar', async () => {
    jest.useFakeTimers();
    const listeners = {};
    const req = {
      on: jest.fn((evento, cb) => {
        listeners[evento] = cb;
      }),
    };
    const res = {
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };

    await transmitirEstadoEnriquecimiento(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream; charset=utf-8');
    expect(res.write).toHaveBeenCalledWith('event: estado\n');
    expect(res.write.mock.calls.some(([texto]) => String(texto).includes('"pendientes":7'))).toBe(true);

    listeners.close();
    jest.runOnlyPendingTimers();

    expect(res.end).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
