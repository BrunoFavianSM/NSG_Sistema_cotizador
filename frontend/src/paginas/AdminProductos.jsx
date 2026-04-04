import { useEffect, useMemo, useState } from 'react';
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
    categoria: producto.categoria || 'procesador',
    socket: producto.socket || '',
    ram_type: producto.ram_type || '',
    form_factor: producto.form_factor || '',
    wattage: producto.wattage ? String(producto.wattage) : '',
    tdp: producto.tdp ? String(producto.tdp) : '',
    precio_base: producto.precio_base ? String(producto.precio_base) : '',
    stock: producto.stock !== null && producto.stock !== undefined ? String(producto.stock) : '',
    disponible_a_pedido: Boolean(producto.disponible_a_pedido),
    tiempo_entrega_dias: producto.tiempo_entrega_dias ? String(producto.tiempo_entrega_dias) : '',
    descripcion_tecnica: producto.descripcion_tecnica || '',
    imagen_url: producto.imagen_url || '',
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
  return {
    nombre: formulario.nombre.trim(),
    categoria: formulario.categoria,
    precio_base: Number(formulario.precio_base),
    stock: Number(formulario.stock),
    disponible_a_pedido: Boolean(formulario.disponible_a_pedido),
    tiempo_entrega_dias: formulario.disponible_a_pedido ? Number(formulario.tiempo_entrega_dias || 0) : null,
    socket: formulario.socket.trim() || null,
    ram_type: formulario.ram_type.trim() || null,
    form_factor: formulario.form_factor.trim() || null,
    wattage: formulario.wattage === '' ? null : Number(formulario.wattage),
    tdp: formulario.tdp === '' ? null : Number(formulario.tdp),
    descripcion_tecnica: formulario.descripcion_tecnica.trim() || null,
    imagen_url: formulario.imagen_url.trim() || null,
  };
}

export default function AdminProductos() {
  const { autenticado } = useAppContext();
  const toast = useToast();

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorPantalla, setErrorPantalla] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [modalFormulario, setModalFormulario] = useState({ open: false, mode: 'create', producto: null });
  const [formulario, setFormulario] = useState(PRODUCTO_INICIAL);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [modalEliminar, setModalEliminar] = useState({ open: false, producto: null });

  useEffect(() => {
    if (autenticado) {
      cargarProductos();
    }
  }, [autenticado]);

  const cargarProductos = async () => {
    setCargando(true);
    setErrorPantalla('');
    try {
      const data = await api.obtenerProductos();
      setProductos(Array.isArray(data) ? data : data.productos || []);
    } catch {
      setErrorPantalla('No se pudieron cargar los productos. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

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

      if (modalFormulario.mode === 'edit' && modalFormulario.producto) {
        await api.actualizarProducto(modalFormulario.producto.id, payload);
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
      await api.eliminarProducto(modalEliminar.producto.id);
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
    return productos.filter((producto) => producto.categoria === filtroCategoria);
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
      render: (row) => `S/ ${Number(row.precio_base).toFixed(2)}`,
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
              ...CATEGORIAS.map((categoria) => ({
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
