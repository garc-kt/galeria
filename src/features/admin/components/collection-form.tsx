"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";

export function CollectionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, published: true }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Falha ao criar.");
      setTitle("");
      setDescription("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao criar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 border border-line p-5">
      <div>
        <Label htmlFor="collection-title">Nova coleção</Label>
        <Input id="collection-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} placeholder="Ex.: Interior" />
      </div>
      <div>
        <Label htmlFor="collection-description">Descrição</Label>
        <Textarea id="collection-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={1000} />
      </div>
      <FieldError>{error ?? undefined}</FieldError>
      <Button type="submit" disabled={pending}>{pending ? "Criando..." : "Criar coleção"}</Button>
    </form>
  );
}
