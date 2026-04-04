import { useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '../componentes/admin/AdminPageHeader';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useToast } from '../componentes/feedback/ToastProvider';
import Button from '../componentes/ui/Button';
import InputField from '../componentes/ui/InputField';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';

function StatCard({ title, value, helper, tone = 'neutral' }) {
  const toneClass = {
    neutral: 'border-[var(--color-border)] bg-[var(--color-surface-soft)]',
    info: 'border-[color:rgba(10,132,255,0.35)] bg-[var(--color-accent-soft)]',
    success: 'border-[color:rgba(48,209,88,0.35)] bg-[color:rgba(48,209,88,0.10)]',
    warning: 'border-[color:rgba(255,214,10,0.45)] bg-[color:rgba(255,214,10,0.10)]',
  }[tone];

  return (
    <article className={`rounded-[var(--radius-md)] border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
    </article>
  );
}

export default function AdminConfiguracion() {
  const { autenticado, margenGanancia, actualizarMargen } = useAppContext();
  const toast = useToast();

  const [nuevoMargen, setNuevoMargen] = useState(String(margenGanancia));
  const [guardando, setGuardando] = useState(false);

  const [estadisticasIA, setEstadisticasIA] = useState(null);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  const [errorEstadisticas, setErrorEstadisticas] = useState('');

  useEffect(() => {
    if (autenticado) {
      cargarEstadisticasIA();
    }
  }, [autenticado]);

  useEffect(() => {
    setNuevoMargen(String(margenGanancia));
  }, [margenGanancia]);

  const cargarEstadisticasIA = async () => {
    setCargandoEstadisticas(true);
    setErrorEstadisticas('');
    try {
      const stats = await api.obtenerEstadisticasIA();
      setEstadisticasIA(stats);
    } catch {
      setErrorEstadisticas('No se pudieron cargar las métricas en este momento.');
      setEstadisticasIA(null);
    } finally {
      setCargandoEstadisticas(false);
    }
  };

  const margenValido = useMemo(() => {
    const valor = Number(nuevoMargen);
    return !Number.isNaN(valor) && valor >= 0 && valor <= 100;
  }, [nuevoMargen]);

  const precioEjemplo = (base) => {
    const margen = Number(nuevoMargen || 0);
    return (base * (1 + margen / 100)).toFixed(2);
  };

  const guardarMargen = async (event) => {
    event.preventDefault();

    if (!margenValido) {
      toast.warning('Margen inválido', 'Ingresa un valor entre 0 y 100%.');
      return;
    }

    setGuardando(true);
    try {
      actualizarMargen(Number(nuevoMargen));
      toast.success('Configuración guardada', `El margen ahora es ${Number(nuevoMargen).toFixed(1)}%.`);
    } catch {
      toast.error('No se pudo guardar', 'Intenta nuevamente en unos segundos.');
    } finally {
      setGuardando(false);
    }
  };

  if (!autenticado) {
    return (
      <div className="surface-card p-6 text-center">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Acceso restringido</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Debes iniciar sesión para administrar configuración.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configuración del Sistema"
        description="Gestiona parámetros globales y monitorea el uso de IA con feedback de estado consistente."
        actions={<Button variant="secondary" onClick={cargarEstadisticasIA} loading={cargandoEstadisticas}>Actualizar métricas</Button>}
      />

      <section className="surface-elevated p-6">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Margen de ganancia</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Define el porcentaje aplicado a nuevas cotizaciones.
          </p>
        </header>

        <form onSubmit={guardarMargen} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
            <InputField
              id="margen-ganancia"
              label="Margen (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={nuevoMargen}
              onChange={(event) => setNuevoMargen(event.target.value)}
              error={!margenValido ? 'El valor debe estar entre 0 y 100.' : ''}
            />
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
              <p className="text-sm text-[var(--color-text-muted)]">Margen actual</p>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-accent-text)]">{Number(margenGanancia).toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard title="Base S/ 1000" value={`S/ ${precioEjemplo(1000)}`} helper="Precio final estimado" />
            <StatCard title="Base S/ 2500" value={`S/ ${precioEjemplo(2500)}`} helper="Precio final estimado" />
            <StatCard title="Base S/ 5000" value={`S/ ${precioEjemplo(5000)}`} helper="Precio final estimado" />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={guardando} disabled={!margenValido || Number(nuevoMargen) === Number(margenGanancia)}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </section>

      <section className="surface-elevated p-6">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Métricas de IA</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Seguimiento operativo de llamadas y costos aproximados.
          </p>
        </header>

        {cargandoEstadisticas ? (
          <div className="py-6">
            <LoadingSpinner label="Cargando métricas de IA..." />
          </div>
        ) : errorEstadisticas ? (
          <ErrorState
            title="No se cargaron las métricas"
            description={errorEstadisticas}
            onRetry={cargarEstadisticasIA}
            retryLabel="Reintentar"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Llamadas"
              value={estadisticasIA?.llamadas ?? 0}
              helper="Consultas acumuladas"
              tone="info"
            />
            <StatCard
              title="Costo estimado"
              value={`$${estadisticasIA?.costoEstimado ?? '0.00'}`}
              helper="USD aproximado"
              tone="success"
            />
            <StatCard
              title="Promedio tokens"
              value={estadisticasIA?.promedioTokens ?? 0}
              helper="Tokens por consulta"
              tone="warning"
            />
          </div>
        )}
      </section>
    </div>
  );
}
