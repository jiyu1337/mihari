import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDatabase, getDatabaseUrl } from "@/db/client";
import { analyses } from "@/db/schema";
import { analysisSchema, type AnalysisResponse } from "@/lib/analysis";
import { buildDeterministicPolicy } from "@/lib/policy-recommendation";
import type { CorporateEvent } from "@/lib/product-data";

export const ANALYSIS_PROMPT_VERSION = "corporate-action-policy-v2";

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

export function evidenceHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

export function deterministicAnalysis(event: CorporateEvent, warning?: string): AnalysisResponse {
  const normalized = event.type.toLowerCase();
  const isMultiplier = normalized.includes("multiplier") || normalized.includes("split");
  const isDividend = normalized.includes("dividend");

  const affectedSystems: AnalysisResponse["affectedSystems"] = isMultiplier
    ? ["quotes", "nav", "vaults", "lending"]
    : isDividend
      ? ["nav", "vaults"]
      : ["agents"];
  const risk: AnalysisResponse["risk"] = isMultiplier ? "high" : "medium";

  return {
    summary: event.summary,
    impactAssessment: event.impact,
    affectedSystems,
    risk,
    recommendedAction: event.action,
    policyAction: isMultiplier ? "pause_quotes" : "warn",
    confidence: 82,
    evidence: ["Official Robinhood corporate-action record", "MIHARI deterministic policy rules"],
    policyRecommendation: buildDeterministicPolicy(event, { affectedSystems, risk }),
    mode: "deterministic",
    cached: false,
    ...(warning ? { warning } : {}),
  };
}

export async function getCachedVerifiedAnalysis(event: CorporateEvent): Promise<AnalysisResponse | null> {
  if (!event.sourcePayload || !getDatabaseUrl()) return null;

  const sourceHash = evidenceHash(event.sourcePayload);
  const inputHash = evidenceHash({ promptVersion: ANALYSIS_PROMPT_VERSION, sourceHash });

  try {
    const db = getDatabase();
    const [cached] = await db
      .select({ output: analyses.output, model: analyses.model })
      .from(analyses)
      .where(and(eq(analyses.inputHash, inputHash), eq(analyses.promptVersion, ANALYSIS_PROMPT_VERSION)))
      .limit(1);

    if (!cached) return null;
    const output = analysisSchema.parse(cached.output);
    return { ...output, mode: "ai", cached: true, model: cached.model };
  } catch {
    return null;
  }
}

export async function getPublicAnalysis(event: CorporateEvent) {
  return (await getCachedVerifiedAnalysis(event)) ?? deterministicAnalysis(event);
}
