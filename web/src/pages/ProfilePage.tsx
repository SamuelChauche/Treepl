import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle } from "../config/theme";
import { STORAGE_KEYS } from "../config/constants";
import { Ic } from "../components/ui/Icons";
import { StorageService } from "../services/StorageService";
import { sessions } from "../data";
import { useVibeMatches } from "../hooks/useVibeMatches";
import { useEnsProfile } from "../hooks/useEnsProfile";
import { getSocialLinks } from "../services/ensService";
import { hasEmbeddedWallet, getEmbeddedAddress } from "../services/embeddedWallet";
import { syncProfileFromChain } from "../services/profileSync";

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

const settingsBtn: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: C.surfaceGray,
  border: "none",
  color: C.textSecondary,
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const inviteBtn: CSSProperties = {
  width: "calc(100% - 32px)",
  height: 48,
  borderRadius: R.btn,
  background: C.flat,
  color: "#0a0a0a",
  fontSize: 15,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  fontFamily: FONT,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  margin: "16px",
  boxSizing: "border-box" as const,
};

const sectionTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  padding: "20px 16px 10px",
  color: C.textPrimary,
};

const platformRow: CSSProperties = {
  ...glassSurface,
  margin: "0 16px 8px",
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const platformIcon: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: R.md,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
};

const platformInfo: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const platformName: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const platformDesc: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
  marginTop: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};


