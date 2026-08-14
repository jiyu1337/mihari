import "server-only";

import type {
  ProtocolExposureAdapter,
  ProtocolPosition,
} from "@/lib/protocol-exposure";
import type { RobinhoodAsset } from "@/lib/robinhood";

const LIGHTER_API_URL = "https://api.rh.lighter.xyz";

type LighterPosition = {
  market_id?: number;
  symbol?: string;
  initial_margin_fraction?: string;
  sign?: number;
  position?: string;
  avg_entry_price?: string;
  position_value?: string;
  unrealized_pnl?: string;
  liquidation_price?: string;
  margin_mode?: number;
  allocated_margin?: string;
};

type LighterAccount = {
  index?: number;
  account_index?: number;
  l1_address?: string;
  positions?: LighterPosition[];
};

type LighterAccountResponse = {
  code?: number;
  message?: string;
  accounts?: LighterAccount[];
};

type StockToken = {
  symbol: string;
  address: string;
};

function finiteDecimal(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(value) : null;
}

function positiveDecimal(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0;
}

function stockTokens(assets: RobinhoodAsset[]) {
  return new Map(assets.flatMap((asset): Array<[string, StockToken]> => {
    const deployment = asset.deployments.find((candidate) => candidate.chainId === 4663);
    if (!deployment) return [];
    return [[asset.tokenSymbol.toUpperCase(), {
      symbol: asset.tokenSymbol.toUpperCase(),
      address: deployment.contractAddress,
    }]];
  }));
}

function stockTokenForMarket(symbol: string, tokens: Map<string, StockToken>) {
  const normalized = symbol.trim().toUpperCase();
  const candidates = [
    normalized,
    normalized.replace(/[-_/.:]?(?:USD|USDG|USDC|PERP)$/i, ""),
  ];
  for (const candidate of candidates) {
    const token = tokens.get(candidate);
    if (token) return token;
  }
  return null;
}

function leverageFromMarginFraction(value: string | undefined) {
  const fraction = Number(value);
  if (!Number.isFinite(fraction) || fraction <= 0 || fraction > 1) return null;
  const leverage = 1 / fraction;
  return Number.isInteger(leverage)
    ? String(leverage)
    : leverage.toFixed(2).replace(/\.00$/, "");
}

async function fetchLighterAccounts(wallet: string) {
  const query = new URLSearchParams({
    by: "l1_address",
    value: wallet,
    active_only: "true",
  });
  const response = await fetch(`${LIGHTER_API_URL}/api/v1/account?${query}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Lighter API responded ${response.status}`);
  const payload = await response.json() as LighterAccountResponse;
  if (payload.code !== undefined && payload.code !== 0 && payload.code !== 200) {
    throw new Error(payload.message || `Lighter API code ${payload.code}`);
  }
  return Array.isArray(payload.accounts) ? payload.accounts : [];
}

function positionRow(
  wallet: string,
  account: LighterAccount,
  position: LighterPosition,
  token: StockToken,
): ProtocolPosition | null {
  const amount = finiteDecimal(position.position);
  const sign = Number(position.sign);
  const marketId = position.market_id;
  const marketSymbol = position.symbol?.trim();
  if (!amount || !positiveDecimal(amount) || !marketSymbol || marketId === undefined) return null;
  if (sign !== 1 && sign !== -1) return null;

  const accountIndex = account.account_index ?? account.index ?? "default";
  return {
    id: `lighter:${wallet.toLowerCase()}:${accountIndex}:${marketId}`,
    protocol: "lighter",
    wallet,
    kind: "perp_position",
    marketAddress: `lighter:${marketId}`,
    marketName: `${marketSymbol} PERP`,
    symbol: token.symbol,
    assetAddress: token.address,
    amount,
    valueUsd: finiteDecimal(position.position_value),
    counterpartySymbol: "USDG",
    healthFactor: null,
    positionReference: `ACCOUNT ${accountIndex} / MARKET ${marketId}`,
    positionStatus: "active",
    side: sign === 1 ? "long" : "short",
    leverage: leverageFromMarginFraction(position.initial_margin_fraction),
    marginMode: position.margin_mode === 0
      ? "cross"
      : position.margin_mode === 1
        ? "isolated"
        : null,
    unrealizedPnlUsd: finiteDecimal(position.unrealized_pnl),
    hasCorporateAction: false,
    corporateAction: null,
  };
}

export const lighterAdapter: ProtocolExposureAdapter = {
  id: "lighter",
  async scan({ wallet, assets }) {
    const tokens = stockTokens(assets);
    const accounts = await fetchLighterAccounts(wallet);
    const positions = accounts.flatMap((account) => (
      (Array.isArray(account.positions) ? account.positions : []).flatMap((position) => {
        const marketSymbol = position.symbol?.trim();
        if (!marketSymbol) return [];
        const token = stockTokenForMarket(marketSymbol, tokens);
        if (!token) return [];
        const row = positionRow(wallet, account, position, token);
        return row ? [row] : [];
      })
    ));
    return { positions };
  },
};
