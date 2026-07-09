import { defineChain } from "viem";
import { http, cookieStorage, createConfig, createStorage } from "wagmi";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

// WalletConnect project IDs are public client-side identifiers
const WC_PROJECT_ID = "5b19f871c181a89b72c971a10482913e";

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
    connectors: [
      injected(),
      walletConnect({
        projectId: WC_PROJECT_ID,
        metadata: {
          name: "Quiver",
          description: "Perpetual futures on tokenized stocks",
          url: "https://quiver-trade.com",
          icons: ["https://quiver-trade.com/brand/icon-192.png"],
        },
        showQrModal: true,
      }),
      coinbaseWallet({ appName: "Quiver", appLogoUrl: "https://quiver-trade.com/brand/icon-192.png" }),
    ],
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
