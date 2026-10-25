import "./load-env";
import { count } from "drizzle-orm";
import { closeDb, getDb } from "../src/db/client";
import { collections, downloads, orders, payments, photos } from "../src/db/schema";

async function main() {
  const db = await getDb();
  const [[p], [c], [o], [d], [pay]] = await Promise.all([
    db.select({ value: count() }).from(photos),
    db.select({ value: count() }).from(collections),
    db.select({ value: count() }).from(orders),
    db.select({ value: count() }).from(downloads),
    db.select({ value: count() }).from(payments),
  ]);
  console.log(
    JSON.stringify(
      {
        photos: p?.value,
        collections: c?.value,
        orders: o?.value,
        payments: pay?.value,
        downloads: d?.value,
      },
      null,
      2,
    ),
  );
  await closeDb();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
