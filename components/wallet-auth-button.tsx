"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Wallet } from "lucide-react";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const CHAIN_ID_HEX = "0x1237";

export function WalletAuthButton({ label = "Continue with wallet" }: { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function authenticate() {
    const provider = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    if (!provider) {
      setError("No EVM wallet detected. Install Robinhood Wallet or another EVM wallet.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      const address = accounts[0];
      if (!address) throw new Error("No wallet account returned");

      try {
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID_HEX }] });
      } catch {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: CHAIN_ID_HEX,
            chainName: "Robinhood Chain",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
            blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
          }],
        });
      }

      const challengeResponse = await fetch("/api/auth/wallet/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!challengeResponse.ok) throw new Error("Could not start wallet sign-in");
      const challenge = await challengeResponse.json() as { nonce: string; message: string };
      const signature = await provider.request({
        method: "personal_sign",
        params: [challenge.message, address],
      }) as string;

      const verifyResponse = await fetch("/api/auth/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, ...challenge }),
      });
      if (!verifyResponse.ok) {
        const result = await verifyResponse.json() as { error?: string };
        throw new Error(result.error ?? "Wallet sign-in failed");
      }
      router.push("/map");
      router.refresh();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Wallet sign-in was cancelled");
      setLoading(false);
    }
  }

  return (
    <div className="wallet-auth-control">
      <button type="button" onClick={() => void authenticate()} disabled={loading}>
        {loading ? <LoaderCircle className="spin" size={18} /> : <Wallet size={18} />}
        {loading ? "VERIFYING WALLET" : label}
      </button>
      <small>A free signature creates or opens your MIHARI profile. No gas. No transaction.</small>
      {error ? <p className="mono">{error}</p> : null}
    </div>
  );
}
