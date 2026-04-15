/**
 * Tests para Controlador de Cotizaciones
 */

const {
  crearCotizacion,
  consultarCotizacion,
  validarCotizacion,
  marcarComoReclamada,
  obtenerPdfCotizacion,
  obtenerPdfTecnico
} = require('../src/controladores/controladorCotizaciones');
const { ejecutarQuery, ejecutarTransaccion } = require('../src/configuracion/baseDatos');
const servicioPDF = require('../src/servicios/servicioPDF');

jest.mock('../src/configuracion/baseDatos');
jest.mock('../src/servicios/servicioPDF', () => ({
  generarPDFCotizacion: jest.fn(),
  generarPDFListado: jest.fn()
}));

describe('Controlador de Cotizaciones', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: {}, body: {}, usuario: { id: 1 } };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn()
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

  describe('crearCotizacion', () => {
    test('retorna 400 si cliente publico no envia nombre/correo', async () => {
      req = {
        params: {},
        body: {
          componentes: [{ id_producto: 1, cantidad: 1 }]
        },
        headers: {}
      };

      await crearCotizacion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Datos de cliente inválidos'
      }));
    });

    test('permite crear cotizacion en contexto admin sin datos de cliente', async () => {
      req.body = {
        componentes: [{ id_producto: 1, cantidad: 1, tabla_producto: 'productos_procesador' }]
      };

      ejecutarQuery.mockResolvedValueOnce({ rows: [{ valor: '20' }] });
      ejecutarTransaccion.mockResolvedValueOnce({
        cotizacion: {
          id: 1,
          codigo_unico: 'uuid-123',
          codigo_ticket: 'NSG-2026-0001',
          fecha_emision: new Date(),
          fecha_validez: new Date(),
          precio_total: 1200,
          margen_aplicado: 20,
          estado: 'Pendiente'
        },
        detalles: []
      });

      await crearCotizacion(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        exito: true,
        cotizacion: expect.objectContaining({
          codigo_ticket: 'NSG-2026-0001'
        })
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

  describe('obtenerPdfCotizacion', () => {
    test('acepta query moneda y responde pdf', async () => {
      req.params.codigoTicket = 'NSG-2026-0001';
      req.query = { moneda: 'PEN' };
      servicioPDF.generarPDFCotizacion.mockResolvedValue(Buffer.from('%PDF-1.4'));

      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{
          id: 1,
          codigo_unico: 'uuid-123',
          codigo_ticket: 'NSG-2026-0001',
          fecha_emision: new Date(),
          fecha_validez: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          precio_total: 1200,
          margen_aplicado: 20,
          estado: 'Pendiente',
          cliente_correo: null,
          tipo_cambio_referencia: 3.8,
          total_con_igv: 1200,
          total_con_igv_pen: 4560
        }] })
        .mockResolvedValueOnce({ rows: [{
          id: 1,
          id_producto: 1,
          nombre_producto: 'Producto',
          categoria: 'procesador',
          precio_unitario: 100,
          cantidad: 1,
          disponible_stock: true,
          precio_unitario_total_usd: 120
        }] });

      await obtenerPdfCotizacion(req, res);

      expect(servicioPDF.generarPDFCotizacion).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ moneda: 'PEN' })
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('obtenerPdfTecnico', () => {
    test('usa moneda por defecto USD cuando query invalida', async () => {
      req.params.codigoTicket = 'NSG-2026-0002';
      req.query = { moneda: 'EUR' };
      servicioPDF.generarPDFListado.mockResolvedValue(Buffer.from('%PDF-1.4'));

      ejecutarQuery
        .mockResolvedValueOnce({ rows: [{
          id: 2,
          codigo_unico: 'uuid-456',
          codigo_ticket: 'NSG-2026-0002',
          fecha_emision: new Date(),
          fecha_validez: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          precio_total: 1500,
          margen_aplicado: 20,
          estado: 'Pendiente',
          cliente_correo: null,
          tipo_cambio_referencia: 3.75,
          total_con_igv: 1500,
          total_con_igv_pen: 5625
        }] })
        .mockResolvedValueOnce({ rows: [{
          id: 1,
          id_producto: 2,
          nombre_producto: 'Producto 2',
          categoria: 'gpu',
          precio_unitario: 200,
          cantidad: 1,
          disponible_stock: false,
          precio_unitario_total_usd: 250
        }] });

      await obtenerPdfTecnico(req, res);

      expect(servicioPDF.generarPDFListado).toHaveBeenCalledWith(
        'NSG-2026-0002',
        expect.any(Array),
        expect.objectContaining({ moneda: 'USD' })
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.send).toHaveBeenCalled();
    });
  });
});

