"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Database,
  Landmark,
  LoaderCircle,
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

type ProtocolExposureProps = {
  walletCount: number;
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

function scanLabel(scan: ProtocolScan | undefined, protocol: ProtocolDefinition, loading: boolean) {
  if (protocol.stage === "planned") return "PLANNED";
  if (loading) return "SCANNING";
  if (!scan || scan.status === "not_scanned") return "WAITING";
  return scan.status.toUpperCase();
}

export function ProtocolExposure({ walletCount, onOpenWallets }: ProtocolExposureProps) {
  const [snapshot, setSnapshot] = useState<ProtocolExposureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const scan = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile/protocol-exposure", { cache: "no-store" });
      const payload = await response.json() as ProtocolExposureResponse & { error?: string; warning?: string };
      if (!response.ok) throw new Error(payload.warning ?? payload.error ?? "Protocol scan unavailable");
      setSnapshot(payload);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Protocol scan unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void scan(), 0);
    return () => window.clearTimeout(timer);
  }, [scan]);

  const totalValue = useMemo(() => snapshot?.positions.reduce(
    (total, position) => total + Number(position.valueUsd ?? 0),
    0,
  ) ?? 0, [snapshot]);
  const eventMatches = snapshot?.positions.filter((position) => position.hasCorporateAction).length ?? 0;
  const protocolById = useMemo(() => new Map(
    snapshot?.protocolCatalog.map((protocol) => [protocol.id, protocol]) ?? [],
  ), [snapshot]);
  const scanByProtocol = useMemo(() => new Map(
    snapshot?.scans.map((scan) => [scan.protocol, scan]) ?? [],
  ), [snapshot]);
  const activeProtocolIds = useMemo(() => new Set(snapshot?.protocolCatalog
    .filter((protocol) => protocol.stage !== "planned")
    .map((protocol) => protocol.id) ?? []), [snapshot]);
  const activeScans = snapshot?.scans.filter((scan) => activeProtocolIds.has(scan.protocol)) ?? [];
  const checkedProtocols = activeScans.filter((scan) => scan.status === "live" || scan.status === "partial").length;
  const hasUnavailableSource = activeScans.some((scan) => scan.status === "unavailable");
  const hasPartialSource = activeScans.some((scan) => scan.status === "partial");
  const sourceStatus = loading
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
        <div><p className="mono">06 / DEFI EXPOSURE</p><h1>Beyond your wallet.</h1></div>
        <p>MIHARI checks supported lending, vault and liquidity protocols, then maps every recognized Stock Token position to official corporate actions.</p>
      </div>

      <div className="protocol-source-bar mono">
        <span><Landmark size={14} />ENGINE <strong>MULTI-PROTOCOL</strong></span>
        <span><Database size={14} />SOURCE <strong>{sourceStatus}</strong></span>
        <span>COVERAGE <strong>{checkedProtocols} CHECKED / {snapshot?.protocolCatalog.length ?? 7} MAPPED</strong></span>
        <button onClick={() => void scan()} disabled={loading}><RefreshCw className={loading ? "spin" : ""} size={14} />SCAN AGAIN</button>
      </div>

      <div className="workspace-metrics protocol-metrics mono">
        <div><span>VERIFIED WALLETS</span><strong>{walletCount}</strong></div>
        <div><span>PROTOCOL POSITIONS</span><strong>{snapshot?.positions.length ?? 0}</strong></div>
        <div><span>INDICATIVE VALUE</span><strong>{formatMoney(totalValue)}</strong></div>
        <div className={eventMatches ? "alert" : ""}><span>EVENT MATCHES</span><strong>{eventMatches}</strong></div>
      </div>

      <div className="protocol-explainer">
        <article><Wallet size={20} /><span><strong>Direct holdings</strong><small>The Exposure page shows Stock Tokens held directly by your verified wallets.</small></span></article>
        <ArrowRight size={18} />
        <article><Landmark size={20} /><span><strong>Protocol exposure</strong><small>This page looks inside supported DeFi positions where the token may be supplied, borrowed, used as collateral or deposited in a vault.</small></span></article>
        <ArrowRight size={18} />
        <article><ShieldCheck size={20} /><span><strong>Event match</strong><small>MIHARI checks whether an official corporate action touches the Stock Token inside that position.</small></span></article>
      </div>

      {snapshot?.protocolCatalog.length ? (
        <div className="protocol-coverage-grid">
          {snapshot.protocolCatalog.map((protocol) => {
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
                  <span>{protocolScan?.positionCount ?? 0} POSITIONS</span>
                  <span>{protocol.stage.toUpperCase()}</span>
                </footer>
              </article>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <div className="workspace-empty protocol-empty"><LoaderCircle className="spin" size={30} /><h2>Scanning protocol positions.</h2><p>This is read-only. MIHARI never requests token approvals or transactions.</p></div>
      ) : error ? (
        <div className="workspace-empty protocol-empty"><AlertTriangle size={30} /><h2>Protocol engine unavailable.</h2><p>{error}</p><button onClick={() => void scan()}>TRY AGAIN</button></div>
      ) : !walletCount ? (
        <div className="workspace-empty protocol-empty"><Wallet size={30} /><h2>Link a wallet to start.</h2><p>MIHARI needs a verified address before it can look for personal protocol positions.</p><button onClick={onOpenWallets}>OPEN WALLETS</button></div>
      ) : snapshot?.positions.length ? (
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
      ) : (
        <div className="workspace-empty protocol-empty"><Landmark size={30} /><h2>No supported Stock Token protocol position found.</h2><p>The active adapters completed without finding a recognized Stock Token position. Planned sources are shown above and are not included in this result.</p></div>
      )}

      <div className="protocol-coverage-note">
        <span className="mono">COVERAGE / SOURCE TRUTH</span>
        <p><strong>Morpho, Uniswap V3, Uniswap V4, Arcus and Lighter are active adapters.</strong> Planned sources are visible so users can see exactly what is and is not included. A protocol is never counted as checked until MIHARI can verify its user-position data.</p>
        <span className="mono">READ-ONLY / NO APPROVALS / NO TRANSACTIONS</span>
      </div>
    </section>
  );
}
