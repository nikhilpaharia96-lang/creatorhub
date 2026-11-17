/**
 * PaymentProvider abstraction, per Section 13. All order/entitlement
 * business logic depends only on this interface — never on Razorpay
 * (or any future provider's) SDK types directly. Adding Stripe later
 * means implementing this interface again, not touching order logic.
 */
export interface CreateOrderParams {
  amount: number; // smallest currency unit (paise for INR)
  currency: string;
  receipt: string; // internal order id, used to reconcile webhook events
}

export interface CreateOrderResult {
  providerOrderId: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentParams {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface WebhookEvent {
  type: "payment.captured" | "payment.failed" | "unknown";
  providerOrderId: string | null;
  providerPaymentId: string | null;
}

export interface RefundParams {
  providerPaymentId: string;
  amount: number;
}

export interface PaymentProvider {
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyPayment(params: VerifyPaymentParams): boolean;
  parseWebhookEvent(rawBody: Buffer, signature: string): WebhookEvent;
  refundPayment(params: RefundParams): Promise<{ refundId: string }>;
}
