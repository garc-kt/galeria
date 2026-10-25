import { NextResponse } from "next/server";
import { isSameOrigin } from "@/features/auth/server/guard";
import { CHALLENGE_COOKIE, SESSION_COOKIE, sessionCookieOptions } from "@/features/auth/server/session";
import { jsonError, jsonOk } from "@/server/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const response = jsonOk({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  response.cookies.set(CHALLENGE_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return response;
}
