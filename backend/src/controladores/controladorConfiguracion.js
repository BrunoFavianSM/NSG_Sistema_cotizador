const { ejecutarQuery } = require('../configuracion/baseDatos');

function parseMargen(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;
  if (numero < 0 || numero > 100) return null;
  return numero;
}

function parsePorcentaje(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;
  if (numero < 0 || numero > 100) return null;
  return numero;
}

function parseTipoCambio(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;
  if (numero <= 0) return null;
  return numero;
}

async function obtenerMapaConfiguracion() {
  const resultado = await ejecutarQuery(
    "SELECT clave, valor, updated_at FROM configuracion WHERE clave IN ('margen_ganancia', 'margen_ganancia_default', 'tasa_igv', 'tipo_cambio_usd_pen', 'modo_tipo_cambio')",
    []
  );

  return resultado.rows.reduce((acc, row) => {
    acc[row.clave] = row;
    return acc;
  }, {});
}

async function guardarConfiguracion(clave, valor, descripcion) {
  const actualizado = await ejecutarQuery(
    `UPDATE configuracion
     SET valor = $1
     WHERE clave = $2
     RETURNING clave, valor, updated_at`,
    [String(valor), clave]
  );

  if (actualizado.rows.length > 0) {
    return actualizado.rows[0];
  }

  const insertado = await ejecutarQuery(
    `INSERT INTO configuracion (clave, valor, descripcion)
     VALUES ($1, $2, $3)
     RETURNING clave, valor, updated_at`,
    [clave, String(valor), descripcion]
  );

  return insertado.rows[0];
}

function construirPayloadConfiguracion(mapa) {
  const margenPorDefecto = parseMargen(mapa.margen_ganancia_default?.valor ?? mapa.margen_ganancia?.valor);
  const tasaIgv = parsePorcentaje(mapa.tasa_igv?.valor);
  const tipoCambio = parseTipoCambio(mapa.tipo_cambio_usd_pen?.valor);

  // Validar que el modo almacenado sea uno de los valores permitidos
  const modoRaw = mapa.modo_tipo_cambio?.valor;
  const modoCambio = (modoRaw === 'manual' || modoRaw === 'automatico') ? modoRaw : 'manual';

  const updatedAt = [
    mapa.margen_ganancia_default?.updated_at,
    mapa.margen_ganancia?.updated_at,
    mapa.tasa_igv?.updated_at,
    mapa.tipo_cambio_usd_pen?.updated_at
  ].find(Boolean);

  return {
    exito: true,
    margen_ganancia: margenPorDefecto ?? 20,
    margen_ganancia_default: margenPorDefecto ?? 20,
    tasa_igv: tasaIgv ?? 18,
    tipo_cambio_usd_pen: tipoCambio ?? 3.75,
    modo_tipo_cambio: modoCambio,
    updated_at: updatedAt ?? null
  };
}

async function obtenerMargen(req, res) {
  try {
    const mapaConfiguracion = await obtenerMapaConfiguracion();
    return res.json(construirPayloadConfiguracion(mapaConfiguracion));
  } catch (error) {
    console.error('Error al obtener margen:', error);
    return res.status(500).json({
      error: 'Error interno',
      mensaje: 'No se pudo obtener la configuracion de margen'
    });
  }
}

async function actualizarMargen(req, res) {
  try {
    const nuevoMargen = parseMargen(
      req.body?.margen_ganancia_default ?? req.body?.margen_ganancia
    );
    const nuevaTasaIgv = req.body?.tasa_igv === undefined
      ? undefined
      : parsePorcentaje(req.body?.tasa_igv);
    const nuevoTipoCambio = req.body?.tipo_cambio_usd_pen === undefined
      ? undefined
      : parseTipoCambio(req.body?.tipo_cambio_usd_pen);

    if (nuevoMargen === null || (req.body?.tasa_igv !== undefined && nuevaTasaIgv === null) || (req.body?.tipo_cambio_usd_pen !== undefined && nuevoTipoCambio === null)) {
      return res.status(400).json({
        error: 'Dato invalido',
        mensaje: 'margen_ganancia_default/tasa_igv deben estar entre 0 y 100 y tipo_cambio_usd_pen debe ser mayor a 0'
      });
    }

    await guardarConfiguracion('margen_ganancia_default', nuevoMargen, 'Porcentaje de margen por defecto para cotizaciones');
    await guardarConfiguracion('margen_ganancia', nuevoMargen, 'Compatibilidad con clientes legacy');

    if (nuevaTasaIgv !== undefined) {
      await guardarConfiguracion('tasa_igv', nuevaTasaIgv, 'Porcentaje de IGV aplicado al precio neto');
    }

    if (nuevoTipoCambio !== undefined) {
      await guardarConfiguracion('tipo_cambio_usd_pen', nuevoTipoCambio, 'Tipo de cambio referencial USD a PEN');
    }

    const mapaConfiguracion = await obtenerMapaConfiguracion();
    const payload = construirPayloadConfiguracion(mapaConfiguracion);
    return res.json({
      mensaje: 'Margen actualizado correctamente',
      ...payload
    });
  } catch (error) {
    console.error('Error al actualizar margen:', error);
    return res.status(500).json({
      error: 'Error interno',
      mensaje: 'No se pudo actualizar la configuracion de margen'
    });
  }
}

/**
 * PUT /configuracion/tipo-cambio
 * Actualiza el modo de obtención del tipo de cambio USD/PEN.
 * Body: { modo: "manual" | "automatico" }
 * Requiere: verificarToken
 */
async function actualizarModoTipoCambio(req, res) {
  try {
    const { modo } = req.body ?? {};

    if (modo !== 'manual' && modo !== 'automatico') {
      return res.status(400).json({
        error: 'Dato inválido',
        mensaje: "El modo debe ser 'manual' o 'automatico'"
      });
    }

    await guardarConfiguracion(
      'modo_tipo_cambio',
      modo,
      'Modo de obtención del tipo de cambio USD/PEN: manual o automatico'
    );

    return res.json({
      exito: true,
      modo_tipo_cambio: modo,
      mensaje: 'Modo de tipo de cambio actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar modo de tipo de cambio:', error);
    return res.status(500).json({
      error: 'Error interno',
      mensaje: 'No se pudo actualizar el modo de tipo de cambio'
    });
  }
}

module.exports = {
  obtenerMargen,
  actualizarMargen,
  actualizarModoTipoCambio
};
