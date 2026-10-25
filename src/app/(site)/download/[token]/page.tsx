import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { Container } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button";
import { hashDownloadToken, isDownloadActive } from "@/features/orders/server/downloads";
import { formatDate } from "@/lib/utils";
import { getDownloadInfo } from "@/features/orders/server/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Download",
  robots: { index: false, follow: false },
};

type Params = { params: Promise<{ token: string }> };

export default async function DownloadPage({ params }: Params) {
  const { token } = await params;
  const info = await getDownloadInfo(hashDownloadToken(token));

  if (!info) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="font-display text-4xl tracking-tight">Link inválido.</h1>
        <p className="mt-3 max-w-md text-sm text-muted">Confira o endereço ou escreva para o estúdio.</p>
        <Link href="/contact" className={buttonClasses("secondary", "md", "mt-8")}>Falar com o estúdio</Link>
      </Container>
    );
  }

  const { download, photo, order } = info;
  const active = order.status === "paid" && isDownloadActive(download.expiresAt, download.downloadCount, download.maxDownloads);
  const remaining = Math.max(0, download.maxDownloads - download.downloadCount);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow">Download</p>
      <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight tracking-tight">{photo.title}</h1>

      {active ? (
        <>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Arquivo original em alta resolução. O link expira em {formatDate(download.expiresAt)} e
            ainda permite {remaining} {remaining === 1 ? "download" : "downloads"}.
          </p>
          <a href={"/api/download/" + token} className={buttonClasses("primary", "md", "mt-8")}>
            <Download className="h-4 w-4" aria-hidden />
            Baixar arquivo
          </a>
        </>
      ) : (
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          Este link expirou ou atingiu o limite de downloads. Escreva para o estúdio para solicitar
          uma nova emissão.
        </p>
      )}

      <Link href="/store" className="mt-6 text-xs text-muted underline underline-offset-4">Voltar à loja</Link>
    </Container>
  );
}
