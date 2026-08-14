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
import type { ProtocolExposureSnapshot, ProtocolPosition } from "@/lib/protocol-exposure";

type ProtocolExposureResponse = ProtocolExposureSnapshot & {
  events: Array<{ id: string; asset: string; type: string; sourceStatus: string }>;
  source: {
    chainId: number;
    assetCatalog: string;
    corporateActions: string;
    protocols: string[];
  };
};

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
};

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
  const morphoScan = snapshot?.scans.find((item) => item.protocol === "morpho");
  const sourceStatus = loading
    ? "SCANNING"
    : error
      ? "ERROR"
      : morphoScan?.status === "live"
        ? "LIVE"
        : morphoScan?.status === "partial"
          ? "PARTIAL"
          : morphoScan?.status === "unavailable"
            ? "UNAVAILABLE"
            : "WAITING FOR WALLET";

  return (
    <section className="workspace-view protocol-view">
      <div className="workspace-title compact">
        <div><p className="mono">06 / DEFI EXPOSURE</p><h1>Beyond your wallet.</h1></div>
        <p>MIHARI checks whether your Stock Tokens also sit inside supported vaults or lending markets, then matches those positions to official corporate actions.</p>
      </div>

      <div className="protocol-source-bar mono">
        <span><Landmark size={14} />PROTOCOL <strong>MORPHO</strong></span>
        <span><Database size={14} />SOURCE <strong>{sourceStatus}</strong></span>
        <span>NETWORK <strong>ROBINHOOD CHAIN / 4663</strong></span>
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

      {loading ? (
        <div className="workspace-empty protocol-empty"><LoaderCircle className="spin" size={30} /><h2>Scanning protocol positions.</h2><p>This is read-only. MIHARI never requests token approvals or transactions.</p></div>
      ) : error ? (
        <div className="workspace-empty protocol-empty"><AlertTriangle size={30} /><h2>Protocol source unavailable.</h2><p>{error}</p><button onClick={() => void scan()}>TRY AGAIN</button></div>
      ) : !walletCount ? (
        <div className="workspace-empty protocol-empty"><Wallet size={30} /><h2>Link a wallet to start.</h2><p>MIHARI needs a verified address before it can look for personal protocol positions.</p><button onClick={onOpenWallets}>OPEN WALLETS</button></div>
      ) : snapshot?.positions.length ? (
        <div className="protocol-position-table">
          <header className="mono"><span>PROTOCOL POSITION</span><span>STOCK TOKEN</span><span>AMOUNT / VALUE</span><span>EVENT STATUS</span></header>
          {snapshot.positions.map((position) => (
            <article className={position.hasCorporateAction ? "exposed" : ""} key={position.id}>
              <span><strong>{position.marketName}</strong><small className="mono">MORPHO / {positionLabels[position.kind]}</small></span>
              <span><strong>{position.symbol}</strong><small className="mono">WALLET {shortAddress(position.wallet)}</small></span>
              <span><strong>{Number(position.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}</strong><small>{position.valueUsd ? formatMoney(Number(position.valueUsd)) : "VALUE UNAVAILABLE"}</small></span>
              <span className="protocol-event-state"><strong className="mono">{position.hasCorporateAction ? "EVENT MATCH" : "NO EVENT MATCH"}</strong><small>{position.corporateAction ? `${position.corporateAction.type} / ${position.corporateAction.status}` : "MONITORING CONTINUES"}</small></span>
            </article>
          ))}
        </div>
      ) : (
        <div className="workspace-empty protocol-empty"><Landmark size={30} /><h2>No supported Stock Token protocol position found.</h2><p>Morpho was checked successfully. This result does not mean the wallet has no DeFi activity elsewhere. More protocol adapters are coming.</p></div>
      )}

      <div className="protocol-coverage-note">
        <span className="mono">COVERAGE / RELEASE 01</span>
        <p><strong>Morpho is the first live adapter.</strong> MIHARI currently detects Robinhood Stock Tokens used in Morpho lending markets and vaults. Additional Robinhood Chain protocols will be added as verified adapters.</p>
        <span className="mono">READ-ONLY / NO APPROVALS / NO TRANSACTIONS</span>
      </div>
    </section>
  );
}
