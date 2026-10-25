import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";
import { isSameOrigin } from "@/features/auth/server/guard";
import { paymentsMock } from "@/server/env";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { verifyOrderToken } from "@/features/orders/server/order-token";
import { fulfillOrder } from "@/features/orders/server/orders";
import { getOrderById } from "@/features/orders/server/queries";
import { clientIp, rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!paymentsMock()) return jsonError("Pagamento de teste desativado.", 403);
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const limited = rateLimit("payment-mock:" + clientIp(request), 20, 10 * 60 * 1000);
  if (!limited.ok) return jsonError("Muitas tentativas. Aguarde.", 429);

  const body = await readJson<{ token?: string }>(request);
  const orderId = body?.token ? verifyOrderToken(body.token) : null;
  if (!orderId) return jsonError("Sessão expirada.", 401);

  const order = await getOrderById(orderId);
  if (!order) return jsonError("Pedido não encontrado.", 404);
  if (order.status === "paid") return jsonOk({ status: "approved" });
  if (order.status !== "pending") return jsonError("Pedido indisponível.", 409);

  const db = await getDb();
  const providerPaymentId = "mock-" + randomUUID();

  await db.insert(payments).values({
    orderId: order.id,
    method: "mock",
    status: "approved",
    amountCents: order.amountCents,
    idempotencyKey: randomUUID(),
    providerPaymentId,
  });

  await db.update(orders).set({ providerPaymentId }).where(eq(orders.id, order.id));
  const delivery = await fulfillOrder(order.id);

  return jsonOk({ status: "approved", downloadToken: delivery.token });
}
