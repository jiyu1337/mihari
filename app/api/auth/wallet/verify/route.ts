import { and, eq, isNull } from "drizzle-orm";
import { getAddress, isAddress, verifyMessage } from "viem";
import { z } from "zod";
import { getDatabase } from "@/db/client";
import { accounts, walletLoginChallenges, wallets } from "@/db/schema";
import { setWalletSession } from "@/lib/wallet-session";

export const runtime = "nodejs";

const verification = z.object({
  address: z.string(),
  nonce: z.string().uuid(),
  message: z.string().min(40).max(2000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

export async function POST(request: Request) {
  const parsed = verification.safeParse(await request.json());
  if (!parsed.success || !isAddress(parsed.data.address)) {
    return Response.json({ error: "Invalid wallet login payload" }, { status: 400 });
  }

  const address = getAddress(parsed.data.address);
  const database = getDatabase();
  const [challenge] = await database.select().from(walletLoginChallenges).where(and(
    eq(walletLoginChallenges.address, address),
    eq(walletLoginChallenges.nonce, parsed.data.nonce),
    isNull(walletLoginChallenges.usedAt),
  )).limit(1);

  if (!challenge || challenge.expiresAt.getTime() < Date.now() || challenge.message !== parsed.data.message) {
    return Response.json({ error: "Wallet login request expired" }, { status: 400 });
  }

  const valid = await verifyMessage({
    address,
    message: parsed.data.message,
    signature: parsed.data.signature as `0x${string}`,
  });
  if (!valid) return Response.json({ error: "Signature verification failed" }, { status: 400 });

  const [existingWallet] = await database.select().from(wallets).where(and(
    eq(wallets.address, address),
    eq(wallets.chainId, 4663),
  )).limit(1);

  let accountId = existingWallet?.accountId ?? null;
  if (!accountId) {
    const [account] = await database.insert(accounts).values({
      authProviderId: `wallet:${address.toLowerCase()}`,
      email: null,
    }).onConflictDoUpdate({
      target: accounts.authProviderId,
      set: { updatedAt: new Date() },
    }).returning();
    accountId = account.id;
    if (existingWallet) {
      await database.update(wallets)
        .set({ accountId, verified: true })
        .where(eq(wallets.id, existingWallet.id));
    } else {
      await database.insert(wallets).values({ accountId, address, chainId: 4663, verified: true });
    }
  }

  await database.update(walletLoginChallenges)
    .set({ usedAt: new Date() })
    .where(eq(walletLoginChallenges.id, challenge.id));
  await setWalletSession(accountId, address);

  return Response.json({ accountId, address });
}
