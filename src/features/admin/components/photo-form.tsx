"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Photo } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/field";
import { parsePriceToCents } from "@/lib/money";

type CollectionOption = { id: string; title: string };

export function PhotoForm({
  photo,
  collections,
  selectedCollectionId,
}: {
  photo: Photo;
  collections: CollectionOption[];
  selectedCollectionId: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(photo.title);
  const [description, setDescription] = useState(photo.description ?? "");
  const [alt, setAlt] = useState(photo.alt);
  const [price, setPrice] = useState((photo.priceCents / 100).toFixed(2).replace(".", ","));
  const [license, setLicense] = useState(photo.license);
  const [status, setStatus] = useState(photo.status);
  const [featured, setFeatured] = useState(photo.featured);
  const [sortOrder, setSortOrder] = useState(String(photo.sortOrder));
  const [collectionId, setCollectionId] = useState(selectedCollectionId ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cents = parsePriceToCents(price || "0");
    if (cents === null) {
      setError("Preço inválido. Use, por exemplo, 250,00.");
      return;
    }

    setPending(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/admin/photos/" + photo.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description.trim() || null,
          alt,
          priceCents: cents,
          license,
          status,
          featured,
          sortOrder: Number(sortOrder) || 0,
          collectionId: collectionId || null,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Falha ao salvar.");
      setSaved(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao salvar.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!window.confirm("Excluir esta foto? Esta ação não pode ser desfeita.")) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/photos/" + photo.id, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Falha ao excluir.");
      router.push("/admin/photos");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao excluir.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="photo-title">Título</Label>
          <Input id="photo-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} />
        </div>

        <div>
          <Label htmlFor="photo-price">Preço (R$)</Label>
          <Input id="photo-price" value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" />
        </div>

        <div>
          <Label htmlFor="photo-license">Licença</Label>
          <Select id="photo-license" value={license} onChange={(event) => setLicense(event.target.value)}>
            <option value="personal">Pessoal</option>
            <option value="commercial">Comercial</option>
            <option value="both">Pessoal ou comercial</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="photo-status">Status</Label>
          <Select id="photo-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="draft">Rascunho</option>
            <option value="published">Publicada</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="photo-sort">Ordem</Label>
          <Input id="photo-sort" type="number" min={0} max={9999} value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="photo-collection">Coleção</Label>
          <Select id="photo-collection" value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
            <option value="">Sem coleção</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>{collection.title}</option>
            ))}
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="photo-description">Descrição</Label>
          <Textarea id="photo-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={2000} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="photo-alt">Texto alternativo</Label>
          <Input id="photo-alt" value={alt} onChange={(event) => setAlt(event.target.value)} maxLength={300} required />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={featured}
          onChange={(event) => setFeatured(event.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Destacar na página inicial
      </label>

      <FieldError>{error ?? undefined}</FieldError>
      {saved ? <p className="text-xs text-accent">Alterações salvas.</p> : null}

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-xs text-muted underline underline-offset-4 hover:text-red-700 disabled:opacity-50"
        >
          Excluir foto
        </button>
      </div>
    </form>
  );
}
