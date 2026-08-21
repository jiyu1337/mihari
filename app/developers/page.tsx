import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Braces,
  Database,
  Eye,
  Network,
  ShieldCheck,
  Webhook,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "MIHARI Intelligence API",
  description: "Read-only Robinhood Stock Token event intelligence for developers and AI agents.",
};

const mcpConfig = "{\n  \"mcpServers\": {\n    \"mihari\": {\n      \"url\": \"https://mihari.pro/mcp\"\n    }\n  }\n}";
const riskFeedExample = "curl \"https://mihari.pro/api/v1/risk-feed?symbols=AAPL,NVDA\"";

const endpoints = [
  { method: "GET", path: "/api/v1", detail: "Machine-readable API index with the public beta boundary and every available endpoint." },
  { method: "GET", path: "/api/v1/catalog", detail: "The live active Stock Token catalog with official contract metadata, multiplier state and tradability context." },
  { method: "GET", path: "/api/v1/risk-feed", detail: "The complete integration feed for 1 to 10 selected symbols: official contract and quote context, multiplier state, normalized event details, MIHARI risk level and policy checks." },
  { method: "GET", path: "/api/v1/quote-integrity", detail: "A multiplier-aware consistency check for 1 to 10 symbols. It separates the raw underlying quote from the token-context quote and flags pending multipliers, halted or stale sources." },
  { method: "GET", path: "/api/v1/dependencies", detail: "Publicly discovered markets for up to five symbols across supported venues. It never treats venue coverage as a user’s personal position." },
  { method: "GET", path: "/api/v1/events", detail: "Read official Robinhood corporate actions across the active Stock Token catalog, or limit the response with symbols=AAPL,NVDA." },
  { method: "GET", path: "/api/v1/assets/{symbol}", detail: "Read official asset metadata, multiplier context, latest quote fields and matching corporate actions for one Stock Token." },
  { method: "GET", path: "/api/v1/events/{eventId}/analysis?symbol=AAPL", detail: "Read the MIHARI interpretation and bounded policy recommendation for one verified official event." },
  { method: "GET", path: "/api/v1/coverage", detail: "Read the active, beta and planned protocol adapters used by MIHARI, without exposing any personal positions." },
  { method: "POST", path: "/api/v1/webhooks", detail: "Create, test or remove signed corporate-action webhooks. This operator endpoint requires an integration API key and only accepts public HTTPS receivers." },
];

const tools = [
  ["mihari_get_risk_feed", "Corporate actions, multiplier context and bounded policy checks for selected Stock Tokens."],
  ["mihari_get_quote_integrity", "Raw source quote versus multiplier-aware token context, including source warnings."],
  ["mihari_get_public_dependencies", "Public markets across supported DeFi venues. Never personal positions."],
  ["mihari_get_stock_token", "Official token metadata, deployments, current multiplier and current events."],
];

