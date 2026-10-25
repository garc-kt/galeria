"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileDrop } from "@/features/admin/components/file-drop";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/field";

type CollectionOption = { id: string; title: string };

export function UploadForm({ collections, maxMb }: { collections: CollectionOption[]; maxMb: number }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [license, setLicense] = useState("personal");
  const [collectionId, setCollectionId] = useState("");
  const [description, setDescription] = useState("");
  const [alt, setAlt] = useState("");
  const [raw, setRaw] = useState<File | null>(null);
  const [master, setMaster] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!raw && !master) {
      setError("Envie ao menos um arquivo: RAW ou JPEG mestre.");
      return;
    }

    setPending(true);
    setProgress(0);
    setError(null);

    const form = new FormData();
    form.set("title", title);
    form.set("price", price || "0");
    form.set("license", license);
    form.set("description", description);
    form.set("alt", alt);
    if (collectionId) form.set("collectionId", collectionId);
    if (raw) form.set("raw", raw);
    if (master) form.set("master", master);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");

    xhr.upload.onprogress = (uploadEvent) => {
      if (uploadEvent.lengthComputable) {
        setProgress(Math.round((uploadEvent.loaded / uploadEvent.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}") as {
          photo?: { id: string };
          error?: string;
        };
        if (xhr.status < 200 || xhr.status >= 300 || !data.photo) {
          throw new Error(data.error || "Falha no upload.");
        }
        router.push("/admin/photos/" + data.photo.id);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Falha no upload.");
        setPending(false);
      }
    };

    xhr.onerror = () => {
      setError("Falha de rede durante o upload.");
      setPending(false);
    };

    xhr.send(form);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="upload-title">Título</Label>
          <Input id="upload-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} placeholder="Ex.: Janela, 2024" />
        </div>

        <div>
          <Label htmlFor="upload-price">Preço (R$)</Label>
          <Input id="upload-price" value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder="250,00" />
        </div>

        <div>
          <Label htmlFor="upload-license">Licença</Label>
          <Select id="upload-license" value={license} onChange={(event) => setLicense(event.target.value)}>
            <option value="personal">Pessoal</option>
            <option value="commercial">Comercial</option>
            <option value="both">Pessoal ou comercial</option>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="upload-collection">Coleção (opcional)</Label>
          <Select id="upload-collection" value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
            <option value="">Sem coleção</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>{collection.title}</option>
            ))}
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="upload-description">Descrição (opcional)</Label>
          <Textarea id="upload-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={3} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="upload-alt">Texto alternativo</Label>
          <Input id="upload-alt" value={alt} onChange={(event) => setAlt(event.target.value)} maxLength={300} placeholder="Descrição para acessibilidade e SEO" />
        </div>
      </div>

      <div className="grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
        <FileDrop
          id="upload-raw"
          label="RAW (arquivo)"
          hint={"Até " + maxMb + " MB. O RAW fica privado no storage."}
          accept=".cr2,.cr3,.nef,.arw,.dng,.raf,.rw2,.orf,.pef,.srw,.x3f"
          file={raw}
          onFile={setRaw}
        />

        <FileDrop
          id="upload-master"
          label="JPEG mestre (recomendado)"
          hint="Este é o arquivo vendido. Exporte do Lightroom em sRGB, alta resolução."
          accept=".jpg,.jpeg,.png,.tif,.tiff,.webp"
          file={master}
          onFile={setMaster}
        />
      </div>

      <FieldError>{error ?? undefined}</FieldError>

      <div className="border-t border-line pt-5">
        {pending ? (
          <div className="mb-4">
            <div className="h-1 w-full bg-line">
              <div className="h-full bg-accent transition-all duration-200" style={{ width: progress + "%" }} />
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {progress < 100 ? "Enviando " + progress + "%" : "Processando imagem..."}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Enviando..." : "Enviar foto"}
          </Button>
          <p className="text-xs text-muted">Não feche esta página durante o processamento.</p>
        </div>
      </div>
    </form>
  );
}
