import { clearWalletSession } from "@/lib/wallet-session";

export async function POST() {
  await clearWalletSession();
  return Response.json({ ok: true });
}
