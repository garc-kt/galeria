import type { Metadata } from "next";
import Link from "next/link";
import { Check, Download } from "lucide-react";
import { Container } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button";
import { paymentsMock } from "@/server/env";
import { formatBRL } from "@/lib/money";
import { getOrderById } from "@/features/orders/server/queries";
import { getPhotoById } from "@/features/photos/server/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false, follow: false },
};

type Search = { searchParams: Promise<{ order?: string; download?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: Search) {
  const { order: orderId, download } = await searchParams;
  const order = orderId ? await getOrderById(orderId) : null;
  const photo = order ? await getPhotoById(order.photoId) : null;

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center border border-line">
        <Check className="h-5 w-5 text-accent" aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-4xl tracking-tight">Pedido recebido.</h1>

      {order ? (
        <>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            {order.status === "paid"
              ? "Pagamento confirmado. Enviamos o link de download para o e-mail informado."
              : order.status === "refunded"
                ? "Este pedido foi reembolsado."
                : "Estamos aguardando a confirmação do pagamento. O link chega por e-mail assim que aprovado."}
          </p>
          <dl className="mt-8 w-full max-w-sm border-t border-line text-left text-sm">
            {photo ? (
              <div className="flex justify-between gap-4 border-b border-line py-2.5">
                <dt className="text-muted">Foto</dt>
                <dd className="text-right">{photo.title}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-b border-line py-2.5">
              <dt className="text-muted">Valor</dt>
              <dd>{formatBRL(order.amountCents)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line py-2.5">
              <dt className="text-muted">Pedido</dt>
              <dd className="font-mono text-xs">{order.id.slice(0, 8)}</dd>
            </div>
          </dl>

          {download ? (
            <a
              href={"/api/download/" + encodeURIComponent(download)}
              className={buttonClasses("primary", "md", "mt-6")}
            >
              <Download className="h-4 w-4" aria-hidden />
              Baixar arquivo de teste
            </a>
          ) : null}
        </>
      ) : (
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          Se o pagamento foi aprovado, o link de download chega por e-mail em alguns minutos.
        </p>
      )}

      {paymentsMock() ? (
        <p className="mt-6 max-w-md border border-line p-3 text-xs leading-relaxed text-muted">
          Ambiente de teste: nenhuma cobrança real.{" "}
          {download
            ? "O download está liberado acima."
            : "O link de download é impresso no console do servidor."}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/store" className={buttonClasses("primary")}>Voltar à loja</Link>
        <Link href="/contact" className={buttonClasses("secondary")}>Falar com o estúdio</Link>
      </div>
    </Container>
  );
}
