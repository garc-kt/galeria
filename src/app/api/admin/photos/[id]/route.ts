import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collectionPhotos, photos } from "@/db/schema";
import { isSameOrigin } from "@/features/auth/server/guard";
import { getSessionUser } from "@/features/auth/server/session";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { removeDerived } from "@/features/photos/server/images";
import { getPhotoById } from "@/features/photos/server/queries";
import { deleteFile } from "@/server/storage";
import { photoUpdateSchema } from "@/features/photos/schemas";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);

  const { id } = await context.params;
  const existing = await getPhotoById(id);
  if (!existing) return jsonError("Foto não encontrada.", 404);

  const body = await readJson<unknown>(request);
  const parsed = photoUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dados inválidos.", 400);

  const { collectionId, ...data } = parsed.data;
  const db = await getDb();

  if (Object.keys(data).length > 0) {
    await db
      .update(photos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(photos.id, id));
  }

  if (collectionId !== undefined) {
    await db.delete(collectionPhotos).where(eq(collectionPhotos.photoId, id));
    if (collectionId) {
      await db.insert(collectionPhotos).values({ collectionId, photoId: id, position: 0 });
    }
  }

  return jsonOk({ ok: true });
}

export async function DELETE(request: Request, context: Context) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);

  const { id } = await context.params;
  const photo = await getPhotoById(id);
  if (!photo) return jsonError("Foto não encontrada.", 404);

  const db = await getDb();
  try {
    await db.delete(photos).where(eq(photos.id, id));
  } catch {
    return jsonError("Esta foto tem pedidos vinculados e não pode ser excluída.", 409);
  }

  await removeDerived(photo.id);
  await deleteFile(photo.originalKey).catch(() => undefined);
  if (photo.masterKey && photo.masterKey !== photo.originalKey) {
    await deleteFile(photo.masterKey).catch(() => undefined);
  }

  return jsonOk({ ok: true });
}
