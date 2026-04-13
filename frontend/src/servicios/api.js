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

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
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
export const obtenerProductoPorId = async (id) => {
  try {
    const response = await api.get(`/productos/${id}`);
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
export const actualizarProducto = async (id, producto) => {
  try {
    const response = await api.put(`/productos/${id}`, producto);
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
export const eliminarProducto = async (id) => {
  try {
    const response = await api.delete(`/productos/${id}`);
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

