// Test mínimo: solo require de fast-check
test('require fast-check', () => {
  const fc = require('fast-check');
  expect(typeof fc.assert).toBe('function');
  expect(typeof fc.property).toBe('function');
});
