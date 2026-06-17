import { useEffect, useState } from 'react';
import { cn } from './cn';

/**
 * Imagen de producto/componente a partir de una URL externa (Icecat/Deltron).
 *
 * - Si no hay `src` válido, no renderiza nada (sin caja vacía).
 * - Si la imagen falla al cargar, se oculta (sin ícono de imagen rota).
 * - Carga diferida y decodificación asíncrona para no bloquear el render.
 * - Contenedor con tokens globales (compatible con dark mode).
 */
export default function ImagenProducto({ src, alt = '', className = '', imgClassName = '' }) {
  const [conError, setConError] = useState(false);

  // Reiniciar el estado de error si cambia la URL (reuso de la tarjeta en listas).
  useEffect(() => {
    setConError(false);
  }, [src]);

  const url = typeof src === 'string' ? src.trim() : '';
  if (!url || conError) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-3',
        className
      )}
    >
      <img
        src={url}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setConError(true)}
        className={cn('max-h-40 w-full object-contain', imgClassName)}
      />
    </div>
  );
}
