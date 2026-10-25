import "./load-env";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db/client";
import { adminUsers } from "../src/db/schema";
import { hashPassword } from "../src/features/auth/server/password";

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const update = process.argv.includes("--update");

  if (!email || password.length < 12) {
    console.error("Defina ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 12 caracteres) no .env.");
    process.exit(1);
  }

  const db = await getDb();
  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);

  if (existing && !update) {
    console.log("Admin já existe:", email, "- use --update para trocar a senha.");
    await closeDb();
    return;
  }

  if (existing) {
    await db.update(adminUsers).set({ passwordHash: hashPassword(password) }).where(eq(adminUsers.id, existing.id));
    console.log("Senha atualizada:", email);
  } else {
    await db.insert(adminUsers).values({ email, passwordHash: hashPassword(password) });
    console.log("Admin criado:", email);
  }

  await closeDb();
}

main().catch(async (error) => {
  console.error(error);
  await closeDb();
  process.exit(1);
});
