import path from "node:path";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { isProduction } from "@/server/env";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

type PGliteLike = {
  close: () => Promise<void>;
};

type GlobalDb = typeof globalThis & {
  __galeriaDb?: Promise<Db>;
  __galeriaPool?: Pool;
  __galeriaPglite?: PGliteLike;
};

const globalDb = globalThis as GlobalDb;

export function getDb(): Promise<Db> {
  if (!globalDb.__galeriaDb) {
    globalDb.__galeriaDb = createDb();
  }
  return globalDb.__galeriaDb;
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const pool = new Pool({ connectionString: url, max: 10 });
    globalDb.__galeriaPool = pool;
    return drizzlePg(pool, { schema });
  }

  const base = (process.env.APP_ROOT || "").trim()
    ? path.resolve(process.env.APP_ROOT as string)
    : process.cwd();
  const configured = (process.env.PGLITE_DIR || "").trim();

  if (isProduction && !configured) {
    throw new Error(
      "DATABASE_URL é obrigatório em produção. PGlite é apenas para desenvolvimento (ou defina PGLITE_DIR explicitamente).",
    );
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const dir = configured ? path.resolve(base, configured) : path.join(base, ".pglite");
  const client = new PGlite(dir);
  globalDb.__galeriaPglite = client as unknown as PGliteLike;
  return drizzlePglite(client, { schema }) as unknown as Db;
}

export async function closeDb(): Promise<void> {
  if (globalDb.__galeriaPool) {
    await globalDb.__galeriaPool.end();
    globalDb.__galeriaPool = undefined;
  }
  if (globalDb.__galeriaPglite) {
    await globalDb.__galeriaPglite.close();
    globalDb.__galeriaPglite = undefined;
  }
  globalDb.__galeriaDb = undefined;
}
