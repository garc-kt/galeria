import { describe, expect, it } from "vitest";
import {
  mercadoPagoManifest,
  signMercadoPagoManifest,
  verifyMercadoPagoSignature,
} from "@/features/payments/server/signature";

describe("mercadopago signature", () => {
  it("builds the manifest", () => {
    expect(mercadoPagoManifest("123", "req-1", "1700000000")).toBe(
      "id:123;request-id:req-1;ts:1700000000;",
    );
  });

  it("accepts a valid signature", () => {
    const secret = "super-secret";
    const manifest = mercadoPagoManifest("123", "req-1", "1700000000");
    const v1 = signMercadoPagoManifest(manifest, secret);
    expect(verifyMercadoPagoSignature("ts=1700000000,v1=" + v1, "123", "req-1", secret)).toBe(true);
  });

  it("rejects invalid signatures", () => {
    const secret = "super-secret";
    expect(verifyMercadoPagoSignature(null, "123", "req-1", secret)).toBe(false);
    expect(verifyMercadoPagoSignature("ts=1700000000,v1=deadbeef", "123", "req-1", secret)).toBe(false);
    expect(verifyMercadoPagoSignature("ts=1,v1=abc", "123", "req-1", "other")).toBe(false);
  });
});
