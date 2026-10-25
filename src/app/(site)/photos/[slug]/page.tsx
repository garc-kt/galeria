import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyDialog } from "@/features/store/components/buy-dialog";
import { Container } from "@/components/layout/container";
import { Gallery } from "@/features/photos/components/gallery";
import { JsonLd } from "@/components/shared/json-ld";
import { PhotoZoom } from "@/features/photos/components/photo-zoom";
import { getPhotoBySlug, listPublishedPhotos } from "@/features/photos/server/queries";
import { listCollectionsForPhoto } from "@/features/collections/server/queries";
import { siteName } from "@/server/env";
import { photoOgUrl } from "@/features/photos/photo-url";
import { absoluteUrl, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const photo = await getPhotoBySlug(slug);
  if (!photo) return { title: "Foto" };

  return {
    title: photo.title,
    description: photo.description ?? photo.alt,
    alternates: { canonical: absoluteUrl("/photos/" + slug) },
    openGraph: {
      type: "article",
      title: photo.title,
      description: photo.description ?? photo.alt,
      url: absoluteUrl("/photos/" + slug),
      images: [{ url: photoOgUrl(photo), width: photo.width, height: photo.height, alt: photo.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: photo.title,
      description: photo.description ?? photo.alt,
      images: [photoOgUrl(photo)],
    },
  };
}

function licenseLabel(license: string): string {
  if (license === "commercial") return "Licença comercial";
  if (license === "both") return "Licença pessoal ou comercial";
  return "Licença pessoal";
}

export default async function PhotoPage({ params }: Params) {
  const { slug } = await params;
  const photo = await getPhotoBySlug(slug);
  if (!photo) notFound();

  const [relatedAll, memberships] = await Promise.all([
    listPublishedPhotos(8),
    listCollectionsForPhoto(photo.id),
  ]);
  const related = relatedAll.filter((item) => item.id !== photo.id).slice(0, 4);
  const primaryCollection = memberships[0] ?? null;

  const exifRows = [
    photo.exif?.camera ? ["Câmera", photo.exif.camera] : null,
    photo.exif?.lens ? ["Lente", photo.exif.lens] : null,
    photo.exif?.aperture ? ["Abertura", photo.exif.aperture] : null,
    photo.exif?.shutter ? ["Velocidade", photo.exif.shutter] : null,
    photo.exif?.iso ? ["ISO", String(photo.exif.iso)] : null,
    photo.exif?.focalLength ? ["Distância focal", photo.exif.focalLength] : null,
    photo.exif?.capturedAt ? ["Capturada em", formatDate(new Date(photo.exif.capturedAt))] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <Container className="py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted">
          <Link href="/collections" className="underline-offset-4 hover:text-fg hover:underline">Coleções</Link>
          {primaryCollection ? (
            <>
              <span aria-hidden> / </span>
              <Link
                href={"/collections/" + primaryCollection.slug}
                className="underline-offset-4 hover:text-fg hover:underline"
              >
                {primaryCollection.title}
              </Link>
            </>
          ) : null}
          <span aria-hidden> / </span>
          <span>{photo.title}</span>
        </div>

        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-8">
            <PhotoZoom photo={photo} sizes="(min-width: 768px) 66vw, 100vw" />
          </div>

          <aside className="md:col-span-4">
            <div className="md:sticky md:top-24">
              <h1 className="text-balance font-display text-5xl uppercase leading-[1.0] tracking-[-0.02em]">
                {photo.title}
              </h1>
              <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted">
                Arquivo {new Date(photo.createdAt).getFullYear()}
              </p>
              {photo.description ? (
                <p className="mt-4 text-sm leading-relaxed text-muted">{photo.description}</p>
              ) : null}

              {memberships.length > 0 ? (
                <p className="mt-3 text-xs text-muted">
                  Coleção:{" "}
                  {memberships.map((collection, index) => (
                    <span key={collection.id}>
                      {index > 0 ? ", " : null}
                      <Link
                        href={"/collections/" + collection.slug}
                        className="text-fg underline underline-offset-2"
                      >
                        {collection.title}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : null}

              {exifRows.length > 0 ? (
                <dl className="mt-8 border-t border-line text-sm">
                  {exifRows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 border-b border-line py-2.5">
                      <dt className="text-[9px] uppercase tracking-[0.16em] text-muted">{label}</dt>
                      <dd className="tabular text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <div className="mt-8">
                <p className="mb-4 text-[10px] uppercase tracking-[0.16em] text-muted">
                  {licenseLabel(photo.license)}
                </p>
                <BuyDialog photo={photo} />
                <p className="mt-4 text-xs leading-6 text-muted">
                Pix, cartão ou boleto via Mercado Pago. Link válido por 30 dias, até 5 downloads.
              </p>
              </div>

              <div className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                <p>Arquivo master JPEG, sRGB, alta resolução. Sem marca d&apos;água.</p>
                <p className="mt-2">Dúvidas sobre uso comercial? <Link href="/contact" className="text-fg underline underline-offset-2">Fale com o estúdio</Link>.</p>
              </div>
            </div>
          </aside>
        </div>
      </Container>

      {related.length > 0 ? (
        <section className="border-t border-line py-16 md:py-20">
          <Container>
            <div className="mb-8 flex items-end justify-between border-b border-line pb-4">
              <h2 className="font-display text-2xl uppercase tracking-[0.02em] md:text-3xl">Mais do arquivo</h2>
              <Link href="/collections" className="text-[10px] uppercase tracking-[0.16em] text-muted underline-offset-4 hover:text-fg hover:underline">
                Ver coleções
              </Link>
            </div>
            <Gallery photos={related} columns={2} sizes="(min-width: 1024px) 50vw, 100vw" />
          </Container>
        </section>
      ) : null}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: photo.title,
          description: photo.description ?? photo.alt,
          image: [photoOgUrl(photo)],
          sku: photo.id,
          brand: { "@type": "Brand", name: siteName() },
          ...(primaryCollection
            ? {
                isPartOf: {
                  "@type": "CollectionPage",
                  name: primaryCollection.title,
                  url: absoluteUrl("/collections/" + primaryCollection.slug),
                },
              }
            : {}),
          ...(photo.priceCents > 0
            ? {
                offers: {
                  "@type": "Offer",
                  url: absoluteUrl("/photos/" + photo.slug),
                  priceCurrency: "BRL",
                  price: (photo.priceCents / 100).toFixed(2),
                  availability: "https://schema.org/InStock",
                  itemCondition: "https://schema.org/NewCondition",
                },
              }
            : {}),
        }}
      />
    </>
  );
}
