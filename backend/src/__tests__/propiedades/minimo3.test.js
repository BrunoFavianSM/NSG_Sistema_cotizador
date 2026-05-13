// Test mínimo: importar servicioAuth directamente con mocks
jest.mock('../../configuracion/baseDatos', () => ({
  ejecutarQuery: jest.fn(),
  pool: { query: jest.fn().mockResolvedValue({ rows: [] }), on: jest.fn() },
  ejecutarTransaccion: jest.fn(),
}));

jest.mock('../../servicios/servicioCorreo', () => ({
  enviarCorreoRecuperacion: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utilidades/encriptacion', () => ({
  encriptar: jest.fn((v) => `enc:${v}`),
  desencriptar: jest.fn((v) => (v ? v.replace('enc:', '') : null)),
  hashBusqueda: jest.fn((v) => `hash:${v}`),
}));

process.env.JWT_SECRET = 'test-secret';
process.env.ENCRYPTION_KEY = 'a'.repeat(64);

const { ejecutarQuery } = require('../../configuracion/baseDatos');
const servicioAuth = require('../../servicios/servicioAuth');

test('recuperarPorTelefono retorna respuesta genérica', async () => {
  ejecutarQuery.mockResolvedValueOnce({ rows: [] });
  const resultado = await servicioAuth.recuperarPorTelefono('12345678');
  expect(resultado.exito).toBe(true);
  expect(resultado.mensaje).toContain('Si el teléfono existe');
});
