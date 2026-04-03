/**
 * Contexto Global de Aplicación
 * 
 * Gestiona el estado global de la aplicación:
 * - Autenticación (usuario, token, login/logout)
 * - Productos disponibles
 * - Configuración seleccionada (componentes del cotizador)
 * - Margen de ganancia
 * 
 * Valida Requisitos: 14.2
 */

import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../servicios/api';

// Crear contexto
const AppContext = createContext();

// Hook personalizado para usar el contexto
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe usarse dentro de AppProvider');
  }
  return context;
};

// Provider del contexto
export const AppProvider = ({ children, value: overrideValue }) => {
  // If override value provided (for testing), use it directly
  if (overrideValue) {
    return (
      <AppContext.Provider value={overrideValue}>
        {children}
      </AppContext.Provider>
    );
  }
  return <AppProviderInternal>{children}</AppProviderInternal>;
};

// Internal provider with all state logic
const AppProviderInternal = ({ children }) => {
  // ============================================
  // ESTADO DE AUTENTICACIÓN
  // ============================================
  const [usuario, setUsuario] = useState(null);
  const [autenticado, setAutenticado] = useState(false);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  // ============================================
  // ESTADO DE PRODUCTOS
  // ============================================
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errorProductos, setErrorProductos] = useState(null);

  // ============================================
  // ESTADO DE CONFIGURACIÓN SELECCIONADA
  // ============================================
  const [configuracionSeleccionada, setConfiguracionSeleccionada] = useState({
    procesador: null,
    placa_madre: null,
    ram: [],
    almacenamiento: null,
    gpu: null,
    fuente: null,
    case: null
  });

  // ============================================
  // ESTADO DE MARGEN DE GANANCIA
  // ============================================
  const [margenGanancia, setMargenGanancia] = useState(20);

  // ============================================
  // ESTADO DE COMPATIBILIDAD
  // ============================================
  const [validacionCompatibilidad, setValidacionCompatibilidad] = useState({
    compatible: true,
    errores: [],
    advertencias: []
  });

  // ============================================
  // INICIALIZACIÓN: Verificar autenticación
  // ============================================
  useEffect(() => {
    verificarAutenticacion();
  }, []);

  const verificarAutenticacion = async () => {
    try {
      const usuarioGuardado = api.obtenerUsuarioActual();
      const token = localStorage.getItem('token');

      if (usuarioGuardado && token) {
        // Verificar que el token sea válido
        const resultado = await api.verificarToken();
        if (resultado.valido) {
          setUsuario(usuarioGuardado);
          setAutenticado(true);
        } else {
          // Token inválido, limpiar
          api.logout();
          setUsuario(null);
          setAutenticado(false);
        }
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      setUsuario(null);
      setAutenticado(false);
    } finally {
      setCargandoAuth(false);
    }
  };

  // ============================================
  // FUNCIONES DE AUTENTICACIÓN
  // ============================================

  /**
   * Inicia sesión de administrador
   */
  const login = async (username, password) => {
    try {
      const resultado = await api.login(username, password);
      
      if (resultado.exito) {
        setUsuario(resultado.usuario);
        setAutenticado(true);
        return { exito: true };
      } else {
        return { exito: false, error: resultado.error };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        exito: false, 
        error: error.mensaje || 'Error al iniciar sesión' 
      };
    }
  };

  /**
   * Cierra sesión del usuario
   */
  const logout = () => {
    api.logout();
    setUsuario(null);
    setAutenticado(false);
  };

  // ============================================
  // FUNCIONES DE PRODUCTOS
  // ============================================

  /**
   * Carga todos los productos disponibles
   */
  const cargarProductos = async (filtros = {}) => {
    setCargandoProductos(true);
    setErrorProductos(null);
    
    try {
      const data = await api.obtenerProductos(filtros);
      // Backend returns { exito, cantidad, productos: [...] }
      const productosObtenidos = Array.isArray(data) ? data : (data.productos || []);
      setProductos(productosObtenidos);
      return productosObtenidos;
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setErrorProductos(error.mensaje || 'Error al cargar productos');
      return [];
    } finally {
      setCargandoProductos(false);
    }
  };

  /**
   * Obtiene productos por categoría
   */
  const obtenerProductosPorCategoria = (categoria) => {
    return productos.filter(p => p.categoria === categoria);
  };

  /**
   * Obtiene productos disponibles (con stock o a pedido)
   */
  const obtenerProductosDisponibles = () => {
    return productos.filter(p => p.stock > 0 || p.disponible_a_pedido);
  };

  /**
   * Refresca un producto específico
   */
  const refrescarProducto = async (id) => {
    try {
      const producto = await api.obtenerProductoPorId(id);
      setProductos(prev => 
        prev.map(p => p.id === id ? producto : p)
      );
      return producto;
    } catch (error) {
      console.error('Error al refrescar producto:', error);
      return null;
    }
  };

  // ============================================
  // FUNCIONES DE CONFIGURACIÓN SELECCIONADA
  // ============================================

  /**
   * Selecciona un componente en la configuración
   */
  const seleccionarComponente = (categoria, producto) => {
    setConfiguracionSeleccionada(prev => ({
      ...prev,
      [categoria]: producto
    }));
  };

  /**
   * Agrega RAM a la configuración (puede ser múltiple)
   */
  const agregarRAM = (producto) => {
    setConfiguracionSeleccionada(prev => ({
      ...prev,
      ram: [...prev.ram, producto]
    }));
  };

  /**
   * Elimina una RAM específica
   */
  const eliminarRAM = (index) => {
    setConfiguracionSeleccionada(prev => ({
      ...prev,
      ram: prev.ram.filter((_, i) => i !== index)
    }));
  };

  /**
   * Limpia la configuración completa
   */
  const limpiarConfiguracion = () => {
    setConfiguracionSeleccionada({
      procesador: null,
      placa_madre: null,
      ram: [],
      almacenamiento: null,
      gpu: null,
      fuente: null,
      case: null
    });
    setValidacionCompatibilidad({
      compatible: true,
      errores: [],
      advertencias: []
    });
  };

  /**
   * Aplica una configuración completa (desde IA o historial)
   */
  const aplicarConfiguracion = (configuracion) => {
    setConfiguracionSeleccionada(configuracion);
  };

  /**
   * Verifica si la configuración está completa
   */
  const configuracionCompleta = () => {
    const { procesador, placa_madre, ram, almacenamiento, gpu, fuente, case: casePC } = configuracionSeleccionada;
    return !!(procesador && placa_madre && ram.length > 0 && almacenamiento && gpu && fuente && casePC);
  };

  /**
   * Calcula el precio total de la configuración
   */
  const calcularPrecioTotal = () => {
    let total = 0;
    
    // Sumar componentes individuales
    if (configuracionSeleccionada.procesador) total += parseFloat(configuracionSeleccionada.procesador.precio_base);
    if (configuracionSeleccionada.placa_madre) total += parseFloat(configuracionSeleccionada.placa_madre.precio_base);
    if (configuracionSeleccionada.almacenamiento) total += parseFloat(configuracionSeleccionada.almacenamiento.precio_base);
    if (configuracionSeleccionada.gpu) total += parseFloat(configuracionSeleccionada.gpu.precio_base);
    if (configuracionSeleccionada.fuente) total += parseFloat(configuracionSeleccionada.fuente.precio_base);
    if (configuracionSeleccionada.case) total += parseFloat(configuracionSeleccionada.case.precio_base);
    
    // Sumar RAM (puede ser múltiple)
    configuracionSeleccionada.ram.forEach(ram => {
      total += parseFloat(ram.precio_base);
    });

    // Aplicar margen de ganancia
    const totalConMargen = total * (1 + margenGanancia / 100);
    
    return totalConMargen;
  };

  // ============================================
  // FUNCIONES DE COMPATIBILIDAD
  // ============================================

  /**
   * Valida la compatibilidad de la configuración actual
   */
  const validarCompatibilidad = async () => {
    try {
      const resultado = await api.validarCompatibilidad(configuracionSeleccionada);
      setValidacionCompatibilidad(resultado);
      return resultado;
    } catch (error) {
      console.error('Error al validar compatibilidad:', error);
      return {
        compatible: false,
        errores: ['Error al validar compatibilidad'],
        advertencias: []
      };
    }
  };

  // ============================================
  // FUNCIONES DE MARGEN DE GANANCIA
  // ============================================

  /**
   * Actualiza el margen de ganancia
   */
  const actualizarMargen = (nuevoMargen) => {
    setMargenGanancia(nuevoMargen);
  };

  // ============================================
  // VALOR DEL CONTEXTO
  // ============================================
  const value = {
    // Autenticación
    usuario,
    autenticado,
    cargandoAuth,
    login,
    logout,
    verificarAutenticacion,

    // Productos
    productos,
    cargandoProductos,
    errorProductos,
    cargarProductos,
    obtenerProductosPorCategoria,
    obtenerProductosDisponibles,
    refrescarProducto,

    // Configuración seleccionada
    configuracionSeleccionada,
    seleccionarComponente,
    agregarRAM,
    eliminarRAM,
    limpiarConfiguracion,
    aplicarConfiguracion,
    configuracionCompleta,
    calcularPrecioTotal,

    // Compatibilidad
    validacionCompatibilidad,
    validarCompatibilidad,

    // Margen de ganancia
    margenGanancia,
    actualizarMargen
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
