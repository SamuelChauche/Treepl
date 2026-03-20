import { useState, useEffect, useRef, useCallback, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, btnPill, FONT } from "../config/theme";
import { connectWallet } from "../services/intuition";
import type { WalletConnection } from "../services/intuition";
import { QrDisplay } from "../components/shared/QrDisplay";


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

const tabRow: CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "20px 16px 16px",
  flexShrink: 0,
};

const tabBtn = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: "10px 0",
  borderRadius: R.btn,
  border: "none",
  background: active ? C.flat : C.surfaceGray,
  color: active ? "#0a0a0a" : C.textSecondary,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: FONT,
  cursor: "pointer",
});

// QR Styles
// qrBox removed — now using QrDisplay component

const infoRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  padding: "8px 0",
  borderBottom: `1px solid ${C.border}`,
};

const infoLabel: CSSProperties = {
  fontSize: 12,
  color: C.textSecondary,
};

const infoValue: CSSProperties = {
  fontSize: 12,
  color: C.textPrimary,
  fontWeight: 600,
};

// Scan styles
const scanArea: CSSProperties = {
  ...glassSurface,
  height: 240,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative" as const,
  overflow: "hidden",
};

const scanOverlay: CSSProperties = {
  position: "absolute" as const,
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};


const amountSection: CSSProperties = {
  marginTop: 16,
};

const amountInput: CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: R.lg,
  border: `1px solid ${C.border}`,
  background: C.surfaceGray,
  color: C.textPrimary,
  fontSize: 24,
  fontWeight: 700,
  fontFamily: FONT,
  textAlign: "center" as const,
  outline: "none",
  boxSizing: "border-box" as const,
};

const addressInput: CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: R.lg,
  border: `1px solid ${C.border}`,
  background: C.surfaceGray,
  color: C.textPrimary,
  fontSize: 13,
  fontFamily: "monospace",
  outline: "none",
  boxSizing: "border-box" as const,
};

const presetRow: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 12,
};

const presetBtn = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: "8px 0",
  borderRadius: R.btn,
  border: active ? "none" : `1px solid ${C.border}`,
  background: active ? C.flat : "transparent",
  color: active ? "#0a0a0a" : C.textSecondary,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: FONT,
  cursor: "pointer",
});

const confirmBox: CSSProperties = {
  ...glassSurface,
  marginTop: 16,
  padding: 16,
};

const confirmRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
};

const sendBtn: CSSProperties = {
  ...btnPill,
  margin: "16px 0",
};

const statusBanner = (type: "success" | "error" | "info"): CSSProperties => ({
  ...glassSurface,
  marginTop: 16,
  padding: 14,
  border: `1px solid ${type === "success" ? "rgba(34,197,94,0.3)" : type === "error" ? "rgba(239,68,68,0.3)" : C.border}`,
  fontSize: 13,
  color: type === "success" ? C.success : type === "error" ? C.error : C.textSecondary,
  textAlign: "center" as const,
  wordBreak: "break-all" as const,
});


// ─── Component ───────────────────────────────────────

type Mode = "qr" | "scan";
type TxState = "idle" | "connecting" | "sending" | "success" | "error";

