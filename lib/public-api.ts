import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { evidenceHash, getPublicAnalysis } from "@/lib/intelligence";
import { recordDeveloperApiUsage, resolveDeveloperApiAccess, type DeveloperApiAccess } from "@/lib/developer-access";
import type { CorporateEvent } from "@/lib/product-data";
import type { RobinhoodAsset, RobinhoodPrice } from "@/lib/robinhood";

export const API_VERSION = "2026-08-21";
export const API_CACHE_CONTROL = "public, s-maxage=30, stale-while-revalidate=90";

export const symbolsQuerySchema = z.string().optional().transform((value) =>
  [...new Set((value ?? "").split(",").map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))].slice(0, 25),
);

export const symbolSchema = z.string().trim().min(1).max(24).regex(/^[A-Za-z0-9._-]+$/).transform((value) => value.toUpperCase());
export const eventIdSchema = z.string().trim().min(1).max(180);

export function apiAdminAuthorized(request: Request) {
  const expected = process.env.MIHARI_API_ADMIN_KEY?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  if (!expected || !supplied) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export function publicApiResponse(data: unknown, init?: { status?: number; cacheControl?: string; headers?: Record<string, string> }) {
  return NextResponse.json(
    {
      apiVersion: API_VERSION,
      chain: { name: "Robinhood Chain", id: 4663 },
      data,
      fetchedAt: new Date().toISOString(),
    },
    {
      status: init?.status ?? 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Accept, Content-Type, Authorization, X-MIHARI-API-Key",
        "Cache-Control": init?.cacheControl ?? API_CACHE_CONTROL,
        ...init?.headers,
      },
    },
  );
}

export async function openPublicApiRequest(request: Request, endpoint: string) {
  const access = await resolveDeveloperApiAccess(request);
  if (access.mode === "denied") {
    return {
      access,
      denied: publicApiError(access.message, access.status),
      complete: async (response: NextResponse) => response,
    };
  }

  const headers = access.mode === "key"
    ? {
        "X-MIHARI-Plan": access.plan,
        "X-MIHARI-Usage": String(access.used),
        "X-MIHARI-Usage-Limit": String(access.limit),
      }
    : {};

  // Count an accepted keyed call immediately. Endpoint handlers can still return a source error,
  // but the integration has consumed a request and the dashboard remains an honest usage meter.
  if (access.mode === "key") {
    try {
      await recordDeveloperApiUsage(access, endpoint, request.method, 200);
    } catch {
      // Telemetry must never make the intelligence API unavailable.
    }
  }

  return {
    access,
    denied: null,
    complete: async (response: NextResponse) => {
      Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      return response;
    },
  };
}

export function publicApiError(error: string, status: number) {
  return publicApiResponse({ error }, { status, cacheControl: "no-store" });
}

export function optionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Accept, Content-Type, Authorization, X-MIHARI-API-Key",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function decimal(value: string | undefined) {
  if (!value || !Number.isFinite(Number(value))) return null;
  return Number(value);
}

function multiplierAdjustedQuote(price: RobinhoodPrice | undefined, asset: RobinhoodAsset) {
  const multiplier = decimal(asset.currentMultiplier);
  const bid = decimal(price?.bid);
  const ask = decimal(price?.ask);
  if (multiplier === null || bid === null || ask === null) return null;

  return {
    methodology: "raw_underlying_quote × current_multiplier",
    bid: String(bid * multiplier),
    ask: String(ask * multiplier),
    midpoint: String(((bid + ask) / 2) * multiplier),
    currency: price?.currency ?? "USD",
  };
}

