import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { wallets } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";

export async function DELETE(request: Request) {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { walletId } = await request.json() as { walletId?: string };
  if (!walletId) return Response.json({ error: "Wallet ID is required" }, { status: 400 });

  await getDatabase().delete(wallets).where(and(
    eq(wallets.id, walletId),
    eq(wallets.accountId, account.id),
  ));
  return Response.json({ removed: true });
}
