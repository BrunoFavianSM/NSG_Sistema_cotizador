/**
 * Servicio de API
 * 
 * Cliente Axios configurado para comunicación con el backend
 * Incluye manejo de tokens JWT, errores y funciones para todos los endpoints
 * 
 * Valida Requisitos: 14.2
 */

import axios from 'axios';

// Configuración base de Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 300000);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de solicitudes - Agregar token JWT si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas - Manejo centralizado de errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejo de errores de red
    if (!error.response) {
      console.error('Error de red:', error.message);
      return Promise.reject({
        error: 'Error de conexión',
        mensaje: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      });
    }

    // Manejo de errores HTTP
    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Token inválido o expirado
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        break;
      case 403:
        console.error('Acceso prohibido');
        break;
      case 404:
        console.error('Recurso no encontrado');
        break;
      case 429:
        console.error('Demasiadas solicitudes');
        break;
      case 500:
        console.error('Error interno del servidor');
        break;
      default:
        console.error(`Error ${status}:`, data);
    }

    return Promise.reject(data || error);
  }
);

// ============================================
// FUNCIONES DE AUTENTICACI�"N
// ============================================

/**
 * Inicia sesión de administrador
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<{exito: boolean, token?: string, usuario?: Object, error?: string}>}
 */
export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    
    // Guardar token y usuario en localStorage
    if (response.data.exito && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verifica si el token actual es válido
 * @returns {Promise<{valido: boolean, usuario?: Object}>}
 */
export const verificarToken = async () => {
  try {
    const response = await api.post('/auth/verificar');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cierra sesión del usuario
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/login';
};

/**
 * Obtiene el usuario actual desde localStorage
 * @returns {Object|null}
 */
export const obtenerUsuarioActual = () => {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
export const estaAutenticado = () => {
  return !!localStorage.getItem('token');
};

// ============================================
// FUNCIONES DE PRODUCTOS
// ============================================

/**
 * Obtiene todos los productos con filtros opcionales
 * @param {Object} filtros - Filtros de búsqueda (categoria, marca, busqueda, etc.)
 * @returns {Promise<Array>}
 */
export const obtenerProductos = async (filtros = {}) => {
  try {
    const response = await api.get('/productos', { params: filtros });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene un producto por su ID
 * @param {number} id - ID del producto
 * @returns {Promise<Object>}
 */
export const obtenerProductoPorId = async (categoria, id) => {
  try {
    if (id === undefined) {
      throw new Error('Debe enviar categoria e id para obtenerProductoPorId');
    }
    const response = await api.get(`/productos/${categoria}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Crea un nuevo producto (requiere autenticación)
 * @param {Object} producto - Datos del producto
 * @returns {Promise<Object>}
 */
export const crearProducto = async (producto) => {
  try {
    const response = await api.post('/productos', producto);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Actualiza un producto existente (requiere autenticación)
 * @param {number} id - ID del producto
 * @param {Object} producto - Datos actualizados del producto
 * @returns {Promise<Object>}
 */
export const actualizarProducto = async (categoria, id, producto) => {
  try {
    if (producto === undefined) {
      throw new Error('Debe enviar categoria, id y producto para actualizarProducto');
    }
    const response = await api.put(`/productos/${categoria}/${id}`, producto);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Elimina un producto (requiere autenticación)
 * @param {number} id - ID del producto
 * @returns {Promise<Object>}
 */
export const eliminarProducto = async (categoria, id) => {
  try {
    if (id === undefined) {
      throw new Error('Debe enviar categoria e id para eliminarProducto');
    }
    const response = await api.delete(`/productos/${categoria}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


// ============================================
// FUNCIONES DE PRODUCTOS — MULTI-TABLA
// ============================================

/**
 * Obtiene productos de una categoría específica (tabla nueva)
 * @param {string} categoria - Categoría normalizada (e.g. 'procesador', 'mouse')
 * @param {Object} filtros - Filtros adicionales (socket, marca, etc.)
 * @returns {Promise<{exito:boolean, cantidad:number, productos:Array}>}
 */
export const obtenerProductosPorCategoria = async (categoria, filtros = {}) => {
  try {
    const response = await api.get('/productos', {
      params: { categoria, ...filtros }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Sube imagen de producto (requiere autenticación)
 * @param {string} categoria - Categoría del producto
 * @param {number} id - ID del producto
 * @param {File} archivo - Archivo de imagen (JPEG, PNG, WebP)
 * @returns {Promise<Object>}
 */
export const subirImagenProducto = async (categoria, id, archivo) => {
  try {
    const formData = new FormData();
    formData.append('imagen', archivo);
    const response = await api.post(`/productos/${categoria}/${id}/imagen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Limpia todo el catálogo de productos (requiere autenticación)
 * Elimina todos los registros de las 23 tablas de productos.
 * @returns {Promise<Object>}
 */
export const limpiarCatalogo = async () => {
  try {
    const response = await api.delete('/productos/limpiar');
    return response.data;
  } catch (error) {
    throw error;
  }
};


/**
 * Importa catálogo de productos desde archivo CSV
 * @param {File} archivo - Archivo .csv
 * @returns {Promise<{exito:boolean, insertados:number, actualizados:number, omitidos:number, errores:number, detalle_errores:Array}>}
 */
export const importarCSV = async (archivo) => {
  try {
    const formData = new FormData();
    formData.append('archivo', archivo);
    const response = await api.post('/importacion/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000 // 2 minutos para archivos grandes
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// FUNCIONES DE COTIZACIONES
// ============================================

/**
 * Crea una nueva cotización
 * @param {Object} cotizacion - Datos de la cotización
 * @returns {Promise<Object>}
 */
export const crearCotizacion = async (cotizacion) => {
  try {
    const response = await api.post('/cotizaciones', cotizacion);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Consulta una cotización por código de ticket
 * @param {string} codigoTicket - Código del ticket
 * @returns {Promise<Object>}
 */
export const consultarCotizacion = async (codigoTicket) => {
  try {
    const response = await api.get(`/cotizaciones/${codigoTicket}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Valida una cotización con comparación de precios
 * @param {string} codigoTicket - Código del ticket
 * @returns {Promise<Object>}
 */
export const validarCotizacion = async (codigoTicket) => {
  try {
    const response = await api.get(`/cotizaciones/${codigoTicket}/validar`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Marca una cotización como reclamada
 * @param {string} codigoTicket - Código del ticket
 * @returns {Promise<Object>}
 */
export const marcarComoReclamada = async (codigoTicket) => {
  try {
    const response = await api.put(`/cotizaciones/${codigoTicket}/reclamar`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Consulta el historial de cotizaciones de un cliente
 * @param {string} email - Email del cliente
 * @returns {Promise<Array>}
 */
export const consultarHistorialCliente = async (email) => {
  try {
    const response = await api.get(`/cotizaciones/cliente/${email}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lista todos los clientes registrados con cotizaciones (requiere auth)
 * @returns {Promise<{exito: boolean, clientes: Array}>}
 */
export const listarClientesRegistrados = async () => {
  try {
    const response = await api.get('/cotizaciones/clientes');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene URL de descarga del PDF comercial
 * @param {string} codigoTicket
 * @returns {string}
 */
export const obtenerUrlPdfCotizacion = (codigoTicket, moneda = 'USD') => {
  const params = new URLSearchParams({ moneda: String(moneda || 'USD').toUpperCase() });
  return `${API_BASE_URL}/cotizaciones/${codigoTicket}/pdf?${params.toString()}`;
};

/**
 * Obtiene URL de descarga del PDF tecnico
 * @param {string} codigoTicket
 * @returns {string}
 */
export const obtenerUrlPdfTecnico = (codigoTicket, moneda = 'USD') => {
  const params = new URLSearchParams({ moneda: String(moneda || 'USD').toUpperCase() });
  return `${API_BASE_URL}/cotizaciones/${codigoTicket}/pdf-tecnico?${params.toString()}`;
};

/**
 * Notifica por email que el equipo esta listo para recojo
 * @param {string} codigoTicket
 * @returns {Promise<Object>}
 */
export const notificarCotizacionLista = async (codigoTicket) => {
  try {
    const response = await api.post(`/cotizaciones/${codigoTicket}/notificar-listo`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Descarga PDF comercial de cotizacion
 * @param {string} codigoTicket
 */
export const descargarPdfCotizacion = async (codigoTicket, moneda = 'USD') => {
  const response = await api.get(`/cotizaciones/${codigoTicket}/pdf`, {
    params: { moneda: String(moneda || 'USD').toUpperCase() },
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Descarga PDF tecnico de cotizacion
 * @param {string} codigoTicket
 */
export const descargarPdfTecnico = async (codigoTicket, moneda = 'USD') => {
  const response = await api.get(`/cotizaciones/${codigoTicket}/pdf-tecnico`, {
    params: { moneda: String(moneda || 'USD').toUpperCase() },
    responseType: 'blob'
  });
  return response.data;
};

// ============================================
// FUNCIONES DE CONFIGURACION
// ============================================

/**
 * Obtiene margen de ganancia configurado
 * @returns {Promise<{exito:boolean,margen_ganancia:number}>}
 */
export const obtenerMargenGanancia = async () => {
  try {
    const response = await api.get('/configuracion/margen');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Actualiza margen de ganancia (admin)
 * @param {number} margen_ganancia
 * @param {number} tasa_igv
 * @param {number} tipo_cambio_usd_pen
 * @returns {Promise<Object>}
 */
export const actualizarMargenGanancia = async (margen_ganancia, tasa_igv, tipo_cambio_usd_pen) => {
  try {
    const payload = { margen_ganancia_default: margen_ganancia };
    if (typeof tasa_igv === 'number') payload.tasa_igv = tasa_igv;
    if (typeof tipo_cambio_usd_pen === 'number') payload.tipo_cambio_usd_pen = tipo_cambio_usd_pen;
    const response = await api.put('/configuracion/margen', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene la configuración completa del sistema en una sola petición.
 * Incluye margen de ganancia, tasa IGV, tipo de cambio manual y modo activo.
 * Requisitos: 9.2
 *
 * @returns {Promise<{
 *   exito: boolean,
 *   margen_ganancia: number,
 *   margen_ganancia_default: number,
 *   tasa_igv: number,
 *   tipo_cambio_usd_pen: number,
 *   modo_tipo_cambio: "manual" | "automatico",
 *   updated_at: string | null
 * }>}
 */
export const obtenerConfiguracion = async () => {
  try {
    const response = await api.get('/configuracion/margen');
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudo obtener la configuración del sistema.';
    throw { mensaje };
  }
};

/**
 * Obtiene el tipo de cambio USD/PEN automático desde el proxy backend.
 * Requiere token JWT. El token de la API externa nunca se expone al cliente.
 * Requisitos: 9.1
 *
 * @returns {Promise<{ exito: boolean, tipo_cambio: number, fuente: string, fecha: string }>}
 */
export const obtenerTipoCambioAutomatico = async () => {
  try {
    const response = await api.get('/tipo-cambio/automatico');
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudo obtener el tipo de cambio automático.';
    throw { mensaje };
  }
};

/**
 * Actualiza el modo de tipo de cambio activo (manual o automático).
 * Requiere token JWT de administrador.
 * Requisitos: 9.3
 *
 * @param {"manual" | "automatico"} modo
 * @returns {Promise<{ exito: boolean, modo_tipo_cambio: string, mensaje: string }>}
 */
export const actualizarModoTipoCambio = async (modo) => {
  try {
    const response = await api.put('/configuracion/tipo-cambio', { modo });
    return response.data;
  } catch (error) {
    const mensaje =
      error?.mensaje ||
      error?.response?.data?.mensaje ||
      'No se pudo actualizar el modo de tipo de cambio.';
    throw { mensaje };
  }
};

// ============================================
// FUNCIONES DE COMPATIBILIDAD
// ============================================

/**
 * Valida la compatibilidad entre componentes seleccionados
 * @param {Object} componentes - Objeto con los componentes seleccionados
 * @returns {Promise<{compatible: boolean, errores: Array, advertencias: Array}>}
 */
export const validarCompatibilidad = async (componentes) => {
  try {
    const response = await api.post('/compatibilidad/validar', { componentes });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// FUNCIONES DE INTELIGENCIA ARTIFICIAL
// ============================================

/**
 * Inicia una nueva conversación con el asistente IA
 * @param {string} mensajeInicial - Mensaje inicial del cliente
 * @returns {Promise<{sesionId: string, pregunta: string, contexto: Object}>}
 */
export const iniciarConversacionIA = async (mensajeInicial) => {
  try {
    const response = await api.post('/ia/iniciar', { mensajeInicial });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Continúa una conversación existente con el asistente IA
 * @param {string} sesionId - ID de la sesión
 * @param {string} respuestaCliente - Respuesta del cliente
 * @returns {Promise<{completado: boolean, pregunta?: string, recomendacion?: Object}>}
 */
export const continuarConversacionIA = async (sesionId, respuestaCliente) => {
  try {
    const response = await api.post('/ia/continuar', { sesionId, respuestaCliente });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene estadísticas de uso de IA
 * @returns {Promise<Object>}
 */
export const obtenerEstadisticasIA = async () => {
  try {
    const response = await api.get('/ia/estadisticas');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Verifica el estado de salud del servidor
 * @returns {Promise<{estado: string, baseDatos: string}>}
 */
export const verificarSalud = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Exportar instancia de axios configurada para casos especiales
export default api;

