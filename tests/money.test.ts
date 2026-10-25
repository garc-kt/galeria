import { describe, expect, it } from "vitest";
import { formatBRL, parsePriceToCents } from "@/lib/money";

describe("money", () => {
  it("formats BRL cents", () => {
    expect(formatBRL(123456)).toContain("1.234,56");
    expect(formatBRL(0)).toContain("0,00");
  });

  it("parses brazilian price formats", () => {
    expect(parsePriceToCents("250")).toBe(25000);
    expect(parsePriceToCents("250,00")).toBe(25000);
    expect(parsePriceToCents("1.234,56")).toBe(123456);
    expect(parsePriceToCents("R$ 1.234,56")).toBe(123456);
    expect(parsePriceToCents("1,234.56")).toBe(123456);
    expect(parsePriceToCents("0,99")).toBe(99);
  });

  it("rejects invalid prices", () => {
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("abc")).toBeNull();
    expect(parsePriceToCents("-10")).toBeNull();
  });
});
