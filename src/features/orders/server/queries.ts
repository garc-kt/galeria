import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { downloads, orders, photos } from "@/db/schema";

export async function listOrders(limit = 100) {
  const db = await getDb();
  return db
    .select({
      order: orders,
      photoTitle: photos.title,
      photoSlug: photos.slug,
    })
    .from(orders)
    .innerJoin(photos, eq(orders.photoId, photos.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getOrderById(id: string) {
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return order ?? null;
}

export async function getDownloadInfo(tokenHash: string) {
  const db = await getDb();
  const [row] = await db
    .select({ download: downloads, photo: photos, order: orders })
    .from(downloads)
    .innerJoin(photos, eq(downloads.photoId, photos.id))
    .innerJoin(orders, eq(downloads.orderId, orders.id))
    .where(eq(downloads.tokenHash, tokenHash))
    .limit(1);
  return row ?? null;
}
