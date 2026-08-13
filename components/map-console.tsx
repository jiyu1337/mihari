"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Check,
  CircleUserRound,
  Copy,
  ExternalLink,
  FileCheck2,
  Link2,
  ListFilter,
  LoaderCircle,
  Orbit,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Unlink,
  Wallet,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ProfileSignOut } from "@/components/profile-sign-out";
import type { MappedPosition } from "@/lib/map-data";
import type { CorporateEvent } from "@/lib/product-data";
import type { RobinhoodAsset } from "@/lib/robinhood";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type ProfileResponse = {
  account: { id: string; email: string | null; primaryMethod: "email" | "wallet" };
  watchlist: { symbols: string[]; mode: string } | null;
  wallets: Array<{ id: string; address: string; chainId: number; verified: boolean }>;
  exposure: { positions: MappedPosition[]; events: CorporateEvent[]; scannedAt: string };
};

type WorkspaceView = "overview" | "assets" | "wallets" | "exposure" | "settings";
type MapConsoleProps = { authUnavailable?: boolean };

const CHAIN_ID_HEX = "0x1237";
const workspaceNavigation = [
  { id: "overview", label: "Overview", icon: Orbit },
  { id: "assets", label: "Assets", icon: ListFilter },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "exposure", label: "Exposure", icon: ShieldCheck },
  { id: "settings", label: "Profile", icon: Settings2 },
] as const;

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function cleanAssetName(name: string) {
  return name.replace(" • Robinhood Token", "");
}

