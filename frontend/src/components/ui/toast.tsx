import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id" | "duration"> & { duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "border-status-success-border",
  error: "border-status-error-border",
  info: "border-border-focus",
};

const VARIANT_ICON_CLASSES: Record<ToastVariant, string> = {
  success: "text-status-success-icon",
  error: "text-status-error-icon",
  info: "text-interactive-primary",
};

/**
 * CreatorHub Toast system. Single provider mounted once at the app
 * root (see AppProviders extension point). Toasts stack bottom-right
 * on desktop / bottom on mobile, auto-dismiss after `duration`ms,
 * announce via aria-live so screen reader users hear confirmations
 * without focus being stolen. z-toast token controls stacking above
 * dialogs per the approved z-index scale.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback<ToastContextValue["showToast"]>(
    ({ title, description, variant, duration = 5000 }) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((current) => [...current, { id, title, description, variant, duration }]);
      const timer = setTimeout(() => dismissToast(id), duration);
      timers.current.set(id, timer);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed bottom-4 right-4 left-4 sm:left-auto z-toast flex flex-col gap-3 items-stretch sm:items-end pointer-events-none"
              aria-live="polite"
              aria-atomic="false"
            >
              {toasts.map((toast) => {
                const Icon = VARIANT_ICON[toast.variant];
                return (
                  <div
                    key={toast.id}
                    role="status"
                    className={`pointer-events-auto w-full sm:w-96 rounded-surface-soft bg-surface-floating shadow-lg border p-4 flex gap-3 items-start motion-navigation ${VARIANT_CLASSES[toast.variant]}`}
                  >
                    <Icon
                      size={20}
                      className={`shrink-0 mt-0.5 ${VARIANT_ICON_CLASSES[toast.variant]}`}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="type-label text-text-primary">{toast.title}</p>
                      {toast.description ? (
                        <p className="type-body-small text-text-secondary mt-0.5">
                          {toast.description}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissToast(toast.id)}
                      aria-label="Dismiss notification"
                      className="shrink-0 rounded-interactive p-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle motion-feedback focus-ring"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

/** Access the toast trigger function. Must be used within ToastProvider. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
