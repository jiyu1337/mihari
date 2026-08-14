import "server-only";

import {
  createPublicClient,
  encodeAbiParameters,
  formatUnits,
  getAddress,
  http,
  isAddress,
  keccak256,
  parseAbi,
  parseAbiParameters,
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
const TICK_MASK = BigInt("0xffffff");
const TICK_SIGN_BIT = BigInt("0x800000");
const TICK_MODULUS = BigInt("0x1000000");
const DYNAMIC_FEE_FLAG = 0x800000;

export const UNISWAP_V4_POSITION_MANAGER = getAddress(
  "0x58daec3116aae6d93017baaea7749052e8a04fa7",
);
const UNISWAP_V4_STATE_VIEW = getAddress(
  "0xf3334192d15450cdd385c8b70e03f9a6bd9e673b",
);

const positionManagerAbi = parseAbi([
  "function getPoolAndPositionInfo(uint256 tokenId) view returns ((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, uint256 info)",
  "function getPositionLiquidity(uint256 tokenId) view returns (uint128 liquidity)",
]);
const stateViewAbi = parseAbi([
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
]);
const poolKeyParameters = parseAbiParameters(
  "address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks",
);

type BlockscoutTokenBalance = {
  value?: string;
  token_id?: string | null;
  token_instance?: { id?: string | null } | null;
  token: {
    address_hash: string;
    type?: string | null;
  };
};

type V4PoolKey = {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
};

type V4PositionState = {
  tokenId: string;
  poolKey: V4PoolKey;
  poolId: `0x${string}`;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
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
    if (balance.token.address_hash.toLowerCase() !== UNISWAP_V4_POSITION_MANAGER.toLowerCase()) {
      return [];
    }
    const tokenId = balance.token_id ?? balance.token_instance?.id;
    if (!tokenId || Number(balance.value ?? 1) <= 0) return [];
    return [tokenId];
  });
  return [...new Set(tokenIds)];
}

function signedTick(info: bigint, offset: bigint) {
  const value = (info >> offset) & TICK_MASK;
  return Number((value & TICK_SIGN_BIT) === BigInt(0) ? value : value - TICK_MODULUS);
}

function poolId(poolKey: V4PoolKey) {
  return keccak256(encodeAbiParameters(poolKeyParameters, [
    poolKey.currency0,
    poolKey.currency1,
    poolKey.fee,
    poolKey.tickSpacing,
    poolKey.hooks,
  ]));
}

function feeLabel(fee: number) {
  return (fee & DYNAMIC_FEE_FLAG) !== 0 ? "dynamic fee" : `${fee / 10_000}%`;
}

function positionRows(
  wallet: string,
  state: V4PositionState,
  sqrtPriceX96: bigint,
  currentTick: number,
  assets: Map<string, RobinhoodAsset>,
) {
  const token0 = tokenDetails(state.poolKey.currency0, assets);
  const token1 = tokenDetails(state.poolKey.currency1, assets);
  const principal = amountsForLiquidity(
    sqrtPriceX96,
    state.tickLower,
    state.tickUpper,
    state.liquidity,
  );
  const rawAmounts = [principal.amount0, principal.amount1];
  const addresses = [state.poolKey.currency0, state.poolKey.currency1];
  const tokens = [token0, token1];
  const inRange = currentTick >= state.tickLower && currentTick < state.tickUpper;

  return addresses.flatMap((address, index): ProtocolPosition[] => {
    const asset = assets.get(address.toLowerCase());
    const amount = rawAmounts[index];
    if (!asset || amount <= BigInt(0)) return [];
    const counterparty = tokens[index === 0 ? 1 : 0];
    return [{
      id: `uniswap-v4:${wallet.toLowerCase()}:${state.tokenId}:${address.toLowerCase()}`,
      protocol: "uniswap-v4",
      wallet,
      kind: "dex_liquidity",
      marketAddress: state.poolId,
      marketName: `${token0.symbol}/${token1.symbol} ${feeLabel(state.poolKey.fee)}`,
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

async function scanV4Wallet(wallet: string, assets: RobinhoodAsset[]) {
  if (!isAddress(wallet)) throw new Error("Invalid wallet address");
  const allTokenIds = await positionTokenIds(wallet);
  const tokenIds = allTokenIds.slice(0, MAX_POSITIONS_PER_WALLET);
  if (!tokenIds.length) return { positions: [] as ProtocolPosition[], partial: false };

  const client = publicClient();
  const poolKeyResults = await client.multicall({
    allowFailure: true,
    contracts: tokenIds.map((tokenId) => ({
      address: UNISWAP_V4_POSITION_MANAGER,
      abi: positionManagerAbi,
      functionName: "getPoolAndPositionInfo" as const,
      args: [BigInt(tokenId)] as const,
    })),
  });
  const liquidityResults = await client.multicall({
    allowFailure: true,
    contracts: tokenIds.map((tokenId) => ({
      address: UNISWAP_V4_POSITION_MANAGER,
      abi: positionManagerAbi,
      functionName: "getPositionLiquidity" as const,
      args: [BigInt(tokenId)] as const,
    })),
  });

  const decoded = tokenIds.flatMap((tokenId, index): V4PositionState[] => {
    const poolResult = poolKeyResults[index];
    const liquidityResult = liquidityResults[index];
    if (poolResult.status !== "success" || liquidityResult.status !== "success") return [];
    const [rawPoolKey, info] = poolResult.result;
    if (liquidityResult.result <= BigInt(0)) return [];
    const key: V4PoolKey = {
      currency0: getAddress(rawPoolKey.currency0),
      currency1: getAddress(rawPoolKey.currency1),
      fee: rawPoolKey.fee,
      tickSpacing: rawPoolKey.tickSpacing,
      hooks: getAddress(rawPoolKey.hooks),
    };
    return [{
      tokenId,
      poolKey: key,
      poolId: poolId(key),
      tickLower: signedTick(info, BigInt(8)),
      tickUpper: signedTick(info, BigInt(32)),
      liquidity: liquidityResult.result,
    }];
  });

  const slot0Results = await client.multicall({
    allowFailure: true,
    contracts: decoded.map((position) => ({
      address: UNISWAP_V4_STATE_VIEW,
      abi: stateViewAbi,
      functionName: "getSlot0" as const,
      args: [position.poolId] as const,
    })),
  });
  const stockTokens = stockTokensByAddress(assets);
  const readablePositions = decoded.flatMap((position, index) => {
    const slot0 = slot0Results[index];
    if (slot0.status !== "success") return [];
    return [{ position, slot0: slot0.result }];
  });
  const positions = readablePositions.flatMap(({ position, slot0 }) => positionRows(
    getAddress(wallet),
    position,
    slot0[0],
    slot0[1],
    stockTokens,
  ));

  const failedReads = poolKeyResults.filter((result) => result.status !== "success").length
    + liquidityResults.filter((result) => result.status !== "success").length
    + decoded.length - readablePositions.length;
  const truncated = allTokenIds.length > tokenIds.length;
  const partial = failedReads > 0 || truncated;
  const warning = truncated
    ? `Uniswap V4 scan is limited to ${MAX_POSITIONS_PER_WALLET} LP NFTs per wallet.`
    : failedReads > 0
      ? "One or more Uniswap V4 positions could not be decoded."
      : undefined;
  return { positions, partial, warning };
}

export const uniswapV4Adapter: ProtocolExposureAdapter = {
  id: "uniswap-v4",
  scan: ({ wallet, assets }) => scanV4Wallet(wallet, assets),
};
