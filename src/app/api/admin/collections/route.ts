import { randomUUID } from "node:crypto";
import { getDb } from "@/db/client";
import { collections } from "@/db/schema";
import { isSameOrigin } from "@/features/auth/server/guard";
import { getSessionUser } from "@/features/auth/server/session";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { slugify } from "@/lib/slug";
import { collectionSchema } from "@/features/collections/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);

  const body = await readJson<unknown>(request);
  const parsed = collectionSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dados inválidos.", 400);

  const db = await getDb();
  const suffix = randomUUID().slice(0, 6);
  const [inserted] = await db
    .insert(collections)
    .values({
      slug: slugify(parsed.data.title) + "-" + suffix,
      title: parsed.data.title,
      description: parsed.data.description || null,
      published: parsed.data.published ?? true,
    })
    .returning({ id: collections.id, slug: collections.slug });

  return jsonOk({ ok: true, collection: inserted });
}
