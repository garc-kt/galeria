import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { downloads } from "@/db/schema";
import { isDownloadActive, hashDownloadToken } from "@/features/orders/server/downloads";
import { jsonError } from "@/server/http";
import { getDownloadInfo } from "@/features/orders/server/queries";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { localFilePath, presignDownload, storedObjectExists } from "@/server/storage";
import { mimeForExtension } from "@/features/photos/server/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

export async function GET(request: Request, context: Context) {
  const ip = clientIp(request);
  const limited = rateLimit("download:" + ip, 60, 60 * 60 * 1000);
  if (!limited.ok) return jsonError("Muitos downloads. Aguarde.", 429);

  const { token } = await context.params;
  if (!token || token.length < 20) return new Response("Not found", { status: 404 });

  const hash = hashDownloadToken(token);
  const info = await getDownloadInfo(hash);
  if (!info) return new Response("Link inválido.", { status: 404 });

  const { download, photo, order } = info;
  if (order.status !== "paid") return new Response("Pedido não liberado.", { status: 403 });
  if (!isDownloadActive(download.expiresAt, download.downloadCount, download.maxDownloads)) {
    return new Response("Link expirado.", { status: 410 });
  }

  const key = photo.masterKey ?? photo.originalKey;
  const extension = (key.split(".").pop() ?? "jpg").toLowerCase();
  const filename = photo.slug + "." + extension;

  if (!(await storedObjectExists(key))) {
    return new Response("Arquivo indisponível.", { status: 404 });
  }

  const signed = await presignDownload(key, filename);
  let local: string | null = null;
  let size = 0;

  if (!signed) {
    local = localFilePath(key);
    if (!local) return new Response("Arquivo indisponível.", { status: 404 });
    size = (await stat(/* turbopackIgnore: true */ local)).size;
  }

  const db = await getDb();
  const updated = await db
    .update(downloads)
    .set({ downloadCount: sql.raw("download_count + 1") })
    .where(
      and(
        eq(downloads.id, download.id),
        lt(downloads.downloadCount, download.maxDownloads),
        gt(downloads.expiresAt, new Date()),
      ),
    )
    .returning({ count: downloads.downloadCount });

  if (updated.length === 0) return new Response("Link expirado.", { status: 410 });
  if (signed) return Response.redirect(signed, 302);
  if (!local) return new Response("Arquivo indisponível.", { status: 404 });

  const stream = Readable.toWeb(createReadStream(/* turbopackIgnore: true */ local)) as unknown as ReadableStream;

  return new Response(stream, {
    headers: {
      "Content-Type": mimeForExtension(extension),
      "Content-Length": String(size),
      "Content-Disposition": 'attachment; filename="' + filename.replace(/["\r\n]/g, "") + '"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
