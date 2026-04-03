// Configuración global para tests
require('dotenv').config({ path: '.env.test' });

// Mock de console para tests más limpios
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Timeout global para tests
jest.setTimeout(10000);
