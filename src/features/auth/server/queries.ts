import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { adminUsers } from "@/db/schema";

export async function getAdminByEmail(email: string) {
  const db = await getDb();
  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  return admin ?? null;
}

export async function getAdminById(id: string) {
  const db = await getDb();
  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return admin ?? null;
}
