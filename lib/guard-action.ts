import { createHash } from "node:crypto";
import { z } from "zod";
import type { PolicyRecommendation, PolicySystem } from "@/lib/analysis";
import { buildDeterministicPolicy } from "@/lib/policy-recommendation";
import type { MappedPosition } from "@/lib/map-data";
import type { CorporateEvent } from "@/lib/product-data";

export const guardActionPreviewSchema = z.object({
  version: z.literal(1),
  title: z.string().min(8).max(120),
  intent: z.enum([
    "monitor",
    "review",
    "restrict_new_exposure",
    "pause_sensitive_flows",
    "prepare_accounting_update",
  ]),
  priority: z.enum(["routine", "review", "urgent"]),
  scope: z.array(z.enum(["quotes", "nav", "vaults", "lending", "agents"])).min(1).max(5),
  rationale: z.string().min(10).max(320),
  checks: z.array(z.string().min(3).max(180)).min(2).max(5),
  applyWhen: z.array(z.string().min(3).max(180)).min(1).max(3),
  releaseWhen: z.array(z.string().min(3).max(180)).min(1).max(3),
  actionSteps: z.array(z.string().min(3).max(180)).min(2).max(5),
  safetyBoundaries: z.array(z.string().min(3).max(180)).min(3).max(6),
  target: z.literal("MIHARI POLICY REGISTRY"),
  chainId: z.literal(4663),
  execution: z.literal("preview_only"),
  evidence: z.object({
    type: z.literal("verified_direct_holding"),
    wallet: z.string().min(42).max(42),
    symbol: z.string().min(1).max(24),
    contractAddress: z.string().min(42).max(42),
    balance: z.string().min(1).max(96),
    capturedAt: z.string().datetime(),
  }),
});

export type GuardActionPreview = z.infer<typeof guardActionPreviewSchema>;

export type GuardActionRecord = {
  id: string;
  sourceEventId: string;
  sourceHash: string;
  symbol: string;
  intent: GuardActionPreview["intent"];
  preview: GuardActionPreview;
  status: "draft" | "approved" | "dismissed";
  approvalNote: string | null;
  decisionHash: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

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

export function guardHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function systemsForEvent(event: CorporateEvent): PolicySystem[] {
  const type = event.type.toLowerCase();
  if (type.includes("multiplier") || type.includes("split")) {
    return ["quotes", "nav", "vaults", "lending"];
  }
  if (type.includes("dividend")) return ["nav", "vaults", "lending"];
  return ["quotes", "nav", "agents"];
}

function riskForEvent(event: CorporateEvent): "low" | "medium" | "high" | "critical" {
  const type = event.type.toLowerCase();
  if (event.severity === "critical") return "critical";
  if (type.includes("multiplier") || type.includes("split")) return "high";
  if (type.includes("dividend")) return "medium";
  return "low";
}

function actionSteps(policy: PolicyRecommendation) {
  switch (policy.intent) {
    case "pause_sensitive_flows":
      return [
        "Keep withdrawals and manual exits available",
        "Prepare a temporary pause for new deposits, loans or quotes that depend on stale data",
        "Resume normal activity only after every release condition is verified",
      ];
    case "restrict_new_exposure":
      return [
        "Flag the asset for operator review",
        "Prepare a temporary restriction on new exposure",
        "Keep existing positions visible while reconciliation is completed",
      ];
    case "prepare_accounting_update":
      return [
        "Prepare the dividend accounting adjustment",
        "Review NAV, receivable and collateral treatment",
        "Close the action after the distribution is reflected in dependent systems",
      ];
    default:
      return [
        "Keep the event under active review",
        "Notify the responsible operator if a required check fails",
      ];
  }
}

export function buildGuardActionPreview(event: CorporateEvent, position: MappedPosition): GuardActionPreview {
  const scope = systemsForEvent(event);
  const policy = buildDeterministicPolicy(event, { affectedSystems: scope, risk: riskForEvent(event) });

  return guardActionPreviewSchema.parse({
    version: 1,
    title: policy.title,
    intent: policy.intent,
    priority: policy.priority,
    scope: policy.scope,
    rationale: policy.rationale,
    checks: policy.checks,
    applyWhen: policy.applyWhen,
    releaseWhen: policy.releaseWhen,
    actionSteps: actionSteps(policy),
    safetyBoundaries: [
      "No token approval is requested",
      "No funds or positions can be moved",
      "No protocol transaction is submitted in this beta",
      "Approval creates a private MIHARI decision receipt only",
    ],
    target: "MIHARI POLICY REGISTRY",
    chainId: 4663,
    execution: "preview_only",
    evidence: {
      type: "verified_direct_holding",
      wallet: position.wallet,
      symbol: position.symbol,
      contractAddress: position.contractAddress,
      balance: position.balance,
      capturedAt: new Date().toISOString(),
    },
  });
}

export function serializeGuardAction(record: {
  id: string;
  sourceEventId: string;
  sourceHash: string;
  symbol: string;
  intent: string;
  preview: Record<string, unknown>;
  status: "draft" | "approved" | "dismissed";
  approvalNote: string | null;
  decisionHash: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): GuardActionRecord {
  const preview = guardActionPreviewSchema.parse(record.preview);
  return {
    ...record,
    intent: preview.intent,
    preview,
    approvedAt: record.approvedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
