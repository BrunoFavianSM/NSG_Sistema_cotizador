/**
 * Controlador de Productos
 * 
 * Maneja todas las operaciones CRUD de productos con validación,
 * sanitización y control de acceso.
 * 
 * Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3
 */

const { ejecutarQuery } = require('../configuracion/baseDatos');
const { validarProducto, validarId } = require('../utilidades/validacion');
const { sanitizarObjeto } = require('../utilidades/sanitizacion');

/**
 * Obtener todos los productos disponibles
 * Filtra por stock > 0 O disponible_a_pedido = true
 * Soporta filtrado por categoría y socket
 * 
 * GET /api/productos
 * Query params: categoria, socket
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
async function obtenerProductos(req, res) {
  try {
    const { categoria, socket } = req.query;
    
    // Query base: solo productos disponibles
    let query = `
      SELECT 
        id, nombre, categoria, socket, ram_type, form_factor,
        wattage, tdp, precio_base, stock, disponible_a_pedido,
        tiempo_entrega_dias, descripcion_tecnica, imagen_url,
        created_at, updated_at
      FROM productos
      WHERE (stock > 0 OR disponible_a_pedido = true)
    `;
    
    const parametros = [];
    let contadorParam = 1;
    
    // Filtrar por categoría si se proporciona
    if (categoria) {
      query += ` AND categoria = $${contadorParam}`;
      parametros.push(categoria);
      contadorParam++;
    }
    
    // Filtrar por socket si se proporciona
    if (socket) {
      query += ` AND socket = $${contadorParam}`;
      parametros.push(socket);
      contadorParam++;
    }
    
    query += ' ORDER BY categoria, nombre';
    
    const resultado = await ejecutarQuery(query, parametros);
    
    res.json({
      exito: true,
      cantidad: resultado.rows.length,
      productos: resultado.rows
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ 
      error: 'Error al obtener productos',
      mensaje: 'No se pudieron recuperar los productos' 
    });
  }
}

/**
 * Obtener un producto por ID
 * 
 * GET /api/productos/:id
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
async function obtenerProductoPorId(req, res) {
  try {
    const validacionId = validarId(req.params.id);
    
    if (!validacionId.valido) {
      return res.status(400).json({ 
        error: 'ID inválido',
        mensaje: validacionId.error 
      });
    }
    
    const resultado = await ejecutarQuery(
      `SELECT 
        id, nombre, categoria, socket, ram_type, form_factor,
        wattage, tdp, precio_base, stock, disponible_a_pedido,
        tiempo_entrega_dias, descripcion_tecnica, imagen_url,
        created_at, updated_at
      FROM productos 
      WHERE id = $1`,
      [validacionId.id]
    );
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Producto no encontrado',
        mensaje: `No existe un producto con ID ${validacionId.id}` 
      });
    }
    
    res.json({
      exito: true,
      producto: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ 
      error: 'Error al obtener producto',
      mensaje: 'No se pudo recuperar el producto' 
    });
  }
}

/**
 * Crear un nuevo producto (requiere autenticación)
 * 
 * POST /api/productos
 * Body: { nombre, categoria, socket?, ram_type?, form_factor?, wattage?, 
 *         tdp?, precio_base, stock, disponible_a_pedido?, tiempo_entrega_dias?,
 *         descripcion_tecnica?, imagen_url? }
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
async function crearProducto(req, res) {
  try {
    // Sanitizar datos de entrada
    const datosSanitizados = sanitizarObjeto(req.body);
    
    // Validar datos
    const validacion = validarProducto(datosSanitizados);
    
    if (!validacion.valido) {
      return res.status(400).json({ 
        error: 'Datos inválidos',
        errores: validacion.errores 
      });
    }
    
    // Preparar datos para inserción
    const {
      nombre,
      categoria,
      socket = null,
      ram_type = null,
      form_factor = null,
      wattage = null,
      tdp = null,
      precio_base,
      stock,
      disponible_a_pedido = false,
      tiempo_entrega_dias = null,
      descripcion_tecnica = null,
      imagen_url = null
    } = datosSanitizados;
    
    // Insertar producto
    const resultado = await ejecutarQuery(
      `INSERT INTO productos (
        nombre, categoria, socket, ram_type, form_factor,
        wattage, tdp, precio_base, stock, disponible_a_pedido,
        tiempo_entrega_dias, descripcion_tecnica, imagen_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING 
        id, nombre, categoria, socket, ram_type, form_factor,
        wattage, tdp, precio_base, stock, disponible_a_pedido,
        tiempo_entrega_dias, descripcion_tecnica, imagen_url,
        created_at, updated_at`,
      [
        nombre, categoria, socket, ram_type, form_factor,
        wattage, tdp, precio_base, stock, disponible_a_pedido,
        tiempo_entrega_dias, descripcion_tecnica, imagen_url
      ]
    );
    
    res.status(201).json({
      exito: true,
      mensaje: 'Producto creado exitosamente',
      producto: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    
    // Manejar errores específicos de base de datos
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'Producto duplicado',
        mensaje: 'Ya existe un producto con ese nombre' 
      });
    }
    
    if (error.code === '23514') {
      return res.status(400).json({ 
        error: 'Constraint violado',
        mensaje: 'Los datos no cumplen con las restricciones de la base de datos' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error al crear producto',
      mensaje: 'No se pudo crear el producto' 
    });
  }
}

/**
 * Actualizar un producto existente (requiere autenticación)
 * 
 * PUT /api/productos/:id
 * Body: { nombre?, categoria?, socket?, ram_type?, form_factor?, wattage?, 
 *         tdp?, precio_base?, stock?, disponible_a_pedido?, tiempo_entrega_dias?,
 *         descripcion_tecnica?, imagen_url? }
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
async function actualizarProducto(req, res) {
  try {
    // Validar ID
    const validacionId = validarId(req.params.id);
    
    if (!validacionId.valido) {
      return res.status(400).json({ 
        error: 'ID inválido',
        mensaje: validacionId.error 
      });
    }
    
    // Verificar que el producto existe
    const productoExistente = await ejecutarQuery(
      'SELECT id FROM productos WHERE id = $1',
      [validacionId.id]
    );
    
    if (productoExistente.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Producto no encontrado',
        mensaje: `No existe un producto con ID ${validacionId.id}` 
      });
    }
    
    // Sanitizar datos de entrada
    const datosSanitizados = sanitizarObjeto(req.body);
    
    // Construir query de actualización dinámica
    const camposActualizables = [
      'nombre', 'categoria', 'socket', 'ram_type', 'form_factor',
      'wattage', 'tdp', 'precio_base', 'stock', 'disponible_a_pedido',
      'tiempo_entrega_dias', 'descripcion_tecnica', 'imagen_url'
    ];
    
    const actualizaciones = [];
    const valores = [];
    let contadorParam = 1;
    
    for (const campo of camposActualizables) {
      if (datosSanitizados.hasOwnProperty(campo)) {
        actualizaciones.push(`${campo} = $${contadorParam}`);
        valores.push(datosSanitizados[campo]);
        contadorParam++;
      }
    }
    
    if (actualizaciones.length === 0) {
      return res.status(400).json({ 
        error: 'Sin datos para actualizar',
        mensaje: 'No se proporcionaron campos para actualizar' 
      });
    }
    
    // Agregar ID al final de los valores
    valores.push(validacionId.id);
    
    // Ejecutar actualización
    const query = `
      UPDATE productos 
      SET ${actualizaciones.join(', ')}
      WHERE id = $${contadorParam}
      RETURNING 
        id, nombre, categoria, socket, ram_type, form_factor,
        wattage, tdp, precio_base, stock, disponible_a_pedido,
        tiempo_entrega_dias, descripcion_tecnica, imagen_url,
        created_at, updated_at
    `;
    
    const resultado = await ejecutarQuery(query, valores);
    
    res.json({
      exito: true,
      mensaje: 'Producto actualizado exitosamente',
      producto: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    
    // Manejar errores específicos de base de datos
    if (error.code === '23514') {
      return res.status(400).json({ 
        error: 'Constraint violado',
        mensaje: 'Los datos no cumplen con las restricciones de la base de datos' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error al actualizar producto',
      mensaje: 'No se pudo actualizar el producto' 
    });
  }
}

/**
 * Eliminar un producto (requiere autenticación)
 * 
 * DELETE /api/productos/:id
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
async function eliminarProducto(req, res) {
  try {
    // Validar ID
    const validacionId = validarId(req.params.id);
    
    if (!validacionId.valido) {
      return res.status(400).json({ 
        error: 'ID inválido',
        mensaje: validacionId.error 
      });
    }
    
    // Verificar que el producto existe
    const productoExistente = await ejecutarQuery(
      'SELECT id, nombre FROM productos WHERE id = $1',
      [validacionId.id]
    );
    
    if (productoExistente.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Producto no encontrado',
        mensaje: `No existe un producto con ID ${validacionId.id}` 
      });
    }
    
    // Verificar si el producto está en cotizaciones
    const enCotizaciones = await ejecutarQuery(
      'SELECT COUNT(*) as cantidad FROM detalle_cotizacion WHERE id_producto = $1',
      [validacionId.id]
    );
    
    if (parseInt(enCotizaciones.rows[0].cantidad) > 0) {
      return res.status(409).json({ 
        error: 'Producto en uso',
        mensaje: 'No se puede eliminar el producto porque está incluido en cotizaciones existentes' 
      });
    }
    
    // Eliminar producto
    await ejecutarQuery(
      'DELETE FROM productos WHERE id = $1',
      [validacionId.id]
    );
    
    res.json({
      exito: true,
      mensaje: 'Producto eliminado exitosamente',
      producto: {
        id: validacionId.id,
        nombre: productoExistente.rows[0].nombre
      }
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    
    // Manejar errores de integridad referencial
    if (error.code === '23503') {
      return res.status(409).json({ 
        error: 'Producto en uso',
        mensaje: 'No se puede eliminar el producto porque está referenciado en otras tablas' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error al eliminar producto',
      mensaje: 'No se pudo eliminar el producto' 
    });
  }
}

module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
};
