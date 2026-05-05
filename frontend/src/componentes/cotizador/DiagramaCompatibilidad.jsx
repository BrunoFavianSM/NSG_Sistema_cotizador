/**
 * DiagramaCompatibilidad
 *
 * Renderiza un diagrama SVG con nodos para los 5 componentes principales
 * (CPU, Motherboard, RAM, GPU, Fuente de poder) y líneas de conexión que
 * reflejan el estado de compatibilidad entre ellos.
 *
 * Comportamiento:
 * - Nodos con componente seleccionado: nombre del producto, color activo.
 * - Nodos sin componente: estado deshabilitado (color neutro, opacidad reducida).
 * - Líneas verdes (#34C759) cuando los componentes conectados son compatibles.
 * - Líneas rojas (#FF453A) + ícono de advertencia cuando hay incompatibilidad.
 * - Respeta prefers-reduced-motion desactivando transiciones CSS.
 * - Responsivo: se adapta al ancho del contenedor.
 * - Accesible: role="img" + aria-label descriptivo del estado global.
 *
 * Valida Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */

import { useMemo } from 'react';

// ── Constantes de diseño ──────────────────────────────────────────────────────

const COLOR_COMPATIBLE = '#34C759';
const COLOR_INCOMPATIBLE = '#FF453A';
const COLOR_NEUTRO_LINEA = 'var(--color-border)';

// Dimensiones del viewBox (coordenadas internas del SVG)
const VB_W = 480;
const VB_H = 320;

// Radio de los nodos
const R_NODO = 38;

/**
 * Posiciones (cx, cy) de cada nodo dentro del viewBox 480×320.
 * Disposición:
 *
 *        [CPU]          [Motherboard]        [RAM]
 *
 *              [GPU]              [Fuente]
 */
const POSICIONES = {
  procesador:  { cx: 80,  cy: 100 },
  placa_madre: { cx: 240, cy: 100 },
  ram:         { cx: 400, cy: 100 },
  gpu:         { cx: 150, cy: 230 },
  fuente:      { cx: 330, cy: 230 },
};

/**
 * Conexiones entre nodos.
 * Cada entrada define qué par de nodos conecta y qué clave de incompatibilidad
 * buscar en el array de errores para colorear la línea en rojo.
 *
 * La detección de incompatibilidad es heurística: busca palabras clave del
 * mensaje de error que relacionen los dos componentes.
 */
const CONEXIONES = [
  {
    id: 'cpu-mb',
    desde: 'procesador',
    hasta: 'placa_madre',
    palabrasClave: ['socket', 'procesador', 'placa'],
  },
  {
    id: 'mb-ram',
    desde: 'placa_madre',
    hasta: 'ram',
    palabrasClave: ['ram', 'memoria', 'ddr'],
  },
  {
    id: 'mb-gpu',
    desde: 'placa_madre',
    hasta: 'gpu',
    palabrasClave: ['gpu', 'grafica', 'video', 'pcie'],
  },
  {
    id: 'fuente-cpu',
    desde: 'fuente',
    hasta: 'procesador',
    palabrasClave: ['fuente', 'watt', 'potencia', 'energia'],
  },
  {
    id: 'fuente-mb',
    desde: 'fuente',
    hasta: 'placa_madre',
    palabrasClave: ['fuente', 'watt', 'potencia', 'energia'],
  },
  {
    id: 'fuente-ram',
    desde: 'fuente',
    hasta: 'ram',
    palabrasClave: ['fuente', 'watt', 'potencia', 'energia'],
  },
  {
    id: 'fuente-gpu',
    desde: 'fuente',
    hasta: 'gpu',
    palabrasClave: ['fuente', 'watt', 'potencia', 'energia', 'gpu'],
  },
];

// Etiquetas legibles para los nodos
const ETIQUETAS = {
  procesador:  'CPU',
  placa_madre: 'Motherboard',
  ram:         'RAM',
  gpu:         'GPU',
  fuente:      'Fuente',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Trunca un nombre de producto para que quepa dentro del nodo.
 * Devuelve hasta dos líneas de texto.
 *
 * @param {string} nombre
 * @returns {string[]} Array de 1 o 2 líneas
 */
function truncarNombre(nombre) {
  if (!nombre) return [];
  // Tomar las primeras dos palabras significativas
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length <= 2) return [palabras.join(' ')];
  // Primera línea: primeras 2 palabras; segunda línea: siguiente palabra + "…"
  const linea1 = palabras.slice(0, 2).join(' ');
  const linea2 = palabras[2] + (palabras.length > 3 ? '…' : '');
  return [linea1, linea2];
}

/**
 * Determina si algún error de compatibilidad afecta a una conexión específica.
 *
 * @param {string[]} errores
 * @param {string[]} palabrasClave
 * @returns {boolean}
 */
function conexionTieneError(errores, palabrasClave) {
  if (!errores || errores.length === 0) return false;
  const texto = errores.join(' ').toLowerCase();
  return palabrasClave.some((kw) => texto.includes(kw.toLowerCase()));
}

