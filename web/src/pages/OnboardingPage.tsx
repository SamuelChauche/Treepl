import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, btnPill, FONT, getTrackStyle } from "../config/theme";
import { sessions, trackNames } from "../data";
import { Ic } from "../components/ui/Icons";

import { VIBES } from "../data/social";
import { StorageService } from "../services/StorageService";
import { CBends } from "../components/ui/CBends";
import { Dots } from "../components/ui/Dots";
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
  hasEmbeddedWallet,
  createEmbeddedWallet,
  connectEmbeddedWallet,
  markBackupDone,
} from "../services/embeddedWallet";
// Logo image loaded from public/images/logo-splash.webp

// ─── Image base path (matches Vite base) ───────────────────────
const IMG = import.meta.env.BASE_URL + "images/";

// ─── Slide data ─────────────────────────────────────────────────
const SLIDES = [
  {
    image: `${IMG}slide-interests.webp`,
    title: "Share what\nyou love",
    subtitle: "Your interests, on-chain.",
    size: 360,
  },
  {
    image: `${IMG}slide-sessions.webp`,
    title: "Find the best\nsessions",
    subtitle: "83 talks, workshops & panels.",
    size: 360,
  },
  {
    image: `${IMG}slide-vibes.webp`,
    title: "Meet your\nvibe matches",
    subtitle: "Connect with nearby attendees.",
    size: 842,
  },
];

