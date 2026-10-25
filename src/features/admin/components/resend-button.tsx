"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResendButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function resend() {
    if (!window.confirm("Reenviar o link? Os links antigos serão invalidados após o envio.")) return;
    setPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/orders/" + id + "/resend", { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Falha ao reenviar.");
      setMessage("E-mail reenviado.");
      router.refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Falha ao reenviar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={resend}
        disabled={pending}
        className="text-xs text-muted underline underline-offset-4 hover:text-fg disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Reenviar e-mail"}
      </button>
      {message ? <p className="mt-1 max-w-[180px] text-[11px] text-muted">{message}</p> : null}
    </div>
  );
}
