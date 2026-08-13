import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.NEON_DATABASE_DATABASE_URL ??
  process.env.NEON_DATABASE_POSTGRES_URL ??
  process.env.NEON_DATABASE_URL ??
  process.env.DATABASE_URL;

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});
