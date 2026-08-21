import { publicApiResponse } from "@/lib/public-api";

export const runtime = "nodejs";

export async function GET() {
  return publicApiResponse({
    name: "MIHARI Stock Token Risk Agent Tools",
    version: "2026-08-21",
    openapi: "https://mihari.pro/api/v1/openapi.json",
    mcp: "https://mihari.pro/mcp",
    documentation: "https://mihari.pro/developers",
    intendedFor: ["MCP clients", "AI agents", "research copilots", "risk dashboards", "protocol monitoring tools"],
    tools: [
      { name: "getRiskFeed", endpoint: "/api/v1/risk-feed?symbols={symbols}", useWhen: "A user asks about current corporate-action risk for up to 10 Stock Tokens." },
      { name: "getQuoteIntegrity", endpoint: "/api/v1/quote-integrity?symbols={symbols}", useWhen: "A user needs to understand whether a raw price and multiplier state need review." },
      { name: "getPublicMarketDependencies", endpoint: "/api/v1/dependencies?symbols={symbols}", useWhen: "A user asks where selected tokens have public supported market coverage." },
      { name: "getCorporateActions", endpoint: "/api/v1/events?symbols={symbols}", useWhen: "A user needs official event records and revisions." },
    ],
    instructions: [
      "Use official source data first and MIHARI interpretation second.",
      "Explain whether a result is a wallet holding, a watchlist research signal or public market coverage. Never conflate them.",
      "State clearly that outputs are advisory and do not execute actions, move funds or prove a loss will occur.",
      "When an event revision is unchanged, avoid repeating the same alert.",
    ],
    privacy: "No profile, wallet address, balance, personal DeFi position, Guard receipt or account-specific analysis is exposed.",
  }, { cacheControl: "public, s-maxage=3600, stale-while-revalidate=86400" });
}
