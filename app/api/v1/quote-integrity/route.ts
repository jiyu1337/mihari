import { getMarketSnapshot } from "@/lib/robinhood";
import { optionsResponse, publicApiError, publicApiResponse, publicAsset, symbolsQuerySchema } from "@/lib/public-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function numeric(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function quoteAgeSeconds(generatedAt: string | undefined) {
  if (!generatedAt) return null;
  const timestamp = Date.parse(generatedAt);
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, Math.round((Date.now() - timestamp) / 1000));
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const parsed = symbolsQuerySchema.safeParse(new URL(request.url).searchParams.get("symbols") ?? undefined);
  if (!parsed.success || !parsed.data.length || parsed.data.length > 10) {
    return publicApiError("Provide between 1 and 10 comma-separated Stock Token symbols", 400);
  }
  const snapshot = await getMarketSnapshot(parsed.data);
  if (snapshot.mode !== "live") return publicApiError("Official Robinhood source is temporarily unavailable", 503);
  const priceBySymbol = new Map(snapshot.prices.map((price) => [price.tokenSymbol.toUpperCase(), price]));
  const checks = snapshot.assets.map((asset) => {
    const price = priceBySymbol.get(asset.tokenSymbol.toUpperCase());
    const multiplier = numeric(asset.currentMultiplier);
    const ageSeconds = quoteAgeSeconds(price?.generatedAt);
    const stale = ageSeconds !== null && ageSeconds > 90;
    const flags = [
      ...(asset.pendingMultiplier ? ["pending_multiplier"] : []),
      ...(price?.isTradingHalt ? ["trading_halt"] : []),
      ...(stale ? ["quote_stale"] : []),
      ...(!price || multiplier === null ? ["incomplete_source"] : []),
    ];
    return {
      symbol: asset.tokenSymbol,
      status: flags.length ? "review" : "clear",
      flags,
      quoteAgeSeconds: ageSeconds,
      quoteStaleAfterSeconds: 90,
      asset: publicAsset(asset, price),
      interpretation: flags.length
        ? "Do not mix raw underlying quotes with token values until the listed source conditions are reviewed."
        : "Raw quote and current multiplier are available. This is an informational consistency check, not an executable price guarantee.",
    };
  });
  return publicApiResponse({
    scope: "selected_symbols",
    methodology: "Robinhood REST prices are raw underlying-equity quotes. MIHARI applies the official current multiplier to show token context and flags conditions that need review.",
    checks,
  });
}
