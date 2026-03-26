import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle, avatarColor } from "../config/theme";
import { STORAGE_KEYS } from "../config/constants";
import { Ic } from "../components/ui/Icons";
import { StorageService } from "../services/StorageService";
import { sessions } from "../data";
import { useVibeMatches } from "../hooks/useVibeMatches";
import { useEnsProfile } from "../hooks/useEnsProfile";
import { getSocialLinks } from "../services/ensService";
import { hasEmbeddedWallet, getEmbeddedAddress } from "../services/embeddedWallet";
import { syncProfileFromChain } from "../services/profileSync";
import { fetchUserNickname } from "../services/intuition";
import { useFollow } from "../hooks/useFollow";
import {
  scrollContent, fluidContent, cardTitle, metaText, inCartBadge, glassInfoCard,
  listColumn, glassListItem, trackBadge, avatarSmall, monoText,
  truncateLabel, getInitials,
} from "../styles/common";

// ─── Styles ──────────────────────────────────────────

const page: CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column",
  background: "transparent", color: C.textPrimary, fontFamily: FONT, overflow: "hidden",
};
const settingsBtn: CSSProperties = {
  width: 42, height: 42, borderRadius: 14, background: C.surfaceGray,
  border: "none", color: C.textSecondary, fontSize: 18,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const inviteBtn: CSSProperties = {
  width: "calc(100% - 32px)", height: 48, borderRadius: R.btn,
  background: C.flat, color: "#0a0a0a", fontSize: 15, fontWeight: 600,
  border: "none", cursor: "pointer", fontFamily: FONT,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  margin: "16px", boxSizing: "border-box" as const,
};
const sectionTitle: CSSProperties = {
  fontSize: 16, fontWeight: 700, padding: "20px 16px 10px", color: C.textPrimary,
};
const platformRow: CSSProperties = {
  ...glassSurface, margin: "0 16px 8px", padding: "12px 16px",
  display: "flex", alignItems: "center", gap: 12,
};
const platformIcon: CSSProperties = {
  width: 36, height: 36, borderRadius: R.md,
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
};
const platformInfo: CSSProperties = { flex: 1, minWidth: 0 };
const platformName: CSSProperties = {
  fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
};
const platformDesc: CSSProperties = {
  fontSize: 11, color: C.textSecondary, marginTop: 1,
  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
};
const heroBackground: CSSProperties = {
  position: "absolute", top: 0, left: 0, right: 0, height: 200,
  background: "#fff", borderRadius: `0 0 ${R.xl}px ${R.xl}px`, zIndex: 0,
};
const heroSection: CSSProperties = {
  background: "transparent", borderRadius: `0 0 ${R.xl}px ${R.xl}px`,
  padding: "0 0 24px", color: "#0a0a0a", overflow: "hidden", boxSizing: "border-box",
};
const heroHeader: CSSProperties = {
  display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "12px 20px 0",
};
const heroSubAddr: CSSProperties = {
  fontSize: 12, color: "rgba(0,0,0,0.5)", fontFamily: "monospace", marginTop: 4,
};
const heroStatsRow: CSSProperties = {
  display: "flex", justifyContent: "space-between", gap: 8, marginTop: 12, padding: "0 20px",
};
const heroStatCell: CSSProperties = { flex: 1, textAlign: "center" };
const heroStatValue: CSSProperties = { fontSize: 22, fontWeight: 700 };
const heroStatLabel: CSSProperties = { fontSize: 11, opacity: 0.6, marginTop: 2 };
const ensInfoCard: CSSProperties = {
  ...glassSurface, margin: "0 16px 8px", padding: 16, textAlign: "center",
};
const ensConnectBtn: CSSProperties = {
  padding: "10px 20px", borderRadius: R.btn, border: "none",
  background: C.flat, color: "#0a0a0a", fontSize: 13, fontWeight: 600,
  cursor: "pointer", fontFamily: FONT,
};
const ensFooter: CSSProperties = {
  margin: "4px 16px 0", fontSize: 11, color: C.textTertiary, textAlign: "center",
};
const topicsWrap: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, padding: "0 16px" };
const sessionIcon: CSSProperties = { fontSize: 16, flexShrink: 0 };

