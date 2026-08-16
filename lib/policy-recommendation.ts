import type { AnalysisOutput, PolicyRecommendation } from "@/lib/analysis";
import type { CorporateEvent } from "@/lib/product-data";

type PolicyContext = Pick<AnalysisOutput, "affectedSystems" | "risk">;

function normalizedType(event: CorporateEvent) {
  return event.type.toLowerCase();
}

export function buildDeterministicPolicy(
  event: CorporateEvent,
  context: PolicyContext,
): PolicyRecommendation {
  const eventType = normalizedType(event);
  const multiplier = eventType.includes("multiplier") || eventType.includes("split");
  const dividend = eventType.includes("dividend");
  const urgent = context.risk === "critical" || context.risk === "high";

  if (multiplier) {
    return {
      title: "Review multiplier-sensitive activity",
      intent: urgent ? "pause_sensitive_flows" : "restrict_new_exposure",
      priority: urgent ? "urgent" : "review",
      rationale: "A split or multiplier change can make quotes, NAV and collateral calculations inconsistent until every dependent system uses the same active value.",
      scope: context.affectedSystems,
      checks: [
        "Confirm the active and pending multiplier in the official asset metadata",
        "Compare quote, NAV and collateral calculations after the effective time",
        "Identify integrations still using the previous multiplier",
      ],
      applyWhen: ["The pending multiplier differs from the active multiplier"],
      releaseWhen: ["All monitored systems use the confirmed active multiplier"],
      operatorDecision: "approval_required",
      execution: "advisory_only",
    };
  }

  if (dividend) {
    return {
      title: "Review dividend accounting",
      intent: "prepare_accounting_update",
      priority: event.sourceStatus === "IN_PROGRESS" ? "review" : "routine",
      rationale: "A cash distribution can change ex-dividend pricing, receivables and the accounting treatment of vault or collateral positions.",
      scope: context.affectedSystems,
      checks: [
        "Confirm the reported dividend rate and current event status",
        "Review ex-dividend pricing and NAV treatment",
        "Check whether vault or lending accounting needs a receivable entry",
      ],
      applyWhen: ["The official dividend record enters an active processing state"],
      releaseWhen: ["Pricing and accounting reflect the completed distribution"],
      operatorDecision: "review_required",
      execution: "advisory_only",
    };
  }

  return {
    title: "Review the official event",
    intent: "review",
    priority: urgent ? "urgent" : "review",
    rationale: "The official corporate-action record may change how the monitored asset should be priced, accounted for or used by connected systems.",
    scope: context.affectedSystems,
    checks: [
      "Confirm the event details and source status",
      "Identify monitored systems that depend on the affected asset",
    ],
    applyWhen: ["The official event remains active or unresolved"],
    releaseWhen: ["The event is complete and dependent systems are reconciled"],
    operatorDecision: "review_required",
    execution: "advisory_only",
  };
}
