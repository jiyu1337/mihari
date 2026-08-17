"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, FileKey2, LoaderCircle, X, XCircle } from "lucide-react";
import { HelpLabel } from "@/components/help-tip";
import type { GuardActionRecord } from "@/lib/guard-action";
import { helpCopy } from "@/lib/help-content";

type HistoryResponse = {
  actions?: GuardActionRecord[];
  error?: string;
  warning?: string;
};

function statusIcon(status: GuardActionRecord["status"]) {
  if (status === "approved") return <CheckCircle2 size={20} />;
  if (status === "dismissed") return <XCircle size={20} />;
  return <Clock3 size={20} />;
}

export function GuardDecisionHistory() {
  const [actions, setActions] = useState<GuardActionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const sync = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile/guard-actions", { cache: "no-store" });
      const payload = await response.json() as HistoryResponse;
      if (!response.ok) throw new Error(payload.error ?? "Guard history unavailable");
      setActions(payload.actions ?? []);
      setWarning(payload.warning ?? "");
    } catch (requestError) {
      setWarning(requestError instanceof Error ? requestError.message : "Guard history unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void sync();
    const refresh = () => void sync();
    window.addEventListener("mihari:guard-updated", refresh);
    return () => window.removeEventListener("mihari:guard-updated", refresh);
  }, [sync]);

  if (loading && !actions.length) {
    return <section className="guard-history guard-history-loading"><LoaderCircle className="spin" size={22} /><span className="mono">LOADING DECISION HISTORY</span></section>;
  }

  if (!actions.length) {
    return (
      <section className="guard-history guard-history-empty">
        <FileKey2 size={28} />
        <div><span className="mono">GUARD DECISION HISTORY</span><h3>No decisions recorded yet.</h3><p>Approved and dismissed Guard drafts will remain visible here after the source event leaves the active event window.</p></div>
      </section>
    );
  }

  const selected = actions.find((action) => action.id === selectedId) ?? null;

  return (
    <section className="guard-history">
      <header>
        <div><span className="mono">GUARD DECISION HISTORY</span><h3>Your private audit trail.</h3></div>
        <strong className="mono">{actions.length} RECORDS</strong>
      </header>
      <div className="guard-history-table">
        {actions.map((action) => (
          <article key={action.id}>
            <div className={`guard-history-status ${action.status}`}>{statusIcon(action.status)}<strong>{action.status.toUpperCase()}</strong></div>
            <div><span className="mono">ASSET / INTENT</span><strong>{action.symbol} / {action.intent.replaceAll("_", " ").toUpperCase()}</strong></div>
            <div><span className="mono">RECORDED</span><strong>{new Date(action.approvedAt ?? action.updatedAt).toLocaleString()}</strong></div>
            <div><HelpLabel label="DECISION RECEIPT" align="end">{helpCopy.decisionReceipt}</HelpLabel><strong className="mono">{action.decisionHash ? `${action.decisionHash.slice(0, 10)}...${action.decisionHash.slice(-8)}` : "NOT CREATED"}</strong></div>
            <button type="button" onClick={() => setSelectedId(action.id)}>OPEN <ArrowRight size={16} /></button>
          </article>
        ))}
      </div>
      {selected ? (
        <article className="guard-receipt-inspector">
          <header>
            <div><span className="mono">PRIVATE RECEIPT / {selected.symbol}</span><h3>{selected.preview.title}</h3></div>
            <button type="button" aria-label="Close receipt" onClick={() => setSelectedId("")}><X size={20} /></button>
          </header>
          <div className="guard-receipt-facts">
            <div><span className="mono">STATUS</span><strong>{selected.status.toUpperCase()}</strong></div>
            <div><span className="mono">CHAIN</span><strong>ROBINHOOD / {selected.preview.chainId}</strong></div>
            <div><span className="mono">EXECUTION</span><strong>NOT SUBMITTED</strong></div>
            <div><span className="mono">SCOPE</span><strong>{selected.preview.scope.join(" / ").toUpperCase()}</strong></div>
          </div>
          <div className="guard-receipt-hashes">
            <div><HelpLabel label="SOURCE HASH">Identifies the exact official event payload used to prepare this decision.</HelpLabel><code>{selected.sourceHash}</code></div>
            <div><HelpLabel label="DECISION HASH">{helpCopy.decisionReceipt}</HelpLabel><code>{selected.decisionHash ?? "NOT CREATED"}</code></div>
          </div>
          <div className="guard-receipt-detail-grid">
            <section><h4>ACTION STEPS</h4><ol>{selected.preview.actionSteps.map((step) => <li key={step}>{step}</li>)}</ol></section>
            <section><h4>SAFETY BOUNDARIES</h4><ul>{selected.preview.safetyBoundaries.map((boundary) => <li key={boundary}>{boundary}</li>)}</ul></section>
          </div>
          <footer><span className="mono">OPERATOR NOTE</span><p>{selected.approvalNote || "No operator note was added."}</p></footer>
        </article>
      ) : null}
      {warning ? <p className="guard-error mono">{warning}</p> : null}
    </section>
  );
}
