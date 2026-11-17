/**
 * ============================================================
 * AppProviders — CreatorHub Application Shell
 * ============================================================
 * Provider order (per PROVIDERS.md):
 *   Theme -> Toast -> Query -> Auth -> Cart -> children
 *
 * Theme/Query/Auth ordering matches the originally approved sequence.
 * CartProvider is a NEW addition not in the original documented list
 * (Theme/Query/Auth/Locale) — flagged explicitly here rather than
 * silently inserted. It's client-only state (no server dependency),
 * placed after Auth since a future version may scope cart contents
 * to the logged-in user. LocaleProvider remains unbuilt (not needed
 * for the current vertical slice).
 * ============================================================
 */

import type { ReactNode } from "react";
import { ThemeProvider } from "../lib/theme/theme-provider";
import { ToastProvider } from "../components/ui/toast";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { CartProvider } from "./cart-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <QueryProvider>
          <AuthProvider>
            <CartProvider>{children}</CartProvider>
          </AuthProvider>
        </QueryProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
