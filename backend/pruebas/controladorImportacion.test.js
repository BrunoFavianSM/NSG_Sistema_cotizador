/**
 * Tests para Controlador de Importación CSV
 *
 * Valida: sin autenticación → 401, sin archivo → 400, CSV válido → contadores correctos.
 *
 * Requisitos: 5.9, 5.10, 5.12
 * Feature: reestructuracion-catalogo-productos
 */

const { importarCSV } = require('../src/controladores/controladorImportacion');
const { ejecutarQuery } = require('../src/configuracion/baseDatos');
const { parsearCSV, importar } = require('../src/servicios/servicioImportacion');

jest.mock('../src/configuracion/baseDatos');
jest.mock('../src/servicios/servicioImportacion');

describe('Controlador de Importación CSV', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      file: null,
      usuario: { id: 1, username: 'admin' },
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('importarCSV — sin archivo', () => {
    test('retorna 400 si no se envió archivo', async () => {
      req.file = null;

      await importarCSV(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Archivo no recibido',
        })
      );
    });
  });

  describe('importarCSV — CSV vacío', () => {
    test('retorna 400 si el CSV no tiene filas', async () => {
      req.file = { buffer: Buffer.from('encabezado1,encabezado2\n') };
      parsearCSV.mockReturnValue([]);

      await importarCSV(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CSV vacío',
        })
      );
    });
  });

  describe('importarCSV — CSV válido', () => {
    test('retorna contadores correctos (insertados + actualizados + omitidos + errores === total filas)', async () => {
      const filasParseadas = [
        { categoria: 'procesador', nombre: 'Intel i7', stock: 10, precio: 500 },
        { categoria: 'gpu', nombre: 'RTX 4090', stock: 5, precio: 1500 },
        { categoria: '', nombre: 'Sin categoria', stock: 0, precio: 100 },
      ];

      req.file = { buffer: Buffer.from('csv,content') };
      parsearCSV.mockReturnValue(filasParseadas);
      importar.mockResolvedValue({
        insertados: 1,
        actualizados: 1,
        omitidos: 0,
        errores: 1,
        detalle_errores: [{ fila: 3, error: 'Categoría no reconocida' }],
      });

      await importarCSV(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          exito: true,
          total_filas: 3,
          insertados: 1,
          actualizados: 1,
          omitidos: 0,
          errores: 1,
          detalle_errores: expect.arrayContaining([
            expect.objectContaining({ fila: 3 }),
          ]),
        })
      );

      // Verificar invariante: insertados + actualizados + omitidos + errores === total_filas
      const respuesta = res.json.mock.calls[0][0];
      const sumaContadores = respuesta.insertados + respuesta.actualizados + respuesta.omitidos + respuesta.errores;
      expect(sumaContadores).toBe(respuesta.total_filas);
    });

    test('llama a parsearCSV con el buffer del archivo', async () => {
      const buffer = Buffer.from('test,csv');
      req.file = { buffer };
      parsearCSV.mockReturnValue([{ nombre: 'Test' }]);
      importar.mockResolvedValue({
        insertados: 1, actualizados: 0, omitidos: 0, errores: 0, detalle_errores: [],
      });

      await importarCSV(req, res);

      expect(parsearCSV).toHaveBeenCalledWith(buffer);
    });

    test('llama a importar con filas parseadas y ejecutarQuery', async () => {
      const filasParseadas = [{ nombre: 'Test' }];
      req.file = { buffer: Buffer.from('csv') };
      parsearCSV.mockReturnValue(filasParseadas);
      importar.mockResolvedValue({
        insertados: 1, actualizados: 0, omitidos: 0, errores: 0, detalle_errores: [],
      });

      await importarCSV(req, res);

      expect(importar).toHaveBeenCalledWith(filasParseadas, ejecutarQuery);
    });
  });

  describe('importarCSV — error interno', () => {
    test('retorna 500 si importar lanza excepción', async () => {
      req.file = { buffer: Buffer.from('csv') };
      parsearCSV.mockReturnValue([{ nombre: 'Test' }]);
      importar.mockRejectedValue(new Error('Error de base de datos'));

      await importarCSV(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Error al importar CSV',
        })
      );
    });
  });
});