export default function DevelopersPage() {
  return (
    <main className="developers-page paper-noise">
      <SiteHeader />

      <section className="developers-hero">
        <div className="developers-hero-index mono">
          <span>MIHARI / INTELLIGENCE LAYER</span>
          <span>ROBINHOOD CHAIN / 4663</span>
        </div>
        <p className="mono">PUBLIC BETA / READ ONLY / AGENT READY</p>
        <h1>One official event.<br />Every context you need.</h1>
        <p>
          MIHARI turns Robinhood Stock Token corporate actions, multiplier state and market context into structured intelligence
          for apps, protocols and AI agents. No wallets, profiles or private decisions are exposed.
        </p>
        <div className="developers-hero-strip" aria-label="API boundary">
          <span><ShieldCheck size={15} /> Official Robinhood source</span>
          <span><Eye size={15} /> Read-only intelligence</span>
          <span><Network size={15} /> No API key for public reads</span>
        </div>
      </section>

      <section className="developers-entry" aria-labelledby="access-heading">
        <div className="developers-entry-heading">
          <p className="mono">01 / ACCESS MODES</p>
          <h2 id="access-heading">Choose how you want<br />to use MIHARI.</h2>
          <p>Start with an agent, call the API directly, or use signed webhooks from your backend.</p>
        </div>

        <div className="developers-access-grid">
          <article className="developers-access-card developers-access-card-mcp" id="mcp-setup">
            <div className="developers-card-topline">
              <span className="developers-icon-box"><Bot size={25} /></span>
              <span className="developers-recommended mono">RECOMMENDED FOR AGENTS</span>
            </div>
            <div>
              <h3>MCP server</h3>
              <p>Give a compatible AI agent four bounded MIHARI tools for event, quote, dependency and Stock Token research.</p>
            </div>
            <pre aria-label="MCP connection example"><code>{mcpConfig}</code></pre>
            <div className="developers-card-footer">
              <span>Remote JSON-RPC · Streamable HTTP</span>
              <a href="#mcp-tools">View agent tools <ArrowRight size={16} /></a>
            </div>
          </article>

          <article className="developers-access-card developers-access-card-api" id="direct-api">
            <div className="developers-card-topline">
              <span className="developers-icon-box"><Zap size={25} /></span>
              <span className="mono">REST / PUBLIC BETA</span>
            </div>
            <div>
              <h3>Direct API</h3>
              <p>Build dashboards, monitoring systems and protocol workflows from the same public intelligence MIHARI uses.</p>
            </div>
            <pre aria-label="REST API example"><code>{riskFeedExample}</code></pre>
            <div className="developers-card-footer">
              <span>REST · JSON · First call in seconds</span>
              <a href="#endpoints">Explore endpoints <ArrowRight size={16} /></a>
            </div>
          </article>
        </div>
      </section>

      <section className="developers-proof-grid" aria-label="MIHARI API guarantees">
        <article><Database size={21} /><strong>Source before interpretation</strong><p>MIHARI only returns public intelligence when the official Robinhood source is live. Simulated fallback data never leaves the app.</p></article>
        <article><ShieldCheck size={21} /><strong>Safe integration boundary</strong><p>The API has no wallet, account, transaction or private receipt access. All responses remain advisory.</p></article>
        <article><Webhook size={21} /><strong>Revision-aware records</strong><p>Events include source fingerprints, revision identifiers and deduplication keys for reliable downstream automation.</p></article>
      </section>

      <section className="developers-section developers-mcp-tools" id="mcp-tools">
        <div className="developers-section-heading">
          <p className="mono">02 / MCP TOOL BELT</p>
          <h2>Give your agent context,<br />not transaction power.</h2>
        </div>
        <div className="developers-tool-list">
          {tools.map(([name, detail], index) => (
            <article key={name}>
              <span className="mono">0{index + 1}</span>
              <code>{name}</code>
              <p>{detail}</p>
            </article>
          ))}
        </div>
        <div className="developers-inline-note">
          <Bot size={18} />
          <p>MCP is research-only. MIHARI agents can retrieve official context and explain it, but cannot sign, trade, approve, move funds or read a MIHARI profile.</p>
          <a href="https://mihari.pro/mcp" target="_blank" rel="noreferrer">Open endpoint <ArrowUpRight size={15} /></a>
        </div>
      </section>

      <section className="developers-section developers-api-register" id="endpoints">
        <div className="developers-section-heading">
          <p className="mono">03 / API REGISTER</p>
          <h2>Start from the risk feed.<br />Expand only when needed.</h2>
        </div>
        <div className="developers-endpoints">
          {endpoints.map((endpoint) => (
            <article key={endpoint.path}>
              <span className={endpoint.method === "POST" ? "developers-method mono developers-method-post" : "developers-method mono"}>{endpoint.method}</span>
              <code>{endpoint.path}</code>
              <p>{endpoint.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="developers-section developers-examples">
        <div className="developers-section-heading">
          <p className="mono">04 / READY-TO-RUN CALLS</p>
          <h2>Useful from the first request.</h2>
        </div>
        <div className="developers-code-grid">
          <article><strong>Build a risk-aware market view</strong><pre><code>{riskFeedExample}</code></pre></article>
          <article><strong>List current events</strong><pre><code>curl "https://mihari.pro/api/v1/events?symbols=AAPL,NVDA"</code></pre></article>
          <article><strong>Read a Stock Token</strong><pre><code>curl "https://mihari.pro/api/v1/assets/AAPL"</code></pre></article>
          <article><strong>Check quote integrity</strong><pre><code>curl "https://mihari.pro/api/v1/quote-integrity?symbols=AAPL,NVDA"</code></pre></article>
          <article><strong>Discover public market coverage</strong><pre><code>curl "https://mihari.pro/api/v1/dependencies?symbols=AAPL,NVDA"</code></pre></article>
          <article><strong>Read adapter coverage</strong><pre><code>curl "https://mihari.pro/api/v1/coverage"</code></pre></article>
        </div>
      </section>

      <section className="developers-section developers-boundary">
        <div>
          <Braces size={24} />
          <p className="mono">05 / BETA BOUNDARY</p>
          <h2>Open by default.<br />Private by design.</h2>
        </div>
        <div>
          <p>v1 read endpoints are open during public beta and need no API key. They are built for product research, dashboards and early integrations. Responses use cached AI analysis when it exists, otherwise the deterministic policy logic used inside MIHARI. There is no production SLA yet.</p>
          <p>Signed webhooks are for approved backend integrations through a server-only API key. They carry normalized official corporate-action records and a revision fingerprint, never private profile data. Always validate the source and your own protocol assumptions before acting.</p>
          <div className="developers-boundary-links">
            <Link href="/docs#intelligence-api">Read the documentation <ArrowRight size={16} /></Link>
            <a href="https://mihari.pro/api/v1/openapi.json" target="_blank" rel="noreferrer">OpenAPI schema <ArrowUpRight size={16} /></a>
            <a href="https://mihari.pro/api/v1/agent-manifest" target="_blank" rel="noreferrer">Agent manifest <ArrowUpRight size={16} /></a>
          </div>
        </div>
      </section>
    </main>
  );
}
