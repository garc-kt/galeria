import { describe, expect, it } from "vitest";
import {
  MASTER_EXTENSIONS,
  RAW_EXTENSIONS,
  extensionOf,
  sniffImageMime,
  validateUpload,
} from "@/features/photos/server/upload";

const MAX = 150 * 1024 * 1024;
const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

describe("upload validation", () => {
  it("knows extensions", () => {
    expect(extensionOf("foto.CR3")).toBe("cr3");
    expect(extensionOf("a/b/foto final.jpeg")).toBe("jpeg");
    expect(RAW_EXTENSIONS.has("nef")).toBe(true);
    expect(MASTER_EXTENSIONS.has("tif")).toBe(true);
  });

  it("sniffs image headers", () => {
    expect(sniffImageMime(jpegHeader)).toBe("image/jpeg");
    expect(sniffImageMime(pngHeader)).toBe("image/png");
    expect(sniffImageMime(Buffer.from("not-an-image"))).toBeNull();
  });

  it("accepts a raw file by extension", () => {
    const result = validateUpload("foto.cr3", 1024, Buffer.alloc(16), MAX);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.kind).toBe("raw");
  });

  it("accepts a valid master", () => {
    const result = validateUpload("master.jpg", 1024, jpegHeader, MAX);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.kind).toBe("master");
  });

  it("rejects a fake master", () => {
    const result = validateUpload("master.jpg", 1024, Buffer.from("hello"), MAX);
    expect(result.ok).toBe(false);
  });

  it("rejects unknown and oversized files", () => {
    expect(validateUpload("foto.gif", 1024, jpegHeader, MAX).ok).toBe(false);
    expect(validateUpload("foto.cr3", MAX + 1, Buffer.alloc(16), MAX).ok).toBe(false);
  });
});
