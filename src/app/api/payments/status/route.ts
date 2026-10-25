import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";
import { jsonError, jsonOk } from "@/server/http";
import { verifyOrderToken } from "@/features/orders/server/order-token";
import { fulfillOrder } from "@/features/orders/server/orders";
import { extractPaymentData, getPayment } from "@/features/payments/server/mercadopago";
import { getOrderById } from "@/features/orders/server/queries";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit("payment-status:" + ip, 300, 10 * 60 * 1000);
  if (!limited.ok) return jsonError("Muitas consultas. Aguarde.", 429);

  const token = new URL(request.url).searchParams.get("token") ?? "";
  const orderId = verifyOrderToken(token);
  if (!orderId) return jsonError("Sessão expirada.", 401);

  const order = await getOrderById(orderId);
  if (!order) return jsonError("Pedido não encontrado.", 404);

  const db = await getDb();
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .orderBy(desc(payments.createdAt))
    .limit(1);

  if (order.status === "paid") {
    return jsonOk({ status: "approved", payment: payment ? { status: "approved" } : null });
  }

  if (payment?.providerPaymentId && (payment.status === "pending" || payment.status === "in_process")) {
    try {
      const raw = await getPayment(payment.providerPaymentId);
      const data = extractPaymentData(raw);

      await db
        .update(payments)
        .set({
          status: data.status,
          qrCode: data.qrCode ?? null,
          qrCodeBase64: data.qrCodeBase64 ?? null,
          ticketUrl: data.ticketUrl ?? null,
          barcode: data.barcode ?? null,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      if (data.status === "approved") {
        const paidAmount = Math.round(Number(raw.transaction_amount ?? 0) * 100);
        if (paidAmount !== order.amountCents) {
          console.error("[payment-status] amount mismatch", { orderId: order.id, paidAmount });
          return jsonError("Valor divergente.", 400);
        }

        await db
          .update(orders)
          .set({ providerPaymentId: data.id })
          .where(eq(orders.id, order.id));
        await fulfillOrder(order.id);
        return jsonOk({ status: "approved" });
      }

      return jsonOk({
        status: data.status,
        payment: {
          method: payment.method,
          status: data.status,
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64,
          ticketUrl: data.ticketUrl,
          barcode: data.barcode,
        },
      });
    } catch (error) {
      console.error("[payment-status]", error);
    }
  }

  return jsonOk({
    status: order.status === "refunded" ? "refunded" : payment?.status ?? "pending",
    payment: payment
      ? {
          method: payment.method,
          status: payment.status,
          qrCode: payment.qrCode,
          qrCodeBase64: payment.qrCodeBase64,
          ticketUrl: payment.ticketUrl,
          barcode: payment.barcode,
        }
      : null,
  });
}
