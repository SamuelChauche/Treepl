// ─── Storage Keys ───────────────────────────────────────────────
export const STORAGE_KEYS = {
  CART: "ethcc-cart",
  TOPICS: "ethcc-topics",
} as const;

// ─── Session Type Colors ────────────────────────────────────────
export type SessionType = "Talk" | "Workshop" | "Panel" | "Demo";

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
  RPC_URL: "https://rpc.intuition.systems/http",
  CHAIN_NAME: "Intuition",
  NATIVE_CURRENCY: { name: "TRUST", symbol: "TRUST", decimals: 18 },
} as const;

// ─── API URLs ───────────────────────────────────────────────────
export const GQL_URL = "https://mainnet.intuition.sh/v1/graphql";

// ─── External URLs ──────────────────────────────────────────────
export function explorerTxUrl(hash: string): string {
  return `https://explorer.intuition.systems/tx/${hash}`;
}

export function intuitionProfileUrl(address: string): string {
  return `https://portal.intuition.systems/app/profile/${address}`;
}
