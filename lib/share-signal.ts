export const SHARE_CONTEXTS = ["holding", "watchlist", "guard"] as const;
export const SHARE_RISKS = ["low", "medium", "high", "critical"] as const;

export type ShareContext = typeof SHARE_CONTEXTS[number];
export type ShareRisk = typeof SHARE_RISKS[number];

export type ShareSignal = {
  symbol: string;
  eventType: string;
  risk: ShareRisk;
  context: ShareContext;
  systems: string[];
};

function clean(value: string, maxLength: number) {
  return value.replace(/[^a-zA-Z0-9 /&+._-]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function normalizeShareRisk(value: string): ShareRisk {
  const risk = value.toLowerCase();
  return SHARE_RISKS.includes(risk as ShareRisk) ? risk as ShareRisk : "medium";
}

export function parseShareSignal(params: URLSearchParams): ShareSignal | null {
  const symbol = clean(params.get("symbol") ?? "", 18).toUpperCase();
  const eventType = clean(params.get("event") ?? "", 64).toUpperCase();
  const contextValue = params.get("context")?.toLowerCase() ?? "watchlist";
  const context = SHARE_CONTEXTS.includes(contextValue as ShareContext)
    ? contextValue as ShareContext
    : "watchlist";
  const systems = (params.get("systems") ?? "")
    .split(",")
    .map((system) => clean(system, 20).toUpperCase())
    .filter(Boolean)
    .slice(0, 5);

  if (!symbol || !eventType) return null;
  return {
    symbol,
    eventType,
    risk: normalizeShareRisk(params.get("risk") ?? "medium"),
    context,
    systems,
  };
}

export function shareSignalParams(signal: ShareSignal) {
  const params = new URLSearchParams({
    symbol: clean(signal.symbol, 18).toUpperCase(),
    event: clean(signal.eventType, 64).toUpperCase(),
    risk: normalizeShareRisk(signal.risk),
    context: signal.context,
  });
  if (signal.systems.length) params.set("systems", signal.systems.map((system) => clean(system, 20).toUpperCase()).join(","));
  return params;
}

export function shareSignalUrl(signal: ShareSignal) {
  return `https://mihari.pro/signal?${shareSignalParams(signal).toString()}`;
}

export function shareSignalText(signal: ShareSignal) {
  const event = signal.eventType.replaceAll("_", " ").toLowerCase();
  const systems = signal.systems.length ? `\nReview: ${signal.systems.join(" / ").toUpperCase()}` : "";

  if (signal.context === "guard") {
    return `I reviewed a ${signal.symbol} corporate-action signal with MIHARI Guard.\n\nSource checked. Exposure verified. Decision recorded.\n\nNo funds moved.\n@miharidapp`;
  }
  if (signal.context === "holding") {
    return `MIHARI found an official ${signal.symbol} ${event} event connected to a Stock Token in my verified wallet.\n\nPersonal risk: ${signal.risk.toUpperCase()}${systems}\n\nChecked by @miharidapp`;
  }
  return `I am monitoring ${signal.symbol} before buying.\n\nMIHARI found an official ${event} event and mapped what may need attention.\n\nResearch signal. Not a holding.\n@miharidapp`;
}

