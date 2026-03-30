import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";

// Intuition L3 chain definition
const intuitionChain = {
  id: 1155,
  name: "Intuition",
  nativeCurrency: { name: "TRUST", symbol: "TRUST", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.intuition.systems/http"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.intuition.systems" },
  },
} as const;

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "81e3e331b4d13cd550760b1ec1034968";

const metadata = {
  name: "Sofia EthCC Manager",
  description: "EthCC[9] conference companion — browse agenda, vote on topics, publish on-chain",
  url: window.location.origin,
  icons: [`${window.location.origin}/images/icon-192.png`],
};

createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  projectId,
  networks: [intuitionChain],
  defaultNetwork: intuitionChain,
  features: {
    analytics: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#ffc6b0",
    "--w3m-border-radius-master": "2px",
  },
});

export { intuitionChain };
