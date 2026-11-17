import { describe, it, expect } from "vitest";
import { validateAndCalculateDiscount, type CouponRecord } from "./coupon-logic";
import { AppError } from "../lib/errors";

function makeCoupon(overrides: Partial<CouponRecord> = {}): CouponRecord {
  return {
    id: "coupon_1",
    isActive: true,
    expiresAt: null,
    maxRedemptions: null,
    redemptionCount: 0,
    discountType: "PERCENTAGE",
    discountValue: 20,
    ...overrides,
  };
}

describe("validateAndCalculateDiscount", () => {
  it("calculates a percentage discount correctly", () => {
    const result = validateAndCalculateDiscount(makeCoupon({ discountValue: 20 }), 100000);
    expect(result.discountAmount).toBe(20000);
  });

  it("calculates a fixed discount correctly", () => {
    const coupon = makeCoupon({ discountType: "FIXED", discountValue: 10000 });
    const result = validateAndCalculateDiscount(coupon, 100000);
    expect(result.discountAmount).toBe(10000);
  });

  it("clamps a fixed discount larger than the subtotal so the total never goes negative", () => {
    const coupon = makeCoupon({ discountType: "FIXED", discountValue: 999999 });
    const result = validateAndCalculateDiscount(coupon, 50000);
    expect(result.discountAmount).toBe(50000);
    expect(50000 - result.discountAmount).toBe(0);
  });

  it("rounds percentage discounts to a whole number of paise", () => {
    const coupon = makeCoupon({ discountValue: 33 });
    const result = validateAndCalculateDiscount(coupon, 10001);
    expect(Number.isInteger(result.discountAmount)).toBe(true);
  });

  it("throws when the coupon is null (not found)", () => {
    expect(() => validateAndCalculateDiscount(null, 100000)).toThrow(AppError);
  });

  it("throws when the coupon is inactive", () => {
    const coupon = makeCoupon({ isActive: false });
    expect(() => validateAndCalculateDiscount(coupon, 100000)).toThrow(/not valid/i);
  });

  it("throws when the coupon has expired", () => {
    const yesterday = new Date(Date.now() - 86400000);
    const coupon = makeCoupon({ expiresAt: yesterday });
    expect(() => validateAndCalculateDiscount(coupon, 100000)).toThrow(/expired/i);
  });

  it("does not throw when expiresAt is in the future", () => {
    const tomorrow = new Date(Date.now() + 86400000);
    const coupon = makeCoupon({ expiresAt: tomorrow });
    expect(() => validateAndCalculateDiscount(coupon, 100000)).not.toThrow();
  });

  it("throws when the redemption limit has been reached", () => {
    const coupon = makeCoupon({ maxRedemptions: 5, redemptionCount: 5 });
    expect(() => validateAndCalculateDiscount(coupon, 100000)).toThrow(/redemption limit/i);
  });

  it("does not throw when redemptions remain", () => {
    const coupon = makeCoupon({ maxRedemptions: 5, redemptionCount: 4 });
    expect(() => validateAndCalculateDiscount(coupon, 100000)).not.toThrow();
  });

  it("allows unlimited redemptions when maxRedemptions is null", () => {
    const coupon = makeCoupon({ maxRedemptions: null, redemptionCount: 999999 });
    expect(() => validateAndCalculateDiscount(coupon, 100000)).not.toThrow();
  });

  it("uses the injected 'now' for deterministic expiry testing", () => {
    const fixedNow = new Date("2026-01-01T00:00:00Z");
    const coupon = makeCoupon({ expiresAt: new Date("2025-12-31T00:00:00Z") });
    expect(() => validateAndCalculateDiscount(coupon, 100000, fixedNow)).toThrow(/expired/i);

    const stillValidCoupon = makeCoupon({ expiresAt: new Date("2026-01-02T00:00:00Z") });
    expect(() => validateAndCalculateDiscount(stillValidCoupon, 100000, fixedNow)).not.toThrow();
  });
});
