import { getAssetCatalog, getMarketSnapshot } from "@/lib/robinhood";
import {
  optionsResponse,
  openPublicApiRequest,
  publicApiError,
  publicApiResponse,
  publicEvent,
  symbolsQuerySchema,
} from "@/lib/public-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const apiRequest = await openPublicApiRequest(request, "/api/v1/events");
  if (apiRequest.denied) return apiRequest.denied;
  const parsedSymbols = symbolsQuerySchema.safeParse(new URL(request.url).searchParams.get("symbols") ?? undefined);
  if (!parsedSymbols.success) return publicApiError("Invalid symbols query", 400);

  const requestedSymbols = parsedSymbols.data;
  let symbols = requestedSymbols;
  if (!symbols.length) {
    try {
      symbols = (await getAssetCatalog()).map((asset) => asset.tokenSymbol);
    } catch {
      return publicApiError("Official Robinhood asset catalog is temporarily unavailable", 503);
    }
  }

  if (!symbols.length) return publicApiError("Official Robinhood asset catalog is temporarily unavailable", 503);

  const snapshot = await getMarketSnapshot(symbols);
  if (snapshot.mode !== "live") {
    return publicApiError("Official Robinhood source is temporarily unavailable", 503);
  }

  const events = snapshot.events
    .filter((event) => event.source === "robinhood")
    .map(publicEvent);

  return publicApiResponse({
    scope: requestedSymbols.length ? "selected_symbols" : "full_active_catalog",
    source: "Robinhood Stock Token APIs",
    count: events.length,
    events,
  });
}
