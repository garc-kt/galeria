import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { listAllPhotos } from "@/features/photos/server/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function statusLabel(status: string): string {
  return status === "published" ? "Publicada" : "Rascunho";
}

export default async function AdminPhotosPage() {
  const photos = await listAllPhotos();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="eyebrow">Arquivo</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">Fotos</h1>
        </div>
        <Link href="/admin/photos/new" className={buttonClasses("primary", "sm")}>Nova foto</Link>
      </div>

      {photos.length === 0 ? (
        <div className="mt-10 border border-line p-8">
          <p className="text-sm text-muted">Nenhuma foto ainda. Envie um RAW e o JPEG mestre editado.</p>
          <Link href="/admin/photos/new" className={buttonClasses("primary", "sm", "mt-4")}>Enviar a primeira</Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="py-3 pr-4 font-normal">Foto</th>
                <th className="py-3 pr-4 font-normal">Status</th>
                <th className="py-3 pr-4 font-normal">Preço</th>
                <th className="py-3 pr-4 font-normal">Destaque</th>
                <th className="py-3 pr-4 font-normal">Criada</th>
                <th className="py-3 font-normal">Ações</th>
              </tr>
            </thead>
            <tbody>
              {photos.map((photo) => {
                const width = photo.widths.length > 0 ? photo.widths[0] : 640;
                const version = new Date(photo.updatedAt).getTime();
                return (
                  <tr key={photo.id} className="border-b border-line align-middle">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={"/media/" + photo.id + "/" + width + ".jpg?v=" + version}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate">{photo.title}</p>
                          <p className="truncate font-mono text-[11px] text-muted">{photo.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="border border-line px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-muted">
                        {statusLabel(photo.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted">{photo.priceCents > 0 ? formatBRL(photo.priceCents) : "—"}</td>
                    <td className="py-3 pr-4 text-muted">{photo.featured ? "Sim" : "—"}</td>
                    <td className="py-3 pr-4 text-muted">{formatDate(photo.createdAt)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Link href={"/admin/photos/" + photo.id} className="text-xs underline underline-offset-4">Editar</Link>
                        {photo.status === "published" ? (
                          <Link href={"/photos/" + photo.slug} target="_blank" className="text-xs text-muted underline underline-offset-4">Ver</Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
