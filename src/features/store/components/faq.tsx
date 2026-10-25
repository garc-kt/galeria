"use client";

import { Accordion } from "radix-ui";

const items = [
  {
    value: "entrega",
    title: "Como recebo a foto?",
    body: "Depois da confirmação do pagamento, o site envia um link por e-mail. O link fica ativo por 30 dias e permite até 5 downloads do arquivo original.",
  },
  {
    value: "pagamento",
    title: "Quais formas de pagamento?",
    body: "Pix e cartão de crédito, processados pelo Mercado Pago. Os valores são em reais (BRL) e você paga apenas uma vez por foto.",
  },
  {
    value: "licenca",
    title: "Qual é a licença?",
    body: "A licença pessoal permite uso em projetos pessoais e redes sociais, sem revenda. Para uso comercial, escolha a licença comercial no checkout ou entre em contato.",
  },
  {
    value: "arquivo",
    title: "O arquivo é RAW ou JPEG?",
    body: "O arquivo entregue é o master JPEG em alta resolução, sem marca d'água. O RAW fica no arquivo do estúdio e não é vendido por padrão.",
  },
  {
    value: "reembolso",
    title: "Posso pedir reembolso?",
    body: "Compras digitais seguem o direito de arrependimento do CDC (art. 49) em até 7 dias, desde que o arquivo ainda não tenha sido baixado. Escreva para o contato.",
  },
];

export function Faq() {
  return (
    <Accordion.Root type="single" collapsible className="border-t border-line">
      {items.map((item) => (
        <Accordion.Item key={item.value} value={item.value} className="border-b border-line">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-4 text-left text-sm">
              {item.title}
              <span className="text-muted transition-transform duration-200 group-data-[state=open]:rotate-45" aria-hidden>
                +
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pb-4 text-sm leading-relaxed text-muted">
            {item.body}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
