import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { C, R, FONT } from "../../config/theme";
import styles from "./QrDisplay.module.css";
import shared from "../../styles/shared.module.css";

interface Props {
  address: string;
  label?: string;
  showNetworkInfo?: boolean;
}

export function QrDisplay({ address, label = "Scan to send me $TRUST", showNetworkInfo = true }: Props) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = address;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className={`${shared.glass} ${styles.container}`}>
        <div className={styles.label}>{label}</div>
        <QRCodeSVG
          value={address || "https://ethcc.io"}
          size={200}
          bgColor="transparent"
          fgColor="#ffffff"
          level="M"
        />
        <div className={styles.address}>
          {address ? `${address.slice(0, 10)}...${address.slice(-8)}` : "Connect your wallet"}
        </div>
        {address && (
          <button
            onClick={copyAddress}
            style={{
              marginTop: 12,
              padding: "10px 24px",
              borderRadius: R.btn,
              border: `1px solid ${copied ? C.success : C.border}`,
              background: copied ? C.successLight : C.surfaceGray,
              color: copied ? C.success : C.textPrimary,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: FONT,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {copied ? "Copied!" : "Copy Address"}
          </button>
        )}
      </div>

      {showNetworkInfo && (
        <div className={`${shared.glass} ${styles.infoCard}`}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Network</span>
            <span className={styles.infoValue}>Intuition (Chain 1155)</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Token</span>
            <span className={styles.infoValue}>$TRUST</span>
          </div>
          <div className={styles.infoRowLast}>
            <span className={styles.infoLabel}>Status</span>
            <span className={styles.infoValue} style={{ color: address ? C.success : C.textTertiary }}>
              {address ? "Ready to receive" : "Wallet not connected"}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
