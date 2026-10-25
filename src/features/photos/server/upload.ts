export const RAW_EXTENSIONS = new Set([
  "cr2",
  "cr3",
  "nef",
  "arw",
  "dng",
  "raf",
  "rw2",
  "orf",
  "pef",
  "srw",
  "x3f",
]);

export const MASTER_EXTENSIONS = new Set(["jpg", "jpeg", "png", "tif", "tiff", "webp"]);

export type UploadKind = "raw" | "master";

export type UploadValidation =
  | { ok: true; kind: UploadKind; extension: string; mime: string }
  | { ok: false; error: string };

export function extensionOf(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const dot = base.lastIndexOf(".");
  if (dot < 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

export function mimeForExtension(extension: string): string {
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "tif":
    case "tiff":
      return "image/tiff";
    case "avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}

export function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
  ) {
    return "image/tiff";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function validateUpload(
  filename: string,
  size: number,
  header: Buffer | null,
  maxBytes: number,
): UploadValidation {
  if (!filename) return { ok: false, error: "Arquivo sem nome." };
  if (size <= 0) return { ok: false, error: "Arquivo vazio." };
  if (size > maxBytes) return { ok: false, error: "Arquivo maior que o limite configurado." };

  const extension = extensionOf(filename);
  if (RAW_EXTENSIONS.has(extension)) {
    return { ok: true, kind: "raw", extension, mime: "application/octet-stream" };
  }

  if (MASTER_EXTENSIONS.has(extension)) {
    const mime = header ? sniffImageMime(header) : null;
    if (!mime) return { ok: false, error: "O arquivo mestre não é uma imagem JPEG, PNG, TIFF ou WebP válida." };
    return { ok: true, kind: "master", extension, mime };
  }

  return { ok: false, error: "Formato não suportado. Envie RAW ou JPEG/TIFF/PNG." };
}
