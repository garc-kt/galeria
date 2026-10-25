"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";

export function LoginForm() {
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { requires2fa?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível entrar.");
      if (data.requires2fa) {
        setStep("2fa");
      } else {
        window.location.assign("/admin");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível entrar.");
    } finally {
      setPending(false);
    }
  }

  async function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Código inválido.");
      window.location.assign("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Código inválido.");
    } finally {
      setPending(false);
    }
  }

  if (step === "2fa") {
    return (
      <form onSubmit={submitCode} className="space-y-4">
        <div>
          <Label htmlFor="login-code">Código de 6 dígitos</Label>
          <Input
            id="login-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className="text-center text-lg tracking-[0.4em]"
            required
            autoFocus
          />
        </div>
        <FieldError>{error ?? undefined}</FieldError>
        <Button type="submit" className="w-full" disabled={pending || code.length !== 6}>
          {pending ? "Verificando..." : "Entrar"}
        </Button>
        <button
          type="button"
          onClick={() => { setStep("credentials"); setCode(""); setError(null); }}
          className="w-full text-center text-xs text-muted underline underline-offset-4"
        >
          Voltar
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submitCredentials} className="space-y-4">
      <div>
        <Label htmlFor="login-email">E-mail</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="login-password">Senha</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
      </div>
      <FieldError>{error ?? undefined}</FieldError>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