// ─── Preload all slide images on module load ────────────────────
const ALL_IMAGES = [
  `${IMG}logo-splash.webp`,
  `${IMG}slide-interests.webp`,
  `${IMG}slide-sessions.webp`,
  `${IMG}slide-vibes.webp`,
];
ALL_IMAGES.forEach((src) => {
  const img = new Image();
  img.src = src;
});

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
    connect: openWalletModal,
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
  const hasEmbedded = hasEmbeddedWallet();

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
      localStorage.setItem("ethcc-wallet-address", conn.address);

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
  const matchingSessions = useMemo(
    () => sessions.filter((s) => selectedTracks.has(s.track)).slice(0, 20),
    [selectedTracks],
  );

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
    localStorage.setItem("ethcc-onboarded", "1");
    navigate("/home");
  };

  // ── Step 0: Splash ──────────────────────────────────────────
  if (step === 0) {
    return (
      <div style={page}>
        <SplashBg>
          <div style={center}>
            <img
              src={`${IMG}logo-splash.webp`}
              alt="EthCC Sofia"
              style={{ width: 320, height: 320, objectFit: "contain", maxWidth: "100%" }}
            />
            <h1 style={{ ...heading, fontSize: 44, marginTop: 20, letterSpacing: -1 }}>EthCC[9]</h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.9)", fontWeight: 700, marginTop: 6 }}>
              Sofia Manager
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
              Cannes &middot; Mar 30 &ndash; Apr 2, 2026
            </p>
          </div>
          <button style={pillBtn} onClick={() => setStep(1)}>
            Get Started
          </button>
        </SplashBg>
      </div>
    );
  }

  // ── Steps 1-3: Slides ───────────────────────────────────────
  if (step >= 1 && step <= 3) {
    const slide = SLIDES[step - 1];
    return (
      <div style={page}>
        <SplashBg>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minHeight: 0 }}>
            <img
              src={slide.image}
              alt={slide.title}
              loading="eager"
              style={{ width: slide.size, maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          </div>
          <div style={{ flexShrink: 0, padding: "0 24px 40px", textAlign: "center" }}>
            <Dots n={3} a={step - 1} />
            <h2 style={{ ...heading, fontSize: 28, lineHeight: 1.2, margin: "28px 0 8px", whiteSpace: "pre-line" }}>
              {slide.title}
            </h2>
            <p style={{ ...sub, margin: "0 auto 32px" }}>{slide.subtitle}</p>
            <button style={{ ...btnPill, background: C.flat }} onClick={() => setStep(step + 1)}>
              Next
            </button>
          </div>
        </SplashBg>
      </div>
    );
  }

  // ── Step 4: Interest picker ─────────────────────────────────
  if (step === 4) {
    return (
      <div style={page}>
        <div style={{ flexShrink: 0, padding: "0 20px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 20, marginTop: 16 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i === 0 ? C.flat : C.surfaceGray }} />
            ))}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, margin: "0 0 6px" }}>Choose your interests</h2>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: "0 0 16px" }}>
            Published on Intuition Protocol as on-chain triples.
          </p>
        </div>
        <div style={scrollArea}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {trackNames.map((name) => {
              const ts = getTrackStyle(name);
              const active = selectedTracks.has(name);
              return (
                <button
                  key={name}
                  style={{
                    ...trackPill,
                    height: 42,
                    background: active ? ts.color : C.surfaceGray,
                    borderColor: active ? ts.color : "transparent",
                    color: active ? "#fff" : C.textSecondary,
                  }}
                  onClick={() => toggleTrack(name)}
                >
                  <span>{ts.icon}</span>
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div style={bottomBar}>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              style={{ ...btnPill, flex: 1, background: C.surfaceGray, color: C.textPrimary }}
              onClick={() => setStep(3)}
            >
              Back
            </button>
            <button
              style={{ ...btnPill, background: C.flat, flex: 2, opacity: selectedTracks.size === 0 ? 0.4 : 1 }}
              disabled={selectedTracks.size === 0}
              onClick={() => setStep(5)}
            >
              Continue &middot; {selectedTracks.size} selected
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 5: Session picker ──────────────────────────────────
  if (step === 5) {
    return (
      <div style={page}>
        <div style={{ flexShrink: 0, padding: "0 24px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 20, marginTop: 16 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= 1 ? C.flat : C.surfaceGray }} />
            ))}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, margin: "0 0 6px" }}>Add sessions to cart</h2>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: "0 0 16px" }}>
            Select sessions you want to attend.
          </p>
        </div>
        <div style={scrollArea}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {matchingSessions.length === 0 && (
              <p style={{ fontSize: 14, color: C.textTertiary, textAlign: "center", padding: 20 }}>
                No sessions match your selected tracks.
              </p>
            )}
            {matchingSessions.map((s) => {
              const ts = getTrackStyle(s.track);
              const checked = selectedSessions.has(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleSession(s.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: 14,
                    borderRadius: R.lg, cursor: "pointer",
                    background: checked ? `${ts.color}15` : C.surfaceGray,
                    border: `1.5px solid ${checked ? ts.color : C.border}`,
                  }}
                >
                  {/* Color accent bar */}
                  <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: ts.color, flexShrink: 0 }} />
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: `${ts.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {ts.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.speakers.length > 0 ? s.speakers[0].name : "TBA"} &middot; {s.startTime}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: ts.color, marginTop: 2, display: "inline-block" }}>
                      {s.track}
                    </span>
                  </div>
                  <div style={{
                    width: 24, height: 24, borderRadius: 12,
                    border: `2px solid ${checked ? ts.color : C.textTertiary}`,
                    background: checked ? ts.color : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {checked && <Ic.Check s={14} c={C.white} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={bottomBar}>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              style={{ ...btnPill, flex: 1, background: C.surfaceGray, color: C.textPrimary }}
              onClick={() => setStep(4)}
            >
              Back
            </button>
            <button style={{ ...btnPill, background: C.flat, flex: 2 }} onClick={() => setStep(6)}>
              {selectedSessions.size > 0 ? `Review \u00B7 ${selectedSessions.size}` : "Skip"}
            </button>
          </div>
        </div>
      </div>
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
          <div
            style={{
              position: "absolute", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
            onClick={() => { if (embeddedMode === "none") setShowWalletPicker(false); }}
          >
            <div
              style={{
                width: "100%", maxWidth: 390, padding: 24, paddingBottom: 32,
                background: C.background, borderRadius: "20px 20px 0 0",
                border: `1px solid ${C.border}`, borderBottom: "none",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Connect Wallet</h3>
                <button
                  onClick={() => { setShowWalletPicker(false); setEmbeddedMode("none"); setEmbeddedPassword(""); }}
                  style={{ width: 32, height: 32, borderRadius: 16, background: C.surfaceGray, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Ic.X s={16} c={C.textSecondary} />
                </button>
              </div>

              {embeddedMode === "none" && (
                <>
                  {/* External wallet option */}
                  <div
                    style={{ ...glassSurface, padding: 16, marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
                    onClick={() => { setShowWalletPicker(false); openWalletModal(); }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Ic.Wallet s={22} c={C.flat} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>External Wallet</div>
                      <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>MetaMask, WalletConnect, Coinbase...</div>
                    </div>
                    <Ic.Right s={16} c={C.textTertiary} />
                  </div>

                  {/* Embedded wallet option */}
                  <div
                    style={{ ...glassSurface, padding: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
                    onClick={() => setEmbeddedMode(hasEmbedded ? "unlock" : "create")}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Ic.Plus s={22} c={C.primary} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{hasEmbedded ? "Unlock Embedded Wallet" : "Create Embedded Wallet"}</div>
                      <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                        {hasEmbedded ? "Enter your password to unlock" : "No wallet? We'll create one for you"}
                      </div>
                    </div>
                    <Ic.Right s={16} c={C.textTertiary} />
                  </div>
                </>
              )}

              {(embeddedMode === "create" || embeddedMode === "unlock") && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {embeddedMode === "create" ? "Create a password for your wallet" : "Enter your wallet password"}
                  </div>
                  <input
                    type="password"
                    value={embeddedPassword}
                    onChange={(e) => setEmbeddedPassword(e.target.value)}
                    placeholder="Password"
                    autoFocus
                    style={{
                      width: "100%", padding: "14px 16px", borderRadius: R.lg,
                      border: `1px solid ${C.border}`, background: C.surfaceGray,
                      color: C.textPrimary, fontSize: 15, fontFamily: FONT,
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <button
                    style={{ ...btnPill, background: C.flat }}
                    onClick={async () => {
                      if (embeddedMode === "create") {
                        await handleCreateEmbedded();
                      } else {
                        await handleUnlockEmbedded();
                        setShowWalletPicker(false);
                      }
                    }}
                  >
                    {embeddedMode === "create" ? "Create Wallet" : "Unlock"}
                  </button>
                  <button
                    style={{ ...btnPill, background: C.surfaceGray, color: C.textSecondary }}
                    onClick={() => { setEmbeddedMode("none"); setEmbeddedPassword(""); }}
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          </div>
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
