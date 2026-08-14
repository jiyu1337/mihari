import { createHash } from "node:crypto";
import { openai } from "@ai-sdk/openai";
import { and, count, eq, gte } from "drizzle-orm";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase, getDatabaseUrl } from "@/db/client";
import { analyses, corporateActions } from "@/db/schema";
import { getAuthenticatedAccount } from "@/lib/account";
import { analysisSchema, type AnalysisResponse } from "@/lib/analysis";
import { getAccountEntitlements } from "@/lib/entitlements";
import type { CorporateEvent } from "@/lib/product-data";
import { getMarketSnapshot } from "@/lib/robinhood";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.MIHARI_AI_MODEL ?? "gpt-5-mini";
const PROMPT_VERSION = "corporate-action-risk-v1";
const DAILY_AI_LIMIT = 25;

const requestSchema = z.object({
  eventId: z.string().min(1).max(160),
  symbol: z.string().trim().min(1).max(24).transform((value) => value.toUpperCase()),
});

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, stableValue(nestedValue)]),
    );
  }
  return value;
}

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function severityForDatabase(severity: CorporateEvent["severity"]): "low" | "medium" | "high" | "critical" {
  if (severity === "critical") return "critical";
  if (severity === "watch") return "high";
  return "low";
}

function deterministicFallback(event: CorporateEvent, warning?: string): AnalysisResponse {
  const normalized = event.type.toLowerCase();
  const isMultiplier = normalized.includes("multiplier") || normalized.includes("split");
  const isDividend = normalized.includes("dividend");

  return {
    summary: event.summary,
    impactAssessment: event.impact,
    affectedSystems: isMultiplier
      ? ["quotes", "nav", "vaults", "lending"]
      : isDividend
        ? ["nav", "vaults"]
        : ["agents"],
    risk: isMultiplier ? "high" : "medium",
    recommendedAction: event.action,
    policyAction: isMultiplier ? "pause_quotes" : "warn",
    confidence: 82,
    evidence: ["Official Robinhood corporate-action record", "MIHARI deterministic policy rules"],
    mode: "deterministic",
    cached: false,
    ...(warning ? { warning } : {}),
  };
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function findOfficialEvent(eventId: string, symbol: string) {
  const snapshot = await getMarketSnapshot([symbol]);
  if (snapshot.mode !== "live") return null;
  const event = snapshot.events.find(
    (candidate) => candidate.id === eventId && candidate.asset.toUpperCase() === symbol,
  );
  if (!event || event.source !== "robinhood" || !event.sourcePayload) return null;

  return {
    event,
    evidencePayload: event.sourcePayload,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid corporate action", details: parsed.error.flatten() }, 400);
  }

  const official = await findOfficialEvent(parsed.data.eventId, parsed.data.symbol);
  if (!official) {
    return json({ error: "The event could not be verified against the official Robinhood source" }, 404);
  }

  const { event, evidencePayload } = official;
  const sourceHash = hash(event.sourcePayload);
  const inputHash = hash({ promptVersion: PROMPT_VERSION, sourceHash });

  if (!process.env.OPENAI_API_KEY) {
    return json(deterministicFallback(event, "AI is not configured"));
  }

  if (!getDatabaseUrl()) {
    return json(deterministicFallback(event, "AI paused because persistence is unavailable"));
  }

  try {
    const db = getDatabase();
    const [cached] = await db
      .select({ output: analyses.output, model: analyses.model })
      .from(analyses)
      .where(and(eq(analyses.inputHash, inputHash), eq(analyses.promptVersion, PROMPT_VERSION)))
      .limit(1);

    if (cached) {
      const output = analysisSchema.parse(cached.output);
      return json({ ...output, mode: "ai", cached: true, model: cached.model } satisfies AnalysisResponse);
    }

    const account = await getAuthenticatedAccount();
    if (!account) {
      return json(deterministicFallback(event, "Sign in to request a new AI analysis"));
    }

    const entitlements = await getAccountEntitlements(account.id);

    const rollingWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1_000);
    const [globalUsage, accountUsage] = await Promise.all([
      db
        .select({ total: count() })
        .from(analyses)
        .where(gte(analyses.createdAt, rollingWindowStart)),
      db
        .select({ total: count() })
        .from(analyses)
        .where(and(
          eq(analyses.accountId, account.id),
          gte(analyses.createdAt, rollingWindowStart),
        )),
    ]);

    if (Number(globalUsage[0]?.total ?? 0) >= DAILY_AI_LIMIT) {
      return json(deterministicFallback(event, "Daily AI safety limit reached; rule-based analysis shown"));
    }
    if (Number(accountUsage[0]?.total ?? 0) >= entitlements.limits.aiAnalysesPerDay) {
      return json(deterministicFallback(
        event,
        `${entitlements.tier === "holder" ? "Holder" : "Observer"} AI limit reached. Rule-based analysis shown`,
      ));
    }

    const [storedEvent] = await db
      .insert(corporateActions)
      .values({
        sourceId: event.id,
        symbol: event.asset,
        type: event.type,
        severity: severityForDatabase(event.severity),
        effectiveAt: event.time === "PENDING" ? null : new Date(event.time),
        sourcePayload: evidencePayload,
        sourceHash,
      })
      .onConflictDoUpdate({
        target: corporateActions.sourceHash,
        set: { sourcePayload: evidencePayload, updatedAt: new Date() },
      })
      .returning({ id: corporateActions.id });

    if (!storedEvent) throw new Error("Corporate action persistence failed");

    const { output } = await generateText({
      model: openai(MODEL),
      output: Output.object({ schema: analysisSchema }),
      maxOutputTokens: 700,
      abortSignal: AbortSignal.timeout(20_000),
      providerOptions: {
        openai: {
          store: false,
          reasoningEffort: "low",
          textVerbosity: "low",
        },
      },
      system: [
        "You are MIHARI, a conservative risk analyst for tokenized stocks on Robinhood Chain.",
        "Use only the supplied official Robinhood payload. Never invent dates, rates, positions, protocols, or evidence.",
        "Explain how a corporate action may affect quotes, NAV, vault accounting, lending collateral, and agents.",
        "A recommendation is advisory and cannot authorize or execute a transaction.",
        "Choose manual_review when evidence conflicts or is incomplete.",
        "Keep every field concise and suitable for a professional incident console.",
      ].join(" "),
      prompt: JSON.stringify({
        symbol: event.asset,
        eventType: event.type,
        sourceStatus: event.sourceStatus,
        evidence: evidencePayload,
      }),
    });

    await db
      .insert(analyses)
      .values({
        accountId: account.id,
        corporateActionId: storedEvent.id,
        model: MODEL,
        promptVersion: PROMPT_VERSION,
        output,
        confidence: output.confidence,
        inputHash,
      })
      .onConflictDoNothing({ target: analyses.inputHash });

    return json({ ...output, mode: "ai", cached: false, model: MODEL } satisfies AnalysisResponse);
  } catch (error) {
    console.error("[MIHARI] AI analysis unavailable", error instanceof Error ? error.name : "UnknownError");
    return json(deterministicFallback(event, "AI analysis unavailable; rule-based analysis shown"));
  }
}
