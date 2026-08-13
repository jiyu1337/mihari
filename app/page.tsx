import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Database,
  Fingerprint,
  ScanSearch,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { EventDiagram } from "@/components/event-diagram";
import { SiteHeader } from "@/components/site-header";
import { protectionSteps } from "@/lib/product-data";

export default function Home() {
  return (
    <main className="landing paper-noise">
      <SiteHeader />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-index mono">
          <span>FIELD SYSTEM No. 01</span>
          <span>CORPORATE-ACTION INTELLIGENCE</span>
        </div>
        <div className="hero-title-wrap">
          <p className="eyebrow mono">AI GUARDIAN FOR TOKENIZED STOCKS / 株式監視</p>
          <h1 id="hero-title">
            Markets change.
            <br />
            Your positions should
            <br />
            <span>know first.</span>
          </h1>
        </div>
        <div className="hero-sidecopy">
          <p>
            MIHARI detects corporate actions, interprets portfolio impact and prepares
            auditable protection responses for Robinhood Chain.
          </p>
          <Link className="primary-action" href="/launch">
            Start monitoring <ArrowRight size={18} />
          </Link>
          <p className="hero-note mono">READ-ONLY MONITORING IS FREE · NO FUNDS REQUIRED</p>
        </div>
        <a className="scroll-cue mono" href="#incident">
          INCIDENT / 014 <ArrowDown size={14} />
        </a>
      </section>

      <section className="incident-section" id="incident" aria-labelledby="incident-title">
        <div className="section-rail mono">
          <span>CASE FILE</span>
          <strong>014</strong>
          <span>変更 / CHANGE</span>
        </div>
        <div className="incident-body">
          <div className="incident-heading">
            <div>
              <span className="section-kicker mono">09:30:04 UTC / MULTIPLIER MISMATCH</span>
              <h2 id="incident-title">A four-for-one split enters the system.</h2>
            </div>
            <div className="incident-stamp mono">
              <Check size={18} />
              SIMULATED ANALYSIS
              <small>CONF. 98.2%</small>
            </div>
          </div>
          <EventDiagram />
          <div className="incident-verdict">
            <p className="verdict-label mono">MIHARI DECISION / 判定</p>
            <p className="verdict-main">
              In this simulated case, six positions are exposed to stale quotes. MIHARI
              recommends pausing new lending until the active multiplier is confirmed.
            </p>
            <div className="verdict-proof mono">
              <span>POLICY ACTION</span>
              <strong>QUOTES_PAUSED</strong>
              <span>CHAIN RECEIPT</span>
              <strong>NOT RECORDED</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="system-section" id="system" aria-labelledby="system-title">
        <div className="system-intro">
          <p className="section-kicker mono">SYSTEM LOGIC / 作動原理</p>
          <h2 id="system-title">One event. Four controlled responses.</h2>
          <p>
            AI provides judgment and context. Onchain policy provides limits. The separation
            is what makes automation useful without giving a model unchecked control.
          </p>
        </div>
        <ol className="system-steps">
          {protectionSteps.map((step) => (
            <li key={step.index}>
              <span className="step-number mono">{step.index}</span>
              <div>
                <p className="step-label mono">{step.label}</p>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="protocol-section" id="protocol" aria-labelledby="protocol-title">
        <div className="protocol-heading">
          <p className="section-kicker mono">CHAIN-NATIVE BY DESIGN / 検証可能</p>
          <h2 id="protocol-title">Not another alert bot.</h2>
          <p>
            Monitoring happens where the official data lives. Protection and proof happen
            where positions live: on Robinhood Chain.
          </p>
        </div>
        <div className="protocol-grid">
          <article>
            <ScanSearch size={24} strokeWidth={1.5} />
            <span className="protocol-code mono">INPUT / 01</span>
            <h3>Official market context</h3>
            <p>Asset metadata, prices, multipliers and corporate-action records.</p>
          </article>
          <article className="protocol-highlight">
            <BrandMark className="protocol-mark" />
            <span className="protocol-code mono">INTELLIGENCE / 02</span>
            <h3>Explainable AI analysis</h3>
            <p>Impact, confidence, affected systems and a bounded response proposal.</p>
          </article>
          <article>
            <Fingerprint size={24} strokeWidth={1.5} />
            <span className="protocol-code mono">CHAIN / 03</span>
            <h3>Policy and proof</h3>
            <p>Guardrails, execution receipts and event attestations on Robinhood Chain.</p>
          </article>
          <article>
            <Database size={24} strokeWidth={1.5} />
            <span className="protocol-code mono">MEMORY / 04</span>
            <h3>Permanent incident history</h3>
            <p>Production incidents will preserve their source, interpretation, decision and resolution.</p>
          </article>
        </div>
      </section>

      <section className="access-section">
        <div className="access-label mono">
          <span>ACCESS PLATE</span>
          <span>01 — PUBLIC</span>
        </div>
        <div className="access-copy">
          <p className="section-kicker mono">START WITHOUT SPENDING / 無料監視</p>
          <h2>Observe first. Automate when you are ready.</h2>
          <p>
            Anyone can begin with read-only monitoring. Funds are only needed when a user
            explicitly approves a future onchain action and pays network gas.
          </p>
          <Link className="primary-action primary-action-dark" href="/launch">
            Configure your watch <ArrowRight size={18} />
          </Link>
        </div>
        <div className="access-spec mono">
          <p><span>MONITORING</span><strong>FREE</strong></p>
          <p><span>WALLET</span><strong>OPTIONAL</strong></p>
          <p><span>NETWORK</span><strong>ROBINHOOD CHAIN</strong></p>
          <p><span>STATUS</span><strong className="neon-text">PUBLIC PREVIEW</strong></p>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <BrandMark className="footer-mark" inverted />
          <span>MIHARI</span>
        </div>
        <p>Corporate Action Intelligence</p>
        <p className="mono">BUILDING ON ROBINHOOD CHAIN · 2026</p>
      </footer>
    </main>
  );
}
