import { useMemo, useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glass, glassSurface, FONT, getTrackStyle, avatarColor } from "../config/theme";
import { CartToggleButton } from "../components/shared";
import { sessions, dates } from "../data";
import { Ic } from "../components/ui/Icons";
import { useCart } from "../hooks/useCart";
import { useVibeMatches } from "../hooks/useVibeMatches";
import { StorageService } from "../services/StorageService";
import {
  hasEmbeddedWallet,
  getEmbeddedAddress,
  isBackupDone,
  connectEmbeddedWallet,
  markBackupDone,
} from "../services/embeddedWallet";
import { STORAGE_KEYS } from "../config/constants";
import { useEmbeddedWallet } from "../contexts/EmbeddedWalletContext";

// ─── Styles ─────────────────────────────────────────────────────
const page: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "transparent",
  color: C.textPrimary,
  fontFamily: FONT,
  overflow: "hidden",
};

const heroSection: CSSProperties = {
  background: C.flat,
  borderRadius: `0 0 ${R.xl}px ${R.xl}px`,
  padding: "0 0 24px",
  position: "relative",
  overflow: "hidden",
  boxSizing: "border-box",
};

const headerRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 20px 0",
};

const balanceWrap: CSSProperties = {
  textAlign: "center",
  padding: "20px 20px 0",
};

const balanceAmount: CSSProperties = {
  fontSize: 36,
  fontWeight: 900,
  color: "#0a0a0a",
  letterSpacing: -1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const balanceLabel: CSSProperties = {
  fontSize: 13,
  color: "rgba(10,10,10,0.5)",
  marginTop: 4,
};

const addBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  marginTop: 16,
  padding: "10px 24px",
  borderRadius: R.btn,
  background: "rgba(0,0,0,0.15)",
  color: "#0a0a0a",
  fontSize: 14,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  fontFamily: FONT,
};

const actionBar: CSSProperties = {
  ...glass,
  borderRadius: R.lg,
  margin: "-20px 20px 0",
  padding: "16px 0",
  display: "flex",
  justifyContent: "center",
  gap: 32,
  position: "relative",
  boxSizing: "border-box",
};

const actionCircle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  background: "none",
  border: "none",
  fontFamily: FONT,
  color: C.textPrimary,
};

const circleIcon: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 18,
  background: C.flat,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const sectionHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "24px 20px 12px",
};

const sectionTitle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: C.white,
};

// vibeCardStyle removed — now using VibeCard component

const sessionRow: CSSProperties = {
  ...glassSurface,
  padding: 14,
  display: "flex",
  alignItems: "center",
  gap: 12,
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxSizing: "border-box",
};

