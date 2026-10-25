import Link from "next/link";
import { UploadForm } from "@/features/admin/components/upload-form";
import { maxUploadBytes } from "@/server/env";
import { listAllCollections } from "@/features/collections/server/queries";

export const dynamic = "force-dynamic";

export default async function NewPhotoPage() {
  const collections = await listAllCollections();
  const maxMb = Math.round(maxUploadBytes() / 1024 / 1024);

  return (
    <div>
      <div className="border-b border-line pb-5">
        <Link href="/admin/photos" className="text-xs text-muted underline underline-offset-4">← Fotos</Link>
        <h1 className="mt-3 font-display text-3xl tracking-tight">Nova foto</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Envie o RAW para o arquivo e o JPEG mestre editado para a loja. A prévia vem do JPEG embutido
          no RAW; a qualidade final vem do mestre.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <UploadForm
          collections={collections.map((collection) => ({ id: collection.id, title: collection.title }))}
          maxMb={maxMb}
        />
      </div>
    </div>
  );
}
