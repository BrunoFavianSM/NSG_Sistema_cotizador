/**
 * Controlador de Favoritos de Productos
 *
 * Gestiona la lista de productos favoritos de cada usuario autenticado.
 * La tabla `productos_favoritos` usa (id_usuario, id_producto, tabla_producto)
 * como clave única para evitar colisiones entre tablas de productos distintas.
 *
 * Requisitos: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

const { ejecutarQuery } = require('../configuracion/baseDatos');
const { validarId } = require('../utilidades/validacion');

/**
 * GET /api/productos/favoritos
 * Retorna la lista de productos favoritos del usuario autenticado,
 * con datos básicos del producto obtenidos via JOIN a la tabla `productos`.
 *
 * Requisitos: 4.3
 */
async function obtenerFavoritos(req, res) {
  try {
    const idUsuario = req.usuario.id;

    const resultado = await ejecutarQuery(
      `SELECT
         pf.id              AS id_favorito,
         pf.id_producto,
         pf.tabla_producto,
         pf.fecha_agregado,
         p.nombre,
         p.precio_base,
         p.imagen_url,
         p.imagen_path,
         c.nombre           AS categoria
       FROM productos_favoritos pf
       INNER JOIN productos p ON p.id = pf.id_producto
       INNER JOIN categorias c ON c.id = p.id_categoria
       WHERE pf.id_usuario = $1
       ORDER BY pf.fecha_agregado DESC`,
      [idUsuario]
    );

    return res.json({
      exito: true,
      cantidad: resultado.rows.length,
      favoritos: resultado.rows,
    });
  } catch (error) {
    console.error('[controladorFavoritos] Error al obtener favoritos:', error);
    return res.status(500).json({
      error: 'Error al obtener favoritos',
      mensaje: 'No se pudieron recuperar los productos favoritos.',
      codigo: 'ERROR_OBTENER_FAVORITOS',
    });
  }
}

/**
 * POST /api/productos/favoritos
 * Body: { id_producto: number, tabla_producto: string }
 *
 * Agrega un producto a los favoritos del usuario autenticado.
 * Retorna HTTP 409 con código FAVORITO_DUPLICADO si ya existe.
 *
 * Requisitos: 4.4, 4.5
 */
async function agregarFavorito(req, res) {
  try {
    const idUsuario = req.usuario.id;
    const { id_producto, tabla_producto } = req.body;

    // Validar id_producto
    const validacionId = validarId(id_producto);
    if (!validacionId.valido) {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: `id_producto inválido: ${validacionId.error}`,
        codigo: 'DATOS_INVALIDOS',
      });
    }

    // Validar tabla_producto
    if (!tabla_producto || typeof tabla_producto !== 'string' || tabla_producto.trim().length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: 'tabla_producto es requerido.',
        codigo: 'DATOS_INVALIDOS',
      });
    }
    const tablaLimpia = tabla_producto.trim().toLowerCase();
    if (tablaLimpia.length > 60) {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: 'tabla_producto excede la longitud máxima permitida.',
        codigo: 'DATOS_INVALIDOS',
      });
    }

    // Verificar que el producto existe
    const existeProducto = await ejecutarQuery(
      'SELECT id FROM productos WHERE id = $1',
      [validacionId.id]
    );
    if (existeProducto.rows.length === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        mensaje: `No existe un producto con ID ${validacionId.id}.`,
        codigo: 'PRODUCTO_NO_ENCONTRADO',
      });
    }

    // Insertar favorito
    const resultado = await ejecutarQuery(
      `INSERT INTO productos_favoritos (id_usuario, id_producto, tabla_producto)
       VALUES ($1, $2, $3)
       RETURNING id, id_usuario, id_producto, tabla_producto, fecha_agregado`,
      [idUsuario, validacionId.id, tablaLimpia]
    );

    return res.status(201).json({
      exito: true,
      mensaje: 'Producto agregado a favoritos.',
      favorito: resultado.rows[0],
    });
  } catch (error) {
    // Violación de constraint único: el favorito ya existe
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Favorito duplicado',
        mensaje: 'Este producto ya está en tu lista de favoritos.',
        codigo: 'FAVORITO_DUPLICADO',
      });
    }
    console.error('[controladorFavoritos] Error al agregar favorito:', error);
    return res.status(500).json({
      error: 'Error al agregar favorito',
      mensaje: 'No se pudo agregar el producto a favoritos.',
      codigo: 'ERROR_AGREGAR_FAVORITO',
    });
  }
}

/**
 * DELETE /api/productos/favoritos/:idProducto
 * Query param opcional: tabla_producto (para distinguir entre tablas)
 *
 * Elimina un producto de los favoritos del usuario autenticado.
 * Retorna HTTP 404 con código FAVORITO_NO_ENCONTRADO si no existe.
 *
 * Requisitos: 4.6, 4.7
 */
async function eliminarFavorito(req, res) {
  try {
    const idUsuario = req.usuario.id;
    const { idProducto } = req.params;
    const { tabla_producto } = req.query;

    // Validar idProducto
    const validacionId = validarId(idProducto);
    if (!validacionId.valido) {
      return res.status(400).json({
        error: 'ID inválido',
        mensaje: validacionId.error,
        codigo: 'DATOS_INVALIDOS',
      });
    }

    let resultado;

    if (tabla_producto && typeof tabla_producto === 'string' && tabla_producto.trim().length > 0) {
      // Eliminar favorito específico por id_producto + tabla_producto
      resultado = await ejecutarQuery(
        `DELETE FROM productos_favoritos
         WHERE id_usuario = $1 AND id_producto = $2 AND tabla_producto = $3
         RETURNING id`,
        [idUsuario, validacionId.id, tabla_producto.trim().toLowerCase()]
      );
    } else {
      // Eliminar todos los favoritos del usuario para ese id_producto
      // (caso en que el frontend no envía tabla_producto)
      resultado = await ejecutarQuery(
        `DELETE FROM productos_favoritos
         WHERE id_usuario = $1 AND id_producto = $2
         RETURNING id`,
        [idUsuario, validacionId.id]
      );
    }

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        error: 'Favorito no encontrado',
        mensaje: 'Este producto no está en tu lista de favoritos.',
        codigo: 'FAVORITO_NO_ENCONTRADO',
      });
    }

    return res.json({
      exito: true,
      mensaje: 'Producto eliminado de favoritos.',
    });
  } catch (error) {
    console.error('[controladorFavoritos] Error al eliminar favorito:', error);
    return res.status(500).json({
      error: 'Error al eliminar favorito',
      mensaje: 'No se pudo eliminar el producto de favoritos.',
      codigo: 'ERROR_ELIMINAR_FAVORITO',
    });
  }
}

module.exports = { obtenerFavoritos, agregarFavorito, eliminarFavorito };
