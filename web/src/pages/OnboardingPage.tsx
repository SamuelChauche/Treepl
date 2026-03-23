import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, btnPill, FONT, getTrackStyle } from "../config/theme";
import { sessions } from "../data";
import { SplashStep, SlideStep, InterestPicker, SessionPicker, WalletPickerModal } from "../components/onboarding";

import { VIBES } from "../data/social";
import { StorageService } from "../services/StorageService";
import { CBends } from "../components/ui/CBends";
import { SplashBg } from "../components/ui/SplashBg";
import { QRCodeSVG } from "qrcode.react";
import {
  ensureUserAtom,
  buildProfileTriples,
  createProfileTriples,
} from "../services/intuition";
import { useVibeMatches } from "../hooks/useVibeMatches";
import { useWalletConnection } from "../hooks/useWalletConnection";
import type { WalletConnection } from "../services/intuition";
import { usePwaInstall } from "../hooks/usePwaInstall";
import { explorerTxUrl, STORAGE_KEYS } from "../config/constants";
import {
  createEmbeddedWallet,
  connectEmbeddedWallet,
  markBackupDone,
} from "../services/embeddedWallet";

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

const center: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  padding: "0 24px",
  textAlign: "center",
};

const heading: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  margin: "16px 0 8px",
  color: C.white,
};

const sub: CSSProperties = {
  fontSize: 14,
  color: C.textSecondary,
  lineHeight: 1.5,
  maxWidth: 300,
};

const pillBtn: CSSProperties = { ...btnPill, background: C.flat, margin: "24px 24px 40px", width: "calc(100% - 48px)" };

// Image-based slides replaced emoji orbits

const trackPill: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: R.btn,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  border: "1px solid transparent",
  transition: "all 0.2s ease",
  fontFamily: FONT,
  color: C.textPrimary,
  background: C.surfaceGray,
};

// sessionCard style inlined in step 5

const scrollArea: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  padding: "0 20px 24px",
};

// sectionTitle inlined in steps

const bottomBar: CSSProperties = {
  flexShrink: 0,
  padding: "12px 24px 24px",
  background: "transparent",
  borderTop: `1px solid ${C.border}`,
  boxSizing: "border-box",
};

