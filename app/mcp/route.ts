import { z } from "zod";
import { scanProtocolMarkets } from "@/lib/protocol-markets";
import { getAssetCatalog, getMarketSnapshot } from "@/lib/robinhood";
import { publicAsset, publicAssetRiskSignal, publicEvent } from "@/lib/public-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const symbolsSchema = z.object({
  symbols: z.array(z.string().trim().min(1).max(24)).min(1).max(10)
    .transform((symbols) => [...new Set(symbols.map((symbol) => symbol.toUpperCase()))]),
});
const dependencySymbolsSchema = z.object({
  symbols: z.array(z.string().trim().min(1).max(24)).min(1).max(5)
    .transform((symbols) => [...new Set(symbols.map((symbol) => symbol.toUpperCase()))]),
});
const assetSchema = z.object({ symbol: z.string().trim().min(1).max(24).transform((symbol) => symbol.toUpperCase()) });

function jsonRpc(id: JsonRpcRequest["id"], result?: unknown, error?: { code: number; message: string }) {
  return Response.json({ jsonrpc: "2.0", id: id ?? null, ...(error ? { error } : { result }) }, {
    headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });
}

function errorContent(message: string) {
  return { content: [{ type: "text", text: message }], isError: true };
}

function toolResult(data: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

const tools = [
  {
    name: "mihari_get_risk_feed",
    description: "Get official Robinhood Stock Token corporate-action risk context for one to ten symbols. Returns normalized event details, multiplier context, policy recommendation and advisory impact assessment.",
    inputSchema: { type: "object", properties: { symbols: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 10 } }, required: ["symbols"] },
  },
  {
    name: "mihari_get_quote_integrity",
    description: "Check whether raw underlying-equity quotes and official token multiplier state require review. Returns raw quotes, multiplier-adjusted informational context and pending, halted or stale flags.",
    inputSchema: { type: "object", properties: { symbols: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 10 } }, required: ["symbols"] },
  },
  {
    name: "mihari_get_public_dependencies",
    description: "Find publicly discovered supported markets for one to five Robinhood Stock Tokens across MIHARI-covered venues. Never interpret this as a user's personal position.",
    inputSchema: { type: "object", properties: { symbols: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 } }, required: ["symbols"] },
  },
  {
    name: "mihari_get_stock_token",
    description: "Get official contract deployment, multiplier and current quote context for one Robinhood Stock Token.",
    inputSchema: { type: "object", properties: { symbol: { type: "string", example: "AAPL" } }, required: ["symbol"] },
  },
] as const;

function parseSymbols(params: Record<string, unknown> | undefined, dependency = false) {
  const schema = dependency ? dependencySymbolsSchema : symbolsSchema;
  const parsed = schema.safeParse(params);
  return parsed.success ? parsed.data.symbols : null;
}

