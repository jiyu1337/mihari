import { cookies } from "next/headers";

export const WALLET_SESSION_COOKIE = "mihari_wallet_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

export type WalletSession = {
  version: 1;
  accountId: string;
  address: string;
  expiresAt: number;
};

function getSecret() {
  const secret = process.env.WALLET_SESSION_SECRET ?? process.env.CLERK_SECRET_KEY;
  if (!secret) throw new Error("Wallet session secret is not configured");
  return secret;
}

function encode(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return Buffer.from(bytes).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

async function signingKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createWalletSessionToken(accountId: string, address: string) {
  const payload: WalletSession = {
    version: 1,
    accountId,
    address,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };
  const encodedPayload = encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    new TextEncoder().encode(encodedPayload),
  );
  return `${encodedPayload}.${encode(new Uint8Array(signature))}`;
}

export async function verifyWalletSessionToken(token?: string | null): Promise<WalletSession | null> {
  if (!token) return null;
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      Buffer.from(encodedSignature, "base64url"),
      new TextEncoder().encode(encodedPayload),
    );
    if (!valid) return null;
    const payload = JSON.parse(decode(encodedPayload)) as WalletSession;
    if (payload.version !== 1 || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    if (!payload.accountId || !payload.address) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getWalletSession() {
  const cookieStore = await cookies();
  return verifyWalletSessionToken(cookieStore.get(WALLET_SESSION_COOKIE)?.value);
}

export async function setWalletSession(accountId: string, address: string) {
  const cookieStore = await cookies();
  cookieStore.set(WALLET_SESSION_COOKIE, await createWalletSessionToken(accountId, address), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearWalletSession() {
  const cookieStore = await cookies();
  cookieStore.delete(WALLET_SESSION_COOKIE);
}
