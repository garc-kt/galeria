import { and, count, eq, sum } from "drizzle-orm";
import { getDb } from "@/db/client";
import { orders, photos } from "@/db/schema";

export async function getDashboardStats() {
  const db = await getDb();
  const [[photoRow], [publishedRow], [orderRow], [failedDeliveryRow]] = await Promise.all([
    db.select({ count: count() }).from(photos),
    db.select({ count: count() }).from(photos).where(eq(photos.status, "published")),
    db
      .select({ count: count(), revenue: sum(orders.amountCents) })
      .from(orders)
      .where(eq(orders.status, "paid")),
    db
      .select({ count: count() })
      .from(orders)
      .where(and(eq(orders.status, "paid"), eq(orders.deliveryStatus, "failed"))),
  ]);

  return {
    photos: photoRow?.count ?? 0,
    published: publishedRow?.count ?? 0,
    orders: orderRow?.count ?? 0,
    revenue: Number(orderRow?.revenue ?? 0),
    failedDeliveries: failedDeliveryRow?.count ?? 0,
  };
}
