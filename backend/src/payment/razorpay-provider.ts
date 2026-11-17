import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env";
import type {
  PaymentProvider,
  CreateOrderParams,
  CreateOrderResult,
  VerifyPaymentParams,
  WebhookEvent,
  RefundParams,
} from "./payment-provider";

const razorpayClient = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export class RazorpayProvider implements PaymentProvider {
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const order = await razorpayClient.orders.create({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
    });

    return {
      providerOrderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
    };
  }

  /**
   * Verifies the razorpay_signature returned by Checkout after a
   * successful payment. HMAC-SHA256 of `order_id|payment_id`, keyed
   * with the account's key_secret (not the separate webhook secret).
   * This is a synchronous, local check — no network call needed.
   */
  verifyPayment(params: VerifyPaymentParams): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${params.providerOrderId}|${params.providerPaymentId}`)
      .digest("hex");

    return timingSafeEqual(expectedSignature, params.signature);
  }

  /**
   * Parses and verifies a Razorpay webhook. Signature is HMAC-SHA256
   * of the RAW request body (not a re-serialized JSON.stringify of a
   * parsed object — that produces a different byte sequence and is a
   * common source of false verification failures), keyed with the
   * separate webhook secret configured in the Razorpay dashboard.
   */
  parseWebhookEvent(rawBody: Buffer, signature: string): WebhookEvent {
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (!timingSafeEqual(expectedSignature, signature)) {
      throw new Error("Invalid webhook signature");
    }

    const payload = JSON.parse(rawBody.toString("utf8"));
    const eventType = payload.event as string;

    if (eventType === "payment.captured" || eventType === "payment.failed") {
      const payment = payload.payload?.payment?.entity;
      return {
        type: eventType,
        providerOrderId: payment?.order_id ?? null,
        providerPaymentId: payment?.id ?? null,
      };
    }

    return { type: "unknown", providerOrderId: null, providerPaymentId: null };
  }

  async refundPayment(params: RefundParams): Promise<{ refundId: string }> {
    const refund = await razorpayClient.payments.refund(params.providerPaymentId, {
      amount: params.amount,
    });
    return { refundId: refund.id };
  }
}

/** Constant-time string comparison to avoid timing attacks on signature checks. */
function timingSafeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

export const paymentProvider: PaymentProvider = new RazorpayProvider();
