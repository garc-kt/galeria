"use client";

import Link from "next/link";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import type { Photo } from "@/db/schema";
import { Button, buttonClasses } from "@/components/ui/button";
import { fieldClasses, labelClasses } from "@/components/ui/field";
import { formatBRL } from "@/lib/money";

export function BuyDialog({ photo }: { photo: Photo }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [license, setLicense] = useState<"personal" | "commercial">(
    photo.license === "commercial" ? "commercial" : "personal",
  );
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canBuy = photo.priceCents > 0;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canBuy) return;
    if (!accepted) {
      setError("Marque os termos e a licença para continuar.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id, email, name, license }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Não foi possível iniciar o pagamento.");
      }
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o pagamento.");
      setPending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={buttonClasses("primary", "md", "w-full")} disabled={!canBuy}>
          {canBuy ? "Comprar " + formatBRL(photo.priceCents) : "Em breve"}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-fg/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-line bg-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-2xl leading-tight">{photo.title}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted">
                Arquivo original em alta resolução, sem marca d&apos;água. Entrega por link.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-line"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className={labelClasses} htmlFor="buy-email">E-mail</label>
              <input
                id="buy-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClasses}
                placeholder="voce@email.com"
              />
            </div>

            <div>
              <label className={labelClasses} htmlFor="buy-name">Nome (opcional)</label>
              <input
                id="buy-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldClasses}
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className={labelClasses} htmlFor="buy-license">Licença</label>
              {photo.license === "both" ? (
                <select
                  id="buy-license"
                  value={license}
                  onChange={(event) => setLicense(event.target.value as "personal" | "commercial")}
                  className={fieldClasses}
                >
                  <option value="personal">Pessoal</option>
                  <option value="commercial">Comercial</option>
                </select>
              ) : (
                <p className="border border-line px-3 py-2.5 text-sm text-muted">
                  {photo.license === "commercial" ? "Licença comercial" : "Licença pessoal"}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3 border-t border-line pt-4">
              <input
                id="buy-terms"
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                required
              />
              <label htmlFor="buy-terms" className="text-xs leading-relaxed text-muted">
                Li e aceito os <Link className="text-fg underline underline-offset-2" href="/terms">termos e a licença</Link>.
                Pagamento via Pix ou cartão. O link de download expira em 30 dias.
              </label>
            </div>

            {error ? <p className="text-xs text-red-700">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Abrindo pagamento..." : "Ir para o pagamento"}
            </Button>

            <p className="text-center text-[11px] leading-relaxed text-muted">
              Ambiente seguro Mercado Pago, Brasil
            </p>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
