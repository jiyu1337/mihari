import { NextResponse } from "next/server";
import { getCorporateActions } from "@/lib/robinhood";

export const runtime = "nodejs";

export async function GET() {
  const result = await getCorporateActions();

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