function eventDetails(event: CorporateEvent) {
  const payload = event.sourcePayload?.corporateAction;
  if (!payload || typeof payload !== "object") return null;

  const source = payload as Record<string, unknown>;
  const details = source.details;
  if (!details || typeof details !== "object") return null;
  const [variant, values] = Object.entries(details as Record<string, unknown>)[0] ?? [];
  if (!variant || !values || typeof values !== "object") return null;

  return {
    variant,
    values: Object.fromEntries(
      Object.entries(values as Record<string, unknown>)
        .filter(([, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean"),
    ),
  };
}

export function eventAttention(event: CorporateEvent) {
  if (event.sourceStatus === "IN_PROGRESS" || event.severity === "critical") return "urgent" as const;
  if (event.severity === "watch") return "review" as const;
  return "monitor" as const;
}

export function publicAsset(asset: RobinhoodAsset, price?: RobinhoodPrice) {
  return {
    symbol: asset.tokenSymbol,
    name: asset.tokenName,
    status: asset.status.replace("ASSET_STATUS_", ""),
    deployments: asset.deployments.map((deployment) => ({
      chainId: deployment.chainId,
      contractAddress: deployment.contractAddress,
      networkName: deployment.networkName ?? null,
    })),
    identification: {
      assetId: asset.id,
      isin: asset.isin ?? null,
      logoUrl: asset.logoUrl ?? null,
      tokenDecimals: asset.tokenDecimals ?? null,
    },
    multiplier: {
      current: asset.currentMultiplier,
      pending: asset.pendingMultiplier || null,
      effectiveAt: asset.pendingMultiplierEffectiveTime ?? null,
      state: asset.pendingMultiplier ? "pending" : "stable",
    },
    price: price
      ? {
          methodology: "raw_underlying_equity_quote",
          bid: price.bid,
          ask: price.ask,
          currency: price.currency,
          generatedAt: price.generatedAt,
          isTradingHalt: price.isTradingHalt,
          dailyTradingVolume: price.dailyTradingVolume ?? null,
          dailyHigh: price.dailyHigh ?? null,
          dailyLow: price.dailyLow ?? null,
        }
      : null,
    multiplierAdjustedQuote: multiplierAdjustedQuote(price, asset),
    tradingCapabilities: asset.tradingCapabilities ?? null,
  };
}

export function publicEvent(event: CorporateEvent) {
  const fingerprint = event.sourcePayload ? `sha256:${evidenceHash(event.sourcePayload)}` : null;
  return {
    id: event.id,
    symbol: event.asset,
    assetName: event.name,
    type: event.type,
    status: event.sourceStatus,
    processDate: event.time === "PENDING" ? null : event.time,
    severity: event.severity,
    attention: eventAttention(event),
    source: "robinhood",
    summary: event.summary,
    details: eventDetails(event),
    revision: {
      revisionId: fingerprint,
      deduplicationKey: fingerprint ? `${event.id}:${fingerprint}` : event.id,
      sourceFingerprint: fingerprint,
      sourceStatus: event.sourceStatus,
      dataVersion: API_VERSION,
    },
  };
}

export async function publicEventAnalysis(event: CorporateEvent) {
  const analysis = await getPublicAnalysis(event);
  return {
    event: publicEvent(event),
    analysis: {
      mode: analysis.mode,
      cached: analysis.cached,
      confidence: analysis.confidence,
      risk: analysis.risk,
      summary: analysis.summary,
      impactAssessment: analysis.impactAssessment,
      affectedSystems: analysis.affectedSystems,
      recommendedAction: analysis.recommendedAction,
      evidence: analysis.evidence,
    },
    policyRecommendation: analysis.policyRecommendation,
    boundary: {
      execution: "advisory_only",
      description: "MIHARI does not move funds, submit transactions or act on behalf of an integration.",
    },
  };
}

export async function publicAssetRiskSignal(
  asset: RobinhoodAsset,
  price: RobinhoodPrice | undefined,
  event: CorporateEvent | undefined,
) {
  const assetContext = publicAsset(asset, price);
  if (!event) {
    return {
      asset: assetContext,
      event: null,
      risk: {
        attention: "clear" as const,
        level: "low" as const,
        summary: "No current official corporate-action record matched this Stock Token in the live Robinhood response.",
        affectedSystems: [] as string[],
        policyRecommendation: null,
      },
    };
  }

  const analysis = await getPublicAnalysis(event);
  return {
    asset: assetContext,
    event: publicEvent(event),
    risk: {
      attention: eventAttention(event),
      level: analysis.risk,
      analysisMode: analysis.mode,
      cached: analysis.cached,
      confidence: analysis.confidence,
      summary: analysis.summary,
      impactAssessment: analysis.impactAssessment,
      affectedSystems: analysis.affectedSystems,
      recommendedAction: analysis.recommendedAction,
      policyRecommendation: analysis.policyRecommendation,
    },
  };
}
