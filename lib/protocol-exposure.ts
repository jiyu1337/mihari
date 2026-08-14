import type { RobinhoodAsset } from "@/lib/robinhood";
import type { EventSeverity } from "@/lib/product-data";

export type ProtocolPositionKind =
  | "lending_supply"
  | "lending_collateral"
  | "lending_borrow"
  | "vault_deposit"
  | "dex_liquidity";

export type ProtocolIntegrationStage = "live" | "beta" | "planned";

export type ProtocolCategory = "lending" | "dex" | "perps" | "oracle";

export type ProtocolDefinition = {
  id: string;
  name: string;
  category: ProtocolCategory;
  stage: ProtocolIntegrationStage;
  description: string;
  capabilities: string[];
};

export type ProtocolPosition = {
  id: string;
  protocol: string;
  wallet: string;
  kind: ProtocolPositionKind;
  marketAddress: string;
  marketName: string;
  symbol: string;
  assetAddress: string;
  amount: string;
  valueUsd: string | null;
  counterpartySymbol: string | null;
  healthFactor: string | null;
  positionReference?: string | null;
  positionStatus?: "active" | "out_of_range" | null;
  hasCorporateAction: boolean;
  corporateAction: {
    id: string;
    type: string;
    status: string;
    severity: EventSeverity;
  } | null;
};

export type ProtocolScan = {
  protocol: string;
  status: "live" | "partial" | "unavailable" | "not_scanned";
  positionCount: number;
  warning?: string;
};

export type ProtocolExposureSnapshot = {
  positions: ProtocolPosition[];
  scans: ProtocolScan[];
  scannedAt: string;
};

export type ProtocolAdapterContext = {
  wallet: string;
  assets: RobinhoodAsset[];
};

export type ProtocolAdapterResult = {
  positions: ProtocolPosition[];
  partial?: boolean;
  warning?: string;
};

export interface ProtocolExposureAdapter {
  readonly id: string;
  scan(context: ProtocolAdapterContext): Promise<ProtocolAdapterResult>;
}

export function stockTokenSymbolsByAddress(assets: RobinhoodAsset[]) {
  return new Map(
    assets.flatMap((asset) => asset.deployments
      .filter((deployment) => deployment.chainId === 4663)
      .map((deployment) => [
        deployment.contractAddress.toLowerCase(),
        asset.tokenSymbol.toUpperCase(),
      ] as const)),
  );
}

export async function scanProtocolExposure(
  wallets: string[],
  assets: RobinhoodAsset[],
  adapters: ProtocolExposureAdapter[],
): Promise<ProtocolExposureSnapshot> {
  const results = await Promise.all(adapters.map(async (adapter) => {
    const walletResults = await Promise.allSettled(
      wallets.map((wallet) => adapter.scan({ wallet, assets })),
    );
    const positions = walletResults.flatMap((result) => (
      result.status === "fulfilled" ? result.value.positions : []
    ));
    const rejected = walletResults.filter((result) => result.status === "rejected");
    const fulfilledCount = walletResults.length - rejected.length;
    const partialResults = walletResults.filter((result) => (
      result.status === "fulfilled" && result.value.partial
    ));
    return { adapter, positions, rejected, fulfilledCount, partialResults };
  }));

  const positions = results.flatMap((result) => result.positions);

  const scans = results.map(({ adapter, positions: adapterPositions, rejected, fulfilledCount, partialResults }) => {
    const warnings = [
      ...rejected.map((result) => (
        result.reason instanceof Error ? result.reason.message : "Protocol data unavailable"
      )),
      ...partialResults.flatMap((result) => (
        result.status === "fulfilled" && result.value.warning ? [result.value.warning] : []
      )),
    ];
    return {
      protocol: adapter.id,
      status: rejected.length || partialResults.length
        ? (fulfilledCount ? "partial" as const : "unavailable" as const)
        : "live" as const,
      positionCount: adapterPositions.length,
      warning: warnings.length
        ? [...new Set(warnings)].join("; ")
        : undefined,
    };
  });

  return { positions, scans, scannedAt: new Date().toISOString() };
}
