import "server-only";

import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  parseAbi,
  parseAbiItem,
  zeroAddress,
  type Address,
} from "viem";
import { robinhoodMainnet } from "@/lib/chain";
import type {
  ProtocolMarket,
  ProtocolMarketScan,
  ProtocolMarketSourceScan,
} from "@/lib/protocol-exposure";
import type { RobinhoodAsset } from "@/lib/robinhood";
import { UNISWAP_V3_FACTORY } from "@/lib/protocols/uniswap-v3";

const BLOCKSCOUT_ADDRESS_URL = "https://robinhoodchain.blockscout.com/address";
const MORPHO_GRAPHQL_URL = "https://api.morpho.org/graphql";
const ARCUS_API_URL = "https://api.arcus.xyz";
const LIGHTER_API_URL = "https://api.rh.lighter.xyz";
const UNISWAP_V4_POOL_MANAGER = "0x8366a39cc670b4001a1121b8f6a443a643e40951" as Address;
const UNISWAP_V4_STATE_VIEW = "0xf3334192d15450cdd385c8b70e03f9a6bd9e673b" as Address;
const DYNAMIC_FEE_FLAG = 0x800000;
const MAX_STATIC_FEE = 10_000;
const MAX_CANDIDATES_PER_SYMBOL = 12;

const v3PoolCreatedEvent = parseAbiItem("event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)");
const v3PoolAbi = parseAbi(["function liquidity() view returns (uint128)"]);
const v4InitializeEvent = parseAbiItem("event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)");
const v4StateViewAbi = parseAbi(["function getLiquidity(bytes32 poolId) view returns (uint128 liquidity)"]);

const MORPHO_MARKETS_QUERY = `
  query GetMihariMarkets {
    markets(
      first: 100
      orderBy: SupplyAssetsUsd
      orderDirection: Desc
      where: { chainId_in: [4663] }
    ) {
      items {
        marketId
        loanAsset { address symbol }
        collateralAsset { address symbol }
        state {
          supplyAssets
          supplyAssetsUsd
          borrowAssets
          borrowAssetsUsd
          liquidityAssets
          liquidityAssetsUsd
          fee
        }
      }
    }
  }
`;

type MarketScannerResult = {
  markets: ProtocolMarket[];
  partial?: boolean;
  warning?: string;
};

type StockToken = {
  symbol: string;
  address: Address;
};

type MorphoMarket = {
  marketId?: string;
  loanAsset?: { address?: string; symbol?: string } | null;
  collateralAsset?: { address?: string; symbol?: string } | null;
  state?: {
    supplyAssets?: string | number | null;
    supplyAssetsUsd?: string | number | null;
    borrowAssets?: string | number | null;
    borrowAssetsUsd?: string | number | null;
    liquidityAssets?: string | number | null;
    liquidityAssetsUsd?: string | number | null;
    fee?: string | number | null;
  } | null;
};

type ArcusMarket = {
  marketId?: string | number;
  marketDisplayName?: string;
  displayName?: string;
  name?: string;
  symbol?: string;
  status?: string;
  isActive?: boolean;
  makerFee?: string | number;
  takerFee?: string | number;
};

type LighterOrderBook = {
  market_id?: number;
  symbol?: string;
  market_type?: string;
  status?: string;
  maker_fee?: string;
  taker_fee?: string;
};

function rpcUrl() {
  return process.env.ROBINHOOD_RPC_URL?.trim()
    || process.env.NEXT_PUBLIC_RPC_URL?.trim()
    || robinhoodMainnet.rpcUrls.default.http[0];
}

function publicClient() {
  return createPublicClient({
    chain: robinhoodMainnet,
    transport: http(rpcUrl(), { timeout: 15_000 }),
  });
}

