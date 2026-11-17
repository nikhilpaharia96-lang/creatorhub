/**
 * ============================================================
 * useReducedMotion — CreatorHub Design System v1.0.0
 * ============================================================
 * Purpose:
 *   Single shared mechanism for reading the user's
 *   `prefers-reduced-motion` OS/browser preference. This is the
 *   React-side counterpart to the CSS `@media (prefers-reduced-motion)`
 *   query already applied in `src/styles/tokens/motion.css` for
 *   plain-CSS transitions.
 *
 *   Any component using Framer Motion must consult this hook before
 *   animating transform/opacity — never assume motion is wanted.
 *
 * Usage:
 *   const prefersReducedMotion = useReducedMotion();
 *   <motion.div
 *     animate={{ opacity: 1 }}
 *     transition={prefersReducedMotion ? { duration: 0 } : MOTION_CATEGORY.feedback}
 *   />
 *
 *   Prefer using `getMotionTransition()` (below) over repeating this
 *   ternary in every component.
 * ============================================================
 */

import { useEffect, useState } from "react";
import { MOTION_CATEGORY, type MotionCategory } from "./motion-tokens";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Reads and subscribes to the user's reduced-motion preference. */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia(QUERY).matches;
    }
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueryList = window.matchMedia(QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Convenience helper: resolves a motion category to a Framer Motion
 * `transition` object, collapsing to near-instant when reduced motion
 * is preferred. Use this instead of hand-writing the ternary in every
 * component that animates.
 */
export function getMotionTransition(
  category: MotionCategory,
  prefersReducedMotion: boolean
) {
  if (prefersReducedMotion) {
    return { duration: 0.001 };
  }
  return MOTION_CATEGORY[category];
}
