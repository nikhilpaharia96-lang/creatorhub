/**
 * ============================================================
 * ThemeProvider — CreatorHub Design System v1.0.0
 * ============================================================
 * Purpose:
 *   Establishes the React-level seam for theming. At MVP this is
 *   light-mode only (per Section 4 — dark mode is not implemented
 *   now), so this provider's job today is narrow: expose the current
 *   theme name and the resolved reduced-motion preference to any
 *   component via context, without duplicating the CSS token system.
 *
 *   Actual color/spacing/etc. values are NEVER read into JS here —
 *   those stay in CSS (`globals.css` + Tailwind utilities). This
 *   provider does not mirror the color system; only `theme` (as a
 *   `data-theme` attribute the CSS can key off later) and motion
 *   preference are JS-level concerns.
 *
 * Future extension (not built now, seam only):
 *   Adding dark mode later means: (1) add a dark semantic mapping in
 *   `semantic.css` keyed off `[data-theme="dark"]`, (2) add a
 *   `setTheme` setter here, (3) persist the choice. No component
 *   using semantic Tailwind classes needs to change.
 *
 * Usage:
 *   Wrap the app in <AppProviders> (see src/providers/app-providers.tsx),
 *   which nests this. Do not use ThemeProvider standalone in feature
 *   code — always go through AppProviders.
 * ============================================================
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useReducedMotion } from "./use-reduced-motion";

type ThemeName = "light";

interface ThemeContextValue {
  /** Current theme name. Hardcoded to "light" until dark mode ships. */
  theme: ThemeName;
  /** Resolved prefers-reduced-motion state, read once and shared. */
  prefersReducedMotion: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: "light",
      prefersReducedMotion,
    }),
    [prefersReducedMotion]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={value.theme}>{children}</div>
    </ThemeContext.Provider>
  );
}

/** Access the current theme name and reduced-motion state. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
