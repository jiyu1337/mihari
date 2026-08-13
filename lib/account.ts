import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { accounts } from "@/db/schema";
import { getDatabase } from "@/db/client";
import { isClerkConfigured } from "@/lib/auth-config";

export type MihariAccount = typeof accounts.$inferSelect;

export async function getAuthenticatedAccount(): Promise<MihariAccount | null> {
  if (!isClerkConfigured()) return null;

  const { userId } = await auth();
  if (!userId) return null;

  const database = getDatabase();
  const [existing] = await database
    .select()
    .from(accounts)
    .where(eq(accounts.authProviderId, userId))
    .limit(1);

  if (existing) return existing;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null;
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