/**
 * Calcula el punto medio de una línea para posicionar el ícono de advertencia.
 */
function puntoMedio(x1, y1, x2, y2) {
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

/**
 * Calcula el punto en el borde del nodo (círculo) en dirección al otro nodo.
 * Devuelve el punto de inicio/fin de la línea para que no se superponga al nodo.
 */
function puntoEnBorde(cx, cy, targetX, targetY, radio) {
  const dx = targetX - cx;
  const dy = targetY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: cx, y: cy };
  return {
    x: cx + (dx / dist) * radio,
    y: cy + (dy / dist) * radio,
  };
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

/**
 * Ícono de advertencia (triángulo con !) para líneas incompatibles.
 * Se renderiza en el punto medio de la línea.
 */
function IconoAdvertencia({ x, y }) {
  return (
    <g transform={`translate(${x - 8}, ${y - 8})`} aria-hidden="true">
      {/* Fondo blanco/oscuro para contraste */}
      <circle cx="8" cy="8" r="8" fill="var(--color-bg)" />
      {/* Triángulo de advertencia */}
      <path
        d="M8 2 L14.5 13 L1.5 13 Z"
        fill={COLOR_INCOMPATIBLE}
        stroke="none"
      />
      {/* Signo de exclamación */}
      <text
        x="8"
        y="12"
        textAnchor="middle"
        fontSize="7"
        fontWeight="bold"
        fill="white"
        style={{ userSelect: 'none' }}
      >
        !
      </text>
    </g>
  );
}

/**
 * Nodo individual del diagrama.
 */
function Nodo({ id, cx, cy, producto, activo }) {
  const etiqueta = ETIQUETAS[id] || id;
  const lineasNombre = activo ? truncarNombre(producto?.nombre) : [];

  // Colores según estado
  const colorFondo = activo
    ? 'var(--color-accent-soft)'
    : 'var(--color-surface-soft)';
  const colorBorde = activo
    ? 'var(--color-accent)'
    : 'var(--color-border)';
  const colorTextoEtiqueta = activo
    ? 'var(--color-accent-text)'
    : 'var(--color-text-muted)';
  const opacidad = activo ? 1 : 0.5;

  return (
    <g opacity={opacidad} aria-hidden="true">
      {/* Círculo del nodo */}
      <circle
        cx={cx}
        cy={cy}
        r={R_NODO}
        fill={colorFondo}
        stroke={colorBorde}
        strokeWidth={activo ? 2 : 1.5}
      />

      {/* Etiqueta del tipo de componente (siempre visible) */}
      <text
        x={cx}
        y={activo && lineasNombre.length > 0 ? cy - 14 : cy - 6}
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill={colorTextoEtiqueta}
        letterSpacing="0.06em"
        style={{ textTransform: 'uppercase', userSelect: 'none' }}
      >
        {etiqueta}
      </text>

      {/* Nombre del producto (solo si hay componente seleccionado) */}
      {activo && lineasNombre.length > 0 && (
        <>
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fontSize="8"
            fontWeight="500"
            fill="var(--color-text)"
            style={{ userSelect: 'none' }}
          >
            {lineasNombre[0]}
          </text>
          {lineasNombre[1] && (
            <text
              x={cx}
              y={cy + 15}
              textAnchor="middle"
              fontSize="8"
              fontWeight="500"
              fill="var(--color-text)"
              style={{ userSelect: 'none' }}
            >
              {lineasNombre[1]}
            </text>
          )}
        </>
      )}

      {/* Punto indicador de "sin selección" */}
      {!activo && (
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontSize="10"
          fill="var(--color-text-muted)"
          style={{ userSelect: 'none' }}
        >
          —
        </text>
      )}
    </g>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

/**
 * @param {{
 *   configuracionSeleccionada: {
 *     procesador: Object|null,
 *     placa_madre: Object|null,
 *     ram: Object[],
 *     gpu: Object|null,
 *     fuente: Object|null,
 *   },
 *   incompatibilidades: string[],
 * }} props
 */
export default function DiagramaCompatibilidad({ configuracionSeleccionada, incompatibilidades = [] }) {
  // Normalizar: ram puede ser array o null
  const config = {
    procesador:  configuracionSeleccionada?.procesador  ?? null,
    placa_madre: configuracionSeleccionada?.placa_madre ?? null,
    ram:         Array.isArray(configuracionSeleccionada?.ram) && configuracionSeleccionada.ram.length > 0
                   ? configuracionSeleccionada.ram[0]
                   : null,
    gpu:         configuracionSeleccionada?.gpu         ?? null,
    fuente:      configuracionSeleccionada?.fuente      ?? null,
  };

  // Determinar si hay al menos un componente seleccionado (Req. 7.2)
  const hayAlgunComponente = Object.values(config).some(Boolean);
  if (!hayAlgunComponente) return null;

  // ── Calcular estado de cada conexión ────────────────────────────────────
  const estadoConexiones = useMemo(() => {
    return CONEXIONES.map((conexion) => {
      const desdeActivo = Boolean(config[conexion.desde]);
      const hastaActivo = Boolean(config[conexion.hasta]);
      const ambosActivos = desdeActivo && hastaActivo;

      let color = COLOR_NEUTRO_LINEA;
      let tieneError = false;

      if (ambosActivos) {
        tieneError = conexionTieneError(incompatibilidades, conexion.palabrasClave);
        color = tieneError ? COLOR_INCOMPATIBLE : COLOR_COMPATIBLE;
      }

      return { ...conexion, ambosActivos, color, tieneError };
    });
  }, [config, incompatibilidades]);

  // ── Construir aria-label descriptivo (Req. 7.7) ─────────────────────────
  const ariaLabel = useMemo(() => {
    const componentesActivos = Object.entries(config)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => ETIQUETAS[k] || k);

    if (componentesActivos.length === 0) return 'Diagrama de compatibilidad sin componentes seleccionados';

    const hayErrores = incompatibilidades.length > 0;
    const resumen = hayErrores
      ? `Incompatibilidades detectadas: ${incompatibilidades.join('; ')}`
      : 'Todos los componentes seleccionados son compatibles';

    return `Diagrama de compatibilidad. Componentes seleccionados: ${componentesActivos.join(', ')}. ${resumen}`;
  }, [config, incompatibilidades]);

  return (
    <section
      className="surface-elevated overflow-hidden rounded-[var(--radius-lg)] p-4"
      aria-label="Diagrama de compatibilidad de componentes"
    >
      {/* Encabezado */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          Compatibilidad visual
        </h3>
        {/* Indicador de estado global */}
        {incompatibilidades.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:rgba(255,69,58,0.12)] px-2.5 py-1 text-xs font-semibold text-[#FF453A]">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Incompatible
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:rgba(52,199,89,0.12)] px-2.5 py-1 text-xs font-semibold text-[#34C759]">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 4 4L19 6" />
            </svg>
            Compatible
          </span>
        )}
      </div>

      {/* SVG responsivo (Req. 7.9) */}
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        style={{
          maxHeight: '260px',
          // Desactivar animaciones si prefers-reduced-motion (Req. 7.8)
          // Las transiciones CSS se controlan con la clase motion-safe
        }}
      >
        {/* Definición de marcadores de flecha (no usados, pero reservados) */}
        <defs>
          {/* Filtro de sombra suave para nodos activos */}
          <filter id="nodo-sombra" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* ── Líneas de conexión (se dibujan antes que los nodos) ── */}
        {estadoConexiones.map((conexion) => {
          const posDesde = POSICIONES[conexion.desde];
          const posHasta = POSICIONES[conexion.hasta];

          // Calcular puntos en el borde de cada nodo
          const inicio = puntoEnBorde(posDesde.cx, posDesde.cy, posHasta.cx, posHasta.cy, R_NODO + 2);
          const fin    = puntoEnBorde(posHasta.cx, posHasta.cy, posDesde.cx, posDesde.cy, R_NODO + 2);
          const medio  = puntoMedio(inicio.x, inicio.y, fin.x, fin.y);

          // Opacidad: línea activa si ambos nodos tienen componente
          const opacidadLinea = conexion.ambosActivos ? 1 : 0.25;

          return (
            <g key={conexion.id} aria-hidden="true">
              <line
                x1={inicio.x}
                y1={inicio.y}
                x2={fin.x}
                y2={fin.y}
                stroke={conexion.color}
                strokeWidth={conexion.ambosActivos ? 2 : 1.5}
                strokeDasharray={conexion.ambosActivos ? 'none' : '4 3'}
                opacity={opacidadLinea}
                className="motion-safe:transition-all motion-safe:duration-300"
              />
              {/* Ícono de advertencia en el punto medio (Req. 7.4) */}
              {conexion.tieneError && (
                <IconoAdvertencia x={medio.x} y={medio.y} />
              )}
            </g>
          );
        })}

        {/* ── Nodos ── */}
        {Object.entries(POSICIONES).map(([id, { cx, cy }]) => {
          const producto = config[id];
          const activo = Boolean(producto);
          return (
            <Nodo
              key={id}
              id={id}
              cx={cx}
              cy={cy}
              producto={producto}
              activo={activo}
            />
          );
        })}
      </svg>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[var(--color-border)] pt-3">
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <span className="inline-block h-2.5 w-5 rounded-sm" style={{ backgroundColor: COLOR_COMPATIBLE }} aria-hidden="true" />
          Compatible
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <span className="inline-block h-2.5 w-5 rounded-sm" style={{ backgroundColor: COLOR_INCOMPATIBLE }} aria-hidden="true" />
          Incompatible
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <span className="inline-block h-2.5 w-5 rounded-sm border border-dashed border-[var(--color-border)]" aria-hidden="true" />
          Sin seleccionar
        </span>
      </div>
    </section>
  );
}
