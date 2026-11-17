import { Errors } from "../lib/errors";

export interface CouponRecord {
  id: string;
  isActive: boolean;
  expiresAt: Date | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
}

export interface CouponResolution {
  couponId: string;
  discountAmount: number;
}

/**
 * Pure validation + discount calculation for a coupon against a given
 * subtotal. Takes an already-fetched coupon record (or null, meaning
 * "not found") rather than querying the database itself, so this
 * function is unit-testable without a live database connection.
 *
 * Throws a user-facing AppError for any invalid state (fail safe:
 * never silently ignore a bad code and charge full price).
 */
export function validateAndCalculateDiscount(
  coupon: CouponRecord | null,
  subtotalAmount: number,
  now: Date = new Date()
): CouponResolution {
  if (!coupon || !coupon.isActive) {
    throw Errors.Validation("This coupon code is not valid");
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw Errors.Validation("This coupon has expired");
  }
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
    throw Errors.Validation("This coupon has reached its redemption limit");
  }

  const discountAmount =
    coupon.discountType === "PERCENTAGE"
      ? Math.round((subtotalAmount * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, subtotalAmount);

  return { couponId: coupon.id, discountAmount };
}
