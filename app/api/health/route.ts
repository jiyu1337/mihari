import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "mihari-web",
    status: "ok",
    chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 4663),
    database: Boolean(process.env.DATABASE_URL),
    ai: Boolean(process.env.AI_GATEWAY_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
