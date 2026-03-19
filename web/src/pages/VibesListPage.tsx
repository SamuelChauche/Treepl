import { useMemo, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { C, R, glassSurface, FONT, getTrackStyle } from "../config/theme";
import { VIBES } from "../data/social";
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
  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
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

const onlineDot = (on: boolean): CSSProperties => ({
  width: 8, height: 8, borderRadius: 4,
  background: on ? C.success : C.textTertiary,
  position: "absolute" as const, bottom: 0, right: 0,
  border: `2px solid ${C.background}`,
});

const sectionLabel: CSSProperties = {
  fontSize: 12, fontWeight: 600, color: C.textTertiary,
  textTransform: "uppercase" as const, letterSpacing: 1,
  padding: "16px 16px 8px",
};

// ─── Component ───────────────────────────────────────

export default function VibesListPage() {
  const navigate = useNavigate();

  const walletAddress = localStorage.getItem("ethcc-wallet-address") ?? "";
  const savedTopics = useMemo(() => StorageService.loadTopics(), []);
  const savedCart = useMemo(() => StorageService.loadCart(), []);
  const cartSessionIds = useMemo(() => [...savedCart].map(String), [savedCart]);

  const votedTopicIds = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("ethcc-published-votes") ?? "[]") as string[]; }
    catch { return []; }
  }, []);
  const { matches: realMatches, loading } = useVibeMatches(
    savedTopics, cartSessionIds, walletAddress, votedTopicIds
  );

  const totalPossible = savedTopics.size + cartSessionIds.length + votedTopicIds.length;

  return (
    <div style={page}>
      <div style={header}>
        <button style={backBtn} onClick={() => navigate(-1)}>
          <Ic.Back c={C.textPrimary} />
        </button>
        <div style={title}>Vibes</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 24 }}>
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
              ? ` You have ${savedTopics.size} interests and ${cartSessionIds.length} sessions selected.`
              : " Select interests and sessions to discover matches."}
          </div>
        </div>

        {/* Real on-chain matches */}
        {realMatches.length > 0 && (
          <>
            <div style={sectionLabel}>On-Chain Connections ({realMatches.length})</div>
            {realMatches.map((m) => {
              const shortLabel = m.label.startsWith("0x")
                ? `${m.label.slice(0, 6)}...${m.label.slice(-4)}`
                : m.label;
              const pct = totalPossible > 0
                ? Math.round((m.matchScore / totalPossible) * 100)
                : 0;
              return (
                <div key={m.subjectTermId} style={userCard}>
                  <div style={cardHeader}>
                    <div style={avatar}>
                      {m.label.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={nameStyle}>{shortLabel}</div>
                      <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
                        {m.matchScore} shared interest{m.matchScore > 1 ? "s" : ""}
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

        {/* Nearby vibes */}
        <div style={sectionLabel}>Nearby Attendees ({VIBES.length})</div>
        {VIBES.map((v, idx) => (
          <div
            key={v.name}
            style={userCard}
            onClick={() => navigate(`/vibe/${idx}`)}
          >
            <div style={cardHeader}>
              <div style={{ position: "relative" as const }}>
                <div style={avatar}>
                  {v.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={onlineDot(v.online)} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={nameStyle}>{v.name}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={C.textTertiary}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={C.textTertiary}><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                </div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
                  {v.dist} away {v.online && <span style={{ color: C.success }}>  online</span>}
                </div>
              </div>
              <div style={pctBadge(v.pct)}>{v.pct}% match</div>
            </div>
            <div style={matchBar}>
              <div style={matchBarFill(v.pct)} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {v.shared.map((t) => {
                const ts = getTrackStyle(t);
                return (
                  <span key={t} style={{ ...tagPill, background: `${ts.color}22`, color: ts.color }}>
                    {ts.icon} {t}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
