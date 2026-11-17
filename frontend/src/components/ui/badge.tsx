import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "error";
type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-surface-raised-alt text-text-secondary",
  brand: "bg-accent-subtle text-text-link",
  success: "bg-status-success-bg text-status-success-text",
  warning: "bg-status-warning-bg text-status-warning-text",
  error: "bg-status-error-bg text-status-error-text",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "h-5 px-2 type-caption",
  md: "h-6 px-2.5 type-body-small",
};

/**
 * CreatorHub primitive Badge. Non-interactive status/label chip.
 * Tight radius family isn't used here — badges use radius-full
 * (pill shape) per the shape-language rules for chips/pills.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "neutral", size = "md", className, children, ...rest },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-full font-medium whitespace-nowrap",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
});

Badge.displayName = "Badge";
