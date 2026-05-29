/**
 * MensajeAsistente.jsx
 *
 * Burbuja de mensaje del asistente IA.
 */

/**
 * Formatea un timestamp a hora legible en espanol.
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

function renderTextoConNegrita(texto = '') {
  const partes = String(texto).split(/(\*\*[^*]+\*\*)/g);
  return partes.map((parte, idx) => {
    if (parte.startsWith('**') && parte.endsWith('**')) {
      return <strong key={idx}>{parte.slice(2, -2)}</strong>;
    }
    return <span key={idx}>{parte}</span>;
  });
}

function renderContenidoFormateado(contenido = '') {
  const lineas = String(contenido).split(/\r?\n/);
  const bloques = [];
  let listaActual = [];
  const patronItemLista = /^((\d+[\).\s]+)|[-*•]\s+|\.\s+)/;

  const cerrarLista = () => {
    if (listaActual.length > 0) {
      bloques.push(
        <ul key={`lista-${bloques.length}`} className="list-disc pl-5 space-y-1">
          {listaActual.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderTextoConNegrita(item)}
            </li>
          ))}
        </ul>
      );
      listaActual = [];
    }
  };

  lineas.forEach((linea) => {
    const l = linea.trim();
    const esItem = patronItemLista.test(l);
    if (esItem) {
      listaActual.push(l.replace(patronItemLista, ''));
      return;
    }

    cerrarLista();
    if (l === '') {
      bloques.push(<div key={`esp-${bloques.length}`} className="h-2" />);
      return;
    }

    bloques.push(
      <p key={`p-${bloques.length}`} className="leading-relaxed">
        {renderTextoConNegrita(l)}
      </p>
    );
  });

  cerrarLista();
  return bloques;
}

export default function MensajeAsistente({ contenido, timestamp, children }) {
  const hora = formatearHora(timestamp);

  return (
    <div className="flex max-w-[82%] flex-col items-start gap-1.5">
      <div
        className={[
          'rounded-[18px] rounded-bl-md px-4 py-3',
          'border border-[var(--color-border)] bg-[var(--color-surface)]',
          'text-[var(--color-text)] shadow-[var(--shadow-1)]',
          'text-sm leading-relaxed',
        ].join(' ')}
      >
        {contenido && (
          <div className="break-words text-sm">{renderContenidoFormateado(contenido)}</div>
        )}

        {children && (
          <div className="mt-3 flex flex-col gap-3">
            {children}
          </div>
        )}
      </div>

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
