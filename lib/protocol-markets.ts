import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  parseAbiItem,
  zeroAddress,
  type Address,
} from "viem";
import { robinhoodMainnet } from "@/lib/chain";
import type { ProtocolMarketScan } from "@/lib/protocol-exposure";
import type { RobinhoodAsset } from "@/lib/robinhood";

const UNISWAP_V4_POOL_MANAGER = "0x8366a39cc670b4001a1121b8f6a443a643e40951" as Address;
const initializeEvent = parseAbiItem("event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)");

function rpcUrl() {
  return process.env.ROBINHOOD_RPC_URL?.trim()
    || process.env.NEXT_PUBLIC_RPC_URL?.trim()
    || robinhoodMainnet.rpcUrls.default.http[0];
}

function tokenMap(assets: RobinhoodAsset[]) {
  return new Map(assets.flatMap((asset) => asset.deployments
    .filter((deployment) => deployment.chainId === robinhoodMainnet.id && isAddress(deployment.contractAddress))
    .map((deployment) => [getAddress(deployment.contractAddress).toLowerCase(), asset.tokenSymbol.toUpperCase()] as const)));
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function scanUniswapV4Markets(
  assets: RobinhoodAsset[],
  symbols: string[],
): Promise<ProtocolMarketScan> {
  const normalizedSymbols = new Set(symbols.map((symbol) => symbol.toUpperCase()));
  if (!normalizedSymbols.size) return { status: "live", markets: [] };

  const byAddress = tokenMap(assets);
  const addresses = assets.flatMap((asset) => {
    if (!normalizedSymbols.has(asset.tokenSymbol.toUpperCase())) return [];
    return asset.deployments
      .filter((deployment) => deployment.chainId === robinhoodMainnet.id && isAddress(deployment.contractAddress))
      .map((deployment) => getAddress(deployment.contractAddress));
  });
  if (!addresses.length) return { status: "live", markets: [] };

  const client = createPublicClient({
    chain: robinhoodMainnet,
    transport: http(rpcUrl(), { timeout: 15_000 }),
  });

  try {
    const [currency0Logs, currency1Logs] = await Promise.all([
      client.getLogs({
        address: UNISWAP_V4_POOL_MANAGER,
        event: initializeEvent,
        args: { currency0: addresses },
        fromBlock: BigInt(0),
        toBlock: "latest",
      }),
      client.getLogs({
        address: UNISWAP_V4_POOL_MANAGER,
        event: initializeEvent,
        args: { currency1: addresses },
        fromBlock: BigInt(0),
        toBlock: "latest",
      }),
    ]);

    const seen = new Set<string>();
    const markets = [...currency0Logs, ...currency1Logs].flatMap((log) => {
      const { id, currency0, currency1, fee } = log.args;
      if (!id || !currency0 || !currency1 || fee === undefined) return [];
      const symbol0 = byAddress.get(currency0.toLowerCase());
      const symbol1 = byAddress.get(currency1.toLowerCase());
      const watchedSymbol = symbol0 && normalizedSymbols.has(symbol0) ? symbol0 : symbol1;
      if (!watchedSymbol || !normalizedSymbols.has(watchedSymbol)) return [];
      const counterpartyAddress = watchedSymbol === symbol0 ? currency1 : currency0;
      const counterparty = counterpartyAddress.toLowerCase() === zeroAddress
        ? "ETH"
        : byAddress.get(counterpartyAddress.toLowerCase()) ?? shortAddress(counterpartyAddress);
      const key = `${id}:${watchedSymbol}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{
        id: key,
        protocol: "uniswap-v4" as const,
        symbol: watchedSymbol,
        counterparty,
        poolId: id,
        fee: `${(Number(fee) / 10_000).toLocaleString("en-US", { maximumFractionDigits: 4 })}%`,
      }];
    });

    return { status: "live", markets };
  } catch (error) {
    return {
      status: "unavailable",
      markets: [],
      warning: error instanceof Error ? error.message : "Uniswap V4 market discovery unavailable",
    };
  }
}
