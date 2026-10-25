import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/features/auth/server/password";
import { isSameOrigin } from "@/features/auth/server/guard";
import { getSessionUser } from "@/features/auth/server/session";
import { getDb } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { getAdminById } from "@/features/auth/server/queries";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { passwordChangeSchema } from "@/features/auth/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);

  const limited = rateLimit("password:" + clientIp(request), 5, 15 * 60 * 1000);
  if (!limited.ok) return jsonError("Muitas tentativas. Aguarde.", 429);

  const body = await readJson<unknown>(request);
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) return jsonError("A nova senha precisa de pelo menos 12 caracteres.", 400);

  const admin = await getAdminById(user.id);
  if (!admin) return jsonError("Não autorizado.", 401);
  if (!verifyPassword(parsed.data.currentPassword, admin.passwordHash)) {
    return jsonError("Senha atual incorreta.", 401);
  }
  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return jsonError("A nova senha deve ser diferente da atual.", 400);
  }

  const db = await getDb();
  await db
    .update(adminUsers)
    .set({ passwordHash: hashPassword(parsed.data.newPassword) })
    .where(eq(adminUsers.id, admin.id));

  return jsonOk({ ok: true });
}
