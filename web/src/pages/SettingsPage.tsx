import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, glassSurface, FONT } from "../config/theme";
import { CHAIN_CONFIG, STORAGE_KEYS } from "../config/constants";
import { Ic } from "../components/ui/Icons";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { useEmbeddedWallet } from "../contexts/EmbeddedWalletContext";

// ─── Styles ──────────────────────────────────────────

const page: CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column",
  background: "transparent", color: C.textPrimary, fontFamily: FONT, overflow: "hidden",
};

const header: CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "12px 16px 0", flexShrink: 0,
};

const backBtn: CSSProperties = {
  width: 42, height: 42, borderRadius: 14, background: C.surfaceGray,
  border: "none", color: C.textPrimary, fontSize: 18, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const title: CSSProperties = { fontSize: 20, fontWeight: 700, flex: 1 };

const sectionTitle: CSSProperties = {
  fontSize: 12, fontWeight: 600, color: C.textTertiary,
  textTransform: "uppercase" as const, letterSpacing: 1,
  padding: "20px 16px 8px",
};

const row: CSSProperties = {
  ...glassSurface, margin: "0 16px 8px", padding: "14px 16px",
  display: "flex", alignItems: "center", justifyContent: "space-between",
};

const label: CSSProperties = { fontSize: 14, color: C.textPrimary };
const value: CSSProperties = { fontSize: 13, color: C.textSecondary, fontFamily: "monospace" };

const avatarWrap: CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px 8px",
};

const avatar: CSSProperties = {
  width: 72, height: 72, borderRadius: 36,
  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 26, fontWeight: 700, color: "#0a0a0a",
};

const dangerBtn: CSSProperties = {
  width: "calc(100% - 32px)", margin: "8px 16px", padding: "14px 16px",
  borderRadius: 14, border: `1px solid ${C.error}`, background: C.errorLight,
  color: C.error, fontSize: 14, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
  textAlign: "center" as const,
};

// ─── Component ───────────────────────────────────────

export default function SettingsPage() {
  const navigate = useNavigate();
  const { disconnect: disconnectAppKit } = useWalletConnection();
  const { disconnect: disconnectEmbedded } = useEmbeddedWallet();

  const walletAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) ?? "";
  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "Not connected";
  const initials = walletAddress ? walletAddress.slice(2, 4).toUpperCase() : "??";

  // Fetch real balance
  const [balance, setBalance] = useState<string>("—");
  useEffect(() => {
    if (!walletAddress) return;
    import("ethers").then(({ ethers }) => {
      const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.RPC_URL, {
        chainId: CHAIN_CONFIG.CHAIN_ID,
        name: CHAIN_CONFIG.CHAIN_NAME,
      });
      provider.getBalance(walletAddress).then((bal) => {
        const trust = Number(bal) / 1e18;
        setBalance(trust < 0.001 ? trust.toFixed(6) : trust.toFixed(4));
      }).catch(() => setBalance("—"));
    });
  }, [walletAddress]);

  const handleDisconnect = async () => {
    // Disconnect both wallet types (one will be no-op)
    await disconnectAppKit();
    await disconnectEmbedded();

    // Clear all wallet-related storage
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDED);

    // Redirect to onboarding
    navigate("/onboarding");
  };

  return (
    <div style={page}>
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          <Ic.Back c={C.textPrimary} />
        </button>
        <div style={title}>Settings</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 24 }}>
        {/* Avatar */}
        <div style={avatarWrap}>
          <div style={avatar}>{initials}</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 10 }}>
            {walletAddress ? shortAddr : "Anonymous"}
          </div>
        </div>

        {/* Wallet */}
        <div style={sectionTitle}>Wallet</div>
        <div style={row}>
          <span style={label}>Address</span>
          <span style={value}>{shortAddr}</span>
        </div>
        <div style={row}>
          <span style={label}>Full Address</span>
          <span style={{ ...value, fontSize: 11, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {walletAddress || "—"}
          </span>
        </div>
        <div style={row}>
          <span style={label}>Balance</span>
          <span style={{ ...value, color: C.trust }}>{balance} TRUST</span>
        </div>

        {/* Network */}
        <div style={sectionTitle}>Network</div>
        <div style={row}>
          <span style={label}>Chain</span>
          <span style={value}>{CHAIN_CONFIG.CHAIN_NAME} (ID: {CHAIN_CONFIG.CHAIN_ID})</span>
        </div>
        <div style={row}>
          <span style={label}>Contract</span>
          <span style={{ ...value, fontSize: 11 }}>
            {CHAIN_CONFIG.MULTIVAULT.slice(0, 10)}...{CHAIN_CONFIG.MULTIVAULT.slice(-6)}
          </span>
        </div>
        <div style={row}>
          <span style={label}>Token</span>
          <span style={value}>$TRUST (native)</span>
        </div>

        {/* About */}
        <div style={sectionTitle}>About</div>
        <div
          style={{ ...row, cursor: "pointer" }}
          onClick={() => window.open("https://ethcc.io", "_blank")}
        >
          <span style={label}>EthCC[9]</span>
          <span style={{ ...value, color: C.primary }}>ethcc.io</span>
        </div>
        <div
          style={{ ...row, cursor: "pointer" }}
          onClick={() => window.open("https://app.intuition.systems", "_blank")}
        >
          <span style={label}>Intuition Portal</span>
          <span style={{ ...value, color: C.primary }}>app.intuition.systems</span>
        </div>
        <div
          style={{ ...row, cursor: "pointer" }}
          onClick={() => window.open("https://sofia.intuition.box/", "_blank")}
        >
          <span style={label}>Sofia</span>
          <span style={{ ...value, color: C.primary }}>sofia.intuition.box</span>
        </div>
        <div style={row}>
          <span style={label}>Version</span>
          <span style={value}>1.0.0</span>
        </div>

        {/* Disconnect */}
        {walletAddress && (
          <>
            <div style={sectionTitle}>Danger Zone</div>
            <button style={dangerBtn} onClick={handleDisconnect}>
              Disconnect Wallet
            </button>
          </>
        )}
      </div>
    </div>
  );
}
