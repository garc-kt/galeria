import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { PhotoPicture } from "@/features/photos/components/photo-picture";
import { buttonClasses } from "@/components/ui/button";
import { siteName } from "@/server/env";
import { listFeaturedPhotos, listPublishedPhotos } from "@/features/photos/server/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Sobre o estúdio, o processo e o arquivo.",
};

export default async function AboutPage() {
  const [featured, fallback] = await Promise.all([listFeaturedPhotos(1), listPublishedPhotos(1)]);
  const portrait = featured[0] ?? fallback[0] ?? null;

  return (
    <>
      <PageHeader
        title="Fotografar é esperar."
        description="Um arquivo pequeno, feito devagar. Sem pressa, sem excesso."
      />

      <Container className="grid gap-12 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-7">
          <div className="prose-minimal max-w-xl text-sm">
            <p>
              O estúdio trabalha entre a cidade e o interior. O interesse está no que aparece
              quando nada acontece: a luz atravessando uma janela, o intervalo entre dois gestos,
              a textura de uma parede.
            </p>
            <p>
              O arquivo reúne séries autorais feitas ao longo de anos. Cada coleção é editada como
              um pequeno livro: poucas imagens, uma sequência, um silêncio comum.
            </p>

            <h2>Processo</h2>
            <p>
              Tudo começa em RAW. A edição acontece no estúdio, com correções mínimas de cor e
              contraste. O que chega ao site é o arquivo final, exportado em sRGB e alta resolução.
            </p>
            <p>
              As fotos à venda são edições digitais. O RAW original fica no arquivo do estúdio e não
              é comercializado por padrão.
            </p>

            <h2>O arquivo</h2>
            <p>
              Este site é também um arquivo vivo. Coleções entram e saem, mas as imagens permanecem
              disponíveis para consulta. Se procura uma foto específica, escreva.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/collections" className={buttonClasses("primary")}>Ver coleções</Link>
            <Link href="/contact" className={buttonClasses("secondary")}>Entrar em contato</Link>
          </div>
        </div>

        <div className="md:col-span-5">
          {portrait ? (
            <>
              <PhotoPicture photo={portrait} sizes="(min-width: 768px) 40vw, 100vw" />
              <p className="mt-3 text-xs text-muted">{portrait.title}</p>
            </>
          ) : (
            <div className="flex aspect-[4/5] items-end border border-line p-6">
              <p className="font-display text-2xl">{siteName()}</p>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
