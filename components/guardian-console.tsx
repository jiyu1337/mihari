"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  ChevronRight,
  CircleHelp,
  CircleGauge,
  FileCheck2,
  Orbit,
  RefreshCw,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { HelpLabel } from "@/components/help-tip";
import type { AnalysisResponse } from "@/lib/analysis";
import { helpCopy } from "@/lib/help-content";
import { corporateEvents, type CorporateEvent } from "@/lib/product-data";
import { PUBLIC_WATCHLIST_ASSETS } from "@/lib/product-limits";
import type { MarketSnapshot } from "@/lib/robinhood";

type LocalConfiguration = {
  wallet?: string;
  assets?: string[];
  mode?: string;
};

type DataMode = "loading" | MarketSnapshot["mode"];

const defaultConfiguration: LocalConfiguration = {
  assets: ["NVDA", "AAPL", "TSLA"],
  mode: "observe",
};

const defaultConfigurationJson = JSON.stringify(defaultConfiguration);

function subscribeToConfiguration(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getConfigurationSnapshot() {
  return window.localStorage.getItem("mihari:configuration") ?? defaultConfigurationJson;
}

function getServerConfigurationSnapshot() {
  return defaultConfigurationJson;
}

function shortAddress(address?: string) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "READ-ONLY";
}

