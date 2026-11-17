import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getAuthCookieOptions,
} from "./auth-service";

describe("auth-service", () => {
  describe("password hashing", () => {
    it("hashes a password to something different from the plaintext", async () => {
      const hash = await hashPassword("correct horse battery staple");
      expect(hash).not.toBe("correct horse battery staple");
      expect(hash.length).toBeGreaterThan(20);
    });

    it("verifies a correct password against its hash", async () => {
      const hash = await hashPassword("my-secret-password");
      const isValid = await verifyPassword("my-secret-password", hash);
      expect(isValid).toBe(true);
    });

    it("rejects an incorrect password against a hash", async () => {
      const hash = await hashPassword("my-secret-password");
      const isValid = await verifyPassword("wrong-password", hash);
      expect(isValid).toBe(false);
    });

    it("produces a different hash each time (random salt)", async () => {
      const hash1 = await hashPassword("same-password");
      const hash2 = await hashPassword("same-password");
      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword("same-password", hash1)).toBe(true);
      expect(await verifyPassword("same-password", hash2)).toBe(true);
    });
  });

  describe("access tokens", () => {
    it("signs and verifies a valid access token round-trip", () => {
      const token = signAccessToken({ userId: "user_123", role: "CUSTOMER" });
      const payload = verifyAccessToken(token);
      expect(payload.userId).toBe("user_123");
      expect(payload.role).toBe("CUSTOMER");
    });

    it("throws when verifying a tampered access token", () => {
      const token = signAccessToken({ userId: "user_123", role: "CUSTOMER" });
      const tampered = token.slice(0, -5) + "aaaaa";
      expect(() => verifyAccessToken(tampered)).toThrow();
    });

    it("throws when verifying garbage input", () => {
      expect(() => verifyAccessToken("not-a-real-jwt")).toThrow();
    });

    it("preserves the admin role through sign/verify", () => {
      const token = signAccessToken({ userId: "admin_1", role: "ADMIN" });
      const payload = verifyAccessToken(token);
      expect(payload.role).toBe("ADMIN");
    });
  });

  describe("refresh tokens", () => {
    it("signs and verifies a valid refresh token round-trip", () => {
      const token = signRefreshToken({ userId: "user_456", tokenVersion: 0 });
      const payload = verifyRefreshToken(token);
      expect(payload.userId).toBe("user_456");
      expect(payload.tokenVersion).toBe(0);
    });

    it("an access token cannot be verified as a refresh token", () => {
      const accessToken = signAccessToken({ userId: "user_789", role: "CUSTOMER" });
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });

  describe("cookie options", () => {
    it("sets httpOnly and sameSite=lax unconditionally", () => {
      const options = getAuthCookieOptions(1000);
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe("lax");
      expect(options.maxAge).toBe(1000);
      expect(options.path).toBe("/");
    });

    it("does not set secure=true outside production (test env)", () => {
      const options = getAuthCookieOptions(1000);
      expect(options.secure).toBe(false);
    });
  });
});
