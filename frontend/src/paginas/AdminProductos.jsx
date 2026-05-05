import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '../componentes/admin/AdminPageHeader';
import ProductForm, { CATEGORIAS, PRODUCTO_INICIAL } from '../componentes/admin/ProductForm';
import EmptyState from '../componentes/feedback/EmptyState';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useToast } from '../componentes/feedback/ToastProvider';
import Badge from '../componentes/ui/Badge';
import Button from '../componentes/ui/Button';
import DataTable from '../componentes/ui/DataTable';
import Modal from '../componentes/ui/Modal';
import SelectField from '../componentes/ui/SelectField';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';

function parseProducto(producto) {
  return {
    nombre: producto.nombre || '',
    categoria: producto.subcategoria || producto.categoria || 'procesador',
    precio_base: producto.precio_base ? String(producto.precio_base) : '',
    stock: producto.stock !== null && producto.stock !== undefined ? String(producto.stock) : '',
    disponible_a_pedido: Boolean(producto.disponible_a_pedido),
    tiempo_entrega_dias: producto.tiempo_entrega_dias ? String(producto.tiempo_entrega_dias) : '',
    descripcion_tecnica: producto.descripcion_tecnica || '',
    imagen_url: producto.imagen_url || '',
    // Procesador
    socket: producto.socket || '',
    arquitectura: producto.arquitectura || '',
    nucleos: producto.nucleos ? String(producto.nucleos) : '',
    hilos: producto.hilos ? String(producto.hilos) : '',
    frecuencia_base_ghz: producto.frecuencia_base_ghz ? String(producto.frecuencia_base_ghz) : '',
    frecuencia_boost_ghz: producto.frecuencia_boost_ghz ? String(producto.frecuencia_boost_ghz) : '',
    tdp: producto.tdp ? String(producto.tdp) : '',
    graficos_integrados: Boolean(producto.graficos_integrados),
    // Placa madre / GPU (chipset compartido)
    chipset: producto.chipset || producto.chipset_gpu || '',
    ram_type: producto.ram_type || '',
    form_factor: producto.form_factor || '',
    max_ram_gb: producto.max_ram_gb ? String(producto.max_ram_gb) : '',
    slots_ram: producto.slots_ram ? String(producto.slots_ram) : '',
    pcie_version: producto.pcie_version || '',
    m2_slots: producto.m2_slots ? String(producto.m2_slots) : '',
    // RAM
    capacidad_gb: producto.capacidad_gb ? String(producto.capacidad_gb) : '',
    velocidad_mhz: producto.velocidad_mhz ? String(producto.velocidad_mhz) : '',
    latencia: producto.latencia || '',
    modulos: producto.modulos || '',
    cantidad_modulos: producto.cantidad_modulos ? String(producto.cantidad_modulos) : '',
    rgb: Boolean(producto.rgb),
    // Almacenamiento
    tipo_almacenamiento: producto.tipo_almacenamiento || '',
    interfaz: producto.interfaz || '',
    velocidad_lectura_mbps: producto.velocidad_lectura_mbps ? String(producto.velocidad_lectura_mbps) : '',
    velocidad_escritura_mbps: producto.velocidad_escritura_mbps ? String(producto.velocidad_escritura_mbps) : '',
    nvme_gen: producto.nvme_gen || '',
    // GPU
    vram_gb: producto.vram_gb ? String(producto.vram_gb) : '',
    vram_tipo: producto.vram_tipo || '',
    bus_bits: producto.bus_bits ? String(producto.bus_bits) : '',
    boost_mhz: producto.boost_mhz ? String(producto.boost_mhz) : '',
    longitud_mm: producto.longitud_mm ? String(producto.longitud_mm) : '',
    fuente_recomendada_w: producto.fuente_recomendada_w ? String(producto.fuente_recomendada_w) : '',
    // Fuente
    wattage: producto.wattage ? String(producto.wattage) : '',
    certificacion: producto.certificacion || '',
    modular: producto.modular || '',
    pcie_conectores: producto.pcie_conectores ? String(producto.pcie_conectores) : '',
    sata_conectores: producto.sata_conectores ? String(producto.sata_conectores) : '',
    // Case
    compatibilidad_placa: producto.compatibilidad_placa || '',
    max_gpu_mm: producto.max_gpu_mm ? String(producto.max_gpu_mm) : '',
    max_cooler_mm: producto.max_cooler_mm ? String(producto.max_cooler_mm) : '',
    ventiladores_incluidos: producto.ventiladores_incluidos ? String(producto.ventiladores_incluidos) : '',
    color: producto.color || '',
    panel_lateral: producto.panel_lateral || '',
  };
}

