import "./load-env";
import { rm } from "node:fs/promises";
import path from "node:path";
import { getDb, closeDb } from "../src/db/client";
import {
  collectionPhotos,
  collections,
  downloads,
  orders,
  photos,
} from "../src/db/schema";
import { storageRoot } from "../src/server/storage";

async function main() {
  const db = await getDb();
  await db.delete(downloads);
  await db.delete(orders);
  await db.delete(collectionPhotos);
  await db.delete(photos);
  await db.delete(collections);

  const root = storageRoot();
  for (const folder of ["derived", "masters", "originals"]) {
    await rm(path.join(root, folder), { recursive: true, force: true });
  }

  await closeDb();
  console.log("Fotos, coleções, pedidos e arquivos removidos. Admin preservado.");
}

main().catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});
