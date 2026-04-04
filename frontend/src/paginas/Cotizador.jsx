import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../componentes/feedback/EmptyState';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import SuccessState from '../componentes/feedback/SuccessState';
import { useToast } from '../componentes/feedback/ToastProvider';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const PASOS = [
  { id: 'procesador', nombre: 'Procesador', categoria: 'procesador' },
  { id: 'placa_madre', nombre: 'Placa madre', categoria: 'placa_madre' },
  { id: 'ram', nombre: 'Memoria RAM', categoria: 'ram' },
  { id: 'almacenamiento', nombre: 'Almacenamiento', categoria: 'almacenamiento' },
  { id: 'gpu', nombre: 'Tarjeta gráfica', categoria: 'gpu' },
  { id: 'fuente', nombre: 'Fuente de poder', categoria: 'fuente' },
  { id: 'case', nombre: 'Case', categoria: 'case' },
];

function formatearPrecio(valor) {
  return `S/ ${Number(valor || 0).toFixed(2)}`;
}

function obtenerEstadoStock(producto) {
  if (producto.stock > 0) {
    return { label: `Stock ${producto.stock}`, className: 'bg-[color:rgba(48,209,88,0.15)] text-[var(--color-success)]' };
  }
  if (producto.disponible_a_pedido) {
    return { label: 'A pedido', className: 'bg-[color:rgba(255,214,10,0.15)] text-[var(--color-warning)]' };
  }
  return { label: 'Sin stock', className: 'bg-[color:rgba(255,69,58,0.15)] text-[var(--color-danger)]' };
}

function agruparRam(rams) {
  return rams.reduce((acc, ram) => {
    if (!acc[ram.id]) {
      acc[ram.id] = { producto: ram, cantidad: 1 };
    } else {
      acc[ram.id].cantidad += 1;
    }
    return acc;
  }, {});
}

