import Link from "next/link";
import { ArrowRight, Braces, Database, Eye, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "MIHARI Intelligence API",
  description: "Read-only Robinhood Stock Token event intelligence for developers.",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v1",
    detail: "Machine-readable API index with the public beta boundary and every available endpoint.",
  },
  {
    method: "GET",
    path: "/api/v1/catalog",
    detail: "The live active Stock Token catalog with official contract metadata, multiplier state and tradability context.",
  },
  {
    method: "GET",
    path: "/api/v1/risk-feed",
    detail: "The complete integration feed for 1 to 10 selected symbols: official contract and quote context, multiplier state, normalized event details, MIHARI risk level and policy checks.",
  },
  {
    method: "GET",
    path: "/api/v1/quote-integrity",
    detail: "A multiplier-aware consistency check for 1 to 10 symbols. It separates the raw underlying quote from the token-context quote and flags pending multipliers, halted or stale sources.",
  },
  {
    method: "GET",
    path: "/api/v1/dependencies",
    detail: "Publicly discovered markets for up to five symbols across supported venues. It never treats venue coverage as a user's personal position.",
  },
  {
    method: "GET",
    path: "/api/v1/events",
    detail: "Read official Robinhood corporate actions across the active Stock Token catalog, or limit the response with symbols=AAPL,NVDA.",
  },
  {
    method: "GET",
    path: "/api/v1/assets/{symbol}",
    detail: "Read official asset metadata, multiplier context, latest quote fields and matching corporate actions for one Stock Token.",
  },
  {
    method: "GET",
    path: "/api/v1/events/{eventId}/analysis?symbol=AAPL",
    detail: "Read the MIHARI interpretation and bounded policy recommendation for one verified official event.",
  },
  {
    method: "GET",
    path: "/api/v1/coverage",
    detail: "Read the active, beta and planned protocol adapters used by MIHARI, without exposing any personal positions.",
  },
  {
    method: "POST",
    path: "/api/v1/webhooks",
    detail: "Create, test or remove signed corporate-action webhooks. This operator endpoint requires an integration API key and only accepts public HTTPS receivers.",
  },
];

export default function DevelopersPage() {
  return (
    <main className="developers-page paper-noise">
      <SiteHeader />
      <section className="developers-hero">
        <p className="mono">MIHARI INTELLIGENCE API / v1 PUBLIC BETA</p>
        <h1>Official source in.<br />Explainable context out.</h1>
        <p>
          A read-only interface for apps that need verified Robinhood Stock Token corporate-action context,
          without access to MIHARI accounts, wallets or private decision data.
        </p>
        <div className="developers-actions">
          <a className="primary-action primary-action-dark" href="#endpoints">Explore endpoints <ArrowRight size={17} /></a>
          <Link href="/docs#intelligence-api">Read API documentation</Link>
        </div>
      </section>

      <section className="developers-principles" aria-label="API principles">
        <article><Database size={22} /><strong>Official data only</strong><p>Responses are served only when the Robinhood source is live. MIHARI simulated fallback data is never exposed.</p></article>
        <article><Eye size={22} /><strong>Read-only by design</strong><p>The API returns market and event intelligence. It cannot act for an integration, wallet or user.</p></article>
        <article><ShieldCheck size={22} /><strong>No private exposure</strong><p>Profiles, wallet addresses, balances, receipts and account-specific analyses never leave MIHARI.</p></article>
      </section>

      <section className="developers-section" id="endpoints">
        <p className="mono">01 / ENDPOINTS</p>
        <h2>One risk feed. Seven supporting views.</h2>
        <div className="developers-endpoints">
          {endpoints.map((endpoint) => (
            <article key={endpoint.path}>
              <span className="developers-method mono">{endpoint.method}</span>
              <code>{endpoint.path}</code>
              <p>{endpoint.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="developers-section developers-examples">
        <p className="mono">02 / EXAMPLES</p>
        <h2>Start from a live event.</h2>
        <div className="developers-code-grid">
          <article>
            <strong>Build a risk-aware market view</strong>
            <pre><code>curl "https://mihari.pro/api/v1/risk-feed?symbols=AAPL,NVDA"</code></pre>
          </article>
          <article>
            <strong>List current events</strong>
            <pre><code>curl "https://mihari.pro/api/v1/events?symbols=AAPL,NVDA"</code></pre>
          </article>
          <article>
            <strong>Read a Stock Token</strong>
            <pre><code>curl "https://mihari.pro/api/v1/assets/AAPL"</code></pre>
          </article>
          <article>
            <strong>Check multiplier-aware quote integrity</strong>
            <pre><code>curl "https://mihari.pro/api/v1/quote-integrity?symbols=AAPL,NVDA"</code></pre>
          </article>
          <article>
            <strong>Discover public market dependencies</strong>
            <pre><code>curl "https://mihari.pro/api/v1/dependencies?symbols=AAPL,NVDA"</code></pre>
          </article>
          <article>
            <strong>Read coverage before integrating</strong>
            <pre><code>curl "https://mihari.pro/api/v1/coverage"</code></pre>
          </article>
        </div>
      </section>

      <section className="developers-section developers-boundary">
        <div>
          <Braces size={24} />
          <p className="mono">03 / BETA BOUNDARY</p>
          <h2>Open, limited and intentionally conservative.</h2>
        </div>
        <div>
          <p>
            v1 is open during public beta and does not require an API key. It is designed for product research,
            dashboards and early integrations. MIHARI uses cached AI analysis when it exists, otherwise it returns the
            same deterministic policy logic used inside the app. Responses are cached, but there is no production SLA yet.
          </p>
          <p>
            Read endpoints are open during beta. Signed webhooks are available for approved integrations through a server-only API key.
            They carry only normalized official corporate-action records, a revision fingerprint and no private profile data. Every response is advisory only.
            Always validate the source and your own protocol assumptions before acting.
          </p>
        </div>
      </section>
    </main>
  );
}
