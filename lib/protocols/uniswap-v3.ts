import "server-only";

import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
  isAddress,
  parseAbi,
  zeroAddress,
  type Address,
} from "viem";
import { robinhoodMainnet } from "@/lib/chain";
import type {
  ProtocolExposureAdapter,
  ProtocolPosition,
} from "@/lib/protocol-exposure";
import type { RobinhoodAsset } from "@/lib/robinhood";
import { amountsForLiquidity } from "@/lib/uniswap-math";

const BLOCKSCOUT_API = "https://robinhoodchain.blockscout.com/api/v2";
const CHAIN_ID = 4663;
const MAX_POSITIONS_PER_WALLET = 24;

export const UNISWAP_V3_POSITION_MANAGER = getAddress(
  "0x73991a25c818bf1f1128deaab1492d45638de0d3",
);
const UNISWAP_V3_FACTORY = getAddress("0x1f7d7550b1b028f7571e69a784071f0205fd2efa");

const positionManagerAbi = parseAbi([
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
]);
const factoryAbi = parseAbi([
  "function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)",
]);
const poolAbi = parseAbi([
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function liquidity() view returns (uint128)",
]);

type BlockscoutTokenBalance = {
  value?: string;
  token_id?: string | null;
  token_instance?: { id?: string | null } | null;
  token: {
    address_hash: string;
    type?: string | null;
  };
};

type V3PositionState = {
  tokenId: string;
  token0: Address;
  token1: Address;
  fee: number;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
};

function rpcUrl() {
  return process.env.ROBINHOOD_RPC_URL?.trim()
    || process.env.NEXT_PUBLIC_RPC_URL?.trim()
    || robinhoodMainnet.rpcUrls.default.http[0];
}

function publicClient() {
  return createPublicClient({
    chain: robinhoodMainnet,
    transport: http(rpcUrl(), { timeout: 8_000 }),
  });
}

function stockTokensByAddress(assets: RobinhoodAsset[]) {
  return new Map(assets.flatMap((asset) => asset.deployments
    .filter((deployment) => deployment.chainId === CHAIN_ID)
    .map((deployment) => [deployment.contractAddress.toLowerCase(), asset] as const)));
}

function tokenDetails(address: Address, assets: Map<string, RobinhoodAsset>) {
  const asset = assets.get(address.toLowerCase());
  return {
    decimals: asset?.tokenDecimals ?? 18,
    symbol: asset?.tokenSymbol ?? `TOKEN-${address.slice(2, 6).toUpperCase()}`,
  };
}

async function positionTokenIds(wallet: string) {
  const response = await fetch(`${BLOCKSCOUT_API}/addresses/${wallet}/token-balances`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Blockscout responded ${response.status}`);

  const balances = await response.json() as BlockscoutTokenBalance[];
  const tokenIds = balances.flatMap((balance) => {
    if (balance.token.address_hash.toLowerCase() !== UNISWAP_V3_POSITION_MANAGER.toLowerCase()) {
      return [];
    }
    const tokenId = balance.token_id ?? balance.token_instance?.id;
    if (!tokenId || Number(balance.value ?? 1) <= 0) return [];
    return [tokenId];
  });
  return [...new Set(tokenIds)];
}

function feeLabel(fee: number) {
  return `${fee / 10_000}%`;
}

function positionRows(
  wallet: string,
  state: V3PositionState,
  poolAddress: Address,
  sqrtPriceX96: bigint,
  currentTick: number,
  poolLiquidity: bigint,
  assets: Map<string, RobinhoodAsset>,
) {
  const token0 = tokenDetails(state.token0, assets);
  const token1 = tokenDetails(state.token1, assets);
  if (poolLiquidity <= BigInt(0)) return [];
  const principal = amountsForLiquidity(
    sqrtPriceX96,
    state.tickLower,
    state.tickUpper,
    state.liquidity,
  );
  const rawAmounts = [
    principal.amount0 + state.tokensOwed0,
    principal.amount1 + state.tokensOwed1,
  ];
  const addresses = [state.token0, state.token1];
  const tokens = [token0, token1];
  const inRange = currentTick >= state.tickLower && currentTick < state.tickUpper;

  return addresses.flatMap((address, index): ProtocolPosition[] => {
    const asset = assets.get(address.toLowerCase());
    const amount = rawAmounts[index];
    if (!asset || amount <= BigInt(0)) return [];
    const counterparty = tokens[index === 0 ? 1 : 0];
    return [{
      id: `uniswap-v3:${wallet.toLowerCase()}:${state.tokenId}:${address.toLowerCase()}`,
      protocol: "uniswap-v3",
      wallet,
      kind: "dex_liquidity",
      marketAddress: poolAddress,
      marketName: `${token0.symbol}/${token1.symbol} ${feeLabel(state.fee)}`,
      symbol: asset.tokenSymbol.toUpperCase(),
      assetAddress: address,
      amount: formatUnits(amount, asset.tokenDecimals ?? 18),
      valueUsd: null,
      counterpartySymbol: counterparty.symbol,
      healthFactor: null,
      positionReference: `NFT #${state.tokenId}`,
      positionStatus: inRange ? "active" : "out_of_range",
      hasCorporateAction: false,
      corporateAction: null,
    }];
  });
}

