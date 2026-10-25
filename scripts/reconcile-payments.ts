import "./load-env";
import { and, eq, isNotNull } from "drizzle-orm";
import { getDb, closeDb } from "@/db/client";
import { orders } from "@/db/schema";
import { extractPaymentData, getPayment } from "@/features/payments/server/mercadopago";
import { fulfillOrder } from "@/features/orders/server/orders";

async function main() {
  const db = await getDb();
  const pending = await db
    .select()
    .from(orders)
    .where(and(eq(orders.status, "pending"), isNotNull(orders.providerPaymentId)))
    .limit(100);

  let approved = 0;
  let refunded = 0;
  let failed = 0;

  for (const order of pending) {
    if (!order.providerPaymentId) continue;
    try {
      const raw = await getPayment(order.providerPaymentId);
      const data = extractPaymentData(raw);

      if (data.status === "approved") {
        const paidAmount = Math.round(Number(raw.transaction_amount ?? 0) * 100);
        if (paidAmount !== order.amountCents) {
          failed += 1;
          console.error("[reconcile] amount mismatch", { orderId: order.id, paidAmount });
          continue;
        }
        await fulfillOrder(order.id);
        approved += 1;
      } else if (data.status === "refunded" || data.status === "charged_back") {
        await db
          .update(orders)
          .set({ status: "refunded", refundedAt: new Date() })
          .where(eq(orders.id, order.id));
        refunded += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("[reconcile] failed", { orderId: order.id, error });
    }
  }

  console.log(JSON.stringify({ checked: pending.length, approved, refunded, failed }));
  await closeDb();
}

main().catch(async (error) => {
  console.error("[reconcile]", error);
  await closeDb();
  process.exitCode = 1;
});
