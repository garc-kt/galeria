import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/features/auth/server/password";

describe("password hashing", () => {
  it("hashes and verifies a password", () => {
    const hash = hashPassword("uma-senha-forte-123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("uma-senha-forte-123", hash)).toBe(true);
    expect(verifyPassword("senha-errada", hash)).toBe(false);
  });

  it("uses a different salt for each hash", () => {
    const a = hashPassword("mesma-senha");
    const b = hashPassword("mesma-senha");
    expect(a).not.toBe(b);
    expect(verifyPassword("mesma-senha", a)).toBe(true);
    expect(verifyPassword("mesma-senha", b)).toBe(true);
  });

  it("rejects malformed hashes", () => {
    expect(verifyPassword("x", "nope")).toBe(false);
    expect(verifyPassword("x", "scrypt$1$2$3$4")).toBe(false);
  });
});
