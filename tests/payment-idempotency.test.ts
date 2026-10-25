import { describe, expect, it } from "vitest";
import { paymentAttemptKey } from "@/features/payments/server/idempotency";

describe("paymentAttemptKey", () => {
  it("is deterministic for the same order, method and attempt", () => {
    expect(paymentAttemptKey("order-1", "pix", 1)).toBe(paymentAttemptKey("order-1", "pix", 1));
  });

  it("changes with the attempt and card token", () => {
    expect(paymentAttemptKey("order-1", "pix", 1)).not.toBe(paymentAttemptKey("order-1", "pix", 2));
    expect(paymentAttemptKey("order-1", "card", 1, "token-a")).not.toBe(
      paymentAttemptKey("order-1", "card", 1, "token-b"),
    );
  });

  it("does not expose the card token", () => {
    expect(paymentAttemptKey("order-1", "card", 1, "secret-token")).not.toContain("secret-token");
  });
});
