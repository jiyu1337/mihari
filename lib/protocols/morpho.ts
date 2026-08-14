import type {
  ProtocolExposureAdapter,
  ProtocolPosition,
  ProtocolPositionKind,
} from "@/lib/protocol-exposure";
import { stockTokenSymbolsByAddress } from "@/lib/protocol-exposure";

const MORPHO_GRAPHQL_URL = "https://api.morpho.org/graphql";

const USER_EXPOSURE_QUERY = `
  query GetMihariExposure($address: String!, $chainId: Int!) {
    userByAddress(address: $address, chainId: $chainId) {
      marketPositions {
        market {
          marketId
          lltv
          loanAsset { address symbol }
          collateralAsset { address symbol }
        }
        state {
          supplyAssets
          supplyAssetsUsd
          borrowAssets
          borrowAssetsUsd
          collateral
          collateralUsd
        }
      }
      vaultPositions {
        vault {
          address
          name
          symbol
          asset { address symbol }
        }
        state { assets assetsUsd shares }
      }
      vaultV2Positions {
        vault {
          address
          name
          symbol
          asset { address symbol }
        }
        assets
        assetsUsd
        shares
      }
    }
  }
`;

type MorphoAsset = {
  address: string;
  symbol: string;
};

type MorphoMarketPosition = {
  market: {
    marketId: string;
    lltv: string | number | null;
    loanAsset: MorphoAsset;
    collateralAsset: MorphoAsset | null;
  };
  state: {
    supplyAssets: string | number | null;
    supplyAssetsUsd: string | number | null;
    borrowAssets: string | number | null;
    borrowAssetsUsd: string | number | null;
    collateral: string | number | null;
    collateralUsd: string | number | null;
  };
};

type MorphoVaultPosition = {
  vault: {
    address: string;
    name: string | null;
    symbol: string | null;
    asset: MorphoAsset;
  };
  state: {
    assets: string | number | null;
    assetsUsd: string | number | null;
    shares: string | number | null;
  };
};

type MorphoVaultV2Position = {
  vault: MorphoVaultPosition["vault"];
  assets: string | number | null;
  assetsUsd: string | number | null;
  shares: string | number | null;
};

type MorphoResponse = {
  data?: {
    userByAddress?: {
      marketPositions?: MorphoMarketPosition[];
      vaultPositions?: MorphoVaultPosition[];
      vaultV2Positions?: MorphoVaultV2Position[];
    } | null;
  };
  errors?: Array<{ message?: string }>;
};

function decimal(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "0";
  return String(value);
}

function hasAmount(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0;
}

function usd(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : null;
}

function healthFactor(position: MorphoMarketPosition) {
  const collateralUsd = Number(position.state.collateralUsd ?? 0);
  const borrowUsd = Number(position.state.borrowAssetsUsd ?? 0);
  const lltv = Number(position.market.lltv ?? 0);
  if (!(collateralUsd > 0) || !(borrowUsd > 0) || !(lltv > 0)) return null;

  const normalizedLltv = lltv > 1 ? lltv / 1e18 : lltv;
  const value = collateralUsd * normalizedLltv / borrowUsd;
  return Number.isFinite(value) ? value.toFixed(2) : null;
}

function marketPosition(
  wallet: string,
  market: MorphoMarketPosition,
  kind: ProtocolPositionKind,
  asset: MorphoAsset,
  symbol: string,
  amount: string | number | null,
  valueUsd: string | number | null,
  counterpartySymbol: string | null,
): ProtocolPosition {
  return {
    id: `morpho:${wallet.toLowerCase()}:${market.market.marketId}:${kind}`,
    protocol: "morpho",
    wallet,
    kind,
    marketAddress: market.market.marketId,
    marketName: `${market.market.collateralAsset?.symbol ?? "NO COLLATERAL"} / ${market.market.loanAsset.symbol}`,
    symbol,
    assetAddress: asset.address,
    amount: decimal(amount),
    valueUsd: usd(valueUsd),
    counterpartySymbol,
    healthFactor: healthFactor(market),
    hasCorporateAction: false,
    corporateAction: null,
  };
}

