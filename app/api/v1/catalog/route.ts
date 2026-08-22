import { getAssetCatalog } from "@/lib/robinhood";
import {
  optionsResponse,
  openPublicApiRequest,
  publicApiError,
  publicApiResponse,
  publicAsset,
  symbolsQuerySchema,
} from "@/lib/public-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const apiRequest = await openPublicApiRequest(request, "/api/v1/catalog");
  if (apiRequest.denied) return apiRequest.denied;
  const parsedSymbols = symbolsQuerySchema.safeParse(new URL(request.url).searchParams.get("symbols") ?? undefined);
  if (!parsedSymbols.success) return publicApiError("Invalid symbols query", 400);

  try {
    const requested = new Set(parsedSymbols.data);
    const catalog = await getAssetCatalog();
    const assets = catalog
      .filter((asset) => !requested.size || requested.has(asset.tokenSymbol.toUpperCase()))
      .map((asset) => publicAsset(asset));

    return publicApiResponse({
      scope: requested.size ? "selected_symbols" : "full_active_catalog",
      source: "Robinhood Stock Token Assets API",
      count: assets.length,
      assets,
    }, { cacheControl: "public, s-maxage=300, stale-while-revalidate=600" });
  } catch {
    return publicApiError("Official Robinhood asset catalog is temporarily unavailable", 503);
  }
}
