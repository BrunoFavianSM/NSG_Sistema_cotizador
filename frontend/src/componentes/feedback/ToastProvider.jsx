import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../ui/cn';

const ToastContext = createContext(null);
let toastId = 0;

const TOAST_TONE_STYLES = {
  info: {
    wrapper: 'border-[color:rgba(10,132,255,0.35)] bg-[var(--color-surface)]',
    icon: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]',
  },
  success: {
    wrapper: 'border-[color:rgba(48,209,88,0.45)] bg-[var(--color-surface)]',
    icon: 'bg-[color:rgba(48,209,88,0.18)] text-[var(--color-success)]',
  },
  warning: {
    wrapper: 'border-[color:rgba(255,214,10,0.52)] bg-[var(--color-surface)]',
    icon: 'bg-[color:rgba(255,214,10,0.18)] text-[var(--color-warning)]',
  },
  error: {
    wrapper: 'border-[color:rgba(255,69,58,0.45)] bg-[var(--color-surface)]',
    icon: 'bg-[color:rgba(255,69,58,0.18)] text-[var(--color-danger)]',
  },
};

function ToastIcon({ tone }) {
  if (tone === 'success') {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  if (tone === 'error') {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v5m0 3h.01" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.3 3.8L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z" />
      </svg>
    );
  }

  if (tone === 'warning') {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.3 3.8L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.8a2 2 0 00-3.4 0z" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M12 10v5m0-8h.01" />
    </svg>
  );
}

function ToastItem({ toast, onClose }) {
  const toneStyle = TOAST_TONE_STYLES[toast.tone] || TOAST_TONE_STYLES.info;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'pointer-events-auto rounded-[var(--radius-md)] border px-3 py-3 shadow-hig2',
        toneStyle.wrapper
      )}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-[1px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
            toneStyle.icon
          )}
          aria-hidden="true"
        >
          <ToastIcon tone={toast.tone} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--color-text)]">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{toast.description}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="min-h-11 min-w-11 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] transition-colors duration-higNormal ease-hig hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
          aria-label="Cerrar notificación"
        >
          <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </motion.li>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    ({ title, description = '', tone = 'info', duration = 2800 }) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, title, description, tone }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    },
    []
  );

  const api = useMemo(
    () => ({
      show,
      info: (title, description = '', options = {}) => show({ title, description, tone: 'info', ...options }),
      success: (title, description = '', options = {}) => show({ title, description, tone: 'success', ...options }),
      warning: (title, description = '', options = {}) => show({ title, description, tone: 'warning', ...options }),
      error: (title, description = '', options = {}) => show({ title, description, tone: 'error', ...options }),
      dismiss,
    }),
    [dismiss, show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-3 z-[80] px-3 sm:top-4 sm:px-4"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="mx-auto flex max-w-[1280px] justify-end">
          <ul className="w-full max-w-sm space-y-2">
            <AnimatePresence initial={false}>
              {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={dismiss} />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }

  return context;
}
