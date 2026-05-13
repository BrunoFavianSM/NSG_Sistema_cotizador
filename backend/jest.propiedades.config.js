/**
 * Configuración Jest para tests de propiedades (sin setupFilesAfterEnv).
 * Evita que el setup global intente conectarse a la BD.
 */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  testMatch: [
    '**/src/__tests__/propiedades/**/*.test.js',
  ],
};
