import { eq } from "drizzle-orm";
import { isSameOrigin } from "@/features/auth/server/guard";
import { getSessionUser } from "@/features/auth/server/session";
import { verifyTotp } from "@/features/auth/server/totp";
import { getDb } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { getAdminById } from "@/features/auth/server/queries";
import { totpCodeSchema } from "@/features/auth/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);

  const body = await readJson<unknown>(request);
  const parsed = totpCodeSchema.safeParse(body);
  if (!parsed.success) return jsonError("Código inválido.", 400);

  const admin = await getAdminById(user.id);
  if (!admin || !admin.totpSecret) return jsonError("Gere o QR code primeiro.", 400);
  if (!verifyTotp(parsed.data.code, admin.totpSecret)) return jsonError("Código incorreto.", 401);

  const db = await getDb();
  await db.update(adminUsers).set({ totpEnabled: true }).where(eq(adminUsers.id, admin.id));

  return jsonOk({ ok: true });
}
