/**
 * Página de Perfil de Usuario
 *
 * Muestra la lista de productos favoritos del usuario autenticado,
 * con opción de quitar cada uno y un estado vacío con CTA al cotizador.
 *
 * Valida Requisitos: 4.11, 4.12, 4.13
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../componentes/ui/Button';
import EmptyState from '../componentes/feedback/EmptyState';
import ErrorState from '../componentes/feedback/ErrorState';
import LoadingSpinner from '../componentes/feedback/LoadingSpinner';
import { useToast } from '../componentes/feedback/ToastProvider';
import { useAppContext } from '../contexto/AppContext';
import { obtenerFavoritos, eliminarFavorito } from '../servicios/api';
import { formatearMoneda } from '../utilidades/moneda';

// ─── Icono de corazón relleno ─────────────────────────────────────────────────

function IconoCorazon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}

// ─── Tarjeta de producto favorito ─────────────────────────────────────────────

function TarjetaFavorito({ favorito, onQuitar, quitando }) {
  const { monedaVista, formatearMontoSegunMonedaVista } = useAppContext();

  const precioFormateado = formatearMontoSegunMonedaVista({
    montoUsd: Number(favorito.precio_base ?? 0),
  });

  const precioRef = monedaVista === 'USD'
    ? formatearMoneda(Number(favorito.precio_base ?? 0) * 3.75, 'PEN')
    : formatearMoneda(Number(favorito.precio_base ?? 0), 'USD');

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-surface-soft)]"
    >
      {/* Ícono de favorito */}
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:rgba(255,69,58,0.12)] text-[#FF453A]"
        aria-hidden="true"
      >
        <IconoCorazon className="h-4 w-4" />
      </span>

      {/* Información del producto */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-text)]">
          {favorito.nombre || 'Producto sin nombre'}
        </p>

        {favorito.categoria ? (
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {favorito.categoria}
          </p>
        ) : null}

        {favorito.descripcion_tecnica ? (
          <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
            {favorito.descripcion_tecnica}
          </p>
        ) : null}

        {/* Especificaciones clave */}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {favorito.socket ? (
            <span className="text-xs text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">Socket:</span> {favorito.socket}
            </span>
          ) : null}
          {favorito.ram_type ? (
            <span className="text-xs text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">RAM:</span> {favorito.ram_type}
            </span>
          ) : null}
          {favorito.wattage ? (
            <span className="text-xs text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">Potencia:</span> {favorito.wattage}W
            </span>
          ) : null}
        </div>

        {/* Precio */}
        {favorito.precio_base != null ? (
          <div className="mt-2">
            <span className="text-sm font-semibold text-[var(--color-accent-text)]">
              {precioFormateado}
            </span>
            <span className="ml-2 text-xs text-[var(--color-text-muted)]">
              {precioRef}
            </span>
          </div>
        ) : null}

        {/* Fecha agregado */}
        {favorito.fecha_agregado ? (
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Agregado el{' '}
            {new Date(favorito.fecha_agregado).toLocaleDateString('es-PE', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            })}
          </p>
        ) : null}
      </div>

      {/* Botón quitar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onQuitar(favorito)}
        loading={quitando}
        disabled={quitando}
        aria-label={`Quitar ${favorito.nombre || 'producto'} de favoritos`}
        className="shrink-0 text-[var(--color-text-muted)] hover:text-[#FF453A]"
      >
        {!quitando && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        )}
        <span className="sr-only">Quitar de favoritos</span>
      </Button>
    </motion.article>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Perfil() {
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario } = useAppContext();

  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  // Map de id_producto:tabla_producto → boolean (quitando)
  const [quitandoMap, setQuitandoMap] = useState({});

  const cargarFavoritos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await obtenerFavoritos();
      if (res?.exito) {
        setFavoritos(Array.isArray(res.favoritos) ? res.favoritos : []);
      } else {
        setError(res?.mensaje || 'No se pudieron cargar los favoritos.');
      }
    } catch (err) {
      setError(err?.mensaje || 'No se pudieron cargar los favoritos. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarFavoritos();
  }, [cargarFavoritos]);

  const handleQuitar = useCallback(async (favorito) => {
    const clave = `${favorito.id_producto}:${favorito.tabla_producto}`;
    setQuitandoMap((prev) => ({ ...prev, [clave]: true }));

    // Optimistic update
    setFavoritos((prev) =>
      prev.filter(
        (f) => !(f.id_producto === favorito.id_producto && f.tabla_producto === favorito.tabla_producto)
      )
    );

    try {
      await eliminarFavorito(favorito.id_producto, favorito.tabla_producto);
      toast.success(
        'Favorito eliminado',
        `${favorito.nombre || 'Producto'} fue quitado de tus favoritos.`
      );
    } catch (err) {
      // Revertir si falla
      setFavoritos((prev) => {
        const yaExiste = prev.some(
          (f) => f.id_producto === favorito.id_producto && f.tabla_producto === favorito.tabla_producto
        );
        if (yaExiste) return prev;
        return [...prev, favorito];
      });
      toast.error(
        'No se pudo quitar el favorito',
        err?.mensaje || 'Intenta nuevamente.'
      );
    } finally {
      setQuitandoMap((prev) => {
        const siguiente = { ...prev };
        delete siguiente[clave];
        return siguiente;
      });
    }
  }, [toast]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <header className="surface-elevated p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Mi cuenta
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
          Perfil
        </h1>
        {usuario?.nombre_completo || usuario?.username ? (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {usuario.nombre_completo || usuario.username}
            {usuario.correo ? (
              <span className="ml-2 text-[var(--color-text-muted)]">· {usuario.correo}</span>
            ) : null}
          </p>
        ) : null}
      </header>

      {/* Sección de favoritos */}
      <section aria-labelledby="favoritos-titulo">
        <div className="surface-elevated p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconoCorazon className="h-5 w-5 text-[#FF453A]" />
              <h2
                id="favoritos-titulo"
                className="text-lg font-semibold text-[var(--color-text)]"
              >
                Mis favoritos
              </h2>
              {!cargando && !error && (
                <span className="rounded-full bg-[var(--color-surface-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                  {favoritos.length}
                </span>
              )}
            </div>

            {!cargando && !error && favoritos.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={cargarFavoritos}
                aria-label="Actualizar lista de favoritos"
              >
                Actualizar
              </Button>
            )}
          </div>

          {/* Estado de carga */}
          {cargando && (
            <div
              className="flex min-h-[200px] items-center justify-center"
              aria-busy="true"
              aria-live="polite"
              aria-label="Cargando favoritos"
            >
              <LoadingSpinner label="Cargando favoritos…" />
            </div>
          )}

          {/* Estado de error */}
          {!cargando && error && (
            <ErrorState
              title="No se pudieron cargar los favoritos"
              description={error}
              retryLabel="Reintentar"
              onRetry={cargarFavoritos}
            />
          )}

          {/* Estado vacío */}
          {!cargando && !error && favoritos.length === 0 && (
            <EmptyState
              title="Aún no tienes favoritos"
              description="Marca productos con ❤️ mientras armas tu configuración para acceder a ellos rápidamente desde aquí."
              actionLabel="Ir al cotizador"
              onAction={() => navigate('/cotizador')}
            />
          )}

          {/* Lista de favoritos */}
          {!cargando && !error && favoritos.length > 0 && (
            <ul className="space-y-3" role="list" aria-label="Lista de productos favoritos">
              <AnimatePresence initial={false}>
                {favoritos.map((favorito) => {
                  const clave = `${favorito.id_producto}:${favorito.tabla_producto}`;
                  return (
                    <li key={clave}>
                      <TarjetaFavorito
                        favorito={favorito}
                        onQuitar={handleQuitar}
                        quitando={!!quitandoMap[clave]}
                      />
                    </li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </section>

      {/* CTA al cotizador — siempre visible cuando hay favoritos */}
      {!cargando && !error && favoritos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="surface-elevated p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                ¿Listo para armar tu configuración?
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Usa tus productos favoritos como referencia en el cotizador.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/cotizador')}
              aria-label="Ir al cotizador para armar una configuración"
              className="shrink-0"
            >
              Ir al cotizador
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
