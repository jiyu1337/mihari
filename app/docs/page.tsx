import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CircleDot,
  Database,
  ExternalLink,
  Eye,
  Landmark,
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
  ["Email and wallet profiles", "Live", "Creates a private workspace with email and password or an EVM wallet signature."],
  ["Wallet Stock Token mapping", "Live", "Indexes verified wallet balances on Robinhood Chain through Blockscout."],
  ["Personal Asset Manager", "Live", "Saves a private monitoring scope directly inside the profile."],
  ["Private Event Register", "Live", "Refreshes official events for the assets allowed by the profile's access level."],
  ["$MHR wallet status", "Live", "Checks the official $MHR contract balance for every verified wallet."],
  ["Personal risk files", "Live", "Explains corporate actions matched to Stock Tokens found in verified wallets."],
  ["Morpho lending and vault discovery", "Beta", "Finds Stock Token supply, borrow, collateral and vault positions for verified wallets."],
  ["Uniswap V3 liquidity discovery", "Beta", "Finds Stock Tokens represented inside V3 LP NFTs and checks whether liquidity is in range."],
  ["Uniswap V4 liquidity discovery", "Beta", "Reads V4 LP NFTs, pool state and tick ranges to calculate Stock Token exposure."],
  ["Arcus perpetual discovery", "Beta", "Matches public Arcus perpetual positions to official Stock Token symbols and reports side, leverage, margin and PnL."],
  ["Lighter perpetual discovery", "Beta", "Reads public Lighter accounts and subaccounts for active Stock Token perpetual positions."],
  ["Unified Risk Graph", "Beta", "Connects live Robinhood events to holdings, watchlist research signals and, for Holders, supported protocol positions."],
  ["Policy Recommendations", "Beta", "Turns a verified event into a structured operator review plan with checks, boundaries and clear conditions."],
  ["Guard Action Preview", "Beta", "Lets MHR Holders prepare and explicitly approve a bounded response for an official event matched to a verified wallet holding."],
  ["Private decision receipts", "Beta", "Stores a private audit hash for the verified event, reviewed preview and operator decision without submitting a transaction."],
  ["Share Signal", "Live", "Creates a privacy-safe public risk summary and branded X card without exposing wallet addresses, balances or private receipt data."],
  ["MIHARI Intelligence API", "Beta", "Provides read-only event intelligence, quote integrity, public market dependencies, signed webhooks and an MCP server for external apps and agents. No profile, wallet or private receipt data is exposed."],
  ["MHR Holder access", "Beta", "Unlocks larger limits, personal DeFi scanning and protocol paths in the Risk Graph after an onchain balance check."],
  ["Protocol coverage registry", "Live", "Separates active adapters from planned Robinhood Chain integrations."],
  ["Protocol execution", "Next", "Guard approval remains private and does not pause protocols, move funds or submit a transaction today."],
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
          <p className="mono">MIHARI DOCS / v0.6</p>
          <nav aria-label="Documentation sections">
            <a href="#overview">Overview</a>
            <a href="#how-it-works">User workflow</a>
            <a href="#results">Reading results</a>
            <a href="#assets-events">Assets vs events</a>
            <a href="#ai">AI analysis</a>
            <a href="#data-sources">Live data</a>
            <a href="#intelligence-api">Intelligence API</a>
            <a href="#wallet">Wallet connection</a>
            <a href="#access">Product access</a>
            <a href="#map">MIHARI MAP</a>
            <a href="#map-pages">MAP pages</a>
            <a href="#exposure-statuses">Exposure statuses</a>
            <a href="#risk-graph">Risk Graph</a>
            <a href="#defi-exposure">DeFi Exposure</a>
            <a href="#policy-recommendations">Policy Recommendations</a>
            <a href="#guard-actions">Guard Actions</a>
            <a href="#share-signal">Share Signal</a>
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
              MIHARI watches Robinhood Stock Tokens for dividends, splits, multiplier changes
              and other corporate actions. It turns official event data into a clear explanation
              of what happened, what may be affected and what the user should review next.
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
              <div><Wallet size={20} /><span className="mono">01 / ENTER</span><strong>Choose how to enter</strong><p>Open public Observe mode, use email and password, or create a wallet-first profile with a message signature.</p></div>
              <div><ListChecks size={20} /><span className="mono">02 / SELECT</span><strong>Build a watchlist</strong><p>Monitor 3 assets publicly, 10 with Observer access or 30 with MHR Holder access.</p></div>
              <div><ShieldCheck size={20} /><span className="mono">03 / OBSERVE</span><strong>Start monitoring</strong><p>Observe mode reads and explains risk. It cannot execute a transaction.</p></div>
              <div><Database size={20} /><span className="mono">04 / SOURCE</span><strong>Read official data</strong><p>MIHARI checks Robinhood asset metadata, prices, multipliers and corporate actions.</p></div>
              <div><Eye size={20} /><span className="mono">05 / REVIEW</span><strong>Open a matching event</strong><p>The Event Register shows watched assets that currently have an official corporate-action record.</p></div>
              <div><Bot size={20} /><span className="mono">06 / ANALYZE</span><strong>Read the Incident File</strong><p>See what happened, the possible impact, confidence, affected systems and a safe response.</p></div>
              <div><Check size={20} /><span className="mono">07 / DECIDE</span><strong>Stay in control</strong><p>MIHARI recommends what to review. It does not move funds or execute the response.</p></div>
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
            <h2>Why can a watchlist contain many assets while Events shows only a few?</h2>
            <div className="docs-compare">
              <div>
                <span className="mono">WATCHLIST · SELECTED ASSETS</span>
                <h3>What MIHARI monitors</h3>
                <p>Your private watchlist can contain up to 10 assets with Observer access or 30 with MHR Holder access.</p>
              </div>
              <ArrowRight size={22} />
              <div className="highlight">
                <span className="mono">REGISTER · MATCHING EVENTS</span>
                <h3>What requires attention</h3>
                <p>If only three watched assets have corporate-action records, only those three appear.</p>
              </div>
            </div>
            <p>
              The other selected assets are still being checked. They do not appear in the Event
              Register until Robinhood returns a matching corporate-action record for them.
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

          <section className="docs-section" id="data-sources">
            <p className="docs-kicker mono">05 / LIVE DATA</p>
            <h2>Which information is real and where it comes from.</h2>
            <p>
              The production app uses live source data. MIHARI does not infer wallet balances or
              invent a corporate action. Each part of the product has a named source and a clear
              fallback boundary.
            </p>
            <div className="docs-result-grid">
              <div><span className="mono">ROBINHOOD ASSET API</span><strong>Official Stock Token catalog</strong><p>Provides active symbols, token names, contract deployments, status and multiplier metadata used to identify official assets.</p></div>
              <div><span className="mono">ROBINHOOD PRICE API</span><strong>Live market context</strong><p>Provides bid and ask data used to calculate the indicative value shown in Exposure. The displayed value is informational, not an executable quote.</p></div>
              <div><span className="mono">ROBINHOOD CORPORATE ACTIONS</span><strong>Official event records</strong><p>Provides dividends, splits, event status and available event details. The private Event Register checks only the saved watchlist.</p></div>
              <div><span className="mono">ROBINHOOD CHAIN BLOCKSCOUT</span><strong>Onchain wallet balances</strong><p>Provides ERC-20 balances for verified addresses. MIHARI matches contracts against Robinhood metadata and separately checks the official $MHR contract.</p></div>
              <div><span className="mono">MORPHO</span><strong>Lending and vault positions</strong><p>Provides read-only supply, borrow, collateral and vault positions for verified addresses. MIHARI keeps only positions involving official Stock Token contracts.</p></div>
              <div><span className="mono">UNISWAP V3 + V4</span><strong>Liquidity position discovery</strong><p>Blockscout identifies LP NFTs and read-only contract calls provide liquidity, token pairs, tick ranges and current pool state. MIHARI calculates the Stock Token amount represented inside each position.</p></div>
              <div><span className="mono">ARCUS + LIGHTER</span><strong>Perpetual position discovery</strong><p>Public read-only APIs provide active position symbols, direction, value, margin context and unrealized PnL. MIHARI keeps only markets matched to the official Stock Token catalog.</p></div>
              <div><span className="mono">OPENAI</span><strong>Structured risk explanation</strong><p>The model receives an event only after the server verifies it against Robinhood. It returns analysis and recommendations, not source facts or transaction authority.</p></div>
              <div><span className="mono">NEON</span><strong>Profile and incident memory</strong><p>Stores private watchlists, linked wallet records and cached event analysis so repeated views do not create unnecessary AI calls.</p></div>
            </div>
            <div className="docs-callout">
              <strong>Current protocol coverage.</strong>
              <p>Morpho, Uniswap V3, Uniswap V4, Arcus and Lighter are active read-only adapters. Rialto and Chainlink remain planned and are not counted as checked. MIHARI does not claim coverage of every protocol position on Robinhood Chain.</p>
            </div>
            <div className="docs-callout docs-callout-muted">
              <strong>Fallback behavior.</strong>
              <p>If Robinhood data is unavailable, the public console may display clearly labelled simulated fallback records. Private wallet risk analysis requires a server-verified Robinhood event and does not treat simulated data as personal evidence.</p>
            </div>
          </section>

          <section className="docs-section" id="intelligence-api">
            <p className="docs-kicker mono">06 / INTELLIGENCE API</p>
            <h2>Use MIHARI context in another product.</h2>
            <p>
              MIHARI Intelligence API is a public read-only beta for teams building on Robinhood
              Chain. It returns official Stock Token corporate-action context plus a structured
              MIHARI interpretation, multiplier-aware quote integrity and public market dependency context. It is for dashboards, research tools and early integrations,
              not for executing an action on behalf of a user.
            </p>
            <div className="docs-result-grid">
              <div><span className="mono">GET /API/V1</span><strong>Read the API index</strong><p>Returns the version, public-beta safety boundary, documentation link and all available endpoints in one machine-readable response.</p></div>
              <div><span className="mono">GET /CATALOG</span><strong>Read the live asset universe</strong><p>Returns active official Stock Tokens with deployments, contract metadata, multiplier state and tradability context.</p></div>
              <div><span className="mono">GET /RISK-FEED</span><strong>Integration-ready risk context</strong><p>For 1 to 10 selected symbols, returns official contract, raw and multiplier-adjusted quote context, multiplier state, normalized event details, risk level and policy recommendation in one feed.</p></div>
              <div><span className="mono">GET /QUOTE-INTEGRITY</span><strong>Keep quote context consistent</strong><p>Shows the raw quote and multiplier-adjusted token context separately, then flags pending multipliers, halted markets and stale source timestamps.</p></div>
              <div><span className="mono">GET /DEPENDENCIES</span><strong>Read public market context</strong><p>For up to five symbols, returns publicly discovered supported markets. It is venue coverage, not proof of a personal wallet position.</p></div>
              <div><span className="mono">GET /EVENTS</span><strong>Read official event records</strong><p>Returns current official Robinhood corporate actions across the active catalog or a selected set of symbols.</p></div>
              <div><span className="mono">GET /ASSETS/{`{SYMBOL}`}</span><strong>Read one Stock Token</strong><p>Returns active deployment data, multiplier context, available price fields and matching official corporate actions.</p></div>
              <div><span className="mono">GET /ANALYSIS</span><strong>Read MIHARI interpretation</strong><p>Returns cached AI interpretation when available or the same deterministic policy logic used inside MIHARI.</p></div>
              <div><span className="mono">OFFICIAL SOURCE ONLY</span><strong>No simulated data</strong><p>The API responds only when the Robinhood source is live. It returns an unavailable response instead of exposing fallback examples.</p></div>
              <div><span className="mono">NO PRIVATE DATA</span><strong>Safe integration boundary</strong><p>Profiles, wallet addresses, balances, private Guard receipts and personal risk files are never exposed by the public API.</p></div>
              <div><span className="mono">ADVISORY ONLY</span><strong>Keep your controls</strong><p>API recommendations never move funds, request approvals or submit a transaction. Integrations remain responsible for their own decisions.</p></div>
              <div><span className="mono">GET /COVERAGE</span><strong>Read adapter availability</strong><p>Returns the MIHARI registry for active, beta and planned protocol adapters. It never reveals individual protocol positions.</p></div>
              <div><span className="mono">SIGNED WEBHOOKS</span><strong>Receive official event changes</strong><p>Approved integrations can subscribe to normalized corporate-action updates. Payloads are HMAC-SHA256 signed and include a revision fingerprint for safe deduplication.</p></div>
              <div><span className="mono">REMOTE MCP</span><strong>Use MIHARI as agent tools</strong><p>Connect a compatible agent to <code>https://mihari.pro/mcp</code> for read-only risk feed, quote integrity, market dependencies and Stock Token tools.</p></div>
            </div>
            <div className="docs-callout">
              <strong>Public reads, signed webhooks for approved integrations.</strong>
              <p>Read endpoints do not need a key during beta. Events include revision and deduplication fields. Webhook management uses a server-only integration key and HMAC-SHA256 signatures. See <Link href="/developers">MIHARI Intelligence API</Link> for live endpoint examples.</p>
            </div>
          </section>

          <section className="docs-section" id="wallet">
            <p className="docs-kicker mono">07 / PROFILE ACCESS</p>
            <h2>Two ways to create and access a profile.</h2>
            <div className="wallet-doc-card">
              <div>
                <Wallet size={24} />
                <strong>Wallet-first access</strong>
                <p>Sign a free message to prove wallet ownership. This path does not require an email or password and does not create a transaction.</p>
              </div>
              <div>
                <strong>Email access</strong>
                <p>Create an account with an email and password. After signing in, you can link one or more wallets to the same MIHARI profile.</p>
              </div>
              <div>
                <strong>Link both methods</strong>
                <p>A wallet-first user can add email access later. The linked email opens the same watchlist, wallets and exposure map.</p>
              </div>
            </div>
            <div className="docs-callout">
              <strong>A signature is not a transaction.</strong>
              <p>Wallet verification costs no gas and grants no permission to move tokens. The email registration route currently uses a password.</p>
            </div>
            <p className="docs-note mono">MIHARI WILL NEVER ASK FOR A SEED PHRASE OR PRIVATE KEY.</p>
          </section>

          <section className="docs-section" id="access">
            <p className="docs-kicker mono">08 / PRODUCT ACCESS</p>
            <h2>Clear limits, checked onchain.</h2>
            <p>
              Every profile starts with useful Observer access. MIHARI adds the MHR balances across
              verified wallets. A combined balance of at least 1,000,000 MHR unlocks Holder access in the
              current beta. The balance check is read-only and cannot move tokens.
            </p>
            <p>
              Visitors without a profile can monitor up to 3 assets in the public Observe experience.
              A registered Observer receives the full personal workspace, one verified wallet,
              watchlist research signals and a direct Risk Graph. The DeFi page shows its coverage
              preview, while Holder access unlocks personal protocol scans.
            </p>
            <div className="docs-compare">
              <div>
                <span className="mono">OBSERVER</span>
                <h3>Direct monitoring</h3>
                <p>Monitor 10 assets, verify 1 wallet, request 1 new AI analysis per 24 hours and map direct holdings plus watchlist research signals.</p>
              </div>
              <ArrowRight size={22} />
              <div className="highlight">
                <span className="mono">MHR HOLDER</span>
                <h3>Complete position map</h3>
                <p>Monitor 30 assets, verify 5 wallets, request 10 new AI analyses, scan personal DeFi positions and add proven protocol paths to the Risk Graph.</p>
              </div>
            </div>
            <div className="docs-callout">
              <strong>Monitoring does not stop when an AI limit is reached.</strong>
              <p>Cached AI results are reused. MIHARI shows a rule-based explanation if a new model request is unavailable.</p>
            </div>
          </section>

          <section className="docs-section" id="map">
            <p className="docs-kicker mono">09 / MIHARI MAP</p>
            <h2>Your private monitoring and exposure workspace.</h2>
            <p>
              MIHARI MAP connects a personal watchlist with verified Robinhood Chain wallets. It
              shows two separate things: assets you want to monitor and Stock Tokens actually
              found in your wallets. Choosing AMC in Assets adds AMC to monitoring. It does not
              claim that you own AMC. A holding appears in Exposure only after MIHARI finds a
              non-zero balance of the official Robinhood contract in a verified wallet.
            </p>
            <div className="docs-compare">
              <div><span className="mono">WATCHLIST</span><h3>What you want to monitor</h3><p>Up to 10 assets with Observer access or 30 with MHR Holder access, including assets you may be researching before buying.</p></div>
              <ArrowRight size={22} />
              <div className="highlight"><span className="mono">EXPOSURE</span><h3>What the wallet actually holds</h3><p>Non-zero official Stock Token balances discovered automatically across every verified wallet.</p></div>
            </div>
          </section>

          <section className="docs-section" id="map-pages">
            <p className="docs-kicker mono">10 / MIHARI MAP PAGES</p>
            <h2>What each page does.</h2>
            <div className="docs-result-grid">
              <div><span className="mono">OVERVIEW</span><strong>Your profile at a glance</strong><p>See the number of monitored assets, verified wallets, detected Stock Token positions and holdings with matching events. Use the links in each panel to open the relevant page.</p></div>
              <div><span className="mono">EVENTS</span><strong>Events for your watchlist</strong><p>See current Robinhood corporate actions for saved assets. The page refreshes every 60 seconds while open and labels each event as Held in Wallet or Watchlist Only.</p></div>
              <div><span className="mono">INCIDENT FILE</span><strong>AI explanation for an event</strong><p>Open an event to read what happened, possible effects on NAV, quotes, vaults or lending, the confidence score and the recommended response.</p></div>
              <div><span className="mono">ASSETS</span><strong>Watchlist and contract directory</strong><p>Search the live catalog, use the limit shown for your profile, copy official contract addresses and verify deployments in Blockscout.</p></div>
              <div><span className="mono">WALLETS</span><strong>Verified wallets and $MHR</strong><p>Link multiple EVM addresses, see their verification status and check whether each address holds the official $MHR token.</p></div>
              <div><span className="mono">EXPOSURE</span><strong>Stock Tokens found onchain</strong><p>MIHARI scans the full official catalog, not only the watchlist. It shows balances, indicative values and whether a current corporate action matches each holding.</p></div>
              <div><span className="mono">RISK GRAPH</span><strong>Holdings and research signals</strong><p>Connects a live Robinhood event to direct holdings and watchlist assets. Holder access adds every supported protocol position MIHARI can prove.</p></div>
              <div><span className="mono">DEFI</span><strong>Coverage preview and Holder scan</strong><p>Everyone can review supported protocols and watchlist research scope. Holders can scan verified wallets for Morpho, Uniswap, Arcus and Lighter positions.</p></div>
              <div><span className="mono">POLICY</span><strong>Structured operator review plan</strong><p>Turns a verified event into a priority, scope, required checks, apply conditions and clear conditions. It does not execute the recommendation.</p></div>
              <div><span className="mono">PERSONAL RISK FILE</span><strong>Risk attached to a real holding</strong><p>If a wallet holding has an Event Match, View Risk adds the position balance to the event analysis so the user can review personal exposure.</p></div>
              <div><span className="mono">PROFILE</span><strong>Access and product mode</strong><p>See whether the profile started with wallet or email access, add the missing access method and confirm that the product remains in read-only Observe mode.</p></div>
              <div><span className="mono">RESCAN</span><strong>Refresh wallet information</strong><p>Request fresh profile data, wallet balances, Stock Token positions, $MHR status, prices and event matching.</p></div>
            </div>

            <h3 className="docs-subheading">What the labels mean</h3>
            <div className="status-table docs-label-table">
              <div><strong>Monitored</strong><span className="status-pill live">Selected</span><p>The asset belongs to the saved watchlist and is checked for corporate actions.</p></div>
              <div><strong>Not monitored</strong><span className="status-pill next">Not selected</span><p>The asset remains in the live catalog but is not part of the saved watchlist.</p></div>
              <div><strong>Held in wallet</strong><span className="status-pill live">Personal</span><p>The event symbol matches a Stock Token balance found in at least one verified wallet.</p></div>
              <div><strong>Watchlist only</strong><span className="status-pill readonly">Monitoring</span><p>The asset is monitored, but MIHARI did not find that Stock Token in the linked wallets.</p></div>
              <div><strong>Contract / Chain 4663</strong><span className="status-pill readonly">Source data</span><p>The official Robinhood Stock Token deployment used for wallet matching on Robinhood Chain.</p></div>
              <div><strong>Save scope</strong><span className="status-pill readonly">Profile action</span><p>Saves the current selection to this private MIHARI profile.</p></div>
              <div><strong>Watchlist limit</strong><span className="status-pill readonly">Server enforced</span><p>Public access supports 3 assets, Observer access supports 10 and MHR Holder access supports 30. Wallet holdings are still scanned across the full official catalog.</p></div>
              <div><strong>$MHR Balance Found</strong><span className="status-pill live">Onchain</span><p>The verified address has a non-zero balance of the official $MHR contract. Holder product access starts only when combined verified balances reach 1,000,000 MHR.</p></div>
              <div><strong>$MHR Not Held</strong><span className="status-pill readonly">Onchain</span><p>The balance scan completed and no non-zero $MHR balance was found.</p></div>
              <div><strong>$MHR Unavailable</strong><span className="status-pill next">Source issue</span><p>The balance source did not return a usable response, so MIHARI does not assume the balance is zero.</p></div>
            </div>
          </section>

          <section className="docs-section" id="exposure-statuses">
            <p className="docs-kicker mono">11 / EXPOSURE AND RISK</p>
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
            <div className="docs-callout">
              <strong>Event state and personal risk are different.</strong>
              <p>Event Active means Robinhood is still processing the corporate action. Personal Risk classifies the expected operational impact. An active cash dividend can therefore have Medium personal risk because it requires review, but does not by itself prove an urgent valuation mismatch.</p>
            </div>
            <div className="status-table docs-label-table">
              <div><strong>Low</strong><span className="status-pill readonly">Risk</span><p>The record appears resolved or has limited immediate operational impact, but still requires normal monitoring.</p></div>
              <div><strong>Medium</strong><span className="status-pill readonly">Risk</span><p>The event can require accounting or operational review without an immediate critical mismatch.</p></div>
              <div><strong>High</strong><span className="status-pill live">Risk</span><p>The event may materially affect valuation, quoting or connected protocol accounting.</p></div>
              <div><strong>Critical</strong><span className="status-pill live">Risk</span><p>The analysis identifies an urgent mismatch or a condition that may immediately affect valuation, quoting or connected positions.</p></div>
              <div><strong>In progress</strong><span className="status-pill live">Source</span><p>Robinhood reports that the corporate action is currently being processed.</p></div>
              <div><strong>Completed</strong><span className="status-pill readonly">Source</span><p>Robinhood reports that event processing is complete. Downstream systems may still need reconciliation.</p></div>
              <div><strong>Pending</strong><span className="status-pill next">Source</span><p>The source has not provided a completed event state or effective date yet.</p></div>
            </div>

            <div className="docs-callout">
              <strong>What AMC means in the example.</strong>
              <p>AMC was found automatically in the wallet and valued from live market context. No Event Match means there is no matching corporate-action record in the current response, so MIHARI keeps monitoring it but has no risk file to analyze right now.</p>
            </div>
          </section>

          <section className="docs-section" id="risk-graph">
            <p className="docs-kicker mono">12 / UNIFIED RISK GRAPH</p>
            <h2>How to read an event-to-position path.</h2>
            <p>
              Risk Graph prioritizes direct wallet holdings and then adds watchlist assets as research
              signals. It shows where a current official corporate action reaches exposure that MIHARI
              has mapped, or which event should be reviewed before buying a watched asset. Holder access
              also adds supported protocol positions. It does not create hypothetical positions or use simulated fallback events.
            </p>
            <div className="docs-flow docs-workflow">
              <div><AlertTriangle size={20} /><span className="mono">01 / EVENT</span><strong>Live Robinhood record</strong><p>The path starts only from an official corporate action returned in live mode.</p></div>
              <div><ShieldCheck size={20} /><span className="mono">02 / ASSET</span><strong>Verified Stock Token identity</strong><p>Direct positions use an official contract match. Perpetual positions use an exact official symbol match.</p></div>
              <div><Wallet size={20} /><span className="mono">03 / DIRECT</span><strong>Verified wallet balance</strong><p>Each direct path identifies the linked wallet, token amount and indicative value when available.</p></div>
              <div><Landmark size={20} /><span className="mono">04 / PROTOCOL</span><strong>Supported protocol position</strong><p>Each protocol path identifies the adapter, position type, amount and available margin or PnL context.</p></div>
            </div>
            <div className="status-table docs-label-table">
              <div><strong>Active Signals</strong><span className="status-pill live">Official</span><p>Corporate actions that match a holding, supported protocol position or watchlist asset.</p></div>
              <div><strong>Tracked Assets</strong><span className="status-pill readonly">Scope</span><p>Unique Stock Token symbols found across holdings, protocol positions and the watchlist.</p></div>
              <div><strong>Direct Paths</strong><span className="status-pill readonly">Wallet</span><p>Verified wallet balance rows touched by the current official events.</p></div>
              <div><strong>Protocol Paths</strong><span className="status-pill beta">Adapter</span><p>Supported protocol position rows touched by the current official events.</p></div>
              <div><strong>Watchlist Signal</strong><span className="status-pill readonly">Research</span><p>A watched asset has an official event, but MIHARI has not found a personal position for it.</p></div>
              <div><strong>Partial</strong><span className="status-pill beta">Source</span><p>Usable direct paths remain visible while at least one protocol source is incomplete or unavailable.</p></div>
              <div><strong>No Active Path</strong><span className="status-pill readonly">Monitoring</span><p>No current official event matches a mapped position. This is not a guarantee of zero risk.</p></div>
            </div>
            <div className="docs-callout">
              <strong>Edges are deterministic.</strong>
              <p>AI can explain a matched event in an Incident File, but it does not create Risk Graph nodes or relationships.</p>
            </div>
          </section>

          <section className="docs-section" id="defi-exposure">
            <p className="docs-kicker mono">13 / DEFI EXPOSURE</p>
            <h2>How MIHARI finds Stock Tokens beyond a direct wallet balance.</h2>
            <p>
              A Stock Token may leave the wallet balance after it is supplied to a lending market,
              posted as collateral, deposited in a vault, represented inside liquidity or used for a perpetual position. DeFi Exposure checks supported
              protocols for those positions and then uses the official Robinhood contract catalog
              to decide whether a position contains a Stock Token.
            </p>
            <div className="docs-callout">
              <strong>Visible to everyone, personal scans for Holders.</strong>
              <p>Observers can review protocol coverage and an asset scope with holdings first and watchlist-only research assets second. A combined verified balance of at least 1,000,000 MHR unlocks personal scans across up to five wallets and adds proven protocol positions to the Risk Graph.</p>
            </div>
            <div className="docs-flow docs-workflow">
              <div><Wallet size={20} /><span className="mono">01 / IDENTITY</span><strong>Read verified addresses</strong><p>Only wallets already linked to the MIHARI profile are scanned.</p></div>
              <div><Landmark size={20} /><span className="mono">02 / PROTOCOL</span><strong>Query active adapters</strong><p>MIHARI reads Morpho positions, Uniswap V3 and V4 LP NFTs, plus public Arcus and Lighter perpetual positions for verified addresses.</p></div>
              <div><Database size={20} /><span className="mono">03 / VERIFY</span><strong>Match official assets</strong><p>Onchain positions must match official contracts. Perpetual markets must match exact symbols from Robinhood metadata. Unknown assets are ignored.</p></div>
              <div><ShieldCheck size={20} /><span className="mono">04 / MATCH</span><strong>Check corporate actions</strong><p>The Stock Token symbol is compared with the current official corporate-action response.</p></div>
            </div>

            <h3 className="docs-subheading">Positions detected by active adapters</h3>
            <div className="docs-result-grid">
              <div><span className="mono">LENDING SUPPLY</span><strong>Stock Token supplied</strong><p>The verified wallet has supplied the Stock Token as the loan asset in a Morpho market.</p></div>
              <div><span className="mono">COLLATERAL</span><strong>Stock Token securing a loan</strong><p>The Stock Token is posted as collateral and may be exposed to valuation and liquidation rules.</p></div>
              <div><span className="mono">BORROW</span><strong>Stock Token borrowed</strong><p>The position includes borrowed Stock Token debt in a supported Morpho market.</p></div>
              <div><span className="mono">VAULT DEPOSIT</span><strong>Stock Token inside a vault position</strong><p>The verified wallet holds a Morpho vault position whose underlying asset is an official Stock Token.</p></div>
              <div><span className="mono">DEX LIQUIDITY</span><strong>Stock Token inside a Uniswap LP</strong><p>The wallet owns a V3 or V4 position whose current principal contains an official Stock Token. MIHARI also reports the NFT reference and whether the position is active or out of range.</p></div>
              <div><span className="mono">PERP POSITION</span><strong>Stock Token long or short exposure</strong><p>An Arcus or Lighter market symbol matches the official Stock Token catalog. MIHARI reports direction, notional value, margin mode, leverage when available and unrealized PnL.</p></div>
            </div>

            <h3 className="docs-subheading">Source and result statuses</h3>
            <div className="status-table docs-label-table">
              <div><strong>Live</strong><span className="status-pill live">Scan</span><p>All verified wallet requests for this active adapter completed successfully.</p></div>
              <div><strong>Beta</strong><span className="status-pill beta">Integration</span><p>The adapter is scanning real data, but coverage limits and source behavior are still being validated.</p></div>
              <div><strong>Planned</strong><span className="status-pill next">Integration</span><p>The source belongs to the roadmap but is not queried or counted as checked today.</p></div>
              <div><strong>Partial</strong><span className="status-pill beta">Source</span><p>At least one verified wallet was scanned successfully while another request failed. Successful results remain visible.</p></div>
              <div><strong>Unavailable</strong><span className="status-pill next">Source</span><p>The protocol source did not return a usable result. MIHARI does not assume that the wallet has no position.</p></div>
              <div><strong>Waiting for wallet</strong><span className="status-pill readonly">Setup</span><p>No verified address exists in the profile, so a personal protocol scan cannot start.</p></div>
              <div><strong>No supported position found</strong><span className="status-pill readonly">Result</span><p>The active adapters were checked but no position involving an official Stock Token contract was found. This does not describe planned or unsupported protocols.</p></div>
              <div><strong>Event Match</strong><span className="status-pill live">Review</span><p>An official corporate-action record matches the Stock Token inside the protocol position.</p></div>
              <div><strong>No Event Match</strong><span className="status-pill readonly">Monitoring</span><p>No matching corporate action appears in the current live source response. This is not a guarantee of zero risk.</p></div>
            </div>
            <h3 className="docs-subheading">How to read the DeFi dashboard</h3>
            <div className="docs-result-grid">
              <div><span className="mono">HOLDING</span><strong>Found in a verified wallet</strong><p>The asset is prioritized and can be matched to a personal protocol position after Holder access is verified.</p></div>
              <div><span className="mono">WATCHLIST / RESEARCH</span><strong>Monitored before purchase</strong><p>The asset is checked for official events but is not presented as a wallet holding or proven DeFi position.</p></div>
              <div><span className="mono">CHECKED / MAPPED</span><strong>Real scans versus the roadmap</strong><p>Checked counts adapters that returned live or partial results. Mapped includes active and planned ecosystem sources shown in the registry.</p></div>
              <div><span className="mono">PROTOCOL POSITIONS</span><strong>Recognized position rows</strong><p>Each row represents one Stock Token side of a supported protocol position. One LP NFT can create more than one row if both currencies are official Stock Tokens.</p></div>
              <div><span className="mono">AMOUNT / VALUE</span><strong>Calculated Stock Token exposure</strong><p>Amount is the token quantity represented by the protocol position. Value uses the Robinhood bid and ask midpoint when available and remains indicative.</p></div>
              <div><span className="mono">ACTIVE / OUT OF RANGE</span><strong>Liquidity range status</strong><p>Active means the current Uniswap tick is inside the LP range. Out of Range means it is outside. This is a position state, not a corporate-action risk rating.</p></div>
              <div><span className="mono">LONG / SHORT / UPNL</span><strong>Perpetual position context</strong><p>Direction, margin mode and unrealized PnL come from the protocol source. Lighter leverage is derived from its reported initial margin fraction. These values are informational and do not include every liquidation parameter.</p></div>
              <div><span className="mono">EVENT MATCH</span><strong>Corporate action found</strong><p>The Stock Token inside the protocol position has a current official Robinhood corporate-action record.</p></div>
              <div><span className="mono">NO EVENT MATCH</span><strong>Monitoring continues</strong><p>No current corporate-action record matched this position. It does not mean that all DeFi or market risk is absent.</p></div>
            </div>
            <div className="docs-callout">
              <strong>Read-only by design.</strong>
              <p>DeFi Exposure does not request a token approval, submit a transaction, move funds or change any protocol position.</p>
            </div>
          </section>

          <section className="docs-section" id="policy-recommendations">
            <p className="docs-kicker mono">14 / POLICY RECOMMENDATIONS</p>
            <h2>From a detected event to a reviewable plan.</h2>
            <p>
              The Policy page starts with a server-verified Robinhood corporate action. MIHARI
              interprets its possible operational impact and creates a bounded recommendation for
              the user or protocol operator. Holdings and watchlist events can both produce a
              recommendation, but MIHARI keeps their context separate.
            </p>
            <div className="docs-flow docs-workflow">
              <div><Database size={20} /><span className="mono">01 / EVENT</span><strong>Verify the source</strong><p>The recommendation starts from an official Robinhood corporate-action record, not arbitrary browser text.</p></div>
              <div><AlertTriangle size={20} /><span className="mono">02 / INTERPRET</span><strong>Identify possible impact</strong><p>MIHARI classifies risk and names the systems that may require review, such as NAV, quotes, vaults or lending.</p></div>
              <div><ListChecks size={20} /><span className="mono">03 / RECOMMEND</span><strong>Build the policy plan</strong><p>The result contains a priority, intent, required checks and observable policy boundaries.</p></div>
              <div><ShieldCheck size={20} /><span className="mono">04 / DECIDE</span><strong>Keep the operator in control</strong><p>The user reviews the recommendation. No signature, approval or transaction is requested.</p></div>
            </div>

            <h3 className="docs-subheading">How to read the Policy page</h3>
            <div className="docs-result-grid">
              <div><span className="mono">PRIORITY</span><strong>How quickly to review</strong><p>Routine means normal monitoring. Review means an operator should verify the event and dependent calculations. Urgent means sensitive new activity should be reviewed before continuing.</p></div>
              <div><span className="mono">INTENT</span><strong>What the plan is trying to achieve</strong><p>Examples include monitoring, reviewing accounting, restricting new exposure or pausing sensitive flows. This label is not an executed action.</p></div>
              <div><span className="mono">SCOPE</span><strong>Systems that may be affected</strong><p>Quotes, NAV, vaults, lending or agents. Scope describes potential operational reach, not proof of a position in every listed system.</p></div>
              <div><span className="mono">REQUIRED CHECKS</span><strong>Evidence to verify</strong><p>Concrete operator checks such as confirming the active multiplier, reviewing ex-dividend pricing or identifying integrations using stale data.</p></div>
              <div><span className="mono">APPLY WHEN</span><strong>Activation condition</strong><p>An observable condition that explains when the recommendation is relevant. It does not activate a smart contract or protocol rule.</p></div>
              <div><span className="mono">CLEAR WHEN</span><strong>Release condition</strong><p>An observable condition that explains when reconciliation is complete and the recommendation can be closed.</p></div>
              <div><span className="mono">OPERATOR DECISION</span><strong>Required human control</strong><p>No Action, Review Required or Approval Required describes the expected review level. MIHARI does not make the decision for the user.</p></div>
              <div><span className="mono">ADVISORY ONLY</span><strong>No automatic execution</strong><p>The recommendation cannot move funds, change a protocol position, submit an approval or claim that a policy was applied.</p></div>
            </div>
            <div className="docs-callout">
              <strong>AI interpretation, deterministic safety boundary.</strong>
              <p>OpenAI can create the structured recommendation from verified evidence. If AI is unavailable or limited, MIHARI returns deterministic policy rules. Both outputs use the same schema and remain advisory.</p>
            </div>
          </section>

          <section className="docs-section" id="guard-actions">
            <p className="docs-kicker mono">15 / GUARD ACTIONS</p>
            <h2>Approve a decision without giving up control.</h2>
            <p>
              Guard Actions is the next layer after a Policy Recommendation. An MHR Holder can
              prepare a bounded response only when the event is still present in the official
              Robinhood source and the affected Stock Token is held in a verified wallet.
              Watchlist-only assets remain research signals.
            </p>
            <div className="docs-flow">
              <div><Database size={20} /><span className="mono">01 / REVERIFY</span><strong>Read the event again</strong><p>The server fetches the official event again and creates a source hash. Browser text is never accepted as evidence.</p></div>
              <div><Wallet size={20} /><span className="mono">02 / PROVE SCOPE</span><strong>Check access and holding</strong><p>The server confirms MHR Holder access and an actual Stock Token balance in a verified wallet.</p></div>
              <div><ListChecks size={20} /><span className="mono">03 / PREVIEW</span><strong>Show every boundary</strong><p>The user sees the intended action, systems in scope, checks, action steps and closing conditions before approval.</p></div>
              <div><ShieldCheck size={20} /><span className="mono">04 / APPROVE</span><strong>Record an explicit decision</strong><p>Three confirmations and an exact approval phrase are required before a private decision receipt is created.</p></div>
            </div>

            <h3 className="docs-subheading">What the current beta records</h3>
            <div className="docs-result-grid">
              <div><span className="mono">DRAFT</span><strong>Prepared, not approved</strong><p>A current official event and direct holding were verified. The user can review or dismiss the preview.</p></div>
              <div><span className="mono">APPROVED</span><strong>Decision recorded</strong><p>The confirmation checks passed and the private audit receipt was stored in the user's MIHARI account.</p></div>
              <div><span className="mono">PRIVATE RECEIPT</span><strong>Evidence of the decision</strong><p>A SHA-256 hash links the account, event source hash, reviewed preview, intent and approval time.</p></div>
              <div><span className="mono">NOT SUBMITTED</span><strong>No onchain transaction</strong><p>The receipt has no transaction hash. No protocol action, token approval or fund movement occurred.</p></div>
              <div><span className="mono">EXPORT JSON</span><strong>Portable audit record</strong><p>Download the event hashes, verified holding snapshot, reviewed Guard preview and decision metadata as a local JSON file.</p></div>
            </div>
            <div className="docs-callout">
              <strong>Holder feature, execution still locked.</strong>
              <p>Guard previews and private decision receipts are live in beta. Automatic protocol execution and public onchain proofs remain unavailable until audited contracts and adapters are deployed.</p>
            </div>
          </section>

          <section className="docs-section" id="share-signal">
            <p className="docs-kicker mono">16 / SHARE SIGNAL</p>
            <h2>Share the warning, not your private data.</h2>
            <p>
              Share Signal turns a MIHARI finding into a short public post and a branded preview
              card for X. It is available from watchlist events, personal risk files and Guard
              decision history. The user always reviews the post before publishing it.
            </p>
            <div className="docs-result-grid">
              <div><span className="mono">PUBLIC CONTEXT</span><strong>A useful risk summary</strong><p>The card can show the Stock Token symbol, corporate-action type, review level, signal context and systems that may need attention.</p></div>
              <div><span className="mono">PRIVATE BY DESIGN</span><strong>Personal data stays out</strong><p>Wallet addresses, token balances, email addresses, private receipt hashes and internal evidence snapshots are never added to the share URL or card.</p></div>
              <div><span className="mono">THREE CONTEXTS</span><strong>Holding, watchlist or Guard</strong><p>The wording clearly separates verified exposure from a research signal and from a recorded Guard decision.</p></div>
              <div><span className="mono">USER CONTROL</span><strong>Nothing posts automatically</strong><p>MIHARI opens an X composer with prepared text. The user can edit, cancel or publish it.</p></div>
            </div>
            <div className="docs-callout">
              <strong>A shared signal is not proof of ownership or loss.</strong>
              <p>It is a public summary of a MIHARI review context. The private workspace remains the source for verified holdings, evidence and decision receipts.</p>
            </div>
          </section>

          <section className="docs-section" id="status">
            <p className="docs-kicker mono">17 / PRODUCT STATUS</p>
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
            <p className="docs-kicker mono">18 / KEY TERMS</p>
            <h2>A short glossary.</h2>
            <dl className="docs-glossary">
              <div><dt>NAV</dt><dd>Net Asset Value: the calculated value of assets held by a vault or fund, minus its liabilities.</dd></div>
              <div><dt>Multiplier</dt><dd>The shares-per-token factor used to account for corporate actions such as splits.</dd></div>
              <div><dt>Stale quote</dt><dd>A price that no longer represents the same corporate-action state as the asset metadata.</dd></div>
              <div><dt>Onchain proof</dt><dd>A future transaction or attestation recording what policy decision was made and when.</dd></div>
              <div><dt>Watchlist</dt><dd>The Stock Tokens a profile asks MIHARI to monitor. It is separate from assets actually held in linked wallets.</dd></div>
              <div><dt>Exposure</dt><dd>A recognized Robinhood Stock Token balance found automatically in a verified wallet and matched with current event data.</dd></div>
              <div><dt>Event match</dt><dd>A corporate-action record from Robinhood that has the same symbol as a Stock Token position found in the wallet.</dd></div>
              <div><dt>Protocol exposure</dt><dd>A Stock Token position discovered inside supported lending, vault, DEX liquidity or perpetual infrastructure rather than only as a direct wallet balance.</dd></div>
            </dl>
          </section>
        </article>
      </div>
    </main>
  );
}
