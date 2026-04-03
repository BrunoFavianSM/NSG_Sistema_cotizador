/**
 * Controlador de Cotizaciones
 * 
 * Maneja todas las operaciones relacionadas con cotizaciones:
 * - Creación de cotizaciones con código ticket secuencial
 * - Cálculo de precio total con margen configurable
 * - Persistencia en tablas cotizaciones y detalle_cotizacion
 * - Asociación condicional con cliente (por email)
 * - Consulta por código ticket
 * - Validación de cotización con comparación de precios
 * - Marcar cotización como reclamada
 * - Consulta de historial por cliente
 * 
 * Requisitos: 6.1, 6.2, 6.3, 6.4, 7.3, 7.6, 8.1, 8.2, 8.3, 8.4, 
 *             9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 15.1, 15.2, 15.3
 */

const { ejecutarQuery, ejecutarTransaccion } = require('../configuracion/baseDatos');
const { 
  validarCotizacion: validarDatosCotizacion, 
  validarCodigoTicket, 
  validarCliente 
} = require('../utilidades/validacion');
const { sanitizarObjeto, validarEmail } = require('../utilidades/sanitizacion');
const { encriptar, desencriptar, hashBusqueda } = require('../utilidades/encriptacion');

/**
 * Obtiene el margen de ganancia configurado
 * 
 * @returns {Promise<number>} Margen de ganancia en porcentaje
 */
async function obtenerMargenGanancia() {
  try {
    const resultado = await ejecutarQuery(
      "SELECT valor FROM configuracion WHERE clave = 'margen_ganancia'",
      []
    );
    
    if (resultado.rows.length === 0) {
      // Valor por defecto si no existe en BD
      return 20;
    }
    
    return parseFloat(resultado.rows[0].valor);
  } catch (error) {
    console.error('Error al obtener margen:', error);
    return 20; // Fallback
  }
}

/**
 * Genera un código ticket secuencial (NSG-YYYY-NNNN)
 * Usa la función de PostgreSQL para garantizar secuencialidad
 * 
 * @returns {Promise<string>} Código ticket generado
 */
async function generarCodigoTicket() {
  try {
    const resultado = await ejecutarQuery(
      'SELECT generar_codigo_ticket() as codigo',
      []
    );
    
    return resultado.rows[0].codigo;
  } catch (error) {
    console.error('Error al generar código ticket:', error);
    throw new Error('No se pudo generar código ticket');
  }
}

/**
 * Busca o crea un cliente por email
 * 
 * @param {string} email - Email del cliente
 * @param {string} nombre - Nombre del cliente (opcional)
 * @param {string} telefono - Teléfono del cliente (opcional)
 * @returns {Promise<number|null>} ID del cliente o null si no hay email
 */
