import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";
import type { Payment } from "@/db/schema";
import { isSameOrigin } from "@/features/auth/server/guard";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { verifyOrderToken } from "@/features/orders/server/order-token";
import { fulfillOrder } from "@/features/orders/server/orders";
import { createPayment } from "@/features/payments/server/mercadopago";
import { getOrderById } from "@/features/orders/server/queries";
import { getPhotoById } from "@/features/photos/server/queries";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { paymentCreateSchema } from "@/features/payments/schemas";
import { paymentAttemptKey } from "@/features/payments/server/idempotency";

export const runtime = "nodejs";
export const maxDuration = 60;

const PENDING = ["pending", "in_process"];

function serialize(payment: Payment) {
  return {
    id: payment.id,
    method: payment.method,
    status: payment.status,
    qrCode: payment.qrCode,
    qrCodeBase64: payment.qrCodeBase64,
    ticketUrl: payment.ticketUrl,
    barcode: payment.barcode,
  };
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const ip = clientIp(request);
  const limited = rateLimit("payment:" + ip, 20, 10 * 60 * 1000);
  if (!limited.ok) return jsonError("Muitas tentativas. Aguarde.", 429);

  const body = await readJson<unknown>(request);
  const parsed = paymentCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dados de pagamento inválidos.", 400);

  const orderId = verifyOrderToken(parsed.data.token);
  if (!orderId) return jsonError("Sessão de pagamento expirada. Volte à loja.", 401);

  const order = await getOrderById(orderId);
  if (!order) return jsonError("Pedido não encontrado.", 404);
  if (order.status === "paid") return jsonOk({ status: "approved" });
  if (order.status !== "pending") return jsonError("Pedido não está disponível para pagamento.", 409);

  const photo = await getPhotoById(order.photoId);
  if (!photo) return jsonError("Foto não encontrada.", 404);

  const db = await getDb();

  if (parsed.data.method === "pix" || parsed.data.method === "boleto") {
    const [existing] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.orderId, order.id),
          eq(payments.method, parsed.data.method),
          inArray(payments.status, PENDING),
        ),
      )
      .orderBy(desc(payments.createdAt))
      .limit(1);

    if (existing && (existing.qrCode || existing.ticketUrl)) {
      return jsonOk({ status: existing.status, payment: serialize(existing) });
    }
  }

  const failedAttempts = await db
    .select({ id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.orderId, order.id),
        eq(payments.method, parsed.data.method),
        eq(payments.status, "failed"),
      ),
    );

  const attempt = failedAttempts.length + 1;
  const idempotencyKey = paymentAttemptKey(
    order.id,
    parsed.data.method,
    attempt,
    parsed.data.method === "card" ? parsed.data.card.token : undefined,
  );

  const [existingAttempt] = await db
    .select()
    .from(payments)
    .where(eq(payments.idempotencyKey, idempotencyKey))
    .limit(1);

  if (existingAttempt) {
    if (existingAttempt.status === "approved") {
      return jsonOk({ status: "approved", payment: serialize(existingAttempt) });
    }
    if (existingAttempt.providerPaymentId) {
      return jsonOk({ status: existingAttempt.status, payment: serialize(existingAttempt) });
    }
    return jsonError("Pagamento em processamento. Aguarde alguns segundos.", 409);
  }

  let record: Payment;
  try {
    const [created] = await db
      .insert(payments)
      .values({
        orderId: order.id,
        method: parsed.data.method,
        status: "pending",
        amountCents: order.amountCents,
        idempotencyKey,
      })
      .returning();

    if (!created) return jsonError("Não foi possível registrar o pagamento.", 500);
    record = created;
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      const [concurrent] = await db
        .select()
        .from(payments)
        .where(eq(payments.idempotencyKey, idempotencyKey))
        .limit(1);
      if (concurrent?.status === "approved") return jsonOk({ status: "approved", payment: serialize(concurrent) });
      return jsonError("Pagamento em processamento. Aguarde alguns segundos.", 409);
    }
    console.error("[payment] insert", error);
    return jsonError("Não foi possível registrar o pagamento.", 500);
  }

  let result;
  try {
    result = await createPayment({
      orderId: order.id,
      photoTitle: photo.title,
      amountCents: order.amountCents,
      buyerEmail: order.buyerEmail,
      buyerName: order.buyerName,
      method: parsed.data.method,
      card: parsed.data.method === "card" ? parsed.data.card : undefined,
      payerDocument: parsed.data.method === "boleto" ? parsed.data.document : undefined,
      idempotencyKey: record.idempotencyKey,
    });
  } catch (error) {
    console.error("[payment] provider", error);
    await db
      .update(payments)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(payments.id, record.id));
    return jsonError("Não foi possível gerar o pagamento. Tente outro método.", 502);
  }

  try {
    await db
      .update(payments)
      .set({
        providerPaymentId: result.id,
        status: result.status,
        qrCode: result.qrCode ?? null,
        qrCodeBase64: result.qrCodeBase64 ?? null,
        ticketUrl: result.ticketUrl ?? null,
        barcode: result.barcode ?? null,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, record.id));
  } catch (error) {
    console.error("[payment] confirmed at provider but not saved", { orderId: order.id, error });
    return jsonError("Pagamento recebido; confirmação pendente. Não repita.", 502);
  }

  if (result.status === "approved") {
    try {
      await db
        .update(orders)
        .set({ providerPaymentId: result.id })
        .where(eq(orders.id, order.id));
      await fulfillOrder(order.id);
    } catch (error) {
      console.error("[payment] approved but fulfillment pending", { orderId: order.id, error });
    }
    return jsonOk({ status: "approved", payment: { ...serialize(record), status: "approved" } });
  }

  return jsonOk({
    status: result.status,
    payment: {
      ...serialize(record),
      status: result.status,
      qrCode: result.qrCode,
      qrCodeBase64: result.qrCodeBase64,
      ticketUrl: result.ticketUrl,
      barcode: result.barcode,
    },
  });
}
