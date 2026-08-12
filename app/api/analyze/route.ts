import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  symbol: z.string().min(1).max(24),
  eventType: z.string().min(1).max(80),
  event: z.record(z.string(), z.unknown()),
});

const analysisSchema = z.object({
  summary: z.string(),
  affectedSystems: z.array(z.enum(["quotes", "nav", "vaults", "lending", "agents"])),
  risk: z.enum(["low", "medium", "high", "critical"]),
  recommendedAction: z.string(),
  policyAction: z.enum(["observe", "warn", "pause_quotes", "pause_lending", "rebalance_nav", "manual_review"]),
  confidence: z.number().min(0).max(100),
  evidence: z.array(z.string()),
});

function deterministicFallback(input: z.infer<typeof requestSchema>) {
  const normalized = input.eventType.toLowerCase();
  const isMultiplier = normalized.includes("multiplier") || normalized.includes("split");
  const isDividend = normalized.includes("dividend");

  return {
    summary: `${input.symbol} has a ${input.eventType} event requiring policy review.`,
    affectedSystems: isMultiplier ? ["quotes", "nav", "vaults", "lending"] : isDividend ? ["nav", "vaults"] : ["agents"],
    risk: isMultiplier ? "high" : "medium",
    recommendedAction: isMultiplier
      ? "Block stale quotes and pause new lending until the active multiplier is confirmed."
      : "Notify monitored positions and stage the event in the NAV policy.",
    policyAction: isMultiplier ? "pause_quotes" : "warn",
    confidence: 82,
    evidence: ["Deterministic fallback rules", "Submitted corporate-action payload"],
    mode: "deterministic" as const,
  };
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid corporate action", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json(deterministicFallback(parsed.data));
  }

  try {
    const { output } = await generateText({
      model: process.env.MIHARI_AI_MODEL ?? "openai/gpt-5.4",
      output: Output.object({ schema: analysisSchema }),
      system: [
        "You are MIHARI, a risk analyst for tokenized stocks.",
        "Analyze corporate actions conservatively. Never invent missing evidence.",
        "The model may recommend an action but cannot authorize transactions.",
        "Prefer manual_review when evidence conflicts or is incomplete.",
      ].join(" "),
      prompt: JSON.stringify(parsed.data),
    });

    return NextResponse.json({ ...output, mode: "ai" });
  } catch (error) {
    return NextResponse.json({
      ...deterministicFallback(parsed.data),
      warning: error instanceof Error ? error.message : "AI analysis unavailable",
    });
  }
}
