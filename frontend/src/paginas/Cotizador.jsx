/**
 * Página Principal de Cotización
 * 
 * Flujo secuencial de selección de componentes:
 * 1. Procesador
 * 2. Placa Madre
 * 3. RAM
 * 4. Almacenamiento
 * 5. GPU
 * 6. Fuente de Poder
 * 7. Case
 * 
 * Valida Requisitos: 4.1, 4.2, 4.3, 4.4, 13.1
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexto/AppContext';

const Cotizador = () => {
  const {
    configuracionSeleccionada,
    seleccionarComponente,
    agregarRAM,
    eliminarRAM,
    validarCompatibilidad,
    validacionCompatibilidad,
    calcularPrecioTotal,
    cargarProductos,
    productos,
    cargandoProductos
  } = useAppContext();

  // Estado del paso actual (0-6)
  const [pasoActual, setPasoActual] = useState(0);

  // Definición de pasos secuenciales
  const pasos = [
    { id: 'procesador', nombre: 'Procesador', categoria: 'procesador' },
    { id: 'placa_madre', nombre: 'Placa Madre', categoria: 'placa_madre' },
    { id: 'ram', nombre: 'RAM', categoria: 'ram' },
    { id: 'almacenamiento', nombre: 'Almacenamiento', categoria: 'almacenamiento' },
    { id: 'gpu', nombre: 'GPU', categoria: 'gpu' },
    { id: 'fuente', nombre: 'Fuente de Poder', categoria: 'fuente' },
    { id: 'case', nombre: 'Case', categoria: 'case' }
  ];

  // Cargar productos al montar
  useEffect(() => {
    cargarProductos();
  }, []);

  // Validar compatibilidad cuando cambia la configuración
  useEffect(() => {
    if (tieneComponentesSeleccionados()) {
      validarCompatibilidad();
    }
  }, [configuracionSeleccionada]);

  /**
   * Verifica si el paso actual está completo
   */
  const pasoCompleto = (indicePaso) => {
    const paso = pasos[indicePaso];
    const componente = configuracionSeleccionada[paso.id];

    if (paso.id === 'ram') {
      return componente && componente.length > 0;
    }

    return componente !== null;
  };

  /**
   * Verifica si un paso está habilitado
   * Un paso está habilitado si:
   * - Es el paso 0 (Procesador)
   * - El paso anterior está completo
   */
  const pasoHabilitado = (indicePaso) => {
    if (indicePaso === 0) return true;
    return pasoCompleto(indicePaso - 1);
  };

  /**
   * Navega al siguiente paso
   */
  const siguientePaso = () => {
    if (pasoActual < pasos.length - 1 && pasoCompleto(pasoActual)) {
      setPasoActual(pasoActual + 1);
    }
  };

  /**
   * Navega al paso anterior
   */
  const pasoAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1);
    }
  };

  /**
   * Navega directamente a un paso específico
   * Solo permitido si el paso está habilitado
   */
  const irAPaso = (indicePaso) => {
    if (pasoHabilitado(indicePaso)) {
      setPasoActual(indicePaso);
    }
  };

  /**
   * Maneja la selección de un componente
   */
  const manejarSeleccion = (producto) => {
    const pasoActualInfo = pasos[pasoActual];

    if (pasoActualInfo.id === 'ram') {
      agregarRAM(producto);
    } else {
      seleccionarComponente(pasoActualInfo.id, producto);
    }
  };

  /**
   * Obtiene productos filtrados para el paso actual
   */
  const obtenerProductosFiltrados = () => {
    const pasoActualInfo = pasos[pasoActual];
    let productosFiltrados = productos.filter(
      p => p.categoria === pasoActualInfo.categoria
    );

    // Filtrar por compatibilidad según el paso
    if (pasoActualInfo.id === 'placa_madre' && configuracionSeleccionada.procesador) {
      // Filtrar placas madre por socket del procesador
      const socketProcesador = configuracionSeleccionada.procesador.socket;
      productosFiltrados = productosFiltrados.filter(
        p => p.socket === socketProcesador
      );
    }

    return productosFiltrados;
  };

  /**
   * Verifica si hay componentes seleccionados
   */
  const tieneComponentesSeleccionados = () => {
    return Object.values(configuracionSeleccionada).some(comp => {
      if (Array.isArray(comp)) return comp.length > 0;
      return comp !== null;
    });
  };

  /**
   * Obtiene el componente seleccionado del paso actual
   */
  const obtenerSeleccionActual = () => {
    const pasoActualInfo = pasos[pasoActual];
    return configuracionSeleccionada[pasoActualInfo.id];
  };

  // Variantes de animación para Framer Motion
  const variantesContenedor = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      x: -50,
      transition: { duration: 0.2, ease: 'easeIn' }
    }
  };

  const variantesTarjeta = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    })
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cotizador de PC
          </h1>
          <p className="text-gray-600">
            Configura tu computadora paso a paso
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {pasos.map((paso, index) => (
              <div
                key={paso.id}
                className="flex flex-col items-center flex-1"
              >
                <button
                  onClick={() => irAPaso(index)}
                  disabled={!pasoHabilitado(index)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-sm transition-all duration-200
                    ${pasoActual === index
                      ? 'bg-blue-600 text-white scale-110'
                      : pasoCompleto(index)
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : pasoHabilitado(index)
                      ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {pasoCompleto(index) ? '✓' : index + 1}
                </button>
                <span className={`
                  text-xs mt-2 text-center
                  ${pasoActual === index ? 'text-blue-600 font-semibold' : 'text-gray-600'}
                `}>
                  {paso.nombre}
                </span>
                {index < pasos.length - 1 && (
                  <div className={`
                    h-1 w-full mt-5 -mx-2
                    ${pasoCompleto(index) ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenido del paso actual */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pasoActual}
            variants={variantesContenedor}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {pasos[pasoActual].nombre}
            </h2>

            {/* Mensajes de compatibilidad */}
            {validacionCompatibilidad.errores.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-red-800 font-semibold mb-2">
                  ⚠️ Problemas de compatibilidad:
                </h3>
                <ul className="list-disc list-inside text-red-700 text-sm">
                  {validacionCompatibilidad.errores.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validacionCompatibilidad.advertencias.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-yellow-800 font-semibold mb-2">
                  ℹ️ Advertencias:
                </h3>
                <ul className="list-disc list-inside text-yellow-700 text-sm">
                  {validacionCompatibilidad.advertencias.map((adv, i) => (
                    <li key={i}>{adv}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Selección actual */}
            {obtenerSeleccionActual() && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-blue-800 font-semibold mb-2">
                  Selección actual:
                </h3>
                {pasos[pasoActual].id === 'ram' ? (
                  <div className="space-y-2">
                    {obtenerSeleccionActual().map((ram, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-blue-700">{ram.nombre}</span>
                        <button
                          onClick={() => eliminarRAM(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-blue-700">
                    {obtenerSeleccionActual().nombre}
                  </p>
                )}
              </div>
            )}

            {/* Lista de productos */}
            {cargandoProductos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Cargando productos...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {obtenerProductosFiltrados().map((producto, index) => (
                  <motion.div
                    key={producto.id}
                    custom={index}
                    variants={variantesTarjeta}
                    initial="hidden"
                    animate="visible"
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-all
                      hover:shadow-lg hover:border-blue-500
                      ${obtenerSeleccionActual()?.id === producto.id ||
                        (Array.isArray(obtenerSeleccionActual()) &&
                          obtenerSeleccionActual().some(r => r.id === producto.id))
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                      }
                    `}
                    onClick={() => manejarSeleccion(producto)}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {producto.nombre}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {producto.descripcion_tecnica?.substring(0, 100)}...
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">
                        S/ {parseFloat(producto.precio_base).toFixed(2)}
                      </span>
                      <span className={`
                        text-xs px-2 py-1 rounded
                        ${producto.stock > 0
                          ? 'bg-green-100 text-green-800'
                          : producto.disponible_a_pedido
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }
                      `}>
                        {producto.stock > 0
                          ? `Stock: ${producto.stock}`
                          : producto.disponible_a_pedido
                          ? 'A pedido'
                          : 'Sin stock'
                        }
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {obtenerProductosFiltrados().length === 0 && !cargandoProductos && (
              <div className="text-center py-8 text-gray-500">
                No hay productos disponibles para esta categoría
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Botones de navegación */}
        <div className="flex justify-between items-center">
          <button
            onClick={pasoAnterior}
            disabled={pasoActual === 0}
            className={`
              px-6 py-3 rounded-lg font-semibold transition-all
              ${pasoActual === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
              }
            `}
          >
            ← Anterior
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Precio total estimado</p>
            <p className="text-2xl font-bold text-green-600">
              S/ {calcularPrecioTotal().toFixed(2)}
            </p>
          </div>

          <button
            onClick={siguientePaso}
            disabled={!pasoCompleto(pasoActual) || pasoActual === pasos.length - 1}
            className={`
              px-6 py-3 rounded-lg font-semibold transition-all
              ${!pasoCompleto(pasoActual) || pasoActual === pasos.length - 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            Siguiente →
          </button>
        </div>

        {/* Botón de finalizar */}
        {pasoActual === pasos.length - 1 && pasoCompleto(pasoActual) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <button
              className="px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-all shadow-lg"
            >
              Generar Cotización
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Cotizador;
