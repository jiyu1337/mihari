import { z } from "zod";

export const policySystemSchema = z.enum(["quotes", "nav", "vaults", "lending", "agents"]);

export const policyRecommendationSchema = z.object({
  title: z.string().min(8).max(120),
  intent: z.enum([
    "monitor",
    "review",
    "restrict_new_exposure",
    "pause_sensitive_flows",
    "prepare_accounting_update",
  ]),
  priority: z.enum(["routine", "review", "urgent"]),
  rationale: z.string().min(10).max(280),
  scope: z.array(policySystemSchema).min(1).max(5),
  checks: z.array(z.string().min(3).max(160)).min(2).max(5),
  applyWhen: z.array(z.string().min(3).max(160)).min(1).max(3),
  releaseWhen: z.array(z.string().min(3).max(160)).min(1).max(3),
  operatorDecision: z.enum(["no_action", "review_required", "approval_required"]),
  execution: z.literal("advisory_only"),
});

export const analysisSchema = z.object({
  summary: z.string().min(10).max(240),
  impactAssessment: z.string().min(10).max(320),
  affectedSystems: z.array(policySystemSchema).min(1).max(5),
  risk: z.enum(["low", "medium", "high", "critical"]),
  recommendedAction: z.string().min(10).max(320),
  policyAction: z.enum([
    "observe",
    "warn",
    "pause_quotes",
    "pause_lending",
    "rebalance_nav",
    "manual_review",
  ]),
  confidence: z.number().int().min(0).max(100),
  evidence: z.array(z.string().min(3).max(180)).min(1).max(5),
  policyRecommendation: policyRecommendationSchema,
});

export type AnalysisOutput = z.infer<typeof analysisSchema>;
export type PolicyRecommendation = z.infer<typeof policyRecommendationSchema>;

export type AnalysisResponse = AnalysisOutput & {
  mode: "ai" | "deterministic";
  cached: boolean;
  model?: string;
  warning?: string;
};
