import { formatUnits, getAddress, isAddress } from "viem";
import { getAssetCatalog, getMarketSnapshot, type RobinhoodAsset } from "@/lib/robinhood";
import { MHR_CONTRACT_ADDRESS } from "@/lib/token";

const BLOCKSCOUT_API = "https://robinhoodchain.blockscout.com/api/v2";

type BlockscoutBalance = {
  value: string;
  token: {
    address_hash: string;
    decimals: string | null;
    symbol: string | null;
    name: string | null;
    exchange_rate: string | null;
  };
};

type WalletBalanceResult = {
  wallet: string;
  balances: BlockscoutBalance[];
};

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

function stockTokenByAddress(assets: RobinhoodAsset[]) {
  return new Map(
    assets.flatMap((asset) => asset.deployments
      .filter((deployment) => deployment.chainId === 4663)
      .map((deployment) => [deployment.contractAddress.toLowerCase(), asset] as const)),
  );
}

function validWalletAddresses(addresses: string[]) {
  return addresses.filter((address) => isAddress(address)).map(getAddress);
}

async function fetchWalletBalances(addresses: string[]) {
  const validAddresses = validWalletAddresses(addresses);
  const responses = await Promise.allSettled(validAddresses.map(async (wallet): Promise<WalletBalanceResult> => {
    const response = await fetch(`${BLOCKSCOUT_API}/addresses/${wallet}/token-balances`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Blockscout responded ${response.status}`);
    return { wallet, balances: await response.json() as BlockscoutBalance[] };
  }));
  return { validAddresses, responses };
}

function mhrHoldingsFromResponses(
  validAddresses: string[],
  responses: PromiseSettledResult<WalletBalanceResult>[],
): MhrHolding[] {
  return responses.map((result, index) => {
    const wallet = validAddresses[index]!;
    if (result.status !== "fulfilled") return { wallet, balance: null, status: "unavailable" };

    const holding = result.value.balances.find(
      (balance) => balance.token.address_hash.toLowerCase() === MHR_CONTRACT_ADDRESS.toLowerCase(),
    );
    if (!holding || BigInt(holding.value) === BigInt(0)) {
      return { wallet, balance: "0", status: "not_held" };
    }

    return {
      wallet,
      balance: formatUnits(BigInt(holding.value), Number(holding.token.decimals ?? 18)),
      status: "holder",
    };
  });
}

export async function getMhrHoldings(addresses: string[]) {
  const { validAddresses, responses } = await fetchWalletBalances(addresses);
  return mhrHoldingsFromResponses(validAddresses, responses);
}

export async function mapWalletPositions(addresses: string[]) {
  const validAddresses = validWalletAddresses(addresses);
  if (!validAddresses.length) return { positions: [], events: [], mhrHoldings: [], scannedAt: new Date().toISOString() };

  const assets = await getAssetCatalog().catch(() => []);
  const assetsByAddress = stockTokenByAddress(assets);
  const { responses: balanceResponses } = await fetchWalletBalances(validAddresses);

  const rawPositions = balanceResponses.flatMap((result) => {
    if (result.status !== "fulfilled") return [];
    return result.value.balances.flatMap((balance) => {
      const asset = assetsByAddress.get(balance.token.address_hash.toLowerCase());
      if (!asset || BigInt(balance.value) === BigInt(0)) return [];
      const decimals = Number(balance.token.decimals ?? 18);
      return [{
        wallet: result.value.wallet,
        asset,
        contractAddress: balance.token.address_hash,
        balance: formatUnits(BigInt(balance.value), decimals),
      }];
    });
  });

  const mhrHoldings = mhrHoldingsFromResponses(validAddresses, balanceResponses);

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
      name: position.asset.tokenName.replace(" • Robinhood Token", ""),
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
    scannedAt: new Date().toISOString(),
  };
}