function validarFormulario(formulario) {
  if (!formulario.nombre.trim()) {
    return 'El nombre es obligatorio.';
  }
  if (formulario.precio_base === '' || Number(formulario.precio_base) < 0) {
    return 'Ingresa un precio base válido.';
  }
  if (formulario.stock === '' || Number(formulario.stock) < 0) {
    return 'Ingresa un stock válido.';
  }
  if (
    formulario.disponible_a_pedido
    && (formulario.tiempo_entrega_dias === '' || Number(formulario.tiempo_entrega_dias) < 1)
  ) {
    return 'Define un tiempo de entrega válido para productos a pedido.';
  }
  return '';
}

function serializarFormulario(formulario) {
  const n = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
  const s = (v) => (v === '' || v === null || v === undefined ? null : String(v).trim());

  return {
    nombre: formulario.nombre.trim(),
    categoria: formulario.categoria,
    precio_base: Number(formulario.precio_base),
    stock: Number(formulario.stock),
    disponible_a_pedido: Boolean(formulario.disponible_a_pedido),
    tiempo_entrega_dias: formulario.disponible_a_pedido ? n(formulario.tiempo_entrega_dias) : null,
    descripcion_tecnica: s(formulario.descripcion_tecnica),
    imagen_url: s(formulario.imagen_url),
    // Procesador
    socket: s(formulario.socket),
    arquitectura: s(formulario.arquitectura),
    nucleos: n(formulario.nucleos),
    hilos: n(formulario.hilos),
    frecuencia_base_ghz: n(formulario.frecuencia_base_ghz),
    frecuencia_boost_ghz: n(formulario.frecuencia_boost_ghz),
    tdp: n(formulario.tdp),
    graficos_integrados: Boolean(formulario.graficos_integrados),
    // Placa madre
    chipset: s(formulario.chipset),
    ram_type: s(formulario.ram_type),
    form_factor: s(formulario.form_factor),
    max_ram_gb: n(formulario.max_ram_gb),
    slots_ram: n(formulario.slots_ram),
    pcie_version: s(formulario.pcie_version),
    m2_slots: n(formulario.m2_slots),
    // RAM
    capacidad_gb: n(formulario.capacidad_gb),
    velocidad_mhz: n(formulario.velocidad_mhz),
    latencia: s(formulario.latencia),
    modulos: s(formulario.modulos),
    cantidad_modulos: n(formulario.cantidad_modulos),
    rgb: Boolean(formulario.rgb),
    // Almacenamiento
    tipo_almacenamiento: s(formulario.tipo_almacenamiento),
    interfaz: s(formulario.interfaz),
    velocidad_lectura_mbps: n(formulario.velocidad_lectura_mbps),
    velocidad_escritura_mbps: n(formulario.velocidad_escritura_mbps),
    nvme_gen: s(formulario.nvme_gen),
    // GPU
    vram_gb: n(formulario.vram_gb),
    vram_tipo: s(formulario.vram_tipo),
    bus_bits: n(formulario.bus_bits),
    boost_mhz: n(formulario.boost_mhz),
    longitud_mm: n(formulario.longitud_mm),
    fuente_recomendada_w: n(formulario.fuente_recomendada_w),
    // Fuente
    wattage: n(formulario.wattage),
    certificacion: s(formulario.certificacion),
    modular: s(formulario.modular),
    pcie_conectores: n(formulario.pcie_conectores),
    sata_conectores: n(formulario.sata_conectores),
    // Case
    compatibilidad_placa: s(formulario.compatibilidad_placa),
    max_gpu_mm: n(formulario.max_gpu_mm),
    max_cooler_mm: n(formulario.max_cooler_mm),
    ventiladores_incluidos: n(formulario.ventiladores_incluidos),
    color: s(formulario.color),
    panel_lateral: s(formulario.panel_lateral),
  };
}

