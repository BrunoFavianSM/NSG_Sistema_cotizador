// Test mínimo con mock de baseDatos
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

test('carga servidor con mocks', () => {
  const app = require('../../servidor');
  expect(app).toBeDefined();
});
