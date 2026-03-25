import { type CSSProperties } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { speakersBySlug } from "../data";
import { C, R, glassSurface, FONT } from "../config/theme";
import { Ic } from "../components/ui/Icons";
import { formatDateLong } from "../utils/date.utils";

// ─── Styles ──────────────────────────────────────────

const page: CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column",
  background: "transparent", color: C.textPrimary, fontFamily: FONT, overflow: "hidden",
};

const header: CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "12px 16px 0", flexShrink: 0,
};

const backBtn: CSSProperties = {
  width: 42, height: 42, borderRadius: 14, background: C.surfaceGray,
  border: "none", color: C.textPrimary, fontSize: 18, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const title: CSSProperties = { fontSize: 20, fontWeight: 700, flex: 1 };

const profileSection: CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: "24px 16px 16px", gap: 10,
};

const avatarStyle: CSSProperties = {
  width: 88, height: 88, borderRadius: 44, objectFit: "cover",
  border: `3px solid ${C.primary}`,
  boxShadow: `0 0 0 6px rgba(206,162,253,0.15)`,
};

const avatarFallback: CSSProperties = {
  width: 88, height: 88, borderRadius: 44,
  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 32, fontWeight: 700, color: "#0a0a0a",
};

const nameStyle: CSSProperties = { fontSize: 22, fontWeight: 700, textAlign: "center" };

const orgStyle: CSSProperties = { fontSize: 14, color: C.textSecondary };

const tagPill: CSSProperties = {
  padding: "4px 12px", borderRadius: R.btn, fontSize: 11, fontWeight: 600,
  background: C.surfaceGray, border: `1px solid ${C.border}`, color: C.textSecondary,
};

const socialBtn: CSSProperties = {
  padding: "6px 14px", borderRadius: R.btn, fontSize: 12, fontWeight: 500,
  background: C.surfaceGray, border: `1px solid ${C.border}`,
  color: C.primary, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
};

const sectionTitle: CSSProperties = {
  fontSize: 16, fontWeight: 700, padding: "20px 16px 10px",
  borderBottom: `1px solid ${C.border}`, margin: "0 16px 12px",
};

const bioText: CSSProperties = {
  fontSize: 14, color: C.textSecondary, lineHeight: 1.7, padding: "0 16px 16px",
};

const talkCard: CSSProperties = {
  ...glassSurface, margin: "0 16px 8px", display: "flex", overflow: "hidden",
  background: "rgba(22,22,24,0.85)",
};

const talkAccent = (color: string): CSSProperties => ({
  width: 4, flexShrink: 0, background: color,
});

const talkTime: CSSProperties = {
  display: "flex", flexDirection: "column", minWidth: 90,
  fontSize: 12, color: C.textSecondary, padding: "12px",
};

const talkDateStyle: CSSProperties = {
  fontWeight: 600, color: C.flat, fontSize: 12, marginBottom: 2,
};

const talkBody: CSSProperties = {
  flex: 1, padding: "12px 12px 12px 0", minWidth: 0,
};

const talkTitle: CSSProperties = {
  fontSize: 14, fontWeight: 600, marginBottom: 6, lineHeight: 1.3,
};

const TYPE_COLORS: Record<string, string> = {
  Talk: "#f97316", Workshop: "#eab308", Panel: "#3b82f6", Demo: "#84cc16",
};

// ─── Component ───────────────────────────────────────

export function SpeakerPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const speaker = slug ? speakersBySlug.get(slug) : undefined;

  if (!speaker) {
    return (
      <div style={page}>
        <div style={header}>
          <button style={backBtn} onClick={() => navigate(-1)}>
            <Ic.Back c={C.textPrimary} />
          </button>
          <div style={title}>Speaker</div>
        </div>
        <div style={{ textAlign: "center", padding: 40, color: C.textTertiary }}>
          Speaker not found.
        </div>
      </div>
    );
  }

  const initials = speaker.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={page}>
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          <Ic.Back c={C.textPrimary} />
        </button>
        <div style={title}>Speaker</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}>
        {/* Profile */}
        <div style={profileSection}>
          {speaker.profilePictureUrl ? (
            <img src={speaker.profilePictureUrl} alt={speaker.name} style={avatarStyle} />
          ) : (
            <div style={avatarFallback}>{initials}</div>
          )}
          <div style={nameStyle}>{speaker.name}</div>
          {speaker.role && <div style={{ fontSize: 14, color: C.flat }}>{speaker.role}</div>}
          {speaker.organization && <div style={orgStyle}>{speaker.organization}</div>}

          {/* Tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {speaker.sector && <span style={tagPill}>{speaker.sector}</span>}
            {speaker.track && <span style={tagPill}>{speaker.track}</span>}
          </div>

          {/* Socials */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
            {speaker.twitter && (
              <a href={`https://x.com/${speaker.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={socialBtn}>
                @{speaker.twitter.replace("@", "")}
              </a>
            )}
            {speaker.github && (
              <a href={`https://github.com/${speaker.github}`} target="_blank" rel="noopener noreferrer" style={socialBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={C.primary}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </a>
            )}
            {speaker.linkedin && (
              <a href={speaker.linkedin} target="_blank" rel="noopener noreferrer" style={socialBtn}>
                LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* Bio */}
        {speaker.bio && (
          <>
            <div style={sectionTitle}>Bio</div>
            <p style={bioText}>{speaker.bio}</p>
          </>
        )}

        {/* Talks */}
        {speaker.talks.length > 0 && (
          <>
            <div style={sectionTitle}>Talks ({speaker.talks.length})</div>
            {speaker.talks.map((talk) => {
              const accentColor = TYPE_COLORS[talk.type] ?? C.primary;
              return (
                <div
                  key={talk.sessionId}
                  style={talkCard}
                  onClick={() => navigate(`/session/${talk.sessionId}`)}
                >
                  <div style={talkAccent(accentColor)} />
                  <div style={talkTime}>
                    <span style={talkDateStyle}>{formatDateLong(talk.date)}</span>
                    <span>{talk.startTime} – {talk.endTime}</span>
                  </div>
                  <div style={talkBody}>
                    <div style={talkTitle}>{talk.title}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <span style={{ ...tagPill, color: accentColor, borderColor: `${accentColor}44` }}>{talk.type}</span>
                      <span style={tagPill}>{talk.track}</span>
                      <span style={tagPill}>{talk.stage}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
