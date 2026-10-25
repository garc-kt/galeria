"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CollectionActions({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    await fetch("/api/admin/collections/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !published }),
    });
    router.refresh();
    setPending(false);
  }

  async function remove() {
    if (!window.confirm("Excluir esta coleção? As fotos continuam no arquivo.")) return;
    setPending(true);
    await fetch("/api/admin/collections/" + id, { method: "DELETE" });
    router.refresh();
    setPending(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={toggle} disabled={pending} className="text-xs text-muted underline underline-offset-4 hover:text-fg disabled:opacity-50">
        {published ? "Ocultar" : "Publicar"}
      </button>
      <button type="button" onClick={remove} disabled={pending} className="text-xs text-muted underline underline-offset-4 hover:text-red-700 disabled:opacity-50">
        Excluir
      </button>
    </div>
  );
}
