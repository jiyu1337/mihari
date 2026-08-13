import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { accounts, wallets, watchlists } from "@/db/schema";
import { getDatabase } from "@/db/client";
import { isClerkConfigured } from "@/lib/auth-config";
import { getWalletSession, setWalletSession } from "@/lib/wallet-session";

export type MihariAccount = typeof accounts.$inferSelect;

export async function getAuthenticatedAccount(): Promise<MihariAccount | null> {
  const walletSession = await getWalletSession();

  if (isClerkConfigured()) {
    const { userId } = await auth();
    if (userId) {
      const database = getDatabase();
      const [existing] = await database
        .select()
        .from(accounts)
        .where(eq(accounts.authProviderId, userId))
        .limit(1);

      const user = await currentUser();
      const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null;

      if (existing) {
        if (walletSession && walletSession.accountId !== existing.id) {
          const [targetWatchlist, sourceWatchlist] = await Promise.all([
            database.select().from(watchlists).where(eq(watchlists.accountId, existing.id)).limit(1),
            database.select().from(watchlists).where(eq(watchlists.accountId, walletSession.accountId)).limit(1),
          ]);
          await database.update(wallets)
            .set({ accountId: existing.id })
            .where(eq(wallets.accountId, walletSession.accountId));
          if (!targetWatchlist[0] && sourceWatchlist[0]) {
            await database.update(watchlists)
              .set({ accountId: existing.id, updatedAt: new Date() })
              .where(eq(watchlists.id, sourceWatchlist[0].id));
          } else if (sourceWatchlist[0]) {
            await database.delete(watchlists).where(eq(watchlists.id, sourceWatchlist[0].id));
          }
          await database.delete(accounts).where(eq(accounts.id, walletSession.accountId));
          await setWalletSession(existing.id, walletSession.address);
        }
        if (existing.email !== email) {
          const [updated] = await database.update(accounts)
            .set({ email, updatedAt: new Date() })
            .where(eq(accounts.id, existing.id))
            .returning();
          return updated;
        }
        return existing;
      }

      if (walletSession) {
        const [linked] = await database.update(accounts)
          .set({ authProviderId: userId, email, updatedAt: new Date() })
          .where(eq(accounts.id, walletSession.accountId))
          .returning();
        if (linked) return linked;
      }

      const [created] = await database
        .insert(accounts)
        .values({ authProviderId: userId, email })
        .onConflictDoUpdate({
          target: accounts.authProviderId,
          set: { email, updatedAt: new Date() },
        })
        .returning();

      return created;
    }
  }

  if (!walletSession) return null;

  const [account] = await getDatabase()
    .select()
    .from(accounts)
    .where(eq(accounts.id, walletSession.accountId))
    .limit(1);
  return account ?? null;
}
