import { createHash } from "node:crypto";

export function paymentAttemptKey(
  orderId: string,
  method: string,
  attempt: number,
  cardToken?: string,
): string {
  const suffix = cardToken
    ? ":" + createHash("sha256").update(cardToken).digest("hex").slice(0, 16)
    : "";
  return "order:" + orderId + ":" + method + ":" + attempt + suffix;
}