// ─── Component ───────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate();

  const walletAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) ?? "";
  const [savedTopics, setSavedTopics] = useState(() => StorageService.loadTopics());
  const topicNames = useMemo(() => [...savedTopics], [savedTopics]);
  const [publishedSessionIds, setPublishedSessionIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]"); }
    catch { return []; }
  });
  const savedCart = useMemo(() => StorageService.loadCart(), []);
  const [voteCount, setVoteCount] = useState(() => {
    try {
      const r = localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES);
      return r ? (JSON.parse(r) as unknown[]).length : 0;
    } catch { return 0; }
  });

  // Sync on-chain positions into localStorage on mount
  useEffect(() => {
    if (!walletAddress) return;
    syncProfileFromChain(walletAddress).then(() => {
      setSavedTopics(StorageService.loadTopics());
      try {
        setPublishedSessionIds(JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]"));
        const v = localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES);
        setVoteCount(v ? (JSON.parse(v) as unknown[]).length : 0);
      } catch { /* ignore */ }
    }).catch(() => {});
  }, [walletAddress]);

  // Detect if connected via embedded wallet (no ENS possible)
  const isEmbeddedWallet = hasEmbeddedWallet() && getEmbeddedAddress()?.toLowerCase() === walletAddress.toLowerCase();

  // ENS profile resolution — always try with wallet address, override with ensAddress if set
  const [ensAddress, setEnsAddress] = useState<string | null>(null);
  const ensLookupAddr = ensAddress ?? (walletAddress || null);
  const { profile: ensProfile, loading: ensLoading } = useEnsProfile(ensLookupAddr);
  const socialLinks = ensProfile ? getSocialLinks(ensProfile) : [];

  const handleReconnectEns = async () => {
    try {
      if (!window.ethereum) {
        alert("No external wallet detected. Install MetaMask to connect your ENS.");
        return;
      }
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setEnsAddress(addr);
    } catch {
      // User cancelled or no wallet
    }
  };

  // Real vibe matches — on-chain published data only, not cart
  const votedTopicIds = useMemo<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES) ?? "[]"); }
    catch { return []; }
  }, []);
  const { matches: realMatches, loading: matchesLoading } = useVibeMatches(
    savedTopics,
    publishedSessionIds,
    walletAddress,
    votedTopicIds
  );

  const matchCount = realMatches.length > 0 ? realMatches.length : (walletAddress ? 0 : null);

  return (
    <div style={page}>
      {/* Fixed color background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "#fff", borderRadius: `0 0 ${R.xl}px ${R.xl}px`, zIndex: 0 }} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))", position: "relative", zIndex: 1 }}>
      {/* Hero — same layout as VotePage */}
      <div style={{ background: "transparent", borderRadius: `0 0 ${R.xl}px ${R.xl}px`, padding: "0 0 24px", color: "#0a0a0a", overflow: "hidden", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "12px 20px 0" }}>
          <div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1 }}>
            {walletAddress ? (
              <>{walletAddress.slice(0, 6)}...<br/>{walletAddress.slice(-4)}</>
            ) : "Profile"}
          </div>
          <button style={{ ...settingsBtn, background: "rgba(0,0,0,0.1)", flexShrink: 0, marginTop: 4 }} onClick={() => navigate("/settings")}>
            <Ic.Settings s={18} c="#0a0a0a" />
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 12, padding: "0 20px" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{topicNames.length || "-"}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Interests</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{(publishedSessionIds.length + savedCart.size) || "-"}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Sessions</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{voteCount || "-"}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Votes</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{matchesLoading ? "..." : (matchCount ?? "-")}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>Matches</div>
          </div>
        </div>
      </div>

      {/* Invite Button */}
      <button style={inviteBtn} onClick={() => navigate("/invite")}>
        Invite Nearby Participants
      </button>

      {/* Social Profiles (from ENS) */}
      <div style={sectionTitle}>
        {ensProfile?.name ? `${ensProfile.name}` : "Social Profiles"}
      </div>
      {ensLoading && (
        <div style={{ ...glassSurface, margin: "0 16px 8px", padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.textSecondary }}>Loading ENS profile...</div>
        </div>
      )}
      {!ensLoading && socialLinks.length > 0 && socialLinks.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
        >
          <div style={platformRow}>
            <div style={{
              ...platformIcon,
              background: link.icon === "🐙" ? "rgba(51,51,51,0.2)"
                : link.icon === "𝕏" ? "rgba(255,255,255,0.08)"
                : link.icon === "💬" ? "rgba(88,101,242,0.2)"
                : "rgba(255,255,255,0.08)",
            }}>
              <span style={{ fontSize: 20 }}>{link.icon}</span>
            </div>
            <div style={platformInfo}>
              <div style={platformName}>{link.label}</div>
              <div style={platformDesc}>
                {link.icon === "🐙" ? "GitHub" : link.icon === "𝕏" ? "X / Twitter" : link.icon === "💬" ? "Discord" : "Website"}
              </div>
            </div>
            <Ic.Right s={16} c={C.textTertiary} />
          </div>
        </a>
      ))}
      {!ensLoading && socialLinks.length === 0 && (
        <div style={{ ...glassSurface, margin: "0 16px 8px", padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: isEmbeddedWallet ? 12 : 0 }}>
            {isEmbeddedWallet
              ? "Embedded wallet has no ENS. Connect an external wallet to load your socials."
              : walletAddress
                ? "No ENS profile found. Set up your ENS records to share your socials."
                : "Connect wallet to load your ENS profile"}
          </div>
          {isEmbeddedWallet && (
            <button
              onClick={handleReconnectEns}
              style={{
                padding: "10px 20px", borderRadius: R.btn, border: "none",
                background: C.flat, color: "#0a0a0a", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT,
              }}
            >
              Connect with ENS wallet
            </button>
          )}
        </div>
      )}
      {ensProfile?.name && (
        <div style={{ margin: "4px 16px 0", fontSize: 11, color: C.textTertiary, textAlign: "center" }}>
          Loaded from ENS: {ensProfile.name}
        </div>
      )}

      {/* My Interests */}
      {topicNames.length > 0 && (
        <>
          <div style={sectionTitle}>My Interests</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 16px" }}>
            {topicNames.map((name) => {
              const ts = getTrackStyle(name);
              return (
                <span key={name} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: R.btn, fontSize: 12, fontWeight: 500,
                  background: `${ts.color}22`, color: ts.color, fontFamily: FONT,
                }}>
                  {ts.icon} {name}
                </span>
              );
            })}
          </div>
        </>
      )}

      {/* My Sessions (published + in cart) */}
      {(() => {
        const allMySessionIds = new Set([...savedCart, ...publishedSessionIds]);
        if (allMySessionIds.size === 0) return null;
        return (
        <>
          <div style={sectionTitle}>My Sessions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 16px" }}>
            {sessions.filter((s) => allMySessionIds.has(s.id)).map((s) => {
              const ts = getTrackStyle(s.track);
              const isPublished = publishedSessionIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => navigate(`/session/${s.id}`)}
                  style={{ ...glassSurface, padding: 12, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{ts.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>{s.startTime} · {s.stage}</div>
                  </div>
                  {isPublished
                    ? <Ic.Check s={14} c={C.success} />
                    : <span style={{ fontSize: 10, color: C.flat, fontWeight: 600 }}>In cart</span>
                  }
                </div>
              );
            })}
          </div>
        </>
        );
      })()}

      </div>
    </div>
  );
}
