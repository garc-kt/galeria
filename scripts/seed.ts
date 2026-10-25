import "./load-env";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import sharp from "sharp";
import { closeDb, getDb } from "../src/db/client";
import { adminUsers, collectionPhotos, collections, photos } from "../src/db/schema";
import type { ExifData } from "../src/db/schema";
import { hashPassword } from "../src/features/auth/server/password";
import { photographerName } from "../src/server/env";
import { processImage } from "../src/features/photos/server/images";
import { isS3, storageRoot } from "../src/server/storage";
import { slugify } from "../src/lib/slug";

function artwork(index: number, width: number, height: number, palette: string[]): Buffer {
  const x = 12 + ((index * 17) % 60);
  const y = 18 + ((index * 23) % 55);
  const r = Math.round(Math.min(width, height) * (0.18 + (index % 3) * 0.05));
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">',
    "<defs>",
    '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0" stop-color="' + palette[0] + '"/>',
    '<stop offset="0.55" stop-color="' + palette[1] + '"/>',
    '<stop offset="1" stop-color="' + palette[2] + '"/>',
    "</linearGradient>",
    "</defs>",
    '<rect width="100%" height="100%" fill="url(#g)"/>',
    '<circle cx="' + Math.round((width * x) / 100) + '" cy="' + Math.round((height * y) / 100) + '" r="' + r + '" fill="' + palette[0] + '" opacity="0.28"/>',
    '<rect x="' + Math.round(width * 0.07) + '" y="' + Math.round(height * 0.1) + '" width="' + Math.round(width * 0.86) + '" height="' + Math.round(height * 0.8) + '" fill="none" stroke="#F8F7F3" stroke-opacity="0.14"/>',
    "</svg>",
  ].join("");
  return Buffer.from(svg);
}

const collectionData = [
  { title: "Interior", description: "Luz doméstica, paredes e o tempo dentro de casa." },
  { title: "Mar", description: "Horizonte, névoa e a repetição das ondas." },
  { title: "Cidade", description: "Concreto, sombra e o intervalo entre dois gestos." },
];

const photoData = [
  { title: "Janela", width: 1600, height: 2000, price: 24000, palette: ["#2F3A36", "#6E7F74", "#C9CFC4"] },
  { title: "Névoa", width: 2400, height: 1600, price: 18000, palette: ["#AEB8B2", "#7E8C86", "#E8E9E2"] },
  { title: "Pedra", width: 2000, height: 2000, price: 32000, palette: ["#3C3A36", "#7A7266", "#D8D2C4"] },
  { title: "Maré", width: 2400, height: 1600, price: 22000, palette: ["#24413D", "#47716A", "#B8CEC7"] },
  { title: "Sombra", width: 1600, height: 2000, price: 28000, palette: ["#1E1F1C", "#4A4E45", "#A9AB9C"] },
  { title: "Terra", width: 2400, height: 1600, price: 19000, palette: ["#5B4B3A", "#8E7256", "#D9C8AE"] },
  { title: "Horizonte", width: 3000, height: 1200, price: 36000, palette: ["#2C4A57", "#6D8C95", "#D9E1DF"] },
  { title: "Pausa", width: 1600, height: 2000, price: 21000, palette: ["#3A3B40", "#6C6D74", "#C9C9CE"] },
  { title: "Vento", width: 2400, height: 1600, price: 26000, palette: ["#4A554B", "#86947F", "#E2E5D7"] },
];

async function main() {
  if (isS3()) {
    console.error("O seed grava arquivos locais. Use STORAGE_DRIVER=local.");
    process.exit(1);
  }

  const db = await getDb();

  let existingPhotos = 0;
  try {
    const [row] = await db.select({ value: count() }).from(photos);
    existingPhotos = row?.value ?? 0;
  } catch {
    console.error("Banco não inicializado. Rode: pnpm db:init");
    process.exit(1);
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "change-me-now";
  const [existingAdmin] = await db.select().from(adminUsers).where(eq(adminUsers.email, adminEmail)).limit(1);

  if (!existingAdmin) {
    await db.insert(adminUsers).values({
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
    });
    console.log("Admin criado:", adminEmail);
  }

  if (existingPhotos > 0) {
    console.log("Já existem", existingPhotos, "fotos. Seed de fotos ignorado.");
    return;
  }

  await db.delete(collections);

  const root = storageRoot();
  const masters = path.join(root, "masters");
  const originals = path.join(root, "originals");
  await mkdir(masters, { recursive: true });
  await mkdir(originals, { recursive: true });

  const insertedCollections = [];
  for (let i = 0; i < collectionData.length; i += 1) {
    const item = collectionData[i];
    const [row] = await db
      .insert(collections)
      .values({
        slug: slugify(item.title),
        title: item.title,
        description: item.description,
        published: true,
        sortOrder: i,
      })
      .returning({ id: collections.id, title: collections.title });
    if (row) insertedCollections.push(row);
  }

  for (let i = 0; i < photoData.length; i += 1) {
    const item = photoData[i];
    const id = randomUUID();
    const masterPath = path.join(masters, id + ".jpg");
    const originalPath = path.join(originals, id + ".jpg");

    await sharp(artwork(i, item.width, item.height, item.palette))
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(masterPath);
    await copyFile(masterPath, originalPath);

    const processed = await processImage(id, masterPath, "© " + photographerName());
    const exif: ExifData = {
      camera: "Sony A7 IV",
      lens: "35mm f/1.8",
      aperture: "f/2.8",
      shutter: "1/250s",
      iso: 400,
      focalLength: "35mm",
      capturedAt: new Date(2024, (i * 2) % 12, 4 + i).toISOString(),
    };

    const collection = insertedCollections[i % insertedCollections.length];

    const [inserted] = await db
      .insert(photos)
      .values({
        id,
        slug: slugify(item.title) + "-" + id.slice(0, 6),
        title: item.title,
        description: null,
        alt: item.title + ": composição abstrata em tons de " + item.palette[1] + ".",
        width: processed.sourceWidth,
        height: processed.sourceHeight,
        widths: processed.widths,
        blurDataUrl: processed.blurDataUrl,
        exif,
        priceCents: item.price,
        currency: "BRL",
        license: i % 3 === 0 ? "both" : "personal",
        status: "published",
        featured: i < 6,
        sortOrder: i,
        originalKey: "originals/" + id + ".jpg",
        originalName: slugify(item.title) + ".jpg",
        masterKey: "masters/" + id + ".jpg",
        previewWidth: processed.previewWidth,
      })
      .returning({ id: photos.id });

    if (inserted && collection) {
      await db.insert(collectionPhotos).values({
        collectionId: collection.id,
        photoId: inserted.id,
        position: i,
      });
    }

    console.log("Foto:", item.title);
  }

  console.log("");
  console.log("Seed concluído.");
  console.log("Admin:", adminEmail, "/", adminPassword);
  console.log("Site: http://localhost:3000");
}

main()
  .then(async () => {
    await closeDb();
  })
  .catch(async (error) => {
    console.error(error);
    await closeDb();
    process.exit(1);
  });
