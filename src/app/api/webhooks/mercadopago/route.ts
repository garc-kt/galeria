import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders, payments, webhookEvents } from "@/db/schema";
import { isProduction } from "@/server/env";
import { jsonError, jsonOk } from "@/server/http";
import { fulfillOrder } from "@/features/orders/server/orders";
import { extractPaymentData, getPayment } from "@/features/payments/server/mercadopago";
import { verifyMercadoPagoSignature } from "@/features/payments/server/signature";

export const runtime = "nodejs";

type WebhookBody = {
  type?: string;
  action?: string;
  data?: { id?: string | number };
};

export async function POST(request: Request) {
  let body: WebhookBody;
  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    return jsonError("Payload inválido.", 400);
  }

  if (body.type !== "payment") return jsonOk({ ok: true, ignored: true });

  const dataId = body.data?.id ? String(body.data.id) : "";
  if (!dataId) return jsonError("Pagamento ausente.", 400);

  const secret = (process.env.MP_WEBHOOK_SECRET || "").trim();
  if (secret) {
    const requestId = request.headers.get("x-request-id") ?? "";
    const signature = request.headers.get("x-signature");
    if (!verifyMercadoPagoSignature(signature, dataId, requestId, secret)) {
      return jsonError("Assinatura inválida.", 401);
    }
  } else if (isProduction) {
    console.error("[webhook] MP_WEBHOOK_SECRET não configurado.");
    return jsonError("Webhook não configurado.", 500);
  }

  try {
    const payment = await getPayment(dataId);
    const data = extractPaymentData(payment);
    const status = data.status;
    const externalReference = String(payment.external_reference ?? "");

    if (!externalReference) return jsonOk({ ok: true, ignored: true });

    const db = await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, externalReference)).limit(1);
    if (!order) return jsonOk({ ok: true, ignored: true });

    if (data.id) {
      const [paymentRow] = await db
        .select()
        .from(payments)
        .where(eq(payments.providerPaymentId, data.id))
        .limit(1);

      if (paymentRow) {
        await db
          .update(payments)
          .set({
            status,
            qrCode: data.qrCode ?? paymentRow.qrCode,
            qrCodeBase64: data.qrCodeBase64 ?? paymentRow.qrCodeBase64,
            ticketUrl: data.ticketUrl ?? paymentRow.ticketUrl,
            barcode: data.barcode ?? paymentRow.barcode,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentRow.id));
      }
    }

    if (status === "approved") {
      const paidAmount = Math.round(Number(payment.transaction_amount ?? 0) * 100);
      if (paidAmount !== order.amountCents) {
        console.error("[webhook] amount mismatch", { orderId: order.id, paidAmount });
        return jsonError("Valor divergente.", 400);
      }

      if (!order.providerPaymentId) {
        await db
          .update(orders)
          .set({ providerPaymentId: data.id || dataId })
          .where(eq(orders.id, order.id));
      }

      await fulfillOrder(order.id);
    }

    if (status === "refunded" || status === "charged_back") {
      await db
        .update(orders)
        .set({ status: "refunded", refundedAt: new Date() })
        .where(eq(orders.id, order.id));
    }

    await db
      .insert(webhookEvents)
      .values({ id: "mp:" + dataId, provider: "mercadopago" })
      .onConflictDoNothing();

    return jsonOk({ ok: true });
  } catch (error) {
    console.error("[webhook]", error);
    return jsonError("Falha ao processar webhook.", 500);
  }
}
