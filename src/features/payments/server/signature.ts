import { createHmac, timingSafeEqual } from "node:crypto";

export function mercadoPagoManifest(dataId: string, requestId: string, ts: string): string {
  return "id:" + dataId + ";request-id:" + requestId + ";ts:" + ts + ";";
}

export function signMercadoPagoManifest(manifest: string, secret: string): string {
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

export function verifyMercadoPagoSignature(
  header: string | null,
  dataId: string,
  requestId: string,
  secret: string,
): boolean {
  if (!header) return false;

  const parts = new Map<string, string>();
  for (const pair of header.split(",")) {
    const index = pair.indexOf("=");
    if (index < 0) continue;
    parts.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }

  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1) return false;

  const expected = signMercadoPagoManifest(mercadoPagoManifest(dataId, requestId, ts), secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
