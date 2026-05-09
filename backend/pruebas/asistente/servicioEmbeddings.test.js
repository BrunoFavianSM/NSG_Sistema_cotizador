/**
 * Pruebas Unitarias — servicioEmbeddings
 * Similaridad coseno, construcción de textos, timeout en fetch.
 */

const {
  similitudCoseno,
  construirTextoProducto,
  construirTextoQuery,
} = require('../../src/asistente/servicioEmbeddings');

describe('servicioEmbeddings', () => {
  describe('similitudCoseno', () => {
    test('vectores idénticos = 1.0', () => {
      const a = [1, 0, 0];
      const b = [1, 0, 0];
      expect(similitudCoseno(a, b)).toBeCloseTo(1.0);
    });

    test('vectores ortogonales = 0.0', () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      expect(similitudCoseno(a, b)).toBeCloseTo(0.0);
    });

    test('vectores opuestos = -1.0', () => {
      const a = [1, 0, 0];
      const b = [-1, 0, 0];
      expect(similitudCoseno(a, b)).toBeCloseTo(-1.0);
    });

    test('retorna 0 si algún vector es null', () => {
      expect(similitudCoseno(null, [1, 0])).toBe(0);
      expect(similitudCoseno([1, 0], null)).toBe(0);
    });

    test('retorna 0 si longitudes difieren', () => {
      expect(similitudCoseno([1, 0], [1, 0, 0])).toBe(0);
    });

    test('retorna 0 si vector es cero', () => {
      expect(similitudCoseno([0, 0, 0], [1, 0, 0])).toBe(0);
    });
  });

  describe('construirTextoProducto', () => {
    test('construye texto con nombre y categoría', () => {
      const producto = { nombre: 'Ryzen 7 7800X3D', nombre_categoria: 'procesador' };
      const texto = construirTextoProducto(producto);
      expect(texto).toContain('Ryzen 7 7800X3D');
      expect(texto).toContain('procesador');
    });

    test('incluye specs disponibles', () => {
      const producto = {
        nombre: 'RTX 4070',
        nombre_categoria: 'gpu',
        vram_gb: 12,
        tdp_w: 200,
      };
      const texto = construirTextoProducto(producto);
      expect(texto).toContain('12GB VRAM');
      expect(texto).toContain('200W TDP');
    });

    test('no incluye specs que no existen', () => {
      const producto = { nombre: 'SSD 1TB', nombre_categoria: 'almacenamiento' };
      const texto = construirTextoProducto(producto);
      expect(texto).not.toContain('VRAM');
      expect(texto).not.toContain('nucleos');
    });
  });

  describe('construirTextoQuery', () => {
    test('construye query con uso y presupuesto', () => {
      const clasificacion = { uso_principal: 'gaming', presupuesto_pen: 5000 };
      const texto = construirTextoQuery(clasificacion);
      expect(texto).toContain('gaming');
      expect(texto).toContain('S/5000');
    });

    test('construye query con resolución', () => {
      const clasificacion = { uso_principal: 'gaming', resolucion: '1440p' };
      const texto = construirTextoQuery(clasificacion);
      expect(texto).toContain('1440p');
    });

    test('default si no hay datos', () => {
      const texto = construirTextoQuery({});
      expect(texto).toBe('PC de escritorio');
    });
  });
});
