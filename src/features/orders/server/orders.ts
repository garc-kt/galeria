import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { downloads, orders, photos } from "@/db/schema";
import type { Order, Photo } from "@/db/schema";
import { downloadExpiryDate, generateDownloadToken, hashDownloadToken } from "./downloads";
import { deliveryEmailHtml, deliveryEmailText, sendEmail } from "@/server/email";
import { siteUrl } from "@/server/env";

export type FulfillResult = {
  token?: string;
  expiresAt?: Date;
};

async function sendDeliveryEmail(order: Order, photo: Photo, token: string, expiresAt: Date): Promise<void> {
  const downloadUrl = siteUrl() + "/download/" + token;

  await sendEmail({
    to: order.buyerEmail,
    subject: "Sua foto está pronta - " + photo.title,
    html: deliveryEmailHtml({
      buyerName: order.buyerName,
      photoTitle: photo.title,
      amountCents: order.amountCents,
      license: order.license,
      downloadUrl,
      expiresAt,
    }),
    text: deliveryEmailText({
      buyerName: order.buyerName,
      photoTitle: photo.title,
      amountCents: order.amountCents,
      license: order.license,
      downloadUrl,
      expiresAt,
    }),
  });
}

export async function fulfillOrder(orderId: string): Promise<FulfillResult> {
  const db = await getDb();

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.status === "paid" || order.status === "refunded") return {};

  const [photo] = await db.select().from(photos).where(eq(photos.id, order.photoId)).limit(1);
  if (!photo) return {};

  const token = generateDownloadToken();
  const expiresAt = downloadExpiryDate();

  const paid = await db.transaction(async (tx) => {
    const updated = await tx
      .update(orders)
      .set({ status: "paid", paidAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
      .returning({ id: orders.id });

    if (updated.length === 0) return false;

    await tx.insert(downloads).values({
      orderId,
      photoId: photo.id,
      tokenHash: hashDownloadToken(token),
      expiresAt,
      maxDownloads: 5,
    });

    return true;
  });

  if (!paid) return {};

  try {
    await sendDeliveryEmail(order, photo, token, expiresAt);
  } catch (error) {
    console.error("[email] delivery failed for order " + orderId, error);
  }

  return { token, expiresAt };
}

export async function resendOrderDelivery(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb();

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, error: "Pedido não encontrado." };
  if (order.status !== "paid") return { ok: false, error: "Pedido não está pago." };

  const [photo] = await db.select().from(photos).where(eq(photos.id, order.photoId)).limit(1);
  if (!photo) return { ok: false, error: "Foto não encontrada." };

  const token = generateDownloadToken();
  const expiresAt = downloadExpiryDate();

  const [created] = await db
    .insert(downloads)
    .values({
      orderId,
      photoId: photo.id,
      tokenHash: hashDownloadToken(token),
      expiresAt,
      maxDownloads: 5,
    })
    .returning({ id: downloads.id });

  if (!created) return { ok: false, error: "Não foi possível emitir um novo link." };

  try {
    await sendDeliveryEmail(order, photo, token, expiresAt);
  } catch (error) {
    console.error("[email] resend failed for order " + orderId, error);
    return { ok: false, error: "Falha ao enviar o e-mail. Verifique o Resend." };
  }

  await db
    .delete(downloads)
    .where(and(eq(downloads.orderId, orderId), ne(downloads.id, created.id)));

  return { ok: true };
}
