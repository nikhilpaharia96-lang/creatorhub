export interface EntitlementRecord {
  expiresAt: Date;
  downloadsUsed: number;
  downloadLimit: number;
}

export type DownloadGateResult =
  | { allowed: true }
  | { allowed: false; reason: "expired" | "limit_reached" };

/**
 * Pure gate-check for whether a download should be permitted, given
 * an entitlement record. Extracted from download-routes.ts so the
 * exact rule (expiry checked before limit, both independent of any
 * DB call) is unit-testable without a live database.
 */
export function checkDownloadAllowed(
  entitlement: EntitlementRecord,
  now: Date = new Date()
): DownloadGateResult {
  if (entitlement.expiresAt < now) {
    return { allowed: false, reason: "expired" };
  }
  if (entitlement.downloadsUsed >= entitlement.downloadLimit) {
    return { allowed: false, reason: "limit_reached" };
  }
  return { allowed: true };
}
