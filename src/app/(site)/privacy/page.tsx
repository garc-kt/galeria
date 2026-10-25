import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/shared/page-header";
import { contactEmail, siteName } from "@/server/env";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Política de privacidade e tratamento de dados (LGPD).",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacidade" />
      <Container className="py-12 md:py-16">
        <div className="prose-minimal max-w-2xl text-sm">
          <p>
            Esta política descreve como {siteName()} trata dados pessoais, em conformidade com a Lei
            Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
          </p>

          <h2>Quem trata os dados</h2>
          <p>
            Controlador: [NOME/RAZÃO SOCIAL], CNPJ [CNPJ], com endereço em [ENDEREÇO]. Contato do
            encarregado: {contactEmail()}.
          </p>

          <h2>Dados coletados</h2>
          <ul>
            <li>Contato: nome, e-mail e mensagem enviada pelo formulário.</li>
            <li>Compra: nome, e-mail, foto, licença, valor e status do pedido.</li>
            <li>Pagamento: processado pelo Mercado Pago. O site não armazena dados de cartão.</li>
            <li>Operação: logs técnicos de acesso, com IP, para segurança e prevenção a fraude.</li>
          </ul>

          <h2>Finalidades e bases legais</h2>
          <p>
            Usamos os dados para responder mensagens (legítimo interesse), entregar arquivos
            comprados (execução de contrato), cumprir obrigações legais e prevenir fraudes. Não
            vendemos dados pessoais.
          </p>

          <h2>Compartilhamento</h2>
          <p>
            Compartilhamos o mínimo necessário com Mercado Pago (pagamentos), Resend (e-mail
            transacional), Cloudflare/R2 (hospedagem e armazenamento) e HostGator (servidor). Esses
            fornecedores tratam dados conforme seus próprios contratos e políticas.
          </p>

          <h2>Retenção</h2>
          <p>
            Mensagens de contato são mantidas por até 24 meses. Dados de pedidos são mantidos pelo
            prazo fiscal e legal aplicável. Links de download expiram em 30 dias. Logs técnicos são
            mantidos por até 6 meses.
          </p>

          <h2>Seus direitos</h2>
          <p>
            Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade
            ou exclusão dos seus dados, além de revogar consentimentos. Escreva para {contactEmail()}.
            Responderemos em até 15 dias.
          </p>

          <h2>Cookies</h2>
          <p>
            O site não usa cookies de publicidade ou rastreamento. Apenas um cookie de sessão
            administrativa, estritamente necessário, é usado na área restrita.
          </p>

          <h2>Segurança</h2>
          <p>
            Acesso administrativo protegido por senha e verificação em duas etapas. Pagamentos são
            processados fora do site, pelo Mercado Pago. Downloads usam links assinados, com prazo e
            limite de uso.
          </p>

          <p className="text-xs">Última atualização: [DATA]. Este texto é um modelo e deve ser revisado por advogado.</p>
        </div>
      </Container>
    </>
  );
}
