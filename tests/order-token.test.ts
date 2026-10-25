import { describe, expect, it } from "vitest";
import { createOrderToken, verifyOrderToken } from "@/features/orders/server/order-token";

const ORDER_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("order token", () => {
  it("creates and verifies a token", () => {
    const token = createOrderToken(ORDER_ID);
    expect(verifyOrderToken(token)).toBe(ORDER_ID);
  });

  it("rejects tampered tokens", () => {
    const token = createOrderToken(ORDER_ID);
    expect(verifyOrderToken(token + "x")).toBeNull();
    expect(verifyOrderToken(token.replace(ORDER_ID, "550e8400-e29b-41d4-a716-446655440001"))).toBeNull();
  });

  it("rejects expired tokens", () => {
    expect(verifyOrderToken(createOrderToken(ORDER_ID, -10))).toBeNull();
  });
});
