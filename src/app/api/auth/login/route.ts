import { hashPassword, verifyPassword } from "@/features/auth/server/password";
import {
  CHALLENGE_COOKIE,
  SESSION_COOKIE,
  createChallengeToken,
  createSessionToken,
  sessionCookieOptions,
} from "@/features/auth/server/session";
import { isSameOrigin } from "@/features/auth/server/guard";
import { getAdminByEmail } from "@/features/auth/server/queries";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { loginSchema } from "@/features/auth/schemas";

export const runtime = "nodejs";

const dummyHash = hashPassword("dummy-password-never-used");

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const ip = clientIp(request);
  const limited = rateLimit("login:" + ip, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return jsonError("Muitas tentativas. Tente novamente em " + limited.retryAfter + "s.", 429);
  }

  const body = await readJson<unknown>(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dados inválidos.", 400);

  const admin = await getAdminByEmail(parsed.data.email);
  const valid = verifyPassword(parsed.data.password, admin?.passwordHash ?? dummyHash);

  if (!admin || !valid) return jsonError("E-mail ou senha inválidos.", 401);

  if (admin.totpEnabled) {
    const challenge = await createChallengeToken(admin.id);
    const response = jsonOk({ requires2fa: true });
    response.cookies.set(CHALLENGE_COOKIE, challenge, sessionCookieOptions(300));
    return response;
  }

  const token = await createSessionToken({ id: admin.id, email: admin.email }, admin.passwordHash);
  const response = jsonOk({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(8 * 60 * 60));
  return response;
}
