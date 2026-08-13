import { randomUUID } from "node:crypto";
import { getAddress, isAddress } from "viem";
import { getDatabase } from "@/db/client";
import { walletLoginChallenges } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json() as { address?: string };
  if (!body.address || !isAddress(body.address)) {
    return Response.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const address = getAddress(body.address);
  const nonce = randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const domain = new URL(request.url).host;
  const message = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    "Sign in to MIHARI. This signature is free and does not authorize a transaction.",
    "",
    `URI: https://${domain}`,
    "Version: 1",
    "Chain ID: 4663",
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
    `Expiration Time: ${expiresAt.toISOString()}`,
  ].join("\n");

  await getDatabase().insert(walletLoginChallenges).values({ address, nonce, message, expiresAt });
  return Response.json({ nonce, message, expiresAt: expiresAt.toISOString() });
}
