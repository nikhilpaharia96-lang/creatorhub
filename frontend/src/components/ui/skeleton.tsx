import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Shape variant. "text" gives a smaller radius line, "circular" for avatars, "rectangular" for cards/images. */
  variant?: "text" | "circular" | "rectangular";
}

/**
 * CreatorHub primitive Skeleton. Loading placeholder used instead of
 * blocking spinners for content-heavy views (Section 9 performance
 * requirement). Uses a subtle opacity pulse (Attention Motion category,
 * transform/opacity only) and respects prefers-reduced-motion via the
 * global motion.css media query already applied to .motion-attention.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ variant = "text", className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn(
          "bg-surface-raised-alt animate-pulse motion-attention",
          variant === "text" && "rounded-sm h-4 w-full",
          variant === "circular" && "rounded-full",
          variant === "rectangular" && "rounded-surface-tight",
          className
        )}
        {...rest}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";