async function scanV3Wallet(wallet: string, assets: RobinhoodAsset[]) {
  if (!isAddress(wallet)) throw new Error("Invalid wallet address");
  const allTokenIds = await positionTokenIds(wallet);
  const tokenIds = allTokenIds.slice(0, MAX_POSITIONS_PER_WALLET);
  if (!tokenIds.length) return { positions: [] as ProtocolPosition[], partial: false };

  const client = publicClient();
  const positionResults = await client.multicall({
    allowFailure: true,
    contracts: tokenIds.map((tokenId) => ({
      address: UNISWAP_V3_POSITION_MANAGER,
      abi: positionManagerAbi,
      functionName: "positions" as const,
      args: [BigInt(tokenId)] as const,
    })),
  });

  const decoded = positionResults.flatMap((result, index): V3PositionState[] => {
    if (result.status !== "success") return [];
    const value = result.result;
    return [{
      tokenId: tokenIds[index],
      token0: getAddress(value[2]),
      token1: getAddress(value[3]),
      fee: value[4],
      tickLower: value[5],
      tickUpper: value[6],
      liquidity: value[7],
      tokensOwed0: value[10],
      tokensOwed1: value[11],
    }];
  }).filter((position) => (
    position.liquidity > BigInt(0)
    || position.tokensOwed0 > BigInt(0)
    || position.tokensOwed1 > BigInt(0)
  ));

  const poolResults = await client.multicall({
    allowFailure: true,
    contracts: decoded.map((position) => ({
      address: UNISWAP_V3_FACTORY,
      abi: factoryAbi,
      functionName: "getPool" as const,
      args: [position.token0, position.token1, position.fee] as const,
    })),
  });
  const pools = decoded.flatMap((position, index) => {
    const result = poolResults[index];
    if (result.status !== "success" || result.result === zeroAddress) return [];
    return [{ position, poolAddress: getAddress(result.result) }];
  });

  const slot0Results = await client.multicall({
    allowFailure: true,
    contracts: pools.map(({ poolAddress }) => ({
      address: poolAddress,
      abi: poolAbi,
      functionName: "slot0" as const,
    })),
  });
  const liquidityResults = await client.multicall({
    allowFailure: true,
    contracts: pools.map(({ poolAddress }) => ({
      address: poolAddress,
      abi: poolAbi,
      functionName: "liquidity" as const,
    })),
  });
  const stockTokens = stockTokensByAddress(assets);
  const readablePools = pools.flatMap(({ position, poolAddress }, index) => {
    const slot0 = slot0Results[index];
    const liquidity = liquidityResults[index];
    if (slot0.status !== "success" || liquidity.status !== "success") return [];
    return [{ position, poolAddress, slot0: slot0.result, liquidity: liquidity.result }];
  });
  const positions = readablePools.flatMap(({ position, poolAddress, slot0, liquidity }) => (
    positionRows(
      getAddress(wallet),
      position,
      poolAddress,
      slot0[0],
      slot0[1],
      liquidity,
      stockTokens,
    )
  ));

  const failedReads = positionResults.filter((result) => result.status !== "success").length
    + poolResults.length - pools.length
    + pools.length - readablePools.length;
  const truncated = allTokenIds.length > tokenIds.length;
  const partial = failedReads > 0 || truncated;
  const warning = truncated
    ? `Uniswap V3 scan is limited to ${MAX_POSITIONS_PER_WALLET} LP NFTs per wallet.`
    : failedReads > 0
      ? "One or more Uniswap V3 positions could not be decoded."
      : undefined;
  return { positions, partial, warning };
}

export const uniswapV3Adapter: ProtocolExposureAdapter = {
  id: "uniswap-v3",
  scan: ({ wallet, assets }) => scanV3Wallet(wallet, assets),
};
