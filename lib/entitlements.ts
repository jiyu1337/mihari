import { eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { wallets } from "@/db/schema";
import { getMhrHoldings, type MhrHolding } from "@/lib/map-data";
import {
  FREE_AI_ANALYSES_PER_DAY,
  FREE_LINKED_WALLETS,
  FREE_WATCHLIST_ASSETS,
  HOLDER_AI_ANALYSES_PER_DAY,
  HOLDER_LINKED_WALLETS,
  HOLDER_WATCHLIST_ASSETS,
} from "@/lib/product-limits";

export type ProductEntitlements = {
  tier: "observer" | "holder";
  verification: "verified" | "not_held" | "unavailable";
  mhrBalance: string;
  holderThreshold: string;
  limits: {
    watchlistAssets: number;
    linkedWallets: number;
    aiAnalysesPerDay: number;
  };
  features: {
    directExposure: true;
    officialEvents: true;
    protocolExposure: boolean;
    fullRiskGraph: boolean;
  };
};

function threshold() {
  const configured = process.env.MHR_HOLDER_THRESHOLD?.trim() || "1";
  const parsed = Number(configured);
  return Number.isFinite(parsed) && parsed > 0 ? configured : "1";
}

export function entitlementsFromHoldings(holdings: MhrHolding[]): ProductEntitlements {
  const available = holdings.filter((holding) => holding.balance !== null);
  const total = available.reduce((sum, holding) => sum + Number(holding.balance ?? 0), 0);
  const holderThreshold = threshold();
  const holder = Number.isFinite(total) && total >= Number(holderThreshold);
  const verification = holder
    ? "verified"
    : holdings.length > 0 && available.length === 0
      ? "unavailable"
      : "not_held";

  return {
    tier: holder ? "holder" : "observer",
    verification,
    mhrBalance: Number.isFinite(total) ? total.toString() : "0",
    holderThreshold,
    limits: {
      watchlistAssets: holder ? HOLDER_WATCHLIST_ASSETS : FREE_WATCHLIST_ASSETS,
      linkedWallets: holder ? HOLDER_LINKED_WALLETS : FREE_LINKED_WALLETS,
      aiAnalysesPerDay: holder ? HOLDER_AI_ANALYSES_PER_DAY : FREE_AI_ANALYSES_PER_DAY,
    },
    features: {
      directExposure: true,
      officialEvents: true,
      protocolExposure: holder,
      fullRiskGraph: holder,
    },
  };
}

export async function getAccountEntitlements(accountId: string) {
  const linkedWallets = await getDatabase()
    .select({ address: wallets.address, verified: wallets.verified })
    .from(wallets)
    .where(eq(wallets.accountId, accountId));
  const addresses = linkedWallets.filter((wallet) => wallet.verified).map((wallet) => wallet.address);
  const holdings = addresses.length ? await getMhrHoldings(addresses) : [];
  return entitlementsFromHoldings(holdings);
}

export function mhrRequiredResponse(entitlements: ProductEntitlements) {
  return Response.json({
    error: `Hold at least ${entitlements.holderThreshold} MHR in a verified wallet to unlock this feature.`,
    code: "MHR_REQUIRED",
    entitlements,
  }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
}
