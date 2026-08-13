import { z } from "zod";

export const analysisSchema = z.object({
  summary: z.string().min(10).max(240),
  impactAssessment: z.string().min(10).max(320),
  affectedSystems: z
    .array(z.enum(["quotes", "nav", "vaults", "lending", "agents"]))
    .min(1)
    .max(5),
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
});

export type AnalysisOutput = z.infer<typeof analysisSchema>;

export type AnalysisResponse = AnalysisOutput & {
  mode: "ai" | "deterministic";
  cached: boolean;
  model?: string;
  warning?: string;
};
