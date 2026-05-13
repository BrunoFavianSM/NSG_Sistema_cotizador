// Test mínimo con fast-check y servicioAuth
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

const fc = require('fast-check');
const { ejecutarQuery } = require('../../configuracion/baseDatos');
const servicioAuth = require('../../servicios/servicioAuth');

test('property test mínimo con fast-check', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 7, maxLength: 15 }).filter((s) => /^\d+$/.test(s)),
      async (telefono) => {
        ejecutarQuery.mockResolvedValueOnce({ rows: [] });
        const resultado = await servicioAuth.recuperarPorTelefono(telefono);
        expect(resultado.exito).toBe(true);
      }
    ),
    { numRuns: 5 }
  );
});
