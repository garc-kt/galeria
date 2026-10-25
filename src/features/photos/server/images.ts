import sharp from "sharp";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { storageRoot } from "@/server/storage";

const TARGETS = [640, 1280, 2048];

export type ProcessedImage = {
  sourceWidth: number;
  sourceHeight: number;
  widths: number[];
  previewWidth: number;
  blurDataUrl: string;
};

export function derivedRoot(): string {
  return path.join(storageRoot(), "derived");
}

export function derivedDir(photoId: string): string {
  return path.join(derivedRoot(), photoId);
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function watermarkSvg(width: number, height: number, text: string): Buffer {
  const fontSize = Math.max(14, Math.round(width / 55));
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
    '<text x="' + Math.round(width * 0.94) + '" y="' + Math.round(height * 0.94) + '" ' +
    'text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="' + fontSize + '" ' +
    'letter-spacing="1" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.25)" stroke-width="1" ' +
    'paint-order="stroke">' + xmlEscape(text) + "</text></svg>";
  return Buffer.from(svg);
}

export async function processImage(
  photoId: string,
  input: string | Buffer,
  watermark: string,
): Promise<ProcessedImage> {
  const base = sharp(input, { failOn: "error" }).rotate();
  const metadata = await base.metadata();

  const orientation = metadata.orientation ?? 1;
  const swap = orientation >= 5 && orientation <= 8;
  const sourceWidth = swap ? metadata.height : metadata.width;
  const sourceHeight = swap ? metadata.width : metadata.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error("Não foi possível ler as dimensões da imagem.");
  }

  const widths = Array.from(
    new Set(TARGETS.map((target) => Math.min(target, sourceWidth)).filter((width) => width >= 160)),
  ).sort((a, b) => a - b);

  if (widths.length === 0) widths.push(sourceWidth);

  const outDir = derivedDir(photoId);
  await mkdir(outDir, { recursive: true });

  for (const width of widths) {
    const height = Math.max(1, Math.round((sourceHeight * width) / sourceWidth));
    const resized = base.clone().resize({ width, withoutEnlargement: true, kernel: "lanczos3" });
    const withMark =
      watermark && width >= 1280
        ? resized.composite([{ input: watermarkSvg(width, height, watermark), top: 0, left: 0 }])
        : resized;

    await Promise.all([
      withMark.clone().avif({ quality: 62, effort: 6 }).toFile(path.join(outDir, width + ".avif")),
      withMark
        .clone()
        .jpeg({ quality: 88, mozjpeg: true, progressive: true })
        .toFile(path.join(outDir, width + ".jpg")),
    ]);
  }

  const blur = await base.clone().resize(20, null, { fit: "inside" }).webp({ quality: 40 }).toBuffer();

  return {
    sourceWidth,
    sourceHeight,
    widths,
    previewWidth: widths[widths.length - 1],
    blurDataUrl: "data:image/webp;base64," + blur.toString("base64"),
  };
}

export async function removeDerived(photoId: string): Promise<void> {
  await rm(derivedDir(photoId), { recursive: true, force: true });
}

export function mediaPath(photoId: string, file: string): string {
  return path.join(derivedDir(photoId), file);
}
