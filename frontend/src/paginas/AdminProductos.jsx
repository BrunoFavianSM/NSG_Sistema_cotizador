/**
 * Página de Administración de Productos
 * Valida Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';

const CATEGORIAS = ['procesador', 'placa_madre', 'ram', 'almacenamiento', 'gpu', 'fuente', 'case'];
const RAM_TYPES = ['DDR4', 'DDR5'];
const FORM_FACTORS = ['ATX', 'Micro-ATX', 'Mini-ITX'];

const AdminProductos = () => {
  const { autenticado } = useAppContext();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [productoEliminar, setProductoEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre: '', categoria: 'procesador', socket: '', ram_type: '',
    form_factor: '', wattage: '', tdp: '', precio_base: '',
    stock: '', disponible_a_pedido: false, tiempo_entrega_dias: '',
    descripcion_tecnica: '', imagen_url: ''
  });

  useEffect(() => {
    if (autenticado) cargarProductos();
  }, [autenticado]);

  const cargarProductos = async () => {
    setCargando(true);
    setError('');
    try {
      const data = await api.obtenerProductos();
      setProductos(data.productos || data);
    } catch (err) {
      setError('Error al cargar productos');
    } finally {
      setCargando(false);
    }
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setProductoEditando(null);
    setFormulario({
      nombre: '', categoria: 'procesador', socket: '', ram_type: '',
      form_factor: '', wattage: '', tdp: '', precio_base: '',
      stock: '', disponible_a_pedido: false, tiempo_entrega_dias: '',
      descripcion_tecnica: '', imagen_url: ''
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (producto) => {
    setModoEdicion(true);
    setProductoEditando(producto);
    setFormulario({
      nombre: producto.nombre || '',
      categoria: producto.categoria || 'procesador',
      socket: producto.socket || '',
      ram_type: producto.ram_type || '',
      form_factor: producto.form_factor || '',
      wattage: producto.wattage || '',
      tdp: producto.tdp || '',
      precio_base: producto.precio_base || '',
      stock: producto.stock || '',
      disponible_a_pedido: producto.disponible_a_pedido || false,
      tiempo_entrega_dias: producto.tiempo_entrega_dias || '',
      descripcion_tecnica: producto.descripcion_tecnica || '',
      imagen_url: producto.imagen_url || ''
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setProductoEditando(null);
  };

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');

    try {
      const datos = { ...formulario };
      if (datos.precio_base) datos.precio_base = parseFloat(datos.precio_base);
      if (datos.stock) datos.stock = parseInt(datos.stock);
      if (datos.wattage) datos.wattage = parseInt(datos.wattage);
      if (datos.tdp) datos.tdp = parseInt(datos.tdp);
      if (datos.tiempo_entrega_dias) datos.tiempo_entrega_dias = parseInt(datos.tiempo_entrega_dias);

      if (modoEdicion) {
        await api.actualizarProducto(productoEditando.id, datos);
      } else {
        await api.crearProducto(datos);
      }

      await cargarProductos();
      cerrarModal();
    } catch (err) {
      setError(err.mensaje || 'Error al guardar producto');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = (producto) => {
    setProductoEliminar(producto);
    setModalEliminar(true);
  };

  const eliminarProducto = async () => {
    if (!productoEliminar) return;
    setGuardando(true);
    try {
      await api.eliminarProducto(productoEliminar.id);
      await cargarProductos();
      setModalEliminar(false);
      setProductoEliminar(null);
    } catch (err) {
      setError(err.mensaje || 'Error al eliminar producto');
    } finally {
      setGuardando(false);
    }
  };

  const productosFiltrados = productos.filter(p => {
    const matchCategoria = !filtroCategoria || p.categoria === filtroCategoria;
    const matchBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  const mostrarCampoCondicional = (campo) => {
    const { categoria } = formulario;
    if (campo === 'socket') return ['procesador', 'placa_madre'].includes(categoria);
    if (campo === 'ram_type') return ['ram', 'placa_madre'].includes(categoria);
    if (campo === 'form_factor') return ['placa_madre', 'case'].includes(categoria);
    if (campo === 'wattage') return categoria === 'fuente';
    if (campo === 'tdp') return ['procesador', 'gpu'].includes(categoria);
    return false;
  };

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
          <p className="text-gray-600 mt-2">Debes iniciar sesión para acceder</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={abrirModalCrear}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + Nuevo Producto
            </motion.button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {cargando ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando productos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">A Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productosFiltrados.map((producto) => (
                    <motion.tr
                      key={producto.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{producto.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {producto.categoria.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        S/ {parseFloat(producto.precio_base).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded ${producto.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {producto.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {producto.disponible_a_pedido ? (
                          <span className="text-orange-600">Sí ({producto.tiempo_entrega_dias}d)</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => abrirModalEditar(producto)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => confirmarEliminar(producto)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {productosFiltrados.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No se encontraron productos
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalAbierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={cerrarModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            >
              <h2 className="text-2xl font-bold mb-4">
                {modoEdicion ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <form onSubmit={manejarSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                  <select
                    name="categoria"
                    value={formulario.categoria}
                    onChange={manejarCambio}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {mostrarCampoCondicional('socket') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Socket</label>
                    <input
                      type="text"
                      name="socket"
                      value={formulario.socket}
                      onChange={manejarCambio}
                      placeholder="Ej: AM5, LGA1700"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {mostrarCampoCondicional('ram_type') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de RAM</label>
                    <select
                      name="ram_type"
                      value={formulario.ram_type}
                      onChange={manejarCambio}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {RAM_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}

                {mostrarCampoCondicional('form_factor') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Form Factor</label>
                    <select
                      name="form_factor"
                      value={formulario.form_factor}
                      onChange={manejarCambio}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {FORM_FACTORS.map(ff => (
                        <option key={ff} value={ff}>{ff}</option>
                      ))}
                    </select>
                  </div>
                )}

                {mostrarCampoCondicional('wattage') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Potencia (W)</label>
                    <input
                      type="number"
                      name="wattage"
                      value={formulario.wattage}
                      onChange={manejarCambio}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {mostrarCampoCondicional('tdp') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TDP (W)</label>
                    <input
                      type="number"
                      name="tdp"
                      value={formulario.tdp}
                      onChange={manejarCambio}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="precio_base"
                      value={formulario.precio_base}
                      onChange={manejarCambio}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formulario.stock}
                      onChange={manejarCambio}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="disponible_a_pedido"
                    checked={formulario.disponible_a_pedido}
                    onChange={manejarCambio}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Disponible a pedido</label>
                </div>

                {formulario.disponible_a_pedido && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de entrega (días)</label>
                    <input
                      type="number"
                      name="tiempo_entrega_dias"
                      value={formulario.tiempo_entrega_dias}
                      onChange={manejarCambio}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Técnica</label>
                  <textarea
                    name="descripcion_tecnica"
                    value={formulario.descripcion_tecnica}
                    onChange={manejarCambio}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                  <input
                    type="text"
                    name="imagen_url"
                    value={formulario.imagen_url}
                    onChange={manejarCambio}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {guardando ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Crear')}
                  </button>
                  <button
                    type="button"
                    onClick={cerrarModal}
                    disabled={guardando}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalEliminar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setModalEliminar(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Confirmar Eliminación</h3>
                <p className="text-sm text-gray-500 mb-6">
                  ¿Estás seguro de eliminar el producto <strong>{productoEliminar?.nombre}</strong>?
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={eliminarProducto}
                    disabled={guardando}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {guardando ? 'Eliminando...' : 'Eliminar'}
                  </button>
                  <button
                    onClick={() => setModalEliminar(false)}
                    disabled={guardando}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProductos;
