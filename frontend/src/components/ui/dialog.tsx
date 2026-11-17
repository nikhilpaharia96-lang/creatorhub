import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useReducedMotion } from "../../lib/theme/use-reduced-motion";

interface DialogContextValue {
  onClose: () => void;
  titleId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(componentName: string): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(`${componentName} must be used within a Dialog`);
  }
  return context;
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Optional id override for the title element (for aria-labelledby). Auto-generated if omitted. */
  titleId?: string;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

/**
 * CreatorHub primitive Dialog (modal). Portal-rendered, traps focus,
 * closes on Escape and backdrop click, restores focus to the trigger
 * element on close. Backdrop uses surface-overlay + blur-lg per the
 * approved blur token governance (overlays only). z-overlay/z-modal
 * tokens control stacking. Navigation Motion category for enter/exit,
 * respecting prefers-reduced-motion.
 */
export function Dialog({ open, onClose, children, titleId }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const generatedTitleId = useRef(
    titleId ?? `dialog-title-${Math.random().toString(36).slice(2, 9)}`
  ).current;

  useEffect(() => {
    if (!open) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    const container = dialogRef.current;
    const focusable = container ? getFocusableElements(container) : [];
    (focusable[0] ?? container)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "Tab" && container) {
        const elements = getFocusableElements(container);
        if (elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    };
  }, [open, onClose]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return createPortal(
    <DialogContext.Provider value={{ onClose, titleId: generatedTitleId }}>
      <div
        className="fixed inset-0 z-overlay bg-surface-overlay backdrop-blur-lg motion-navigation flex items-center justify-center p-4"
        onMouseDown={handleBackdropClick}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={generatedTitleId}
          tabIndex={-1}
          className="z-modal w-full max-w-md rounded-surface-soft bg-surface-floating shadow-lg p-6 motion-navigation focus:outline-none"
          style={
            prefersReducedMotion
              ? undefined
              : { animation: "dialog-enter 200ms cubic-bezier(0.4,0,0.2,1)" }
          }
        >
          {children}
        </div>
      </div>
      <style>{`
        @keyframes dialog-enter {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </DialogContext.Provider>,
    document.body
  );
}

export function DialogHeader({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
}

export function DialogTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogContext("DialogTitle");
  return (
    <h2
      id={titleId}
      className={`type-heading-md text-text-primary ${className ?? ""}`}
      {...rest}
    >
      {children}
    </h2>
  );
}

export function DialogDescription({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`type-body-small text-text-secondary mt-1 ${className ?? ""}`} {...rest}>
      {children}
    </p>
  );
}

export function DialogCloseButton() {
  const { onClose } = useDialogContext("DialogCloseButton");
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close dialog"
      className="shrink-0 rounded-interactive p-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle motion-feedback focus-ring"
    >
      <X size={20} aria-hidden="true" />
    </button>
  );
}

export function DialogFooter({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-end gap-3 mt-6 ${className ?? ""}`}
      {...rest}
    >
      {children}
    </div>
  );
}
