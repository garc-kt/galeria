import { describe, expect, it } from "vitest";
import { slugify, slugWithSuffix } from "@/lib/slug";

describe("slug", () => {
  it("removes accents and spaces", () => {
    expect(slugify("Névoa do Mar")).toBe("nevoa-do-mar");
    expect(slugify("  Janela — 2024  ")).toBe("janela-2024");
  });

  it("falls back to foto", () => {
    expect(slugify("!!!")).toBe("foto");
  });

  it("adds a short suffix", () => {
    expect(slugWithSuffix("Pedra", "abcdef123")).toBe("pedra-abcdef");
  });
});
