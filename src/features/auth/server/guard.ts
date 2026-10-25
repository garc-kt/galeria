import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function getAdminOrNull(): Promise<SessionUser | null> {
  return getSessionUser();
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
