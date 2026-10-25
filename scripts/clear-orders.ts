import "./load-env";
import { closeDb, getDb } from "../src/db/client";
import { downloads, orders, payments } from "../src/db/schema";

const db = await getDb();
await db.delete(downloads);
await db.delete(payments);
await db.delete(orders);
await closeDb();
console.log("Pedidos e pagamentos de teste removidos.");
