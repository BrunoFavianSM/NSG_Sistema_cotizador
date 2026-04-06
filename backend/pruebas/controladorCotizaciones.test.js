/**
 * Tests para Controlador de Cotizaciones
 */

const {
  consultarCotizacion,
  validarCotizacion,
  marcarComoReclamada
} = require('../src/controladores/controladorCotizaciones');
const { ejecutarQuery } = require('../src/configuracion/baseDatos');

jest.mock('../src/configuracion/baseDatos');

describe('Controlador de Cotizaciones', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, body: {}, usuario: { id: 1 } };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('consultarCotizacion', () => {
    test('retorna 400 para codigo invalido', async () => {
      req.params.codigoTicket = 'INVALIDO';
      await consultarCotizacion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Codigo invalido',
        codigo: 'CODIGO_INVALIDO'
      }));
    });

    test('retorna 404 cuando no existe', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      ejecutarQuery.mockResolvedValueOnce({ rows: [] });

      await consultarCotizacion(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        codigo: 'COTIZACION_NO_ENCONTRADA'
      }));
    });

    test('retorna 410 cuando esta caducada', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      const fechaPasada = new Date();
      fechaPasada.setDate(fechaPasada.getDate() - 5);

      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{
          id: 1,
          codigo_unico: 'uuid-123',
          codigo_ticket: 'NSG-2024-0001',
          fecha_emision: new Date(),
          fecha_validez: fechaPasada,
          precio_total: 5000.00,
          margen_aplicado: 20,
          estado: 'Pendiente',
          fecha_reclamacion: null,
          cliente_correo: null
        }] })
        .mockResolvedValueOnce({ rows: [] });

      await consultarCotizacion(req, res);

      expect(res.status).toHaveBeenCalledWith(410);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        codigo: 'COTIZACION_CADUCADA'
      }));
    });
  });

  describe('validarCotizacion', () => {
    test('retorna 404 si no existe', async () => {
      req.params.codigoTicket = 'NSG-2024-9999';
      ejecutarQuery.mockResolvedValueOnce({ rows: [] });

      await validarCotizacion(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        valida: false,
        codigo: 'COTIZACION_NO_ENCONTRADA'
      }));
    });

    test('retorna comparacion de precios', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 2);

      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{
          id: 1,
          codigo_ticket: 'NSG-2024-0001',
          fecha_emision: new Date(),
          fecha_validez: fechaFutura,
          precio_total: 540.00,
          margen_aplicado: 20,
          estado: 'Pendiente'
        }] })
        .mockResolvedValueOnce({ rows: [{
          id_producto: 1,
          nombre_producto: 'Intel i7',
          categoria: 'procesador',
          precio_historico: 450,
          cantidad: 1,
          stock_historico: true,
          precio_actual: 500,
          stock_actual: 5,
          disponible_a_pedido: false
        }] });

      await validarCotizacion(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        exito: true,
        valida: true,
        cotizacion: expect.objectContaining({
          codigo_ticket: 'NSG-2024-0001',
          componentes: expect.any(Array)
        })
      }));
    });
  });

  describe('marcarComoReclamada', () => {
    test('normaliza estado final a Completada', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      req.body = {};

      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, estado: 'Pendiente', fecha_validez: new Date() }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, codigo_ticket: 'NSG-2024-0001', estado: 'Completada', fecha_reclamacion: new Date() }] });

      await marcarComoReclamada(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        exito: true,
        cotizacion: expect.objectContaining({
          estado: 'Completada'
        })
      }));
    });
  });
});

