import { isSameOrigin } from "@/features/auth/server/guard";
import { getSessionUser } from "@/features/auth/server/session";
import { jsonError, jsonOk } from "@/server/http";
import { resendOrderDelivery } from "@/features/orders/server/orders";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);

  const limited = rateLimit("resend:" + clientIp(request), 10, 10 * 60 * 1000);
  if (!limited.ok) return jsonError("Muitas tentativas. Aguarde.", 429);

  const { id } = await context.params;
  const result = await resendOrderDelivery(id);
  if (!result.ok) return jsonError(result.error || "Falha ao reenviar.", 400);

  return jsonOk({ ok: true });
}
