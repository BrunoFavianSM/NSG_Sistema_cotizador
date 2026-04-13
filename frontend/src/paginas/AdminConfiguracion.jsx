import { useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '../componentes/admin/AdminPageHeader';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useToast } from '../componentes/feedback/ToastProvider';
import Button from '../componentes/ui/Button';
import InputField from '../componentes/ui/InputField';
import { useAppContext } from '../contexto/AppContext';
import * as api from '../servicios/api';
import { formatearMoneda } from '../utilidades/moneda';

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
  const {
    autenticado,
    margenGanancia,
    tasaIgv,
    tipoCambioUsdPen,
    actualizarConfiguracionFinanciera
  } = useAppContext();
  const toast = useToast();

  const [nuevoMargen, setNuevoMargen] = useState(String(margenGanancia));
  const [nuevaTasaIgv, setNuevaTasaIgv] = useState(String(tasaIgv));
  const [nuevoTipoCambio, setNuevoTipoCambio] = useState(String(tipoCambioUsdPen));
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
    setNuevaTasaIgv(String(tasaIgv));
    setNuevoTipoCambio(String(tipoCambioUsdPen));
  }, [margenGanancia, tasaIgv, tipoCambioUsdPen]);

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
  const tasaIgvValida = useMemo(() => {
    const valor = Number(nuevaTasaIgv);
    return !Number.isNaN(valor) && valor >= 0 && valor <= 100;
  }, [nuevaTasaIgv]);
  const tipoCambioValido = useMemo(() => {
    const valor = Number(nuevoTipoCambio);
    return !Number.isNaN(valor) && valor > 0;
  }, [nuevoTipoCambio]);

  const precioEjemploUsd = (base) => {
    const margen = Number(nuevoMargen || 0);
    const igv = Number(nuevaTasaIgv || 0);
    const subtotal = base * (1 + margen / 100);
    return subtotal * (1 + igv / 100);
  };

  const precioEjemploPen = (base) => {
    return precioEjemploUsd(base) * Number(nuevoTipoCambio || 0);
  };

  const guardarMargen = async (event) => {
    event.preventDefault();

    if (!margenValido || !tasaIgvValida || !tipoCambioValido) {
      toast.warning('Configuracion invalida', 'Revisa margen, IGV y tipo de cambio antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await actualizarConfiguracionFinanciera({
        margen_ganancia_default: Number(nuevoMargen),
        tasa_igv: Number(nuevaTasaIgv),
        tipo_cambio_usd_pen: Number(nuevoTipoCambio)
      });
      const margen = Number(respuesta?.margen_ganancia ?? nuevoMargen);
      toast.success('Configuracion guardada', `Margen ${margen.toFixed(1)}%, IGV ${Number(respuesta?.tasa_igv ?? nuevaTasaIgv).toFixed(2)}%.`);
    } catch (error) {
      toast.error('No se pudo guardar', error?.mensaje || 'Intenta nuevamente en unos segundos.');
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
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Parámetros financieros</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Define margen por defecto, tasa de IGV y tipo de cambio USD/PEN.
          </p>
        </header>

        <form onSubmit={guardarMargen} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[12rem_12rem_12rem_minmax(0,1fr)]">
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
            <InputField
              id="tasa-igv"
              label="IGV (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={nuevaTasaIgv}
              onChange={(event) => setNuevaTasaIgv(event.target.value)}
              error={!tasaIgvValida ? 'El valor debe estar entre 0 y 100.' : ''}
            />
            <InputField
              id="tipo-cambio"
              label="Tipo cambio USD/PEN"
              type="number"
              min="0.0001"
              step="0.0001"
              value={nuevoTipoCambio}
              onChange={(event) => setNuevoTipoCambio(event.target.value)}
              error={!tipoCambioValido ? 'Debe ser mayor que 0.' : ''}
            />
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3">
              <p className="text-sm text-[var(--color-text-muted)]">Configuración activa</p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-accent-text)]">Margen {Number(margenGanancia).toFixed(1)}%</p>
              <p className="text-sm text-[var(--color-text-muted)]">IGV {Number(tasaIgv).toFixed(2)}%</p>
              <p className="text-sm text-[var(--color-text-muted)]">TC {Number(tipoCambioUsdPen).toFixed(4)}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard title="Base USD 1000" value={formatearMoneda(precioEjemploUsd(1000), 'USD')} helper={`Ref ${formatearMoneda(precioEjemploPen(1000), 'PEN')}`} />
            <StatCard title="Base USD 2500" value={formatearMoneda(precioEjemploUsd(2500), 'USD')} helper={`Ref ${formatearMoneda(precioEjemploPen(2500), 'PEN')}`} />
            <StatCard title="Base USD 5000" value={formatearMoneda(precioEjemploUsd(5000), 'USD')} helper={`Ref ${formatearMoneda(precioEjemploPen(5000), 'PEN')}`} />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={guardando}
              disabled={
                !margenValido
                || !tasaIgvValida
                || !tipoCambioValido
                || (
                  Number(nuevoMargen) === Number(margenGanancia)
                  && Number(nuevaTasaIgv) === Number(tasaIgv)
                  && Number(nuevoTipoCambio) === Number(tipoCambioUsdPen)
                )
              }
            >
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
