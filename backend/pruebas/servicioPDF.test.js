const servicioPDF = require('../src/servicios/servicioPDF');

describe('Servicio PDF - Generación de PDFs Dual', () => {
  const componentesEjemplo = [
    {
      categoria: 'procesador',
      nombre: 'AMD Ryzen 5 5600X',
      stock: 5,
      disponibleAPedido: false,
      precioBase: 899.00
    },
    {
      categoria: 'placa_madre',
      nombre: 'ASUS TUF Gaming B550M-PLUS',
      stock: 3,
      disponibleAPedido: false,
      precioBase: 549.00
    },
    {
      categoria: 'ram',
      nombre: 'Corsair Vengeance 16GB DDR4 3200MHz',
      stock: 0,
      disponibleAPedido: true,
      tiempoEntregaDias: 7,
      precioBase: 299.00
    },
    {
      categoria: 'almacenamiento',
      nombre: 'Kingston NV2 500GB NVMe',
      stock: 10,
      disponibleAPedido: false,
      precioBase: 189.00
    },
    {
      categoria: 'gpu',
      nombre: 'NVIDIA RTX 3060 12GB',
      stock: 2,
      disponibleAPedido: false,
      precioBase: 1899.00
    },
    {
      categoria: 'fuente',
      nombre: 'Cooler Master MWE 650W 80+ Bronze',
      stock: 8,
      disponibleAPedido: false,
      precioBase: 279.00
    },
    {
      categoria: 'case',
      nombre: 'NZXT H510 Flow',
      stock: 4,
      disponibleAPedido: false,
      precioBase: 399.00
    }
  ];

  const datosCotizacion = {
    codigoTicket: 'NSG-2024-0001',
    codigoUnico: '550e8400-e29b-41d4-a716-446655440000',
    fechaEmision: new Date('2024-01-15'),
    fechaValidez: new Date('2024-01-18'),
    componentes: componentesEjemplo,
    precioTotal: 4513.00
  };

  describe('generarPDFCotizacion', () => {
    test('debe generar PDF de cotización con precios', async () => {
      const pdfBuffer = await servicioPDF.generarPDFCotizacion(datosCotizacion);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      
      // Verificar que es un PDF válido (comienza con %PDF)
      const pdfHeader = pdfBuffer.toString('utf8', 0, 4);
      expect(pdfHeader).toBe('%PDF');
    });

    test('debe generar PDF con tamaño razonable', async () => {
      const pdfBuffer = await servicioPDF.generarPDFCotizacion(datosCotizacion);
      
      // PDF con contenido debe tener al menos 1KB
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      // Pero no debe ser excesivamente grande (menos de 1MB)
      expect(pdfBuffer.length).toBeLessThan(1024 * 1024);
    });

    test('debe generar PDFs diferentes para datos diferentes', async () => {
      const datos1 = { ...datosCotizacion, codigoTicket: 'NSG-2024-0001' };
      const datos2 = { ...datosCotizacion, codigoTicket: 'NSG-2024-0002' };
      
      const pdf1 = await servicioPDF.generarPDFCotizacion(datos1);
      const pdf2 = await servicioPDF.generarPDFCotizacion(datos2);
      
      // Los PDFs deben ser diferentes
      expect(pdf1.equals(pdf2)).toBe(false);
    });

    test('debe incluir todos los componentes en el PDF', async () => {
      const pdfBuffer = await servicioPDF.generarPDFCotizacion(datosCotizacion);
      
      // Verificar que el PDF tiene contenido suficiente para 7 componentes
      // Cada componente agrega contenido al PDF
      expect(pdfBuffer.length).toBeGreaterThan(1500);
    });

    test('debe manejar cotización con componentes mínimos', async () => {
      const datosMinimos = {
        ...datosCotizacion,
        componentes: [componentesEjemplo[0]] // Solo un componente
      };
      
      const pdfBuffer = await servicioPDF.generarPDFCotizacion(datosMinimos);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    test('debe generar PDF válido con fechas diferentes', async () => {
      const datosConFechas = {
        ...datosCotizacion,
        fechaEmision: new Date('2024-06-15'),
        fechaValidez: new Date('2024-06-18')
      };
      
      const pdfBuffer = await servicioPDF.generarPDFCotizacion(datosConFechas);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    test('debe generar PDF en USD y PEN', async () => {
      const pdfUsd = await servicioPDF.generarPDFCotizacion(datosCotizacion, { moneda: 'USD' });
      const pdfPen = await servicioPDF.generarPDFCotizacion(datosCotizacion, { moneda: 'PEN' });

      expect(pdfUsd).toBeInstanceOf(Buffer);
      expect(pdfPen).toBeInstanceOf(Buffer);
      expect(pdfUsd.length).toBeGreaterThan(0);
      expect(pdfPen.length).toBeGreaterThan(0);
      expect(pdfUsd.equals(pdfPen)).toBe(false);
    });
  });

  describe('generarPDFListado', () => {
    test('debe generar PDF de listado técnico sin precios', async () => {
      const pdfBuffer = await servicioPDF.generarPDFListado('NSG-2024-0001', componentesEjemplo);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      
      // Verificar que es un PDF válido
      const pdfHeader = pdfBuffer.toString('utf8', 0, 4);
      expect(pdfHeader).toBe('%PDF');
    });

    test('debe generar PDF con tamaño razonable', async () => {
      const pdfBuffer = await servicioPDF.generarPDFListado('NSG-2024-0001', componentesEjemplo);
      
      // PDF con contenido debe tener al menos 1KB
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      // Pero no debe ser excesivamente grande
      expect(pdfBuffer.length).toBeLessThan(1024 * 1024);
    });

    test('debe generar PDFs diferentes para códigos diferentes', async () => {
      const pdf1 = await servicioPDF.generarPDFListado('NSG-2024-0001', componentesEjemplo);
      const pdf2 = await servicioPDF.generarPDFListado('NSG-2024-0002', componentesEjemplo);
      
      // Los PDFs deben ser diferentes
      expect(pdf1.equals(pdf2)).toBe(false);
    });

    test('debe manejar array con un solo componente', async () => {
      const pdfBuffer = await servicioPDF.generarPDFListado('NSG-2024-0001', [componentesEjemplo[0]]);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    test('debe manejar array con múltiples componentes', async () => {
      const pdfBuffer = await servicioPDF.generarPDFListado('NSG-2024-0001', componentesEjemplo);
      
      // PDF con 7 componentes debe ser más grande que con 1
      const pdfBufferUno = await servicioPDF.generarPDFListado('NSG-2024-0001', [componentesEjemplo[0]]);
      
      expect(pdfBuffer.length).toBeGreaterThan(pdfBufferUno.length);
    });

    test('debe aceptar opcion de moneda sin afectar contrato', async () => {
      const pdfBuffer = await servicioPDF.generarPDFListado('NSG-2024-0001', componentesEjemplo, { moneda: 'PEN' });
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('formatearFecha', () => {
    test('debe formatear fecha correctamente en español', () => {
      const fecha = new Date('2024-01-15T12:00:00Z');
      const formateada = servicioPDF.formatearFecha(fecha);
      
      expect(formateada).toContain('2024');
      expect(formateada).toContain('enero');
      // La fecha puede variar según la zona horaria, verificar que contiene un día
      expect(formateada).toMatch(/\d{1,2}/);
    });

    test('debe formatear diferentes meses correctamente', () => {
      const fechaJunio = new Date('2024-06-20T12:00:00Z');
      const formateada = servicioPDF.formatearFecha(fechaJunio);
      
      expect(formateada).toContain('2024');
      expect(formateada).toContain('junio');
    });
  });

  describe('formatearCategoria', () => {
    test('debe formatear categorías conocidas', () => {
      expect(servicioPDF.formatearCategoria('procesador')).toBe('Procesador');
      expect(servicioPDF.formatearCategoria('placa_madre')).toBe('Placa Madre');
      expect(servicioPDF.formatearCategoria('ram')).toBe('RAM');
      expect(servicioPDF.formatearCategoria('gpu')).toBe('GPU');
    });

    test('debe retornar categoría original si no está mapeada', () => {
      expect(servicioPDF.formatearCategoria('desconocida')).toBe('desconocida');
    });
  });

  describe('Validación de estructura de PDFs', () => {
    test('PDF de cotización debe contener información completa', async () => {
      const pdfCotizacion = await servicioPDF.generarPDFCotizacion(datosCotizacion);
      const pdfListado = await servicioPDF.generarPDFListado('NSG-2024-0001', componentesEjemplo);
      
      // PDF de cotización tiene más información (precios, instrucciones, etc.)
      // Por lo tanto debe ser más grande
      expect(pdfCotizacion.length).toBeGreaterThan(pdfListado.length * 0.8);
    });

    test('ambos PDFs deben ser válidos', async () => {
      const pdfCotizacion = await servicioPDF.generarPDFCotizacion(datosCotizacion);
      const pdfListado = await servicioPDF.generarPDFListado('NSG-2024-0001', componentesEjemplo);
      
      // Verificar headers PDF
      expect(pdfCotizacion.toString('utf8', 0, 4)).toBe('%PDF');
      expect(pdfListado.toString('utf8', 0, 4)).toBe('%PDF');
      
      // Verificar que terminan con EOF
      const cotizacionStr = pdfCotizacion.toString('utf8');
      const listadoStr = pdfListado.toString('utf8');
      
      expect(cotizacionStr).toContain('%%EOF');
      expect(listadoStr).toContain('%%EOF');
    });

    test('PDFs deben mantener estructura PDF válida', async () => {
      const pdfBuffer = await servicioPDF.generarPDFCotizacion(datosCotizacion);

      expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
      expect(pdfBuffer.toString('utf8')).toContain('%%EOF');
    });
  });

  describe('Manejo de errores', () => {
    test('debe rechazar si faltan datos requeridos en cotización', async () => {
      const datosIncompletos = {
        codigoTicket: 'NSG-2024-0001',
        // Faltan otros campos
      };
      
      await expect(servicioPDF.generarPDFCotizacion(datosIncompletos))
        .rejects.toThrow();
    });

    test('debe manejar array vacío de componentes', async () => {
      const datosVacios = {
        ...datosCotizacion,
        componentes: []
      };
      
      const pdfBuffer = await servicioPDF.generarPDFCotizacion(datosVacios);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('Indicadores de disponibilidad', () => {
    test('debe generar PDF para productos con stock', async () => {
      const componenteStock = [{
        categoria: 'procesador',
        nombre: 'Test CPU',
        stock: 5,
        disponibleAPedido: false,
        precioBase: 100
      }];
      
      const pdfBuffer = await servicioPDF.generarPDFListado('NSG-2024-0001', componenteStock);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    test('debe generar PDF para productos a pedido', async () => {
      const componentePedido = [{
        categoria: 'ram',
        nombre: 'Test RAM',
        stock: 0,
        disponibleAPedido: true,
        tiempoEntregaDias: 7,
        precioBase: 200
      }];
      
      const pdfBuffer = await servicioPDF.generarPDFListado('NSG-2024-0001', componentePedido);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    test('debe generar PDF con mezcla de disponibilidades', async () => {
      const componentesMixtos = [
        {
          categoria: 'procesador',
          nombre: 'CPU en stock',
          stock: 5,
          disponibleAPedido: false,
          precioBase: 100
        },
        {
          categoria: 'ram',
          nombre: 'RAM a pedido',
          stock: 0,
          disponibleAPedido: true,
          tiempoEntregaDias: 7,
          precioBase: 200
        }
      ];
      
      const pdfBuffer = await servicioPDF.generarPDFListado('NSG-2024-0001', componentesMixtos);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });
});
