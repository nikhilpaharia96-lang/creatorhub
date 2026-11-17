import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import { AlertCircle } from "lucide-react";

type InputSize = "sm" | "md" | "lg";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: InputSize;
  /** Label text rendered above the input. */
  label?: string;
  /** Helper text shown below the input when there's no error. */
  helperText?: string;
  /** Error message. When set, input renders in error state and helperText is hidden. */
  errorText?: string;
  /** Icon rendered inside the input, left side. */
  leadingIcon?: ReactNode;
  /** Icon rendered inside the input, right side. */
  trailingIcon?: ReactNode;
  /** Makes the input span the full width of its container. Defaults to true. */
  fullWidth?: boolean;
}

const SIZE_CLASSES: Record<InputSize, string> = {
  sm: "h-9 px-3 type-body-small",
  md: "h-11 px-4 type-body",
  lg: "h-13 px-4 type-body",
};

const ICON_SIZE_PX: Record<InputSize, number> = {
  sm: 16,
  md: 20,
  lg: 20,
};

/**
 * CreatorHub primitive Input. Text input with label, helper/error text,
 * and optional leading/trailing icons. Follows the Component Contract:
 * native <input> for accessibility, 44px+ tap target at md/lg, focus
 * ring via the shared .focus-ring utility, error state announced via
 * aria-invalid + aria-describedby, Feedback Motion on border/ring
 * transitions, 16px minimum font size at md/lg to avoid iOS auto-zoom.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = "md",
    label,
    helperText,
    errorText,
    leadingIcon,
    trailingIcon,
    fullWidth = true,
    className,
    disabled,
    id,
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const hasError = Boolean(errorText);
  const iconSize = ICON_SIZE_PX[size];

  return (
    <div className={cn(fullWidth && "w-full", "flex flex-col gap-1.5")}>
      {label ? (
        <label htmlFor={inputId} className="type-label text-text-primary">
          {label}
        </label>
      ) : null}

      <div className="relative flex items-center">
        {leadingIcon ? (
          <span
            className="absolute left-3 flex items-center text-text-muted pointer-events-none"
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={helperText || errorText ? helperId : undefined}
          className={cn(
            "w-full rounded-interactive border bg-surface-base text-text-primary",
            "placeholder:text-text-muted",
            "motion-feedback focus-ring",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-subtle",
            hasError
              ? "border-status-error-border"
              : "border-border-default hover:border-border-strong",
            Boolean(leadingIcon) && "pl-10",
            Boolean(trailingIcon) && "pr-10",
            SIZE_CLASSES[size],
            className
          )}
          {...rest}
        />

        {trailingIcon ? (
          <span
            className="absolute right-3 flex items-center text-text-muted pointer-events-none"
            aria-hidden="true"
          >
            {trailingIcon}
          </span>
        ) : null}

        {hasError && !trailingIcon ? (
          <span
            className="absolute right-3 flex items-center text-status-error-icon pointer-events-none"
            aria-hidden="true"
          >
            <AlertCircle size={iconSize} />
          </span>
        ) : null}
      </div>

      {errorText ? (
        <p id={helperId} className="type-caption text-status-error-text">
          {errorText}
        </p>
      ) : helperText ? (
        <p id={helperId} className="type-caption text-text-secondary">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = "Input";
