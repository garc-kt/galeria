import { describe, expect, it } from "vitest";
import { generateSync } from "otplib";
import { generateTotpSecret, totpUri, verifyTotp } from "@/features/auth/server/totp";

describe("totp", () => {
  it("generates a usable secret and verifies a code", () => {
    const secret = generateTotpSecret();
    expect(secret.length).toBeGreaterThan(10);
    const code = generateSync({ secret });
    expect(verifyTotp(code, secret)).toBe(true);
    expect(verifyTotp("000000", secret)).toBe(false);
  });

  it("builds an otpauth uri", () => {
    const uri = totpUri("admin@example.com", "JBSWY3DPEHPK3PXP");
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
  });
});
