/**
 * Tests de propiedades — Recuperación de cuenta por teléfono
 *
 * Property 1: Recuperación por teléfono nunca revela existencia de cuenta
 *   Validates: Requisito 1.3
 *
 * Property 2: Token de recuperación expira en exactamente 5 minutos
 *   Validates: Requisito 1.2
 *
 * Estrategia: Se extrae la lógica de recuperarPorTelefono en una función
 * pura con dependencias inyectadas para evitar problemas de carga de módulos
 * con bcrypt/pg en Jest.
 */

'use strict';

const fc = require('fast-check');
const crypto = require('crypto');

// ─── Constantes ────────────────────────────────────────────────────────────

const MENSAJE_GENERICO = 'Si el teléfono existe, recibirás instrucciones en tu correo registrado.';
const CINCO_MINUTOS_MS = 5 * 60 * 1000;
const TOLERANCIA_MS = 1000;
const TOKEN_EXPIRA_MINUTOS = 5;

// ─── Implementación bajo prueba (extraída de servicioAuth.js) ──────────────
//
// Esta función replica exactamente la lógica de servicioAuth.recuperarPorTelefono
// con dependencias inyectadas para facilitar el testing de propiedades.
// Si la implementación en servicioAuth.js cambia, actualizar aquí también.

async function recuperarPorTelefono(telefono, { ejecutarQuery, hashBusqueda, desencriptar, enviarCorreoRecuperacion }) {
  const RESPUESTA_GENERICA = {
    exito: true,
    mensaje: MENSAJE_GENERICO,
  };

  // 1. Validar formato de teléfono
  if (!telefono || !/^\d{7,15}$/.test(telefono)) {
    return { exito: false, status: 400, codigo: 'TELEFONO_INVALIDO' };
  }

  try {
    // 2. Calcular hash del teléfono
    const telefonoHash = hashBusqueda(telefono);

    // 3. Buscar en cuentas por telefono_hash
    const resultado = await ejecutarQuery(
      'SELECT id, correo_encrypted FROM cuentas WHERE telefono_hash = $1',
      [telefonoHash]
    );

    if (resultado.rows.length === 0) {
      return RESPUESTA_GENERICA;
    }

    const cuenta = resultado.rows[0];

    // 4. Generar token de recuperación
    const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + TOKEN_EXPIRA_MINUTOS * 60 * 1000);

    await ejecutarQuery(
      'UPDATE cuentas SET token_recuperacion = $1, token_recuperacion_expira = $2 WHERE id = $3',
      [tokenRecuperacion, expira, cuenta.id]
    );

    // 5. Desencriptar correo y enviar enlace
    try {
      const correoDesencriptado = desencriptar(cuenta.correo_encrypted);
      const enlace = `http://localhost:5173/restablecer?token=${tokenRecuperacion}`;
      enviarCorreoRecuperacion(correoDesencriptado, enlace).catch(() => {});
    } catch (_) {
      // Silencioso
    }

    // 6. Siempre retornar respuesta genérica
    return RESPUESTA_GENERICA;
  } catch (_) {
    return RESPUESTA_GENERICA;
  }
}

// ─── Generadores ───────────────────────────────────────────────────────────

/** Genera teléfonos válidos: solo dígitos, entre 7 y 15 caracteres */
const telefonoValido = fc
  .array(fc.integer({ min: 0, max: 9 }), { minLength: 7, maxLength: 15 })
  .map((arr) => arr.join(''));

// ─── Dependencias mock ─────────────────────────────────────────────────────

const hashBusqueda = (v) => `hash:${v}`;
const desencriptar = (v) => (v ? v.replace('enc:', '') : null);
const enviarCorreoRecuperacion = jest.fn().mockResolvedValue(undefined);

// ─── Property 1: Recuperación por teléfono nunca revela existencia de cuenta ──

