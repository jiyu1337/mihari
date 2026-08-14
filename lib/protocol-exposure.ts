import type { RobinhoodAsset } from "@/lib/robinhood";
import type { EventSeverity } from "@/lib/product-data";

export type ProtocolPositionKind =
  | "lending_supply"
  | "lending_collateral"
  | "lending_borrow"
  | "vault_deposit";

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

export interface ProtocolExposureAdapter {
  readonly id: string;
  scan(context: ProtocolAdapterContext): Promise<ProtocolPosition[]>;
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
      result.status === "fulfilled" ? result.value : []
    ));
    const rejected = walletResults.filter((result) => result.status === "rejected");
    const fulfilledCount = walletResults.length - rejected.length;
    return { adapter, positions, rejected, fulfilledCount };
  }));

  const positions = results.flatMap((result) => result.positions);

  const scans = results.map(({ adapter, positions: adapterPositions, rejected, fulfilledCount }) => {
    return {
      protocol: adapter.id,
      status: rejected.length
        ? (fulfilledCount ? "partial" as const : "unavailable" as const)
        : "live" as const,
      positionCount: adapterPositions.length,
      warning: rejected.length
        ? [...new Set(rejected.map((result) => (
            result.reason instanceof Error ? result.reason.message : "Protocol data unavailable"
          )))].join("; ")
        : undefined,
    };
  });

  return { positions, scans, scannedAt: new Date().toISOString() };
}
