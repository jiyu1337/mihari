import { getMarketSnapshot } from "@/lib/robinhood";
import {
  eventIdSchema,
  openPublicApiRequest,
  optionsResponse,
  publicApiError,
  publicApiResponse,
  publicEventAnalysis,
  symbolSchema,
} from "@/lib/public-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request, { params }: RouteContext) {
  const apiRequest = await openPublicApiRequest(request, "/api/v1/events/{eventId}/analysis");
  if (apiRequest.denied) return apiRequest.denied;
  const [routeParams, url] = await Promise.all([params, Promise.resolve(new URL(request.url))]);
  const parsedEventId = eventIdSchema.safeParse(routeParams.eventId);
  const parsedSymbol = symbolSchema.safeParse(url.searchParams.get("symbol"));

  if (!parsedEventId.success || !parsedSymbol.success) {
    return publicApiError("Provide a valid event id and symbol query", 400);
  }

  const snapshot = await getMarketSnapshot([parsedSymbol.data]);
  if (snapshot.mode !== "live") {
    return publicApiError("Official Robinhood source is temporarily unavailable", 503);
  }

  const event = snapshot.events.find(
    (candidate) => candidate.id === parsedEventId.data
      && candidate.asset.toUpperCase() === parsedSymbol.data
      && candidate.source === "robinhood"
      && Boolean(candidate.sourcePayload),
  );

  if (!event) return publicApiError("Official corporate action was not found", 404);

  return publicApiResponse(await publicEventAnalysis(event));
}
