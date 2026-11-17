import { describe, it, expect } from "vitest";
import { checkDownloadAllowed, type EntitlementRecord } from "./download-gate";

function makeEntitlement(overrides: Partial<EntitlementRecord> = {}): EntitlementRecord {
  return {
    expiresAt: new Date(Date.now() + 86400000),
    downloadsUsed: 0,
    downloadLimit: 5,
    ...overrides,
  };
}

describe("checkDownloadAllowed", () => {
  it("allows a download when under the limit and not expired", () => {
    const result = checkDownloadAllowed(makeEntitlement({ downloadsUsed: 2, downloadLimit: 5 }));
    expect(result.allowed).toBe(true);
  });

  it("blocks a download when the entitlement has expired", () => {
    const result = checkDownloadAllowed(
      makeEntitlement({ expiresAt: new Date(Date.now() - 86400000) })
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe("expired");
  });

  it("blocks a download when the limit has been reached exactly", () => {
    const result = checkDownloadAllowed(makeEntitlement({ downloadsUsed: 5, downloadLimit: 5 }));
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe("limit_reached");
  });

  it("blocks a download when downloadsUsed exceeds the limit (defensive case)", () => {
    const result = checkDownloadAllowed(makeEntitlement({ downloadsUsed: 6, downloadLimit: 5 }));
    expect(result.allowed).toBe(false);
  });

  it("allows a download exactly one under the limit", () => {
    const result = checkDownloadAllowed(makeEntitlement({ downloadsUsed: 4, downloadLimit: 5 }));
    expect(result.allowed).toBe(true);
  });

  it("checks expiry before the limit (expired + at-limit still reports 'expired')", () => {
    const result = checkDownloadAllowed(
      makeEntitlement({
        expiresAt: new Date(Date.now() - 86400000),
        downloadsUsed: 5,
        downloadLimit: 5,
      })
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe("expired");
  });

  it("uses the injected 'now' for deterministic expiry testing", () => {
    const fixedNow = new Date("2026-01-01T00:00:00Z");
    const expired = checkDownloadAllowed(
      makeEntitlement({ expiresAt: new Date("2025-12-31T00:00:00Z") }),
      fixedNow
    );
    expect(expired.allowed).toBe(false);

    const stillValid = checkDownloadAllowed(
      makeEntitlement({ expiresAt: new Date("2026-01-02T00:00:00Z") }),
      fixedNow
    );
    expect(stillValid.allowed).toBe(true);
  });
});
