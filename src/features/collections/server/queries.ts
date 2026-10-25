import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collectionPhotos, collections, photos } from "@/db/schema";

const isPublished = eq(photos.status, "published");

export async function listCollections() {
  const db = await getDb();
  return db
    .select()
    .from(collections)
    .where(eq(collections.published, true))
    .orderBy(asc(collections.sortOrder), asc(collections.title));
}

export async function getCollectionBySlug(slug: string) {
  const db = await getDb();
  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.slug, slug), eq(collections.published, true)))
    .limit(1);

  if (!collection) return null;

  const rows = await db
    .select({ photo: photos })
    .from(collectionPhotos)
    .innerJoin(photos, eq(collectionPhotos.photoId, photos.id))
    .where(and(eq(collectionPhotos.collectionId, collection.id), isPublished))
    .orderBy(asc(collectionPhotos.position), asc(photos.sortOrder));

  return { collection, photos: rows.map((row) => row.photo) };
}

export async function listCollectionsWithCovers() {
  const rows = await listCollections();
  if (rows.length === 0) return [];

  const db = await getDb();
  const photoRows = await db
    .select({ collectionId: collectionPhotos.collectionId, photo: photos })
    .from(collectionPhotos)
    .innerJoin(photos, eq(collectionPhotos.photoId, photos.id))
    .where(
      and(
        inArray(
          collectionPhotos.collectionId,
          rows.map((collection) => collection.id),
        ),
        isPublished,
      ),
    )
    .orderBy(asc(collectionPhotos.collectionId), asc(collectionPhotos.position), asc(photos.sortOrder));

  const grouped = new Map<string, typeof photoRows>();
  for (const row of photoRows) {
    const list = grouped.get(row.collectionId) ?? [];
    list.push(row);
    grouped.set(row.collectionId, list);
  }

  return rows.map((collection) => {
    const list = grouped.get(collection.id) ?? [];
    return {
      collection,
      cover: list[0]?.photo ?? null,
      count: list.length,
    };
  });
}

export async function listAllCollections() {
  const db = await getDb();
  return db.select().from(collections).orderBy(asc(collections.sortOrder), asc(collections.title));
}

export async function listCollectionsForPhoto(photoId: string) {
  const db = await getDb();
  return db
    .select({ id: collections.id, slug: collections.slug, title: collections.title })
    .from(collectionPhotos)
    .innerJoin(collections, eq(collectionPhotos.collectionId, collections.id))
    .where(and(eq(collectionPhotos.photoId, photoId), eq(collections.published, true)))
    .orderBy(asc(collections.sortOrder), asc(collections.title));
}

export async function getCollectionIdsForPhoto(photoId: string) {
  const db = await getDb();
  const rows = await db
    .select({ collectionId: collectionPhotos.collectionId })
    .from(collectionPhotos)
    .where(eq(collectionPhotos.photoId, photoId));
  return rows.map((row) => row.collectionId);
}
