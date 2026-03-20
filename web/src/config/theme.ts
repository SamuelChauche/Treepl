import type { CSSProperties } from "react";

// ─── Colors ─────────────────────────────────────────────────────
export const C = {
  primary: "#cea2fd",
  primaryLight: "rgba(206,162,253,0.15)",
  white: "#FBF7F5",
  background: "#02000e",
  surface: "#161618",
  surfaceGray: "#1c1c20",
  dark: "#02000e",
  textPrimary: "#F2DED6",
  textSecondary: "#a09088",
  textTertiary: "#6a5f5a",
  success: "#22c55e",
  successLight: "rgba(34,197,94,0.15)",
  error: "#ef4444",
  errorLight: "rgba(239,68,68,0.15)",
  warning: "#f59e0b",
  actionYellow: "#F59E0B",
  actionOrange: "#d37cbf",
  accent: "#A6AF6B",
  trust: "#00D4AA",
  glass: "rgba(0,0,0,0.14)",
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.1)",
  gold: "#FCD34D",
  iridescence:
    "linear-gradient(135deg, #D790C7 0%, #d37cbf 20%, #ffc6b0 50%, #ffa7b1 80%, #cea2fd 100%)",
  gradIr:
    "linear-gradient(135deg, #D790C7 0%, #d37cbf 20%, #ffc6b0 50%, #ffa7b1 80%, #cea2fd 100%)",
  flat: "#ffc6b0",
  flatLight: "rgba(255,198,176,0.15)",
};

// ─── Radii ──────────────────────────────────────────────────────
export const R = { sm: 4, md: 8, lg: 12, xl: 20, btn: 28 };

// ─── Glass styles ───────────────────────────────────────────────
export const glass: CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(24px) saturate(1.3)",
  WebkitBackdropFilter: "blur(24px) saturate(1.3)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

export const glassCard: CSSProperties = {
  ...glass,
  borderRadius: R.lg,
  boxShadow:
    "0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.03)",
};

export const glassNav: CSSProperties = {
  background: "rgba(10,0,14,0.7)",
  backdropFilter: "blur(32px) saturate(1.5)",
  WebkitBackdropFilter: "blur(32px) saturate(1.5)",
  borderTop: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

export const glassSurface: CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(24px) saturate(1.4)",
  WebkitBackdropFilter: "blur(24px) saturate(1.4)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: R.lg,
  boxShadow:
    "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.02)",
};

// ─── Font ───────────────────────────────────────────────────────
export const FONT =
  "Roboto,-apple-system,BlinkMacSystemFont,'Helvetica Neue','Segoe UI',sans-serif";

// ─── Button pill ────────────────────────────────────────────────
export const btnPill: CSSProperties = {
  width: "100%",
  height: 56,
  borderRadius: R.btn,
  background: C.iridescence,
  color: "#0a0a0a",
  fontSize: 16,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  fontFamily: FONT,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

// ─── Track colors — EthCC[9] tracks (19) + side event tracks (4) ──
export const TRACK_COLORS: Record<string, { color: string; icon: string }> = {
  "AI Agents and Automation": { color: "#9B51E0", icon: "🤖" },
  "Applied cryptography": { color: "#7B61FF", icon: "🔐" },
  "Block Fighters": { color: "#EB5757", icon: "🥊" },
  "Breakout sessions": { color: "#F2994A", icon: "💡" },
  "Built on Ethereum": { color: "#2D9CDB", icon: "🏗️" },
  "Core Protocol": { color: "#3461FF", icon: "⚙️" },
  "Cypherpunk & Privacy": { color: "#7B61FF", icon: "🕵️" },
  "DeFi": { color: "#27AE60", icon: "💸" },
  "EthStaker": { color: "#219653", icon: "🥩" },
  "Layer 2s": { color: "#3461FF", icon: "🔗" },
  "Product & Marketers": { color: "#F2994A", icon: "📣" },
  "RWA Tokenisation": { color: "#BB6BD9", icon: "🏠" },
  "Regulation & Compliance": { color: "#E67E22", icon: "⚖️" },
  "Research": { color: "#6366F1", icon: "🔬" },
  "Security": { color: "#EB5757", icon: "🛡️" },
  "Stablecoins & Global Payments": { color: "#27AE60", icon: "💳" },
  "TERSE": { color: "#9B51E0", icon: "🧪" },
  "The Unexpected": { color: "#F59E0B", icon: "🎲" },
  "Zero Tech & TEE": { color: "#2D9CDB", icon: "🔮" },
  "Builders & Hackathons": { color: "#3461FF", icon: "🛠️" },
  "Investor & Fundraising": { color: "#F2994A", icon: "💰" },
  "Networking & Social": { color: "#BB6BD9", icon: "🥂" },
  "Sport & Wellness": { color: "#27AE60", icon: "🏃" },
};

export function getTrackStyle(trackName: string) {
  return TRACK_COLORS[trackName] ?? { color: "#cea2fd", icon: "📌" };
}

// ─── Session type colors ────────────────────────────────────────
export const TYPE_COLORS: Record<string, string> = {
  Talk: "#F2994A",
  Workshop: "#F59E0B",
  Panel: "#3461FF",
  Demo: "#A6AF6B",
};
