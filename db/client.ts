import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

export function getDatabaseUrl() {
  return process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;
}

export function getDatabase() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("NEON_DATABASE_URL or DATABASE_URL is not configured");
  }

  return drizzle(neon(databaseUrl), { schema });
}
