"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar.");
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-line p-6" aria-live="polite">
        <p className="font-display text-2xl">Mensagem enviada.</p>
        <p className="mt-2 text-sm text-muted">Obrigado. Respondo em alguns dias.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">Nome</Label>
          <Input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="contact-email">E-mail</Label>
          <Input id="contact-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} autoComplete="email" />
        </div>
      </div>

      <div>
        <Label htmlFor="contact-message">Mensagem</Label>
        <Textarea id="contact-message" value={message} onChange={(event) => setMessage(event.target.value)} required minLength={10} maxLength={4000} rows={7} />
      </div>

      <div className="hidden" aria-hidden>
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>

      <FieldError>{error ?? undefined}</FieldError>

      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Enviar mensagem"}
      </Button>

      <p className="text-xs leading-relaxed text-muted">
        Seus dados são usados apenas para responder esta mensagem. Veja a política de privacidade.
      </p>
    </form>
  );
}
