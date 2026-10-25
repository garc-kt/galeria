import { getSessionUser } from "@/features/auth/server/session";
import { jsonError, jsonOk } from "@/server/http";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);
  return jsonOk({ user });
}
