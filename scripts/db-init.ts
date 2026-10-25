import "./load-env";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/db/schema";

async function main() {
  const folder = path.resolve("drizzle");
  const url = (process.env.DATABASE_URL || "").trim();

  if (url) {
    const pool = new Pool({ connectionString: url });
    try {
      const db = drizzlePg(pool, { schema });
      await migratePg(db, { migrationsFolder: folder });
      console.log("Migrations aplicadas no Postgres.");
    } finally {
      await pool.end();
    }
    return;
  }

  const base = (process.env.APP_ROOT || "").trim()
    ? path.resolve(process.env.APP_ROOT as string)
    : process.cwd();
  const client = new PGlite(path.resolve(base, process.env.PGLITE_DIR || ".pglite"));
  try {
    const db = drizzlePglite(client, { schema });
    await migratePglite(db, { migrationsFolder: folder });
    console.log("Migrations aplicadas no PGlite:", path.resolve(base, process.env.PGLITE_DIR || ".pglite"));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
