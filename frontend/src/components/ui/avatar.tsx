import { forwardRef, useState, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  /** Full name or identifier used to derive initials and for alt text. */
  name: string;
  size?: AvatarSize;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-8 w-8 type-caption",
  md: "h-10 w-10 type-body-small",
  lg: "h-12 w-12 type-body",
  xl: "h-16 w-16 type-title",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * CreatorHub primitive Avatar. Renders an image when src loads
 * successfully, falling back to initials on missing src or load
 * error. Circular (radius-full) per shape-language rules.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, name, size = "md", className, ...rest },
  ref
) {
  const [hasError, setHasError] = useState(false);
  const showImage = Boolean(src) && !hasError;

  return (
    <span
      ref={ref}
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex items-center justify-center rounded-full overflow-hidden shrink-0",
        "bg-interactive-secondary text-text-secondary font-medium select-none",
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </span>
  );
});

Avatar.displayName = "Avatar";
