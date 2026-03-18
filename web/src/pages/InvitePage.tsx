import { type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, glassSurface, btnPill, FONT } from "../config/theme";
import { QRCodeSVG } from "qrcode.react";
import { Ic } from "../components/ui/Icons";


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
  padding: "16px 16px 8px",
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

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  flex: 1,
};

const sectionTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 12,
};


// ─── App URL ─────────────────────────────────────────

const APP_URL = "https://samuelchauche.github.io/Treepl/";


// ─── Component ───────────────────────────────────────

export default function InvitePage() {
  const navigate = useNavigate();
  const walletAddr = localStorage.getItem("ethcc-wallet-address") ?? "";

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          &#8249;
        </button>
        <div style={titleStyle}>Invite</div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "0 16px 80px" }}>

        {/* QR Code — Download App */}
        <div style={{ ...glassSurface, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={sectionTitle}>Download the App</div>
          <div style={{ fontSize: 12, color: C.textSecondary, textAlign: "center" }}>
            Scan this QR code to download the Sofia EthCC app
          </div>
          <QRCodeSVG
            value={APP_URL}
            size={200}
            bgColor="transparent"
            fgColor="#ffffff"
            level="M"
          />
          <div style={{ fontSize: 11, color: C.textTertiary, textAlign: "center" }}>
            {APP_URL}
          </div>
        </div>

        {/* Send Trust */}
        <button
          style={{ ...btnPill, marginTop: 16, background: C.flat }}
          onClick={() => navigate("/send")}
        >
          <Ic.Send s={18} c="#0a0a0a" />
          Send $TRUST
        </button>

        {/* My QR Code */}
        {walletAddr && (
          <div style={{ ...glassSurface, marginTop: 20, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={sectionTitle}>My Wallet</div>
            <div style={{ fontSize: 12, color: C.textSecondary, textAlign: "center" }}>
              Share your address to receive $TRUST
            </div>
            <QRCodeSVG
              value={walletAddr}
              size={160}
              bgColor="transparent"
              fgColor="#ffffff"
              level="M"
            />
            <div style={{ fontSize: 11, color: C.textTertiary, fontFamily: "monospace", textAlign: "center" }}>
              {walletAddr.slice(0, 10)}...{walletAddr.slice(-8)}
            </div>
          </div>
        )}

        {/* Info */}
        <div style={{ ...glassSurface, marginTop: 16, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>How it works</div>
          <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.6 }}>
            1. Let someone scan the QR code to get the app{"\n"}
            2. Send them $TRUST so they can participate{"\n"}
            3. Your transfers count toward the leaderboard
          </div>
        </div>

      </div>{/* end scrollable content */}
    </div>
  );
}
