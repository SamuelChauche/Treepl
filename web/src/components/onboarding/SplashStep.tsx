import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SplashBg } from "../ui/SplashBg";
import { C, FONT } from "../../config/theme";
import { hasEmbeddedWallet } from "../../services/embeddedWallet";
import { useEmbeddedWallet } from "../../contexts/EmbeddedWalletContext";
import { STORAGE_KEYS } from "../../config/constants";
import styles from "./SplashStep.module.css";

const IMG = import.meta.env.BASE_URL + "images/";

interface Props {
  onNext: () => void;
}

export function SplashStep({ onNext }: Props) {
  const navigate = useNavigate();
  const embeddedCtx = useEmbeddedWallet();
  const hasWallet = hasEmbeddedWallet();

  const [showUnlock, setShowUnlock] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = async () => {
    if (!password) return;
    setUnlocking(true);
    setError("");
    const ok = await embeddedCtx.unlock(password);
    setUnlocking(false);
    if (ok) {
      localStorage.setItem(STORAGE_KEYS.ONBOARDED, "1");
      navigate("/home");
    } else {
      setError("Wrong password");
    }
  };

  return (
    <SplashBg>
      <div className={styles.container}>
        <img
          src={`${IMG}sofia-splash.png`}
          alt="EthCC Sofia"
          className={styles.logo}
        />
        <h1 className={styles.title}>EthCC[9]</h1>
        <p className={styles.subtitle}>Sofia Manager</p>
        <p className={styles.date}>Cannes &middot; Mar 30 &ndash; Apr 2, 2026</p>
      </div>

      {showUnlock ? (
        <div style={{ padding: "0 24px 40px", width: "100%", boxSizing: "border-box" }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your wallet password"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
            style={{
              width: "100%", height: 48, borderRadius: 14,
              background: C.surfaceGray, border: "none", color: C.textPrimary,
              fontSize: 15, padding: "0 16px", fontFamily: FONT,
              boxSizing: "border-box", marginBottom: 10,
            }}
          />
          {error && <p style={{ color: C.error, fontSize: 13, margin: "0 0 10px", textAlign: "center" }}>{error}</p>}
          <button
            className={styles.startBtn}
            style={{ margin: 0, width: "100%", opacity: unlocking ? 0.5 : 1 }}
            onClick={handleUnlock}
            disabled={unlocking}
          >
            {unlocking ? "Unlocking..." : "Unlock Wallet"}
          </button>
          <button
            onClick={() => { setShowUnlock(false); setPassword(""); setError(""); }}
            style={{
              width: "100%", marginTop: 10, padding: "12px 0",
              background: "none", border: "none", color: C.textSecondary,
              fontSize: 14, cursor: "pointer", fontFamily: FONT,
            }}
          >
            Back
          </button>
        </div>
      ) : (
        <div style={{ padding: "0 24px 40px", width: "100%", boxSizing: "border-box" }}>
          <button className={styles.startBtn} style={{ margin: "0 0 10px", width: "100%" }} onClick={onNext}>
            Get Started
          </button>
          {hasWallet && (
            <button
              onClick={() => setShowUnlock(true)}
              style={{
                width: "100%", padding: "14px 0",
                background: "none", border: `1px solid ${C.border}`, borderRadius: 28,
                color: C.textPrimary, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT,
              }}
            >
              I already have a wallet
            </button>
          )}
        </div>
      )}
    </SplashBg>
  );
}
