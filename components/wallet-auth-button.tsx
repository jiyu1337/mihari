"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Wallet } from "lucide-react";
import { timedFetch, walletRequest, type EthereumProvider } from "@/lib/wallet-client";

type AuthStage = "idle" | "connect" | "sign" | "verify";

const stageLabel: Record<AuthStage, string> = {
  idle: "",
  connect: "APPROVE CONNECTION",
  sign: "SIGN FREE MESSAGE",
  verify: "OPENING PROFILE",
};

export function WalletAuthButton({ label = "Continue with wallet" }: { label?: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<AuthStage>("idle");
  const [error, setError] = useState("");
  const loading = stage !== "idle";

  async function authenticate() {
    const provider = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    if (!provider) {
      setError("No EVM wallet detected. Install Robinhood Wallet or another EVM wallet.");
      return;
    }

    setStage("connect");
    setError("");
    try {
      const accounts = await walletRequest<string[]>(
        provider.request({ method: "eth_requestAccounts" }),
        "Open your wallet extension and approve the connection, then try again.",
      );
      const address = accounts[0];
      if (!address) throw new Error("No wallet account returned");

      const challengeResponse = await timedFetch("/api/auth/wallet/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!challengeResponse.ok) throw new Error("Could not start wallet sign-in");
      const challenge = await challengeResponse.json() as { nonce: string; message: string };
      setStage("sign");
      const signature = await walletRequest<string>(
        provider.request({ method: "personal_sign", params: [challenge.message, address] }),
        "Open your wallet extension and sign the free MIHARI login message, then try again.",
      );

      setStage("verify");
      const verifyResponse = await timedFetch("/api/auth/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, ...challenge }),
      });
      if (!verifyResponse.ok) {
        const result = await verifyResponse.json() as { error?: string };
        throw new Error(result.error ?? "Wallet sign-in failed");
      }
      router.replace("/map");
      router.refresh();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Wallet sign-in was cancelled");
      setStage("idle");
    }
  }

  return (
    <div className="wallet-auth-control">
      <button type="button" onClick={() => void authenticate()} disabled={loading}>
        {loading ? <LoaderCircle className="spin" size={18} /> : <Wallet size={18} />}
        {loading ? stageLabel[stage] : label}
      </button>
      <small>{stage === "connect"
        ? "Open your wallet extension and approve the connection request."
        : stage === "sign"
          ? "Sign the MIHARI login message. It costs no gas and cannot move funds."
          : stage === "verify"
            ? "Signature verified. MIHARI is opening your workspace."
            : "A free signature creates or opens your MIHARI profile. No gas. No transaction."}</small>
      {error ? <p className="mono">{error}</p> : null}
    </div>
  );
}
