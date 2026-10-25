import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { authSecret, isProduction } from "@/server/env";

export const SESSION_COOKIE = "galeria_session";
export const CHALLENGE_COOKIE = "galeria_2fa";
const ISSUER = "galeria";

export type SessionUser = {
  id: string;
  email: string;
};

type TokenSession = SessionUser & { passwordVersion: string };

function passwordVersion(hash: string): string {
  return createHash("sha256").update(hash).digest("hex").slice(0, 24);
}

export async function createSessionToken(user: SessionUser, passwordHash: string): Promise<string> {
  return new SignJWT({
    email: user.email,
    purpose: "session",
    pwd: passwordVersion(passwordHash),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(authSecret());
}

export async function createChallengeToken(userId: string): Promise<string> {
  return new SignJWT({ purpose: "2fa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(authSecret());
}

export async function readSessionToken(token: string): Promise<TokenSession | null> {
  try {
    const { payload } = await jwtVerify(token, authSecret(), { issuer: ISSUER });
    if (
      payload.purpose !== "session" ||
      !payload.sub ||
      typeof payload.email !== "string" ||
      typeof payload.pwd !== "string"
    ) {
      return null;
    }
    return { id: payload.sub, email: payload.email, passwordVersion: payload.pwd };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await readSessionToken(token);
  if (!session) return null;

  const db = await getDb();
  const [admin] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, passwordHash: adminUsers.passwordHash })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.id))
    .limit(1);

  if (!admin || passwordVersion(admin.passwordHash) !== session.passwordVersion) return null;
  return { id: admin.id, email: admin.email };
}

export async function getChallengeUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(CHALLENGE_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret(), { issuer: ISSUER });
    if (payload.purpose !== "2fa" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge,
  };
}
