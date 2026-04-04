import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Badge from '../componentes/ui/Badge';
import Button from '../componentes/ui/Button';
import DataTable from '../componentes/ui/DataTable';
import InputField from '../componentes/ui/InputField';
import SelectField from '../componentes/ui/SelectField';
import EmptyState from '../componentes/feedback/EmptyState';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useToast } from '../componentes/feedback/ToastProvider';
import { consultarHistorialCliente } from '../servicios/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getApiUrl = () => {
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }

  try {
    const getViteEnv = new Function('return import.meta.env.VITE_API_URL');
    return getViteEnv() || 'http://localhost:3000/api';
  } catch {
    return 'http://localhost:3000/api';
  }
};

function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatearMoneda(monto) {
  return `S/ ${Number(monto || 0).toFixed(2)}`;
}

function estadoToBadgeVariant(estado) {
  switch (estado) {
    case 'Pendiente':
      return 'warning';
    case 'Reclamada':
      return 'success';
    case 'Caducada':
      return 'danger';
    default:
      return 'neutral';
  }
}

function StatCard({ label, value, helper }) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
    </article>
  );
}

export default function HistorialCliente() {
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [historialCargado, setHistorialCargado] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);

  const cotizacionesFiltradas = useMemo(() => {
    if (filtroEstado === 'todos') return cotizaciones;
    return cotizaciones.filter((item) => item.estado === filtroEstado);
  }, [cotizaciones, filtroEstado]);

  const descargarPDF = (codigoTicket) => {
    const apiUrl = getApiUrl();
    const pdfUrl = `${apiUrl}/cotizaciones/${codigoTicket}/pdf`;
    const win = window.open(pdfUrl, '_blank', 'noopener,noreferrer');

    if (!win) {
      toast.warning('No se pudo abrir el PDF', 'Permite ventanas emergentes para descargar el documento.');
    }
  };

  const consultarHistorial = async () => {
    setError('');
    const normalizado = email.trim().toLowerCase();

    if (!normalizado) {
      setError('Ingresa un correo para buscar tu historial.');
      return false;
    }

    if (!EMAIL_REGEX.test(normalizado)) {
      setError('Ingresa un correo válido (ejemplo@dominio.com).');
      return false;
    }

    setBuscando(true);

    try {
      const respuesta = await consultarHistorialCliente(normalizado);

      if (!respuesta?.exito) {
        setHistorialCargado(false);
        setCliente(null);
        setCotizaciones([]);
        setError(respuesta?.mensaje || 'No se encontró historial para ese correo.');
        return false;
      }

      const lista = Array.isArray(respuesta?.cotizaciones) ? respuesta.cotizaciones : [];

      setCliente(respuesta?.cliente || { email: normalizado, nombre: 'Cliente' });
      setCotizaciones(lista);
      setHistorialCargado(true);
      setFiltroEstado('todos');

      if (lista.length === 0) {
        toast.info('Sin resultados', 'No hay cotizaciones registradas para este correo.');
      }
      return true;
    } catch (err) {
      setHistorialCargado(false);
      setCliente(null);
      setCotizaciones([]);
      setError(err?.mensaje || 'No se pudo consultar el historial. Intenta nuevamente.');
      return false;
    } finally {
      setBuscando(false);
    }
  };

  const buscarHistorial = async (event) => {
    event.preventDefault();
    setError('');
    await consultarHistorial();
  };

  const limpiarBusqueda = () => {
    setEmail('');
    setFiltroEstado('todos');
    setBuscando(false);
    setError('');
    setHistorialCargado(false);
    setCliente(null);
    setCotizaciones([]);
  };

  const columnas = [
    {
      key: 'codigo_ticket',
      label: 'Ticket',
      sortable: true,
      render: (row) => <span className="font-semibold text-[var(--color-text)]">{row.codigo_ticket}</span>,
    },
    {
      key: 'fecha_emision',
      label: 'Emitida',
      sortable: true,
      render: (row) => formatearFecha(row.fecha_emision),
    },
    {
      key: 'fecha_validez',
      label: 'Válida hasta',
      sortable: true,
      render: (row) => formatearFecha(row.fecha_validez),
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (row) => <Badge variant={estadoToBadgeVariant(row.estado)}>{row.estado || 'Sin estado'}</Badge>,
    },
    {
      key: 'precio_total',
      label: 'Total',
      sortable: true,
      align: 'right',
      render: (row) => <span className="font-semibold text-[var(--color-accent-text)]">{formatearMoneda(row.precio_total)}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => descargarPDF(row.codigo_ticket)}
          aria-label={`Descargar PDF de ${row.codigo_ticket}`}
        >
          Descargar PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Cliente</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">Historial de Cotizaciones</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          Consulta tickets anteriores con un flujo simple, accesible y listo para descargar en PDF.
        </p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="surface-elevated p-6"
        aria-labelledby="historial-busqueda-title"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="historial-busqueda-title" className="text-lg font-semibold text-[var(--color-text)]">Buscar por correo</h2>
          {historialCargado ? (
            <Button variant="ghost" size="sm" onClick={limpiarBusqueda}>
              Nueva búsqueda
            </Button>
          ) : null}
        </div>

        <form onSubmit={buscarHistorial} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <InputField
            id="historial-email"
            type="email"
            label="Correo del cliente"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            placeholder="cliente@correo.com"
            error={error}
            hint="Usa el mismo correo con el que se generó la cotización."
          />

          <Button type="submit" loading={buscando} className="sm:min-w-[12rem]">
            Buscar historial
          </Button>
        </form>
      </motion.section>

      {buscando ? (
        <section className="surface-card p-10">
          <LoadingSpinner label="Buscando historial..." />
        </section>
      ) : null}

      {!buscando && error && !historialCargado ? (
        <ErrorState
          title="No se pudo cargar el historial"
          description={error}
          onRetry={email.trim() ? consultarHistorial : null}
          retryLabel="Reintentar"
        />
      ) : null}

      {!buscando && historialCargado ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="Cliente" value={cliente?.nombre || 'Cliente'} helper={cliente?.email || '-'} />
            <StatCard label="Cotizaciones" value={String(cotizaciones.length)} helper="Registros históricos" />
            <StatCard
              label="Monto acumulado"
              value={formatearMoneda(cotizaciones.reduce((acc, item) => acc + Number(item.precio_total || 0), 0))}
              helper="Suma referencial de tickets"
            />
          </section>

          {cotizaciones.length === 0 ? (
            <EmptyState
              title="Sin cotizaciones registradas"
              description="Este correo aún no tiene tickets emitidos en el sistema."
            />
          ) : (
            <DataTable
              caption="Tabla de cotizaciones históricas del cliente"
              columns={columnas}
              data={cotizacionesFiltradas}
              rowKey="id"
              searchKeys={['codigo_ticket', 'estado']}
              searchPlaceholder="Filtrar por ticket o estado..."
              defaultSort={{ key: 'fecha_emision', direction: 'desc' }}
              leftToolbar={(
                <SelectField
                  id="historial-filtro-estado"
                  label="Estado"
                  value={filtroEstado}
                  onChange={(event) => setFiltroEstado(event.target.value)}
                  className="sm:max-w-[15rem]"
                  options={[
                    { value: 'todos', label: 'Todos' },
                    { value: 'Pendiente', label: 'Pendiente' },
                    { value: 'Reclamada', label: 'Reclamada' },
                    { value: 'Caducada', label: 'Caducada' },
                  ]}
                />
              )}
              rightToolbar={<p className="text-xs text-[var(--color-text-muted)]">{cotizacionesFiltradas.length} resultados</p>}
              emptyState={(
                <EmptyState
                  title="No hay resultados con ese filtro"
                  description="Prueba con otro estado o limpia la búsqueda de la tabla."
                  actionLabel="Ver todos"
                  onAction={() => setFiltroEstado('todos')}
                />
              )}
            />
          )}
        </>
      ) : null}
    </div>
  );
}
