import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/features/orders/schemas";
import { contactSchema } from "@/features/contact/schemas";
import { passwordChangeSchema } from "@/features/auth/schemas";
import { paymentCreateSchema } from "@/features/payments/schemas";
import { photoUpdateSchema } from "@/features/photos/schemas";

describe("validation", () => {
  it("accepts a valid checkout", () => {
    const result = checkoutSchema.safeParse({
      photoId: "550e8400-e29b-41d4-a716-446655440000",
      email: "buyer@example.com",
      name: "Buyer",
      license: "personal",
    });
    expect(result.success).toBe(true);
  });

  it("rejects checkout with invalid email or uuid", () => {
    expect(
      checkoutSchema.safeParse({
        photoId: "not-a-uuid",
        email: "not-an-email",
      }).success,
    ).toBe(false);
  });

  it("accepts photo edits and rejects negative prices", () => {
    expect(
      photoUpdateSchema.safeParse({ title: "Nova", priceCents: 1000, status: "published" }).success,
    ).toBe(true);
    expect(photoUpdateSchema.safeParse({ priceCents: -1 }).success).toBe(false);
  });

  it("requires a real contact message", () => {
    expect(
      contactSchema.safeParse({ name: "Ana", email: "ana@example.com", message: "curta" }).success,
    ).toBe(false);
    expect(
      contactSchema.safeParse({
        name: "Ana",
        email: "ana@example.com",
        message: "Mensagem com tamanho suficiente.",
      }).success,
    ).toBe(true);
  });

  it("validates payment payloads", () => {
    expect(
      paymentCreateSchema.safeParse({ token: "x".repeat(20), method: "pix" }).success,
    ).toBe(true);
    expect(
      paymentCreateSchema.safeParse({
        token: "x".repeat(20),
        method: "card",
        card: { token: "card-token", payment_method_id: "visa" },
      }).success,
    ).toBe(true);
    expect(
      paymentCreateSchema.safeParse({ token: "short", method: "card", card: { token: "" } }).success,
    ).toBe(false);
  });

  it("requires a strong new password", () => {
    expect(passwordChangeSchema.safeParse({ currentPassword: "old-password", newPassword: "short" }).success).toBe(false);
    expect(
      passwordChangeSchema.safeParse({
        currentPassword: "old-password",
        newPassword: "uma-senha-bem-longa-123",
      }).success,
    ).toBe(true);
  });
});
