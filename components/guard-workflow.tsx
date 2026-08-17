"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileKey2,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  X,
} from "lucide-react";
import { HelpLabel } from "@/components/help-tip";
import type { GuardActionRecord } from "@/lib/guard-action";
import { helpCopy } from "@/lib/help-content";
import type { CorporateEvent } from "@/lib/product-data";

type GuardWorkflowProps = {
  event: CorporateEvent;
  held: boolean;
  holderAccess: boolean;
  holderThreshold: string;
};

type GuardResponse = {
  action?: GuardActionRecord;
  actions?: GuardActionRecord[];
  error?: string;
  receipt?: {
    type: "private_decision_receipt";
    decisionHash: string;
    chainId: number;
    transactionHash: null;
    chainStatus: "not_submitted";
  };
};

function formatThreshold(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString("en-US") : value;
}

function readable(value: string) {
  return value.replaceAll("_", " ").toUpperCase();
}

export function GuardWorkflow({ event, held, holderAccess, holderThreshold }: GuardWorkflowProps) {
  const [actions, setActions] = useState<GuardActionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState([false, false, false]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetch("/api/profile/guard-actions", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as GuardResponse;
        if (!response.ok) throw new Error(payload.error ?? "Guard history unavailable");
        if (active) setActions(payload.actions ?? []);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Guard history unavailable");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const action = useMemo(
    () => actions.find((candidate) => candidate.sourceEventId === event.id && candidate.symbol === event.asset),
    [actions, event.asset, event.id],
  );
  const approvalPhrase = `APPROVE ${event.asset.toUpperCase()}`;
  const canApprove = checks.every(Boolean) && confirmation === approvalPhrase;

  async function prepare() {
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/profile/guard-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, symbol: event.asset }),
      });
      const payload = await response.json() as GuardResponse;
      if (!response.ok || !payload.action) throw new Error(payload.error ?? "Could not prepare Guard action");
      setActions((current) => [payload.action!, ...current.filter((item) => item.id !== payload.action!.id)]);
      window.dispatchEvent(new Event("mihari:guard-updated"));
      setChecks([false, false, false]);
      setConfirmation("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not prepare Guard action");
    } finally {
      setWorking(false);
    }
  }

  async function decide(decision: "approve" | "dismiss") {
    if (!action) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/profile/guard-actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: action.id, decision, confirmation, note }),
      });
      const payload = await response.json() as GuardResponse;
      if (!response.ok || !payload.action) throw new Error(payload.error ?? "Could not record Guard decision");
      setActions((current) => current.map((item) => item.id === payload.action!.id ? payload.action! : item));
      window.dispatchEvent(new Event("mihari:guard-updated"));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not record Guard decision");
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return <section className="guard-workflow guard-loading"><LoaderCircle className="spin" size={24} /><span className="mono">LOADING GUARD STATE</span></section>;
  }

  if (!holderAccess) {
    return (
      <section className="guard-workflow">
        <header><div><span className="mono">04 / GUARD ACTION</span><h3>Turn the review into a controlled decision.</h3></div><span className="guard-beta mono">PRIVATE BETA</span></header>
        <div className="guard-gate">
          <LockKeyhole size={28} />
          <div><strong>Guard actions require $MHR Holder access.</strong><p>Your recommendation remains available. Hold at least {formatThreshold(holderThreshold)} MHR in verified wallets to prepare and approve a Guard decision.</p></div>
        </div>
      </section>
    );
  }

  if (!held) {
    return (
      <section className="guard-workflow">
        <header><div><span className="mono">04 / GUARD ACTION</span><h3>No position to guard.</h3></div><span className="guard-beta mono">ADVISORY ONLY</span></header>
        <div className="guard-gate advisory">
          <AlertTriangle size={28} />
          <div><strong>{event.asset} is monitored as a watchlist research signal.</strong><p>Guard decisions are reserved for Stock Tokens found in a verified wallet. This keeps research separate from real exposure.</p></div>
        </div>
      </section>
    );
  }

  if (!action || action.status === "dismissed") {
    return (
      <section className="guard-workflow">
        <header><div><span className="mono">04 / GUARD ACTION</span><h3>Prepare a bounded response.</h3></div><span className="guard-beta mono">PRIVATE BETA</span></header>
        <div className="guard-start">
          <ShieldCheck size={30} />
          <div><strong>MIHARI will rebuild the action from the current official event.</strong><p>You will see the scope, safety boundaries and closing conditions before recording any decision.</p></div>
          <button type="button" onClick={() => void prepare()} disabled={working}>{working ? <LoaderCircle className="spin" size={17} /> : <ClipboardCheck size={17} />}PREPARE GUARD ACTION</button>
        </div>
        {error ? <p className="guard-error mono">{error}</p> : null}
      </section>
    );
  }

  if (action.status === "approved") {
    return (
      <section className="guard-workflow guard-receipt">
        <header><div><span className="mono">04 / GUARD DECISION</span><h3>Approval recorded.</h3></div><span className="guard-beta approved mono">APPROVED</span></header>
        <div className="guard-receipt-grid">
          <div><FileKey2 size={26} /><HelpLabel label="PRIVATE RECEIPT">{helpCopy.decisionReceipt}</HelpLabel><strong>{action.decisionHash?.slice(0, 14)}...{action.decisionHash?.slice(-8)}</strong></div>
          <div><ShieldCheck size={26} /><HelpLabel label="EXECUTION">{helpCopy.executionBoundary}</HelpLabel><strong>NOT SUBMITTED</strong></div>
          <div><CheckCircle2 size={26} /><span className="mono">RECORDED</span><strong>{action.approvedAt ? new Date(action.approvedAt).toLocaleString() : "CONFIRMED"}</strong></div>
        </div>
        <p>This private receipt proves which event, preview and operator decision were recorded. It is not an onchain transaction and does not move funds.</p>
        {error ? <p className="guard-error mono">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="guard-workflow guard-preview">
      <header><div><span className="mono">04 / GUARD ACTION PREVIEW</span><h3>{action.preview.title}</h3></div><span className="guard-beta mono">DRAFT</span></header>
      <div className="guard-preview-meta">
        <span><HelpLabel label="INTENT">{helpCopy.guardDraft}</HelpLabel><strong>{readable(action.preview.intent)}</strong></span>
        <span><HelpLabel label="SCOPE">Only the listed systems are part of this review.</HelpLabel><strong>{action.preview.scope.join(" / ").toUpperCase()}</strong></span>
        <span><HelpLabel label="EXECUTION">{helpCopy.executionPreview}</HelpLabel><strong>PREVIEW ONLY</strong></span>
      </div>
      <div className="guard-evidence-strip">
        <span className="mono">VERIFIED HOLDING</span>
        <strong>{action.preview.evidence.balance} {action.preview.evidence.symbol}</strong>
        <span className="mono">{action.preview.evidence.wallet.slice(0, 8)}...{action.preview.evidence.wallet.slice(-6)}</span>
        <span className="mono">CONTRACT {action.preview.evidence.contractAddress.slice(0, 8)}...{action.preview.evidence.contractAddress.slice(-6)}</span>
      </div>
      <div className="guard-preview-grid">
        <section><h4>ACTION STEPS</h4><ol>{action.preview.actionSteps.map((step) => <li key={step}><CheckCircle2 size={18} /><span>{step}</span></li>)}</ol></section>
        <section><h4>SAFETY BOUNDARIES</h4><ul>{action.preview.safetyBoundaries.map((boundary) => <li key={boundary}><LockKeyhole size={18} /><span>{boundary}</span></li>)}</ul></section>
      </div>
      <div className="guard-approval">
        <div><span className="mono">EXPLICIT APPROVAL</span><h4>Review before you record a decision.</h4><p>Approval creates a private audit receipt. It does not submit a transaction.</p></div>
        <div className="guard-confirmation">
          {["I reviewed the official event and current holding", "I understand the scope and closing conditions", "I understand that no onchain action will run"].map((label, index) => (
            <label key={label}><input type="checkbox" checked={checks[index]} onChange={(change) => setChecks((current) => current.map((value, itemIndex) => itemIndex === index ? change.target.checked : value))} /><span>{label}</span></label>
          ))}
          <label className="guard-note"><span>Type <strong>{approvalPhrase}</strong></span><input value={confirmation} onChange={(change) => setConfirmation(change.target.value.toUpperCase())} placeholder={approvalPhrase} /></label>
          <label className="guard-note"><span>Operator note, optional</span><textarea value={note} onChange={(change) => setNote(change.target.value)} maxLength={280} placeholder="Why this decision is appropriate" /></label>
        </div>
        <div className="guard-actions">
          <button type="button" className="secondary" onClick={() => void decide("dismiss")} disabled={working}><X size={17} />DISMISS DRAFT</button>
          <button type="button" onClick={() => void decide("approve")} disabled={working || !canApprove}>{working ? <LoaderCircle className="spin" size={17} /> : <ShieldCheck size={17} />}RECORD APPROVAL</button>
        </div>
      </div>
      {error ? <p className="guard-error mono">{error}</p> : null}
    </section>
  );
}
