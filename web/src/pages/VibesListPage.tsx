import { useMemo, useState, type CSSProperties } from "react";
import { STORAGE_KEYS } from "../config/constants";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle, avatarColor } from "../config/theme";
import { Ic } from "../components/ui/Icons";
import { StorageService } from "../services/StorageService";
import { useVibeMatches } from "../hooks/useVibeMatches";

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

const heroBox: CSSProperties = {
  margin: "16px 16px 8px", padding: "20px 20px 16px",
  background: "#1a1520",
  borderRadius: R.lg, border: `1px solid rgba(206,162,253,0.2)`,
  textAlign: "center" as const,
};

const userCard: CSSProperties = {
  ...glassSurface, margin: "0 16px 10px", padding: 16,
  cursor: "pointer",
};

const cardHeader: CSSProperties = {
  display: "flex", alignItems: "center", gap: 12, marginBottom: 10,
};

const avatar: CSSProperties = {
  width: 44, height: 44, borderRadius: 22,
  background: C.surfaceGray, // overridden per-user with avatarColor()
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 15, fontWeight: 700, color: "#0a0a0a", flexShrink: 0,
};

const nameStyle: CSSProperties = {
  fontSize: 15, fontWeight: 600, whiteSpace: "nowrap",
  overflow: "hidden", textOverflow: "ellipsis",
};

const pctBadge = (pct: number): CSSProperties => ({
  fontSize: 13, fontWeight: 700, marginLeft: "auto", flexShrink: 0,
  color: pct >= 70 ? C.success : pct >= 40 ? C.flat : C.textSecondary,
});

const matchBar: CSSProperties = {
  height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)",
  marginBottom: 10, overflow: "hidden",
};

const matchBarFill = (pct: number): CSSProperties => ({
  height: "100%", borderRadius: 2, width: `${pct}%`,
  background: pct >= 70
    ? `linear-gradient(90deg, ${C.success}, #6ee7b7)`
    : pct >= 40
    ? `linear-gradient(90deg, ${C.flat}, #ffd8c4)`
    : C.textTertiary,
  transition: "width 0.3s ease",
});

const tagPill: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "3px 10px", borderRadius: R.btn, fontSize: 11, fontWeight: 600,
  marginRight: 4, marginBottom: 4,
};

const sectionLabel: CSSProperties = {
  fontSize: 12, fontWeight: 600, color: C.textTertiary,
  textTransform: "uppercase" as const, letterSpacing: 1,
  padding: "16px 16px 8px",
};

// ─── Component ───────────────────────────────────────

export default function VibesListPage() {
  const navigate = useNavigate();

  const walletAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) ?? "";
  const savedTopics = useMemo(() => StorageService.loadTopics(), []);
  const publishedSessionIds = useMemo<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_SESSIONS) ?? "[]"); }
    catch { return []; }
  }, []);
  const votedTopicIds = useMemo<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLISHED_VOTES) ?? "[]"); }
    catch { return []; }
  }, []);
  const [refreshKey, setRefreshKey] = useState(0);
  const { matches: realMatches, loading } = useVibeMatches(
    savedTopics, publishedSessionIds, walletAddress, votedTopicIds, refreshKey
  );

  const totalPossible = savedTopics.size + publishedSessionIds.length + votedTopicIds.length;

  return (
    <div style={page}>
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          <Ic.Back c={C.textPrimary} />
        </button>
        <div style={title}>Vibes</div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          style={{
            padding: "8px 16px", borderRadius: R.btn, border: "none",
            background: C.surfaceGray, color: loading ? C.textTertiary : C.flat,
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
          }}
        >
          {loading ? "..." : "Refresh"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}>
        {/* Hero */}
        <div style={heroBox}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>
            <Ic.People s={28} c={C.primary} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            Find Your People
          </div>
          <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>
            Connect with attendees who share your interests and sessions.
            {totalPossible > 0
              ? ` You have ${savedTopics.size} interests and ${publishedSessionIds.length} sessions published.`
              : " Select interests and sessions to discover matches."}
          </div>
        </div>

        {/* Real on-chain matches */}
        {realMatches.length > 0 && (
          <>
            <div style={sectionLabel}>On-Chain Connections ({realMatches.length})</div>
            {realMatches.map((m, idx) => {
              const shortLabel = m.label.startsWith("0x")
                ? `${m.label.slice(0, 6)}...${m.label.slice(-4)}`
                : m.label;
              const pct = m.matchScore; // already 0-100
              return (
                <div key={m.subjectTermId} style={{ ...userCard, cursor: "pointer" }} onClick={() => navigate(`/vibe/${idx}`)}>
                  <div style={cardHeader}>
                    <div style={{ ...avatar, background: avatarColor(m.label) }}>
                      {m.label.slice(2, 4).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={nameStyle}>{shortLabel}</div>
                      <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
                        {m.sharedTopics.length} shared interest{m.sharedTopics.length > 1 ? "s" : ""}
                      </div>
                    </div>
                    <div style={pctBadge(pct)}>{pct}% match</div>
                  </div>
                  <div style={matchBar}>
                    <div style={matchBarFill(pct)} />
                  </div>
                  {m.sharedTopics.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", marginBottom: m.sharedSessions.length > 0 ? 6 : 0 }}>
                      {m.sharedTopics.map((t) => {
                        const ts = getTrackStyle(t);
                        return (
                          <span key={t} style={{ ...tagPill, background: `${ts.color}22`, color: ts.color }}>
                            {ts.icon} {t}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {m.sharedSessions.length > 0 && (
                    <div style={{ fontSize: 11, color: C.textTertiary }}>
                      + {m.sharedSessions.length} shared session{m.sharedSessions.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Loading indicator */}
        {loading && (
          <div style={{ textAlign: "center", padding: 24, color: C.textTertiary, fontSize: 13 }}>
            Searching for on-chain connections...
          </div>
        )}

        {/* No matches message */}
        {!loading && realMatches.length === 0 && walletAddress && totalPossible > 0 && (
          <div style={{ textAlign: "center", padding: "16px 24px", color: C.textTertiary, fontSize: 13 }}>
            No on-chain matches yet. Be the first to publish your profile!
          </div>
        )}

        {/* Empty state when no wallet or no data */}
        {!loading && realMatches.length === 0 && !walletAddress && (
          <div style={{ textAlign: "center", padding: "24px", color: C.textTertiary, fontSize: 13 }}>
            Connect a wallet to discover vibe matches.
          </div>
        )}
      </div>
    </div>
  );
}
