import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Gallery } from "@/features/photos/components/gallery";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHeader } from "@/components/shared/page-header";
import { getCollectionBySlug } from "@/features/collections/server/queries";
import { photoOgUrl } from "@/features/photos/photo-url";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCollectionBySlug(slug);
  if (!data) return { title: "Coleção" };

  const cover = data.photos[0];
  return {
    title: data.collection.title,
    description: data.collection.description ?? "Coleção de fotografia autoral.",
    alternates: { canonical: absoluteUrl("/collections/" + slug) },
    openGraph: {
      title: data.collection.title,
      description: data.collection.description ?? undefined,
      url: absoluteUrl("/collections/" + slug),
      images: cover ? [{ url: photoOgUrl(cover), width: cover.width, height: cover.height }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: data.collection.title,
      description: data.collection.description ?? undefined,
      images: cover ? [photoOgUrl(cover)] : undefined,
    },
  };
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const data = await getCollectionBySlug(slug);
  if (!data) notFound();

  const { collection, photos } = data;

  return (
    <>
      <PageHeader
        title={collection.title}
        description={collection.description ?? undefined}
      />

      <Container className="py-12 md:py-16">
        <div className="mb-10 flex items-baseline justify-between border-b border-line pb-4 text-xs text-muted">
          <span>{photos.length} imagens</span>
          <span>Clique para abrir</span>
        </div>
        <Gallery photos={photos} columns={2} sizes="(min-width: 1024px) 50vw, 100vw" mode="link" />
      </Container>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: collection.title,
          description: collection.description ?? undefined,
          url: absoluteUrl("/collections/" + collection.slug),
          hasPart: photos.map((photo) => ({
            "@type": "ImageObject",
            name: photo.title,
            contentUrl: photoOgUrl(photo),
          })),
        }}
      />
    </>
  );
}
