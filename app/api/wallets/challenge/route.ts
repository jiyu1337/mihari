import { randomUUID } from "node:crypto";
import { getAddress, isAddress } from "viem";
import { getDatabase } from "@/db/client";
import { walletChallenges } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const account = await getAuthenticatedAccount();
  if (!account) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { address?: string };
  if (!body.address || !isAddress(body.address)) {
    return Response.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const address = getAddress(body.address);
  const nonce = randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const message = [
    "MIHARI wallet verification",
    "",
    `Address: ${address}`,
    "Network: Robinhood Chain (4663)",
    `Nonce: ${nonce}`,
    `Expires: ${expiresAt.toISOString()}`,
    "",
    "This signature is free and does not authorize a transaction.",
  ].join("\n");

  await getDatabase().insert(walletChallenges).values({
    accountId: account.id,
    address,
    nonce,
    expiresAt,
  });

  return Response.json({ nonce, message, expiresAt: expiresAt.toISOString() });
}
