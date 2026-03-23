import { useState } from "react";
import { C } from "../../config/theme";
import { Ic } from "../ui/Icons";
import { hasEmbeddedWallet } from "../../services/embeddedWallet";
import styles from "./WalletPickerModal.module.css";
import shared from "../../styles/shared.module.css";

interface Props {
  onClose: () => void;
  onExternalWallet: () => void;
  onCreateEmbedded: (password: string) => Promise<void>;
  onUnlockEmbedded: (password: string) => Promise<void>;
  onBackupDone: () => void;
  embeddedMode: "none" | "create" | "unlock" | "backup";
  setEmbeddedMode: (mode: "none" | "create" | "unlock" | "backup") => void;
  embeddedPrivateKey: string;
  embeddedKeyCopied: boolean;
  setEmbeddedKeyCopied: (v: boolean) => void;
  txError: string;
}

export function WalletPickerModal({
  onClose, onExternalWallet, onCreateEmbedded, onUnlockEmbedded,
  onBackupDone, embeddedMode, setEmbeddedMode,
  embeddedPrivateKey, embeddedKeyCopied, setEmbeddedKeyCopied, txError,
}: Props) {
  const [password, setPassword] = useState("");
  const hasEmbedded = hasEmbeddedWallet();

  return (
    <div
      className={styles.overlay}
      onClick={() => { if (embeddedMode === "none") onClose(); }}
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Connect Wallet</h3>
          <button
            className={styles.closeBtn}
            onClick={() => { onClose(); setEmbeddedMode("none"); setPassword(""); }}
          >
            <Ic.X s={16} c={C.textSecondary} />
          </button>
        </div>

        {embeddedMode === "none" && (
          <>
            <div
              className={`${shared.glass} ${styles.option}`}
              style={{ background: "rgba(255,255,255,0.06)" }}
              onClick={() => { onExternalWallet(); setTimeout(onClose, 300); }}
            >
              <div className={styles.optionIcon} style={{ background: "rgba(255,255,255,0.08)" }}>
                <Ic.Wallet s={22} c={C.flat} />
              </div>
              <div className={styles.optionInfo}>
                <div className={styles.optionTitle}>External Wallet</div>
                <div className={styles.optionDesc}>MetaMask, WalletConnect, Coinbase...</div>
              </div>
              <Ic.Right s={16} c={C.textTertiary} />
            </div>

            <div
              className={`${shared.glass} ${styles.option}`}
              onClick={() => setEmbeddedMode(hasEmbedded ? "unlock" : "create")}
            >
              <div className={styles.optionIcon} style={{ background: C.primaryLight }}>
                <Ic.Plus s={22} c={C.primary} />
              </div>
              <div className={styles.optionInfo}>
                <div className={styles.optionTitle}>
                  {hasEmbedded ? "Unlock Embedded Wallet" : "Create Embedded Wallet"}
                </div>
                <div className={styles.optionDesc}>
                  {hasEmbedded ? "Enter your password to unlock" : "No wallet? We'll create one for you"}
                </div>
              </div>
              <Ic.Right s={16} c={C.textTertiary} />
            </div>
          </>
        )}

        {(embeddedMode === "create" || embeddedMode === "unlock") && (
          <div className={styles.passwordForm}>
            <div className={styles.passwordLabel}>
              {embeddedMode === "create" ? "Create a password for your wallet" : "Enter your wallet password"}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className={styles.passwordInput}
            />
            {txError && <div style={{ fontSize: 12, color: C.error }}>{txError}</div>}
            <button
              className={styles.actionBtn}
              onClick={async () => {
                if (embeddedMode === "create") {
                  await onCreateEmbedded(password);
                } else {
                  await onUnlockEmbedded(password);
                  onClose();
                }
              }}
            >
              {embeddedMode === "create" ? "Create Wallet" : "Unlock"}
            </button>
            <button
              className={styles.backBtn}
              onClick={() => { setEmbeddedMode("none"); setPassword(""); }}
            >
              Back
            </button>
          </div>
        )}

        {embeddedMode === "backup" && (
          <div className={styles.passwordForm}>
            <div className={`${shared.glass} ${styles.backupCard}`}>
              <p className={styles.backupWarning}>
                Save your private key! You won't see it again.
              </p>
              <p className={styles.backupKey}>{embeddedPrivateKey}</p>
              <button
                className={styles.copyBtn}
                style={{
                  background: embeddedKeyCopied ? C.success : C.surfaceGray,
                  color: embeddedKeyCopied ? "#0a0a0a" : C.textPrimary,
                }}
                onClick={() => { navigator.clipboard.writeText(embeddedPrivateKey); setEmbeddedKeyCopied(true); }}
              >
                {embeddedKeyCopied ? "Copied!" : "Copy Private Key"}
              </button>
            </div>
            <button className={styles.actionBtn} onClick={onBackupDone}>
              I've saved it — Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