// ─── Component ──────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());

  // ── Wallet via AppKit hook ────────────────────────────────────
  const {
    wallet, address: walletAddress, isConnected: walletConnected,
    loading: walletLoading, error: walletError, balance: trustBalance,
    connect: openWalletModal, disconnect: disconnectWallet,
  } = useWalletConnection();

  const { canInstall, installed, promptInstall } = usePwaInstall();

  const [txState, setTxState] = useState<"idle"|"signing"|"done">("idle");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");
  const [txStatus, setTxStatus] = useState("");

  // ── Wallet picker modal ──────────────────────────────────
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [embeddedMode, setEmbeddedMode] = useState<"none"|"create"|"unlock"|"backup">("none");
  const [embeddedPassword, setEmbeddedPassword] = useState("");
  const [embeddedPrivateKey, setEmbeddedPrivateKey] = useState("");
  const [embeddedKeyCopied, setEmbeddedKeyCopied] = useState(false);
  const [embeddedWallet, setEmbeddedWallet] = useState<WalletConnection | null>(null);
  const [embeddedAddress, setEmbeddedAddress] = useState("");
  const [embeddedBalance, setEmbeddedBalance] = useState<string | null>(null);

  // Derive walletState from hook (AppKit or embedded)
  const walletState = txState !== "idle" ? txState
    : walletLoading ? "connecting" as const
    : (walletConnected && wallet) || embeddedWallet ? "connected" as const
    : "idle" as const;

  // Effective wallet — prefer AppKit, fallback to embedded
  const effectiveWallet = wallet ?? embeddedWallet;
  const effectiveAddress = walletAddress ?? embeddedAddress;
  const effectiveBalance = trustBalance ?? embeddedBalance;

  // Show wallet errors
  useEffect(() => {
    if (walletError) setTxError(walletError);
  }, [walletError]);

  // Notify when $TRUST is received (balance goes from 0 to > 0)
  const [trustNotified, setTrustNotified] = useState(false);
  useEffect(() => {
    if (trustNotified) return;
    const bal = parseFloat(effectiveBalance ?? "0");
    if (bal > 0 && walletState === "connected") {
      setTrustNotified(true);
      setTxStatus(`${bal.toFixed(4)} TRUST received!`);
      setTimeout(() => setTxStatus(""), 3000);
    }
  }, [effectiveBalance, walletState, trustNotified]);

  // ── Vibe matches (for step 7 success screen) ─────────────────
  const { matches: vibeMatchesData, loading: vibeLoading } = useVibeMatches(
    selectedTracks,
    [...selectedSessions],
    walletAddress ?? "",
  );

  // ── Embedded wallet handlers ─────────────────────────────────
  async function handleCreateEmbedded() {
    if (!embeddedPassword || embeddedPassword.length < 4) {
      setTxError("Password must be at least 4 characters");
      return;
    }
    setTxError("");
    try {
      const { address, privateKey } = await createEmbeddedWallet(embeddedPassword);
      setEmbeddedAddress(address);
      setEmbeddedPrivateKey(privateKey);
      setEmbeddedMode("backup");
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleUnlockEmbedded() {
    if (!embeddedPassword) return;
    setTxError("");
    try {
      const conn = await connectEmbeddedWallet(embeddedPassword);
      setEmbeddedWallet(conn);
      setEmbeddedAddress(conn.address);
      setEmbeddedMode("none");
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, conn.address);

      // Fetch balance
      const bal = await conn.provider.getBalance(conn.address);
      setEmbeddedBalance(conn.ethers.formatEther(bal));
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "Wrong password");
    }
  }

  async function handleBackupDone() {
    // After backup, unlock the wallet
    markBackupDone();
    setEmbeddedMode("none");
    setShowWalletPicker(false);
    try {
      const conn = await connectEmbeddedWallet(embeddedPassword);
      setEmbeddedWallet(conn);
      const bal = await conn.provider.getBalance(conn.address);
      setEmbeddedBalance(conn.ethers.formatEther(bal));
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleCreate() {
    if (!effectiveWallet) return;
    setTxState("signing");
    setTxError("");
    try {
      // Step 1: Ensure user atom exists
      setTxStatus("Creating your atom...");
      const atomId = await ensureUserAtom(effectiveWallet.multiVault, effectiveWallet.proxy, effectiveWallet.address, effectiveWallet.ethers);

      let lastHash = "";

      // Step 2: Deposit on track atoms for interests (position-based, no triples)
      const { TRACK_ATOM_IDS: trackMap, depositOnAtoms } = await import("../services/intuition");
      const resolvedTrackAtomIds = [...selectedTracks].map((t) => trackMap[t]).filter(Boolean);

      if (resolvedTrackAtomIds.length > 0) {
        setTxStatus(`Depositing on ${resolvedTrackAtomIds.length} interests...`);
        const depositResult = await depositOnAtoms(effectiveWallet, resolvedTrackAtomIds, undefined, setTxStatus);
        lastHash = depositResult.hash;
      }

      // Step 3: Create attending triples for sessions (kept as triples)
      const sessionTriples = buildProfileTriples(atomId, [], [...selectedSessions]);
      if (sessionTriples.length > 0) {
        setTxStatus(`Publishing ${sessionTriples.length} session triples...`);
        const tripleResult = await createProfileTriples(effectiveWallet.multiVault, effectiveWallet.proxy, effectiveWallet.address, sessionTriples);
        lastHash = tripleResult.hash;
        // Mark sessions as permanently published
        const published: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]");
        for (const sid of selectedSessions) {
          if (!published.includes(sid)) published.push(sid);
        }
        localStorage.setItem(STORAGE_KEYS.PUBLISHED_SESSIONS, JSON.stringify(published));
      }

      if (!lastHash) { setTxError("No interests or sessions selected."); setTxState("idle"); return; }

      setTxHash(lastHash);
      setTxState("done");
      setTimeout(() => setStep(7), 1000);
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : String(e));
      setTxState("idle");
    }
  }

  // Sessions matching selected tracks
  // matchingSessions moved to SessionPicker component

  const selectedSessionObjects = useMemo(
    () => sessions.filter((s) => selectedSessions.has(s.id)),
    [selectedSessions],
  );

  const toggleTrack = (name: string) => {
    setSelectedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleSession = (id: string) => {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleComplete = () => {
    StorageService.saveTopics(selectedTracks);
    StorageService.saveCart(selectedSessions);
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, "1");
    navigate("/home");
  };

  // ── Step 0: Splash ──────────────────────────────────────────
  if (step === 0) {
    return <div style={page}><SplashStep onNext={() => setStep(1)} /></div>;
  }

  // ── Steps 1-3: Slides ───────────────────────────────────────
  if (step >= 1 && step <= 3) {
    return <div style={page}><SlideStep slideIndex={step} onNext={() => setStep(step + 1)} /></div>;
  }

  // ── Step 4: Interest picker ─────────────────────────────────
  if (step === 4) {
    return (
      <InterestPicker
        selectedTracks={selectedTracks}
        onToggleTrack={toggleTrack}
        onBack={() => setStep(3)}
        onNext={() => setStep(5)}
      />
    );
  }

  // ── Step 5: Session picker ──────────────────────────────────
  if (step === 5) {
    return (
      <SessionPicker
        selectedTracks={selectedTracks}
        selectedSessions={selectedSessions}
        onToggleSession={toggleSession}
        onBack={() => setStep(4)}
        onNext={() => setStep(6)}
      />
    );
  }

  // ── Step 6: Review & publish ────────────────────────────────
  if (step === 6) {
    const tripleCount = selectedTracks.size + selectedSessions.size;
    return (
      <div style={page}>
        <div style={{ flexShrink: 0, padding: "0 24px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 20, marginTop: 16 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= 2 ? C.flat : C.surfaceGray }} />
            ))}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, margin: "0 0 6px" }}>Review &amp; publish</h2>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: "0 0 16px" }}>
            {walletState === "idle" && "Connect your wallet, then sign to publish on-chain."}
            {walletState === "connecting" && "Connecting to your wallet..."}
            {walletState === "connected" && (parseFloat(trustBalance ?? "0") > 0
              ? "Wallet connected. Ready to publish."
              : "Scan QR to receive $TRUST, then sign to publish on-chain.")}
            {walletState === "signing" && (txStatus || "Signing transaction...")}
            {walletState === "done" && "Published! Redirecting..."}
          </p>
        </div>
        <div style={scrollArea}>
            {/* Interests */}
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 10 }}>
                Interests ({selectedTracks.size})
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[...selectedTracks].map((name) => {
                  const ts = getTrackStyle(name);
                  return (
                    <span
                      key={name}
                      style={{
                        ...trackPill,
                        background: ts.color,
                        borderColor: ts.color,
                        color: "#fff",
                        cursor: "default",
                      }}
                    >
                      {ts.icon} {name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Sessions */}
            {selectedSessionObjects.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 10 }}>
                  Sessions ({selectedSessionObjects.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedSessionObjects.map((s) => {
                    const ts = getTrackStyle(s.track);
                    return (
                      <div key={s.id} style={{ ...glassSurface, padding: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <span style={{ flexShrink: 0 }}>{ts.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                            {s.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QR Code — show real QR when connected, placeholder when idle */}
            {walletState === "connected" || walletState === "signing" || walletState === "done" ? (
              <div
                style={{
                  ...glassSurface,
                  marginTop: 24,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <QRCodeSVG value={effectiveAddress ?? ""} size={160} bgColor="transparent" fgColor="#ffffff" level="M" />
                <p style={{ fontSize: 12, color: C.textSecondary, textAlign: "center", fontFamily: "monospace" }}>
                  {effectiveAddress ? `${effectiveAddress.slice(0, 6)}...${effectiveAddress.slice(-4)}` : ""}
                </p>
                {effectiveBalance !== null && (
                  <p style={{ fontSize: 14, fontWeight: 600, color: parseFloat(effectiveBalance) > 0 ? C.success : C.warning, textAlign: "center" }}>
                    {parseFloat(effectiveBalance) > 0
                      ? `${parseFloat(effectiveBalance).toFixed(4)} TRUST`
                      : "Waiting for $TRUST..."}
                  </p>
                )}
                {walletState === "connected" && walletConnected && (
                  <button
                    onClick={disconnectWallet}
                    style={{ fontSize: 12, color: C.error, background: "none", border: "none", cursor: "pointer", fontFamily: FONT, padding: "4px 0" }}
                  >
                    Disconnect wallet
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  ...glassSurface,
                  marginTop: 24,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: R.md,
                    border: `2px dashed ${C.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.textTertiary,
                    fontSize: 12,
                  }}
                >
                  QR Code
                </div>
                <p style={{ fontSize: 12, color: C.textSecondary, textAlign: "center" }}>
                  Connect wallet to show your address QR
                </p>
              </div>
            )}

            {/* Transaction details */}
            <div style={{ ...glassSurface, marginTop: 16, padding: 16 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.white,
                  marginBottom: 8,
                }}
              >
                Transaction Details
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>
                <span>Network</span>
                <span>Intuition (Chain 1155)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>
                <span>Triples to create</span>
                <span>{tripleCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSecondary }}>
                <span>Est. cost</span>
                <span>{(tripleCount * 0.1).toFixed(1)} TRUST</span>
              </div>
            </div>

            {/* Error message */}
            {txError && (
              <div style={{ ...glassSurface, marginTop: 16, padding: 14, borderColor: C.error }}>
                <p style={{ fontSize: 13, color: C.error, margin: 0 }}>{txError}</p>
              </div>
            )}
          </div>
        <div style={bottomBar}>
          <div style={{ display: "flex", gap: 12 }}>
            {walletState !== "signing" && walletState !== "done" && (
              <button
                style={{ ...btnPill, flex: 1, background: C.surfaceGray, color: C.textPrimary }}
                onClick={() => setStep(5)}
              >
                Back
              </button>
            )}
            {walletState === "idle" && embeddedMode === "none" && (
              <button style={{ ...btnPill, flex: 2, background: C.flat }} onClick={() => setShowWalletPicker(true)}>
                Connect Wallet
              </button>
            )}
            {walletState === "idle" && embeddedMode === "backup" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 2 }}>
                <div style={{ ...glassSurface, padding: 12, textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: C.warning, fontWeight: 600, margin: "0 0 8px" }}>
                    Save your private key! You won't see it again.
                  </p>
                  <p style={{ fontSize: 11, color: C.textSecondary, fontFamily: "monospace", wordBreak: "break-all", margin: "0 0 8px" }}>
                    {embeddedPrivateKey}
                  </p>
                  <button
                    style={{ ...btnPill, height: 36, fontSize: 13, background: embeddedKeyCopied ? C.success : C.surfaceGray, color: embeddedKeyCopied ? "#0a0a0a" : C.textPrimary }}
                    onClick={() => { navigator.clipboard.writeText(embeddedPrivateKey); setEmbeddedKeyCopied(true); }}
                  >
                    {embeddedKeyCopied ? "Copied!" : "Copy Private Key"}
                  </button>
                </div>
                <button style={{ ...btnPill, background: C.flat }} onClick={handleBackupDone}>
                  I've saved it — Continue
                </button>
              </div>
            )}
            {walletState === "connecting" && (
              <button style={{ ...btnPill, flex: 2, background: C.flat, opacity: 0.5 }} disabled>
                Connecting...
              </button>
            )}
            {walletState === "connected" && (
              parseFloat(effectiveBalance ?? "0") > 0 ? (
                <button style={{ ...btnPill, flex: 2, background: C.flat }} onClick={handleCreate}>
                  Publish On-Chain
                </button>
              ) : (
                <button style={{ ...btnPill, flex: 2, background: C.flat, opacity: 0.5 }} disabled>
                  Waiting for $TRUST...
                </button>
              )
            )}
            {walletState === "signing" && (
              <button style={{ ...btnPill, flex: 1, background: C.flat, opacity: 0.5 }} disabled>
                Signing... {txStatus}
              </button>
            )}
            {walletState === "done" && (
              <button style={{ ...btnPill, flex: 1, background: C.success }} disabled>
                Published!
              </button>
            )}
          </div>
        </div>

        {/* ── Wallet Picker Modal ──────────────────────────── */}
        {showWalletPicker && walletState === "idle" && (
          <WalletPickerModal
            onClose={() => setShowWalletPicker(false)}
            onExternalWallet={openWalletModal}
            onCreateEmbedded={async (pw) => { setEmbeddedPassword(pw); await handleCreateEmbedded(); }}
            onUnlockEmbedded={async (pw) => { setEmbeddedPassword(pw); await handleUnlockEmbedded(); }}
            onBackupDone={handleBackupDone}
            embeddedMode={embeddedMode}
            setEmbeddedMode={setEmbeddedMode}
            embeddedPrivateKey={embeddedPrivateKey}
            embeddedKeyCopied={embeddedKeyCopied}
            setEmbeddedKeyCopied={setEmbeddedKeyCopied}
            txError={txError}
          />
        )}
      </div>
    );
  }

  // ── Step 7: Success ─────────────────────────────────────────
  if (step === 7) {
    // Fallback to static VIBES data when no real matches exist
    const staticVibeMatches = VIBES.filter((v) =>
      v.shared.some((s) => selectedTracks.has(s)),
    ).slice(0, 4);

    // Build CBends items from selected tracks
    const cbendItems = [...selectedTracks].map((name) => ({
      c: getTrackStyle(name).color,
      v: 1,
    }));

    return (
      <div style={page}>
        <SplashBg>
          <div style={center}>
            <div
              style={{
                fontSize: 48,
                marginBottom: 16,
                animation: "pop-in 0.5s ease",
              }}
            >
              &#127881;
            </div>
            <h1 style={{ ...heading, fontSize: 28 }}>Profile Published!</h1>
            <p style={{ ...sub, marginTop: 8 }}>
              Your preferences are now on-chain.
            </p>

            {/* TX link */}
            {txHash && (
              <a
                href={explorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: C.primary,
                  textDecoration: "none",
                }}
              >
                View transaction &rarr;
              </a>
            )}

            {/* Interests with CBends */}
            <div
              style={{
                marginTop: 28,
                width: "100%",
                maxWidth: 340,
                textAlign: "left",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.textSecondary,
                  marginBottom: 10,
                }}
              >
                Your Interests
              </p>
              {cbendItems.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <CBends items={cbendItems} />
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[...selectedTracks].map((name) => {
                  const ts = getTrackStyle(name);
                  return (
                    <span
                      key={name}
                      style={{
                        ...trackPill,
                        background: ts.color,
                        borderColor: ts.color,
                        color: "#fff",
                        cursor: "default",
                      }}
                    >
                      {ts.icon} {name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Vibe matches — real data from Intuition GraphQL */}
            {vibeLoading && (
              <div style={{ marginTop: 24, width: "100%", maxWidth: 340, textAlign: "left" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>
                  Searching for your vibe tribe...
                </p>
              </div>
            )}

            {!vibeLoading && vibeMatchesData.length > 0 && (
              <div
                style={{
                  marginTop: 24,
                  width: "100%",
                  maxWidth: 340,
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.textSecondary,
                    marginBottom: 10,
                  }}
                >
                  Vibe Matches ({vibeMatchesData.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {vibeMatchesData.slice(0, 6).map((m) => (
                    <div
                      key={m.subjectTermId}
                      style={{
                        ...glassSurface,
                        padding: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0a0a0a",
                          flexShrink: 0,
                        }}
                      >
                        {m.label.slice(2, 4).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.white,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontFamily: "monospace",
                          }}
                        >
                          {m.label.slice(0, 6)}...{m.label.slice(-4)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: C.textSecondary,
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {m.sharedTopics.join(", ")}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: C.success,
                        }}
                      >
                        {m.matchScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback to static vibe matches when no real data */}
            {!vibeLoading && vibeMatchesData.length === 0 && staticVibeMatches.length > 0 && (
              <div
                style={{
                  marginTop: 24,
                  width: "100%",
                  maxWidth: 340,
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.textSecondary,
                    marginBottom: 10,
                  }}
                >
                  Vibe Matches
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {staticVibeMatches.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        ...glassSurface,
                        padding: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0a0a0a",
                          flexShrink: 0,
                        }}
                      >
                        {v.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.white,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {v.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: C.textSecondary,
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {v.shared.join(", ")}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: C.success,
                        }}
                      >
                        {v.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PWA Install prompt */}
          {canInstall && (
            <button
              style={{ ...btnPill, background: C.flat, marginBottom: 12 }}
              onClick={promptInstall}
            >
              Install App on Home Screen
            </button>
          )}
          {installed && (
            <div style={{ fontSize: 13, color: C.success, marginBottom: 12, fontWeight: 600 }}>
              App installed!
            </div>
          )}

          <button style={pillBtn} onClick={handleComplete}>
            Enter the App
          </button>
        </SplashBg>
        <style>{`
          @keyframes pop-in {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
