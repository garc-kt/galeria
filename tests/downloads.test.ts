import { describe, expect, it } from "vitest";
import {
  DOWNLOAD_DAYS,
  downloadExpiryDate,
  generateDownloadToken,
  hashDownloadToken,
  isDownloadActive,
} from "@/features/orders/server/downloads";

describe("downloads", () => {
  it("generates a random token and stable hash", () => {
    const token = generateDownloadToken();
    expect(token.length).toBeGreaterThan(30);
    expect(hashDownloadToken(token)).toHaveLength(64);
    expect(hashDownloadToken(token)).toBe(hashDownloadToken(token));
  });

  it("expires in the configured window", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const expiry = downloadExpiryDate(now);
    expect(expiry.getTime() - now.getTime()).toBe(DOWNLOAD_DAYS * 24 * 60 * 60 * 1000);
  });

  it("checks expiry and download count", () => {
    expect(isDownloadActive(new Date(Date.now() + 1000), 0)).toBe(true);
    expect(isDownloadActive(new Date(Date.now() - 1000), 0)).toBe(false);
    expect(isDownloadActive(new Date(Date.now() + 1000), 5)).toBe(false);
  });
});
