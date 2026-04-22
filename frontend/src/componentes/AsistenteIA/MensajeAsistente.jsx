/**
 * MensajeAsistente.jsx
 *
 * Burbuja de mensaje del asistente IA.
 * - border-radius: 24px 24px 24px 4px
 * - max-width: 80%, padding: 12px 16px
 * - bg: surface-soft, shadow-hig3
 * - Timestamp en text-[11px] alineado a la izquierda
 *
 * Requisitos: 9.4, 9.5, 9.1
 */

/**
 * Formatea un timestamp a hora legible en español
 */
function formatearHora(timestamp) {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Props:
 * - contenido: string — texto del mensaje
 * - timestamp: string | Date — momento del mensaje
 * - children: ReactNode — contenido adicional (semáforo, configuración, etc.)
 */
export default function MensajeAsistente({ contenido, timestamp, children }) {
  const hora = formatearHora(timestamp);

  return (
    <div className="flex flex-col items-start gap-1 max-w-[80%]">
      {/* Burbuja principal */}
      <div
        className={[
          'px-4 py-3',
          'bg-[var(--color-surface-soft)]',
          'text-[var(--color-text)]',
          'text-sm leading-relaxed',
          // Sombra HIG nivel 3 (shadow-hig3 → shadow-2 del sistema)
          'shadow-[var(--shadow-2)]',
        ].join(' ')}
        style={{ borderRadius: '24px 24px 24px 4px' }}
      >
        {/* Texto del mensaje */}
        {contenido && (
          <p className="whitespace-pre-wrap break-words">{contenido}</p>
        )}

        {/* Contenido adicional (semáforo, configuración propuesta, etc.) */}
        {children && (
          <div className="mt-3 flex flex-col gap-3">
            {children}
          </div>
        )}
      </div>

      {/* Timestamp */}
      {hora && (
        <span
          className="text-[11px] text-[var(--color-text-muted)] px-1"
          aria-label={`Enviado a las ${hora}`}
        >
          {hora}
        </span>
      )}
    </div>
  );
}
