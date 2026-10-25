import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";
import { isSameOrigin } from "@/features/auth/server/guard";
import { getSessionUser } from "@/features/auth/server/session";
import { paymentsMock } from "@/server/env";
import { jsonError, jsonOk } from "@/server/http";
import { refundPayment } from "@/features/payments/server/mercadopago";
import { getOrderById } from "@/features/orders/server/queries";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);
  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);

  const { id } = await context.params;
  const order = await getOrderById(id);
  if (!order) return jsonError("Pedido não encontrado.", 404);
  if (order.status !== "paid") return jsonError("Apenas pedidos pagos podem ser reembolsados.", 400);

  if (!paymentsMock()) {
    if (!order.providerPaymentId) return jsonError("Pagamento sem identificador do provedor.", 400);
    await refundPayment(order.providerPaymentId);
  }

  const db = await getDb();
  await db
    .update(orders)
    .set({ status: "refunded", refundedAt: new Date() })
    .where(eq(orders.id, order.id));

  await db
    .update(payments)
    .set({ status: "refunded", updatedAt: new Date() })
    .where(eq(payments.orderId, order.id));

  return jsonOk({ ok: true });
}
