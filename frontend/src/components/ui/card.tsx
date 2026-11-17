import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Internal padding. Defaults to "md". */
  padding?: CardPadding;
  /** Elevation level. "raised" is the default resting card state. */
  elevation?: "flat" | "raised" | "floating";
  /** Adds hover elevation + motion, for clickable/interactive cards. */
  isInteractive?: boolean;
}

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-5",
  md: "p-6",
  lg: "p-8",
};

const ELEVATION_CLASSES: Record<
  NonNullable<CardProps["elevation"]>,
  string
> = {
  flat: "shadow-none border border-border-default",
  raised: "shadow-sm",
  floating: "shadow-lg",
};

/**
 * CreatorHub primitive Card. Surface container built on the
 * surface-raised elevation token. Soft radius (radius-surface-soft)
 * per the human-facing shape language. Interactive cards get hover
 * elevation + Feedback Motion and a visible focus ring when given a
 * tabIndex/onClick by the consumer (Card itself stays a semantic
 * <div>; consumers make it a <button>/<a> when it needs to be
 * actionable, keeping semantics correct rather than faking them here).
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    padding = "md",
    elevation = "raised",
    isInteractive = false,
    className,
    children,
    ...rest
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-surface-soft bg-surface-raised text-text-primary",
        "motion-feedback",
        ELEVATION_CLASSES[elevation],
        isInteractive &&
          "cursor-pointer hover:shadow-md focus-ring",
        PADDING_CLASSES[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5 mb-4", className)}
      {...rest}
    />
  );
});
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(function CardTitle({ className, ...rest }, ref) {
  return (
    <h3
      ref={ref}
      className={cn("type-title text-text-primary", className)}
      {...rest}
    />
  );
});
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...rest }, ref) {
  return (
    <p
      ref={ref}
      className={cn("type-body-small text-text-secondary", className)}
      {...rest}
    />
  );
});
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardContent({ className, ...rest }, ref) {
  return <div ref={ref} className={cn(className)} {...rest} />;
});
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-3 mt-4", className)}
      {...rest}
    />
  );
});
CardFooter.displayName = "CardFooter";
