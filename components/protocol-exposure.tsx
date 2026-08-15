"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Database,
  ExternalLink,
  Landmark,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type {
  ProtocolDefinition,
  ProtocolExposureResponse,
  ProtocolPosition,
  ProtocolScan,
} from "@/lib/protocol-exposure";
import { protocolCatalog as previewProtocolCatalog } from "@/lib/protocols/catalog";

type ProtocolExposureProps = {
  walletCount: number;
  holderAccess: boolean;
  holderThreshold: string;
  holdingSymbols: string[];
  watchlistSymbols: string[];
  onOpenWallets: () => void;
};

const positionLabels: Record<ProtocolPosition["kind"], string> = {
  lending_supply: "LENDING SUPPLY",
  lending_collateral: "COLLATERAL",
  lending_borrow: "BORROW",
  vault_deposit: "VAULT DEPOSIT",
  dex_liquidity: "DEX LIQUIDITY",
  perp_position: "PERP POSITION",
};

function positionMeta(position: ProtocolPosition) {
  const values = [
    position.side?.toUpperCase(),
    position.leverage ? `${position.leverage}X` : null,
    position.marginMode?.toUpperCase(),
  ].filter(Boolean);
  return values.length ? ` / ${values.join(" / ")}` : "";
}

function valueMeta(position: ProtocolPosition) {
  const values = [
    position.valueUsd ? formatMoney(Number(position.valueUsd)) : "VALUE UNAVAILABLE",
    position.positionStatus?.replaceAll("_", " ").toUpperCase(),
    position.unrealizedPnlUsd
      ? `UPNL ${formatMoney(Number(position.unrealizedPnlUsd))}`
      : null,
  ].filter(Boolean);
  return values.join(" / ");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortReference(reference: string) {
  return reference.length > 16 ? shortAddress(reference) : reference.toUpperCase();
}

const marketProtocolNames = {
  morpho: "Morpho",
  "uniswap-v3": "Uniswap V3",
  "uniswap-v4": "Uniswap V4",
  arcus: "Arcus",
  lighter: "Lighter",
} as const;

const marketKindLabels = {
  lending_market: "LENDING MARKET",
  dex_pool: "LIQUIDITY POOL",
  perp_market: "PERPETUAL MARKET",
} as const;

const marketKindDescriptions = {
  lending_market: "A lending market where this Stock Token can be supplied, borrowed or used as collateral.",
  dex_pool: "An onchain liquidity pool with an official Stock Token in the pair.",
  perp_market: "A perpetual market whose underlying symbol matches an official Stock Token.",
} as const;

function formatTokenAmount(value: string) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function scanLabel(scan: ProtocolScan | undefined, protocol: ProtocolDefinition, loading: boolean) {
  if (protocol.stage === "planned") return "PLANNED";
  if (loading) return "SCANNING";
  if (!scan || scan.status === "not_scanned") return "WAITING";
  return scan.status.toUpperCase();
}

export function ProtocolExposure({
  walletCount,
  holderAccess,
  holderThreshold,
  holdingSymbols,
  watchlistSymbols,
  onOpenWallets,
}: ProtocolExposureProps) {
  const [snapshot, setSnapshot] = useState<ProtocolExposureResponse | null>(null);
  const [loading, setLoading] = useState(holderAccess);
  const [error, setError] = useState("");
  const [marketQuery, setMarketQuery] = useState("");
  const [marketPage, setMarketPage] = useState(0);

  const scan = useCallback(async () => {
    if (!holderAccess) {
      setLoading(false);
      setSnapshot(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile/protocol-exposure", { cache: "no-store" });
      const payload = await response.json() as ProtocolExposureResponse & { error?: string; warning?: string };
      if (!response.ok) throw new Error(payload.warning ?? payload.error ?? "Protocol scan unavailable");
      setMarketPage(0);
      setSnapshot(payload);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Protocol scan unavailable");
    } finally {
      setLoading(false);
    }
  }, [holderAccess]);

  useEffect(() => {
    if (!holderAccess) return;
    const timer = window.setTimeout(() => void scan(), 0);
    return () => window.clearTimeout(timer);
  }, [holderAccess, scan]);

  const holdingSet = useMemo(() => new Set(holdingSymbols.map((symbol) => symbol.toUpperCase())), [holdingSymbols]);
  const researchScope = useMemo(() => [
    ...[...holdingSet].map((symbol) => ({ symbol, status: "HOLDING" as const })),
    ...watchlistSymbols
      .map((symbol) => symbol.toUpperCase())
      .filter((symbol) => !holdingSet.has(symbol))
      .map((symbol) => ({ symbol, status: "WATCHLIST / RESEARCH" as const })),
  ], [holdingSet, watchlistSymbols]);

  const totalValue = useMemo(() => snapshot?.positions.reduce(
    (total, position) => total + Number(position.valueUsd ?? 0),
    0,
  ) ?? 0, [snapshot]);
  const eventMatches = snapshot?.positions.filter((position) => position.hasCorporateAction).length ?? 0;
  const discoveredMarkets = useMemo(() => snapshot?.marketScan?.markets ?? [], [snapshot]);
  const filteredMarkets = useMemo(() => {
    const query = marketQuery.trim().toUpperCase();
    if (!query) return discoveredMarkets;
    return discoveredMarkets.filter((market) => (
      market.symbol.includes(query)
      || market.counterparty.toUpperCase().includes(query)
      || market.protocol.toUpperCase().includes(query)
      || market.kind.toUpperCase().includes(query)
    ));
  }, [discoveredMarkets, marketQuery]);
  const marketPageCount = Math.max(1, Math.ceil(filteredMarkets.length / 10));
  const visibleMarkets = filteredMarkets.slice(marketPage * 10, marketPage * 10 + 10);

  const catalog = snapshot?.protocolCatalog ?? previewProtocolCatalog;
  const protocolById = useMemo(() => new Map(
    catalog.map((protocol) => [protocol.id, protocol]),
  ), [catalog]);
  const scanByProtocol = useMemo(() => new Map(
    snapshot?.scans.map((scan) => [scan.protocol, scan]) ?? [],
  ), [snapshot]);
  const activeProtocolIds = useMemo(() => new Set(catalog
    .filter((protocol) => protocol.stage !== "planned")
    .map((protocol) => protocol.id)), [catalog]);
  const activeScans = snapshot?.scans.filter((scan) => activeProtocolIds.has(scan.protocol)) ?? [];
  const checkedProtocols = activeScans.filter((scan) => scan.status === "live" || scan.status === "partial").length;
  const hasUnavailableSource = activeScans.some((scan) => scan.status === "unavailable");
  const hasPartialSource = activeScans.some((scan) => scan.status === "partial");
  const sourceStatus = !holderAccess
    ? "HOLDER REQUIRED"
    : loading
    ? "SCANNING"
    : error
      ? "ERROR"
      : !walletCount
        ? "WAITING FOR WALLET"
        : hasUnavailableSource || hasPartialSource
          ? "PARTIAL"
          : checkedProtocols
            ? "LIVE"
            : "UNAVAILABLE";

  return (
    <section className="workspace-view protocol-view">
      <div className="workspace-title compact">
        <div><p className="mono">07 / DEFI EXPOSURE</p><h1>Beyond your wallet.</h1></div>
        <p>MIHARI checks supported lending, vault and liquidity protocols, then maps every recognized Stock Token position to official corporate actions.</p>
      </div>

      {!holderAccess ? (
        <div className="workspace-inline-help protocol-access-help">
          <LockKeyhole size={20} />
          <p><strong>DeFi scanning requires Holder access.</strong> You can review supported protocols and your research scope below. Hold at least {formatTokenAmount(holderThreshold)} MHR in a verified wallet to scan personal lending, vault, liquidity and perpetual positions.</p>
          <button type="button" onClick={onOpenWallets}>CHECK MHR STATUS</button>
        </div>
      ) : null}

      <div className="protocol-source-bar mono">
        <span><Landmark size={14} />ENGINE <strong>MULTI-PROTOCOL</strong></span>
        <span><Database size={14} />SOURCE <strong>{sourceStatus}</strong></span>
        <span>COVERAGE <strong>{holderAccess ? `${checkedProtocols} CHECKED / ${catalog.length} MAPPED` : `${catalog.length} PROTOCOLS`}</strong></span>
        <button onClick={holderAccess ? () => void scan() : onOpenWallets} disabled={loading}>{holderAccess ? <RefreshCw className={loading ? "spin" : ""} size={14} /> : <LockKeyhole size={14} />}{holderAccess ? "SCAN AGAIN" : "UNLOCK SCAN"}</button>
      </div>

      <div className="workspace-metrics protocol-metrics mono">
        <div><span>VERIFIED WALLETS</span><strong>{walletCount}</strong></div>
        <div><span>PROTOCOL POSITIONS</span><strong>{snapshot?.positions.length ?? 0}</strong></div>
        <div><span>INDICATIVE VALUE</span><strong>{formatMoney(totalValue)}</strong></div>
        <div className={eventMatches ? "alert" : ""}><span>EVENT MATCHES</span><strong>{eventMatches}</strong></div>
      </div>

      <section className="protocol-scope">
        <header>
          <div><p className="mono">ASSET SCOPE / HOLDINGS FIRST</p><h2>What MIHARI is checking.</h2></div>
          <span className="mono">{researchScope.length} ASSETS</span>
        </header>
        {researchScope.length ? (
          <div className="protocol-scope-grid">
            {researchScope.map((asset) => (
              <article className={asset.status === "HOLDING" ? "holding" : "watchlist"} key={asset.symbol}>
                <strong>{asset.symbol}</strong>
                <span className="mono">{asset.status}</span>
                <small>{asset.status === "HOLDING" ? "Found in a verified wallet. Eligible for personal protocol matching." : "Monitored before purchase. This is research scope, not proof of a DeFi position."}</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="protocol-scope-empty">No holdings or watchlist assets yet. Add Stock Tokens on the Assets page to create a research scope.</p>
        )}
      </section>

      <section className="protocol-market-section">
        <header>
          <div>
            <p className="mono">MARKET COVERAGE / WATCHLIST</p>
            <h2>Where these assets can trade.</h2>
          </div>
          <span className="mono">{holderAccess ? `${discoveredMarkets.length} MARKETS FOUND` : "HOLDER SCAN"}</span>
        </header>
        {!holderAccess ? (
          <div className="protocol-market-empty">
            <LockKeyhole size={24} />
            <div><strong>Public pool discovery is ready to unlock.</strong><p>Holder access checks monitored Stock Tokens against supported DeFi markets. A discovered pool is market coverage, not proof that your wallet owns liquidity.</p></div>
          </div>
        ) : loading ? (
          <div className="protocol-market-empty"><LoaderCircle className="spin" size={24} /><div><strong>Checking supported DeFi markets.</strong><p>MIHARI is reading Morpho, Uniswap V3, Uniswap V4, Arcus and Lighter in parallel.</p></div></div>
        ) : error || snapshot?.marketScan?.status === "unavailable" ? (
          <div className="protocol-market-empty"><AlertTriangle size={24} /><div><strong>Market coverage source unavailable.</strong><p>Personal position scans continue separately. Try the scan again in a moment.</p></div></div>
        ) : discoveredMarkets.length ? (
          <>
            <div className="protocol-market-sources mono">
              {snapshot?.marketScan.scans.map((source) => (
                <span className={source.status} key={source.protocol} title={source.warning}>
                  {marketProtocolNames[source.protocol]} <strong>{source.status === "live" ? `${source.marketCount} FOUND` : source.status.toUpperCase()}</strong>
                </span>
              ))}
            </div>
            <div className="protocol-market-controls">
              <label><span className="mono">SEARCH MARKETS</span><input value={marketQuery} onChange={(event) => { setMarketQuery(event.target.value); setMarketPage(0); }} placeholder="AAPL, ETH or protocol" /></label>
              <div className="mono"><span>{filteredMarkets.length ? `${marketPage * 10 + 1}-${Math.min((marketPage + 1) * 10, filteredMarkets.length)} OF ${filteredMarkets.length}` : "0 RESULTS"}</span><button disabled={marketPage === 0} onClick={() => setMarketPage((page) => Math.max(0, page - 1))}>PREVIOUS</button><button disabled={marketPage >= marketPageCount - 1} onClick={() => setMarketPage((page) => Math.min(marketPageCount - 1, page + 1))}>NEXT</button></div>
            </div>
            {visibleMarkets.length ? (
              <div className="protocol-market-grid">
                {visibleMarkets.map((market) => (
                  <article key={market.id}>
                    <div className="protocol-market-card-top mono">
                      <span>{marketKindLabels[market.kind]}</span>
                      <strong>{marketProtocolNames[market.protocol]}</strong>
                    </div>
                    <h3>{market.symbol} / {market.counterparty}</h3>
                    <p>{marketKindDescriptions[market.kind]}</p>
                    <div className="protocol-market-meta mono">
                      <span>{market.fee ? `FEE ${market.fee}` : "FEE NOT REPORTED"}</span>
                      <span>{market.liquidityUsd ? `${formatMoney(Number(market.liquidityUsd))} LIQUIDITY` : shortReference(market.marketId)}</span>
                    </div>
                    <footer className="mono">
                      <span>{shortReference(market.marketId)}</span>
                      {market.externalUrl && market.linkLabel ? <a href={market.externalUrl} target="_blank" rel="noreferrer">{market.linkLabel} <ExternalLink size={13} /></a> : <span>NO DIRECT LINK</span>}
                    </footer>
                  </article>
                ))}
              </div>
            ) : <div className="protocol-market-empty"><Database size={24} /><div><strong>No market matches your search.</strong><p>Try another Stock Token symbol or clear the search field.</p></div></div>}
          </>
        ) : (
          <><div className="protocol-market-sources mono">
            {snapshot?.marketScan.scans.map((source) => (
              <span className={source.status} key={source.protocol} title={source.warning}>{marketProtocolNames[source.protocol]} <strong>{source.status.toUpperCase()}</strong></span>
            ))}
          </div><div className="protocol-market-empty"><Database size={24} /><div><strong>No supported market found for this watchlist.</strong><p>The assets remain monitored for corporate actions. Market coverage and personal positions are separate checks.</p></div></div></>
        )}
      </section>

      <div className="protocol-explainer">
        <article><Wallet size={20} /><span><strong>Direct holdings</strong><small>The Exposure page shows Stock Tokens held directly by your verified wallets.</small></span></article>
        <ArrowRight size={18} />
        <article><Landmark size={20} /><span><strong>Protocol exposure</strong><small>This page looks inside supported DeFi positions where the token may be supplied, borrowed, used as collateral or deposited in a vault.</small></span></article>
        <ArrowRight size={18} />
        <article><ShieldCheck size={20} /><span><strong>Event match</strong><small>MIHARI checks whether an official corporate action touches the Stock Token inside that position.</small></span></article>
      </div>

      {catalog.length ? (
        <div className="protocol-coverage-grid">
          {catalog.map((protocol) => {
            const protocolScan = scanByProtocol.get(protocol.id);
            const label = scanLabel(protocolScan, protocol, loading);
            return (
              <article className={`protocol-coverage-card ${protocol.stage}`} key={protocol.id}>
                <header className="mono">
                  <span>{protocol.category.toUpperCase()}</span>
                  <strong>{label}</strong>
                </header>
                <h2>{protocol.name}</h2>
                <p>{protocol.description}</p>
                <div className="protocol-capabilities mono">
                  {protocol.capabilities.map((capability) => <span key={capability}>{capability}</span>)}
                </div>
                <footer className="mono">
                  <span>{holderAccess ? `${protocolScan?.positionCount ?? 0} POSITIONS` : "PREVIEW"}</span>
                  <span>{protocol.stage.toUpperCase()}</span>
                </footer>
              </article>
            );
          })}
        </div>
      ) : null}

      {!holderAccess ? (
        <div className="workspace-feature-gate protocol-holder-gate">
          <span className="workspace-feature-gate-icon"><LockKeyhole size={27} /></span>
          <div>
            <p className="mono">MHR HOLDER ACCESS</p>
            <h2>Unlock personal protocol exposure.</h2>
            <p>The page above shows coverage and your research scope. A verified balance of at least {formatTokenAmount(holderThreshold)} MHR unlocks read-only scans for positions tied to your wallets. Watchlist assets remain research signals until MIHARI proves a position.</p>
            <button type="button" onClick={onOpenWallets}>OPEN WALLETS</button>
          </div>
        </div>
      ) : loading ? (
        <div className="workspace-empty protocol-empty"><LoaderCircle className="spin" size={30} /><h2>Scanning protocol positions.</h2><p>This is read-only. MIHARI never requests token approvals or transactions.</p></div>
      ) : error ? (
        <div className="workspace-empty protocol-empty"><AlertTriangle size={30} /><h2>Protocol engine unavailable.</h2><p>{error}</p><button onClick={() => void scan()}>TRY AGAIN</button></div>
      ) : !walletCount ? (
        <div className="workspace-empty protocol-empty"><Wallet size={30} /><h2>Link a wallet to start.</h2><p>MIHARI needs a verified address before it can look for personal protocol positions.</p><button onClick={onOpenWallets}>OPEN WALLETS</button></div>
      ) : snapshot?.positions.length ? (
        <section className="protocol-personal-positions">
          <header><p className="mono">YOUR POSITIONS / VERIFIED WALLETS</p><h2>Personal protocol exposure.</h2></header>
          <div className="protocol-position-table">
          <header className="mono"><span>PROTOCOL POSITION</span><span>STOCK TOKEN</span><span>AMOUNT / VALUE</span><span>EVENT STATUS</span></header>
          {snapshot.positions.map((position) => (
            <article className={position.hasCorporateAction ? "exposed" : ""} key={position.id}>
              <span>
                <strong>{position.marketName}</strong>
                <small className="mono">{(protocolById.get(position.protocol)?.name ?? position.protocol).toUpperCase()} / {positionLabels[position.kind]}{positionMeta(position)}{position.positionReference ? ` / ${position.positionReference}` : ""}</small>
              </span>
              <span><strong>{position.symbol}</strong><small className="mono">WALLET {shortAddress(position.wallet)}</small></span>
              <span><strong>{Number(position.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}</strong><small>{valueMeta(position)}</small></span>
              <span className="protocol-event-state"><strong className="mono">{position.hasCorporateAction ? "EVENT MATCH" : "NO EVENT MATCH"}</strong><small>{position.corporateAction ? `${position.corporateAction.type} / ${position.corporateAction.status}` : "MONITORING CONTINUES"}</small></span>
            </article>
          ))}
          </div>
        </section>
      ) : (
        <div className="workspace-empty protocol-empty"><Landmark size={30} /><h2>No personal protocol position found.</h2><p>MIHARI checked your verified wallets and found no recognized position in the active adapters. Pools listed under Market Coverage are public markets and do not mean your wallet owns liquidity.</p></div>
      )}

      <div className="protocol-coverage-note">
        <span className="mono">COVERAGE / SOURCE TRUTH</span>
        <p><strong>Morpho, Uniswap V3, Uniswap V4, Arcus and Lighter are active adapters.</strong> Planned sources are visible so users can see exactly what is and is not included. A protocol is never counted as checked until MIHARI can verify its user-position data.</p>
        <span className="mono">READ-ONLY / NO APPROVALS / NO TRANSACTIONS</span>
      </div>
    </section>
  );
}
