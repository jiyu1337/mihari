import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/db/client";
import { wallets, watchlists } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";
import { entitlementsFromHoldings, getAccountEntitlements } from "@/lib/entitlements";
import { mapWalletPositions } from "@/lib/map-data";
import { MAX_WATCHLIST_ASSETS } from "@/lib/product-limits";

export const runtime = "nodejs";

const profileUpdate = z.object({
  symbols: z.array(z.string().trim().min(1).max(16)).max(MAX_WATCHLIST_ASSETS),
  mode: z.enum(["observe", "guard", "automate"]).default("observe"),
});

export async function GET(request: Request) {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const database = getDatabase();
  const [savedWatchlist, savedWallets] = await Promise.all([
    database.select().from(watchlists).where(eq(watchlists.accountId, account.id)).limit(1),
    database.select().from(wallets).where(eq(wallets.accountId, account.id)),
  ]);
  const verifiedAddresses = savedWallets.filter((wallet) => wallet.verified).map((wallet) => wallet.address);
  const quick = new URL(request.url).searchParams.get("quick") === "1";
  if (quick) {
    const pendingHoldings = verifiedAddresses.map((wallet) => ({
      wallet,
      balance: null,
      status: "unavailable" as const,
    }));
    const entitlements = entitlementsFromHoldings(pendingHoldings);
    return Response.json({
      account: {
        id: account.id,
        email: account.email,
        primaryMethod: account.authProviderId.startsWith("wallet:") ? "wallet" : "email",
      },
      watchlist: savedWatchlist[0]
        ? {
            ...savedWatchlist[0],
            symbols: savedWatchlist[0].symbols.slice(0, entitlements.limits.watchlistAssets),
            storedCount: savedWatchlist[0].symbols.length,
          }
        : null,
      wallets: savedWallets.map((wallet) => ({
        ...wallet,
        mhr: {
          wallet: wallet.address,
          balance: null,
          status: wallet.verified ? "unavailable" as const : "not_held" as const,
        },
      })),
      exposure: { positions: [], events: [], sourceStatus: "pending", scannedAt: new Date().toISOString() },
      entitlements,
      hydration: "pending",
    }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const exposure = await mapWalletPositions(verifiedAddresses).catch(() => ({
    positions: [],
    events: [],
    mhrHoldings: verifiedAddresses.map((wallet) => ({
      wallet,
      balance: null,
      status: "unavailable" as const,
    })),
    sourceStatus: "unavailable" as const,
    warning: "Robinhood Chain RPC scan unavailable",
    scannedAt: new Date().toISOString(),
  }));
  const entitlements = entitlementsFromHoldings(exposure.mhrHoldings);

  const mhrByWallet = new Map(
    exposure.mhrHoldings.map((holding) => [holding.wallet.toLowerCase(), holding]),
  );

  return Response.json({
    account: {
      id: account.id,
      email: account.email,
      primaryMethod: account.authProviderId.startsWith("wallet:") ? "wallet" : "email",
    },
    watchlist: savedWatchlist[0]
      ? {
          ...savedWatchlist[0],
          symbols: savedWatchlist[0].symbols.slice(0, entitlements.limits.watchlistAssets),
          storedCount: savedWatchlist[0].symbols.length,
        }
      : null,
    wallets: savedWallets.map((wallet) => ({
      ...wallet,
      mhr: mhrByWallet.get(wallet.address.toLowerCase()) ?? {
        wallet: wallet.address,
        balance: null,
        status: wallet.verified ? "unavailable" : "not_held",
      },
    })),
    exposure: {
      positions: exposure.positions,
      events: exposure.events,
      sourceStatus: exposure.sourceStatus,
      warning: exposure.warning,
      scannedAt: exposure.scannedAt,
    },
    entitlements,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = profileUpdate.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({
      error: `A monitoring scope can contain up to ${MAX_WATCHLIST_ASSETS} assets.`,
    }, { status: 400 });
  }

  const symbols = [...new Set(parsed.data.symbols.map((symbol) => symbol.toUpperCase()))];
  const entitlements = await getAccountEntitlements(account.id);
  if (symbols.length > entitlements.limits.watchlistAssets) {
    return Response.json({
      error: entitlements.tier === "holder"
        ? `Your Holder access supports up to ${entitlements.limits.watchlistAssets} monitored assets.`
        : `Observer profiles can monitor up to ${entitlements.limits.watchlistAssets} assets. Hold at least ${entitlements.holderThreshold} MHR in a verified wallet to unlock 30.`,
      code: "WATCHLIST_LIMIT",
      entitlements,
    }, { status: 403 });
  }
  const database = getDatabase();
  const [existing] = await database
    .select({ id: watchlists.id })
    .from(watchlists)
    .where(eq(watchlists.accountId, account.id))
    .limit(1);

  const [watchlist] = existing
    ? await database.update(watchlists)
        .set({ symbols, mode: parsed.data.mode, updatedAt: new Date() })
        .where(and(eq(watchlists.id, existing.id), eq(watchlists.accountId, account.id)))
        .returning()
    : await database.insert(watchlists)
        .values({ accountId: account.id, symbols, mode: parsed.data.mode })
        .returning();

  return Response.json({ watchlist });
}
