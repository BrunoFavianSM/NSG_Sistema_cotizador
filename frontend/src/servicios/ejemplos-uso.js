/**
 * Ejemplos de uso del servicio de API
 * 
 * Este archivo muestra cómo usar las funciones del servicio de API
 * en diferentes escenarios comunes.
 */

import {
  // Autenticación
  login,
  logout,
  verificarToken,
  estaAutenticado,
  obtenerUsuarioActual,
  
  // Productos
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  
  // Cotizaciones
  crearCotizacion,
  consultarCotizacion,
  validarCotizacion,
  marcarComoReclamada,
  consultarHistorialCliente,
  
  // Compatibilidad
  validarCompatibilidad,
  
  // IA
  iniciarConversacionIA,
  continuarConversacionIA,
  obtenerEstadisticasIA,
  
  // Auxiliares
  verificarSalud
} from './api';

// ============================================
// EJEMPLO 1: Autenticación de Administrador
// ============================================

export const ejemploLogin = async () => {
  try {
    const resultado = await login('admin', 'password123');
    
    if (resultado.exito) {
      console.log('Login exitoso:', resultado.usuario);
      console.log('Token guardado automáticamente');
    } else {
      console.error('Login fallido:', resultado.error);
    }
  } catch (error) {
    console.error('Error en login:', error);
  }
};

export const ejemploVerificarSesion = async () => {
  // Verificar si hay sesión activa
  if (estaAutenticado()) {
    const usuario = obtenerUsuarioActual();
    console.log('Usuario actual:', usuario);
    
    // Verificar token con el servidor
    try {
      const resultado = await verificarToken();
      console.log('Token válido:', resultado.valido);
    } catch (error) {
      console.error('Token inválido, redirigiendo a login...');
    }
  } else {
    console.log('No hay sesión activa');
  }
};

// ============================================
// EJEMPLO 2: Gestión de Productos
// ============================================

export const ejemploListarProductos = async () => {
  try {
    // Obtener todos los productos
    const todosLosProductos = await obtenerProductos();
    console.log('Todos los productos:', todosLosProductos);
    
    // Filtrar por categoría
    const procesadores = await obtenerProductos({ categoria: 'procesadores' });
    console.log('Procesadores:', procesadores);
    
    // Buscar por texto
    const resultadosBusqueda = await obtenerProductos({ busqueda: 'Intel' });
    console.log('Búsqueda "Intel":', resultadosBusqueda);
  } catch (error) {
    console.error('Error al listar productos:', error);
  }
};

export const ejemploGestionarProducto = async () => {
  try {
    // Crear nuevo producto (requiere autenticación)
    const nuevoProducto = await crearProducto({
      nombre: 'Intel Core i9-13900K',
      categoria: 'procesadores',
      marca: 'Intel',
      precio: 589.99,
      stock: 10,
      especificaciones: {
        nucleos: 24,
        frecuencia: '3.0 GHz',
        socket: 'LGA1700'
      }
    });
    console.log('Producto creado:', nuevoProducto);
    
    // Actualizar producto
    const productoActualizado = await actualizarProducto(nuevoProducto.id, {
      precio: 549.99,
      stock: 15
    });
    console.log('Producto actualizado:', productoActualizado);
    
    // Obtener producto específico
    const producto = await obtenerProductoPorId(nuevoProducto.id);
    console.log('Producto obtenido:', producto);
    
    // Eliminar producto
    await eliminarProducto(nuevoProducto.id);
    console.log('Producto eliminado');
  } catch (error) {
    console.error('Error al gestionar producto:', error);
  }
};

// ============================================
// EJEMPLO 3: Crear y Consultar Cotizaciones
// ============================================

export const ejemploCrearCotizacion = async () => {
  try {
    const cotizacion = await crearCotizacion({
      cliente: {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '987654321'
      },
      productos: [
        { id: 1, cantidad: 1 }, // Procesador
        { id: 5, cantidad: 1 }, // Motherboard
        { id: 10, cantidad: 2 } // RAM
      ],
      notas: 'Cliente prefiere componentes Intel'
    });
    
    console.log('Cotización creada:', cotizacion);
    console.log('Código de ticket:', cotizacion.codigoTicket);
    
    return cotizacion.codigoTicket;
  } catch (error) {
    console.error('Error al crear cotización:', error);
  }
};

export const ejemploConsultarCotizacion = async (codigoTicket) => {
  try {
    // Consultar cotización
    const cotizacion = await consultarCotizacion(codigoTicket);
    console.log('Cotización:', cotizacion);
    
    // Validar precios
    const validacion = await validarCotizacion(codigoTicket);
    console.log('Validación:', validacion);
    
    if (validacion.preciosActualizados) {
      console.log('Los precios han cambiado desde la cotización original');
    }
    
    // Marcar como reclamada
    await marcarComoReclamada(codigoTicket);
    console.log('Cotización marcada como reclamada');
  } catch (error) {
    console.error('Error al consultar cotización:', error);
  }
};

export const ejemploHistorialCliente = async () => {
  try {
    const historial = await consultarHistorialCliente('juan@example.com');
    console.log('Historial del cliente:', historial);
    console.log(`Total de cotizaciones: ${historial.length}`);
  } catch (error) {
    console.error('Error al consultar historial:', error);
  }
};

// ============================================
// EJEMPLO 4: Validación de Compatibilidad
// ============================================

