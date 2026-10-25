import { contactEmail, emailFrom, isProduction, siteName, siteUrl } from "./env";
import { formatBRL } from "@/lib/money";
import { escapeHtml, formatDate } from "@/lib/utils";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(input: EmailInput): Promise<void> {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    if (isProduction) {
      throw new Error("RESEND_API_KEY não configurado. O e-mail de entrega não foi enviado.");
    }
    console.log("[email:skipped] to=" + input.to + " subject=" + input.subject);
    console.log(input.text);
    return;
  }

  let lastError: unknown = new Error("Falha ao enviar e-mail.");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response | null = null;

    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          from: emailFrom(),
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      });
    } catch (error) {
      lastError = error;
    }

    if (response) {
      if (response.ok) return;

      const detail = (await response.text()).slice(0, 300);
      lastError = new Error("Falha ao enviar e-mail (" + response.status + "): " + detail);
      if (response.status < 500) throw lastError;
    }

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }

  throw lastError;
}

type DeliveryEmail = {
  buyerName?: string | null;
  photoTitle: string;
  amountCents: number;
  license: string;
  downloadUrl: string;
  expiresAt: Date;
};

export function deliveryEmailHtml(data: DeliveryEmail): string {
  const name = data.buyerName ? escapeHtml(data.buyerName) : "olá";
  const license = data.license === "commercial" ? "Licença comercial" : "Licença pessoal";
  const rows = [
    '<div style="background:#E9E5DF;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1C1B19">',
    '<div style="max-width:560px;margin:0 auto;background:#F2EFEA;border:1px solid #D4CEC6;padding:32px">',
    '<p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6B6660;margin:0 0 24px">' +
      escapeHtml(siteName()) +
      "</p>",
    '<h1 style="font-size:24px;line-height:1.2;margin:0 0 16px">Sua foto está pronta, ' + name + ".</h1>",
    '<p style="font-size:14px;line-height:1.6;color:#6B6660;margin:0 0 24px">Obrigado pela compra. O link abaixo libera o arquivo original, sem marca d\u2019água.</p>',
    '<p style="font-size:16px;margin:0 0 4px"><strong>' + escapeHtml(data.photoTitle) + "</strong></p>",
    '<p style="font-size:13px;color:#6B6660;margin:0 0 24px">' + license + " · " + formatBRL(data.amountCents) + "</p>",
    '<p style="margin:0 0 24px"><a href="' + data.downloadUrl + '" style="display:inline-block;background:#1C1B19;color:#E9E5DF;text-decoration:none;padding:12px 20px;font-size:14px">Baixar arquivo</a></p>',
    '<p style="font-size:12px;line-height:1.6;color:#6B6660;margin:0 0 8px">O link expira em ' + formatDate(data.expiresAt) + " e permite até 5 downloads.</p>",
    '<p style="font-size:12px;line-height:1.6;color:#6B6660;margin:0">Dúvidas? Responda este e-mail ou escreva para ' + escapeHtml(contactEmail()) + ".</p>",
    "</div></div>",
  ];
  return rows.join("");
}

export function deliveryEmailText(data: DeliveryEmail): string {
  return [
    "Sua foto está pronta" + (data.buyerName ? ", " + data.buyerName : "") + ".",
    "",
    data.photoTitle + " - " + formatBRL(data.amountCents),
    "Baixe em: " + data.downloadUrl,
    "Expira em " + formatDate(data.expiresAt) + ", até 5 downloads.",
    "",
    siteName() + " - " + siteUrl(),
  ].join("\n");
}

export function contactEmailHtml(input: { name: string; email: string; message: string }): string {
  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#1C1B19;line-height:1.6">',
    "<h2>Novo contato pelo site</h2>",
    "<p><strong>" + escapeHtml(input.name) + "</strong> &lt;" + escapeHtml(input.email) + "&gt;</p>",
    "<p>" + escapeHtml(input.message).replace(/\n/g, "<br>") + "</p>",
    "</div>",
  ].join("");
}