function vaultPosition(
  wallet: string,
  version: "V1" | "V2",
  vault: MorphoVaultPosition["vault"],
  symbol: string,
  amount: string | number | null,
  valueUsd: string | number | null,
): ProtocolPosition {
  return {
    id: `morpho:${wallet.toLowerCase()}:${vault.address.toLowerCase()}:vault-${version.toLowerCase()}`,
    protocol: "morpho",
    wallet,
    kind: "vault_deposit",
    marketAddress: vault.address,
    marketName: vault.name || vault.symbol || `Morpho Vault ${version}`,
    symbol,
    assetAddress: vault.asset.address,
    amount: decimal(amount),
    valueUsd: usd(valueUsd),
    counterpartySymbol: null,
    healthFactor: null,
    hasCorporateAction: false,
    corporateAction: null,
  };
}

async function fetchMorphoPositions(wallet: string): Promise<MorphoResponse> {
  const response = await fetch(MORPHO_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: USER_EXPOSURE_QUERY,
      variables: { address: wallet, chainId: 4663 },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error(`Morpho API responded ${response.status}`);
  const payload = await response.json() as MorphoResponse;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).filter(Boolean).join("; ") || "Morpho query failed");
  }
  return payload;
}

export const morphoAdapter: ProtocolExposureAdapter = {
  id: "morpho",
  async scan({ wallet, assets }) {
    const stockTokens = stockTokenSymbolsByAddress(assets);
    const user = (await fetchMorphoPositions(wallet)).data?.userByAddress;
    if (!user) return [];

    const marketPositions = (user.marketPositions ?? []).flatMap((position) => {
      const rows: ProtocolPosition[] = [];
      const loanSymbol = stockTokens.get(position.market.loanAsset.address.toLowerCase());
      const collateralSymbol = position.market.collateralAsset
        ? stockTokens.get(position.market.collateralAsset.address.toLowerCase())
        : undefined;

      if (loanSymbol && hasAmount(position.state.supplyAssets)) {
        rows.push(marketPosition(
          wallet,
          position,
          "lending_supply",
          position.market.loanAsset,
          loanSymbol,
          position.state.supplyAssets,
          position.state.supplyAssetsUsd,
          position.market.collateralAsset?.symbol ?? null,
        ));
      }
      if (loanSymbol && hasAmount(position.state.borrowAssets)) {
        rows.push(marketPosition(
          wallet,
          position,
          "lending_borrow",
          position.market.loanAsset,
          loanSymbol,
          position.state.borrowAssets,
          position.state.borrowAssetsUsd,
          position.market.collateralAsset?.symbol ?? null,
        ));
      }
      if (collateralSymbol && position.market.collateralAsset && hasAmount(position.state.collateral)) {
        rows.push(marketPosition(
          wallet,
          position,
          "lending_collateral",
          position.market.collateralAsset,
          collateralSymbol,
          position.state.collateral,
          position.state.collateralUsd,
          position.market.loanAsset.symbol,
        ));
      }
      return rows;
    });

    const vaultPositions = (user.vaultPositions ?? []).flatMap((position) => {
      const symbol = stockTokens.get(position.vault.asset.address.toLowerCase());
      if (!symbol || !hasAmount(position.state.assets)) return [];
      return [vaultPosition(
        wallet,
        "V1",
        position.vault,
        symbol,
        position.state.assets,
        position.state.assetsUsd,
      )];
    });

    const vaultV2Positions = (user.vaultV2Positions ?? []).flatMap((position) => {
      const symbol = stockTokens.get(position.vault.asset.address.toLowerCase());
      if (!symbol || !hasAmount(position.assets)) return [];
      return [vaultPosition(wallet, "V2", position.vault, symbol, position.assets, position.assetsUsd)];
    });

    return [...marketPositions, ...vaultPositions, ...vaultV2Positions];
  },
};