// ─── Component ───────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate();

  const walletAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) ?? "";
  const [nickname, setNickname] = useState(() => localStorage.getItem(STORAGE_KEYS.NICKNAME) ?? "");
  const { following } = useFollow();
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
    // Sync nickname from chain if not in localStorage
    if (!nickname) {
      fetchUserNickname(walletAddress).then((n) => {
        if (n) {
          setNickname(n);
          localStorage.setItem(STORAGE_KEYS.NICKNAME, n);
        }
      }).catch(() => {});
    }
  }, [walletAddress, nickname]);

  const isEmbeddedWallet = hasEmbeddedWallet() && getEmbeddedAddress()?.toLowerCase() === walletAddress.toLowerCase();

  const [ensAddress, setEnsAddress] = useState<string | null>(null);
  const ensLookupAddr = ensAddress ?? (walletAddress || null);
  const { profile: ensProfile, loading: ensLoading } = useEnsProfile(ensLookupAddr);
  const socialLinks = ensProfile ? getSocialLinks(ensProfile) : [];

  const handleReconnectEns = async () => {
    try {
      if (!window.ethereum) { alert("No external wallet detected. Install MetaMask to connect your ENS."); return; }
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setEnsAddress(await signer.getAddress());
    } catch { /* User cancelled */ }
  };

  const votedTopicIds = useMemo<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES) ?? "[]"); }
    catch { return []; }
  }, []);
  const { matches: realMatches, loading: matchesLoading } = useVibeMatches(savedTopics, publishedSessionIds, walletAddress, votedTopicIds);
  const matchCount = realMatches.length > 0 ? realMatches.length : (walletAddress ? 0 : null);

  return (
    <div style={page}>
      <div style={heroBackground} />

      <div style={scrollContent}>
      <div style={heroSection}>
        <div style={heroHeader}>
          <div>
            <div style={{ fontSize: nickname ? 42 : 60, fontWeight: 900, lineHeight: 1 }}>
              {nickname || (walletAddress ? <>{walletAddress.slice(0, 6)}...<br/>{walletAddress.slice(-4)}</> : "Profile")}
            </div>
            {nickname && walletAddress && (
              <div style={heroSubAddr}>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</div>
            )}
          </div>
          <button style={{ ...settingsBtn, background: "rgba(0,0,0,0.1)", flexShrink: 0, marginTop: 4 }} onClick={() => navigate("/settings")}>
            <Ic.Settings s={18} c="#0a0a0a" />
          </button>
        </div>
        <div style={heroStatsRow}>
          <div style={heroStatCell}><div style={heroStatValue}>{topicNames.length || "-"}</div><div style={heroStatLabel}>Interests</div></div>
          <div style={heroStatCell}><div style={heroStatValue}>{(publishedSessionIds.length + savedCart.size) || "-"}</div><div style={heroStatLabel}>Sessions</div></div>
          <div style={heroStatCell}><div style={heroStatValue}>{voteCount || "-"}</div><div style={heroStatLabel}>Votes</div></div>
          <div style={heroStatCell}><div style={heroStatValue}>{matchesLoading ? "..." : (matchCount ?? "-")}</div><div style={heroStatLabel}>Matches</div></div>
        </div>
      </div>

      <button style={inviteBtn} onClick={() => navigate("/invite")}>Invite Nearby Participants</button>

      {/* Social Profiles (from ENS) */}
      <div style={sectionTitle}>{ensProfile?.name ? `${ensProfile.name}` : "Social Profiles"}</div>
      {ensLoading && (
        <div style={ensInfoCard}><div style={{ fontSize: 13, color: C.textSecondary }}>Loading ENS profile...</div></div>
      )}
      {!ensLoading && socialLinks.length > 0 && socialLinks.map((link) => {
        const iconMap: Record<string, { bg: string; el: React.ReactNode; label: string }> = {
          github: { bg: "rgba(51,51,51,0.3)", el: <Ic.GitHub s={20} c={C.textPrimary} />, label: "GitHub" },
          twitter: { bg: "rgba(255,255,255,0.08)", el: <Ic.XTwitter s={18} c={C.textPrimary} />, label: "X / Twitter" },
          discord: { bg: "rgba(88,101,242,0.2)", el: <Ic.Discord s={20} c="#5865F2" />, label: "Discord" },
          website: { bg: "rgba(255,255,255,0.08)", el: <Ic.Globe s={20} c={C.textPrimary} />, label: "Website" },
        };
        const info = iconMap[link.icon] ?? iconMap.website;
        return (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={platformRow}>
              <div style={{ ...platformIcon, background: info.bg }}>{info.el}</div>
              <div style={platformInfo}>
                <div style={platformName}>{link.label}</div>
                <div style={platformDesc}>{info.label}</div>
              </div>
              <Ic.Right s={16} c={C.textTertiary} />
            </div>
          </a>
        );
      })}
      {!ensLoading && socialLinks.length === 0 && (
        <div style={ensInfoCard}>
          <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: isEmbeddedWallet ? 12 : 0 }}>
            {isEmbeddedWallet
              ? "Embedded wallet has no ENS. Connect an external wallet to load your socials."
              : walletAddress
                ? "No ENS profile found. Set up your ENS records to share your socials."
                : "Connect wallet to load your ENS profile"}
          </div>
          {isEmbeddedWallet && (
            <button onClick={handleReconnectEns} style={ensConnectBtn}>Connect with ENS wallet</button>
          )}
        </div>
      )}
      {ensProfile?.name && <div style={ensFooter}>Loaded from ENS: {ensProfile.name}</div>}

      {/* My Interests */}
      {topicNames.length > 0 && (
        <>
          <div style={sectionTitle}>My Interests</div>
          <div style={topicsWrap}>
            {topicNames.map((name) => {
              const ts = getTrackStyle(name);
              return <span key={name} style={trackBadge(ts.color)}>{ts.icon} {name}</span>;
            })}
          </div>
        </>
      )}

      {/* Following */}
      <div style={sectionTitle}>Following ({following.length})</div>
      {following.length > 0 ? (
        <div style={listColumn}>
          {following.map((f) => {
            const short = truncateLabel(f.label);
            const initials = getInitials(f.label);
            return (
              <div key={f.label} style={glassListItem} onClick={() => navigate("/vibes")}>
                <div style={avatarSmall(avatarColor(f.label))}>{initials}</div>
                <div style={fluidContent}><div style={monoText}>{short}</div></div>
                {f.published ? <Ic.Check s={14} c={C.success} /> : <span style={inCartBadge}>In cart</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={glassInfoCard}>
          <Ic.People s={24} c={C.textTertiary} />
          <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 8 }}>You're not following anyone yet.</div>
          <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4 }}>Visit other profiles and tap Follow to see them here.</div>
        </div>
      )}

      {/* My Sessions (published + in cart) */}
      {(() => {
        const allMySessionIds = new Set([...savedCart, ...publishedSessionIds]);
        if (allMySessionIds.size === 0) return null;
        return (
        <>
          <div style={sectionTitle}>My Sessions ({allMySessionIds.size})</div>
          <div style={listColumn}>
            {sessions.filter((s) => allMySessionIds.has(s.id)).map((s) => {
              const ts = getTrackStyle(s.track);
              const isPublished = publishedSessionIds.includes(s.id);
              return (
                <div key={s.id} onClick={() => navigate(`/session/${s.id}`)} style={glassListItem}>
                  <span style={sessionIcon}>{ts.icon}</span>
                  <div style={fluidContent}>
                    <div style={cardTitle}>{s.title}</div>
                    <div style={metaText}>{s.startTime} · {s.stage}</div>
                  </div>
                  {isPublished ? <Ic.Check s={14} c={C.success} /> : <span style={inCartBadge}>In cart</span>}
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