export const ejemploValidarCompatibilidad = async () => {
  try {
    const resultado = await validarCompatibilidad({
      procesador: 1,      // Intel Core i9-13900K
      motherboard: 5,     // ASUS ROG Maximus Z790
      ram: 10,            // Corsair Vengeance DDR5
      gpu: 15,            // NVIDIA RTX 4090
      fuente: 20,         // Corsair RM1000x
      gabinete: 25        // NZXT H510
    });
    
    console.log('Compatibilidad:', resultado);
    
    if (resultado.compatible) {
      console.log('✓ Todos los componentes son compatibles');
    } else {
      console.log('✗ Problemas de compatibilidad encontrados:');
      resultado.errores.forEach(error => console.log(`  - ${error}`));
    }
    
    if (resultado.advertencias.length > 0) {
      console.log('⚠ Advertencias:');
      resultado.advertencias.forEach(adv => console.log(`  - ${adv}`));
    }
  } catch (error) {
    console.error('Error al validar compatibilidad:', error);
  }
};

// ============================================
// EJEMPLO 5: Asistente de IA
// ============================================

export const ejemploConversacionIA = async () => {
  try {
    // Iniciar conversación
    const inicio = await iniciarConversacionIA(
      'Necesito una computadora para edición de video profesional'
    );
    
    console.log('Sesión iniciada:', inicio.sesionId);
    console.log('Pregunta IA:', inicio.pregunta);
    
    // Continuar conversación
    const respuesta1 = await continuarConversacionIA(
      inicio.sesionId,
      'Mi presupuesto es de $2000 USD'
    );
    
    console.log('Pregunta IA:', respuesta1.pregunta);
    
    // Continuar hasta completar
    const respuesta2 = await continuarConversacionIA(
      inicio.sesionId,
      'Trabajo principalmente con Adobe Premiere y After Effects'
    );
    
    if (respuesta2.completado) {
      console.log('Recomendación final:', respuesta2.recomendacion);
    } else {
      console.log('Siguiente pregunta:', respuesta2.pregunta);
    }
  } catch (error) {
    console.error('Error en conversación IA:', error);
    
    // Si hay error, el sistema tiene fallback
    if (error.fallback) {
      console.log('Usando sistema de recomendación por reglas');
    }
  }
};

export const ejemploEstadisticasIA = async () => {
  try {
    const stats = await obtenerEstadisticasIA();
    console.log('Estadísticas de IA:', stats);
    console.log(`Llamadas realizadas: ${stats.llamadas}`);
    console.log(`Costo estimado: ${stats.costoEstimado}`);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
  }
};

// ============================================
// EJEMPLO 6: Verificación de Salud
// ============================================

export const ejemploVerificarSalud = async () => {
  try {
    const salud = await verificarSalud();
    console.log('Estado del servidor:', salud);
    
    if (salud.estado === 'ok' && salud.baseDatos === 'conectada') {
      console.log('✓ Servidor y base de datos funcionando correctamente');
    } else {
      console.log('✗ Problemas con el servidor o base de datos');
    }
  } catch (error) {
    console.error('Error al verificar salud:', error);
    console.log('El servidor no está disponible');
  }
};

// ============================================
// EJEMPLO 7: Flujo Completo de Usuario
// ============================================

export const ejemploFlujoCompleto = async () => {
  try {
    // 1. Verificar salud del servidor
    console.log('1. Verificando servidor...');
    await verificarSalud();
    
    // 2. Iniciar conversación con IA
    console.log('2. Iniciando asistente IA...');
    const conversacion = await iniciarConversacionIA('Necesito una PC para gaming');
    
    // 3. Responder preguntas de IA
    console.log('3. Respondiendo preguntas...');
    const respuesta = await continuarConversacionIA(
      conversacion.sesionId,
      'Presupuesto de $1500, juegos AAA en 1440p'
    );
    
    // 4. Validar compatibilidad de componentes recomendados
    if (respuesta.completado && respuesta.recomendacion) {
      console.log('4. Validando compatibilidad...');
      const validacion = await validarCompatibilidad(
        respuesta.recomendacion.componentes
      );
      
      if (validacion.compatible) {
        // 5. Crear cotización
        console.log('5. Creando cotización...');
        const cotizacion = await crearCotizacion({
          cliente: {
            nombre: 'Cliente Demo',
            email: 'demo@example.com',
            telefono: '999888777'
          },
          productos: Object.values(respuesta.recomendacion.componentes).map(id => ({
            id,
            cantidad: 1
          }))
        });
        
        console.log('✓ Flujo completado exitosamente');
        console.log('Código de ticket:', cotizacion.codigoTicket);
        
        return cotizacion;
      }
    }
  } catch (error) {
    console.error('Error en flujo completo:', error);
  }
};

// ============================================
// EJEMPLO 8: Manejo de Errores
// ============================================

export const ejemploManejoErrores = async () => {
  // Error de autenticación
  try {
    await crearProducto({ nombre: 'Test' });
  } catch (error) {
    console.error('Error 401: No autenticado');
    // El interceptor redirige automáticamente a login
  }
  
  // Error de validación
  try {
    await crearCotizacion({ cliente: {} }); // Datos incompletos
  } catch (error) {
    console.error('Error 400:', error.error);
  }
  
  // Error de recurso no encontrado
  try {
    await obtenerProductoPorId(99999);
  } catch (error) {
    console.error('Error 404: Producto no encontrado');
  }
  
  // Error de red
  try {
    // Servidor apagado
    await verificarSalud();
  } catch (error) {
    console.error('Error de conexión:', error.mensaje);
  }
};