export default function SendPage() {
  const navigate = useNavigate();
  const walletAddr = localStorage.getItem("ethcc-wallet-address") ?? "";

  const [mode, setMode] = useState<Mode>("qr");
  const [amount, setAmount] = useState("5");
  const [activePreset, setActivePreset] = useState<string | null>("5");
  const [recipient, setRecipient] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");
  const [balance, setBalance] = useState<string | null>(null);

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);

  const stopScanner = useCallback(() => {
    if (html5QrRef.current) {
      try { html5QrRef.current.clear(); } catch { /* ignore */ }
      html5QrRef.current = null;
    }
    setScanning(false);
  }, []);

  const extractAddress = (text: string): string | null => {
    // Match 0x address anywhere in the string (from QR code, URL, etc.)
    const match = text.match(/0x[a-fA-F0-9]{40}/);
    return match ? match[0] : null;
  };

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || scanning) return;
    setScanError("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scannerId = "qr-scanner-region";

      // Ensure the container exists
      if (!document.getElementById(scannerId)) return;

      const scanner = new Html5Qrcode(scannerId);
      html5QrRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          const addr = extractAddress(decodedText);
          if (addr) {
            setRecipient(addr);
            try { scanner.stop(); } catch { /* ignore */ }
            html5QrRef.current = null;
            setScanning(false);
          }
        },
        () => { /* ignore scan failures */ }
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setScanError(msg.includes("NotAllowed") ? "Camera access denied" : msg);
      setScanning(false);
    }
  }, [scanning]);

  // Cleanup scanner on unmount or mode change
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  // Stop scanner when switching away from scan mode
  useEffect(() => {
    if (mode !== "scan") stopScanner();
  }, [mode, stopScanner]);

  const presets = ["5", "10", "50"];

  const handlePreset = (val: string) => {
    setAmount(val);
    setActivePreset(val);
  };

  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);
  const canSend = parseFloat(amount || "0") > 0 && isValidAddress(recipient) && txState !== "sending" && txState !== "connecting";

  const handleSend = async () => {
    if (!canSend) return;

    setTxState("connecting");
    setTxError("");
    setTxHash("");

    let connection: WalletConnection;
    try {
      connection = await connectWallet();
      const bal = await connection.provider.getBalance(connection.address);
      const formatted = connection.ethers.formatEther(bal);
      setBalance(formatted);

      const sendAmount = connection.ethers.parseEther(amount);
      if (sendAmount > bal) {
        setTxError(`Insufficient balance: ${parseFloat(formatted).toFixed(4)} TRUST available`);
        setTxState("error");
        return;
      }
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : String(e));
      setTxState("error");
      return;
    }

    setTxState("sending");
    try {
      const tx = await connection.signer.sendTransaction({
        to: recipient,
        value: connection.ethers.parseEther(amount),
      });

      setTxHash(tx.hash);
      setTxState("success");

      // Track transfer for leaderboard
      try {
        const transfers = JSON.parse(localStorage.getItem("ethcc-trust-transfers") ?? "[]");
        transfers.push({ from: connection.address, to: recipient, amount, hash: tx.hash, timestamp: Date.now() });
        localStorage.setItem("ethcc-trust-transfers", JSON.stringify(transfers));
      } catch { /* ignore */ }

      // Update balance after send
      const newBal = await connection.provider.getBalance(connection.address);
      setBalance(connection.ethers.formatEther(newBal));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("user rejected") || msg.includes("denied") || msg.includes("ACTION_REJECTED")) {
        setTxError("Transaction cancelled by user");
      } else {
        setTxError(msg);
      }
      setTxState("error");
    }
  };

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          &#8249;
        </button>
        <div style={title}>Send $TRUST</div>
      </div>

      {/* Mode Tabs */}
      <div style={tabRow}>
        <button style={tabBtn(mode === "qr")} onClick={() => setMode("qr")}>
          My QR Code
        </button>
        <button style={tabBtn(mode === "scan")} onClick={() => setMode("scan")}>
          Scan & Send
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "0 16px 80px" }}>

      {/* ─── QR Code Mode ────────────────── */}
      {mode === "qr" && <QrDisplay address={walletAddr} />}

      {/* ─── Scan & Send Mode ────────────── */}
      {mode === "scan" && (
        <>
          {/* QR Scanner */}
          <div style={scanArea} ref={scannerRef}>
            <div id="qr-scanner-region" style={{ width: "100%", height: "100%" }} />
            {!scanning && !isValidAddress(recipient) && (
              <div style={scanOverlay}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={startScanner}
                    style={{
                      padding: "12px 24px", borderRadius: R.btn, border: "none",
                      background: C.flat, color: "#0a0a0a", fontSize: 14, fontWeight: 600,
                      cursor: "pointer", fontFamily: FONT,
                    }}
                  >
                    Start Camera
                  </button>
                  <div style={{ fontSize: 12, color: C.textTertiary }}>
                    Scan a wallet QR code
                  </div>
                </div>
              </div>
            )}
            {scanning && !isValidAddress(recipient) && (
              <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center" }}>
                <span style={{ fontSize: 11, color: C.success, background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: 4 }}>
                  Scanning...
                </span>
              </div>
            )}
            {isValidAddress(recipient) && (
              <div style={scanOverlay}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 24, color: C.success }}>&#10003;</div>
                  <div style={{ fontSize: 13, color: C.success, fontWeight: 600 }}>Address detected</div>
                  <div style={{ fontSize: 11, color: C.textSecondary, fontFamily: "monospace" }}>
                    {recipient.slice(0, 10)}...{recipient.slice(-8)}
                  </div>
                  <button
                    onClick={() => { setRecipient(""); startScanner(); }}
                    style={{
                      padding: "6px 16px", borderRadius: R.btn, border: `1px solid ${C.border}`,
                      background: C.surfaceGray, color: C.textSecondary, fontSize: 12,
                      cursor: "pointer", fontFamily: FONT, marginTop: 4,
                    }}
                  >
                    Scan again
                  </button>
                </div>
              </div>
            )}
            {scanError && (
              <div style={{ ...scanOverlay, flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 13, color: C.error }}>{scanError}</div>
                <button
                  onClick={startScanner}
                  style={{
                    padding: "8px 16px", borderRadius: R.btn, border: "none",
                    background: C.surfaceGray, color: C.textPrimary, fontSize: 13,
                    cursor: "pointer", fontFamily: FONT,
                  }}
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Recipient Address */}
          <div style={amountSection}>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
              Recipient address
            </div>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              style={addressInput}
              placeholder="0x..."
            />
            {recipient && !isValidAddress(recipient) && (
              <div style={{ fontSize: 11, color: C.error, marginTop: 4 }}>
                Invalid address (format: 0x + 40 hex characters)
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div style={amountSection}>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
              Amount to send
            </div>
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
            <div style={presetRow}>
              {presets.map((p) => (
                <button
                  key={p}
                  style={presetBtn(activePreset === p)}
                  onClick={() => handlePreset(p)}
                >
                  {p} TRUST
                </button>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <div style={confirmBox}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Transaction Summary
            </div>
            <div style={confirmRow}>
              <span style={infoLabel}>To</span>
              <span style={infoValue}>
                {isValidAddress(recipient) ? `${recipient.slice(0, 8)}...${recipient.slice(-6)}` : "—"}
              </span>
            </div>
            <div style={confirmRow}>
              <span style={infoLabel}>Amount</span>
              <span style={infoValue}>{amount || "0"} TRUST</span>
            </div>
            {balance !== null && (
              <div style={confirmRow}>
                <span style={infoLabel}>Your balance</span>
                <span style={infoValue}>{parseFloat(balance).toFixed(4)} TRUST</span>
              </div>
            )}
          </div>

          {/* Status messages */}
          {txState === "success" && txHash && (
            <div style={statusBanner("success")}>
              {amount} TRUST sent successfully!<br />
              <span style={{ fontSize: 11, opacity: 0.8 }}>TX: {txHash.slice(0, 16)}...{txHash.slice(-10)}</span>
            </div>
          )}

          {txState === "error" && txError && (
            <div style={statusBanner("error")}>
              {txError}
            </div>
          )}

          {(txState === "connecting" || txState === "sending") && (
            <div style={statusBanner("info")}>
              {txState === "connecting" ? "Connecting wallet..." : "Sending... Confirm in your wallet"}
            </div>
          )}

          {/* Send Button */}
          <button
            style={{
              ...sendBtn,
              ...(canSend ? {} : { opacity: 0.5, cursor: "not-allowed" }),
            }}
            disabled={!canSend}
            onClick={handleSend}
          >
            {txState === "connecting"
              ? "Connecting..."
              : txState === "sending"
                ? "Sending..."
                : canSend
                  ? `Send ${amount} TRUST`
                  : !isValidAddress(recipient)
                    ? "Enter a valid address"
                    : "Enter an amount"}
          </button>
        </>
      )}

      </div>{/* end scrollable content */}

    </div>
  );
}
