"use client";

import { Container } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow">Erro</p>
      <h1 className="mt-4 font-display text-4xl tracking-tight">Algo saiu do lugar.</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        A página não carregou. Tente novamente; se persistir, fale com o estúdio.
      </p>
      <button type="button" onClick={reset} className={buttonClasses("secondary", "md", "mt-8")}>
        Tentar de novo
      </button>
    </Container>
  );
}
