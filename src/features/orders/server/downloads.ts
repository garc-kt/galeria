import { createHash, randomBytes } from "node:crypto";

export const DOWNLOAD_DAYS = 30;
export const MAX_DOWNLOADS = 5;

export function generateDownloadToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDownloadToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function downloadExpiryDate(now = new Date()): Date {
  return new Date(now.getTime() + DOWNLOAD_DAYS * 24 * 60 * 60 * 1000);
}

export function isDownloadActive(expiresAt: Date, count: number, max = MAX_DOWNLOADS): boolean {
  return expiresAt.getTime() > Date.now() && count < max;
}
