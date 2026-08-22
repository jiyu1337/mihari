import { getMarketSnapshot } from "@/lib/robinhood";
import {
  optionsResponse,
  openPublicApiRequest,
  publicApiError,
  publicApiResponse,
  publicAsset,
  publicEvent,
  symbolSchema,
} from "@/lib/public-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ symbol: string }> };

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request, { params }: RouteContext) {
  const apiRequest = await openPublicApiRequest(request, "/api/v1/assets/{symbol}");
  if (apiRequest.denied) return apiRequest.denied;
  const parsedSymbol = symbolSchema.safeParse((await params).symbol);
  if (!parsedSymbol.success) return publicApiError("Invalid Stock Token symbol", 400);

  const symbol = parsedSymbol.data;
  const snapshot = await getMarketSnapshot([symbol]);
  if (snapshot.mode !== "live") {
    return publicApiError("Official Robinhood source is temporarily unavailable", 503);
  }

  const asset = snapshot.assets.find((candidate) => candidate.tokenSymbol.toUpperCase() === symbol);
  if (!asset) return publicApiError("Stock Token was not found in the active Robinhood catalog", 404);

  const price = snapshot.prices.find((candidate) => candidate.tokenSymbol.toUpperCase() === symbol);
  const events = snapshot.events
    .filter((event) => event.source === "robinhood" && event.asset.toUpperCase() === symbol)
    .map(publicEvent);

  return publicApiResponse({
    source: "Robinhood Stock Token APIs",
    asset: publicAsset(asset, price),
    corporateActions: events,
  });
}
