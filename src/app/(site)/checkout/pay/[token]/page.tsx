import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { PaymentArea } from "@/features/payments/components/payment-area";
import { PhotoPicture } from "@/features/photos/components/photo-picture";
import { buttonClasses } from "@/components/ui/button";
import { paymentsMock } from "@/server/env";
import { formatBRL } from "@/lib/money";
import { verifyOrderToken } from "@/features/orders/server/order-token";
import { getOrderById } from "@/features/orders/server/queries";
import { getPhotoById } from "@/features/photos/server/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pagamento",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ token: string }> };

function licenseLabel(license: string): string {
  if (license === "commercial") return "Licença comercial";
  if (license === "both") return "Licença pessoal ou comercial";
  return "Licença pessoal";
}

export default async function PaymentPage({ params }: Params) {
  const { token } = await params;
  const orderId = verifyOrderToken(token);

  if (!orderId) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="mt-4 font-display text-4xl tracking-tight">Link expirado.</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          Esta sessão de pagamento expirou. Volte à loja e refaça a compra.
        </p>
        <Link href="/store" className={buttonClasses("primary", "md", "mt-8")}>Voltar à loja</Link>
      </Container>
    );
  }

  const order = await getOrderById(orderId);
  if (!order) notFound();
  if (order.status === "paid") redirect("/checkout/success?order=" + order.id);
  if (order.status === "refunded") redirect("/checkout/failure");

  const photo = await getPhotoById(order.photoId);
  if (!photo) notFound();

  const publicKey = (process.env.MP_PUBLIC_KEY || "").trim();
  const mock = paymentsMock();

  return (
    <Container className="py-8 md:py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <Link
          href={"/photos/" + photo.slug}
          className="text-xs text-muted underline underline-offset-4"
        >
          ← Voltar para a foto
        </Link>
        <p className="text-xs text-muted">Pagamento seguro, Mercado Pago</p>
      </div>

      <div className="grid gap-10 md:grid-cols-12 md:gap-12">
        <aside className="order-2 md:order-1 md:col-span-5">
          <div className="border border-line bg-surface">
            <div className="p-2">
              <PhotoPicture photo={photo} priority sizes="(min-width: 768px) 40vw, 100vw" />
            </div>
            <div className="p-5">
              <h1 className="font-display text-3xl leading-none tracking-[-0.045em]">{photo.title}</h1>

              <dl className="mt-6 border-t border-line text-sm">
                <div className="flex justify-between gap-4 border-b border-line py-2.5">
                  <dt className="text-xs text-muted">Licença</dt>
                  <dd className="text-right">{licenseLabel(order.license)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line py-2.5">
                  <dt className="text-xs text-muted">E-mail</dt>
                  <dd className="max-w-[220px] truncate text-right">{order.buyerEmail}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-xs text-muted">Total</dt>
                  <dd className="font-display text-3xl tracking-[-0.03em]">{formatBRL(order.amountCents)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted">
            O link de download é enviado após a confirmação. Pix aprova na hora; cartão pode levar
            alguns instantes; boleto vence em até 3 dias úteis.
          </p>
        </aside>

        <div className="order-1 md:order-2 md:col-span-7">
          {mock ? (
            <div className="mb-4 border border-accent/30 bg-accent/5 px-4 py-3 text-[11px] leading-5 text-muted">
              <strong className="text-fg">Modo de teste.</strong> Nenhuma cobrança real. Clique em{" "}
              <strong className="text-fg">Simular pagamento aprovado</strong> para concluir.
            </div>
          ) : null}

          <PaymentArea
            token={token}
            orderId={order.id}
            amountCents={order.amountCents}
            email={order.buyerEmail}
            publicKey={publicKey}
            mock={mock}
          />
        </div>
      </div>
    </Container>
  );
}
