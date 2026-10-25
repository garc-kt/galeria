import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { contactEmail, siteName } from "@/server/env";

export const metadata: Metadata = {
  title: "Termos e licenças",
  description: "Termos de uso, licenças de imagem e política de entrega.",
};

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Termos e licenças" />
      <Container className="py-12 md:py-16">
        <div className="prose-minimal max-w-2xl text-sm">
          <p>
            Ao comprar uma foto em {siteName()}, você concorda com os termos abaixo. Leia antes de
            finalizar o pagamento.
          </p>

          <h2>O que você compra</h2>
          <p>
            Uma licença de uso do arquivo digital, não a titularidade dos direitos autorais. O
            arquivo entregue é o master JPEG em alta resolução, em sRGB, sem marca d&apos;água. O RAW
            original permanece com o fotógrafo.
          </p>

          <h2>Licença pessoal</h2>
          <ul>
            <li>Uso em projetos pessoais, impressões próprias e redes sociais.</li>
            <li>Crédito ao fotógrafo quando possível.</li>
            <li>Sem revenda, sem uso comercial, sem redistribuição do arquivo.</li>
          </ul>

          <h2>Licença comercial</h2>
          <p>
            Permite uso em materiais de marca, campanhas e publicações comerciais, conforme o escopo
            informado na compra. Não inclui revenda do arquivo, cessão de direitos ou uso em produtos
            físicos em série sem autorização escrita. Para esses casos, fale com o estúdio.
          </p>

          <h2>Entrega</h2>
          <p>
            O link de download é enviado ao e-mail informado após a confirmação do pagamento. O link
            vale por 30 dias e permite até 5 downloads. Guarde o arquivo; novas emissões podem ser
            cobradas.
          </p>

          <h2>Pagamento</h2>
          <p>
            Pix e cartão de crédito, processados pelo Mercado Pago. Preços em reais (BRL). O site não
            armazena dados de cartão.
          </p>

          <h2>Reembolso</h2>
          <p>
            Compras digitais seguem o direito de arrependimento do art. 49 do CDC em até 7 dias,
            desde que o arquivo ainda não tenha sido baixado. Após o download, a licença é considerada
            consumida. Escreva para {contactEmail()}.
          </p>

          <h2>Usos proibidos</h2>
          <ul>
            <li>Revender, redistribuir ou disponibilizar o arquivo em bancos de imagens.</li>
            <li>Usar a imagem para treinar modelos de IA sem autorização escrita.</li>
            <li>Usar em contextos difamatórios, ilegais ou que violem direitos de terceiros.</li>
            <li>Remover marcas, metadados de autoria ou avisos de licença.</li>
          </ul>

          <h2>Direitos autorais</h2>
          <p>
            Todas as imagens são protegidas pela Lei 9.610/98. O descumprimento da licença sujeita o
            infrator às medidas civis e criminais cabíveis.
          </p>

          <h2>Foro e contato</h2>
          <p>
            Aplica-se a lei brasileira. Dúvidas: {contactEmail()}. Este texto é um modelo e deve ser
            revisado por advogado antes da publicação.
          </p>

          <p className="text-xs">Última atualização: [DATA].</p>
        </div>
      </Container>
    </>
  );
}
