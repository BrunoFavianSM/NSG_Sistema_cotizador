/**
 * Pruebas Unitarias — orquestadorAgentes
 * Pipeline completo, fallbacks y timeouts.
 */

const {
  ejecutarPipeline,
  generarRespuestaConversacional,
  detectarIntencionDeterministica,
} = require('../../src/asistente/orquestadorAgentes');

// Mock de agentes
jest.mock('../../src/asistente/agenteClasificador', () => ({
  clasificar: jest.fn(),
}));

jest.mock('../../src/asistente/agenteBuscador', () => ({
  buscarProductos: jest.fn(),
}));

jest.mock('../../src/asistente/agenteReranker', () => ({
  rerank: jest.fn(),
  rerankFallback: jest.fn(),
  inferirPerfil: jest.fn(() => 'intermedio'),
}));

const agenteClasificador = require('../../src/asistente/agenteClasificador');
const agenteBuscador = require('../../src/asistente/agenteBuscador');
const agenteReranker = require('../../src/asistente/agenteReranker');

const PRODUCTOS_EJEMPLO = [
  { id: 1, nombre: 'Ryzen 5 7600X', nombre_categoria: 'procesador', precio_usd: 200, socket: 'AM5' },
  { id: 2, nombre: 'B650', nombre_categoria: 'placa_madre', precio_usd: 150, socket: 'AM5' },
  { id: 3, nombre: 'RTX 4060', nombre_categoria: 'gpu', precio_usd: 300 },
  { id: 4, nombre: 'RX 7600', nombre_categoria: 'gpu', precio_usd: 280 },
  { id: 5, nombre: 'Kingston Fury 32GB DDR5', nombre_categoria: 'ram', precio_usd: 90, ram_type: 'DDR5' },
];

const CUESTIONARIO_COMPLETO = {
  uso: 'gaming',
  presupuestoPen: 5000,
  resolucion: '1440p',
  multitarea: false,
  ruido: 'indiferente',
  faltantes: [],
  completo: true,
};

const CUESTIONARIO_INCOMPLETO = {
  uso: 'gaming',
  presupuestoPen: null,
  resolucion: null,
  multitarea: null,
  ruido: null,
  faltantes: ['presupuesto', 'resolucion', 'multitarea', 'ruido'],
  completo: false,
};

const CANDIDATOS_MAP = new Map([
  ['procesador', [{ id: 1, score: 0.9, producto: PRODUCTOS_EJEMPLO[0], texto: 'Ryzen 5' }]],
]);

