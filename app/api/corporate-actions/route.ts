import { NextResponse } from "next/server";
import { PUBLIC_WATCHLIST_ASSETS } from "@/lib/product-limits";
import { getMarketSnapshot } from "@/lib/robinhood";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols")
    ?.split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, PUBLIC_WATCHLIST_ASSETS);
  const result = await getMarketSnapshot(symbols);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
    },
  });
}
