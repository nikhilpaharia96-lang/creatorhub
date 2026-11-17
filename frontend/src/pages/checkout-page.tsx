import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Tag } from "lucide-react";
import { useCart } from "@/providers/cart-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { orderApi } from "@/lib/api/catalog-api";
import { ApiRequestError } from "@/lib/api/client";
import { useRazorpayScript, type RazorpaySuccessResponse } from "@/lib/payment/use-razorpay-script";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";

type CheckoutState = "idle" | "creating-order" | "awaiting-payment" | "verifying" | "error";

export function CheckoutPage() {
  const { items, totalAmount, clear } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { isReady: razorpayReady, hasError: razorpayLoadError } = useRazorpayScript();
  const [state, setState] = useState<CheckoutState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);

  if (items.length === 0) {
    navigate("/cart", { replace: true });
    return null;
  }

  const handlePay = async () => {
    setErrorMessage(null);
    setState("creating-order");

    try {
      const order = await orderApi.checkout(
        items.map((item) => item.id),
        couponCode.trim() || undefined
      );
      setAppliedDiscount(order.discountAmount);
      setState("awaiting-payment");

      const razorpay = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "CreatorHub",
        description: `${items.length} item${items.length > 1 ? "s" : ""}`,
        order_id: order.providerOrderId,
        prefill: user ? { name: user.name, email: user.email } : undefined,
        theme: { color: "#2563EB" },
        handler: async (response: RazorpaySuccessResponse) => {
          setState("verifying");
          try {
            await orderApi.verify({
              orderId: order.orderId,
              providerPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            clear();
            showToast({
              variant: "success",
              title: "Payment successful",
              description: "Your purchase is ready in your library.",
            });
            navigate("/library", { replace: true });
          } catch (err) {
            setState("error");
            setErrorMessage(
              err instanceof ApiRequestError
                ? err.message
                : "We couldn't confirm your payment. If you were charged, contact support and we'll sort it out."
            );
          }
        },
        modal: {
          ondismiss: () => {
            setState((current) => (current === "verifying" ? current : "idle"));
          },
        },
      });

      razorpay.on("payment.failed", (response) => {
        setState("error");
        setErrorMessage(response.error.description || "Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (err) {
      setState("error");
      setErrorMessage(
        err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  const isProcessing = state === "creating-order" || state === "awaiting-payment" || state === "verifying";

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="type-heading-xl text-text-primary mb-6">Checkout</h1>

      <Card padding="lg" className="flex flex-col gap-4 mb-6">
        <h2 className="type-title text-text-primary">Order summary</h2>
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between type-body-small">
            <span className="text-text-secondary truncate pr-4">{item.title}</span>
            <span className="text-text-primary text-tabular shrink-0">
              {formatPrice(item.priceAmount, item.currency)}
            </span>
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <Input
            placeholder="Coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            leadingIcon={<Tag size={16} />}
            disabled={state !== "idle"}
            className="flex-1"
          />
        </div>

        <div className="flex flex-col gap-1 pt-4 border-t border-border-default">
          {appliedDiscount ? (
            <div className="flex items-center justify-between type-body-small">
              <span className="text-status-success-text">Discount applied</span>
              <span className="text-status-success-text text-tabular">
                -{formatPrice(appliedDiscount)}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="type-title text-text-primary">Total</span>
            <span className="type-heading-md text-text-primary text-tabular">
              {formatPrice(totalAmount - (appliedDiscount ?? 0))}
            </span>
          </div>
        </div>
      </Card>

      {razorpayLoadError ? (
        <div className="flex items-start gap-2 p-4 rounded-surface-soft bg-status-error-bg mb-4">
          <AlertCircle size={20} className="text-status-error-icon shrink-0 mt-0.5" />
          <p className="type-body-small text-status-error-text">
            Couldn't load the payment provider. Please check your connection and refresh.
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div role="alert" className="flex items-start gap-2 p-4 rounded-surface-soft bg-status-error-bg mb-4">
          <AlertCircle size={20} className="text-status-error-icon shrink-0 mt-0.5" />
          <p className="type-body-small text-status-error-text">{errorMessage}</p>
        </div>
      ) : null}

      <Button
        size="lg"
        fullWidth
        onClick={handlePay}
        disabled={!razorpayReady || razorpayLoadError}
        isLoading={isProcessing}
        loadingText={
          state === "creating-order"
            ? "Preparing order…"
            : state === "verifying"
              ? "Confirming payment…"
              : "Waiting for payment…"
        }
      >
        Pay {formatPrice(totalAmount)}
      </Button>

      <p className="type-caption text-text-muted text-center mt-4">
        Payments are securely processed by Razorpay. CreatorHub never sees your card details.
      </p>
    </div>
  );
}
