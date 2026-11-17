/**
 * Formats a paise amount as an INR display string, e.g. 149900 -> "₹1,499".
 * Amounts are always stored/transmitted as integer paise (smallest
 * currency unit) per the backend schema — never floats.
 */
export function formatPrice(amountInPaise: number, currency: string = "INR"): string {
  const amount = amountInPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
