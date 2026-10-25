import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdtemp, open, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import Busboy from "busboy";
import sharp from "sharp";
import { getDb } from "@/db/client";
import { collectionPhotos, photos } from "@/db/schema";
import { isSameOrigin } from "@/features/auth/server/guard";
import { getSessionUser } from "@/features/auth/server/session";
import type { ExifData } from "@/db/schema";
import { maxUploadBytes, photographerName } from "@/server/env";
import { extractPhotoData } from "@/features/photos/server/extract";
import { jsonError, jsonOk } from "@/server/http";
import { processImage, removeDerived } from "@/features/photos/server/images";
import { parsePriceToCents } from "@/lib/money";
import { slugWithSuffix } from "@/lib/slug";
import { deleteFile, putFile } from "@/server/storage";
import { validateUpload } from "@/features/photos/server/upload";
import { uuidSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 300;

type IncomingFile = {
  field: string;
  filename: string;
  path: string;
  getSize: () => number;
  isTruncated: () => boolean;
};

async function headerOf(filePath: string): Promise<Buffer> {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, 16, 0);
    return buffer;
  } finally {
    await handle.close();
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Origem inválida.", 403);

  const user = await getSessionUser();
  if (!user) return jsonError("Não autorizado.", 401);

  if (!request.body) return jsonError("Corpo da requisição vazio.", 400);

  const tmpDir = await mkdtemp(path.join(tmpdir(), "galeria-upload-"));
  const fields: Record<string, string> = {};
  const files: IncomingFile[] = [];
  const pending: Promise<void>[] = [];
  const storedKeys: string[] = [];
  let photoId: string | null = null;

  try {
    await new Promise<void>((resolve, reject) => {
      const bb = Busboy({
        headers: Object.fromEntries(request.headers.entries()),
        limits: {
          files: 2,
          fields: 20,
          fileSize: maxUploadBytes(),
        },
      });

      bb.on("field", (name, value) => {
        fields[name] = String(value);
      });

      bb.on("file", (field, stream, info) => {
        const safeName = path
          .basename(info.filename || "arquivo")
          .replace(/[^\w.\- ]+/g, "_")
          .slice(0, 140);
        const destination = path.join(tmpDir, field + "-" + files.length + "-" + safeName);
        const output = createWriteStream(destination);
        let size = 0;
        let truncated = false;

        stream.on("data", (chunk: Buffer) => {
          size += chunk.length;
        });
        stream.on("limit", () => {
          truncated = true;
        });

        const finished = new Promise<void>((fileResolve, fileReject) => {
          output.on("finish", () => fileResolve());
          output.on("error", fileReject);
          stream.on("error", fileReject);
        });

        pending.push(finished);
        files.push({
          field,
          filename: info.filename || safeName,
          path: destination,
          getSize: () => size,
          isTruncated: () => truncated,
        });

        stream.pipe(output);
      });

      bb.on("error", reject);
      bb.on("close", () => {
        Promise.all(pending).then(() => resolve()).catch(reject);
      });

      Readable.fromWeb(request.body as any).pipe(bb);
    });

    const validated: { file: IncomingFile; kind: "raw" | "master"; extension: string }[] = [];

    for (const file of files) {
      if (file.isTruncated()) return jsonError("Arquivo maior que o limite de " + Math.round(maxUploadBytes() / 1024 / 1024) + " MB.", 413);
      const header = await headerOf(file.path);
      const validation = validateUpload(file.filename, file.getSize(), header, maxUploadBytes());
      if (!validation.ok) return jsonError(validation.error, 400);
      validated.push({ file, kind: validation.kind, extension: validation.extension });
    }

    const rawEntry = validated.find((item) => item.kind === "raw") ?? null;
    const masterEntry = validated.find((item) => item.kind === "master") ?? null;

    if (!rawEntry && !masterEntry) return jsonError("Envie um RAW ou um JPEG mestre.", 400);

    const sourceName = rawEntry?.file.filename ?? masterEntry?.file.filename ?? "foto";
    const sourceBase = path.basename(sourceName, path.extname(sourceName)).replace(/[-_]+/g, " ");
    const title = (fields.title || "").trim().slice(0, 160) || sourceBase.slice(0, 160) || "Sem título";
    const description = (fields.description || "").trim().slice(0, 2000) || null;
    const alt = ((fields.alt || "").trim() || title).slice(0, 300);
    const parsedPrice = parsePriceToCents(fields.price || "0");
    const priceCents = parsedPrice === null ? 0 : Math.min(parsedPrice, 100000000);
    const license = ["personal", "commercial", "both"].includes(fields.license || "")
      ? (fields.license as "personal" | "commercial" | "both")
      : "personal";
    const collectionId =
      fields.collectionId && uuidSchema.safeParse(fields.collectionId).success
        ? fields.collectionId
        : null;

    const id = randomUUID();
    photoId = id;
    let exif: ExifData = {};
    let preview: Buffer | null = null;

    if (rawEntry) {
      const extracted = await extractPhotoData(rawEntry.file.path);
      exif = extracted.exif;
      preview = extracted.preview;
    }

    if (masterEntry && Object.keys(exif).length === 0) {
      exif = (await extractPhotoData(masterEntry.file.path)).exif;
    }

    let input: string | Buffer;
    if (masterEntry) {
      input = masterEntry.file.path;
    } else if (preview) {
      const previewPath = path.join(tmpDir, "preview-" + id + ".jpg");
      await writeFile(previewPath, preview);
      input = previewPath;
    } else {
      return jsonError("Não foi possível extrair uma prévia do RAW. Envie também o JPEG mestre editado.", 422);
    }

    const processed = await processImage(id, input, "© " + photographerName());

    let originalKey: string;
    let masterKey: string | null = null;

    if (rawEntry) {
      originalKey = "originals/" + id + "." + rawEntry.extension;
      await putFile(originalKey, rawEntry.file.path, "application/octet-stream");
      storedKeys.push(originalKey);
    } else {
      originalKey = "masters/" + id + ".jpg";
    }

    if (masterEntry) {
      masterKey = "masters/" + id + ".jpg";
      if (masterEntry.extension === "jpg" || masterEntry.extension === "jpeg") {
        await putFile(masterKey, masterEntry.file.path, "image/jpeg");
      } else {
        const normalized = path.join(tmpDir, "master-" + id + ".jpg");
        await sharp(masterEntry.file.path).rotate().jpeg({ quality: 95, mozjpeg: true }).toFile(normalized);
        await putFile(masterKey, normalized, "image/jpeg");
      }
      storedKeys.push(masterKey);
    }

    const db = await getDb();
    const inserted = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(photos)
        .values({
          id,
          slug: slugWithSuffix(title, id),
          title,
          description,
          alt,
          width: processed.sourceWidth,
          height: processed.sourceHeight,
          widths: processed.widths,
          blurDataUrl: processed.blurDataUrl,
          exif,
          priceCents,
          currency: "BRL",
          license,
          status: "draft",
          originalKey,
          originalName: rawEntry?.file.filename ?? masterEntry?.file.filename ?? null,
          masterKey,
          previewWidth: processed.previewWidth,
        })
        .returning({ id: photos.id, slug: photos.slug });

      if (!row) throw new Error("photo insert returned no row");

      if (collectionId) {
        await tx
          .insert(collectionPhotos)
          .values({ collectionId, photoId: row.id, position: 0 })
          .onConflictDoNothing();
      }

      return row;
    });

    return jsonOk({ ok: true, photo: inserted });
  } catch (error) {
    console.error("[upload]", error);
    for (const key of storedKeys) {
      await deleteFile(key).catch(() => undefined);
    }
    if (photoId) {
      await removeDerived(photoId).catch(() => undefined);
    }
    return jsonError("Falha ao processar o upload.", 500);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
