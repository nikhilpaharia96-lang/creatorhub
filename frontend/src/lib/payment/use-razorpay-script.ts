import { useEffect, useState } from "react";

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error: { description: string } }) => void) => void;
}

/**
 * Loads the Razorpay Checkout.js script once and reports readiness.
 * Script is loaded on demand (not in index.html) so it doesn't block
 * initial page load for visitors who never reach checkout.
 */
export function useRazorpayScript(): { isReady: boolean; hasError: boolean } {
  const [isReady, setIsReady] = useState(() => typeof window !== "undefined" && Boolean(window.Razorpay));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isReady) return;

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => setIsReady(true);
    script.onerror = () => setHasError(true);
    document.body.appendChild(script);
  }, [isReady]);

  return { isReady, hasError };
}
