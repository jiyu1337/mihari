import { NextResponse } from "next/server";

export const runtime = "nodejs";

const querySymbols = {
  name: "symbols",
  in: "query",
  required: true,
  description: "Comma-separated Stock Token symbols, for example AAPL,NVDA.",
  schema: { type: "string", example: "AAPL,NVDA" },
};

export async function GET() {
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "MIHARI Intelligence API",
      version: "2026-08-21",
      description: "Read-only, official Robinhood Stock Token event intelligence. Every response is advisory only. Never use it to move funds or make an irreversible decision without your own controls.",
    },
    servers: [{ url: "https://mihari.pro", description: "Production" }],
    paths: {
      "/api/v1/catalog": { get: { operationId: "getStockTokenCatalog", summary: "Get active Robinhood Stock Tokens with official contract and multiplier metadata.", responses: { "200": { description: "Catalog response" } } } },
      "/api/v1/risk-feed": { get: { operationId: "getRiskFeed", summary: "Get normalized corporate-action risk context and policy recommendation for selected symbols.", parameters: [querySymbols], responses: { "200": { description: "Risk feed response" } } } },
      "/api/v1/quote-integrity": { get: { operationId: "getQuoteIntegrity", summary: "Check raw source quote, multiplier-adjusted token context and stale or pending flags.", parameters: [querySymbols], responses: { "200": { description: "Quote integrity response" } } } },
      "/api/v1/dependencies": { get: { operationId: "getPublicMarketDependencies", summary: "Get public venue and market context for selected Stock Tokens. This is not personal position data.", parameters: [querySymbols], responses: { "200": { description: "Dependency response" } } } },
      "/api/v1/events": { get: { operationId: "getCorporateActions", summary: "Get official corporate-action records and revision fingerprints.", parameters: [{ ...querySymbols, required: false }], responses: { "200": { description: "Events response" } } } },
      "/api/v1/assets/{symbol}": { get: { operationId: "getStockToken", summary: "Get one official Stock Token, quote and matching events.", parameters: [{ name: "symbol", in: "path", required: true, schema: { type: "string", example: "AAPL" } }], responses: { "200": { description: "Asset response" } } } },
      "/api/v1/coverage": { get: { operationId: "getProtocolCoverage", summary: "Get MIHARI protocol coverage without private positions.", responses: { "200": { description: "Coverage response" } } } },
    },
    "x-mihari-agent-rules": [
      "Treat quote integrity flags as review signals, not trading instructions.",
      "A public market dependency is not evidence that a user has a personal position.",
      "Do not claim MIHARI can move funds, execute transactions or pause a protocol.",
      "Use event.revision.deduplicationKey before repeating notifications for an unchanged event.",
    ],
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
