"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Activity,
  ArrowRight,
  FileCheck2,
  Link2,
  LoaderCircle,
  Orbit,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Unlink,
  Wallet,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import type { MappedPosition } from "@/lib/map-data";
import type { CorporateEvent } from "@/lib/product-data";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type ProfileResponse = {
  account: { id: string; email: string | null };
  watchlist: { symbols: string[]; mode: string } | null;
  wallets: Array<{ id: string; address: string; chainId: number; verified: boolean }>;
  exposure: { positions: MappedPosition[]; events: CorporateEvent[]; scannedAt: string };
};

type MapConsoleProps = {
  email: string | null;
  authUnavailable?: boolean;
};

const CHAIN_ID_HEX = "0x1237";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatMoney(value: string | null) {
  if (value === null) return "PRICE UNAVAILABLE";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value));
}

export function MapConsole({ email, authUnavailable = false }: MapConsoleProps) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(!authUnavailable);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (authUnavailable) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile", { cache: "no-store" });
      if (!response.ok) throw new Error(`Profile unavailable (${response.status})`);
      setProfile(await response.json() as ProfileResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Profile unavailable");
    } finally {
      setLoading(false);
    }
  }, [authUnavailable]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadProfile(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadProfile]);

  const totalValue = useMemo(() => profile?.exposure.positions.reduce(
    (total, position) => total + Number(position.valueUsd ?? 0),
    0,
  ) ?? 0, [profile]);
  const exposedPositions = profile?.exposure.positions.filter((position) => position.hasCorporateAction) ?? [];

  async function linkWallet() {
    setError("");
    const provider = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    if (!provider) {
      setError("No EVM wallet detected. Install Robinhood Wallet or another EVM wallet.");
      return;
    }

    setLinking(true);
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

      const challengeResponse = await fetch("/api/wallets/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!challengeResponse.ok) throw new Error("Could not create wallet verification");
      const challenge = await challengeResponse.json() as { nonce: string; message: string };
      const signature = await provider.request({
        method: "personal_sign",
        params: [challenge.message, address],
      }) as string;

      const verifyResponse = await fetch("/api/wallets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, ...challenge }),
      });
      if (!verifyResponse.ok) {
        const result = await verifyResponse.json() as { error?: string };
        throw new Error(result.error ?? "Wallet verification failed");
      }
      await loadProfile();
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "Wallet connection cancelled");
    } finally {
      setLinking(false);
    }
  }

  async function unlinkWallet(walletId: string) {
    setError("");
    const response = await fetch("/api/wallets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId }),
    });
    if (!response.ok) {
      setError("Wallet could not be removed");
      return;
    }
    await loadProfile();
  }

  if (authUnavailable) {
    return (
      <main className="map-unavailable paper-noise">
        <BrandMark />
        <p className="mono">MIHARI MAP / SETUP REQUIRED</p>
        <h1>Personal exposure mapping is ready for authentication.</h1>
        <p>Connect Clerk in Vercel to activate email profiles. Observe mode remains live.</p>
        <Link className="primary-action" href="/launch">Open Observe mode <ArrowRight size={16} /></Link>
      </main>
    );
  }

  return (
    <div className="map-shell">
      <aside className="guardian-sidebar map-sidebar">
        <Link className="console-brand" href="/"><BrandMark inverted /><span>MIHARI</span></Link>
        <nav aria-label="MIHARI product navigation">
          <Link href="/app"><Activity size={17} />Events</Link>
          <Link className="active" href="/map"><Orbit size={17} />Map <small>LIVE</small></Link>
          <Link href="/docs#status"><ShieldCheck size={17} />Guard <small>NEXT</small></Link>
          <Link href="/docs#status"><FileCheck2 size={17} />Proofs <small>NEXT</small></Link>
          <Link href="/launch"><Settings2 size={17} />Setup</Link>
        </nav>
        <div className="map-account">
          <UserButton />
          <span><small className="mono">SIGNED IN</small>{email ?? profile?.account.email ?? "MIHARI USER"}</span>
        </div>
      </aside>

      <main className="map-main paper-noise">
        <header className="map-header">
          <div>
            <p className="mono">PERSONAL EXPOSURE MAP / POSITION INTELLIGENCE</p>
            <h1>What can reach you?</h1>
          </div>
          <button onClick={() => void loadProfile()} disabled={loading}>
            <RefreshCw className={loading ? "spin" : ""} size={15} /> RESCAN
          </button>
        </header>

        {error && <div className="map-error mono">{error}</div>}

        <section className="map-metrics mono">
          <div><span>VERIFIED WALLETS</span><strong>{profile?.wallets.filter((wallet) => wallet.verified).length ?? 0}</strong></div>
          <div><span>STOCK TOKEN POSITIONS</span><strong>{profile?.exposure.positions.length ?? 0}</strong></div>
          <div><span>ACTIVE EXPOSURES</span><strong>{exposedPositions.length}</strong></div>
          <div><span>INDICATIVE VALUE</span><strong>{loading ? "SYNCING" : formatMoney(totalValue.toFixed(2))}</strong></div>
        </section>

        <section className="map-grid">
          <article className="map-wallet-panel">
            <div className="map-panel-head">
              <div><p className="mono">01 / IDENTITY GRAPH</p><h2>Linked wallets</h2></div>
              <button onClick={linkWallet} disabled={linking}>
                {linking ? <LoaderCircle className="spin" size={16} /> : <Link2 size={16} />}
                {linking ? "VERIFYING" : "LINK WALLET"}
              </button>
            </div>
            <p className="map-explainer">A free message signature proves ownership. MIHARI cannot move funds or approve transactions.</p>
            <div className="map-wallet-list">
              {profile?.wallets.length ? profile.wallets.map((wallet) => (
                <div key={wallet.id}>
                  <Wallet size={19} />
                  <span><strong>{shortAddress(wallet.address)}</strong><small className="mono">CHAIN {wallet.chainId} / {wallet.verified ? "VERIFIED" : "PENDING"}</small></span>
                  <button aria-label={`Unlink ${wallet.address}`} onClick={() => void unlinkWallet(wallet.id)}><Unlink size={15} /></button>
                </div>
              )) : (
                <div className="map-empty-row"><Wallet size={20} /><span><strong>No wallet linked</strong><small>Link a wallet to discover personal positions.</small></span></div>
              )}
            </div>
            <div className="map-watchlist">
              <p className="mono">SAVED WATCHLIST / {profile?.watchlist?.symbols.length ?? 0}</p>
              <div>{profile?.watchlist?.symbols.slice(0, 18).map((symbol) => <span className="mono" key={symbol}>{symbol}</span>)}</div>
              <Link href="/launch">Edit monitoring scope <ArrowRight size={14} /></Link>
            </div>
          </article>

          <article className="map-position-panel">
            <div className="map-panel-head">
              <div><p className="mono">02 / ONCHAIN POSITIONS</p><h2>Stock Token holdings</h2></div>
              <span className="mono">BLOCKSCOUT / ROBINHOOD CHAIN</span>
            </div>
            {loading ? (
              <div className="map-loading"><LoaderCircle className="spin" size={25} /><span className="mono">INDEXING POSITIONS</span></div>
            ) : profile?.exposure.positions.length ? (
              <div className="position-table">
                <div className="position-table-head mono"><span>ASSET</span><span>BALANCE</span><span>VALUE</span><span>STATUS</span></div>
                {profile.exposure.positions.map((position) => (
                  <div className={position.hasCorporateAction ? "exposed" : ""} key={`${position.wallet}-${position.contractAddress}`}>
                    <span><strong>{position.symbol}</strong><small>{position.name}</small></span>
                    <span className="mono">{Number(position.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                    <span>{formatMoney(position.valueUsd)}</span>
                    <span className="mono">{position.hasCorporateAction ? "EVENT MATCH" : "MONITORED"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="map-zero-state">
                <Orbit size={30} strokeWidth={1.3} />
                <p className="mono">NO STOCK TOKEN POSITIONS FOUND</p>
                <h3>Your risk map starts when a verified wallet holds Robinhood Stock Tokens.</h3>
                <p>Until then, your saved watchlist continues to monitor official corporate actions.</p>
              </div>
            )}
          </article>
        </section>

        <section className="map-impact-panel">
          <div>
            <p className="mono">03 / EVENT TO POSITION MATCHING</p>
            <h2>Personal impact queue</h2>
          </div>
          {exposedPositions.length ? exposedPositions.map((position) => (
            <div className="impact-row" key={position.contractAddress}>
              <span className="mono">{position.symbol}</span>
              <strong>Corporate action matched to a wallet position</strong>
              <span>{position.balance} tokens</span>
              <Link href="/app">Open Incident File <ArrowRight size={14} /></Link>
            </div>
          )) : (
            <div className="impact-clear">
              <ShieldCheck size={22} />
              <span><strong>No active event touches a mapped position.</strong><small>MIHARI will place a match here when official event data overlaps a verified holding.</small></span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