async function buscarOCrearCliente(email, nombre = null, telefono = null) {
  if (!email) {
    return null;
  }
  
  // Validar email
  const validacionEmail = validarEmail(email);
  if (!validacionEmail.valido) {
    throw new Error(`Email inválido: ${validacionEmail.error}`);
  }
  
  try {
    // Usar hash determinístico para búsqueda (AES-CBC no es determinístico)
    const emailHash = hashBusqueda(validacionEmail.email);
    
    // Buscar cliente existente por hash
    const clienteExistente = await ejecutarQuery(
      'SELECT id FROM usuarios_clientes WHERE correo_hash = $1',
      [emailHash]
    );
    
    if (clienteExistente.rows.length > 0) {
      return clienteExistente.rows[0].id;
    }
    
    // Crear nuevo cliente
    const emailEncriptado = encriptar(validacionEmail.email);
    const telefonoEncriptado = telefono ? encriptar(telefono) : null;
    
    const nuevoCliente = await ejecutarQuery(
      `INSERT INTO usuarios_clientes (nombre, correo, correo_hash, telefono)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [nombre, emailEncriptado, emailHash, telefonoEncriptado]
    );
    
    return nuevoCliente.rows[0].id;
  } catch (error) {
    console.error('Error al buscar/crear cliente:', error);
    throw new Error('Error al procesar información del cliente');
  }
}

/**
 * Calcula el precio total con margen aplicado
 * 
 * @param {Array} componentes - Array de componentes con precio_base
 * @param {number} margen - Margen de ganancia en porcentaje
 * @returns {number} Precio total con margen
 */
function calcularPrecioTotal(componentes, margen) {
  const precioBase = componentes.reduce((total, comp) => {
    const cantidad = comp.cantidad || 1;
    return total + (parseFloat(comp.precio_base) * cantidad);
  }, 0);
  
  return precioBase * (1 + margen / 100);
}

/**
 * Crear una nueva cotización
 * 
 * POST /api/cotizaciones
 * Body: {
 *   componentes: [{ id_producto, cantidad? }],
 *   email_cliente?: string,
 *   nombre_cliente?: string,
 *   telefono_cliente?: string
 * }
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
async function crearCotizacion(req, res) {
  try {
    // Extraer email ANTES de sanitizar (sanitizarInput convierte & en &amp; rompiendo emails)
    const emailOriginal = req.body.email_cliente || null;
    
    // Sanitizar datos de entrada (excepto email que se maneja por separado)
    const datosSanitizados = sanitizarObjeto(req.body);
    // Restaurar email original para que no sea alterado por la sanitización HTML
    if (emailOriginal) {
      datosSanitizados.email_cliente = emailOriginal.trim().toLowerCase();
    }

    // Validar estructura básica
    if (!datosSanitizados.componentes || !Array.isArray(datosSanitizados.componentes)) {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: 'Componentes debe ser un array'
      });
    }

    if (datosSanitizados.componentes.length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        mensaje: 'Debe incluir al menos un componente'
      });
    }

    // Validar que cada componente tenga id_producto
    for (const comp of datosSanitizados.componentes) {
      if (!comp.id_producto || isNaN(comp.id_producto)) {
        return res.status(400).json({
          error: 'Datos inválidos',
          mensaje: 'Cada componente debe tener un id_producto válido'
        });
      }
    }

    // Obtener margen de ganancia configurado
    const margen = await obtenerMargenGanancia();

    // Usar transacción para garantizar consistencia
    const resultado = await ejecutarTransaccion(async (cliente) => {
      // 1. Obtener información de productos
      const idsProductos = datosSanitizados.componentes.map(c => c.id_producto);
      const placeholders = idsProductos.map((_, i) => `$${i + 1}`).join(',');

      const productos = await cliente.query(
        `SELECT id, nombre, categoria, precio_base, stock, disponible_a_pedido,
                descripcion_tecnica
         FROM productos
         WHERE id IN (${placeholders})`,
        idsProductos
      );

      if (productos.rows.length !== idsProductos.length) {
        throw new Error('Uno o más productos no existen');
      }

      // Crear mapa de productos para acceso rápido
      const mapaProductos = new Map(productos.rows.map(p => [p.id, p]));

      // 2. Validar disponibilidad y preparar componentes
      const componentesConInfo = datosSanitizados.componentes.map(comp => {
        const producto = mapaProductos.get(comp.id_producto);

        if (!producto) {
          throw new Error(`Producto ${comp.id_producto} no encontrado`);
        }

        // Validar disponibilidad
        if (producto.stock === 0 && !producto.disponible_a_pedido) {
          throw new Error(`Producto "${producto.nombre}" no está disponible`);
        }

        return {
          ...comp,
          ...producto,
          cantidad: comp.cantidad || 1
        };
      });

      // 3. Calcular precio total
      const precioTotal = calcularPrecioTotal(componentesConInfo, margen);

      // 4. Generar código ticket
      const codigoTicket = await generarCodigoTicket();

      // 5. Buscar o crear cliente (si se proporciona email)
      // Limpiar nombre antes de pasar a buscarOCrearCliente
      // Después de sanitización, nombres como "! !" se convierten en entidades HTML
      // que son más largas pero no son nombres válidos
      let nombreCliente = datosSanitizados.nombre_cliente;
      if (nombreCliente) {
        // Remover entidades HTML comunes para verificar si el nombre es válido
        const nombreSinEntidades = nombreCliente
          .replace(/&[a-z]+;/gi, '') // Remover entidades HTML
          .trim();
        
        if (nombreSinEntidades.length < 2) {
          nombreCliente = null; // Ignorar nombres que son solo caracteres especiales
        }
      }

      const idCliente = await buscarOCrearCliente(
        datosSanitizados.email_cliente,
        nombreCliente,
        datosSanitizados.telefono_cliente
      );

      // 6. Calcular fecha de validez (3 días desde emisión)
      const fechaValidez = new Date();
      fechaValidez.setDate(fechaValidez.getDate() + 3);

      // 7. Insertar cotización
      const cotizacion = await cliente.query(
        `INSERT INTO cotizaciones (
          codigo_ticket, id_cliente, fecha_validez, precio_total,
          margen_aplicado, estado
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, codigo_unico, codigo_ticket, fecha_emision,
                  fecha_validez, precio_total, margen_aplicado, estado`,
        [codigoTicket, idCliente, fechaValidez, precioTotal, margen, 'Pendiente']
      );

      const cotizacionCreada = cotizacion.rows[0];

      // 8. Insertar detalles de cotización
      const detalles = [];
      for (const comp of componentesConInfo) {
        const detalle = await cliente.query(
          `INSERT INTO detalle_cotizacion (
            id_cotizacion, id_producto, nombre_producto, categoria,
            descripcion_tecnica, precio_unitario, cantidad, disponible_stock
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, nombre_producto, categoria, precio_unitario,
                    cantidad, disponible_stock`,
          [
            cotizacionCreada.id,
            comp.id,
            comp.nombre,
            comp.categoria,
            comp.descripcion_tecnica,
            comp.precio_base,
            comp.cantidad,
            comp.stock > 0
          ]
        );

        detalles.push(detalle.rows[0]);
      }

      return {
        cotizacion: cotizacionCreada,
        detalles
      };
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Cotización creada exitosamente',
      cotizacion: {
        id: resultado.cotizacion.id,
        codigo_unico: resultado.cotizacion.codigo_unico,
        codigo_ticket: resultado.cotizacion.codigo_ticket,
        fecha_emision: resultado.cotizacion.fecha_emision,
        fecha_validez: resultado.cotizacion.fecha_validez,
        precio_total: parseFloat(resultado.cotizacion.precio_total),
        margen_aplicado: parseFloat(resultado.cotizacion.margen_aplicado),
        estado: resultado.cotizacion.estado,
        componentes: resultado.detalles
      }
    });
  } catch (error) {
    console.error('Error al crear cotización:', error);

    res.status(500).json({
      error: 'Error al crear cotización',
      mensaje: error.message || 'No se pudo crear la cotización'
    });
  }
}


/**
 * Consultar cotización por código ticket
 * 
 * GET /api/cotizaciones/:codigoTicket
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
async function consultarCotizacion(req, res) {
  try {
    const { codigoTicket } = req.params;
    
    // Validar formato de código
    const validacion = validarCodigoTicket(codigoTicket);
    if (!validacion.valido) {
      return res.status(400).json({
        error: 'Código inválido',
        mensaje: validacion.error
      });
    }
    
    // Buscar cotización
    const cotizacion = await ejecutarQuery(
      `SELECT 
        c.id, c.codigo_unico, c.codigo_ticket, c.id_cliente,
        c.fecha_emision, c.fecha_validez, c.precio_total,
        c.margen_aplicado, c.estado, c.fecha_reclamacion
      FROM cotizaciones c
      WHERE c.codigo_ticket = $1`,
      [codigoTicket]
    );
    
    if (cotizacion.rows.length === 0) {
      return res.status(404).json({
        error: 'Cotización no encontrada',
        mensaje: 'No existe una cotización con ese código'
      });
    }
    
    const cotizacionData = cotizacion.rows[0];
    
    // Obtener detalles de la cotización
    const detalles = await ejecutarQuery(
      `SELECT 
        id, id_producto, nombre_producto, categoria,
        descripcion_tecnica, precio_unitario, cantidad, disponible_stock
      FROM detalle_cotizacion
      WHERE id_cotizacion = $1
      ORDER BY id`,
      [cotizacionData.id]
    );
    
    // Verificar si está caducada
    const ahora = new Date();
    const fechaValidez = new Date(cotizacionData.fecha_validez);
    const caducada = ahora > fechaValidez && cotizacionData.estado === 'Pendiente';
    
    res.json({
      exito: true,
      cotizacion: {
        id: cotizacionData.id,
        codigo_unico: cotizacionData.codigo_unico,
        codigo_ticket: cotizacionData.codigo_ticket,
        fecha_emision: cotizacionData.fecha_emision,
        fecha_validez: cotizacionData.fecha_validez,
        precio_total: parseFloat(cotizacionData.precio_total),
        margen_aplicado: parseFloat(cotizacionData.margen_aplicado),
        estado: caducada ? 'Caducada' : cotizacionData.estado,
        fecha_reclamacion: cotizacionData.fecha_reclamacion,
        caducada,
        componentes: detalles.rows.map(d => ({
          id: d.id,
          id_producto: d.id_producto,
          nombre: d.nombre_producto,
          categoria: d.categoria,
          descripcion_tecnica: d.descripcion_tecnica,
          precio_unitario: parseFloat(d.precio_unitario),
          cantidad: d.cantidad,
          disponible_stock: d.disponible_stock
        }))
      }
    });
  } catch (error) {
    console.error('Error al consultar cotización:', error);
    
    res.status(500).json({
      error: 'Error al consultar cotización',
      mensaje: 'No se pudo recuperar la cotización'
    });
  }
}

/**
 * Validar cotización con comparación de precios
 * 
 * GET /api/cotizaciones/:codigoTicket/validar
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
async function validarCotizacion(req, res) {
  try {
    const { codigoTicket } = req.params;
    
    // Validar formato de código
    const validacion = validarCodigoTicket(codigoTicket);
    if (!validacion.valido) {
      return res.status(400).json({
        error: 'Código inválido',
        mensaje: validacion.error
      });
    }
    
    // Buscar cotización
    const cotizacion = await ejecutarQuery(
      `SELECT 
        c.id, c.codigo_ticket, c.fecha_emision, c.fecha_validez,
        c.precio_total, c.margen_aplicado, c.estado
      FROM cotizaciones c
      WHERE c.codigo_ticket = $1`,
      [codigoTicket]
    );
    
    if (cotizacion.rows.length === 0) {
      return res.status(404).json({
        error: 'Cotización no encontrada',
        mensaje: 'No existe una cotización con ese código',
        valida: false
      });
    }
    
    const cotizacionData = cotizacion.rows[0];
    
    // Verificar si está caducada
    const ahora = new Date();
    const fechaValidez = new Date(cotizacionData.fecha_validez);
    const caducada = ahora > fechaValidez;
    
    if (caducada && cotizacionData.estado === 'Pendiente') {
      return res.json({
        exito: true,
        valida: false,
        mensaje: 'Cotización caducada',
        cotizacion: {
          codigo_ticket: cotizacionData.codigo_ticket,
          fecha_emision: cotizacionData.fecha_emision,
          fecha_validez: cotizacionData.fecha_validez,
          estado: 'Caducada'
        }
      });
    }
    
    // Obtener detalles con precios históricos
    const detalles = await ejecutarQuery(
      `SELECT 
        dc.id, dc.id_producto, dc.nombre_producto, dc.categoria,
        dc.precio_unitario as precio_historico, dc.cantidad,
        dc.disponible_stock as stock_historico,
        p.precio_base as precio_actual, p.stock as stock_actual,
        p.disponible_a_pedido
      FROM detalle_cotizacion dc
      LEFT JOIN productos p ON dc.id_producto = p.id
      WHERE dc.id_cotizacion = $1
      ORDER BY dc.id`,
      [cotizacionData.id]
    );
    
    // Calcular diferencias de precio
    let precioTotalActual = 0;
    const componentesComparacion = detalles.rows.map(d => {
      const precioHistorico = parseFloat(d.precio_historico);
      const precioActual = d.precio_actual ? parseFloat(d.precio_actual) : precioHistorico;
      const cantidad = d.cantidad;
      
      const subtotalHistorico = precioHistorico * cantidad;
      const subtotalActual = precioActual * cantidad;
      const diferencia = subtotalActual - subtotalHistorico;
      
      precioTotalActual += subtotalActual;
      
      return {
        id_producto: d.id_producto,
        nombre: d.nombre_producto,
        categoria: d.categoria,
        cantidad,
        precio_historico: precioHistorico,
        precio_actual: precioActual,
        diferencia_unitaria: precioActual - precioHistorico,
        subtotal_historico: subtotalHistorico,
        subtotal_actual: subtotalActual,
        diferencia_subtotal: diferencia,
        stock_historico: d.stock_historico,
        stock_actual: d.stock_actual || 0,
        disponible_a_pedido: d.disponible_a_pedido || false,
        disponible: (d.stock_actual > 0) || d.disponible_a_pedido
      };
    });
    
    // Aplicar margen al precio actual
    const margen = parseFloat(cotizacionData.margen_aplicado);
    precioTotalActual = precioTotalActual * (1 + margen / 100);
    
    const precioTotalHistorico = parseFloat(cotizacionData.precio_total);
    const diferenciaTotalPrecio = precioTotalActual - precioTotalHistorico;
    
    res.json({
      exito: true,
      valida: true,
      cotizacion: {
        codigo_ticket: cotizacionData.codigo_ticket,
        fecha_emision: cotizacionData.fecha_emision,
        fecha_validez: cotizacionData.fecha_validez,
        estado: cotizacionData.estado,
        margen_aplicado: margen,
        precio_total_historico: precioTotalHistorico,
        precio_total_actual: precioTotalActual,
        diferencia_total: diferenciaTotalPrecio,
        hay_cambios_precio: Math.abs(diferenciaTotalPrecio) > 0.01,
        componentes: componentesComparacion
      }
    });
  } catch (error) {
    console.error('Error al validar cotización:', error);
    
    res.status(500).json({
      error: 'Error al validar cotización',
      mensaje: 'No se pudo validar la cotización'
    });
  }
}

/**
 * Marcar cotización como reclamada
 * 
 * PUT /api/cotizaciones/:codigoTicket/reclamar
 * Body: { id_vendedor?: number, notas_vendedor?: string }
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
async function marcarComoReclamada(req, res) {
  try {
    const { codigoTicket } = req.params;
    const datosSanitizados = sanitizarObjeto(req.body);
    
    // Validar formato de código
    const validacion = validarCodigoTicket(codigoTicket);
    if (!validacion.valido) {
      return res.status(400).json({
        error: 'Código inválido',
        mensaje: validacion.error
      });
    }
    
    // Buscar cotización
    const cotizacion = await ejecutarQuery(
      `SELECT id, estado, fecha_validez
       FROM cotizaciones
       WHERE codigo_ticket = $1`,
      [codigoTicket]
    );
    
    if (cotizacion.rows.length === 0) {
      return res.status(404).json({
        error: 'Cotización no encontrada',
        mensaje: 'No existe una cotización con ese código'
      });
    }
    
    const cotizacionData = cotizacion.rows[0];
    
    // Verificar que esté en estado Pendiente
    if (cotizacionData.estado !== 'Pendiente') {
      return res.status(400).json({
        error: 'Estado inválido',
        mensaje: `La cotización ya está en estado: ${cotizacionData.estado}`
      });
    }
    
    // Actualizar estado a Reclamada
    const resultado = await ejecutarQuery(
      `UPDATE cotizaciones
       SET estado = 'Reclamada',
           fecha_reclamacion = CURRENT_TIMESTAMP,
           id_vendedor = $1,
           notas_vendedor = $2
       WHERE id = $3
       RETURNING id, codigo_ticket, estado, fecha_reclamacion`,
      [
        datosSanitizados.id_vendedor || null,
        datosSanitizados.notas_vendedor || null,
        cotizacionData.id
      ]
    );
    
    res.json({
      exito: true,
      mensaje: 'Cotización marcada como reclamada',
      cotizacion: {
        id: resultado.rows[0].id,
        codigo_ticket: resultado.rows[0].codigo_ticket,
        estado: resultado.rows[0].estado,
        fecha_reclamacion: resultado.rows[0].fecha_reclamacion
      }
    });
  } catch (error) {
    console.error('Error al marcar cotización como reclamada:', error);
    
    res.status(500).json({
      error: 'Error al actualizar cotización',
      mensaje: 'No se pudo marcar la cotización como reclamada'
    });
  }
}

/**
 * Consultar historial de cotizaciones por cliente
 * 
 * GET /api/cotizaciones/cliente/:email
 * 
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
async function consultarHistorialCliente(req, res) {
  try {
    const { email } = req.params;
    
    // Validar email
    const validacionEmail = validarEmail(email);
    if (!validacionEmail.valido) {
      return res.status(400).json({
        error: 'Email inválido',
        mensaje: validacionEmail.error
      });
    }
    
    // Usar hash determinístico para búsqueda (AES-CBC no es determinístico)
    const emailHash = hashBusqueda(validacionEmail.email);
    
    // Buscar cliente por hash
    const cliente = await ejecutarQuery(
      'SELECT id, nombre FROM usuarios_clientes WHERE correo_hash = $1',
      [emailHash]
    );
    
    if (cliente.rows.length === 0) {
      return res.json({
        exito: true,
        mensaje: 'No se encontraron cotizaciones para este email',
        cantidad: 0,
        cotizaciones: []
      });
    }
    
    const clienteData = cliente.rows[0];
    
    // Obtener cotizaciones del cliente
    const cotizaciones = await ejecutarQuery(
      `SELECT 
        c.id, c.codigo_unico, c.codigo_ticket, c.fecha_emision,
        c.fecha_validez, c.precio_total, c.margen_aplicado,
        c.estado, c.fecha_reclamacion,
        COUNT(dc.id) as cantidad_componentes
      FROM cotizaciones c
      LEFT JOIN detalle_cotizacion dc ON c.id = dc.id_cotizacion
      WHERE c.id_cliente = $1
      GROUP BY c.id
      ORDER BY c.fecha_emision DESC`,
      [clienteData.id]
    );
    
    res.json({
      exito: true,
      cliente: {
        nombre: clienteData.nombre,
        email: validacionEmail.email
      },
      cantidad: cotizaciones.rows.length,
      cotizaciones: cotizaciones.rows.map(c => ({
        id: c.id,
        codigo_unico: c.codigo_unico,
        codigo_ticket: c.codigo_ticket,
        fecha_emision: c.fecha_emision,
        fecha_validez: c.fecha_validez,
        precio_total: parseFloat(c.precio_total),
        margen_aplicado: parseFloat(c.margen_aplicado),
        estado: c.estado,
        fecha_reclamacion: c.fecha_reclamacion,
        cantidad_componentes: parseInt(c.cantidad_componentes)
      }))
    });
  } catch (error) {
    console.error('Error al consultar historial:', error);
    
    res.status(500).json({
      error: 'Error al consultar historial',
      mensaje: 'No se pudo recuperar el historial de cotizaciones'
    });
  }
}

module.exports = {
  crearCotizacion,
  consultarCotizacion,
  validarCotizacion,
  marcarComoReclamada,
  consultarHistorialCliente,
  // Exportar funciones auxiliares para testing
  obtenerMargenGanancia,
  generarCodigoTicket,
  buscarOCrearCliente,
  calcularPrecioTotal
};
