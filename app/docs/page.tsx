import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  CircleDot,
  Database,
  ExternalLink,
  Eye,
  ListChecks,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";

const statusRows = [
  ["Robinhood asset catalog", "Live", "All active Stock Tokens are loaded from the official asset API."],
  ["Corporate-action register", "Live", "Shows official events for assets in your watchlist."],
  ["Price and multiplier context", "Live", "Reads Robinhood prices and asset multipliers."],
  ["AI risk analysis", "Live", "Explains impact and recommends a bounded response."],
  ["Neon incident memory", "Live", "Caches AI analysis so the same event is not paid for twice."],
  ["Wallet connection", "Read-only", "Connects an EVM address and selects Robinhood Chain 4663."],
  ["Vault and lending discovery", "Next", "Positions are not indexed from the wallet yet."],
  ["Policy execution", "Next", "MIHARI does not pause protocols or move funds today."],
  ["Onchain proof", "Next", "No production receipt is written until contracts are audited and deployed."],
];

export const metadata = {
  title: "Documentation — MIHARI",
  description: "Plain-language documentation for MIHARI on Robinhood Chain.",
};

export default function DocsPage() {
  return (
    <main className="docs-page paper-noise">
      <SiteHeader />
      <div className="docs-shell">
        <aside className="docs-sidebar">
          <p className="mono">MIHARI DOCS / v0.2</p>
          <nav aria-label="Documentation sections">
            <a href="#overview">Overview</a>
            <a href="#how-it-works">User workflow</a>
            <a href="#results">Reading results</a>
            <a href="#assets-events">Assets vs events</a>
            <a href="#ai">AI analysis</a>
            <a href="#wallet">Wallet connection</a>
            <a href="#status">What works today</a>
            <a href="#terms">Key terms</a>
          </nav>
          <div className="docs-sidebar-status mono">
            <i /> PRODUCTION BETA
            <span>ROBINHOOD CHAIN / 4663</span>
          </div>
        </aside>

        <article className="docs-content">
          <header className="docs-hero" id="overview">
            <p className="mono">PRODUCT DOCUMENTATION / 製品説明</p>
            <h1>MIHARI, in plain language.</h1>
            <p>
              MIHARI monitors Robinhood Stock Tokens for corporate actions such as dividends
              and stock splits. It explains what changed, where the risk may spread and what a
              safe operator response could look like.
            </p>
            <div className="docs-actions">
              <Link className="primary-action primary-action-dark" href="/app">
                Open live console <ArrowRight size={17} />
              </Link>
              <a href="https://docs.robinhood.com/chain/stock-token-apis/" target="_blank" rel="noreferrer">
                Robinhood source documentation <ExternalLink size={14} />
              </a>
            </div>
          </header>

          <section className="docs-section" id="how-it-works">
            <p className="docs-kicker mono">01 / USER WORKFLOW</p>
            <h2>What a user can do in MIHARI today.</h2>
            <div className="docs-flow docs-workflow">
              <div><Wallet size={20} /><span className="mono">01 / ENTER</span><strong>Choose access</strong><p>Continue read-only or connect an EVM address to Robinhood Chain.</p></div>
              <div><ListChecks size={20} /><span className="mono">02 / SELECT</span><strong>Build a watchlist</strong><p>Choose individual Stock Tokens, Select All, search the catalog or clear the selection.</p></div>
              <div><ShieldCheck size={20} /><span className="mono">03 / OBSERVE</span><strong>Start monitoring</strong><p>Observe mode reads and explains risk. It cannot execute a transaction.</p></div>
              <div><Database size={20} /><span className="mono">04 / SOURCE</span><strong>Sync Robinhood data</strong><p>MIHARI reads asset metadata, prices, multipliers and corporate actions.</p></div>
              <div><Eye size={20} /><span className="mono">05 / REVIEW</span><strong>Open an event</strong><p>The register shows only watched assets with a corporate-action record.</p></div>
              <div><Bot size={20} /><span className="mono">06 / ANALYZE</span><strong>Read the Incident File</strong><p>Review the event, impact map, confidence and bounded response.</p></div>
              <div><Check size={20} /><span className="mono">07 / DECIDE</span><strong>Choose the next step</strong><p>The operator decides what to do. MIHARI does not move funds.</p></div>
            </div>
            <div className="docs-callout">
              <strong>MIHARI is not a trading bot.</strong>
              <p>It does not buy, sell, move funds or promise financial outcomes.</p>
            </div>
          </section>

          <section className="docs-section" id="results">
            <p className="docs-kicker mono">02 / READING RESULTS</p>
            <h2>How to understand the Event Register.</h2>
            <div className="docs-result-grid">
              <div><span className="mono">WATCHED</span><strong>Your monitoring scope</strong><p>Every selected asset is checked when MIHARI refreshes the source.</p></div>
              <div><span className="mono">EVENTS</span><strong>Records requiring attention</strong><p>Only watched assets with an official corporate-action record appear here.</p></div>
              <div><span className="mono">SELECTED EVENT</span><strong>The open Incident File</strong><p>Shows the asset, event type, source status, risk level and record ID.</p></div>
              <div><span className="mono">OBSERVATION</span><strong>What the evidence says</strong><p>A plain-language description of the verified Robinhood event.</p></div>
              <div><span className="mono">IMPACT MAP</span><strong>Where risk may spread</strong><p>Explains possible effects on quotes, NAV, vaults, lending and agents.</p></div>
              <div><span className="mono">BOUNDED RESPONSE</span><strong>A safe recommendation</strong><p>Advice for an operator. Nothing is executed automatically.</p></div>
              <div><span className="mono">AI CONFIDENCE</span><strong>Evidence quality</strong><p>Completeness and consistency of available data, not a price forecast.</p></div>
              <div><span className="mono">CHAIN PROOF</span><strong>Execution receipt</strong><p>“Not recorded” means MIHARI did not submit an onchain transaction.</p></div>
            </div>
          </section>

          <section className="docs-section" id="assets-events">
            <p className="docs-kicker mono">03 / ASSETS VS EVENTS</p>
            <h2>Why can MIHARI show 194 watched assets but only a few events?</h2>
            <div className="docs-compare">
              <div>
                <span className="mono">WATCHLIST · SELECTED ASSETS</span>
                <h3>What MIHARI monitors</h3>
                <p>One asset, a custom list or the full live catalog can be in your watchlist.</p>
              </div>
              <ArrowRight size={22} />
              <div className="highlight">
                <span className="mono">REGISTER · MATCHING EVENTS</span>
                <h3>What requires attention</h3>
                <p>If only three watched assets have corporate-action records, only those three appear.</p>
              </div>
            </div>
            <p>
              Every other selected asset remains monitored. It is not missing; Robinhood simply
              has no matching corporate action for it in the current source window.
            </p>
          </section>

          <section className="docs-section" id="ai">
            <p className="docs-kicker mono">04 / AI ANALYSIS</p>
            <h2>What the confidence score means.</h2>
            <p>
              The AI receives a server-verified Robinhood event rather than arbitrary browser text.
              It returns a structured observation, impact map, risk level, affected systems and
              recommended response. Confidence describes how complete and consistent the evidence
              appears. It is not a prediction of profit or price direction.
            </p>
            <ul className="docs-list">
              <li><CircleDot size={14} /> The model cannot execute a transaction.</li>
              <li><CircleDot size={14} /> Missing dates or conflicting data should lower confidence.</li>
              <li><CircleDot size={14} /> The same event is cached in Neon to control API cost.</li>
              <li><CircleDot size={14} /> A deterministic rule analysis appears if AI is unavailable.</li>
            </ul>
          </section>

          <section className="docs-section" id="wallet">
            <p className="docs-kicker mono">05 / WALLET</p>
            <h2>What “Connect wallet” does today.</h2>
            <div className="wallet-doc-card">
              <Wallet size={26} />
              <div>
                <strong>Working: address + network</strong>
                <p>MIHARI requests your public EVM address and switches the wallet to Robinhood Chain mainnet, chain ID 4663.</p>
              </div>
              <div>
                <strong>Not implemented yet</strong>
                <p>No portfolio indexing, account authentication, message signature, transaction approval or fund access.</p>
              </div>
            </div>
            <p className="docs-note mono">MIHARI WILL NEVER ASK FOR A SEED PHRASE OR PRIVATE KEY.</p>
          </section>

          <section className="docs-section" id="status">
            <p className="docs-kicker mono">06 / PRODUCT STATUS</p>
            <h2>What works today — and what does not.</h2>
            <div className="status-table">
              {statusRows.map(([feature, status, explanation]) => (
                <div key={feature}>
                  <strong>{feature}</strong>
                  <span className={`status-pill ${status.toLowerCase().replace("-", "")}`}>{status}</span>
                  <p>{explanation}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="docs-section" id="terms">
            <p className="docs-kicker mono">07 / KEY TERMS</p>
            <h2>A short glossary.</h2>
            <dl className="docs-glossary">
              <div><dt>NAV</dt><dd>Net Asset Value: the calculated value of assets held by a vault or fund, minus its liabilities.</dd></div>
              <div><dt>Multiplier</dt><dd>The shares-per-token factor used to account for corporate actions such as splits.</dd></div>
              <div><dt>Stale quote</dt><dd>A price that no longer represents the same corporate-action state as the asset metadata.</dd></div>
              <div><dt>Onchain proof</dt><dd>A future transaction or attestation recording what policy decision was made and when.</dd></div>
            </dl>
          </section>
        </article>
      </div>
    </main>
  );
}
