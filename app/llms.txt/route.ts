export const runtime = "nodejs";

export async function GET() {
  const body = `# MIHARI\n\n> MIHARI is an AI risk-monitoring platform for Robinhood Stock Tokens on Robinhood Chain.\n\n## Intelligence API\n\n- OpenAPI: https://mihari.pro/api/v1/openapi.json\n- Agent manifest: https://mihari.pro/api/v1/agent-manifest\n- Developer documentation: https://mihari.pro/developers\n- Product documentation: https://mihari.pro/docs\n\n## Safe use\n\nMIHARI API is read-only and advisory. It returns official Robinhood Stock Token source context, MIHARI risk interpretation, multiplier-aware quote integrity and public venue coverage. It does not execute transactions, move funds, pause protocols or expose private wallets, positions or accounts.\n\nFor corporate actions, use event revision and deduplication fields to avoid repeat alerts. Treat public market dependencies as venue coverage, not a user's position.\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
