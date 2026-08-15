import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  getAddress,
  http,
  isAddress,
  type Address,
} from "viem";
import { robinhoodMainnet } from "@/lib/chain";
import { getAssetCatalog, getMarketSnapshot, type RobinhoodAsset } from "@/lib/robinhood";
import { MHR_CONTRACT_ADDRESS } from "@/lib/token";

const BLOCKSCOUT_API = "https://robinhoodchain.blockscout.com/api/v2";

export type MappedPosition = {
  wallet: string;
  symbol: string;
  name: string;
  contractAddress: string;
  balance: string;
  price: string | null;
  valueUsd: string | null;
  hasCorporateAction: boolean;
};

export type MhrHolding = {
  wallet: string;
  balance: string | null;
  status: "holder" | "not_held" | "unavailable";
};

type StockTokenContract = {
  address: Address;
  asset: RobinhoodAsset;
  decimals: number;
};

type WalletStockScan = {
  wallet: Address;
  balances: Array<{ status: "success"; result: bigint } | { status: "failure" }>;
  source: "rpc" | "blockscout";
};

type BlockscoutBalance = {
  value?: string;
  token?: {
    address_hash?: string;
    decimals?: string | null;
  };
};

function rpcUrl() {
  return process.env.ROBINHOOD_RPC_URL?.trim()
    || process.env.NEXT_PUBLIC_RPC_URL?.trim()
    || robinhoodMainnet.rpcUrls.default.http[0];
}

function publicClient() {
  return createPublicClient({
    chain: robinhoodMainnet,
    transport: http(rpcUrl(), { timeout: 12_000 }),
  });
}

function validWalletAddresses(addresses: string[]) {
  return [...new Set(addresses.filter((address) => isAddress(address)).map(getAddress))];
}

function stockTokenContracts(assets: RobinhoodAsset[]): StockTokenContract[] {
  const seen = new Set<string>();
  return assets.flatMap((asset) => asset.deployments
    .filter((deployment) => deployment.chainId === robinhoodMainnet.id && isAddress(deployment.contractAddress))
    .flatMap((deployment) => {
      const address = getAddress(deployment.contractAddress);
      if (seen.has(address.toLowerCase())) return [];
      seen.add(address.toLowerCase());
      return [{ address, asset, decimals: asset.tokenDecimals ?? 18 }];
    }));
}

async function scanRpcWallet(wallet: Address, contracts: StockTokenContract[]): Promise<WalletStockScan> {
  const client = publicClient();
  const balances = await client.multicall({
    allowFailure: true,
    contracts: contracts.map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [wallet] as const,
    })),
  });
  if (!balances.some((balance) => balance.status === "success")) {
    throw new Error("Robinhood Chain RPC returned no readable balances");
  }
  return { wallet, balances, source: "rpc" };
}

async function scanBlockscoutWallet(wallet: Address, contracts: StockTokenContract[]): Promise<WalletStockScan> {
  const response = await fetch(`${BLOCKSCOUT_API}/addresses/${wallet}/token-balances`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Blockscout responded ${response.status}`);
  const payload = await response.json() as BlockscoutBalance[];
  const byAddress = new Map(payload.flatMap((balance) => {
    const address = balance.token?.address_hash?.toLowerCase();
    if (!address || balance.value === undefined) return [];
    try {
      return [[address, BigInt(balance.value)] as const];
    } catch {
      return [];
    }
  }));
  return {
    wallet,
    balances: contracts.map((token) => ({
      status: "success" as const,
      result: byAddress.get(token.address.toLowerCase()) ?? BigInt(0),
    })),
    source: "blockscout",
  };
}

async function scanOfficialBalances(wallets: Address[], contracts: StockTokenContract[]) {
  return Promise.allSettled(wallets.map((wallet) => Promise.any([
    scanRpcWallet(wallet, contracts),
    scanBlockscoutWallet(wallet, contracts),
  ])));
}

async function readMhrFromRpc(wallet: Address) {
  return publicClient().readContract({
    address: getAddress(MHR_CONTRACT_ADDRESS),
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [wallet],
  });
}

async function readMhrFromBlockscout(wallet: Address) {
  const response = await fetch(`${BLOCKSCOUT_API}/addresses/${wallet}/token-balances`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Blockscout responded ${response.status}`);
  const payload = await response.json() as BlockscoutBalance[];
  const holding = payload.find((balance) => (
    balance.token?.address_hash?.toLowerCase() === MHR_CONTRACT_ADDRESS.toLowerCase()
  ));
  return BigInt(holding?.value ?? "0");
}