export default function AdminProductos() {
  const { autenticado } = useAppContext();
  const toast = useToast();

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorPantalla, setErrorPantalla] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // Historial de precios: { [idProducto]: { precio_anterior, total } }
  const [historialPrecios, setHistorialPrecios] = useState({});

  const [modalFormulario, setModalFormulario] = useState({ open: false, mode: 'create', producto: null });
  const [formulario, setFormulario] = useState(PRODUCTO_INICIAL);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [modalEliminar, setModalEliminar] = useState({ open: false, producto: null });

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    setErrorPantalla('');
    try {
      const data = await api.obtenerProductos();
      const lista = Array.isArray(data) ? data : data.productos || [];
      setProductos(lista);

      // Cargar historial de precios para productos que lo tienen (Req. 3.7, 3.9)
      const conHistorial = lista.filter((p) => p.tiene_historial);
      if (conHistorial.length > 0) {
        const resultados = await Promise.allSettled(
          conHistorial.map((p) => api.obtenerHistorialPrecios(p.id))
        );
        const nuevoHistorial = {};
        resultados.forEach((r, idx) => {
          if (r.status === 'fulfilled' && r.value.historial?.length > 0) {
            const idProducto = conHistorial[idx].id;
            nuevoHistorial[idProducto] = {
              precio_anterior: Number(r.value.historial[0].precio_anterior),
              total: r.value.total,
            };
          }
        });
        setHistorialPrecios(nuevoHistorial);
      } else {
        setHistorialPrecios({});
      }
    } catch {
      setErrorPantalla('No se pudieron cargar los productos. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }, []);

  const categoriasDisponibles = useMemo(() => {
    const categoriasCatalogo = productos
      .map((producto) => producto.subcategoria || producto.categoria)
      .filter(Boolean);

    return Array.from(new Set([...CATEGORIAS, ...categoriasCatalogo]));
  }, [productos]);

  useEffect(() => {
    if (autenticado) {
      cargarProductos();
    }
  }, [autenticado, cargarProductos]);

  const abrirCrear = () => {
    setFormulario(PRODUCTO_INICIAL);
    setErrorFormulario('');
    setModalFormulario({ open: true, mode: 'create', producto: null });
  };

  const abrirEditar = (producto) => {
    setFormulario(parseProducto(producto));
    setErrorFormulario('');
    setModalFormulario({ open: true, mode: 'edit', producto });
  };

  const cerrarFormulario = () => {
    if (guardando) return;
    setModalFormulario({ open: false, mode: 'create', producto: null });
    setErrorFormulario('');
  };

  const guardarProducto = async (event) => {
    event.preventDefault();
    const errorValidacion = validarFormulario(formulario);

    if (errorValidacion) {
      setErrorFormulario(errorValidacion);
      return;
    }

    setGuardando(true);
    setErrorFormulario('');

    try {
      const payload = serializarFormulario(formulario);
      const categoriaRuta = modalFormulario.producto?.subcategoria || modalFormulario.producto?.categoria || formulario.categoria;

      if (modalFormulario.mode === 'edit' && modalFormulario.producto) {
        await api.actualizarProducto(categoriaRuta, modalFormulario.producto.id, payload);
        toast.success('Producto actualizado', 'Los cambios se guardaron correctamente.');
      } else {
        await api.crearProducto(payload);
        toast.success('Producto creado', 'El producto ya está disponible en el catálogo.');
      }

      await cargarProductos();
      cerrarFormulario();
    } catch (error) {
      if (Array.isArray(error?.errores) && error.errores.length > 0) {
        const detalle = error.errores.map((item) => `${item.campo}: ${item.mensaje}`).join(' | ');
        setErrorFormulario(`Revisa estos campos: ${detalle}`);
      } else {
        setErrorFormulario(error?.mensaje || 'No se pudo guardar el producto.');
      }
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = (producto) => {
    setModalEliminar({ open: true, producto });
  };

  const eliminarProducto = async () => {
    if (!modalEliminar.producto) return;

    setGuardando(true);
    try {
      const categoriaRuta = modalEliminar.producto.subcategoria || modalEliminar.producto.categoria;
      await api.eliminarProducto(categoriaRuta, modalEliminar.producto.id);
      toast.success('Producto eliminado', 'El producto se retiró del catálogo.');
      setModalEliminar({ open: false, producto: null });
      await cargarProductos();
    } catch (error) {
      setErrorPantalla(error?.mensaje || 'No se pudo eliminar el producto.');
      toast.error('No se pudo eliminar', 'Verifica permisos o estado del producto e inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const productosFiltrados = useMemo(() => {
    if (!filtroCategoria) return productos;
    return productos.filter((producto) => (producto.subcategoria || producto.categoria) === filtroCategoria);
  }, [productos, filtroCategoria]);

  const columnas = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Producto', sortable: true },
    {
      key: 'categoria',
      label: 'Categoría',
      sortable: true,
      render: (row) => <span className="capitalize">{row.categoria.replace('_', ' ')}</span>,
    },
    {
      key: 'precio_base',
      label: 'Precio',
      sortable: true,
      align: 'right',
      render: (row) => {
        const historial = historialPrecios[row.id];
        return (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5">
              {/* Badge indicador de historial (Req. 3.9) */}
              {row.tiene_historial && (
                <span
                  title="Este producto tiene historial de cambios de precio"
                  aria-label="Tiene historial de precios"
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-accent)] text-white text-[9px] font-bold leading-none select-none"
                >
                  H
                </span>
              )}
              <span className="font-medium text-[var(--color-text)]">
                S/ {Number(row.precio_base).toFixed(2)}
              </span>
            </div>
            {/* Precio anterior tachado (Req. 3.7, 3.8) */}
            {historial && (
              <span
                className="text-xs line-through text-[var(--color-text-muted)] opacity-75"
                aria-label={`Precio anterior: S/ ${historial.precio_anterior.toFixed(2)}`}
                title={`Precio anterior: S/ ${historial.precio_anterior.toFixed(2)}`}
              >
                S/ {historial.precio_anterior.toFixed(2)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (row) => (
        <Badge variant={row.stock > 0 ? 'success' : 'danger'}>
          {row.stock > 0 ? `Stock ${row.stock}` : 'Sin stock'}
        </Badge>
      ),
    },
    {
      key: 'pedido',
      label: 'Pedido',
      render: (row) => (
        row.disponible_a_pedido
          ? <Badge variant="warning">Sí ({row.tiempo_entrega_dias || 0}d)</Badge>
          : <Badge variant="neutral">No</Badge>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => abrirEditar(row)}
            aria-label={`Editar producto ${row.nombre}`}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => confirmarEliminar(row)}
            aria-label={`Eliminar producto ${row.nombre}`}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  if (!autenticado) {
    return (
      <div className="surface-card p-6 text-center">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Acceso restringido</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Debes iniciar sesión para administrar productos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestión de Productos"
        description="Administra catálogo, stock y disponibilidad con feedback claro en cada acción."
        actions={(
          <>
            <Button variant="secondary" onClick={cargarProductos} loading={cargando}>
              Actualizar
            </Button>
            <Button onClick={abrirCrear}>Nuevo producto</Button>
          </>
        )}
      />

      {errorPantalla ? (
        <ErrorState
          title="No se cargó el catálogo"
          description={errorPantalla}
          onRetry={cargarProductos}
          retryLabel="Reintentar carga"
        />
      ) : null}

      <DataTable
        caption="Tabla administrativa de productos"
        columns={columnas}
        data={productosFiltrados}
        loading={cargando}
        rowKey="id"
        searchKeys={['nombre', 'categoria', 'socket', 'ram_type', 'form_factor']}
        searchPlaceholder="Busca por nombre, categoría o especificación..."
        defaultSort={{ key: 'nombre', direction: 'asc' }}
        leftToolbar={(
          <SelectField
            id="filtro-categoria-productos"
            label="Categoría"
            value={filtroCategoria}
            onChange={(event) => setFiltroCategoria(event.target.value)}
            className="sm:max-w-[15rem]"
            options={[
              { value: '', label: 'Todas' },
              ...categoriasDisponibles.map((categoria) => ({
                value: categoria,
                label: categoria.replace('_', ' '),
              })),
            ]}
          />
        )}
        rightToolbar={<p className="text-xs text-[var(--color-text-muted)]">{productosFiltrados.length} resultados</p>}
        loadingState={<LoadingSpinner label="Cargando catálogo de productos..." />}
        emptyState={(
          <EmptyState
            title="No hay productos para mostrar"
            description="Ajusta filtros o crea un producto nuevo para completar el catálogo."
            actionLabel="Crear producto"
            onAction={abrirCrear}
          />
        )}
      />

      <Modal
        open={modalFormulario.open}
        onClose={cerrarFormulario}
        title={modalFormulario.mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}
        description="Completa los campos y guarda los cambios."
        size="lg"
      >
        <ProductForm
          value={formulario}
          onChange={setFormulario}
          onSubmit={guardarProducto}
          onCancel={cerrarFormulario}
          loading={guardando}
          mode={modalFormulario.mode}
          error={errorFormulario}
          categorias={categoriasDisponibles}
        />
      </Modal>

      <Modal
        open={modalEliminar.open}
        onClose={() => setModalEliminar({ open: false, producto: null })}
        title="Eliminar producto"
        description="Esta acción no se puede deshacer."
        size="sm"
        footer={(
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setModalEliminar({ open: false, producto: null })}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={eliminarProducto} loading={guardando}>
              Eliminar
            </Button>
          </div>
        )}
      >
        <p className="text-sm text-[var(--color-text-muted)]">
          Se eliminará el producto <span className="font-semibold text-[var(--color-text)]">{modalEliminar.producto?.nombre}</span>.
        </p>
      </Modal>
    </div>
  );
}
