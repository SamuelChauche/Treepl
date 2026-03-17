import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, btnPill, FONT } from "../config/theme";
import { connectWallet } from "../services/intuition";
import type { WalletConnection } from "../services/intuition";


// ─── Styles ──────────────────────────────────────────

const page: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "transparent",
  color: C.textPrimary,
  fontFamily: FONT,
  overflow: "hidden",
};

const header: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px 0",
  flexShrink: 0,
};

const backBtn: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: C.surfaceGray,
  border: "none",
  color: C.textPrimary,
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const title: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  flex: 1,
};

const tokenCard: CSSProperties = {
  ...glassSurface,
  margin: "20px 16px 16px",
  padding: 20,
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const tokenIcon: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 26,
  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  fontWeight: 700,
  color: C.dark,
  flexShrink: 0,
};

const tokenName: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
};

const tokenTicker: CSSProperties = {
  fontSize: 12,
  color: C.textSecondary,
  marginTop: 2,
};

const tokenPrice: CSSProperties = {
  marginLeft: "auto",
  textAlign: "right" as const,
  flexShrink: 0,
};

const priceValue: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: C.success,
};

const priceLabel: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
  marginTop: 2,
};

const sectionTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: C.textSecondary,
  padding: "16px 16px 8px",
};

const amountInput: CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: R.lg,
  border: `1px solid ${C.border}`,
  background: "rgba(255,255,255,0.04)",
  color: C.textPrimary,
  fontSize: 28,
  fontWeight: 700,
  fontFamily: FONT,
  textAlign: "center" as const,
  outline: "none",
  boxSizing: "border-box" as const,
};

const presetRow: CSSProperties = {
  display: "flex",
  gap: 8,
  margin: "12px 16px 0",
};

const presetBtn = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: "10px 0",
  borderRadius: R.btn,
  border: active ? "none" : `1px solid ${C.border}`,
  background: active ? C.flat : "transparent",
  color: active ? "#0a0a0a" : C.textSecondary,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: FONT,
  cursor: "pointer",
});

const conversionBox: CSSProperties = {
  textAlign: "center" as const,
  padding: "12px 16px",
  fontSize: 14,
  color: C.textSecondary,
};

const paySection: CSSProperties = {
  ...glassSurface,
  margin: "0 16px",
  padding: 16,
};

const metamaskBtn: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: R.lg,
  border: `1px solid ${C.border}`,
  background: "rgba(255,255,255,0.04)",
  color: C.textPrimary,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: FONT,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  marginTop: 8,
  boxSizing: "border-box" as const,
};

const summaryBox: CSSProperties = {
  ...glassSurface,
  margin: "16px",
  padding: 16,
};

const summaryRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
};

const summaryLabel: CSSProperties = {
  fontSize: 13,
  color: C.textSecondary,
};

const summaryValue: CSSProperties = {
  fontSize: 13,
  color: C.textPrimary,
  fontWeight: 600,
};

const buyBtn = (processing: boolean): CSSProperties => ({
  ...btnPill,
  margin: "0 16px",
  width: "calc(100% - 32px)",
  boxSizing: "border-box" as const,
  opacity: processing ? 0.7 : 1,
  cursor: processing ? "not-allowed" : "pointer",
});

const successBox: CSSProperties = {
  ...glassSurface,
  margin: "40px 16px",
  padding: 32,
  textAlign: "center" as const,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
};

const successIcon: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 32,
  background: C.successLight,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 32,
};

// ─── Component ───────────────────────────────────────

const MOCK_PRICE_USD = 0.42;

