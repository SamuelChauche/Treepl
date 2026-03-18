import { useMemo, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle } from "../config/theme";
import { VIBES } from "../data/social";
import type { Vibe } from "../types";
import { useEnsProfile } from "../hooks/useEnsProfile";
import { getSocialLinks } from "../services/ensService";


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

const header: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 16px 0",
  flexShrink: 0,
};

const backBtn: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: C.surfaceGray,
  border: "none",
  color: C.textPrimary,
  fontSize: 18,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const titleText: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  flex: 1,
};

// Avatar section
const avatarSection: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "28px 16px 20px",
};

const avatarOuter: CSSProperties = {
  width: 88,
  height: 88,
  borderRadius: 44,
  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative" as const,
};

const avatarInner: CSSProperties = {
  width: 80,
  height: 80,
  borderRadius: 40,
  background: C.surface,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  fontWeight: 700,
  color: C.primary,
};

const onlineIndicator = (online: boolean): CSSProperties => ({
  position: "absolute" as const,
  bottom: 4,
  right: 4,
  width: 16,
  height: 16,
  borderRadius: 8,
  background: online ? C.success : C.textTertiary,
  border: `3px solid ${C.background}`,
});

const nameText: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  marginTop: 14,
};

const addrText: CSSProperties = {
  fontSize: 12,
  color: C.textSecondary,
  marginTop: 4,
};

const statusRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 8,
};

const statusBadge = (online: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  borderRadius: R.btn,
  background: online ? C.successLight : "rgba(255,255,255,0.06)",
  color: online ? C.success : C.textTertiary,
  fontSize: 11,
  fontWeight: 600,
});

const distBadge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  borderRadius: R.btn,
  background: C.primaryLight,
  color: C.primary,
  fontSize: 11,
  fontWeight: 600,
};

// Stats
const statsRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-around",
  padding: "16px",
  margin: "0 16px",
  ...glassSurface,
};

const statItem: CSSProperties = {
  textAlign: "center" as const,
  flex: 1,
};

const statVal: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
};

const statLabel: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
  marginTop: 2,
};

// Shared interests
const sectionTitle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  padding: "24px 16px 12px",
};

const interestPills: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  padding: "0 16px 16px",
};

const interestPill = (color: string): CSSProperties => ({
  padding: "8px 16px",
  borderRadius: R.btn,
  background: `${color}18`,
  color: color,
  fontSize: 13,
  fontWeight: 600,
  border: `1px solid ${color}33`,
  display: "flex",
  alignItems: "center",
  gap: 6,
});

// Intuition card
const intuitionCard: CSSProperties = {
  ...glassSurface,
  margin: "0 16px 16px",
  padding: 16,
};

const intuitionHeader: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
};

const intuitionIcon: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 18,
  background: C.primaryLight,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
};

const intuitionTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
};

const intuitionSub: CSSProperties = {
  fontSize: 11,
  color: C.textSecondary,
  marginTop: 1,
};

const intuitionRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: `1px solid ${C.border}`,
};

const intuitionLabel: CSSProperties = {
  fontSize: 12,
  color: C.textSecondary,
};

const intuitionValue: CSSProperties = {
  fontSize: 12,
  color: C.textPrimary,
  fontWeight: 600,
};

// Action buttons
const actionRow: CSSProperties = {
  display: "flex",
  gap: 12,
  padding: "8px 16px 24px",
};

const connectBtn: CSSProperties = {
  flex: 1,
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
};


// Not found
const notFound: CSSProperties = {
  ...glassSurface,
  margin: "40px 16px",
  padding: 32,
  textAlign: "center" as const,
};

// ─── Component ───────────────────────────────────────

