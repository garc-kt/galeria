import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { jsonOk } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql.raw("select 1"));
    return jsonOk({ ok: true, db: "up" });
  } catch {
    return new Response(JSON.stringify({ ok: false, db: "down" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
