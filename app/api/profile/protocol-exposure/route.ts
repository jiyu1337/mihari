import { eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { wallets, watchlists } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";
import { getAccountEntitlements, mhrRequiredResponse } from "@/lib/entitlements";
import {
  scanProtocolExposure,
  type ProtocolExposureSnapshot,
} from "@/lib/protocol-exposure";
import {
  protocolAdapters,
  protocolCatalog,
  protocolScansWithCoverage,
} from "@/lib/protocols/registry";
import { getAssetCatalog, getMarketSnapshot } from "@/lib/robinhood";
import { scanProtocolMarkets } from "@/lib/protocol-markets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emptySnapshot(): ProtocolExposureSnapshot {
  return {
    positions: [],
    scans: protocolScansWithCoverage([], false),
    scannedAt: new Date().toISOString(),
  };
}

export async function GET() {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const entitlements = await getAccountEntitlements(account.id);
  if (!entitlements.features.protocolExposure) return mhrRequiredResponse(entitlements);

  const linkedWallets = await getDatabase()
    .select({ address: wallets.address, verified: wallets.verified })
    .from(wallets)
    .where(eq(wallets.accountId, account.id));
  const verifiedAddresses = linkedWallets
    .filter((wallet) => wallet.verified)
    .map((wallet) => wallet.address);

  if (!verifiedAddresses.length) {
    return Response.json({
      ...emptySnapshot(),
      events: [],
      marketScan: { status: "not_scanned", markets: [], scans: [] },
      source: {
        chainId: 4663,
        assetCatalog: "robinhood",
        corporateActions: "not_scanned",
        protocols: protocolCatalog.map((protocol) => protocol.id),
      },
      protocolCatalog,
      entitlements,
    }, { headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    const assets = await getAssetCatalog();
    const [savedWatchlist] = await getDatabase()
      .select({ symbols: watchlists.symbols })
      .from(watchlists)
      .where(eq(watchlists.accountId, account.id))
      .limit(1);
    const [exposure, marketScan] = await Promise.all([
      scanProtocolExposure(verifiedAddresses, assets, protocolAdapters),
      scanProtocolMarkets(assets, savedWatchlist?.symbols ?? []),
    ]);
    const symbols = [...new Set(exposure.positions.map((position) => position.symbol.toUpperCase()))];
    const market = symbols.length ? await getMarketSnapshot(symbols) : null;
    const liveEvents = market?.mode === "live" ? market.events : [];
    const eventBySymbol = new Map(liveEvents.map((event) => [event.asset.toUpperCase(), event]));
    const priceBySymbol = new Map((market?.mode === "live" ? market.prices : []).map((price) => [
      price.tokenSymbol.toUpperCase(),
      (Number(price.bid) + Number(price.ask)) / 2,
    ]));
    const positions = exposure.positions.map((position) => {
      const event = eventBySymbol.get(position.symbol.toUpperCase());
      const price = priceBySymbol.get(position.symbol.toUpperCase());
      const calculatedValue = position.valueUsd === null && Number.isFinite(price)
        ? Number(position.amount) * Number(price)
        : null;
      return {
        ...position,
        valueUsd: position.valueUsd ?? (calculatedValue === null ? null : calculatedValue.toFixed(2)),
        hasCorporateAction: Boolean(event),
        corporateAction: event ? {
          id: event.id,
          type: event.type,
          status: event.sourceStatus,
          severity: event.severity,
        } : null,
      };
    });

    return Response.json({
      ...exposure,
      positions,
      scans: protocolScansWithCoverage(exposure.scans, true),
      events: liveEvents,
      marketScan,
      source: {
        chainId: 4663,
        assetCatalog: "robinhood",
        corporateActions: market?.mode ?? "not_scanned",
        protocols: protocolCatalog.map((protocol) => protocol.id),
      },
      protocolCatalog,
      entitlements,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({
      error: "Protocol exposure scan unavailable",
      warning: error instanceof Error ? error.message : "Unknown protocol scan error",
    }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
