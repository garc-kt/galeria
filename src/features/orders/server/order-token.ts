import { createHmac, timingSafeEqual } from "node:crypto";
import { authSecret } from "@/server/env";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function key(): Buffer {
  return Buffer.from(authSecret());
}

function sign(payload: string): string {
  return createHmac("sha256", key()).update(payload).digest("base64url");
}

export function createOrderToken(orderId: string, ttlSeconds = 7200): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = orderId + "." + String(exp);
  return payload + "." + sign(payload);
}

export function verifyOrderToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [orderId, exp, signature] = parts;
  if (!UUID_RE.test(orderId)) return null;
  if (!/^\d+$/.test(exp)) return null;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;

  const expected = sign(orderId + "." + exp);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return orderId;
}
