import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/robinhood";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols")?.split(",");
  const result = await getMarketSnapshot(symbols);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
    },
  });
}
