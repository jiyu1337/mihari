import { corporateEvents } from "@/lib/product-data";

const DEFAULT_BASE_URL = "https://api.robinhood.com";

export type RobinhoodCorporateAction = {
  id?: string;
  asset_id?: string;
  symbol?: string;
  type?: string;
  effective_date?: string;
  record_date?: string;
  payable_date?: string;
  multiplier?: string | number;
  cash_amount?: string | number;
  currency?: string;
  status?: string;
  [key: string]: unknown;
};

type RobinhoodListResponse<T> = {
  results?: T[];
  data?: T[];
  next?: string | null;
};

export async function getCorporateActions(): Promise<{
  source: "robinhood" | "demo";
  actions: RobinhoodCorporateAction[];
  fetchedAt: string;
}> {
  const baseUrl = process.env.ROBINHOOD_API_BASE_URL ?? DEFAULT_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}/rhj/corporate-actions`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(7_000),
    });

    if (!response.ok) throw new Error(`Robinhood API responded ${response.status}`);
    const body = (await response.json()) as RobinhoodListResponse<RobinhoodCorporateAction> | RobinhoodCorporateAction[];
    const actions = Array.isArray(body) ? body : (body.results ?? body.data ?? []);

    return { source: "robinhood", actions, fetchedAt: new Date().toISOString() };
  } catch {
    return {
      source: "demo",
      actions: corporateEvents.map((event) => ({
        id: event.id,
        symbol: event.asset,
        type: event.type.toLowerCase().replaceAll(" ", "_"),
        status: event.severity,
        effective_date: new Date().toISOString(),
      })),
      fetchedAt: new Date().toISOString(),
    };
  }
}
