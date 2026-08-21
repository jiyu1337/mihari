import { getMarketSnapshot } from "@/lib/robinhood";
import {
  optionsResponse,
  openPublicApiRequest,
  publicApiError,
  publicApiResponse,
  publicAssetRiskSignal,
  symbolsQuerySchema,
} from "@/lib/public-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const apiRequest = await openPublicApiRequest(request, "/api/v1/risk-feed");
  if (apiRequest.denied) return apiRequest.denied;
  const parsedSymbols = symbolsQuerySchema.safeParse(new URL(request.url).searchParams.get("symbols") ?? undefined);
  if (!parsedSymbols.success) return publicApiError("Invalid symbols query", 400);

  const requestedSymbols = parsedSymbols.data;
  if (!requestedSymbols.length || requestedSymbols.length > 10) {
    return publicApiError("Provide between 1 and 10 comma-separated Stock Token symbols", 400);
  }

  const snapshot = await getMarketSnapshot(requestedSymbols);
  if (snapshot.mode !== "live") {
    return publicApiError("Official Robinhood source is temporarily unavailable", 503);
  }

  const priceBySymbol = new Map(snapshot.prices.map((price) => [price.tokenSymbol.toUpperCase(), price]));
  const eventBySymbol = new Map(
    snapshot.events
      .filter((event) => event.source === "robinhood")
      .map((event) => [event.asset.toUpperCase(), event]),
  );
  const signals = await Promise.all(
    snapshot.assets.map((asset) => publicAssetRiskSignal(
      asset,
      priceBySymbol.get(asset.tokenSymbol.toUpperCase()),
      eventBySymbol.get(asset.tokenSymbol.toUpperCase()),
    )),
  );

  return publicApiResponse({
    scope: "selected_symbols",
    source: "Robinhood Stock Token APIs",
    methodology: {
      rawQuote: "Robinhood /prices fields are raw underlying-equity bid and ask.",
      adjustedQuote: "MIHARI provides raw quote × current multiplier for token context. It is informational, not an executable quote.",
      risk: "MIHARI returns cached AI analysis when available, otherwise deterministic policy logic based on the verified official event.",
    },
    count: signals.length,
    signals,
  });
}
