"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefundButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refund() {
    if (!window.confirm("Reembolsar este pedido? O acesso ao download será encerrado.")) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/orders/" + id + "/refund", { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Falha no reembolso.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha no reembolso.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={refund}
        disabled={pending}
        className="text-xs text-muted underline underline-offset-4 hover:text-red-700 disabled:opacity-50"
      >
        {pending ? "Reembolsando..." : "Reembolsar"}
      </button>
      {error ? <p className="mt-1 text-[11px] text-red-700">{error}</p> : null}
    </div>
  );
}
