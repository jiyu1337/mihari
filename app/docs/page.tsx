import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  CircleDot,
  Database,
  ExternalLink,
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
          <p className="mono">MIHARI DOCS / v0.1</p>
          <nav aria-label="Documentation sections">
            <a href="#overview">Overview</a>
            <a href="#how-it-works">How it works</a>
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
              MIHARI watches Robinhood Stock Tokens for corporate actions such as dividends
              and stock splits. When an event appears, it explains what changed, which DeFi
              systems could be affected, and what a safe response could look like.
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
            <p className="docs-kicker mono">01 / HOW IT WORKS</p>
            <h2>One event moves through four controlled stages.</h2>
            <div className="docs-flow">
              <div><Database size={20} /><span className="mono">SOURCE</span><strong>Robinhood data</strong><p>Assets, prices, multipliers and corporate actions.</p></div>
              <div><Bot size={20} /><span className="mono">ANALYZE</span><strong>AI risk map</strong><p>Impact, evidence, confidence and a proposed response.</p></div>
              <div><ShieldCheck size={20} /><span className="mono">BOUND</span><strong>Policy limits</strong><p>Today the response is advisory and cannot execute.</p></div>
              <div><Check size={20} /><span className="mono">REMEMBER</span><strong>Incident record</strong><p>Neon stores the analysis and avoids repeat AI cost.</p></div>
            </div>
            <div className="docs-callout">
              <strong>MIHARI is not a trading bot.</strong>
              <p>It does not buy, sell, move funds or promise financial outcomes.</p>
            </div>
          </section>

          <section className="docs-section" id="assets-events">
            <p className="docs-kicker mono">02 / ASSETS VS EVENTS</p>
            <h2>Why can the dashboard show 6 assets but only 2 records?</h2>
            <div className="docs-compare">
              <div>
                <span className="mono">WATCHLIST · 6 ASSETS</span>
                <h3>What MIHARI monitors</h3>
                <p>AAPL, NVDA, TSLA, AMZN, MSFT and SPY can all be in your watchlist.</p>
              </div>
              <ArrowRight size={22} />
              <div className="highlight">
                <span className="mono">REGISTER · 2 EVENTS</span>
                <h3>What requires attention</h3>
                <p>If only AAPL and SPY have corporate-action records, only those two appear.</p>
              </div>
            </div>
            <p>
              The other four assets are still monitored. They are not missing; Robinhood simply
              has no matching corporate action for them in the current event feed.
            </p>
          </section>

          <section className="docs-section" id="ai">
            <p className="docs-kicker mono">03 / AI ANALYSIS</p>
            <h2>What the confidence score means.</h2>
            <p>
              The AI receives a server-verified Robinhood event rather than arbitrary text from
              the browser. It returns a structured observation, impact map, risk level, affected
              systems and recommended response. Confidence describes how complete and consistent
              the available evidence appears. It is not a prediction of profit or price direction.
            </p>
            <ul className="docs-list">
              <li><CircleDot size={14} /> The model cannot execute a transaction.</li>
              <li><CircleDot size={14} /> Missing dates or conflicting data should lower confidence.</li>
              <li><CircleDot size={14} /> The same event is cached in Neon to control API cost.</li>
              <li><CircleDot size={14} /> A deterministic rule analysis appears if AI is unavailable.</li>
            </ul>
          </section>

          <section className="docs-section" id="wallet">
            <p className="docs-kicker mono">04 / WALLET</p>
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
            <p className="docs-kicker mono">05 / PRODUCT STATUS</p>
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
            <p className="docs-kicker mono">06 / KEY TERMS</p>
            <h2>A short glossary.</h2>
            <dl className="docs-glossary">
              <div><dt>NAV</dt><dd>Net Asset Value: the calculated value of the assets held by a vault or fund, minus its liabilities.</dd></div>
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
