import { optionsResponse, publicApiResponse } from "@/lib/public-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  return publicApiResponse({
    name: "MIHARI Intelligence API",
    status: "public_beta",
    description: "Read-only Robinhood Stock Token risk context for dashboards, research tools and protocol integrations.",
    documentation: "https://mihari.pro/developers",
    agentIntegration: {
      openapi: "https://mihari.pro/api/v1/openapi.json",
      manifest: "https://mihari.pro/api/v1/agent-manifest",
      llms: "https://mihari.pro/llms.txt",
      mcp: "https://mihari.pro/mcp",
    },
    endpoints: [
      { method: "GET", path: "/api/v1/catalog", description: "Active Robinhood Stock Token catalog and contract metadata." },
      { method: "GET", path: "/api/v1/events", description: "Official corporate-action records." },
      { method: "GET", path: "/api/v1/assets/{symbol}", description: "One Stock Token with quote and multiplier context." },
      { method: "GET", path: "/api/v1/risk-feed", description: "Integration-ready event intelligence and policy context." },
      { method: "GET", path: "/api/v1/quote-integrity", description: "Multiplier-aware quote consistency checks and stale-source flags." },
      { method: "GET", path: "/api/v1/dependencies", description: "Public market dependencies across supported venues for selected Stock Tokens." },
      { method: "GET", path: "/api/v1/coverage", description: "MIHARI protocol coverage registry and source status." },
      { method: "GET", path: "/api/v1/events/{eventId}/analysis?symbol=AAPL", description: "MIHARI interpretation for one verified official event." },
      { method: "GET, POST, PATCH, DELETE", path: "/api/v1/webhooks", description: "Signed corporate-action webhook management for approved integrations." },
    ],
    betaBoundary: {
      authentication: "not_required_for_read_endpoints; integration_key_required_for_webhook_management",
      data: "official_robinhood_live_source_only",
      execution: "advisory_only",
      privateData: "never_exposed",
      reliability: "no_sla_during_public_beta",
    },
  }, { cacheControl: "public, s-maxage=300, stale-while-revalidate=600" });
}
