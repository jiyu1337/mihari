import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDatabase, getDatabaseUrl } from "@/db/client";

export const dynamic = "force-dynamic";

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
    chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 4663),
    database,
    databaseSource: process.env.NEON_DATABASE_URL ? "neon_integration" : databaseUrl ? "legacy" : "none",
    ai: Boolean(process.env.AI_GATEWAY_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
