import Link from "next/link";
import { CollectionActions } from "@/features/admin/components/collection-actions";
import { CollectionForm } from "@/features/admin/components/collection-form";
import { listAllCollections } from "@/features/collections/server/queries";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await listAllCollections();

  return (
    <div>
      <div className="border-b border-line pb-5">
        <p className="eyebrow">Arquivo</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Coleções</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Agrupe fotos em séries. A coleção publicada aparece no site.
        </p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <CollectionForm />
        </div>

        <div className="lg:col-span-7">
          {collections.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma coleção ainda.</p>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {collections.map((collection) => (
                <li key={collection.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-xl tracking-tight">{collection.title}</p>
                      <p className="mt-1 font-mono text-[11px] text-muted">/{collection.slug}</p>
                      {collection.description ? (
                        <p className="mt-2 max-w-md text-sm text-muted">{collection.description}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="border border-line px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-muted">
                        {collection.published ? "Publicada" : "Oculta"}
                      </span>
                      {collection.published ? (
                        <Link href={"/collections/" + collection.slug} target="_blank" className="text-xs underline underline-offset-4">Ver</Link>
                      ) : null}
                      <CollectionActions id={collection.id} published={collection.published} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