// ─── Component ──────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { cart, toggleCart } = useCart();
  const publishedSessions: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]");

  const [walletAddress, setWalletAddress] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) ?? ""
  );
  const embeddedCtx = useEmbeddedWallet();
  const trustBalance = embeddedCtx.balance ?? "0.000";

  // Re-check localStorage when page becomes visible (coming back from BuyTrust, etc.)
  useEffect(() => {
    const handleFocus = () => {
      const saved = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) ?? "";
      setWalletAddress(saved);
      embeddedCtx.refreshBalance();
    };
    window.addEventListener("focus", handleFocus);
    handleFocus();
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Today's sessions: filter by first available date
  const todaySessions = useMemo(() => {
    const firstDate = dates[0];
    if (!firstDate) return [];
    return sessions.filter((s) => s.date === firstDate).slice(0, 10);
  }, []);

  // Real vibe matches — use ONLY on-chain published data, not cart
  const savedTopics = useMemo(() => StorageService.loadTopics(), []);
  const publishedSessionIds = useMemo<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]"); }
    catch { return []; }
  }, []);
  const { matches: vibeMatches, loading: vibesLoading } = useVibeMatches(
    savedTopics, publishedSessionIds, walletAddress,
  );

  // Embedded wallet state
  const isEmbedded = hasEmbeddedWallet() && getEmbeddedAddress() === walletAddress;
  const needsBackup = isEmbedded && !isBackupDone();
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [walletUnlocked, setWalletUnlocked] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(needsBackup);
  const [backupKey, setBackupKey] = useState("");

  const handleUnlock = async () => {
    setUnlockError("");
    const ok = await embeddedCtx.unlock(unlockPassword);
    if (ok) {
      setWalletUnlocked(true);
      setShowUnlock(false);
      setUnlockPassword("");
    } else {
      setUnlockError("Wrong password");
    }
  };

  const handleBackupAck = () => {
    markBackupDone();
    setShowBackupReminder(false);
    setBackupKey("");
  };

  return (
    <div style={page}>
      {/* Fixed color background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: C.flat, borderRadius: `0 0 ${R.xl}px ${R.xl}px`, zIndex: 0 }} />

      {/* ── Scrollable content ─────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", position: "relative", zIndex: 1 }}>
      {/* ── Hero / Balance ─────────────────────────────────── */}
      <div style={{ ...heroSection, background: "transparent" }}>
        <div style={{ ...headerRow, paddingTop: 16 }}>
          <span style={{ fontSize: 14, color: "rgba(0,0,0,0.6)" }}>EthCC[9] Cannes</span>
          <button
            onClick={() => navigate("/leaderboard")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <Ic.Trophy s={22} c="#0a0a0a" />
          </button>
        </div>
        <div style={balanceWrap}>
          <div style={balanceAmount}>
            {walletAddress
              ? `${parseFloat(trustBalance).toFixed(4)} $TRUST`
              : "\u2014 $TRUST"}
          </div>
          <div style={balanceLabel}>Available Balance</div>
          <button style={addBtn} onClick={() => navigate("/buy")}>
            <Ic.Plus s={14} c="#0a0a0a" />
            {walletAddress ? "Add TRUST" : "Connect Wallet"}
          </button>
        </div>
      </div>
      {/* ── Glass action bar ───────────────────────────────── */}
      <div style={actionBar}>
        <button style={actionCircle} onClick={() => navigate("/send")}>
          <div style={{ ...circleIcon, background: "#D790C7" }}>
            <Ic.Send s={22} c="#0a0a0a" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>Send</span>
        </button>
        <button style={actionCircle} onClick={() => navigate("/invite")}>
          <div style={{ ...circleIcon, background: "#cea2fd" }}>
            <Ic.Share s={22} c="#0a0a0a" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>Invite</span>
        </button>
      </div>

      {/* ── Backup reminder (embedded wallet, never backed up) ── */}
      {showBackupReminder && isEmbedded && (
        <div style={{ ...glassSurface, margin: "0 16px 12px", padding: 14, border: `1px solid ${C.warning}44` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.warning, marginBottom: 6 }}>
            Backup your private key
          </div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 10 }}>
            You created an embedded wallet but never saved your private key. If you lose it, your funds are gone.
          </div>
          {backupKey ? (
            <>
              <div style={{ fontSize: 11, color: C.textSecondary, fontFamily: "monospace", wordBreak: "break-all", background: C.surfaceGray, padding: 10, borderRadius: R.md, marginBottom: 8 }}>
                {backupKey}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { navigator.clipboard.writeText(backupKey); }}
                  style={{ flex: 1, padding: "8px 0", borderRadius: R.btn, border: "none", background: C.surfaceGray, color: C.textPrimary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
                >
                  Copy
                </button>
                <button
                  onClick={handleBackupAck}
                  style={{ flex: 1, padding: "8px 0", borderRadius: R.btn, border: "none", background: C.flat, color: "#0a0a0a", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
                >
                  I've saved it
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={async () => {
                // Need password to reveal key
                const pw = prompt("Enter your wallet password to reveal the key:");
                if (!pw) return;
                try {
                  const conn = await connectEmbeddedWallet(pw);
                  embeddedCtx.setWalletDirectly(conn, conn.address);
                  setBackupKey(conn.signer.privateKey ?? "Could not retrieve key");
                } catch {
                  alert("Wrong password");
                }
              }}
              style={{ padding: "8px 16px", borderRadius: R.btn, border: "none", background: C.warning, color: "#0a0a0a", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
            >
              Reveal Private Key
            </button>
          )}
        </div>
      )}

      {/* ── Unlock embedded wallet banner ──────────────────── */}
      {isEmbedded && !walletUnlocked && !showUnlock && (
        <div
          style={{ ...glassSurface, margin: "0 16px 12px", padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", border: `1px solid ${C.primary}44` }}
          onClick={() => setShowUnlock(true)}
        >
          <Ic.Wallet s={20} c={C.primary} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>Unlock Embedded Wallet</div>
            <div style={{ fontSize: 11, color: C.textSecondary }}>Enter password to sign transactions</div>
          </div>
          <Ic.Right s={16} c={C.textTertiary} />
        </div>
      )}

      {showUnlock && (
        <div style={{ ...glassSurface, margin: "0 16px 12px", padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Enter wallet password</div>
          <input
            type="password"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%", padding: "10px 14px", borderRadius: R.md,
              border: `1px solid ${C.border}`, background: C.surfaceGray,
              color: C.textPrimary, fontSize: 14, fontFamily: FONT,
              outline: "none", boxSizing: "border-box", marginBottom: 8,
            }}
          />
          {unlockError && <div style={{ fontSize: 11, color: C.error, marginBottom: 6 }}>{unlockError}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setShowUnlock(false); setUnlockPassword(""); setUnlockError(""); }}
              style={{ flex: 1, padding: "8px 0", borderRadius: R.btn, border: "none", background: C.surfaceGray, color: C.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
            >
              Cancel
            </button>
            <button
              onClick={handleUnlock}
              style={{ flex: 1, padding: "8px 0", borderRadius: R.btn, border: "none", background: C.flat, color: "#0a0a0a", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}
            >
              Unlock
            </button>
          </div>
        </div>
      )}

      {/* ── Vibe Matches (real on-chain data) ────────────── */}
      {vibeMatches.length > 0 && (
        <>
          <div style={sectionHeader}>
            <span style={sectionTitle}>Nearby Vibes</span>
            <span
              style={{ fontSize: 12, color: C.flat, cursor: "pointer" }}
              onClick={() => navigate("/vibes")}
            >
              See all
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 20px 8px", scrollbarWidth: "none" }}>
            {vibeMatches.slice(0, 8).map((m, idx) => (
              <div
                key={m.subjectTermId}
                onClick={() => navigate(`/vibe/${idx}`)}
                style={{
                  ...glassSurface, padding: 14, minWidth: 140, maxWidth: 160,
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 8, cursor: "pointer", flexShrink: 0,
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 24, background: avatarColor(m.label), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#0a0a0a" }}>
                  {m.label.slice(2, 4).toUpperCase()}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.white, fontFamily: "monospace", textAlign: "center" }}>
                  {m.label.slice(0, 6)}...{m.label.slice(-4)}
                </div>
                <div style={{ fontSize: 11, color: C.textSecondary, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                  {m.sharedTopics.slice(0, 2).join(", ")}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.success }}>{m.matchScore}%</span>
              </div>
            ))}
          </div>
        </>
      )}
      {vibesLoading && (
        <div style={{ padding: "16px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 13, color: C.textSecondary }}>Finding vibe matches...</span>
        </div>
      )}

      {/* ── Today's Sessions ───────────────────────────────── */}
      <div style={sectionHeader}>
        <span style={sectionTitle}>Today's Sessions</span>
        <span
          style={{ fontSize: 12, color: C.flat, cursor: "pointer" }}
          onClick={() => navigate("/agenda")}
        >
          View all
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "0 20px 24px",
        }}
      >
        {todaySessions.map((s) => {
          const ts = getTrackStyle(s.track);
          const isPublished = publishedSessions.includes(s.id);
          const inCart = isPublished || cart.has(s.id);
          return (
            <div
              key={s.id}
              style={sessionRow}
              onClick={() => navigate(`/session/${s.id}`)}
            >
              {/* Track accent */}
              <div
                style={{
                  width: 4,
                  alignSelf: "stretch",
                  borderRadius: 2,
                  background: ts.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 20, flexShrink: 0 }}>{ts.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.white,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.speakers.length > 0 ? s.speakers[0].name : "TBA"} &middot;{" "}
                  {s.startTime} &ndash; {s.endTime}
                </div>
              </div>
              <CartToggleButton
                state={isPublished ? "published" : inCart ? "incart" : "default"}
                onClick={() => { if (!isPublished) toggleCart(s.id); }}
              />
            </div>
          );
        })}
        {todaySessions.length === 0 && (
          <p style={{ fontSize: 14, color: C.textSecondary, textAlign: "center", padding: 20 }}>
            No sessions scheduled for today.
          </p>
        )}
      </div>
      </div>
    </div>
  );
}
