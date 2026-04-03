/**
 * Pruebas de Integración - Rutas de Compatibilidad
 * Tarea 8.5
 */

const request = require('supertest');
const express = require('express');
const rutasCompatibilidad = require('../src/rutas/compatibilidad');

const app = express();
app.use(express.json());
app.use('/api/compatibilidad', rutasCompatibilidad);

describe('Integración - Rutas de Compatibilidad', () => {
  describe('POST /api/compatibilidad/validar', () => {
    test('Debe validar configuración compatible correctamente', async () => {
      const componentes = {
        procesador: { socket: 'AM5', tdp: 65 },
        placa_madre: { socket: 'AM5', ram_type: 'DDR5', form_factor: 'ATX' },
        ram: [{ ram_type: 'DDR5' }],
        fuente: { wattage: 600 }
      };

      const response = await request(app)
        .post('/api/compatibilidad/validar')
        .send({ componentes });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('compatible');
      expect(response.body).toHaveProperty('errores');
      expect(response.body).toHaveProperty('advertencias');
      expect(response.body.compatible).toBe(true);
      expect(response.body.errores).toHaveLength(0);
    });

    test('Debe detectar incompatibilidad de socket', async () => {
      const componentes = {
        procesador: { socket: 'AM5', tdp: 65 },
        placa_madre: { socket: 'LGA1700', ram_type: 'DDR5', form_factor: 'ATX' }
      };

      const response = await request(app)
        .post('/api/compatibilidad/validar')
        .send({ componentes });

      expect(response.status).toBe(200);
      expect(response.body.compatible).toBe(false);
      expect(response.body.errores.length).toBeGreaterThan(0);
      expect(response.body.errores[0]).toContain('Socket incompatible');
    });

    test('Debe retornar error 400 si no se envía componentes', async () => {
      const response = await request(app)
        .post('/api/compatibilidad/validar')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('Debe retornar error 400 si componentes no es un objeto', async () => {
      const response = await request(app)
        .post('/api/compatibilidad/validar')
        .send({ componentes: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('Debe incluir advertencias para componentes a pedido', async () => {
      const componentes = {
        procesador: { 
          socket: 'AM5', 
          tdp: 65, 
          stock: 0, 
          disponible_a_pedido: true,
          tiempo_entrega_dias: 7
        },
        placa_madre: { socket: 'AM5', ram_type: 'DDR5', form_factor: 'ATX' },
        ram: [{ ram_type: 'DDR5' }],
        fuente: { wattage: 600 }
      };

      const response = await request(app)
        .post('/api/compatibilidad/validar')
        .send({ componentes });

      expect(response.status).toBe(200);
      expect(response.body.compatible).toBe(true);
      expect(response.body.advertencias.length).toBeGreaterThan(0);
      expect(response.body.advertencias[0]).toContain('a pedido');
    });
  });
});
