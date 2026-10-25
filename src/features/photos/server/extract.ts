import * as exifr from "exifr";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { ExifData } from "@/db/schema";

const run = promisify(execFile);

function formatExposure(value: unknown): string | undefined {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  if (seconds >= 1) return String(Number(seconds.toFixed(1))) + "s";
  return "1/" + String(Math.round(1 / seconds)) + "s";
}

export async function readExif(filePath: string): Promise<ExifData> {
  try {
    const data = (await exifr.parse(filePath, {
      pick: [
        "Make",
        "Model",
        "LensModel",
        "FNumber",
        "ExposureTime",
        "ISO",
        "FocalLength",
        "DateTimeOriginal",
      ],
    })) as Record<string, unknown> | undefined;

    if (!data) return {};

    const make = typeof data.Make === "string" ? data.Make.trim() : "";
    const model = typeof data.Model === "string" ? data.Model.trim() : "";
    const camera = [make, model].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    const captured = data.DateTimeOriginal;

    return {
      camera: camera || undefined,
      lens: typeof data.LensModel === "string" ? data.LensModel : undefined,
      iso: Number.isFinite(Number(data.ISO)) ? Number(data.ISO) : undefined,
      aperture: Number.isFinite(Number(data.FNumber)) ? "f/" + Number(data.FNumber) : undefined,
      shutter: formatExposure(data.ExposureTime),
      focalLength: Number.isFinite(Number(data.FocalLength)) ? String(Number(data.FocalLength)) + "mm" : undefined,
      capturedAt:
        captured instanceof Date
          ? captured.toISOString()
          : typeof captured === "string"
            ? captured
            : undefined,
    };
  } catch {
    return {};
  }
}

async function extractWithLibRaw(filePath: string): Promise<Buffer | null> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "galeria-raw-"));
  try {
    await run("dcraw_emu", ["-e", filePath], { cwd: dir, timeout: 45000, windowsHide: true });
    const files = await readdir(dir);
    const thumb = files.find((name) => /\.jpe?g$/i.test(name));
    if (!thumb) return null;
    return await readFile(path.join(dir, thumb));
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function extractPhotoData(filePath: string): Promise<{ preview: Buffer | null; exif: ExifData }> {
  const exif = await readExif(filePath);

  try {
    const thumbnail = await exifr.thumbnail(filePath);
    if (thumbnail && thumbnail.byteLength > 0) {
      return { preview: Buffer.from(thumbnail), exif };
    }
  } catch {
    // Fall through to libraw.
  }

  return { preview: await extractWithLibRaw(filePath), exif };
}
