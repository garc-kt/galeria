import QRCode from "qrcode";
import { isSameOrigin } from "@/features/auth/server/guard";
import { getSessionUser } from "@/features/auth/server/session";
import { generateTotpSecret, totpUri } from "@/features/auth/server/totp";
import { getDb } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, jsonOk } from "@/server/http";
import { getAdminById } from "@/features/auth/server/queries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);

  const admin = await getAdminById(user.id);
  if (!admin) return jsonError("Não autorizado.", 401);
  if (admin.totpEnabled) return jsonError("Verificação em duas etapas já está ativa.", 409);

  const secret = generateTotpSecret();
  const uri = totpUri(admin.email, secret);
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 240 });

  const db = await getDb();
  await db.update(adminUsers).set({ totpSecret: secret }).where(eq(adminUsers.id, admin.id));

  return jsonOk({ secret, otpauth: uri, qr });
}