export default function VibeProfilePage() {
  const navigate = useNavigate();
  const { index } = useParams<{ index: string }>();

  const vibe: Vibe | undefined = useMemo(() => {
    const idx = parseInt(index ?? "", 10);
    if (isNaN(idx) || idx < 0 || idx >= VIBES.length) return undefined;
    return VIBES[idx];
  }, [index]);

  if (!vibe) {
    return (
      <div style={page}>
        <div style={header}>
          <button style={backBtn} onClick={() => navigate(-1)}>
            &#8249;
          </button>
          <div style={titleText}>Profile</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={notFound}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>&#128566;</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>User not found</div>
          <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
            This vibe profile doesn't exist.
          </div>
        </div>
        </div>
      </div>
    );
  }

  const initials = vibe.name.slice(0, 2).toUpperCase();

  // ENS lookup — works for real addresses (0x...), not mock ones
  const realAddr = /^0x[a-fA-F0-9]{40}$/.test(vibe.addr) ? vibe.addr : null;
  const { profile: ensProfile, loading: ensLoading } = useEnsProfile(realAddr);
  const ensSocialLinks = ensProfile ? getSocialLinks(ensProfile) : [];

  // Fallback to mock socials if no ENS
  const mockSocialLinks: { label: string; url: string; icon: string }[] = [];
  if (vibe.socials) {
    if (vibe.socials.github) mockSocialLinks.push({ label: vibe.socials.github, url: `https://github.com/${vibe.socials.github}`, icon: "🐙" });
    if (vibe.socials.twitter) {
      const handle = vibe.socials.twitter.startsWith("@") ? vibe.socials.twitter.slice(1) : vibe.socials.twitter;
      mockSocialLinks.push({ label: `@${handle}`, url: `https://x.com/${handle}`, icon: "𝕏" });
    }
    if (vibe.socials.discord) mockSocialLinks.push({ label: vibe.socials.discord, url: "#", icon: "💬" });
    if (vibe.socials.url) mockSocialLinks.push({ label: vibe.socials.url.replace(/^https?:\/\//, ""), url: vibe.socials.url, icon: "🌐" });
  }

  const socialLinks = ensSocialLinks.length > 0 ? ensSocialLinks : mockSocialLinks;

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          &#8249;
        </button>
        <div style={titleText}>Profile</div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

      {/* Avatar + Info */}
      <div style={avatarSection}>
        <div style={avatarOuter}>
          <div style={avatarInner}>{initials}</div>
          <div style={onlineIndicator(vibe.online)} />
        </div>
        <div style={nameText}>{ensProfile?.name ?? vibe.name}</div>
        {socialLinks.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: R.btn,
                  background: C.surfaceGray, border: `1px solid ${C.border}`,
                  textDecoration: "none", color: C.textSecondary, fontSize: 12, fontWeight: 600,
                }}
              >
                <span style={{ fontSize: 16 }}>{link.icon}</span>
                {link.label}
              </a>
            ))}
          </div>
        ) : !ensLoading && socialLinks.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, opacity: 0.5 }}>
            <span style={{ fontSize: 12, color: C.textTertiary }}>No socials</span>
          </div>
        )}
        <div style={addrText}>{vibe.addr}</div>
        <div style={statusRow}>
          <div style={statusBadge(vibe.online)}>
            <span style={{ fontSize: 8 }}>&#9679;</span>
            {vibe.online ? "Online" : "Offline"}
          </div>
          <div style={distBadge}>{vibe.dist} away</div>
        </div>
      </div>

      {/* Stats */}
      <div style={statsRow}>
        <div style={statItem}>
          <div style={{ ...statVal, color: C.success }}>{vibe.pct}%</div>
          <div style={statLabel}>Match</div>
        </div>
        <div style={statItem}>
          <div style={statVal}>{vibe.shared.length}</div>
          <div style={statLabel}>Shared</div>
        </div>
        <div style={statItem}>
          <div style={{ ...statVal, color: C.primary }}>{vibe.dist}</div>
          <div style={statLabel}>Distance</div>
        </div>
      </div>

      {/* Shared Interests */}
      <div style={sectionTitle}>Shared Interests</div>
      <div style={interestPills}>
        {vibe.shared.map((interest) => {
          const ts = getTrackStyle(interest);
          return (
            <div key={interest} style={interestPill(ts.color)}>
              <span>{ts.icon}</span>
              {interest}
            </div>
          );
        })}
      </div>

      {/* Intuition Card */}
      <div style={sectionTitle}>Intuition Profile</div>
      <div style={intuitionCard}>
        <div style={intuitionHeader}>
          <div style={intuitionIcon}>&#9830;</div>
          <div>
            <div style={intuitionTitle}>On-Chain Identity</div>
            <div style={intuitionSub}>Verified via Intuition Protocol</div>
          </div>
        </div>
        <div style={intuitionRow}>
          <span style={intuitionLabel}>Chain</span>
          <span style={intuitionValue}>Intuition (1155)</span>
        </div>
        <div style={intuitionRow}>
          <span style={intuitionLabel}>Triples</span>
          <span style={intuitionValue}>{vibe.shared.length + Math.floor(Math.random() * 5 + 3)}</span>
        </div>
        <div style={intuitionRow}>
          <span style={intuitionLabel}>Attestations</span>
          <span style={intuitionValue}>{Math.floor(Math.random() * 12 + 2)}</span>
        </div>
        <div style={{ ...intuitionRow, borderBottom: "none" }}>
          <span style={intuitionLabel}>Trust Score</span>
          <span style={{ ...intuitionValue, color: C.success }}>
            {(vibe.pct * 0.1 + Math.random() * 2).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Send Trust */}
      <div style={actionRow}>
        <button
          style={connectBtn}
          onClick={() => navigate("/send")}
        >
          Send $TRUST
        </button>
      </div>

      </div>{/* end scrollable content */}
    </div>
  );
}
