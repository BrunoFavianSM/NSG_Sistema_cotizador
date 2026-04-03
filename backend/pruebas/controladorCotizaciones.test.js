/**
 * Tests para Controlador de Cotizaciones
 * 
 * Valida operaciones de cotizaciones, validación y manejo de errores
 * 
 * Requisitos: 9.3, 9.4, 9.5
 */

const {
  consultarCotizacion,
  validarCotizacion,
  marcarComoReclamada
} = require('../src/controladores/controladorCotizaciones');
const { ejecutarQuery } = require('../src/configuracion/baseDatos');

// Mock de la base de datos
jest.mock('../src/configuracion/baseDatos');

describe('Controlador de Cotizaciones', () => {
  let req, res;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request y response
    req = {
      query: {},
      params: {},
      body: {},
      usuario: { id: 1, username: 'admin', nombre: 'Admin Test' }
    };
    
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
  });
  
  describe('consultarCotizacion', () => {
    test('debe retornar error para código inválido', async () => {
      req.params.codigoTicket = 'INVALIDO';
      
      await consultarCotizacion(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Código inválido',
        mensaje: expect.any(String)
      });
    });
    
    test('debe retornar 404 si la cotización no existe (Requisito 9.3)', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await consultarCotizacion(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cotización no encontrada',
        mensaje: 'No existe una cotización con ese código'
      });
    });
    
    test('debe detectar cotización caducada (Requisito 9.4)', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      
      // Fecha de validez en el pasado
      const fechaPasada = new Date();
      fechaPasada.setDate(fechaPasada.getDate() - 5);
      
      ejecutarQuery
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            codigo_unico: 'uuid-123',
            codigo_ticket: 'NSG-2024-0001',
            id_cliente: null,
            fecha_emision: new Date(),
            fecha_validez: fechaPasada,
            precio_total: 5000.00,
            margen_aplicado: 20,
            estado: 'Pendiente',
            fecha_reclamacion: null
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              id_producto: 1,
              nombre_producto: 'Intel i7',
              categoria: 'procesador',
              descripcion_tecnica: 'Procesador Intel',
              precio_unitario: 450.00,
              cantidad: 1,
              disponible_stock: true
            }
          ]
        });
      
      await consultarCotizacion(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        cotizacion: expect.objectContaining({
          estado: 'Caducada',
          caducada: true
        })
      });
    });
    
    test('debe retornar cotización válida con componentes', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      
      // Fecha de validez en el futuro
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 2);
      
      ejecutarQuery
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            codigo_unico: 'uuid-123',
            codigo_ticket: 'NSG-2024-0001',
            id_cliente: null,
            fecha_emision: new Date(),
            fecha_validez: fechaFutura,
            precio_total: 5000.00,
            margen_aplicado: 20,
            estado: 'Pendiente',
            fecha_reclamacion: null
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              id_producto: 1,
              nombre_producto: 'Intel i7',
              categoria: 'procesador',
              descripcion_tecnica: 'Procesador Intel',
              precio_unitario: 450.00,
              cantidad: 1,
              disponible_stock: true
            }
          ]
        });
      
      await consultarCotizacion(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        cotizacion: expect.objectContaining({
          codigo_ticket: 'NSG-2024-0001',
          estado: 'Pendiente',
          caducada: false,
          componentes: expect.arrayContaining([
            expect.objectContaining({
              nombre: 'Intel i7',
              categoria: 'procesador'
            })
          ])
        })
      });
    });
  });
  
  describe('validarCotizacion', () => {
    test('debe retornar error para código inválido (Requisito 9.3)', async () => {
      req.params.codigoTicket = 'CODIGO-INVALIDO';
      
      await validarCotizacion(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Código inválido',
        mensaje: expect.any(String)
      });
    });
    
    test('debe retornar 404 si la cotización no existe (Requisito 9.3)', async () => {
      req.params.codigoTicket = 'NSG-2024-9999';
      
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await validarCotizacion(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cotización no encontrada',
        mensaje: 'No existe una cotización con ese código',
        valida: false
      });
    });
    
    test('debe detectar cotización caducada (Requisito 9.4)', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      
      // Fecha de validez en el pasado
      const fechaPasada = new Date();
      fechaPasada.setDate(fechaPasada.getDate() - 5);
      
      ejecutarQuery.mockResolvedValue({
        rows: [{
          id: 1,
          codigo_ticket: 'NSG-2024-0001',
          fecha_emision: new Date(),
          fecha_validez: fechaPasada,
          precio_total: 5000.00,
          margen_aplicado: 20,
          estado: 'Pendiente'
        }]
      });
      
      await validarCotizacion(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        valida: false,
        mensaje: 'Cotización caducada',
        cotizacion: expect.objectContaining({
          codigo_ticket: 'NSG-2024-0001',
          estado: 'Caducada'
        })
      });
    });
    
    test('debe comparar precios correctamente (Requisito 9.5)', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      
      // Fecha de validez en el futuro
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 2);
      
      ejecutarQuery
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            codigo_ticket: 'NSG-2024-0001',
            fecha_emision: new Date(),
            fecha_validez: fechaFutura,
            precio_total: 5400.00, // 450 * 1.2 (margen 20%)
            margen_aplicado: 20,
            estado: 'Pendiente'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              id_producto: 1,
              nombre_producto: 'Intel i7',
              categoria: 'procesador',
              precio_historico: 450.00,
              cantidad: 1,
              stock_historico: true,
              precio_actual: 500.00, // Precio aumentó
              stock_actual: 5,
              disponible_a_pedido: false
            }
          ]
        });
      
      await validarCotizacion(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        valida: true,
        cotizacion: expect.objectContaining({
          codigo_ticket: 'NSG-2024-0001',
          precio_total_historico: 5400.00,
          precio_total_actual: 600.00, // 500 * 1.2
          diferencia_total: expect.any(Number),
          hay_cambios_precio: true,
          componentes: expect.arrayContaining([
            expect.objectContaining({
              nombre: 'Intel i7',
              precio_historico: 450.00,
              precio_actual: 500.00,
              diferencia_unitaria: 50.00
            })
          ])
        })
      });
    });
    
    test('debe indicar cuando no hay cambios de precio (Requisito 9.5)', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      
      // Fecha de validez en el futuro
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 2);
      
      ejecutarQuery
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            codigo_ticket: 'NSG-2024-0001',
            fecha_emision: new Date(),
            fecha_validez: fechaFutura,
            precio_total: 540.00, // 450 * 1.2 (margen 20%)
            margen_aplicado: 20,
            estado: 'Pendiente'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              id_producto: 1,
              nombre_producto: 'Intel i7',
              categoria: 'procesador',
              precio_historico: 450.00,
              cantidad: 1,
              stock_historico: true,
              precio_actual: 450.00, // Precio sin cambios
              stock_actual: 5,
              disponible_a_pedido: false
            }
          ]
        });
      
      await validarCotizacion(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        valida: true,
        cotizacion: expect.objectContaining({
          hay_cambios_precio: false,
          precio_total_historico: 540.00,
          precio_total_actual: 540.00
        })
      });
    });
    
    test('debe manejar productos sin precio actual', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 2);
      
      ejecutarQuery
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            codigo_ticket: 'NSG-2024-0001',
            fecha_emision: new Date(),
            fecha_validez: fechaFutura,
            precio_total: 5400.00,
            margen_aplicado: 20,
            estado: 'Pendiente'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              id_producto: 1,
              nombre_producto: 'Intel i7',
              categoria: 'procesador',
              precio_historico: 450.00,
              cantidad: 1,
              stock_historico: true,
              precio_actual: null, // Producto eliminado o sin precio
              stock_actual: 0,
              disponible_a_pedido: false
            }
          ]
        });
      
      await validarCotizacion(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        valida: true,
        cotizacion: expect.objectContaining({
          componentes: expect.arrayContaining([
            expect.objectContaining({
              precio_actual: 450.00, // Usa precio histórico como fallback
              diferencia_unitaria: 0
            })
          ])
        })
      });
    });
  });
  
  describe('marcarComoReclamada', () => {
    test('debe rechazar código inválido', async () => {
      req.params.codigoTicket = 'INVALIDO';
      req.body = {};
      
      await marcarComoReclamada(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Código inválido',
        mensaje: expect.any(String)
      });
    });
    
    test('debe retornar 404 si la cotización no existe', async () => {
      req.params.codigoTicket = 'NSG-2024-9999';
      req.body = {};
      
      ejecutarQuery.mockResolvedValue({ rows: [] });
      
      await marcarComoReclamada(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cotización no encontrada',
        mensaje: 'No existe una cotización con ese código'
      });
    });
    
    test('debe rechazar si la cotización no está en estado Pendiente', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      req.body = {};
      
      ejecutarQuery.mockResolvedValue({
        rows: [{
          id: 1,
          estado: 'Reclamada',
          fecha_validez: new Date()
        }]
      });
      
      await marcarComoReclamada(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Estado inválido',
        mensaje: 'La cotización ya está en estado: Reclamada'
      });
    });
    
    test('debe marcar cotización como reclamada exitosamente', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      req.body = {
        id_vendedor: 1,
        notas_vendedor: 'Cliente confirmó compra'
      };
      
      ejecutarQuery
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            estado: 'Pendiente',
            fecha_validez: new Date()
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            codigo_ticket: 'NSG-2024-0001',
            estado: 'Reclamada',
            fecha_reclamacion: new Date()
          }]
        });
      
      await marcarComoReclamada(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        mensaje: 'Cotización marcada como reclamada',
        cotizacion: expect.objectContaining({
          codigo_ticket: 'NSG-2024-0001',
          estado: 'Reclamada',
          fecha_reclamacion: expect.any(Date)
        })
      });
    });
  });
  
  describe('Manejo de errores', () => {
    test('debe manejar errores de base de datos en consultarCotizacion', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      
      ejecutarQuery.mockRejectedValue(new Error('Error de conexión'));
      
      await consultarCotizacion(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al consultar cotización',
        mensaje: 'No se pudo recuperar la cotización'
      });
    });
    
    test('debe manejar errores de base de datos en validarCotizacion', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      
      ejecutarQuery.mockRejectedValue(new Error('Error de conexión'));
      
      await validarCotizacion(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al validar cotización',
        mensaje: 'No se pudo validar la cotización'
      });
    });
    
    test('debe manejar errores de base de datos en marcarComoReclamada', async () => {
      req.params.codigoTicket = 'NSG-2024-0001';
      req.body = {};
      
      ejecutarQuery.mockRejectedValue(new Error('Error de conexión'));
      
      await marcarComoReclamada(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar cotización',
        mensaje: 'No se pudo marcar la cotización como reclamada'
      });
    });
  });
});
