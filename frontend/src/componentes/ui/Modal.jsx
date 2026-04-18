import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from './cn';

export default function Modal({
  open,
  title,
  description = '',
  onClose,
  children,
  footer = null,
  size = 'md',
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;
    document.body.style.overflow = 'hidden';

    const getFocusable = () => {
      if (!dialogRef.current) return [];
      return Array.from(
        dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    requestAnimationFrame(() => {
      const focusables = getFocusable();
      if (focusables.length > 0) {
        const prioridad = focusables.find((item) => item.matches('[data-autofocus="true"]'));
        const sinCerrar = focusables.find((item) => !item.matches('[data-modal-close="true"]'));
        const objetivo = prioridad || sinCerrar || focusables[0];
        objetivo.focus();
      } else if (dialogRef.current) {
        dialogRef.current.focus();
      }
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key === 'Tab') {
        const focusables = getFocusable();
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const isShift = event.shiftKey;

        if (!isShift && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (isShift && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [open]);

  const widthClass = {
    sm: 'max-w-lg',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  }[size] || 'max-w-2xl';

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'surface-elevated relative z-10 w-full max-h-[90vh] overflow-y-auto p-6',
              widthClass
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
          >
            <header className="mb-5 flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
              <div>
                <h2 id={titleId} className="text-xl font-semibold text-[var(--color-text)]">{title}</h2>
                {description ? <p id={descriptionId} className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                data-modal-close="true"
                className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
                aria-label="Cerrar diálogo"
              >
                <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            <div>{children}</div>

            {footer ? (
              <footer className="mt-6 border-t border-[var(--color-border)] pt-4">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

