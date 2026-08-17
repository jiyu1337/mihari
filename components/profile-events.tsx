"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, LoaderCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { HelpLabel } from "@/components/help-tip";
import { ShareSignalButton } from "@/components/share-signal";
import type { AnalysisResponse } from "@/lib/analysis";
import { helpCopy } from "@/lib/help-content";
import type { CorporateEvent } from "@/lib/product-data";
import { normalizeShareRisk } from "@/lib/share-signal";

type EventFeedResponse = {
  mode: "live" | "fallback";
  events: CorporateEvent[];
  watchedCount: number;
  fetchedAt: string;
  warning?: string;
};

type ProfileEventsProps = {
  heldSymbols: string[];
  watchlistLimit: number;
  onOpenExposure: () => void;
  onOpenPolicy: () => void;
};

function riskLabel(event: CorporateEvent, analysis?: AnalysisResponse) {
  if (analysis) return analysis.risk.toUpperCase();
  if (event.severity === "critical") return "CRITICAL";
  if (event.severity === "watch") return "HIGH";
  return "LOW";
}

export function ProfileEvents({ heldSymbols, watchlistLimit, onOpenExposure, onOpenPolicy }: ProfileEventsProps) {
  const [feed, setFeed] = useState<EventFeedResponse | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResponse>>({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState("");
  const [error, setError] = useState("");
  const requestedAnalyses = useRef(new Set<string>());
  const heldSet = useMemo(() => new Set(heldSymbols.map((symbol) => symbol.toUpperCase())), [heldSymbols]);

  const syncEvents = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`/api/profile/events?sync=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Event feed unavailable (${response.status})`);
      const payload = await response.json() as EventFeedResponse;
      setFeed(payload);
      setSelectedId((current) => payload.events.some((event) => event.id === current)
        ? current
        : payload.events[0]?.id ?? "");
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Event feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialSync = window.setTimeout(() => void syncEvents(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void syncEvents();
    }, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncEvents();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(initialSync);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [syncEvents]);

  const selectedEvent = feed?.events.find((event) => event.id === selectedId) ?? null;
  const selectedAnalysis = selectedEvent ? analyses[selectedEvent.id] : undefined;

  useEffect(() => {
    if (!selectedEvent || selectedEvent.source !== "robinhood" || analyses[selectedEvent.id] || requestedAnalyses.current.has(selectedEvent.id)) return;
    requestedAnalyses.current.add(selectedEvent.id);
    setAnalyzing(selectedEvent.id);
    void fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: selectedEvent.id, symbol: selectedEvent.asset }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Analysis unavailable (${response.status})`);
        const analysis = await response.json() as AnalysisResponse;
        setAnalyses((current) => ({ ...current, [selectedEvent.id]: analysis }));
      })
      .catch((analysisError: unknown) => {
        setError(analysisError instanceof Error ? analysisError.message : "Analysis unavailable");
      })
      .finally(() => setAnalyzing(""));
  }, [analyses, selectedEvent]);

  return (
    <section className="workspace-view">
      <div className="workspace-title compact">
        <div><p className="mono">02 / PRIVATE EVENT REGISTER</p><h1>Watchlist events.</h1></div>
        <p>Official corporate actions for your saved assets. This page refreshes every minute while it is open.</p>
      </div>
      <div className="workspace-event-status mono">
        <span><HelpLabel label="WATCHING">{helpCopy.watchScope}</HelpLabel><strong>{feed?.watchedCount ?? 0} / {watchlistLimit}</strong></span>
        <span><HelpLabel label="SOURCE">{helpCopy.dataMode}</HelpLabel><strong>{feed?.mode === "fallback" ? "FALLBACK" : "ROBINHOOD LIVE"}</strong></span>
        <span><HelpLabel label="LAST SYNC">{helpCopy.lastSync}</HelpLabel><strong>{feed?.fetchedAt ? new Date(feed.fetchedAt).toLocaleTimeString() : "PENDING"}</strong></span>
        <button type="button" onClick={() => void syncEvents()} disabled={loading}><RefreshCw className={loading ? "spin" : ""} size={14} />SYNC NOW</button>
      </div>
      {error ? <div className="workspace-message error mono">{error}</div> : null}

      {loading && !feed ? (
        <div className="workspace-event-loading"><LoaderCircle className="spin" size={26} /><span className="mono">READING OFFICIAL EVENT RECORDS</span></div>
      ) : feed?.events.length ? (
        <div className="workspace-event-layout">
          <div className="workspace-event-list">
            <header className="mono"><span>CURRENT MATCHES</span><strong>{feed.events.length} EVENTS</strong></header>
            {feed.events.map((event) => {
              const held = heldSet.has(event.asset.toUpperCase());
              return (
                <button type="button" className={selectedId === event.id ? "active" : ""} key={event.id} onClick={() => setSelectedId(event.id)}>
                  <span className="workspace-event-marker" />
                  <span><strong>{event.asset}</strong><small>{event.type}</small></span>
                  <span className="mono"><b>{event.sourceStatus}</b>{held ? <i>HELD</i> : <i>WATCHLIST</i>}</span>
                  <ArrowRight size={15} />
                </button>
              );
            })}
          </div>

          {selectedEvent ? (
            <article className="workspace-event-file">
              <header>
                <div>
                  <p className="mono">INCIDENT FILE / {selectedEvent.asset} / {selectedEvent.type}</p>
                  <h2>{selectedEvent.name}</h2>
                </div>
                <div className="workspace-event-badges mono">
                  <span>{riskLabel(selectedEvent, selectedAnalysis)} RISK</span>
                  <span className={heldSet.has(selectedEvent.asset.toUpperCase()) ? "held" : ""}>{heldSet.has(selectedEvent.asset.toUpperCase()) ? "HELD IN WALLET" : "WATCHLIST ONLY"}</span>
                </div>
              </header>
              <div className="workspace-risk-meta mono">
                <span>EVENT DATE <strong>{selectedEvent.time}</strong></span>
                <span><HelpLabel label="SOURCE STATUS">{helpCopy.sourceStatus}</HelpLabel><strong>{selectedEvent.sourceStatus}</strong></span>
                <span><HelpLabel label="ANALYSIS">{selectedAnalysis?.mode === "deterministic" ? helpCopy.ruleBased : helpCopy.aiAnalysis}</HelpLabel><strong>{analyzing === selectedEvent.id ? "RUNNING" : selectedAnalysis?.mode === "ai" ? "AI" : selectedAnalysis ? "RULE BASED" : "SOURCE"}</strong></span>
                <span><HelpLabel label="CONFIDENCE" align="end">{helpCopy.confidence}</HelpLabel><strong>{selectedAnalysis ? `${selectedAnalysis.confidence}%` : "PENDING"}</strong></span>
              </div>
              <div className="workspace-risk-analysis">
                <section><span className="mono">01 / WHAT HAPPENED</span><p>{selectedAnalysis?.summary ?? selectedEvent.summary}</p></section>
                <section><span className="mono">02 / POSSIBLE IMPACT</span><p>{selectedAnalysis?.impactAssessment ?? selectedEvent.impact}</p></section>
                <section className="response"><span className="mono">03 / SAFE RESPONSE</span><p>{selectedAnalysis?.recommendedAction ?? selectedEvent.action}</p></section>
              </div>
              <footer>
                <span className="mono"><HelpLabel label="AFFECTED SYSTEMS">{helpCopy.affectedSystems}</HelpLabel><strong>{selectedAnalysis?.affectedSystems.join(" / ").toUpperCase() ?? "ANALYSIS PENDING"}</strong></span>
                <div className="workspace-event-actions">
                  <ShareSignalButton
                    symbol={selectedEvent.asset}
                    eventType={selectedEvent.type}
                    risk={normalizeShareRisk(riskLabel(selectedEvent, selectedAnalysis))}
                    context={heldSet.has(selectedEvent.asset.toUpperCase()) ? "holding" : "watchlist"}
                    systems={selectedAnalysis?.affectedSystems ?? []}
                  />
                  <button type="button" onClick={onOpenPolicy}>OPEN POLICY <ArrowRight size={14} /></button>
                  {heldSet.has(selectedEvent.asset.toUpperCase()) ? <button type="button" onClick={onOpenExposure}>OPEN PERSONAL EXPOSURE <ArrowRight size={14} /></button> : null}
                </div>
              </footer>
            </article>
          ) : null}
        </div>
      ) : (
        <div className="workspace-event-empty">
          <ShieldCheck size={32} />
          <h2>No current event matches.</h2>
          <p>Your saved assets remain monitored. This means the current Robinhood corporate-action response contains no matching record, not that future risk is impossible.</p>
          <span className="mono">AUTOMATIC REFRESH / 60 SECONDS</span>
        </div>
      )}
      {feed?.mode === "fallback" ? <div className="workspace-event-warning mono"><AlertTriangle size={15} />LIVE SOURCE UNAVAILABLE. FALLBACK DATA IS LABELLED AND NOT USED AS WALLET RISK EVIDENCE.</div> : null}
    </section>
  );
}
