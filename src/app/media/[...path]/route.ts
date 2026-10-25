import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { mediaPath } from "@/features/photos/server/images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FILE_RE = /^(\d{2,5})\.(avif|jpg)$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  if (!segments || segments.length !== 2) return new Response("Not found", { status: 404 });

  const [photoId, file] = segments;
  if (!UUID_RE.test(photoId) || !FILE_RE.test(file)) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = mediaPath(photoId, file);
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new Response("Not found", { status: 404 });

    const stream = Readable.toWeb(createReadStream(filePath)) as unknown as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": file.endsWith(".avif") ? "image/avif" : "image/jpeg",
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
