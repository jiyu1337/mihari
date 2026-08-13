import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDatabase } from "@/db/client";
import { wallets, watchlists } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";
import { mapWalletPositions } from "@/lib/map-data";
import { MAX_WATCHLIST_ASSETS } from "@/lib/product-limits";

export const runtime = "nodejs";

const profileUpdate = z.object({
  symbols: z.array(z.string().trim().min(1).max(16)).max(MAX_WATCHLIST_ASSETS),
  mode: z.enum(["observe", "guard", "automate"]).default("observe"),
});

export async function GET() {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const database = getDatabase();
  const [savedWatchlist, savedWallets] = await Promise.all([
    database.select().from(watchlists).where(eq(watchlists.accountId, account.id)).limit(1),
    database.select().from(wallets).where(eq(wallets.accountId, account.id)),
  ]);
  const verifiedAddresses = savedWallets.filter((wallet) => wallet.verified).map((wallet) => wallet.address);
  const exposure = await mapWalletPositions(verifiedAddresses).catch(() => ({
    positions: [],
    events: [],
    mhrHoldings: [],
    scannedAt: new Date().toISOString(),
  }));

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
      ? { ...savedWatchlist[0], symbols: savedWatchlist[0].symbols.slice(0, MAX_WATCHLIST_ASSETS) }
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
      scannedAt: exposure.scannedAt,
    },
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
