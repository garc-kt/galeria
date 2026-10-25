import { isSameOrigin } from "@/features/auth/server/guard";
import {
  CHALLENGE_COOKIE,
  SESSION_COOKIE,
  createSessionToken,
  getChallengeUserId,
  sessionCookieOptions,
} from "@/features/auth/server/session";
import { verifyTotp } from "@/features/auth/server/totp";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { getAdminById } from "@/features/auth/server/queries";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { totpCodeSchema } from "@/features/auth/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const ip = clientIp(request);
  const limited = rateLimit("2fa:" + ip, 10, 10 * 60 * 1000);
  if (!limited.ok) return jsonError("Muitas tentativas. Aguarde.", 429);

  const userId = await getChallengeUserId();
  if (!userId) return jsonError("Sessão expirada. Entre novamente.", 401);

  const body = await readJson<unknown>(request);
  const parsed = totpCodeSchema.safeParse(body);
  if (!parsed.success) return jsonError("Código inválido.", 400);

  const admin = await getAdminById(userId);
  if (!admin || !admin.totpSecret) return jsonError("Verificação indisponível.", 400);

  if (!verifyTotp(parsed.data.code, admin.totpSecret)) {
    return jsonError("Código incorreto.", 401);
  }

  const token = await createSessionToken({ id: admin.id, email: admin.email }, admin.passwordHash);
  const response = jsonOk({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(8 * 60 * 60));
  response.cookies.set(CHALLENGE_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return response;
}
