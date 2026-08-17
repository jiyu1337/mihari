"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Database,
  Landmark,
  LoaderCircle,
  LockKeyhole,
  Network,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { HelpLabel } from "@/components/help-tip";
import { helpCopy } from "@/lib/help-content";
import type { MappedPosition } from "@/lib/map-data";
import type {
  ProtocolExposureResponse,
  ProtocolPosition,
} from "@/lib/protocol-exposure";
import type { CorporateEvent } from "@/lib/product-data";

type RiskGraphProps = {
  directPositions: MappedPosition[];
  directEvents: CorporateEvent[];
  watchlistSymbols: string[];
  walletCount: number;
  fullGraph: boolean;
  holderThreshold: string;
  onOpenWallets: () => void;
  onOpenDirectRisk: (position: MappedPosition) => void;
  onOpenProtocolExposure: () => void;
  onOpenEvents: () => void;
};

type RiskNode = {
  symbol: string;
  event: CorporateEvent | null;
  directPositions: MappedPosition[];
  protocolPositions: ProtocolPosition[];
  watchlisted: boolean;
};

type WatchlistEventResponse = {
  mode: "live" | "fallback";
  events: CorporateEvent[];
};

const positionLabels: Record<ProtocolPosition["kind"], string> = {
  lending_supply: "SUPPLY",
  lending_collateral: "COLLATERAL",
  lending_borrow: "BORROW",
  vault_deposit: "VAULT",
  dex_liquidity: "LP",
  perp_position: "PERP",
};

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatMoney(value: string | null) {
  if (value === null || !Number.isFinite(Number(value))) return "VALUE UNAVAILABLE";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function protocolMeta(position: ProtocolPosition) {
  return [
    positionLabels[position.kind],
    position.side?.toUpperCase(),
    position.leverage ? `${position.leverage}X` : null,
    position.marginMode?.toUpperCase(),
  ].filter(Boolean).join(" / ");
}

function formatTokenAmount(value: string) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function eventStateLabel(event: CorporateEvent) {
  const status = event.sourceStatus.toUpperCase();
  if (status.includes("IN_PROGRESS")) return "EVENT ACTIVE";
  if (status.includes("COMPLETED")) return "EVENT COMPLETED";
  if (status.includes("PENDING")) return "EVENT PENDING";
  return event.severity === "watch" ? "REVIEW EVENT" : "MONITOR EVENT";
}

export function RiskGraph({
  directPositions,
  directEvents,
  watchlistSymbols,
  walletCount,
  fullGraph,
  holderThreshold,
  onOpenWallets,
  onOpenDirectRisk,
  onOpenProtocolExposure,
  onOpenEvents,
}: RiskGraphProps) {
  const [snapshot, setSnapshot] = useState<ProtocolExposureResponse | null>(null);
  const [loading, setLoading] = useState(fullGraph);
  const [error, setError] = useState("");
  const [watchlistEvents, setWatchlistEvents] = useState<CorporateEvent[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  const scan = useCallback(async () => {
    if (!fullGraph) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile/protocol-exposure", { cache: "no-store" });
      const payload = await response.json() as ProtocolExposureResponse & { error?: string; warning?: string };
      if (!response.ok) throw new Error(payload.warning ?? payload.error ?? "Risk Graph source unavailable");
      setSnapshot(payload);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Risk Graph source unavailable");
    } finally {
      setLoading(false);
    }
  }, [fullGraph]);

  useEffect(() => {
    if (!fullGraph) return;
    const timer = window.setTimeout(() => void scan(), 0);
    return () => window.clearTimeout(timer);
  }, [fullGraph, scan]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadWatchlistEvents() {
      setWatchlistLoading(true);
      try {
        const response = await fetch("/api/profile/events", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json() as WatchlistEventResponse;
        setWatchlistEvents(payload.mode === "live" ? payload.events : []);
      } finally {
        if (!controller.signal.aborted) setWatchlistLoading(false);
      }
    }
    void loadWatchlistEvents();
    return () => controller.abort();
  }, [watchlistSymbols]);

  const protocolById = useMemo(() => new Map(
    snapshot?.protocolCatalog.map((protocol) => [protocol.id, protocol.name]) ?? [],
  ), [snapshot]);
  const graphNodes = useMemo(() => {
    const eventBySymbol = new Map<string, CorporateEvent>();
    for (const event of [...directEvents, ...watchlistEvents, ...(snapshot?.events ?? [])]) {
      if (event.source === "robinhood") eventBySymbol.set(event.asset.toUpperCase(), event);
    }
    const symbols = new Set([
      ...directPositions.map((position) => position.symbol.toUpperCase()),
      ...(snapshot?.positions ?? []).map((position) => position.symbol.toUpperCase()),
      ...watchlistSymbols.map((symbol) => symbol.toUpperCase()),
    ]);
    return [...symbols].map((symbol): RiskNode => ({
      symbol,
      event: eventBySymbol.get(symbol) ?? null,
      directPositions: directPositions.filter((position) => position.symbol.toUpperCase() === symbol),
      protocolPositions: (snapshot?.positions ?? []).filter((position) => position.symbol.toUpperCase() === symbol),
      watchlisted: watchlistSymbols.some((item) => item.toUpperCase() === symbol),
    })).sort((left, right) => {
      const leftPriority = left.directPositions.length ? 0 : left.protocolPositions.length ? 1 : 2;
      const rightPriority = right.directPositions.length ? 0 : right.protocolPositions.length ? 1 : 2;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      if (Boolean(left.event) !== Boolean(right.event)) return left.event ? -1 : 1;
      return left.symbol.localeCompare(right.symbol);
    });
  }, [directEvents, directPositions, snapshot, watchlistEvents, watchlistSymbols]);

  const activeRiskNodes = graphNodes.filter((node) => node.event && (node.directPositions.length || node.protocolPositions.length));
  const watchlistSignalNodes = graphNodes.filter((node) => node.event && !node.directPositions.length && !node.protocolPositions.length && node.watchlisted);
  const monitoredNodes = graphNodes.filter((node) => !node.event);
  const directRiskPaths = activeRiskNodes.reduce((total, node) => total + node.directPositions.length, 0);
  const protocolRiskPaths = activeRiskNodes.reduce((total, node) => total + node.protocolPositions.length, 0);
  const activeScans = snapshot?.scans.filter((scanResult) => (
    snapshot.protocolCatalog.find((protocol) => protocol.id === scanResult.protocol)?.stage !== "planned"
  )) ?? [];
  const checkedProtocols = activeScans.filter((scanResult) => (
    scanResult.status === "live" || scanResult.status === "partial"
  )).length;
  const incompleteProtocols = activeScans.filter((scanResult) => (
    scanResult.status === "partial" || scanResult.status === "unavailable"
  ));
  const sourceStatus = !fullGraph
    ? "DIRECT + WATCHLIST"
    : loading
    ? "SCANNING"
    : error
      ? directPositions.length
        ? "PARTIAL"
        : "ERROR"
      : !walletCount
        ? "WAITING FOR WALLET"
        : incompleteProtocols.length
          ? "PARTIAL"
          : "LIVE";
  const graphLoading = loading || watchlistLoading;

  return (
    <section className="workspace-view risk-graph-view">
      <div className="workspace-title compact">
        <div><p className="mono">06 / UNIFIED RISK GRAPH</p><h1>Where risk travels.</h1></div>
        <p>Follow an official event from the Stock Token to a wallet holding, watchlist signal or supported DeFi position.</p>
      </div>

      <div className="risk-graph-source mono">
        <span><Database size={14} /><HelpLabel label="EVENT SOURCE">{helpCopy.dataMode}</HelpLabel><strong>ROBINHOOD</strong></span>
        <span><Network size={14} /><HelpLabel label="GRAPH STATE">{helpCopy.partialSource}</HelpLabel><strong>{sourceStatus}</strong></span>
        <span><HelpLabel label="PROTOCOLS" align="end">{helpCopy.protocolPaths}</HelpLabel><strong>{fullGraph ? `${checkedProtocols} CHECKED` : "LOCKED"}</strong></span>
        {fullGraph
          ? <button type="button" onClick={() => void scan()} disabled={loading}><RefreshCw className={loading ? "spin" : ""} size={14} />REBUILD GRAPH</button>
          : <button type="button" onClick={onOpenWallets}><LockKeyhole size={14} />UNLOCK FULL GRAPH</button>}
      </div>

      <div className="workspace-metrics risk-graph-metrics mono">
        <div><HelpLabel label="ACTIVE SIGNALS">{helpCopy.activeSignals}</HelpLabel><strong>{activeRiskNodes.length + watchlistSignalNodes.length}</strong></div>
        <div><HelpLabel label="TRACKED ASSETS">{helpCopy.trackedAssets}</HelpLabel><strong>{graphNodes.length}</strong></div>
        <div><HelpLabel label="DIRECT PATHS">{helpCopy.directPaths}</HelpLabel><strong>{directRiskPaths}</strong></div>
        <div className={protocolRiskPaths ? "alert" : ""}><HelpLabel label="PROTOCOL PATHS" align="end">{helpCopy.protocolPaths}</HelpLabel><strong>{fullGraph ? protocolRiskPaths : "LOCKED"}</strong></div>
      </div>

      <div className="risk-graph-legend">
        <article><AlertTriangle size={20} /><span><strong>Official event</strong><small>A live Robinhood corporate-action record. Simulated fallback events are excluded.</small></span></article>
        <ArrowRight size={18} />
        <article><ShieldCheck size={20} /><span><strong>Verified asset</strong><small>An official Stock Token contract or exact official symbol match.</small></span></article>
        <ArrowRight size={18} />
        <article><Landmark size={20} /><span><HelpLabel label="Proven exposure" as="strong" align="end">{helpCopy.provenExposure}</HelpLabel><small>A verified wallet balance or supported protocol position.</small></span></article>
      </div>

      {!fullGraph ? (
        <div className="workspace-inline-help risk-graph-access-help">
          <LockKeyhole size={20} />
          <p><strong>Your direct and watchlist graph is active.</strong> Holdings are prioritized, while watchlist-only assets appear as research signals. Hold at least {formatTokenAmount(holderThreshold)} MHR to add proven lending, vault, liquidity and perpetual positions.</p>
          <button type="button" onClick={onOpenWallets}>CHECK MHR STATUS</button>
        </div>
      ) : null}

      {error && (directPositions.length || watchlistSymbols.length) ? (
        <div className="risk-graph-warning mono"><AlertTriangle size={15} />PROTOCOL SOURCES ARE UNAVAILABLE. DIRECT WALLET PATHS REMAIN VISIBLE.</div>
      ) : null}

      {graphLoading ? (
        <div className="workspace-empty risk-graph-empty"><LoaderCircle className="spin" size={30} /><h2>Building the current risk paths.</h2><p>MIHARI is matching holdings and watchlist assets with official events{fullGraph ? " and supported protocol positions" : ""}.</p></div>
      ) : error && !directPositions.length && !watchlistSymbols.length ? (
        <div className="workspace-empty risk-graph-empty"><AlertTriangle size={30} /><h2>The complete graph is unavailable.</h2><p>{error}</p><button type="button" onClick={() => void scan()}>TRY AGAIN</button></div>
      ) : activeRiskNodes.length ? (
        <div className="risk-graph-paths">
          {activeRiskNodes.map((node, index) => {
            const event = node.event as CorporateEvent;
            return (
              <article className={`risk-graph-path ${event.severity}`} key={`${event.id}-${node.symbol}`}>
                <header className="mono">
                  <span>PATH {String(index + 1).padStart(2, "0")}</span>
                  <span>{node.directPositions.length + node.protocolPositions.length} VERIFIED EXPOSURES</span>
                  <HelpLabel label={eventStateLabel(event)} as="strong" align="end">{helpCopy.sourceStatus}</HelpLabel>
                </header>
                <div className="risk-graph-flow">
                  <section className="risk-event-node">
                    <span className="mono">01 / ROBINHOOD EVENT</span>
                    <h2>{event.type}</h2>
                    <p>{event.summary}</p>
                    <footer className="mono"><span>{event.sourceStatus}</span><span>{event.time}</span></footer>
                  </section>
                  <div className="risk-graph-connector" aria-hidden="true"><i /><ArrowRight size={18} /></div>
                  <section className="risk-asset-node">
                    <span className="mono">02 / STOCK TOKEN</span>
                    <strong>{node.symbol}</strong>
                    <p>{event.name}</p>
                    <small className="mono">OFFICIAL SYMBOL MATCH</small>
                  </section>
                  <div className="risk-graph-connector fork" aria-hidden="true"><i /><ArrowRight size={18} /></div>
                  <section className="risk-exposure-lanes">
                    <div className="risk-exposure-lane">
                      <header><Wallet size={16} /><span className="mono">DIRECT / {node.directPositions.length}</span></header>
                      {node.directPositions.length ? node.directPositions.map((position) => (
                        <div key={`${position.wallet}-${position.contractAddress}`}>
                          <span><strong>{shortAddress(position.wallet)}</strong><small className="mono">VERIFIED WALLET</small></span>
                          <span><strong>{Number(position.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} {position.symbol}</strong><small>{formatMoney(position.valueUsd)}</small></span>
                        </div>
                      )) : <p>NO DIRECT WALLET BALANCE</p>}
                    </div>
                    <div className={`risk-exposure-lane protocol ${!fullGraph ? "locked" : ""}`}>
                      <header>{fullGraph ? <Landmark size={16} /> : <LockKeyhole size={16} />}<span className="mono">PROTOCOL / {fullGraph ? node.protocolPositions.length : "LOCKED"}</span></header>
                      {!fullGraph ? <p>HOLDER ACCESS IS REQUIRED TO SCAN PERSONAL PROTOCOL POSITIONS.</p> : node.protocolPositions.length ? node.protocolPositions.map((position) => (
                        <div key={position.id}>
                          <span><strong>{protocolById.get(position.protocol) ?? position.protocol}</strong><small className="mono">{protocolMeta(position)}</small></span>
                          <span><strong>{Number(position.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} {position.symbol}</strong><small>{formatMoney(position.valueUsd)}</small></span>
                        </div>
                      )) : <p>NO SUPPORTED PROTOCOL POSITION</p>}
                    </div>
                  </section>
                </div>
                <footer>
                  <span><strong>What this proves</strong><small>The event and position share a verified official Stock Token identity.</small></span>
                  <div>
                    {node.directPositions[0] ? <button type="button" onClick={() => onOpenDirectRisk(node.directPositions[0])}>OPEN PERSONAL RISK <ArrowRight size={13} /></button> : null}
                    {node.protocolPositions.length ? <button type="button" onClick={onOpenProtocolExposure}>OPEN PROTOCOL VIEW <ArrowRight size={13} /></button> : null}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="workspace-empty risk-graph-empty clear"><ShieldCheck size={30} /><h2>No active corporate action reaches a proven position.</h2><p>The graph was built successfully. Holdings and watchlist assets remain monitored against future official events.</p>{!walletCount ? <button type="button" onClick={onOpenWallets}>LINK A WALLET FOR HOLDINGS</button> : null}</div>
      )}

      {!graphLoading && watchlistSignalNodes.length ? (
        <section className="risk-watchlist-signals">
          <header><div><p className="mono">WATCHLIST SIGNALS / RESEARCH</p><h2>Events to review before you buy.</h2></div><span className="mono">{watchlistSignalNodes.length} SIGNALS</span></header>
          <div>
            {watchlistSignalNodes.map((node) => (
              <article className={node.event?.severity ?? "watch"} key={`${node.symbol}-${node.event?.id}`}>
                <div className="risk-watchlist-event">
                  <span className="mono">WATCHLIST / NOT A HOLDING</span>
                  <h3>{node.symbol}</h3>
                  <strong>{node.event?.type}</strong>
                  <p>{node.event?.summary}</p>
                </div>
                <div className="risk-watchlist-agent">
                  <span className="mono">MIHARI AI GUARDIAN / REVIEW READY</span>
                  <ShieldCheck size={28} />
                  <h4>Event processed.</h4>
                  <p>MIHARI matched this official event to your watchlist and prepared an impact review before you make a decision.</p>
                  <div className="mono"><span>EVENT STATE <strong>{node.event ? eventStateLabel(node.event) : "MONITOR"}</strong></span><span>CONFIDENCE <strong>{node.event?.confidence == null ? "SOURCE BASED" : `${node.event.confidence}%`}</strong></span></div>
                  <button type="button" onClick={onOpenEvents}>OPEN EVENT ANALYSIS <ArrowRight size={13} /></button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!graphLoading && !error && monitoredNodes.length ? (
        <section className="risk-monitored-nodes">
          <header><div><p className="mono">MONITORED NODES / NO CURRENT EVENT</p><h2>Present, but no active path.</h2></div><span className="mono">{monitoredNodes.length} ASSETS</span></header>
          <div>
            {monitoredNodes.map((node) => (
              <article key={node.symbol}>
                <strong>{node.symbol}</strong>
                <span className="mono">{node.directPositions.length ? "HOLDING" : node.protocolPositions.length ? "DEFI POSITION" : "WATCHLIST"}</span>
                <small>NO OFFICIAL EVENT MATCH</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="risk-graph-boundary">
        <span className="mono">SOURCE BOUNDARY</span>
        <p>The graph proves identity matches and current exposure paths. It does not prove that a loss will occur, include unsupported protocols or execute a protective action.</p>
        <span className="mono">READ-ONLY / OBSERVE</span>
      </div>
    </section>
  );
}
