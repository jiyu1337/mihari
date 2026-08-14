import "server-only";

import type {
  ProtocolExposureAdapter,
  ProtocolPosition,
} from "@/lib/protocol-exposure";
import type { RobinhoodAsset } from "@/lib/robinhood";

const ARCUS_API_URL = "https://api.arcus.xyz";

type ArcusPosition = {
  address?: string;
  accountIndex?: number | string;
  marketId?: number | string;
  marketDisplayName?: string;
  side?: string;
  size?: string;
  averageEntryPrice?: string;
  leverage?: string;
  marginMode?: string;
  borrowedCapital?: string;
  marginUsed?: string;
  positionValueNotional?: string;
  unrealizedPnl?: string;
  markPx?: string;
};

type ArcusPositionsResponse = {
  positions?: ArcusPosition[] | Record<string, ArcusPosition>;
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
  return assets.flatMap((asset): StockToken[] => {
    const deployment = asset.deployments.find((candidate) => candidate.chainId === 4663);
    if (!deployment) return [];
    return [{
      symbol: asset.tokenSymbol.toUpperCase(),
      address: deployment.contractAddress,
    }];
  }).sort((left, right) => right.symbol.length - left.symbol.length);
}

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stockTokenForMarket(marketDisplayName: string, tokens: StockToken[]) {
  const market = marketDisplayName.trim().toUpperCase();
  return tokens.find((token) => new RegExp(
    `^${escapePattern(token.symbol)}(?:[-_/\\s.]|$)`,
    "i",
  ).test(market));
}

function normalizedPositions(payload: ArcusPositionsResponse) {
  if (Array.isArray(payload.positions)) return payload.positions;
  if (payload.positions && typeof payload.positions === "object") {
    return Object.values(payload.positions);
  }
  return [];
}

async function fetchArcusPositions(wallet: string) {
  const response = await fetch(
    `${ARCUS_API_URL}/v1/positions?address=${encodeURIComponent(wallet)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!response.ok) throw new Error(`Arcus API responded ${response.status}`);
  return normalizedPositions(await response.json() as ArcusPositionsResponse);
}

function positionRow(
  wallet: string,
  position: ArcusPosition,
  token: StockToken,
): ProtocolPosition | null {
  const size = finiteDecimal(position.size);
  const marketName = position.marketDisplayName?.trim();
  const side = position.side?.trim().toLowerCase();
  if (!size || !positiveDecimal(size) || !marketName || (side !== "long" && side !== "short")) {
    return null;
  }

  const marketId = String(position.marketId ?? marketName);
  const accountIndex = String(position.accountIndex ?? "default");
  const marginMode = position.marginMode?.trim().toLowerCase();
  return {
    id: `arcus:${wallet.toLowerCase()}:${accountIndex}:${marketId}:${side}`,
    protocol: "arcus",
    wallet,
    kind: "perp_position",
    marketAddress: `arcus:${marketId}`,
    marketName,
    symbol: token.symbol,
    assetAddress: token.address,
    amount: size,
    valueUsd: finiteDecimal(position.positionValueNotional),
    counterpartySymbol: "USD",
    healthFactor: null,
    positionReference: `ACCOUNT ${accountIndex} / MARKET ${marketId}`,
    positionStatus: "active",
    side,
    leverage: finiteDecimal(position.leverage),
    marginMode: marginMode === "cross" || marginMode === "isolated" ? marginMode : null,
    unrealizedPnlUsd: finiteDecimal(position.unrealizedPnl),
    hasCorporateAction: false,
    corporateAction: null,
  };
}

export const arcusAdapter: ProtocolExposureAdapter = {
  id: "arcus",
  async scan({ wallet, assets }) {
    const tokens = stockTokens(assets);
    const positions = (await fetchArcusPositions(wallet)).flatMap((position) => {
      const marketName = position.marketDisplayName?.trim();
      if (!marketName) return [];
      const token = stockTokenForMarket(marketName, tokens);
      if (!token) return [];
      const row = positionRow(wallet, position, token);
      return row ? [row] : [];
    });
    return { positions };
  },
};
