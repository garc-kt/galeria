export const isProduction = process.env.NODE_ENV === "production";

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

export function siteUrl(): string {
  const value = clean(process.env.NEXT_PUBLIC_SITE_URL);
  if (value) return value.replace(/\/+$/, "");
  if (isProduction) {
    throw new Error("NEXT_PUBLIC_SITE_URL é obrigatório em produção.");
  }
  return "http://localhost:3000";
}

export function siteName(): string {
  return clean(process.env.NEXT_PUBLIC_SITE_NAME) || "Galeria";
}

export function photographerName(): string {
  return clean(process.env.NEXT_PUBLIC_PHOTOGRAPHER) || "Seu Nome";
}

export function contactEmail(): string {
  return clean(process.env.CONTACT_EMAIL) || "contato@example.com";
}

export function instagramUrl(): string {
  return clean(process.env.NEXT_PUBLIC_INSTAGRAM);
}

export function authSecret(): Uint8Array {
  const value = clean(process.env.AUTH_SECRET);
  if (value.length >= 32) return new TextEncoder().encode(value);
  if (isProduction) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters in production.");
  }
  return new TextEncoder().encode("dev-only-secret-change-me-000000000000");
}

export function maxUploadBytes(): number {
  const mb = Number(clean(process.env.MAX_UPLOAD_MB) || "95");
  return Math.max(1, Number.isFinite(mb) ? mb : 95) * 1024 * 1024;
}

export function emailFrom(): string {
  const value = clean(process.env.EMAIL_FROM);
  if (value) return value;
  if (isProduction) throw new Error("EMAIL_FROM é obrigatório em produção.");
  return siteName() + " <no-reply@example.com>";
}

export function paymentsMock(): boolean {
  return !isProduction && clean(process.env.PAYMENTS_MOCK) === "true";
}

export function storageDriver(): "local" | "s3" {
  return clean(process.env.STORAGE_DRIVER) === "s3" ? "s3" : "local";
}
