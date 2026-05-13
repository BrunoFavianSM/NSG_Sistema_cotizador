// Test mínimo: fast-check puro sin servicioAuth
const fc = require('fast-check');

test('fast-check async puro', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 7, maxLength: 15 }).filter((s) => /^\d+$/.test(s)),
      async (telefono) => {
        expect(typeof telefono).toBe('string');
        expect(telefono.length).toBeGreaterThanOrEqual(7);
      }
    ),
    { numRuns: 5 }
  );
});
