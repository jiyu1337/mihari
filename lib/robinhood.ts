import { corporateEvents, type CorporateEvent, type EventSeverity } from "@/lib/product-data";

const DEFAULT_BASE_URL = "https://api.robinhood.com";
const DEFAULT_SYMBOLS = ["NVDA", "AAPL", "TSLA"];

type Deployment = {
  contractAddress: string;
  chainId: number;
};

export type RobinhoodAsset = {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  deployments: Deployment[];
  currentMultiplier: string;
  pendingMultiplier: string;
  pendingMultiplierEffectiveTime?: string;
  status: string;
};

export type RobinhoodCorporateAction = {
  id: string;
  type: string;
  status: string;
  processDate?: { year: number; month: number; day: number } | null;
  tokenSymbol: string;
  deployments: Deployment[];
  details: Record<string, Record<string, string>>;
};

export type RobinhoodPrice = {
  tokenSymbol: string;
  deployments: Deployment[];
  bid: string;
  ask: string;
  currency: string;
  isTradingHalt: boolean;
  generatedAt: string;
};

export type MarketSnapshot = {
  mode: "live" | "fallback";
  events: CorporateEvent[];
  assets: RobinhoodAsset[];
  prices: RobinhoodPrice[];
  fetchedAt: string;
  warning?: string;
};

function normalizeSymbols(symbols?: string[]) {
  const normalized = (symbols?.length ? symbols : DEFAULT_SYMBOLS)
    .map((symbol) => symbol.trim().replace(/x$/i, "").toUpperCase())
    .filter(Boolean);

  return [...new Set(normalized)].slice(0, 12);
}

function processDateToIso(processDate?: RobinhoodCorporateAction["processDate"]) {
  if (!processDate) return undefined;
  const { year, month, day } = processDate;
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

function readableActionType(type: string) {
  return type.replace("CORPORATE_ACTION_TYPE_", "").replaceAll("_", " ");
}

function severityFor(action: RobinhoodCorporateAction): EventSeverity {
  if (action.status.includes("IN_PROGRESS")) return "critical";
  if (action.type.includes("SPLIT")) return "watch";
  return "verified";
}

function firstDetails(action: RobinhoodCorporateAction) {
  return Object.values(action.details ?? {})[0] ?? {};
}

function describeEvent(action: RobinhoodCorporateAction, asset?: RobinhoodAsset) {
  const details = firstDetails(action);
  const actionType = readableActionType(action.type).toLowerCase();

  if (action.type.includes("SPLIT")) {
    const oldRate = details.oldRate ?? asset?.currentMultiplier ?? "unknown";
    const newRate = details.newRate ?? asset?.pendingMultiplier ?? "unknown";
    return {
      summary: `${action.tokenSymbol} has a ${actionType} moving the multiplier from ${oldRate} to ${newRate}.`,
      impact: "Price, multiplier and downstream accounting must represent the same corporate-action state.",
      action: action.status.includes("IN_PROGRESS")
        ? "Flag stale valuations and require protocol exposure review before automated actions."
        : "Reconcile the completed multiplier change across monitored integrations.",
    };
  }

  if (action.type.includes("DIVIDEND")) {
    const rate = details.rate ? ` at a reported rate of ${details.rate}` : "";
    return {
      summary: `${action.tokenSymbol} has a ${actionType}${rate}.`,
      impact: "Vault accounting may need to recognize the distribution according to the event lifecycle.",
      action: "Review monitored NAV policies and surface the event to affected integrations.",
    };
  }

  return {
    summary: `${action.tokenSymbol} has a processed ${actionType} event.`,
    impact: "Connected protocols should reconcile asset metadata before relying on the new state.",
    action: "Keep execution disabled until the event and affected integrations are reviewed.",
  };
}

function toCorporateEvent(
  action: RobinhoodCorporateAction,
  asset: RobinhoodAsset | undefined,
  index: number,
): CorporateEvent {
  const copy = describeEvent(action, asset);
  const effectiveAt = processDateToIso(action.processDate);

  return {
    id: action.id || `RH-${index + 1}`,
    time: effectiveAt ? effectiveAt.slice(0, 10) : "PENDING",
    asset: action.tokenSymbol,
    name: asset?.tokenName ?? `${action.tokenSymbol} Stock Token`,
    type: readableActionType(action.type),
    severity: severityFor(action),
    summary: copy.summary,
    impact: copy.impact,
    action: copy.action,
    confidence: null,
    affected: null,
    proof: null,
    source: "robinhood",
    sourceStatus: action.status.replace("CORPORATE_ACTION_STATUS_", ""),
  };
}

async function fetchJson<T>(url: string, revalidate: number): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error(`Robinhood API responded ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getMarketSnapshot(symbols?: string[]): Promise<MarketSnapshot> {
  const baseUrl = process.env.ROBINHOOD_API_BASE_URL ?? DEFAULT_BASE_URL;
  const selectedSymbols = normalizeSymbols(symbols);

  try {
    const [assetBody, actionBody] = await Promise.all([
      fetchJson<{ assets?: RobinhoodAsset[] }>(`${baseUrl}/rhj/assets`, 300),
      fetchJson<{ corpActions?: RobinhoodCorporateAction[] }>(
        `${baseUrl}/rhj/corporate-actions`,
        3_600,
      ),
    ]);

    const assets = (assetBody.assets ?? []).filter((asset) =>
      selectedSymbols.includes(asset.tokenSymbol.toUpperCase()),
    );
    const assetBySymbol = new Map(
      assets.map((asset) => [asset.tokenSymbol.toUpperCase(), asset]),
    );
    const actions = (actionBody.corpActions ?? [])
      .filter((action) => selectedSymbols.includes(action.tokenSymbol.toUpperCase()))
      .slice(0, 20);
    const priceResults = await Promise.allSettled(
      selectedSymbols.map((symbol) =>
        fetchJson<{ quotes?: RobinhoodPrice[] }>(`${baseUrl}/rhj/prices/${symbol}`, 15),
      ),
    );
    const prices = priceResults.flatMap((result) =>
      result.status === "fulfilled" ? (result.value.quotes ?? []) : [],
    );

    return {
      mode: "live",
      events: actions.map((action, index) =>
        toCorporateEvent(action, assetBySymbol.get(action.tokenSymbol.toUpperCase()), index),
      ),
      assets,
      prices,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      mode: "fallback",
      events: corporateEvents,
      assets: [],
      prices: [],
      fetchedAt: new Date().toISOString(),
      warning: error instanceof Error ? error.message : "Robinhood data unavailable",
    };
  }
}
