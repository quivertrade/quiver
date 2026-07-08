import { defineChain } from "viem";
import { http, cookieStorage, createConfig, createStorage } from "wagmi";
import { injected } from "wagmi/connectors";

export const robinhoodChainTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Testnet Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
  testnet: true,
});

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
});

export function getConfig() {
  return createConfig({
    chains: [robinhoodChainTestnet, robinhoodChain],
    connectors: [injected()],
    storage: createStorage({ storage: cookieStorage }),
    ssr: true,
    transports: {
      [robinhoodChainTestnet.id]: http(),
      [robinhoodChain.id]: http(),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
