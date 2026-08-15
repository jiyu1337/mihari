import type {
  ProtocolExposureAdapter,
  ProtocolScan,
} from "@/lib/protocol-exposure";
import { protocolCatalog } from "@/lib/protocols/catalog";
import { morphoAdapter } from "@/lib/protocols/morpho";
import { uniswapV3Adapter } from "@/lib/protocols/uniswap-v3";
import { uniswapV4Adapter } from "@/lib/protocols/uniswap-v4";
import { arcusAdapter } from "@/lib/protocols/arcus";
import { lighterAdapter } from "@/lib/protocols/lighter";

export { protocolCatalog } from "@/lib/protocols/catalog";

export const protocolAdapters: ProtocolExposureAdapter[] = [
  morphoAdapter,
  uniswapV3Adapter,
  uniswapV4Adapter,
  arcusAdapter,
  lighterAdapter,
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
