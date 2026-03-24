import { useMemo } from "react";
import { C, glassSurface, btnPill, FONT, getTrackStyle } from "../../config/theme";
import { sessions } from "../../data";
import { QRCodeSVG } from "qrcode.react";
import { Ic } from "../ui/Icons";
import { WalletPickerModal } from "./WalletPickerModal";
import styles from "./Step6ReviewPublish.module.css";
import shared from "../../styles/shared.module.css";
import type { useOnboardingWallet } from "../../hooks/useOnboardingWallet";

interface Props {
  selectedTracks: Set<string>;
  selectedSessions: Set<string>;
  walletState: "idle" | "connecting" | "connected" | "signing" | "done";
  w: ReturnType<typeof useOnboardingWallet>;
  onBack: () => void;
  onPublish: () => void;
  onSkip: () => void;
}

export function Step6ReviewPublish({ selectedTracks, selectedSessions, walletState, w, onBack, onPublish, onSkip }: Props) {
  const selectedSessionObjects = useMemo(
    () => sessions.filter((s) => selectedSessions.has(s.id)),
    [selectedSessions],
  );
  const tripleCount = selectedTracks.size + selectedSessions.size;
  const isWalletActive = walletState === "connected" || walletState === "signing" || walletState === "done";

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.progressBar}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.progressDot} style={{ background: i <= 2 ? C.flat : C.surfaceGray }} />
          ))}
        </div>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Review &amp; publish</h2>
          <div className={styles.settingsWrap}>
            <button className={styles.settingsBtn} onClick={() => w.setShowSettings((v: boolean) => !v)}>
              <Ic.Settings s={18} c={C.textSecondary} />
            </button>
            {w.showSettings && (
              <div className={`${shared.glass} ${styles.settingsMenu}`}>
                {(w.walletConnected || w.embeddedWallet) && (
                  <button className={styles.settingsMenuItem} style={{ color: C.warning, fontFamily: FONT }} onClick={w.handleDisconnect}>
                    Disconnect wallet
                  </button>
                )}
                <button className={styles.settingsMenuItem} style={{ color: C.error, fontFamily: FONT }} onClick={w.handleClearAllData}>
                  Clear all data
                </button>
              </div>
            )}
          </div>
        </div>
        <p className={styles.subtitle}>
          {walletState === "idle" && "Connect your wallet, then sign to publish on-chain."}
          {walletState === "connecting" && "Connecting to your wallet..."}
          {walletState === "connected" && (parseFloat(w.effectiveBalance ?? "0") > 0
            ? "Wallet connected. Ready to publish."
            : "Scan QR to receive $TRUST, then sign to publish on-chain.")}
          {walletState === "signing" && (w.txStatus || "Signing transaction...")}
          {walletState === "done" && "Published! Redirecting..."}
        </p>
      </div>

      {/* Scroll area */}
      <div className={styles.scrollArea}>
        {/* Interests */}
        <div style={{ marginTop: 8 }}>
          <p className={styles.sectionLabel}>Interests ({selectedTracks.size})</p>
          <div className={styles.trackPills}>
            {[...selectedTracks].map((name) => {
              const ts = getTrackStyle(name);
              return (
                <span key={name} className={styles.trackPill} style={{ background: ts.color, borderColor: ts.color }}>
                  {ts.icon} {name}
                </span>
              );
            })}
          </div>
        </div>

        {/* Sessions */}
        {selectedSessionObjects.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p className={styles.sectionLabel}>Sessions ({selectedSessionObjects.length})</p>
            <div className={styles.sessionList}>
              {selectedSessionObjects.map((s) => {
                const ts = getTrackStyle(s.track);
                return (
                  <div key={s.id} className={shared.glass} style={{ ...glassSurface, padding: 12 }}>
                    <div className={styles.sessionRow}>
                      <span className={styles.sessionIcon}>{ts.icon}</span>
                      <span className={styles.sessionTitle}>{s.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* QR Code */}
        {isWalletActive ? (
          <div className={`${shared.glass} ${styles.qrCard}`}>
            <QRCodeSVG value={w.effectiveAddress ?? ""} size={160} bgColor="transparent" fgColor="#ffffff" level="M" />
            <div
              className={styles.addressRow}
              onClick={() => { if (w.effectiveAddress) { navigator.clipboard.writeText(w.effectiveAddress); w.setTxStatus("Address copied!"); setTimeout(() => w.setTxStatus(""), 2000); } }}
            >
              <p className={styles.address}>
                {w.effectiveAddress ? `${w.effectiveAddress.slice(0, 6)}...${w.effectiveAddress.slice(-4)}` : ""}
              </p>
              {w.effectiveAddress && <Ic.Copy s={14} c={C.textTertiary} />}
            </div>
            {w.effectiveBalance !== null && (
              <div className={styles.balanceRow}>
                <p className={styles.balance} style={{ color: parseFloat(w.effectiveBalance) > 0 ? C.success : C.warning }}>
                  {parseFloat(w.effectiveBalance) > 0 ? `${parseFloat(w.effectiveBalance).toFixed(4)} TRUST` : "Waiting for $TRUST..."}
                </p>
                {w.embeddedWallet && (
                  <button className={styles.refreshBtn} onClick={w.refreshEmbeddedBalance} disabled={w.balanceRefreshing}>
                    {w.balanceRefreshing ? "..." : "Refresh"}
                  </button>
                )}
              </div>
            )}
            {walletState === "connected" && w.walletConnected && (
              <button className={styles.disconnectLink} style={{ fontFamily: FONT }} onClick={w.disconnectWallet}>
                Disconnect wallet
              </button>
            )}
          </div>
        ) : (
          <div className={`${shared.glass} ${styles.qrCard}`}>
            <div className={styles.qrPlaceholder}>QR Code</div>
            <p className={styles.qrHint}>Connect wallet to show your address QR</p>
          </div>
        )}

        {/* Transaction details */}
        <div className={shared.glass} style={{ ...glassSurface, marginTop: 16, padding: 16 }}>
          <p className={styles.txDetailsTitle}>Transaction Details</p>
          <div className={styles.txRow}><span>Network</span><span>Intuition (Chain 1155)</span></div>
          <div className={styles.txRow}><span>Triples to create</span><span>{tripleCount}</span></div>
          <div className={styles.txRow}><span>Est. cost</span><span>{(tripleCount * 0.1).toFixed(1)} TRUST</span></div>
        </div>

        {/* Error */}
        {w.txError && (
          <div className={`${shared.glass} ${styles.errorCard}`}>
            <p className={styles.errorText}>{w.txError}</p>
            <button
              onClick={onSkip}
              style={{ background: "none", border: "none", color: C.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: FONT, padding: "8px 0", marginTop: 8 }}
            >
              Skip and enter the app &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        {w.embeddedMode === "backup" ? (
          <div className={styles.backupColumn}>
            <div className={`${shared.glass} ${styles.backupCard}`}>
              <p className={styles.backupWarning}>Save your private key! You won't see it again.</p>
              <p className={styles.backupKey}>{w.embeddedPrivateKey}</p>
              <button
                style={{ ...btnPill, height: 40, fontSize: 13, background: w.embeddedKeyCopied ? C.success : C.surfaceGray, color: w.embeddedKeyCopied ? "#0a0a0a" : C.textPrimary }}
                onClick={() => { navigator.clipboard.writeText(w.embeddedPrivateKey); w.setEmbeddedKeyCopied(true); }}
              >
                {w.embeddedKeyCopied ? "Copied!" : "Copy Private Key"}
              </button>
            </div>
            <button style={{ ...btnPill, background: C.flat }} onClick={w.handleBackupDone}>I've saved it — Continue</button>
          </div>
        ) : (
          <div className={styles.buttonRow}>
            {walletState !== "signing" && walletState !== "done" && (
              <button style={{ ...btnPill, flex: 1, background: C.surfaceGray, color: C.textPrimary }} onClick={onBack}>Back</button>
            )}
            {walletState === "idle" && w.embeddedMode === "none" && (
              <button style={{ ...btnPill, flex: 2, background: C.flat }} onClick={() => w.setShowWalletPicker(true)}>Connect Wallet</button>
            )}
            {walletState === "connecting" && (
              <button style={{ ...btnPill, flex: 2, background: C.flat, opacity: 0.5 }} disabled>Connecting...</button>
            )}
            {walletState === "connected" && (
              parseFloat(w.effectiveBalance ?? "0") > 0
                ? <button style={{ ...btnPill, flex: 2, background: C.flat }} onClick={onPublish}>Publish On-Chain</button>
                : <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 6 }}>
                    <button style={{ ...btnPill, background: C.flat, opacity: 0.5 }} disabled>Waiting for $TRUST...</button>
                    <button
                      onClick={onSkip}
                      style={{ background: "none", border: "none", color: C.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: FONT, padding: "8px 0" }}
                    >
                      Skip for now &rarr;
                    </button>
                  </div>
            )}
            {walletState === "signing" && (
              <button style={{ ...btnPill, flex: 1, background: C.flat, opacity: 0.5 }} disabled>Signing... {w.txStatus}</button>
            )}
            {walletState === "done" && (
              <button style={{ ...btnPill, flex: 1, background: C.success }} disabled>Published!</button>
            )}
          </div>
        )}
      </div>

      {/* Wallet Picker Modal */}
      {w.showWalletPicker && walletState === "idle" && (
        <WalletPickerModal
          onClose={() => w.setShowWalletPicker(false)}
          onExternalWallet={w.openWalletModal}
          onCreateEmbedded={w.handleCreateEmbedded}
          onUnlockEmbedded={async (pw: string) => { if (await w.handleUnlockEmbedded(pw)) w.setShowWalletPicker(false); }}
          onBackupDone={w.handleBackupDone}
          embeddedMode={w.embeddedMode}
          setEmbeddedMode={w.setEmbeddedMode}
          embeddedPrivateKey={w.embeddedPrivateKey}
          embeddedKeyCopied={w.embeddedKeyCopied}
          setEmbeddedKeyCopied={w.setEmbeddedKeyCopied}
          txError={w.txError}
        />
      )}
    </>
  );
}
