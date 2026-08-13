import { NextResponse } from "next/server";
import { getAssetCatalog } from "@/lib/robinhood";

export const runtime = "nodejs";

export async function GET() {
  try {
    const assets = await getAssetCatalog();
    return NextResponse.json(
      { mode: "live", assets, fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        mode: "unavailable",
        assets: [],
        warning: error instanceof Error ? error.message : "Robinhood asset catalog unavailable",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
