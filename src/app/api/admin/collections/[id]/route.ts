import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collections } from "@/db/schema";
import { isSameOrigin } from "@/features/auth/server/guard";
import { getSessionUser } from "@/features/auth/server/session";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { collectionSchema } from "@/features/collections/schemas";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };
type Update = { title?: string; description?: string; published?: boolean };

export async function PATCH(request: Request, context: Context) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);
  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);

  const { id } = await context.params;
  const body = await readJson<unknown>(request);
  const parsed = collectionSchema.partial().safeParse(body);
  if (!parsed.success) return jsonError("Dados inválidos.", 400);

  const data: Update = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description || "";
  if (parsed.data.published !== undefined) data.published = parsed.data.published;

  const db = await getDb();
  await db.update(collections).set(data).where(eq(collections.id, id));

  return jsonOk({ ok: true });
}

export async function DELETE(request: Request, context: Context) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);
  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);

  const { id } = await context.params;
  const db = await getDb();
  await db.delete(collections).where(eq(collections.id, id));

  return jsonOk({ ok: true });
}
