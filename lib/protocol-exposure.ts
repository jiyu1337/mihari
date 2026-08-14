import type { RobinhoodAsset } from "@/lib/robinhood";

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
};

export type ProtocolScan = {
  protocol: string;
  status: "live" | "unavailable";
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
    const rejected = walletResults.find((result) => result.status === "rejected");
    return { adapter, positions, rejected };
  }));

  const positions = results.flatMap((result) => result.positions);

  const scans = results.map(({ adapter, positions: adapterPositions, rejected }) => {
    return {
      protocol: adapter.id,
      status: rejected ? "unavailable" as const : "live" as const,
      positionCount: adapterPositions.length,
      warning: rejected
        ? (rejected.reason instanceof Error ? rejected.reason.message : "Protocol data unavailable")
        : undefined,
    };
  });

  return { positions, scans, scannedAt: new Date().toISOString() };
}
