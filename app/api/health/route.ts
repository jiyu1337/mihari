import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDatabase, getDatabaseUrl } from "@/db/client";

export const dynamic = "force-dynamic";

function getChainId() {
  const configuredChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  return Number.isSafeInteger(configuredChainId) && configuredChainId > 0 ? configuredChainId : 4663;
}

export async function GET() {
  const databaseUrl = getDatabaseUrl();
  let database = databaseUrl ? "unreachable" : "not_configured";

  if (databaseUrl) {
    try {
      await getDatabase().execute(sql`select 1`);
      database = "reachable";
    } catch {
      database = "unreachable";
    }
  }

  const status = database === "unreachable" ? "degraded" : "ok";

  return NextResponse.json({
    service: "mihari-web",
    status,
    chainId: getChainId(),
    database,
    databaseSource:
      process.env.NEON_DATABASE_DATABASE_URL ||
      process.env.NEON_DATABASE_POSTGRES_URL ||
      process.env.NEON_DATABASE_URL
        ? "neon_integration"
        : databaseUrl
          ? "legacy"
          : "none",
    ai: Boolean(process.env.OPENAI_API_KEY),
    aiProvider: process.env.OPENAI_API_KEY ? "openai" : "none",
    timestamp: new Date().toISOString(),
  });
}
