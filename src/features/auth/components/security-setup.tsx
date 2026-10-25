"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";

type SetupData = { secret: string; otpauth: string; qr: string };

export function SecuritySetup() {
  const router = useRouter();
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = (await response.json()) as SetupData & { error?: string };
      if (!response.ok) throw new Error(data.error || "Falha ao gerar o QR code.");
      setSetup(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao gerar o QR code.");
    } finally {
      setPending(false);
    }
  }

  async function enable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Código inválido.");
      setDone(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Código inválido.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="border border-line p-5">
        <p className="text-sm font-medium">Verificação ativada.</p>
        <p className="mt-2 text-sm text-muted">Guarde o segredo. No próximo login o código será exigido.</p>
      </div>
    );
  }

  if (!setup) {
    return (
      <div className="border border-line p-5">
        <p className="text-sm leading-relaxed text-muted">
          Use um aplicativo autenticador (1Password, Authy, Google Authenticator). Você vai escanear
          um QR code e confirmar um código de 6 dígitos.
        </p>
        <Button type="button" onClick={generate} disabled={pending} className="mt-5">
          {pending ? "Gerando..." : "Configurar 2FA"}
        </Button>
        <FieldError>{error ?? undefined}</FieldError>
      </div>
    );
  }

  return (
    <div className="border border-line p-5">
      <div className="grid gap-6 sm:grid-cols-[240px_1fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="QR code para configurar 2FA" width={240} height={240} className="border border-line" />
        </div>
        <div>
          <p className="text-sm leading-relaxed text-muted">
            Escaneie o QR code ou digite o segredo no aplicativo. Depois informe o código gerado.
          </p>
          <p className="mt-4 break-all border border-line bg-surface p-3 font-mono text-xs">{setup.secret}</p>

          <form onSubmit={enable} className="mt-5">
            <Label htmlFor="security-code">Código de 6 dígitos</Label>
            <Input
              id="security-code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-[0.4em]"
              required
            />
            <FieldError>{error ?? undefined}</FieldError>
            <Button type="submit" disabled={pending || code.length !== 6} className="mt-4">
              {pending ? "Ativando..." : "Ativar 2FA"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
