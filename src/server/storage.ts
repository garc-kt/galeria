import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream } from "node:fs";
import { access, copyFile, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { storageDriver } from "./env";

let client: S3Client | null = null;

function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials:
        process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }
  return client;
}

function bucket(): string {
  const value = (process.env.S3_BUCKET || "").trim();
  if (!value) throw new Error("S3_BUCKET is required when STORAGE_DRIVER=s3.");
  return value;
}

export function isS3(): boolean {
  return storageDriver() === "s3";
}

export function storageRoot(): string {
  const base = (process.env.APP_ROOT || "").trim()
    ? path.resolve(process.env.APP_ROOT as string)
    : process.cwd();
  return path.resolve(/* turbopackIgnore: true */ base, process.env.STORAGE_LOCAL_DIR || "./storage");
}

export function safeLocalPath(key: string): string {
  const root = storageRoot();
  const full = path.resolve(root, key);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("Invalid storage key.");
  }
  return full;
}

export async function putFile(key: string, localPath: string, contentType: string): Promise<void> {
  if (isS3()) {
    const size = (await stat(localPath)).size;
    await s3().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: key,
        Body: createReadStream(localPath),
        ContentLength: size,
        ContentType: contentType,
      }),
    );
    return;
  }

  const destination = safeLocalPath(key);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(localPath, destination);
}

export async function deleteFile(key: string): Promise<void> {
  if (isS3()) {
    await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
    return;
  }
  await rm(safeLocalPath(key), { force: true });
}

export function localFilePath(key: string): string | null {
  if (isS3()) return null;
  return safeLocalPath(key);
}

export async function storedObjectExists(key: string): Promise<boolean> {
  if (isS3()) {
    try {
      await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
      return true;
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return false;
      throw error;
    }
  }
  return fileExists(safeLocalPath(key));
}

export async function fileExists(fullPath: string): Promise<boolean> {
  try {
    await access(fullPath);
    return true;
  } catch {
    return false;
  }
}

export async function presignDownload(key: string, filename: string): Promise<string | null> {
  if (!isS3()) return null;

  const safeName = filename.replace(/["\r\n]/g, "").replace(/[^\x20-\x7E]/g, "_");
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: key,
    ResponseContentDisposition: 'attachment; filename="' + safeName + '"',
    ResponseContentType: "application/octet-stream",
  });
  return getSignedUrl(s3(), command, { expiresIn: 300 });
}