function selectedTokens(assets: RobinhoodAsset[], symbols: string[]) {
  const selected = new Set(symbols.map((symbol) => symbol.toUpperCase()));
  return assets.flatMap((asset): StockToken[] => {
    if (!selected.has(asset.tokenSymbol.toUpperCase())) return [];
    const deployment = asset.deployments.find((candidate) => (
      candidate.chainId === robinhoodMainnet.id && isAddress(candidate.contractAddress)
    ));
    if (!deployment) return [];
    return [{ symbol: asset.tokenSymbol.toUpperCase(), address: getAddress(deployment.contractAddress) }];
  });
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function positive(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number > 0;
}

function finiteString(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? String(value) : null;
}

function feePercent(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  const normalized = number > 1 ? number / 1e18 : number;
  return `${(normalized * 100).toLocaleString("en-US", { maximumFractionDigits: 4 })}%`;
}

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenForMarketName(name: string, tokens: StockToken[]) {
  const normalized = name.trim().toUpperCase();
  return [...tokens]
    .sort((left, right) => right.symbol.length - left.symbol.length)
    .find((token) => new RegExp(`^${escapePattern(token.symbol)}(?:[-_/\\s.:]|$)`, "i").test(normalized)) ?? null;
}

function counterpartyFromName(name: string, symbol: string, fallback: string) {
  const remainder = name.trim().toUpperCase()
    .replace(new RegExp(`^${escapePattern(symbol)}(?:[-_/\\s.:]+)?`, "i"), "")
    .replace(/(?:[-_/\\s.:]+)?PERP(?:ETUAL)?$/i, "")
    .trim();
  return remainder || fallback;
}

async function scanMorphoMarkets(tokens: StockToken[]): Promise<MarketScannerResult> {
  if (!tokens.length) return { markets: [] };
  const response = await fetch(MORPHO_GRAPHQL_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ query: MORPHO_MARKETS_QUERY }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Morpho API responded ${response.status}`);
  const payload = await response.json() as {
    data?: { markets?: { items?: MorphoMarket[] } };
    errors?: Array<{ message?: string }>;
  };
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).filter(Boolean).join("; ") || "Morpho query failed");
  }

  const tokenByAddress = new Map(tokens.map((token) => [token.address.toLowerCase(), token]));
  return {
    markets: (payload.data?.markets?.items ?? []).flatMap((market): ProtocolMarket[] => {
      if (!market.marketId || !market.state) return [];
      if (![market.state.supplyAssets, market.state.borrowAssets, market.state.liquidityAssets].some(positive)) return [];
      const loanToken = market.loanAsset?.address
        ? tokenByAddress.get(market.loanAsset.address.toLowerCase())
        : undefined;
      const collateralToken = market.collateralAsset?.address
        ? tokenByAddress.get(market.collateralAsset.address.toLowerCase())
        : undefined;
      const rows: ProtocolMarket[] = [];
      if (loanToken) {
        rows.push({
          id: `morpho:${market.marketId}:${loanToken.symbol}`,
          protocol: "morpho",
          kind: "lending_market",
          symbol: loanToken.symbol,
          counterparty: market.collateralAsset?.symbol?.toUpperCase() || "UNCOLLATERALIZED",
          marketId: market.marketId,
          fee: feePercent(market.state.fee),
          liquidityUsd: finiteString(market.state.liquidityAssetsUsd ?? market.state.supplyAssetsUsd),
          externalUrl: "https://app.morpho.org/",
          linkLabel: "OPEN MORPHO",
        });
      }
      if (collateralToken && collateralToken.symbol !== loanToken?.symbol) {
        rows.push({
          id: `morpho:${market.marketId}:${collateralToken.symbol}`,
          protocol: "morpho",
          kind: "lending_market",
          symbol: collateralToken.symbol,
          counterparty: market.loanAsset?.symbol?.toUpperCase() || "LOAN ASSET",
          marketId: market.marketId,
          fee: feePercent(market.state.fee),
          liquidityUsd: finiteString(market.state.liquidityAssetsUsd ?? market.state.supplyAssetsUsd),
          externalUrl: "https://app.morpho.org/",
          linkLabel: "OPEN MORPHO",
        });
      }
      return rows;
    }),
  };
}

async function scanUniswapV3Markets(tokens: StockToken[]): Promise<MarketScannerResult> {
  if (!tokens.length) return { markets: [] };
  const client = publicClient();
  const addresses = tokens.map((token) => token.address);
  const byAddress = new Map(tokens.map((token) => [token.address.toLowerCase(), token.symbol]));
  const [token0Logs, token1Logs] = await Promise.all([
    client.getLogs({
      address: UNISWAP_V3_FACTORY,
      event: v3PoolCreatedEvent,
      args: { token0: addresses },
      fromBlock: BigInt(0),
      toBlock: "latest",
    }),
    client.getLogs({
      address: UNISWAP_V3_FACTORY,
      event: v3PoolCreatedEvent,
      args: { token1: addresses },
      fromBlock: BigInt(0),
      toBlock: "latest",
    }),
  ]);
  const seen = new Set<string>();
  const candidates = [...token0Logs, ...token1Logs].flatMap((log) => {
    const { token0, token1, fee, pool } = log.args;
    if (!token0 || !token1 || fee === undefined || !pool) return [];
    const symbol0 = byAddress.get(token0.toLowerCase());
    const symbol1 = byAddress.get(token1.toLowerCase());
    const symbol = symbol0 ?? symbol1;
    if (!symbol) return [];
    const counterpartyAddress = symbol === symbol0 ? token1 : token0;
    const counterparty = byAddress.get(counterpartyAddress.toLowerCase()) ?? shortAddress(counterpartyAddress);
    const key = `${pool.toLowerCase()}:${symbol}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ key, symbol, counterparty, fee: Number(fee), pool: getAddress(pool) }];
  });
  if (!candidates.length) return { markets: [] };
  const liquidity = await client.multicall({
    allowFailure: true,
    contracts: candidates.map((market) => ({
      address: market.pool,
      abi: v3PoolAbi,
      functionName: "liquidity" as const,
    })),
  });
  return {
    markets: candidates.flatMap((market, index): ProtocolMarket[] => {
      const result = liquidity[index];
      if (result?.status !== "success" || result.result <= BigInt(0)) return [];
      return [{
        id: `uniswap-v3:${market.key}`,
        protocol: "uniswap-v3",
        kind: "dex_pool",
        symbol: market.symbol,
        counterparty: market.counterparty,
        marketId: market.pool,
        fee: `${market.fee / 10_000}%`,
        liquidityUsd: null,
        externalUrl: `${BLOCKSCOUT_ADDRESS_URL}/${market.pool}`,
        linkLabel: "VIEW POOL",
      }];
    }),
  };
}

