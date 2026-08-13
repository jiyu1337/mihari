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
  ["Email and wallet profiles", "Live", "Creates a private workspace through email code or EVM signature."],
  ["Wallet Stock Token mapping", "Live", "Indexes verified wallet balances on Robinhood Chain through Blockscout."],
  ["Personal Asset Manager", "Live", "Saves a private monitoring scope directly inside the profile."],
  ["Personal risk files", "Live", "Explains corporate actions matched to Stock Tokens found in verified wallets."],
  ["Vault and lending discovery", "Next", "Protocol positions are not indexed yet."],
  ["Policy execution", "Next", "MIHARI does not pause protocols or move funds today."],
  ["Onchain proof", "Next", "No production receipt is written until contracts are audited and deployed."],
];

export const metadata = {
  title: "Documentation - MIHARI",
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
            <a href="#workspace">Personal workspace</a>
            <a href="#exposure-statuses">Exposure statuses</a>
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
              <div><Wallet size={20} /><span className="mono">01 / ENTER</span><strong>Choose access</strong><p>Continue publicly, sign in by email or create a wallet-native profile.</p></div>
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
            <h2>What wallet access does today.</h2>
            <div className="wallet-doc-card">
              <Wallet size={26} />
              <div>
                <strong>Wallet-native profile</strong>
                <p>A free message signature creates a secure MIHARI session without email, gas or a transaction.</p>
              </div>
              <div>
                <strong>Personal position mapping</strong>
                <p>Verified addresses are scanned for official Robinhood Stock Tokens and matched with corporate actions. MIHARI cannot move funds.</p>
              </div>
            </div>
            <p className="docs-note mono">MIHARI WILL NEVER ASK FOR A SEED PHRASE OR PRIVATE KEY.</p>
          </section>

          <section className="docs-section" id="workspace">
            <p className="docs-kicker mono">06 / PERSONAL WORKSPACE</p>
            <h2>How the private profile is organized.</h2>
            <p>
              A profile combines two different sets of information: the assets a user chooses to
              monitor and the Stock Tokens MIHARI actually finds in verified wallets. Selecting
              AMC in Assets does not create an AMC position. A position appears in Exposure only
              when its official contract has a non-zero balance in a linked wallet.
            </p>
            <div className="docs-result-grid">
              <div><span className="mono">OVERVIEW</span><strong>Personal control room</strong><p>Summarizes monitored assets, verified wallets, detected Stock Token positions and event matches.</p></div>
              <div><span className="mono">ASSETS</span><strong>Watchlist and contract directory</strong><p>Search the live catalog, select a monitoring scope, copy official contracts and open them in Blockscout.</p></div>
              <div><span className="mono">WALLETS</span><strong>Verified identities</strong><p>Link one or more EVM addresses through a free message signature. MIHARI receives no spending permission.</p></div>
              <div><span className="mono">EXPOSURE</span><strong>Automatic wallet holdings</strong><p>Scans every verified wallet for all official Robinhood Stock Tokens, including tokens outside the watchlist.</p></div>
              <div><span className="mono">PROFILE</span><strong>Access methods</strong><p>Shows whether the account uses wallet or email access and lets the user add another access method.</p></div>
              <div><span className="mono">RESCAN</span><strong>Refresh personal data</strong><p>Reloads the profile, wallet balances, prices and corporate-action matching from the connected sources.</p></div>
            </div>

            <h3 className="docs-subheading">Terms used in Assets</h3>
            <div className="status-table docs-label-table">
              <div><strong>Monitored</strong><span className="status-pill live">Selected</span><p>The asset belongs to the saved watchlist and is checked for corporate actions.</p></div>
              <div><strong>Not monitored</strong><span className="status-pill next">Not selected</span><p>The asset remains in the live catalog but is not part of the saved watchlist.</p></div>
              <div><strong>Contract / Chain 4663</strong><span className="status-pill readonly">Source data</span><p>The official Robinhood Stock Token deployment used for wallet matching on Robinhood Chain.</p></div>
              <div><strong>Save scope</strong><span className="status-pill readonly">Profile action</span><p>Saves the current selection to this private MIHARI profile.</p></div>
            </div>
          </section>

          <section className="docs-section" id="exposure-statuses">
            <p className="docs-kicker mono">07 / EXPOSURE AND RISK</p>
            <h2>How to read a position and its risk status.</h2>
            <p>
              MIHARI reads token balances from Robinhood Chain Blockscout, recognizes only
              contracts from Robinhood asset metadata, attaches a midpoint from the available bid
              and ask, and compares each position with the current corporate-action response.
            </p>
            <div className="docs-result-grid">
              <div><span className="mono">ASSET</span><strong>Recognized Stock Token</strong><p>The symbol and company name matched through the official Robinhood contract catalog.</p></div>
              <div><span className="mono">BALANCE</span><strong>Onchain token amount</strong><p>The non-zero balance found in a verified wallet. It is not necessarily the number of underlying shares without considering the multiplier.</p></div>
              <div><span className="mono">INDICATIVE VALUE</span><strong>Estimated current value</strong><p>Token balance multiplied by the midpoint between Robinhood bid and ask. It is informational, not an executable quote.</p></div>
              <div><span className="mono">NO EVENT MATCH</span><strong>No matching record now</strong><p>No corporate-action record for this holding appears in the current Robinhood source response. Monitoring continues. This does not mean zero market, liquidity, smart-contract or future event risk.</p></div>
              <div><span className="mono">EVENT MATCH</span><strong>Review required</strong><p>A Robinhood corporate-action record matches a Stock Token found in the wallet. Use View Risk to open the personal risk file.</p></div>
              <div><span className="mono">VIEW RISK</span><strong>Personal risk file</strong><p>Shows what happened, possible impact, a bounded response, evidence confidence and systems that may be affected.</p></div>
            </div>

            <h3 className="docs-subheading">Personal risk file labels</h3>
            <div className="status-table docs-label-table">
              <div><strong>What happened</strong><span className="status-pill readonly">Evidence</span><p>A plain-language summary of the official Robinhood corporate-action record.</p></div>
              <div><strong>Possible impact</strong><span className="status-pill readonly">Analysis</span><p>How the event may affect quotes, NAV, vault accounting, lending collateral or agents.</p></div>
              <div><strong>Recommended response</strong><span className="status-pill live">Advisory</span><p>A bounded operator recommendation. MIHARI does not execute it in Observe mode.</p></div>
              <div><strong>Source summary</strong><span className="status-pill readonly">Immediate</span><p>The official event description is shown while deeper analysis is loading or unavailable.</p></div>
              <div><strong>AI</strong><span className="status-pill live">Analyzed</span><p>OpenAI produced structured analysis from a server-verified Robinhood event.</p></div>
              <div><strong>Rule based</strong><span className="status-pill readonly">Fallback</span><p>Deterministic MIHARI rules produced the analysis because AI or persistence was unavailable or limited.</p></div>
              <div><strong>Confidence</strong><span className="status-pill readonly">0 to 100</span><p>Evidence completeness and consistency. It is not a probability of loss and not a price forecast.</p></div>
              <div><strong>Affected systems</strong><span className="status-pill readonly">Scope</span><p>Potential categories: quotes, NAV, vaults, lending and agents. This does not yet prove the user has a position in those protocols.</p></div>
            </div>

            <h3 className="docs-subheading">Risk and source statuses</h3>
            <div className="status-table docs-label-table">
              <div><strong>Low</strong><span className="status-pill readonly">Risk</span><p>The record appears resolved or has limited immediate operational impact, but still requires normal monitoring.</p></div>
              <div><strong>Medium</strong><span className="status-pill readonly">Risk</span><p>The event can require accounting or operational review without an immediate critical mismatch.</p></div>
              <div><strong>High</strong><span className="status-pill live">Risk</span><p>The event may materially affect valuation, quoting or connected protocol accounting.</p></div>
              <div><strong>Critical</strong><span className="status-pill live">Risk</span><p>The source indicates an in-progress event or mismatch that should receive immediate operator attention.</p></div>
              <div><strong>In progress</strong><span className="status-pill live">Source</span><p>Robinhood reports that the corporate action is currently being processed.</p></div>
              <div><strong>Completed</strong><span className="status-pill readonly">Source</span><p>Robinhood reports that event processing is complete. Downstream systems may still need reconciliation.</p></div>
              <div><strong>Pending</strong><span className="status-pill next">Source</span><p>The source has not provided a completed event state or effective date yet.</p></div>
            </div>

            <div className="docs-callout">
              <strong>What AMC means in the example.</strong>
              <p>AMC was found automatically in the wallet and valued from live market context. No Event Match means there is no matching corporate-action record in the current response, so MIHARI keeps monitoring it but has no risk file to analyze right now.</p>
            </div>
          </section>

          <section className="docs-section" id="status">
            <p className="docs-kicker mono">08 / PRODUCT STATUS</p>
            <h2>What works today - and what does not.</h2>
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
            <p className="docs-kicker mono">09 / KEY TERMS</p>
            <h2>A short glossary.</h2>
            <dl className="docs-glossary">
              <div><dt>NAV</dt><dd>Net Asset Value: the calculated value of assets held by a vault or fund, minus its liabilities.</dd></div>
              <div><dt>Multiplier</dt><dd>The shares-per-token factor used to account for corporate actions such as splits.</dd></div>
              <div><dt>Stale quote</dt><dd>A price that no longer represents the same corporate-action state as the asset metadata.</dd></div>
              <div><dt>Onchain proof</dt><dd>A future transaction or attestation recording what policy decision was made and when.</dd></div>
              <div><dt>Watchlist</dt><dd>The Stock Tokens a profile asks MIHARI to monitor. It is separate from assets actually held in linked wallets.</dd></div>
              <div><dt>Exposure</dt><dd>A recognized Robinhood Stock Token balance found automatically in a verified wallet and matched with current event data.</dd></div>
              <div><dt>Event match</dt><dd>A corporate-action record from Robinhood that has the same symbol as a Stock Token position found in the wallet.</dd></div>
            </dl>
          </section>
        </article>
      </div>
    </main>
  );
}
