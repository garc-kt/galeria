import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pagamento não concluído",
  robots: { index: false, follow: false },
};

export default function CheckoutFailurePage() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="font-display text-4xl tracking-tight">Pagamento não concluído.</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        Nada foi cobrado. Você pode tentar de novo ou escolher outra forma de pagamento.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/store" className={buttonClasses("primary")}>Voltar à loja</Link>
        <Link href="/contact" className={buttonClasses("secondary")}>Falar com o estúdio</Link>
      </div>
    </Container>
  );
}