async function scanUniswapV4Markets(tokens: StockToken[]): Promise<MarketScannerResult> {
  if (!tokens.length) return { markets: [] };
  const client = publicClient();
  const addresses = tokens.map((token) => token.address);
  const byAddress = new Map(tokens.map((token) => [token.address.toLowerCase(), token.symbol]));
  const [currency0Logs, currency1Logs] = await Promise.all([
    client.getLogs({
      address: UNISWAP_V4_POOL_MANAGER,
      event: v4InitializeEvent,
      args: { currency0: addresses },
      fromBlock: BigInt(0),
      toBlock: "latest",
    }),
    client.getLogs({
      address: UNISWAP_V4_POOL_MANAGER,
      event: v4InitializeEvent,
      args: { currency1: addresses },
      fromBlock: BigInt(0),
      toBlock: "latest",
    }),
  ]);
  const seen = new Set<string>();
  const candidateCount = new Map<string, number>();
  const candidates = [...currency0Logs, ...currency1Logs].reverse().flatMap((log) => {
    const { id, currency0, currency1, fee } = log.args;
    if (!id || !currency0 || !currency1 || fee === undefined) return [];
    const feeNumber = Number(fee);
    const dynamicFee = (feeNumber & DYNAMIC_FEE_FLAG) !== 0;
    if (!dynamicFee && feeNumber > MAX_STATIC_FEE) return [];
    const symbol0 = byAddress.get(currency0.toLowerCase());
    const symbol1 = byAddress.get(currency1.toLowerCase());
    const symbol = symbol0 ?? symbol1;
    if (!symbol) return [];
    const count = candidateCount.get(symbol) ?? 0;
    if (count >= MAX_CANDIDATES_PER_SYMBOL) return [];
    const counterpartyAddress = symbol === symbol0 ? currency1 : currency0;
    const counterparty = counterpartyAddress.toLowerCase() === zeroAddress
      ? "ETH"
      : byAddress.get(counterpartyAddress.toLowerCase()) ?? shortAddress(counterpartyAddress);
    const key = `${id}:${symbol}`;
    if (seen.has(key)) return [];
    seen.add(key);
    candidateCount.set(symbol, count + 1);
    return [{ key, id, symbol, counterparty, feeNumber, dynamicFee }];
  });
  if (!candidates.length) return { markets: [] };
  const liquidity = await client.multicall({
    allowFailure: true,
    contracts: candidates.map((market) => ({
      address: UNISWAP_V4_STATE_VIEW,
      abi: v4StateViewAbi,
      functionName: "getLiquidity" as const,
      args: [market.id] as const,
    })),
  });
  return {
    markets: candidates.flatMap((market, index): ProtocolMarket[] => {
      const result = liquidity[index];
      if (result?.status !== "success" || result.result <= BigInt(0)) return [];
      return [{
        id: `uniswap-v4:${market.key}`,
        protocol: "uniswap-v4",
        kind: "dex_pool",
        symbol: market.symbol,
        counterparty: market.counterparty,
        marketId: market.id,
        fee: market.dynamicFee
          ? "DYNAMIC"
          : `${(market.feeNumber / 10_000).toLocaleString("en-US", { maximumFractionDigits: 4 })}%`,
        liquidityUsd: null,
        externalUrl: `${BLOCKSCOUT_ADDRESS_URL}/${UNISWAP_V4_POOL_MANAGER}`,
        linkLabel: "VIEW POOL MANAGER",
      }];
    }),
  };
}

