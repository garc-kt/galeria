import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-dvh flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-5xl tracking-tight">Página não encontrada.</h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        O endereço mudou ou nunca existiu. Volte ao arquivo.
      </p>
      <Link href="/" className={buttonClasses("secondary", "md", "mt-8")}>Ir para o início</Link>
    </Container>
  );
}