async function callTool(name: string, args: Record<string, unknown> | undefined) {
  if (name === "mihari_get_stock_token") {
    const parsed = assetSchema.safeParse(args);
    if (!parsed.success) return errorContent("Provide a valid Stock Token symbol, for example { symbol: 'AAPL' }.");
    const snapshot = await getMarketSnapshot([parsed.data.symbol]);
    if (snapshot.mode !== "live") return errorContent("Official Robinhood source is temporarily unavailable. Try again later.");
    const asset = snapshot.assets[0];
    if (!asset) return errorContent(`No active Robinhood Stock Token was found for ${parsed.data.symbol}.`);
    const price = snapshot.prices.find((candidate) => candidate.tokenSymbol.toUpperCase() === parsed.data.symbol);
    const events = snapshot.events.filter((event) => event.source === "robinhood").map(publicEvent);
    return toolResult({ source: "Robinhood Stock Token APIs", asset: publicAsset(asset, price), events });
  }

  const dependency = name === "mihari_get_public_dependencies";
  const symbols = parseSymbols(args, dependency);
  if (!symbols) return errorContent(dependency ? "Provide one to five symbols." : "Provide one to ten symbols.");
  const snapshot = await getMarketSnapshot(symbols);
  if (snapshot.mode !== "live") return errorContent("Official Robinhood source is temporarily unavailable. Try again later.");

  if (name === "mihari_get_risk_feed") {
    const prices = new Map(snapshot.prices.map((price) => [price.tokenSymbol.toUpperCase(), price]));
    const events = new Map(snapshot.events.filter((event) => event.source === "robinhood").map((event) => [event.asset.toUpperCase(), event]));
    const signals = await Promise.all(snapshot.assets.map((asset) => publicAssetRiskSignal(asset, prices.get(asset.tokenSymbol.toUpperCase()), events.get(asset.tokenSymbol.toUpperCase()))));
    return toolResult({ scope: "selected_symbols", source: "Robinhood Stock Token APIs", signals, advisoryOnly: true });
  }

  if (name === "mihari_get_quote_integrity") {
    const prices = new Map(snapshot.prices.map((price) => [price.tokenSymbol.toUpperCase(), price]));
    const checks = snapshot.assets.map((asset) => {
      const price = prices.get(asset.tokenSymbol.toUpperCase());
      const age = price?.generatedAt ? Math.max(0, Math.round((Date.now() - Date.parse(price.generatedAt)) / 1000)) : null;
      const flags = [
        ...(asset.pendingMultiplier ? ["pending_multiplier"] : []),
        ...(price?.isTradingHalt ? ["trading_halt"] : []),
        ...(age !== null && age > 90 ? ["quote_stale"] : []),
        ...(!price ? ["incomplete_source"] : []),
      ];
      return { symbol: asset.tokenSymbol, status: flags.length ? "review" : "clear", flags, quoteAgeSeconds: age, asset: publicAsset(asset, price) };
    });
    return toolResult({ methodology: "Raw Robinhood REST quote × official current multiplier for informational token context.", checks, advisoryOnly: true });
  }

  if (name === "mihari_get_public_dependencies") {
    const scan = await scanProtocolMarkets(snapshot.assets, symbols);
    return toolResult({ scope: "public_market_dependencies", symbols, scan, boundary: "Venue coverage is not a personal position." });
  }
  return errorContent(`Unknown MIHARI tool: ${name}`);
}

function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).protocol === "https:";
  } catch {
    return false;
  }
}

export async function OPTIONS(request: Request) {
  if (!allowedOrigin(request)) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version", "Access-Control-Max-Age": "86400" } });
}

export async function POST(request: Request) {
  if (!allowedOrigin(request)) return jsonRpc(null, undefined, { code: -32000, message: "Origin not allowed" });
  const body = await request.json().catch(() => null) as JsonRpcRequest | null;
  if (!body || body.jsonrpc !== "2.0" || !body.method) return jsonRpc(null, undefined, { code: -32600, message: "Invalid JSON-RPC request" });

  if (body.method === "notifications/initialized") return new Response(null, { status: 202, headers: { "Access-Control-Allow-Origin": "*" } });
  if (body.method === "initialize") {
    return jsonRpc(body.id, {
      protocolVersion: "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "mihari-intelligence", version: "1.0.0" },
      instructions: "Use MIHARI only for read-only Stock Token research and risk context. Outputs are advisory and never execute an action.",
    });
  }
  if (body.method === "tools/list") return jsonRpc(body.id, { tools });
  if (body.method === "tools/call") {
    const name = typeof body.params?.name === "string" ? body.params.name : "";
    const args = body.params?.arguments && typeof body.params.arguments === "object" ? body.params.arguments as Record<string, unknown> : undefined;
    try {
      return jsonRpc(body.id, await callTool(name, args));
    } catch (error) {
      return jsonRpc(body.id, errorContent(error instanceof Error ? error.message : "MIHARI tool failed"));
    }
  }
  return jsonRpc(body.id, undefined, { code: -32601, message: "Method not found" });
}
