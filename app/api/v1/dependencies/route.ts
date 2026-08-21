import { scanProtocolMarkets } from "@/lib/protocol-markets";
import { getMarketSnapshot } from "@/lib/robinhood";
import { optionsResponse, publicApiError, publicApiResponse, symbolsQuerySchema } from "@/lib/public-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const parsed = symbolsQuerySchema.safeParse(new URL(request.url).searchParams.get("symbols") ?? undefined);
  if (!parsed.success || !parsed.data.length || parsed.data.length > 5) {
    return publicApiError("Provide between 1 and 5 comma-separated Stock Token symbols", 400);
  }
  const snapshot = await getMarketSnapshot(parsed.data);
  if (snapshot.mode !== "live") return publicApiError("Official Robinhood source is temporarily unavailable", 503);
  const scan = await scanProtocolMarkets(snapshot.assets, parsed.data);
  return publicApiResponse({
    scope: "public_market_dependencies",
    symbols: parsed.data,
    scan,
    boundary: "This reports publicly discovered market dependencies and venue coverage. It does not identify, infer or expose a user's wallet positions.",
  }, { cacheControl: "public, s-maxage=60, stale-while-revalidate=180" });
}