async function scanArcusMarkets(tokens: StockToken[]): Promise<MarketScannerResult> {
  if (!tokens.length) return { markets: [] };
  const response = await fetch(`${ARCUS_API_URL}/v1/markets`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Arcus API responded ${response.status}`);
  const payload = await response.json() as { markets?: ArcusMarket[] | Record<string, ArcusMarket> } | ArcusMarket[];
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.markets)
      ? payload.markets
      : payload.markets && typeof payload.markets === "object"
        ? Object.values(payload.markets)
        : [];
  return {
    markets: source.flatMap((market, index): ProtocolMarket[] => {
      const name = market.marketDisplayName ?? market.displayName ?? market.name ?? market.symbol;
      if (!name || market.isActive === false || /inactive|closed|disabled/i.test(market.status ?? "")) return [];
      const token = tokenForMarketName(name, tokens);
      if (!token) return [];
      const marketId = String(market.marketId ?? index);
      const makerFee = finiteString(market.makerFee);
      const takerFee = finiteString(market.takerFee);
      return [{
        id: `arcus:${marketId}:${token.symbol}`,
        protocol: "arcus",
        kind: "perp_market",
        symbol: token.symbol,
        counterparty: counterpartyFromName(name, token.symbol, "USD"),
        marketId: `arcus:${marketId}`,
        fee: takerFee ? `TAKER ${takerFee}` : makerFee ? `MAKER ${makerFee}` : null,
        liquidityUsd: null,
        externalUrl: "https://app.arcus.xyz/",
        linkLabel: "OPEN ARCUS",
      }];
    }),
  };
}

async function scanLighterMarkets(tokens: StockToken[]): Promise<MarketScannerResult> {
  if (!tokens.length) return { markets: [] };
  const response = await fetch(`${LIGHTER_API_URL}/api/v1/orderBooks`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Lighter API responded ${response.status}`);
  const payload = await response.json() as {
    code?: number;
    message?: string;
    order_books?: LighterOrderBook[];
  };
  if (payload.code !== undefined && payload.code !== 0 && payload.code !== 200) {
    throw new Error(payload.message || `Lighter API code ${payload.code}`);
  }
  return {
    markets: (payload.order_books ?? []).flatMap((market): ProtocolMarket[] => {
      if (market.market_id === undefined || !market.symbol) return [];
      if (market.market_type && market.market_type.toLowerCase() !== "perp") return [];
      if (market.status && market.status.toLowerCase() !== "active") return [];
      const token = tokenForMarketName(market.symbol, tokens);
      if (!token) return [];
      const takerFee = finiteString(market.taker_fee);
      const makerFee = finiteString(market.maker_fee);
      return [{
        id: `lighter:${market.market_id}:${token.symbol}`,
        protocol: "lighter",
        kind: "perp_market",
        symbol: token.symbol,
        counterparty: counterpartyFromName(market.symbol, token.symbol, "USDG"),
        marketId: `lighter:${market.market_id}`,
        fee: takerFee ? `TAKER ${takerFee}%` : makerFee ? `MAKER ${makerFee}%` : null,
        liquidityUsd: null,
        externalUrl: "https://lighter.xyz/",
        linkLabel: "OPEN LIGHTER",
      }];
    }),
  };
}

async function runSource(
  protocol: ProtocolMarket["protocol"],
  scanner: () => Promise<MarketScannerResult>,
) {
  try {
    const result = await scanner();
    return {
      markets: result.markets,
      scan: {
        protocol,
        status: result.partial ? "partial" : "live",
        marketCount: result.markets.length,
        warning: result.warning,
      } satisfies ProtocolMarketSourceScan,
    };
  } catch (error) {
    return {
      markets: [] as ProtocolMarket[],
      scan: {
        protocol,
        status: "unavailable",
        marketCount: 0,
        warning: error instanceof Error ? error.message : `${protocol} market discovery unavailable`,
      } satisfies ProtocolMarketSourceScan,
    };
  }
}

export async function scanProtocolMarkets(
  assets: RobinhoodAsset[],
  symbols: string[],
): Promise<ProtocolMarketScan> {
  const tokens = selectedTokens(assets, symbols);
  if (!tokens.length) {
    return { status: "live", markets: [], scans: [] };
  }

  const results = await Promise.all([
    runSource("morpho", () => scanMorphoMarkets(tokens)),
    runSource("uniswap-v3", () => scanUniswapV3Markets(tokens)),
    runSource("uniswap-v4", () => scanUniswapV4Markets(tokens)),
    runSource("arcus", () => scanArcusMarkets(tokens)),
    runSource("lighter", () => scanLighterMarkets(tokens)),
  ]);
  const scans = results.map((result) => result.scan);
  const markets = results.flatMap((result) => result.markets)
    .sort((left, right) => left.symbol.localeCompare(right.symbol) || left.protocol.localeCompare(right.protocol));
  const unavailable = scans.filter((scan) => scan.status === "unavailable");
  const status = unavailable.length === scans.length
    ? "unavailable"
    : unavailable.length
      ? "partial"
      : "live";
  return {
    status,
    markets,
    scans,
    warning: unavailable.length
      ? unavailable.map((scan) => `${scan.protocol}: ${scan.warning ?? "unavailable"}`).join("; ")
      : undefined,
  };
}