export async function getMhrHoldings(addresses: string[]) {
  const wallets = validWalletAddresses(addresses);
  if (!wallets.length) return [];

  const results = await Promise.allSettled(wallets.map((wallet) => Promise.any([
    readMhrFromRpc(wallet),
    readMhrFromBlockscout(wallet),
  ])));

  return results.map((result, index): MhrHolding => {
    const wallet = wallets[index]!;
    if (result.status === "rejected") return { wallet, balance: null, status: "unavailable" };
    const balance = result.value;
      return {
        wallet,
        balance: formatUnits(balance, 18),
        status: balance > BigInt(0) ? "holder" : "not_held",
      };
  });
}

export async function mapWalletPositions(addresses: string[]) {
  const validAddresses = validWalletAddresses(addresses);
  if (!validAddresses.length) {
    return {
      positions: [],
      events: [],
      mhrHoldings: [],
      sourceStatus: "live" as const,
      scannedAt: new Date().toISOString(),
    };
  }

  const assets = await getAssetCatalog();
  const contracts = stockTokenContracts(assets);
  if (!contracts.length) throw new Error("Official Robinhood Stock Token catalog is unavailable");

  const [walletScans, mhrHoldings] = await Promise.all([
    scanOfficialBalances(validAddresses, contracts),
    getMhrHoldings(validAddresses),
  ]);

  const fulfilledScans = walletScans.filter((result) => result.status === "fulfilled");
  const sourceStatus = fulfilledScans.length === walletScans.length
    ? "live" as const
    : fulfilledScans.length
      ? "partial" as const
      : "unavailable" as const;

  const rawPositions = walletScans.flatMap((scan) => {
    if (scan.status !== "fulfilled") return [];
    return scan.value.balances.flatMap((balance, index) => {
      const token = contracts[index];
      if (!token || balance.status === "failure" || balance.result === BigInt(0)) return [];
      return [{
        wallet: scan.value.wallet,
        asset: token.asset,
        contractAddress: token.address,
        balance: formatUnits(balance.result, token.decimals),
      }];
    });
  });

  const symbols = [...new Set(rawPositions.map((position) => position.asset.tokenSymbol))];
  const snapshot = symbols.length ? await getMarketSnapshot(symbols) : null;
  const liveSnapshot = snapshot?.mode === "live" ? snapshot : null;
  const prices = new Map(liveSnapshot?.prices.map((price) => [price.tokenSymbol.toUpperCase(), price]) ?? []);
  const eventSymbols = new Set(liveSnapshot?.events.map((event) => event.asset.toUpperCase()) ?? []);

  const positions: MappedPosition[] = rawPositions.map((position) => {
    const quote = prices.get(position.asset.tokenSymbol.toUpperCase());
    const price = quote ? (Number(quote.bid) + Number(quote.ask)) / 2 : null;
    const valueUsd = price === null ? null : Number(position.balance) * price;
    return {
      wallet: position.wallet,
      symbol: position.asset.tokenSymbol,
      name: position.asset.tokenName.replace(" â€¢ Robinhood Token", ""),
      contractAddress: position.contractAddress,
      balance: position.balance,
      price: price === null ? null : price.toFixed(2),
      valueUsd: valueUsd === null ? null : valueUsd.toFixed(2),
      hasCorporateAction: eventSymbols.has(position.asset.tokenSymbol.toUpperCase()),
    };
  });

  return {
    positions,
    events: liveSnapshot?.events ?? [],
    mhrHoldings,
    sourceStatus,
    warning: sourceStatus === "live" ? undefined : "One or more wallet scans could not reach Robinhood Chain RPC.",
    scannedAt: new Date().toISOString(),
  };
}
