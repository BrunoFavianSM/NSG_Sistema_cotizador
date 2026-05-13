// Test mínimo: fast-check síncrono
const fc = require('fast-check');

test('fast-check síncrono', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 7, maxLength: 15 }).filter((s) => /^\d+$/.test(s)),
      (telefono) => {
        return typeof telefono === 'string' && telefono.length >= 7;
      }
    ),
    { numRuns: 5 }
  );
});
