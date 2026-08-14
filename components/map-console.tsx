"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  Check,
  CircleUserRound,
  Copy,
  ExternalLink,
  FileCheck2,
  Landmark,
  Link2,
  ListFilter,
  LoaderCircle,
  Network,
  Orbit,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Unlink,
  Wallet,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ProfileEvents } from "@/components/profile-events";
import { ProfileSignOut } from "@/components/profile-sign-out";
import { ProtocolExposure } from "@/components/protocol-exposure";
import { RiskGraph } from "@/components/risk-graph";
import type { AnalysisResponse } from "@/lib/analysis";
import type { MappedPosition, MhrHolding } from "@/lib/map-data";
import { MAX_WATCHLIST_ASSETS } from "@/lib/product-limits";
import { MHR_CONTRACT_ADDRESS } from "@/lib/token";
import type { CorporateEvent } from "@/lib/product-data";
import type { RobinhoodAsset } from "@/lib/robinhood";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type ProfileResponse = {
  account: { id: string; email: string | null; primaryMethod: "email" | "wallet" };
  watchlist: { symbols: string[]; mode: string } | null;
  wallets: Array<{ id: string; address: string; chainId: number; verified: boolean; mhr: MhrHolding }>;
  exposure: { positions: MappedPosition[]; events: CorporateEvent[]; scannedAt: string };
};

type WorkspaceView = "overview" | "events" | "assets" | "wallets" | "exposure" | "risk" | "defi" | "settings";
type MapConsoleProps = { authUnavailable?: boolean };

const CHAIN_ID_HEX = "0x1237";
const workspaceNavigation = [
  { id: "overview", label: "Overview", icon: Orbit },
  { id: "events", label: "Events", icon: BellRing },
  { id: "assets", label: "Assets", icon: ListFilter },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "exposure", label: "Exposure", icon: ShieldCheck },
  { id: "risk", label: "Graph", icon: Network },
  { id: "defi", label: "DeFi", icon: Landmark },
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

