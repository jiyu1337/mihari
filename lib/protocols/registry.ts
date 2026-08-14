import type {
  ProtocolDefinition,
  ProtocolExposureAdapter,
  ProtocolScan,
} from "@/lib/protocol-exposure";
import { morphoAdapter } from "@/lib/protocols/morpho";
import { uniswapV3Adapter } from "@/lib/protocols/uniswap-v3";
import { uniswapV4Adapter } from "@/lib/protocols/uniswap-v4";
import { arcusAdapter } from "@/lib/protocols/arcus";

export const protocolCatalog: ProtocolDefinition[] = [
  {
    id: "morpho",
    name: "Morpho",
    category: "lending",
    stage: "live",
    description: "Lending markets, collateral, borrowing and vault deposits.",
    capabilities: ["SUPPLY", "COLLATERAL", "BORROW", "VAULTS"],
  },
  {
    id: "uniswap-v3",
    name: "Uniswap V3",
    category: "dex",
    stage: "beta",
    description: "Concentrated liquidity positions containing official Stock Tokens.",
    capabilities: ["LP POSITIONS", "RANGE STATUS", "TOKEN EXPOSURE"],
  },
  {
    id: "uniswap-v4",
    name: "Uniswap V4",
    category: "dex",
    stage: "beta",
    description: "V4 liquidity positions containing official Stock Tokens.",
    capabilities: ["LP POSITIONS", "RANGE STATUS", "TOKEN EXPOSURE"],
  },
  {
    id: "rialto",
    name: "Rialto",
    category: "dex",
    stage: "planned",
    description: "PropAMM and routed liquidity exposure when position data is available.",
    capabilities: ["LIQUIDITY", "ROUTING"],
  },
  {
    id: "lighter",
    name: "Lighter",
    category: "perps",
    stage: "planned",
    description: "Perpetual positions, margin and Stock Token collateral exposure.",
    capabilities: ["PERPS", "MARGIN", "COLLATERAL"],
  },
  {
    id: "arcus",
    name: "Arcus",
    category: "perps",
    stage: "beta",
    description: "Public perpetual positions matched to official Stock Token symbols.",
    capabilities: ["PERPS", "LONG / SHORT", "MARGIN", "PNL"],
  },
  {
    id: "chainlink",
    name: "Chainlink",
    category: "oracle",
    stage: "planned",
    description: "Oracle dependency mapping for protocol prices and policy checks.",
    capabilities: ["PRICE FEEDS", "STALE DATA", "DEPENDENCIES"],
  },
];

export const protocolAdapters: ProtocolExposureAdapter[] = [
  morphoAdapter,
  uniswapV3Adapter,
  uniswapV4Adapter,
  arcusAdapter,
];

export function protocolScansWithCoverage(scans: ProtocolScan[], hasWallets: boolean) {
  const scanByProtocol = new Map(scans.map((scan) => [scan.protocol, scan]));
  return protocolCatalog.map((protocol) => scanByProtocol.get(protocol.id) ?? {
    protocol: protocol.id,
    status: "not_scanned" as const,
    positionCount: 0,
    warning: protocol.stage === "planned"
      ? "Adapter is listed in the coverage roadmap and is not scanning user positions yet."
      : hasWallets
        ? "Adapter did not return a scan result."
        : undefined,
  });
}
