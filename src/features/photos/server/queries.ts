import { and, asc, desc, eq, gt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { photos } from "@/db/schema";

const isPublished = eq(photos.status, "published");

export async function listFeaturedPhotos(limit = 6) {
  const db = await getDb();
  return db
    .select()
    .from(photos)
    .where(and(isPublished, eq(photos.featured, true)))
    .orderBy(asc(photos.sortOrder), desc(photos.createdAt))
    .limit(limit);
}

export async function listPublishedPhotos(limit = 60) {
  const db = await getDb();
  return db
    .select()
    .from(photos)
    .where(isPublished)
    .orderBy(asc(photos.sortOrder), desc(photos.createdAt))
    .limit(limit);
}

export async function listPhotosForStore(limit = 60) {
  const db = await getDb();
  return db
    .select()
    .from(photos)
    .where(and(isPublished, gt(photos.priceCents, 0)))
    .orderBy(asc(photos.sortOrder), desc(photos.createdAt))
    .limit(limit);
}

export async function getPhotoBySlug(slug: string) {
  const db = await getDb();
  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.slug, slug), isPublished))
    .limit(1);
  return photo ?? null;
}

export async function listAllPhotos() {
  const db = await getDb();
  return db.select().from(photos).orderBy(desc(photos.createdAt));
}

export async function getPhotoById(id: string) {
  const db = await getDb();
  const [photo] = await db.select().from(photos).where(eq(photos.id, id)).limit(1);
  return photo ?? null;
}
