import { QRCodeSVG } from "qrcode.react";
import { C } from "../../config/theme";
import styles from "./QrDisplay.module.css";
import shared from "../../styles/shared.module.css";

interface Props {
  address: string;
  label?: string;
  showNetworkInfo?: boolean;
}

export function QrDisplay({ address, label = "Scan to send me $TRUST", showNetworkInfo = true }: Props) {
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
