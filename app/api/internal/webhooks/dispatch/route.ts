import { deliverCorporateActionWebhooks } from "@/lib/api-webhooks";
import { getAssetCatalog, getMarketSnapshot } from "@/lib/robinhood";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  return Boolean(expected && supplied && expected === supplied);
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const symbols = (await getAssetCatalog()).map((asset) => asset.tokenSymbol);
    const snapshot = await getMarketSnapshot(symbols);
    if (snapshot.mode !== "live") return Response.json({ error: "Official source unavailable" }, { status: 503 });
    const delivery = await deliverCorporateActionWebhooks(snapshot.events.filter((event) => event.source === "robinhood"));
    return Response.json({ ok: true, events: snapshot.events.length, delivery });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Webhook dispatch failed" }, { status: 500 });
  }
}
