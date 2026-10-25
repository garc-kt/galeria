import { describe, expect, it } from "vitest";
import { readJson } from "@/server/http";

describe("readJson", () => {
  it("parses a small JSON body", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
    });
    await expect(readJson<{ ok: boolean }>(request)).resolves.toEqual({ ok: true });
  });

  it("rejects oversized bodies", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ value: "x".repeat(70_000) }),
    });
    await expect(readJson(request)).resolves.toBeNull();
  });

  it("rejects malformed bodies", async () => {
    const request = new Request("http://localhost/api", { method: "POST", body: "{" });
    await expect(readJson(request)).resolves.toBeNull();
  });
});
