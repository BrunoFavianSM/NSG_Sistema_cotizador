/**
 * Pruebas Unitarias — agenteClasificador
 * Normalización de clasificación y fetch con timeout.
 */

const {
  normalizarClasificacion,
  construirPromptClasificador,
} = require('../../src/asistente/agenteClasificador');

describe('agenteClasificador', () => {
  describe('normalizarClasificacion', () => {
    test('normaliza clasificación completa y válida', () => {
      const json = {
        uso_principal: 'gaming',
        presupuesto_pen: 5000,
        resolucion: '1440p',
        multitarea_stream: true,
        preferencia_ruido: 'silenciosa',
        perfil: 'avanzado',
        tiene_presupuesto_explicito: true,
        pregunta_especifica: 'cotizar',
        confianza: 0.8,
        productos_mencionados: ['RTX 4070'],
      };
      const result = normalizarClasificacion(json);
      expect(result.uso_principal).toBe('gaming');
      expect(result.presupuesto_pen).toBe(5000);
      expect(result.resolucion).toBe('1440p');
      expect(result.multitarea_stream).toBe(true);
      expect(result.preferencia_ruido).toBe('silenciosa');
      expect(result.perfil).toBe('avanzado');
      expect(result.pregunta_especifica).toBe('cotizacion');
      expect(result.confianza).toBe(0.8);
      expect(result.productos_mencionados).toEqual(['RTX 4070']);
    });

    test('acepta nuevas intenciones especializadas', () => {
      expect(normalizarClasificacion({ pregunta_especifica: 'compatibilidad' }).pregunta_especifica).toBe('compatibilidad');
      expect(normalizarClasificacion({ pregunta_especifica: 'comparacion' }).pregunta_especifica).toBe('comparacion');
      expect(normalizarClasificacion({ pregunta_especifica: 'especificacion' }).pregunta_especifica).toBe('especificacion');
      expect(normalizarClasificacion({ pregunta_especifica: 'recomendacion' }).pregunta_especifica).toBe('recomendacion');
    });

    test('normaliza aliases legacy de cotización y recomendación', () => {
      expect(normalizarClasificacion({ pregunta_especifica: 'cotizar' }).pregunta_especifica).toBe('cotizacion');
      expect(normalizarClasificacion({ pregunta_especifica: 'recomendar' }).pregunta_especifica).toBe('recomendacion');
    });

    test('normaliza uso_principal inválido a null', () => {
      const result = normalizarClasificacion({ uso_principal: 'invalido' });
      expect(result.uso_principal).toBeNull();
    });

    test('normaliza perfil inválido a null', () => {
      const result = normalizarClasificacion({ perfil: 'pro' });
      expect(result.perfil).toBeNull();
    });

    test('normaliza presupuesto fuera de rango a null', () => {
      expect(normalizarClasificacion({ presupuesto_pen: 50 }).presupuesto_pen).toBeNull();
      expect(normalizarClasificacion({ presupuesto_pen: 60000 }).presupuesto_pen).toBeNull();
    });

    test('normaliza presupuesto string a null', () => {
      expect(normalizarClasificacion({ presupuesto_pen: 'cinco mil' }).presupuesto_pen).toBeNull();
    });

    test('normaliza multitarea_stream string "true"', () => {
      const result = normalizarClasificacion({ multitarea_stream: 'true' });
      expect(result.multitarea_stream).toBe(true);
    });

    test('normaliza multitarea_stream string "false"', () => {
      const result = normalizarClasificacion({ multitarea_stream: 'false' });
      expect(result.multitarea_stream).toBe(false);
    });

    test('normaliza confianza fuera de rango — clamp a [0, 1]', () => {
      expect(normalizarClasificacion({ confianza: 1.5 }).confianza).toBe(1);
      expect(normalizarClasificacion({ confianza: -0.5 }).confianza).toBe(0);
    });

    test('normaliza confianza no-numérico a 0.5', () => {
      expect(normalizarClasificacion({ confianza: 'alta' }).confianza).toBe(0.5);
    });

    test('filtra productos_mencionados no-string', () => {
      const result = normalizarClasificacion({ productos_mencionados: ['RTX 4070', 123, null] });
      expect(result.productos_mencionados).toEqual(['RTX 4070']);
    });

    test('normaliza resolucion inválida a null', () => {
      const result = normalizarClasificacion({ resolucion: '720p' });
      expect(result.resolucion).toBeNull();
    });

    test('clasificación vacía devuelve defaults', () => {
      const result = normalizarClasificacion({});
      expect(result.uso_principal).toBeNull();
      expect(result.presupuesto_pen).toBeNull();
      expect(result.resolucion).toBeNull();
      expect(result.multitarea_stream).toBeNull();
      expect(result.preferencia_ruido).toBeNull();
      expect(result.perfil).toBeNull();
      expect(result.tiene_presupuesto_explicito).toBe(false);
      expect(result.pregunta_especifica).toBe('otro');
      expect(result.confianza).toBe(0.5);
      expect(result.productos_mencionados).toEqual([]);
    });
  });

  describe('construirPromptClasificador', () => {
    test('incluye mensaje del usuario', () => {
      const prompt = construirPromptClasificador('Quiero gaming', null);
      expect(prompt).toContain('Quiero gaming');
    });

    test('incluye contexto previo si se proporciona', () => {
      const prompt = construirPromptClasificador('S/5000', 'Usuario: Gaming | Asistente: ¿Presupuesto?');
      expect(prompt).toContain('Contexto previo');
    });

    test('no incluye contexto si es null', () => {
      const prompt = construirPromptClasificador('Gaming', null);
      expect(prompt).not.toContain('Contexto previo');
    });
  });
});