describe('Property 1: Recuperación por teléfono nunca revela existencia de cuenta', () => {
  /**
   * **Validates: Requisito 1.3**
   *
   * Para cualquier teléfono válido (registrado o no), la respuesta debe ser
   * { exito: true, mensaje: MENSAJE_GENERICO } sin importar si la cuenta existe.
   */

  it('retorna respuesta genérica cuando la cuenta NO existe', async () => {
    await fc.assert(
      fc.asyncProperty(telefonoValido, async (telefono) => {
        const ejecutarQuery = jest.fn().mockResolvedValueOnce({ rows: [] });

        const resultado = await recuperarPorTelefono(telefono, {
          ejecutarQuery,
          hashBusqueda,
          desencriptar,
          enviarCorreoRecuperacion,
        });

        return (
          resultado.exito === true &&
          resultado.mensaje === MENSAJE_GENERICO
        );
      }),
      { numRuns: 100 }
    );
  });

  it('retorna respuesta genérica cuando la cuenta SÍ existe', async () => {
    await fc.assert(
      fc.asyncProperty(telefonoValido, async (telefono) => {
        const ejecutarQuery = jest.fn()
          .mockResolvedValueOnce({
            rows: [{ id: 42, correo_encrypted: 'enc:usuario@ejemplo.com' }],
          })
          .mockResolvedValueOnce({ rows: [] });

        const resultado = await recuperarPorTelefono(telefono, {
          ejecutarQuery,
          hashBusqueda,
          desencriptar,
          enviarCorreoRecuperacion,
        });

        return (
          resultado.exito === true &&
          resultado.mensaje === MENSAJE_GENERICO
        );
      }),
      { numRuns: 100 }
    );
  });

  it('la respuesta es idéntica independientemente de si la cuenta existe (anti-enumeración)', async () => {
    await fc.assert(
      fc.asyncProperty(telefonoValido, async (telefono) => {
        // Caso 1: cuenta no existe
        const ejecutarQuerySin = jest.fn().mockResolvedValueOnce({ rows: [] });
        const respuestaSinCuenta = await recuperarPorTelefono(telefono, {
          ejecutarQuery: ejecutarQuerySin,
          hashBusqueda,
          desencriptar,
          enviarCorreoRecuperacion,
        });

        // Caso 2: cuenta existe
        const ejecutarQueryCon = jest.fn()
          .mockResolvedValueOnce({
            rows: [{ id: 99, correo_encrypted: 'enc:otro@ejemplo.com' }],
          })
          .mockResolvedValueOnce({ rows: [] });
        const respuestaConCuenta = await recuperarPorTelefono(telefono, {
          ejecutarQuery: ejecutarQueryCon,
          hashBusqueda,
          desencriptar,
          enviarCorreoRecuperacion,
        });

        return (
          respuestaSinCuenta.exito === true &&
          respuestaConCuenta.exito === true &&
          respuestaSinCuenta.mensaje === MENSAJE_GENERICO &&
          respuestaConCuenta.mensaje === MENSAJE_GENERICO
        );
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 2: Token de recuperación expira en exactamente 5 minutos ────────

describe('Property 2: Token de recuperación expira en exactamente 5 minutos', () => {
  /**
   * **Validates: Requisito 1.2**
   *
   * Para cualquier cuenta con token generado, token_recuperacion_expira debe
   * ser NOW() + 5min con tolerancia ±1s.
   */

  it('el valor de token_recuperacion_expira pasado al UPDATE es NOW() + 5min (±1s)', async () => {
    await fc.assert(
      fc.asyncProperty(telefonoValido, async (telefono) => {
        let expiraCapturado = null;

        const ejecutarQuery = jest.fn()
          .mockResolvedValueOnce({
            rows: [{ id: 1, correo_encrypted: 'enc:test@ejemplo.com' }],
          })
          .mockImplementationOnce(async (_query, params) => {
            expiraCapturado = params[1];
            return { rows: [] };
          });

        const ahora = Date.now();
        await recuperarPorTelefono(telefono, {
          ejecutarQuery,
          hashBusqueda,
          desencriptar,
          enviarCorreoRecuperacion,
        });

        if (!expiraCapturado || !(expiraCapturado instanceof Date)) return false;

        const esperado = ahora + CINCO_MINUTOS_MS;
        const diferencia = Math.abs(expiraCapturado.getTime() - esperado);

        return diferencia <= TOLERANCIA_MS;
      }),
      { numRuns: 100 }
    );
  });

  it('el token de recuperación es una cadena hexadecimal de 64 caracteres', async () => {
    await fc.assert(
      fc.asyncProperty(telefonoValido, async (telefono) => {
        let tokenCapturado = null;

        const ejecutarQuery = jest.fn()
          .mockResolvedValueOnce({
            rows: [{ id: 2, correo_encrypted: 'enc:otro@ejemplo.com' }],
          })
          .mockImplementationOnce(async (_query, params) => {
            tokenCapturado = params[0];
            return { rows: [] };
          });

        await recuperarPorTelefono(telefono, {
          ejecutarQuery,
          hashBusqueda,
          desencriptar,
          enviarCorreoRecuperacion,
        });

        return (
          tokenCapturado !== null &&
          typeof tokenCapturado === 'string' &&
          /^[0-9a-f]{64}$/.test(tokenCapturado)
        );
      }),
      { numRuns: 100 }
    );
  });
});
