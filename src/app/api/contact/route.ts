import { isSameOrigin } from "@/features/auth/server/guard";
import { contactEmailHtml, sendEmail } from "@/server/email";
import { contactEmail } from "@/server/env";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { contactSchema } from "@/features/contact/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const ip = clientIp(request);
  const limited = rateLimit("contact:" + ip, 3, 60 * 60 * 1000);
  if (!limited.ok) return jsonError("Muitas mensagens. Tente mais tarde.", 429);

  const raw = await readJson<Record<string, unknown>>(request);
  if (!raw) return jsonError("Dados inválidos.", 400);
  if (typeof raw.website === "string" && raw.website.length > 0) return jsonOk({ ok: true });

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Preencha nome, e-mail e mensagem.", 400);

  try {
    await sendEmail({
      to: contactEmail(),
      subject: "Contato pelo site — " + parsed.data.name,
      html: contactEmailHtml(parsed.data),
      text:
        "Nome: " + parsed.data.name + "\n" +
        "E-mail: " + parsed.data.email + "\n\n" +
        parsed.data.message,
    });
    return jsonOk({ ok: true });
  } catch (error) {
    console.error("[contact]", error);
    return jsonError("Não foi possível enviar a mensagem.", 502);
  }
}
