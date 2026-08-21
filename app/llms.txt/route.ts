export const runtime = "nodejs";

export async function GET() {
  const body = `# MIHARI\n\n> MIHARI is an AI risk-monitoring platform for Robinhood Stock Tokens on Robinhood Chain.\n\n## Intelligence API\n\n- OpenAPI: https://mihari.pro/api/v1/openapi.json\n- Agent manifest: https://mihari.pro/api/v1/agent-manifest\n- Remote MCP server: https://mihari.pro/mcp\n- Developer documentation: https://mihari.pro/developers\n- Product documentation: https://mihari.pro/docs\n\n## Safe use\n\nMIHARI API and MCP server are read-only and advisory. They return official Robinhood Stock Token source context, MIHARI risk interpretation, multiplier-aware quote integrity and public venue coverage. They do not execute transactions, move funds, pause protocols or expose private wallets, positions or accounts.\n\nFor corporate actions, use event revision and deduplication fields to avoid repeat alerts. Treat public market dependencies as venue coverage, not a user's position.\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
