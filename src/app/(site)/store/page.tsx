import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Faq } from "@/features/store/components/faq";
import { Gallery } from "@/features/photos/components/gallery";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHeader } from "@/components/shared/page-header";
import { listPhotosForStore } from "@/features/photos/server/queries";
import { photoOgUrl } from "@/features/photos/photo-url";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Loja",
  description: "Fotos autorais em alta resolução. Pix ou cartão, entrega por link.",
};

export default async function StorePage() {
  const photos = await listPhotosForStore(60);

  return (
    <>
      <PageHeader
        title="Loja"
        description="Arquivos originais em alta resolução, sem marca d'água. Pix, cartão ou boleto; entrega por link em até 30 dias."
      />

      <Container className="py-16 md:py-20">
        {photos.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma foto à venda no momento.</p>
        ) : (
          <Gallery photos={photos} columns={3} mode="link" />
        )}
      </Container>

      <section className="border-t border-line">
        <Container className="grid gap-10 py-14 md:grid-cols-12 md:py-20">
          <div className="md:col-span-4">
            <h2 className="font-display text-4xl tracking-[-0.03em]">Antes de comprar</h2>
            <p className="mt-4 max-w-xs text-sm leading-7 text-muted">
              O essencial sobre entrega, licença e pagamento. Outras dúvidas, escreva.
            </p>
          </div>
          <div className="md:col-span-8">
            <Faq />
          </div>
        </Container>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Fotos à venda",
          numberOfItems: photos.length,
          itemListElement: photos.map((photo, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl("/photos/" + photo.slug),
            image: photoOgUrl(photo),
            name: photo.title,
          })),
        }}
      />
    </>
  );
}
