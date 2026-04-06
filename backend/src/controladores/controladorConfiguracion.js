const { ejecutarQuery } = require('../configuracion/baseDatos');

function parseMargen(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;
  if (numero < 0 || numero > 100) return null;
  return numero;
}

async function obtenerMargen(req, res) {
  try {
    const resultado = await ejecutarQuery(
      "SELECT valor, updated_at FROM configuracion WHERE clave = 'margen_ganancia'",
      []
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        error: 'Configuracion no encontrada',
        mensaje: 'No existe la clave margen_ganancia'
      });
    }

    const margen = parseMargen(resultado.rows[0].valor);
    return res.json({
      exito: true,
      margen_ganancia: margen ?? 20,
      updated_at: resultado.rows[0].updated_at
    });
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
    const nuevoMargen = parseMargen(req.body?.margen_ganancia);

    if (nuevoMargen === null) {
      return res.status(400).json({
        error: 'Dato invalido',
        mensaje: 'margen_ganancia debe ser un numero entre 0 y 100'
      });
    }

    const resultado = await ejecutarQuery(
      `UPDATE configuracion
       SET valor = $1
       WHERE clave = 'margen_ganancia'
       RETURNING valor, updated_at`,
      [String(nuevoMargen)]
    );

    if (resultado.rows.length === 0) {
      await ejecutarQuery(
        `INSERT INTO configuracion (clave, valor, descripcion)
         VALUES ('margen_ganancia', $1, 'Porcentaje de margen de ganancia')
         RETURNING valor, updated_at`,
        [String(nuevoMargen)]
      );
    }

    const margenActualizado = await ejecutarQuery(
      "SELECT valor, updated_at FROM configuracion WHERE clave = 'margen_ganancia'",
      []
    );

    return res.json({
      exito: true,
      mensaje: 'Margen actualizado correctamente',
      margen_ganancia: Number(margenActualizado.rows[0].valor),
      updated_at: margenActualizado.rows[0].updated_at
    });
  } catch (error) {
    console.error('Error al actualizar margen:', error);
    return res.status(500).json({
      error: 'Error interno',
      mensaje: 'No se pudo actualizar la configuracion de margen'
    });
  }
}

module.exports = {
  obtenerMargen,
  actualizarMargen
};
