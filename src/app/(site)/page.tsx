import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/shared/json-ld";
import { PhotoPicture } from "@/features/photos/components/photo-picture";
import { listCollectionsWithCovers } from "@/features/collections/server/queries";
import { listFeaturedPhotos, listPublishedPhotos } from "@/features/photos/server/queries";
import { photoOgUrl } from "@/features/photos/photo-url";
import { siteName, siteUrl } from "@/server/env";
import { absoluteUrl } from "@/lib/utils";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [photo] = await listFeaturedPhotos(1);
  return {
    alternates: { canonical: siteUrl() },
    openGraph: photo
      ? {
          images: [
            {
              url: photoOgUrl(photo),
              width: photo.width,
              height: photo.height,
              alt: photo.alt,
            },
          ],
        }
      : undefined,
    twitter: photo
      ? { card: "summary_large_image", images: [photoOgUrl(photo)] }
      : { card: "summary_large_image" },
  };
}

export default async function HomePage() {
  const [featured, published, collections] = await Promise.all([
    listFeaturedPhotos(1),
    listPublishedPhotos(9),
    listCollectionsWithCovers(),
  ]);

  const hero = featured[0] ?? published[0] ?? null;
  const rest = published.filter((photo) => photo.id !== hero?.id);
  const topSmall = rest[0] ?? null;
  const lower = rest.slice(1, 3);
  const selection = rest.slice(3, 9);

  return (
    <>
      <section className="border-b border-line">
        <Container className="py-10 md:py-14">
          <div className="grid grid-cols-12 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
            {topSmall ? (
              <div className="col-span-8 col-start-3 md:col-span-3 md:col-start-2 md:row-start-1">
                <Link
                  href={"/photos/" + topSmall.slug}
                  aria-label={"Ver " + topSmall.title}
                  className="group block"
                >
                  <PhotoPicture
                    photo={topSmall}
                    sizes="(min-width: 768px) 25vw, 66vw"
                    cropClassName="aspect-[3/4]"
                    className="transition-opacity duration-200 group-hover:opacity-90"
                  />
                </Link>
              </div>
            ) : null}

            {hero ? (
              <div className="col-span-12 md:col-span-5 md:col-start-7 md:row-span-2 md:row-start-1">
                <Link
                  href={"/photos/" + hero.slug}
                  aria-label={"Ver " + hero.title}
                  className="group block md:h-full"
                >
                  <PhotoPicture
                    photo={hero}
                    priority
                    sizes="(min-width: 768px) 42vw, 100vw"
                    cropClassName="aspect-[4/5] md:aspect-auto md:h-full"
                    className="h-full"
                    imgClassName="object-cover"
                  />
                </Link>
              </div>
            ) : null}

            <div className="col-span-12 md:col-span-5 md:col-start-1 md:row-start-2 md:mt-10">
              <h1 className="max-w-xl font-display text-[2.9rem] uppercase leading-[0.98] tracking-[-0.02em] md:text-[4.2rem]">
                Luz, matéria
                <br />e <em className="italic">silêncio</em>.
              </h1>
              <p className="mt-6 max-w-md font-display text-lg uppercase leading-[1.25] md:text-xl">
                Não buscamos imagens isoladas. Reunimos séries que dão mistério e magia ao arquivo.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-6">
                <Link
                  href="/collections"
                  className="border-b border-line pb-1 text-[10px] uppercase tracking-[0.2em] transition-colors hover:border-fg"
                >
                  Ver coleções
                </Link>
                <Link
                  href="/store"
                  className="border-b border-line pb-1 text-[10px] uppercase tracking-[0.2em] transition-colors hover:border-fg"
                >
                  Loja
                </Link>
              </div>
            </div>

            {lower.map((photo, index) => (
              <div
                key={photo.id}
                className={
                  index === 0
                    ? "col-span-6 md:col-span-3 md:col-start-2 md:row-start-3"
                    : "col-span-6 md:col-span-3 md:col-start-10 md:row-start-3"
                }
              >
                <Link
                  href={"/photos/" + photo.slug}
                  aria-label={"Ver " + photo.title}
                  className="group block"
                >
                  <PhotoPicture
                    photo={photo}
                    sizes="(min-width: 768px) 25vw, 50vw"
                    cropClassName="aspect-[4/3]"
                    className="transition-opacity duration-200 group-hover:opacity-90"
                  />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {selection.length > 0 ? (
        <section className="border-b border-line">
          <Container className="py-14 md:py-20">
            <div className="flex items-baseline justify-between gap-6 border-b border-line pb-3">
              <h2 className="font-display text-2xl uppercase tracking-[0.02em] md:text-3xl">Seleção</h2>
              <Link
                href="/store"
                className="text-[10px] uppercase tracking-[0.2em] text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
              >
                Ver todas
              </Link>
            </div>

            <div className="mt-8 columns-1 gap-6 sm:columns-2">
              {selection.map((photo) => (
                <Link
                  key={photo.id}
                  href={"/photos/" + photo.slug}
                  aria-label={"Ver " + photo.title}
                  className="group mb-8 block break-inside-avoid"
                >
                  <PhotoPicture
                    photo={photo}
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="transition-opacity duration-200 group-hover:opacity-90"
                  />
                  <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-line pt-2 text-xs">
                    <span className="uppercase tracking-[0.08em]">{photo.title}</span>
                    <span className="shrink-0 tabular text-muted">
                      {photo.priceCents > 0
                        ? formatBRL(photo.priceCents)
                        : new Date(photo.createdAt).getFullYear()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {collections.length > 0 ? (
        <section className="border-b border-line py-16 md:py-20">
          <Container className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="min-w-0 md:col-span-4">
              <h2 className="font-display text-2xl uppercase tracking-[0.02em] md:text-3xl">Coleções</h2>
              <p className="mt-4 max-w-xs text-sm leading-7 text-muted">
                Séries abertas e fechadas, escolhidas devagar.
              </p>
            </div>

            <div className="min-w-0 divide-y divide-line border-t border-line md:col-span-8">
              {collections.map(({ collection, cover, count }) => (
                <Link
                  key={collection.id}
                  href={"/collections/" + collection.slug}
                  className="group flex items-center gap-6 py-6"
                >
                  {cover ? (
                    <PhotoPicture
                      photo={cover}
                      sizes="120px"
                      cropClassName="aspect-square"
                      className="h-20 w-20 shrink-0"
                    />
                  ) : (
                    <div className="h-20 w-20 shrink-0 border border-line" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-xl uppercase tracking-[0.02em] transition-opacity group-hover:opacity-60 md:text-2xl">
                      {collection.title}
                    </h3>
                    {collection.description ? (
                      <p className="mt-1 truncate text-sm text-muted">{collection.description}</p>
                    ) : null}
                  </div>
                  <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted sm:block">
                    {count} fotos
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: siteName(),
              url: siteUrl(),
              inLanguage: "pt-BR",
            },
            {
              "@type": "Organization",
              name: siteName(),
              url: siteUrl(),
              logo: absoluteUrl("/icon.svg"),
            },
          ],
        }}
      />
    </>
  );
}
