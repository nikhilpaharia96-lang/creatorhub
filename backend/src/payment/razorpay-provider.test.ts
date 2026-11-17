import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { RazorpayProvider } from "./razorpay-provider";
import { env } from "../config/env";

describe("RazorpayProvider", () => {
  const provider = new RazorpayProvider();

  describe("verifyPayment", () => {
    it("accepts a correctly-signed payment", () => {
      const orderId = "order_ABC123";
      const paymentId = "pay_XYZ789";
      const signature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const isValid = provider.verifyPayment({
        providerOrderId: orderId,
        providerPaymentId: paymentId,
        signature,
      });

      expect(isValid).toBe(true);
    });

    it("rejects a tampered signature", () => {
      const isValid = provider.verifyPayment({
        providerOrderId: "order_ABC123",
        providerPaymentId: "pay_XYZ789",
        signature: "0".repeat(64),
      });

      expect(isValid).toBe(false);
    });

    it("rejects when the order id doesn't match the signed payload", () => {
      const paymentId = "pay_XYZ789";
      const signature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`order_ORIGINAL|${paymentId}`)
        .digest("hex");

      const isValid = provider.verifyPayment({
        providerOrderId: "order_DIFFERENT",
        providerPaymentId: paymentId,
        signature,
      });

      expect(isValid).toBe(false);
    });

    it("rejects a signature of the wrong length without throwing", () => {
      const isValid = provider.verifyPayment({
        providerOrderId: "order_ABC123",
        providerPaymentId: "pay_XYZ789",
        signature: "tooshort",
      });

      expect(isValid).toBe(false);
    });
  });

  describe("parseWebhookEvent", () => {
    function signBody(body: object): { rawBody: Buffer; signature: string } {
      const rawBody = Buffer.from(JSON.stringify(body), "utf8");
      const signature = crypto
        .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
      return { rawBody, signature };
    }

    it("parses a valid payment.captured event", () => {
      const { rawBody, signature } = signBody({
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_1", order_id: "order_1" } } },
      });

      const event = provider.parseWebhookEvent(rawBody, signature);

      expect(event.type).toBe("payment.captured");
      expect(event.providerOrderId).toBe("order_1");
      expect(event.providerPaymentId).toBe("pay_1");
    });

    it("parses a valid payment.failed event", () => {
      const { rawBody, signature } = signBody({
        event: "payment.failed",
        payload: { payment: { entity: { id: "pay_2", order_id: "order_2" } } },
      });

      const event = provider.parseWebhookEvent(rawBody, signature);

      expect(event.type).toBe("payment.failed");
    });

    it("returns type 'unknown' for an unrecognized event type, without throwing", () => {
      const { rawBody, signature } = signBody({ event: "refund.processed", payload: {} });

      const event = provider.parseWebhookEvent(rawBody, signature);

      expect(event.type).toBe("unknown");
      expect(event.providerOrderId).toBeNull();
    });

    it("throws on an invalid webhook signature", () => {
      const rawBody = Buffer.from(JSON.stringify({ event: "payment.captured" }), "utf8");

      expect(() => provider.parseWebhookEvent(rawBody, "invalid_signature")).toThrow();
    });

    it("throws if the body is re-serialized rather than using the exact raw bytes", () => {
      const original = {
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_3", order_id: "order_3" } } },
      };
      const rawBody = Buffer.from(JSON.stringify(original), "utf8");
      const signature = crypto
        .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      const reserialized = Buffer.from(
        JSON.stringify({ payload: original.payload, event: original.event }),
        "utf8"
      );

      expect(() => provider.parseWebhookEvent(reserialized, signature)).toThrow();
    });
  });
});
