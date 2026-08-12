"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  ChevronRight,
  CircleGauge,
  FileCheck2,
  Orbit,
  RefreshCw,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { corporateEvents, type CorporateEvent } from "@/lib/product-data";

type LocalConfiguration = {
  wallet?: string;
  assets?: string[];
  mode?: string;
};

const defaultConfiguration: LocalConfiguration = {
  assets: ["NVDAx", "AAPLx", "TSLAx"],
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

export function GuardianConsole() {
  const [selected, setSelected] = useState<CorporateEvent>(corporateEvents[0]);
  const [syncing, setSyncing] = useState(false);
  const configurationJson = useSyncExternalStore(
    subscribeToConfiguration,
    getConfigurationSnapshot,
    getServerConfigurationSnapshot,
  );
  let configuration = defaultConfiguration;
  try {
    configuration = JSON.parse(configurationJson) as LocalConfiguration;
  } catch {
    configuration = defaultConfiguration;
  }

  function simulateSync() {
    setSyncing(true);
    window.setTimeout(() => setSyncing(false), 900);
  }

  return (
    <div className="guardian-shell">
      <aside className="guardian-sidebar">
        <Link className="console-brand" href="/">
          <BrandMark inverted />
          <span>MIHARI</span>
        </Link>
        <nav aria-label="Guardian console">
          <Link className="active" href="/app"><Activity size={17} />Events</Link>
          <Link href="/app#policies"><ShieldCheck size={17} />Policies</Link>
          <Link href="/app#proofs"><FileCheck2 size={17} />Proofs</Link>
          <Link href="/launch"><Settings2 size={17} />Setup</Link>
        </nav>
        <div className="console-network mono">
          <span><i /> SYSTEM ACTIVE</span>
          <p>ROBINHOOD TESTNET</p>
          <strong>CHAIN ID 46630</strong>
        </div>
      </aside>

      <main className="guardian-main">
        <header className="console-header">
          <div>
            <p className="mono">CORPORATE ACTION CONTROL / 企業行動監視</p>
            <h1>Event register</h1>
          </div>
          <div className="console-header-actions">
            <button aria-label="Notifications"><Bell size={17} /></button>
            <span className="console-identity mono">{shortAddress(configuration.wallet)}</span>
          </div>
        </header>

        <section className="console-strip mono" aria-label="System status">
          <p><span>WATCH SCOPE</span><strong>{configuration.assets?.length ?? 3} ASSETS</strong></p>
          <p><span>POLICY MODE</span><strong>{configuration.mode?.toUpperCase() ?? "OBSERVE"}</strong></p>
          <p><span>LAST SOURCE SYNC</span><strong>{syncing ? "SYNCING…" : "12 SEC AGO"}</strong></p>
          <button onClick={simulateSync} disabled={syncing}>
            <RefreshCw className={syncing ? "spin" : ""} size={14} /> REFRESH
          </button>
        </section>

        <div className="console-workspace">
          <section className="event-register" aria-labelledby="register-title">
            <div className="register-head mono">
              <span id="register-title">LIVE REGISTER / 監視中</span>
              <span>{corporateEvents.length.toString().padStart(2, "0")} RECORDS</span>
            </div>
            <div className="event-list">
              {corporateEvents.map((event) => (
                <button
                  className={selected.id === event.id ? "selected" : ""}
                  key={event.id}
                  onClick={() => setSelected(event)}
                >
                  <span className={`severity-mark ${event.severity}`} />
                  <span className="event-id mono">{event.id}<small>{event.time}</small></span>
                  <span className="event-asset"><strong>{event.asset}</strong><small>{event.type}</small></span>
                  <span className="event-impact mono">{event.affected} POSITIONS</span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
            <div className="source-register mono">
              <p><span>SOURCE 01</span><strong>ASSET METADATA</strong><i>VERIFIED</i></p>
              <p><span>SOURCE 02</span><strong>CORPORATE ACTIONS</strong><i>VERIFIED</i></p>
              <p><span>SOURCE 03</span><strong>ONCHAIN PRICE FEED</strong><i>VERIFIED</i></p>
            </div>
          </section>

          <article className="incident-file" aria-labelledby="incident-file-title">
            <div className="file-index mono">
              <span>INCIDENT FILE</span>
              <strong>{selected.id.replace("CA–", "")}</strong>
              <span className={`file-state ${selected.severity}`}>{selected.severity.toUpperCase()}</span>
            </div>
            <div className="file-body">
              <header>
                <div>
                  <p className="mono">{selected.asset} / {selected.type}</p>
                  <h2 id="incident-file-title">{selected.name}</h2>
                </div>
                <div className="confidence-gauge">
                  <CircleGauge size={25} strokeWidth={1.4} />
                  <span className="mono">AI CONFIDENCE<strong>{selected.confidence}%</strong></span>
                </div>
              </header>

              <section className="analysis-sheet">
                <div className="analysis-block">
                  <span className="analysis-number mono">01</span>
                  <div><p className="mono">OBSERVATION / 観測</p><h3>{selected.summary}</h3></div>
                </div>
                <div className="analysis-block">
                  <span className="analysis-number mono">02</span>
                  <div><p className="mono">IMPACT MAP / 影響</p><h3>{selected.impact}</h3></div>
                </div>
                <div className="analysis-block action-block">
                  <span className="analysis-number mono">03</span>
                  <div><p className="mono">BOUNDED ACTION / 対応</p><h3>{selected.action}</h3></div>
                </div>
              </section>

              <footer className="file-proof mono">
                <div><Orbit size={18} /><span>POLICY ENGINE<strong>RULESET 0.3</strong></span></div>
                <div><ShieldCheck size={18} /><span>AFFECTED<strong>{selected.affected} POSITIONS</strong></span></div>
                <div><FileCheck2 size={18} /><span>CHAIN PROOF<strong>{selected.proof}</strong></span></div>
              </footer>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
