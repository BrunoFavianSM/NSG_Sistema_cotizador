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

/**
 * Selector segmentado de modo de tipo de cambio (Manual / Automático).
 * Cumple WCAG AA: role="radiogroup", focus visible, contraste, touch targets 44px.
 */
function SelectorModoTipoCambio({ modo, onChange, disabled }) {
  const opciones = [
    { valor: 'manual', etiqueta: 'Manual' },
    { valor: 'automatico', etiqueta: 'Automático (API)' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Modo de tipo de cambio"
      className="inline-flex rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-0.5 gap-0.5"
    >
      {opciones.map(({ valor, etiqueta }) => {
        const activo = modo === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            disabled={disabled}
            onClick={() => onChange(valor)}
            className={[
              'min-h-[44px] min-w-[44px] px-4 py-2 rounded-[calc(var(--radius-sm)-2px)] text-sm font-medium transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              activo
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]',
            ].join(' ')}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}

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
    actualizarConfiguracionFinanciera,
    // Tipo de cambio — modo y estados del hook (Requisitos 1.2–1.6, 11.1–11.4)
    modoTipoCambio: modoTipoCambioContexto,
    cargandoTipoCambio,
    advertenciaTipoCambio,
    ultimaActualizacionTC,
    forzarActualizacionTC,
  } = useAppContext();
  const toast = useToast();

  const [nuevoMargen, setNuevoMargen] = useState(String(margenGanancia));
  const [nuevaTasaIgv, setNuevaTasaIgv] = useState(String(tasaIgv));
  const [nuevoTipoCambio, setNuevoTipoCambio] = useState(String(tipoCambioUsdPen));
  const [guardando, setGuardando] = useState(false);

  // Estado local del modo sincronizado con el contexto (Requisito 1.2)
  const [modoTipoCambio, setModoTipoCambio] = useState(modoTipoCambioContexto);
  const [guardandoModo, setGuardandoModo] = useState(false);

  const [estadisticasIA, setEstadisticasIA] = useState(null);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  const [errorEstadisticas, setErrorEstadisticas] = useState('');
  const [limpiando, setLimpiando] = useState(false);

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

  // Sincronizar estado local de modo cuando cambia el contexto (Requisito 1.2)
  useEffect(() => {
    setModoTipoCambio(modoTipoCambioContexto);
  }, [modoTipoCambioContexto]);

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

    // En modo manual el tipo de cambio es editable; en automático se ignora el campo
    const tipoCambioAGuardar = modoTipoCambio === 'manual' ? nuevoTipoCambio : String(tipoCambioUsdPen);
    const tipoCambioValidoParaGuardar = modoTipoCambio === 'automatico' || tipoCambioValido;

    if (!margenValido || !tasaIgvValida || !tipoCambioValidoParaGuardar) {
      toast.warning('Configuracion invalida', 'Revisa margen, IGV y tipo de cambio antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await actualizarConfiguracionFinanciera({
        margen_ganancia_default: Number(nuevoMargen),
        tasa_igv: Number(nuevaTasaIgv),
        tipo_cambio_usd_pen: Number(tipoCambioAGuardar)
      });
      const margen = Number(respuesta?.margen_ganancia ?? nuevoMargen);
      toast.success('Configuracion guardada', `Margen ${margen.toFixed(1)}%, IGV ${Number(respuesta?.tasa_igv ?? nuevaTasaIgv).toFixed(2)}%.`);
    } catch (error) {
      toast.error('No se pudo guardar', error?.mensaje || 'Intenta nuevamente en unos segundos.');
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Guarda el modo de tipo de cambio en el backend (Requisito 1.5).
   * No pierde valores ingresados si la petición falla (Requisito 1.6).
   */
  const guardarModo = async () => {
    setGuardandoModo(true);
    try {
      await api.actualizarModoTipoCambio(modoTipoCambio);
      toast.success(
        'Modo guardado',
        modoTipoCambio === 'manual'
          ? 'Tipo de cambio en modo manual.'
          : 'Tipo de cambio en modo automático (API).'
      );
    } catch (error) {
      // No revertir el estado local — el usuario puede reintentar (Requisito 1.6)
      toast.error('No se pudo guardar el modo', error?.mensaje || 'Intenta nuevamente en unos segundos.');
    } finally {
      setGuardandoModo(false);
    }
  };

  const handleLimpiarCatalogo = async () => {
    if (!window.confirm('¿Estás seguro de que deseas limpiar todo el catálogo? Esta acción eliminará todos los productos de las 23 tablas y no se puede deshacer.')) {
      return;
    }

    setLimpiando(true);
    try {
      const respuesta = await api.limpiarCatalogo();
      toast.success('Éxito', respuesta.mensaje);
    } catch (error) {
      toast.error('Error', error?.mensaje || 'No se pudo limpiar el catálogo.');
    } finally {
      setLimpiando(false);
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
          {/* ── Selector de modo de tipo de cambio (Requisito 1.2) ── */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-[var(--color-text)]">
                Modo de tipo de cambio
              </label>
              <SelectorModoTipoCambio
                modo={modoTipoCambio}
                onChange={setModoTipoCambio}
                disabled={guardandoModo}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={guardandoModo}
                disabled={guardandoModo || modoTipoCambio === modoTipoCambioContexto}
                onClick={guardarModo}
                className="min-h-[44px]"
              >
                Guardar modo
              </Button>
            </div>

            {/* ── Modo automático: valor en solo lectura + controles (Requisito 1.4) ── */}
            {modoTipoCambio === 'automatico' && (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Indicador de carga (Requisito 11.1) */}
                  {cargandoTipoCambio ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                      <LoadingSpinner size="sm" />
                      <span>Obteniendo tipo de cambio…</span>
                    </div>
                  ) : (
                    <div>
                      {/* Valor en solo lectura (Requisito 11.2) */}
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                        Tipo de cambio (API)
                      </p>
                      <p className="mt-0.5 text-2xl font-semibold text-[var(--color-text)]">
                        {formatearMoneda(tipoCambioUsdPen, 'PEN').replace('S/', '')} PEN/USD
                      </p>
                      {ultimaActualizacionTC && (
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          Actualizado:{' '}
                          {new Intl.DateTimeFormat('es-PE', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(ultimaActualizacionTC)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Botón forzar actualización (Requisito 2.9) */}
                  <Button
                    type="button"
                    variant="secondary"
                    loading={cargandoTipoCambio}
                    disabled={cargandoTipoCambio}
                    onClick={forzarActualizacionTC}
                    className="min-h-[44px]"
                  >
                    Actualizar tipo de cambio
                  </Button>
                </div>

                {/* Advertencia de valor de respaldo (Requisito 11.3) */}
                {advertenciaTipoCambio && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-[color:rgba(255,214,10,0.45)] bg-[color:rgba(255,214,10,0.10)] px-3 py-2"
                  >
                    <span aria-hidden="true" className="mt-0.5 text-yellow-500">⚠</span>
                    <p className="text-sm text-[var(--color-text)]">{advertenciaTipoCambio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

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
            {/* Campo manual: visible solo en modo manual (Requisito 1.3) */}
            {modoTipoCambio === 'manual' ? (
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
            ) : (
              /* Placeholder vacío para mantener el grid en modo automático */
              <div aria-hidden="true" />
            )}
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
                || (modoTipoCambio === 'manual' && !tipoCambioValido)
                || (
                  Number(nuevoMargen) === Number(margenGanancia)
                  && Number(nuevaTasaIgv) === Number(tasaIgv)
                  && (modoTipoCambio === 'automatico' || Number(nuevoTipoCambio) === Number(tipoCambioUsdPen))
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

      <section className="surface-elevated p-6 border-l-4 border-[var(--color-danger)]">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Mantenimiento (Testeo)</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Acciones destructivas para facilitar pruebas de desarrollo.
          </p>
        </header>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between p-4 rounded-[var(--radius-md)] bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20">
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-400">Limpiar Catálogo de Productos</p>
            <p className="text-xs text-red-700 dark:text-red-500/80">Vacía las 23 tablas de productos inmediatamente. Útil antes de una nueva importación CSV.</p>
          </div>
          <Button 
            variant="danger" 
            onClick={handleLimpiarCatalogo} 
            loading={limpiando}
            className="shrink-0"
          >
            Limpiar todo el catálogo
          </Button>
        </div>
      </section>
    </div>
  );
}