export default function Cotizador() {
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
    cargandoProductos,
    errorProductos,
    limpiarConfiguracion,
    autenticado,
  } = useAppContext();

  const navigate = useNavigate();
  const toast = useToast();

  const [pasoActual, setPasoActual] = useState(0);
  const [filtro, setFiltro] = useState('disponibles');
  const [generando, setGenerando] = useState(false);
  const [cotizacionGenerada, setCotizacionGenerada] = useState(null);
  const [errorGenerar, setErrorGenerar] = useState('');

  const pasoInfo = PASOS[pasoActual];
  const total = calcularPrecioTotal();

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    const haySeleccion = Object.values(configuracionSeleccionada).some((valor) => {
      if (Array.isArray(valor)) return valor.length > 0;
      return valor !== null;
    });
    if (haySeleccion) validarCompatibilidad();
  }, [configuracionSeleccionada]);

  const pasoCompleto = (indicePaso) => {
    const paso = PASOS[indicePaso];
    const valor = configuracionSeleccionada[paso.id];
    if (paso.id === 'ram') return Array.isArray(valor) && valor.length > 0;
    return Boolean(valor);
  };

  const pasoHabilitado = (indicePaso) => {
    if (indicePaso === 0) return true;
    return pasoCompleto(indicePaso - 1);
  };

  const pasosCompletos = PASOS.filter((_, i) => pasoCompleto(i)).length;
  const configuracionCompleta = pasosCompletos === PASOS.length;

  const primerPasoPendiente = useMemo(
    () => PASOS.findIndex((_, indice) => !pasoCompleto(indice)),
    [configuracionSeleccionada]
  );

  const ramAgrupada = useMemo(
    () => agruparRam(configuracionSeleccionada.ram || []),
    [configuracionSeleccionada.ram]
  );

  const productosFiltrados = useMemo(() => {
    let lista = productos.filter((p) => p.categoria === pasoInfo.categoria);

    if (pasoInfo.id === 'placa_madre' && configuracionSeleccionada.procesador?.socket) {
      const socket = configuracionSeleccionada.procesador.socket;
      const compatibles = lista.filter((p) => !p.socket || p.socket === socket);
      if (compatibles.length > 0) lista = compatibles;
    }

    if (pasoInfo.id === 'ram' && configuracionSeleccionada.placa_madre?.ram_type) {
      const ramType = configuracionSeleccionada.placa_madre.ram_type;
      const compatibles = lista.filter((p) => !p.ram_type || p.ram_type === ramType);
      if (compatibles.length > 0) lista = compatibles;
    }

    if (filtro === 'disponibles') {
      lista = lista.filter((p) => p.stock > 0 || p.disponible_a_pedido);
    }

    return lista;
  }, [productos, pasoInfo, configuracionSeleccionada, filtro]);

  const seleccionActual = configuracionSeleccionada[pasoInfo.id];

  const irAPaso = (indicePaso) => {
    if (!pasoHabilitado(indicePaso)) {
      toast.info('Paso bloqueado', 'Completa los pasos anteriores para avanzar.');
      return;
    }
    setPasoActual(indicePaso);
  };

  const irSiguiente = () => {
    if (!pasoCompleto(pasoActual)) {
      toast.warning('Falta selección', 'Selecciona un componente para continuar.');
      return;
    }
    if (pasoActual < PASOS.length - 1) setPasoActual((prev) => prev + 1);
  };

  const irAnterior = () => {
    if (pasoActual > 0) setPasoActual((prev) => prev - 1);
  };

  const seleccionarProducto = (producto) => {
    if (pasoInfo.id === 'ram') {
      agregarRAM(producto);
      return;
    }
    seleccionarComponente(pasoInfo.id, producto);
  };

  const quitarRam = (idProducto) => {
    let ultimoIndice = -1;
    (configuracionSeleccionada.ram || []).forEach((ram, index) => {
      if (ram.id === idProducto) ultimoIndice = index;
    });
    if (ultimoIndice >= 0) eliminarRAM(ultimoIndice);
  };

  const construirPayloadCotizacion = () => {
    const componentes = [];
    const pushComponente = (producto, cantidad = 1) => {
      if (!producto) return;
      componentes.push({ id_producto: producto.id, cantidad });
    };

    pushComponente(configuracionSeleccionada.procesador);
    pushComponente(configuracionSeleccionada.placa_madre);
    pushComponente(configuracionSeleccionada.almacenamiento);
    pushComponente(configuracionSeleccionada.gpu);
    pushComponente(configuracionSeleccionada.fuente);
    pushComponente(configuracionSeleccionada.case);

    Object.values(ramAgrupada).forEach((item) => pushComponente(item.producto, item.cantidad));

    return { componentes };
  };

  const generarCotizacion = async () => {
    if (!configuracionCompleta) {
      if (primerPasoPendiente >= 0) setPasoActual(primerPasoPendiente);
      toast.warning('Configuración incompleta', 'Completa todos los pasos antes de generar.');
      return;
    }

    if (validacionCompatibilidad.errores.length > 0) {
      toast.error('Incompatibilidades detectadas', 'Corrige los errores antes de continuar.');
      return;
    }

    setGenerando(true);
    setErrorGenerar('');

    try {
      const respuesta = await api.crearCotizacion(construirPayloadCotizacion());
      setCotizacionGenerada(respuesta?.cotizacion || null);
      toast.success('Cotización generada', 'Ya puedes copiar el ticket o descargar el PDF.');
    } catch (error) {
      const mensaje = error?.mensaje || 'No se pudo generar la cotización.';
      setErrorGenerar(mensaje);
      toast.error('No se pudo generar', mensaje);
    } finally {
      setGenerando(false);
    }
  };

  const descargarPdf = () => {
    if (!cotizacionGenerada?.codigo_ticket) return;
    const urlPdf = `${API_BASE_URL}/cotizaciones/${cotizacionGenerada.codigo_ticket}/pdf`;
    const ventana = window.open(urlPdf, '_blank', 'noopener,noreferrer');
    if (!ventana) {
      toast.warning('Bloqueo de ventana', 'Permite pop-ups para abrir el PDF.');
      return;
    }
    toast.info('PDF abierto', 'Se abrió el archivo en una nueva pestaña.');
  };

  const copiarTicket = async () => {
    if (!cotizacionGenerada?.codigo_ticket || !navigator.clipboard) {
      toast.error('No se pudo copiar', 'Tu navegador no permite copiar automáticamente.');
      return;
    }

    try {
      await navigator.clipboard.writeText(cotizacionGenerada.codigo_ticket);
      toast.success('Código copiado', 'El ticket está en tu portapapeles.');
    } catch {
      toast.error('No se pudo copiar', 'Copia el código manualmente.');
    }
  };

  const nuevaCotizacion = () => {
    limpiarConfiguracion();
    setPasoActual(0);
    setCotizacionGenerada(null);
    setErrorGenerar('');
    toast.info('Nuevo flujo', 'Empezaste una cotización nueva.');
  };

  return (
    <div className="space-y-6">
      <header className="surface-elevated p-6">
        <h1 className="text-3xl font-semibold text-[var(--color-text)]">Cotizador de PC</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Configura tu computadora paso a paso con validación y total en tiempo real.</p>
      </header>

      <section className="surface-card p-4" aria-label="Pasos del cotizador">
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {PASOS.map((paso, indice) => {
            const activo = indice === pasoActual;
            const completo = pasoCompleto(indice);
            const habilitado = pasoHabilitado(indice);
            return (
              <li key={paso.id}>
                <button
                  type="button"
                  onClick={() => irAPaso(indice)}
                  disabled={!habilitado}
                  aria-current={activo ? 'step' : undefined}
                  aria-disabled={!habilitado}
                  className={`w-full min-h-11 rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm font-medium transition-colors duration-higNormal ease-hig ${
                    activo
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]'
                      : completo
                        ? 'border-[color:rgba(48,209,88,0.35)] bg-[color:rgba(48,209,88,0.10)] text-[var(--color-text)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)]'
                  } ${!habilitado ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {completo ? '✓ ' : `${indice + 1}. `}
                  {paso.nombre}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="surface-elevated space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Paso {pasoActual + 1} de {PASOS.length}</p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{pasoInfo.nombre}</h2>
            </div>

            <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-1">
              <button
                type="button"
                onClick={() => setFiltro('disponibles')}
                aria-pressed={filtro === 'disponibles'}
                className={`min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-medium ${filtro === 'disponibles' ? 'bg-[var(--color-surface)] shadow-hig1' : 'text-[var(--color-text-muted)]'}`}
              >
                Disponibles
              </button>
              <button
                type="button"
                onClick={() => setFiltro('todos')}
                aria-pressed={filtro === 'todos'}
                className={`min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-medium ${filtro === 'todos' ? 'bg-[var(--color-surface)] shadow-hig1' : 'text-[var(--color-text-muted)]'}`}
              >
                Todos
              </button>
            </div>
          </div>

          {seleccionActual && pasoInfo.id !== 'ram' ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Selección actual</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{seleccionActual.nombre}</p>
            </div>
          ) : null}

          {cargandoProductos ? (
            <div className="surface-card py-16">
              <LoadingSpinner label="Cargando productos..." />
            </div>
          ) : errorProductos ? (
            <ErrorState title="No se cargaron productos" description={errorProductos} onRetry={cargarProductos} />
          ) : productosFiltrados.length === 0 ? (
            <EmptyState
              title="Sin productos para este paso"
              description="Prueba con el filtro Todos o revisa el stock disponible."
              actionLabel="Ver todos"
              onAction={() => setFiltro('todos')}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {productosFiltrados.map((producto) => {
                const esRam = pasoInfo.id === 'ram';
                const seleccionado = esRam ? Boolean(ramAgrupada[producto.id]) : seleccionActual?.id === producto.id;
                const estadoStock = obtenerEstadoStock(producto);
                const cantidadRam = ramAgrupada[producto.id]?.cantidad || 0;
                const maxRam = producto.stock > 0 ? producto.stock : 8;

                return (
                  <motion.article key={producto.id} layout className={`surface-card p-4 ${seleccionado ? 'ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-bg)]' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-[var(--color-text)]">{producto.nombre}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estadoStock.className}`}>{estadoStock.label}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">{producto.descripcion_tecnica ? `${producto.descripcion_tecnica.slice(0, 110)}...` : 'Sin descripción técnica.'}</p>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <p className="text-2xl font-semibold text-[var(--color-accent-text)]">{formatearPrecio(producto.precio_base)}</p>

                      {!esRam ? (
                        <button
                          type="button"
                          onClick={() => seleccionarProducto(producto)}
                          className={`min-h-11 rounded-[var(--radius-sm)] px-4 text-sm font-medium ${seleccionado ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]' : 'bg-[var(--color-surface-soft)] text-[var(--color-text)] hover:bg-[var(--color-accent-soft)]'}`}
                          aria-label={`${seleccionado ? 'Producto seleccionado' : 'Seleccionar'}: ${producto.nombre}`}
                        >
                          {seleccionado ? 'Seleccionado' : 'Seleccionar'}
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-1">
                          <button
                            type="button"
                            onClick={() => quitarRam(producto.id)}
                            disabled={cantidadRam === 0}
                            className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-lg disabled:opacity-40"
                            aria-label={`Quitar un módulo de ${producto.nombre}`}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{cantidadRam}</span>
                          <button
                            type="button"
                            onClick={() => seleccionarProducto(producto)}
                            disabled={cantidadRam >= maxRam}
                            className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-lg disabled:opacity-40"
                            aria-label={`Agregar un módulo de ${producto.nombre}`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}

          <footer className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={irAnterior} disabled={pasoActual === 0} className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-medium disabled:opacity-50">Anterior</button>
            <p className="text-sm text-[var(--color-text-muted)]">{pasoCompleto(pasoActual) ? 'Paso completado.' : 'Selecciona una opción para continuar.'}</p>
            <button type="button" onClick={irSiguiente} disabled={pasoActual === PASOS.length - 1} className="min-h-11 rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white disabled:opacity-50">Siguiente</button>
          </footer>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="surface-elevated p-5">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Total estimado</p>
            <p className="mt-1 text-3xl font-semibold text-[var(--color-success)]">{formatearPrecio(total)}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{pasosCompletos} de {PASOS.length} pasos completos</p>
          </section>

          <section className="surface-elevated p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Compatibilidad</h3>
            {validacionCompatibilidad.errores.length > 0 ? (
              <ErrorState
                title="Incompatibilidades detectadas"
                description={validacionCompatibilidad.errores[0]}
              />
            ) : validacionCompatibilidad.advertencias.length > 0 ? (
              <div className="rounded-[var(--radius-sm)] border border-[color:rgba(255,214,10,0.45)] bg-[color:rgba(255,214,10,0.10)] px-3 py-2 text-sm text-[var(--color-warning)]">
                {validacionCompatibilidad.advertencias[0]}
              </div>
            ) : (
              <div className="rounded-[var(--radius-sm)] border border-[color:rgba(48,209,88,0.4)] bg-[color:rgba(48,209,88,0.10)] px-3 py-2 text-sm text-[var(--color-success)]">
                Configuración válida.
              </div>
            )}
          </section>

          <section className="surface-elevated space-y-4 p-5">
            <button
              type="button"
              onClick={generarCotizacion}
              disabled={!configuracionCompleta || generando || validacionCompatibilidad.errores.length > 0}
              className="min-h-11 w-full rounded-[var(--radius-md)] bg-[var(--color-success-solid)] px-4 text-sm font-semibold text-[var(--color-on-success)] disabled:opacity-45"
            >
              {generando ? 'Generando cotización...' : 'Generar cotización'}
            </button>

            {errorGenerar ? (
              <ErrorState
                title="No se pudo generar"
                description={errorGenerar}
                onRetry={generarCotizacion}
                retryLabel="Reintentar"
              />
            ) : null}

            {cotizacionGenerada ? (
              <SuccessState
                title="Cotización lista"
                description={`Ticket ${cotizacionGenerada.codigo_ticket} · ${formatearPrecio(cotizacionGenerada.precio_total)}`}
              >
                <div className="space-y-2">
                  <button type="button" onClick={copiarTicket} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">Copiar código</button>
                  <button type="button" onClick={descargarPdf} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">Descargar PDF</button>
                  <button type="button" onClick={() => navigate('/historial')} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">Ver historial</button>
                  <button type="button" onClick={() => navigate(autenticado ? '/validar' : '/login')} className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-medium">{autenticado ? 'Validar ticket' : 'Iniciar sesión para validar'}</button>
                  <button type="button" onClick={nuevaCotizacion} className="min-h-11 w-full rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 text-sm font-semibold text-white">Nueva cotización</button>
                </div>
              </SuccessState>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
