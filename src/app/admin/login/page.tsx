import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSessionUser } from "@/features/auth/server/session";
import { siteName } from "@/server/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/admin");

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-line bg-surface p-10 md:flex">
        <Link href="/" className="font-display text-2xl tracking-tight">{siteName()}</Link>
        <div>
          <p className="eyebrow">Área restrita</p>
          <h1 className="mt-3 max-w-sm text-balance font-display text-4xl leading-tight tracking-tight">
            Arquivo, pedidos e edições.
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Acesso do fotógrafo. Sessão protegida por senha e verificação em duas etapas.
          </p>
        </div>
        <p className="text-xs text-muted">Brasil · {new Date().getFullYear()}</p>
      </div>

      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="font-display text-2xl tracking-tight md:hidden">{siteName()}</Link>
          <p className="eyebrow mt-10 md:mt-0">Admin</p>
          <h2 className="mt-3 font-display text-3xl tracking-tight">Entrar</h2>
          <p className="mt-2 text-sm text-muted">Use o e-mail e a senha do estúdio.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <Link href="/" className="mt-8 inline-block text-xs text-muted underline underline-offset-4">Voltar ao site</Link>
        </div>
      </div>
    </div>
  );
}
