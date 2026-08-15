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

async function scanOfficialBalances(wallets: Address[], contracts: StockTokenContract[]) {
  const client = publicClient();
  return Promise.allSettled(wallets.map(async (wallet) => ({
    wallet,
    balances: await client.multicall({
      allowFailure: true,
      contracts: contracts.map((token) => ({
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf" as const,
        args: [wallet] as const,
      })),
    }),
  })));
}

export async function getMhrHoldings(addresses: string[]) {
  const wallets = validWalletAddresses(addresses);
  if (!wallets.length) return [];

  const client = publicClient();
  try {
    const results = await client.multicall({
      allowFailure: true,
      contracts: wallets.map((wallet) => ({
        address: getAddress(MHR_CONTRACT_ADDRESS),
        abi: erc20Abi,
        functionName: "balanceOf" as const,
        args: [wallet] as const,
      })),
    });

    return results.map((result, index): MhrHolding => {
      const wallet = wallets[index]!;
      if (result.status === "failure") return { wallet, balance: null, status: "unavailable" };
      const balance = result.result;
      return {
        wallet,
        balance: formatUnits(balance, 18),
        status: balance > BigInt(0) ? "holder" : "not_held",
      };
    });
  } catch {
    return wallets.map((wallet) => ({ wallet, balance: null, status: "unavailable" as const }));
  }
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
