import { eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { wallets } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";
import {
  scanProtocolExposure,
  type ProtocolExposureSnapshot,
} from "@/lib/protocol-exposure";
import { morphoAdapter } from "@/lib/protocols/morpho";
import { getAssetCatalog, getMarketSnapshot } from "@/lib/robinhood";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emptySnapshot(): ProtocolExposureSnapshot {
  return {
    positions: [],
    scans: [{ protocol: morphoAdapter.id, status: "not_scanned", positionCount: 0 }],
    scannedAt: new Date().toISOString(),
  };
}

export async function GET() {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Unauthorized" }, { status: 401 });

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
      source: {
        chainId: 4663,
        assetCatalog: "robinhood",
        corporateActions: "not_scanned",
        protocols: [morphoAdapter.id],
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    const assets = await getAssetCatalog();
    const exposure = await scanProtocolExposure(verifiedAddresses, assets, [morphoAdapter]);
    const symbols = [...new Set(exposure.positions.map((position) => position.symbol.toUpperCase()))];
    const market = symbols.length ? await getMarketSnapshot(symbols) : null;
    const liveEvents = market?.mode === "live" ? market.events : [];
    const eventBySymbol = new Map(liveEvents.map((event) => [event.asset.toUpperCase(), event]));
    const positions = exposure.positions.map((position) => {
      const event = eventBySymbol.get(position.symbol.toUpperCase());
      return {
        ...position,
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
      events: liveEvents,
      source: {
        chainId: 4663,
        assetCatalog: "robinhood",
        corporateActions: market?.mode ?? "not_scanned",
        protocols: [morphoAdapter.id],
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({
      error: "Protocol exposure scan unavailable",
      warning: error instanceof Error ? error.message : "Unknown protocol scan error",
    }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