function formatMoney(value: string | null) {
  if (value === null) return "PRICE UNAVAILABLE";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function MapConsole({ authUnavailable = false }: MapConsoleProps) {
  const [view, setView] = useState<WorkspaceView>("overview");
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [assets, setAssets] = useState<RobinhoodAsset[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!authUnavailable);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copiedContract, setCopiedContract] = useState("");

  const loadWorkspace = useCallback(async () => {
    if (authUnavailable) return;
    setLoading(true);
    setError("");
    try {
      const [profileResponse, assetResponse] = await Promise.all([
        fetch("/api/profile", { cache: "no-store" }),
        fetch("/api/assets", { cache: "force-cache" }),
      ]);
      if (!profileResponse.ok) throw new Error(`Profile unavailable (${profileResponse.status})`);
      const nextProfile = await profileResponse.json() as ProfileResponse;
      setProfile(nextProfile);
      setSelectedSymbols(nextProfile.watchlist?.symbols ?? []);
      if (assetResponse.ok) {
        const assetPayload = await assetResponse.json() as { assets: RobinhoodAsset[] };
        setAssets(assetPayload.assets);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Workspace unavailable");
    } finally {
      setLoading(false);
    }
  }, [authUnavailable]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadWorkspace(), 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  const selectedSet = useMemo(() => new Set(selectedSymbols), [selectedSymbols]);
  const visibleAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return assets;
    return assets.filter((asset) => `${asset.tokenSymbol} ${asset.tokenName}`.toLowerCase().includes(query));
  }, [assets, search]);
  const totalValue = useMemo(() => profile?.exposure.positions.reduce(
    (total, position) => total + Number(position.valueUsd ?? 0),
    0,
  ) ?? 0, [profile]);
  const exposedPositions = profile?.exposure.positions.filter((position) => position.hasCorporateAction) ?? [];
  const allSelected = assets.length > 0 && assets.every((asset) => selectedSet.has(asset.tokenSymbol));

  async function saveAssets() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: selectedSymbols, mode: "observe" }),
      });
      if (!response.ok) throw new Error("Watchlist could not be saved");
      setProfile((current) => current ? {
        ...current,
        watchlist: { symbols: selectedSymbols, mode: "observe" },
      } : current);
      setNotice(`${selectedSymbols.length} assets are now monitored by your profile.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Watchlist could not be saved");
    } finally {
      setSaving(false);
    }
  }

  function toggleAsset(symbol: string) {
    setSelectedSymbols((current) => current.includes(symbol)
      ? current.filter((item) => item !== symbol)
      : [...current, symbol]);
  }

  async function copyContract(address: string) {
    await navigator.clipboard.writeText(address);
    setCopiedContract(address);
    window.setTimeout(() => setCopiedContract((current) => current === address ? "" : current), 1600);
  }

  async function linkWallet() {
    setError("");
    setNotice("");
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
      setNotice(`${shortAddress(address)} is now linked and verified.`);
      await loadWorkspace();
      setView("wallets");
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "Wallet connection cancelled");
    } finally {
      setLinking(false);
    }
  }

  async function unlinkWallet(walletId: string) {
    const response = await fetch("/api/wallets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      setError(result.error ?? "Wallet could not be removed");
      return;
    }
    await loadWorkspace();
  }

  if (authUnavailable) {
    return (
      <main className="map-unavailable paper-noise">
        <BrandMark />
        <p className="mono">MIHARI WORKSPACE / SETUP REQUIRED</p>
        <h1>Personal exposure mapping is ready for authentication.</h1>
        <Link className="primary-action" href="/launch">Open Observe mode <ArrowRight size={16} /></Link>
      </main>
    );
  }

  return (
    <div className="workspace-shell paper-noise">
      <header className="workspace-header">
        <Link className="workspace-brand" href="/"><BrandMark /><span>MIHARI</span><small className="mono">PERSONAL WORKSPACE</small></Link>
        <nav aria-label="Personal workspace navigation">
          {workspaceNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <button className={view === item.id ? "active" : ""} key={item.id} onClick={() => setView(item.id)}>
                <Icon size={15} />{item.label}
              </button>
            );
          })}
        </nav>
        <ProfileSignOut />
      </header>

      <main className="workspace-main">
        <section className="workspace-identity-bar mono">
          <span>PROFILE <strong>{profile?.account.primaryMethod === "wallet" ? "WALLET-NATIVE" : "EMAIL"}</strong></span>
          <span>NETWORK <strong>ROBINHOOD CHAIN / 4663</strong></span>
          <span>LAST SCAN <strong>{profile?.exposure.scannedAt ? new Date(profile.exposure.scannedAt).toLocaleTimeString() : "PENDING"}</strong></span>
          <button onClick={() => void loadWorkspace()} disabled={loading}><RefreshCw className={loading ? "spin" : ""} size={14} />RESCAN</button>
        </section>

        {error ? <div className="workspace-message error mono">{error}</div> : null}
        {notice ? <div className="workspace-message success mono">{notice}</div> : null}

        {view === "overview" ? (
          <section className="workspace-view">
            <div className="workspace-title">
              <div><p className="mono">01 / PERSONAL CONTROL ROOM</p><h1>Your assets. Your exposure.</h1></div>
              <p>MIHARI connects your saved monitoring scope with verified onchain positions and official corporate-action data.</p>
            </div>
            <div className="workspace-metrics mono">
              <div><span>MONITORED ASSETS</span><strong>{profile?.watchlist?.symbols.length ?? 0}</strong></div>
              <div><span>VERIFIED WALLETS</span><strong>{profile?.wallets.length ?? 0}</strong></div>
              <div><span>STOCK TOKEN POSITIONS</span><strong>{profile?.exposure.positions.length ?? 0}</strong></div>
              <div className={exposedPositions.length ? "alert" : ""}><span>ACTIVE EXPOSURES</span><strong>{exposedPositions.length}</strong></div>
            </div>
            <div className="workspace-overview-grid">
              <article>
                <header><span className="mono">MONITORING SCOPE</span><button onClick={() => setView("assets")}>MANAGE <ArrowRight size={13} /></button></header>
                <div className="workspace-chip-list">
                  {profile?.watchlist?.symbols.length ? profile.watchlist.symbols.map((symbol) => <span className="mono" key={symbol}>{symbol}</span>) : <p>No assets selected yet.</p>}
                </div>
              </article>
              <article>
                <header><span className="mono">LINKED IDENTITIES</span><button onClick={() => setView("wallets")}>MANAGE <ArrowRight size={13} /></button></header>
                <div className="workspace-wallet-preview">
                  {profile?.wallets.length ? profile.wallets.map((wallet) => <p key={wallet.id}><Wallet size={17} /><strong>{shortAddress(wallet.address)}</strong><span className="mono">VERIFIED</span></p>) : <p><Wallet size={17} /><strong>No wallet linked</strong></p>}
                </div>
              </article>
            </div>
            <div className="workspace-impact-summary">
              <header><div><p className="mono">AI AGENT / EVENT MATCHING</p><h2>Personal impact queue</h2></div><button onClick={() => setView("exposure")}>OPEN EXPOSURE <ArrowRight size={14} /></button></header>
              {exposedPositions.length ? exposedPositions.map((position) => (
                <div className="impact-row" key={position.contractAddress}><span className="mono">{position.symbol}</span><strong>Corporate action matched to your position</strong><span>{position.balance} tokens</span><Link href="/app">Open Incident File</Link></div>
              )) : <div className="impact-clear"><ShieldCheck size={22} /><span><strong>No active event touches a mapped position.</strong><small>Your monitored assets remain active in the background.</small></span></div>}
            </div>
          </section>
        ) : null}

        {view === "assets" ? (
          <section className="workspace-view">
            <div className="workspace-title compact"><div><p className="mono">02 / ASSET MANAGER</p><h1>Assets and contracts.</h1></div><p>Select the Stock Tokens your profile should watch and verify every official Robinhood Chain contract from the same live catalog.</p></div>
            <div className="workspace-asset-toolbar">
              <label><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search symbol or company" /></label>
              <span className="mono">{selectedSymbols.length} SELECTED / {assets.length} LIVE</span>
              <button onClick={() => setSelectedSymbols(allSelected ? [] : assets.map((asset) => asset.tokenSymbol))}>{allSelected ? "CLEAR ALL" : "SELECT ALL"}</button>
              <button className="save" onClick={() => void saveAssets()} disabled={saving}>{saving ? "SAVING" : "SAVE SCOPE"}</button>
            </div>
            <div className="workspace-asset-grid">
              {visibleAssets.map((asset) => {
                const selected = selectedSet.has(asset.tokenSymbol);
                const deployment = asset.deployments.find((item) => item.chainId === 4663) ?? asset.deployments[0];
                const contractAddress = deployment?.contractAddress ?? "";
                return (
                  <article className={selected ? "selected" : ""} key={asset.id ?? asset.tokenSymbol}>
                    <button className="workspace-asset-select" type="button" aria-pressed={selected} onClick={() => toggleAsset(asset.tokenSymbol)}>
                      <span>{selected ? <Check size={15} /> : "+"}</span>
                      <strong>{asset.tokenSymbol}</strong>
                      <small>{cleanAssetName(asset.tokenName)}</small>
                      <i className="mono">{selected ? "MONITORED" : "NOT MONITORED"}</i>
                    </button>
                    <div className="workspace-contract-row">
                      <span><small className="mono">CONTRACT / CHAIN {deployment?.chainId ?? 4663}</small><code title={contractAddress}>{contractAddress || "NOT PUBLISHED"}</code></span>
                      {contractAddress ? (
                        <span className="workspace-contract-actions">
                          <button type="button" title="Copy contract address" aria-label={`Copy ${asset.tokenSymbol} contract address`} onClick={() => void copyContract(contractAddress)}>
                            {copiedContract === contractAddress ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          <a href={`https://robinhoodchain.blockscout.com/address/${contractAddress}`} target="_blank" rel="noreferrer" title="Open contract in Blockscout" aria-label={`Open ${asset.tokenSymbol} contract in Blockscout`}>
                            <ExternalLink size={14} />
                          </a>
                        </span>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {view === "wallets" ? (
          <section className="workspace-view">
            <div className="workspace-title compact"><div><p className="mono">03 / IDENTITY GRAPH</p><h1>Wallets.</h1></div><p>Verify one or more EVM wallets. MIHARI reads Stock Token balances but cannot move funds or request token approvals.</p></div>
            <div className="workspace-action-row"><button onClick={() => void linkWallet()} disabled={linking}>{linking ? <LoaderCircle className="spin" size={16} /> : <Link2 size={16} />}{linking ? "VERIFYING" : "LINK ANOTHER WALLET"}</button></div>
            <div className="workspace-wallet-grid">
              {profile?.wallets.length ? profile.wallets.map((wallet) => (
                <article key={wallet.id}><Wallet size={25} /><span className="mono">VERIFIED IDENTITY</span><h2>{shortAddress(wallet.address)}</h2><p className="mono">ROBINHOOD CHAIN / {wallet.chainId}</p><button onClick={() => void unlinkWallet(wallet.id)}><Unlink size={14} />UNLINK</button></article>
              )) : <div className="workspace-empty"><Wallet size={30} /><h2>No verified wallet yet.</h2><p>Link a wallet to discover your Robinhood Stock Token positions.</p></div>}
            </div>
          </section>
        ) : null}

        {view === "exposure" ? (
          <section className="workspace-view">
            <div className="workspace-title compact"><div><p className="mono">04 / POSITION INTELLIGENCE</p><h1>Exposure.</h1></div><p>Live holdings from Robinhood Chain are matched against official corporate-action records.</p></div>
            <div className="workspace-value-band"><span className="mono">INDICATIVE STOCK TOKEN VALUE</span><strong>{formatMoney(totalValue.toFixed(2))}</strong></div>
            {profile?.exposure.positions.length ? <div className="workspace-position-table"><header className="mono"><span>ASSET</span><span>BALANCE</span><span>VALUE</span><span>EVENT STATUS</span></header>{profile.exposure.positions.map((position) => <div className={position.hasCorporateAction ? "exposed" : ""} key={`${position.wallet}-${position.contractAddress}`}><span><strong>{position.symbol}</strong><small>{position.name}</small></span><span className="mono">{Number(position.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span><span>{formatMoney(position.valueUsd)}</span><span className="mono">{position.hasCorporateAction ? "ACTION MATCH" : "CLEAR"}</span></div>)}</div> : <div className="workspace-empty"><Orbit size={30} /><h2>No Stock Token positions found.</h2><p>Your saved watchlist continues monitoring even when a linked wallet has no position.</p></div>}
          </section>
        ) : null}

        {view === "settings" ? (
          <section className="workspace-view">
            <div className="workspace-title compact"><div><p className="mono">05 / PROFILE CONTROL</p><h1>Your profile.</h1></div><p>Manage the identities that open this workspace. Add email to a wallet-native profile or link wallets to an email profile.</p></div>
            <div className="workspace-profile-grid">
              <article><CircleUserRound size={25} /><span className="mono">PRIMARY ACCESS</span><h2>{profile?.account.primaryMethod === "wallet" ? "Wallet signature" : "Email code"}</h2><p>{profile?.account.email ?? profile?.wallets[0]?.address ?? "MIHARI profile"}</p></article>
              <article><Activity size={25} /><span className="mono">ADD ACCESS METHOD</span><h2>{profile?.account.email ? "Email connected" : "Add recovery email"}</h2><p>{profile?.account.email ? "You can access this profile by email and linked wallet." : "Connect email access without losing this wallet profile."}</p>{profile?.account.email ? <button onClick={() => setView("wallets")}>MANAGE WALLETS</button> : <Link href="/sign-in?redirect_url=/map">ADD EMAIL ACCESS <ArrowRight size={14} /></Link>}</article>
              <article><FileCheck2 size={25} /><span className="mono">POLICY MODE</span><h2>Observe</h2><p>MIHARI analyzes and recommends. It cannot execute transactions from your account.</p></article>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