export default function BuyTrustPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("25");
  const [activePreset, setActivePreset] = useState<string | null>("25");
  const [walletConnected, setWalletConnected] = useState(false);
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [walletAddr, setWalletAddr] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if already connected
  useEffect(() => {
    const saved = localStorage.getItem("ethcc-wallet-address");
    if (saved) { setWalletConnected(true); setWalletAddr(saved); }
  }, []);

  const presets = ["10", "25", "50", "100", "250"];

  const numAmount = parseFloat(amount || "0");
  const usdTotal = (numAmount * MOCK_PRICE_USD).toFixed(2);
  const fee = (numAmount * 0.005).toFixed(3);

  const handlePreset = (val: string) => {
    setAmount(val);
    setActivePreset(val);
  };

  const handleBuy = async () => {
    if (!walletConnected || numAmount <= 0) return;
    setProcessing(true);
    try {
      // Ensure wallet is connected
      let w = wallet;
      if (!w) {
        w = await connectWallet();
        setWallet(w);
        setWalletAddr(w.address);
        localStorage.setItem("ethcc-wallet-address", w.address);
      }
      const addr = w.address;
      // $TRUST is the native token — buying means bridging/swapping, not a simple tx
      alert(
        `To acquire ${amount} TRUST:\n\n` +
        `1. Bridge ETH to Intuition L3 (Chain 1155)\n` +
        `2. Use the Intuition bridge at https://app.intuition.systems\n\n` +
        `Connected wallet: ${addr.slice(0, 6)}...${addr.slice(-4)}`
      );
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      alert(`Error: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div style={page}>
        <div style={header}>
          <button style={backBtn} onClick={() => navigate(-1)}>
            &#8249;
          </button>
          <div style={title}>Buy $TRUST</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={successBox}>
          <div style={successIcon}>&#10003;</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Purchase Complete!</div>
          <div style={{ fontSize: 14, color: C.textSecondary }}>
            You purchased {amount} TRUST for ${usdTotal}
          </div>
          <div style={{ fontSize: 12, color: C.textTertiary, marginTop: 4 }}>
            TX: 0x7f8a...b3c2
          </div>
          <button
            style={{ ...btnPill, marginTop: 16, width: "auto", padding: "0 32px" }}
            onClick={() => navigate(-1)}
          >
            Done
          </button>
        </div>
        </div>{/* end scrollable content */}
      </div>
    );
  }

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          &#8249;
        </button>
        <div style={title}>Buy $TRUST</div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

      {/* Token Info */}
      <div style={tokenCard}>
        <div style={tokenIcon}>T</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={tokenName}>TRUST</div>
          <div style={tokenTicker}>Intuition Native Token</div>
        </div>
        <div style={tokenPrice}>
          <div style={priceValue}>${MOCK_PRICE_USD}</div>
          <div style={priceLabel}>per TRUST</div>
        </div>
      </div>

      {/* Amount */}
      <div style={sectionTitle}>Amount</div>
      <div style={{ padding: "0 16px" }}>
        <input
          type="text"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setActivePreset(null);
          }}
          style={amountInput}
          placeholder="0"
        />
      </div>
      <div style={presetRow}>
        {presets.map((p) => (
          <button
            key={p}
            style={presetBtn(activePreset === p)}
            onClick={() => handlePreset(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* USD Conversion */}
      <div style={conversionBox}>
        {numAmount > 0 ? (
          <span>
            = <strong style={{ color: C.textPrimary }}>${usdTotal}</strong> USD
          </span>
        ) : (
          <span>Enter an amount</span>
        )}
      </div>

      {/* Pay With */}
      <div style={sectionTitle}>Pay with</div>
      <div style={paySection}>
        <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}>
          {walletConnected ? "Wallet connected" : "Connect your wallet to purchase"}
        </div>
        <button
          style={{
            ...metamaskBtn,
            ...(walletConnected ? { background: C.flat, borderColor: C.flat, color: "#0a0a0a" } : {}),
          }}
          onClick={async () => {
            if (walletConnected) { setWalletConnected(false); setWallet(null); return; }
            try {
              const w = await connectWallet();
              setWallet(w);
              setWalletAddr(w.address);
              setWalletConnected(true);
              localStorage.setItem("ethcc-wallet-address", w.address);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "";
              if (msg === "REDIRECT_METAMASK" || msg === "NO_WALLET") return;
              /* user rejected */
            }
          }}
        >
          {walletConnected ? (
            <span style={{ color: "#0a0a0a", fontWeight: 600 }}>
              {walletAddr ? `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}` : "Connected"}
            </span>
          ) : (
            "Connect Wallet"
          )}
        </button>
      </div>

      {/* Transaction Summary */}
      <div style={summaryBox}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Transaction Summary
        </div>
        <div style={summaryRow}>
          <span style={summaryLabel}>Amount</span>
          <span style={summaryValue}>{amount || "0"} TRUST</span>
        </div>
        <div style={summaryRow}>
          <span style={summaryLabel}>Price</span>
          <span style={summaryValue}>${MOCK_PRICE_USD} / TRUST</span>
        </div>
        <div style={summaryRow}>
          <span style={summaryLabel}>Network Fee</span>
          <span style={summaryValue}>{fee} TRUST</span>
        </div>
        <div style={{ ...summaryRow, borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
          <span style={{ ...summaryLabel, fontWeight: 600, color: C.textPrimary }}>Total</span>
          <span style={{ ...summaryValue, color: C.flat, fontSize: 15 }}>
            ${usdTotal}
          </span>
        </div>
      </div>

      {/* Buy Button */}
      <button
        style={buyBtn(processing)}
        onClick={handleBuy}
        disabled={processing || !walletConnected || numAmount <= 0}
      >
        {processing
          ? "Processing..."
          : !walletConnected
          ? "Connect Wallet First"
          : numAmount <= 0
          ? "Enter Amount"
          : `Buy ${amount} TRUST`}
      </button>

      </div>{/* end scrollable content */}
    </div>
  );
}
