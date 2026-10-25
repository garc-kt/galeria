import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button";

export default function SiteNotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-4xl tracking-tight md:text-5xl">Página não encontrada.</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        O endereço mudou ou nunca existiu. Volte ao arquivo.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClasses("primary")}>Início</Link>
        <Link href="/collections" className={buttonClasses("secondary")}>Coleções</Link>
      </div>
    </Container>
  );
}