function formatTokenBalance(value: string | null) {
  if (value === null) return "CHECK UNAVAILABLE";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function eventRiskLabel(event: CorporateEvent) {
  if (event.severity === "critical") return "CRITICAL";
  if (event.severity === "watch") return "HIGH";
  return "LOW";
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
  const [openRiskSymbol, setOpenRiskSymbol] = useState("");
  const [positionAnalyses, setPositionAnalyses] = useState<Record<string, AnalysisResponse>>({});
  const [analyzingSymbol, setAnalyzingSymbol] = useState("");
  const [riskAnalysisError, setRiskAnalysisError] = useState("");
  const riskFileRef = useRef<HTMLElement>(null);

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
      setSelectedSymbols((nextProfile.watchlist?.symbols ?? []).slice(0, MAX_WATCHLIST_ASSETS));
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

  useEffect(() => {
    if (!openRiskSymbol) return;
    const timer = window.setTimeout(() => riskFileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    return () => window.clearTimeout(timer);
  }, [openRiskSymbol]);

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
  const eventsBySymbol = useMemo(() => new Map(
    (profile?.exposure.events ?? []).map((event) => [event.asset.toUpperCase(), event]),
  ), [profile?.exposure.events]);
  const openRiskPosition = profile?.exposure.positions.find(
    (position) => position.symbol.toUpperCase() === openRiskSymbol,
  ) ?? null;
  const openRiskEvent = openRiskPosition ? eventsBySymbol.get(openRiskPosition.symbol.toUpperCase()) ?? null : null;
  const openRiskAnalysis = openRiskEvent ? positionAnalyses[openRiskEvent.id] : undefined;
  const selectionFull = selectedSymbols.length >= Math.min(MAX_WATCHLIST_ASSETS, assets.length);

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
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error ?? "Watchlist could not be saved");
      }
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
    setSelectedSymbols((current) => {
      if (current.includes(symbol)) return current.filter((item) => item !== symbol);
      if (current.length >= MAX_WATCHLIST_ASSETS) {
        setError(`This release supports up to ${MAX_WATCHLIST_ASSETS} monitored assets. Remove one before adding another.`);
        return current;
      }
      setError("");
      return [...current, symbol];
    });
  }

  function selectTwentyVisibleAssets() {
    if (selectionFull) {
      setSelectedSymbols([]);
      return;
    }
    setSelectedSymbols(visibleAssets.slice(0, MAX_WATCHLIST_ASSETS).map((asset) => asset.tokenSymbol));
    setError("");
  }

  async function copyContract(address: string) {
    await navigator.clipboard.writeText(address);
    setCopiedContract(address);
    window.setTimeout(() => setCopiedContract((current) => current === address ? "" : current), 1600);
  }

  async function openPositionRisk(position: MappedPosition) {
    const symbol = position.symbol.toUpperCase();
    const event = eventsBySymbol.get(symbol);
    setOpenRiskSymbol(symbol);
    setRiskAnalysisError("");
    if (!event || positionAnalyses[event.id]) return;

    setAnalyzingSymbol(symbol);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, symbol }),
      });
      if (!response.ok) throw new Error(`Analysis unavailable (${response.status})`);
      const analysis = await response.json() as AnalysisResponse;
      setPositionAnalyses((current) => ({ ...current, [event.id]: analysis }));
    } catch (analysisError) {
      setRiskAnalysisError(analysisError instanceof Error ? analysisError.message : "Analysis unavailable");
    } finally {
      setAnalyzingSymbol("");
    }
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
              <header><div><p className="mono">AI AGENT / EVENT MATCHING</p><h2>Personal impact queue</h2></div><button onClick={() => setView("risk")}>OPEN RISK GRAPH <ArrowRight size={14} /></button></header>
              {exposedPositions.length ? exposedPositions.map((position) => (
                <div className="impact-row" key={position.contractAddress}><span className="mono">{position.symbol}</span><strong>Corporate action matched to your position</strong><span>{position.balance} tokens</span><Link href="/app">Open Incident File</Link></div>
              )) : <div className="impact-clear"><ShieldCheck size={22} /><span><strong>No active event touches a mapped position.</strong><small>Your monitored assets remain active in the background.</small></span></div>}
            </div>
          </section>
        ) : null}

        {view === "events" ? (
          <ProfileEvents
            heldSymbols={profile?.exposure.positions.map((position) => position.symbol) ?? []}
            onOpenExposure={() => setView("exposure")}
          />
        ) : null}

        {view === "assets" ? (
          <section className="workspace-view">
            <div className="workspace-title compact"><div><p className="mono">03 / ASSET MANAGER</p><h1>Assets and contracts.</h1></div><p>Select up to 20 Stock Tokens your profile should watch and verify every official Robinhood Chain contract from the same live catalog.</p></div>
            <div className="workspace-asset-toolbar">
              <label><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search symbol or company" /></label>
              <span className="mono">{selectedSymbols.length} / {MAX_WATCHLIST_ASSETS} SELECTED · {assets.length} LIVE</span>
              <button onClick={selectTwentyVisibleAssets}>{selectionFull ? "CLEAR ALL" : `SELECT ${Math.min(MAX_WATCHLIST_ASSETS, visibleAssets.length)}`}</button>
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
            <div className="workspace-title compact"><div><p className="mono">04 / IDENTITY GRAPH</p><h1>Wallets.</h1></div><p>Verify one or more EVM wallets. MIHARI reads Stock Token and $MHR balances but cannot move funds or request token approvals.</p></div>
            {!profile?.account.email ? (
              <div className="workspace-email-link">
                <div><CircleUserRound size={21} /><span><strong>Wallet-first profile</strong><small>Add email access so the same workspace can be opened without your wallet.</small></span></div>
                <Link href="/sign-in?redirect_url=/map">LINK EMAIL ACCESS <ArrowRight size={14} /></Link>
              </div>
            ) : null}
            <div className="workspace-action-row"><button onClick={() => void linkWallet()} disabled={linking}>{linking ? <LoaderCircle className="spin" size={16} /> : <Link2 size={16} />}{linking ? "VERIFYING" : "LINK ANOTHER WALLET"}</button></div>
            <div className="workspace-wallet-grid">
              {profile?.wallets.length ? profile.wallets.map((wallet) => (
                <article key={wallet.id}>
                  <Wallet size={25} />
                  <span className="mono">VERIFIED IDENTITY</span>
                  <h2>{shortAddress(wallet.address)}</h2>
                  <p className="mono">ROBINHOOD CHAIN / {wallet.chainId}</p>
                  <div className={`workspace-mhr-status ${wallet.mhr.status}`}>
                    <span className="mono">$MHR STATUS</span>
                    <strong>{wallet.mhr.status === "holder" ? "HOLDER" : wallet.mhr.status === "not_held" ? "NOT HELD" : "UNAVAILABLE"}</strong>
                    <small>{formatTokenBalance(wallet.mhr.balance)} MHR</small>
                    <a href={`https://robinhoodchain.blockscout.com/address/${MHR_CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">VERIFY CONTRACT <ExternalLink size={12} /></a>
                  </div>
                  <button onClick={() => void unlinkWallet(wallet.id)}><Unlink size={14} />UNLINK</button>
                </article>
              )) : <div className="workspace-empty"><Wallet size={30} /><h2>No verified wallet yet.</h2><p>Link a wallet to discover your Robinhood Stock Token positions.</p></div>}
            </div>
          </section>
        ) : null}

        {view === "exposure" ? (
          <section className="workspace-view">
            <div className="workspace-title compact"><div><p className="mono">05 / POSITION INTELLIGENCE</p><h1>Exposure.</h1></div><p>Every linked wallet is scanned automatically for all official Robinhood Stock Tokens, including assets outside your watchlist. Event matches open a personal risk file.</p></div>
            <div className="workspace-value-band"><span className="mono">INDICATIVE STOCK TOKEN VALUE</span><strong>{formatMoney(totalValue.toFixed(2))}</strong></div>
            <div className="workspace-exposure-guide">
              <div><Orbit size={18} /><span><strong>POSITION FOUND</strong><small>The token balance was found in a verified wallet on Robinhood Chain.</small></span></div>
              <div><ShieldCheck size={18} /><span><strong>NO EVENT MATCH</strong><small>No matching corporate action exists in the current Robinhood source window. This is not a guarantee of zero risk.</small></span></div>
              <div><AlertTriangle size={18} /><span><strong>EVENT MATCH</strong><small>An official corporate action matches a token you hold. Open the risk file to review its impact.</small></span></div>
            </div>
            {profile?.exposure.positions.length ? (
              <div className="workspace-position-table">
                <header className="mono"><span>ASSET</span><span>BALANCE</span><span>INDICATIVE VALUE</span><span>EVENT STATUS</span></header>
                {profile.exposure.positions.map((position) => (
                  <div className={position.hasCorporateAction ? "exposed" : ""} key={`${position.wallet}-${position.contractAddress}`}>
                    <span><strong>{position.symbol}</strong><small>{position.name}</small></span>
                    <span className="mono">{Number(position.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                    <span>{formatMoney(position.valueUsd)}</span>
                    <span className="workspace-position-status">
                      <strong className="mono">{position.hasCorporateAction ? "EVENT MATCH" : "NO EVENT MATCH"}</strong>
                      {position.hasCorporateAction ? <button type="button" onClick={() => void openPositionRisk(position)}>VIEW RISK <ArrowRight size={12} /></button> : <small>MONITORING CONTINUES</small>}
                    </span>
                  </div>
                ))}
              </div>
            ) : <div className="workspace-empty"><Orbit size={30} /><h2>No Stock Token positions found.</h2><p>Your saved watchlist continues monitoring even when a linked wallet has no position.</p></div>}

            {openRiskPosition && openRiskEvent ? (
              <article className="workspace-risk-file" ref={riskFileRef} aria-label={`${openRiskPosition.symbol} personal risk file`}>
                <header>
                  <div><p className="mono">PERSONAL RISK FILE / OFFICIAL EVENT MATCH</p><h2>{openRiskPosition.symbol} touches your wallet.</h2></div>
                  <button type="button" aria-label="Close personal risk file" onClick={() => setOpenRiskSymbol("")}><X size={18} /></button>
                </header>
                <div className="workspace-risk-meta mono">
                  <span>POSITION <strong>{Number(openRiskPosition.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {openRiskPosition.symbol}</strong></span>
                  <span>EVENT <strong>{openRiskEvent.type}</strong></span>
                  <span>SOURCE STATUS <strong>{openRiskEvent.sourceStatus}</strong></span>
                  <span>RISK <strong>{openRiskAnalysis?.risk.toUpperCase() ?? eventRiskLabel(openRiskEvent)}</strong></span>
                </div>
                <div className="workspace-risk-analysis">
                  <section><span className="mono">01 / WHAT HAPPENED</span><p>{openRiskAnalysis?.summary ?? openRiskEvent.summary}</p></section>
                  <section><span className="mono">02 / POSSIBLE IMPACT</span><p>{openRiskAnalysis?.impactAssessment ?? openRiskEvent.impact}</p></section>
                  <section className="response"><span className="mono">03 / RECOMMENDED RESPONSE</span><p>{openRiskAnalysis?.recommendedAction ?? openRiskEvent.action}</p></section>
                </div>
                <footer className="mono">
                  <span>ANALYSIS <strong>{analyzingSymbol === openRiskPosition.symbol ? "RUNNING" : openRiskAnalysis?.mode === "ai" ? "AI" : openRiskAnalysis?.mode === "deterministic" ? "RULE BASED" : "SOURCE SUMMARY"}</strong></span>
                  <span>CONFIDENCE <strong>{openRiskAnalysis ? `${openRiskAnalysis.confidence}%` : analyzingSymbol ? "PENDING" : "NOT SCORED"}</strong></span>
                  <span>AFFECTED SYSTEMS <strong>{openRiskAnalysis?.affectedSystems.join(" / ").toUpperCase() ?? "ANALYSIS PENDING"}</strong></span>
                </footer>
                {riskAnalysisError ? <p className="workspace-risk-error mono">{riskAnalysisError}. Official source details are still shown.</p> : null}
              </article>
            ) : null}
          </section>
        ) : null}

        {view === "settings" ? (
          <section className="workspace-view">
            <div className="workspace-title compact"><div><p className="mono">08 / PROFILE CONTROL</p><h1>Your profile.</h1></div><p>Manage the identities that open this workspace. Add email to a wallet-native profile or link wallets to an email profile.</p></div>
            <div className="workspace-profile-grid">
              <article><CircleUserRound size={25} /><span className="mono">PRIMARY ACCESS</span><h2>{profile?.account.primaryMethod === "wallet" ? "Wallet signature" : "Email and password"}</h2><p>{profile?.account.email ?? profile?.wallets[0]?.address ?? "MIHARI profile"}</p></article>
              <article><Activity size={25} /><span className="mono">ADD ACCESS METHOD</span><h2>{profile?.account.email ? "Email connected" : "Add recovery email"}</h2><p>{profile?.account.email ? "You can access this profile by email and linked wallet." : "Connect email access without losing this wallet profile."}</p>{profile?.account.email ? <button onClick={() => setView("wallets")}>MANAGE WALLETS</button> : <Link href="/sign-in?redirect_url=/map">ADD EMAIL ACCESS <ArrowRight size={14} /></Link>}</article>
              <article><FileCheck2 size={25} /><span className="mono">POLICY MODE</span><h2>Observe</h2><p>MIHARI analyzes and recommends. It cannot execute transactions from your account.</p></article>
            </div>
          </section>
        ) : null}

        {view === "defi" ? (
          <ProtocolExposure walletCount={profile?.wallets.length ?? 0} onOpenWallets={() => setView("wallets")} />
        ) : null}

        {view === "risk" ? (
          <RiskGraph
            directPositions={profile?.exposure.positions ?? []}
            directEvents={profile?.exposure.events ?? []}
            walletCount={profile?.wallets.length ?? 0}
            onOpenWallets={() => setView("wallets")}
            onOpenDirectRisk={(position) => {
              setView("exposure");
              void openPositionRisk(position);
            }}
            onOpenProtocolExposure={() => setView("defi")}
          />
        ) : null}
      </main>
    </div>
  );
}
