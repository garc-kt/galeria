import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { PhotoPicture } from "@/features/photos/components/photo-picture";
import { listCollectionsWithCovers } from "@/features/collections/server/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coleções",
  description: "Coleções de fotografia autoral: séries, arquivo e edições digitais.",
};

const positions = [
  "md:col-span-7",
  "md:col-span-4 md:col-start-9 md:mt-24",
  "md:col-span-5 md:col-start-2",
];

export default async function CollectionsPage() {
  const collections = await listCollectionsWithCovers();
  const totalPhotos = collections.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <PageHeader
        title="Coleções"
        description="Séries abertas e fechadas. Cada coleção reúne um pequeno conjunto de imagens em torno de uma ideia."
      />

      <Container className="py-16 md:py-20">
        {collections.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma coleção publicada ainda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-12">
            {collections.map(({ collection, cover, count }, index) => (
              <Link
                key={collection.id}
                href={"/collections/" + collection.slug}
                className={cn("group block", positions[index] ?? "md:col-span-6")}
              >
                <div className="overflow-hidden bg-line/30">
                  {cover ? (
                    <PhotoPicture
                      photo={cover}
                      sizes="(min-width: 768px) 60vw, 100vw"
                      cropClassName={index === 1 ? "aspect-[3/4]" : "aspect-[4/3]"}
                      className="transition-opacity duration-200 group-hover:opacity-90"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-end border border-line p-6">
                      <p className="font-display text-3xl">{collection.title}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h2 className="truncate font-display text-xl uppercase tracking-[0.02em] transition-opacity group-hover:opacity-60 md:text-2xl">
                    {collection.title}
                  </h2>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-muted">
                    {count} fotos
                  </span>
                </div>

                {collection.description ? (
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted">{collection.description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        )}

        {collections.length > 0 ? (
          <div className="mt-16 grid grid-cols-3 border-t border-line pt-3 text-[10px] uppercase tracking-[0.16em] text-muted">
            <span>Arquivo 2026</span>
            <span className="text-center">{totalPhotos} fotos</span>
            <span className="text-right">{collections.length} séries</span>
          </div>
        ) : null}
      </Container>
    </>
  );
}
