import { and, eq, isNull } from "drizzle-orm";
import { getAddress, isAddress, verifyMessage } from "viem";
import { z } from "zod";
import { getDatabase } from "@/db/client";
import { walletChallenges, wallets } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";

export const runtime = "nodejs";

const verification = z.object({
  address: z.string(),
  nonce: z.string().uuid(),
  message: z.string().min(20).max(1000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

export async function POST(request: Request) {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = verification.safeParse(await request.json());
  if (!parsed.success || !isAddress(parsed.data.address)) {
    return Response.json({ error: "Invalid verification payload" }, { status: 400 });
  }

  const address = getAddress(parsed.data.address);
  const database = getDatabase();
  const [challenge] = await database.select().from(walletChallenges).where(and(
    eq(walletChallenges.accountId, account.id),
    eq(walletChallenges.address, address),
    eq(walletChallenges.nonce, parsed.data.nonce),
    isNull(walletChallenges.usedAt),
  )).limit(1);

  if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
    return Response.json({ error: "Verification request expired" }, { status: 400 });
  }
  if (!parsed.data.message.includes(`Nonce: ${challenge.nonce}`)) {
    return Response.json({ error: "Verification message does not match" }, { status: 400 });
  }

  const valid = await verifyMessage({
    address,
    message: parsed.data.message,
    signature: parsed.data.signature as `0x${string}`,
  });
  if (!valid) return Response.json({ error: "Signature verification failed" }, { status: 400 });

  const [owner] = await database.select().from(wallets).where(and(
    eq(wallets.address, address),
    eq(wallets.chainId, 4663),
  )).limit(1);
  if (owner && owner.accountId !== account.id) {
    return Response.json({ error: "This wallet is already linked to another MIHARI profile" }, { status: 409 });
  }

  await database.update(walletChallenges)
    .set({ usedAt: new Date() })
    .where(eq(walletChallenges.id, challenge.id));

  const [wallet] = owner
    ? await database.update(wallets).set({ verified: true }).where(eq(wallets.id, owner.id)).returning()
    : await database.insert(wallets).values({ accountId: account.id, address, chainId: 4663, verified: true }).returning();

  return Response.json({ wallet });
}
