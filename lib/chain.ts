import { defineChain } from "viem";

const testnetRpcUrl = process.env.NEXT_PUBLIC_TESTNET_RPC_URL?.trim()
  || "https://rpc.testnet.chain.robinhood.com";
const mainnetRpcUrl = process.env.ROBINHOOD_RPC_URL?.trim()
  || process.env.NEXT_PUBLIC_RPC_URL?.trim()
  || "https://rpc.mainnet.chain.robinhood.com";

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [testnetRpcUrl],
    },
  },
  testnet: true,
});

export const robinhoodMainnet = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [mainnetRpcUrl],
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
    },
  },
});
