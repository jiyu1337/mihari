"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  FileCheck2,
  LoaderCircle,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { HelpLabel } from "@/components/help-tip";
import type { AnalysisResponse, PolicyRecommendation } from "@/lib/analysis";
import { helpCopy } from "@/lib/help-content";
import type { CorporateEvent } from "@/lib/product-data";

type EventFeedResponse = {
  mode: "live" | "fallback";
  events: CorporateEvent[];
  watchedCount: number;
  fetchedAt: string;
  warning?: string;
};

type PolicyRecommendationsProps = {
  heldSymbols: string[];
  heldEvents: CorporateEvent[];
  holderAccess: boolean;
  aiAnalysesPerDay: number;
  onOpenEvents: () => void;
  onOpenExposure: () => void;
};

function readable(value: string) {
  return value.replaceAll("_", " ").toUpperCase();
}

function priorityExplanation(priority: PolicyRecommendation["priority"]) {
  if (priority === "urgent") return "Review before allowing new activity that depends on the affected data.";
  if (priority === "review") return "An operator should verify the event and dependent calculations.";
  return "Keep monitoring and confirm normal reconciliation when the event completes.";
}

export function PolicyRecommendations({
  heldSymbols,
  heldEvents,
  holderAccess,
  aiAnalysesPerDay,
  onOpenEvents,
  onOpenExposure,
}: PolicyRecommendationsProps) {
  const [feed, setFeed] = useState<EventFeedResponse | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [analyses, setAnalyses] = useState<Record<string, AnalysisResponse>>({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState("");
  const [error, setError] = useState("");
  const requested = useRef(new Set<string>());
  const heldSet = useMemo(
    () => new Set(heldSymbols.map((symbol) => symbol.toUpperCase())),
    [heldSymbols],
  );
  const availableEvents = useMemo(() => {
    const byId = new Map<string, CorporateEvent>();
    for (const event of [...heldEvents, ...(feed?.events ?? [])]) {
      if (event.source === "robinhood") byId.set(event.id, event);
    }
    return [...byId.values()];
  }, [feed?.events, heldEvents]);

  const sync = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/profile/events?policy=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Policy source unavailable (${response.status})`);
      const payload = await response.json() as EventFeedResponse;
      setFeed(payload);
      setSelectedId((current) => payload.events.some((event) => event.id === current) ? current : "");
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Policy source unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void sync(), 0);
    return () => window.clearTimeout(timer);
  }, [sync]);

  const effectiveSelectedId = availableEvents.some((event) => event.id === selectedId)
    ? selectedId
    : availableEvents[0]?.id ?? "";
  const selectedEvent = availableEvents.find((event) => event.id === effectiveSelectedId) ?? null;
  const selectedAnalysis = selectedEvent ? analyses[selectedEvent.id] : undefined;
  const policy = selectedAnalysis?.policyRecommendation;
  const held = selectedEvent ? heldSet.has(selectedEvent.asset.toUpperCase()) : false;

  useEffect(() => {
    if (!selectedEvent || selectedEvent.source !== "robinhood" || analyses[selectedEvent.id] || requested.current.has(selectedEvent.id)) return;
    requested.current.add(selectedEvent.id);
    setAnalyzing(selectedEvent.id);
    setError("");
    void fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: selectedEvent.id, symbol: selectedEvent.asset }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Recommendation unavailable (${response.status})`);
        const result = await response.json() as AnalysisResponse;
        setAnalyses((current) => ({ ...current, [selectedEvent.id]: result }));
      })
      .catch((analysisError: unknown) => {
        requested.current.delete(selectedEvent.id);
        setError(analysisError instanceof Error ? analysisError.message : "Recommendation unavailable");
      })
      .finally(() => setAnalyzing(""));
  }, [analyses, selectedEvent]);

  return (
    <section className="workspace-view policy-view">
      <div className="workspace-title compact policy-title">
        <div><p className="mono">08 / POLICY RECOMMENDATIONS</p><h1>What should happen next.</h1></div>
        <p>A clear checklist for reviewing a verified event. MIHARI recommends. You decide. Nothing runs automatically.</p>
      </div>

      <div className="policy-source-bar mono">
        <span><HelpLabel label="SOURCE">{helpCopy.dataMode}</HelpLabel><strong>{feed?.mode === "live" ? "ROBINHOOD LIVE" : feed ? "FALLBACK" : "PENDING"}</strong></span>
        <span><HelpLabel label="DECISION OWNER">MIHARI prepares the review. You or the protocol operator approve any next step.</HelpLabel><strong>YOU</strong></span>
        <span><HelpLabel label="EXECUTION" align="end">{helpCopy.policyRecommendation}</HelpLabel><strong>NONE</strong></span>
        <button type="button" onClick={() => void sync()} disabled={loading}><RefreshCw className={loading ? "spin" : ""} size={16} />REFRESH</button>
      </div>

      <div className="policy-access-note">
        <CircleHelp size={20} />
        <div>
          <strong>{holderAccess ? "$MHR HOLDER ANALYSIS" : "OBSERVER ANALYSIS"}</strong>
          <p>Your current access includes up to {aiAnalysesPerDay} new AI {aiAnalysesPerDay === 1 ? "analysis" : "analyses"} per 24 hours. Cached recommendations and deterministic safety rules do not require a new AI call.</p>
        </div>
      </div>

      {error ? <div className="workspace-message error mono">{error}</div> : null}

      {loading && !feed ? (
        <div className="workspace-event-loading"><LoaderCircle className="spin" size={28} /><span className="mono">BUILDING POLICY CONTEXT</span></div>
      ) : availableEvents.length ? (
        <>
          <div className="policy-workbench">
            <aside className="policy-event-selector">
              <header><span className="mono">EVENTS WITH RECOMMENDATIONS</span><strong>{availableEvents.length}</strong></header>
              {availableEvents.map((event) => (
                <button type="button" className={event.id === effectiveSelectedId ? "active" : ""} key={event.id} onClick={() => setSelectedId(event.id)}>
                  <span><strong>{event.asset}</strong><small>{event.type}</small></span>
                  <span className="mono"><b>{heldSet.has(event.asset.toUpperCase()) ? "HOLDING" : "WATCHLIST"}</b><i>{event.sourceStatus}</i></span>
                  <ArrowRight size={17} />
                </button>
              ))}
            </aside>

            <article className="policy-recommendation-file">
              {selectedEvent ? (
                <>
                  <header>
                    <div><p className="mono">POLICY FILE / {selectedEvent.asset}</p><h2>{policy?.title ?? "Preparing recommendation."}</h2></div>
                    <span className={`policy-priority mono ${policy?.priority ?? "pending"}`}><HelpLabel label={policy ? `${policy.priority.toUpperCase()} PRIORITY` : analyzing === selectedEvent.id ? "ANALYZING" : "PENDING"} as="strong" align="end">{helpCopy.priority}</HelpLabel></span>
                  </header>

                  <div className="policy-signal-flow">
                    <article><ScanSearch size={24} /><span className="mono">01 / DETECTED EVENT</span><strong>{selectedEvent.type}</strong><small>{selectedEvent.sourceStatus}</small></article>
                    <ArrowRight size={20} />
                    <article><AlertTriangle size={24} /><span className="mono">02 / RISK INTERPRETATION</span><strong>{selectedAnalysis ? `${selectedAnalysis.risk.toUpperCase()} RISK` : "PENDING"}</strong><small>{selectedAnalysis?.affectedSystems.join(" / ").toUpperCase() ?? "READING EVIDENCE"}</small></article>
                    <ArrowRight size={20} />
                    <article className="recommendation"><FileCheck2 size={24} /><span className="mono">03 / RECOMMENDED POLICY</span><strong>{policy ? readable(policy.intent) : "BUILDING PLAN"}</strong><small>ADVISORY ONLY</small></article>
                  </div>

                  {policy && selectedAnalysis ? (
                    <>
                      <div className="policy-summary-grid">
                        <section><span className="mono">WHY THIS MATTERS</span><p>{policy.rationale}</p></section>
                        <section><span className="mono">SAFE RESPONSE</span><p>{selectedAnalysis.recommendedAction}</p></section>
                        <section><HelpLabel label="PRIORITY MEANS">{helpCopy.priority}</HelpLabel><p>{priorityExplanation(policy.priority)}</p></section>
                      </div>

                      <div className="policy-conditions">
                        <section>
                          <header><span className="mono">REQUIRED CHECKS</span><strong>{policy.checks.length}</strong></header>
                          <ol>{policy.checks.map((check) => <li key={check}><CheckCircle2 size={18} /><span>{check}</span></li>)}</ol>
                        </section>
                        <section>
                          <header><span className="mono">POLICY BOUNDARIES</span><strong>{readable(policy.operatorDecision)}</strong></header>
                          <div><HelpLabel label="APPLY WHEN">{helpCopy.applyWhen}</HelpLabel>{policy.applyWhen.map((condition) => <p key={condition}>{condition}</p>)}</div>
                          <div><HelpLabel label="CLEAR WHEN">{helpCopy.clearWhen}</HelpLabel>{policy.releaseWhen.map((condition) => <p key={condition}>{condition}</p>)}</div>
                        </section>
                      </div>

                      <footer>
                        <span><ShieldCheck size={20} /><strong>Recommendation only.</strong> No signature, approval or transaction is requested.</span>
                        <div>{held ? <button type="button" onClick={onOpenExposure}>OPEN PERSONAL EXPOSURE</button> : <button type="button" onClick={onOpenEvents}>OPEN EVENT FILE</button>}</div>
                      </footer>
                    </>
                  ) : (
                    <div className="policy-analysis-pending"><LoaderCircle className="spin" size={28} /><h3>Reading the verified event.</h3><p>MIHARI is separating source evidence, risk interpretation and the recommended operator review.</p></div>
                  )}
                </>
              ) : null}
            </article>
          </div>
        </>
      ) : (
        <div className="workspace-event-empty policy-empty">
          <ShieldCheck size={34} />
          <h2>No recommendation is required right now.</h2>
          <p>MIHARI found no current official corporate action for your monitored assets. The watchlist and verified holdings remain monitored.</p>
          <button type="button" onClick={onOpenEvents}>OPEN EVENT REGISTER</button>
        </div>
      )}

      <div className="policy-boundary">
        <span className="mono">PRODUCT BOUNDARY</span>
        <p>A policy recommendation is an explainable review plan. It does not prove that a loss will occur, replace operator judgment or authorize an onchain action.</p>
        <strong className="mono">OBSERVE / NO EXECUTION</strong>
      </div>
    </section>
  );
}
