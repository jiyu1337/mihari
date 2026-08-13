import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const databaseUrl =
  process.env.NEON_DATABASE_DATABASE_URL ??
  process.env.NEON_DATABASE_POSTGRES_URL ??
  process.env.NEON_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("[database] No connection configured; skipping migrations.");
} else {
  const sql = neon(databaseUrl);
  const database = drizzle(sql);

  await migrate(database, { migrationsFolder: "./drizzle" });
  console.log("[database] Migrations are up to date.");
}