describe('orquestadorAgentes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ejecutarPipeline', () => {
    test('pipeline completo clasificador → buscador → reranker', async () => {
      agenteClasificador.clasificar.mockResolvedValue({
        uso_principal: 'gaming',
        presupuesto_pen: 5000,
        resolucion: '1440p',
        multitarea_stream: false,
        preferencia_ruido: 'indiferente',
        perfil: 'avanzado',
        confianza: 0.8,
        pregunta_especifica: 'cotizacion',
        tiene_presupuesto_explicito: true,
        productos_mencionados: [],
      });

      agenteBuscador.buscarProductos.mockResolvedValue(CANDIDATOS_MAP);

      agenteReranker.rerank.mockResolvedValue({
        configuracion_propuesta: {
          procesador: { id: 1 },
          placa_madre: { id: 2 },
          ram: [{ id: 20 }],
          almacenamiento: { id: 30 },
          gpu: { id: 40 },
          fuente: { id: 50 },
          case: { id: 60 },
        },
        perfil: 'avanzado',
        confianza: 0.7,
      });

      const result = await ejecutarPipeline({
        mensaje: 'Quiero una PC gaming de S/5000',
        historial: [],
        productos: PRODUCTOS_EJEMPLO,
        tipoCambio: 3.7,
        margen: 15,
        igv: 18,
        contextoConversacion: {},
        cuestionario: CUESTIONARIO_COMPLETO,
        ejecutarQuery: jest.fn(),
      });

      expect(result.respuesta).toBeDefined();
      expect(agenteClasificador.clasificar).toHaveBeenCalled();
      expect(agenteBuscador.buscarProductos).toHaveBeenCalled();
    });

    test('clasificador falla → fallback determinístico', async () => {
      agenteClasificador.clasificar.mockRejectedValue(new Error('Timeout'));

      agenteBuscador.buscarProductos.mockResolvedValue(CANDIDATOS_MAP);
      agenteReranker.rerank.mockResolvedValue({
        configuracion_propuesta: { procesador: { id: 1 } },
        perfil: 'intermedio',
        confianza: 0.5,
      });

      const result = await ejecutarPipeline({
        mensaje: 'Gaming S/4000',
        historial: [],
        productos: PRODUCTOS_EJEMPLO,
        tipoCambio: 3.7,
        margen: 15,
        igv: 18,
        contextoConversacion: {},
        cuestionario: CUESTIONARIO_INCOMPLETO,
        ejecutarQuery: jest.fn(),
      });

      expect(result.respuesta).toBeDefined();
      // El fallback del cuestionario debe haber enriquecido la clasificación
    });

    test('buscador falla → candidatos null, sin config', async () => {
      agenteClasificador.clasificar.mockResolvedValue({
        uso_principal: 'gaming',
        presupuesto_pen: 5000,
        resolucion: null,
        multitarea_stream: null,
        preferencia_ruido: null,
        perfil: null,
        confianza: 0.5,
        pregunta_especifica: 'otro',
        tiene_presupuesto_explicito: true,
        productos_mencionados: [],
      });

      agenteBuscador.buscarProductos.mockRejectedValue(new Error('Embeddings falló'));

      const result = await ejecutarPipeline({
        mensaje: 'Gaming',
        historial: [],
        productos: PRODUCTOS_EJEMPLO,
        tipoCambio: 3.7,
        margen: 15,
        igv: 18,
        contextoConversacion: {},
        cuestionario: CUESTIONARIO_COMPLETO,
        ejecutarQuery: jest.fn(),
      });

      expect(result.respuesta).toBeDefined();
      // No debería haber configuración si el buscador falló
    });
  });

  describe('detección y rutas especializadas', () => {
    test('detecta intenciones principales por texto', () => {
      expect(detectarIntencionDeterministica('¿Es compatible Ryzen 5 7600X con B650?')).toBe('compatibilidad');
      expect(detectarIntencionDeterministica('Compara RTX 4060 vs RX 7600')).toBe('comparacion');
      expect(detectarIntencionDeterministica('¿Cuánta RAM necesito para edición de video?')).toBe('especificacion');
      expect(detectarIntencionDeterministica('Arma una PC para gaming')).toBe('cotizacion');
    });

    test('ruta comparación sin ejecutar buscador ni reranker', async () => {
      agenteClasificador.clasificar.mockResolvedValue({
        uso_principal: null,
        presupuesto_pen: null,
        resolucion: null,
        multitarea_stream: null,
        preferencia_ruido: null,
        perfil: null,
        confianza: 0.9,
        pregunta_especifica: 'comparacion',
        tiene_presupuesto_explicito: false,
        productos_mencionados: [],
      });

      const result = await ejecutarPipeline({
        mensaje: 'Compara RTX 4060 vs RX 7600',
        historial: [],
        productos: PRODUCTOS_EJEMPLO,
        tipoCambio: 3.7,
        margen: 15,
        igv: 18,
        contextoConversacion: {},
        cuestionario: CUESTIONARIO_INCOMPLETO,
        ejecutarQuery: jest.fn(),
      });

      expect(result.respuesta).toContain('RTX 4060');
      expect(result.respuesta).toContain('RX 7600');
      expect(agenteBuscador.buscarProductos).not.toHaveBeenCalled();
      expect(agenteReranker.rerank).not.toHaveBeenCalled();
    });

    test('ruta compatibilidad responde con reglas técnicas del catálogo', async () => {
      agenteClasificador.clasificar.mockResolvedValue({
        uso_principal: null,
        presupuesto_pen: null,
        resolucion: null,
        multitarea_stream: null,
        preferencia_ruido: null,
        perfil: null,
        confianza: 0.9,
        pregunta_especifica: 'compatibilidad',
        tiene_presupuesto_explicito: false,
        productos_mencionados: [],
      });

      const result = await ejecutarPipeline({
        mensaje: '¿Es compatible Ryzen 5 7600X con B650?',
        historial: [],
        productos: PRODUCTOS_EJEMPLO,
        tipoCambio: 3.7,
        margen: 15,
        igv: 18,
        contextoConversacion: {},
        cuestionario: CUESTIONARIO_INCOMPLETO,
        ejecutarQuery: jest.fn(),
      });

      expect(result.respuesta).toContain('compatibles');
      expect(result.respuesta).toContain('Ryzen 5 7600X');
      expect(result.respuesta).toContain('B650');
      expect(agenteBuscador.buscarProductos).not.toHaveBeenCalled();
    });

    test('ruta especificación responde recomendación de RAM', async () => {
      agenteClasificador.clasificar.mockResolvedValue({
        uso_principal: 'edicion_video',
        presupuesto_pen: null,
        resolucion: null,
        multitarea_stream: null,
        preferencia_ruido: null,
        perfil: null,
        confianza: 0.9,
        pregunta_especifica: 'especificacion',
        tiene_presupuesto_explicito: false,
        productos_mencionados: [],
      });

      const result = await ejecutarPipeline({
        mensaje: '¿Cuánta RAM necesito para edición de video?',
        historial: [],
        productos: PRODUCTOS_EJEMPLO,
        tipoCambio: 3.7,
        margen: 15,
        igv: 18,
        contextoConversacion: {},
        cuestionario: CUESTIONARIO_INCOMPLETO,
        ejecutarQuery: jest.fn(),
      });

      expect(result.respuesta).toContain('32 GB');
      expect(result.respuesta).toContain('Kingston Fury 32GB DDR5');
      expect(agenteBuscador.buscarProductos).not.toHaveBeenCalled();
    });
  });

  describe('generarRespuestaConversacional', () => {
    test('sin uso detectado → pregunta uso', () => {
      const clasificacion = { uso_principal: null, presupuesto_pen: null, resolucion: null };
      const result = generarRespuestaConversacional(clasificacion, null, 3.7, 15, 18, false);
      expect(result.respuesta).toContain('uso');
      expect(result.quick_replies).toContain('Gaming');
    });

    test('con uso pero sin presupuesto → pregunta presupuesto', () => {
      const clasificacion = { uso_principal: 'gaming', presupuesto_pen: null, resolucion: null };
      const result = generarRespuestaConversacional(clasificacion, null, 3.7, 15, 18, false);
      expect(result.respuesta).toContain('presupuesto');
      expect(result.quick_replies.length).toBeGreaterThan(0);
    });

    test('con uso y presupuesto pero sin config → no devuelve mensaje de espera como respuesta final', () => {
      const clasificacion = { uso_principal: 'gaming', presupuesto_pen: 5000, resolucion: null };
      const result = generarRespuestaConversacional(clasificacion, null, 3.7, 15, 18, false);
      expect(result.respuesta).not.toContain('Estoy buscando');
      expect(result.respuesta).toContain('no pude armar una configuración confiable');
    });

    test('config parcial → muestra configuración sin pedir Ver mi configuración', () => {
      const clasificacion = { uso_principal: 'gaming', presupuesto_pen: 5000, resolucion: null };
      const config = {
        procesador: { nombre: 'Ryzen 5 7600X', precio_usd: 200 },
        gpu: { nombre: 'RTX 4060', precio_usd: 300 },
        precio_total_pen: 4800,
      };
      const result = generarRespuestaConversacional(clasificacion, config, 3.7, 15, 18, false);
      expect(result.respuesta).toContain('Ryzen 5 7600X');
      expect(result.respuesta).toContain('RTX 4060');
      expect(result.respuesta).not.toContain('¿Quieres que te la muestre?');
      expect(result.quick_replies).toContain('Aplicar al cotizador');
    });

    test('cuestionario completo con config → muestra configuración', () => {
      const clasificacion = { uso_principal: 'gaming', presupuesto_pen: 5000, resolucion: '1440p' };
      const config = {
        procesador: { nombre: 'Ryzen 7 7800X3D', precio_usd: 350 },
        gpu: { nombre: 'RTX 4070 Super', precio_usd: 600 },
        precio_total_pen: 5500,
      };
      const result = generarRespuestaConversacional(clasificacion, config, 3.7, 15, 18, true);
      expect(result.respuesta).toContain('Ryzen 7');
      expect(result.respuesta).toContain('Total');
    });
  });
});
