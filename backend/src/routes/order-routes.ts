import { Router, raw } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { Errors } from "../lib/errors";
import { requireAuth, requireAdmin } from "../middleware/auth-middleware";
import { paymentProvider } from "../payment/razorpay-provider";
import { env } from "../config/env";
import { validateAndCalculateDiscount, type CouponResolution } from "../services/coupon-logic";

export const orderRouter = Router();
export const orderWebhookRouter = Router();

const checkoutSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1, "Select at least one product"),
  couponCode: z.string().trim().min(1).optional(),
});

/**
 * Fetches the coupon by code (if provided) and delegates validation +
 * discount calculation to the pure, unit-tested
 * validateAndCalculateDiscount function in services/coupon-logic.ts.
 * This function itself is the thin DB-access wrapper; the actual
 * business rules live in the pure function and are covered by
 * coupon-logic.test.ts.
 */
async function resolveCoupon(
  couponCode: string | undefined,
  subtotalAmount: number
): Promise<CouponResolution | null> {
  if (!couponCode) return null;

  const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
  return validateAndCalculateDiscount(coupon, subtotalAmount);
}

/**
 * Grants (or extends) an entitlement for a paid order. Idempotent by
 * design: upserts on the (userId, productId) unique constraint so
 * this is safe to call from both the client-verify path AND the
 * webhook path without creating duplicate entitlements — a real
 * production concern given Razorpay retries webhooks on non-200s.
 */
async function grantEntitlementsForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });

  if (!order) return;

  for (const item of order.items) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + item.product.downloadExpiryDays);

    await prisma.entitlement.upsert({
      where: { userId_productId: { userId: order.userId, productId: item.productId } },
      create: {
        userId: order.userId,
        productId: item.productId,
        orderId: order.id,
        downloadLimit: item.product.downloadLimit,
        expiresAt,
      },
      // Re-purchase extends access rather than erroring — reasonable
      // default; downloadsUsed intentionally not reset so repeat
      // purchases don't become a free download-limit reset exploit.
      update: {
        downloadLimit: item.product.downloadLimit,
        expiresAt,
        orderId: order.id,
      },
    });
  }

  // Increment coupon redemption count on confirmed payment, not at
  // checkout creation — an abandoned/failed checkout must not consume
  // a limited-redemption coupon. This function is only called after
  // payment is verified (client-verify path) or webhook-confirmed.
  if (order.couponId) {
    await prisma.coupon.update({
      where: { id: order.couponId },
      data: { redemptionCount: { increment: 1 } },
    });
  }
}

// POST /api/orders/checkout — creates a pending Order + Razorpay order
orderRouter.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const { productIds, couponCode } = checkoutSchema.parse(req.body);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isPublished: true },
    });

    if (products.length !== productIds.length) {
      next(Errors.Validation("One or more products are unavailable"));
      return;
    }

    const subtotalAmount = products.reduce(
      (sum: number, p: (typeof products)[number]) => sum + p.priceAmount,
      0
    );

    const resolvedCoupon = await resolveCoupon(couponCode, subtotalAmount);
    const discountAmount = resolvedCoupon?.discountAmount ?? 0;
    const totalAmount = subtotalAmount - discountAmount;

    const order = await prisma.order.create({
      data: {
        userId: req.user!.userId,
        subtotalAmount,
        discountAmount,
        totalAmount,
        currency: "INR",
        status: "PENDING",
        couponId: resolvedCoupon?.couponId,
        items: {
          create: products.map((p: (typeof products)[number]) => ({
            productId: p.id,
            priceAmount: p.priceAmount,
          })),
        },
      },
    });

    const providerOrder = await paymentProvider.createOrder({
      amount: totalAmount,
      currency: "INR",
      receipt: order.id,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { providerOrderId: providerOrder.providerOrderId },
    });

    res.status(201).json({
      data: {
        orderId: order.id,
        providerOrderId: providerOrder.providerOrderId,
        amount: providerOrder.amount,
        currency: providerOrder.currency,
        razorpayKeyId: env.RAZORPAY_KEY_ID,
        subtotalAmount,
        discountAmount,
      },
    });
  } catch (err) {
    next(err);
  }
});

const verifySchema = z.object({
  orderId: z.string().min(1),
  providerPaymentId: z.string().min(1),
  signature: z.string().min(1),
});

// POST /api/orders/verify — client-side verification path (fast UX path).
// Webhook (below) is the source of truth and covers the case where the
// user closes the tab before this fires.
orderRouter.post("/verify", requireAuth, async (req, res, next) => {
  try {
    const data = verifySchema.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order || order.userId !== req.user!.userId) {
      next(Errors.NotFound("Order not found"));
      return;
    }
    if (!order.providerOrderId) {
      next(Errors.Validation("Order was not initialized for payment"));
      return;
    }

    // Fail safe: never grant access on ambiguous/failed verification.
    const isValid = paymentProvider.verifyPayment({
      providerOrderId: order.providerOrderId,
      providerPaymentId: data.providerPaymentId,
      signature: data.signature,
    });

    if (!isValid) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      next(Errors.PaymentFailed());
      return;
    }

    if (order.status !== "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          providerPaymentId: data.providerPaymentId,
          providerSignature: data.signature,
        },
      });
      await grantEntitlementsForOrder(order.id);
    }

    res.status(200).json({ data: { success: true, orderId: order.id } });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/webhook — Razorpay webhook, source of truth.
// Mounted on its own router (orderWebhookRouter) at the app level,
// registered BEFORE the global express.json() parser, because
// signature verification requires the exact raw request bytes.
orderWebhookRouter.post("/", raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    if (typeof signature !== "string") {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Missing webhook signature" } });
      return;
    }

    const event = paymentProvider.parseWebhookEvent(req.body, signature);

    if (event.type === "payment.captured" && event.providerOrderId) {
      const order = await prisma.order.findUnique({
        where: { providerOrderId: event.providerOrderId },
      });
      if (order && order.status !== "PAID") {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "PAID",
            providerPaymentId: event.providerPaymentId ?? undefined,
          },
        });
        await grantEntitlementsForOrder(order.id);
      }
    }

    if (event.type === "payment.failed" && event.providerOrderId) {
      const order = await prisma.order.findUnique({
        where: { providerOrderId: event.providerOrderId },
      });
      if (order && order.status === "PENDING") {
        await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      }
    }

    // Always 200 on successfully-parsed events so Razorpay doesn't retry
    // indefinitely; genuine signature failures throw before reaching here.
    res.status(200).json({ received: true });
  } catch {
    // Signature failures land here — respond 400 so it's visibly
    // distinct from a transient server error in Razorpay's dashboard.
    res.status(400).json({ error: { code: "INVALID_SIGNATURE", message: "Webhook verification failed" } });
  }
});

// GET /api/orders — current user's order history
orderRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.userId },
      include: { items: { include: { product: { select: { title: true, thumbnailUrl: true, slug: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ data: orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/admin/all — admin only, all orders across all users
orderRouter.get("/admin/all", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { title: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.status(200).json({ data: orders });
  } catch (err) {
    next(err);
  }
});
