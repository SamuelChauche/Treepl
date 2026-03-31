// ─── Storage Keys ───────────────────────────────────────────────
export const STORAGE_KEYS = {
  CART: "ethcc-cart",
  RATINGS_PENDING: "ethcc-ratings-pending",
  RATINGS: "ethcc-ratings",
  TRANSFERS: "ethcc-trust-transfers",
  PUBLISHED_SESSIONS: "ethcc-published-sessions",
  PUBLISHED_VOTES: "ethcc-published-votes",
  VOTES: "ethcc-votes",
  WALLET_ADDRESS: "ethcc-wallet-address",
  ONBOARDED: "ethcc-onboarded",
  WANT_REPLAY: "ethcc-want-replay",
  SEEN_REPLAYS: "ethcc-seen-replays",
  EMBEDDED_WALLET: "ethcc-embedded-wallet",
  BACKUP_DONE: "ethcc-backup-done",
  PUSH_SUBSCRIPTION: "ethcc-push-subscription",
  NICKNAME: "ethcc-nickname",
  PROFILE: "ethcc-profile",
} as const;

// ─── Session Type Colors ────────────────────────────────────────
export type SessionType = "Talk" | "Workshop" | "Panel" | "Demo" | "Side Event";

export const TYPE_DATA_COLORS: Record<string, string> = {
  Talk: "orange",
  Workshop: "yellow",
  Panel: "blue",
  Demo: "lime",
};

export const TYPE_CSS_COLORS: Record<string, string> = {
  Talk: "var(--orange)",
  Workshop: "var(--yellow)",
  Panel: "var(--blue)",
  Demo: "var(--lime)",
};

export function getTypeCssColor(type: string): string {
  return TYPE_CSS_COLORS[type] ?? "var(--teal)";
}

// ─── Intuition Chain Config ─────────────────────────────────────
export const CHAIN_CONFIG = {
  CHAIN_ID: 1155,
  CHAIN_ID_HEX: "0x483",
  MULTIVAULT: "0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e",
  SOFIA_PROXY: "0x26F81d723Ad1648194FAA4b7E235105Fd1212c6c",
  RPC_URL: "https://vib.rpc.intuition.box/http/cbc169f1073b6faedeb4c49724be3e55",
  CHAIN_NAME: "Intuition",
  NATIVE_CURRENCY: { name: "TRUST", symbol: "TRUST", decimals: 18 },
  CURVE_ID: 1, // linear bonding curve
  APPROVAL_TYPE_DEPOSIT: 1, // MultiVault ApprovalTypes.DEPOSIT
} as const;

// ─── Default deposit per triple (in wei) ────────────────────────
// 0.001 TRUST per triple — users deposit into vaults on creation
export const DEFAULT_DEPOSIT_PER_TRIPLE = "100000000000000000"; // 1e17 = 0.1 TRUST

// ─── Error Messages ─────────────────────────────────────────────
export const ERROR_MESSAGES = {
  WRONG_NETWORK: `Your wallet is not connected to ${CHAIN_CONFIG.CHAIN_NAME}. Please switch to Chain ${CHAIN_CONFIG.CHAIN_ID} and try again.`,
  NETWORK_CHANGED: `Your wallet switched networks during the transaction. Please switch back to ${CHAIN_CONFIG.CHAIN_NAME} (Chain ${CHAIN_CONFIG.CHAIN_ID}) and try again.`,
  NETWORK_VERIFICATION_FAILED: `Could not verify network connection. Please ensure you're on ${CHAIN_CONFIG.CHAIN_NAME} (Chain ${CHAIN_CONFIG.CHAIN_ID}).`,
  USER_REJECTED: 'Transaction was rejected. Please approve the transaction in your wallet to continue.',
  INSUFFICIENT_FUNDS: 'Insufficient funds to complete this transaction.',
} as const;

// ─── API URLs ───────────────────────────────────────────────────
// Use Vite proxy in dev to avoid CORS, direct URL in production
export const GQL_URL = import.meta.env.DEV
  ? "/api/graphql"
  : "https://mainnet.intuition.sh/v1/graphql";

// ─── External URLs ──────────────────────────────────────────────
export function explorerTxUrl(hash: string): string {
  return `https://explorer.intuition.systems/tx/${hash}`;
}

export function intuitionProfileUrl(atomId: string): string {
  return `https://portal.intuition.systems/explore/atom/${atomId}?tab=claims`;
}
