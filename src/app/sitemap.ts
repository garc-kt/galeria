import type { MetadataRoute } from "next";
import { listCollections } from "@/features/collections/server/queries";
import { listPublishedPhotos } from "@/features/photos/server/queries";
import { siteUrl } from "@/server/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  try {
    const [photos, collections] = await Promise.all([listPublishedPhotos(500), listCollections()]);

    return [
      { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
      { url: base + "/collections", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: base + "/store", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
      { url: base + "/about", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: base + "/contact", lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
      ...collections.map((collection) => ({
        url: base + "/collections/" + collection.slug,
        lastModified: collection.createdAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...photos.map((photo) => ({
        url: base + "/photos/" + photo.slug,
        lastModified: photo.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return [{ url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
  }
}