function shortEventId(id: string) {
  if (!id.startsWith("0x")) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function fileIndex(id: string) {
  if (id.startsWith("0x")) return id.slice(-4).toUpperCase();
  return id.replace("CA–", "");
}

function formatSyncTime(value: string | null) {
  if (!value) return "NOT SYNCED";
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function GuardianConsole() {
  const [events, setEvents] = useState<CorporateEvent[]>(corporateEvents);
  const [selectedId, setSelectedId] = useState(corporateEvents[0].id);
  const [dataMode, setDataMode] = useState<DataMode>("loading");
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [priceCount, setPriceCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResponse>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisErrors, setAnalysisErrors] = useState<Record<string, string>>({});
  const requestedAnalysisIds = useRef(new Set<string>());
  const configurationJson = useSyncExternalStore(
    subscribeToConfiguration,
    getConfigurationSnapshot,
    getServerConfigurationSnapshot,
  );
  const configuration = useMemo(() => {
    try {
      return JSON.parse(configurationJson) as LocalConfiguration;
    } catch {
      return defaultConfiguration;
    }
  }, [configurationJson]);

  const symbols = useMemo(
    () => ((configuration.assets?.length ? configuration.assets : defaultConfiguration.assets) ?? [])
      .slice(0, PUBLIC_WATCHLIST_ASSETS),
    [configuration.assets],
  );
  const selected = events.find((event) => event.id === selectedId) ?? events[0] ?? null;

  const analyzeEvent = useCallback(async (event: CorporateEvent, force = false) => {
    if (event.source !== "robinhood") return;
    if (!force && requestedAnalysisIds.current.has(event.id)) return;

    requestedAnalysisIds.current.add(event.id);
    setAnalyzingId(event.id);
    setAnalysisErrors((current) => {
      const next = { ...current };
      delete next[event.id];
      return next;
    });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, symbol: event.asset }),
      });
      if (!response.ok) throw new Error(`Analysis unavailable (${response.status})`);
      const result = (await response.json()) as AnalysisResponse;
      setAnalyses((current) => ({ ...current, [event.id]: result }));
    } catch (error) {
      setAnalysisErrors((current) => ({
        ...current,
        [event.id]: error instanceof Error ? error.message : "Analysis unavailable",
      }));
    } finally {
      setAnalyzingId((current) => (current === event.id ? null : current));
    }
  }, []);

  const syncMarketData = useCallback(async () => {
    setSyncing(true);
    try {
      const query = new URLSearchParams({
        symbols: symbols.join(","),
        refresh: Date.now().toString(),
      });
      const response = await fetch(`/api/corporate-actions?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`MIHARI API responded ${response.status}`);
      const snapshot = (await response.json()) as MarketSnapshot;
      setEvents(snapshot.events);
      setDataMode(snapshot.mode);
      setFetchedAt(snapshot.fetchedAt);
      setPriceCount(snapshot.prices.length);
      setAssetCount(snapshot.assets.length);
      setSelectedId((current) =>
        snapshot.events.some((event) => event.id === current)
          ? current
          : (snapshot.events[0]?.id ?? ""),
      );
    } catch {
      setEvents(corporateEvents);
      setDataMode("fallback");
      setFetchedAt(new Date().toISOString());
      setPriceCount(0);
      setAssetCount(0);
    } finally {
      setSyncing(false);
    }
  }, [symbols]);

  useEffect(() => {
    const initialSync = window.setTimeout(() => void syncMarketData(), 0);
    return () => window.clearTimeout(initialSync);
  }, [syncMarketData]);

  useEffect(() => {
    if (!selected || selected.source !== "robinhood" || analyses[selected.id]) return;
    void analyzeEvent(selected);
  }, [analyses, analyzeEvent, selected]);

  const isLive = dataMode === "live";
  const modeLabel = dataMode === "loading" ? "CONNECTING" : isLive ? "LIVE DATA" : "SIMULATED FALLBACK";
  const selectedAnalysis = selected ? analyses[selected.id] : undefined;
  const selectedIsAnalyzing = selected ? analyzingId === selected.id : false;
  const selectedAnalysisError = selected ? analysisErrors[selected.id] : undefined;
  const displayedConfidence = selectedAnalysis?.confidence ?? selected?.confidence ?? null;
  const selectedRisk = selectedAnalysis?.risk ?? (selected?.severity === "critical" ? "critical" : selected?.severity === "watch" ? "high" : "low");

  return (
    <div className="guardian-shell">
      <aside className="guardian-sidebar">
        <Link className="console-brand" href="/">
          <BrandMark inverted />
          <span>MIHARI</span>
        </Link>
        <nav aria-label="Guardian console">
          <Link className="active" href="/app"><Activity size={17} />Events</Link>
          <Link href="/map"><Orbit size={17} />Map <small>NEW</small></Link>
          <Link href="/map"><ShieldCheck size={17} />Policies <small>LIVE</small></Link>
          <Link href="/docs#status"><FileCheck2 size={17} />Proofs <small>SOON</small></Link>
          <Link href="/docs"><Orbit size={17} />Docs</Link>
          <Link href="/launch"><Settings2 size={17} />Setup</Link>
        </nav>
        <div className="console-network mono">
          <span><i /> {modeLabel}</span>
          <p>ROBINHOOD CHAIN</p>
          <strong>CHAIN ID 4663</strong>
        </div>
      </aside>

      <main className="guardian-main">
        <header className="console-header">
          <div>
            <p className="mono">CORPORATE ACTION MONITOR / 企業行動監視</p>
            <h1>Event register</h1>
          </div>
          <div className="console-header-actions">
            <button aria-label="Notifications"><Bell size={17} /></button>
            <span className="console-identity mono">{shortAddress(configuration.wallet)}</span>
          </div>
        </header>

        <section className="console-strip mono" aria-label="System status">
          <p><HelpLabel label="WATCH SCOPE">{helpCopy.watchScope}</HelpLabel><strong>{symbols.length} ASSETS</strong></p>
          <p><HelpLabel label="DATA MODE">{helpCopy.dataMode}</HelpLabel><strong>{modeLabel}</strong></p>
          <p><HelpLabel label="LAST SOURCE SYNC">{helpCopy.lastSync}</HelpLabel><strong>{syncing ? "SYNCING…" : formatSyncTime(fetchedAt)}</strong></p>
          <button onClick={syncMarketData} disabled={syncing}>
            <RefreshCw className={syncing ? "spin" : ""} size={14} /> REFRESH
          </button>
        </section>

        <details className="screen-guide" open>
          <summary>
            <span><CircleHelp size={15} /> HOW TO READ THIS SCREEN</span>
            <small className="mono">RESULT LABELS / 06</small>
          </summary>
          <div className="screen-guide-grid">
            <p><strong>WATCHED</strong><span>Assets MIHARI checks on every refresh.</span></p>
            <p><strong>EVENTS</strong><span>Watched assets with an official corporate-action record.</span></p>
            <p><strong>INCIDENT FILE</strong><span>The selected event and its current source status.</span></p>
            <p><strong>AI CONFIDENCE</strong><span>Evidence completeness, not a price prediction.</span></p>
            <p><strong>BOUNDED RESPONSE</strong><span>A recommended safe action. Nothing executes automatically.</span></p>
            <p><strong>CHAIN PROOF</strong><span>An onchain receipt. “Not recorded” means no transaction ran.</span></p>
          </div>
        </details>

        <div className="console-workspace">
          <section className="event-register" aria-labelledby="register-title">
            <div className="register-head mono">
              <span id="register-title">{isLive ? "ROBINHOOD EVENT REGISTER" : "SIMULATED EVENT REGISTER"} / 監視中</span>
              <span>{events.length.toString().padStart(2, "0")} EVENTS / {symbols.length.toString().padStart(2, "0")} WATCHED</span>
            </div>
            <div className="event-list">
              {events.length === 0 ? (
                <div className="event-empty mono">
                  <strong>NO MATCHING CORPORATE ACTIONS</strong>
                  <span>The selected assets have no recent records in the current source window.</span>
                </div>
              ) : events.map((event) => (
                <button
                  className={selected?.id === event.id ? "selected" : ""}
                  key={event.id}
                  onClick={() => setSelectedId(event.id)}
                >
                  <span className={`severity-mark ${event.severity}`} />
                  <span className="event-id mono">{shortEventId(event.id)}<small>{event.time}</small></span>
                  <span className="event-asset"><strong>{event.asset}</strong><small>{event.type}</small></span>
                  <span className="event-impact mono">
                    {event.affected === null ? event.sourceStatus : `${event.affected} POSITIONS`}
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
            <div className="scope-summary">
              <div>
                <p className="mono">WATCHLIST / {symbols.length} ASSETS</p>
                <div className="scope-symbols">
                  {symbols.slice(0, 12).map((symbol) => <span className="mono" key={symbol}>{symbol}</span>)}
                  {symbols.length > 12 && <span className="mono">+{symbols.length - 12} MORE</span>}
                </div>
              </div>
              <p>
                {events.length} of {symbols.length} watched assets currently have Robinhood corporate-action records.
                Assets without an event remain monitored and do not appear in the register.
              </p>
            </div>
            <div className="source-register mono">
              <p><span>SOURCE 01</span><strong>ASSET METADATA</strong><i>{isLive ? `${assetCount} LIVE` : "FALLBACK"}</i></p>
              <p><span>SOURCE 02</span><strong>CORPORATE ACTIONS</strong><i>{isLive ? "ROBINHOOD" : "SIMULATED"}</i></p>
              <p><span>SOURCE 03</span><strong>RAW PRICE QUOTES</strong><i>{isLive ? `${priceCount} LIVE` : "UNAVAILABLE"}</i></p>
            </div>
          </section>

          {selected ? (
            <article className="incident-file" aria-labelledby="incident-file-title">
              <div className="incident-record-bar mono" aria-label="Selected event metadata">
                <p><span>SELECTED EVENT</span><strong>{selected.asset} / {selected.type}</strong></p>
                <p><HelpLabel label="SOURCE STATUS">{helpCopy.sourceStatus}</HelpLabel><strong className={`record-status ${selected.severity}`}>{selected.sourceStatus}</strong></p>
                <p><HelpLabel label="RISK">{helpCopy.risk}</HelpLabel><strong>{selectedRisk.toUpperCase()}</strong></p>
                <p><span>RECORD ID</span><strong>{fileIndex(selected.id)}</strong></p>
              </div>
              <div className="file-body">
                <header>
                  <div>
                    <p className="mono">{selected.asset} / {selected.type} · RISK {selectedRisk.toUpperCase()}</p>
                    <h2 id="incident-file-title">{selected.name}</h2>
                  </div>
                  <div className="confidence-gauge">
                    <CircleGauge size={25} strokeWidth={1.4} />
                    <span className="mono">
                      <HelpLabel label={selectedAnalysis?.mode === "deterministic" ? "RULE CONFIDENCE" : "AI CONFIDENCE"} align="end">
                        {selectedAnalysis?.mode === "deterministic" ? helpCopy.ruleBased : helpCopy.confidence}
                      </HelpLabel>
                      <strong>
                        {selectedIsAnalyzing
                          ? "ANALYZING…"
                          : displayedConfidence === null
                            ? "NOT ANALYZED"
                            : `${displayedConfidence}%`}
                      </strong>
                    </span>
                    {selectedAnalysisError ? (
                      <button onClick={() => void analyzeEvent(selected, true)}>RETRY</button>
                    ) : null}
                  </div>
                </header>

                <section className="analysis-sheet">
                  <div className="analysis-block">
                    <span className="analysis-number mono">01</span>
                    <div><p className="mono">OBSERVATION / 観測</p><h3>{selectedAnalysis?.summary ?? selected.summary}</h3></div>
                  </div>
                  <div className="analysis-block">
                    <span className="analysis-number mono">02</span>
                    <div><p className="mono">IMPACT MAP / 影響</p><h3>{selectedAnalysis?.impactAssessment ?? selected.impact}</h3></div>
                  </div>
                  <div className="analysis-block action-block">
                    <span className="analysis-number mono">03</span>
                    <div><p className="mono">BOUNDED RESPONSE / 対応</p><h3>{selectedAnalysis?.recommendedAction ?? selected.action}</h3></div>
                  </div>
                </section>

                <footer className="file-proof mono">
                  <div><Orbit size={18} /><span>DATA SOURCE<strong>{selected.source === "robinhood" ? "ROBINHOOD API" : "SIMULATION"}</strong></span></div>
                  <div><ShieldCheck size={18} /><span><HelpLabel label="AFFECTED SYSTEMS">{helpCopy.affectedSystems}</HelpLabel><strong>{selectedAnalysis ? selectedAnalysis.affectedSystems.join(" / ").toUpperCase() : selected.affected === null ? "INDEXING PENDING" : `${selected.affected} POSITIONS`}</strong></span></div>
                  <div><FileCheck2 size={18} /><span><HelpLabel label="CHAIN PROOF" align="end">{helpCopy.chainProof}</HelpLabel><strong>{selected.proof ?? "NOT RECORDED"}</strong></span></div>
                </footer>
              </div>
            </article>
          ) : (
            <section className="incident-empty">
              <Orbit size={30} strokeWidth={1.2} />
              <p className="mono">SOURCE CONNECTED</p>
              <h2>No recent corporate actions for this watch scope.</h2>
              <p>MIHARI will surface a record when the official source reports a matching event.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
