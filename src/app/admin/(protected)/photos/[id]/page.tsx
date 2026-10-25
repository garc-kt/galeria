import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoForm } from "@/features/admin/components/photo-form";
import { getCollectionIdsForPhoto, listAllCollections } from "@/features/collections/server/queries";
import { getPhotoById } from "@/features/photos/server/queries";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function EditPhotoPage({ params }: Params) {
  const { id } = await params;
  const photo = await getPhotoById(id);
  if (!photo) notFound();

  const [collections, memberships] = await Promise.all([
    listAllCollections(),
    getCollectionIdsForPhoto(photo.id),
  ]);

  const width = photo.widths.length > 0 ? photo.widths[photo.widths.length - 1] : 1280;
  const version = new Date(photo.updatedAt).getTime();

  return (
    <div>
      <div className="border-b border-line pb-5">
        <Link href="/admin/photos" className="text-xs text-muted underline underline-offset-4">← Fotos</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-3xl tracking-tight">{photo.title}</h1>
          {photo.status === "published" ? (
            <Link href={"/photos/" + photo.slug} target="_blank" className="text-xs text-muted underline underline-offset-4">Ver no site</Link>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <img
            src={"/media/" + photo.id + "/" + width + ".jpg?v=" + version}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            className="w-full border border-line object-cover"
          />
          <dl className="mt-4 border-t border-line text-xs">
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-muted">Original</dt>
              <dd className="truncate text-right">{photo.originalName ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-muted">Mestre</dt>
              <dd>{photo.masterKey ? "Presente" : "Ausente"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-muted">Dimensões</dt>
              <dd>{photo.width} × {photo.height}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-muted">Larguras</dt>
              <dd>{photo.widths.join(", ") || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-8">
          <PhotoForm
            photo={photo}
            collections={collections.map((collection) => ({ id: collection.id, title: collection.title }))}
            selectedCollectionId={memberships[0] ?? null}
          />
        </div>
      </div>
    </div>
  );
}
