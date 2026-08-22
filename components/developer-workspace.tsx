"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, KeyRound, LoaderCircle, Mail, Plus, ShieldCheck, X } from "lucide-react";

type ApiKey = { id: string; label: string; prefix: string; lastUsedAt: string | null; revokedAt: string | null; createdAt: string };
type Integration = { id: string; name: string; plan: "trial" | "builder" | "protocol"; status: string; monthlyRequestLimit: number; used: number; keys: ApiKey[]; request: { status: string; requestedPlan: string; createdAt: string } | null };
type Plans = Record<"trial" | "builder" | "protocol", { label: string; limit: number; description: string }>;
type WorkspaceData = { integrations: Integration[]; plans: Plans };

function formatDate(value: string | null) {
  if (!value) return "Not used yet";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function DeveloperWorkspace() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [visibleSecret, setVisibleSecret] = useState<string | null>(null);
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const [keyLabel, setKeyLabel] = useState("Production key");
  const [projectName, setProjectName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [useCase, setUseCase] = useState("");
  const [requestedPlan, setRequestedPlan] = useState<"builder" | "protocol">("builder");
  const [monthlyRequests, setMonthlyRequests] = useState("50000");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/developer/integrations", { cache: "no-store" });
      const payload = await response.json();
      if (response.status === 401) {
        setRequiresSignIn(true);
        setData(null);
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "Developer workspace is unavailable");
      setRequiresSignIn(false);
      setData(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Developer workspace is unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createWorkspace = async () => {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/developer/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "My MIHARI integration" }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not create developer workspace");
      setVisibleSecret(payload.secret); setNotice("Your trial key is ready. Copy it now: it cannot be shown again.");
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create developer workspace"); }
    finally { setBusy(false); }
  };

  const createKey = async (integrationId: string) => {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/developer/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ integrationId, label: keyLabel }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not create API key");
      setVisibleSecret(payload.secret); setNotice("New key created. Copy it now: MIHARI only keeps a secure hash.");
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create API key"); }
    finally { setBusy(false); }
  };

  const revokeKey = async (id: string) => {
    if (!window.confirm("Revoke this API key? Any integration using it will stop immediately.")) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/developer/keys?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not revoke API key");
      setNotice("API key revoked."); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not revoke API key"); }
    finally { setBusy(false); }
  };

  const requestAccess = async (integrationId: string) => {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/developer/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ integrationId, requestedPlan, projectName, contactEmail, expectedMonthlyRequests: monthlyRequests, useCase }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not send access request");
      setNotice("Request received. MIHARI team will review your access requirements manually."); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send access request"); }
    finally { setBusy(false); }
  };

  const integration = data?.integrations[0];
  const copy = async () => { if (visibleSecret) await navigator.clipboard.writeText(visibleSecret); setNotice("API key copied. Store it in a server-side secret manager."); };

  return (
    <main className="developer-workspace paper-noise">
      <header className="developer-workspace-header">
        <Link href="/developers" className="mono">← MIHARI INTELLIGENCE API</Link>
        <span className="mono">DEVELOPER WORKSPACE / PRIVATE</span>
      </header>
      <section className="developer-workspace-hero">
        <p className="mono">01 / INTEGRATION CONTROL</p>
        <h1>Know every call<br />your product makes.</h1>
        <p>Create scoped API keys, follow monthly usage and ask the MIHARI team for production capacity. No automatic billing or onchain payment is required.</p>
      </section>

      {error ? <div className="developer-workspace-message error">{error}</div> : null}
      {notice ? <div className="developer-workspace-message success"><Check size={17} />{notice}<button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={16} /></button></div> : null}

      {visibleSecret ? <section className="developer-secret-panel"><div><span className="mono">COPY ONCE / SECRET API KEY</span><strong>{visibleSecret}</strong><p>MIHARI never stores the raw key. Put it in a server-only environment variable.</p></div><button onClick={() => void copy()}><Copy size={17} />COPY KEY</button></section> : null}

      {loading ? <div className="developer-workspace-loading"><LoaderCircle className="spin" size={30} />OPENING DEVELOPER WORKSPACE</div> : requiresSignIn ? (
        <section className="developer-start-card"><KeyRound size={30} /><p className="mono">PRIVATE WORKSPACE / SIGN IN REQUIRED</p><h2>Open your developer workspace.</h2><p>Sign in to create private API keys, review usage and request Builder or Protocol access.</p><Link href="/sign-in?redirect_url=%2Fdevelopers%2Fworkspace" className="developer-start-link">SIGN IN <ArrowRight size={17} /></Link></section>
      ) : !integration ? (
        <section className="developer-start-card"><KeyRound size={30} /><p className="mono">TRIAL ACCESS / 2,500 REQUESTS PER MONTH</p><h2>Create your first integration.</h2><p>Your trial gives you a private API key and usage record. Public beta reads remain available without a key.</p><button onClick={() => void createWorkspace()} disabled={busy}>{busy ? "CREATING" : "CREATE DEVELOPER WORKSPACE"}<ArrowRight size={17} /></button></section>
      ) : (
        <>
          <section className="developer-metrics-grid">
            <article><span className="mono">CURRENT PLAN</span><strong>{data?.plans[integration.plan].label}</strong><small>{integration.status.replaceAll("_", " ")}</small></article>
            <article><span className="mono">THIS CYCLE</span><strong>{integration.used.toLocaleString()} / {integration.monthlyRequestLimit.toLocaleString()}</strong><small>keyed requests recorded</small></article>
            <article><span className="mono">ACTIVE KEYS</span><strong>{integration.keys.filter((key) => !key.revokedAt).length}</strong><small>revoke any key instantly</small></article>
          </section>

          <section className="developer-workspace-section">
            <div className="developer-section-intro"><p className="mono">02 / API KEYS</p><h2>Keys belong to this integration.</h2><p>Use <code>X-MIHARI-API-Key</code> or a Bearer key. Requests made with a key appear in this usage count.</p></div>
            <div className="developer-key-create"><input value={keyLabel} onChange={(event) => setKeyLabel(event.target.value)} maxLength={80} aria-label="New API key label" /><button onClick={() => void createKey(integration.id)} disabled={busy}><Plus size={16} />CREATE KEY</button></div>
            <div className="developer-key-list">
              {integration.keys.map((key) => <article key={key.id} className={key.revokedAt ? "revoked" : ""}><KeyRound size={19} /><div><strong>{key.label}</strong><code>{key.prefix}••••••••</code><small>Last used: {formatDate(key.lastUsedAt)}</small></div>{key.revokedAt ? <span className="mono">REVOKED</span> : <button onClick={() => void revokeKey(key.id)} disabled={busy}>REVOKE</button>}</article>)}
            </div>
          </section>

          <section className="developer-workspace-section developer-contact-section">
            <div className="developer-section-intro"><p className="mono">03 / CONTACT TEAM</p><h2>Move from trial<br />to production.</h2><p>Builder and Protocol access are approved manually. Tell us what you are building and how much capacity you need. There is no checkout flow.</p></div>
            {integration.request ? <div className="developer-request-status"><ShieldCheck size={25} /><strong>{integration.request.requestedPlan.toUpperCase()} REQUEST {integration.request.status.toUpperCase()}</strong><p>Submitted {formatDate(integration.request.createdAt)}. Your trial key stays active while MIHARI reviews the request.</p></div> : <form className="developer-contact-form" onSubmit={(event) => { event.preventDefault(); void requestAccess(integration.id); }}>
              <label>Plan<select value={requestedPlan} onChange={(event) => setRequestedPlan(event.target.value as "builder" | "protocol")}><option value="builder">Builder</option><option value="protocol">Protocol</option></select></label>
              <label>Project name<input value={projectName} onChange={(event) => setProjectName(event.target.value)} required /></label>
              <label>Work email<input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required /></label>
              <label>Expected requests per month<input type="number" min="1" value={monthlyRequests} onChange={(event) => setMonthlyRequests(event.target.value)} required /></label>
              <label className="wide">What are you building?<textarea value={useCase} onChange={(event) => setUseCase(event.target.value)} minLength={10} required placeholder="Example: an agent that reviews selected Stock Tokens before a vault rebalances." /></label>
              <button type="submit" disabled={busy}><Mail size={16} />SEND REQUEST <ArrowRight size={16} /></button>
            </form>}
          </section>
        </>
      )}
    </main>
  );
}
