import { eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { watchlists } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";
import { getAccountEntitlements } from "@/lib/entitlements";
import { getMarketSnapshot } from "@/lib/robinhood";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const database = getDatabase();
  const [[watchlist], entitlements] = await Promise.all([
    database
      .select({ symbols: watchlists.symbols })
      .from(watchlists)
      .where(eq(watchlists.accountId, account.id))
      .limit(1),
    getAccountEntitlements(account.id),
  ]);
  const symbols = (watchlist?.symbols ?? []).slice(0, entitlements.limits.watchlistAssets);

  if (!symbols.length) {
    return Response.json({ mode: "live", events: [], watchedCount: 0, fetchedAt: new Date().toISOString(), entitlements }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const snapshot = await getMarketSnapshot(symbols);
  const watched = new Set(symbols.map((symbol) => symbol.toUpperCase()));
  return Response.json({
    mode: snapshot.mode,
    events: snapshot.events.filter((event) => watched.has(event.asset.toUpperCase())),
    watchedCount: symbols.length,
    fetchedAt: snapshot.fetchedAt,
    warning: snapshot.warning,
    entitlements,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
