import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { isSameOrigin } from "@/features/auth/server/guard";
import { jsonError, jsonOk, readJson } from "@/server/http";
import { createOrderToken } from "@/features/orders/server/order-token";
import { getPhotoById } from "@/features/photos/server/queries";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { checkoutSchema } from "@/features/orders/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const ip = clientIp(request);
  const limited = rateLimit("checkout:" + ip, 20, 10 * 60 * 1000);
  if (!limited.ok) return jsonError("Muitas tentativas. Aguarde alguns minutos.", 429);

  const body = await readJson<unknown>(request);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dados de compra inválidos.", 400);

  const photo = await getPhotoById(parsed.data.photoId);
  if (!photo || photo.status !== "published") return jsonError("Foto indisponível.", 404);
  if (photo.priceCents <= 0) return jsonError("Foto sem preço definido.", 400);

  const license =
    photo.license === "both"
      ? parsed.data.license
      : photo.license === "commercial"
        ? "commercial"
        : "personal";

  const db = await getDb();
  const [order] = await db
    .insert(orders)
    .values({
      photoId: photo.id,
      amountCents: photo.priceCents,
      currency: photo.currency || "BRL",
      buyerEmail: parsed.data.email,
      buyerName: parsed.data.name || null,
      license,
      status: "pending",
    })
    .returning({ id: orders.id });

  if (!order) return jsonError("Não foi possível criar o pedido.", 500);

  return jsonOk({ url: "/checkout/pay/" + createOrderToken(order.id) });
}
